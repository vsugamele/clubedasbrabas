-- Verificar se o trigger está ativo
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgname = 'backup_category_trigger';

-- Verificar se existem dados na tabela deleted_categories
SELECT * FROM deleted_categories;

-- Verificar as políticas na tabela deleted_categories
SELECT * FROM pg_policies WHERE tablename = 'deleted_categories';

-- Verificar se a coluna order_index existe na tabela community_categories
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'community_categories' 
AND column_name = 'order_index';
