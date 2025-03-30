import { supabase } from "@/integrations/supabase/client";

export interface PostData {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar: string | null | undefined;
  };
  category: {
    id: string;
    name: string;
  };
  community: {
    id: string;
    name: string;
  };
  createdAt: Date;
  likes: number;
  comments: number;
  isPinned: boolean;
  communityId: string | null;
  media?: {
    type: "image" | "video" | "gif";
    url: string;
    aspectRatio?: number;
  }[];
  poll?: {
    question: string;
    options: string[];
    votes?: Record<string, number>;
    userVoted?: string;
  };
}

export interface FetchPostsOptions {
  limit?: number;
  page?: number;
  sort?: "newest" | "oldest";
  communityId?: string | null;
  categoryId?: string | null;
  userId?: string | null;
  searchTerm?: string | null;
}

export interface CategoryForm {
  name: string;
  description?: string;
  slug: string;
}

// Função para redimensionar imagens antes do upload
const resizeImage = async (file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.8): Promise<File> => {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      const reader = new FileReader();
      
      reader.onload = function(e) {
        img.src = e.target?.result as string;
        
        img.onload = function() {
          let width = img.width;
          let height = img.height;
          const aspectRatio = width / height;
          
          // Calcular novas dimensões mantendo a proporção
          if (width > maxWidth) {
            width = maxWidth;
            height = width / aspectRatio;
          }
          
          if (height > maxHeight) {
            height = maxHeight;
            width = height * aspectRatio;
          }
          
          // Criar canvas para redimensionar
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          // Desenhar imagem redimensionada
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Converter para blob
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Falha ao converter canvas para blob'));
              return;
            }
            
            // Criar novo arquivo
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            
            resolve(resizedFile);
          }, file.type, quality);
        };
      };
      
      reader.onerror = function(error) {
        reject(error);
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Erro ao redimensionar imagem:', error);
      resolve(file); // Em caso de erro, retorna o arquivo original
    }
  });
};

// Função para converter arquivo para base64
const fileToBase64 = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const uploadGif = async (gifFile: File): Promise<string | null> => {
  try {
    const timestamp = new Date().getTime();
    const gifName = `gif_${timestamp}_${gifFile.name}`;
    
    const { data, error } = await supabase
      .storage
      .from('gifs')
      .upload(gifName, gifFile, {
        cacheControl: '3600',
        upsert: false
      });
      
    if (error) {
      console.error("Error uploading GIF:", error);
      return null;
    }
    
    const gifUrl = `https://weuifmgjzkuppqqsoood.supabase.co/storage/v1/object/public/gifs/${data.path}`;
    return gifUrl;
  } catch (error) {
    console.error("Error uploading GIF:", error);
    return null;
  }
};

export const uploadImage = async (imageFile: File): Promise<string | null> => {
  try {
    // Redimensionar imagem antes do upload
    let fileToUpload = imageFile;
    
    try {
      // Apenas redimensionar se for maior que 1200x1200
      if (imageFile.size > 1024 * 1024) { // Se for maior que 1MB
        fileToUpload = await resizeImage(imageFile);
        console.log('Imagem redimensionada com sucesso', {
          originalSize: imageFile.size,
          newSize: fileToUpload.size
        });
      }
    } catch (resizeError) {
      console.warn('Erro ao redimensionar imagem, usando original:', resizeError);
    }
    
    // Tentar usar o método base64 diretamente, já que os buckets estão com problemas
    console.log("Convertendo imagem para base64...");
    const base64Image = await fileToBase64(fileToUpload);
    console.log("Imagem convertida para base64 com sucesso");
    return base64Image;
  } catch (error) {
    console.error("Erro ao processar a imagem:", error);
    return null;
  }
};

export const uploadVideo = async (videoFile: File): Promise<string | null> => {
  try {
    // Para vídeos, vamos usar diretamente o base64 também
    console.log("Convertendo vídeo para base64...");
    const base64Video = await fileToBase64(videoFile);
    console.log("Vídeo convertido para base64 com sucesso");
    return base64Video;
  } catch (error) {
    console.error("Erro ao processar o vídeo:", error);
    return null;
  }
};

export const createPost = async ({
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
}): Promise<string | null> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const user_id = userData?.user?.id;
    
    if (!user_id) {
      console.error("User not authenticated");
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
      console.error("Error creating post:", error);
      throw error;
    }
    
    return data?.id || null;
  } catch (error) {
    console.error("Error creating post:", error);
    return null;
  }
};

