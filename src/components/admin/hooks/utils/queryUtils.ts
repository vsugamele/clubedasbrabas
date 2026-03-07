
import { SupabaseClient } from "@supabase/supabase-js";
import { PostgrestResponse, PostgrestSingleResponse } from "@supabase/supabase-js";

// Constants for timeouts
export const SHORT_TIMEOUT = 8000; // 8 segundos para operações rápidas
export const MEDIUM_TIMEOUT = 15000; // 15 segundos para operações médias
export const LONG_TIMEOUT = 30000; // 30 segundos para operações mais longas

// Type for retry configuration options
export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  factor?: number;
  timeoutMs?: number;
  onRetry?: (attempt: number, delay: number, error: any) => void;
}

// Default retry configuration
const defaultRetryOptions: RetryOptions = {
  maxAttempts: 4, // Aumentado para 4 tentativas padrão
  initialDelay: 500, // Iniciando com 500ms (mais rápido)
  maxDelay: 8000, // Máximo de 8 segundos entre tentativas
  factor: 2,
  timeoutMs: 15000, // Timeout padrão de 15 segundos
  onRetry: (attempt, delay, error) => console.log(`Tentativa ${attempt}, próxima em ${delay}ms. Erro: ${error?.message || 'Desconhecido'}`)
};

/**
 * Convert any function to a Promise (if it's not already)
 * This was missing and causing the error
 */
export function asPromise<T>(fn: () => Promise<T> | T): Promise<T> {
  try {
    const result = fn();
    return result instanceof Promise ? result : Promise.resolve(result);
  } catch (error) {
    return Promise.reject(error);
  }
}

/**
 * Promise with timeout utility
 */
