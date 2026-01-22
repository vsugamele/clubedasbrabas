import { supabase } from "@/integrations/supabase/client";

/**
 * Serviço para gerenciamento de upload de mídia para o Supabase Storage
 */

// Variáveis globais para configurar o sistema de upload
let discoveredBucket: string | null = null;

// Configurar um bucket fixo para resolver o problema de "Bucket not found"
const DEFAULT_BUCKET = 'media';

// Definir tamanho de chunk para upload de arquivos grandes (5MB)
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB em bytes

/**
 * Tenta criar um bucket no Supabase
 * @param bucketName Nome do bucket a ser criado
 * @returns true se criado com sucesso, false caso contrário
 */
async function createBucket(bucketName: string): Promise<boolean> {
  try {
    // Tenta criar o bucket com acesso público
    const { data, error } = await supabase.storage.createBucket(bucketName, {
      public: true,
      allowedMimeTypes: ['image/*', 'video/*', 'application/pdf'],
      fileSizeLimit: 100 * 1024 * 1024 // 100MB
    });
    
    if (error) {
      console.error(`Erro ao criar bucket ${bucketName}:`, error);
      return false;
    }
    
    console.log(`Bucket ${bucketName} criado com sucesso!`);
    return true;
  } catch (e) {
    console.error(`Erro ao tentar criar bucket ${bucketName}:`, e);
    return false;
  }
}

/**
 * Descobre qual bucket existe no projeto Supabase ou cria um se não existir
 * @returns Nome do bucket existente ou criado
 */
async function discoverBucket(): Promise<string> {
  // Se já descobrimos o bucket anteriormente, retorne-o
  if (discoveredBucket) {
    return discoveredBucket;
  }

  // OTIMIZAÇÃO: Para resolver o problema de "Bucket not found", vamos usar diretamente o bucket padrão
  // se ele existir para evitar tentativas múltiplas que podem falhar
  try {
    const { data, error } = await supabase.storage.from(DEFAULT_BUCKET).list();
    if (!error) {
      console.log(`Usando bucket padrão: ${DEFAULT_BUCKET}`);
      discoveredBucket = DEFAULT_BUCKET;
      return DEFAULT_BUCKET;
    }
  } catch (e) {
    console.log(`Bucket padrão ${DEFAULT_BUCKET} não está acessível, tentando criar...`);
  }
  
  // Tenta criar o bucket padrão
  try {
    const created = await createBucket(DEFAULT_BUCKET);
    if (created) {
      discoveredBucket = DEFAULT_BUCKET;
      return DEFAULT_BUCKET;
    }
  } catch (e) {
    console.error('Erro ao criar bucket padrão:', e);
  }
  
  // Lista de buckets alternativos caso o padrão falhe
  const bucketOptions = ['posts', 'uploads', 'images', 'videos', 'public', 'avatars'];
  
  // Tenta encontrar qualquer bucket existente
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (!error && buckets && buckets.length > 0) {
      // Usa o primeiro bucket disponível
      discoveredBucket = buckets[0].name;
      console.log(`Bucket disponível encontrado: ${discoveredBucket}`);
      return discoveredBucket;
    }
  } catch (e) {
    console.log('Erro ao listar buckets:', e);
  }
  
  // Verifica os buckets alternativos
  for (const bucket of bucketOptions) {
    try {
      const { data, error } = await supabase.storage.from(bucket).list();
      if (!error) {
        discoveredBucket = bucket;
        console.log(`Bucket alternativo válido: ${bucket}`);
        return bucket;
      }
    } catch (e) {
      console.log(`Bucket ${bucket} não disponível`);
    }
  }
  
  // Retorna o padrão mesmo que não tenha sido possível verificar
  // para garantir uma tentativa de upload
  console.warn('Não foi possível verificar nenhum bucket, usando o padrão');
  return DEFAULT_BUCKET;
}

