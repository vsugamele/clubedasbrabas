import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

/**
 * Hook para gerenciar recursos premium e restrições para usuários gratuitos
 */
export function usePremiumFeatures() {
  const { user } = useAuth();
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [currentFeature, setCurrentFeature] = useState<'messaging' | 'posting' | 'gallery' | 'general'>('general');
  const { toast } = useToast();
  const [userIsPremium, setUserIsPremium] = useState<boolean | null>(null);
  const [premiumCheckLoading, setPremiumCheckLoading] = useState(true);
  
  // Função para verificar e atualizar o status premium (definida antes dos useEffects)
  const checkPremiumStatus = async () => {
    setPremiumCheckLoading(true);
    const isPremiumStatus = await isPremium();
    setUserIsPremium(isPremiumStatus);
    setPremiumCheckLoading(false);
    
    // Atualizar o cache
    if (user) {
      localStorage.setItem(`premium_status_${user.id}`, isPremiumStatus ? 'true' : 'false');
      localStorage.setItem(`premium_cache_time_${user.id}`, Date.now().toString());
    }
  };
  
  // Verificar o status premium do usuário quando ele mudar
  useEffect(() => {
    if (user) {
      // Primeiro tentamos usar o cache do localStorage
      const cachedStatus = localStorage.getItem(`premium_status_${user.id}`);
      const cacheTime = localStorage.getItem(`premium_cache_time_${user.id}`);
      
      const now = Date.now();
      const cacheValid = cacheTime && (now - parseInt(cacheTime)) < 5 * 60 * 1000; // 5 minutos
      
      if (cachedStatus && cacheValid) {
        setUserIsPremium(cachedStatus === 'true');
        setPremiumCheckLoading(false);
      } else {
        // Se não tiver cache válido, buscar do servidor
        checkPremiumStatus();
      }
    } else {
      setUserIsPremium(false);
      setPremiumCheckLoading(false);
    }
  }, [user]);
  
  // Verificar status de admin e premium automaticamente a cada 5 segundos
  // Isso garante que alterações feitas no painel admin sejam refletidas rapidamente
  useEffect(() => {
    if (!user) return;
    
    console.log('Iniciando verificação automática de status admin/premium');
    
    // Forçar uma primeira verificação imediata
    checkPremiumStatus();
    
    // Configurar verificação periódica
    const statusCheckInterval = setInterval(() => {
      if (user) {
        console.log('Verificação automática de status premium em execução...');
        checkPremiumStatus();
      }
    }, 5000); // Verificar a cada 5 segundos
    
    // Limpar o intervalo quando o componente desmontar
    return () => {
      console.log('Limpando verificação automática');
      clearInterval(statusCheckInterval);
    };
  }, [user]); // Removemos checkPremiumStatus das dependências para evitar loops

  /**
   * Verifica se o usuário atual possui plano premium
   */
  const isPremium = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    try {
      // Verificar se o usuário é administrador primeiro (sempre tem acesso premium)
      const isAdmin = await checkIsAdmin(user.id);
      if (isAdmin) {
        console.log('Usuário é administrador, concedendo acesso premium');
        return true;
      }
      
      // Buscar diretamente da tabela profiles
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Erro ao verificar tipo de assinatura:', error);
        return false;
      }

      // Extrair a propriedade subscription_type diretamente, tratando como any
      const profile = data as any;
      const subscriptionType = profile.subscription_type;
      console.log(`Tipo de assinatura do usuário ${user.id}:`, subscriptionType);
      
      // Verificar explicitamente se é igual a 'premium'
      const isPremiumUser = subscriptionType === 'premium';
      console.log(`Usuário ${user.id} é premium:`, isPremiumUser);
      
      return isPremiumUser;
    } catch (error) {
      console.error('Erro ao verificar tipo de assinatura:', error);
      return false;
    }
  }, [user]);
  
  // Função auxiliar para verificar se o usuário é admin (solução robusta)
  const checkIsAdmin = async (userId: string): Promise<boolean> => {
    if (!userId) return false;
    
    try {
      // Obter informação do usuário atual para depuração
      console.log(`Verificando permissões de administrador para o usuário: ${userId}`); 
      
      // 1. Verificar diretamente em localStorage (mais rápido)
      const cachedRoles = localStorage.getItem('userRoles');
      if (cachedRoles) {
        try {
          const rolesMap = JSON.parse(cachedRoles);
          if (rolesMap && rolesMap[userId] === 'admin') {
            console.log(`Usuário ${userId} é administrador (via cache localStorage)`); 
            return true;
          }
        } catch (e) {
          console.warn('Erro ao processar papéis em cache:', e);
        }
      }
      
      // 2. IMPORTANTE: Lista de emails que sempre são admins (solução imediata)
      // Adicione o email que você está usando aqui
      const adminEmails = [
        'jpjpfreitasestudo@gmail.com',  // ✅ Seu email de teste
        'admin@bruxabraba.com', 
        'tech@bruxabraba.com'
      ];
      
      // Buscar usuário do Auth
      try {
        const { data: authUser } = await supabase.auth.getUser();
        if (authUser && authUser.user && authUser.user.email) {
          const userEmail = authUser.user.email;
          
          if (adminEmails.includes(userEmail)) {
            console.log(`Usuário com email ${userEmail} é administrador por email`);
            
            // Atualizar cache para futuras verificações
            try {
              const existingRoles = localStorage.getItem('userRoles') || '{}';
              const rolesMap = JSON.parse(existingRoles);
              rolesMap[userId] = 'admin';
              localStorage.setItem('userRoles', JSON.stringify(rolesMap));
              console.log('Cache de admin atualizado para o usuário:', userId);
            } catch (e) {
              console.warn('Erro ao atualizar cache de papéis:', e);
            }
            
            return true;
          }
        }
      } catch (authError) {
        console.error('Erro ao verificar usuário autenticado:', authError);
      }
      
      // 3. Verificar na tabela user_roles (método oficial)
      // Tentar buscar o papel diretamente sem .single() para evitar erros
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId);
        
      if (!error && data && data.length > 0) {
        // Verificar qualquer registro com papel 'admin'
        const isAdmin = data.some(role => role.role === 'admin');
        if (isAdmin) {
          console.log(`Usuário ${userId} é administrador (via tabela user_roles)`); 
          return true;
        }
      }
      
      // Último teste: verificar quem está logado como backup
      // Isso garante que o próprio admin consiga usar suas funcionalidades
      try {
        const { data: authUser } = await supabase.auth.getUser();
        if (authUser && authUser.user) {
          if (authUser.user.id === userId && authUser.user.email === 'jpjpfreitasestudo@gmail.com') {
            console.log('Garantindo acesso admin para o email principal jpjpfreitasestudo@gmail.com');
            
            // Tentar inserir diretamente na tabela user_roles
            try {
              await supabase
                .from('user_roles')
                .upsert([{ user_id: userId, role: 'admin' }]);
                
              console.log('Privilégio de admin inserido com sucesso!');  
            } catch (insertError) {
              console.error('Erro ao inserir privilégio admin:', insertError);
            }
            
            return true;
          }
        }
      } catch (e) {
        console.error('Erro ao verificar usuário atual:', e);
      }
      
      // Se chegou aqui, não é admin em nenhuma verificação
      console.log(`Usuário ${userId} NÃO é administrador após todas as verificações`);
      return false;
    } catch (error) {
      console.error('Erro ao verificar papel de administrador:', error);
      return false;
    }
  };

  /**
   * Verifica se o usuário pode enviar mensagens
   * Usuários gratuitos não podem enviar mensagens
   */
  const canSendMessages = useCallback(async (): Promise<boolean> => {
    // Usar o valor em cache se disponível
    if (userIsPremium !== null) {
      if (!userIsPremium) {
        setCurrentFeature('messaging');
        setShowPremiumModal(true);
        return false;
      }
      return true;
    }
    
    // Se ainda não verificamos o status premium
    const isPremiumUser = await isPremium();
    
    if (!isPremiumUser) {
      setCurrentFeature('messaging');
      setShowPremiumModal(true);
      return false;
    }
    
    return true;
  }, [userIsPremium, isPremium]);

  /**
   * Verifica se o usuário pode acessar galerias de referências
   * Usuários gratuitos não podem acessar galerias
   */
  const canAccessGallery = useCallback(async (): Promise<boolean> => {
    // Usar o valor em cache se disponível
    if (userIsPremium !== null) {
      if (!userIsPremium) {
        setCurrentFeature('gallery');
        setShowPremiumModal(true);
        return false;
      }
      return true;
    }
    
    // Se ainda não verificamos o status premium
    const isPremiumUser = await isPremium();
    
    if (!isPremiumUser) {
      setCurrentFeature('gallery');
      setShowPremiumModal(true);
      return false;
    }
    
    return true;
  }, [userIsPremium, isPremium]);

  /**
   * Verifica se o usuário pode criar uma nova postagem
   * Usuários gratuitos só podem criar 2 postagens
   */
  const canCreatePost = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    
    // Usar o valor em cache se disponível
    if (userIsPremium !== null && userIsPremium) {
      return true; // Usuários premium podem criar posts ilimitados
    }
    
    // Se não estiver no cache, verificar diretamente
    if (userIsPremium === null) {
      const isPremiumUser = await isPremium();
      if (isPremiumUser) return true;
    }
    
    try {
      // Conta quantos posts o usuário já criou
      const { data, error, count } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: false })
        .eq('author_id', user.id);

      if (error) {
        console.error('Erro ao verificar quantidade de postagens:', error);
        return false;
      }

      // Usuários free podem criar até 2 posts
      if (count !== null && count >= 2) {
        setCurrentFeature('posting');
        setShowPremiumModal(true);
        
        toast({
          title: "Limite de postagens atingido",
          description: "Usuários gratuitos podem criar apenas 2 postagens. Atualize para o plano premium para criar postagens ilimitadas.",
          variant: "destructive"
        });
        
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao verificar quantidade de postagens:', error);
      return false;
    }
  }, [user, userIsPremium, isPremium, toast, setCurrentFeature, setShowPremiumModal]);

  return {
    isPremium,
    canSendMessages,
    canAccessGallery,
    canCreatePost,
    showPremiumModal,
    setShowPremiumModal,
    currentFeature,
    userIsPremium,
    checkPremiumStatus,
    premiumCheckLoading
  };
}
