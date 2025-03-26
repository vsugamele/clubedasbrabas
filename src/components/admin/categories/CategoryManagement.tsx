import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash, ChevronUp, ChevronDown } from "lucide-react";
import { useAuth } from "@/context/auth";
import { fetchCategories } from "./categoryService";
import { Category } from "../communities/types";
import CategoryFormDialog from "./CategoryFormDialog";
import DeleteCategoryDialog from "./DeleteCategoryDialog";
import { toast } from "sonner";
import { postCategories } from "@/data/postCategories";
import { migrateCategoriesDataToSupabase } from "./categoryService";
import { supabase } from "@/integrations/supabase/client";

export const CategoryManagement = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const { user } = useAuth();

  // Verificar se o usuário é admin (implementação simplificada, deve ser melhorada)
  const isAdmin = !!user;

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    const data = await fetchCategories();
    
    // Se não houver categorias no banco de dados, migrar as categorias do mock
    if (data.length === 0) {
      await migrateInitialCategories();
      const updatedData = await fetchCategories();
      setCategories(updatedData);
    } else {
      setCategories(data);
    }
    
    setLoading(false);
  };

  const migrateInitialCategories = async () => {
    try {
      await migrateCategoriesDataToSupabase(postCategories);
      toast.success("Categorias iniciais migradas com sucesso", { position: "bottom-right" });
    } catch (error) {
      console.error("Erro ao migrar categorias iniciais:", error);
      toast.error("Erro ao migrar categorias iniciais", { position: "bottom-right" });
    }
  };

  const handleOpenCreateDialog = () => {
    setSelectedCategory(null);
    setOpenCreateDialog(true);
  };

  const handleCloseCreateDialog = () => {
    setOpenCreateDialog(false);
    setSelectedCategory(null);
  };

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setOpenCreateDialog(true);
  };

  const handleDeleteCategory = (category: Category) => {
    setCategoryToDelete(category);
    setShowDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setShowDeleteDialog(false);
    setCategoryToDelete(null);
  };

  const handleMoveCategory = async (category: Category, direction: 'up' | 'down') => {
    const currentIndex = categories.findIndex(c => c.id === category.id);
    if (
      (direction === 'up' && currentIndex === 0) || 
      (direction === 'down' && currentIndex === categories.length - 1)
    ) {
      return; // Não pode mover mais para cima/baixo
    }
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const newCategories = [...categories];
    
    // Trocar as posições
    const temp = newCategories[currentIndex];
    newCategories[currentIndex] = newCategories[newIndex];
    newCategories[newIndex] = temp;
    
    // Atualizar order_index
    const category1 = { ...newCategories[currentIndex], order_index: currentIndex as number + 1 };
    const category2 = { ...newCategories[newIndex], order_index: newIndex + 1 };
    
    newCategories[currentIndex] = category1;
    newCategories[newIndex] = category2;
    
    // Atualizar estado local imediatamente para feedback visual
    setCategories(newCategories);
    
    try {
      // Atualizar no banco de dados
      const { error: error1 } = await supabase
        .from('community_categories')
        .update({ order_index: category1.order_index })
        .eq('id', category1.id);
        
      const { error: error2 } = await supabase
        .from('community_categories')
        .update({ order_index: category2.order_index })
        .eq('id', category2.id);
        
      if (error1 || error2) {
        throw new Error(error1?.message || error2?.message);
      }
      
      toast.success("Ordem das categorias atualizada", { position: "bottom-right" });
    } catch (error) {
      console.error("Erro ao reordenar categorias:", error);
      toast.error("Erro ao reordenar categorias", { position: "bottom-right" });
      
      // Recarregar categorias em caso de erro
      loadCategories();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Gerenciamento de Categorias</CardTitle>
          <CardDescription>Gerencie as categorias de conteúdo da plataforma</CardDescription>
        </div>
        {isAdmin && (
          <Button onClick={handleOpenCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Categoria
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">Carregando categorias...</div>
        ) : categories.length === 0 ? (
          <div className="text-center py-4">Nenhuma categoria encontrada</div>
        ) : (
          <div className="space-y-4">
            {categories.map((category) => (
              <div 
                key={category.id} 
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <h3 className="font-medium">{category.name}</h3>
                  <p className="text-sm text-gray-500">Slug: {category.slug}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleMoveCategory(category, 'up')}
                    disabled={categories.indexOf(category) === 0}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleMoveCategory(category, 'down')}
                    disabled={categories.indexOf(category) === categories.length - 1}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleEditCategory(category)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleDeleteCategory(category)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      {openCreateDialog && (
        <CategoryFormDialog
          isOpen={openCreateDialog}
          onClose={handleCloseCreateDialog}
          category={selectedCategory}
          onSuccess={loadCategories}
        />
      )}
      
      {showDeleteDialog && categoryToDelete && (
        <DeleteCategoryDialog
          isOpen={showDeleteDialog}
          onClose={handleCloseDeleteDialog}
          category={categoryToDelete}
          onSuccess={loadCategories}
        />
      )}
    </Card>
  );
};

export default CategoryManagement;
