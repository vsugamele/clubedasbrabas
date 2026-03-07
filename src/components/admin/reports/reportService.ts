
import { supabase } from "@/integrations/supabase/client";
import { Report, mapReportFromSupabase } from "../communities/types";

export const fetchReports = async (): Promise<Report[]> => {
  try {
    const { data, error } = await supabase
<<<<<<< HEAD
      .from('c_reports')
=======
      .from('reports')
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      throw error;
    }
    
    // Map the data from snake_case to camelCase using the mapper function
    return data ? data.map(report => mapReportFromSupabase(report)) : [];
  } catch (error) {
    console.error("Erro ao buscar denúncias:", error);
    return [];
  }
};

export const fetchReport = async (id: string): Promise<Report | null> => {
  try {
    const { data, error } = await supabase
<<<<<<< HEAD
      .from('c_reports')
=======
      .from('reports')
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
      .select('*')
      .eq('id', id)
      .maybeSingle();
      
    if (error) {
      throw error;
    }
    
    // Map the data from snake_case to camelCase
    return data ? mapReportFromSupabase(data) : null;
  } catch (error) {
    console.error("Erro ao buscar denúncia:", error);
    return null;
  }
};

export const createReport = async (report: Omit<Report, 'id' | 'createdAt' | 'status' | 'resolvedAt' | 'resolvedBy'>): Promise<Report | null> => {
  try {
    const { data, error } = await supabase
<<<<<<< HEAD
      .from('c_reports')
=======
      .from('reports')
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
      .insert({
        reporter_id: report.reporterId,
        target_id: report.targetId,
        target_type: report.targetType,
        reason: report.reason,
        status: 'pending'
      })
      .select()
      .single();
      
    if (error) {
      throw error;
    }
    
    // Map the data from snake_case to camelCase
    return data ? mapReportFromSupabase(data) : null;
  } catch (error) {
    console.error("Erro ao criar denúncia:", error);
    return null;
  }
};

export const updateReportStatus = async (
  reportId: string, 
  status: 'pending' | 'approved' | 'rejected',
  resolvedBy: string
): Promise<Report | null> => {
  try {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
<<<<<<< HEAD
      .from('c_reports')
=======
      .from('reports')
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
      .update({
        status,
        resolved_at: now,
        resolved_by: resolvedBy
      })
      .eq('id', reportId)
      .select()
      .single();
      
    if (error) {
      throw error;
    }
    
    // Map the data from snake_case to camelCase
    return data ? mapReportFromSupabase(data) : null;
  } catch (error) {
    console.error("Erro ao atualizar status da denúncia:", error);
    return null;
  }
};

export const deleteReport = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
<<<<<<< HEAD
      .from('c_reports')
=======
      .from('reports')
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
      .delete()
      .eq('id', id);
      
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error("Erro ao excluir denúncia:", error);
    return false;
  }
};
