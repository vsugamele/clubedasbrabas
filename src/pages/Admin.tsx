
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth";
import MainLayout from "@/components/layout/MainLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, RefreshCcw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { isOnline, checkSupabaseAvailability, waitForConnection } from "@/components/admin/hooks/utils/queryUtils";
import { supabase, checkSupabaseConnection } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Importação direta para evitar problemas de carregamento dinâmico
import AdminPanel from "@/components/admin/AdminPanel";

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorType, setErrorType] = useState<'connection' | 'auth' | 'unknown'>('unknown');
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [autoRetryActive, setAutoRetryActive] = useState(false);
  const [autoRetryCount, setAutoRetryCount] = useState(0);
  const [adminPanelLoaded, setAdminPanelLoaded] = useState(false);
  
  // Verificar conectividade com o Supabase com mais detalhes
  const checkConnection = useCallback(async () => {
    if (!isOnline()) {
      console.log("Dispositivo está offline");
      setErrorType('connection');
      setHasError(true);
      
      // Attempt to wait for connection before giving up
      const connectionEstablished = await waitForConnection(5000);
      if (connectionEstablished) {
        console.log("Conexão restabelecida automaticamente");
        setHasError(false);
        return true;
      }
      return false;
    }
    
    setIsCheckingConnection(true);
    try {
      console.log("Verificando conexão com Supabase...");
      const startTime = Date.now();
      const isAvailable = await checkSupabaseConnection();
      const elapsed = Date.now() - startTime;
      
      console.log(`Verificação de disponibilidade levou ${elapsed}ms`);
      
      if (!isAvailable) {
        console.log("Supabase não está disponível");
        setErrorType('connection');
        setHasError(true);
        return false;
      }
      return true;
    } catch (error) {
      console.error("Erro ao verificar conexão:", error);
      setErrorType('connection');
      setHasError(true);
      return false;
    } finally {
      setIsCheckingConnection(false);
    }
  }, []);
  
  // Auto-retry mechanism
  useEffect(() => {
    let retryTimer: number | null = null;
    
    if (autoRetryActive && hasError && autoRetryCount < 3) {
      console.log(`Agendando nova tentativa automática (${autoRetryCount + 1}/3) em 15 segundos...`);
      
      retryTimer = window.setTimeout(() => {
        console.log("Executando tentativa automática de reconexão");
        setAutoRetryCount(prev => prev + 1);
        handleRetry();
      }, 15000); // Try every 15 seconds, reduced from 10s
    }
    
    return () => {
      if (retryTimer) {
        window.clearTimeout(retryTimer);
      }
    };
  }, [autoRetryActive, hasError, autoRetryCount]);
  
  useEffect(() => {
    // Timeout mais curto para verificação inicial de autenticação
    const timer = setTimeout(() => {
      if (!isAuthChecked) {
        console.log("Auth check timeout reached, forcing UI to render");
        setIsAuthChecked(true);
        
        // Verificar se a falha foi de conexão
        if (!authLoading && !user) {
          checkConnection();
        }
      }
    }, 8000); // 8 segundos para verificação de autenticação

    return () => clearTimeout(timer);
  }, [isAuthChecked, authLoading, user, checkConnection]);
  
  useEffect(() => {
    // Check auth as soon as authLoading completes
    if (!authLoading) {
      setIsAuthChecked(true);
      if (!user) {
        // Verificar se é problema de conexão ou realmente não está logado
        checkConnection().then(isConnected => {
          if (isConnected) {
            // Se está conectado mas não tem usuário, redirecionar para login
            setErrorType('auth');
            navigate("/auth");
          } else {
            // Ativar a tentativa automática de reconexão
            setAutoRetryActive(true);
          }
        });
      }
    }
  }, [user, authLoading, navigate, checkConnection]);
  
  // Conexão com eventos do navegador para detectar mudanças na conectividade
  useEffect(() => {
    const handleOnline = () => {
      console.log("Navegador detectou que está online");
      if (hasError && errorType === 'connection') {
        toast.info("Conexão com a internet detectada. Tentando reconectar...");
        handleRetry();
      }
    };
    
    const handleOffline = () => {
      console.log("Navegador detectou que está offline");
      if (!hasError) {
        setHasError(true);
        setErrorType('connection');
        toast.error("Você está offline. Verifique sua conexão com a internet.", {
          duration: 5000,
        });
      }
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [hasError, errorType]);

  // Função para tentar novamente a conexão
  const handleRetry = async () => {
    console.log("Tentando reconectar ao Supabase...");
    setConnectionAttempts(prev => prev + 1);
    setHasError(false);
    
    // Exibir toast de carregamento
    toast.loading("Verificando conexão...", { id: "connection-check" });
    
    // Verificar conexão novamente
    const isConnected = await checkConnection();
    
    if (isConnected) {
      toast.success("Conexão restabelecida!", { id: "connection-check" });
      setAutoRetryActive(false);
      setAutoRetryCount(0);
      
      // Se conseguiu conectar e ainda não tem usuário, redirecionar para login
      if (!user) {
        setErrorType('auth');
        setTimeout(() => navigate("/auth"), 1500);
      }
    } else {
      toast.error("Falha ao conectar. Nova tentativa em alguns segundos.", { id: "connection-check" });
      // Ativar a tentativa automática se não estiver ativa
      if (!autoRetryActive) {
        setAutoRetryActive(true);
        setAutoRetryCount(0);
      }
    }
  };

  // Função para recarregar a página completamente
  const handleRefreshPage = () => {
    window.location.reload();
  };
  
  // Função para interromper tentativas automáticas
  const stopAutoRetry = () => {
    setAutoRetryActive(false);
    setAutoRetryCount(0);
    toast.info("Tentativas automáticas interrompidas");
  };

  // Mostrar estado de carregamento ao verificar autenticação
  if (authLoading && !isAuthChecked) {
    return (
      <MainLayout>
        <div className="container py-6">
          <div className="space-y-4">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        </div>
      </MainLayout>
    );
  }

  // Mostrar estado de erro se tivermos experimentado um erro
  if (hasError) {
    return (
      <MainLayout>
        <div className="container py-6">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Falha na comunicação</AlertTitle>
            <AlertDescription>
              Estamos com problemas para conectar ao servidor Supabase. 
              {autoRetryActive && 
                ` Tentativas automáticas em andamento (${autoRetryCount}/3)${autoRetryCount < 3 ? ". Próxima tentativa em alguns segundos." : ", sem sucesso."}`}
            </AlertDescription>
          </Alert>
          
          <div className="flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-slate-900 rounded-lg shadow-md">
            <WifiOff className="h-16 w-16 text-destructive mb-4" />
            <h2 className="text-2xl font-bold mb-2">Erro de comunicação com o servidor</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              Não foi possível estabelecer comunicação com o banco de dados Supabase. 
              Isto pode ocorrer devido a problemas de rede ou indisponibilidade temporária do serviço.
            </p>
            
            <div className="text-left mb-8 max-w-md">
              <p className="font-medium mb-2">Sugestões:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Verifique sua conexão com a internet</li>
                <li>Desative extensões do navegador que possam estar bloqueando a conexão</li>
                <li>Tente novamente em alguns minutos</li>
                <li>Limpe o cache do navegador e cookies</li>
              </ul>
            </div>
            
            <div className="flex flex-wrap gap-4 justify-center">
              {autoRetryActive ? (
                <Button 
                  onClick={stopAutoRetry} 
                  variant="outline"
                  size="lg"
                  className="border-red-500 text-red-500 hover:bg-red-500/10"
                >
                  <AlertCircle className="mr-2 h-4 w-4" /> 
                  Parar tentativas automáticas
                </Button>
              ) : (
                <Button 
                  onClick={handleRetry} 
                  disabled={isCheckingConnection}
                  variant="outline"
                  size="lg"
                  className="border-[#ff4400] text-[#ff4400] hover:bg-[#ff4400]/10"
                >
                  <RefreshCcw className={`mr-2 h-4 w-4 ${isCheckingConnection ? 'animate-spin' : ''}`} /> 
                  {isCheckingConnection ? "Verificando..." : "Tentar novamente"}
                </Button>
              )}
              
              <Button 
                onClick={handleRefreshPage} 
                size="lg"
                className="bg-[#ff4400] hover:bg-[#ff4400]/90"
              >
                <RefreshCcw className="mr-2 h-4 w-4" /> Recarregar página
              </Button>
            </div>
            
            {connectionAttempts > 2 && (
              <div className="mt-8 p-4 border border-orange-200 bg-orange-50 rounded-lg max-w-md">
                <p className="text-sm text-orange-800">
                  Vários problemas de conexão foram detectados. Se o problema persistir, verifique se o servidor Supabase está online ou entre em contato com o suporte.
                </p>
              </div>
            )}
          </div>
        </div>
      </MainLayout>
    );
  }

  // Se a autenticação for verificada e o usuário não estiver logado, mostrar acesso negado
  if (!user) {
    return (
      <MainLayout>
        <div className="container py-6">
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h2 className="text-2xl font-bold mb-2">Acesso Restrito</h2>
            <p className="text-muted-foreground mb-4">Você precisa estar logado para acessar esta página.</p>
            <Button onClick={() => navigate("/auth")} className="bg-[#ff4400] hover:bg-[#ff4400]/90">Fazer Login</Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Handle AdminPanel load state
  const handleAdminPanelLoad = () => {
    setAdminPanelLoaded(true);
  };

  // Reportar erro do AdminPanel
  const handleAdminPanelError = () => {
    console.log("Erro reportado do AdminPanel, exibindo tela de erro");
    setHasError(true);
    setErrorType('connection');
    // Iniciar tentativas automáticas
    setAutoRetryActive(true);
    setAutoRetryCount(0);
  };

  // Tudo OK, mostrar o painel admin com importação direta
  return (
    <MainLayout>
      <div className="container py-6">
        {!adminPanelLoaded ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4 mx-auto" />
            <Skeleton className="h-[500px] w-full rounded-lg" />
          </div>
        ) : null}
        
        <AdminPanel 
          onLoad={handleAdminPanelLoad}
          onError={handleAdminPanelError}
        />
      </div>
    </MainLayout>
  );
};

export default Admin;
