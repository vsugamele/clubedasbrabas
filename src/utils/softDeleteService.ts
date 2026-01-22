/**
 * Serviço para implementar soft delete de posts
 * Esta abordagem permite marcar posts como excluídos sem removê-los fisicamente
 */
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { isAdminByEmail } from "./adminUtils";

interface SoftDeleteOptions {
  showToasts?: boolean;
}

/**
 * Marca um post como excluído sem removê-lo fisicamente
 * @param postId ID do post a ser marcado como excluído
 * @param options Opções de configuração
 */
export async function softDeletePost(
  postId: string,
  options: SoftDeleteOptions = { showToasts: true }
): Promise<boolean> {
  try {
    // Verificar se é administrador
    const { data: { user } } = await supabase.auth.getUser();
    const isAdmin = await isAdminByEmail(user?.email);
    
    if (!isAdmin) {
      console.error("Usuário não é administrador");
      if (options.showToasts) {
        toast.error("Apenas administradores podem remover posts");
      }
      return false;
    }
    
    // Mostrar toast de carregamento
    if (options.showToasts) {
      toast.loading("Removendo post...");
    }
    
    // Verificar se a coluna is_deleted existe
    try {
      // Método alternativo: tentar primeiro fazer um update sem a coluna is_deleted
      const { error: updateError } = await supabase
        .from('posts')
        .update({
          content: "[Este post foi removido por um administrador]",
          title: "[Post removido]"
        })
        .eq('id', postId);
      
      if (updateError) {
        console.error("Erro ao atualizar o post sem is_deleted:", updateError);
        if (options.showToasts) {
          toast.dismiss();
          toast.error("Não foi possível remover o post");
        }
        return false;
      }
      
      // Agora tentamos atualizar a coluna is_deleted se ela existir
      // Se não existir, essa operação pode falhar, mas o post já foi marcado como removido
      try {
        await supabase
          .from('posts')
          .update({
            is_deleted: true
          })
          .eq('id', postId);
      } catch (secondError) {
        // Ignoramos este erro pois a coluna pode não existir
        console.log("Aviso: Erro ao definir is_deleted (a coluna pode não existir):", secondError);
      }
      
      // Exibir mensagem de sucesso
      console.log(`Post ${postId} marcado como excluído com sucesso`);
      if (options.showToasts) {
        toast.dismiss();
        toast.success("Post removido com sucesso");
      }
      
      // Consideramos sucesso mesmo se a segunda operação falhar
      return true;
    } catch (error) {
      console.error("Erro ao atualizar post:", error);
      if (options.showToasts) {
        toast.dismiss();
        toast.error("Não foi possível remover o post");
      }
      return false;
    }
    
    console.log(`Post ${postId} marcado como excluído com sucesso`);
    if (options.showToasts) {
      toast.dismiss();
      toast.success("Post removido com sucesso");
    }
    
    return true;
  } catch (error) {
    console.error("Erro ao marcar post como excluído:", error);
    if (options.showToasts) {
      toast.dismiss();
      toast.error("Ocorreu um erro ao remover o post");
    }
    return false;
  }
}

/**
 * Função para recarregar a página após determinado tempo
 */
export function reloadAfterDelay(delayMs = 1500): void {
  setTimeout(() => {
    window.location.reload();
  }, delayMs);
}
