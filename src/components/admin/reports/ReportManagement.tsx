
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchReports, updateReportStatus } from "./reportService";
import { Report } from "../communities/types";
import { Shield, Check, X, AlertCircle, User, FileText, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { ProfileType } from "@/context/auth/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/context/auth";

export const ReportManagement = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Record<string, ProfileType>>({});
  const { user } = useAuth(); // Get current user for ID
  
  useEffect(() => {
    loadReports();
  }, []);
  
  const loadReports = async () => {
    setLoading(true);
    const data = await fetchReports();
    setReports(data);
    
    // Fetch user profiles
    if (data.length > 0) {
      const userIds = data.map(report => report.reporterId);
      if (data.some(r => r.resolvedBy)) {
        data.forEach(r => {
          if (r.resolvedBy && !userIds.includes(r.resolvedBy)) {
            userIds.push(r.resolvedBy);
          }
        });
      }
      
      await loadUserProfiles(userIds);
    }
    
    setLoading(false);
  };
  
  const loadUserProfiles = async (userIds: string[]) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);
        
      if (error) {
        throw error;
      }
      
      if (data) {
        const profileMap: Record<string, ProfileType> = {};
        data.forEach(profileData => {
          // Convert database profile to ProfileType with default values
          const profileWithDefaults: ProfileType = {
            id: profileData.id,
            full_name: profileData.full_name || '',
            avatar_url: profileData.avatar_url || '',
            bio: profileData.bio || null,
            username: profileData.username || '',
            headline: profileData.headline || null,
            location: profileData.location || null,
            language: profileData.language || null,
            timezone: profileData.timezone || null,
            updated_at: profileData.updated_at || new Date().toISOString(),
            // Default values for fields not in the database
            created_at: new Date().toISOString(),
            email: null,
            is_public: true
          };
          profileMap[profileData.id] = profileWithDefaults;
        });
        setProfiles(profileMap);
      }
    } catch (error) {
      console.error("Erro ao buscar perfis:", error);
    }
  };
  
  const handleApproveReport = async (report: Report) => {
    if (!user) return; // Verify user is authenticated
    
    try {
      const updatedReport = await updateReportStatus(report.id, 'approved', user.id);
      if (updatedReport) {
        await loadReports(); // Reload reports after update
      }
    } catch (error) {
      console.error("Error approving report:", error);
    }
  };
  
  const handleRejectReport = async (report: Report) => {
    if (!user) return; // Verify user is authenticated
    
    try {
      const updatedReport = await updateReportStatus(report.id, 'rejected', user.id);
      if (updatedReport) {
        await loadReports(); // Reload reports after update
      }
    } catch (error) {
      console.error("Error rejecting report:", error);
    }
  };
  
  const getUserName = (userId: string) => {
    const profile = profiles[userId];
    if (profile) {
      return profile.full_name || profile.username || 'Anônimo';
    }
    return 'Usuário';
  };
  
  const getReporterName = (report: Report) => {
    return getUserName(report.reporterId);
  };
  
  const getResolverName = (report: Report) => {
    if (!report.resolvedBy) return null;
    return getUserName(report.resolvedBy);
  };
  
  const getTargetTypeIcon = (type: 'user' | 'post' | 'comment') => {
    switch (type) {
      case 'user':
        return <User className="h-4 w-4" />;
      case 'post':
        return <FileText className="h-4 w-4" />;
      case 'comment':
        return <MessageSquare className="h-4 w-4" />;
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pendente</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">Rejeitado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  return (
    <Card className="border-[#ff920e]/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-[#ff4400]" />
          <span>Gerenciamento de Denúncias</span>
        </CardTitle>
        <CardDescription>
          Avalie e tome medidas em relação às denúncias de conteúdo inadequado
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff4400]"></div>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">
            <AlertCircle className="h-10 w-10 mx-auto mb-2 text-muted-foreground/60" />
            <p>Não há denúncias para revisar no momento</p>
          </div>
        ) : (
          <div className="space-y-6">
            {reports.map((report) => (
              <div 
                key={report.id}
                className="rounded-lg border border-[#ff920e]/20 overflow-hidden"
              >
                <div className="bg-orange-50/70 p-3 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {getTargetTypeIcon(report.targetType)}
                    <span className="font-medium capitalize">
                      Denúncia de {report.targetType === 'user' ? 'usuário' : report.targetType === 'post' ? 'postagem' : 'comentário'}
                    </span>
                  </div>
                  {getStatusBadge(report.status)}
                </div>
                
                <div className="p-4">
                  <p className="mb-3 text-sm">
                    <strong>Motivo:</strong> {report.reason}
                  </p>
                  
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>
                      <strong>Reportado por:</strong> {getReporterName(report)}
                    </p>
                    <p>
                      <strong>Data:</strong> {format(new Date(report.createdAt), "PPp", { locale: ptBR })}
                    </p>
                    <p>
                      <strong>ID do alvo:</strong> {report.targetId}
                    </p>
                    
                    {report.resolvedAt && (
                      <>
                        <p>
                          <strong>Resolvido em:</strong> {format(new Date(report.resolvedAt), "PPp", { locale: ptBR })}
                        </p>
                        {report.resolvedBy && (
                          <p>
                            <strong>Resolvido por:</strong> {getResolverName(report)}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
                
                {report.status === 'pending' && (
                  <div className="bg-gray-50 p-3 flex justify-end gap-2 border-t border-[#ff920e]/10">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="gap-1"
                      onClick={() => handleRejectReport(report)}
                    >
                      <X className="h-4 w-4" /> Rejeitar
                    </Button>
                    <Button 
                      className="gap-1 bg-[#ff4400] hover:bg-[#ff4400]/90"
                      size="sm"
                      onClick={() => handleApproveReport(report)}
                    >
                      <Check className="h-4 w-4" /> Aprovar
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReportManagement;
