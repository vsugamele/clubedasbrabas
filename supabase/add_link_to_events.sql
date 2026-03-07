-- Script para adicionar a coluna 'link' à tabela 'events'
ALTER TABLE events ADD COLUMN IF NOT EXISTS link TEXT;

-- Atualizar as políticas de segurança para incluir a nova coluna
BEGIN;
  -- Recriar a política de leitura para incluir a nova coluna
  DROP POLICY IF EXISTS "Todos podem ler eventos" ON events;
  CREATE POLICY "Todos podem ler eventos" 
    ON events FOR SELECT 
    USING (true);
  
  -- Recriar a política de inserção para incluir a nova coluna
  DROP POLICY IF EXISTS "Usuários autenticados podem criar eventos" ON events;
  CREATE POLICY "Usuários autenticados podem criar eventos" 
    ON events FOR INSERT 
    TO authenticated 
    WITH CHECK (true);
  
  -- Recriar a política de atualização para incluir a nova coluna
  DROP POLICY IF EXISTS "Usuários autenticados podem atualizar eventos" ON events;
  CREATE POLICY "Usuários autenticados podem atualizar eventos" 
    ON events FOR UPDATE 
    TO authenticated 
    USING (true);
COMMIT;

-- Atualizar o cache do esquema para reconhecer a nova coluna
SELECT pg_notify('pgrst', 'reload schema');
