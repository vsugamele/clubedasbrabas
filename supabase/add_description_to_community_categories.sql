-- Adicionar coluna description à tabela community_categories se ela não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'community_categories'
        AND column_name = 'description'
    ) THEN
        ALTER TABLE community_categories
        ADD COLUMN description TEXT DEFAULT '';
        
        RAISE NOTICE 'Coluna description adicionada à tabela community_categories';
    ELSE
        RAISE NOTICE 'Coluna description já existe na tabela community_categories';
    END IF;
END $$;
