import { supabase } from "@/integrations/supabase/client";
import { isAdminByEmail } from "@/utils/adminUtils";

/**
 * Atualiza a categoria de um post (função para administradores)
 * 
 * @param postId ID do post a ser atualizado
 * @param categoryId Novo ID da categoria
 * @param adminEmail Email do administrador que está fazendo a alteração
 */
export async function updatePostCategory(
  postId: string,
  categoryId: string | null,
  adminEmail: string
): Promise<boolean> {
  try {
    // Verificar se o usuário é um administrador
    const isAdmin = await isAdminByEmail(adminEmail);
    if (!isAdmin) {
      console.error(`Usuário ${adminEmail} não tem permissão para alterar categorias de posts`);
      return false;
    }
    
    // Validar o categoryId - deve ser null ou um UUID válido
    let finalCategoryId = null;
    if (categoryId && categoryId.trim() !== "") {
      finalCategoryId = categoryId;
    }
    
    console.log(`Atualizando categoria do post ${postId} para ${finalCategoryId} pelo admin ${adminEmail}`);
    
    // Atualizar o post no banco de dados
    const { error } = await supabase
      .from('posts')
      .update({ category_id: finalCategoryId })
      .eq('id', postId);
      
    if (error) {
      console.error(`Erro ao atualizar categoria do post ${postId}:`, error);
      return false;
    }
    
    console.log(`Categoria do post ${postId} atualizada com sucesso para ${finalCategoryId}`);
    return true;
  } catch (error) {
    console.error(`Erro ao atualizar categoria do post ${postId}:`, error);
    return false;
  }
}

/**
 * Busca categorias disponíveis para administradores
 */
export async function fetchAdminCategories(): Promise<{ id: string, name: string }[]> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name')
      .order('name');
      
    if (error) {
      console.error('Erro ao buscar categorias:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    return [];
  }
}
