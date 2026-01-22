
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/auth";
import useAdminRole from "./useAdminRole";
import useAdminStats, { AdminStats, DEFAULT_STATS } from "./useAdminStats";
import { supabase, retryOperation, checkSupabaseConnection } from "@/integrations/supabase/client";
import { checkSupabaseAvailability, waitForConnection, setupConnectionKeepAlive } from "./utils/queryUtils";
import { toast } from "sonner";

interface UseAdminPanelProps {
  onError?: () => void;
}

export const useAdminPanel = ({ onError }: UseAdminPanelProps = {}) => {
  const { user, profile } = useAuth();
  const { 
    isAdmin, 
    isLoading: roleLoading, 
    hasError: roleError
  } = useAdminRole();
  const { stats, loadStats, isLoading: statsLoading } = useAdminStats();
  
  const [retryCounter, setRetryCounter] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [lastActivityTimestamp, setLastActivityTimestamp] = useState(Date.now());
  const [connectionCheckInProgress, setConnectionCheckInProgress] = useState(false);
  const [connectionErrors, setConnectionErrors] = useState(0);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  
  const keepAliveRef = useRef<{ stopKeepAlive: () => void } | null>(null);

  const updateActivityTimestamp = useCallback(() => {
    setLastActivityTimestamp(Date.now());
  }, []);

  const tryWithBackoff = useCallback(async (operation: () => Promise<any>, maxAttempts = 4) => {
    let attempts = 0;
    let lastError: any = null;
    
    while (attempts < maxAttempts) {
      try {
        attempts++;
        const result = await operation();
        return { result, success: true };
      } catch (error) {
        console.warn(`Tentativa ${attempts}/${maxAttempts} falhou:`, error);
        lastError = error;
        
        if (attempts < maxAttempts) {
          const delay = Math.min(500 * Math.pow(2, attempts - 1), 8000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    return { error: lastError, success: false };
  }, []);

  const performBackgroundHealthCheck = useCallback(async () => {
    try {
      const isConnected = await checkSupabaseConnection();
      
      if (!isConnected) {
        console.warn("Health check em segundo plano falhou");
        setConnectionErrors(prev => prev + 1);
        
        if (connectionErrors > 3) {
          toast.error("Detectados problemas de conexão com o servidor", {
            id: "connection-issues",
            duration: 5000,
          });
        }
        
        if (keepAliveRef.current) {
          keepAliveRef.current.stopKeepAlive();
        }
        
        keepAliveRef.current = setupConnectionKeepAlive(supabase, 20000);
      } else {
        if (connectionErrors > 0) {
          setConnectionErrors(0);
        }
      }
    } catch (error) {
      console.error("Erro no health check em segundo plano:", error);
    }
  }, [connectionErrors]);

  useEffect(() => {
    keepAliveRef.current = setupConnectionKeepAlive(supabase, 20000);
    
    return () => {
      if (keepAliveRef.current) {
        keepAliveRef.current.stopKeepAlive();
      }
    };
  }, []);

  const retryLoading = useCallback(async () => {
    console.log("Tentando recarregar dados do painel admin...");
    
    setConnectionCheckInProgress(true);
    
    try {
      toast.loading("Verificando conexão...", { id: "connection-check" });
      
      const isOnline = navigator.onLine;
      
      if (!isOnline) {
        console.log("Dispositivo está offline. Aguardando conexão...");
        
        const hasConnection = await waitForConnection(5000);
        if (!hasConnection) {
          console.log("Não foi possível estabelecer conexão");
          toast.error("Verifique sua conexão com a internet", { id: "connection-check" });
          if (onError) onError();
          setConnectionCheckInProgress(false);
          return;
        }
      }
      
      const isConnected = await checkSupabaseConnection();
      
      if (!isConnected) {
        console.log("Supabase não está disponível no momento");
        toast.error("Servidor não está respondendo. Tente novamente mais tarde.", { id: "connection-check" });
        if (onError) onError();
        setConnectionCheckInProgress(false);
        return;
      }
      
      toast.success("Conexão estabelecida!", { id: "connection-check" });
      setRetryCounter(prev => prev + 1);
      setHasError(false);
      setIsLoading(true);
      setHasTimedOut(false);
      updateActivityTimestamp();
      
      if (keepAliveRef.current) {
        keepAliveRef.current.stopKeepAlive();
      }
      keepAliveRef.current = setupConnectionKeepAlive(supabase, 20000);
      
    } catch (error) {
      console.error("Erro ao verificar conexão:", error);
      toast.error("Erro ao verificar conexão", { id: "connection-check" });
      if (onError) onError();
    } finally {
      setConnectionCheckInProgress(false);
    }
  }, [setHasError, updateActivityTimestamp, onError, tryWithBackoff]);

  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'click', 'keypress', 'scroll', 'touchstart'];
    
    const handleUserActivity = () => {
      updateActivityTimestamp();
    };
    
    events.forEach(event => {
      window.addEventListener(event, handleUserActivity);
    });
    
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
    };
  }, [updateActivityTimestamp]);

  useEffect(() => {
    const inactivityCheck = setInterval(() => {
      const currentTime = Date.now();
      const inactiveTime = currentTime - lastActivityTimestamp;
      
      if (inactiveTime > 120000) {
        console.log("Inatividade detectada por mais de 2 minutos, verificando conexão...");
        performBackgroundHealthCheck();
      }
    }, 60000);
    
    return () => clearInterval(inactivityCheck);
  }, [lastActivityTimestamp, performBackgroundHealthCheck]);

  useEffect(() => {
    const healthCheckTimer = setInterval(() => {
      performBackgroundHealthCheck();
    }, 45000);
    
    return () => clearInterval(healthCheckTimer);
  }, [performBackgroundHealthCheck]);

  useEffect(() => {
    const handleOnline = () => {
      console.log("Navegador detectou que está online - tentando recarregar dados");
      if (keepAliveRef.current) {
        keepAliveRef.current.stopKeepAlive();
      }
      keepAliveRef.current = setupConnectionKeepAlive(supabase, 20000);
      
      retryLoading();
    };
    
    const handleOffline = () => {
      console.log("Navegador detectou que está offline");
      toast.error("Conexão perdida. Você está offline.", {
        id: "offline-notification",
        duration: 5000
      });
      
      if (keepAliveRef.current) {
        keepAliveRef.current.stopKeepAlive();
      }
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [retryLoading]);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    console.log("Verificando status de admin para o usuário:", user.email);
    
    loadStats().catch(error => {
      console.error("Erro ao carregar estatísticas:", error);
    });
    
    keepAliveRef.current = setupConnectionKeepAlive(supabase, 20000);
    
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 5000);
    
    return () => {
      clearTimeout(timeout);
      if (keepAliveRef.current) {
        keepAliveRef.current.stopKeepAlive();
      }
    };
  }, [user, loadStats]);

  useEffect(() => {
    setIsLoading(roleLoading || statsLoading);
  }, [roleLoading, statsLoading]);

  return {
    user,
    profile,
    isAdmin,
    isLoading,
    hasError: roleError || hasError,
    stats: stats || DEFAULT_STATS,
    retryLoading,
    connectionErrors,
    hasTimedOut
  };
};

export default useAdminPanel;
