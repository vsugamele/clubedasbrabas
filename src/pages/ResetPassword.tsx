import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { sendPasswordResetConfirmationWebhook } from "@/services/webhookService";

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
<<<<<<< HEAD

=======
  
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
  // Estados para o formulário
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifyingToken, setVerifyingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
<<<<<<< HEAD

  // Obter email e nome dos parâmetros da URL (opcional, pois Supabase lidará com a sessão)
  const email = searchParams.get("email");
  const userName = searchParams.get("name") || email?.split('@')[0] || "Usuário";

  // Verificar o token quando a página carregar (Supabase Auth lida com a URL hash/params)
  useEffect(() => {
    // 1. O Supabase pode colocar o erro no hash ou na query se o link expirar
    const hash = window.location.hash;
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(hash.substring(1));

    const errorParam = hashParams.get("error") || params.get("error");
    const errorDesc = hashParams.get("error_description") || params.get("error_description");

    if (errorParam) {
      toast.error(errorDesc || "Link de redefinição inválido ou expirado");
      setTokenValid(false);
      setVerifyingToken(false);
      return;
    }

    let authListenerUnsubscribe: () => void;

    // 2. Verificar Sessão Nativamente no Supabase
    const checkSession = async () => {
      try {
        setVerifyingToken(true);

        // Pega a sessão atual (o Supabase JS processa o token do hash da URL automaticamente)
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          console.log("Sessão válida encontrada");
          setTokenValid(true);
          setVerifyingToken(false);
          return;
        }

        // Se não tiver sessão imediatamente, escuta por mudanças pois o cliente pode estar processando
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
            console.log("Evento Auth recebido para recuperação:", event);
            setTokenValid(true);
            setVerifyingToken(false);
          }
        });

        if (authListener?.subscription) {
          authListenerUnsubscribe = () => authListener.subscription.unsubscribe();
        }

        // Fallback: Timeout para caso o usuário acesse a URL diretamente sem hash válido
        setTimeout(() => {
          setVerifyingToken(current => {
            if (current) {
              console.log("Timeout: Nenhuma sessão recuperada");
              setTokenValid(false);
              return false;
            }
            return current;
          });
        }, 3000);

      } catch (error) {
        console.error("Erro ao verificar sessão Supabase:", error);
        setTokenValid(false);
        setVerifyingToken(false);
      }
    };

    checkSession();

    return () => {
      if (authListenerUnsubscribe) authListenerUnsubscribe();
    };
  }, []);

=======
  
  // Obter token, email e nome (se disponível) dos parâmetros da URL
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const userName = searchParams.get("name") || email?.split('@')[0] || "";
  
  // Verificar o token quando a página carregar
  useEffect(() => {
    const verifyToken = async () => {
      if (!token || !email) {
        toast.error("Link de redefinição inválido ou expirado");
        setVerifyingToken(false);
        return;
      }
      
      try {
        setVerifyingToken(true);
        
        // Verificar se o token é válido
        console.log("Enviando verificação de token:", { token, email, user_name: userName });
        
        const response = await fetch("https://n8n-n8n.p6yhvh.easypanel.host/webhook/verify-reset-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ 
            token, 
            email,
            user_name: userName // Incluir nome do usuário para personalização
          })
        });
        
        console.log("Status da resposta:", response.status);
        
        // Capturar o texto bruto da resposta primeiro para debug
        const responseText = await response.text();
        console.log("Resposta bruta:", responseText);
        
        // Tentar converter para JSON
        let data;
        try {
          data = JSON.parse(responseText);
          console.log("Dados parseados:", data);
        } catch (e) {
          console.error("Erro ao parsear resposta JSON:", e);
          toast.error("Erro ao processar resposta do servidor");
          setTokenValid(false);
          setVerifyingToken(false);
          return;
        }
        
        // Verificar se a resposta contém o campo valid
        console.log("Token válido?", data.valid);
        
        if (data.valid === true) { // Verificação estrita com ===
          console.log("Token foi validado com sucesso!");
          setTokenValid(true);
          toast.success("Token verificado. Você pode criar uma nova senha.");
        } else {
          console.log("Token inválido ou expirado:", data);
          toast.error("Link de redefinição inválido ou expirado");
          // Removendo o redirecionamento automático
          // Agora o usuário verá a mensagem de erro na página
          setTokenValid(false);
        }
      } catch (error) {
        console.error("Erro ao verificar token:", error);
        toast.error("Não foi possível verificar o token. Tente solicitar uma nova redefinição de senha.");
      } finally {
        setVerifyingToken(false);
      }
    };
    
    verifyToken();
  }, [token, email, navigate]);
  
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
  // Função para validar a força da senha
  const validatePassword = (password: string): boolean => {
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return false;
    }
    return true;
  };
