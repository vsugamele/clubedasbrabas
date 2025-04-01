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
import { useAuth } from "@/context/auth";
import { isAdminByEmail } from "@/utils/adminUtils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  community?: {
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
  postId: string;
}

export const PostHeader = ({
  author,
  category,
  community,
  createdAt,
  bookmarked,
  toggleBookmark,
  hidePost,
  isModerator,
  onDelete,
  onPin,
  isPinned = false,
  postId,
}: PostHeaderProps) => {
  // Ensure author and category exist to prevent the undefined error
  if (!author || !category) {
    console.error('Missing required props in PostHeader:', { author, category });
    return <div className="p-4">Post information is incomplete</div>;
  }

  // Obter informações do usuário logado
  const { user } = useAuth();
  
  // Verificar se o usuário atual é o autor do post
  const isAuthor = user && user.id === author.id;
  
  // Verificar se o usuário é administrador usando a função centralizada
  const isAdmin = isAdminByEmail(user?.email);
  
  // Verificar se o usuário pode excluir o post (é administrador, moderador ou autor)
  // Sempre permitir exclusão para administradores e moderadores
  const canDelete = onDelete && (isAdmin || isModerator || isAuthor);

  // Função para excluir o post diretamente no banco de dados
  // Esta função ignora verificações de permissão e força a exclusão
  const forceDeletePostDirectly = async (postId: string) => {
    try {
      console.log(`Forçando exclusão direta do post ${postId}`);
      
      // Lista de tabelas relacionadas
      const relatedTables = [
        'post_likes',
        'post_comments',
        'post_media',
        'post_polls',
        'poll_votes',
        'post_views',
        'post_shares',
        'post_saves',
        'post_reports'
      ];
      
      // Excluir registros relacionados
      for (const tableName of relatedTables) {
        try {
          // @ts-ignore - Ignorando erros de tipagem, pois sabemos que as tabelas existem
          const { error } = await supabase
            .from(tableName)
            .delete()
            .eq('post_id', postId);
            
          if (error) {
            console.warn(`Erro ao excluir registros de ${tableName}:`, error);
          } else {
            console.log(`Registros de ${tableName} para o post ${postId} removidos com sucesso`);
          }
        } catch (err) {
          console.warn(`Exceção ao excluir registros de ${tableName}:`, err);
        }
      }
      
      // Excluir o post
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);
        
      if (error) {
        console.error("Erro ao excluir post:", error);
        toast.error("Erro ao excluir publicação");
        return false;
      }
      
      console.log(`Post ${postId} excluído com sucesso`);
      toast.success("Publicação excluída com sucesso");
      
      // Forçar atualização da página após a exclusão
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
      return true;
    } catch (error) {
      console.error("Erro ao excluir post:", error);
      toast.error("Erro ao excluir publicação");
      return false;
    }
  };

  // Função para lidar com a exclusão do post
  const handleDelete = async () => {
    try {
      console.log(`Iniciando exclusão do post ${postId}`);
      
      if (isAdmin || isModerator) {
        // Para administradores e moderadores, usar a exclusão direta
        console.log(`Usuário é admin ou moderador. Tentando excluir post com ID: ${postId}`);
        const success = await forceDeletePostDirectly(postId);
        
        if (success) {
          console.log(`Post ${postId} excluído com sucesso`);
          if (onDelete) {
            console.log(`Chamando callback onDelete para o post ${postId}`);
            onDelete();
          }
          
          // Forçar atualização da página após a exclusão
          setTimeout(() => {
            console.log("Recarregando a página...");
            window.location.reload();
          }, 1000);
        }
      } else if (onDelete) {
        // Para usuários normais, usar a função padrão
        console.log(`Usuário normal. Chamando callback onDelete para o post ${postId}`);
        onDelete();
      }
    } catch (error) {
      console.error(`Erro ao excluir post ${postId}:`, error);
      toast.error("Erro ao excluir publicação");
    }
  };

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
            <Link to={`/profile/${author.id}`} className="font-medium hover:underline text-gray-800 dark:text-gray-200">
              {author.name}
            </Link>
            {author.role && (
              <Badge variant="outline" className="text-xs font-normal">
                {author.role}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {community ? (
              <Link 
                to={`/c/${community.id}`} 
                className="text-brand-600 hover:underline"
              >
                {community.name}
              </Link>
            ) : (
              <Link 
                to={`/c/${category.id}`} 
                className="text-brand-600 hover:underline"
              >
                {category.name}
              </Link>
            )}
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
          
          {/* Botão de excluir para autor do post ou moderadores */}
          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Excluir publicação</span>
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
                  <AlertDialogAction onClick={handleDelete}>
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          
          {/* Opções adicionais apenas para moderadores */}
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
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
