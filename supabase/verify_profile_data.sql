-- Script para verificar os dados do perfil no banco de dados

-- 1. Verificar se existem registros na tabela profiles
SELECT COUNT(*) FROM profiles;

-- 2. Listar todos os perfis com seus respectivos dados
SELECT 
    p.id, 
    p.full_name, 
    p.username, 
    p.avatar_url, 
    p.bio, 
    p.headline, 
    p.location, 
    p.updated_at,
    a.email
FROM 
    profiles p
LEFT JOIN 
    auth.users a ON p.id = a.id
ORDER BY 
    p.updated_at DESC;

-- 3. Verificar as políticas RLS ativas na tabela profiles
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

-- 4. Verificar se o RLS está ativado na tabela profiles
SELECT
    relname,
    relrowsecurity
FROM
    pg_class
WHERE
    relname = 'profiles';
