/**
 * Utilitário para filtrar posts deletados
 * Esta classe é usada pelo sistema de administração para gerenciar posts excluídos
 */

/**
 * Adiciona um filtro para excluir posts marcados como excluídos (is_deleted = true)
 * Se a coluna is_deleted não existir, continua sem erro
 * @param query A consulta atual do Supabase
 * @returns A mesma consulta com o filtro adicionado (se possível)
 */
export const filterDeletedPosts = (query: any): any => {
  try {
    // Tenta adicionar o filtro is_deleted = false
    return query.eq('is_deleted', false);
  } catch (err) {
    // Se falhar (a coluna não existe), retorna a query original sem filtro
    console.log("Aviso: Não foi possível filtrar por is_deleted, a coluna pode não existir");
    return query;
  }
};

/**
 * Processa dados de posts, substituindo o conteúdo dos posts marcados como excluídos
 * Esta função é útil quando não foi possível filtrar os posts deletados na consulta SQL
 * @param posts Lista de posts a serem processados
 * @returns Lista de posts processados
 */
export const processDeletedPosts = (posts: any[]): any[] => {
  if (!posts || !Array.isArray(posts)) return [];
  
  return posts.map(post => {
    // Se o post foi marcado como excluído, substitui o conteúdo
    if (post && post.is_deleted === true) {
      return {
        ...post,
        content: "[Este post foi removido por um administrador]",
        title: "[Post removido]"
      };
    }
    return post;
  });
};

/**
 * Verifica se um usuário pode excluir um post específico
 * Um usuário pode excluir um post se for admin ou se for o autor do post
 * 
 * @param userEmail Email do usuário que tenta excluir o post
 * @param postAuthorId ID do autor do post
 * @param currentUserId ID do usuário atual
 * @returns true se o usuário pode excluir o post, false caso contrário
 */
export const canDeletePost = (
  userEmail: string | undefined,
  postAuthorId: string | undefined,
  currentUserId: string | undefined
): boolean => {
  if (!userEmail || !postAuthorId || !currentUserId) {
    return false;
  }

  // Verifica se o usuário é admin (verificação em linha para evitar problemas de importação)
  const adminEmails = [
    'souzadecarvalho1986@gmail.com',
    'vsugamele@gmail.com',
    'admin@example.com',
    'superadmin@example.com',
    'ipcompanidigital@gmail.com',
    'tech@yourcompany.com'
  ];
  
  // Normaliza o email para minúsculas
  const normalizedEmail = userEmail.toLowerCase();
  
  // Verifica se o email está na lista de administradores
  if (adminEmails.map(e => e.toLowerCase()).includes(normalizedEmail)) {
    return true;
  }

  // Usuário não-admin só pode excluir seus próprios posts
  return postAuthorId === currentUserId;
};
