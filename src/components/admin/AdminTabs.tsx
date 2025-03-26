
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AdminTabsProps {
  reportsCount: number;
}

export const AdminTabs = ({ reportsCount }: AdminTabsProps) => {
  return (
    <TabsList className="mb-4 bg-orange-50">
      <TabsTrigger value="dashboard" className="data-[state=active]:bg-[#ff4400] data-[state=active]:text-white">Dashboard</TabsTrigger>
      <TabsTrigger value="users" className="data-[state=active]:bg-[#ff4400] data-[state=active]:text-white">Usuários</TabsTrigger>
      <TabsTrigger value="communities" className="data-[state=active]:bg-[#ff4400] data-[state=active]:text-white">Comunidades</TabsTrigger>
      <TabsTrigger value="categories" className="data-[state=active]:bg-[#ff4400] data-[state=active]:text-white">Categorias</TabsTrigger>
      <TabsTrigger value="events" className="data-[state=active]:bg-[#ff4400] data-[state=active]:text-white">Eventos</TabsTrigger>
      <TabsTrigger value="trending" className="data-[state=active]:bg-[#ff4400] data-[state=active]:text-white">Trending</TabsTrigger>
      <TabsTrigger value="rankings" className="data-[state=active]:bg-[#ff4400] data-[state=active]:text-white">Rankings</TabsTrigger>
      <TabsTrigger value="reports" className="data-[state=active]:bg-[#ff4400] data-[state=active]:text-white">
        Denúncias
        {reportsCount > 0 && (
          <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-red-500 text-white">
            {reportsCount}
          </span>
        )}
      </TabsTrigger>
    </TabsList>
  );
};

export default AdminTabs;
