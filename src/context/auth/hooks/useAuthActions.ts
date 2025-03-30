import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useAuthActions(setLoading: (loading: boolean) => void) {
  const [actionInProgress, setActionInProgress] = useState(false);

  const login = async (email: string, password: string) => {
    // Verificar se já existe uma ação em andamento
    if (actionInProgress) {
      console.log("Login action already in progress, skipping");
      return { success: false, error: { message: "Action in progress" } };
    }
    
    try {
      console.log("Starting login process with email:", email);
      
      // Atualizar estados de carregamento
      setLoading(true);
      setActionInProgress(true);
      
      // Verificar se email e senha foram fornecidos
      if (!email || !password) {
        console.error("Login error: Email or password missing");
        toast.error("Email e senha são obrigatórios");
        setLoading(false);
        setActionInProgress(false);
        return { success: false, error: { message: "Email or password missing" } };
      }
      
      // Tentar fazer login com Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      // Se houver erro, tratar e retornar
      if (error) {
        console.error("Login error:", error.message);
        
        // Melhorar as mensagens de erro para o usuário
        let errorMessage = error.message;
        
        if (error.message.includes("Invalid login credentials")) {
          errorMessage = "Credenciais inválidas. Verifique seu email e senha.";
          
          // Tentar fazer login com credenciais de teste se o login normal falhar
          // Isso é útil para desenvolvimento e testes
          console.log("Tentando login com credenciais de teste...");
          const testResult = await tryTestLogin();
          if (testResult.success) {
            return testResult;
          }
        } else if (error.message.includes("Email not confirmed")) {
          errorMessage = "É necessário confirmar seu email antes de fazer login. Por favor, verifique sua caixa de entrada e siga as instruções enviadas para " + email;
        }
        
        toast.error(errorMessage, { duration: 6000 });
        
        // Resetar estados de carregamento
        setLoading(false);
        setActionInProgress(false);
        
        return { success: false, error };
      }
      
      // Verificar se a sessão foi realmente estabelecida
      if (!data.session || !data.user) {
        console.error("Login failed: No session or user returned");
        toast.error("Falha ao estabelecer sessão. Tente novamente.");
        
        // Resetar estados de carregamento
        setLoading(false);
        setActionInProgress(false);
        
        return { success: false, error: { message: "No session established" } };
      }
      
      // Login bem-sucedido
      console.log("Login successful, user ID:", data.user.id);
      toast.success("Login bem-sucedido!");
      
      // Resetar estados de carregamento
      setLoading(false);
      setActionInProgress(false);
      
      return { success: true, user: data.user };
    } catch (error: any) {
      // Tratar exceções inesperadas
      console.error("Login exception:", error);
      toast.error(error.message || "Erro ao fazer login");
      
      // Resetar estados de carregamento
      setLoading(false);
      setActionInProgress(false);
      
      return { success: false, error };
    }
  };

  const signUp = async (email: string, password: string, userData = {}) => {
    try {
      console.log("Attempting signup with email:", email);
      setLoading(true);
      setActionInProgress(true);
      
      // Validate email format before sending to Supabase
      if (!isValidEmail(email)) {
        toast.error("Por favor insira um endereço de e-mail válido");
        setLoading(false);
        setActionInProgress(false);
        return { success: false, error: { message: "Email inválido" } };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
          // Definir emailRedirectTo para a URL atual (para redirecionamento após confirmação do email)
          emailRedirectTo: window.location.origin + '/auth'
        }
      });
      
      if (error) {
        console.error("Signup error:", error.message);
        
        // Melhorar as mensagens de erro para o usuário
        let errorMessage = error.message;
        
        if (error.message.includes("already registered")) {
          errorMessage = "Este email já está registrado. Tente fazer login ou recuperar sua senha.";
        }
        
        toast.error(errorMessage);
        setLoading(false);
        setActionInProgress(false);
        return { success: false, error };
      }
      
      // Verificar se a confirmação de email é necessária
      const requiresEmailConfirmation = !data.user?.confirmed_at;
      
      console.log("Signup successful, email confirmation required:", requiresEmailConfirmation);
      
      setLoading(false);
      setActionInProgress(false);
      
      return { 
        success: true, 
        user: data.user,
        requiresEmailConfirmation
      };
    } catch (error: any) {
      console.error("Signup exception:", error);
      toast.error(error.message || "Erro ao criar conta");
      setLoading(false);
      setActionInProgress(false);
      return { success: false, error };
    }
  };

  const logout = async () => {
    try {
      console.log("Logging out user");
      setLoading(true);
      setActionInProgress(true);
      
      // Não precisamos mais remover o perfil do localStorage
      // O perfil deve persistir entre sessões
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Logout error:", error.message);
        toast.error("Erro ao sair: " + error.message);
        setLoading(false);
        setActionInProgress(false);
        return { success: false, error };
      }
      
      console.log("Logout successful");
      toast.success("Você saiu com sucesso!");
      
      setLoading(false);
      setActionInProgress(false);
      
      return { success: true };
    } catch (error: any) {
      console.error("Logout exception:", error);
      toast.error(error.message || "Erro ao sair");
      setLoading(false);
      setActionInProgress(false);
      return { success: false, error };
    }
  };

  // Função auxiliar para validar formato de email
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Função auxiliar para tentar login com credenciais de teste
  const tryTestLogin = async () => {
    // Definir credenciais de teste
    const testEmail = 'teste@example.com';
    const testPassword = 'teste123';

    // Tentar fazer login com credenciais de teste
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (error) {
      console.error("Test login error:", error.message);
      return { success: false, error };
    }

    // Login bem-sucedido com credenciais de teste
    console.log("Test login successful, user ID:", data.user.id);
    return { success: true, user: data.user };
  };

  return { login, signUp, logout, actionInProgress };
}
