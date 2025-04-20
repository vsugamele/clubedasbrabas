import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

// Interface para as notificações
export interface NotificationData {
  title: string;
  body: string;
  id?: string;
  data?: any;
}

/**
 * Serviço de notificações para gerenciar notificações push e locais
 */
class NotificationService {
  private initialized = false;
  
  /**
   * Inicializa o serviço de notificações
   */
  async initialize() {
    if (this.initialized || !Capacitor.isNativePlatform()) {
      return;
    }
    
    this.initialized = true;
    
    // Configura listeners para notificações push
    await this.setupPushNotifications();
    
    // Configura listeners para notificações locais
    await this.setupLocalNotifications();
  }
  
  /**
   * Configura as notificações push
   */
  private async setupPushNotifications() {
    try {
      // Registra handlers para eventos de notificação
      PushNotifications.addListener('registration', (token) => {
        console.log('Push registration success, token: ' + token.value);
        // Aqui você enviaria o token para seu backend
        this.sendTokenToServer(token.value);
      });
      
      PushNotifications.addListener('registrationError', (error) => {
        console.error('Error on registration: ' + JSON.stringify(error));
      });
      
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push notification received: ' + JSON.stringify(notification));
        // Mostra uma notificação local quando o app está em foreground
        this.showLocalNotification({
          title: notification.title || 'Nova notificação',
          body: notification.body || '',
          id: notification.id,
          data: notification.data
        });
      });
      
      PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('Push notification action performed: ' + JSON.stringify(notification));
        // Aqui você navegaria para a tela adequada com base na notificação
        this.handleNotificationAction(notification.notification.data);
      });
      
      // Solicita permissão e registra para notificações push
      const permStatus = await PushNotifications.requestPermissions();
      
      if (permStatus.receive === 'granted') {
        await PushNotifications.register();
      }
    } catch (error) {
      console.error('Erro ao configurar notificações push:', error);
    }
  }
  
  /**
   * Configura as notificações locais (usadas quando o app está aberto)
   */
  private async setupLocalNotifications() {
    try {
      await LocalNotifications.requestPermissions();
      
      LocalNotifications.addListener('localNotificationReceived', (notification) => {
        console.log('Local notification received: ' + JSON.stringify(notification));
      });
      
      LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
        console.log('Local notification action: ' + JSON.stringify(notification));
        this.handleNotificationAction(notification.notification.extra);
      });
    } catch (error) {
      console.error('Erro ao configurar notificações locais:', error);
    }
  }
  
  /**
   * Envia o token para o servidor para armazenamento
   */
  private async sendTokenToServer(token: string) {
    // Implementação para enviar o token para seu backend
    // Você conectaria isso com seu serviço de backend
    console.log('Token pronto para envio ao servidor:', token);
    
    try {
      // Exemplo de como você enviaria para o backend
      // const response = await fetch('https://sua-api.com/register-token', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ token })
      // });
      
      // if (!response.ok) {
      //   throw new Error('Falha ao registrar token');
      // }
      
      console.log('Token registrado com sucesso');
    } catch (error) {
      console.error('Erro ao registrar token:', error);
    }
  }
  
  /**
   * Mostra uma notificação local
   */
  async showLocalNotification({ title, body, id, data }: NotificationData) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id: id ? parseInt(id) : Math.floor(Math.random() * 10000),
            extra: data,
            sound: 'default',
            actionTypeId: '',
            attachments: []
          }
        ]
      });
    } catch (error) {
      console.error('Erro ao mostrar notificação local:', error);
    }
  }
  
  /**
   * Processa ações de notificações
   */
  private handleNotificationAction(data: any) {
    // Implementação para lidar com ações de notificação
    // Isso seria integrado com seu roteador
    if (data?.type === 'new_post') {
      // window.location.href = `/posts/${data.postId}`;
      console.log('Navegar para post:', data.postId);
    } else if (data?.type === 'new_message') {
      // window.location.href = `/messages/${data.conversationId}`;
      console.log('Navegar para mensagem:', data.conversationId);
    }
  }
}

// Singleton para o serviço de notificações
export const notificationService = new NotificationService();
