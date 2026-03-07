// Script para remover posts diretamente via API Supabase
// Uso: node remove-post.js <post_id>

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase - usando as mesmas credenciais do projeto
const supabaseUrl = 'https://weuifmgjzkuppqqsoood.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndldWlmbWdqemt1cHBxcXNvb29kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTI3NzY5MzMsImV4cCI6MjAyODM1MjkzM30.Hv8Qf_QIwUmMlBKPIRwQCQcJCIZdWRfxkCFfYnXWFnE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function forceDeletePost(postId) {
  console.log(`Iniciando exclusão forçada do post ${postId}`);
  
  // Verificar se o post existe
  const { data: postData, error: postError } = await supabase
    .from('posts')
    .select('*')
    .eq('id', postId)
    .single();
  
  if (postError) {
    console.error(`Post ${postId} não encontrado:`, postError);
    return false;
  }
  
  console.log(`Post encontrado:`, postData);
  
  // Lista de tabelas que podem ter relacionamentos com posts
  const relatedTables = [
    { name: 'post_likes', field: 'post_id' },
    { name: 'post_comments', field: 'post_id' },
    { name: 'post_media', field: 'post_id' },
    { name: 'post_polls', field: 'post_id' },
    { name: 'poll_votes', field: 'post_id' },
    { name: 'post_views', field: 'post_id' },
    { name: 'post_shares', field: 'post_id' },
    { name: 'post_saves', field: 'post_id' },
    { name: 'post_reports', field: 'post_id' }
  ];
  
  // Tentar excluir registros relacionados de cada tabela
  for (const { name, field } of relatedTables) {
    try {
      console.log(`Removendo registros relacionados da tabela ${name}...`);
      
      const { error } = await supabase
        .from(name)
        .delete()
        .eq(field, postId);
      
      if (error) {
        console.warn(`Erro ao excluir registros de ${name} para o post ${postId}:`, error);
      } else {
        console.log(`Registros de ${name} para o post ${postId} removidos com sucesso`);
      }
    } catch (error) {
      console.warn(`Exceção ao excluir registros de ${name} para o post ${postId}:`, error);
    }
  }
  
  // Verificar se o post está marcado como trending e remover essa marcação
  try {
    console.log(`Removendo marcação de trending do post ${postId}...`);
    
    const { error: updateError } = await supabase
      .from('posts')
      .update({ is_trending: false })
      .eq('id', postId);
    
    if (updateError) {
      console.warn(`Erro ao remover marcação de trending do post ${postId}:`, updateError);
    } else {
      console.log(`Marcação de trending do post ${postId} removida com sucesso`);
    }
  } catch (error) {
    console.warn(`Exceção ao remover marcação de trending do post ${postId}:`, error);
  }
  
  // Finalmente, excluir o post
  console.log(`Excluindo o post ${postId}...`);
  
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId);
  
  if (error) {
    console.error(`Erro ao excluir post ${postId}:`, error);
    return false;
  }
  
  console.log(`Post ${postId} excluído com sucesso`);
  return true;
}

// Obter o ID do post dos argumentos da linha de comando
const postId = process.argv[2];

if (!postId) {
  console.error('Por favor, forneça o ID do post como argumento.');
  console.error('Uso: node remove-post.js <post_id>');
  process.exit(1);
}

// Executar a função de exclusão
forceDeletePost(postId)
  .then(success => {
    if (success) {
      console.log(`Post ${postId} removido com sucesso!`);
    } else {
      console.error(`Falha ao remover o post ${postId}.`);
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Erro ao executar a exclusão:', error);
    process.exit(1);
  });
