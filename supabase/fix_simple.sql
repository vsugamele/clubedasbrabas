-- Script simplificado para corrigir o problema de recursão infinita
-- Este script é mais direto e foca apenas no essencial

-- 1. Remover todas as políticas existentes que causam problemas
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

-- 3. Criar função para verificar se um email é de administrador
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

-- 4. Criar função para atribuir papel a um usuário
CREATE OR REPLACE FUNCTION public.assign_user_role(p_user_id UUID, p_role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Remover qualquer papel existente
  DELETE FROM public.user_roles WHERE user_id = p_user_id;
  
  -- Inserir o novo papel
  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, p_role);
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- 5. Conceder permissões para usuários autenticados
GRANT EXECUTE ON FUNCTION public.assign_user_role(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_by_email(TEXT) TO authenticated;

-- 6. Reativar o RLS para a tabela user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 7. Criar políticas simples e seguras
-- Política para leitura: todos podem ler
CREATE POLICY "Everyone can read user_roles" ON public.user_roles
  FOR SELECT
  USING (true);

-- Política para inserção: apenas via função RPC
CREATE POLICY "Only RPC can insert roles" ON public.user_roles
  FOR INSERT
  WITH CHECK (false);  -- Ninguém pode inserir diretamente, apenas via RPC

-- Política para atualização: apenas via função RPC
CREATE POLICY "Only RPC can update roles" ON public.user_roles
  FOR UPDATE
  USING (false);  -- Ninguém pode atualizar diretamente, apenas via RPC

-- Política para exclusão: apenas via função RPC
CREATE POLICY "Only RPC can delete roles" ON public.user_roles
  FOR DELETE
  USING (false);  -- Ninguém pode excluir diretamente, apenas via RPC
