// Correção para o componente ProtectedRoute no App.tsx
// Substitua o componente ProtectedRoute atual pelo código abaixo:

const ProtectedRoute = ({ element }: { element: React.ReactNode }) => {
  console.log("ProtectedRoute rendered, user exists:", !!user);
  
  // Verificar se há um token de autenticação no localStorage, mesmo que o estado do usuário ainda não tenha sido atualizado
  const hasLocalToken = () => {
    try {
      // Verificar se há uma sessão ativa no Supabase
      const session = supabase.auth.session();
      if (session) {
        console.log("Sessão ativa encontrada no Supabase");
        return true;
      }
      
      // Verificar o token no localStorage como fallback
      const tokenData = localStorage.getItem('supabase.auth.token');
      if (!tokenData) {
        console.log("Nenhum token encontrado no localStorage");
        return false;
      }
      
      try {
        const parsedToken = JSON.parse(tokenData);
        if (!parsedToken || !parsedToken.currentSession) {
          console.log("Token inválido no localStorage");
          return false;
        }
        
        // Verificar se o token não está expirado
        const now = Math.floor(Date.now() / 1000);
        const isValid = parsedToken.expiresAt > now;
        console.log("Token no localStorage é válido:", isValid);
        return isValid;
      } catch (parseError) {
        console.error("Erro ao analisar token:", parseError);
        return false;
      }
    } catch (error) {
      console.error("Erro ao verificar token local:", error);
      return false;
    }
  };
  
  // Verificar se estamos carregando a autenticação
  if (loading) {
    console.log("Autenticação ainda está carregando, mostrando tela de carregamento");
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full text-orange-500" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
          <p className="mt-2 text-gray-600 dark:text-gray-300">Verificando autenticação...</p>
        </div>
      </div>
    );
  }
  
  // Permitir acesso se o usuário estiver autenticado OU se houver um token válido
  const isAuthenticated = !!user || hasLocalToken();
  console.log("Usuário está autenticado:", isAuthenticated);
  
  if (isAuthenticated) {
    return <>{element}</>;
  }
  
  // Caso contrário, redirecionar para a página de login
  console.log("Redirecionando para página de login");
  return <Navigate to="/auth" replace state={{ from: location }} />;
};
