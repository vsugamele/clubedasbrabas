import React, { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminRole } from "./hooks/useAdminRole";
import useAdminPanel from "./hooks/useAdminPanel";
import UserManagement from "./UserManagement";
import Dashboard from "./dashboard/Dashboard";
import AdminPostManager from "./AdminPostManager";
import { CommunityManagement } from "./communities/CommunityManagement";
import { CategoryManagement } from "./categories/CategoryManagement";
import { EventManagement } from "./events/EventManagement";
import TrendingManagement from "./trending/TrendingPostsManagement";
import UserRankingList from "./rankings/UserRankingList";
import { ReportManagement } from "./reports/ReportManagement";
import { PostCleanup } from "./posts/PostCleanup";
import { ReferenceManagement } from "./references/ReferenceManagement";
import { LoadingSpinner } from "../ui/loading-spinner";
import DirectPostRemoval from "@/pages/admin/DirectPostRemoval";
import useDragToScroll from "@/hooks/useDragToScroll";
import { ChevronLeft, ChevronRight, Menu } from "lucide-react";
import "@/styles/admin-mobile.css"; // Importando os estilos para dispositivos móveis

interface AdminPanelProps {
  onError?: () => void;
  onLoad?: () => void;
}

const AdminPanel = ({ onError, onLoad }: AdminPanelProps) => {
  const { isAdmin, isLoading, hasError } = useAdminRole();
  const [activeTab, setActiveTab] = useState("dashboard");
  const { stats, isLoading: panelLoading } = useAdminPanel({ onError });
  const tabsListRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Lista de abas disponíveis
  const tabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "usuarios", label: "Usuários" },
    { id: "posts", label: "Posts" },
    { id: "comunidades", label: "Comunidades" },
    { id: "categorias", label: "Categorias" },
    { id: "eventos", label: "Eventos" },
    { id: "trending", label: "Trending" },
    { id: "rankings", label: "Rankings" },
    { id: "denuncias", label: "Denúncias" },
    { id: "referencias", label: "Referências" },
  ];

  // Navegar para a próxima aba ou anterior
  const navigateTab = (direction: 'next' | 'prev') => {
    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
    let newIndex;
    
    if (direction === 'next') {
      newIndex = Math.min(currentIndex + 1, tabs.length - 1);
    } else {
      newIndex = Math.max(currentIndex - 1, 0);
    }
    
    setActiveTab(tabs[newIndex].id);
    
    // Rolar para mostrar a aba selecionada
    if (tabsListRef.current) {
      const tabElements = tabsListRef.current.querySelectorAll('.admin-tab-trigger');
      if (tabElements[newIndex]) {
        tabElements[newIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  };
  
  // Configurar handlers para arrasto e navegação melhorada
  const { scrollToLeft, scrollToRight } = useDragToScroll(tabsListRef, {
    direction: 'horizontal',
    sensitivity: 1.2,
    onScrollLeft: () => navigateTab('prev'),
    onScrollRight: () => navigateTab('next'),
    scrollAmount: 150,
    behavior: 'smooth'
  });
  
  // Função para rolar a lista de abas para a esquerda/direita
  const scrollTabs = (direction: 'left' | 'right') => {
    if (direction === 'left') {
      scrollToLeft();
      // Também tentamos navegar para a aba anterior para melhor experiência
      if (window.innerWidth < 768) {
        navigateTab('prev');
      }
    } else {
      scrollToRight();
      // Também tentamos navegar para a próxima aba para melhor experiência
      if (window.innerWidth < 768) {
        navigateTab('next');
      }
    }
  };
  
  // State para mostrar visualmente a aba que está ativa
  const [visibleScrollButtons, setVisibleScrollButtons] = useState(true);
  
  // Verificar se os botões de rolagem devem ser exibidos
  useEffect(() => {
    const checkScrollability = () => {
      if (tabsListRef.current) {
        const { scrollWidth, clientWidth } = tabsListRef.current;
        // Mostrar botões apenas se houver conteúdo para rolar
        setVisibleScrollButtons(scrollWidth > clientWidth);
      }
    };
    
    checkScrollability();
    
    // Recalcular quando o tamanho da janela mudar
    window.addEventListener('resize', checkScrollability);
    return () => window.removeEventListener('resize', checkScrollability);
  }, []);
  
  // Adicionar feedback visual quando o usuário troca de aba
  const [lastTabChange, setLastTabChange] = useState<Date | null>(null);
  
  const setActiveTabWithFeedback = (tabId: string) => {
    setActiveTab(tabId);
    setLastTabChange(new Date());
    
    // Reset visual feedback após animação
    setTimeout(() => setLastTabChange(null), 500);
  };

  useEffect(() => {
    const loadAdminStats = async () => {
      if (isAdmin && !panelLoading) {
        try {
          if (onLoad) onLoad();
        } catch (error) {
          console.error("Erro ao carregar painel:", error);
          if (onError) onError();
        }
      }
    };

    if (isAdmin) {
      loadAdminStats();
    }
  }, [isAdmin, panelLoading, onError, onLoad]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <LoadingSpinner size="lg" text="Verificando permissões de administrador..." />
      </div>
    );
  }

  if (hasError) {
    if (onError) onError();
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Acesso Negado</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Você não tem permissão para acessar o painel de administração.
          Entre em contato com um administrador para obter acesso.
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="admin-panel-container touch-pan-y">
      <h1 className="text-3xl font-bold mb-1 admin-panel-title">Painel de Administração</h1>
      <p className="text-muted-foreground mb-6 admin-panel-description">
        Gerencie usuários, conteúdo e configurações da plataforma
      </p>

      <Tabs value={activeTab} onValueChange={setActiveTabWithFeedback} className="space-y-4">
        <div className="admin-tabs-container relative">
          {/* Botões de navegação para mobile - mais visíveis e com área de clique melhorada */}
          {visibleScrollButtons && (
            <>
              <button 
                onClick={() => scrollTabs('left')} 
                className="scroll-button scroll-button-left absolute left-0 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shadow-lg backdrop-blur-sm hover:bg-primary/20 active:scale-95 transition-all duration-150 border border-primary/20"
                aria-label="Navegar para a esquerda"
              >
                <ChevronLeft className="h-6 w-6 text-primary" />
              </button>
              
              <button 
                onClick={() => scrollTabs('right')} 
                className="scroll-button scroll-button-right absolute right-0 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shadow-lg backdrop-blur-sm hover:bg-primary/20 active:scale-95 transition-all duration-150 border border-primary/20"
                aria-label="Navegar para a direita"
              >
                <ChevronRight className="h-6 w-6 text-primary" />
              </button>
            </>
          )}
          
          {/* Indicadores de rolagem */}
          <div className="scroll-indicator-left"></div>
          <div className="scroll-indicator-right"></div>
          
          {/* Container com rolagem horizontal */}
          <div className="tabs-scroll-container overflow-hidden">
            <TabsList 
              ref={tabsListRef} 
              className="admin-tabs-list w-full flex flex-nowrap justify-start p-1 h-auto overflow-x-auto"
            >
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={`admin-tab-trigger py-2 px-4 flex-shrink-0 whitespace-nowrap transition-all duration-200 ${activeTab === tab.id ? 'bg-primary/10 font-semibold' : ''} ${lastTabChange && activeTab === tab.id ? 'scale-105 ring-2 ring-primary/30' : ''}`}
                  onClick={() => {
                    // Scrollar para exibir a aba sendo clicada
                    setTimeout(() => {
                      const element = document.querySelector(`[data-value="${tab.id}"]`);
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                      }
                    }, 10);
                  }}
                  data-value={tab.id}
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </div>

        <TabsContent value="dashboard" className="space-y-4">
          <Dashboard stats={stats} />
        </TabsContent>

        <TabsContent value="usuarios">
          <UserManagement />
        </TabsContent>
        
        <TabsContent value="posts">
          <AdminPostManager />
        </TabsContent>

        <TabsContent value="comunidades">
          <CommunityManagement />
        </TabsContent>

        <TabsContent value="categorias">
          <CategoryManagement />
        </TabsContent>

        <TabsContent value="eventos">
          <EventManagement />
        </TabsContent>

        <TabsContent value="trending">
          <TrendingManagement />
        </TabsContent>

        <TabsContent value="rankings">
          <UserRankingList />
        </TabsContent>

        <TabsContent value="denuncias">
          <ReportManagement />
        </TabsContent>

        <TabsContent value="referencias">
          <ReferenceManagement />
        </TabsContent>

        {/* Abas removidas a pedido do usuário */}
      </Tabs>
    </div>
  );
};

export default AdminPanel;
