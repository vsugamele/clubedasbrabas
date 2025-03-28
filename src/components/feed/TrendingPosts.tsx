import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/badge";
import { BarChart2, ThumbsUp, MessageCircle, Sparkles, Eye, ArrowRight } from "lucide-react";
import { fetchTrendingPosts, TrendingPost } from "@/services/trendingService";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface TrendingPostsProps {
  initialPosts?: TrendingPost[];
}

const TrendingPosts = ({ initialPosts }: TrendingPostsProps) => {
  const [posts, setPosts] = useState<TrendingPost[]>(initialPosts || []);
  const [loading, setLoading] = useState(!initialPosts);
  const navigate = useNavigate();

  useEffect(() => {
    if (!initialPosts) {
      loadTrendingPosts();
    }
  }, [initialPosts]);

  const loadTrendingPosts = async () => {
    try {
      setLoading(true);
      const trendingPosts = await fetchTrendingPosts();
      console.log("Posts em alta carregados:", trendingPosts);
      setPosts(trendingPosts);
    } catch (error) {
      console.error("Erro ao carregar posts em alta:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostClick = (postId: string) => {
    navigate(`/post/${postId}`);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Card className="border-[#ff920e]/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart2 className="h-5 w-5 text-[#ff4400]" />
          <span>Assuntos em Alta</span>
        </CardTitle>
        <CardDescription>
          Conteúdos populares na comunidade
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p>Nenhum assunto em alta no momento</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post, index) => (
              <div 
                key={post.id}
                onClick={() => handlePostClick(post.id)}
                className={`flex gap-3 p-3 rounded-lg transition-all cursor-pointer 
                  ${index === 0 ? 'bg-orange-50 border border-[#ff4400]/30' : 'hover:bg-gray-50'}`}
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={post.authorAvatar || undefined} alt={post.author} />
                  <AvatarFallback>{getInitials(post.author)}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-sm line-clamp-2">{post.title}</h3>
                    {index === 0 && (
                      <Badge className="bg-[#ff4400] flex items-center gap-1 whitespace-nowrap">
                        <Sparkles className="h-3 w-3" />
                        <span>Top</span>
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 mt-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <ThumbsUp className="h-3 w-3" />
                      <span>{post.likes} {post.likes === 1 ? 'curtida' : 'curtidas'}</span>
                    </div>
                    
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MessageCircle className="h-3 w-3" />
                      <span>{post.comments} {post.comments === 1 ? 'comentário' : 'comentários'}</span>
                    </div>
                    
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Eye className="h-3 w-3" />
                      <span>{post.views} {post.views === 1 ? 'visualização' : 'visualizações'}</span>
                    </div>
                    
                    <span className="text-xs text-muted-foreground">
                      por <span className="font-medium">{post.author}</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <div className="px-6 pb-4">
        <Button variant="link" className="w-full text-[#ff4400]" asChild>
          <Link to="/trending" className="flex items-center justify-center gap-1">
            Ver mais assuntos em alta <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </Card>
  );
};

export default TrendingPosts;
