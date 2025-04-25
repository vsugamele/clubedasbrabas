-- Script para garantir acesso de administrador ao usuário jpjpfreitasestudo@gmail.com
-- Execute este script no SQL Editor do Supabase

-- 1. Primeiro, identificar o ID do usuário pelo email
DO $$ 
DECLARE
  v_user_id uuid;
BEGIN
  -- Buscar o ID do usuário pelo email
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE email = 'jpjpfreitasestudo@gmail.com';
  
  -- Verificar se o usuário foi encontrado
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário com email jpjpfreitasestudo@gmail.com não encontrado';
  END IF;

  -- Exibir o ID para verificação
  RAISE NOTICE 'Usuário encontrado com ID: %', v_user_id;
  
  -- 2. Deletar qualquer papel existente (para evitar duplicatas)
  DELETE FROM public.user_roles WHERE user_id = v_user_id;
  
  -- 3. Inserir o usuário como administrador na tabela user_roles
  INSERT INTO public.user_roles (user_id, role, created_at)
  VALUES (v_user_id, 'admin', NOW());
  
  -- 4. Também atualizar o perfil para premium
  UPDATE public.profiles
  SET 
    subscription_type = 'premium',
    subscription_start_date = NOW(),
    subscription_end_date = NOW() + interval '1 year'
  WHERE id = v_user_id;
  
  RAISE NOTICE 'Acesso de administrador concedido com sucesso ao usuário %', v_user_id;
END $$;
