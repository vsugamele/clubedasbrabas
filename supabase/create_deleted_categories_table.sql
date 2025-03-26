-- Criar tabela para armazenar categorias excluídas
CREATE TABLE IF NOT EXISTS deleted_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  original_id UUID,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar função para mover categoria para tabela de excluídos antes de excluir
CREATE OR REPLACE FUNCTION backup_category_before_delete()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO deleted_categories (
    original_id, 
    name, 
    slug, 
    order_index, 
    deleted_at,
    deleted_by,
    created_at,
    updated_at
  )
  VALUES (
    OLD.id,
    OLD.name,
    OLD.slug,
    OLD.order_index,
    NOW(),
    (SELECT auth.uid()),
    OLD.created_at,
    OLD.updated_at
  );
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para executar a função antes de excluir uma categoria
DROP TRIGGER IF EXISTS backup_category_trigger ON community_categories;
CREATE TRIGGER backup_category_trigger
BEFORE DELETE ON community_categories
FOR EACH ROW
EXECUTE FUNCTION backup_category_before_delete();

-- Criar política de acesso para a tabela deleted_categories
ALTER TABLE deleted_categories ENABLE ROW LEVEL SECURITY;

-- Permitir que usuários autenticados vejam categorias excluídas
DROP POLICY IF EXISTS view_deleted_categories ON deleted_categories;
CREATE POLICY view_deleted_categories ON deleted_categories
  FOR SELECT
  TO authenticated
  USING (true);

-- Permitir que apenas admins restaurem categorias excluídas
DROP POLICY IF EXISTS restore_deleted_categories ON deleted_categories;
CREATE POLICY restore_deleted_categories ON deleted_categories
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
