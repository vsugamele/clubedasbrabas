-- Script simplificado para corrigir problemas de autenticação na página de perfil

-- Listar todas as colunas da tabela profiles para diagnóstico
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'profiles';

-- Verificar políticas existentes
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Garantir que RLS está ativado
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes que podem estar causando problemas
DROP POLICY IF EXISTS profiles_select_policy ON profiles;
DROP POLICY IF EXISTS profiles_insert_policy ON profiles;
DROP POLICY IF EXISTS profiles_update_policy ON profiles;
DROP POLICY IF EXISTS profiles_delete_policy ON profiles;

-- Criar política permissiva para SELECT (permitir que todos os usuários autenticados vejam todos os perfis)
CREATE POLICY profiles_select_policy ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Verificar se a tabela tem coluna id
SELECT EXISTS (
  SELECT FROM information_schema.columns
  WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name = 'id'
) AS has_id_column;

-- Verificar se a tabela tem coluna user_id
SELECT EXISTS (
  SELECT FROM information_schema.columns
  WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name = 'user_id'
) AS has_user_id_column;

-- IMPORTANTE: Depois de executar este script, verifique os resultados acima
-- e execute manualmente o comando apropriado abaixo, dependendo de qual coluna existe:

-- Se a tabela tiver coluna 'id':
-- CREATE POLICY profiles_update_policy ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
-- CREATE POLICY profiles_insert_policy ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Se a tabela tiver coluna 'user_id':
-- CREATE POLICY profiles_update_policy ON profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
-- CREATE POLICY profiles_insert_policy ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Verificar se o usuário atual tem um perfil
SELECT auth.uid() AS current_user_id;

-- IMPORTANTE: Depois de verificar o ID do usuário atual, você pode criar um perfil manualmente se necessário:
-- INSERT INTO profiles (id, username) VALUES ('seu-user-id-aqui', 'seu-username-aqui');
-- ou
-- INSERT INTO profiles (user_id, username) VALUES ('seu-user-id-aqui', 'seu-username-aqui');
