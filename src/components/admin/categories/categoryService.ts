import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Category, DeletedCategory, CategoryForm } from "./categoryService.types";
import { 
  queryWithRetry, 
  asPromise, 
  fetchWithTimeout,
  SHORT_TIMEOUT
} from "../hooks/utils/queryUtils";

// Função auxiliar para mostrar erros com toast
const handleError = (error: any, message: string) => {
  console.error(`${message}:`, error);
  toast.error(`Erro: ${message}`, { position: "bottom-right" });
};

// Função auxiliar para converter dados do Supabase para o tipo Category
export const safeCategoryMapper = (data: any): Category => {
  try {
    if (!data) {
      throw new Error("Dados inválidos");
    }
    
    return {
      id: data.id || "",
      name: data.name || "",
      slug: data.slug || "",
      order_index: data.order_index !== undefined ? data.order_index : 0,
      createdAt: data.created_at || new Date().toISOString(),
      updatedAt: data.updated_at || undefined
    };
  } catch (error) {
    console.error("Erro ao mapear categoria:", error);
    
    // Retornar um objeto padrão em caso de erro
    return {
      id: data?.id || "",
      name: data?.name || "",
      slug: data?.slug || "",
      order_index: 0,
      createdAt: new Date().toISOString()
    };
  }
};

// Carregar categorias do Supabase com tratamento aprimorado de conexão
export const fetchCategories = async (): Promise<Category[]> => {
  try {
    console.log("Iniciando carregamento de categorias...");
    
    const result = await queryWithRetry<any>(() => 
      asPromise(() => supabase
        .from('community_categories')
        .select('*')
        .order('order_index', { ascending: true }))
    );
      
    if (result.error) {
      throw result.error;
    }
    
    console.log("Categorias carregadas do Supabase:", result.data);
    
    // Safely map data to Category[]
    const categories = Array.isArray(result.data) 
      ? result.data.map(item => safeCategoryMapper(item))
      : [];
      
    return categories;
  } catch (error) {
    handleError(error, "Não foi possível carregar as categorias");
    return [];
  }
};

// Adicionar nova categoria no Supabase
export const addCategory = async (form: CategoryForm): Promise<Category> => {
  try {
    // Obter o usuário atual
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    
    if (!form.name || !form.slug) {
      throw new Error("Nome e slug são obrigatórios");
    }
    
    // Verificar se já existe uma categoria com o mesmo slug
    const { data: existingCategory, error: checkError } = await supabase
      .from('community_categories')
      .select('slug')
      .eq('slug', form.slug)
      .maybeSingle();
      
    if (checkError) {
      throw checkError;
    }
    
    if (existingCategory) {
      throw new Error(`Já existe uma categoria com o slug "${form.slug}"`);
    }
    
    // Obter o próximo order_index
    const nextOrderIndex = await getNextOrderIndex();
    
    const categoryData = {
      name: form.name,
      slug: form.slug,
      order_index: nextOrderIndex,
      created_by: userId
    };
    
    // Use fetchWithTimeout para evitar problemas de conexão
    const insertPromise = async () => {
      return await supabase
        .from('community_categories')
        .insert(categoryData)
        .select()
        .single();
    };
    
    const { data, error } = await fetchWithTimeout(insertPromise, SHORT_TIMEOUT);
      
    if (error) {
      throw error;
    }
    
    if (!data) {
      throw new Error("Não foi possível obter os dados da categoria após a inserção");
    }
    
    const newCategory = safeCategoryMapper(data);
    
    toast.success(`Categoria "${form.name}" criada com sucesso`, { position: "bottom-right" });
    console.log("Nova categoria adicionada ao Supabase:", newCategory);
    
    return newCategory;
  } catch (error) {
    handleError(error, "Não foi possível adicionar a categoria");
    
    // Retornar uma categoria de fallback com os dados atuais
    return {
      id: String(Date.now()),
      name: form.name,
      slug: form.slug,
      order_index: 0,
      createdAt: new Date().toISOString()
    };
  }
};

