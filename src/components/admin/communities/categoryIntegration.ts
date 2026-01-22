import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Interface para categorias
export interface Category {
  id: string;
  name: string;
  slug: string;
}

// Função para sincronizar categorias entre as tabelas
export const syncCategories = async (): Promise<boolean> => {
  try {
    console.log("Sincronizando categorias entre tabelas...");
    
    // Buscar todas as categorias da tabela categories
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .order('name');
      
    if (categoriesError) {
      console.error("Erro ao buscar categorias:", categoriesError);
      return false;
    }
    
    if (!categoriesData || categoriesData.length === 0) {
      console.log("Nenhuma categoria encontrada para sincronizar");
      return true;
    }
    
    console.log(`Encontradas ${categoriesData.length} categorias para sincronizar`);
    
    // Buscar categorias existentes na tabela community_categories
    const { data: existingCategories, error: existingError } = await supabase
      .from('community_categories')
      .select('name, slug')
      .order('name');
      
    if (existingError) {
      console.error("Erro ao buscar categorias existentes:", existingError);
      return false;
    }
    
    const existingNames = existingCategories?.map(cat => cat.name.toLowerCase()) || [];
    const existingSlugs = existingCategories?.map(cat => cat.slug.toLowerCase()) || [];
    let insertCount = 0;
    
    // Função para gerar slug único
    const generateUniqueSlug = (baseName: string): string => {
      // Criar slug base
      let baseSlug = baseName.toLowerCase().replace(/\s+/g, '-');
      
      // Se o slug já existe, adicionar um sufixo numérico
      if (existingSlugs.includes(baseSlug)) {
        let counter = 1;
        let newSlug = `${baseSlug}-${counter}`;
        
        // Incrementar o contador até encontrar um slug único
        while (existingSlugs.includes(newSlug)) {
          counter++;
          newSlug = `${baseSlug}-${counter}`;
        }
        
        console.log(`Slug '${baseSlug}' já existe, usando '${newSlug}' como alternativa`);
        return newSlug;
      }
      
      return baseSlug;
    };
    
    // Inserir categorias que não existem na tabela community_categories
    for (const category of categoriesData) {
      if (!existingNames.includes(category.name.toLowerCase())) {
        console.log(`Inserindo categoria ${category.name} em community_categories...`);
        
        // Gerar slug único
        const uniqueSlug = generateUniqueSlug(category.slug || category.name);
        
        // Adicionar o novo slug à lista para evitar duplicatas nas próximas iterações
        existingSlugs.push(uniqueSlug);
        
        const { error: insertError } = await supabase
          .from('community_categories')
          .insert({
            name: category.name,
            slug: uniqueSlug
          });
          
        if (insertError) {
          console.error(`Erro ao inserir categoria ${category.name} em community_categories:`, insertError);
        } else {
          insertCount++;
        }
      }
    }
    
    console.log(`Sincronização concluída: ${insertCount} categorias inseridas`);
    return true;
  } catch (error) {
    console.error("Erro em syncCategories:", error);
    return false;
  }
};

