// Script para listar posts do banco de dados
// Uso: node list-posts.js [limite] [termo_busca]

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

// Obter argumentos da linha de comando
const limit = parseInt(process.argv[2]) || 10;
const searchTerm = process.argv[3] || '';

// Função para listar posts
async function listPosts(limit, searchTerm) {
  console.log(`Buscando até ${limit} posts${searchTerm ? ` contendo "${searchTerm}"` : ''}...`);
  
  try {
    // Construir a consulta
    let query = supabase
      .from('posts')
      .select(`
        id,
        content,
        created_at,
        user_id,
        profiles(full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    // Adicionar filtro de busca se fornecido
    if (searchTerm) {
      query = query.ilike('content', `%${searchTerm}%`);
    }
    
    // Executar a consulta
    const { data: posts, error } = await query;
    
    if (error) {
      console.error('Erro ao buscar posts:', error);
      return false;
    }
    
    if (!posts || posts.length === 0) {
      console.log('Nenhum post encontrado.');
      return true;
    }
    
    console.log(`\n${posts.length} posts encontrados:\n`);
    
    // Exibir os posts
    posts.forEach((post, index) => {
      const author = post.profiles ? post.profiles.full_name : 'Usuário desconhecido';
      const date = new Date(post.created_at).toLocaleString();
      const content = post.content ? 
        (post.content.length > 50 ? post.content.substring(0, 50) + '...' : post.content) : 
        '[Sem conteúdo]';
      
      console.log(`${index + 1}. ID: ${post.id}`);
      console.log(`   Autor: ${author} (${post.user_id})`);
      console.log(`   Data: ${date}`);
      console.log(`   Conteúdo: ${content}`);
      console.log(`   Para excluir: node delete-post.js ${post.id}`);
      console.log('');
    });
    
    return true;
  } catch (error) {
    console.error('Erro ao listar posts:', error);
    return false;
  }
}

// Executar a função principal
listPosts(limit, searchTerm)
  .then(success => {
    if (success) {
      console.log('Operação concluída.');
    } else {
      console.error('Falha na operação de listagem.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Erro não tratado:', error);
    process.exit(1);
  });
