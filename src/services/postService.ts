import { supabase } from "@/integrations/supabase/client";
import { isAdminByEmail } from "@/utils/adminUtils";

// Interface para as opções de consulta de posts
export interface PostQueryOptions {
  page?: number;
  pageSize?: number;
  communityId?: string;
  authorId?: string;
  postId?: string;
  isPinned?: boolean;
}

// Interface para as opções de busca de posts
export interface FetchPostsOptions {
  page?: number;
  pageSize?: number;
  limit?: number;
  communityId?: string;
  authorId?: string;
  postId?: string;
  categoryId?: string;
  isPinned?: boolean;
  includeDeleted?: boolean;
}

// Interface para os dados de um post
export interface PostData {
  id: string;
  title?: string;
  content: string;
  authorId: string;
  author: {
    id: string;
    name: string;
    avatar: any;
  };
  communityId: string | null;
  categoryId?: string;
  createdAt: string;
  likes: number;
  comments: number;
  isPinned: boolean;
  isDeleted?: boolean;
  media: any;
}

/**
 * Verifica se um post é válido
 */
export function isValidPost(post: any): post is Record<string, any> {
  return post !== null &&
    typeof post === 'object' &&
    !('error' in post && post.error === true);
}

/**
 * Busca posts com base nas opções fornecidas
 */