// Função para obter todas as categorias do Supabase
export const fetchCategories = async (): Promise<Category[]> => {
  try {
    console.log("Buscando categorias da tabela community_categories...");
    
    // Removida a sincronização automática para evitar que categorias excluídas sejam recriadas
    // await syncCategories();
    
    const { data, error } = await supabase
      .from('community_categories')
      .select('*')
      .order('name');
      
    if (error) {
      console.error("Erro ao buscar categorias:", error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error("Erro na fetchCategories:", error);
    return [];
  }
};

// Função para atribuir uma categoria a uma comunidade
export const assignCategoryToCommunity = async (communityId: string, categoryId: string): Promise<boolean> => {
  try {
    console.log(`Atribuindo categoria ${categoryId} à comunidade ${communityId}`);
    
    const { data, error } = await supabase
      .from('communities')
      .update({ category_id: categoryId })
      .eq('id', communityId);
      
    if (error) {
      console.error("Erro ao atribuir categoria:", error);
      throw error;
    }
    
    console.log("Categoria atribuída com sucesso");
    return true;
  } catch (error) {
    console.error("Erro em assignCategoryToCommunity:", error);
    toast.error("Erro ao atribuir categoria à comunidade");
    return false;
  }
};

// Função para obter a categoria de uma comunidade
export const getCommunityCategory = async (communityId: string): Promise<Category | null> => {
  try {
    // Primeiro obtemos a comunidade com sua categoria_id
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select('category_id')
      .eq('id', communityId)
      .single();
      
    if (communityError || !community || !community.category_id) {
      return null;
    }
    
    // Agora buscamos os detalhes da categoria
    const { data: category, error: categoryError } = await supabase
      .from('community_categories')
      .select('*')
      .eq('id', community.category_id)
      .single();
      
    if (categoryError || !category) {
      return null;
    }
    
    return category;
  } catch (error) {
    console.error("Erro em getCommunityCategory:", error);
    return null;
  }
};

// Função para limpar categorias que não existem mais
export const cleanupCommunityCategories = async (): Promise<void> => {
  try {
    // Obter todas as categorias existentes
    const categories = await fetchCategories();
    const validCategoryIds = categories.map(cat => cat.id);
    
    // Obter comunidades com categorias inválidas
    const { data: communities, error } = await supabase
      .from('communities')
      .select('id, category_id')
      .not('category_id', 'is', null);
      
    if (error) {
      console.error("Erro ao buscar comunidades:", error);
      return;
    }
    
    // Filtrar comunidades com categorias inválidas
    const communitiesWithInvalidCategories = communities.filter(
      community => community.category_id && !validCategoryIds.includes(community.category_id)
    );
    
    // Atualizar comunidades com categorias inválidas (definir category_id como null)
    for (const community of communitiesWithInvalidCategories) {
      console.log(`Limpando categoria inválida da comunidade ${community.id}`);
      
      await supabase
        .from('communities')
        .update({ category_id: null })
        .eq('id', community.id);
    }
    
    if (communitiesWithInvalidCategories.length > 0) {
      console.log(`${communitiesWithInvalidCategories.length} comunidades com categorias inválidas foram corrigidas`);
    }
  } catch (error) {
    console.error("Erro em cleanupCommunityCategories:", error);
  }
};

// Função para testar e corrigir a sincronização de categorias
export const testAndFixCategorySync = async (): Promise<{success: boolean, message: string}> => {
  try {
    console.log("Iniciando teste de sincronização de categorias...");
    
    // 1. Verificar categorias na tabela categories
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .order('name');
      
    if (categoriesError) {
      console.error("Erro ao buscar categorias da tabela categories:", categoriesError);
      return { success: false, message: "Erro ao buscar categorias da tabela original" };
    }
    
    console.log(`Encontradas ${categoriesData?.length || 0} categorias na tabela categories`);
    
    // 2. Verificar categorias na tabela community_categories
    const { data: communityCategoriesData, error: communityCategoriesError } = await supabase
      .from('community_categories')
      .select('*')
      .order('name');
      
    if (communityCategoriesError) {
      console.error("Erro ao buscar categorias da tabela community_categories:", communityCategoriesError);
      return { success: false, message: "Erro ao buscar categorias da tabela de comunidades" };
    }
    
    console.log(`Encontradas ${communityCategoriesData?.length || 0} categorias na tabela community_categories`);
    
    // Função para gerar slug único
    const existingSlugs = communityCategoriesData?.map(cat => cat.slug.toLowerCase()) || [];
    
    const generateUniqueSlug = (baseName: string): string => {
      // Criar slug base
      let baseSlug = baseName.toLowerCase().replace(/\s+/g, '-');
      
      // Se o slug já existe, adicionar um sufixo numérico
      if (existingSlugs.includes(baseSlug)) {
        let counter = 1;
        let newSlug = `${baseSlug}-${counter}`;
        
        // Incrementar o contador até encontrar um slug único
        while (existingSlugs.includes(newSlug)) {
          counter++;
          newSlug = `${baseSlug}-${counter}`;
        }
        
        console.log(`Slug '${baseSlug}' já existe, usando '${newSlug}' como alternativa`);
        return newSlug;
      }
      
      return baseSlug;
    };
    
    // 3. Verificar comunidades com categorias
    const { data: communitiesData, error: communitiesError } = await supabase
      .from('communities')
      .select('id, name, category_id')
      .not('category_id', 'is', null);
      
    if (communitiesError) {
      console.error("Erro ao buscar comunidades com categorias:", communitiesError);
      return { success: false, message: "Erro ao buscar comunidades com categorias" };
    }
    
    console.log(`Encontradas ${communitiesData?.length || 0} comunidades com categorias atribuídas`);
    
    // 4. Verificar se todas as categorias atribuídas existem na tabela community_categories
    let categoriasInvalidas = 0;
    let categoriasCorrigidas = 0;
    
    if (communitiesData && communitiesData.length > 0) {
      const communityCategIds = communityCategoriesData?.map(cat => cat.id) || [];
      
      for (const community of communitiesData) {
        if (!communityCategIds.includes(community.category_id)) {
          categoriasInvalidas++;
          console.warn(`Comunidade ${community.name} (${community.id}) tem categoria inválida: ${community.category_id}`);
          
          // Tentar encontrar a categoria correspondente na tabela categories
          const originalCategory = categoriesData?.find(cat => cat.id === community.category_id);
          
          if (originalCategory) {
            // Tentar encontrar uma categoria com o mesmo nome na tabela community_categories
            const matchingCategory = communityCategoriesData?.find(cat => 
              cat.name.toLowerCase() === originalCategory.name.toLowerCase()
            );
            
            if (matchingCategory) {
              // Atualizar a comunidade com o ID correto da categoria
              const { error: updateError } = await supabase
                .from('communities')
                .update({ category_id: matchingCategory.id })
                .eq('id', community.id);
                
              if (updateError) {
                console.error(`Erro ao atualizar categoria da comunidade ${community.name}:`, updateError);
              } else {
                categoriasCorrigidas++;
                console.log(`Comunidade ${community.name} atualizada para usar categoria ${matchingCategory.name} (${matchingCategory.id})`);
              }
            } else {
              // Criar nova categoria na tabela community_categories
              // Gerar slug único
              const uniqueSlug = generateUniqueSlug(originalCategory.slug || originalCategory.name);
              
              // Adicionar o novo slug à lista para evitar duplicatas nas próximas iterações
              existingSlugs.push(uniqueSlug);
              
              const { data: newCategory, error: insertError } = await supabase
                .from('community_categories')
                .insert({
                  name: originalCategory.name,
                  slug: uniqueSlug
                })
                .select()
                .single();
                
              if (insertError || !newCategory) {
                console.error(`Erro ao criar categoria para comunidade ${community.name}:`, insertError);
              } else {
                // Atualizar a comunidade com o novo ID de categoria
                const { error: updateError } = await supabase
                  .from('communities')
                  .update({ category_id: newCategory.id })
                  .eq('id', community.id);
                  
                if (updateError) {
                  console.error(`Erro ao atualizar categoria da comunidade ${community.name}:`, updateError);
                } else {
                  categoriasCorrigidas++;
                  console.log(`Comunidade ${community.name} atualizada para usar nova categoria ${newCategory.name} (${newCategory.id})`);
                }
              }
            }
          } else {
            // Categoria não encontrada em nenhuma tabela, remover referência
            const { error: updateError } = await supabase
              .from('communities')
              .update({ category_id: null })
              .eq('id', community.id);
              
            if (updateError) {
              console.error(`Erro ao remover categoria inválida da comunidade ${community.name}:`, updateError);
            } else {
              console.log(`Referência de categoria removida da comunidade ${community.name}`);
            }
          }
        }
      }
    }
    
    // 5. Limpar cache da sidebar para forçar atualização
    try {
      localStorage.removeItem('sidebar_categories');
      localStorage.removeItem('sidebar_categories_timestamp');
      console.log("Cache de categorias da sidebar limpo");
    } catch (e) {
      console.warn("Não foi possível limpar o cache de categorias:", e);
    }
    
    return { 
      success: true, 
      message: `Sincronização concluída: ${categoriesData?.length || 0} categorias originais, ${communityCategoriesData?.length || 0} categorias de comunidade, ${categoriasInvalidas} categorias inválidas encontradas, ${categoriasCorrigidas} categorias corrigidas.` 
    };
  } catch (error) {
    console.error("Erro ao testar sincronização de categorias:", error);
    return { success: false, message: "Erro ao testar sincronização de categorias" };
  }
};
