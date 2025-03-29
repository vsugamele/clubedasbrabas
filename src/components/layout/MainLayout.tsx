import { SidebarProvider } from "@/components/ui/sidebar";
import Navbar from "@/components/navigation/Navbar";
import Sidebar from "@/components/navigation/Sidebar";
import MobileNavbar from "@/components/navigation/MobileNavbar";
import MobileTopNav from "@/components/navigation/MobileTopNav";
import { ReactNode, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/auth";
import { X, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { user, profile } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Show welcome toast if not already shown in this session
    if (user && profile && !sessionStorage.getItem('welcomeShown')) {
      toast(`Bem-vindo ao Clube das Brabas, ${profile.full_name || user.email}!`, {
        description: "Conecte-se, compartilhe e aprenda com outros profissionais.",
        position: "bottom-right",
        style: { 
          backgroundColor: '#fff5f2', 
          border: '1px solid #ff4400',
          color: '#ff4400'
        },
      });
      sessionStorage.setItem('welcomeShown', 'true');
    }
  }, [user, profile]);

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
    // Impedir rolagem do body quando o sidebar estiver aberto
    if (!mobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col w-full overflow-hidden bg-orange-50/30">
        {/* Mobile Sidebar */}
        <div 
          className={cn(
            "fixed inset-0 z-50 bg-black/50 md:hidden transition-opacity duration-200",
            mobileSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          onClick={toggleMobileSidebar}
        />
        
        <div 
          className={cn(
            "fixed top-0 left-0 z-50 h-full w-[280px] bg-white shadow-lg md:hidden transition-transform duration-300 ease-in-out transform",
            mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="font-bold text-lg">Feed Principal</h2>
            <button onClick={toggleMobileSidebar} className="p-1 rounded-full hover:bg-gray-100">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="overflow-y-auto h-[calc(100%-60px)]">
            <Sidebar isMobile={true} onClose={toggleMobileSidebar} />
          </div>
        </div>
        
        <Navbar />
        <div className="sticky top-0 z-30 w-full bg-white border-b border-gray-200 md:hidden">
          <div className="flex items-center justify-between px-4 py-2">
            <div className="flex items-center">
              <button
                className="flex items-center justify-center mr-3"
                onClick={toggleMobileSidebar}
              >
                <Menu className="h-5 w-5 text-gray-600" />
              </button>
              
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
            
            <MobileTopNav />
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
        
        <div className="flex flex-1 w-full">
          <Sidebar />
          <main className="flex-1 transition-opacity duration-300 ease-in-out opacity-100">
            <div className="container py-6 pb-20 md:pb-6 animate-slide-up">
              {children}
            </div>
          </main>
        </div>
        <MobileNavbar />
      </div>
    </SidebarProvider>
  );
};

export default MainLayout;