// Atualizar categoria existente no Supabase
export const updateCategory = async (id: string, form: CategoryForm): Promise<Category> => {
  try {
    // Use fetchWithTimeout para evitar problemas de conexão
    const updatePromise = async () => {
      return await supabase
        .from('community_categories')
        .update({
          name: form.name,
          slug: form.slug
        } as any)
        .eq('id', id as any)
        .select()
        .single();
    };
    
    const { data, error } = await fetchWithTimeout(updatePromise, SHORT_TIMEOUT);
      
    if (error) {
      throw error;
    }
    
    if (!data) {
      throw new Error("Não foi possível obter os dados da categoria após a atualização");
    }
    
    const updatedCategory = safeCategoryMapper(data);
    
    toast.success(`Categoria "${form.name}" atualizada com sucesso`, { position: "bottom-right" });
    console.log("Categoria atualizada no Supabase:", updatedCategory);
    
    return updatedCategory;
  } catch (error) {
    handleError(error, "Não foi possível atualizar a categoria");
    
    // Retornar uma categoria de fallback com os dados atuais
    return {
      id,
      name: form.name,
      slug: form.slug,
      order_index: 0,
      createdAt: new Date().toISOString()
    };
  }
};

// Excluir categoria do Supabase
export const deleteCategory = async (id: string): Promise<boolean> => {
  try {
    console.log("Iniciando exclusão da categoria:", id);
    
    // Verificar se existem posts associados a esta categoria
    const { data: relatedPosts, error: postsError } = await supabase
      .from('posts')
      .select('id')
      .eq('category_id', id);
    
    if (postsError) {
      console.error("Erro ao verificar posts relacionados:", postsError);
      throw postsError;
    }
    
    const postsCount = relatedPosts?.length || 0;
    console.log(`Categoria possui ${postsCount} posts relacionados`);
    
    if (postsCount > 0) {
      console.warn(`Atenção: ${postsCount} posts serão excluídos junto com a categoria`);
    }
    
    // Obter informações da categoria antes de excluí-la
    const { data: categoryData, error: categoryError } = await supabase
      .from('community_categories')
      .select('*')
      .eq('id', id)
      .single();
      
    if (categoryError) {
      console.error("Erro ao obter informações da categoria:", categoryError);
      throw categoryError;
    }
    
    if (!categoryData) {
      console.error("Categoria não encontrada");
      throw new Error("Categoria não encontrada");
    }
    
    // 1. Excluir da tabela community_categories
    console.log("Executando a exclusão da categoria na tabela community_categories");
    const { error } = await supabase
      .from('community_categories')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error("Erro ao excluir categoria de community_categories:", error);
      throw error;
    }
    
    // 2. Encontrar e excluir da tabela categories (usando o nome como referência)
    console.log("Procurando categoria na tabela categories para excluir");
    const { data: categoriesData, error: findError } = await supabase
      .from('categories')
      .select('id')
      .eq('name', categoryData.name);
      
    if (findError) {
      console.error("Erro ao procurar categoria na tabela categories:", findError);
    } else if (categoriesData && categoriesData.length > 0) {
      console.log(`Encontrada categoria na tabela categories: ${categoriesData[0].id}`);
      
      // Excluir da tabela categories
      const { error: deleteError } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoriesData[0].id);
        
      if (deleteError) {
        console.error("Erro ao excluir categoria da tabela categories:", deleteError);
      } else {
        console.log("Categoria excluída com sucesso da tabela categories");
      }
    } else {
      console.log("Categoria não encontrada na tabela categories");
    }
    
    console.log("Categoria excluída com sucesso. Verificando se foi movida para deleted_categories");
    
    // Verificar se a categoria foi movida para a tabela deleted_categories
    try {
      const { data: deletedData, error: deletedError } = await supabase
        .from('deleted_categories' as any)
        .select('*')
        .eq('original_id', id)
        .limit(1);
      
      console.log("Verificação da tabela deleted_categories:", { deletedData, deletedError });
      
      if (deletedError) {
        console.warn("Erro ao verificar se a categoria foi movida para deleted_categories:", deletedError);
      } else if (deletedData && deletedData.length > 0) {
        console.log("Categoria movida com sucesso para deleted_categories");
      } else {
        console.warn("Categoria não foi encontrada na tabela deleted_categories");
      }
    } catch (checkError) {
      console.error("Erro ao verificar tabela deleted_categories:", checkError);
    }
    
    return true;
  } catch (error) {
    handleError(error, "Não foi possível excluir a categoria");
    return false;
  }
};

