import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck, Heart } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";

interface TrendingPost {
  id: string;
  title: string;
  author: string;
  likes: number;
}

interface TrendingPostsProps {
  posts: TrendingPost[];
}

const TrendingPosts = ({ posts }: TrendingPostsProps) => {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BadgeCheck className="h-5 w-5 text-brand-600" />
          <span>Assuntos em Alta</span>
        </h3>
        
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="group animate-fade-in">
              <div className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" alt={post.author} />
                  <AvatarFallback className="bg-brand-100 text-brand-700">
                    {post.author.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="space-y-1">
                  <h4 className="font-medium line-clamp-2 group-hover:text-brand-600 transition-colors">
                    <Link to={`/posts/${post.id}`}>{post.title}</Link>
                  </h4>
                  <p className="text-sm text-muted-foreground">{post.author}</p>
                  <div className="flex items-center gap-1 text-xs">
                    <Heart className="h-3 w-3 text-red-500 fill-current" />
                    <span>{post.likes} pessoas curtiram</span>
                  </div>
                </div>
              </div>
              
              <Separator className="my-3" />
            </div>
          ))}
        </div>
        
        <Button variant="outline" className="w-full mt-2" asChild>
          <Link to="/trending" className="flex items-center gap-2">
            <span>Ver mais assuntos populares</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default TrendingPosts;