<<<<<<< HEAD

  // Função para lidar com o envio do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

=======
  
  // Função para lidar com o envio do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token || !email) {
      toast.error("Link de redefinição inválido");
      return;
    }
    
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }
<<<<<<< HEAD

    if (!validatePassword(password)) {
      return;
    }

    setLoading(true);

    try {
      // 1. Atualizar a senha nativamente usando a API do Supabase (o usuário já está autenticado em background)
      const { data, error } = await supabase.auth.updateUser({ password });

      if (error) {
        throw error;
      }

      console.log("Senha atualizada no Supabase com sucesso");

      // 2. Notificar o webhook n8n conforme esperado, se aplicável
      try {
        await sendPasswordResetConfirmationWebhook({
          email: data.user?.email || email || "",
          userId: data.user?.id,
          confirmed_at: new Date().toISOString(),
          success: true,
          user_name: userName,
        });
      } catch (webhookErr) {
        console.warn("Aviso: Falha ao notificar N8N sobre a mudança de senha, mas a senha foi alterada.", webhookErr);
      }

      toast.success("Senha redefinida com sucesso!");
      navigate("/auth");
    } catch (error: any) {
      console.error("Erro ao processar redefinição nativa:", error);
      toast.error("Erro ao redefinir sua senha: " + (error.message || "Tente novamente mais tarde."));
=======
    
    if (!validatePassword(password)) {
      return;
    }
    
    setLoading(true);
    let resetSuccess = false;
    
    try {
      // Primeiro tenta usar o serviço interno para enviar a redefinição de senha
      const webhookPayload = {
        email,
        userId: undefined, // Será preenchido pelo webhook se disponível
        confirmed_at: new Date().toISOString(),
        success: true,
        user_name: userName,
        token,        // Adicionando o token para o webhook processar
        password      // Adicionando a senha para o webhook processar
      };
      
      // Tenta usar o serviço de webhook interno
      console.log("Enviando confirmação de redefinição via serviço interno");
      const webhookResponse = await sendPasswordResetConfirmationWebhook(webhookPayload);
      
      console.log("Resposta do serviço de webhook:", webhookResponse);
      
      // Verificar se o webhook interno retornou sucesso
      if (webhookResponse && webhookResponse.success) {
        resetSuccess = true;
        console.log("Redefinição processada com sucesso pelo serviço interno");
      } else {
        // Se o webhook interno falhar, tentar diretamente o endpoint do n8n como fallback
        console.log("Serviço interno falhou, tentando endpoint direto como fallback");
        
        const response = await fetch("https://n8n-n8n.p6yhvh.easypanel.host/webhook/reset-password-confirm", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ 
            token, 
            email, 
            password,
            user_name: userName, // Incluir o nome do usuário para personalização de emails
            app_version: "1.0.0",
            timestamp: new Date().toISOString()
          })
        });
        
        if (!response.ok) {
          try {
            const errorText = await response.text();
            console.error(`Erro HTTP ${response.status} ao enviar dados para webhook:`, errorText);
            throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
          } catch (err) {
            console.error("Erro ao processar resposta de erro:", err);
            throw err;
          }
        }
        
        const data = await response.json();
        
        if (data.success) {
          resetSuccess = true;
          console.log("Redefinição processada com sucesso pelo endpoint direto");
        } else {
          throw new Error(data.message || "Falha ao processar redefinição de senha");
        }
      }
      
      // Se chegou até aqui e resetSuccess é true, a redefinição foi bem-sucedida
      if (resetSuccess) {
        toast.success("Senha redefinida com sucesso!");
        navigate("/auth");
      } else {
        // Isto só deve acontecer se ambas as abordagens falharem mas não lançarem erro
        toast.error("Não foi possível redefinir sua senha. Tente novamente.");
      }
    } catch (error) {
      console.error("Erro ao processar redefinição:", error);
      toast.error("Erro ao processar sua solicitação: " + (error.message || "Tente novamente mais tarde."));
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
    } finally {
      setLoading(false);
    }
  };