/**
 * Busca todas as categorias excluídas
 * @returns Lista de categorias excluídas
 */
export const fetchDeletedCategories = async (): Promise<DeletedCategory[]> => {
  try {
    console.log("Iniciando fetchDeletedCategories");
    
    // Verificar se a tabela existe usando uma consulta direta
    // Como a função RPC pode não existir ainda, usamos uma abordagem alternativa
    try {
      console.log("Tentando verificar se a tabela existe usando RPC");
      const { data: tableExists, error: checkError } = await supabase.rpc(
        'check_table_exists' as any,
        { table_name: 'deleted_categories' }
      );
      
      console.log("Resultado da verificação RPC:", { tableExists, checkError });
      
      if (checkError || !tableExists) {
        console.log("Tabela deleted_categories não existe ou função check_table_exists não está disponível");
        return [];
      }
    } catch (rpcError) {
      // Se a função RPC não existir, tentamos uma abordagem alternativa
      console.log("Função check_table_exists não está disponível, tentando consulta direta", rpcError);
      
      // Tentamos fazer uma consulta direta para ver se a tabela existe
      try {
        console.log("Tentando consulta direta para verificar se a tabela existe");
        const { data, error } = await supabase
          .from('deleted_categories' as any)
          .select('id')
          .limit(1);
          
        console.log("Resultado da consulta direta:", { data, error });
        
        // Se der erro, provavelmente a tabela não existe
        if (error) {
          console.log("Tabela deleted_categories não existe (verificado por consulta direta)");
          return [];
        }
      } catch (directError) {
        console.log("Tabela deleted_categories não existe (erro na consulta direta)", directError);
        return [];
      }
    }
    
    // Se chegou até aqui, a tabela provavelmente existe, então tentamos buscar os dados
    console.log("Tabela existe, buscando dados");
    const { data, error } = await supabase
      .from('deleted_categories' as any)
      .select('*')
      .order('deleted_at', { ascending: false });
    
    console.log("Resultado da busca de dados:", { data, error });
    
    if (error) {
      console.error("Erro ao buscar dados da tabela deleted_categories:", error);
      return [];
    }
    
    // Verificar se data é um array antes de tentar mapear
    if (!Array.isArray(data)) {
      console.error("Dados retornados não são um array:", data);
      return [];
    }
    
    console.log("Número de categorias excluídas encontradas:", data.length);
    
    // Usar uma conversão segura para o tipo DeletedCategory
    const result = data.map(rawItem => {
      // Garantir que item é um objeto
      if (typeof rawItem !== 'object' || rawItem === null) {
        console.error("Item inválido nos dados:", rawItem);
        return null;
      }
      
      // Criar uma cópia segura do item
      const item = rawItem as Record<string, any>;
      
      // Criar um objeto DeletedCategory com verificações de segurança
      return {
        id: typeof item.id === 'string' ? item.id : '',
        original_id: typeof item.original_id === 'string' ? item.original_id : '',
        name: typeof item.name === 'string' ? item.name : '',
        slug: typeof item.slug === 'string' ? item.slug : '',
        order_index: typeof item.order_index === 'number' ? item.order_index : 0,
        deleted_at: typeof item.deleted_at === 'string' ? item.deleted_at : new Date().toISOString(),
        deleted_by: typeof item.deleted_by === 'string' ? item.deleted_by : '',
        created_at: typeof item.created_at === 'string' ? item.created_at : undefined,
        updated_at: typeof item.updated_at === 'string' ? item.updated_at : undefined
      } as DeletedCategory;
    }).filter((item): item is DeletedCategory => item !== null); // Remover itens nulos com type guard
    
    console.log("Categorias excluídas processadas:", result);
    return result;
  } catch (error) {
    console.error("Erro ao buscar categorias excluídas:", error);
    return [];
  }
};

/**
 * Obtém o próximo valor de order_index para uma nova categoria
 */