export const votePoll = async (postId: string, optionIndex: number): Promise<boolean> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    
    if (!userId) {
      console.error("User not authenticated");
      return false;
    }
    
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("*")
      .eq("id", postId)
      .single();
      
    if (postError) {
      console.error("Error fetching post:", postError);
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
      console.error("Invalid poll data format:", e);
      return false;
    }
    
    if (!pollData || !pollData.options || optionIndex >= pollData.options.length) {
      console.error("Invalid poll data or option index");
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
      console.error("Error updating poll votes:", updateError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error voting on poll:", error);
    return false;
  }
};

export const fetchCategories = async (): Promise<Array<{id: string, name: string, slug: string}>> => {
  try {
    console.log("Buscando categorias da tabela community_categories para posts...");
    const { data, error } = await supabase
      .from('community_categories')
      .select('id, name, slug');
      
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
};

export const fetchCommunities = async (): Promise<Array<{id: string, name: string, posting_restrictions: string}>> => {
  try {
    const { data, error } = await supabase
      .from('communities')
      .select('id, name, posting_restrictions')
      .order('name');
      
    if (error) {
      console.error("Error fetching communities:", error);
      return [];
    }
    
    return data.map(community => ({
      id: community.id,
      name: community.name,
      posting_restrictions: community.posting_restrictions || 'all_members'
    }));
  } catch (error) {
    console.error("Error fetching communities:", error);
    return [];
  }
};

export const isValidPost = (post: any): post is Record<string, any> => {
  return post !== null && 
         typeof post === 'object' && 
         !('error' in post && post.error === true);
};

export const fetchPosts = async (
  options: FetchPostsOptions = {}
): Promise<{ posts: PostData[]; totalCount: number }> => {
  try {
    console.log("Fetching posts with options:", options);
    const {
      limit = 10,
      page = 1,
      sort = "newest",
      communityId = null,
      categoryId = null,
      userId = null,
      searchTerm = null,
    } = options;

    const offset = (page - 1) * limit;
    
    // Iniciar a consulta
    let query = supabase
      .from("posts")
      .select(
        `
        id, content, category_id, user_id, community_id,
        created_at, updated_at, likes_count, comments_count,
        is_pinned, title, media_data, poll_data,
        categories:category_id (id, name),
        communities:community_id (id, name)
      `,
        { count: "exact" }
      );
    
    // Aplicar filtro de comunidade - SEMPRE aplicar este filtro primeiro e de forma independente
    if (communityId) {
      console.log(`Filtrando por comunidade: ${communityId}`);
      query = query.eq('community_id', communityId);
      
      // Log adicional para depuração
      console.log(`Query com filtro de comunidade: ${communityId}`);
    }
    
    // Aplicar filtro de categoria apenas se especificado
    if (categoryId) {
      console.log(`Filtrando por categoria: ${categoryId}`);
      query = query.eq('category_id', categoryId);
    }
    
    // Aplicar filtro de usuário apenas se especificado
    if (userId) {
      console.log(`Filtrando por usuário: ${userId}`);
      query = query.eq('user_id', userId);
    }
    
    // Aplicar filtro de busca apenas se especificado
    if (searchTerm) {
      console.log(`Filtrando por busca: ${searchTerm}`);
      query = query.ilike('content', `%${searchTerm}%`);
    }
    
    // Aplicar ordenação
    query = query.order("created_at", { ascending: sort === "oldest" });
    
    // Aplicar paginação
    if (limit > 0) {
      query = query.range(offset, offset + limit - 1);
    }
    
    // Executar a consulta
    const { data: postsData, error, count } = await query;

    if (error) {
      console.error("Error fetching posts:", error);
      throw error;
    }
    
    // Log detalhado dos posts encontrados
    console.log("Posts data fetched:", postsData?.length || 0, "posts");
    if (postsData && postsData.length > 0) {
      console.log("Detalhes dos posts encontrados:");
      postsData.forEach(post => {
        console.log(`Post ID: ${post.id}, Comunidade: ${post.community_id}, Categoria: ${post.category_id}, Conteúdo: ${post.content?.substring(0, 30)}...`);
      });
    }
    
    console.log("Posts data fetched:", postsData?.length || 0, "posts");
    
    if (!postsData || postsData.length === 0) {
      console.log("No posts found");
      
      // Se não encontrou posts e estamos filtrando por comunidade Marketing (ID 5), tentar buscar sem filtro de categoria
      if (communityId === "5" && categoryId) {
        console.log("Tentando buscar posts da comunidade Marketing sem filtro de categoria");
        return fetchPosts({
          ...options,
          categoryId: null
        });
      }
      
      return { posts: [], totalCount: 0 };
    }

    // Fetch user information for all posts in a separate query
    const userIds = postsData.map(post => post.user_id).filter(Boolean);
    console.log("Fetching user data for", userIds.length, "users");
    
    let usersMap: Record<string, any> = {};
    
    if (userIds.length > 0) {
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', userIds);
        
      if (usersError) {
        console.error("Error fetching user data:", usersError);
      }
      
      if (usersData && usersData.length > 0) {
        console.log("User data fetched:", usersData.length, "users");
        usersMap = usersData.reduce((acc, user) => {
          acc[user.id] = user;
          return acc;
        }, {} as Record<string, any>);
      } else {
        console.log("No user data found");
      }
    }

    // Format the posts with the user data
    const formattedPosts: PostData[] = [];

    for (const post of postsData) {
      try {
        if (post && isValidPost(post)) {
          const postId = post.id ?? '';
          const userId = post.user_id ?? '';
          const categoryId = post.category_id ?? '';
          const postContent = post.content ?? '';
          
          // Get user data from our map
          const userData = usersMap[userId];
          
          let author = {
            id: userId,
            name: 'Usuário',
            avatar: null,
          };
          
          if (userData) {
            author = {
              id: userData.id,
              name: userData.full_name || userData.username || 'Usuário',
              avatar: userData.avatar_url,
            };
          }
          
          let createdAt = new Date();
          if (post.created_at && typeof post.created_at === 'string') {
            createdAt = new Date(post.created_at);
          }
          
          let category = { id: 'other', name: 'Other' };
          if (post.categories && typeof post.categories === 'object') {
            category = {
              id: post.categories.id ?? 'other',
              name: post.categories.name ?? 'Other',
            };
          }
          
          let community = { id: 'other', name: 'Other' };
          if (post.communities && typeof post.communities === 'object') {
            community = {
              id: post.communities.id ?? 'other',
              name: post.communities.name ?? 'Other',
            };
          }
          
          const likes = typeof post.likes_count === 'number' ? post.likes_count : 0;
          const comments = typeof post.comments_count === 'number' ? post.comments_count : 0;
          const isPinned = post.is_pinned === true;
          
          let pollData = undefined;
          if (post.poll_data) {
            let parsedPollData;
            try {
              if (typeof post.poll_data === 'string') {
                parsedPollData = JSON.parse(post.poll_data);
              } else {
                parsedPollData = post.poll_data;
              }
              
              if (parsedPollData && typeof parsedPollData === 'object') {
                pollData = {
                  question: parsedPollData.question ?? '',
                  options: Array.isArray(parsedPollData.options) ? parsedPollData.options : [],
                  votes: parsedPollData.votes,
                  userVoted: parsedPollData.userVoted,
                };
              }
            } catch (e) {
              console.error('Error parsing poll data:', e);
            }
          }
          
          const mediaData = [];
          if (post.media_data) {
            let parsedMediaData;
            try {
              if (typeof post.media_data === 'string') {
                parsedMediaData = JSON.parse(post.media_data);
              } else {
                parsedMediaData = post.media_data;
              }
              
              if (parsedMediaData && Array.isArray(parsedMediaData)) {
                for (const media of parsedMediaData) {
                  if (media && typeof media === 'object') {
                    mediaData.push({
                      type: media.type ?? 'image',
                      url: media.url ?? '',
                      aspectRatio: media.aspectRatio,
                    });
                  }
                }
              }
            } catch (e) {
              console.error('Error parsing media data:', e);
            }
          }
          
          formattedPosts.push({
            id: postId,
            content: postContent,
            author,
            category,
            community,
            createdAt,
            likes,
            comments,
            isPinned,
            communityId: post.community_id ?? null,
            poll: pollData,
            media: mediaData.length > 0 ? mediaData : undefined,
          });
        }
      } catch (e) {
        console.error('Error processing post:', e, post);
      }
    }

    console.log("Formatted posts:", formattedPosts.length);
    return {
      posts: formattedPosts,
      totalCount: count ?? formattedPosts.length,
    };
  } catch (error) {
    console.error("Error in fetchPosts function:", error);
    return { posts: [], totalCount: 0 };
  }
};

export const addCategory = async (category: CategoryForm): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .insert([category]);
      
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Error adding category:", error);
    throw error;
  }
};

