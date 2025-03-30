// Script para consultar informações de comunidades específicas
import { createClient } from '@supabase/supabase-js';

// Usar as variáveis de ambiente diretamente do arquivo .env
const supabaseUrl = 'https://xmfuoakvhizhsrfnmvyn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtZnVvYWt2aGl6aHNyZm5tdnluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDY4OTM3NTQsImV4cCI6MjAyMjQ2OTc1NH0.Hn-zzMUNV-vFPmOQX3-N_1JTnLZIlJ9A_jR1MZsK_zg';

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: Variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY não definidas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function querySpecificCommunities() {
  console.log('Consultando comunidades específicas...');
  
  // Consultar a comunidade "Sejam Bem Vindas" (ID 4)
  const { data: bemVindas, error: bemVindasError } = await supabase
    .from('communities')
    .select('*')
    .eq('id', '4')
    .single();
    
  if (bemVindasError) {
    console.error('Erro ao consultar comunidade Sejam Bem Vindas:', bemVindasError);
  } else {
    console.log('Comunidade Sejam Bem Vindas:', bemVindas);
  }
  
  // Consultar a comunidade "Marketing" (ID 5)
  const { data: marketing, error: marketingError } = await supabase
    .from('communities')
    .select('*')
    .eq('id', '5')
    .single();
    
  if (marketingError) {
    console.error('Erro ao consultar comunidade Marketing:', marketingError);
  } else {
    console.log('Comunidade Marketing:', marketing);
  }
  
  // Listar todas as comunidades com suas categorias
  const { data: allCommunities, error: allCommunitiesError } = await supabase
    .from('communities')
    .select(`
      id, 
      name, 
      category_id,
      posting_restrictions
    `);
    
  if (allCommunitiesError) {
    console.error('Erro ao consultar todas as comunidades:', allCommunitiesError);
  } else {
    console.log('\nTodas as comunidades:');
    allCommunities.forEach(community => {
      console.log(`ID: ${community.id}, Nome: ${community.name}, Categoria ID: ${community.category_id}, Restrições: ${community.posting_restrictions}`);
    });
  }
}

querySpecificCommunities()
  .catch(error => {
    console.error('Erro ao executar consultas:', error);
  })
  .finally(() => {
    process.exit(0);
  });
