import { useEffect, useState, useCallback } from "react";
import { ProfileType } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "./hooks/useSession";
import { useProfile } from "./hooks/useProfile";
import { useAuthActions } from "./hooks/useAuthActions";
import { toast } from "sonner";

export function useAuthProvider() {
  const { 
    session, 
    user, 
    loading, 
    initialized,
    authError,
    setLoading,
    getInitialSession,
    setupAuthListener,
    refreshSession
  } = useSession();
  
  const {
    profile,
    loadProfile,
    updateProfile: updateUserProfile,
    createProfile,
    setProfile
  } = useProfile();
  
  const { login, signUp, logout } = useAuthActions(setLoading);
  
  const [initAttempts, setInitAttempts] = useState(0);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [lastInitTime, setLastInitTime] = useState(0);

  // Try to refresh session when experiencing auth issues
  const attemptSessionRecovery = useCallback(async () => {
    if (initAttempts >= 3) {
      console.log("Maximum recovery attempts reached, giving up");
      return false;
    }
    
    // Prevent excessive recovery attempts within a short time
    const now = Date.now();
    if (now - lastInitTime < 3000 && lastInitTime > 0) {
      console.log("Skipping recovery attempt - too soon");
      return false;
    }
    
    setLastInitTime(now);
    console.log("Attempting session recovery...");
    const recovered = await refreshSession();
    setInitAttempts(prev => prev + 1);
    return recovered;
  }, [refreshSession, initAttempts, lastInitTime]);

  // Initialize auth
  useEffect(() => {
    console.log("Auth provider initialized");
    
    // Flag to track if component is mounted
    let isMounted = true;
    let authSubscription: { unsubscribe: () => void } | null = null;
    
    // Function to get initial session and profile
    const initializeAuth = async () => {
      try {
        // Prevent excessive initializations within a short time
        const now = Date.now();
        if (now - lastInitTime < 3000 && lastInitTime > 0) {
          console.log("Skipping auth initialization - too soon");
          return;
        }
        
        setLastInitTime(now);
        console.log("Initializing auth...");
        
        // Set up auth state listener first
        authSubscription = setupAuthListener();
        
        // Get initial session
        const initialSession = await getInitialSession();
        if (!isMounted) return;
        
        setSessionChecked(true);
        
        // If we have a user session and component is still mounted
        if (initialSession?.user && isMounted) {
          console.log("User found in session, fetching profile");
          
          try {
            await loadProfile(initialSession.user.id);
          } catch (profileError) {
            console.error("Error loading profile:", profileError);
            // Continue even if profile loading fails
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        
        if (isMounted) {
          // Attempt recovery if initialization fails
          const recovered = await attemptSessionRecovery();
          if (recovered && isMounted) {
            console.log("Session recovered successfully");
          }
        }
      } finally {
        // Always ensure loading is set to false when auth is initialized
        if (isMounted) {
          console.log("Auth initialization complete - setting loading to false");
          setLoading(false);
        }
      }
    };
    
    // Initialize auth immediately
    initializeAuth();
    
    // Set a safety timeout to ensure loading state is reset
    const safetyTimeout = setTimeout(() => {
      if (isMounted && loading) {
        console.log("Safety timeout triggered - forcing loading to false");
        setLoading(false);
        setSessionChecked(true);
      }
    }, 5000); // 5 second safety timeout
    
    // Clean up subscriptions on unmount
    return () => {
      console.log("Cleaning up auth provider");
      isMounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
      clearTimeout(safetyTimeout);
    };
  }, [getInitialSession, setupAuthListener, loading, setLoading, loadProfile, attemptSessionRecovery, lastInitTime]);

  // Effect to handle profile loading based on user state changes
  useEffect(() => {
    if (!user || !sessionChecked) return;
    
    let isMounted = true;

    const loadUserProfile = async () => {
      try {
        console.log("Loading profile for authenticated user:", user.id);
        
        // Verificar se existe um perfil salvo do último logout
        const lastUserProfile = localStorage.getItem('last_user_profile');
        if (lastUserProfile) {
          try {
            const parsedProfile = JSON.parse(lastUserProfile);
            // Verificar se o perfil salvo pertence ao usuário atual
            if (parsedProfile && parsedProfile.id === user.id) {
              console.log("Using last saved profile from localStorage");
              setProfile(parsedProfile);
              
              // Atualizar o perfil no localStorage normal também
              localStorage.setItem('user_profile', lastUserProfile);
              
              // Atualizar o perfil no servidor com os dados do último perfil salvo
              updateUserProfile(user.id, parsedProfile).catch(e => 
                console.error("Error updating profile from last saved profile:", e)
              );
              
              return;
            }
          } catch (e) {
            console.error("Error parsing last user profile:", e);
          }
        }
        
        // Tentar carregar perfil do localStorage normal
        const cachedProfile = localStorage.getItem('user_profile');
        if (cachedProfile) {
          try {
            const parsedProfile = JSON.parse(cachedProfile);
            // Verificar se o perfil em cache pertence ao usuário atual ou se é um perfil válido
            if (parsedProfile && (parsedProfile.id === user.id || !parsedProfile.id)) {
              console.log("Using cached profile from localStorage");
              
              // Se o perfil em cache não tiver ID ou tiver ID diferente, atualizamos com o ID atual
              if (!parsedProfile.id || parsedProfile.id !== user.id) {
                parsedProfile.id = user.id;
                // Salvar o perfil atualizado no localStorage
                localStorage.setItem('user_profile', JSON.stringify(parsedProfile));
              }
              
              setProfile(parsedProfile);
              
              // Atualizar o perfil no servidor com os dados do cache
              // Isso garante que os dados do perfil sejam salvos no banco de dados
              updateUserProfile(user.id, parsedProfile).catch(e => 
                console.error("Error updating profile from cache:", e)
              );
              
              return;
            } else {
              console.log("Cached profile doesn't match current user, removing from localStorage");
              // Não remover o perfil do localStorage, apenas carregar do servidor
              // localStorage.removeItem('user_profile');
            }
          } catch (e) {
            console.error("Error parsing cached profile:", e);
            localStorage.removeItem('user_profile');
          }
        }
        
        // Se não tiver perfil em cache ou o cache for inválido, carrega do servidor
        const userProfile = await loadProfile(user.id);
        
        if (!userProfile && isMounted) {
          console.log("No profile found, creating default profile");
          await createProfile(user.id);
        }
      } catch (error) {
        console.error("Error loading user profile:", error);
        // Continue even if profile loading fails - better to have auth without profile than nothing
      }
    };

    loadUserProfile();
    
    return () => {
      isMounted = false;
    };
  }, [user?.id, sessionChecked, loadProfile, createProfile, setProfile, updateUserProfile]);

  const updateProfile = async (updates: Partial<ProfileType>) => {
    if (!user) {
      console.error("Cannot update profile - no user logged in");
      return { success: false, error: "No user logged in" };
    }
    
    return updateUserProfile(user.id, updates);
  };

  return {
    session,
    user,
    profile,
    loading,
    authError,
    login,
    signUp,
    logout,
    updateProfile,
    refreshSession,
    attemptSessionRecovery
  };
}