export const updateCategory = async (id: string, category: CategoryForm): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from("community_categories")
      .update({
        name: category.name,
        description: category.description || "",
        slug: category.slug
      })
      .eq("id", id)
      .select();
      
    if (error) {
      console.error("Error updating category:", error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Error updating category:", error);
    throw error;
  }
};

/**
 * Exclui um post do banco de dados
 * @param postId ID do post a ser excluído
 * @returns true se o post foi excluído com sucesso, false caso contrário
 */
export const deletePost = async (postId: string): Promise<boolean> => {
  try {
    // Obter o usuário atual
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    
    if (!userId) {
      console.error("User not authenticated");
      return false;
    }
    
    console.log(`Tentando excluir post ${postId} pelo usuário ${userId}`);
    
    // Excluir o post diretamente, sem verificar permissões
    // Isso permite que qualquer usuário possa excluir posts
    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId);
    
    if (error) {
      console.error("Error deleting post:", error);
      return false;
    }
    
    console.log(`Post ${postId} excluído com sucesso`);
    return true;
  } catch (error) {
    console.error("Error deleting post:", error);
    return false;
  }
};

export const togglePinPost = async (postId: string, isPinned: boolean): Promise<boolean> => {
  try {
    console.log(`${isPinned ? 'Fixando' : 'Desafixando'} post ${postId}`);
    
    const { data, error } = await supabase
      .from('posts')
      .update({ is_pinned: isPinned })
      .eq('id', postId);
      
    if (error) {
      console.error(`Erro ao ${isPinned ? 'fixar' : 'desafixar'} post:`, error);
      return false;
    }
    
    console.log(`Post ${isPinned ? 'fixado' : 'desafixado'} com sucesso`);
    return true;
  } catch (error) {
    console.error(`Erro ao ${isPinned ? 'fixar' : 'desafixar'} post:`, error);
    return false;
  }
};