export async function getPosts(options: PostQueryOptions = {}) {
  try {
    console.log("getPosts iniciado com opções:", options);
    
    // Inicia a query
    let query = supabase
      .from('posts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Filtra por comunidade se especificado
    if (options.communityId) {
      query = query.eq('community_id', options.communityId);
    }

    // Filtra por autor se especificado
    if (options.authorId) {
      query = query.eq('author_id', options.authorId);
    }

    // Filtra por id se especificado
    if (options.postId) {
      query = query.eq('id', options.postId);
    }

    // Filtra por posts fixados se especificado
    if (options.isPinned !== undefined) {
      query = query.eq('is_pinned', options.isPinned);
    }

    // Tenta filtrar posts excluídos
    try {
      query = query.eq('is_deleted', false);
    } catch (err) {
      console.log("Aviso: Não foi possível filtrar por is_deleted");
    }

    // Aplica paginação
    if (options.page !== undefined && options.pageSize !== undefined) {
      const start = options.page * options.pageSize;
      const end = start + options.pageSize - 1;
      query = query.range(start, end);
    }

    // Executa a query
    const { data, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar posts:', error);
      return { posts: [], totalCount: 0 };
    }

    // Obtemos dados de todos os usuários mencionados nos posts
    const userIds = data.map(post => post.user_id).filter(Boolean);
    const uniqueUserIds = [...new Set(userIds)];
    
    // Buscar dados do usuário autenticado
    const { data: userData } = await supabase.auth.getUser();
    const currentUser = userData?.user;
    
    console.log("Usuário atual:", currentUser?.id, currentUser?.email);
    
    // Função para buscar o perfil do usuário autenticado de forma temporária
    const getCurrentUserProfile = async () => {
      // Tenta obter os dados do usuário autenticado
      if (currentUser?.id) {
        try {
          const { data: authProfiles } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();
            
          if (authProfiles) {
            console.log("Perfil do usuário encontrado:", authProfiles);
            return {
              id: currentUser.id,
              name: authProfiles.full_name || authProfiles.username || currentUser.email?.split('@')[0] || 'Vinicius',
              avatar: authProfiles.avatar_url
            };
          }
        } catch (err) {
          console.log("Erro ao buscar perfil do usuário autenticado", err);
        }
      }
      
      // Fallback para dados padrão do usuário
      return {
        id: currentUser?.id || 'unknown',
        name: currentUser?.email?.split('@')[0] || 'Vinicius',
        avatar: null
      };
    };
    
    // Obter perfil do usuário atual
    const currentProfile = await getCurrentUserProfile();
    
    // Verifica os IDs dos posts
    console.log("IDs de usuários nos posts:", uniqueUserIds);
    
    // Cria um mapa para acessar os perfis rapidamente
    const userProfiles = {};
    
    // Adiciona o perfil do usuário atual ao mapa
    userProfiles[currentProfile.id] = {
      name: currentProfile.name,
      avatar: currentProfile.avatar
    };
    
    console.log("Mapa de perfis:", userProfiles);
    
    // Transforma os dados para o formato esperado
    const postsData = data.map(post => {
      // Obtém os dados do autor do post
      const userId = post.user_id || 'unknown';
      const userProfile = userProfiles[userId] || { name: 'Usuário', avatar: null };
      
      // Verifica se o post foi criado pelo usuário atual
      const isCurrentUserPost = userId === currentUser?.id;
      
      // Obtém o nome do perfil do banco de dados ou do objeto de usuário autenticado
      let authorName = userProfile.name;
      if (isCurrentUserPost && (!authorName || authorName === 'Usuário')) {
        // Tenta usar o nome do perfil atual
        if (currentProfile?.name && currentProfile.name !== 'Usuário') {
          authorName = currentProfile.name;
        } else if (currentUser?.email) {
          // Usa o nome de usuário do e-mail como fallback
          authorName = currentUser.email.split('@')[0];
          // Capitaliza a primeira letra
          authorName = authorName.charAt(0).toUpperCase() + authorName.slice(1);
        }
      }
      
      const author = {
        id: userId,
        name: authorName || 'Usuário',
        avatar: userProfile.avatar
      };
      
      // Log detalhado para debug
      if (isCurrentUserPost) {
        console.log("Post do usuário atual!", userId, "nome:", author.name, "email:", currentUser?.email);
      }

      // Formata o post
      return {
        id: post.id || 'unknown',
        title: post.title || '',
        content: post.content || '',
        authorId: userId,
        author,
        communityId: post.community_id || null,
        categoryId: post.category_id || null,
        createdAt: post.created_at || new Date().toISOString(),
        likes: post.likes_count || 0,
        comments: post.comments_count || 0,
        isPinned: post.is_pinned || false,
        isDeleted: post.is_deleted || false,
        media: post.media_data || null
      };
    });
    
    console.log(`Posts processados: ${postsData.length}`, postsData.map(p => p.author.name));
    
    return { posts: postsData, totalCount: count || 0 };
  } catch (error) {
    console.error('Erro geral ao buscar posts:', error);
    return { posts: [], totalCount: 0 };
  }
}

/**
 * Busca posts para o feed (alias para getPosts com interface compatível)
 */
export async function fetchPosts(options: FetchPostsOptions = {}) {
  try {
    console.log("fetchPosts chamado com opções:", options);
    
    const queryOptions: PostQueryOptions = {
      page: options.page || 0,
      pageSize: options.pageSize || options.limit || 20,
      communityId: options.communityId,
      authorId: options.authorId,
      postId: options.postId,
      isPinned: options.isPinned
    };
    
    console.log("Consultando posts com:", queryOptions);
    const result = await getPosts(queryOptions);
    console.log(`Encontrados ${result.posts.length} posts`);
    
    // Filtra por categoria se especificado
    let filteredPosts = result.posts;
    if (options.categoryId) {
      console.log(`Filtrando por categoria: ${options.categoryId}`);
      filteredPosts = filteredPosts.filter(post => {
        // Verifica se o post tem a categoria especificada
        return post.categoryId === options.categoryId;
      });
      console.log(`Após filtro de categoria: ${filteredPosts.length} posts`);
    }
    
    // Processa posts excluídos se necessário
    if (!options.includeDeleted) {
      filteredPosts = filteredPosts.filter(post => !post.isDeleted);
      console.log(`Após filtro de excluídos: ${filteredPosts.length} posts`);
    } else {
      // Substitui conteúdo de posts excluídos
      filteredPosts = filteredPosts.map(post => {
        if (post.isDeleted) {
          return {
            ...post,
            content: "[Este post foi removido por um administrador]",
            title: "[Post removido]"
          };
        }
        return post;
      });
    }
    
    return { 
      posts: filteredPosts, 
      totalCount: filteredPosts.length 
    };
  } catch (error) {
    console.error('Erro ao buscar posts:', error);
    return { posts: [], totalCount: 0 };
  }
}

/**
 * Fixa ou desfixa um post (apenas administradores podem fazer isso)
 */
export async function togglePinPost(postId: string, isPinned: boolean, userEmail?: string): Promise<boolean> {
  try {
    // Verifica se o usuário é administrador
    if (!isAdminByEmail(userEmail)) {
      console.error("Apenas administradores podem fixar/desfixar posts");
      return false;
    }
    
    // Atualiza o post
    const { error } = await supabase
      .from('posts')
      .update({ is_pinned: isPinned })
      .eq('id', postId);
      
    if (error) {
      console.error(`Erro ao ${isPinned ? 'fixar' : 'desfixar'} post:`, error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Erro ao ${isPinned ? 'fixar' : 'desfixar'} post:`, error);
    return false;
  }
}

/**
 * Exclui um post (apenas o autor ou um administrador pode fazer isso)
 */
export async function deletePost(
  postId: string,
  userEmail: string | undefined,
  userId: string | undefined
) {
  try {
    // Verifica se o post existe
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      console.error('Erro ao buscar post para exclusão:', postError);
      return { success: false, error: 'Post não encontrado' };
    }

    // Verifica se o usuário é o autor do post ou um administrador
    const authorId = post.user_id;
    const isAdmin = isAdminByEmail(userEmail);
    const isAuthor = authorId === userId;

    if (!isAdmin && !isAuthor) {
      return { 
        success: false, 
        error: 'Você não tem permissão para excluir este post' 
      };
    }

    // Marca o post como excluído (soft delete)
    const { error: deleteError } = await supabase
      .from('posts')
      .update({ is_deleted: true })
      .eq('id', postId);

    if (deleteError) {
      console.error('Erro ao excluir post:', deleteError);
      return { success: false, error: 'Erro ao excluir post' };
    }

    return { success: true };
  } catch (error) {
    console.error('Erro geral ao excluir post:', error);
    return { success: false, error: 'Erro interno ao excluir post' };
  }
}

/**
 * Força a exclusão permanente de um post (apenas administradores podem fazer isso)
 * Esta função remove permanentemente o post do banco de dados
 */
export async function forceDeletePost(postId: string, userEmail: string | undefined) {
  try {
    // Verifica se o usuário é um administrador
    if (!isAdminByEmail(userEmail)) {
      return { 
        success: false, 
        error: 'Apenas administradores podem excluir permanentemente posts' 
      };
    }
    
    // Verifica se o post existe
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id')
      .eq('id', postId)
      .single();
      
    if (postError || !post) {
      console.error('Erro ao buscar post para exclusão permanente:', postError);
      return { success: false, error: 'Post não encontrado' };
    }
    
    // Exclui permanentemente o post
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);
      
    if (deleteError) {
      console.error('Erro ao excluir permanentemente o post:', deleteError);
      return { success: false, error: 'Erro ao excluir permanentemente o post' };
    }
    
    // Registra a ação administrativa
    console.log(`Post ${postId} excluído permanentemente pelo administrador ${userEmail}`);
    
    return { 
      success: true, 
      message: 'Post excluído permanentemente com sucesso' 
    };
  } catch (error) {
    console.error('Erro geral ao excluir permanentemente o post:', error);
    return { success: false, error: 'Erro interno ao excluir permanentemente o post' };
  }
}

/**
 * Busca comunidades
 */
export async function getCommunities() {
  try {
    const { data, error } = await supabase
      .from('communities')
      .select('id, name, posting_restrictions');

    if (error) {
      console.error("Erro ao buscar comunidades:", error);
      return [];
    }

    return data.map(community => ({
      id: community.id,
      name: community.name,
      posting_restrictions: community.posting_restrictions || 'all_members'
    }));
  } catch (error) {
    console.error("Erro ao buscar comunidades:", error);
    return [];
  }
}

/**
 * Busca comunidades para o formulário de criação de posts
 */
export async function fetchCommunities(): Promise<Array<{id: string, name: string, posting_restrictions: string}>> {
  try {
    const { data, error } = await supabase
      .from('communities')
      .select('id, name, posting_restrictions')
      .order('name');
      
    if (error) {
      console.error("Erro ao buscar comunidades:", error);
      return [];
    }
    
    return data.map(community => ({
      id: community.id,
      name: community.name,
      posting_restrictions: community.posting_restrictions || 'all_members'
    }));
  } catch (error) {
    console.error("Erro ao buscar comunidades:", error);
    return [];
  }
}

/**
 * Busca categorias para o formulário de criação de posts
 */
export async function fetchCategories(): Promise<Array<{id: string, name: string, slug: string}>> {
  try {
    console.log("Buscando categorias da tabela community_categories para posts...");
    const { data, error } = await supabase
      .from('community_categories')
      .select('id, name, slug');
      
    if (error) {
      console.error("Erro ao buscar categorias:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Erro ao buscar categorias:", error);
    return [];
  }
}

/**
 * Função auxiliar para converter arquivo para base64
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

/**
 * Faz upload de uma imagem
 */
export async function uploadImage(imageFile: File): Promise<string | null> {
  try {
    // Para simplificar, vamos usar base64 diretamente
    const base64Image = await fileToBase64(imageFile);
    return base64Image;
  } catch (error) {
    console.error("Erro ao fazer upload da imagem:", error);
    return null;
  }
}

/**
 * Faz upload de um GIF
 */
export async function uploadGif(gifFile: File): Promise<string | null> {
  try {
    // Mesmo processo que imagens
    const base64Gif = await fileToBase64(gifFile);
    return base64Gif;
  } catch (error) {
    console.error("Erro ao fazer upload do GIF:", error);
    return null;
  }
}

/**
 * Faz upload de um vídeo
 */
export async function uploadVideo(videoFile: File): Promise<string | null> {
  try {
    // Para vídeos, vamos usar diretamente o base64 também
    const base64Video = await fileToBase64(videoFile);
    return base64Video;
  } catch (error) {
    console.error("Erro ao processar o vídeo:", error);
    return null;
  }
}

/**
 * Cria um novo post
 */
export async function createPost({
  content,
  category_id,
  communityId,
  media,
  poll
}: {
  content: string;
  category_id: string;
  communityId: string | null;
  media?: {
    type: "image" | "video" | "gif";
    url: string;
    aspectRatio?: number;
  }[];
  poll?: {
    question: string;
    options: string[];
  };
}): Promise<string | null> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const user_id = userData?.user?.id;
    
    if (!user_id) {
      console.error("Usuário não autenticado");
      return null;
    }
    
    const postData: any = {
      content,
      category_id,
      community_id: communityId || null,
      user_id,
      title: content.substring(0, 50)
    };
    
    if (media && media.length > 0) {
      postData.media_data = media;
    }
    
    if (poll) {
      postData.poll_data = poll;
    }
    
    const { data, error } = await supabase
      .from("posts")
      .insert(postData)
      .select()
      .single();
      
    if (error) {
      console.error("Erro ao criar post:", error);
      throw error;
    }
    
    return data?.id || null;
  } catch (error) {
    console.error("Erro ao criar post:", error);
    return null;
  }
}

/**
 * Vota em uma enquete
 * @param postId ID do post que contém a enquete
 * @param optionIndex Índice da opção escolhida
 * @returns true se o voto foi registrado com sucesso
 */
export async function votePoll(postId: string, optionIndex: number): Promise<boolean> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    
    if (!userId) {
      console.error("Usuário não autenticado");
      return false;
    }
    
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("*")
      .eq("id", postId)
      .single();
      
    if (postError) {
      console.error("Erro ao buscar post:", postError);
      return false;
    }
    
    let pollData;
    try {
      if (typeof post.poll_data === 'string') {
        pollData = JSON.parse(post.poll_data);
      } else {
        pollData = post.poll_data;
      }
    } catch (e) {
      console.error("Formato de dados da enquete inválido:", e);
      return false;
    }
    
    if (!pollData || !pollData.options || optionIndex >= pollData.options.length) {
      console.error("Dados da enquete inválidos ou índice de opção inválido");
      return false;
    }
    
    const votes = pollData.votes || {};
    const selectedOption = pollData.options[optionIndex];
    
    votes[selectedOption] = (votes[selectedOption] || 0) + 1;
    
    const updatedPollData = {
      ...pollData,
      votes,
      userVotes: {
        ...(pollData.userVotes || {}),
        [userId]: selectedOption
      }
    };
    
    const { error: updateError } = await supabase
      .from("posts")
      .update({
        poll_data: updatedPollData
      })
      .eq("id", postId);
      
    if (updateError) {
      console.error("Erro ao atualizar votos da enquete:", updateError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Erro ao votar na enquete:", error);
    return false;
  }
}
