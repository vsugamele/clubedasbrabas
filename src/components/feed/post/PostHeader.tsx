
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MoreHorizontal, Bookmark, Flag, Trash2, Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface PostHeaderProps {
  author: {
    id: string;
    name: string;
    avatar?: string;
    role?: string;
  };
  category: {
    id: string;
    name: string;
  };
  createdAt: Date;
  bookmarked: boolean;
  toggleBookmark: () => void;
  hidePost: () => void;
  isModerator: boolean;
  onDelete?: () => void;
  onPin?: () => void;
  isPinned?: boolean;
}

export const PostHeader = ({
  author,
  category,
  createdAt,
  bookmarked,
  toggleBookmark,
  hidePost,
  isModerator,
  onDelete,
  onPin,
  isPinned = false,
}: PostHeaderProps) => {
  // Ensure author and category exist to prevent the undefined error
  if (!author || !category) {
    console.error('Missing required props in PostHeader:', { author, category });
    return <div className="p-4">Post information is incomplete</div>;
  }

  return (
    <div className="p-4 flex flex-row items-start justify-between space-y-0">
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={author.avatar} alt={author.name} />
          <AvatarFallback className="bg-brand-100 text-brand-700">
            {author.name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-2">
            <Link to={`/perfil/${author.id}`} className="font-medium hover:underline">
              {author.name}
            </Link>
            {author.role && (
              <Badge variant="outline" className="text-xs font-normal">
                {author.role}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link 
              to={`/categoria/${category.id}`} 
              className="text-brand-600 hover:underline"
            >
              {category.name}
            </Link>
            <span>•</span>
            <time dateTime={createdAt.toISOString()}>
              {formatDistanceToNow(createdAt, { 
                addSuffix: true,
                locale: ptBR
              })}
            </time>
          </div>
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Menu da publicação</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Opções</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={toggleBookmark}>
            <Bookmark className="mr-2 h-4 w-4" />
            {bookmarked ? "Remover dos salvos" : "Salvar publicação"}
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Flag className="mr-2 h-4 w-4" />
            Denunciar publicação
          </DropdownMenuItem>
          {isModerator && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={hidePost}>
                <Flag className="mr-2 h-4 w-4" />
                Ocultar publicação
              </DropdownMenuItem>
              
              {onPin && (
                <DropdownMenuItem onClick={onPin}>
                  <Pin className="mr-2 h-4 w-4" />
                  {isPinned ? "Desafixar publicação" : "Fixar publicação"}
                </DropdownMenuItem>
              )}
              
              {onDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-500">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir publicação
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir publicação</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir esta publicação? Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction className="bg-red-500 hover:bg-red-600" onClick={onDelete}>
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
