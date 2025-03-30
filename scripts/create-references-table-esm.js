// Script para criar a tabela de referências no Supabase (versão ES Module)
import { createClient } from '@supabase/supabase-js';

// Usar as credenciais do Supabase diretamente
const supabaseUrl = 'https://xmfuoakvhizhsrfnmvyn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtZnVvYWt2aGl6aHNyZm5tdnluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDY4OTM3NTQsImV4cCI6MjAyMjQ2OTc1NH0.Hn-zzMUNV-vFPmOQX3-N_1JTnLZIlJ9A_jR1MZsK_zg';

const supabase = createClient(supabaseUrl, supabaseKey);

// Função para criar a tabela references diretamente usando SQL
async function createReferencesTable() {
  try {
    console.log('Criando tabela references...');
    
    // SQL para criar a tabela references
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS references (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title TEXT NOT NULL,
        type TEXT NOT NULL,
        before_image TEXT,
        after_image TEXT,
        hair_type TEXT,
        finger_projection TEXT,
        angle TEXT,
        line_type TEXT,
        texture TEXT,
        cut_type TEXT,
        products_used TEXT,
        estimated_time TEXT,
        observations TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by UUID REFERENCES auth.users(id)
      );
    `;
    
    // Executar SQL para criar a tabela
    const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (createError) {
      console.error('Erro ao criar tabela references:', createError);
      return;
    }
    
    console.log('Tabela references criada com sucesso!');
    
    // SQL para criar políticas de segurança RLS
    const createPolicySQL = `
      ALTER TABLE references ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY "references_select_policy"
      ON references FOR SELECT
      USING (true);
      
      CREATE POLICY "references_insert_policy"
      ON references FOR INSERT
      WITH CHECK (auth.uid() = created_by);
      
      CREATE POLICY "references_update_policy"
      ON references FOR UPDATE
      USING (auth.uid() = created_by);
      
      CREATE POLICY "references_delete_policy"
      ON references FOR DELETE
      USING (auth.uid() = created_by);
    `;
    
    // Executar SQL para criar políticas
    const { error: policyError } = await supabase.rpc('exec_sql', { sql: createPolicySQL });
    
    if (policyError) {
      console.error('Erro ao criar políticas de segurança para references:', policyError);
      return;
    }
    
    console.log('Políticas de segurança criadas com sucesso!');
    
  } catch (error) {
    console.error('Exceção ao criar tabela references:', error);
  }
}

// Executar a função
createReferencesTable()
  .catch(error => {
    console.error('Erro ao executar script:', error);
  })
  .finally(() => {
    console.log('Script finalizado.');
  });
