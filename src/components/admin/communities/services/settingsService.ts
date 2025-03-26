
import { supabase } from "@/integrations/supabase/client";
import { queryWithRetry, asPromise } from "../../hooks/utils/queryUtils";
import { handleError, handleSuccess } from "../utils/serviceUtils";

// Atualizar visibilidade da comunidade no Supabase
export const updateCommunityVisibility = async (
  id: string, 
  visibility: "public" | "private"
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('communities')
      .update({ visibility } as any)
      .eq('id', id as any);
      
    if (error) {
      throw error;
    }
    
    handleSuccess(
      `Visibilidade da comunidade atualizada para ${visibility === 'public' ? 'pública' : 'privada'}`
    );
    console.log(`Visibilidade da comunidade (${id}) atualizada para ${visibility}`);
  } catch (error) {
    handleError(error, "Não foi possível atualizar a visibilidade da comunidade");
  }
};

// Atualizar restrições de postagem da comunidade no Supabase
export const updateCommunityPostingRestrictions = async (
  id: string, 
  postingRestrictions: "all_members" | "admin_only"
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('communities')
      .update({ posting_restrictions: postingRestrictions } as any)
      .eq('id', id as any);
      
    if (error) {
      throw error;
    }
    
    handleSuccess(
      `Restrições de publicação atualizadas para ${postingRestrictions === 'all_members' ? 'todos os membros' : 'apenas administradores'}`
    );
    console.log(`Restrições de postagem da comunidade (${id}) atualizadas para ${postingRestrictions}`);
  } catch (error) {
    handleError(error, "Não foi possível atualizar as restrições de postagem");
  }
};
