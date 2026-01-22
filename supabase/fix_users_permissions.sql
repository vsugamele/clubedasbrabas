-- Ajustar permissões para a tabela users
-- Este script concede permissões para operações de leitura na tabela users

-- Remover políticas existentes que podem estar causando conflitos
DROP POLICY IF EXISTS "Permitir acesso de leitura para todos os usuários autenticados" ON auth.users;

-- Criar uma nova política que permite acesso de leitura para usuários autenticados
CREATE POLICY "Permitir acesso de leitura para todos os usuários autenticados"
ON auth.users
FOR SELECT
TO authenticated
USING (true);

-- Garantir que a tabela tenha RLS habilitado
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Conceder permissões de leitura para o role anon (usuários não autenticados)
GRANT SELECT ON auth.users TO anon;

-- Conceder permissões de leitura para o role authenticated (usuários autenticados)
GRANT SELECT ON auth.users TO authenticated;

-- Conceder permissões de leitura para o role service_role (para operações de serviço)
GRANT SELECT, INSERT, UPDATE, DELETE ON auth.users TO service_role;
