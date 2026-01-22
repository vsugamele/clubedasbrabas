
import { supabase } from "@/integrations/supabase/client";
import { UserRanking, mapUserRankingFromSupabase } from "../communities/types";
import { toast } from "sonner";

// Função auxiliar para mostrar erros com toast
const handleError = (error: any, message: string) => {
  console.error(`${message}:`, error);
  toast.error(`Erro: ${message}`, { position: "bottom-right" });
};

// Buscar o ranking do usuário atual
export const fetchUserRanking = async (userId: string): Promise<UserRanking | null> => {
  try {
    const { data, error } = await supabase
      .from('user_rankings')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') {
        // Se o usuário não tiver um ranking, criar um novo
        return createUserRanking(userId);
      }
      throw error;
    }
    
    if (!data) {
      return createUserRanking(userId);
    }
    
    return mapUserRankingFromSupabase(data);
  } catch (error) {
    handleError(error, "Não foi possível carregar o ranking do usuário");
    return null;
  }
};

// Criar um novo ranking de usuário
export const createUserRanking = async (userId: string): Promise<UserRanking | null> => {
  try {
    const rankingData = {
      user_id: userId,
      points: 0,
      level: 1,
      posts_count: 0,
      comments_count: 0,
      likes_received: 0
    };
    
    const { data, error } = await supabase
      .from('user_rankings')
      .insert(rankingData)
      .select()
      .single();
      
    if (error) {
      throw error;
    }
    
    if (!data) {
      throw new Error("Não foi possível obter os dados do ranking após a criação");
    }
    
    return mapUserRankingFromSupabase(data);
  } catch (error) {
    handleError(error, "Não foi possível criar o ranking do usuário");
    return null;
  }
};

// Buscar rankings dos top usuários
export const fetchTopRankings = async (limit: number = 10): Promise<UserRanking[]> => {
  try {
    const { data, error } = await supabase
      .from('user_rankings')
      .select('*')
      .order('points', { ascending: false })
      .limit(limit);
      
    if (error) {
      throw error;
    }
    
    return data ? data.map(mapUserRankingFromSupabase) : [];
  } catch (error) {
    handleError(error, "Não foi possível carregar os rankings dos usuários");
    return [];
  }
};

// Atualizar pontos do usuário (após criação de post, comentário, etc.)
export const updateUserPoints = async (
  userId: string, 
  pointsToAdd: number, 
  type: 'post' | 'comment' | 'like'
): Promise<UserRanking | null> => {
  try {
    // Buscar o ranking atual do usuário
    const currentRanking = await fetchUserRanking(userId);
    
    if (!currentRanking) {
      throw new Error("Ranking do usuário não encontrado");
    }
    
    // Preparar os dados para atualização
    const updateData: Record<string, any> = {
      points: currentRanking.points + pointsToAdd
    };
    
    // Atualizar o contador correspondente ao tipo de atividade
    if (type === 'post') {
      updateData.posts_count = currentRanking.postsCount + 1;
    } else if (type === 'comment') {
      updateData.comments_count = currentRanking.commentsCount + 1;
    } else if (type === 'like') {
      updateData.likes_received = currentRanking.likesReceived + 1;
    }
    
    // Calcular o novo nível do usuário (a cada 100 pontos)
    const newLevel = Math.floor(updateData.points / 100) + 1;
    updateData.level = newLevel;
    
    // Atualizar no banco de dados
    const { data, error } = await supabase
      .from('user_rankings')
      .update(updateData)
      .eq('id', currentRanking.id)
      .select()
      .single();
      
    if (error) {
      throw error;
    }
    
    if (!data) {
      throw new Error("Não foi possível obter os dados do ranking após a atualização");
    }
    
    const updatedRanking = mapUserRankingFromSupabase(data);
    
    // Se o usuário subiu de nível, mostrar mensagem
    if (updatedRanking.level > currentRanking.level) {
      toast.success(`Parabéns! Você atingiu o nível ${updatedRanking.level}!`, { 
        position: "bottom-right",
        duration: 5000
      });
    }
    
    return updatedRanking;
  } catch (error) {
    handleError(error, "Não foi possível atualizar os pontos do usuário");
    return null;
  }
};
