import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth";
import { Avatar, AvatarFallback } from "@/components/ui/Avatar";
import { Search, Menu, X, LogOut, User, MessageSquare, Bell, Shield, Moon, Sun } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import NotificationsDropdown from "@/components/notifications/NotificationsDropdown";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const Navbar = () => {
  const {
    user,
    profile,
    signOut
  } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [darkMode, setDarkMode] = useState(localStorage.getItem("darkMode") === "true");

  // CORREÇÃO: Verificação de admin simplificada por email
  const isAdmin = user?.email === 'vsugamele@gmail.com';
  
  // Initialize dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", darkMode.toString());
  }, [darkMode]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Searching for:", searchQuery);
  };
  
  const handleLogout = async () => {
    try {
      console.log("Attempting logout");
      
      // Salvar o perfil atual antes de fazer logout
      if (profile) {
        localStorage.setItem('last_user_profile', JSON.stringify(profile));
      }
      
      const result = await signOut();
      
      if (result.success) {
        toast.success("Você foi desconectado com sucesso");
        navigate("/auth", { replace: true });
      } else {
        toast.error("Erro ao sair. Tente novamente.");
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Erro ao sair, mas você será redirecionado");
      navigate("/auth", { replace: true });
    } finally {
      setMobileMenuOpen(false);
    }
  };
  
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };
  
  const navLinks = [{
    name: "Início",
    path: "/"
  }, {
    name: "Explorar",
    path: "/explore"
  }, {
    name: "Mensagens",
    path: "/messages"
  }];
  
  return <header className="sticky top-0 z-40 w-full border-b bg-background shadow-sm hidden md:block">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <Link to="/" className="flex items-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#ff4400] mr-2">
              <img alt="Logo Clube das Brabas" className="w-8 h-8 object-contain" src="/lovable-uploads/fe794e0a-f834-4651-8887-e813c0115ade.png" />
            </div>
            <span className="text-xl font-bold text-[#ff4400]">Clube das Brabas</span>
          </Link>
        </div>

        <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
          {navLinks.map(link => <Button key={link.path} variant="ghost" asChild className={location.pathname === link.path ? "font-medium text-[#ff4400]" : "text-muted-foreground hover:text-[#ff4400]/80"}>
              <Link to={link.path}>{link.name}</Link>
            </Button>)}
          
          {/* Admin panel link - only show if user is admin */}
          {isAdmin && <Button variant="ghost" asChild className={location.pathname === "/admin" ? "font-medium text-[#ff4400]" : "text-muted-foreground hover:text-[#ff4400]/80"}>
              <Link to="/admin">
                <Shield className="mr-1 h-4 w-4 text-[#ff4400]" />
                Admin
              </Link>
            </Button>}
        </div>

        <div className="hidden md:flex flex-1 items-center justify-center px-2">
          <form onSubmit={handleSearch} className="w-full max-w-sm relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Pesquisar..." className="w-full bg-muted pl-8 border-[#ff920e]/20 focus-visible:ring-[#ff4400]" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </form>
        </div>

        <div className="flex md:hidden flex-1 justify-end">
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>

        <div className="hidden md:flex items-center space-x-3">
          {/* Dark mode toggle */}
          <div className="flex items-center space-x-2">
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
            <Moon className="h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </div>
          
          {user ? <>
              <NotificationsDropdown />
              
              <Button asChild variant="ghost" size="icon">
                <Link to="/messages">
                  <MessageSquare className="h-5 w-5 text-[#006bf7]" />
                </Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8 border-2 border-[#ff4400]/20">
                      {profile?.avatar_url ? (
                        <img 
                          src={profile.avatar_url} 
                          alt={profile?.full_name || 'User profile'} 
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        <AvatarFallback className="bg-[#ff920e]/20 text-[#ff4400]">
                          {profile?.full_name?.substring(0, 2).toUpperCase() || user.email?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="border-[#ff920e]/20">
                  <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={user ? `/profile/${user.id}` : "/profile"} className="cursor-pointer">
                      <User className="mr-2 h-4 w-4 text-[#ff4400]" />
                      <span>Perfil</span>
                    </Link>
                  </DropdownMenuItem>
                  
                  {/* Admin panel link in dropdown - only show if user is admin */}
                  {isAdmin && <DropdownMenuItem asChild>
                      <Link to="/admin" className="cursor-pointer">
                        <Shield className="mr-2 h-4 w-4 text-[#ff4400]" />
                        <span>Painel Admin</span>
                      </Link>
                    </DropdownMenuItem>}
                  
                  <DropdownMenuItem onClick={handleLogout} className="text-[#ff4400] cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </> : <Button asChild className="bg-[#ff4400] hover:bg-[#ff4400]/90 text-white">
              <Link to="/auth">Entrar</Link>
            </Button>}
        </div>
      </div>

      {mobileMenuOpen && <div className="md:hidden border-t p-4 space-y-4 bg-white dark:bg-background shadow-md">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Pesquisar..." className="w-full bg-muted pl-8 border-[#ff920e]/20 focus-visible:ring-[#ff4400]" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </form>
          
          <div className="space-y-1">
            {/* Dark mode toggle in mobile menu */}
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium">Modo escuro</span>
              <div className="flex items-center space-x-2">
                <Sun className="h-[1rem] w-[1rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
                <Moon className="h-[1rem] w-[1rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </div>
            </div>
            
            {navLinks.map(link => <Button key={link.path} variant="ghost" asChild className={`w-full justify-start ${location.pathname === link.path ? "font-medium text-[#ff4400]" : "text-muted-foreground hover:text-[#ff4400]/80"}`} onClick={() => setMobileMenuOpen(false)}>
                <Link to={link.path}>{link.name}</Link>
              </Button>)}
            
            {/* Admin panel link in mobile menu - only show if user is admin */}
            {isAdmin && <Button variant="ghost" asChild className={`w-full justify-start ${location.pathname === "/admin" ? "font-medium text-[#ff4400]" : "text-muted-foreground hover:text-[#ff4400]/80"}`} onClick={() => setMobileMenuOpen(false)}>
                <Link to="/admin">
                  <Shield className="mr-2 h-4 w-4 text-[#ff4400]" />
                  <span>Painel Admin</span>
                </Link>
              </Button>}
          </div>
          
          {user ? <div className="pt-2 border-t">
              <Button variant="ghost" asChild className="w-full justify-start" onClick={() => setMobileMenuOpen(false)}>
                <Link to={user ? `/profile/${user.id}` : "/profile"}>
                  <User className="mr-2 h-4 w-4 text-[#ff4400]" />
                  <span>Perfil</span>
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start text-[#ff4400]" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </Button>
            </div> : <Button asChild className="w-full bg-[#ff4400] hover:bg-[#ff4400]/90 text-white">
              <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                Entrar
              </Link>
            </Button>}
        </div>}
    </header>;
};
export default Navbar;
