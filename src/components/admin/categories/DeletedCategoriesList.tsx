import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Undo, AlertCircle, Database } from "lucide-react";
import { fetchDeletedCategories, restoreCategory } from "./categoryService";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

// Definir a interface DeletedCategory diretamente aqui para evitar problemas de importação
interface DeletedCategory {
  id: string;
  original_id: string;
  name: string;
  slug: string;
  order_index?: number;
  deleted_at: string;
  deleted_by: string;
  created_at?: string;
  updated_at?: string;
}

export const DeletedCategoriesList = ({ onCategoryRestored }: { onCategoryRestored: () => void }) => {
  const [deletedCategories, setDeletedCategories] = useState<DeletedCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [tableExists, setTableExists] = useState(true); // Assumir que a tabela existe inicialmente

  useEffect(() => {
    loadDeletedCategories();
  }, []);

  const loadDeletedCategories = async () => {
    setLoading(true);
    try {
      const data = await fetchDeletedCategories();
      setDeletedCategories(data);
      setTableExists(true); // Se chegou aqui, a tabela existe
    } catch (error) {
      console.error("Erro ao carregar categorias excluídas:", error);
      
      // Verificar se o erro é porque a tabela não existe
      const errorMessage = String(error);
      if (errorMessage.includes("does not exist") || errorMessage.includes("relation") || errorMessage.includes("42P01")) {
        setTableExists(false);
      } else {
        toast.error("Não foi possível carregar as categorias excluídas", { position: "bottom-right" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (deletedCategory: DeletedCategory) => {
    setRestoring(deletedCategory.id);
    try {
      await restoreCategory(deletedCategory);
      toast.success(`Categoria "${deletedCategory.name}" restaurada com sucesso`, { position: "bottom-right" });
      setDeletedCategories(prev => prev.filter(c => c.id !== deletedCategory.id));
      onCategoryRestored();
    } catch (error) {
      console.error("Erro ao restaurar categoria:", error);
      toast.error("Não foi possível restaurar a categoria", { position: "bottom-right" });
    } finally {
      setRestoring(null);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true,
        locale: ptBR
      });
    } catch (error) {
      return "Data desconhecida";
    }
  };

  if (!tableExists) {
    return (
      <Card className="w-full mt-6 border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-amber-500" />
            Histórico de Categorias Excluídas
          </CardTitle>
          <CardDescription>
            O sistema de backup de categorias ainda não está configurado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            <p>Para usar o histórico de categorias excluídas, primeiro configure o sistema de backup usando o painel acima.</p>
            <p className="text-sm mt-2">Isso permitirá recuperar categorias que foram excluídas acidentalmente.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-amber-500" />
          Categorias Excluídas
        </CardTitle>
        <CardDescription>
          Categorias que foram excluídas recentemente. Você pode restaurá-las se necessário.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">Carregando categorias excluídas...</div>
        ) : deletedCategories.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            Nenhuma categoria excluída encontrada
          </div>
        ) : (
          <div className="space-y-3">
            {deletedCategories.map((category) => (
              <div 
                key={category.id} 
                className="flex items-center justify-between p-3 border rounded-lg bg-muted/20"
              >
                <div>
                  <h3 className="font-medium">{category.name}</h3>
                  <p className="text-sm text-muted-foreground">Slug: {category.slug}</p>
                  <p className="text-xs text-muted-foreground">
                    Excluída {formatDate(category.deleted_at)}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleRestore(category)}
                  disabled={!!restoring}
                  className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                >
                  <Undo className="h-4 w-4 mr-1" />
                  {restoring === category.id ? "Restaurando..." : "Restaurar"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DeletedCategoriesList;
