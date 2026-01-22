-- Script para verificar a relação entre auth.users e profiles

-- 1. Verificar usuários na tabela auth.users
-- Esta consulta pode falhar se você não tiver permissão para acessar o esquema auth
SELECT id, email, role, created_at, confirmed_at
FROM auth.users;

-- 2. Verificar usuários na tabela profiles
SELECT id, username, full_name, updated_at
FROM profiles;

-- 3. Verificar quais usuários em auth.users não têm perfil correspondente
-- Esta consulta pode falhar se você não tiver permissão para acessar o esquema auth
SELECT au.id, au.email, au.created_at
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- 4. Verificar quais perfis não têm usuário correspondente em auth.users
-- Esta consulta pode falhar se você não tiver permissão para acessar o esquema auth
SELECT p.id, p.username, p.full_name
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE au.id IS NULL;

-- 5. Verificar se há alguma restrição de chave estrangeira entre as tabelas
SELECT
    tc.table_schema, 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND (tc.table_name = 'profiles' OR ccu.table_name = 'profiles');

-- 6. Verificar as políticas RLS na tabela profiles
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

-- 7. Verificar se o RLS está ativado na tabela profiles
SELECT
    relname,
    relrowsecurity
FROM
    pg_class
WHERE
    relname = 'profiles';
