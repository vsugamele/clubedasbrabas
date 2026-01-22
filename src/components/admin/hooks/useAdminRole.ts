import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { queryWithRetry, type RetryOptions } from "./utils/queryUtils";
import { 
  checkUserRole, 
  checkCurrentUserRole, 
  getCurrentUserRoles, 
  assignUserRole, 
  isAdminByEmail,
  verifyCurrentUserRole 
} from "./utils/roleUtils";

// Cache to prevent multiple checks and notifications
const adminStatusCache = new Map<string, {
  status: boolean,
  lastNotified: number
}>();

export const useAdminRole = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [lastCheckedUserId, setLastCheckedUserId] = useState<string | null>(null);
  const [verificationCount, setVerificationCount] = useState(0);
  const [lastVerifiedTime, setLastVerifiedTime] = useState(0);

  // Function to check admin status robustly
  const checkAdminStatus = useCallback(async (user: User | null) => {
    try {
      console.log("Verificando status de admin...");
      setIsLoading(true);
      setHasError(false);
      
      if (!user) {
        console.log("Usuário não autenticado");
        setIsAdmin(false);
        setIsLoading(false);
        return false;
      }
      
      // Limit frequent checks for the same user
      const now = Date.now();
      if (lastCheckedUserId === user.id && (now - lastVerifiedTime) < 30000) {
        console.log("Verificação recente, usando resultado em cache");
        setIsLoading(false);
        return isAdmin;
      }
      
      // Record which user we're checking
      setLastCheckedUserId(user.id);
      setLastVerifiedTime(now);
      
      // Check cache to prevent multiple notifications
      const cachedStatus = adminStatusCache.get(user.id);
      
      // 1. First check specific emails (most reliable method)
      if (isAdminByEmail(user.email)) {
        console.log("Admin identificado por email:", user.email);
        
        // Only show toast if not recently notified
        if (!cachedStatus || (now - cachedStatus.lastNotified > 120000)) {
          // To ensure consistency, also save this status in the database
          try {
            // Check if already has the role before assigning
            const isAlreadyAdmin = await checkUserRole(user.id, 'admin');
            if (!isAlreadyAdmin) {
              console.log("Salvando status de admin no banco para email privilegiado");
              await assignUserRole(user.id, 'admin');
              // Only show notification if newly assigned
              toast.success("Papel admin atribuído com sucesso", { 
                id: "admin-role-assignment",
                duration: 3000
              });
              
              // Update cache with current timestamp
              adminStatusCache.set(user.id, {
                status: true,
                lastNotified: now
              });
            }
          } catch (err) {
            console.error("Erro ao salvar status admin para email privilegiado:", err);
            // Continue anyway since we know they're admin by email
          }
        }
        
        setIsAdmin(true);
        setIsLoading(false);
        return true;
      } 
      
      // 2. Check admin role using checkCurrentUserRole with retry
      console.log("Verificando papel de admin para o usuário:", user.id);
      
      const retryOptions: RetryOptions = {
        maxAttempts: 2,
        initialDelay: 500,
        maxDelay: 2000
      };
      
      try {
        const isUserAdmin = await queryWithRetry(() => 
          checkCurrentUserRole(), retryOptions);
        
        if (isUserAdmin) {
          console.log("Usuário confirmado como admin pela função checkCurrentUserRole");
          setIsAdmin(true);
          setIsLoading(false);
          return true;
        }
      } catch (error) {
        console.error("Erro ao verificar se usuário é admin:", error);
        // Continue to check if first admin
      }

      // 3. If not admin, check if there are other admins (with cache)
      const shouldCheckOtherAdmins = !cachedStatus || !cachedStatus.status;
      
      if (shouldCheckOtherAdmins) {
        try {
          console.log("Verificando se existem outros admins no sistema...");
          
          const retryOptions: RetryOptions = {
            maxAttempts: 2,
            initialDelay: 500,
            maxDelay: 2000
          };
          
          const result = await queryWithRetry(async () => {
            return await supabase
              .from('user_roles')
              .select('*', { count: 'exact', head: true })
              .eq('role', 'admin');
          }, retryOptions);
              
          if (result.error) {
            console.error("Erro ao verificar contagem de admins:", result.error);
            throw result.error;
          }
          
          console.log("Resultado da contagem de admins:", result.count);
          
          // IMPORTANT FIX: If no admins or count is null, set current user as admin
          if ((result.count === 0) || (result.count === null)) {
            console.log("Nenhum admin encontrado, definindo usuário atual como admin");
            
            try {
              // First try to use the function to assign role
              const success = await assignUserRole(user.id, 'admin');
                  
              if (!success) {
                // If function fails, try direct insert
                const { error: insertError } = await supabase
                  .from('user_roles')
                  .insert({
                    user_id: user.id,
                    role: 'admin'
                  });
                  
                if (insertError) {
                  console.error("Erro ao inserir registro de admin:", insertError);
                  throw insertError;
                }
              }
              
              // Only show notification once
              if (!cachedStatus || (now - cachedStatus.lastNotified > 120000)) {
                toast.success("Você foi definido como o primeiro administrador do sistema!", { 
                  position: "bottom-right",
                  id: "first-admin-assigned",
                  duration: 5000
                });
                
                // Update cache
                adminStatusCache.set(user.id, {
                  status: true,
                  lastNotified: now
                });
              }
              
              setIsAdmin(true);
              setIsLoading(false);
              return true;
            } catch (insertError) {
              console.error("Erro ao inserir registro de admin:", insertError);
              setIsAdmin(false);
              setIsLoading(false);
              return false;
            }
          } else {
            console.log("Outros admins encontrados, usuário atual não é admin");
            
            // Update cache as not admin
            adminStatusCache.set(user.id, {
              status: false,
              lastNotified: now
            });
            
            setIsAdmin(false);
            setIsLoading(false);
            return false;
          }
        } catch (error) {
          console.error("Erro ao verificar se existem admins:", error);
          setIsAdmin(false);
          setIsLoading(false);
          setHasError(true);
          return false;
        }
      } else {
        // Use cached admin status
        setIsAdmin(cachedStatus.status);
        setIsLoading(false);
        return cachedStatus.status;
      }
    } catch (error) {
      console.error("Erro geral ao verificar status de admin:", error);
      setHasError(true);
      setIsLoading(false);
      return false;
    }
  }, [isAdmin, lastCheckedUserId, lastVerifiedTime]);

  // Effect to start admin verification when user is logged in
  useEffect(() => {
    // Only verify once per minute maximum
    const now = Date.now();
    if (lastVerifiedTime > 0 && (now - lastVerifiedTime) < 60000) {
      return;
    }
    
    console.log("Iniciando verificação periódica de status admin");
    setVerificationCount(prev => prev + 1);
    
    const checkStatus = async () => {
      try {
        // Get current user
        const { data } = await supabase.auth.getUser();
        if (!data || !data.user) {
          setIsAdmin(false);
          setIsLoading(false);
          return;
        }
        
        await checkAdminStatus(data.user);
      } catch (error) {
        console.error("Erro ao verificar status admin:", error);
        setIsLoading(false);
      }
    };
    
    checkStatus();
    
    // Reduced frequency of periodic checking
    const interval = setInterval(checkStatus, 300000); // Check every 5 minutes instead of every minute
    
    return () => clearInterval(interval);
  }, [isAdmin, lastVerifiedTime, checkAdminStatus]);

  // Listen for auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Reset verification time to force a fresh check
        setLastVerifiedTime(0);
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);

  return {
    isAdmin,
    isLoading,
    hasError,
    checkAdminStatus,
    setIsAdmin,
    setIsLoading,
    setHasError,
    verificationCount
  };
};

export default useAdminRole;
