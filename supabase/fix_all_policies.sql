-- Script completo para corrigir todas as políticas de segurança relacionadas a usuários
-- Este script resolve o problema de recursão infinita nas políticas RLS da tabela user_roles

-- 1. Primeiro, remover todas as políticas existentes que podem estar causando problemas
DROP POLICY IF EXISTS "Usuários podem ver seus próprios papéis" ON public.user_roles;
DROP POLICY IF EXISTS "Admins podem ver todos os papéis" ON public.user_roles;
DROP POLICY IF EXISTS "Admins podem modificar papéis" ON public.user_roles;
DROP POLICY IF EXISTS "Modificações apenas via função RPC" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can modify roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only RPC can modify roles" ON public.user_roles;

-- 2. Desativar temporariamente o RLS para a tabela user_roles
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- 3. Verificar e criar a função para verificar se um usuário é administrador
-- Esta função não usa recursão e verifica diretamente os emails de administradores
CREATE OR REPLACE FUNCTION public.is_admin_by_email(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN user_email IN (
    'admin@example.com',
    'superadmin@example.com',
    'tech@yourcompany.com',
    'vsugamele@gmail.com',
    'souzadecarvalho1986@gmail.com'
  );
END;
$$;

-- 4. Criar função para verificar se o usuário atual é administrador
CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_email TEXT;
BEGIN
  -- Obter o email do usuário atual
  SELECT email INTO current_email FROM auth.users WHERE id = auth.uid();
  
  -- Verificar se o email está na lista de administradores
  RETURN public.is_admin_by_email(current_email);
END;
$$;

-- 5. Criar a função assign_user_role com os parâmetros corretos
CREATE OR REPLACE FUNCTION public.assign_user_role(
  target_user_id UUID,
  new_role TEXT,
  is_admin_by_email BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  current_user_email TEXT;
  is_admin BOOLEAN;
BEGIN
  -- Obter o ID e email do usuário atual
  current_user_id := auth.uid();
  
  -- Verificar se o usuário atual é um administrador
  SELECT email INTO current_user_email FROM auth.users WHERE id = current_user_id;
  
  -- Verificar se o email está na lista de administradores
  is_admin := public.is_admin_by_email(current_user_email) OR is_admin_by_email;
  
  -- Permitir a atribuição apenas se o usuário for um administrador
  IF is_admin THEN
    -- Verificar se o usuário já tem um papel
    IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = target_user_id) THEN
      -- Atualizar o papel existente
      UPDATE public.user_roles
      SET role = new_role
      WHERE user_id = target_user_id;
    ELSE
      -- Inserir um novo papel
      INSERT INTO public.user_roles (user_id, role)
      VALUES (target_user_id, new_role);
    END IF;
    
    RETURN TRUE;
  ELSE
    RAISE EXCEPTION 'Permissão negada: apenas administradores podem atribuir papéis';
    RETURN FALSE;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao atribuir papel: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- 6. Criar a função para compatibilidade com versões anteriores do código
CREATE OR REPLACE FUNCTION public.assign_user_role(
  p_user_id UUID,
  p_role TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o usuário atual é um administrador
  IF public.current_user_is_admin() THEN
    -- Chamar a função principal com os novos parâmetros
    RETURN public.assign_user_role(p_user_id, p_role, TRUE);
  ELSE
    RAISE EXCEPTION 'Permissão negada: apenas administradores podem atribuir papéis';
    RETURN FALSE;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao atribuir papel: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- 7. Criar a função para corrigir políticas
CREATE OR REPLACE FUNCTION public.fix_user_roles_policies()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Remover todas as políticas existentes que podem estar causando a recursão
  DROP POLICY IF EXISTS "Usuários podem ver seus próprios papéis" ON public.user_roles;
  DROP POLICY IF EXISTS "Admins podem ver todos os papéis" ON public.user_roles;
  DROP POLICY IF EXISTS "Admins podem modificar papéis" ON public.user_roles;
  DROP POLICY IF EXISTS "Modificações apenas via função RPC" ON public.user_roles;
  DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
  DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
  DROP POLICY IF EXISTS "Admins can modify roles" ON public.user_roles;
  DROP POLICY IF EXISTS "Only RPC can modify roles" ON public.user_roles;
  
  -- Desativar RLS temporariamente para a tabela user_roles
  ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
  
  -- Criar novas políticas que evitam recursão
  -- Política para leitura: usuários podem ver seus próprios papéis
  CREATE POLICY "Usuários podem ver seus próprios papéis"
  ON public.user_roles
  FOR SELECT
  USING (
    auth.uid() = user_id
  );
  
  -- Política para leitura: admins podem ver todos os papéis
  -- Esta política usa uma verificação direta de email para evitar recursão
  CREATE POLICY "Admins podem ver todos os papéis"
  ON public.user_roles
  FOR SELECT
  USING (
    public.current_user_is_admin()
  );
  
  -- Política para inserção/atualização: admins podem modificar papéis
  CREATE POLICY "Admins podem modificar papéis"
  ON public.user_roles
  FOR ALL
  USING (
    public.current_user_is_admin()
  );
  
  -- Reativar RLS para a tabela user_roles
  ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao corrigir políticas: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- 8. Conceder permissões para as funções
GRANT EXECUTE ON FUNCTION public.is_admin_by_email(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_user_role(UUID, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_user_role(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fix_user_roles_policies() TO authenticated;

-- 9. Reativar RLS e aplicar as políticas
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
SELECT public.fix_user_roles_policies();

-- 10. Comentários explicativos
COMMENT ON FUNCTION public.is_admin_by_email IS 'Verifica se um email está na lista de administradores';
COMMENT ON FUNCTION public.current_user_is_admin IS 'Verifica se o usuário atual é um administrador';
COMMENT ON FUNCTION public.assign_user_role(UUID, TEXT, BOOLEAN) IS 'Atribui um papel a um usuário (versão nova)';
COMMENT ON FUNCTION public.assign_user_role(UUID, TEXT) IS 'Atribui um papel a um usuário (versão compatível)';
COMMENT ON FUNCTION public.fix_user_roles_policies IS 'Corrige as políticas de segurança da tabela user_roles';
