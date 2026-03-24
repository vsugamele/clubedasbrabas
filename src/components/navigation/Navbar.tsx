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
import { UserNotifications } from "@/components/UserNotifications";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

// Default links as fallback
const defaultNavLinks = [
  { name: "Início", path: "/" },
  { name: "Explorar", path: "/search" },
  { name: "Trilhas", path: "/trilhas" },
  { name: "Links", path: "/links" }
];

interface NavLink {
  name: string;
  path: string;
}

interface NavbarProps {
  onMenuClick?: () => void;
}

const Navbar = ({ onMenuClick }: NavbarProps) => {
  const {
    user,
    profile,
    signOut
  } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(localStorage.getItem("darkMode") === "true");
  const [navLinks, setNavLinks] = useState<NavLink[]>(defaultNavLinks);

  const isAdmin = user?.email === 'vsugamele@gmail.com';

  useEffect(() => {
    const fetchNavLinks = async () => {
      try {
        const { data, error } = await (supabase as any)
          .from("c_navbar_links")
          .select("name, path")
          .eq("enabled", true)
          .order("order_index", { ascending: true });

        if (error) {
          console.error("Error fetching navbar links:", error);
          return;
        }

        if (data && data.length > 0) {
          setNavLinks(data as NavLink[]);
        }
      } catch (error) {
        console.error("Error fetching navbar links:", error);
      }
    };

    fetchNavLinks();
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", darkMode.toString());
  }, [darkMode]);

  const handleLogout = async () => {
    try {
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
      if (onMenuClick) onMenuClick();
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return <header className="sticky top-0 z-30 w-full bg-background border-b border-border/40 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div className="flex h-16 items-center px-4 md:px-8">
      
      {/* Mobile Menu Button - Left */}
      <div className="flex md:hidden flex-1 justify-start">
        <Button variant="ghost" size="icon" onClick={() => {
          if (onMenuClick) onMenuClick();
        }}>
          <Menu className="h-5 w-5 hover:text-primary transition-colors" />
        </Button>
      </div>

      {/* Centered Desktop Navigation */}
      <div className="hidden md:flex flex-1 items-center justify-center space-x-8">
        {navLinks.map(link => (
          <Link 
            key={link.path} 
            to={link.path}
            className={cn(
              "text-sm font-semibold tracking-wide transition-colors uppercase", 
              location.pathname === link.path 
                ? "text-primary" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {link.name}
          </Link>
        ))}

        {isAdmin && (
          <Link 
            to="/admin"
            className={cn(
              "flex items-center text-sm font-semibold tracking-wide transition-colors uppercase", 
              location.pathname === "/admin" 
                ? "text-primary" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Shield className="mr-1 h-4 w-4" />
            Admin
          </Link>
        )}
      </div>

      {/* Right User Actions */}
      <div className="flex flex-1 md:flex-none justify-end items-center space-x-4">
        <div className="hidden sm:flex items-center space-x-2">
          <Sun className="h-4 w-4 text-muted-foreground" />
          <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
          <Moon className="h-4 w-4 text-muted-foreground" />
        </div>

        {user ? <>
          <NotificationsDropdown />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full w-9 h-9 border border-border/50">
                <Avatar className="h-full w-full">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile?.full_name || 'User profile'}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <AvatarFallback className="bg-muted text-primary">
                      {profile?.full_name?.substring(0, 2).toUpperCase() || user.email?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-popover border-border">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{profile?.full_name || 'Usuário'}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to={user ? `/profile/${user.id}` : "/profile"} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </Link>
              </DropdownMenuItem>

              {isAdmin && <DropdownMenuItem asChild>
                <Link to="/admin" className="cursor-pointer">
                  <Shield className="mr-2 h-4 w-4 text-primary" />
                  <span>Painel Admin</span>
                </Link>
              </DropdownMenuItem>}

              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-500 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </> : <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold uppercase py-1 px-4 h-8">
          <Link to="/auth">Entrar</Link>
        </Button>}
      </div>
    </div>
  </header>;
};
export default Navbar;
