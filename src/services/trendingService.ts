import { supabase } from "@/integrations/supabase/client";
import { PostData } from "./postService";

export interface TrendingPost {
  id: string;
  title: string;
  author: string;
  authorId: string;
  authorAvatar?: string;
  likes: number;
  comments: number;
  views: number;
  isTrending: boolean;
}

/**
 * Busca os posts em destaque (trending) do banco de dados
 * @returns Array de posts em destaque
 */
export async function fetchTrendingPosts(): Promise<TrendingPost[]> {
  try {
    console.log("Buscando configurações de trending...");
    // Buscar configurações de trending
    const { data: settingsData, error: settingsError } = await supabase
      .from('trending_settings')
      .select('*')
      .single();
      
    if (settingsError) {
      console.error("Erro ao buscar configurações:", settingsError);
      throw settingsError;
    }
    
    const settings = settingsData || { min_likes: 5, min_comments: 2, timeframe_hours: 24 };
    console.log("Configurações carregadas:", settings);
    
    // Calcular o limite de data baseado no timeframe
    const timeframeHours = settings.timeframe_hours || 24;
    const dateLimit = new Date();
    dateLimit.setHours(dateLimit.getHours() - timeframeHours);
    const dateLimitStr = dateLimit.toISOString();
    
    console.log("Buscando posts em alta...");
    // Primeiro, tenta buscar posts marcados manualmente como trending
    const { data: manualTrending, error: manualError } = await supabase
      .from('posts')
      .select(`
        id,
        content,
        user_id,
        likes_count,
        comments_count,
        views_count,
        is_trending,
        created_at
      `)
      .eq('is_trending', true)
      .order('likes_count', { ascending: false });
      
    if (manualError) {
      console.error("Erro ao buscar posts em alta:", manualError);
      throw manualError;
    }
    
    // Se não tiver posts marcados manualmente, busca os mais populares com base nas configurações
    if (!manualTrending || manualTrending.length === 0) {
      console.log("Nenhum post marcado manualmente como trending. Buscando posts populares baseados nas configurações...");
      const { data: autoTrending, error: autoError } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          user_id,
          likes_count,
          comments_count,
          views_count,
          created_at
        `)
        .gte('likes_count', settings.min_likes)
        .gte('comments_count', settings.min_comments)
        .gte('created_at', dateLimitStr)
        .order('likes_count', { ascending: false })
        .limit(5);
        
      if (autoError) {
        console.error("Erro ao buscar posts populares:", autoError);
        throw autoError;
      }
      
      if (!autoTrending || autoTrending.length === 0) {
        console.log("Nenhum post atende aos critérios de trending. Retornando array vazio.");
        return [];
      }
      
      // Buscar informações de perfil para os posts
      const userIds = [...new Set(autoTrending.map(post => post.user_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);
        
      if (profilesError) {
        console.error("Erro ao buscar perfis:", profilesError);
        throw profilesError;
      }
      
      // Criar um mapa de perfis para acesso rápido
      const profileMap = new Map();
      profiles?.forEach(profile => {
        profileMap.set(profile.id, profile);
      });
      
      console.log(`Encontrados ${autoTrending.length} posts populares.`);
      
      return autoTrending.map(post => {
        const profile = profileMap.get(post.user_id) || { full_name: 'Usuário', avatar_url: null };
        console.log(`Post ID ${post.id}: likes=${post.likes_count}, comments=${post.comments_count}, views=${post.views_count}`);
          
        return {
          id: post.id,
          title: post.content ? (post.content.substring(0, 80) + (post.content.length > 80 ? '...' : '')) : 'Sem conteúdo',
          author: profile.full_name || 'Usuário',
          authorId: post.user_id,
          authorAvatar: profile.avatar_url,
          likes: typeof post.likes_count === 'number' ? post.likes_count : 0,
          comments: typeof post.comments_count === 'number' ? post.comments_count : 0,
          views: typeof post.views_count === 'number' ? post.views_count : 0,
          isTrending: false
        };
      });
    }
    
    // Buscar informações de perfil para os posts em alta
    const userIds = [...new Set(manualTrending.map(post => post.user_id))];
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', userIds);
      
    if (profilesError) {
      console.error("Erro ao buscar perfis:", profilesError);
      throw profilesError;
    }
    
    // Criar um mapa de perfis para acesso rápido
    const profileMap = new Map();
    profiles?.forEach(profile => {
      profileMap.set(profile.id, profile);
    });
    
    console.log(`Encontrados ${manualTrending.length} posts marcados como trending.`);
    
    return manualTrending.map(post => {
      const profile = profileMap.get(post.user_id) || { full_name: 'Usuário', avatar_url: null };
      console.log(`Post ID ${post.id}: likes=${post.likes_count}, comments=${post.comments_count}, views=${post.views_count}`);
        
      return {
        id: post.id,
        title: post.content ? (post.content.substring(0, 80) + (post.content.length > 80 ? '...' : '')) : 'Sem conteúdo',
        author: profile.full_name || 'Usuário',
        authorId: post.user_id,
        authorAvatar: profile.avatar_url,
        likes: typeof post.likes_count === 'number' ? post.likes_count : 0,
        comments: typeof post.comments_count === 'number' ? post.comments_count : 0,
        views: typeof post.views_count === 'number' ? post.views_count : 0,
        isTrending: post.is_trending || false
      };
    });
  } catch (error) {
    console.error("Erro ao buscar posts em alta:", error);
    throw error;
  }
}
