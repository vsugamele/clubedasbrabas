-- Adiciona campos de assinatura à tabela profiles

-- Adiciona o campo de tipo de assinatura (free ou premium)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscription_type TEXT DEFAULT 'free';

-- Adiciona o campo de data de início da assinatura premium
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP WITH TIME ZONE;

-- Adiciona o campo de data de fim da assinatura premium
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE;

-- Atualiza todos os usuários existentes para o plano gratuito por padrão
UPDATE profiles 
SET subscription_type = 'free' 
WHERE subscription_type IS NULL;

-- Índice para melhorar a performance de consultas por tipo de assinatura
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_type ON profiles(subscription_type);

-- Comentários para documentação
COMMENT ON COLUMN profiles.subscription_type IS 'Tipo de assinatura do usuário: free ou premium';
COMMENT ON COLUMN profiles.subscription_start_date IS 'Data de início da assinatura premium';
COMMENT ON COLUMN profiles.subscription_end_date IS 'Data de término da assinatura premium';
