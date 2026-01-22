import { supabase } from "@/integrations/supabase/client";
import { getUserProfile, formatAuthor } from "./userService";
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

// Interface para as opções de query de posts
export interface PostQueryOptions {
  communityId?: string;
  authorId?: string;
  postId?: string;
  page?: number;
  pageSize?: number;
  isPinned?: boolean;
  categoryId?: string;
}

// Interface para as opções de busca de posts para o feed
export interface FetchPostsOptions {
  communityId?: string;
  userId?: string;
  postId?: string;
  page?: number;
  pageSize?: number;
  isPinned?: boolean;
  categoryId?: string;
  showDeleted?: boolean;
  limit?: number;
  includeDeleted?: boolean;
}

// Interface para dados completos de um post
export interface PostData {
  id: string;
  title?: string;
  content: string;
  authorId: string | null;
  author: {
    id: string;
    name: string;
    avatar: string | null;
  };
  communityId: string | null;
  categoryId: string | null;
  category?: {
    id: string;
    name: string;
    slug?: string;
  } | null;
  createdAt: string;
  likes: number;
  comments: number;
  isPinned: boolean;
  isDeleted?: boolean;
  media?: {
    type: "image" | "video" | "gif";
    url: string;
    aspectRatio?: number;
  }[];
  poll?: {
    question: string;
    options: string[];
  };
}

interface PostResult {
  posts: any[];
  totalCount: number;
}

interface DeleteResult {
  success: boolean;
  error?: string;
}

/**
 * Busca posts com base nas opções fornecidas
 */
