
import { Image, Video, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { postCategories } from "@/data/postCategories";

interface PostActionToolbarProps {
  onImageClick: () => void;
  onVideoClick: () => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  disableMediaButtons: boolean;
}

export const PostActionToolbar = ({
  onImageClick,
  onVideoClick,
  selectedCategory,
  onCategoryChange,
  disableMediaButtons,
}: PostActionToolbarProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-2 text-sm"
        onClick={onImageClick}
        disabled={disableMediaButtons}
      >
        <Image className="h-4 w-4" />
        <span>Imagem</span>
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-2 text-sm"
        onClick={onVideoClick}
        disabled={disableMediaButtons}
      >
        <Video className="h-4 w-4" />
        <span>Vídeo</span>
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-2 text-sm"
      >
        <LinkIcon className="h-4 w-4" />
        <span>Link</span>
      </Button>
      
      <Select
        value={selectedCategory || "none"}
        onValueChange={onCategoryChange}
      >
        <SelectTrigger className="w-[180px] h-9 text-sm">
          <SelectValue placeholder="Selecione categoria" />
        </SelectTrigger>
        <SelectContent>
          {postCategories.map((category) => (
            <SelectItem key={category.id} value={category.id} className="text-sm">
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
