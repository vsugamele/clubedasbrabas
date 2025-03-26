// Tipos compartilhados para o gerenciamento de categorias

// Tipo para categorias excluídas
export interface DeletedCategory {
  id: string;
  original_id: string;
  name: string;
  slug: string;
  order_index?: number;
  deleted_at: string;
  deleted_by: string;
  created_at?: string;
  updated_at?: string;
}

// Tipo para categorias normais
export interface Category {
  id: string;
  name: string;
  slug: string;
  order_index?: number;
  created_at?: string;
  updated_at?: string;
  // Campos adicionais para compatibilidade com o código existente
  createdAt?: string;
  updatedAt?: string;
}

// Tipo para o formulário de categoria
export interface CategoryForm {
  name: string;
  slug: string;
  order_index?: number;
}

// Tipo para categoria do Supabase (para compatibilidade)
export interface SupabaseCategory {
  id: string;
  name: string;
  slug: string;
  order_index?: number;
  created_at?: string;
  updated_at?: string;
}

// Função auxiliar para mapear categorias do Supabase
export const mapCategoryFromSupabase = (category: SupabaseCategory): Category => {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    order_index: category.order_index,
    created_at: category.created_at,
    updated_at: category.updated_at,
    createdAt: category.created_at,
    updatedAt: category.updated_at
  };
};
