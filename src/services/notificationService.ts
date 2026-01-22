import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type NotificationType = 
  | 'like' 
  | 'comment' 
  | 'mention' 
  | 'admin_post' 
  | 'event' 
  | 'message' 
  | 'system';

// Interface para os dados brutos retornados pelo Supabase
interface RawNotification {
  id: string;
  user_id: string;
  type: string;
  title?: string;
  content: string;
  sender_id?: string;
  related_id?: string; // Nome do campo no banco de dados
  reference_type?: string;
  created_at: string;
  is_read: boolean;
}

// Interface para os dados formatados para uso na aplicação
export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  content: string;
  sender_id?: string;
  sender_name?: string;
  sender_avatar?: string;
  reference_id?: string; // Nome do campo na aplicação
  reference_type?: string;
  created_at: string;
  is_read: boolean;
}

/**
 * Busca todas as notificações do usuário atual
 * @returns Lista de notificações ordenadas por data de criação (mais recentes primeiro)
 */
export const fetchNotifications = async (): Promise<Notification[]> => {
  try {
    // Verificar se o usuário está autenticado
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    // Buscar notificações do usuário
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Extrair IDs de remetentes para buscar seus perfis
    const rawNotifications = data as RawNotification[];
    const senderIds = rawNotifications
      .filter(notification => notification.sender_id)
      .map(notification => notification.sender_id)
      .filter(Boolean); // Remover valores undefined ou null

    // Se não houver remetentes, retornar as notificações como estão
    if (senderIds.length === 0) {
      // Converter explicitamente para o tipo Notification
      return rawNotifications.map(notification => ({
        id: notification.id,
        user_id: notification.user_id,
        type: notification.type as NotificationType,
        title: notification.title || 'Notificação', // Fallback para título
        content: notification.content,
        reference_id: notification.related_id, // Mapeamento do campo do banco para o campo da aplicação
        reference_type: notification.reference_type,
        created_at: notification.created_at,
        is_read: notification.is_read
      }));
    }

    // Buscar perfis dos remetentes
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', senderIds);

    if (profilesError) {
      console.error('Erro ao buscar perfis dos remetentes:', profilesError);
      // Continuar mesmo com erro, apenas sem informações de perfil
      return rawNotifications.map(notification => ({
        id: notification.id,
        user_id: notification.user_id,
        type: notification.type as NotificationType,
        title: notification.title || 'Notificação',
        content: notification.content,
        reference_id: notification.related_id,
        reference_type: notification.reference_type,
        created_at: notification.created_at,
        is_read: notification.is_read
      }));
    }

    // Mapear notificações com informações de perfil
    const notificationsWithProfiles = rawNotifications.map(notification => {
      if (!notification.sender_id) {
        return {
          id: notification.id,
          user_id: notification.user_id,
          type: notification.type as NotificationType,
          title: notification.title || 'Notificação',
          content: notification.content,
          reference_id: notification.related_id,
          reference_type: notification.reference_type,
          created_at: notification.created_at,
          is_read: notification.is_read
        } as Notification;
      }

      const senderProfile = profiles?.find(profile => profile.id === notification.sender_id);
      
      return {
        id: notification.id,
        user_id: notification.user_id,
        type: notification.type as NotificationType,
        title: notification.title || 'Notificação',
        content: notification.content,
        sender_id: notification.sender_id,
        sender_name: senderProfile?.full_name || 'Usuário',
        sender_avatar: senderProfile?.avatar_url || null,
        reference_id: notification.related_id,
        reference_type: notification.reference_type,
        created_at: notification.created_at,
        is_read: notification.is_read
      } as Notification;
    });

    return notificationsWithProfiles;
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    throw error;
  }
};

/**
 * Marca uma notificação como lida
 * @param id ID da notificação
 * @returns true se a operação foi bem-sucedida
 */
export const markNotificationAsRead = async (id: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    return false;
  }
};

/**
 * Marca todas as notificações do usuário como lidas
 * @returns true se a operação foi bem-sucedida
 */
export const markAllNotificationsAsRead = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Erro ao marcar todas as notificações como lidas:', error);
    return false;
  }
};

/**
 * Exclui uma notificação
 * @param id ID da notificação
 * @returns true se a operação foi bem-sucedida
 */
export const deleteNotification = async (id: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Erro ao excluir notificação:', error);
    return false;
  }
};

/**
 * Cria uma nova notificação
 * @param notification Dados da notificação
 * @returns ID da notificação criada ou null em caso de erro
 */
export const createNotification = async (
  userId: string,
  type: NotificationType,
  title: string,
  content: string,
  senderId?: string,
  referenceId?: string,
  referenceType?: string
): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        content,
        sender_id: senderId,
        related_id: referenceId, // Usar o nome do campo no banco de dados
        reference_type: referenceType,
        is_read: false
      })
      .select('id')
      .single();

    if (error) {
      throw error;
    }

    return data?.id || null;
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    return null;
  }
};

/**
 * Cria uma notificação para um comentário em uma postagem
 */
export const createCommentNotification = async (
  postOwnerId: string,
  commenterId: string,
  commenterName: string,
  postId: string,
  commentContent: string
): Promise<string | null> => {
  // Não notificar o próprio usuário
  if (postOwnerId === commenterId) {
    return null;
  }

  const title = 'Novo comentário em sua publicação';
  const content = `${commenterName} comentou: "${commentContent.substring(0, 50)}${commentContent.length > 50 ? '...' : ''}"`;
  
  return createNotification(
    postOwnerId,
    'comment',
    title,
    content,
    commenterId,
    postId,
    'post'
  );
};

