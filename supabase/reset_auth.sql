-- Script para corrigir problemas de autenticação (versão ultra simplificada)

-- 1. Verificar as tabelas existentes
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- 2. Garantir que as políticas de segurança permitam acesso
DO $$
BEGIN
  -- Garantir que a tabela profiles tenha RLS ativado
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
  ) THEN
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    
    -- Remover políticas existentes que podem estar causando problemas
    DROP POLICY IF EXISTS profiles_select_policy ON profiles;
    DROP POLICY IF EXISTS profiles_insert_policy ON profiles;
    DROP POLICY IF EXISTS profiles_update_policy ON profiles;
    DROP POLICY IF EXISTS profiles_delete_policy ON profiles;
    
    -- Criar políticas permissivas para depuração
    CREATE POLICY profiles_select_policy ON profiles
      FOR SELECT
      USING (true);
    
    CREATE POLICY profiles_insert_policy ON profiles
      FOR INSERT
      WITH CHECK (true);
    
    CREATE POLICY profiles_update_policy ON profiles
      FOR UPDATE
      USING (true);
    
    RAISE NOTICE 'Políticas da tabela profiles atualizadas com sucesso.';
  ELSE
    RAISE NOTICE 'A tabela profiles não existe.';
  END IF;
  
  -- Fazer o mesmo para a tabela community_categories
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name = 'community_categories'
  ) THEN
    ALTER TABLE community_categories ENABLE ROW LEVEL SECURITY;
    
    -- Remover políticas existentes
    DROP POLICY IF EXISTS community_categories_select_policy ON community_categories;
    DROP POLICY IF EXISTS community_categories_insert_policy ON community_categories;
    DROP POLICY IF EXISTS community_categories_update_policy ON community_categories;
    DROP POLICY IF EXISTS community_categories_delete_policy ON community_categories;
    
    -- Criar políticas permissivas
    CREATE POLICY community_categories_select_policy ON community_categories
      FOR SELECT
      USING (true);
    
    CREATE POLICY community_categories_insert_policy ON community_categories
      FOR INSERT
      WITH CHECK (true);
    
    CREATE POLICY community_categories_update_policy ON community_categories
      FOR UPDATE
      USING (true);
    
    CREATE POLICY community_categories_delete_policy ON community_categories
      FOR DELETE
      USING (true);
    
    RAISE NOTICE 'Políticas da tabela community_categories atualizadas com sucesso.';
  ELSE
    RAISE NOTICE 'A tabela community_categories não existe.';
  END IF;
  
  -- Fazer o mesmo para a tabela deleted_categories
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name = 'deleted_categories'
  ) THEN
    ALTER TABLE deleted_categories ENABLE ROW LEVEL SECURITY;
    
    -- Remover políticas existentes
    DROP POLICY IF EXISTS deleted_categories_select_policy ON deleted_categories;
    
    -- Criar política permissiva
    CREATE POLICY deleted_categories_select_policy ON deleted_categories
      FOR SELECT
      USING (true);
    
    RAISE NOTICE 'Políticas da tabela deleted_categories atualizadas com sucesso.';
  ELSE
    RAISE NOTICE 'A tabela deleted_categories não existe.';
  END IF;
END
$$;

-- IMPORTANTE: Depois de executar este script, você precisará:
-- 1. Reiniciar a aplicação
-- 2. Limpar o cache do navegador
-- 3. Tentar fazer login novamente
