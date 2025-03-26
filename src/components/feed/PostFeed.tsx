
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { fetchPosts, PostData, FetchPostsOptions } from "@/services/postService";
import PostCard from "./PostCard";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import CreatePostForm from "./CreatePostForm";

export interface PostFeedProps {
  communityId?: string;
  isLoading?: boolean;
}

const PostFeed = ({ communityId, isLoading: initialLoading }: PostFeedProps) => {
  const [posts, setPosts] = useState<PostData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(initialLoading || true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    loadPosts();
  }, [communityId, retryCount]);

  const loadPosts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log(`Carregando posts ${communityId ? `para comunidade ${communityId}` : 'do feed principal'}`);
      
      // Pass proper FetchPostsOptions object
      const options: FetchPostsOptions = {
        limit: 20
      };
      
      if (communityId) {
        options.communityId = communityId;
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

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

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
      {posts.map((post) => (
        <PostCard key={post.id} post={post} onPostUpdated={loadPosts} />
      ))}
    </div>
  );
};

export default PostFeed;
