
import { supabase, retryOperation } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { queryWithRetry, checkSupabaseAvailability, waitForConnection, isOnline } from "../../hooks/utils/queryUtils";
import { PostgrestSingleResponse } from "@supabase/supabase-js";
import { Community, mapFromSupabase } from "../types";

const MAX_CONNECTION_ATTEMPTS = 3;
const CONNECTION_CHECK_INTERVAL = 60000; // 1 minuto
const CACHE_TTL = 300000; // 5 minutos para cache

// Variável para controlar a última vez que a conexão foi verificada
let lastConnectionCheck = 0;

// Cache simples para armazenar resultados
const resultsCache = new Map<string, { data: any; timestamp: number }>();

// Função auxiliar para criar objetos Community seguros
const safeCommunityMapper = (item: any): Community => {
  // Check if it's a valid object
  if (!item || typeof item !== 'object') {
    return {
      id: String(Date.now()),
      name: 'Error Loading',
      description: 'Could not load community data',
      members: 0,
      posts: 0,
      visibility: 'public',
      postingRestrictions: 'all_members',
      createdAt: new Date().toISOString()
    };
  }
  
  return {
    id: item.id || String(Date.now()),
    name: item.name || 'Unnamed Community',
    description: item.description || '',
    members: typeof item.members === 'number' ? item.members : 0,
    posts: typeof item.posts === 'number' ? item.posts : 0,
    visibility: (item.visibility as "public" | "private") || 'public',
    postingRestrictions: (item.posting_restrictions as "all_members" | "admin_only") || 'all_members',
    createdAt: item.created_at || new Date().toISOString(),
    updatedAt: item.updated_at,
    categoryId: item.category_id
  };
};

// Função para verificar e manter a conexão com o Supabase
const ensureConnection = async (): Promise<boolean> => {
  const now = Date.now();
  
  // Verificar apenas se passou o tempo de intervalo desde a última verificação
  if (now - lastConnectionCheck > CONNECTION_CHECK_INTERVAL) {
    console.log("Verificando conexão com Supabase...");
    lastConnectionCheck = now;
    
    // Se o dispositivo estiver offline, esperar pela conexão
    if (!isOnline()) {
      console.log("Dispositivo está offline. Aguardando conexão...");
      await waitForConnection(5000);
    }
    
    // Verificar se o Supabase está disponível
    const available = await checkSupabaseAvailability(supabase as any);
    if (!available) {
      console.warn("Conexão com Supabase está instável ou indisponível");
      return false;
    }
    
    console.log("Conexão com Supabase está ativa");
  }
  
  return true;
};

// Função auxiliar para obter um item do cache
const getFromCache = <T>(cacheKey: string): T | null => {
  const cached = resultsCache.get(cacheKey);
  if (!cached) return null;
  
  const now = Date.now();
  if (now - cached.timestamp > CACHE_TTL) {
    // Cache expirado
    resultsCache.delete(cacheKey);
    return null;
  }
  
  return cached.data as T;
};

// Função auxiliar para salvar no cache
const saveToCache = <T>(cacheKey: string, data: T): void => {
  resultsCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
};

export const clearAllCache = () => {
  resultsCache.clear();
  console.log("Cache completo limpo");
};

