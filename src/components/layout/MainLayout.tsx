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
      <div className="min-h-screen flex w-full overflow-hidden bg-background">
        {/* Mobile Sidebar Overlay */}
        <div 
          className={cn(
            "fixed inset-0 z-50 bg-black/50 md:hidden transition-opacity duration-200",
            mobileSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          onClick={toggleMobileSidebar}
        />
        
        {/* Mobile Sidebar Container */}
        <div 
          className={cn(
            "fixed top-0 left-0 z-50 h-full w-[280px] bg-sidebar shadow-lg md:hidden transition-transform duration-300 ease-in-out transform flex flex-col border-r border-border",
            mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex justify-between items-center p-4 border-b border-border bg-sidebar">
            <h2 className="font-bold text-lg text-primary uppercase tracking-wider">Clube das Brabas</h2>
            <button onClick={toggleMobileSidebar} className="p-2 rounded-full hover:bg-muted text-muted-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="overflow-y-auto flex-1 bg-sidebar">
            <Sidebar isMobile={true} onClose={toggleMobileSidebar} />
          </div>
        </div>
        
        {/* Desktop Sidebar - Left Column */}
        <aside className="hidden md:flex w-64 lg:w-72 flex-col h-screen sticky top-0 border-r border-border bg-sidebar shadow-sm z-20">
          <div className="p-6 pb-2 border-b border-border/50">
            <h1 className="text-sm font-black text-primary uppercase tracking-widest mb-1">CLUBE DAS BRABAS</h1>
            <p className="text-[10px] text-muted-foreground tracking-widest uppercase font-semibold">Premium Education</p>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar py-4">
            <Sidebar />
          </div>
        </aside>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-background">
          <Navbar onMenuClick={toggleMobileSidebar} />
          
          <main className="flex-1 overflow-y-auto scroll-smooth">
            <div className="container py-6 pb-24 md:pb-8 animate-in fade-in duration-500">
              {children}
            </div>
          </main>
        </div>
        
        {/* Removed MobileNavbar to keep it cleaner, as the top nav does that job now. 
            If it's necessary for logic, we can keep it. */}
        <MobileNavbar />
      </div>
    </SidebarProvider>
  );
};

export default MainLayout;