export const getNextOrderIndex = async (): Promise<number> => {
  try {
    // Buscar o maior order_index atual
    const { data: maxOrderData, error } = await supabase
      .from('community_categories')
      .select('*')
      .order('order_index' as any, { ascending: false })
      .limit(1)
      .single();
    
    const nextOrderIndex = maxOrderData && typeof (maxOrderData as any).order_index === 'number' 
      ? (maxOrderData as any).order_index + 1 
      : 1;
    
    return nextOrderIndex;
  } catch (error) {
    console.error("Erro ao obter próximo order_index:", error);
    return 1; // Valor padrão em caso de erro
  }
};

/**
 * Move uma categoria para cima na ordem
 * @param id ID da categoria a ser movida
 */
export const moveCategoryUp = async (id: string): Promise<boolean> => {
  try {
    // Buscar a categoria atual
    const { data: currentCategory, error: currentError } = await supabase
      .from('community_categories')
      .select('*')
      .eq('id', id)
      .single();

    if (currentError || !currentCategory) {
      throw currentError || new Error('Categoria não encontrada');
    }

    // Verificar se a coluna order_index existe
    const currentOrderIndex = typeof (currentCategory as any).order_index === 'number' ? 
      (currentCategory as any).order_index : 0;

    // Buscar a categoria acima (com order_index menor)
    const { data: prevCategory, error: prevError } = await supabase
      .from('community_categories')
      .select('*')
      .lt('order_index' as any, currentOrderIndex)
      .order('order_index' as any, { ascending: false })
      .limit(1)
      .single();

    if (prevError && prevError.code !== 'PGRST116') {
      throw prevError;
    }

    if (!prevCategory) {
      // Já está no topo
      return false;
    }

    // Trocar as posições
    const prevOrderIndex = typeof (prevCategory as any).order_index === 'number' ? 
      (prevCategory as any).order_index : 0;

    // Atualizar a categoria atual
    const { error: updateCurrentError } = await supabase
      .from('community_categories')
      .update({ order_index: prevOrderIndex } as any)
      .eq('id', id);

    if (updateCurrentError) throw updateCurrentError;

    // Atualizar a categoria anterior
    const { error: updatePrevError } = await supabase
      .from('community_categories')
      .update({ order_index: currentOrderIndex } as any)
      .eq('id', prevCategory.id);

    if (updatePrevError) throw updatePrevError;

    return true;
  } catch (error) {
    handleError(error, "Não foi possível mover a categoria para cima");
    return false;
  }
};

/**
 * Move uma categoria para baixo na ordem
 * @param id ID da categoria a ser movida
 */
export const moveCategoryDown = async (id: string): Promise<boolean> => {
  try {
    // Buscar a categoria atual
    const { data: currentCategory, error: currentError } = await supabase
      .from('community_categories')
      .select('*')
      .eq('id', id)
      .single();

    if (currentError || !currentCategory) {
      throw currentError || new Error('Categoria não encontrada');
    }

    // Verificar se a coluna order_index existe
    const currentOrderIndex = typeof (currentCategory as any).order_index === 'number' ? 
      (currentCategory as any).order_index : 0;

    // Buscar a categoria abaixo (com order_index maior)
    const { data: nextCategory, error: nextError } = await supabase
      .from('community_categories')
      .select('*')
      .gt('order_index' as any, currentOrderIndex)
      .order('order_index' as any, { ascending: true })
      .limit(1)
      .single();

    if (nextError && nextError.code !== 'PGRST116') {
      throw nextError;
    }

    if (!nextCategory) {
      // Já está no final
      return false;
    }

    // Trocar as posições
    const nextOrderIndex = typeof (nextCategory as any).order_index === 'number' ? 
      (nextCategory as any).order_index : 0;

    // Atualizar a categoria atual
    const { error: updateCurrentError } = await supabase
      .from('community_categories')
      .update({ order_index: nextOrderIndex } as any)
      .eq('id', id);

    if (updateCurrentError) throw updateCurrentError;

    // Atualizar a categoria seguinte
    const { error: updateNextError } = await supabase
      .from('community_categories')
      .update({ order_index: currentOrderIndex } as any)
      .eq('id', nextCategory.id);

    if (updateNextError) throw updateNextError;

    return true;
  } catch (error) {
    handleError(error, "Não foi possível mover a categoria para baixo");
    return false;
  }
};

/**
 * Restaura uma categoria excluída
 * @param deletedCategory Categoria excluída a ser restaurada
 */
