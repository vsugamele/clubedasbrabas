import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  loading: boolean;
  error: Error | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    // Verificar o usuário atual
    const checkUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        
        if (error) {
          throw error;
        }

        setAuthState({
          user: data.user,
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error("Erro ao buscar usuário:", error);
        setAuthState({
          user: null,
          loading: false,
          error: error as Error,
        });
      }
    };

    // Executar a verificação inicial
    checkUser();

    // Configurar listener para mudanças de autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setAuthState({
          user: session?.user ?? null,
          loading: false,
          error: null,
        });
      }
    );

    // Limpar listener quando o componente for desmontado
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  return authState;
};
