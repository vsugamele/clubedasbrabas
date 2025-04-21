/**
 * Serviço para gerenciar webhooks de integração com N8N
 * Este serviço gerencia o envio de notificações para processos externos
 * como registro de usuários e recuperação de senha
 */
import { debug, logError, logHttpResponse } from './debugService';

// URLs dos webhooks do N8N (substitua pelas URLs reais dos seus workflows no N8N)
// Estas URLs devem ser configuradas nas variáveis de ambiente em produção
const WEBHOOK_URLS = {
  // Webhook para processar cadastro de novos usuários
  USER_REGISTRATION: 'https://n8n-n8n.p6yhvh.easypanel.host/webhook-test/user-registration',
  
  // Webhook para processar pedidos de recuperação de senha
  PASSWORD_RESET: 'https://seu-n8n.exemplo.com/webhook/password-reset'
};

// Tipos para as requisições
interface UserRegistrationPayload {
  email: string;
  name: string;
  userId: string;
  createdAt: string;
  phone?: string;
  // Outros dados do usuário que você deseja enviar
  [key: string]: any;
}

interface PasswordResetPayload {
  email: string;
  userId?: string;
  resetToken?: string;
  requested_at: string;
}

// Função para enviar dados de novo cadastro para o N8N
export async function sendUserRegistrationWebhook(userData: UserRegistrationPayload): Promise<boolean> {
  try {
    debug('webhook', `Iniciando envio de dados para N8N [${WEBHOOK_URLS.USER_REGISTRATION}]`, { email: userData.email });
    
    // Preparar o payload
    const payload = {
      ...userData,
      source: 'clube-das-brabas-app',
      event: 'user_registered',
      timestamp: new Date().toISOString()
    };
    
    debug('webhook', 'Payload preparado para envio:', payload);
    
    // Tentar fazer o POST para o webhook
    try {
      debug('webhook', `Enviando POST request para: ${WEBHOOK_URLS.USER_REGISTRATION}`);
      debug('webhook', 'Payload:', payload);
      
      const response = await fetch(WEBHOOK_URLS.USER_REGISTRATION, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      // Tentativa alternativa com GET se o POST falhar
      if (!response.ok && response.status === 405) { // Method Not Allowed
        debug('webhook', 'POST não permitido, tentando com GET');
        
        // Converter payload para query params
        const queryParams = new URLSearchParams();
        Object.entries(payload).forEach(([key, value]) => {
          if (typeof value === 'object') {
            queryParams.append(key, JSON.stringify(value));
          } else {
            queryParams.append(key, String(value));
          }
        });
        
        const url = `${WEBHOOK_URLS.USER_REGISTRATION}?${queryParams.toString()}`;
        debug('webhook', `Tentativa alternativa com GET: ${url}`);
        
        return fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          }
        }).then(async getResponse => {
          await logHttpResponse(getResponse, 'webhook-fallback');
          return getResponse.ok;
        }).catch(getErr => {
          logError('webhook', 'Erro na tentativa alternativa com GET:', getErr);
          return false;
        });
      }
      
      // Logar a resposta completa
      await logHttpResponse(response, 'webhook');
      
      if (!response.ok) {
        const errorText = await response.text();
        logError('webhook', `Erro HTTP ${response.status} ao enviar dados para webhook:`, errorText);
        return false;
      }
      
      debug('webhook', 'Dados enviados com sucesso para N8N');
      return true;
    } catch (fetchError) {
      logError('webhook', 'Erro de rede ao tentar enviar para N8N:', fetchError);
      // Se estiver em desenvolvimento, simular sucesso para não bloquear o fluxo
      if (process.env.NODE_ENV !== 'production') {
        debug('webhook', 'Simulando sucesso em ambiente de desenvolvimento');
        return true;
      }
      return false;
    }
  } catch (error) {
    logError('webhook', 'Erro geral ao processar envio para N8N:', error);
    return false;
  }
}

