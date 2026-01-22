import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchPosts, forceDeletePost, PostData } from "@/services/postService";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const PostCleanup = () => {
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const result = await fetchPosts({ limit: 100 });
      setPosts(result.posts);
    } catch (error) {
      console.error("Error loading posts:", error);
      toast.error("Erro ao carregar posts");
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter(post => 
    post.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.author?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Função para excluir um post diretamente no banco de dados
  const handleDirectDelete = async (postId: string) => {
    try {
      setDeletingPostId(postId);
      console.log(`Iniciando exclusão direta do post ${postId}`);
      
      // Lista de tabelas relacionadas
      const relatedTables = [
        'post_likes',
        'post_comments',
        'post_media',
        'post_polls',
        'poll_votes',
        'post_views',
        'post_shares',
        'post_saves',
        'post_reports'
      ];
      
      // Excluir registros relacionados
      for (const tableName of relatedTables) {
        try {
          // @ts-ignore - Ignorando erros de tipagem, pois sabemos que as tabelas existem
          const { error } = await supabase
            .from(tableName)
            .delete()
            .eq('post_id', postId);
            
          if (error) {
            console.warn(`Erro ao excluir registros de ${tableName}:`, error);
          } else {
            console.log(`Registros de ${tableName} para o post ${postId} removidos com sucesso`);
          }
        } catch (err) {
          console.warn(`Exceção ao excluir registros de ${tableName}:`, err);
        }
      }
      
      // Excluir o post
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);
        
      if (error) {
        console.error(`Erro ao excluir post ${postId}:`, error);
        toast.error("Erro ao excluir publicação");
        return false;
      }
      
      console.log(`Post ${postId} excluído com sucesso`);
      toast.success("Publicação excluída com sucesso");
      
      // Atualizar a lista de posts
      setPosts(currentPosts => currentPosts.filter(post => post.id !== postId));
      
      return true;
    } catch (error) {
      console.error(`Erro ao excluir post ${postId}:`, error);
      toast.error("Erro ao excluir publicação");
      return false;
    } finally {
      setDeletingPostId(null);
    }
  };

  const handleForceDelete = async (postId: string) => {
    try {
      setDeletingPostId(postId);
      console.log(`Tentando forçar exclusão do post ${postId}`);
      
      // Usar nossa função de exclusão direta em vez da função forceDeletePost
      const success = await handleDirectDelete(postId);
      
      if (success) {
        console.log(`Post ${postId} excluído com sucesso`);
        toast.success("Post removido com sucesso");
        // Atualizar a lista de posts
        setPosts(currentPosts => currentPosts.filter(post => post.id !== postId));
      } else {
        console.error(`Falha ao excluir post ${postId}`);
        toast.error("Erro ao remover post");
      }
    } catch (error) {
      console.error("Erro ao forçar exclusão:", error);
      toast.error("Erro ao remover post");
    } finally {
      setDeletingPostId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Limpeza de Posts</CardTitle>
        <CardDescription>Gerencie e remova posts problemáticos</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Input
            placeholder="Pesquisar posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        
        <div className="space-y-4">
          {loading ? (
            <p>Carregando posts...</p>
          ) : filteredPosts.length > 0 ? (
            filteredPosts.map((post) => (
              <div key={post.id} className="border p-4 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{post.author?.name}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(post.createdAt).toLocaleString()}
                    </p>
                    <p className="mt-2">{post.content}</p>
                  </div>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleForceDelete(post.id)}
                    disabled={deletingPostId === post.id}
                  >
                    {deletingPostId === post.id ? "Removendo..." : "Forçar remoção"}
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p>Nenhum post encontrado.</p>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={loadPosts} disabled={loading}>
          Atualizar lista
        </Button>
      </CardFooter>
    </Card>
  );
};
