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
import {
  LayoutDashboard,
  Mail,
  BookOpen,
  Link2,
  Users,
  FileText,
  Folder,
  Tags,
  Calendar,
  TrendingUp,
  Trophy,
  Flag,
  Image
} from "lucide-react";
import "@/styles/admin-mobile.css";
import { AdminMessageComposer } from "@/components/AdminMessageComposer";
import { TrackManagement } from "./tracks/TrackManagement";
import { ManageLinks } from "./links/ManageLinks";
import { BannerManagement } from "./banners/BannerManagement";

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

  // Tabs organizados com ícones para melhor visualização
  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "mensagens", label: "Mensagens", icon: Mail },
    { id: "usuarios", label: "Usuários", icon: Users },
    { id: "posts", label: "Posts", icon: FileText },
    { id: "comunidades", label: "Comunidades", icon: Folder },
    { id: "categorias", label: "Categorias", icon: Tags },
    { id: "trilhas", label: "Trilhas", icon: BookOpen },
    { id: "links", label: "Links", icon: Link2 },
    { id: "eventos", label: "Eventos", icon: Calendar },
    { id: "trending", label: "Trending", icon: TrendingUp },
    { id: "rankings", label: "Rankings", icon: Trophy },
    { id: "denuncias", label: "Denuncias", icon: Flag },
    { id: "referencias", label: "Referencias", icon: Image },
    { id: "banners", label: "Banners", icon: Image },
  ];


  // Adicionar feedback visual quando o usuário troca de aba
  const setActiveTabWithFeedback = (tabId: string) => {
    setActiveTab(tabId);
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
    <div ref={containerRef} className="admin-panel-container p-2 sm:p-4 md:p-8">
      <h1 className="admin-panel-title text-xl sm:text-2xl font-bold mb-1">Painel de Administração</h1>
      <p className="admin-panel-description text-sm sm:text-base text-muted-foreground mb-2 sm:mb-4">
        Gerencie usuários, conteúdo e configurações da plataforma
      </p>

      <Tabs value={activeTab} onValueChange={setActiveTabWithFeedback} className="space-y-4">
        <div className="admin-tabs-container">
          {/* Container das tabs em 2 linhas */}
          <div className="tabs-container">
            <TabsList
              ref={tabsListRef}
              className="admin-tabs-list w-full flex flex-wrap justify-start gap-1 p-1 h-auto bg-card/50 rounded-lg"
            >
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className={`admin-tab-trigger py-1.5 px-2 md:px-3 whitespace-nowrap transition-all duration-200 text-xs md:text-sm flex items-center gap-1.5 rounded-md ${activeTab === tab.id ? 'bg-primary text-primary-foreground font-semibold shadow-sm' : 'hover:bg-muted'}`}
                  >
                    <IconComponent className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>
        </div>

        <TabsContent value="dashboard" className="space-y-4">
          <Dashboard stats={stats} />
        </TabsContent>

        <TabsContent value="mensagens">
          <AdminMessageComposer />
        </TabsContent>

        <TabsContent value="trilhas">
          <TrackManagement />
        </TabsContent>

        <TabsContent value="links">
          <ManageLinks />
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

        <TabsContent value="banners">
          <BannerManagement />
        </TabsContent>

        {/* Abas removidas a pedido do usuário */}
      </Tabs>
    </div>
  );
};

export default AdminPanel;
