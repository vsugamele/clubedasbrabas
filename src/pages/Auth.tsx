import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Auth = () => {
  // Usar o hook useAuth para obter o usuário e a função de carregamento
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [activeTab, setActiveTab] = useState("login");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
    name?: string;
  }>({});
  const [localLoading, setLocalLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("Auth page rendered, activeTab:", activeTab, "user:", !!user, "authLoading:", authLoading);
    
    // Adicionar um pequeno atraso para garantir que o redirecionamento ocorra após a autenticação completa
    let redirectTimeout: NodeJS.Timeout;
    
    if (user && !formSubmitting) {
      console.log("User is logged in, redirecting to home with delay");
      redirectTimeout = setTimeout(() => {
        console.log("Executing delayed redirect");
        navigate("/", { replace: true });
      }, 1500); // Atraso de 1.5 segundos para garantir que tudo seja carregado
    }
    
    return () => {
      // Limpar o timeout se o componente for desmontado
      if (redirectTimeout) {
        clearTimeout(redirectTimeout);
      }
    };
  }, [user, navigate, activeTab, authLoading, formSubmitting]);

  const validateForm = (isSignUp = false): boolean => {
    const errors: {
      email?: string;
      password?: string;
      name?: string;
    } = {};
    
    if (!email.trim()) {
      errors.email = "Email é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Email inválido";
    }
    
    if (!password) {
      errors.password = "Senha é obrigatória";
    } else if (password.length < 6) {
      errors.password = "Senha deve ter pelo menos 6 caracteres";
    }
    
    if (isSignUp && !name.trim()) {
      errors.name = "Nome é obrigatório";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Attempting to sign in with:", email);
    
    // Verificar se o formulário já está sendo enviado
    if (formSubmitting) {
      console.log("Form already submitting, ignoring request");
      return;
    }
    
    // Validar o formulário
    if (!validateForm()) {
      console.log("Form validation failed");
      return;
    }
    
    try {
      // Atualizar estado para indicar que o formulário está sendo enviado
      setFormSubmitting(true);
      setLocalLoading(true);
      
      console.log("Calling Supabase directly for authentication...");
      
      // Usar diretamente o cliente Supabase em vez do hook de autenticação
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error("Login error:", error.message);
        
        // Melhorar as mensagens de erro para o usuário
        let errorMessage = error.message;
        
        if (error.message.includes("Invalid login credentials")) {
          errorMessage = "Credenciais inválidas. Verifique seu email e senha.";
        } else if (error.message.includes("Email not confirmed")) {
          errorMessage = "É necessário confirmar seu email antes de fazer login.";
        }
        
        toast.error(errorMessage, { duration: 6000 });
        setFormSubmitting(false);
        setLocalLoading(false);
        return;
      }
      
      // Verificar se a sessão foi realmente estabelecida
      if (!data.session || !data.user) {
        console.error("Login failed: No session or user returned");
        toast.error("Falha ao estabelecer sessão. Tente novamente.");
        setFormSubmitting(false);
        setLocalLoading(false);
        return;
      }
      
      console.log("Login successful, redirecting to home page");
      toast.success("Login bem-sucedido!");
      
      // Forçar uma atualização da sessão para garantir que o estado de autenticação seja atualizado
      try {
        // Armazenar explicitamente os dados da sessão no localStorage para garantir persistência
        localStorage.setItem('supabase.auth.token', JSON.stringify({
          currentSession: data.session,
          expiresAt: Math.floor(Date.now() / 1000) + 3600
        }));
        
        console.log("Session data stored in localStorage");
        
        // Forçar um refresh da sessão
        await supabase.auth.refreshSession();
        
        // Aguardar um pouco mais antes de redirecionar
        setTimeout(() => {
          console.log("Redirecting to home page after delay");
          window.location.href = "/"; // Usar redirecionamento direto em vez do navigate
        }, 1000);
      } catch (refreshError) {
        console.error("Error refreshing session:", refreshError);
        // Mesmo com erro, tentar redirecionar
        setTimeout(() => {
          window.location.href = "/";
        }, 1000);
      }
      
    } catch (error) {
      console.error("Error during sign in:", error);
      toast.error("Ocorreu um erro ao tentar fazer login. Tente novamente.");
      
      // Resetar o estado do formulário em caso de erro
      setFormSubmitting(false);
      setLocalLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Attempting to sign up with:", email);
    if (formSubmitting) return; // Prevent double submission
    
    if (!validateForm(true)) {
      return;
    }
    
    setFormSubmitting(true);
    setLocalLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name
          }
        }
      });
      
      if (error) {
        console.error("Sign up error:", error.message);
        toast.error("Ocorreu um erro ao tentar criar sua conta");
        setFormSubmitting(false);
        setLocalLoading(false);
        return;
      }
      
      if (data.user) {
        setActiveTab("login");
        setPassword("");
        
        if (data.session) {
          navigate("/", { replace: true });
        } else {
          toast.success(
            `Cadastro realizado com sucesso! Verifique o email ${email} para confirmar sua conta antes de fazer login.`, 
            { duration: 8000 }
          );
        }
      }
    } catch (error) {
      console.error("Error during sign up:", error);
      toast.error("Ocorreu um erro ao tentar criar sua conta");
    } finally {
      setFormSubmitting(false);
      setLocalLoading(false);
    }
  };

  const componentLoading = localLoading;
  
  if (componentLoading) {
    console.log("Auth page showing loading skeleton");
    return (
      <div className="flex min-h-screen items-center justify-center bg-orange-50 px-4">
        <div className="w-full max-w-md">
          <Card className="border-[#ff920e]/20">
            <CardHeader>
              <Skeleton className="h-8 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-[#ff4400]">Clube das Brabas</h1>
          <p className="text-slate-700 mt-2">Conecte-se com outros lançadores e cresça sua rede</p>
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
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (validationErrors.email) {
                          setValidationErrors({ ...validationErrors, email: undefined });
                        }
                      }}
                      required
                      className={`border-[#ff920e]/30 focus-visible:ring-[#ff4400] ${validationErrors.email ? "border-red-500" : ""}`}
                      disabled={formSubmitting}
                    />
                    {validationErrors.email && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.email}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Senha</Label>
                      <Button variant="link" size="sm" className="px-0 text-xs text-[#006bf7]">
                        Esqueceu a senha?
                      </Button>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (validationErrors.password) {
                          setValidationErrors({ ...validationErrors, password: undefined });
                        }
                      }}
                      required
                      className={`border-[#ff920e]/30 focus-visible:ring-[#ff4400] ${validationErrors.password ? "border-red-500" : ""}`}
                      disabled={formSubmitting}
                    />
                    {validationErrors.password && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.password}</p>
                    )}
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-[#ff4400] hover:bg-[#ff4400]/90" 
                    disabled={formSubmitting}
                  >
                    {formSubmitting ? "Entrando..." : "Entrar"}
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
                      onChange={(e) => {
                        setName(e.target.value);
                        if (validationErrors.name) {
                          setValidationErrors({ ...validationErrors, name: undefined });
                        }
                      }}
                      required
                      className={`border-[#ff920e]/30 focus-visible:ring-[#ff4400] ${validationErrors.name ? "border-red-500" : ""}`}
                      disabled={formSubmitting}
                    />
                    {validationErrors.name && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.name}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-register">Email</Label>
                    <Input
                      id="email-register"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (validationErrors.email) {
                          setValidationErrors({ ...validationErrors, email: undefined });
                        }
                      }}
                      required
                      className={`border-[#ff920e]/30 focus-visible:ring-[#ff4400] ${validationErrors.email ? "border-red-500" : ""}`}
                      disabled={formSubmitting}
                    />
                    {validationErrors.email && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.email}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-register">Senha</Label>
                    <Input
                      id="password-register"
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (validationErrors.password) {
                          setValidationErrors({ ...validationErrors, password: undefined });
                        }
                      }}
                      required
                      className={`border-[#ff920e]/30 focus-visible:ring-[#ff4400] ${validationErrors.password ? "border-red-500" : ""}`}
                      disabled={formSubmitting}
                    />
                    {validationErrors.password && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.password}</p>
                    )}
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-[#ff4400] hover:bg-[#ff4400]/90" 
                    disabled={formSubmitting}
                  >
                    {formSubmitting ? "Criando conta..." : "Criar conta"}
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
