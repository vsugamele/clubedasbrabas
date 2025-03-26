import { supabase } from '@/integrations/supabase/client';
import { Community, CommunityForm, mapFromSupabase } from './types';
import { toast } from 'sonner';
import { cleanupCommunityCategories, syncCategories } from './categoryIntegration';

/**
 * Fetch all communities from the database
 */
export const fetchCommunities = async (): Promise<any[]> => {
  try {
    // Buscar comunidades com informações de categoria usando join
    const { data, error } = await supabase
      .from('communities')
      .select(`
        *,
        community_categories(id, name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching communities:", error);
      throw error;
    }

    // Realizar limpeza de categorias inválidas
    await cleanupCommunityCategories();

    // Map the data to ensure it conforms to the Community type
    return data ? data.map(item => {
      const community = mapFromSupabase(item);
      
      // Adicionar o nome da categoria ao objeto da comunidade
      if (item.community_categories) {
        community.categoryName = item.community_categories.name;
      }
      
      return community;
    }) : [];
  } catch (error) {
    console.error("Error in fetchCommunities:", error);
    throw error;
  }
};

/**
 * Add a new community
 */
export const addCommunity = async (formData: CommunityForm): Promise<Community | null> => {
  try {
    const newCommunity = {
      name: formData.name,
      description: formData.description,
      visibility: formData.visibility,
      posting_restrictions: formData.postingRestrictions,
      category_id: formData.categoryId || null
    };

    console.log("Inserindo nova comunidade:", newCommunity);

    const { data, error } = await supabase
      .from('communities')
      .insert(newCommunity)
      .select()
      .single();

    if (error) {
      console.error("Error adding community:", error);
      throw error;
    }

    // Properly map the Supabase response to the Community type
    return data ? mapFromSupabase(data) : null;
  } catch (error) {
    console.error("Error in addCommunity:", error);
    throw error;
  }
};

/**
 * Update an existing community
 */
export const updateCommunity = async (id: string, formData: CommunityForm): Promise<Community | null> => {
  try {
    // Construir objeto de atualização apenas com campos fornecidos
    const updates: any = {};
    
    if (formData.name?.trim()) updates.name = formData.name;
    if (formData.description?.trim()) updates.description = formData.description;
    if (formData.visibility) updates.visibility = formData.visibility;
    if (formData.postingRestrictions) updates.posting_restrictions = formData.postingRestrictions;
    
    // Tratar categoria de forma simplificada
    if (formData.categoryId === "") {
      console.log("Definindo categoria como null");
      updates.category_id = null;
    } else if (formData.categoryId) {
      console.log(`Usando categoria ${formData.categoryId}`);
      updates.category_id = formData.categoryId;
    }

    console.log(`Atualizando comunidade ${id} com:`, updates);

    const { data, error } = await supabase
      .from('communities')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error("Error updating community:", error);
      throw error;
    }

    // Limpar o cache de categorias na sidebar para forçar uma atualização
    try {
      localStorage.removeItem('sidebar_categories');
      localStorage.removeItem('sidebar_categories_timestamp');
      console.log("Cache de categorias da sidebar limpo");
    } catch (e) {
      console.warn("Não foi possível limpar o cache de categorias:", e);
    }

    return data ? mapFromSupabase(data) : null;
  } catch (error) {
    console.error("Error in updateCommunity:", error);
    toast.error("Erro ao atualizar comunidade");
    throw error;
  }
};

/**
 * Delete a community
 */
export const deleteCommunity = async (id: string, name: string): Promise<boolean> => {
  try {
    console.log(`Deletando comunidade: ${id} (${name})`);
    
    // Primeiro, excluir todos os posts associados à comunidade
    console.log(`Excluindo posts associados à comunidade ${id}`);
    const { error: postsError } = await supabase
      .from('posts')
      .delete()
      .eq('community_id', id);
    
    if (postsError) {
      console.error("Erro ao excluir posts da comunidade:", postsError);
      throw postsError;
    }
    
    // Depois, excluir a comunidade
    const { error } = await supabase
      .from('communities')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Error deleting community:", error);
      throw error;
    }

    // Limpar o cache de categorias na sidebar para forçar uma atualização
    try {
      localStorage.removeItem('sidebar_categories');
      localStorage.removeItem('sidebar_categories_timestamp');
      console.log("Cache de categorias da sidebar limpo após exclusão de comunidade");
    } catch (e) {
      console.warn("Não foi possível limpar o cache de categorias:", e);
    }

    return true;
  } catch (error) {
    console.error("Error in deleteCommunity:", error);
    toast.error("Erro ao excluir comunidade");
    throw error;
  }
};

/**
 * Fetch communities by category
 */
export const fetchCommunitiesByCategory = async (categoryId: string): Promise<Community[]> => {
  try {
    const { data, error } = await supabase
      .from('communities')
      .select('*')
      .eq('category_id', categoryId)
      .order('name');

    if (error) {
      console.error(`Error fetching communities for category ${categoryId}:`, error);
      throw error;
    }

    // Properly map each item in the array to ensure they conform to the Community type
    return data ? data.map(item => mapFromSupabase(item)) : [];
  } catch (error) {
    console.error("Error in fetchCommunitiesByCategory:", error);
    return [];
  }
};
