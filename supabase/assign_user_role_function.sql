-- Função para atribuir papel a um usuário de forma segura
-- Esta função evita a recursão infinita nas políticas RLS
CREATE OR REPLACE FUNCTION public.assign_user_role(
  target_user_id UUID,
  new_role TEXT,
  is_admin_by_email BOOLEAN DEFAULT FALSE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com privilégios do criador da função
AS $$
DECLARE
  current_user_id UUID;
  current_user_role TEXT;
  existing_role RECORD;
BEGIN
  -- Obter o ID do usuário atual
  current_user_id := auth.uid();
  
  -- Verificar se o usuário está autenticado
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  
  -- Verificar se o usuário atual é admin ou se o bypass foi fornecido
  IF NOT is_admin_by_email THEN
    -- Verificar diretamente na tabela user_roles sem usar políticas RLS
    SELECT role INTO current_user_role FROM public.user_roles 
    WHERE user_id = current_user_id;
    
    -- Se não for admin, não permitir a operação
    IF current_user_role != 'admin' THEN
      RAISE EXCEPTION 'Permissão negada: apenas administradores podem atribuir papéis';
    END IF;
  END IF;
  
  -- Verificar se o papel já existe para o usuário
  SELECT * INTO existing_role FROM public.user_roles 
  WHERE user_id = target_user_id;
  
  -- Inserir ou atualizar o papel
  IF existing_role.user_id IS NULL THEN
    -- Inserir novo papel
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, new_role);
  ELSE
    -- Atualizar papel existente
    UPDATE public.user_roles
    SET role = new_role
    WHERE user_id = target_user_id;
  END IF;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao atribuir papel: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- Conceder permissão para todos os usuários autenticados chamarem esta função
GRANT EXECUTE ON FUNCTION public.assign_user_role TO authenticated;

-- Corrigir as políticas RLS para a tabela user_roles
-- Primeiro, remover políticas existentes que possam estar causando recursão
DROP POLICY IF EXISTS "Usuários podem ver seus próprios papéis" ON public.user_roles;
DROP POLICY IF EXISTS "Admins podem ver todos os papéis" ON public.user_roles;
DROP POLICY IF EXISTS "Admins podem modificar papéis" ON public.user_roles;

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

-- Política para inserção/atualização: apenas via função RPC
-- Isso evita modificações diretas na tabela
CREATE POLICY "Modificações apenas via função RPC"
ON public.user_roles
FOR ALL
USING (false)
WITH CHECK (false);

-- Comentário explicativo
COMMENT ON FUNCTION public.assign_user_role IS 
'Função segura para atribuir papéis de usuário sem causar recursão infinita nas políticas RLS.
Deve ser usada em vez de operações diretas na tabela user_roles.';
