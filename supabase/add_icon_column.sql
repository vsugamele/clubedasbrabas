-- Adicionar coluna icon à tabela communities
ALTER TABLE communities ADD COLUMN IF NOT EXISTS icon TEXT;

-- Atualizar as comunidades existentes com ícones padrão
UPDATE communities SET icon = '📚' WHERE icon IS NULL;
