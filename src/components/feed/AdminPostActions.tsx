import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Edit, Check } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useAuth } from "@/context/auth";
import { updatePostCategory, fetchAdminCategories } from "@/services/admin/AdminPostService";
import { toast } from "sonner";

interface AdminPostActionsProps {
  postId: string;
  currentCategory: {
    id: string | null;
    name: string;
  } | null;
  onCategoryUpdated?: (newCategoryId: string | null) => void;
}

export function AdminPostActions({ 
  postId, 
  currentCategory,
  onCategoryUpdated 
}: AdminPostActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState<{ id: string, name: string }[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    currentCategory?.id || null
  );
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  
  // Carregar categorias disponíveis
  useEffect(() => {
    const loadCategories = async () => {
      const categoriesData = await fetchAdminCategories();
      setCategories([
        // Adicionar opção "Sem categoria" (null)
        { id: "none", name: "Feed Principal (sem categoria)" },
        ...categoriesData
      ]);
    };
    
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);
  
  // Definir categoria atual quando o diálogo é aberto
  useEffect(() => {
    if (isOpen) {
      setSelectedCategoryId(currentCategory?.id || "none");
    }
  }, [isOpen, currentCategory]);
  
  const handleUpdateCategory = async () => {
    if (!user?.email) {
      toast.error("Você precisa estar logado para realizar esta ação");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Converter "none" para null (sem categoria)
      const categoryIdToUse = selectedCategoryId === "none" ? null : selectedCategoryId;
      
      const success = await updatePostCategory(
        postId,
        categoryIdToUse,
        user.email
      );
      
      if (success) {
        toast.success("Categoria do post atualizada com sucesso");
        setIsOpen(false);
        
        // Notificar o componente pai sobre a alteração
        if (onCategoryUpdated) {
          onCategoryUpdated(categoryIdToUse);
        }
      } else {
        toast.error("Não foi possível atualizar a categoria");
      }
    } catch (error) {
      console.error("Erro ao atualizar categoria:", error);
      toast.error("Erro ao atualizar categoria do post");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-muted-foreground hover:text-foreground"
          title="Editar categoria do post (Admin)"
        >
          <Edit className="h-4 w-4 mr-1" />
          Categoria
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Alterar categoria do post</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Categoria atual: <span className="font-semibold">{currentCategory?.name || "Sem categoria"}</span>
            </label>
            
            <Select
              value={selectedCategoryId || "none"}
              onValueChange={(value) => setSelectedCategoryId(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter className="flex flex-row justify-between">
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          
          <Button 
            onClick={handleUpdateCategory}
            disabled={isLoading}
            className="gap-1"
          >
            {isLoading ? (
              <span className="animate-spin h-4 w-4 border-2 border-t-transparent rounded-full" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Salvar alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AdminPostActions;