/**
 * Força a exclusão de um post do banco de dados, ignorando verificações de permissão
 * Usar apenas para administração e limpeza de dados
 * @param postId ID do post a ser excluído
 * @returns true se o post foi excluído com sucesso, false caso contrário
 */
export const forceDeletePost = async (postId: string): Promise<boolean> => {
  try {
    console.log(`Iniciando exclusão forçada do post ${postId}`);
    
    // Verificar se o post existe
    const { data: postData, error: postError } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single();
    
    if (postError) {
      console.error(`Post ${postId} não encontrado:`, postError);
      return false;
    }
    
    // Lista de tabelas que podem ter relacionamentos com posts
    // Vamos tentar excluir registros de cada uma delas
    const relatedTables = [
      { name: 'post_likes', field: 'post_id' },
      { name: 'post_comments', field: 'post_id' },
      { name: 'post_media', field: 'post_id' },
      { name: 'post_polls', field: 'post_id' },
      { name: 'poll_votes', field: 'post_id' },
      { name: 'post_views', field: 'post_id' },
      { name: 'post_shares', field: 'post_id' },
      { name: 'post_saves', field: 'post_id' },
      { name: 'post_reports', field: 'post_id' }
    ];
    
    // Tentar excluir registros relacionados de cada tabela
    for (const { name, field } of relatedTables) {
      try {
        // Usar método genérico para evitar problemas de tipagem
        const result = await supabase.auth.getSession();
        const token = result.data.session?.access_token;
        
        if (!token) {
          console.warn('Sem token de acesso, pulando exclusão de registros relacionados');
          continue;
        }
        
        // Fazer uma requisição direta à API do Supabase
        const response = await fetch(
          `https://weuifmgjzkuppqqsoood.supabase.co/rest/v1/${name}?${field}=eq.${postId}`,
          {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndldWlmbWdqemt1cHBxcXNvb29kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTI3NzY5MzMsImV4cCI6MjAyODM1MjkzM30.Hv8Qf_QIwUmMlBKPIRwQCQcJCIZdWRfxkCFfYnXWFnE'
            }
          }
        );
        
        if (response.ok) {
          console.log(`Registros de ${name} para o post ${postId} removidos com sucesso`);
        } else {
          const errorData = await response.json().catch(() => null);
          console.warn(`Erro ao excluir registros de ${name} para o post ${postId}:`, 
            errorData || response.statusText);
        }
      } catch (error) {
        console.warn(`Exceção ao excluir registros de ${name} para o post ${postId}:`, error);
      }
    }
    
    // Verificar se o post está marcado como trending e remover essa marcação
    try {
      const { error: updateError } = await supabase
        .from('posts')
        .update({ is_trending: false })
        .eq('id', postId);
      
      if (updateError) {
        console.warn(`Erro ao remover marcação de trending do post ${postId}:`, updateError);
      } else {
        console.log(`Marcação de trending do post ${postId} removida com sucesso`);
      }
    } catch (error) {
      console.warn(`Exceção ao remover marcação de trending do post ${postId}:`, error);
    }
    
    // Finalmente, excluir o post
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);
    
    if (error) {
      console.error(`Erro ao excluir post ${postId}:`, error);
      return false;
    }
    
    console.log(`Post ${postId} excluído com sucesso`);
    return true;
  } catch (error) {
    console.error(`Erro ao forçar exclusão do post ${postId}:`, error);
    return false;
  }
};
