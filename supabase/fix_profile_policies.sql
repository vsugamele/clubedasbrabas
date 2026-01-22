-- Script para corrigir as políticas RLS na tabela profiles

-- 1. Verificar políticas existentes
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

-- 2. Remover políticas existentes que podem estar causando problemas
DROP POLICY IF EXISTS profiles_select_policy ON profiles;
DROP POLICY IF EXISTS profiles_insert_policy ON profiles;
DROP POLICY IF EXISTS profiles_update_policy ON profiles;
DROP POLICY IF EXISTS profiles_delete_policy ON profiles;

-- 3. Criar políticas permissivas para a tabela profiles

-- Política para SELECT: permitir que usuários autenticados vejam todos os perfis
CREATE POLICY profiles_select_policy ON profiles
    FOR SELECT
    TO authenticated
    USING (true);

-- Política para INSERT: permitir que usuários autenticados criem seus próprios perfis
CREATE POLICY profiles_insert_policy ON profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Política para UPDATE: permitir que usuários autenticados atualizem apenas seus próprios perfis
CREATE POLICY profiles_update_policy ON profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- Política para DELETE: permitir que usuários autenticados excluam apenas seus próprios perfis
CREATE POLICY profiles_delete_policy ON profiles
    FOR DELETE
    TO authenticated
    USING (auth.uid() = id);

-- 4. Verificar se as políticas foram criadas corretamente
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

-- 5. Garantir que o RLS está ativado na tabela profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- IMPORTANTE: Depois de executar este script, você precisará:
-- 1. Reiniciar a aplicação
-- 2. Limpar o cache do navegador
-- 3. Tentar fazer login novamente
