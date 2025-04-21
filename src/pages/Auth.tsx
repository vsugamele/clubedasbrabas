import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { sendUserRegistrationWebhook } from "@/services/webhookService";

// Componente Auth com funcionalidade real de autenticação
const Auth = () => {
  // Estados para os formulários
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [activeTab, setActiveTab] = useState("login");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  // Função real de login usando Supabase
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Tentativa de login com:", email);
    
    if (!email || !password) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }
    
    setLoading(true);
    
    try {
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
    <div className="flex min-h-screen items-center justify-center bg-orange-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-[#ff4400] p-2.5">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-[#ff4400] rounded-full"></div>
              </div>
            </div>
          </div>
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-bold text-[#ff4400]">Clube das Brabas</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Entre para se conectar com outros profissionais
            </p>
          </div>
        </div>

        <Card className="border-[#ff920e]/20">
          <CardHeader>
            <CardTitle>Bem-vindo(a)</CardTitle>
            <CardDescription>
              Entre na sua conta ou crie uma nova para acessar a plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-orange-100">
                <TabsTrigger value="login" className="data-[state=active]:bg-[#ff4400] data-[state=active]:text-white">Entrar</TabsTrigger>
                <TabsTrigger value="register" className="data-[state=active]:bg-[#ff4400] data-[state=active]:text-white">Criar conta</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-[#ff4400] hover:bg-[#ff4400]/90"
                    disabled={loading}
                  >
                    {loading ? "Entrando..." : "Entrar"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome completo</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Seu nome"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-register">Email</Label>
                    <Input
                      id="email-register"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-register">Senha</Label>
                    <Input
                      id="password-register"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-[#ff4400] hover:bg-[#ff4400]/90"
                    disabled={loading}
                  >
                    {loading ? "Criando conta..." : "Criar conta"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              Ao continuar, você concorda com nossos 
              <Button variant="link" className="px-1 text-xs text-[#006bf7]">Termos de Serviço</Button>
              e
              <Button variant="link" className="px-1 text-xs text-[#006bf7]">Política de Privacidade</Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
