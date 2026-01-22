// Script para criar a tabela de referências no Supabase
import { createClient } from '@supabase/supabase-js';

// Usar as credenciais do Supabase diretamente
const supabaseUrl = 'https://xmfuoakvhizhsrfnmvyn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtZnVvYWt2aGl6aHNyZm5tdnluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDY4OTM3NTQsImV4cCI6MjAyMjQ2OTc1NH0.Hn-zzMUNV-vFPmOQX3-N_1JTnLZIlJ9A_jR1MZsK_zg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createReferencesTable() {
  try {
    console.log('Verificando se a tabela references já existe...');
    
    // Verificar se a tabela já existe
    const { data: existingTables, error: listError } = await supabase
      .rpc('get_tables');
      
    if (listError) {
      console.error('Erro ao verificar tabelas existentes:', listError);
      return;
    }
    
    const tableExists = existingTables && existingTables.some(table => table === 'references');
    
    if (tableExists) {
      console.log('A tabela references já existe.');
      return;
    }
    
    console.log('Criando tabela references...');
    
    // Criar a tabela references
    const { error: createError } = await supabase
      .rpc('create_table', {
        table_name: 'references',
        columns: `
          id uuid primary key default uuid_generate_v4(),
          title text not null,
          type text not null,
          before_image text,
          after_image text,
          hair_type text,
          finger_projection text,
          angle text,
          line_type text,
          texture text,
          cut_type text,
          products_used text,
          estimated_time text,
          observations text,
          created_at timestamp with time zone default now(),
          created_by uuid references auth.users(id)
        `
      });
      
    if (createError) {
      console.error('Erro ao criar tabela references:', createError);
      return;
    }
    
    console.log('Tabela references criada com sucesso!');
    
    // Adicionar políticas de segurança RLS
    const { error: policyError } = await supabase
      .rpc('create_rls_policy', {
        table_name: 'references',
        policy_name: 'references_select_policy',
        definition: 'true',
        operation: 'SELECT'
      });
      
    if (policyError) {
      console.error('Erro ao criar política de segurança para references:', policyError);
      return;
    }
    
    console.log('Políticas de segurança criadas com sucesso!');
    
  } catch (error) {
    console.error('Exceção ao criar tabela references:', error);
  }
}

createReferencesTable()
  .catch(error => {
    console.error('Erro ao executar script:', error);
  })
  .finally(() => {
    process.exit(0);
  });
