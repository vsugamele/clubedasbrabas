import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { forceDeletePost } from "@/services/postService";
import { toast } from "sonner";

interface TestPost {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
}

export const TestPostCleanup = () => {
  const [posts, setPosts] = useState<TestPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchTestPosts();
  }, [refreshKey]);

  const fetchTestPosts = async () => {
    try {
      setLoading(true);
      
      // Buscar posts que contenham a palavra "teste" ou "test" no conteúdo
      const { data, error } = await supabase
        .from("posts")
        .select("id, content, created_at, user_id")
        .or('content.ilike.%teste%,content.ilike.%test%')
        .order("created_at", { ascending: false });
      
      if (error) {
        throw error;
      }
      
      console.log("Posts de teste encontrados:", data?.length || 0);
      setPosts(data || []);
    } catch (error) {
      console.error("Erro ao buscar posts de teste:", error);
      toast.error("Não foi possível carregar os posts de teste");
    } finally {
      setLoading(false);
    }
  };

  const handleForceDelete = async (postId: string) => {
    try {
      setDeleting(prev => ({ ...prev, [postId]: true }));
      
      const success = await forceDeletePost(postId);
      
      if (success) {
        setPosts(posts.filter(post => post.id !== postId));
        toast.success("Post de teste removido com sucesso");
      } else {
        toast.error("Não foi possível remover o post de teste");
      }
    } catch (error) {
      console.error("Erro ao forçar exclusão:", error);
      toast.error("Erro ao tentar remover o post de teste");
    } finally {
      setDeleting(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleDeleteAll = async () => {
    if (!posts.length) return;
    
    if (!confirm(`Tem certeza que deseja excluir todos os ${posts.length} posts de teste?`)) {
      return;
    }
    
    let successCount = 0;
    let failCount = 0;
    
    toast.info(`Iniciando exclusão de ${posts.length} posts de teste...`);
    
    for (const post of posts) {
      try {
        setDeleting(prev => ({ ...prev, [post.id]: true }));
        const success = await forceDeletePost(post.id);
        
        if (success) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        console.error(`Erro ao excluir post ${post.id}:`, error);
        failCount++;
      } finally {
        setDeleting(prev => ({ ...prev, [post.id]: false }));
      }
    }
    
    if (successCount > 0) {
      toast.success(`${successCount} posts de teste removidos com sucesso`);
    }
    
    if (failCount > 0) {
      toast.error(`Falha ao remover ${failCount} posts de teste`);
    }
    
    // Atualizar a lista
    setRefreshKey(prev => prev + 1);
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <Card className="border-red-200">
      <CardHeader className="bg-red-50">
        <CardTitle className="flex items-center gap-2 text-lg text-red-700">
          <AlertTriangle className="h-5 w-5" />
          <span>Limpeza de Posts de Teste</span>
        </CardTitle>
        <CardDescription className="text-red-600">
          Esta ferramenta remove especificamente posts que contenham "teste" ou "test" no conteúdo.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-4">
        <div className="flex justify-between mb-4">
          <Button 
            onClick={handleRefresh}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
          
          <Button 
            onClick={handleDeleteAll}
            variant="destructive"
            disabled={loading || posts.length === 0}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Excluir Todos ({posts.length})
          </Button>
        </div>
        
        {loading ? (
          <div className="text-center p-8 text-muted-foreground">
            <p>Carregando posts de teste...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">
            <p>Nenhum post de teste encontrado</p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <div 
                key={post.id}
                className="flex justify-between items-center p-3 rounded-lg border border-gray-200"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">ID: {post.id}</span>
                  </div>
                  <p className="text-sm line-clamp-2 mt-1">
                    {post.content || "Sem conteúdo"}
                  </p>
                  <div className="text-xs text-muted-foreground mt-1">
                    Criado em: {new Date(post.created_at).toLocaleDateString()}
                  </div>
                </div>
                
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleForceDelete(post.id)}
                  disabled={deleting[post.id]}
                  className="ml-2"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  {deleting[post.id] ? "Removendo..." : "Remover"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TestPostCleanup;
