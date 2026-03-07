-- Script para sincronizar papéis de usuários e garantir persistência
-- Esta função garante que os papéis dos usuários sejam persistentes e corretamente sincronizados

-- Função para sincronizar papéis de usuários
CREATE OR REPLACE FUNCTION public.sync_user_roles()
RETURNS SETOF public.user_roles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_emails TEXT[] := ARRAY[
    'admin@example.com',
    'superadmin@example.com',
    'tech@yourcompany.com',
    'vsugamele@gmail.com',
    'souzadecarvalho1986@gmail.com'
  ];
  user_record RECORD;
BEGIN
  -- Para cada usuário no sistema
  FOR user_record IN 
    SELECT id, email FROM auth.users
  LOOP
    -- Verificar se o usuário já tem um papel atribuído
    IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = user_record.id) THEN
      -- Se não tiver papel, verificar se é um email admin
      IF user_record.email = ANY(admin_emails) THEN
        -- Inserir como admin
        INSERT INTO public.user_roles (user_id, role)
        VALUES (user_record.id, 'admin');
      ELSE
        -- Inserir como usuário regular
        INSERT INTO public.user_roles (user_id, role)
        VALUES (user_record.id, 'user');
      END IF;
    END IF;
  END LOOP;
  
  -- Retornar todos os papéis de usuários
  RETURN QUERY SELECT * FROM public.user_roles;
END;
$$;

-- Conceder permissão para usuários autenticados
GRANT EXECUTE ON FUNCTION public.sync_user_roles() TO authenticated;

-- Comentário explicativo
COMMENT ON FUNCTION public.sync_user_roles IS 
'Sincroniza papéis de usuários e garante que todos os usuários tenham um papel atribuído.';

-- Trigger para sincronizar papéis quando um novo usuário é criado
CREATE OR REPLACE FUNCTION public.sync_user_roles_on_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_emails TEXT[] := ARRAY[
    'admin@example.com',
    'superadmin@example.com',
    'tech@yourcompany.com',
    'vsugamele@gmail.com',
    'souzadecarvalho1986@gmail.com'
  ];
BEGIN
  -- Verificar se o novo usuário é um admin por email
  IF NEW.email = ANY(admin_emails) THEN
    -- Inserir como admin
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  ELSE
    -- Inserir como usuário regular
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar o trigger na tabela de usuários
DROP TRIGGER IF EXISTS sync_user_roles_trigger ON auth.users;
CREATE TRIGGER sync_user_roles_trigger
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_roles_on_new_user();

-- Comentário explicativo
COMMENT ON FUNCTION public.sync_user_roles_on_new_user IS 
'Trigger para atribuir automaticamente um papel quando um novo usuário é criado.';

-- Executar a sincronização para garantir que todos os usuários tenham papéis
SELECT public.sync_user_roles();
