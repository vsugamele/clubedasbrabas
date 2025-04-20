import { Capacitor } from '@capacitor/core';
import { storageService } from './storage';

/**
 * Classe para otimização de desempenho em dispositivos móveis
 */
class PerformanceService {
  private isNative = Capacitor.isNativePlatform();
  private platform = Capacitor.getPlatform();
  private lowPowerMode = false;
  private imageQualityLevel: 'high' | 'medium' | 'low' = 'high';
  
  constructor() {
    this.init();
  }
  
  /**
   * Inicializa o serviço de performance
   */
  private async init() {
    // Carrega configurações salvas
    await this.loadSettings();
    
    // Registra listener de conectividade para ajustar configurações
    storageService.addConnectivityListener((online) => {
      if (!online) {
        // Em modo offline, reduz qualidade de imagens para economizar dados
        this.setImageQuality('low');
      } else {
        // Restaura qualidade normal quando volta a ficar online
        this.restoreImageQuality();
      }
    });
    
    // Monitora estado da bateria em dispositivos nativos
    if (this.isNative) {
      this.monitorBatteryStatus();
    }
  }
  
  /**
   * Carrega configurações salvas
   */
  private async loadSettings() {
    try {
      const settings = await storageService.getData('performance_settings', {
        imageQuality: 'high',
        animations: true
      });
      
      this.imageQualityLevel = settings.imageQuality;
    } catch (error) {
      console.error('Erro ao carregar configurações de performance:', error);
    }
  }
  
  /**
   * Salva configurações de performance
   */
  private async saveSettings() {
    try {
      await storageService.saveData('performance_settings', {
        imageQuality: this.imageQualityLevel,
        animations: !this.lowPowerMode
      });
    } catch (error) {
      console.error('Erro ao salvar configurações de performance:', error);
    }
  }
  
  /**
   * Monitora status da bateria para ajustar performance
   */
  private monitorBatteryStatus() {
    // Essa implementação dependeria de plugins nativos específicos
    // Para esse exemplo, usamos uma versão simplificada
    
    // Em uma implementação real, usaríamos:
    // 1. Um plugin como Device para obter info de bateria
    // 2. Listeners para quando bateria fica baixa
    
    if ('getBattery' in navigator) {
      // @ts-ignore - API experimental em alguns navegadores
      navigator.getBattery().then((battery: any) => {
        // Se bateria abaixo de 20%, ativa modo de baixo consumo
        if (battery.level < 0.2) {
          this.enableLowPowerMode();
        }
        
        // Monitora mudanças no nível de bateria
        battery.addEventListener('levelchange', () => {
          if (battery.level < 0.2) {
            this.enableLowPowerMode();
          } else if (battery.level > 0.3) {
            // Desativa quando a bateria volta a ter carga
            this.disableLowPowerMode();
          }
        });
      });
    }
  }
  
  /**
   * Ativa modo de baixo consumo
   */
  enableLowPowerMode() {
    this.lowPowerMode = true;
    this.setImageQuality('low');
    document.body.classList.add('low-power-mode');
    this.saveSettings();
  }
  
  /**
   * Desativa modo de baixo consumo
   */
  disableLowPowerMode() {
    this.lowPowerMode = false;
    this.restoreImageQuality();
    document.body.classList.remove('low-power-mode');
    this.saveSettings();
  }
  
  /**
   * Define qualidade de imagens
   */
  setImageQuality(quality: 'high' | 'medium' | 'low') {
    this.imageQualityLevel = quality;
    this.saveSettings();
  }
  
  /**
   * Restaura qualidade de imagem para a configuração do usuário
   */
  restoreImageQuality() {
    // Restaura para a qualidade configurada pelo usuário (padrão high)
    const userPreferredQuality = storageService.getData('user_image_quality', 'high');
    this.setImageQuality(userPreferredQuality as any);
  }
  
  /**
   * Ajusta URL de imagem com base nas configurações de qualidade
   */
  optimizeImageUrl(url: string): string {
    // Se não for URL válida ou for base64, retorna sem alterações
    if (!url || url.startsWith('data:') || !url.includes('://')) {
      return url;
    }
    
    // Se estamos em modo de baixa qualidade, adiciona parâmetros de qualidade
    // Isso vai depender do seu serviço de imagens (Cloudinary, imgix, etc)
    if (this.imageQualityLevel === 'low') {
      // Exemplo para Cloudinary
      if (url.includes('cloudinary.com')) {
        return url.replace('/upload/', '/upload/q_auto:low,f_auto/');
      }
      
      // Exemplo para Imgix
      if (url.includes('imgix.net')) {
        return `${url}${url.includes('?') ? '&' : '?'}q=35&w=400`;
      }
      
      // Supabase Storage (exemplo)
      if (url.includes('supabase.co/storage/v1')) {
        return `${url}?width=400&quality=35`;
      }
    } else if (this.imageQualityLevel === 'medium') {
      // Configurações de qualidade média
      if (url.includes('cloudinary.com')) {
        return url.replace('/upload/', '/upload/q_auto:good,f_auto/');
      }
      
      if (url.includes('imgix.net')) {
        return `${url}${url.includes('?') ? '&' : '?'}q=65&w=800`;
      }
      
      if (url.includes('supabase.co/storage/v1')) {
        return `${url}?width=800&quality=65`;
      }
    }
    
    return url;
  }
  
  /**
   * Determina se animações devem ser mostradas
   */
  shouldShowAnimations(): boolean {
    return !this.lowPowerMode;
  }
  
  /**
   * Obtém limite de itens a mostrar em listas com base no dispositivo
   */
  getListItemLimit(): number {
    // Em dispositivos com menos recursos, limita número de itens em listas
    return this.isNative && (this.platform === 'android' || this.lowPowerMode) ? 15 : 30;
  }
  
  /**
   * Verifica se deve usar carregamento lazy
   */
  shouldUseLazyLoading(): boolean {
    return true; // Sempre use lazy loading em imagens
  }
  
  /**
   * Atrasa execução de tarefas não críticas
   */
  scheduleNonCriticalTask(task: () => void, delayMs: number = 100): void {
    if ('requestIdleCallback' in window) {
      // @ts-ignore - Alguns navegadores não suportam typings corretos
      window.requestIdleCallback(() => task(), { timeout: 1000 });
    } else {
      setTimeout(task, delayMs);
    }
  }
}

// Singleton para o serviço de performance
export const performanceService = new PerformanceService();
