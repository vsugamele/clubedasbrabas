
import { useState, useEffect } from "react";
import PostFeed from "./PostFeed";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CommunityFeedProps {
  communityId: string;
  communityName: string;
  communityDescription?: string;
  memberCount?: number;
}

const CommunityFeed = ({
  communityId,
  communityName,
  communityDescription = "Comunidade para compartilhar ideias e experiências",
  memberCount = 0
}: CommunityFeedProps) => {
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Simulate loading for UX consistency
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="space-y-6">
      <Card className="border-brand-100">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-bold">{communityName}</CardTitle>
              <CardDescription className="mt-2">{communityDescription}</CardDescription>
            </div>
            <Badge className="flex items-center gap-1" variant="outline">
              <User className="h-3 w-3" />
              <span>{memberCount} membros</span>
            </Badge>
          </div>
        </CardHeader>
      </Card>
      
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="posts" className="flex-1">Publicações</TabsTrigger>
          <TabsTrigger value="events" className="flex-1">Eventos</TabsTrigger>
          <TabsTrigger value="members" className="flex-1">Membros</TabsTrigger>
          <TabsTrigger value="files" className="flex-1">Arquivos</TabsTrigger>
        </TabsList>
        <TabsContent value="posts" className="mt-6">
          <PostFeed communityId={communityId} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="events" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-10 text-gray-500">
                Não há eventos agendados para esta comunidade.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="members" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-10 text-gray-500">
                Esta comunidade possui {memberCount} membros.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="files" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-10 text-gray-500">
                Não há arquivos compartilhados nesta comunidade.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CommunityFeed;
