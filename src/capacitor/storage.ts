import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';
import { Network } from '@capacitor/network';

/**
 * Tipos de cache disponíveis
 */
export enum CacheType {
  POSTS = 'cache_posts',
  USER_DATA = 'cache_user',
  COMMENTS = 'cache_comments',
  COMMUNITIES = 'cache_communities',
  APP_STATE = 'app_state'
}

/**
 * Serviço de armazenamento offline para persistência de dados
 */
class StorageService {
  private networkStatus: { connected: boolean } = { connected: true };
  private listeners: Array<(status: boolean) => void> = [];
  
  constructor() {
    this.initNetworkListeners();
  }
  
  /**
   * Inicializa os listeners de estado da rede
   */
  private async initNetworkListeners() {
    if (Capacitor.isNativePlatform()) {
      // Obtém o status atual da rede
      this.networkStatus = await Network.getStatus();
      
      // Adiciona listeners para mudanças no estado da rede
      Network.addListener('networkStatusChange', (status) => {
        this.networkStatus = status;
        
        // Notifica os listeners
        this.listeners.forEach(listener => listener(status.connected));
        
        if (status.connected) {
          // Quando a conexão é retomada, sincroniza dados em cache
          this.syncOfflineData();
        }
      });
    }
  }
  
  /**
   * Verifica se o dispositivo está online
   */
  isOnline(): boolean {
    return this.networkStatus.connected;
  }
  
  /**
   * Adiciona um listener para mudanças de conectividade
   */
  addConnectivityListener(callback: (online: boolean) => void) {
    this.listeners.push(callback);
    // Retorna uma função para remover o listener
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }
  
  /**
   * Salva dados no armazenamento local
   */
  async saveData(key: string, data: any): Promise<void> {
    try {
      await Preferences.set({
        key, 
        value: JSON.stringify(data)
      });
    } catch (error) {
      console.error(`Erro ao salvar dados para ${key}:`, error);
    }
  }
  
  /**
   * Recupera dados do armazenamento local
   */
  async getData<T>(key: string, defaultValue: T | null = null): Promise<T | null> {
    try {
      const { value } = await Preferences.get({ key });
      return value ? JSON.parse(value) : defaultValue;
    } catch (error) {
      console.error(`Erro ao recuperar dados para ${key}:`, error);
      return defaultValue;
    }
  }
  
  /**
   * Remove dados do armazenamento local
   */
  async removeData(key: string): Promise<void> {
    try {
      await Preferences.remove({ key });
    } catch (error) {
      console.error(`Erro ao remover dados para ${key}:`, error);
    }
  }
  
  /**
   * Limpa todos os dados em cache
   */
  async clearAllData(): Promise<void> {
    try {
      await Preferences.clear();
    } catch (error) {
      console.error('Erro ao limpar todos os dados:', error);
    }
  }
  
  /**
   * Armazena uma requisição para ser executada quando voltar a ter conexão
   */
  async queueOfflineAction(action: {
    type: string;
    endpoint: string;
    method: string;
    data: any;
    timestamp: number;
  }): Promise<void> {
    try {
      // Recupera a fila atual
      const queueKey = 'offline_action_queue';
      const currentQueue = await this.getData<any[]>(queueKey, []);
      
      // Adiciona a nova ação à fila
      currentQueue.push(action);
      
      // Salva a fila atualizada
      await this.saveData(queueKey, currentQueue);
    } catch (error) {
      console.error('Erro ao enfileirar ação offline:', error);
    }
  }
  
  /**
   * Sincroniza dados offline quando a conexão é retomada
   */
  private async syncOfflineData(): Promise<void> {
    try {
      const queueKey = 'offline_action_queue';
      const actionQueue = await this.getData<any[]>(queueKey, []);
      
      if (!actionQueue || actionQueue.length === 0) {
        return;
      }
      
      console.log(`Sincronizando ${actionQueue.length} ações offline...`);
      
      // Processa cada ação enfileirada
      const failedActions = [];
      
      for (const action of actionQueue) {
        try {
          // Tenta executar a ação
          const response = await fetch(action.endpoint, {
            method: action.method,
            headers: {
              'Content-Type': 'application/json',
            },
            body: action.method !== 'GET' ? JSON.stringify(action.data) : undefined
          });
          
          if (!response.ok) {
            throw new Error(`Falha na sincronização: ${response.status}`);
          }
          
        } catch (error) {
          console.error('Erro ao sincronizar ação:', error);
          // Mantém na fila apenas ações que falharam recentemente (menos de 24 horas)
          if (Date.now() - action.timestamp < 24 * 60 * 60 * 1000) {
            failedActions.push(action);
          }
        }
      }
      
      // Atualiza a fila apenas com ações que falharam
      await this.saveData(queueKey, failedActions);
      
      // Notifica o usuário sobre a sincronização
      if (actionQueue.length - failedActions.length > 0) {
        console.log(`${actionQueue.length - failedActions.length} ações sincronizadas com sucesso.`);
      }
      
      if (failedActions.length > 0) {
        console.warn(`${failedActions.length} ações ainda na fila para sincronização.`);
      }
      
    } catch (error) {
      console.error('Erro durante sincronização offline:', error);
    }
  }
  
  /**
   * Armazena posts em cache para visualização offline
   */
  async cachePosts(posts: any[]): Promise<void> {
    // Adiciona timestamp para controle de expiração
    const cacheData = {
      posts,
      timestamp: Date.now()
    };
    
    await this.saveData(CacheType.POSTS, cacheData);
  }
  
  /**
   * Recupera posts em cache
   */
  async getCachedPosts(): Promise<any[]> {
    const cacheData = await this.getData<{posts: any[], timestamp: number}>(CacheType.POSTS, {posts: [], timestamp: 0});
    
    // Verifica se o cache expirou (24 horas)
    const expired = Date.now() - cacheData.timestamp > 24 * 60 * 60 * 1000;
    
    if (expired && this.isOnline()) {
      // Se expirou e estiver online, limpa o cache
      await this.removeData(CacheType.POSTS);
      return [];
    }
    
    return cacheData.posts;
  }
}

// Singleton para o serviço de armazenamento
export const storageService = new StorageService();
