import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { fetchPosts, PostData, FetchPostsOptions, deletePost, togglePinPost } from "@/services/postService";
import PostCard from "./PostCard";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import CreatePostForm from "./CreatePostForm";
import { useAuth } from "@/context/auth";

export interface PostFeedProps {
  communityId?: string;
  categoryId?: string;
  isLoading?: boolean;
}

const PostFeed = ({ communityId, categoryId, isLoading: initialLoading }: PostFeedProps) => {
  const [posts, setPosts] = useState<PostData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(initialLoading || true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { user } = useAuth();
  
  // Verificar se o usuário é administrador
  const userEmail = user?.email;
  const isAdmin = userEmail === "souzadecarvalho1986@gmail.com" || 
                  userEmail === "vsugamele@gmail.com" ||
                  userEmail === "admin@example.com";
  
  // Por enquanto, consideramos que administradores são moderadores de todas as comunidades
  const isModerator = isAdmin;

  useEffect(() => {
    loadPosts();
  }, [communityId, categoryId, retryCount]);

  const loadPosts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log(`Carregando posts ${communityId ? `para comunidade ${communityId}` : 'do feed principal'} ${categoryId ? `na categoria ${categoryId}` : ''}`);
      
      // Pass proper FetchPostsOptions object
      const options: FetchPostsOptions = {
        limit: 20
      };
      
      if (communityId) {
        options.communityId = communityId;
        console.log(`PostFeed - Filtrando por comunidade: ${communityId}`);
      }
      
      if (categoryId) {
        options.categoryId = categoryId;
        console.log(`PostFeed - Filtrando por categoria: ${categoryId}`);
      }
      
      console.log("Fetching posts with options:", options);
      const result = await fetchPosts(options);
      console.log("Fetch posts result:", result);
      
      if (result.posts && result.posts.length > 0) {
        console.log(`${result.posts.length} posts carregados com sucesso`);
        setPosts(result.posts);
      } else {
        console.log("Nenhum post encontrado");
        setError("Não há publicações para exibir");
        setPosts([]);
      }
    } catch (err) {
      console.error("Erro ao carregar posts:", err);
      setError("Não foi possível carregar as publicações");
      toast.error("Erro ao carregar publicações", {
        position: "bottom-right",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostCreated = (newPost: PostData | null) => {
    if (newPost) {
      setPosts(currentPosts => [newPost, ...currentPosts]);
    }
    loadPosts();
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const success = await deletePost(postId);
      if (success) {
        // Remover o post da lista de posts
        setPosts(currentPosts => currentPosts.filter(post => post.id !== postId));
        toast.success("Publicação excluída com sucesso", {
          position: "bottom-right",
        });
      } else {
        toast.error("Não foi possível excluir a publicação", {
          position: "bottom-right",
        });
      }
    } catch (error) {
      console.error("Erro ao excluir post:", error);
      toast.error("Erro ao excluir a publicação", {
        position: "bottom-right",
      });
    }
  };
  
  const handlePinPost = async (postId: string, isPinned: boolean) => {
    try {
      const success = await togglePinPost(postId, isPinned);
      if (success) {
        // Atualizar o estado do post na lista
        setPosts(currentPosts => 
          currentPosts.map(post => 
            post.id === postId 
              ? { ...post, isPinned } 
              : post
          )
        );
        
        toast.success(
          isPinned 
            ? "Publicação fixada com sucesso" 
            : "Publicação desafixada com sucesso", 
          { position: "bottom-right" }
        );
        
        // Recarregar posts para garantir a ordem correta
        loadPosts();
      } else {
        toast.error(
          isPinned 
            ? "Não foi possível fixar a publicação" 
            : "Não foi possível desafixar a publicação", 
          { position: "bottom-right" }
        );
      }
    } catch (error) {
      console.error(`Erro ao ${isPinned ? 'fixar' : 'desafixar'} post:`, error);
      toast.error(`Erro ao ${isPinned ? 'fixar' : 'desafixar'} a publicação`, {
        position: "bottom-right",
      });
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };
  
  // Ordenar posts para mostrar os fixados primeiro
  const sortedPosts = useMemo(() => {
    return [...posts].sort((a, b) => {
      // Primeiro critério: posts fixados vêm primeiro
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      
      // Segundo critério: posts mais recentes primeiro
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [posts]);

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <CreatePostForm communityId={communityId} onPostCreated={handlePostCreated} />
        <div className="flex flex-col items-center py-12 text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button 
            onClick={handleRetry}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  if (posts.length === 0 && !isLoading && !error) {
    return (
      <div className="space-y-4">
        <CreatePostForm communityId={communityId} onPostCreated={handlePostCreated} />
        <div className="text-center py-12 border rounded-lg bg-gray-50">
          <p className="text-gray-500 mb-4">Não há publicações para exibir</p>
          <Button 
            onClick={handleRetry}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar feed
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <CreatePostForm communityId={communityId} onPostCreated={handlePostCreated} />
      {sortedPosts.map((post) => (
        <PostCard 
          key={post.id} 
          post={post} 
          onPostUpdated={loadPosts} 
          onDeletePost={handleDeletePost}
          onPinPost={handlePinPost}
          isModerator={isModerator}
        />
      ))}
    </div>
  );
};

export default PostFeed;
