import { supabase } from "@/integrations/supabase/client";

export interface UserMention {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
}

/**
 * Busca usuários para menção baseado em um termo de busca
 * @param searchTerm Termo para buscar usuários (sem o @)
 * @returns Lista de usuários que correspondem ao termo de busca
 */
export const searchUsersForMention = async (searchTerm: string): Promise<UserMention[]> => {
  console.log("Buscando usuários com termo:", searchTerm);
  
  try {
    // Abordagem direta que evita verificações de papéis
    // Isso contorna o problema de recursão infinita
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .limit(10)
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error("Erro ao buscar usuários para menção:", error);
      return [];
    }
    
    // Filtrar no lado do cliente para evitar problemas com as políticas de segurança
    let filteredUsers = data || [];
    if (searchTerm && searchTerm.length > 0) {
      const term = searchTerm.toLowerCase();
      filteredUsers = filteredUsers.filter(user => 
        (user.username && user.username.toLowerCase().includes(term)) || 
        (user.full_name && user.full_name.toLowerCase().includes(term))
      );
    }
    
    console.log("Usuários encontrados:", filteredUsers.length);
    
    return filteredUsers
      .filter(user => user.username || user.full_name)
      .map(user => ({
        id: user.id,
        username: user.username || user.id.substring(0, 8),
        full_name: user.full_name || '',
        avatar_url: user.avatar_url
      }));
  } catch (error) {
    console.error("Erro ao buscar usuários para menção:", error);
    return [];
  }
};
