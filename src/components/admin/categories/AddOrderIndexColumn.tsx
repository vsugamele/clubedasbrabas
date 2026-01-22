import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const AddOrderIndexColumn = () => {
  const [loading, setLoading] = useState(false);

  const addOrderIndexColumn = async () => {
    setLoading(true);
    try {
      // Verificar se a coluna já existe
      const { data: columnExists, error: checkError } = await supabase.rpc(
        'check_column_exists',
        { table_name: 'community_categories', column_name: 'order_index' }
      );

      if (checkError) {
        // Se a função RPC não existir, vamos criar a coluna diretamente
        console.log("Erro ao verificar coluna, tentando criar diretamente:", checkError);
        
        // Adicionar a coluna order_index
        const { error: addError } = await supabase.rpc(
          'add_column_if_not_exists',
          { 
            table_name: 'community_categories', 
            column_name: 'order_index', 
            column_type: 'INTEGER' 
          }
        );

        if (addError) {
          throw addError;
        }

        // Atualizar as categorias existentes com valores sequenciais
        const { data: categories } = await supabase
          .from('community_categories')
          .select('id')
          .order('name');

        if (categories && categories.length > 0) {
          for (let i = 0; i < categories.length; i++) {
            await supabase
              .from('community_categories')
              .update({ order_index: i + 1 })
              .eq('id', categories[i].id);
          }
        }

        toast.success("Coluna order_index adicionada com sucesso", { position: "bottom-right" });
      } else if (!columnExists) {
        // A coluna não existe, vamos criá-la
        const { error: addError } = await supabase.rpc(
          'add_column_if_not_exists',
          { 
            table_name: 'community_categories', 
            column_name: 'order_index', 
            column_type: 'INTEGER' 
          }
        );

        if (addError) {
          throw addError;
        }

        // Atualizar as categorias existentes com valores sequenciais
        const { data: categories } = await supabase
          .from('community_categories')
          .select('id')
          .order('name');

        if (categories && categories.length > 0) {
          for (let i = 0; i < categories.length; i++) {
            await supabase
              .from('community_categories')
              .update({ order_index: i + 1 })
              .eq('id', categories[i].id);
          }
        }

        toast.success("Coluna order_index adicionada com sucesso", { position: "bottom-right" });
      } else {
        toast.info("A coluna order_index já existe", { position: "bottom-right" });
      }
    } catch (error) {
      console.error("Erro ao adicionar coluna order_index:", error);
      toast.error("Erro ao adicionar coluna order_index", { position: "bottom-right" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      onClick={addOrderIndexColumn} 
      disabled={loading}
    >
      {loading ? "Adicionando..." : "Adicionar Coluna Order Index"}
    </Button>
  );
};

export default AddOrderIndexColumn;
