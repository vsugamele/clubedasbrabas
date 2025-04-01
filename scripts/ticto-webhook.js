// Webhook para processar eventos da Ticto
// Este script recebe webhooks da Ticto e gerencia o cadastro/inativação de usuários
// com base no status da compra e no ID do produto

import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import express from 'express';
import bodyParser from 'body-parser';
import crypto from 'crypto';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Configuração do servidor Express
const app = express();
app.use(bodyParser.json());

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuração do Nodemailer para envio de emails
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// IDs de produtos que devem ser cadastrados automaticamente
const VALID_PRODUCT_IDS = ['82022', '81667', '81668'];

// Status que indicam aprovação da compra
const APPROVED_STATUSES = [
  'authorized',
  'all_charges_paid',
  'uncanceled'
];

// Status que indicam cancelamento
const CANCELED_STATUSES = [
  'subscription_canceled',
  'refunded',
  'chargeback'
];

// Função para gerar senha aleatória
function generatePassword(length = 10) {
  return crypto.randomBytes(Math.ceil(length/2))
    .toString('hex')
    .slice(0, length);
}

// Função para enviar email com dados de acesso
async function sendWelcomeEmail(email, password, name) {
  const mailOptions = {
    from: `"Clube das Brabas" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Bem-vinda ao Clube das Brabas - Seus dados de acesso',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://clubedasbrabas.com.br/logo.png" alt="Clube das Brabas" style="max-width: 150px;">
        </div>
        
        <h2 style="color: #ff4400; text-align: center;">Bem-vinda ao Clube das Brabas!</h2>
        
        <p>Olá, ${name || 'nova integrante'}!</p>
        
        <p>Estamos muito felizes em ter você conosco! Seu cadastro foi realizado com sucesso e agora você tem acesso a todo o conteúdo exclusivo do Clube das Brabas.</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Seus dados de acesso:</strong></p>
          <p style="margin: 10px 0;">Email: ${email}</p>
          <p style="margin: 10px 0;">Senha: ${password}</p>
        </div>
        
        <p>Para acessar a plataforma, basta entrar em <a href="https://app.clubedasbrabas.com.br" style="color: #ff4400;">app.clubedasbrabas.com.br</a> e fazer login com os dados acima.</p>
        
        <p>Recomendamos que você altere sua senha após o primeiro acesso.</p>
        
        <p>Se tiver qualquer dúvida, pode responder a este email ou entrar em contato pelo WhatsApp: (XX) XXXX-XXXX.</p>
        
        <p style="margin-top: 30px;">Abraços,<br>Equipe Clube das Brabas</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email de boas-vindas enviado para ${email}`);
    return true;
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return false;
  }
}

// Função para criar um novo usuário no Supabase
async function createUser(userData) {
  const { name, email, phone } = userData;
  
  try {
    // Verificar se o usuário já existe
    const { data: existingUsers, error: searchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email);
    
    if (searchError) {
      console.error('Erro ao verificar usuário existente:', searchError);
      return { success: false, error: searchError };
    }
    
    // Se o usuário já existe, apenas retornar
    if (existingUsers && existingUsers.length > 0) {
      console.log(`Usuário com email ${email} já existe`);
      
      // Se o usuário existente estiver inativo, reativá-lo
      if (!existingUsers[0].active) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ active: true })
          .eq('id', existingUsers[0].id);
          
        if (updateError) {
          console.error('Erro ao reativar usuário:', updateError);
        } else {
          console.log(`Usuário ${email} reativado com sucesso`);
        }
      }
      
      return { success: true, user: existingUsers[0], isNewUser: false };
    }
    
    // Gerar senha aleatória para o novo usuário
    const password = generatePassword();
    
    // Criar o usuário no Auth do Supabase
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });
    
    if (authError) {
      console.error('Erro ao criar usuário no Auth:', authError);
      return { success: false, error: authError };
    }
    
    // Criar o perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: authUser.user.id,
          email,
          full_name: name,
          phone,
          active: true,
          created_at: new Date().toISOString()
        }
      ]);
    
    if (profileError) {
      console.error('Erro ao criar perfil do usuário:', profileError);
      return { success: false, error: profileError };
    }
    
    // Enviar email com os dados de acesso
    await sendWelcomeEmail(email, password, name);
    
    console.log(`Novo usuário criado: ${email}`);
    return { success: true, user: authUser.user, password, isNewUser: true };
    
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return { success: false, error };
  }
}