// Função para enviar solicitação de recuperação de senha para o N8N
export async function sendPasswordResetWebhook(payload: PasswordResetPayload): Promise<boolean> {
  try {
    debug('webhook', `Enviando solicitação de recuperação de senha para N8N [${WEBHOOK_URLS.PASSWORD_RESET}]`, { email: payload.email });
    
    // Preparar o payload
    const requestPayload = {
      ...payload,
      source: 'clube-das-brabas-app',
      event: 'password_reset_requested',
      timestamp: new Date().toISOString()
    };
    
    debug('webhook', 'Payload de reset de senha:', requestPayload);
    
    try {
      debug('webhook', `Enviando POST request para reset de senha: ${WEBHOOK_URLS.PASSWORD_RESET}`);
      debug('webhook', 'Payload de reset:', requestPayload);
      
      const response = await fetch(WEBHOOK_URLS.PASSWORD_RESET, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestPayload)
      });
      
      // Logar a resposta completa
      await logHttpResponse(response, 'webhook');
      
      if (!response.ok) {
        const errorText = await response.text();
        logError('webhook', 'Erro ao enviar solicitação de reset de senha:', errorText);
        return false;
      }
      
      debug('webhook', 'Solicitação de recuperação de senha enviada com sucesso');
      return true;
    } catch (fetchError) {
      logError('webhook', 'Erro de rede ao tentar enviar solicitação de reset:', fetchError);
      // Se estiver em desenvolvimento, simular sucesso para não bloquear o fluxo
      if (process.env.NODE_ENV !== 'production') {
        debug('webhook', 'Simulando sucesso em ambiente de desenvolvimento');
        return true;
      }
      return false;
    }
  } catch (error) {
    logError('webhook', 'Erro geral ao processar envio de reset de senha:', error);
    return false;
  }
}

// Função utilitária para simular envio para ambientes de desenvolvimento
export function mockWebhookInDev(webhookType: 'registration' | 'password-reset', data: any): void {
  if (process.env.NODE_ENV !== 'production') {
    debug('webhook-mock', `Simulação de envio para webhook ${webhookType}`, data);
    // Salvar no localStorage para facilitar a depuração
    try {
      // Obter dados existentes ou inicializar array vazio
      const existingMocks = JSON.parse(localStorage.getItem('webhook-mocks') || '[]');
      
      // Adicionar nova simulação com timestamp
      existingMocks.push({
        type: webhookType,
        data: data,
        timestamp: new Date().toISOString()
      });
      
      // Salvar de volta no localStorage (limitando a 10 entradas)
      localStorage.setItem('webhook-mocks', JSON.stringify(existingMocks.slice(-10)));
    } catch (e) {
      console.warn('Erro ao salvar mock no localStorage:', e);
    }
  }
}

// Verifica se o ambiente de N8N está configurado
export function isWebhookConfigured(): boolean {
  const isConfigured = WEBHOOK_URLS.USER_REGISTRATION.includes('seu-n8n') === false;
  debug('webhook', `Verificação de configuração de webhook: ${isConfigured ? 'Configurado' : 'Não configurado'}`);
  return isConfigured;
}

// Função auxiliar para testar a conexão com o webhook
export async function testWebhookConnection(): Promise<{success: boolean, message: string}> {
  try {
    debug('webhook', 'Testando conexão com webhook');
    
    const testPayload = {
      test: true,
      timestamp: new Date().toISOString()
    };
    
    debug('webhook', `Testando conexão com POST request: ${WEBHOOK_URLS.USER_REGISTRATION}`);
    
    const response = await fetch(WEBHOOK_URLS.USER_REGISTRATION, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });
    
    // Tentar com GET se o POST falhar com status 405 (Método não permitido)
    if (!response.ok && response.status === 405) {
      debug('webhook', 'POST não permitido no teste, tentando com GET');
      
      // Converter payload para query params
      const queryParams = new URLSearchParams();
      Object.entries(testPayload).forEach(([key, value]) => {
        if (typeof value === 'object') {
          queryParams.append(key, JSON.stringify(value));
        } else {
          queryParams.append(key, String(value));
        }
      });
      
      const url = `${WEBHOOK_URLS.USER_REGISTRATION}?${queryParams.toString()}`;
      debug('webhook', `Tentativa alternativa com GET: ${url}`);
      
      const getResponse = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      // Processar a resposta da tentativa GET para o formato correto
      await logHttpResponse(getResponse, 'webhook-test-fallback');
      
      return {
        success: getResponse.ok,
        message: getResponse.ok 
          ? 'Conexão com webhook bem-sucedida via GET' 
          : `Erro via GET: ${getResponse.status} ${getResponse.statusText}`
      };
    }
    
    await logHttpResponse(response, 'webhook-test');
    
    if (response.ok) {
      return {
        success: true,
        message: 'Conexão com webhook bem-sucedida'
      };
    } else {
      return {
        success: false,
        message: `Erro ao conectar: ${response.status} ${response.statusText}`
      };
    }
  } catch (error) {
    logError('webhook-test', 'Erro ao testar conexão com webhook:', error);
    return {
      success: false,
      message: `Erro de conexão: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
