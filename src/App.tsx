import React from "react";
import Index from "@/pages/Index";
import Messages from "@/pages/Messages";
import Profile from "@/pages/Profile";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";
import Admin from "@/pages/Admin";
import Events from "@/pages/Events";
import Search from "@/pages/Search"; // Adicionado import da página de busca
import UsefulLinks from "@/pages/UsefulLinks"; // Adicionado import da página de links úteis
import CreatePost from "@/pages/CreatePost";
import Notifications from "@/pages/Notifications";
import TrendingPage from "@/pages/Trending"; // Importando a página de Trending
import PostRemover from "@/pages/PostRemover"; // Importando a página de remoção de posts
import ReferenceGallery from "@/pages/ReferenceGallery"; // Importando a página de galeria de referências
import Debug from "@/pages/Debug"; // Importando a página de depuração
import AdminDelete from "@/pages/AdminDelete"; // Importando a página para excluir post específico
import { useAuth } from "./context/auth";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { testAndFixCategorySync } from "./components/admin/communities/categoryIntegration";

const App = () => {
  const { user, loading, refreshSession, attemptSessionRecovery } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [progressValue, setProgressValue] = useState(30);
  const [forceLoaded, setForceLoaded] = useState(false);
  const [sessionError, setSessionError] = useState(false);
  const [authAttempts, setAuthAttempts] = useState(0);
  const [lastAuthCheck, setLastAuthCheck] = useState(0);
  
  const handleSessionRecovery = useCallback(async () => {
    console.log("Trying to recover session...");
    
    const now = Date.now();
    if (now - lastAuthCheck < 5000 && lastAuthCheck > 0) {
      console.log("Skipping session recovery - too soon");
      return false;
    }
    
    setLastAuthCheck(now);
    
    if (sessionError) {
      if (authAttempts >= 3) {
        console.log("Max recovery attempts reached, redirecting to login");
        navigate('/auth');
        return false;
      }
      
      setAuthAttempts(prev => prev + 1);
      const recovered = await attemptSessionRecovery();
      
      if (recovered) {
        toast.success("Sessão restaurada com sucesso");
        setSessionError(false);
        
        if (location.pathname.includes('admin')) {
          navigate('/admin');
        }
        return true;
      } else {
        toast.error("Não foi possível restaurar a sessão. Tente fazer login novamente.");
        navigate('/auth');
        return false;
      }
    }
    return false;
  }, [sessionError, attemptSessionRecovery, navigate, location.pathname, authAttempts, lastAuthCheck]);
  
  useEffect(() => {
    const handleAuthError = (event: any) => {
      if (event?.detail?.error?.message?.includes('JWT expired')) {
        console.log("JWT expired, attempting to refresh session");
        setSessionError(true);
        handleSessionRecovery();
      }
    };
    
    window.addEventListener('supabase-auth-error', handleAuthError);
    
    return () => {
      window.removeEventListener('supabase-auth-error', handleAuthError);
    };
  }, [handleSessionRecovery]);
  
  useEffect(() => {
    console.log("App rendered, auth state:", { 
      user: !!user, 
      loading, 
      path: location.pathname,
      userId: user?.id || 'none',
      forceLoaded
    });
    
    if (loading && !forceLoaded) {
      const interval = setInterval(() => {
        setProgressValue(prev => {
          const newValue = prev + 5;
          return newValue > 95 ? 30 : newValue;
        });
      }, 500);
      
      return () => clearInterval(interval);
    }
  }, [user, loading, location.pathname, forceLoaded]);
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn("Loading timeout reached - forcing application to render");
        setForceLoaded(true);
        
        refreshSession().catch(() => {
          toast.error("A conexão está demorando mais que o esperado. Tente atualizar a página se necessário.", {
            position: "top-center",
            duration: 5000,
          });
        });
      }
    }, 5000);
    
    return () => clearTimeout(timeout);
  }, [loading, refreshSession]);
  
  useEffect(() => {
    const ping = setInterval(() => {
      if (user) {
        supabase.auth.getUser().catch(err => {
          console.log("Ping error:", err);
        });
      }
    }, 240000);
    
    return () => clearInterval(ping);
  }, [user]);
  
  useEffect(() => {
    if (user) {
      console.log("Executando sincronização automática de categorias...");
      testAndFixCategorySync()
        .then(result => {
          if (result.success) {
            console.log("Sincronização automática de categorias concluída:", result.message);
          } else {
            console.error("Erro na sincronização automática de categorias:", result.message);
          }
        })
        .catch(error => {
          console.error("Erro ao executar sincronização automática de categorias:", error);
        });
    }
  }, [user]);
  
  const showLoading = loading && !forceLoaded && location.pathname !== '/auth';
  
  if (showLoading) {
    console.log("App showing loading indicator because loading is:", loading);
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-orange-50/30">
        <div className="text-center max-w-md w-full px-4">
          <div className="w-full mb-4">
            <Progress value={progressValue} className="h-2 bg-orange-100" />
          </div>
          <p className="mt-4 text-[#ff4400]">Carregando...</p>
        </div>
      </div>
    );
  }
  
  console.log("App rendering routes, user:", !!user, "user id:", user?.id || 'none');
  
  if (location.pathname === '/auth' && loading) {
    return (
      <Routes>
        <Route path="/auth" element={<Auth />} />
      </Routes>
    );
  }
  
  // Restaurando a versão original do ProtectedRoute que estava funcionando
  const ProtectedRoute = ({ element }: { element: React.ReactNode }) => {
    console.log("ProtectedRoute rendered, user exists:", !!user);
    const [checkingAuth, setCheckingAuth] = useState(false);
    const [bypassAuth, setBypassAuth] = useState(false);
    
    // Função para ativar o bypass de autenticação
    const activateBypass = () => {
      console.log("Ativando bypass de autenticação para desenvolvimento");
      setBypassAuth(true);
      toast.success("Modo de desenvolvimento ativado! Acessando sem autenticação.");
      
      // Armazenar no localStorage para manter entre recarregamentos
      localStorage.setItem('dev_bypass_auth', 'true');
    };
    
    // Verificar se o bypass já está ativado no localStorage
    useEffect(() => {
      const savedBypass = localStorage.getItem('dev_bypass_auth');
      if (savedBypass === 'true') {
        console.log("Bypass de autenticação encontrado no localStorage");
        setBypassAuth(true);
      }
    }, []);
    
    // Efeito para verificar autenticação via Supabase quando o componente é montado
    useEffect(() => {
      const checkSupabaseAuth = async () => {
        if (!user && !checkingAuth && !bypassAuth) {
          setCheckingAuth(true);
          console.log("Verificando autenticação diretamente no Supabase");
          
          try {
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session) {
              console.log("Sessão encontrada no Supabase, atualizando contexto");
              await refreshSession();
              setCheckingAuth(false);
              return;
            }
          } catch (error) {
            console.error("Erro ao verificar sessão no Supabase:", error);
          }
          
          setCheckingAuth(false);
        }
      };
      
      checkSupabaseAuth();
    }, [user, refreshSession, bypassAuth]);
    
    // Verificar se estamos carregando a autenticação
    if ((loading || checkingAuth) && !bypassAuth) {
      console.log("Autenticação ainda está carregando, mostrando tela de carregamento");
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full text-orange-500" role="status">
              <span className="visually-hidden">Carregando...</span>
            </div>
            <p className="mt-2 text-gray-600 dark:text-gray-300">Verificando autenticação...</p>
            
            {/* Botão para bypass de autenticação após 2 segundos */}
            {setTimeout(() => {
              const bypassButton = document.getElementById('bypass-auth-button');
              if (bypassButton) {
                bypassButton.style.display = 'block';
              }
            }, 2000) && (
              <button
                id="bypass-auth-button"
                className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                style={{ display: 'none' }}
                onClick={activateBypass}
              >
                Acessar sem autenticação (desenvolvimento)
              </button>
            )}
          </div>
        </div>
      );
    }
    
    // Verificar se o bypass de autenticação foi ativado
    if (bypassAuth) {
      console.log("Bypass de autenticação ativado, permitindo acesso");
      return <>{element}</>;
    }
    
    // Verificar se o usuário está autenticado
    if (user) {
      console.log("Usuário autenticado, permitindo acesso");
      return <>{element}</>;
    }
    
    console.log("Nenhuma autenticação válida encontrada, redirecionando para login");
    return <Navigate to="/auth" replace state={{ from: location }} />;
  };
  
  return (
    <Routes>
      <Route path="/auth" element={
        !user ? (
          <Auth />
        ) : (
          <Navigate to={location.state?.from || "/"} replace />
        )
      } />
      {/* Rotas protegidas */}
      <Route path="/" element={<ProtectedRoute element={<Index />} />} />
      <Route path="/admin" element={<ProtectedRoute element={<Admin />} />} />
      <Route path="/messages" element={<ProtectedRoute element={<Messages />} />} />
      <Route path="/profile" element={<ProtectedRoute element={<Profile />} />} />
      <Route path="/profile/:id" element={<ProtectedRoute element={<Profile />} />} />
      <Route path="/eventos" element={<ProtectedRoute element={<Events />} />} />
      <Route path="/eventos/:id" element={<ProtectedRoute element={<Events />} />} />
      <Route path="/search" element={<ProtectedRoute element={<Search />} />} />
      <Route path="/links" element={<ProtectedRoute element={<UsefulLinks />} />} />
      <Route path="/create-post" element={<ProtectedRoute element={<CreatePost />} />} />
      <Route path="/notifications" element={<ProtectedRoute element={<Notifications />} />} />
      <Route path="/trending" element={<ProtectedRoute element={<TrendingPage />} />} />
      <Route path="/post-remover" element={<ProtectedRoute element={<PostRemover />} />} />
      <Route path="/referencias" element={<ProtectedRoute element={<ReferenceGallery />} />} />
      <Route path="/c/:id" element={<ProtectedRoute element={<Index />} />} />
      <Route path="/debug" element={<ProtectedRoute element={<Debug />} />} />
      <Route path="/admin-delete" element={<ProtectedRoute element={<AdminDelete />} />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;
