-- Script para adicionar o campo is_active à tabela profiles
-- Este campo permitirá marcar usuários como ativos/inativos sem excluí-los

-- Verificar se a coluna já existe e adicionar se não existir
DO $$ 
BEGIN
  -- Adicionar a coluna is_active se não existir (padrão: true - todos ativos)
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    
    -- Atualizar todos os perfis existentes para ter is_active = true
    UPDATE public.profiles 
    SET is_active = TRUE;
    
    -- Adicionar comentário para documentação
    COMMENT ON COLUMN public.profiles.is_active IS 'Indica se o usuário está ativo no sistema. Usuários inativos não podem fazer login.';
  END IF;
  
  -- Adicionar índice para melhorar consultas
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_indexes 
    WHERE tablename = 'profiles' 
    AND indexname = 'idx_profiles_is_active'
  ) THEN
    CREATE INDEX idx_profiles_is_active ON public.profiles(is_active);
  END IF;
END $$;