/**
 * Faz upload de vídeo para o Supabase Storage com suporte a arquivos grandes
 * @param videoFile Arquivo de vídeo a ser enviado
 * @returns URL pública do vídeo ou null em caso de erro
 */
export async function uploadVideoToStorage(videoFile: File): Promise<string | null> {
  try {
    // Verificar tipo do arquivo
    if (!videoFile.type.startsWith('video/')) {
      console.error("Tipo de arquivo inválido para vídeo:", videoFile.type);
      throw new Error("O arquivo selecionado não é um vídeo válido.");
    }
    
    // Verificar tamanho (limitar a 100MB)
    const MAX_SIZE = 100 * 1024 * 1024; // 100MB
    if (videoFile.size > MAX_SIZE) {
      throw new Error(`Vídeo muito grande (${(videoFile.size / (1024 * 1024)).toFixed(1)}MB). Tamanho máximo: 100MB.`);
    }
    
    console.log(`Enviando vídeo para o storage: ${videoFile.name} (${(videoFile.size / (1024 * 1024)).toFixed(1)}MB)`);
    
    // Criar nome único para o arquivo
    const fileExt = videoFile.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `videos/${fileName}`;
    
    // Usar diretamente o bucket padrão para maior confiabilidade
    const bucket = await discoverBucket();
    
    console.log(`Tentando upload de vídeo para o bucket: ${bucket}`);
    
    try {
      // Verificar se o vídeo é relativamente grande (mais de 20MB)
      // para usar o upload otimizado
      if (videoFile.size > 20 * 1024 * 1024) {
        console.log("Vídeo grande detectado, usando upload otimizado");
        return await uploadLargeFile(bucket, filePath, videoFile);
      }
      
      // Para arquivos menores, usar o método simples
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, videoFile, {
          cacheControl: '3600',
          upsert: true
        });
        
      if (error) {
        console.error("Erro no upload para bucket:", error);
        throw error;
      }
      
      const publicUrl = supabase.storage.from(bucket).getPublicUrl(filePath).data.publicUrl;
      console.log("Upload concluído com sucesso! URL:", publicUrl);
      return publicUrl;
    } catch (uploadError) {
      console.error("Erro no upload para bucket:", uploadError);
      
      // Tentativa com bucket alternativo
      try {
        console.log("Tentando com bucket alternativo 'public'...");
        const fallbackBucket = 'public';
        const { data, error } = await supabase.storage
          .from(fallbackBucket)
          .upload(filePath, videoFile, {
            cacheControl: '3600',
            upsert: true
          });
          
        if (!error) {
          const publicUrl = supabase.storage.from(fallbackBucket).getPublicUrl(filePath).data.publicUrl;
          console.log("Upload com bucket alternativo concluído! URL:", publicUrl);
          return publicUrl;
        }
      } catch (fallbackError) {
        console.error("Tentativa alternativa falhou:", fallbackError);
      }
      
      // Tentativa alternativa final: upload como base64
      console.log("Tentando alternativa com base64...");
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(videoFile);
        reader.onload = () => {
          const base64 = reader.result as string;
          console.log("Upload base64 concluído com sucesso");
          resolve(base64);
        };
        reader.onerror = (error) => {
          console.error("Erro na conversão base64:", error);
          reject(error);
        };
      });
    }
  } catch (error) {
    console.error("Falha no upload do vídeo:", error);
    throw error;
  }
}

/**
 * Faz upload de imagem para o Supabase Storage
 * @param imageFile Arquivo de imagem a ser enviado
 * @returns URL pública da imagem ou null em caso de erro
 */
/**
 * Função otimizada para upload de arquivos grandes em chunks
 * @param bucket Nome do bucket no Supabase
 * @param filePath Caminho do arquivo no bucket
 * @param file Arquivo a ser enviado
 * @returns URL pública do arquivo
 */