export const restoreCategory = async (deletedCategory: DeletedCategory) => {
  try {
    // Inserir a categoria de volta na tabela principal
    const { error: insertError } = await supabase
      .from('community_categories')
      .insert({
        name: deletedCategory.name,
        slug: deletedCategory.slug,
        order_index: deletedCategory.order_index !== undefined ? deletedCategory.order_index : 0
      } as any);

    if (insertError) throw insertError;

    // Excluir a entrada da tabela de categorias excluídas
    const { error: deleteError } = await supabase
      .from('deleted_categories' as any)
      .delete()
      .eq('id', deletedCategory.id);

    if (deleteError) throw deleteError;

    toast.success(`Categoria "${deletedCategory.name}" restaurada com sucesso`, { position: "bottom-right" });
    return true;
  } catch (error) {
    console.error("Erro ao restaurar categoria:", error);
    handleError(error, "Não foi possível restaurar a categoria");
    throw error;
  }
};

// Função para migrar dados de categorias para o Supabase
export const migrateCategoriesDataToSupabase = async (categories: any[]): Promise<void> => {
  if (!categories || categories.length === 0) {
    console.log("Nenhuma categoria encontrada para migrar");
    return;
  }

  try {
    console.log("Dados a serem migrados:", categories);
    
    // Obtém o ID do usuário atual com timeout
    const getUserPromise = async () => await supabase.auth.getUser();
    const { data: userData } = await fetchWithTimeout(getUserPromise, SHORT_TIMEOUT);
    const userId = userData.user?.id;
    
    if (!userId) {
      throw new Error("Usuário não autenticado");
    }
    
    // Preparar dados para inserção no formato Supabase com userId
    const categoryData = categories.map((item, index) => ({
      name: item.name,
      slug: item.id, // Usar o id como slug
      order_index: index + 1,
      created_by: userId // Adicionar o criador da categoria
    }));
    
    // Use fetchWithTimeout para evitar problemas de conexão
    const insertPromise = async () => {
      return await supabase
        .from('community_categories')
        .insert(categoryData as any[])
        .select();
    };
    
    const { data, error } = await fetchWithTimeout(insertPromise, SHORT_TIMEOUT);
      
    if (error) {
      throw error;
    }
    
    console.log("Categorias migradas com sucesso para o Supabase:", data);
    toast.success("Categorias migradas com sucesso para o Supabase", { position: "bottom-right" });
  } catch (error) {
    handleError(error, "Não foi possível migrar as categorias para o Supabase");
  }
};

// Função para sincronizar categorias entre as tabelas categories e community_categories
export const syncCategoriesToCommunityCategories = async (): Promise<void> => {
  try {
    console.log("Iniciando sincronização de categorias...");
    
    // 1. Obter todas as categorias da tabela categories
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('categories')
      .select('*');
      
    if (categoriesError) {
      throw categoriesError;
    }
    
    if (!categoriesData || categoriesData.length === 0) {
      console.log("Nenhuma categoria encontrada para sincronizar");
      return;
    }
    
    console.log(`Encontradas ${categoriesData.length} categorias para sincronizar`);
    
    // 2. Para cada categoria, verificar se já existe na tabela community_categories
    for (const category of categoriesData) {
      const { data: existingData, error: checkError } = await supabase
        .from('community_categories')
        .select('id')
        .eq('name', category.name)
        .maybeSingle();
        
      if (checkError) {
        console.error(`Erro ao verificar categoria ${category.name}:`, checkError);
        continue;
      }
      
      // Se a categoria não existir em community_categories, inseri-la
      if (!existingData) {
        const { error: insertError } = await supabase
          .from('community_categories')
          .insert({
            name: category.name,
            slug: category.slug,
            order_index: categoriesData.indexOf(category) + 1
          });
          
        if (insertError) {
          console.error(`Erro ao inserir categoria ${category.name} em community_categories:`, insertError);
        } else {
          console.log(`Categoria ${category.name} sincronizada com sucesso`);
        }
      } else {
        console.log(`Categoria ${category.name} já existe em community_categories`);
      }
    }
    
    console.log("Sincronização de categorias concluída");
    
  } catch (error) {
    console.error("Erro ao sincronizar categorias:", error);
    toast.error("Erro ao sincronizar categorias", { position: "bottom-right" });
  }
};
