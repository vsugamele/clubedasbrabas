import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/auth";
import { isAdminByEmail } from "@/utils/adminUtils";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Trash2 } from "lucide-react";

interface Post {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  author_name?: string;
}

const DirectPostRemoval = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const { user } = useAuth();
  
  // Verificar se o usuário é administrador
  const isAdmin = isAdminByEmail(user?.email);

  useEffect(() => {
    if (isAdmin) {
      loadPosts();
    }
  }, [isAdmin]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      
      // Buscar posts diretamente da tabela posts
      const { data, error } = await supabase
        .from("posts")
        .select("id, content, created_at, user_id")
        .order("created_at", { ascending: false })
        .limit(100);
      
      if (error) {
        throw error;
      }
      
      // Buscar informações dos autores
      const postsWithAuthors = await Promise.all(
        (data || []).map(async (post) => {
          try {
            const { data: userData } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", post.user_id)
              .single();
            
            return {
              ...post,
              author_name: userData?.full_name || "Usuário desconhecido"
            };
          } catch {
            return {
              ...post,
              author_name: "Usuário desconhecido"
            };
          }
        })
      );
      
      setPosts(postsWithAuthors);
    } catch (error) {
      console.error("Erro ao buscar posts:", error);
      toast.error("Não foi possível carregar os posts");
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = searchTerm 
    ? posts.filter(post => 
        post.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.author_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : posts;

  // Função para excluir um post diretamente do banco de dados
  const handleDirectDelete = async (postId: string) => {
    if (!isAdmin) {
      toast.error("Apenas administradores podem excluir posts");
      return false;
    }
    
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

  if (!isAdmin) {
    return (
      <div className="container py-10">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Acesso negado</AlertTitle>
          <AlertDescription>
            Apenas administradores podem acessar esta página.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Remoção Direta de Posts</h1>
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Atenção</AlertTitle>
        <AlertDescription>
          Esta ferramenta remove posts diretamente do banco de dados, ignorando todas as verificações de permissão.
          Use com extremo cuidado, pois a ação não pode ser desfeita.
        </AlertDescription>
      </Alert>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Pesquisar Posts</CardTitle>
          <CardDescription>Encontre posts por conteúdo, ID ou autor</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Digite para pesquisar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
        <CardFooter>
          <Button onClick={loadPosts} disabled={loading}>
            {loading ? "Carregando..." : "Atualizar lista"}
          </Button>
        </CardFooter>
      </Card>
      
      <Separator className="my-6" />
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Resultados ({filteredPosts.length})</h2>
        
        {loading ? (
          <p className="text-muted-foreground">Carregando posts...</p>
        ) : filteredPosts.length === 0 ? (
          <p className="text-muted-foreground">Nenhum post encontrado.</p>
        ) : (
          filteredPosts.map((post) => (
            <Card key={post.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">{post.author_name}</CardTitle>
                    <CardDescription>
                      ID: {post.id} • {new Date(post.created_at).toLocaleString()}
                    </CardDescription>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDirectDelete(post.id)}
                    disabled={deletingPostId === post.id}
                  >
                    {deletingPostId === post.id ? (
                      "Excluindo..."
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir Diretamente
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{post.content}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default DirectPostRemoval;
