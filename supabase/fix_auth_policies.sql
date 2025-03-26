-- Verificar e corrigir políticas de autenticação

-- Verificar se o usuário está autenticado
SELECT auth.uid(), auth.role();

-- Verificar políticas existentes para a tabela de perfis
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Verificar se a tabela profiles existe
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
  ) THEN
    -- Garantir que as políticas corretas estejam configuradas
    -- Política para permitir que usuários vejam seus próprios perfis
    DROP POLICY IF EXISTS profiles_select_policy ON profiles;
    CREATE POLICY profiles_select_policy ON profiles
      FOR SELECT
      USING (auth.uid() = user_id OR auth.role() = 'authenticated');
    
    -- Política para permitir que usuários editem seus próprios perfis
    DROP POLICY IF EXISTS profiles_update_policy ON profiles;
    CREATE POLICY profiles_update_policy ON profiles
      FOR UPDATE
      USING (auth.uid() = user_id);
    
    -- Habilitar RLS na tabela profiles
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    
    RAISE NOTICE 'Políticas da tabela profiles atualizadas com sucesso.';
  ELSE
    RAISE NOTICE 'A tabela profiles não existe.';
  END IF;
END
$$;

-- Verificar se a tabela users existe
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'auth'
    AND table_name = 'users'
  ) THEN
    -- Verificar se o usuário tem permissão para acessar a tabela auth.users
    GRANT SELECT ON auth.users TO authenticated;
    
    RAISE NOTICE 'Permissões para auth.users atualizadas com sucesso.';
  ELSE
    RAISE NOTICE 'A tabela auth.users não existe ou não é acessível.';
  END IF;
END
$$;
