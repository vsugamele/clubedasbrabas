-- Script para unificar as políticas RLS na tabela profiles

-- 1. Remover todas as políticas existentes
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view any profile" ON profiles;
DROP POLICY IF EXISTS profiles_select_policy ON profiles;
DROP POLICY IF EXISTS profiles_insert_policy ON profiles;
DROP POLICY IF EXISTS profiles_update_policy ON profiles;
DROP POLICY IF EXISTS profiles_delete_policy ON profiles;

-- 2. Criar um conjunto unificado de políticas
-- Política para SELECT: permitir que qualquer pessoa veja todos os perfis
CREATE POLICY profiles_select_policy ON profiles
    FOR SELECT
    USING (true);

-- Política para INSERT: permitir que usuários autenticados criem seus próprios perfis
CREATE POLICY profiles_insert_policy ON profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Política para UPDATE: permitir que usuários autenticados atualizem apenas seus próprios perfis
CREATE POLICY profiles_update_policy ON profiles
    FOR UPDATE
    USING (auth.uid() = id);

-- Política para DELETE: permitir que usuários autenticados excluam apenas seus próprios perfis
CREATE POLICY profiles_delete_policy ON profiles
    FOR DELETE
    USING (auth.uid() = id);

-- 3. Verificar se as políticas foram criadas corretamente
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM
    pg_policies
WHERE
    tablename = 'profiles';

-- 4. Garantir que o RLS está ativado na tabela profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- IMPORTANTE: Depois de executar este script, você precisará:
-- 1. Reiniciar a aplicação
-- 2. Limpar o cache do navegador
-- 3. Tentar fazer login novamente
