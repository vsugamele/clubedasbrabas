
import { SidebarProvider } from "@/components/ui/sidebar";
import Navbar from "@/components/navigation/Navbar";
import Sidebar from "@/components/navigation/Sidebar";
import { ReactNode, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/auth";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { user, profile } = useAuth();
  
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

  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col w-full overflow-hidden bg-orange-50/30">
        <Navbar />
        <div className="flex flex-1 w-full">
          <Sidebar />
          <main className="flex-1 transition-opacity duration-300 ease-in-out opacity-100">
            <div className="container py-6 animate-slide-up">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default MainLayout;