export async function getPosts(options: PostQueryOptions = {}): Promise<PostResult> {
  try {
    // Inicia a query
    let query = supabase
      .from('posts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Aplica filtros
    if (options.communityId) {
      query = query.eq('community_id', options.communityId);
    }

    if (options.authorId) {
      query = query.eq('author_id', options.authorId);
    }

    if (options.postId) {
      query = query.eq('id', options.postId);
    }

    if (options.categoryId) {
      query = query.eq('category_id', options.categoryId);
    }

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

    // Obter usuário atual da sessão do Supabase
    const { data: sessionData } = await supabase.auth.getSession();
    const currentUser = sessionData?.session?.user;

    console.log("Usuário atual:", currentUser?.id, currentUser?.email);

    return {
      posts: data || [],
      totalCount: count || 0
    };
  } catch (error) {
    console.error("Erro geral ao buscar posts:", error);
    return { posts: [], totalCount: 0 };
  }
}

/**
 * Busca posts formatados para o feed
 */
export async function fetchPosts(options: FetchPostsOptions = {}): Promise<{ posts: PostData[], totalCount: number }> {
  try {
    console.log("fetchPosts iniciado com opções:", options);
    
    // Buscar categorias primeiro para poder mapear os IDs para nomes
    const categoriesData = await fetchCategories();
    const categoriesMap = new Map();
    
    // Criar um mapa de ID de categoria para objeto de categoria
    categoriesData.forEach(category => {
      categoriesMap.set(category.id, { 
        id: category.id, 
        name: category.name,
        slug: category.slug 
      });
    });
    
    console.log("Mapa de categorias carregado:", [...categoriesMap.entries()]);
    
    const { posts: rawPosts, totalCount } = await getPosts({
      communityId: options.communityId,
      authorId: options.userId,
      postId: options.postId,
      page: options.page,
      pageSize: options.pageSize || options.limit,
      isPinned: options.isPinned,
      categoryId: options.categoryId
    });
    
    // Transformar dados brutos em objetos PostData
    const formattedPosts: PostData[] = await Promise.all(rawPosts.map(async rawPost => {
      // Verificar se temos um user_id válido - o campo correto no Supabase é user_id
      const userId = rawPost.user_id;
      
      // Autor padrão para usar caso o ID seja inválido ou os dados de perfil não sejam encontrados
      let author = {
        id: userId || 'system',
        name: 'Usuário',
        avatar: null
      };
      
      // Tentar buscar dados do autor apenas se tivermos um ID válido
      if (userId) {
        try {
          // Usar a mesma lógica do CreatePostForm para buscar o perfil
          const { data: profileData } = await supabase
            .from('profiles')
            .select('avatar_url, full_name, username')
            .eq('id', userId)
            .single();
          
          if (profileData) {
            console.log(`[PostService] Profile encontrado para post ${rawPost.id}:`, profileData);
            author = {
              id: userId,
              name: profileData.full_name || profileData.username || 'Usuário',
              avatar: profileData.avatar_url
            };
          } else {
            console.warn(`[PostService] Perfil não encontrado para user_id ${userId}`);
          }
        } catch (err) {
          console.error(`[PostService] Erro ao buscar perfil para ${userId}:`, err);
        }
      } else {
        console.warn(`[PostService] Post ${rawPost.id} sem user_id válido`);
      }
      
      // Processar mídia, se existir
      const media = rawPost.media_data ? 
        (Array.isArray(rawPost.media_data) ? rawPost.media_data : [rawPost.media_data]) : 
        [];
      
      // Buscar a categoria pelo ID
      const categoryId = rawPost.category_id || null;
      
      console.log(`Post ${rawPost.id} - category_id: ${categoryId}`);
      
      // Usar o mapa de categorias para obter os detalhes da categoria
      let category = null;
      if (categoryId && categoriesMap.has(categoryId)) {
        category = categoriesMap.get(categoryId);
        console.log(`Categoria encontrada para post ${rawPost.id}:`, category);
      } else if (categoryId) {
        console.warn(`Categoria ID ${categoryId} não encontrada no mapa para post ${rawPost.id}`);
      }
      
      return {
        id: rawPost.id,
        title: rawPost.title || '',
        content: rawPost.content || '',
        authorId: userId,
        author: author,
        communityId: rawPost.community_id || null,
        categoryId: categoryId,
        // Adicionar o objeto de categoria completo
        category: category,  
        createdAt: rawPost.created_at || new Date().toISOString(),
        likes: rawPost.likes_count || 0,
        comments: rawPost.comments_count || 0,
        isPinned: rawPost.is_pinned || false,
        isDeleted: rawPost.is_deleted || false,
        media: media
      };
    }));
    
    // Filtra por categoria se especificado
    let filteredPosts = formattedPosts;
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
    
    console.log(`Posts formatados finais: ${filteredPosts.length}`);
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
    const isAdmin = await isAdminByEmail(userEmail || '');
    if (!isAdmin) {
      console.error("Apenas administradores podem fixar/desfixar posts");
      return false;
    }
    
    console.log(`Tentando ${isPinned ? 'fixar' : 'desfixar'} post ${postId} por ${userEmail}. É admin: ${isAdmin}`);
    
    // Atualiza o post
    const { error } = await supabase
      .from('posts')
      .update({ is_pinned: isPinned })
      .eq('id', postId);
      
    if (error) {
      console.error(`Erro ao ${isPinned ? 'fixar' : 'desfixar'} post:`, error);
      return false;
    }
    
    console.log(`Post ${postId} ${isPinned ? 'fixado' : 'desfixado'} com sucesso.`);
    return true;
  } catch (error) {
    console.error(`Erro ao ${isPinned ? 'fixar' : 'desfixar'} post:`, error);
    return false;
  }
}

/**
 * Exclui um post (apenas o autor ou um administrador pode fazer isso)
 * Otimizado para melhor desempenho
 */
export async function deletePost(
  postId: string,
  userEmail: string | undefined,
  userId: string | undefined
) {
  try {
    // Uma otimização importante: verificar rapidamente se é admin
    // para pular as verificações de autorização que são mais lentas
    const isAdmin = isAdminByEmail(userEmail);
    console.log(`Excluindo post ${postId}, usuário admin? ${isAdmin}`);
    
    // Se não for admin, verificar permissões
    if (!isAdmin && userId) {
      // Verifica se o post existe e se é autor
      const { data: post, error: postError } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', postId)
        .single();

      if (postError) {
        console.error('Erro ao buscar post para exclusão:', postError);
        return { success: false, error: 'Post não encontrado' };
      }

      // Se encontramos o post, verificar se é o autor
      if (post && post.user_id !== userId) {
        return { 
          success: false, 
          error: 'Você não tem permissão para excluir este post' 
        };
      }
    }

    // OTIMIZAÇÃO: Para que a UI responda mais rapidamente, fazemos a operação
    // de exclusão mas retornamos sucesso imediatamente, sem esperar a conclusão
    // isso deu a impressão da publicação desaparecer, mas o processo ainda continuar no backend
    
    // Iniciar a marcação de exclusão (soft delete), mas não esperar pela conclusão
    supabase
      .from('posts')
      .update({ is_deleted: true } as any)
      .eq('id', postId)
      .then(({ error }) => {
        if (error) {
          console.error('Erro ao excluir post (background):', error);
        } else {
          console.log(`Post ${postId} excluído com sucesso em background`);
        }
      });

    // Retorna sucesso imediatamente para melhorar a experiência do usuário
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
 * Função auxiliar para converter arquivo para base64 com verificação de tamanho
 */
async function fileToBase64(file: File): Promise<string> {
  // Verificar tamanho do arquivo (limitar a 10MB para evitar problemas)
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`Arquivo muito grande (${(file.size / (1024 * 1024)).toFixed(2)}MB). O tamanho máximo permitido é 10MB.`);
  }
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    // Adicionar eventos de progresso para arquivos grandes
    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100);
        console.log(`Progresso do upload: ${progress}%`);
      }
    };
    
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => {
      console.error("Erro no FileReader:", error);
      reject(error);
    };
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

