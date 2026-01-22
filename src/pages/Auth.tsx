import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { sendUserRegistrationWebhook, sendPasswordResetWebhook } from "@/services/webhookService";

// Componente Auth com funcionalidade real de autenticação
const Auth = () => {
  // Estados para os formulários
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [activeTab, setActiveTab] = useState("login");
  const [loading, setLoading] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const navigate = useNavigate();
  
  // Função para lidar com a solicitação de redefinição de senha
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail || !resetEmail.includes("@")) {
      toast.error("Por favor, informe um email válido");
      return;
    }
    
    setLoading(true);
    let resetSuccess = false;
    
    try {
      // Tentar obter o nome do usuário a partir do email
      let userName = "";
      
      try {
        // Buscar diretamente na tabela de perfis por um campo que possa conter o email
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('username, full_name, avatar_url')
          .or(`email.eq.${resetEmail},user_email.eq.${resetEmail}`)
          .maybeSingle();
        
        if (profileError) {
          console.warn("Erro ao buscar perfil:", profileError);
        } else if (profileData) {
          // Usar os campos que sabemos que existem
          userName = profileData.full_name || profileData.username || "";
          console.log("Nome do usuário encontrado:", userName);
        } else {
          // Se não encontrou pelo email diretamente, usar apenas a parte antes do @ do email
          userName = resetEmail.split('@')[0];
          console.log("Usando nome de usuário baseado no email:", userName);
        }
      } catch (error) {
        console.warn("Não foi possível obter o nome do usuário:", error);
        // Usar a parte local do email como nome de usuário (antes do @)
        userName = resetEmail.split('@')[0];
      }
      
      // Enviar solicitação para Supabase
      const { data, error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: window.location.origin + "/reset-password",
      });
      
      if (error) {
        // Verificar se o erro é apenas porque o email não está cadastrado
        if (error.message.includes("Email not found")) {
          console.warn("Email não encontrado na base de dados:", resetEmail);
          // Mesmo assim, mostramos uma mensagem genérica para evitar enumeração de usuários
          toast.success(`Se o email ${resetEmail} estiver cadastrado, você receberá as instruções para redefinição de senha.`, {
            duration: 8000
          });
          resetSuccess = true; // Considerar como sucesso para UX melhor
        } else {
          console.error("Erro ao solicitar redefinição de senha:", error.message);
          toast.error("Não foi possível enviar o email de redefinição. Tente novamente.");
          return;
        }
      } else {
        resetSuccess = true;
      }
      
      // Enviar dados para webhook do n8n, incluindo o nome do usuário
      // Sempre tentamos enviar para o webhook, independentemente do resultado no Supabase
      try {
        const webhookResponse = await sendPasswordResetWebhook({
          email: resetEmail,
          requested_at: new Date().toISOString(),
          user_name: userName, // Incluir nome do usuário no payload
          success: resetSuccess
        });
        
        console.log("Resposta do webhook de redefinição:", webhookResponse);
      } catch (webhookError) {
        console.error("Erro ao enviar para webhook de redefinição:", webhookError);
        // Não interrompemos o fluxo se o webhook falhar
      }
      
      // Se chegamos até aqui e tivemos sucesso ou o email não foi encontrado mas estamos dando
      // feedback positivo por segurança, exibimos a mensagem de sucesso
      if (resetSuccess) {
        toast.success(`Email de redefinição enviado para ${resetEmail}. Verifique sua caixa de entrada e também a pasta de spam.`, {
          duration: 10000
        });
        
        // Fechar o modal e limpar o campo
        setResetPasswordOpen(false);
        setResetEmail("");
      }
    } catch (error) {
      console.error("Erro no processo de redefinição:", error);
      toast.error("Ocorreu um erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Função de login usando Supabase com bypass para desenvolvimento
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Tentativa de login com:", email);
    
    if (!email || !password) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }
    
    setLoading(true);
    
    try {
      // Credenciais de desenvolvimento para bypass
      if (email === "admin@teste.com" && password === "admin123") {
        console.log("Usando credenciais de desenvolvimento para bypass");
        
        // Criar uma sessão simulada e armazenar no localStorage
        const fakeSession = {
          access_token: "fake-token-for-development",
          token_type: "bearer",
          expires_in: 3600,
          refresh_token: "fake-refresh-token",
          user: {
            id: "dev-user-id",
            email: "admin@teste.com",
            user_metadata: {
              full_name: "Administrador de Teste"
            },
            app_metadata: {
              provider: "email"
            },
            aud: "authenticated",
            role: "authenticated"
          }
        };
        
        // Armazenar no localStorage para simular sessão do Supabase
        localStorage.setItem('sb-auth-token', JSON.stringify({
          currentSession: fakeSession,
          expiresAt: Date.now() + 3600000
        }));
        
        // Simular evento de login
        window.dispatchEvent(new Event('supabase.auth.signin'));
        
        console.log("Login de desenvolvimento bem-sucedido!");
        toast.success("Login de desenvolvimento realizado com sucesso!");
        navigate("/", { replace: true });
        return;
      }
      
      // Login normal com Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error("Erro no login:", error.message);
        toast.error(error.message.includes("Invalid login") ? 
                   "Email ou senha incorretos" : 
                   "Erro ao fazer login. Tente novamente.");
        return;
      }
      
      if (data.session) {
        console.log("Login bem-sucedido!");
        toast.success("Login realizado com sucesso!");
        navigate("/", { replace: true });
      }
    } catch (error) {
      console.error("Erro no processo de login:", error);
      toast.error("Ocorreu um erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };
  
  // Função real de cadastro usando Supabase
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Tentativa de cadastro com:", name, email);
    
    if (!name || !email || !password) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }
    
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });
      
      if (error) {
        console.error("Erro no cadastro:", error.message);
        toast.error(error.message.includes("already registered") ? 
                   "Este email já está cadastrado" : 
                   "Erro ao criar conta. Tente novamente.");
        return;
      }
      
      // Enviar dados para webhook do n8n (opcional)
      try {
        if (data.user) {
          sendUserRegistrationWebhook({
            email,
            name,
            userId: data.user.id,
            createdAt: new Date().toISOString()
          });
        }
      } catch (webhookError) {
        console.error("Erro ao enviar para webhook:", webhookError);
      }
      
      if (data.session) {
        toast.success("Conta criada com sucesso!");
        navigate("/", { replace: true });
      } else {
        toast.success(`Cadastro realizado! Verifique o email ${email} para confirmar sua conta.`, { duration: 8000 });
        setActiveTab("login");
        setPassword("");
      }
    } catch (error) {
      console.error("Erro no processo de cadastro:", error);
      toast.error("Ocorreu um erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Interface de usuário simplificada
  return (
    <div className="flex min-h-screen items-center justify-center bg-orange-50 px-4 py-8 overflow-auto">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-[#ff4400] p-2.5">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-[#ff4400] rounded-full"></div>
              </div>
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#ff4400]">Clube das Brabas</h1>
          <p className="text-sm sm:text-base text-gray-600">Entre ou crie uma conta para acessar a plataforma</p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="px-4 sm:px-6 pt-4 pb-2 sm:pb-3">
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" className="text-sm sm:text-base py-1.5 sm:py-2">Entrar</TabsTrigger>
                <TabsTrigger value="register" className="text-sm sm:text-base py-1.5 sm:py-2">Criar conta</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
            <Tabs value={activeTab} className="w-full">
              <TabsContent value="login">
                <form onSubmit={handleSignIn} className="space-y-3 sm:space-y-4">
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="email" className="text-sm sm:text-base">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="py-2"
                    />
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="password" className="text-sm sm:text-base">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="py-2"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-[#ff4400] hover:bg-[#ff4400]/90 py-2 mt-2"
                    disabled={loading}
                  >
                    {loading ? "Verificando..." : "Entrar"}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="link"
                    className="w-full text-sm text-gray-500 hover:text-[#ff4400] p-0 h-auto"
                    onClick={() => setResetPasswordOpen(true)}
                  >
                    Esqueci minha senha
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleSignUp} className="space-y-3 sm:space-y-4">
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="name" className="text-sm sm:text-base">Nome completo</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Seu nome"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="py-2"
                    />
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="email-register" className="text-sm sm:text-base">Email</Label>
                    <Input
                      id="email-register"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="py-2"
                    />
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="password-register" className="text-sm sm:text-base">Senha</Label>
                    <Input
                      id="password-register"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="py-2"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-[#ff4400] hover:bg-[#ff4400]/90 py-2 mt-2"
                    disabled={loading}
                  >
                    {loading ? "Criando conta..." : "Criar conta"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2 sm:space-y-3 px-4 sm:px-6 pt-2 pb-4">
            <div className="text-center text-xs sm:text-sm text-muted-foreground">
              Ao continuar, você concorda com nossos 
              <Button variant="link" className="px-1 text-xs text-[#006bf7] h-auto">Termos de Serviço</Button>
              e
              <Button variant="link" className="px-1 text-xs text-[#006bf7] h-auto">Política de Privacidade</Button>
            </div>
          </CardFooter>
        </Card>
      </div>
      
      {/* Modal de Redefinição de Senha */}
      <Dialog open={resetPasswordOpen} onOpenChange={setResetPasswordOpen}>
        <DialogContent className="sm:max-w-[425px] p-4 sm:p-6 max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Recuperar senha</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm pt-1">
              Informe seu email para receber um link de redefinição de senha.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleResetPassword} className="space-y-4 py-2 sm:py-4">
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="reset-email" className="text-sm sm:text-base">Email</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="seu@email.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                className="py-2"
              />
            </div>
            
            <DialogFooter className="pt-2 sm:pt-4 flex flex-col sm:flex-row gap-2 sm:gap-0">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setResetPasswordOpen(false)}
                disabled={loading}
                className="order-2 sm:order-1 sm:mr-2 w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-[#ff4400] hover:bg-[#ff4400]/90 order-1 sm:order-2 w-full sm:w-auto"
                disabled={loading}
              >
                {loading ? "Enviando..." : "Enviar link"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;
