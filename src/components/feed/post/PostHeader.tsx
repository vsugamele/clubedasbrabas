import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MoreHorizontal, Bookmark, Flag, Trash2, Pin, ShieldAlert, AlertTriangle } from "lucide-react";
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
import { isAdminByEmailSync } from "@/utils/adminUtils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { adminDeletePost, reloadPage } from "@/utils/administrativeDelete";
import { softDeletePost } from "@/utils/softDeleteService";
import { processDeletedPosts } from "@/utils/postFilterHelper";

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
  
  // Verificar se o post está marcado como excluído (soft deleted)
  // Detectamos este valor diretamente do objeto do post quando implementado
  const isDeleted = false; // Valor temporário até implementação completa

  // Obter informações do usuário logado
  const { user } = useAuth();
  
  // Verificar se o usuário atual é o autor do post
  const isAuthor = user && user.id === author.id;
  
  // Verificar se o usuário é administrador usando a função centralizada (versão síncrona)
  const isAdmin = isAdminByEmailSync(user?.email);
  
  // Verificar se o usuário pode excluir o post
  // Administradores podem excluir QUALQUER post
  // Moderadores podem excluir posts da comunidade deles
  // Autores podem excluir seus próprios posts
  const canDelete = isAdmin || (onDelete && (isModerator || isAuthor));

  // Função para excluir o post como administrador usando soft delete
  // Esta abordagem marca o post como removido em vez de removê-lo fisicamente
  const forceDeletePostDirectly = async (postId: string) => {
    try {
      if (!user) {
        console.error("Usuário não autenticado");
        return false;
      }

      console.log(`Tentando remover post como administrador - ID: ${postId}, Usuário: ${user.email}`);
      
      // Usar o serviço de soft delete
      return await softDeletePost(postId, { showToasts: true });
    } catch (error) {
      console.error("Erro ao remover post:", error);
      return false;
    }
  };
  
  // Função para fazer o reload da página após exclusão bem-sucedida
  const handleReload = () => {
    reloadPage(1500);
  };    
  
  // Função para lidar com a exclusão do post
  const handleDelete = async () => {
    try {
      console.log(`Iniciando remoção do post ${postId}`);
      console.log(`Informações do usuário atual:`, user);
      console.log(`É administrador:`, isAdmin);
      
      // Para administradores, usar soft delete
      // para contornar qualquer problema de permissão RLS
      if (isAdmin) {
        console.log(`Usuário é administrador. Email: ${user?.email}`);
        console.log(`Tentando remover post: ${postId}`);
        
        // Verificar se temos uma sessão válida antes de tentar excluir
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.error('Sessão inválida ou expirada');
          toast.error('Sua sessão expirou. Faça login novamente.');
          return false;
        }
        
        console.log(`Sessão válida, prosseguindo com a remoção...`);
        
        // Usar a função de soft delete para administradores
        const success = await forceDeletePostDirectly(postId);
        
        if (success) {
          // O toast de sucesso é mostrado pelo serviço de soft delete
          handleReload();
          return true;
        } else {
          // O toast de erro é mostrado pelo serviço de soft delete
          return false;
        }
      } 
      // Para usuários normais (autor do post), usar o método padrão de exclusão
      else if (onDelete) {
        console.log(`Usando método padrão de exclusão`);
        toast.loading("Excluindo publicação...");
        
        onDelete();
        return true;
      } else {
        console.error(`Usuário não tem permissão para excluir o post`);
        toast.error("Você não tem permissão para excluir esta publicação");
        return false;
      }
    } catch (error) {
      console.error("Erro ao excluir post:", error);
      toast.dismiss();
      toast.error("Ocorreu um erro ao excluir a publicação");
      return false;
    }
  };

  return (
    <div className="p-4 flex flex-row items-start justify-between space-y-0">
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src={author.avatar} />
          <AvatarFallback>{author.name.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <span className="font-semibold dark:text-gray-200">{author.name}</span>
            
            {/* Posts podem estar em uma categoria, comunidade, ou ambos */}
            {category && (
              <Link 
                to={`/categoria/${category.id}`} 
                className="hover:underline"
              >
                <Badge variant="outline" className="px-2 py-0 text-xs hover:bg-primary/10 transition-colors">
                  {category.name}
                </Badge>
              </Link>
            )}
            {isDeleted && (
              <Badge variant="destructive" className="ml-2 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                <span>Post Removido</span>
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Link to={`/categoria/${category.id}`} className="hover:underline">
              {category.name}
            </Link>
            {community && (
              <>
                <span>•</span>
                <Link to={`/comunidade/${community.id}`} className="hover:underline">
                  {community.name}
                </Link>
              </>
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
                  {isAdmin && !isAuthor ? (
                    <>
                      <span className="text-red-500 font-medium">Remover publicação</span>
                      <ShieldAlert className="ml-1 h-3 w-3 text-red-500" />
                    </>
                  ) : (
                    <span>Excluir publicação</span>
                  )}
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {isAdmin && !isAuthor ? (
                      <div className="flex items-center gap-2 text-red-500">
                        <ShieldAlert className="h-5 w-5" />
                        Remoção administrativa
                      </div>
                    ) : (
                      "Excluir publicação"
                    )}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {isAdmin && !isAuthor ? (
                      <>
                        <p className="font-medium text-red-500 mb-2">Você está prestes a remover o post de outro usuário como administrador.</p>
                        <p>Este post será marcado como removido e seu conteúdo será substituído.</p>
                      </>
                    ) : (
                      "Tem certeza que deseja excluir esta publicação? Esta ação não pode ser desfeita."
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDelete} 
                    className={isAdmin && !isAuthor ? "bg-red-500 hover:bg-red-600" : ""}
                  >
                    {isAdmin && !isAuthor ? "Confirmar remoção administrativa" : "Excluir"}
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
