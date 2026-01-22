-- Script para configurar a funcionalidade de sugestões de conexões

-- Remover funções existentes se já existirem
DROP FUNCTION IF EXISTS public.check_table_exists(TEXT);
DROP FUNCTION IF EXISTS public.check_column_exists(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.get_user_comment_interactions(UUID);
DROP FUNCTION IF EXISTS public.create_connections_table();
DROP FUNCTION IF EXISTS public.check_connection_exists(UUID, UUID);
DROP FUNCTION IF EXISTS public.create_user_connection(UUID, UUID);

-- Função para verificar se uma tabela existe
CREATE OR REPLACE FUNCTION public.check_table_exists(table_name_param TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name = table_name_param
  ) INTO table_exists;
  
  RETURN table_exists;
END;
$$;

-- Função para verificar se uma coluna existe em uma tabela
CREATE OR REPLACE FUNCTION public.check_column_exists(table_name_param TEXT, column_name_param TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = table_name_param
    AND column_name = column_name_param
  ) INTO column_exists;
  
  RETURN column_exists;
END;
$$;

-- Função para buscar interações de comentários do usuário
CREATE OR REPLACE FUNCTION public.get_user_comment_interactions(user_id_param UUID)
RETURNS SETOF JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  -- Verificar se a tabela 'comments' existe
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name = 'comments'
  ) INTO table_exists;
  
  -- Se a tabela existir, retornar os post_ids dos comentários do usuário
  IF table_exists THEN
    RETURN QUERY 
      SELECT jsonb_build_object('post_id', post_id) 
      FROM comments 
      WHERE user_id = user_id_param;
  ELSE
    -- Se a tabela não existir, retornar conjunto vazio
    RETURN;
  END IF;
END;
$$;

-- Criar tabela de conexões se não existir
CREATE OR REPLACE FUNCTION public.create_connections_table()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  -- Verificar se a tabela já existe
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name = 'connections'
  ) INTO table_exists;
  
  -- Se a tabela não existir, criar
  IF NOT table_exists THEN
    CREATE TABLE public.connections (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      connected_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE(user_id, connected_user_id)
    );
    
    -- Adicionar políticas RLS
    ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
    
    -- Política para leitura
    CREATE POLICY "Usuários podem ver suas próprias conexões" 
      ON public.connections FOR SELECT 
      USING (auth.uid() = user_id);
    
    -- Política para inserção
    CREATE POLICY "Usuários podem criar suas próprias conexões" 
      ON public.connections FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
    
    -- Política para exclusão
    CREATE POLICY "Usuários podem excluir suas próprias conexões" 
      ON public.connections FOR DELETE 
      USING (auth.uid() = user_id);
    
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$;

-- Função para verificar se uma conexão existe
CREATE OR REPLACE FUNCTION public.check_connection_exists(current_user_param UUID, target_user_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  connection_exists BOOLEAN;
  table_exists BOOLEAN;
BEGIN
  -- Verificar se a tabela existe
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name = 'connections'
  ) INTO table_exists;
  
  -- Se a tabela não existir, retornar falso
  IF NOT table_exists THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar se a conexão existe
  SELECT EXISTS (
    SELECT FROM public.connections 
    WHERE user_id = current_user_param
    AND connected_user_id = target_user_param
  ) INTO connection_exists;
  
  RETURN connection_exists;
END;
$$;

-- Função para criar uma conexão entre usuários
CREATE OR REPLACE FUNCTION public.create_user_connection(current_user_param UUID, target_user_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  connection_exists BOOLEAN;
  table_exists BOOLEAN;
BEGIN
  -- Verificar se a tabela existe
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name = 'connections'
  ) INTO table_exists;
  
  -- Se a tabela não existir, criar
  IF NOT table_exists THEN
    PERFORM create_connections_table();
  END IF;
  
  -- Verificar se a conexão já existe
  SELECT EXISTS (
    SELECT FROM public.connections 
    WHERE user_id = current_user_param
    AND connected_user_id = target_user_param
  ) INTO connection_exists;
  
  -- Se a conexão não existir, criar
  IF NOT connection_exists THEN
    INSERT INTO public.connections (user_id, connected_user_id)
    VALUES (current_user_param, target_user_param);
    RETURN TRUE;
  ELSE
    RETURN TRUE; -- Já existe, então consideramos sucesso
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- Adicionar campo occupation à tabela profiles se não existir
DO $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'occupation'
  ) INTO column_exists;
  
  IF NOT column_exists THEN
    ALTER TABLE public.profiles ADD COLUMN occupation TEXT;
  END IF;
END $$;
