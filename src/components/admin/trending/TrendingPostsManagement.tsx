
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart2, Settings, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Post, mapPostFromSupabase } from "../communities/types";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const TrendingPostsManagement = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    minLikes: 10,
    minComments: 5,
    timeframeHours: 24
  });
  const [showSettings, setShowSettings] = useState(false);
  
  useEffect(() => {
    loadPosts();
    loadSettings();
  }, []);
  
  const loadPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('likes_count', { ascending: false })
        .limit(20);
        
      if (error) {
        throw error;
      }
      
      setPosts(data ? data.map(mapPostFromSupabase) : []);
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
        
      if (error) {
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
      const { error } = await supabase
        .from('trending_settings')
        .update({
          min_likes: settings.minLikes,
          min_comments: settings.minComments,
          timeframe_hours: settings.timeframeHours
        })
        .eq('id', '1');
        
      if (error) {
        throw error;
      }
      
      toast.success("Configurações atualizadas com sucesso", { position: "bottom-right" });
      setShowSettings(false);
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
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowSettings(!showSettings)}
          className="gap-1"
        >
          <Settings className="h-4 w-4" />
          <span>Configurações</span>
        </Button>
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
        ) : null}
        
        {loading ? (
          <div className="flex justify-center p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff4400]"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">
            <p>Nenhum post disponível</p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <div 
                key={post.id}
                className="flex justify-between items-center p-3 rounded-lg border border-[#ff920e]/20"
              >
                <div className="flex-1">
                  <h3 className="font-medium line-clamp-1">{post.title}</h3>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                    <span>{post.likesCount} curtidas</span>
                    <span>{post.commentsCount} comentários</span>
                    <span>{post.viewsCount} visualizações</span>
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
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-700 hover:bg-red-100"
                    onClick={() => removePost(post.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TrendingPostsManagement;
