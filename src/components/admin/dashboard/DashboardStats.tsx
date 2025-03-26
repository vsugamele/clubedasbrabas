
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface AdminStats {
  users: number;
  posts: number;
  communities: number;
  reports: number;
}

interface DashboardStatsProps {
  stats: AdminStats;
}

export const DashboardStats = ({ stats }: DashboardStatsProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="border-[#ff920e]/20">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle>Usuários</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="w-[200px] text-sm">
                    Este número representa a contagem de usuários da tabela 'profiles' no banco de dados.
                    Pode diferir da lista de gerenciamento que usa dados do localStorage.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <CardDescription>Total de usuários na plataforma</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-[#ff4400]">{stats.users}</div>
        </CardContent>
      </Card>
      
      <Card className="border-[#ff920e]/20">
        <CardHeader className="pb-2">
          <CardTitle>Publicações</CardTitle>
          <CardDescription>Total de publicações na plataforma</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-[#006bf7]">{stats.posts}</div>
        </CardContent>
      </Card>
      
      <Card className="border-[#ff920e]/20">
        <CardHeader className="pb-2">
          <CardTitle>Comunidades</CardTitle>
          <CardDescription>Total de comunidades na plataforma</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-[#ffe700]">{stats.communities}</div>
        </CardContent>
      </Card>
      
      <Card className="border-[#ff920e]/20">
        <CardHeader className="pb-2">
          <CardTitle>Denúncias</CardTitle>
          <CardDescription>Denúncias pendentes de revisão</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-[#ff4400]">{stats.reports}</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardStats;
