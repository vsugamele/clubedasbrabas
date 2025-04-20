import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export interface CameraPhoto {
  base64String?: string;
  dataUrl?: string;
  format?: string;
  saved?: boolean;
}

/**
 * Serviço para gerenciar acesso à câmera e galeria
 */
class CameraService {
  /**
   * Captura uma foto usando a câmera ou seleciona da galeria
   * @param source Fonte da imagem (câmera ou galeria)
   * @returns Dados da foto capturada
   */
  async getPhoto(source: CameraSource = CameraSource.Camera): Promise<CameraPhoto | null> {
    try {
      // Solicita permissões da câmera primeiro
      const permission = await Camera.requestPermissions();
      if (permission.camera !== 'granted' && permission.photos !== 'granted') {
        console.error('Permissão de câmera não concedida');
        return null;
      }
      
      // Captura a foto
      const capturedPhoto = await Camera.getPhoto({
        resultType: CameraResultType.DataUrl,
        source: source,
        quality: 90,
        width: 1080,
        height: 1080,
        preserveAspectRatio: true,
        correctOrientation: true
      });
      
      return {
        dataUrl: capturedPhoto.dataUrl,
        format: capturedPhoto.format,
        saved: false
      };
    } catch (error) {
      console.error('Erro ao capturar foto:', error);
      return null;
    }
  }
  
  /**
   * Captura múltiplas fotos da galeria
   * @returns Array de fotos selecionadas
   */
  async getMultiplePhotos(limit: number = 5): Promise<CameraPhoto[]> {
    try {
      const permission = await Camera.requestPermissions();
      if (permission.photos !== 'granted') {
        console.error('Permissão para fotos não concedida');
        return [];
      }
      
      const capturedPhotos = await Camera.pickImages({
        quality: 90,
        limit,
        width: 1080,
        height: 1080,
        preserveAspectRatio: true,
        correctOrientation: true
      });
      
      // Converte para o formato que nossa aplicação utiliza
      return Promise.all(capturedPhotos.photos.map(async (photo) => {
        try {
          // Converte para uma estrutura uniforme
          return {
            dataUrl: await this.readAsDataURL(photo),
            format: 'jpeg',
            saved: false
          };
        } catch (e) {
          console.error('Erro ao processar imagem da galeria:', e);
          return null;
        }
      }).filter(Boolean) as Promise<CameraPhoto[]>);
    } catch (error) {
      console.error('Erro ao selecionar múltiplas fotos:', error);
      return [];
    }
  }
  
  /**
   * Verifica se a câmera está disponível
   */
  isCameraAvailable(): boolean {
    return Capacitor.isNativePlatform();
  }
  
  /**
   * Converte uma foto para Data URL
   */
  private async readAsDataURL(photo: Photo): Promise<string> {
    // Se já temos o dataUrl, retorna
    if (photo.dataUrl) return photo.dataUrl;
    
    // Caso contrário precisaríamos usar File API para converter
    // No ambiente real, precisaríamos implementar baseado no formato retornado
    // pelo Capacitor em diferentes plataformas
    
    // Simplificação para este exemplo
    return photo.webPath || '';
  }
}

// Singleton para o serviço de câmera
export const cameraService = new CameraService();
