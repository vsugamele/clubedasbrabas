
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AttachmentsPreviewProps {
  attachments: File[];
  onRemove: (index: number) => void;
}

export const AttachmentsPreview = ({ attachments, onRemove }: AttachmentsPreviewProps) => {
  if (attachments.length === 0) return null;

  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      {attachments.map((file, index) => (
        <div 
          key={index} 
          className="relative rounded-md overflow-hidden aspect-video bg-muted group"
        >
          {file.type.startsWith("image/") ? (
            <img
              src={URL.createObjectURL(file)}
              alt={`Anexo ${index + 1}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <video
              src={URL.createObjectURL(file)}
              className="w-full h-full object-cover"
              controls
            />
          )}
          
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onRemove(index)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}
    </div>
  );
};