export const fetchCommunities = async (skipCache = false) => {
  // Verificar cache primeiro
  const cacheKey = 'all_communities';
  if (!skipCache) {
    const cachedData = getFromCache<any[]>(cacheKey);
    if (cachedData) {
      console.log("Usando dados em cache para comunidades");
      return cachedData;
    }
  }
  
  let attempts = 0;
  
  while (attempts < MAX_CONNECTION_ATTEMPTS) {
    try {
      // Verificar conexão antes de fazer a consulta
      const isConnected = await ensureConnection();
      if (!isConnected) {
        console.log(`Tentativa ${attempts + 1}/${MAX_CONNECTION_ATTEMPTS}: Aguardando conexão...`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Aguardar 2 segundos
        attempts++;
        continue;
      }
      
      console.log("Executando consulta direta de comunidades...");
      
      // Usando retryOperation da função do cliente Supabase
      const { data, error } = await retryOperation(async () => {
        return await supabase
          .from('communities')
          .select('*')
          .order('name');
      }, 3);
      
      if (error) {
        console.error("Erro ao buscar comunidades:", error);
        toast.error(`Erro ao carregar comunidades: ${error.message}`);
        return [];
      }
      
      // Fix: Type guard to ensure data is an array before using map
      if (!Array.isArray(data)) {
        console.error("Dados retornados não são um array:", data);
        return [];
      }
      
      // Map safely with explicit type handling
      const safeData = data.map(safeCommunityMapper);
      
      // Salvar no cache
      saveToCache(cacheKey, safeData);
      
      console.log("Comunidades carregadas com sucesso:", safeData.length);
      
      return safeData || [];
    } catch (error) {
      console.error(`Tentativa ${attempts + 1}/${MAX_CONNECTION_ATTEMPTS} falhou:`, error);
      attempts++;
      
      // Aguardar antes de tentar novamente
      if (attempts < MAX_CONNECTION_ATTEMPTS) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  
  console.error(`Todas as ${MAX_CONNECTION_ATTEMPTS} tentativas falharam`);
  toast.error("Não foi possível carregar as comunidades. Tente novamente mais tarde.");
  return [];
};

// Função para buscar comunidades por ID de categoria
export const fetchCommunitiesByCategory = async (categoryId: string, skipCache = false) => {
  // Verificar cache primeiro
  const cacheKey = `communities_by_category_${categoryId}`;
  if (!skipCache) {
    const cachedData = getFromCache<any[]>(cacheKey);
    if (cachedData) {
      console.log(`Usando dados em cache para categoria ${categoryId}`);
      return cachedData;
    }
  }
  
  try {
    // Verificar conexão antes de fazer a consulta
    const isConnected = await ensureConnection();
    if (!isConnected) {
      console.warn("Conexão com Supabase está instável ou indisponível");
      return [];
    }
    
    console.log(`Executando consulta de comunidades para a categoria ${categoryId}...`);
    
    // Usar retryOperation do cliente Supabase
    const { data, error } = await retryOperation(async () => {
      return await supabase
        .from('communities')
        .select('*')
        .eq('category_id', categoryId as any)
        .order('name');
    }, 3);
    
    if (error) {
      console.error(`Erro ao buscar comunidades da categoria ${categoryId}:`, error);
      return [];
    }
    
    // Map safely with explicit type handling
    const safeData = Array.isArray(data) ? data.map(safeCommunityMapper) : [];
    
    // Salvar no cache
    saveToCache(cacheKey, safeData);
    
    console.log(`Comunidades da categoria ${categoryId} carregadas:`, safeData?.length || 0);
    return safeData || [];
  } catch (error) {
    console.error(`Erro ao buscar comunidades da categoria:`, error);
    return [];
  }
};

// Limpar cache forçadamente 
export const clearCommunitiesCache = () => {
  // Remove todas as entradas de cache relacionadas a comunidades
  const keysToDelete: string[] = [];
  
  resultsCache.forEach((_, key) => {
    if (key === 'all_communities' || key.startsWith('communities_by_category_')) {
      keysToDelete.push(key);
    }
  });
  
  keysToDelete.forEach(key => resultsCache.delete(key));
  
  console.log(`Cache de comunidades limpo: ${keysToDelete.length} entradas removidas`);
};

// Obter comunidade por ID
export const fetchCommunityById = async (communityId: string) => {
  // Verificar cache primeiro
  const cacheKey = `community_${communityId}`;
  const cachedData = getFromCache(cacheKey);
  if (cachedData) {
    console.log(`Usando dados em cache para comunidade ${communityId}`);
    return cachedData;
  }
  
  try {
    // Verificar conexão antes de fazer a consulta
    const isConnected = await ensureConnection();
    if (!isConnected) {
      console.warn("Conexão com Supabase está instável ou indisponível");
      return null;
    }
    
    console.log(`Buscando comunidade ${communityId}...`);
    
    const { data, error } = await retryOperation(async () => {
      return await supabase
        .from('communities')
        .select('*, categories:category_id(id, name, slug)')
        .eq('id', communityId as any)
        .single();
    }, 3);
    
    if (error) {
      console.error(`Erro ao buscar comunidade ${communityId}:`, error);
      return null;
    }
    
    // Safely map the data
    const safeCommunity = data ? safeCommunityMapper(data) : null;
    
    // Salvar no cache
    if (safeCommunity) {
      saveToCache(cacheKey, safeCommunity);
    }
    
    return safeCommunity;
  } catch (error) {
    console.error(`Erro ao buscar comunidade:`, error);
    return null;
  }
};

// Buscar comunidades sem categoria
export const fetchCommunitiesWithoutCategory = async (skipCache = false) => {
  // Verificar cache primeiro
  const cacheKey = 'communities_without_category';
  if (!skipCache) {
    const cachedData = getFromCache<any[]>(cacheKey);
    if (cachedData) {
      console.log("Usando dados em cache para comunidades sem categoria");
      return cachedData;
    }
  }
  
  try {
    // Verificar conexão antes de fazer a consulta
    const isConnected = await ensureConnection();
    if (!isConnected) {
      console.warn("Conexão com Supabase está instável ou indisponível");
      return [];
    }
    
    console.log("Buscando comunidades sem categoria...");
    
    const { data, error } = await retryOperation(async () => {
      return await supabase
        .from('communities')
        .select('*')
        .is('category_id', null)
        .order('name');
    }, 3);
    
    if (error) {
      console.error("Erro ao buscar comunidades sem categoria:", error);
      return [];
    }
    
    // Map safely with explicit type handling
    const safeData = Array.isArray(data) ? data.map(safeCommunityMapper) : [];
    
    // Salvar no cache
    saveToCache(cacheKey, safeData);
    
    console.log("Comunidades sem categoria carregadas:", safeData?.length || 0);
    return safeData || [];
  } catch (error) {
    console.error("Erro ao buscar comunidades sem categoria:", error);
    return [];
  }
};
