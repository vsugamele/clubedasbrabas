import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminRole } from "./hooks/useAdminRole";
import useAdminPanel from "./hooks/useAdminPanel";
import UserManagement from "./UserManagement";
import Dashboard from "./dashboard/Dashboard";
import { CommunityManagement } from "./communities/CommunityManagement";
import { CategoryManagement } from "./categories/CategoryManagement";
import { EventManagement } from "./events/EventManagement";
import TrendingManagement from "./trending/TrendingPostsManagement";
import UserRankingList from "./rankings/UserRankingList";
import { ReportManagement } from "./reports/ReportManagement";
import { PostCleanup } from "./posts/PostCleanup";
import { ReferenceManagement } from "./references/ReferenceManagement";
import { LoadingSpinner } from "../ui/loading-spinner";

interface AdminPanelProps {
  onError?: () => void;
  onLoad?: () => void;
}

const AdminPanel = ({ onError, onLoad }: AdminPanelProps) => {
  const { isAdmin, isLoading, hasError } = useAdminRole();
  const [activeTab, setActiveTab] = useState("dashboard");
  const { stats, isLoading: panelLoading } = useAdminPanel({ onError });

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

  const tabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "usuarios", label: "Usuários" },
    { id: "comunidades", label: "Comunidades" },
    { id: "categorias", label: "Categorias" },
    { id: "eventos", label: "Eventos" },
    { id: "trending", label: "Trending" },
    { id: "rankings", label: "Rankings" },
    { id: "denuncias", label: "Denúncias" },
    { id: "referencias", label: "Referências" },
    { id: "limpeza", label: "Limpeza de Posts" },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-1">Painel de Administração</h1>
      <p className="text-muted-foreground mb-6">
        Gerencie usuários, conteúdo e configurações da plataforma
      </p>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="w-full overflow-x-auto flex flex-nowrap justify-start p-1 h-auto">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="py-2 px-4 flex-shrink-0"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <Dashboard stats={stats} />
        </TabsContent>

        <TabsContent value="usuarios">
          <UserManagement />
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

        <TabsContent value="limpeza">
          <PostCleanup />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;
