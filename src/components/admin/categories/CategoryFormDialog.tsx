import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Category, CategoryForm } from "../communities/types";
import { addCategory, updateCategory } from "./categoryService";

const formSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres").max(50, "O nome não pode exceder 50 caracteres"),
  slug: z.string().min(3, "O slug deve ter pelo menos 3 caracteres")
    .max(50, "O slug não pode exceder 50 caracteres")
    .regex(/^[a-z0-9-]+$/, "O slug deve conter apenas letras minúsculas, números e hífens")
});

interface CategoryFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
  onSuccess: () => void;
}

export const CategoryFormDialog = ({ isOpen, onClose, category, onSuccess }: CategoryFormDialogProps) => {
  const [loading, setLoading] = useState(false);
  const isEditing = !!category;
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: category?.name || "",
      slug: category?.slug || "",
    },
  });
  
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-');
  };
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      const categoryForm: CategoryForm = {
        name: values.name,
        slug: values.slug,
      };
      
      if (isEditing && category) {
        await updateCategory(category.id, categoryForm);
      } else {
        await addCategory(categoryForm);
      }
      
      onSuccess();
    } catch (error) {
      console.error("Erro ao salvar categoria:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // Gera slug automaticamente ao digitar o nome
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    form.setValue("name", name);
    
    // Só gera o slug automaticamente se o usuário não tiver editado manualmente
    if (!isEditing && !form.getValues("slug")) {
      form.setValue("slug", generateSlug(name));
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Categoria" : "Criar Nova Categoria"}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Atualize os detalhes da categoria existente" 
              : "Adicione uma nova categoria para publicações"}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Categoria</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Nome da categoria"
                      className="border-[#ff920e]/20 focus-visible:ring-[#ff4400]"
                      {...field} 
                      onChange={handleNameChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="slug-da-categoria"
                      className="border-[#ff920e]/20 focus-visible:ring-[#ff4400]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">
                    O slug é usado nas URLs e deve conter apenas letras minúsculas, números e hífens.
                  </p>
                </FormItem>
              )}
            />
            
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
                type="submit" 
                className="bg-[#ff4400] hover:bg-[#ff4400]/90"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span> 
                    Salvando...
                  </>
                ) : isEditing ? "Atualizar Categoria" : "Criar Categoria"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryFormDialog;
