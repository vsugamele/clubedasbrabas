-- Função para verificar se uma tabela existe
CREATE OR REPLACE FUNCTION check_table_exists(table_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name = check_table_exists.table_name
  ) INTO exists;
  
  RETURN exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se uma coluna existe em uma tabela
CREATE OR REPLACE FUNCTION check_column_exists(table_name TEXT, column_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = check_column_exists.table_name
    AND column_name = check_column_exists.column_name
  ) INTO exists;
  
  RETURN exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para adicionar uma coluna a uma tabela se ela não existir
CREATE OR REPLACE FUNCTION add_column_if_not_exists(
  table_name TEXT, 
  column_name TEXT, 
  column_type TEXT
)
RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = add_column_if_not_exists.table_name
    AND column_name = add_column_if_not_exists.column_name
  ) THEN
    EXECUTE format('ALTER TABLE %I ADD COLUMN %I %s', 
                  table_name, column_name, column_type);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para executar SQL dinâmico (use com cuidado!)
CREATE OR REPLACE FUNCTION execute_sql(sql_query TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar política para permitir que usuários autenticados chamem estas funções
ALTER FUNCTION check_table_exists(TEXT) SECURITY DEFINER;
ALTER FUNCTION check_column_exists(TEXT, TEXT) SECURITY DEFINER;
ALTER FUNCTION add_column_if_not_exists(TEXT, TEXT, TEXT) SECURITY DEFINER;
ALTER FUNCTION execute_sql(TEXT) SECURITY DEFINER;

-- Conceder permissão para usuários autenticados
GRANT EXECUTE ON FUNCTION check_table_exists(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_column_exists(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION add_column_if_not_exists(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION execute_sql(TEXT) TO authenticated;