export function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage = 'Operação expirou'): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);

    promise
      .then((result) => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

/**
 * Wrapper for fetch operations with timeout
 */
export function fetchWithTimeout<T>(fetchFn: () => Promise<T>, timeoutMs: number = SHORT_TIMEOUT): Promise<T> {
  return withTimeout(
    fetchFn(),
    timeoutMs,
    `Tempo limite de ${timeoutMs}ms excedido na operação`
  );
}

/**
 * Function to wait for a specific time
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Enhanced retry logic for Supabase queries with backoff, timeout and better error handling
 */
export async function queryWithRetry<T>(
  queryFn: () => Promise<T> | T,
  options: RetryOptions = {}
): Promise<T> {
  // Merge options with defaults
  const config = { ...defaultRetryOptions, ...options };
  const { maxAttempts, initialDelay, maxDelay, factor, timeoutMs, onRetry } = config;

  let attempts = 0;
  let lastDelay = initialDelay!;
  let lastError: any = null;

  while (attempts < maxAttempts!) {
    attempts++;
<<<<<<< HEAD

    try {
      console.log(`Executando consulta (tentativa ${attempts}/${maxAttempts})`);

=======
    
    try {
      console.log(`Executando consulta (tentativa ${attempts}/${maxAttempts})`);
      
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
      // Add timeout to the query
      const response = await withTimeout(
        Promise.resolve(queryFn()),
        timeoutMs!,
        `Tempo limite de ${timeoutMs}ms excedido na consulta ao Supabase`
      );
<<<<<<< HEAD

      // If we have a Supabase response with an error property, treat it as a failure for retry
      if (response && typeof response === 'object' && 'error' in response && response.error) {
        lastError = response.error;

        // Check if this is a retriable error
        if (isRetriableError(response.error)) {
          console.warn(`Erro recuperável na tentativa ${attempts}/${maxAttempts}:`, response.error);

=======
      
      // If we have a Supabase response with an error property, treat it as a failure for retry
      if (response && typeof response === 'object' && 'error' in response && response.error) {
        lastError = response.error;
        
        // Check if this is a retriable error
        if (isRetriableError(response.error)) {
          console.warn(`Erro recuperável na tentativa ${attempts}/${maxAttempts}:`, response.error);
          
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
          // If we have more attempts, wait and retry
          if (attempts < maxAttempts!) {
            const delay = Math.min(lastDelay * (factor || 1), maxDelay!);
            lastDelay = delay;
<<<<<<< HEAD

            if (onRetry) {
              onRetry(attempts, delay, response.error);
            }

=======
            
            if (onRetry) {
              onRetry(attempts, delay, response.error);
            }
            
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
            await wait(delay);
            continue;
          }
        }
<<<<<<< HEAD

=======
        
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
        // Either we've exhausted attempts or it's a non-retriable error
        console.error(`Erro final após ${attempts} tentativas:`, response.error);
        return response;
      }
<<<<<<< HEAD

=======
      
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
      // Success case
      return response;
    } catch (error) {
      console.error(`Exceção na tentativa ${attempts}/${maxAttempts}:`, error);
      lastError = error;
<<<<<<< HEAD

=======
      
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
      // If we have more attempts, wait and retry
      if (attempts < maxAttempts!) {
        const delay = Math.min(lastDelay * (factor || 1), maxDelay!);
        lastDelay = delay;
<<<<<<< HEAD

        if (onRetry) {
          onRetry(attempts, delay, error);
        }

        await wait(delay);
        continue;
      }

=======
        
        if (onRetry) {
          onRetry(attempts, delay, error);
        }
        
        await wait(delay);
        continue;
      }
      
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
      // Re-throw the last error
      throw error;
    }
  }
<<<<<<< HEAD

=======
  
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
  // This should not happen, but TypeScript requires a return
  throw lastError || new Error(`Falha após ${maxAttempts} tentativas`);
}

/**
 * Check if the error is retriable
 */
export function isRetriableError(error: any): boolean {
  // Network errors, timeouts, 5xx errors are retriable
  if (!error) return false;
<<<<<<< HEAD

=======
  
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
  // Network error codes
  const retriableErrorCodes = [
    'ETIMEDOUT', 'ECONNRESET', 'ECONNABORTED', 'ENOTFOUND', 'EAI_AGAIN',
    'NETWORK_ERROR', 'TIMEOUT', 'CONNECTION_CLOSED', 'CONNECTION_ERROR',
    'SERVER_ERROR', 'INTERNAL_ERROR'
  ];
<<<<<<< HEAD

  if (error.code && retriableErrorCodes.includes(error.code)) {
    return true;
  }

=======
  
  if (error.code && retriableErrorCodes.includes(error.code)) {
    return true;
  }
  
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
  // Status codes 408, 429, 500, 502, 503, 504 são recuperáveis
  if (error.status) {
    return [408, 429, 500, 502, 503, 504].includes(error.status);
  }
<<<<<<< HEAD

  // Check error message for common network issues
  if (error.message) {
    const networkErrorTerms = [
      'timeout', 'network', 'connection', 'offline', 'unreachable',
      'refused', 'reset', 'aborted', 'failed', 'temporary'
    ];

    return networkErrorTerms.some(term =>
      error.message.toLowerCase().includes(term)
    );
  }

=======
  
  // Check error message for common network issues
  if (error.message) {
    const networkErrorTerms = [
      'timeout', 'network', 'connection', 'offline', 'unreachable', 
      'refused', 'reset', 'aborted', 'failed', 'temporary'
    ];
    
    return networkErrorTerms.some(term => 
      error.message.toLowerCase().includes(term)
    );
  }
  
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
  return false;
}

/**
 * Check if an error is related to network issues
 */
export function isNetworkRelatedError(error: any): boolean {
  if (!error) return false;
<<<<<<< HEAD

=======
  
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
  // Check specific error codes that indicate network issues
  if (error.code) {
    const networkErrorCodes = [
      'ETIMEDOUT', 'ECONNRESET', 'ECONNABORTED', 'ENOTFOUND', 'EAI_AGAIN',
      'ERR_NETWORK', 'ERR_CONNECTION_REFUSED', 'ERR_INTERNET_DISCONNECTED'
    ];
<<<<<<< HEAD

=======
    
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
    if (networkErrorCodes.includes(error.code)) {
      return true;
    }
  }
<<<<<<< HEAD

=======
  
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
  // Check error message for network-related terms
  if (error.message) {
    const networkErrorTerms = [
      'network', 'connection', 'internet', 'offline', 'timeout', 'unreachable',
      'refused', 'reset', 'aborted'
    ];
<<<<<<< HEAD

=======
    
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
    if (networkErrorTerms.some(term => error.message.toLowerCase().includes(term))) {
      return true;
    }
  }
<<<<<<< HEAD

=======
  
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
  // Check for specific HTTP status codes that might indicate network issues
  if (error.status && (error.status === 0 || error.status >= 500)) {
    return true;
  }
<<<<<<< HEAD

=======
  
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
  return false;
}

/**
 * Check if the browser is online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Wait for internet connection with timeout
 */
export async function waitForConnection(timeoutMs = 10000): Promise<boolean> {
  return new Promise((resolve) => {
    if (isOnline()) {
      resolve(true);
      return;
    }
<<<<<<< HEAD

=======
    
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
    const timeout = setTimeout(() => {
      window.removeEventListener('online', onOnline);
      resolve(false);
    }, timeoutMs);
<<<<<<< HEAD

=======
    
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
    function onOnline() {
      clearTimeout(timeout);
      window.removeEventListener('online', onOnline);
      resolve(true);
    }
<<<<<<< HEAD

=======
    
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
    window.addEventListener('online', onOnline);
  });
}

/**
 * Check if Supabase is available by performing a simple query
 */
export async function checkSupabaseAvailability(supabase: SupabaseClient): Promise<boolean> {
  try {
    // Use a very lightweight query to check availability
    const startTime = performance.now();
<<<<<<< HEAD

=======
    
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
    // First try a simple health check using auth.getSession()
    try {
      const { data, error } = await supabase.auth.getSession();
      if (!error) {
        const elapsed = performance.now() - startTime;
        console.log(`Verificação de disponibilidade do Supabase (getSession) levou ${elapsed.toFixed(2)}ms`);
        return true;
      }
    } catch (sessionError) {
      console.warn("Erro ao verificar sessão:", sessionError);
    }
<<<<<<< HEAD

    // Tentar várias tabelas em caso de falha
    const tables = ['profiles', 'c_community_categories', 'user_roles'];

=======
    
    // Tentar várias tabelas em caso de falha
    const tables = ['profiles', 'community_categories', 'user_roles'];
    
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('id', { count: 'exact', head: true })
          .limit(1)
          .maybeSingle();
<<<<<<< HEAD

=======
        
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
        if (!error) {
          const elapsed = performance.now() - startTime;
          console.log(`Verificação de disponibilidade do Supabase (${table}) levou ${elapsed.toFixed(2)}ms`);
          return true;
        }
      } catch (tableError) {
        console.warn(`Erro ao verificar tabela ${table}:`, tableError);
        continue;
      }
    }
<<<<<<< HEAD

    // Se chegou aqui, tentar uma última verificação simplificada
    try {
      const { error } = await supabase.from('c_profiles').select('count', { count: 'exact', head: true });

=======
    
    // Se chegou aqui, tentar uma última verificação simplificada
    try {
      const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
      
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
      if (!error) {
        const elapsed = performance.now() - startTime;
        console.log(`Verificação de disponibilidade do Supabase (count) levou ${elapsed.toFixed(2)}ms`);
        return true;
      }
    } catch (countError) {
      console.warn("Erro ao verificar contagem de perfis:", countError);
    }
<<<<<<< HEAD

=======
    
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
    // Se chegou aqui, todas as tentativas falharam
    return false;
  } catch (error) {
    console.error("Erro ao verificar disponibilidade do Supabase:", error);
    return false;
  }
}

/**
 * Setup a connection keep-alive ping to prevent connection timeouts
 */
export function setupConnectionKeepAlive(
<<<<<<< HEAD
  supabase: SupabaseClient,
  intervalMs: number = 25000
): { stopKeepAlive: () => void } {
  console.log("Configurando keep-alive para a conexão Supabase");

=======
  supabase: SupabaseClient, 
  intervalMs: number = 25000
): { stopKeepAlive: () => void } {
  console.log("Configurando keep-alive para a conexão Supabase");
  
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
  // Function to ping the Supabase server
  const pingServer = async () => {
    try {
      const startTime = performance.now();
      // Tentar múltiplas tabelas para maior robustez
      const tables = ['profiles', 'community_categories', 'user_roles'];
<<<<<<< HEAD

=======
      
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
      for (const table of tables) {
        try {
          await supabase.from(table).select('id', { count: 'exact', head: true }).limit(1);
          const elapsed = performance.now() - startTime;
          console.log(`Keep-alive ping: ${elapsed.toFixed(0)}ms (${table})`);
          return; // Se bem-sucedido, sair do loop
        } catch (err) {
          continue; // Tentar próxima tabela
        }
      }
<<<<<<< HEAD

=======
      
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
      // Último recurso: fazer um ping simples na sessão Auth
      try {
        await supabase.auth.getSession();
        const elapsed = performance.now() - startTime;
        console.log(`Keep-alive ping (auth): ${elapsed.toFixed(0)}ms`);
        return;
      } catch (err) {
        console.warn("Falha no ping de keep-alive (auth):", err);
      }
<<<<<<< HEAD

=======
      
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
      console.warn("Todos os pings de keep-alive falharam");
    } catch (error) {
      console.warn("Falha no ping de keep-alive:", error);
    }
  };
<<<<<<< HEAD

  // Executar ping inicial imediatamente
  pingServer();

  // Set up the interval
  const intervalId = setInterval(pingServer, intervalMs);

=======
  
  // Executar ping inicial imediatamente
  pingServer();
  
  // Set up the interval
  const intervalId = setInterval(pingServer, intervalMs);
  
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
  // Return a function to stop the keep-alive
  return {
    stopKeepAlive: () => {
      console.log("Parando keep-alive para conexão Supabase");
      clearInterval(intervalId);
    }
  };
}

// Adicionar função para implementar tentativas automáticas para Supabase
export const createReliableSupabaseClient = (supabase: SupabaseClient) => {
  // Configura ping periódico para manter conexão viva
  const { stopKeepAlive } = setupConnectionKeepAlive(supabase);
<<<<<<< HEAD

=======
  
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
  return {
    supabase, // Retorna o cliente original (não temos como alterar o cliente em si)
    stopKeepAlive // Método para interromper pings
  };
};
