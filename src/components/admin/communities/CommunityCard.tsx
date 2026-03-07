import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe, Lock, Users, X, Settings, Tag } from "lucide-react";
import { Community } from "./types";

interface CommunityCardProps {
  community: Community;
  onEdit: (community: Community) => void;
  onDelete: (community: Community) => void;
}

export const CommunityCard = ({ community, onEdit, onDelete }: CommunityCardProps) => {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between">
          <CardTitle className="text-lg">{community.name}</CardTitle>
          <Badge variant={community.visibility === 'public' ? "outline" : "secondary"}>
            {community.visibility === 'public' ? (
              <Globe className="mr-1 h-3 w-3" />
            ) : (
              <Lock className="mr-1 h-3 w-3" />
            )}
            {community.visibility === 'public' ? 'Pública' : 'Privada'}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2">
          {community.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex justify-between text-sm">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{community.members} membros</span>
          </div>
          <div className="text-muted-foreground">
            {community.posts} posts
          </div>
        </div>
        
        {/* Exibir a categoria da comunidade */}
        <div className="mt-2 flex items-center">
          <Tag className="h-4 w-4 mr-1 text-muted-foreground" />
          <span className="text-sm">
            {community.categoryName ? (
              <Badge variant="outline" className="font-normal">
                {community.categoryName}
              </Badge>
            ) : (
              <span className="text-muted-foreground text-xs">Sem categoria</span>
            )}
          </span>
        </div>
        
        <div className="mt-2 text-xs text-muted-foreground">
          Criada em {new Date(community.createdAt).toLocaleDateString()}
        </div>
      </CardContent>
      <div className="p-4 pt-0 flex justify-between gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1"
          onClick={() => onEdit(community)}
        >
          <Settings className="mr-1 h-4 w-4" />
          Editar
        </Button>
        <Button 
          variant="destructive" 
          size="sm"
          className="flex-1"
          onClick={() => onDelete(community)}
        >
          <X className="mr-1 h-4 w-4" />
          Excluir
        </Button>
      </div>
    </Card>
  );
};
