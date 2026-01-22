import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import { Heart, MessageSquare, BadgeCheck } from "lucide-react";
import { TrendingPost, fetchTrendingPosts } from "@/services/trendingService";
import { Skeleton } from "@/components/ui/skeleton";

const TrendingPage = () => {
  const [trendingPosts, setTrendingPosts] = useState<TrendingPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Assuntos em Alta | Clube das Brabas";
    loadTrendingPosts();
  }, []);

  const loadTrendingPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const posts = await fetchTrendingPosts();
      setTrendingPosts(posts);
    } catch (err) {
      console.error("Erro ao carregar assuntos em alta:", err);
      setError("Não foi possível carregar os assuntos em alta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <BadgeCheck className="h-6 w-6 text-brand-600" />
          <h1 className="text-2xl font-bold">Assuntos em Alta</h1>
        </div>

        <Card>
          <CardContent className="p-6">
            {loading ? (
              <div className="space-y-6">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex gap-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                    <Separator className="my-4" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">{error}</p>
                <button 
                  onClick={loadTrendingPosts}
                  className="px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 transition-colors"
                >
                  Tentar novamente
                </button>
              </div>
            ) : trendingPosts.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                Nenhum assunto em alta no momento
              </p>
            ) : (
              <div className="space-y-6">
                {trendingPosts.map((post) => (
                  <div key={post.id} className="group">
                    <div className="flex gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={post.authorAvatar || ""} alt={post.author} />
                        <AvatarFallback className="bg-brand-100 text-brand-700">
                          {post.author.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="space-y-2">
                        <h2 className="text-lg font-medium group-hover:text-brand-600 transition-colors">
                          <Link to={`/posts/${post.id}`}>{post.title}</Link>
                        </h2>
                        <p className="text-sm text-muted-foreground">{post.author}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Heart className="h-4 w-4 text-red-500 fill-current" />
                            <span>{post.likes} {post.likes === 1 ? 'curtida' : 'curtidas'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4 text-blue-500" />
                            <span>{post.comments} {post.comments === 1 ? 'comentário' : 'comentários'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Separator className="my-4" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default TrendingPage;
