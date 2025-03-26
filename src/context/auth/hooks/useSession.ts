import { useState, useEffect, useCallback, useRef } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [authError, setAuthError] = useState<Error | null>(null);
  const [lastSessionCheck, setLastSessionCheck] = useState(0);
  
  // Usar ref para evitar problemas de race condition
  const isMounted = useRef(true);
  const authSubscription = useRef<{ unsubscribe: () => void } | null>(null);

  // Limpar assinatura quando o componente for desmontado
  useEffect(() => {
    // Verificar a sessão inicial ao montar o componente
    getInitialSession();
    
    // Configurar o listener de eventos de autenticação
    const subscription = setupAuthListener();
    
    return () => {
      isMounted.current = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Get initial session on component mount
  const getInitialSession = useCallback(async () => {
    try {
      console.log("Getting initial session...");
      
      if (!isMounted.current) {
        console.log("Component not mounted, skipping session check");
        return null;
      }
      
      setLoading(true);
      
      // Prevent excessive session checks
      const now = Date.now();
      if (now - lastSessionCheck < 2000 && lastSessionCheck > 0) {
        console.log("Skipping session check - too soon since last check");
        return session;
      }
      
      setLastSessionCheck(now);
      
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (!isMounted.current) return null;
      
      if (sessionError) {
        console.error("Error getting session:", sessionError);
        setAuthError(sessionError);
        setLoading(false);
        setInitialized(true);
        return null;
      }
      
      console.log("Initial session:", sessionData?.session ? "exists" : "null");
      
      // Set session and user
      const initialSession = sessionData.session;
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      
      // Always mark as initialized after checking initial session
      setInitialized(true);
      
      // Set loading to false after session check
      setLoading(false);
      
      return initialSession;
    } catch (error) {
      console.error("Session initialization error:", error);
      
      if (isMounted.current) {
        setAuthError(error as Error);
        setLoading(false);
        setInitialized(true);
      }
      
      return null;
    }
  }, [lastSessionCheck, session]);

  // Setup auth state change listener
  const setupAuthListener = useCallback(() => {
    console.log("Setting up auth state listener");
    
    // Limpar assinatura anterior se existir
    if (authSubscription.current) {
      authSubscription.current.unsubscribe();
    }
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("Auth state changed:", event, newSession?.user?.id);
        
        if (!isMounted.current) return;
        
        // Clear any previous auth errors
        setAuthError(null);
        
        // Atualizar sessão e usuário
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        // Sempre desativar o estado de carregamento após qualquer evento de autenticação
        setLoading(false);
        
        // Forçar uma verificação adicional da sessão após eventos de login
        if (event === 'SIGNED_IN') {
          console.log("User signed in, forcing session refresh");
          setTimeout(async () => {
            if (isMounted.current) {
              await refreshSession();
            }
          }, 500);
        }
        
        console.log("Auth state updated, loading set to false");
      }
    );
    
    authSubscription.current = subscription;
    return subscription;
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      console.log("Manually refreshing session...");
      
      if (!isMounted.current) {
        console.log("Component not mounted, skipping session refresh");
        return false;
      }
      
      // Prevent excessive session refreshes
      const now = Date.now();
      if (now - lastSessionCheck < 2000 && lastSessionCheck > 0) {
        console.log("Skipping session refresh - too soon since last check");
        return false;
      }
      
      setLastSessionCheck(now);
      setLoading(true);
      
      const { data, error } = await supabase.auth.refreshSession();
      
      if (!isMounted.current) return false;
      
      if (error) {
        console.error("Session refresh error:", error);
        setAuthError(error);
        setLoading(false);
        return false;
      }
      
      // Update session and user state
      setSession(data.session);
      setUser(data.session?.user ?? null);
      
      // Always set loading to false after refresh attempt
      setLoading(false);
      
      return !!data.session;
    } catch (error) {
      console.error("Session refresh exception:", error);
      
      if (isMounted.current) {
        setAuthError(error as Error);
        setLoading(false);
      }
      
      return false;
    }
  }, [lastSessionCheck]);

  return {
    session,
    user,
    loading,
    initialized,
    authError,
    setLoading,
    getInitialSession,
    setupAuthListener,
    refreshSession
  };
}
