
import { supabase } from "@/integrations/supabase/client";
import { Community } from "../types";
import { queryWithRetry, asPromise } from "../../hooks/utils/queryUtils";
import { handleError, handleSuccess } from "../utils/serviceUtils";

// Função para migrar dados do localStorage para o Supabase (útil para a primeira execução)
export const migrateMockDataToSupabase = async (): Promise<void> => {
  const savedData = localStorage.getItem('communitiesMockData');
  if (!savedData) {
    console.log("Nenhum dado encontrado no localStorage para migrar");
    return;
  }

  try {
    const mockData = JSON.parse(savedData);
    console.log("Dados a serem migrados do localStorage:", mockData);
    
    // Preparar dados para inserção no formato Supabase
    const communityData = mockData.map((item: Community) => ({
      name: item.name,
      description: item.description,
      members: item.members,
      posts: item.posts,
      visibility: item.visibility,
      posting_restrictions: item.postingRestrictions,
      // Não usamos o id original pois o Supabase gerará novos UUIDs
    }));
    
    // Inserir todos os dados no Supabase
    const { data, error } = await supabase
      .from('communities')
      .insert(communityData)
      .select();
      
    if (error) {
      throw error;
    }
    
    console.log("Dados migrados com sucesso para o Supabase:", data);
    handleSuccess("Dados migrados com sucesso do localStorage para o Supabase");
    
    // Limpar dados do localStorage após migração bem-sucedida
    localStorage.removeItem('communitiesMockData');
  } catch (error) {
    handleError(error, "Não foi possível migrar os dados para o Supabase");
  }
};

// Tenta migrar dados do localStorage para o Supabase quando o módulo for carregado
if (typeof window !== 'undefined') {
  migrateMockDataToSupabase()
    .then(() => console.log("Verificação/migração de dados concluída"))
    .catch((e) => console.error("Erro ao verificar/migrar dados:", e));
}
