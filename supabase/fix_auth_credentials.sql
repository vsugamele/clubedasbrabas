-- Script para verificar e corrigir problemas de autenticação

-- 1. Verificar configurações de autenticação
SELECT * FROM auth.config;

-- 2. Verificar usuários existentes (não mostra senhas)
SELECT id, email, confirmed_at, last_sign_in_at, created_at, updated_at, banned_until
FROM auth.users;

-- 3. Verificar se há usuários bloqueados
SELECT id, email, banned_until
FROM auth.users
WHERE banned_until IS NOT NULL;

-- 4. Verificar se há problemas com as tentativas de login
SELECT *
FROM auth.audit_log_entries
WHERE action = 'login'
ORDER BY created_at DESC
LIMIT 10;

-- 5. Verificar políticas de autenticação
SELECT *
FROM pg_policies
WHERE tablename IN ('users', 'identities', 'sessions')
AND schemaname = 'auth';

-- 6. Verificar configurações de e-mail
SELECT *
FROM auth.identities;

-- 7. Verificar se há problemas com as sessões
SELECT *
FROM auth.sessions
ORDER BY created_at DESC
LIMIT 5;

-- 8. Verificar e corrigir configurações de autenticação
DO $$
BEGIN
  -- Aumentar o tempo de expiração do token para 30 dias (2592000 segundos)
  UPDATE auth.config
  SET value = '2592000'
  WHERE parameter = 'jwt_expiry';
  
  -- Garantir que a autenticação por e-mail esteja habilitada
  UPDATE auth.config
  SET value = 'true'
  WHERE parameter = 'enable_signup';
  
  RAISE NOTICE 'Configurações de autenticação atualizadas.';
END
$$;

-- 9. Limpar sessões expiradas
DELETE FROM auth.sessions
WHERE expires_at < NOW();

-- 10. Desbloquear todos os usuários que possam estar bloqueados
UPDATE auth.users
SET banned_until = NULL
WHERE banned_until IS NOT NULL;

-- 11. Verificar e corrigir permissões da tabela de usuários
GRANT SELECT ON auth.users TO authenticated;
GRANT SELECT ON auth.sessions TO authenticated;

-- IMPORTANTE: Execute este script no console SQL do Supabase
-- Depois de executar, tente fazer login novamente com suas credenciais
