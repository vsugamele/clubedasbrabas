import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, User, Moon, Sun, LogOut, Bell, MessageCircle } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { useAuth } from '@/context/auth';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import Sidebar from './Sidebar';

const MobileTopNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toggleSidebar } = useSidebar();
  const { user, profile, signOut } = useAuth();
  const [darkMode, setDarkMode] = useState(localStorage.getItem("darkMode") === "true");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const handleLogout = async () => {
    try {
      console.log("Attempting logout");
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
    }
  };
  
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    
    if (newMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", newMode.toString());
  };
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  const closeSidebar = () => {
    setSidebarOpen(false);
  };
  
  return (
    <div className="sticky top-0 z-30 w-full bg-white border-b border-gray-200 md:hidden">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <button
                className="flex items-center justify-center mr-3"
              >
                <Menu className="h-5 w-5 text-gray-600" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 pt-4 w-[280px]">
              <Sidebar isMobile={true} onClose={closeSidebar} />
            </SheetContent>
          </Sheet>
          
          <div className="flex items-center">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#ff4400] mr-2">
              <img 
                alt="Logo Clube das Brabas" 
                className="w-6 h-6 object-contain" 
                src="/lovable-uploads/fe794e0a-f834-4651-8887-e813c0115ade.png" 
              />
            </div>
            <h1 className="text-lg font-bold text-[#ff4400]">Clube das Brabas</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Link to="/notifications" className="p-1">
            <Bell className="h-5 w-5 text-gray-600" />
          </Link>
          
          <Link to="/messages" className="p-1">
            <MessageCircle className="h-5 w-5 text-gray-600" />
          </Link>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || "User"} />
                  <AvatarFallback>
                    {profile?.full_name ? getInitials(profile.full_name) : "U"}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem asChild>
                <Link to="/profile" className="flex items-center cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuItem className="flex items-center justify-between cursor-pointer" onClick={toggleDarkMode}>
                <div className="flex items-center">
                  {darkMode ? (
                    <Moon className="mr-2 h-4 w-4" />
                  ) : (
                    <Sun className="mr-2 h-4 w-4" />
                  )}
                  <span>Modo Escuro</span>
                </div>
                <Switch checked={darkMode} />
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem className="text-red-600 cursor-pointer" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="flex items-center justify-between px-2 py-1 bg-gray-50">
        <div className="grid grid-cols-3 w-full">
          <Link 
            to="/" 
            className={cn(
              "flex flex-col items-center justify-center py-1 px-3 rounded-full text-sm font-medium",
              location.pathname === '/' 
                ? "bg-[#ff4400] text-white" 
                : "text-gray-600 hover:bg-gray-200"
            )}
          >
            Feed
          </Link>
          
          <Link 
            to="/search" 
            className={cn(
              "flex flex-col items-center justify-center py-1 px-3 rounded-full text-sm font-medium",
              location.pathname === '/search' 
                ? "bg-[#ff4400] text-white" 
                : "text-gray-600 hover:bg-gray-200"
            )}
          >
            Buscar
          </Link>
          
          <Link 
            to="/eventos" 
            className={cn(
              "flex flex-col items-center justify-center py-1 px-3 rounded-full text-sm font-medium",
              location.pathname.startsWith('/eventos') 
                ? "bg-[#ff4400] text-white" 
                : "text-gray-600 hover:bg-gray-200"
            )}
          >
            Eventos
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MobileTopNav;
