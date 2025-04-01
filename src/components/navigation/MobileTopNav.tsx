import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, MessageCircle, User, Moon, Sun, LogOut, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/Avatar';
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
import { isAdminByEmail } from '@/utils/adminUtils';

const MobileTopNav = () => {
  const location = useLocation();
  const { user, profile, signOut } = useAuth();
  const [darkMode, setDarkMode] = React.useState(localStorage.getItem("darkMode") === "true");
  
  // Verificar se o usuário é administrador
  const isAdmin = isAdminByEmail(user?.email);
  
  const handleLogout = async () => {
    try {
      console.log("Attempting logout");
      const result = await signOut();
      
      if (result.success) {
        toast.success("Você foi desconectado com sucesso");
        window.location.href = "/auth";
      } else {
        toast.error("Erro ao sair. Tente novamente.");
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Erro ao sair, mas você será redirecionado");
      window.location.href = "/auth";
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
  
  return (
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
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={profile?.full_name || 'User'} 
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <AvatarFallback className="bg-[#ff920e]/20 text-[#ff4400]">
                  {profile?.full_name ? getInitials(profile.full_name) : "U"}
                </AvatarFallback>
              )}
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem asChild>
            <Link to={user ? `/profile/${user.id}` : "/profile"} className="flex items-center cursor-pointer">
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
          
          {/* Mostrar opção de Admin apenas para administradores */}
          {isAdmin && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/admin" className="flex items-center cursor-pointer text-brand-600">
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  <span>Admin</span>
                </Link>
              </DropdownMenuItem>
            </>
          )}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem className="text-red-600 cursor-pointer" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sair</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default MobileTopNav;
