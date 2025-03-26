import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/auth";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, MapPin, AtSign, Calendar, Globe, Settings, LogOut } from "lucide-react";

const Profile = () => {
  const { user, profile, updateProfile, signOut } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [devMode, setDevMode] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    full_name: "",
    headline: "",
    bio: "",
    location: "",
    avatar_url: "",
    language: "Português"
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    const savedBypass = localStorage.getItem('dev_bypass_auth');
    if (savedBypass === 'true') {
      console.log("Modo de desenvolvimento ativado para o perfil");
      setDevMode(true);
      
      setFormData({
        username: "usuario_teste",
        full_name: "Usuário de Teste",
        headline: "Perfil de teste para desenvolvimento",
        bio: "Este é um perfil simulado criado para contornar problemas de autenticação durante o desenvolvimento.",
        location: "Brasil",
        avatar_url: "",
        language: "Português"
      });
    }
  }, []);

  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username || "",
        full_name: profile.full_name || "",
        headline: profile.headline || "",
        bio: profile.bio || "",
        location: profile.location || "",
        avatar_url: profile.avatar_url || "",
        language: profile.language || "Português"
      });
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      let avatarUrl = formData.avatar_url;

      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `${user.id}/${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('profile_avatars')
          .upload(filePath, avatarFile);
          
        if (uploadError) {
          throw uploadError;
        }
        
        const { data: urlData } = supabase.storage
          .from('profile_avatars')
          .getPublicUrl(filePath);
          
        avatarUrl = urlData.publicUrl;
      }

      await updateProfile({
        ...formData,
        avatar_url: avatarUrl
      });
      
      setIsEditing(false);
      toast.success("Perfil atualizado com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao atualizar perfil: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      {(!user && !devMode) ? (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Você precisa estar logado para ver esta página.</h2>
            <Button asChild className="bg-orange-500 hover:bg-orange-600">
              <a href="/auth">Login</a>
            </Button>
            
            <div className="mt-8">
              <Button 
                variant="outline" 
                className="text-red-500 border-red-500 hover:bg-red-50"
                onClick={() => {
                  localStorage.setItem('dev_bypass_auth', 'true');
                  setDevMode(true);
                  setFormData({
                    username: "usuario_teste",
                    full_name: "Usuário de Teste",
                    headline: "Perfil de teste para desenvolvimento",
                    bio: "Este é um perfil simulado criado para contornar problemas de autenticação durante o desenvolvimento.",
                    location: "Brasil",
                    avatar_url: "",
                    language: "Português"
                  });
                  toast.success("Modo de desenvolvimento ativado!");
                }}
              >
                Ativar modo de desenvolvimento
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {devMode && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
              <div className="flex items-center">
                <div className="py-1">
                  <svg className="h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold">Modo de desenvolvimento ativado</p>
                  <p className="text-sm">Você está visualizando um perfil simulado para desenvolvimento.</p>
                  <button 
                    className="text-sm underline mt-1"
                    onClick={() => {
                      localStorage.removeItem('dev_bypass_auth');
                      setDevMode(false);
                      window.location.reload();
                    }}
                  >
                    Desativar modo de desenvolvimento
                  </button>
                </div>
              </div>
            </div>
          )}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            {/* Header/Cover */}
            <div className="h-48 bg-gradient-to-r from-brand-600 to-brand-400 relative">
              <div className="absolute -bottom-16 left-8 flex items-end gap-4">
                <Avatar className="w-32 h-32 border-4 border-white dark:border-gray-800 bg-white dark:bg-gray-800">
                  <AvatarImage 
                    src={formData.avatar_url || 'https://via.placeholder.com/150'} 
                    alt={formData.full_name || 'User'} 
                  />
                  <AvatarFallback>
                    {formData.full_name?.substring(0, 2).toUpperCase() || 'UT'}
                  </AvatarFallback>
                </Avatar>
                <div className="mb-4 text-white">
                  <h1 className="text-2xl font-bold">{formData.full_name || formData.username}</h1>
                  <p>{formData.headline || 'No headline'}</p>
                </div>
              </div>
              
              <div className="absolute right-4 bottom-4 flex gap-2">
                <Sheet open={isEditing} onOpenChange={setIsEditing}>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600">
                      <Settings className="h-4 w-4 mr-2" />
                      Editar Perfil
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-white dark:bg-gray-800">
                    <SheetHeader>
                      <SheetTitle className="dark:text-white">Editar Perfil</SheetTitle>
                      <SheetDescription className="dark:text-gray-300">
                        Faça alterações no seu perfil aqui. Clique em salvar quando terminar.
                      </SheetDescription>
                    </SheetHeader>
                    
                    <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                      <div className="flex flex-col items-center gap-4">
                        <Avatar className="w-24 h-24 border-2 border-brand-200 dark:border-gray-700">
                          <AvatarImage 
                            src={avatarPreview || formData.avatar_url || 'https://via.placeholder.com/150'} 
                            alt={formData.full_name || 'User'} 
                          />
                          <AvatarFallback>
                            {formData.full_name?.substring(0, 2).toUpperCase() || 'UT'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="relative">
                          <input
                            type="file"
                            id="avatar"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarChange}
                          />
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => document.getElementById('avatar')?.click()}
                            className="dark:text-white dark:border-gray-600"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Alterar foto
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="full_name" className="dark:text-white">Nome completo</Label>
                            <Input
                              id="full_name"
                              name="full_name"
                              value={formData.full_name}
                              onChange={handleChange}
                              placeholder="Seu nome completo"
                              className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="username" className="dark:text-white">Nome de usuário</Label>
                            <Input
                              id="username"
                              name="username"
                              value={formData.username}
                              onChange={handleChange}
                              placeholder="Seu username"
                              className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="headline" className="dark:text-white">Título profissional</Label>
                          <Input
                            id="headline"
                            name="headline"
                            value={formData.headline}
                            onChange={handleChange}
                            placeholder="Ex: Desenvolvedor Full Stack"
                            className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="bio" className="dark:text-white">Biografia</Label>
                          <Textarea
                            id="bio"
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            placeholder="Conte um pouco sobre você"
                            rows={4}
                            className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="location" className="dark:text-white">Localização</Label>
                          <Input
                            id="location"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            placeholder="Ex: São Paulo, Brasil"
                            className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="language" className="dark:text-white">Idioma</Label>
                          <Input
                            id="language"
                            name="language"
                            value={formData.language}
                            onChange={handleChange}
                            placeholder="Ex: Português"
                            className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end gap-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsEditing(false)}
                          className="dark:text-white dark:border-gray-600"
                        >
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                          {loading ? "Salvando..." : "Salvar alterações"}
                        </Button>
                      </div>
                    </form>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
            
            {/* Content */}
            <div className="mt-20 p-8">
              <Tabs defaultValue="profile">
                <TabsList className="mb-8">
                  <TabsTrigger value="profile">Perfil</TabsTrigger>
                  <TabsTrigger value="notifications">Notificações</TabsTrigger>
                </TabsList>
                
                <TabsContent value="profile" className="space-y-8">
                  {/* Bio section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium dark:text-white">Sobre</h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {formData.bio || "Este usuário ainda não adicionou uma biografia."}
                    </p>
                  </div>
                  
                  {/* Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium dark:text-white">Detalhes</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {formData.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-gray-400" />
                          <span className="dark:text-gray-300">{formData.location}</span>
                        </div>
                      )}
                      
                      {formData.username && (
                        <div className="flex items-center gap-2">
                          <AtSign className="h-5 w-5 text-gray-400" />
                          <span className="dark:text-gray-300">@{formData.username}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-gray-400" />
                        <span className="dark:text-gray-300">Entrou em {new Date().toLocaleDateString()}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Globe className="h-5 w-5 text-gray-400" />
                        <span className="dark:text-gray-300">{formData.language}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Add Logout button to profile page for easier access */}
                  <div className="pt-6 border-t dark:border-gray-700">
                    <Button 
                      variant="destructive" 
                      onClick={() => signOut()}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sair da conta
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="notifications" className="dark:text-white">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Suas notificações</h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Gerencie suas preferências de notificações e veja notificações recentes.
                    </p>
                    
                    {/* Notification preferences - placeholder for now */}
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground dark:text-gray-300">
                        Esta área será implementada em breve.
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default Profile;
