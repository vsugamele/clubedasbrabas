-- Script para corrigir problemas de autenticação na página de perfil

-- 0. Primeiro, verificar a estrutura da tabela profiles para identificar o nome correto da coluna de ID do usuário
DO $$
DECLARE
  user_id_column TEXT := NULL;
  col_record RECORD;
BEGIN
  -- Verificar se a tabela profiles existe
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
  ) THEN
    -- Verificar se existe uma coluna 'user_id'
    IF EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'user_id'
    ) THEN
      user_id_column := 'user_id';
      RAISE NOTICE 'Coluna user_id encontrada na tabela profiles';
    -- Verificar se existe uma coluna 'id'
    ELSIF EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'id'
    ) THEN
      user_id_column := 'id';
      RAISE NOTICE 'Coluna id encontrada na tabela profiles, usando como ID do usuário';
    -- Verificar se existe uma coluna 'auth_id'
    ELSIF EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'auth_id'
    ) THEN
      user_id_column := 'auth_id';
      RAISE NOTICE 'Coluna auth_id encontrada na tabela profiles, usando como ID do usuário';
    ELSE
      -- Listar todas as colunas da tabela para diagnóstico
      RAISE NOTICE 'Nenhuma coluna de ID de usuário conhecida encontrada. Listando todas as colunas:';
      FOR col_record IN
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
      LOOP
        RAISE NOTICE 'Coluna encontrada: %', col_record.column_name;
      END LOOP;
    END IF;
    
    -- Salvar o nome da coluna em uma tabela temporária para uso posterior
    CREATE TEMP TABLE IF NOT EXISTS temp_profile_info (
      key TEXT PRIMARY KEY,
      value TEXT
    );
    
    INSERT INTO temp_profile_info (key, value)
    VALUES ('user_id_column', user_id_column)
    ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value;
    
    RAISE NOTICE 'Informações da tabela profiles salvas para uso posterior';
  ELSE
    RAISE NOTICE 'A tabela profiles não existe';
  END IF;
END
$$;

-- 1. Verificar se a tabela profiles existe e suas permissões
DO $$
DECLARE
  user_id_column TEXT;
BEGIN
  -- Recuperar o nome da coluna de ID do usuário
  SELECT value INTO user_id_column FROM temp_profile_info WHERE key = 'user_id_column';
  
  IF user_id_column IS NULL THEN
    RAISE NOTICE 'Não foi possível determinar a coluna de ID do usuário. Abortando.';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Usando coluna % como ID do usuário', user_id_column;
  
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
  ) THEN
    -- Garantir que a tabela profiles tem RLS ativado
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    
    -- Remover políticas existentes que podem estar causando problemas
    DROP POLICY IF EXISTS profiles_select_policy ON profiles;
    DROP POLICY IF EXISTS profiles_insert_policy ON profiles;
    DROP POLICY IF EXISTS profiles_update_policy ON profiles;
    DROP POLICY IF EXISTS profiles_delete_policy ON profiles;
    
    -- Criar políticas mais permissivas para depuração
    -- Política para permitir que usuários autenticados vejam todos os perfis
    EXECUTE format('
      CREATE POLICY profiles_select_policy ON profiles
        FOR SELECT
        TO authenticated
        USING (true)
    ');
    
    -- Política para permitir que usuários criem seus próprios perfis
    EXECUTE format('
      CREATE POLICY profiles_insert_policy ON profiles
        FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() = %I)
    ', user_id_column);
    
    -- Política para permitir que usuários editem seus próprios perfis
    EXECUTE format('
      CREATE POLICY profiles_update_policy ON profiles
        FOR UPDATE
        TO authenticated
        USING (auth.uid() = %I)
    ', user_id_column);
    
    RAISE NOTICE 'Políticas da tabela profiles atualizadas com sucesso.';
  ELSE
    RAISE NOTICE 'A tabela profiles não existe.';
  END IF;
END
$$;

-- 2. Verificar e corrigir a função de verificação de autenticação
CREATE OR REPLACE FUNCTION is_authenticated()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.role() = 'authenticated';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Verificar e corrigir a função de obtenção do perfil atual
DO $$
DECLARE
  user_id_column TEXT;
BEGIN
  -- Recuperar o nome da coluna de ID do usuário
  SELECT value INTO user_id_column FROM temp_profile_info WHERE key = 'user_id_column';
  
  IF user_id_column IS NULL THEN
    RAISE NOTICE 'Não foi possível determinar a coluna de ID do usuário. Abortando.';
    RETURN;
  END IF;
  
  EXECUTE format('
    CREATE OR REPLACE FUNCTION get_current_profile()
    RETURNS SETOF profiles AS $func$
    BEGIN
      IF auth.uid() IS NULL THEN
        RAISE EXCEPTION ''Usuário não autenticado'';
      END IF;
      
      RETURN QUERY
      SELECT * FROM profiles
      WHERE %I = auth.uid();
    END;
    $func$ LANGUAGE plpgsql SECURITY DEFINER;
  ', user_id_column);
  
  RAISE NOTICE 'Função get_current_profile criada com sucesso.';
END
$$;

-- 4. Garantir que o usuário atual tenha um perfil
DO $$
DECLARE
  current_user_id UUID;
  profile_exists BOOLEAN;
  user_id_column TEXT;
BEGIN
  -- Recuperar o nome da coluna de ID do usuário
  SELECT value INTO user_id_column FROM temp_profile_info WHERE key = 'user_id_column';
  
  IF user_id_column IS NULL THEN
    RAISE NOTICE 'Não foi possível determinar a coluna de ID do usuário. Abortando.';
    RETURN;
  END IF;
  
  -- Obter o ID do usuário atual
  SELECT auth.uid() INTO current_user_id;
  
  IF current_user_id IS NULL THEN
    RAISE NOTICE 'Nenhum usuário autenticado encontrado.';
    RETURN;
  END IF;
  
  -- Verificar se o perfil existe
  EXECUTE format('
    SELECT EXISTS (
      SELECT 1 FROM profiles WHERE %I = $1
    )', user_id_column) INTO profile_exists USING current_user_id;
  
  -- Se o perfil não existir, criar um perfil básico
  IF NOT profile_exists THEN
    -- Verificar quais colunas existem na tabela profiles
    IF EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'username'
    ) THEN
      -- Se a tabela tiver uma coluna username
      EXECUTE format('
        INSERT INTO profiles (%I, username, created_at, updated_at)
        VALUES ($1, $2, NOW(), NOW())
      ', user_id_column) USING current_user_id, 'user_' || substr(current_user_id::text, 1, 8);
    ELSE
      -- Inserção básica apenas com o ID do usuário
      EXECUTE format('
        INSERT INTO profiles (%I)
        VALUES ($1)
      ', user_id_column) USING current_user_id;
    END IF;
    
    RAISE NOTICE 'Perfil criado para o usuário atual.';
  ELSE
    RAISE NOTICE 'Perfil já existe para o usuário atual.';
  END IF;
END
$$;