export async function uploadVideo(videoFile: File): Promise<string | null> {
  try {
    // Verificar tipo do arquivo
    if (!videoFile.type.startsWith('video/')) {
      console.error("Tipo de arquivo inválido para vídeo:", videoFile.type);
      throw new Error("O arquivo selecionado não é um vídeo válido.");
    }
    
    console.log(`Iniciando upload de vídeo para o storage: ${videoFile.name} (${(videoFile.size / (1024 * 1024)).toFixed(2)}MB)`);
    
    // Gera um nome único para o arquivo
    const fileExt = videoFile.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `videos/${fileName}`;
    
    // Envia para o storage do Supabase
    const { data, error } = await supabase.storage
      .from('public')
      .upload(filePath, videoFile, {
        cacheControl: '3600',
        upsert: false
      });
      
    if (error) {
      console.error('Erro ao fazer upload de vídeo para o storage:', error);
      throw new Error(`Erro no upload: ${error.message}`);
    }
    
    // Obter a URL pública do vídeo
    const { data: publicUrlData } = supabase.storage
      .from('public')
      .getPublicUrl(filePath);
      
    const videoUrl = publicUrlData.publicUrl;
    console.log(`Upload de vídeo concluído! URL: ${videoUrl}`);
    
    return videoUrl;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao processar o vídeo";
    console.error("Erro ao processar o vídeo:", error);
    
    // Propagar o erro para que a interface possa mostrar uma mensagem adequada
    throw new Error(errorMessage);
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
  category_id: string | null;
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
    
    // Buscar informações completas do perfil do usuário antes de criar o post
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user_id)
      .single();
      
    console.log("[createPost] Perfil do usuário para novo post:", profileData);
    
    // Tratar a categoria_id vazia para evitar erros de UUID inválido
    let finalCategoryId = null;
    if (category_id && category_id.trim() !== "") {
      finalCategoryId = category_id;
    }
    
    console.log(`[createPost] category_id original: "${category_id}", finalCategoryId: ${finalCategoryId}`);
    
    const postData: any = {
      content,
      category_id: finalCategoryId, // Usar null quando a categoria está vazia
      community_id: communityId || null,
      user_id, // No Supabase, a coluna correta é user_id, não author_id
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
    
    if (data?.id) {
      // Usar a função getPosts com o ID do post criado para garantir que recebemos um objeto completo
      const { posts } = await getPosts({ postId: data.id });
      
      if (posts && posts.length > 0) {
        console.log("[createPost] Post criado e carregado com sucesso:", posts[0]);
        
        // Importante: Verificar se user_id foi definido corretamente
        // Não usamos author_id pois essa coluna não existe no schema atual
        if (!posts[0].user_id && user_id) {
          console.warn("[createPost] Post criado sem user_id! Atualizando...");
          await supabase
            .from("posts")
            .update({ user_id: user_id })
            .eq('id', data.id);
        }
      }
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
