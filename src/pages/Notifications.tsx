import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Bell, User, Heart, MessageCircle, Pin } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/auth';
import { supabase } from '@/integrations/supabase/client';

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'mention' | 'follow' | 'pin' | 'system';
  content: string;
  created_at: string;
  is_read: boolean;
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  post_id?: string;
}

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Simulação de notificações para demonstração
  useEffect(() => {
    const fetchNotifications = async () => {
      setIsLoading(true);
      
      // Em um ambiente real, buscaríamos as notificações do banco de dados
      // Por enquanto, vamos simular algumas notificações
      
      // Simulação de delay de rede
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'like',
          content: 'curtiu sua publicação',
          created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutos atrás
          is_read: false,
          user_id: '123',
          user_name: 'Ana Silva',
          user_avatar: null,
          post_id: '456'
        },
        {
          id: '2',
          type: 'comment',
          content: 'comentou em sua publicação: "Excelente conteúdo!"',
          created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutos atrás
          is_read: false,
          user_id: '789',
          user_name: 'Carlos Oliveira',
          user_avatar: null,
          post_id: '456'
        },
        {
          id: '3',
          type: 'mention',
          content: 'mencionou você em um comentário',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 horas atrás
          is_read: true,
          user_id: '101',
          user_name: 'Mariana Costa',
          user_avatar: null,
          post_id: '789'
        },
        {
          id: '4',
          type: 'follow',
          content: 'começou a seguir você',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 dia atrás
          is_read: true,
          user_id: '202',
          user_name: 'Pedro Santos',
          user_avatar: null
        },
        {
          id: '5',
          type: 'pin',
          content: 'fixou sua publicação na comunidade Marketing',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(), // 1.5 dias atrás
          is_read: true,
          user_id: '303',
          user_name: 'Admin',
          user_avatar: null,
          post_id: '123'
        },
        {
          id: '6',
          type: 'system',
          content: 'Bem-vindo ao Clube das Brabas! Complete seu perfil para começar.',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 dias atrás
          is_read: true,
          user_id: 'system',
          user_name: 'Sistema',
          user_avatar: null
        }
      ];
      
      setNotifications(mockNotifications);
      setIsLoading(false);
    };
    
    fetchNotifications();
  }, [user]);
  
  const markAsRead = async (notificationId: string) => {
    // Em um ambiente real, atualizaríamos o status no banco de dados
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, is_read: true } 
          : notification
      )
    );
  };
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="h-5 w-5 text-red-500" />;
      case 'comment':
        return <MessageCircle className="h-5 w-5 text-blue-500" />;
      case 'mention':
        return <User className="h-5 w-5 text-purple-500" />;
      case 'follow':
        return <User className="h-5 w-5 text-green-500" />;
      case 'pin':
        return <Pin className="h-5 w-5 text-orange-500" />;
      case 'system':
        return <Bell className="h-5 w-5 text-gray-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };
  
  const unreadNotifications = notifications.filter(notification => !notification.is_read);
  const readNotifications = notifications.filter(notification => notification.is_read);

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Notificações</h1>
        
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="all" className="flex-1">
              Todas
              <span className="ml-2 bg-gray-200 text-gray-800 text-xs px-2 py-0.5 rounded-full">
                {notifications.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex-1">
              Não lidas
              <span className="ml-2 bg-brand-100 text-brand-800 text-xs px-2 py-0.5 rounded-full">
                {unreadNotifications.length}
              </span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-2">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              </div>
            ) : notifications.length > 0 ? (
              notifications.map(notification => (
                <div 
                  key={notification.id}
                  className={`p-4 border rounded-lg flex items-start gap-3 ${
                    !notification.is_read ? 'bg-orange-50 border-orange-100' : 'bg-white'
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  {notification.type === 'system' ? (
                    <div className="bg-gray-100 rounded-full p-2">
                      {getNotificationIcon(notification.type)}
                    </div>
                  ) : (
                    <Avatar>
                      <AvatarImage src={notification.user_avatar || undefined} alt={notification.user_name} />
                      <AvatarFallback className="bg-brand-100 text-brand-700">
                        {notification.user_name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className="flex-1">
                    <div className="flex flex-col">
                      <div className="flex items-start justify-between">
                        <p>
                          {notification.type !== 'system' && (
                            <Link 
                              to={`/profile/${notification.user_id}`} 
                              className="font-medium hover:underline"
                            >
                              {notification.user_name}
                            </Link>
                          )}
                          <span className="ml-1">{notification.content}</span>
                        </p>
                        {!notification.is_read && (
                          <span className="ml-2 w-2 h-2 bg-brand-600 rounded-full"></span>
                        )}
                      </div>
                      <time className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: ptBR
                        })}
                      </time>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 border rounded-lg bg-gray-50">
                <p className="text-gray-500">Nenhuma notificação</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="unread" className="space-y-2">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              </div>
            ) : unreadNotifications.length > 0 ? (
              unreadNotifications.map(notification => (
                <div 
                  key={notification.id}
                  className="p-4 border rounded-lg bg-orange-50 border-orange-100 flex items-start gap-3"
                  onClick={() => markAsRead(notification.id)}
                >
                  {notification.type === 'system' ? (
                    <div className="bg-gray-100 rounded-full p-2">
                      {getNotificationIcon(notification.type)}
                    </div>
                  ) : (
                    <Avatar>
                      <AvatarImage src={notification.user_avatar || undefined} alt={notification.user_name} />
                      <AvatarFallback className="bg-brand-100 text-brand-700">
                        {notification.user_name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className="flex-1">
                    <div className="flex flex-col">
                      <div className="flex items-start justify-between">
                        <p>
                          {notification.type !== 'system' && (
                            <Link 
                              to={`/profile/${notification.user_id}`} 
                              className="font-medium hover:underline"
                            >
                              {notification.user_name}
                            </Link>
                          )}
                          <span className="ml-1">{notification.content}</span>
                        </p>
                        <span className="ml-2 w-2 h-2 bg-brand-600 rounded-full"></span>
                      </div>
                      <time className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: ptBR
                        })}
                      </time>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 border rounded-lg bg-gray-50">
                <p className="text-gray-500">Nenhuma notificação não lida</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Notifications;
