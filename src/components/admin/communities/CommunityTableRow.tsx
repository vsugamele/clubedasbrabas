
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, X } from "lucide-react";
import { Community } from "./types";

interface CommunityTableRowProps {
  community: Community;
  onEdit: (community: Community) => void;
  onDelete: (community: Community) => void;
  onUpdateVisibility: (id: string, visibility: "public" | "private") => void;
  onUpdatePostingRestrictions: (id: string, postingRestrictions: "all_members" | "admin_only") => void;
}

export const CommunityTableRow = ({ 
  community, 
  onEdit, 
  onDelete,
  onUpdateVisibility,
  onUpdatePostingRestrictions
}: CommunityTableRowProps) => {
  return (
    <div className="grid grid-cols-8 gap-4 p-4 border-t items-center">
      <div className="col-span-3">
        <div className="font-medium">{community.name}</div>
        <div className="text-sm text-muted-foreground line-clamp-1">
          {community.description}
        </div>
      </div>
      
      <div className="col-span-1 text-sm">
        {community.members}
      </div>
      
      <div className="col-span-1">
        <Select 
          value={community.visibility}
          onValueChange={(value) => onUpdateVisibility(community.id, value as "public" | "private")}
        >
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="public">Pública</SelectItem>
            <SelectItem value="private">Privada</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="col-span-1">
        <Select 
          value={community.postingRestrictions}
          onValueChange={(value) => onUpdatePostingRestrictions(community.id, value as "all_members" | "admin_only")}
        >
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_members">Todos</SelectItem>
            <SelectItem value="admin_only">Só Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="col-span-2 flex justify-end gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onEdit(community)}
        >
          <Settings className="mr-1 h-4 w-4" />
          Gerenciar
        </Button>
        <Button 
          variant="destructive" 
          size="sm"
          onClick={() => onDelete(community)}
        >
          Excluir
        </Button>
      </div>
    </div>
  );
};
