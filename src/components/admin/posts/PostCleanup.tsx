import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Search, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { forceDeletePost } from "@/services/postService";
import { toast } from "sonner";

interface Post {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  title?: string;
}

export const PostCleanup = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      
      // Buscar posts com conteúdo curto ou que podem estar causando problemas
      const { data, error } = await supabase
        .from("posts")
        .select("id, content, user_id, created_at, title")
        .order("created_at", { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setPosts(data || []);
    } catch (error) {
      console.error("Erro ao buscar posts:", error);
      toast.error("Não foi possível carregar os posts");
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
        toast.success("Post removido com sucesso");
      } else {
        toast.error("Não foi possível remover o post");
      }
    } catch (error) {
      console.error("Erro ao forçar exclusão:", error);
      toast.error("Erro ao tentar remover o post");
    } finally {
      setDeleting(prev => ({ ...prev, [postId]: false }));
    }
  };

  const filteredPosts = searchTerm 
    ? posts.filter(post => 
        post.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.title?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : posts;

  return (
    <Card className="border-red-200">
      <CardHeader className="bg-red-50">
        <CardTitle className="flex items-center gap-2 text-lg text-red-700">
          <AlertTriangle className="h-5 w-5" />
          <span>Limpeza de Posts</span>
        </CardTitle>
        <CardDescription className="text-red-600">
          Use esta ferramenta com cuidado para remover posts problemáticos que não podem ser excluídos normalmente.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-4">
        <div className="mb-4 relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar posts por ID ou conteúdo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        
        {loading ? (
          <div className="text-center p-8 text-muted-foreground">
            <p>Carregando posts...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">
            <p>Nenhum post encontrado</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPosts.map((post) => (
              <div 
                key={post.id}
                className="flex justify-between items-center p-3 rounded-lg border border-gray-200"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">ID: {post.id}</span>
                  </div>
                  <p className="text-sm line-clamp-2 mt-1">
                    {post.content || post.title || "Sem conteúdo"}
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
                  {deleting[post.id] ? "Removendo..." : "Forçar remoção"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
