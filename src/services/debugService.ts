/**
 * Serviço de debugging para ajudar a identificar problemas
 * durante o desenvolvimento e integração com serviços externos
 */

// Flag para controlar se o debug está ativo
const DEBUG_ENABLED = true;

/**
 * Função para logging de debug avançado
 * @param area Área da aplicação (auth, webhook, etc)
 * @param message Mensagem de debug
 * @param data Dados adicionais para logging
 */
export function debug(area: string, message: string, data?: any): void {
  if (!DEBUG_ENABLED) return;
  
  const timestamp = new Date().toISOString();
  const prefix = `[DEBUG][${area}][${timestamp}]`;
  
  if (data) {
    console.log(prefix, message, data);
  } else {
    console.log(prefix, message);
  }
}

/**
 * Log específico para erros
 */
export function logError(area: string, message: string, error: any): void {
  if (!DEBUG_ENABLED) return;
  
  const timestamp = new Date().toISOString();
  console.error(`[ERROR][${area}][${timestamp}]`, message, error);
}

/**
 * Função para interceptar e logar respostas HTTP
 */
export async function logHttpResponse(response: Response, area: string): Promise<string> {
  try {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      // Clonar a resposta para não consumir o corpo original
      const cloned = response.clone();
      const jsonData = await cloned.json();
      debug(area, `HTTP Response (${response.status}):`, jsonData);
      return JSON.stringify(jsonData);
    } else {
      const text = await response.clone().text();
      debug(area, `HTTP Response Text (${response.status}):`, text);
      return text;
    }
  } catch (error) {
    logError(area, 'Erro ao logar resposta HTTP', error);
    return 'Erro ao processar resposta';
  }
}
