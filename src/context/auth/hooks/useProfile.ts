import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProfileType } from "../types";
import { fetchProfile, createDefaultProfile } from "../profileUtils";

export function useProfile() {
  const [profile, setProfile] = useState<ProfileType | null>(null);

  const loadProfile = async (userId: string) => {
    try {
      console.log("Loading profile for user:", userId);
      const fetchedProfile = await fetchProfile(userId);
      
      if (fetchedProfile) {
        console.log("Profile loaded:", fetchedProfile);
        setProfile(fetchedProfile);
        
        // Armazenar o perfil no localStorage para persistência
        localStorage.setItem('user_profile', JSON.stringify(fetchedProfile));
        
        return fetchedProfile;
      } else {
        console.log("No profile found");
        setProfile(null);
        return null;
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      setProfile(null);
      return null;
    }
  };

  const updateUserProfile = async (userId: string, updates: Partial<ProfileType>) => {
    try {
      console.log("Updating profile for user:", userId, updates);
      
      // Check if profile exists
      let currentProfile = await fetchProfile(userId);
      
      // If no profile exists, create a default one
      if (!currentProfile) {
        console.log("No profile found, creating default profile");
        currentProfile = await createDefaultProfile(userId);
        if (!currentProfile) {
          throw new Error("Failed to create user profile");
        }
      }
      
      // Extract only the properties that exist in the database schema
      // IMPORTANT: Only include fields that actually exist in Supabase profiles table
      const dbUpdates: Record<string, any> = {
        full_name: updates.full_name,
        avatar_url: updates.avatar_url,
        bio: updates.bio,
        headline: updates.headline,
        location: updates.location,
        language: updates.language,
        timezone: updates.timezone,
        updated_at: new Date().toISOString()
      };
      
      // Verificar se o username está sendo atualizado
      if (updates.username && updates.username !== currentProfile.username) {
        // Verificar se o username já existe
        const { data: existingUser, error: checkError } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", updates.username)
          .neq("id", userId)
          .maybeSingle();
          
        if (checkError) {
          console.error("Error checking username uniqueness:", checkError);
        }
        
        if (existingUser) {
          throw new Error("Nome de usuário já está em uso. Por favor, escolha outro.");
        }
        
        // Se o username for único, podemos incluí-lo na atualização
        dbUpdates.username = updates.username;
      }
      
      // Remove undefined values to avoid overwriting with null
      Object.keys(dbUpdates).forEach(key => {
        if (dbUpdates[key] === undefined) {
          delete dbUpdates[key];
        }
      });
      
      console.log("Sending profile update to Supabase:", dbUpdates);
      
      // Usar diretamente o método update para evitar conflitos de chave única
      const { data, error } = await supabase
        .from("profiles")
        .update(dbUpdates)
        .eq("id", userId)
        .select()
        .single();
        
      if (error) {
        console.error("Error updating profile:", error);
        
        // Verificar se o erro é porque o perfil não existe (pode acontecer se o perfil foi criado em outro dispositivo)
        if (error.code === 'PGRST116') {
          console.log("Profile doesn't exist, trying to insert instead");
          
          // Tentar inserir o perfil
          const { data: insertData, error: insertError } = await supabase
            .from("profiles")
            .insert({
              id: userId,
              ...dbUpdates
            })
            .select()
            .single();
            
          if (insertError) {
            console.error("Error inserting profile:", insertError);
            throw insertError;
          }
          
          console.log("Profile inserted successfully:", insertData);
          
          if (insertData) {
            const newProfile: ProfileType = {
              id: insertData.id,
              full_name: insertData.full_name || '',
              avatar_url: insertData.avatar_url || '',
              bio: insertData.bio || null,
              username: insertData.username || '',
              updated_at: insertData.updated_at || new Date().toISOString(),
              created_at: new Date().toISOString(),
              email: null,
              is_public: true,
              headline: insertData.headline || null,
              location: insertData.location || null,
              language: insertData.language || null,
              timezone: insertData.timezone || null
            };
            
            setProfile(newProfile);
            return newProfile;
          }
        } else {
          throw error;
        }
      }
      
      console.log("Profile updated successfully:", data);
      
      // Convert the data to ProfileType with default values for missing fields
      if (data) {
        const updatedProfile: ProfileType = {
          id: data.id,
          full_name: data.full_name || '',
          avatar_url: data.avatar_url || '',
          bio: data.bio || null,
          username: data.username || '',
          updated_at: data.updated_at || new Date().toISOString(),
          // Use current profile values for fields not in database
          created_at: currentProfile.created_at,
          email: currentProfile.email,
          is_public: currentProfile.is_public,
          headline: data.headline || null,
          location: data.location || null,
          language: data.language || null,
          timezone: data.timezone || null
        };
        
        // Atualiza o estado local com o perfil atualizado
        setProfile(updatedProfile);
        
        // Verifica se o perfil foi realmente atualizado no Supabase
        const verifyProfile = await fetchProfile(userId);
        if (verifyProfile) {
          console.log("Verified profile after update:", verifyProfile);
        } else {
          console.warn("Could not verify profile after update - fetchProfile returned null");
        }
        
        return updatedProfile;
      }
      
      return currentProfile;
    } catch (error: any) {
      console.error("Profile update exception:", error.message);
      throw error;
    }
  };

  const updateProfile = async (userId: string, updates: Partial<ProfileType>) => {
    if (!userId) {
      console.error("Cannot update profile - no user ID provided");
      return { success: false, error: "No user ID provided" };
    }
    
    try {
      console.log("Updating profile:", updates);
      const updatedProfile = await updateUserProfile(userId, updates);
      
      // Atualizar o perfil no localStorage após atualização bem-sucedida
      if (updatedProfile) {
        localStorage.setItem('user_profile', JSON.stringify(updatedProfile));
      }
      
      toast.success("Profile updated successfully");
      return { success: true, profile: updatedProfile };
    } catch (error: any) {
      console.error("Update profile error:", error);
      toast.error(error.message || "Error updating profile");
      return { success: false, error };
    }
  };

  const createProfile = async (userId: string) => {
    try {
      console.log("Creating profile for user:", userId);
      const newProfile = await createDefaultProfile(userId);
      if (newProfile) {
        setProfile(newProfile);
        // Armazenar o perfil no localStorage após criação
        localStorage.setItem('user_profile', JSON.stringify(newProfile));
      }
      return newProfile;
    } catch (error) {
      console.error("Error creating profile:", error);
      return null;
    }
  };

  return {
    profile,
    setProfile,
    loadProfile,
    updateProfile,
    createProfile
  };
}
