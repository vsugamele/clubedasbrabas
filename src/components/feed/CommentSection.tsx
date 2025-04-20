
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MoreHorizontal, Heart, Flag, Trash2, ShieldAlert } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/auth/AuthContext";
import { isAdminByEmail } from "@/utils/adminUtils";
import { toast } from "sonner";

interface Comment {
  id: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  createdAt: Date;
  likes: number;
  isLiked?: boolean;
  isModerator?: boolean;
}

// Inicializar com array vazio - sem comentários falsos/mock

interface CommentSectionProps {
  postId: string;
}

const CommentSection = ({ postId }: CommentSectionProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  
  // Verificar se o usuário é administrador
  const isAdmin = isAdminByEmail(user?.email);

  const handleLikeComment = (commentId: string) => {
    setComments(prev => 
      prev.map(comment => {
        if (comment.id === commentId) {
          const isLiked = !comment.isLiked;
          return {
            ...comment,
            isLiked,
            likes: isLiked ? comment.likes + 1 : comment.likes - 1,
          };
        }
        return comment;
      })
    );
  };

  const handleDeleteComment = (commentId: string) => {
    setComments(prev => prev.filter(comment => comment.id !== commentId));
    toast.success("Comentário excluído com sucesso");
    
    // Aqui você implementaria a chamada à API para excluir o comentário permanentemente
    // deleteCommentFromDatabase(commentId);
  };

  const handleSubmitComment = () => {
    if (newComment.trim() === "") return;
    
    setIsSubmitting(true);
    // Simulate API request
    setTimeout(() => {
      const newCommentObj: Comment = {
        id: `comment-${Date.now()}`,
        author: {
          id: "currentUser",
          name: "Você",
          avatar: "",
        },
        content: newComment,
        createdAt: new Date(),
        likes: 0,
        isLiked: false,
      };
      
      setComments(prev => [newCommentObj, ...prev]);
      setNewComment("");
      setIsSubmitting(false);
    }, 500);
  };

  return (
    <div className="space-y-4 px-2">
      <div className="flex gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src="" alt="Seu avatar" />
          <AvatarFallback className="bg-brand-100 text-brand-700">VC</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <Textarea
            placeholder="Adicione um comentário..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px] resize-none"
          />
          <div className="flex justify-end">
            <Button 
              size="sm" 
              disabled={newComment.trim() === "" || isSubmitting}
              onClick={handleSubmitComment}
            >
              {isSubmitting ? "Enviando..." : "Comentar"}
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-2">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3 animate-slide-up">
            <Avatar className="h-8 w-8">
              <AvatarImage src={comment.author.avatar} alt={comment.author.name} />
              <AvatarFallback className="bg-brand-100 text-brand-700">
                {comment.author.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm">{comment.author.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(comment.createdAt, { 
                        addSuffix: true,
                        locale: ptBR
                      })}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem>
                        <Flag className="mr-2 h-4 w-4" />
                        Denunciar
                      </DropdownMenuItem>
                      {(comment.author.id === "currentUser" || isAdmin) && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDeleteComment(comment.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            {isAdmin && comment.author.id !== "currentUser" ? (
                              <>
                                <span className="text-red-500">Excluir</span>
                                <ShieldAlert className="ml-1 h-3 w-3 text-red-500" />
                              </>
                            ) : (
                              "Excluir"
                            )}
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="text-sm mt-1 whitespace-pre-line">{comment.content}</p>
              </div>
              <div className="mt-1 ml-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`h-6 px-2 text-xs ${comment.isLiked ? "text-red-500" : ""}`}
                  onClick={() => handleLikeComment(comment.id)}
                >
                  <Heart className={`h-3 w-3 mr-1 ${comment.isLiked ? "fill-current" : ""}`} />
                  <span>{comment.likes}</span>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommentSection;
