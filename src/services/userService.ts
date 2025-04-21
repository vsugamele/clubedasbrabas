import { supabase } from "@/integrations/supabase/client";

// Cache de perfis para evitar consultas repetidas
const profileCache: Record<string, any> = {};

export interface UserMention {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
}

/**
 * Busca o perfil de um usuário pelo ID com cache
 * @param userId ID do usuário
 * @returns Dados do perfil do usuário
 */
export const getUserProfile = async (userId: string) => {
  // Verificar se o ID é válido (evitar 'unknown' ou valores inválidos)
  if (!userId || userId === 'unknown' || !isValidUUID(userId)) {
    console.warn(`[UserService] ID de usuário inválido: ${userId}`);
    return null;
  }

  // Verificar se o perfil já está em cache
  if (profileCache[userId]) {
    console.log(`[UserService] Usando perfil em cache para ${userId}`);
    return profileCache[userId];
  }
  
  console.log(`[UserService] Buscando perfil para ${userId}`);
  
  try {
    // Buscar o perfil da tabela profiles
    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error(`[UserService] Erro ao buscar perfil: ${error.message}`);
      return null;
    }
    
    if (!profileData) {
      console.warn(`[UserService] Perfil não encontrado para ${userId}`);
      return null;
    }
    
    // Armazenar em cache para futuras consultas
    profileCache[userId] = profileData;
    
    console.log(`[UserService] Perfil encontrado para ${userId}:`, profileData);
    return profileData;
  } catch (error) {
    console.error(`[UserService] Erro ao buscar perfil para ${userId}:`, error);
    return null;
  }
};

/**
 * Formata o objeto autor para exibição no feed
 * @param userId ID do usuário
 * @param profile Opcional - perfil já carregado
 * @returns Objeto autor formatado
 */
export const formatAuthor = async (userId: string, profile?: any) => {
  // Usar perfil fornecido ou buscar
  const userProfile = profile || await getUserProfile(userId);
  
  if (!userProfile) {
    console.warn(`[UserService] Usando perfil padrão para ${userId}`);
    return {
      id: userId,
      name: 'Usuário',
      avatar: null
    };
  }
  
  // Priorizar campos conforme disponibilidade
  return {
    id: userId,
    name: userProfile.full_name || userProfile.username || 'Usuário',
    avatar: userProfile.avatar_url
  };
};

/**
 * Limpa o cache de perfis (chamar depois de atualizações)
 */
export const clearProfileCache = () => {
  Object.keys(profileCache).forEach(key => delete profileCache[key]);
  console.log('[UserService] Cache de perfis limpo');
};

/**
 * Verifica se uma string é um UUID válido
 * @param uuid String para verificar
 * @returns true se for um UUID válido
 */
function isValidUUID(uuid: string) {
  // Padrão de regex para validar UUIDs
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidPattern.test(uuid);
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

/**
 * Busca usuários baseado em um termo de busca
 * @param searchTerm Termo para buscar usuários
 * @returns Lista de usuários que correspondem ao termo de busca
 */
export const fetchUsers = async (searchTerm: string) => {
  console.log("Buscando usuários com termo:", searchTerm);
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, bio')
      .or(`username.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`)
      .limit(20)
      .order('full_name', { ascending: true });
    
    if (error) {
      console.error("Erro ao buscar usuários:", error);
      return [];
    }
    
    console.log("Usuários encontrados:", data?.length || 0);
    return data || [];
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return [];
  }
};
