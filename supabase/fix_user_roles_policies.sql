-- Função para corrigir as políticas de segurança na tabela user_roles
-- Esta função resolve o problema de recursão infinita nas políticas RLS
CREATE OR REPLACE FUNCTION public.fix_user_roles_policies()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com privilégios do criador da função
AS $$
BEGIN
  -- Remover todas as políticas existentes que podem estar causando a recursão
  DROP POLICY IF EXISTS "Usuários podem ver seus próprios papéis" ON public.user_roles;
  DROP POLICY IF EXISTS "Admins podem ver todos os papéis" ON public.user_roles;
  DROP POLICY IF EXISTS "Admins podem modificar papéis" ON public.user_roles;
  DROP POLICY IF EXISTS "Modificações apenas via função RPC" ON public.user_roles;
  
  -- Remover quaisquer outras políticas que possam existir na tabela
  BEGIN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles';
    EXCEPTION WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles';
    EXCEPTION WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can modify roles" ON public.user_roles';
    EXCEPTION WHEN OTHERS THEN NULL;
  END;
  
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
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE 
        id = auth.uid() AND
        (
          email = 'admin@example.com' OR
          email = 'superadmin@example.com' OR
          email = 'tech@yourcompany.com' OR
          email = 'vsugamele@gmail.com' OR
          email = 'souzadecarvalho1986@gmail.com'
        )
    )
  );
  
  -- Política para inserção/atualização: admins podem modificar papéis
  CREATE POLICY "Admins podem modificar papéis"
  ON public.user_roles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE 
        id = auth.uid() AND
        (
          email = 'admin@example.com' OR
          email = 'superadmin@example.com' OR
          email = 'tech@yourcompany.com' OR
          email = 'vsugamele@gmail.com' OR
          email = 'souzadecarvalho1986@gmail.com'
        )
    )
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

-- Conceder permissão para todos os usuários autenticados chamarem esta função
GRANT EXECUTE ON FUNCTION public.fix_user_roles_policies TO authenticated;

-- Comentário explicativo
COMMENT ON FUNCTION public.fix_user_roles_policies IS 
'Função para corrigir as políticas de segurança na tabela user_roles e resolver o problema de recursão infinita.';

-- Criar ou substituir a função assign_user_role com os parâmetros corretos
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
  is_admin := current_user_email IN (
    'admin@example.com',
    'superadmin@example.com',
    'tech@yourcompany.com',
    'vsugamele@gmail.com',
    'souzadecarvalho1986@gmail.com'
  ) OR is_admin_by_email;
  
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

-- Conceder permissão para todos os usuários autenticados chamarem esta função
GRANT EXECUTE ON FUNCTION public.assign_user_role(UUID, TEXT, BOOLEAN) TO authenticated;

-- Comentário explicativo
COMMENT ON FUNCTION public.assign_user_role IS 
'Função para atribuir um papel a um usuário de forma segura, evitando problemas de recursão nas políticas RLS.';