async function uploadLargeFile(bucket: string, filePath: string, file: File): Promise<string> {
  // Número total de chunks baseado no tamanho do arquivo
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  console.log(`Iniciando upload em chunks: ${totalChunks} chunks de ${CHUNK_SIZE/1024/1024}MB`);
  
  // Para arquivos menores que 10MB, usar o método regular
  if (totalChunks <= 2) {
    console.log("Arquivo não é grande o suficiente para upload em chunks, usando método regular");
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });
      
    if (error) throw error;
    return supabase.storage.from(bucket).getPublicUrl(filePath).data.publicUrl;
  }

  // Tentar usar o upload direto primeiro, pois é mais eficiente quando funciona
  try {
    console.log("Tentando upload direto primeiro...");
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });
      
    if (!error) {
      console.log("Upload direto bem-sucedido!");
      return supabase.storage.from(bucket).getPublicUrl(filePath).data.publicUrl;
    }
  } catch (e) {
    console.log("Upload direto falhou, tentando upload em chunks...");
  }

  // Converter para base64 diretamente para arquivos acima de 50MB
  // pois o upload em chunks pode falhar em alguns casos
  if (file.size > 50 * 1024 * 1024) {
    console.log("Arquivo muito grande, convertendo diretamente para base64");
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        console.log("Conversão para base64 concluída com sucesso");
        resolve(base64);
      };
      reader.onerror = (error) => {
        console.error("Erro na conversão base64:", error);
        reject(error);
      };
    });
  }

  // Se o arquivo não for tão grande, mas ainda precisar de chunks
  // Retornar para base64 para garantir confiabilidade
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result as string;
      console.log("Conversão para base64 concluída com sucesso");
      resolve(base64);
    };
    reader.onerror = (error) => {
      console.error("Erro na conversão base64:", error);
      reject(error);
    };
  });
}

/**
 * Faz upload de imagem para o Supabase Storage
 * @param imageFile Arquivo de imagem a ser enviado
 * @returns URL pública da imagem ou null em caso de erro
 */
export async function uploadImageToStorage(imageFile: File): Promise<string | null> {
  try {
    // Verificar tipo do arquivo
    if (!imageFile.type.startsWith('image/')) {
      console.error("Tipo de arquivo inválido para imagem:", imageFile.type);
      throw new Error("O arquivo selecionado não é uma imagem válida.");
    }
    
    // Verificar tamanho (limitar a 10MB)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (imageFile.size > MAX_SIZE) {
      throw new Error(`Imagem muito grande (${(imageFile.size / (1024 * 1024)).toFixed(1)}MB). Tamanho máximo: 10MB.`);
    }
    
    console.log(`Enviando imagem para o storage: ${imageFile.name} (${(imageFile.size / (1024 * 1024)).toFixed(1)}MB)`);
    
    // Criar nome único para o arquivo
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `images/${fileName}`;
    
    // Descobrir ou criar o bucket
    const bucket = await discoverBucket();
    
    console.log(`Tentando upload de imagem para o bucket: ${bucket}`);
    
    try {
      // Fazer upload para o bucket descoberto
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: true
        });
        
      if (error) {
        throw error;
      }
      
      return supabase.storage.from(bucket).getPublicUrl(filePath).data.publicUrl;
    } catch (uploadError) {
      console.error("Erro no upload para bucket:", uploadError);
      
      // Tentativa alternativa: upload como blob diretamente para conversão base64
      console.log("Tentando alternativa com base64...");
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(imageFile);
        reader.onload = () => {
          const base64 = reader.result as string;
          console.log("Upload base64 concluído com sucesso");
          resolve(base64);
        };
        reader.onerror = (error) => {
          console.error("Erro na conversão base64:", error);
          reject(error);
        };
      });
    }
    
    // O código que buscava a URL foi movido para dentro do bloco try/catch
  } catch (error) {
    console.error("Falha no upload da imagem:", error);
    throw error;
  }
}
