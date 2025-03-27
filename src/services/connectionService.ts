import { supabase } from "@/integrations/supabase/client";
import { UserMention } from "./userService";

export interface SuggestedConnection {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  occupation: string | null;
  interaction_count: number;
}

/**
 * Busca sugestões de conexões para o usuário atual
 * Prioriza usuários com quem o usuário atual mais interagiu (likes, comentários)
 * @param currentUserId ID do usuário atual
 * @param limit Número máximo de sugestões a retornar
 * @returns Lista de usuários sugeridos para conexão
 */
export const getSuggestedConnections = async (
  currentUserId: string,
  limit: number = 3
): Promise<SuggestedConnection[]> => {
  try {
    // Primeiro, vamos buscar os usuários com quem o usuário atual mais interagiu
    // através de likes em posts
    const { data: likeInteractions, error: likeError } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', currentUserId);

    if (likeError) {
      console.error("Erro ao buscar interações de likes:", likeError);
    }

    // Combinar IDs de posts com interações
    const interactedPostIds = [
      ...(likeInteractions || []).map(like => like.post_id)
    ];

    // Buscar autores dos posts com quem o usuário interagiu
    let interactedUserIds: string[] = [];
    if (interactedPostIds.length > 0) {
      const { data: interactedPosts, error: postsError } = await supabase
        .from('posts')
        .select('user_id')
        .in('id', interactedPostIds);

      if (postsError) {
        console.error("Erro ao buscar posts interagidos:", postsError);
      } else if (interactedPosts) {
        interactedUserIds = interactedPosts
          .map(post => post.user_id)
          .filter(id => id !== currentUserId); // Excluir o próprio usuário
      }
    }

    // Contar frequência de interações com cada usuário
    const interactionCounts: Record<string, number> = {};
    interactedUserIds.forEach(userId => {
      interactionCounts[userId] = (interactionCounts[userId] || 0) + 1;
    });

    // Ordenar usuários por número de interações
    const sortedUserIds = Object.keys(interactionCounts).sort(
      (a, b) => interactionCounts[b] - interactionCounts[a]
    );

    // Limitar ao número de usuários com mais interações
    const topInteractedUserIds = sortedUserIds.slice(0, limit);

    // Se não tivermos usuários suficientes com interações, buscar usuários recentes
    let suggestedUserIds = [...topInteractedUserIds];
    
    if (suggestedUserIds.length < limit) {
      const remainingCount = limit - suggestedUserIds.length;
      
      // Buscar usuários recentes que não são o usuário atual
      const { data: recentUsers, error: recentError } = await supabase
        .from('profiles')
        .select('id')
        .neq('id', currentUserId)
        .order('updated_at', { ascending: false })
        .limit(remainingCount);

      if (recentError) {
        console.error("Erro ao buscar usuários recentes:", recentError);
      } else if (recentUsers) {
        const recentUserIds = recentUsers.map(user => user.id);
        suggestedUserIds = [...suggestedUserIds, ...recentUserIds];
      }
    }

    // Se ainda não tivermos usuários suficientes, buscar usuários aleatórios
    if (suggestedUserIds.length === 0) {
      const { data: randomUsers, error: randomError } = await supabase
        .from('profiles')
        .select('id')
        .neq('id', currentUserId)
        .limit(limit);

      if (randomError) {
        console.error("Erro ao buscar usuários aleatórios:", randomError);
      } else if (randomUsers) {
        suggestedUserIds = randomUsers.map(user => user.id);
      }
    }

    // Buscar detalhes completos dos usuários sugeridos
    if (suggestedUserIds.length > 0) {
      // Selecionar campos básicos que sabemos que existem
      const { data: suggestedUsers, error: usersError } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', suggestedUserIds);

      if (usersError) {
        console.error("Erro ao buscar detalhes dos usuários sugeridos:", usersError);
        return [];
      }

      if (suggestedUsers) {
        // Mapear para o formato de SuggestedConnection e adicionar contagem de interações
        return suggestedUsers.map(user => ({
          id: user.id,
          username: user.username || user.id.substring(0, 8),
          full_name: user.full_name || '',
          avatar_url: user.avatar_url,
          occupation: null, // Não temos essa informação ainda
          interaction_count: interactionCounts[user.id] || 0
        }));
      }
    }

    return [];
  } catch (error) {
    console.error("Erro ao buscar sugestões de conexões:", error);
    return [];
  }
};

/**
 * Verifica se o usuário atual já está conectado com outro usuário
 * @param currentUserId ID do usuário atual
 * @param targetUserId ID do usuário alvo
 * @returns true se já estiverem conectados, false caso contrário
 */
export const checkIfConnected = async (
  currentUserId: string,
  targetUserId: string
): Promise<boolean> => {
  try {
    // Simplificar: apenas retornar false por enquanto
    // Quando a tabela connections for criada, podemos implementar isso corretamente
    return false;
  } catch (error) {
    console.error("Erro ao verificar conexão:", error);
    return false;
  }
};

/**
 * Cria uma conexão entre dois usuários
 * @param currentUserId ID do usuário atual
 * @param targetUserId ID do usuário alvo
 * @returns true se a conexão foi criada com sucesso, false caso contrário
 */
export const createConnection = async (
  currentUserId: string,
  targetUserId: string
): Promise<boolean> => {
  try {
    // Por enquanto, apenas simular que a conexão foi criada com sucesso
    // Quando a tabela connections for criada, podemos implementar isso corretamente
    return true;
  } catch (error) {
    console.error("Erro ao criar conexão:", error);
    return false;
  }
};
