-- Executar a função para corrigir as políticas de segurança
SELECT public.fix_user_roles_policies();

-- Verificar se as políticas foram aplicadas corretamente
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
    tablename = 'user_roles'
ORDER BY 
    policyname;
