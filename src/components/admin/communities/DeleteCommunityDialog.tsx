
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface DeleteCommunityDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onDelete: () => void;
  communityName?: string;
}

export const DeleteCommunityDialog = ({ 
  open, 
  setOpen, 
  onDelete, 
  communityName = "esta comunidade" 
}: DeleteCommunityDialogProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete();
    } finally {
      setIsDeleting(false);
      setOpen(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir Comunidade</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir <strong>{communityName}</strong>? Esta ação não pode ser desfeita 
            e todos os conteúdos da comunidade serão removidos permanentemente.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isDeleting}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isDeleting ? "Excluindo..." : "Excluir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
