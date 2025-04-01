// Script para excluir posts diretamente do banco de dados
// Uso: node delete-post.js <post_id>

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Configurar dotenv para encontrar o arquivo .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

// Verificar se as variáveis de ambiente estão definidas
if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_KEY não estão definidas.');
  console.error('Por favor, verifique o arquivo .env na pasta scripts.');
  process.exit(1);
}

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Obter ID do post a partir dos argumentos da linha de comando
const postId = process.argv[2];

if (!postId) {
  console.error('Erro: ID do post não fornecido.');
  console.error('Uso: node delete-post.js <post_id>');
  process.exit(1);
}

// Lista de tabelas relacionadas
const relatedTables = [
  'post_likes',
  'post_comments',
  'post_media',
  'post_polls',
  'poll_votes',
  'post_views',
  'post_shares',
  'post_saves',
  'post_reports'
];

// Função para excluir um post e seus registros relacionados
async function deletePost(postId) {
  console.log(`Iniciando exclusão do post ${postId}...`);
  
  try {
    // Verificar se o post existe
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single();
    
    if (postError) {
      console.error(`Erro ao verificar post ${postId}:`, postError);
      return false;
    }
    
    if (!post) {
      console.error(`Post ${postId} não encontrado.`);
      return false;
    }
    
    console.log(`Post encontrado: "${post.content.substring(0, 50)}${post.content.length > 50 ? '...' : ''}"`);
    console.log(`Autor: ${post.user_id}`);
    console.log(`Data de criação: ${post.created_at}`);
    
    // Excluir registros relacionados
    for (const tableName of relatedTables) {
      try {
        console.log(`Excluindo registros de ${tableName}...`);
        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq('post_id', postId);
        
        if (error) {
          console.warn(`Aviso: Erro ao excluir registros de ${tableName}:`, error);
        } else {
          console.log(`Registros de ${tableName} excluídos com sucesso.`);
        }
      } catch (err) {
        console.warn(`Aviso: Exceção ao excluir registros de ${tableName}:`, err);
      }
    }
    
    // Excluir o post
    console.log(`Excluindo post ${postId}...`);
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);
    
    if (error) {
      console.error(`Erro ao excluir post ${postId}:`, error);
      return false;
    }
    
    console.log(`Post ${postId} excluído com sucesso!`);
    return true;
  } catch (error) {
    console.error(`Erro ao excluir post ${postId}:`, error);
    return false;
  }
}

// Executar a função principal
deletePost(postId)
  .then(success => {
    if (success) {
      console.log('Operação concluída com sucesso.');
    } else {
      console.error('Falha na operação de exclusão.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Erro não tratado:', error);
    process.exit(1);
  });