/**
 * Cria uma notificação para um like em uma postagem
 */
export const createLikeNotification = async (
  postOwnerId: string,
  likerId: string,
  likerName: string,
  postId: string,
  postTitle: string
): Promise<string | null> => {
  // Não notificar o próprio usuário
  if (postOwnerId === likerId) {
    return null;
  }

  const title = 'Curtida em sua publicação';
  const content = `${likerName} curtiu sua publicação "${postTitle.substring(0, 50)}${postTitle.length > 50 ? '...' : ''}"`;
  
  return createNotification(
    postOwnerId,
    'like',
    title,
    content,
    likerId,
    postId,
    'post'
  );
};

/**
 * Cria uma notificação para uma menção em um comentário ou postagem
 */
export const createMentionNotification = async (
  mentionedUserId: string,
  mentionerId: string,
  mentionerName: string,
  contentId: string,
  contentType: 'post' | 'comment',
  contentText: string
): Promise<string | null> => {
  // Não notificar o próprio usuário
  if (mentionedUserId === mentionerId) {
    return null;
  }

  const title = 'Você foi mencionado';
  const contentTypeText = contentType === 'post' ? 'publicação' : 'comentário';
  const content = `${mentionerName} mencionou você em um ${contentTypeText}: "${contentText.substring(0, 50)}${contentText.length > 50 ? '...' : ''}"`;
  
  return createNotification(
    mentionedUserId,
    'mention',
    title,
    content,
    mentionerId,
    contentId,
    contentType
  );
};

/**
 * Cria notificações para todos os usuários quando um administrador ou moderador cria uma postagem
 */
export const createAdminPostNotification = async (
  adminId: string,
  adminName: string,
  postId: string,
  postTitle: string
): Promise<number> => {
  try {
    // Buscar todos os usuários exceto o admin que criou a postagem
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id')
      .neq('id', adminId);

    if (error) {
      throw error;
    }

    if (!profiles || profiles.length === 0) {
      return 0;
    }

    // Criar notificações em lote
    const notificationsToInsert = profiles.map(profile => ({
      user_id: profile.id,
      type: 'admin_post' as NotificationType,
      title: 'Nova publicação oficial',
      content: `${adminName} publicou: "${postTitle.substring(0, 50)}${postTitle.length > 50 ? '...' : ''}"`,
      sender_id: adminId,
      related_id: postId, // Usar o nome do campo no banco de dados
      reference_type: 'post',
      is_read: false
    }));

    const { error: insertError } = await supabase
      .from('notifications')
      .insert(notificationsToInsert);

    if (insertError) {
      throw insertError;
    }

    return notificationsToInsert.length;
  } catch (error) {
    console.error('Erro ao criar notificações para postagem de admin:', error);
    return 0;
  }
};

/**
 * Cria notificações para todos os usuários quando um evento é criado ou atualizado
 */
export const createEventNotification = async (
  creatorId: string,
  creatorName: string,
  eventId: string,
  eventTitle: string,
  isUpdate: boolean = false
): Promise<number> => {
  try {
    // Buscar todos os usuários exceto o criador do evento
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id')
      .neq('id', creatorId);

    if (error) {
      throw error;
    }

    if (!profiles || profiles.length === 0) {
      return 0;
    }

    const actionText = isUpdate ? 'atualizou' : 'criou';
    
    // Criar notificações em lote
    const notificationsToInsert = profiles.map(profile => ({
      user_id: profile.id,
      type: 'event' as NotificationType,
      title: isUpdate ? 'Evento atualizado' : 'Novo evento',
      content: `${creatorName} ${actionText} o evento: "${eventTitle.substring(0, 50)}${eventTitle.length > 50 ? '...' : ''}"`,
      sender_id: creatorId,
      related_id: eventId, // Usar o nome do campo no banco de dados
      reference_type: 'event',
      is_read: false
    }));

    const { error: insertError } = await supabase
      .from('notifications')
      .insert(notificationsToInsert);

    if (insertError) {
      throw insertError;
    }

    return notificationsToInsert.length;
  } catch (error) {
    console.error('Erro ao criar notificações para evento:', error);
    return 0;
  }
};

/**
 * Cria uma notificação para uma mensagem recebida
 */
export const createMessageNotification = async (
  recipientId: string,
  senderId: string,
  senderName: string,
  messageContent: string
): Promise<string | null> => {
  const title = 'Nova mensagem';
  const content = `${senderName}: "${messageContent.substring(0, 50)}${messageContent.length > 50 ? '...' : ''}"`;
  
  return createNotification(
    recipientId,
    'message',
    title,
    content,
    senderId,
    senderId, // Usamos o ID do remetente como referência para abrir a conversa
    'message'
  );
};

/**
 * Cria uma notificação do sistema para um usuário
 */
export const createSystemNotification = async (
  userId: string,
  title: string,
  content: string,
  referenceId?: string,
  referenceType?: string
): Promise<string | null> => {
  return createNotification(
    userId,
    'system',
    title,
    content,
    undefined,
    referenceId,
    referenceType
  );
};
