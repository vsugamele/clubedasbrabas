// Script para criar um usuário de teste no Supabase
import { createClient } from '@supabase/supabase-js';

// Usar as credenciais do Supabase diretamente
const supabaseUrl = 'https://xmfuoakvhizhsrfnmvyn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtZnVvYWt2aGl6aHNyZm5tdnluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDY4OTM3NTQsImV4cCI6MjAyMjQ2OTc1NH0.Hn-zzMUNV-vFPmOQX3-N_1JTnLZIlJ9A_jR1MZsK_zg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestUser() {
  try {
    console.log('Criando usuário de teste...');
    
    // Informações do usuário de teste
    const testEmail = 'teste@example.com';
    const testPassword = 'teste123';
    const testUsername = 'usuarioteste';
    const testFullName = 'Usuário de Teste';
    
    // Verificar se o usuário já existe
    const { data: existingUsers, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', testUsername);
      
    if (checkError) {
      console.error('Erro ao verificar usuário existente:', checkError);
      return;
    }
    
    if (existingUsers && existingUsers.length > 0) {
      console.log('Usuário de teste já existe.');
      return;
    }
    
    // Criar o usuário no Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          username: testUsername,
          full_name: testFullName,
        }
      }
    });
    
    if (authError) {
      console.error('Erro ao criar usuário de teste:', authError);
      return;
    }
    
    console.log('Usuário de teste criado com sucesso:', authData.user.id);
    
    // Criar o perfil do usuário
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        username: testUsername,
        full_name: testFullName,
        email: testEmail,
        avatar_url: null,
        is_admin: true // Marcar como admin para ter todas as permissões
      });
      
    if (profileError) {
      console.error('Erro ao criar perfil do usuário de teste:', profileError);
      return;
    }
    
    console.log('Perfil do usuário de teste criado com sucesso!');
    
  } catch (error) {
    console.error('Erro ao criar usuário de teste:', error);
  }
}

createTestUser()
  .catch(error => {
    console.error('Erro ao executar script:', error);
  })
  .finally(() => {
    process.exit(0);
  });
