import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Bell, User, Heart, MessageCircle, Calendar, Pin, FileText, CheckCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  Notification, 
  fetchNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  deleteNotification,
  NotificationType
} from '@/services/notificationService';

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    document.title = "Notificações | Clube das Brabas";
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const data = await fetchNotifications();
      setNotifications(data);
    } catch (error) {
      console.error("Erro ao carregar notificações:", error);
      toast.error("Não foi possível carregar as notificações");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const success = await markNotificationAsRead(id);
      if (success) {
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === id 
              ? { ...notification, is_read: true } 
              : notification
          )
        );
      }
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const success = await markAllNotificationsAsRead();
      if (success) {
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, is_read: true }))
        );
        toast.success("Todas as notificações foram marcadas como lidas");
      }
    } catch (error) {
      console.error("Erro ao marcar todas as notificações como lidas:", error);
      toast.error("Não foi possível marcar todas as notificações como lidas");
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      const success = await deleteNotification(id);
      if (success) {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
        toast.success("Notificação removida");
      }
    } catch (error) {
      console.error("Erro ao excluir notificação:", error);
      toast.error("Não foi possível excluir a notificação");
    }
  };

  // Filtrar notificações com base na aba ativa
  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !notification.is_read;
    return false;
  });

  // Função para obter o ícone com base no tipo de notificação
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'like':
        return <Heart className="h-5 w-5 text-red-500" />;
      case 'comment':
        return <MessageCircle className="h-5 w-5 text-blue-500" />;
      case 'mention':
        return <User className="h-5 w-5 text-purple-500" />;
      case 'admin_post':
        return <FileText className="h-5 w-5 text-orange-500" />;
      case 'event':
        return <Calendar className="h-5 w-5 text-green-500" />;
      case 'message':
        return <MessageCircle className="h-5 w-5 text-indigo-500" />;
      case 'system':
        return <Bell className="h-5 w-5 text-gray-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  // Função para obter o link com base no tipo de notificação
  const getNotificationLink = (notification: Notification) => {
    const { type, reference_id, reference_type } = notification;
    
    switch (type) {
      case 'comment':
      case 'like':
      case 'mention':
      case 'admin_post':
        return `/posts/${reference_id}`;
      case 'event':
        return `/eventos/${reference_id}`;
      case 'message':
        return `/messages?contact=${notification.sender_id}`;
      default:
        return '#';
    }
  };

  return (
    <MainLayout>
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notificações</h1>
          {notifications.length > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-1"
            >
              <CheckCheck className="h-4 w-4" />
              <span>Marcar todas como lidas</span>
            </Button>
          )}
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="all" className="dark:text-white">Todas</TabsTrigger>
            <TabsTrigger value="unread" className="dark:text-white">Não lidas</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow animate-pulse">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Nenhuma notificação</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {activeTab === 'unread' 
                    ? 'Você não tem notificações não lidas.' 
                    : 'Você não tem notificações.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredNotifications.map((notification) => (
                  <div 
                    key={notification.id}
                    className={`flex gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow transition-colors ${
                      !notification.is_read ? 'bg-orange-50 dark:bg-gray-700/50' : ''
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {notification.sender_avatar ? (
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={notification.sender_avatar} alt={notification.sender_name || ''} />
                          <AvatarFallback className="bg-brand-100 text-brand-700">
                            {notification.sender_name?.substring(0, 2).toUpperCase() || 'SB'}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="h-10 w-10 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                          {getNotificationIcon(notification.type)}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <Link 
                        to={getNotificationLink(notification)}
                        className="block hover:text-brand-600 transition-colors"
                        onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
                      >
                        <h3 className={`font-medium text-gray-900 dark:text-white ${!notification.is_read ? 'font-semibold' : ''}`}>
                          {notification.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          {notification.content}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>
                            {formatDistanceToNow(new Date(notification.created_at), { 
                              addSuffix: true,
                              locale: ptBR
                            })}
                          </span>
                          {!notification.is_read && (
                            <span className="inline-block h-2 w-2 rounded-full bg-brand-500"></span>
                          )}
                        </div>
                      </Link>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      {!notification.is_read && (
                        <button 
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                          title="Marcar como lida"
                        >
                          <CheckCheck className="h-4 w-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteNotification(notification.id)}
                        className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                        title="Remover notificação"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="unread" className="space-y-4">
            {/* O conteúdo é renderizado pela lógica de filtro acima */}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Notifications;