<<<<<<< HEAD

=======
  
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
  // Renderização condicional com base no estado da verificação do token
  if (verifyingToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-orange-50 px-4 py-8 overflow-auto">
        <div className="w-full max-w-md space-y-4 text-center py-4">
          <LoadingSpinner />
          <p className="text-lg font-medium">Verificando seu link de redefinição de senha...</p>
        </div>
      </div>
    );
  }
<<<<<<< HEAD

=======
  
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
  // Se o token não for válido, mostrar mensagem de erro
  if (!tokenValid && !verifyingToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-orange-50 px-4 py-8 overflow-auto">
        <div className="w-full max-w-md space-y-4 text-center py-4">
          <div className="rounded-full bg-red-100 p-4 mx-auto w-16 h-16 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">Link Inválido ou Expirado</h1>
          <p className="text-gray-600">O link de redefinição de senha é inválido ou expirou. Por favor, solicite um novo link.</p>
<<<<<<< HEAD
          <Button
=======
          <Button 
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
            className="mt-4 bg-[#ff4400] hover:bg-[#ff4400]/90 w-full sm:w-auto"
            onClick={() => navigate("/auth")}
          >
            Voltar para Login
          </Button>
        </div>
      </div>
    );
  }
<<<<<<< HEAD

=======
  
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
  return (
    <div className="flex min-h-screen items-center justify-center bg-orange-50 px-4 py-8 overflow-auto">
      <div className="w-full max-w-md my-4">
        <Card className="border-0 shadow-xl">
          <CardHeader className="space-y-1 px-4 sm:px-6">
            <CardTitle className="text-xl sm:text-2xl font-bold text-center">Redefinir Senha</CardTitle>
            <CardDescription className="text-center">
              Crie uma nova senha para sua conta
            </CardDescription>
          </CardHeader>
<<<<<<< HEAD

=======
          
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
          <CardContent className="px-4 sm:px-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm sm:text-base">Nova senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua nova senha"
                  required
                  minLength={6}
                  className="py-2"
                />
              </div>
<<<<<<< HEAD

=======
              
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-sm sm:text-base">Confirme a nova senha</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Digite novamente sua nova senha"
                  required
                  className="py-2"
                />
              </div>
<<<<<<< HEAD

              <Button
                type="submit"
=======
              
              <Button 
                type="submit" 
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
                className="w-full bg-[#ff4400] hover:bg-[#ff4400]/90 py-2 mt-4"
                disabled={loading}
              >
                {loading ? "Processando..." : "Redefinir Senha"}
              </Button>
            </form>
          </CardContent>
<<<<<<< HEAD

          <CardFooter className="flex flex-col space-y-4 px-4 sm:px-6 pb-6">
            <div className="text-center text-sm text-muted-foreground w-full">
              Lembrou sua senha?{" "}
              <Button
                variant="link"
=======
          
          <CardFooter className="flex flex-col space-y-4 px-4 sm:px-6 pb-6">
            <div className="text-center text-sm text-muted-foreground w-full">
              Lembrou sua senha?{" "}
              <Button 
                variant="link" 
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
                className="px-0 text-[#ff4400]"
                onClick={() => navigate("/auth")}
              >
                Voltar para login
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
