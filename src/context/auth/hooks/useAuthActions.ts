import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isValidEmail } from "@/utils/validation";
import { toast } from "sonner";
import { sendUserRegistrationWebhook, isWebhookConfigured } from "@/services/webhookService";
import { debug, logError } from "@/services/debugService";
import { loginWithoutEmailVerification } from "@/utils/supabaseHelper.ts";

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
      // Primeiro tentar login normal
      let { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      // Se houver erro de email não confirmado, tentar login alternativo
      if (error && error.message.includes('Email not confirmed')) {
        debug('auth', 'Tentando login sem confirmação de email');
        
        // Usar função auxiliar para tentar login sem verificação
        const alternativeLogin = await loginWithoutEmailVerification(email, password);
        
        if (alternativeLogin.success) {
          if (alternativeLogin.user) {
            data = { user: alternativeLogin.user, session: null };
            error = null;
          } else {
            // Se enviou um link mágico por email
            toast.success("Um link de acesso foi enviado para seu email");
          }
        }
      }
      
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
          // Versão mais amigável da mensagem
          errorMessage = "Enviamos um email de confirmação para " + email + ". Verifique sua caixa de entrada ou tente novamente em alguns instantes.";
          
          // Adicionar instruções para versão de desenvolvimento
          if (process.env.NODE_ENV !== 'production') {
            debug('auth', 'Instruções para ambiente de desenvolvimento: Desative a confirmação de email no Supabase');
          }
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

  // Define a interface para os dados do usuário no cadastro
  interface UserMetadata {
    full_name?: string;
    name?: string;
    phone?: string;
    [key: string]: any;
  }
  
  const signUp = async (email: string, password: string, userData: UserMetadata = {}) => {
    try {
      debug('auth', `Tentando registrar com email: ${email}`);
      setLoading(true);
      setActionInProgress(true);
      
      // Validar formato de email antes de enviar para o Supabase
      if (!isValidEmail(email)) {
        logError('auth', 'Email inválido na validação local', { email });
        toast.error("Por favor insira um endereço de e-mail válido");
        setLoading(false);
        setActionInProgress(false);
        return { success: false, error: { message: "Email inválido" } };
      }
      
      // Tentar resolver problemas de formato de email para Supabase
      let processedEmail = email.trim().toLowerCase();
      debug('auth', `Email processado para cadastro: ${processedEmail}`);

      // Log detalhado da tentativa de cadastro
      debug('auth', 'Enviando dados para Supabase Auth', { 
        email: processedEmail, 
        hasPassword: !!password,
        userData,
        redirectUrl: window.location.origin + '/auth' 
      });
      
      // Resultado da tentativa de cadastro
      let signupResult;
      
      try {
        signupResult = await supabase.auth.signUp({
          email: processedEmail,
          password,
          options: {
            data: userData,
            // Definir emailRedirectTo para a URL atual (para redirecionamento após confirmação do email)
            emailRedirectTo: window.location.origin + '/auth'
          }
        });
      } catch (supabaseError) {
        // Capturar erros não tratados da API do Supabase
        logError('auth', 'Erro não tratado do Supabase', supabaseError);
        signupResult = { 
          data: { user: null, session: null }, 
          error: { 
            message: supabaseError instanceof Error ? supabaseError.message : 'Erro desconhecido no cadastro'
          }
        };
      }
      
      // Extrair dados e erro do resultado
      const { data, error } = signupResult;
      
      if (error) {
        logError('auth', 'Erro no cadastro:', { message: error.message, email: processedEmail });
        
        // Melhorar as mensagens de erro para o usuário
        let errorMessage = error.message;
        
        if (error.message.includes("already registered")) {
          errorMessage = "Este email já está registrado. Tente fazer login ou recuperar sua senha.";
        } else if (error.message.includes("invalid") && error.message.includes("email")) {
          // Tentar com outro formato de email conhecido como válido para o Supabase
          debug('auth', 'Tentando um formato alternativo de email para o Supabase');
          
          // Sugestão: tente usar um email com domínio mais comum
          toast.error("O formato deste email não é aceito. Tente usar um email mais comum como gmail.com ou outlook.com");
          
          // Log detalhado para ajudar na depuração
          // Salvar o erro em uma variável para inspeção no console
          const errorDetails = { error, email: processedEmail };
          console.error("Erro detalhado do Supabase:", errorDetails);
          
          // Expor para debugging no console
          try {
            // @ts-ignore - Adicionando propriedade para debug
            window.supabaseLastError = errorDetails;
          } catch (e) {}
        }
        
        toast.error(errorMessage);
        setLoading(false);
        setActionInProgress(false);
        return { success: false, error };
      }
      
      // Verificar se a confirmação de email é necessária
      const requiresEmailConfirmation = !data.user?.confirmed_at;
      
      debug('auth', `Cadastro bem-sucedido, email confirmation: ${requiresEmailConfirmation}`);
      
      // Em ambiente de desenvolvimento, permitir login imediato
      if (requiresEmailConfirmation && process.env.NODE_ENV !== 'production') {
        debug('auth', 'Ambiente de desenvolvimento detectado - exibindo mensagem especial');
        toast.info(
          "Para ambiente de desenvolvimento: O usuário foi criado com sucesso, mas o email precisa ser confirmado. Configure o Supabase para desativar a confirmação ou use a função supabaseHelper.confirmUserEmail.", 
          { duration: 10000 }
        );
      }
      
      // Enviar dados para o webhook do N8N após cadastro bem-sucedido
      if (data.user) {
        // Extrair os dados do usuário para enviar ao N8N
        const webhookPayload = {
          email: email,
          name: userData.full_name || userData.name || email.split('@')[0],
          userId: data.user.id,
          createdAt: new Date().toISOString(),
          phone: userData.phone || '',
          metadata: userData
        };
        
        // Enviar para o webhook de forma assíncrona (não bloqueia o login)
        sendUserRegistrationWebhook(webhookPayload)
          .then(success => {
            if (success) {
              console.log('Dados enviados com sucesso para o N8N');
            } else {
              console.warn('Falha ao enviar dados para o N8N, mas o usuário foi criado normalmente');
            }
          })
          .catch(err => console.error('Erro ao enviar para webhook:', err));
      }
      
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
