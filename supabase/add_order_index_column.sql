-- Adicionar coluna order_index à tabela community_categories
ALTER TABLE community_categories ADD COLUMN IF NOT EXISTS order_index INTEGER;

-- Atualizar as categorias existentes com valores sequenciais para order_index
WITH indexed_categories AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY name) as row_num
  FROM community_categories
)
UPDATE community_categories
SET order_index = indexed_categories.row_num
FROM indexed_categories
WHERE community_categories.id = indexed_categories.id;

-- Definir um valor padrão para novas categorias
ALTER TABLE community_categories ALTER COLUMN order_index SET DEFAULT 0;
