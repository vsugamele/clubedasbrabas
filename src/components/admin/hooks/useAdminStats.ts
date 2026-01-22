import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AdminStats {
  users: number;
  posts: number;
  communities: number;
  reports: number;
}

// Estado inicial padrão para as estatísticas
export const DEFAULT_STATS: AdminStats = {
  users: 0,
  posts: 0,
  communities: 0,
  reports: 0
};

export const useAdminStats = () => {
  const [stats, setStats] = useState<AdminStats>(DEFAULT_STATS);
  const [isLoading, setIsLoading] = useState(false);

  // Função para carregar estatísticas
  const loadStats = useCallback(async () => {
    console.log("Iniciando carregamento de estatísticas...");
    setIsLoading(true);
    
    try {
      // Definir um timeout para cada operação
      const STATS_TIMEOUT = 10000; // 10 segundos
      
      // Preparar queries como funções com timeout
      const fetchWithTimeout = async (fetchFn) => {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Timeout na busca de estatísticas")), STATS_TIMEOUT);
        });
        
        try {
          return await Promise.race([fetchFn(), timeoutPromise]);
        } catch (error) {
          console.warn("Timeout ou erro em uma query de estatísticas:", error);
          return { count: 0 };
        }
      };
      
      const fetchUsersCount = async () => {
        console.log("Buscando contagem de usuários...");
        const result = await fetchWithTimeout(async () => {
          // Primeiro tenta buscar do banco de dados
          const { count, error } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });
            
          if (error) throw error;
          return { count: count || 0 };
        });
        
        return result.count || 0;
      };
      
      const fetchPostsCount = async () => {
        console.log("Buscando contagem de posts...");
        const result = await fetchWithTimeout(async () => {
          const { count, error } = await supabase
            .from('posts')
            .select('*', { count: 'exact', head: true });
            
          if (error) throw error;
          return { count: count || 0 };
        });
        
        return result.count || 0;
      };
      
      const fetchCommunitiesCount = async () => {
        console.log("Buscando contagem de comunidades...");
        const result = await fetchWithTimeout(async () => {
          const { count, error } = await supabase
            .from('communities')
            .select('*', { count: 'exact', head: true });
            
          if (error) throw error;
          return { count: count || 0 };
        });
        
        return result.count || 0;
      };
      
      const fetchReportsCount = async () => {
        console.log("Buscando contagem de denúncias pendentes...");
        const result = await fetchWithTimeout(async () => {
          const { count, error } = await supabase
            .from('reports')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');
            
          if (error) throw error;
          return { count: count || 0 };
        });
        
        return result.count || 0;
      };
      
      console.log("Executando todas as consultas de estatísticas em paralelo...");
      
      // Usar Promise.allSettled para continuar mesmo que algumas promessas falhem
      const results = await Promise.allSettled([
        fetchUsersCount(),
        fetchPostsCount(),
        fetchCommunitiesCount(),
        fetchReportsCount()
      ]);
      
      // Processar os resultados e usar valores padrão para os que falharam
      const userCount = results[0].status === 'fulfilled' ? results[0].value : 0;
      const postCount = results[1].status === 'fulfilled' ? results[1].value : 0;
      const communityCount = results[2].status === 'fulfilled' ? results[2].value : 0;
      const reportCount = results[3].status === 'fulfilled' ? results[3].value : 0;
      
      // Verificar e logar resultados rejeitados
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const entities = ['users', 'posts', 'communities', 'reports'];
          console.error(`Falha ao carregar estatísticas para ${entities[index]}:`, result.reason);
        }
      });
      
      const newStats = {
        users: userCount,
        posts: postCount,
        communities: communityCount,
        reports: reportCount
      };
      
      console.log("Estatísticas carregadas com sucesso:", newStats);
      setStats(newStats);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
      setIsLoading(false);
      toast.error("Não foi possível carregar as estatísticas", { position: "bottom-right" });
      return false;
    } finally {
      // Garantir que isLoading seja sempre definido como false
      setIsLoading(false);
    }
  }, []);

  return {
    stats,
    loadStats,
    isLoading
  };
};

export default useAdminStats;
