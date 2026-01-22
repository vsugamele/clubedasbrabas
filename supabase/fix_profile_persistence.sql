-- Script para corrigir problemas de persistência de perfil

-- 1. Verificar se o RLS está ativado na tabela profiles
SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'profiles';

-- 2. Garantir que o RLS está ativado
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. Remover todas as políticas existentes para evitar conflitos
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view any profile" ON profiles;
DROP POLICY IF EXISTS profiles_select_policy ON profiles;
DROP POLICY IF EXISTS profiles_insert_policy ON profiles;
DROP POLICY IF EXISTS profiles_update_policy ON profiles;
DROP POLICY IF EXISTS profiles_delete_policy ON profiles;

-- 4. Criar políticas mais permissivas para garantir acesso adequado
-- Política para SELECT: permitir que qualquer pessoa veja todos os perfis
CREATE POLICY profiles_select_policy ON profiles
    FOR SELECT
    USING (true);

-- Política para INSERT: permitir que usuários autenticados criem seus próprios perfis
CREATE POLICY profiles_insert_policy ON profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id OR auth.role() = 'service_role');

-- Política para UPDATE: permitir que usuários autenticados atualizem apenas seus próprios perfis
CREATE POLICY profiles_update_policy ON profiles
    FOR UPDATE
    USING (auth.uid() = id OR auth.role() = 'service_role');

-- Política para DELETE: permitir que usuários autenticados excluam apenas seus próprios perfis
CREATE POLICY profiles_delete_policy ON profiles
    FOR DELETE
    USING (auth.uid() = id OR auth.role() = 'service_role');

-- 5. Verificar se existem registros órfãos (usuários sem perfil)
WITH users_without_profiles AS (
    SELECT 
        au.id, 
        au.email 
    FROM 
        auth.users au
    LEFT JOIN 
        profiles p ON au.id = p.id
    WHERE 
        p.id IS NULL
)
SELECT * FROM users_without_profiles;

-- 6. Verificar se as políticas foram criadas corretamente
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

-- 7. Verificar todos os perfis existentes
SELECT 
    p.id, 
    p.full_name, 
    p.username, 
    p.avatar_url, 
    p.updated_at,
    a.email
FROM 
    profiles p
LEFT JOIN 
    auth.users a ON p.id = a.id
ORDER BY 
    p.updated_at DESC;
