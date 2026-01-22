import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

/**
 * Interface para dados de compartilhamento
 */
export interface ShareData {
  title?: string;
  text: string;
  url?: string;
  dialogTitle?: string;
  files?: string[]; // URLs de arquivos para compartilhar
}

/**
 * Serviço para compartilhamento nativo
 */
class ShareService {
  /**
   * Compartilha conteúdo usando APIs nativas quando disponíveis
   */
  async shareContent({ title, text, url, dialogTitle, files }: ShareData) {
    if (Capacitor.isNativePlatform()) {
      try {
        // Usa a API de compartilhamento nativa
        await Share.share({
          title: title || 'Circle App',
          text,
          url,
          dialogTitle: dialogTitle || 'Compartilhar via',
          files
        });
        
        return true;
      } catch (error) {
        console.error('Erro ao compartilhar conteúdo:', error);
        return await this.fallbackShare({ title, text, url });
      }
    } else {
      // Fallback para navegadores web
      return await this.fallbackShare({ title, text, url });
    }
  }
  
  /**
   * Compartilha um post específico por ID
   */
  async sharePost(postId: string, title: string, text: string, imageUrl?: string) {
    const postUrl = `${window.location.origin}/posts/${postId}`;
    
    const shareData: ShareData = {
      title: title || 'Post do Circle App',
      text: text || 'Confira este post no Circle App!',
      url: postUrl,
      files: imageUrl ? [imageUrl] : undefined
    };
    
    return this.shareContent(shareData);
  }
  
  /**
   * Método de fallback para navegadores que não suportam a API de compartilhamento
   */
  private async fallbackShare({ title, text, url }: ShareData): Promise<boolean> {
    try {
      // Tenta usar a Web Share API primeiro
      if (navigator.share) {
        await navigator.share({
          title,
          text,
          url
        });
        return true;
      }
      
      // Fallback para copiar para a área de transferência
      const content = `${title ? `${title}\n` : ''}${text}${url ? `\n${url}` : ''}`;
      await navigator.clipboard.writeText(content);
      
      // Aqui você poderia mostrar um toast informando que o conteúdo foi copiado
      
      return false; // Retorna false para indicar que usou o fallback de cópia
    } catch (error) {
      console.error('Fallback share error:', error);
      return false;
    }
  }
}

// Singleton para o serviço de compartilhamento
export const shareService = new ShareService();
