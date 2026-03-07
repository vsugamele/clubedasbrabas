-- Corrigir a chave estrangeira na tabela posts para apontar para community_categories
-- em vez de categories

-- Primeiro, verificar se a tabela posts existe
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name = 'posts'
  ) THEN
    -- Remover a chave estrangeira existente
    ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_category_id_fkey;
    
    -- Adicionar a nova chave estrangeira para community_categories
    ALTER TABLE posts ADD CONSTRAINT posts_category_id_fkey 
    FOREIGN KEY (category_id) REFERENCES community_categories(id);
    
    RAISE NOTICE 'Chave estrangeira da tabela posts atualizada com sucesso.';
  ELSE
    RAISE NOTICE 'A tabela posts não existe.';
  END IF;
END
$$;
