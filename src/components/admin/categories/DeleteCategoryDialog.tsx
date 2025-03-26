import { useState } from "react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Category } from "../communities/types";
import { deleteCategory } from "./categoryService";
import { toast } from "sonner";

interface DeleteCategoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
  onSuccess: () => void;
}

export const DeleteCategoryDialog = ({ 
  isOpen, 
  onClose, 
  category, 
  onSuccess 
}: DeleteCategoryDialogProps) => {
  const [loading, setLoading] = useState(false);
  
  const handleDelete = async () => {
    if (!category) return;
    
    setLoading(true);
    
    try {
      await deleteCategory(category.id);
      toast.success(`Categoria "${category.name}" excluída com sucesso`, { position: "bottom-right" });
      onSuccess();
      onClose(); // Fechar o diálogo após a exclusão bem-sucedida
    } catch (error) {
      console.error("Erro ao excluir categoria:", error);
      toast.error("Não foi possível excluir a categoria", { position: "bottom-right" });
    } finally {
      setLoading(false);
    }
  };
  
  if (!category) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose(); // Garantir que o diálogo feche quando o usuário clicar fora ou no botão de fechar
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Excluir Categoria</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir a categoria <strong>{category?.name}</strong>?
            Esta ação não pode ser desfeita e pode afetar publicações relacionadas.
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button 
            type="button" 
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? "Excluindo..." : "Excluir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteCategoryDialog;