// Função para inativar um usuário
async function deactivateUser(email) {
  try {
    // Buscar o usuário pelo email
    const { data: users, error: searchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email);
    
    if (searchError) {
      console.error('Erro ao buscar usuário:', searchError);
      return { success: false, error: searchError };
    }
    
    if (!users || users.length === 0) {
      console.log(`Usuário com email ${email} não encontrado`);
      return { success: false, error: 'Usuário não encontrado' };
    }
    
    // Inativar o usuário
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ active: false })
      .eq('id', users[0].id);
    
    if (updateError) {
      console.error('Erro ao inativar usuário:', updateError);
      return { success: false, error: updateError };
    }
    
    console.log(`Usuário ${email} inativado com sucesso`);
    return { success: true };
    
  } catch (error) {
    console.error('Erro ao inativar usuário:', error);
    return { success: false, error };
  }
}

// Rota para receber o webhook da Ticto
app.post('/webhook/ticto', async (req, res) => {
  try {
    console.log('Webhook recebido da Ticto:', JSON.stringify(req.body));
    
    // Extrair informações relevantes do webhook
    const { status, buyer, items } = req.body;
    
    if (!status || !buyer || !items || !items.length) {
      console.error('Webhook com dados incompletos');
      return res.status(400).json({ success: false, message: 'Dados incompletos' });
    }
    
    // Verificar se algum dos itens tem um product_id válido
    const hasValidProduct = items.some(item => VALID_PRODUCT_IDS.includes(String(item.product_id)));
    
    if (!hasValidProduct) {
      console.log('Webhook ignorado: nenhum produto válido encontrado');
      return res.status(200).json({ success: true, message: 'Webhook processado, mas nenhum produto válido' });
    }
    
    // Processar com base no status
    if (APPROVED_STATUSES.includes(status)) {
      // Status aprovado - criar ou reativar usuário
      const userData = {
        name: buyer.name,
        email: buyer.email,
        phone: buyer.phone
      };
      
      const result = await createUser(userData);
      
      if (result.success) {
        if (result.isNewUser) {
          console.log(`Novo usuário criado e email enviado: ${buyer.email}`);
        } else {
          console.log(`Usuário existente verificado: ${buyer.email}`);
        }
      } else {
        console.error('Erro ao processar usuário:', result.error);
      }
      
    } else if (CANCELED_STATUSES.includes(status)) {
      // Status de cancelamento - inativar usuário
      const result = await deactivateUser(buyer.email);
      
      if (result.success) {
        console.log(`Usuário inativado: ${buyer.email}`);
      } else {
        console.error('Erro ao inativar usuário:', result.error);
      }
    } else {
      console.log(`Status não processado: ${status}`);
    }
    
    return res.status(200).json({ success: true, message: 'Webhook processado com sucesso' });
    
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    return res.status(500).json({ success: false, message: 'Erro interno ao processar webhook' });
  }
});

// Iniciar o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor de webhook da Ticto rodando na porta ${PORT}`);
  
  // Adicionar uma rota para a página inicial
  app.get('/', (req, res) => {
    res.send(`
      <html>
        <head>
          <title>Webhook da Ticto</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
              line-height: 1.6;
            }
            h1 {
              color: #ff4400;
              border-bottom: 2px solid #f0f0f0;
              padding-bottom: 10px;
            }
            .endpoint {
              background-color: #f9f9f9;
              padding: 15px;
              border-radius: 5px;
              font-family: monospace;
              margin: 20px 0;
            }
            .status {
              color: green;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <h1>Servidor de Webhook da Ticto</h1>
          <p>Este servidor está configurado para receber webhooks da Ticto e processar automaticamente o cadastro e inativação de usuários.</p>
          
          <h2>Endpoint do Webhook</h2>
          <div class="endpoint">POST /webhook/ticto</div>
          
          <h2>Status</h2>
          <p class="status">Servidor ativo e aguardando webhooks</p>
          
          <h2>Produtos Válidos</h2>
          <ul>
            ${VALID_PRODUCT_IDS.map(id => `<li>ID: ${id}</li>`).join('')}
          </ul>
          
          <h2>Status Processados</h2>
          <h3>Status de Aprovação:</h3>
          <ul>
            ${APPROVED_STATUSES.map(status => `<li>${status}</li>`).join('')}
          </ul>
          
          <h3>Status de Cancelamento:</h3>
          <ul>
            ${CANCELED_STATUSES.map(status => `<li>${status}</li>`).join('')}
          </ul>
        </body>
      </html>
    `);
  });
});
