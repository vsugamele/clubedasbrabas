import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart2, Settings, Trash2, RefreshCcw, Search, Filter, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Post, mapPostFromSupabase } from "../communities/types";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ThumbsUp, MessageCircle } from "lucide-react";

export const TrendingPostsManagement = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("qualified");
  const [showOnlyQualified, setShowOnlyQualified] = useState(true);
  const [settings, setSettings] = useState({
    minLikes: 10,
    minComments: 5,
    timeframeHours: 24
  });
  const [showSettings, setShowSettings] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 10,
    totalPages: 1
  });
  
  useEffect(() => {
    loadPosts();
  }, []);
  
  useEffect(() => {
    filterPosts();
  }, [posts, searchTerm, activeTab, pagination.currentPage, showOnlyQualified]);
  
  const filterPosts = () => {
    let filtered = [...posts];
    
    // Aplicar filtro de posts qualificados se ativado
    if (showOnlyQualified && activeTab === "all") {
      filtered = filtered.filter(post => {
        const hasEnoughLikes = post.likesCount >= settings.minLikes;
        const hasEnoughComments = post.commentsCount >= settings.minComments;
        
        const postDate = new Date(post.createdAt);
        const timeframeHours = settings.timeframeHours || 24;
        const dateLimit = new Date();
        dateLimit.setHours(dateLimit.getHours() - timeframeHours);
        const isWithinTimeframe = postDate >= dateLimit;
        
        return hasEnoughLikes && hasEnoughComments && isWithinTimeframe;
      });
    }
    
    // Filtrar por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filtrar por tab
    if (activeTab === "trending") {
      filtered = filtered.filter(post => post.isTrending);
    } else if (activeTab === "popular") {
      filtered = filtered.filter(post => post.likesCount >= settings.minLikes);
    } else if (activeTab === "recent") {
      // Filtrar posts das últimas 24 horas
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      filtered = filtered.filter(post => new Date(post.createdAt) > oneDayAgo);
    } else if (activeTab === "recommended") {
      filtered = getRecommendedPosts();
    } else if (activeTab === "qualified") {
      // Posts que atendem aos critérios de configuração
      filtered = filtered.filter(post => {
        const hasEnoughLikes = post.likesCount >= settings.minLikes;
        const hasEnoughComments = post.commentsCount >= settings.minComments;
        
        const postDate = new Date(post.createdAt);
        const timeframeHours = settings.timeframeHours || 24;
        const dateLimit = new Date();
        dateLimit.setHours(dateLimit.getHours() - timeframeHours);
        const isWithinTimeframe = postDate >= dateLimit;
        
        return hasEnoughLikes && hasEnoughComments && isWithinTimeframe;
      });
    }
    
    // Atualizar total de páginas
    const totalPages = Math.max(1, Math.ceil(filtered.length / pagination.itemsPerPage));
    setPagination(prev => ({ ...prev, totalPages }));
    
    // Aplicar paginação
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    const paginatedPosts = filtered.slice(startIndex, startIndex + pagination.itemsPerPage);
    
    setFilteredPosts(paginatedPosts);
  };
  
  const loadPosts = async () => {
    setLoading(true);
    try {
      // Primeiro carregar as configurações
      await loadSettings();
      
      // Calcular a data limite baseada no timeframe configurado
      const timeframeHours = settings.timeframeHours || 24;
      const dateLimit = new Date();
      dateLimit.setHours(dateLimit.getHours() - timeframeHours);
      const dateLimitStr = dateLimit.toISOString();
      
      // Buscar posts marcados como trending
      const { data: trendingData, error: trendingError } = await supabase
        .from('posts')
        .select('*, likes:likes_count, comments:comments_count, views:views_count')
        .eq('is_trending', true)
        .order('created_at', { ascending: false });
        
      if (trendingError) throw trendingError;
      
      // Buscar posts populares que atendem aos critérios
      const { data: popularData, error: popularError } = await supabase
        .from('posts')
        .select('*, likes:likes_count, comments:comments_count, views:views_count')
        .gte('likes_count', settings.minLikes)
        .gte('comments_count', settings.minComments)
        .gte('created_at', dateLimitStr)
        .order('likes_count', { ascending: false })
        .limit(50);
        
      if (popularError) throw popularError;
      
      // Buscar posts recentes para completar a lista
      const { data: recentData, error: recentError } = await supabase
        .from('posts')
        .select('*, likes:likes_count, comments:comments_count, views:views_count')
        .order('created_at', { ascending: false })
        .limit(20);
        
      if (recentError) throw recentError;
      
      // Combinar os resultados, removendo duplicatas
      const allPostIds = new Set();
      const allPosts: any[] = [];
      
      // Primeiro adicionar os posts em trending
      if (trendingData) {
        trendingData.forEach(post => {
          if (!allPostIds.has(post.id)) {
            allPostIds.add(post.id);
            allPosts.push(post);
          }
        });
      }
      
      // Depois adicionar os posts populares
      if (popularData) {
        popularData.forEach(post => {
          if (!allPostIds.has(post.id)) {
            allPostIds.add(post.id);
            allPosts.push(post);
          }
        });
      }
      
      // Por fim, adicionar alguns posts recentes se necessário
      if (recentData && allPosts.length < 50) {
        recentData.forEach(post => {
          if (!allPostIds.has(post.id) && allPosts.length < 50) {
            allPostIds.add(post.id);
            allPosts.push(post);
          }
        });
      }
      
      // Mapear os posts para o formato correto
      const mappedPosts = allPosts.map(post => {
        // Garantir que os valores numéricos sejam números, não null ou undefined
        const likesCount = typeof post.likes_count === 'number' ? post.likes_count : 0;
        const commentsCount = typeof post.comments_count === 'number' ? post.comments_count : 0;
        const viewsCount = typeof post.views_count === 'number' ? post.views_count : 0;
        
        return {
          ...mapPostFromSupabase(post),
          likesCount,
          commentsCount,
          viewsCount
        };
      });
      
      setPosts(mappedPosts);
    } catch (error) {
      console.error("Erro ao carregar posts:", error);
      toast.error("Não foi possível carregar os posts", { position: "bottom-right" });
    } finally {
      setLoading(false);
    }
  };
  
  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('trending_settings')
        .select('*')
        .single();
        
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data) {
        setSettings({
          minLikes: data.min_likes,
          minComments: data.min_comments,
          timeframeHours: data.timeframe_hours
        });
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
    }
  };
  
  const updateSettings = async () => {
    try {
      // Verificar se a tabela existe
      const { error: checkError } = await supabase
        .from('trending_settings')
        .select('count')
        .limit(1);
      
      if (checkError && checkError.code === 'PGRST116') {
        // Tabela não existe, criar
        const { error: createError } = await supabase.rpc('create_trending_settings_if_not_exists' as any);
        if (createError) throw createError;
      }
      
      // Verificar se há algum registro
      const { data: existingData, error: countError } = await supabase
        .from('trending_settings')
        .select('id')
        .limit(1);
        
      if (countError && countError.code !== 'PGRST116') throw countError;
      
      let result;
      
      if (!existingData || existingData.length === 0) {
        // Inserir novo registro
        result = await supabase
          .from('trending_settings')
          .insert({
            min_likes: settings.minLikes,
            min_comments: settings.minComments,
            timeframe_hours: settings.timeframeHours
          });
      } else {
        // Atualizar registro existente
        result = await supabase
          .from('trending_settings')
          .update({
            min_likes: settings.minLikes,
            min_comments: settings.minComments,
            timeframe_hours: settings.timeframeHours
          })
          .eq('id', existingData[0].id);
      }
      
      if (result.error) throw result.error;
      
      toast.success("Configurações atualizadas com sucesso", { position: "bottom-right" });
      setShowSettings(false);
      
      // Recarregar posts para aplicar novos filtros
      loadPosts();
    } catch (error) {
      console.error("Erro ao atualizar configurações:", error);
      toast.error("Não foi possível atualizar as configurações", { position: "bottom-right" });
    }
  };
  
  const updatePostTrendingStatus = async (postId: string, isTrending: boolean) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ is_trending: isTrending })
        .eq('id', postId);
        
      if (error) {
        throw error;
      }
      
      // Atualizar a lista local
      setPosts(posts.map(p => 
        p.id === postId ? { ...p, isTrending } : p
      ));
      
      toast.success(`Post ${isTrending ? 'adicionado aos' : 'removido dos'} destaques`, { position: "bottom-right" });
    } catch (error) {
      console.error("Erro ao atualizar status de trending:", error);
      toast.error("Não foi possível atualizar o status do post", { position: "bottom-right" });
    }
  };
  
  const removePost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);
        
      if (error) {
        throw error;
      }
      
      // Remover da lista local
      setPosts(posts.filter(p => p.id !== postId));
      
      toast.success("Post removido com sucesso", { position: "bottom-right" });
    } catch (error) {
      console.error("Erro ao remover post:", error);
      toast.error("Não foi possível remover o post", { position: "bottom-right" });
    }
  };
  
  const getPostQualityScore = (post: Post) => {
    // Calcular uma pontuação de qualidade com base em curtidas, comentários e visualizações
    const likesWeight = 1.5;
    const commentsWeight = 2;
    const viewsWeight = 0.5;
    
    return (
      (post.likesCount * likesWeight) + 
      (post.commentsCount * commentsWeight) + 
      (post.viewsCount * viewsWeight)
    );
  };
  
  const getRecommendedPosts = () => {
    // Filtrar posts que não estão marcados como trending
    const nonTrendingPosts = posts.filter(post => !post.isTrending);
    
    // Filtrar apenas posts que atendem aos critérios de configuração
    const qualifiedPosts = nonTrendingPosts.filter(post => {
      // Verificar se o post atende aos critérios mínimos de likes e comentários
      const hasEnoughLikes = post.likesCount >= settings.minLikes;
      const hasEnoughComments = post.commentsCount >= settings.minComments;
      
      // Verificar se o post está dentro do período de tempo configurado
      const postDate = new Date(post.createdAt);
      const timeframeHours = settings.timeframeHours || 24;
      const dateLimit = new Date();
      dateLimit.setHours(dateLimit.getHours() - timeframeHours);
      const isWithinTimeframe = postDate >= dateLimit;
      
      return hasEnoughLikes && hasEnoughComments && isWithinTimeframe;
    });
    
    // Calcular pontuação para cada post
    const postsWithScore = qualifiedPosts.map(post => ({
      post,
      score: getPostQualityScore(post)
    }));
    
    // Ordenar por pontuação e pegar os 5 melhores
    return postsWithScore
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(item => item.post);
  };
  
  const updatePostCounters = async (postId: string) => {
    try {
      // Buscar os contadores atuais do post
      const { data: postData, error: fetchError } = await supabase
        .from('posts')
        .select('likes_count, comments_count, views_count')
        .eq('id', postId)
        .single();
        
      if (fetchError) {
        throw fetchError;
      }
      
      // Incrementar os contadores atuais (simulando atividade real)
      const likesCount = (postData.likes_count || 0) + 1;
      const commentsCount = (postData.comments_count || 0);
      const viewsCount = (postData.views_count || 0) + 1;
      
      // Atualizar o post no banco de dados
      const { error } = await supabase
        .from('posts')
        .update({
          likes_count: likesCount,
          comments_count: commentsCount,
          views_count: viewsCount
        })
        .eq('id', postId);
        
      if (error) {
        throw error;
      }
      
      // Atualizar a lista local
      setPosts(posts.map(p => 
        p.id === postId ? { ...p, likesCount, commentsCount, viewsCount } : p
      ));
      
      toast.success("Contadores atualizados com sucesso", { position: "bottom-right" });
    } catch (error) {
      console.error("Erro ao atualizar contadores:", error);
      toast.error("Não foi possível atualizar os contadores", { position: "bottom-right" });
    }
  };
  
  return (
    <Card className="border-[#ff920e]/20">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-[#ff4400]" />
            <span>Gerenciamento de Conteúdo em Alta</span>
          </CardTitle>
          <CardDescription>
            Gerencie os posts em destaque e configure critérios de tendência
          </CardDescription>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={loadPosts}
            className="gap-1"
          >
            <RefreshCcw className="h-4 w-4" />
            <span>Atualizar</span>
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="gap-1"
          >
            <Settings className="h-4 w-4" />
            <span>Configurações</span>
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {showSettings ? (
          <div className="p-4 rounded-lg bg-gray-50 border border-[#ff920e]/20 mb-4">
            <h3 className="font-medium mb-3">Configurações de Conteúdo em Alta</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="minLikes">Mínimo de Curtidas</Label>
                  <input
                    id="minLikes"
                    type="number"
                    value={settings.minLikes}
                    onChange={(e) => setSettings({ ...settings, minLikes: parseInt(e.target.value) })}
                    className="w-full mt-1 rounded-md border border-[#ff920e]/20 py-1.5 px-3"
                    min="1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="minComments">Mínimo de Comentários</Label>
                  <input
                    id="minComments"
                    type="number"
                    value={settings.minComments}
                    onChange={(e) => setSettings({ ...settings, minComments: parseInt(e.target.value) })}
                    className="w-full mt-1 rounded-md border border-[#ff920e]/20 py-1.5 px-3"
                    min="0"
                  />
                </div>
                
                <div>
                  <Label htmlFor="timeframe">Período de Tempo (horas)</Label>
                  <input
                    id="timeframe"
                    type="number"
                    value={settings.timeframeHours}
                    onChange={(e) => setSettings({ ...settings, timeframeHours: parseInt(e.target.value) })}
                    className="w-full mt-1 rounded-md border border-[#ff920e]/20 py-1.5 px-3"
                    min="1"
                    max="168"
                  />
                </div>
              </div>
              
              <div className="mt-2 text-sm text-muted-foreground">
                <p>Apenas posts com pelo menos <strong>{settings.minLikes} curtidas</strong> e <strong>{settings.minComments} comentários</strong> nas últimas <strong>{settings.timeframeHours} horas</strong> serão considerados para destaque automático.</p>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowSettings(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  className="bg-[#ff4400] hover:bg-[#ff4400]/90"
                  onClick={updateSettings}
                >
                  Salvar Configurações
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm">
            <div className="flex items-start gap-2">
              <div className="text-blue-500 mt-0.5">
                <Filter className="h-4 w-4" />
              </div>
              <div>
                <p className="text-blue-800 font-medium">Critérios atuais:</p>
                <p className="text-blue-700">
                  Mínimo de <strong>{settings.minLikes} curtidas</strong> e <strong>{settings.minComments} comentários</strong> nas últimas <strong>{settings.timeframeHours} horas</strong>.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="mb-4">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Switch
                id="show-qualified"
                checked={showOnlyQualified}
                onCheckedChange={setShowOnlyQualified}
              />
              <Label htmlFor="show-qualified" className="text-sm cursor-pointer">
                Mostrar apenas posts qualificados
              </Label>
            </div>
          </div>
          
          <Tabs defaultValue="qualified" className="w-full" onValueChange={(value) => {
            setActiveTab(value);
            setPagination(prev => ({ ...prev, currentPage: 1 }));
          }}>
            <TabsList className="mb-4">
              <TabsTrigger value="qualified">Qualificados</TabsTrigger>
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="trending">Em Alta</TabsTrigger>
              <TabsTrigger value="popular">Populares</TabsTrigger>
              <TabsTrigger value="recent">Recentes</TabsTrigger>
              <TabsTrigger value="recommended">Recomendados</TabsTrigger>
            </TabsList>
            
            <TabsContent value="qualified">
              {renderPostsList(filteredPosts)}
            </TabsContent>
            
            <TabsContent value="all">
              {renderPostsList(filteredPosts)}
            </TabsContent>
            
            <TabsContent value="trending">
              {renderPostsList(filteredPosts)}
            </TabsContent>
            
            <TabsContent value="popular">
              {renderPostsList(filteredPosts)}
            </TabsContent>
            
            <TabsContent value="recent">
              {renderPostsList(filteredPosts)}
            </TabsContent>
            
            <TabsContent value="recommended">
              {renderPostsList(filteredPosts)}
            </TabsContent>
          </Tabs>
          
          {/* Paginação */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, currentPage: Math.max(1, prev.currentPage - 1) }))}
                disabled={pagination.currentPage === 1}
              >
                Anterior
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  // Lógica para mostrar páginas ao redor da página atual
                  let pageToShow;
                  if (pagination.totalPages <= 5) {
                    pageToShow = i + 1;
                  } else if (pagination.currentPage <= 3) {
                    pageToShow = i + 1;
                  } else if (pagination.currentPage >= pagination.totalPages - 2) {
                    pageToShow = pagination.totalPages - 4 + i;
                  } else {
                    pageToShow = pagination.currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageToShow}
                      variant={pagination.currentPage === pageToShow ? "default" : "outline"}
                      size="sm"
                      className={pagination.currentPage === pageToShow ? "bg-[#ff4400]" : ""}
                      onClick={() => setPagination(prev => ({ ...prev, currentPage: pageToShow }))}
                    >
                      {pageToShow}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, currentPage: Math.min(prev.totalPages, prev.currentPage + 1) }))}
                disabled={pagination.currentPage === pagination.totalPages}
              >
                Próxima
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
  
  function renderPostsList(postsToRender: Post[]) {
    if (loading) {
      return (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between items-center p-3 rounded-lg border border-[#ff920e]/20">
              <div className="flex-1">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      );
    }
    
    if (postsToRender.length === 0) {
      return (
        <div className="text-center p-8 text-muted-foreground">
          <p>Nenhum post encontrado</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-3">
        {postsToRender.map((post) => (
          <div 
            key={post.id}
            className={`flex justify-between items-center p-3 rounded-lg border ${
              post.isTrending ? 'border-[#ff4400] bg-orange-50' : 'border-[#ff920e]/20'
            }`}
          >
            <div className="flex-1">
              <h3 className="font-medium line-clamp-1">{post.title}</h3>
              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <ThumbsUp className="h-3 w-3" />
                  {post.likesCount} curtidas
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" />
                  {post.commentsCount} comentários
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {post.viewsCount} visualizações
                </span>
                
                {post.isTrending && (
                  <Badge className="bg-[#ff4400]">Em Alta</Badge>
                )}
                
                {!post.isTrending && post.likesCount >= settings.minLikes && post.commentsCount >= settings.minComments && (
                  <Badge variant="outline" className="text-[#ff4400] border-[#ff4400]">
                    Recomendado
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Switch
                  id={`trending-${post.id}`}
                  checked={post.isTrending}
                  onCheckedChange={(checked) => updatePostTrendingStatus(post.id, checked)}
                />
                <Label htmlFor={`trending-${post.id}`} className="text-sm cursor-pointer">
                  Em Alta
                </Label>
              </div>
              
              <Button
                variant="outline"
                size="icon"
                title="Registrar visualização"
                className="text-blue-500 hover:text-blue-700 hover:bg-blue-100"
                onClick={() => updatePostCounters(post.id)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                title="Remover post"
                className="text-red-500 hover:text-red-700 hover:bg-red-100"
                onClick={() => removePost(post.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  }
};

export default TrendingPostsManagement;
