
import { Heart, MessageCircle, Share2, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PostActionsProps {
  likeCount: number;
  commentCount: number;
  liked: boolean;
  bookmarked: boolean;
  toggleLike: () => void;
  toggleComments: () => void;
  toggleBookmark: () => void;
  sharePost: () => void; // Nova prop para compartilhamento
}

export const PostActions = ({
  likeCount,
  commentCount,
  liked,
  bookmarked,
  toggleLike,
  toggleComments,
  toggleBookmark,
  sharePost,
}: PostActionsProps) => {
  return (
    <div className="flex items-center justify-between w-full px-2">
      <div className="flex items-center gap-1">
        <Button 
          variant="ghost" 
          size="sm" 
          className={`flex items-center gap-2 text-sm font-normal ${liked ? "text-red-500" : ""}`}
          onClick={toggleLike}
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
          <span>{likeCount}</span>
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center gap-2 text-sm font-normal"
          onClick={toggleComments}
        >
          <MessageCircle className="h-4 w-4" />
          <span>{commentCount}</span>
        </Button>
      </div>
      
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center gap-2 text-sm font-normal"
          onClick={sharePost}
        >
          <Share2 className="h-4 w-4" />
          <span>Compartilhar</span>
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-sm font-normal"
          onClick={toggleBookmark}
        >
          <Bookmark className={`h-4 w-4 ${bookmarked ? "fill-current" : ""}`} />
          <span className="sr-only">Salvar</span>
        </Button>
      </div>
    </div>
  );
};
