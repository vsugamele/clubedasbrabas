import { SplashScreen } from '@capacitor/splash-screen';
import { Capacitor } from '@capacitor/core';
import { notificationService } from './notifications';
import { storageService } from './storage';
import { performanceService } from './performance';

// Exporta todos os serviços nativos para fácil uso
export { cameraService } from './camera';
export { shareService } from './share';
export { notificationService } from './notifications';
export { storageService } from './storage';
export { performanceService } from './performance';

/**
 * Inicializa os recursos nativos do Capacitor quando o app está rodando em ambiente nativo
 */
export async function initializeCapacitor() {
  console.log(`Inicializando app no ambiente: ${Capacitor.isNativePlatform() ? 'nativo' : 'web'}`);
  
  // Inicializa serviços básicos que funcionam tanto em web quanto nativo
  await storageService.initialize?.();
  
  // Verifica se estamos rodando em um ambiente nativo
  if (Capacitor.isNativePlatform()) {
    console.log('Plataforma nativa detectada:', Capacitor.getPlatform());
    
    // Esconde a tela de splash após o carregamento
    try {
      await SplashScreen.hide();
    } catch (error) {
      console.error('Erro ao esconder splash screen:', error);
    }
    
    // Inicializa todos os serviços nativos
    try {
      // Inicializa notificações
      await notificationService.initialize();
      
      // Inicializa otimizações de performance
      performanceService.initialize?.();
      
      console.log('Todos os serviços nativos inicializados com sucesso');
    } catch (error) {
      console.error('Erro ao inicializar serviços nativos:', error);
    }
  } else {
    console.log('Rodando em ambiente web - funcionalidades nativas limitadas');
  }
  
  // Adiciona classe ao body para estilização específica com base na plataforma
  document.body.classList.add(Capacitor.isNativePlatform() ? 'native-app' : 'web-app');
  if (Capacitor.isNativePlatform()) {
    document.body.classList.add(`platform-${Capacitor.getPlatform()}`);
  }
}
