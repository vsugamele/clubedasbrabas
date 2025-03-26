
import { supabase } from "@/integrations/supabase/client";
import { ProfileType } from "./types";

export const fetchProfile = async (userId: string): Promise<ProfileType | null> => {
  try {
    console.log("Fetching profile for user:", userId);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log("No profile found for user", userId);
        return null;
      }
      console.error("Error fetching profile:", error);
      return null;
    }

    console.log("Profile fetched:", data);
    
    // Convert the data to ProfileType with default values for missing fields
    if (data) {
      // Add default values for fields that might be missing from the database
      const profile: ProfileType = {
        id: data.id,
        full_name: data.full_name || '',
        avatar_url: data.avatar_url || '',
        bio: data.bio || null,
        username: data.username || '',
        updated_at: data.updated_at || new Date().toISOString(),
        // Default values for fields not in the database
        created_at: new Date().toISOString(),
        email: null,
        is_public: true,
        headline: data.headline || null,
        location: data.location || null,
        language: data.language || null,
        timezone: data.timezone || null
      };
      return profile;
    }
    
    return null;
  } catch (error: any) {
    console.error("Exception fetching profile:", error.message);
    return null;
  }
};

export const createDefaultProfile = async (userId: string): Promise<ProfileType | null> => {
  try {
    console.log("Creating default profile for user:", userId);
    const { data: userData } = await supabase.auth.getUser();
    const email = userData?.user?.email || '';
    const username = email ? email.split('@')[0] : `user_${Date.now()}`;
    
    // Only include fields that exist in the database schema
    const { data, error } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        username: username,
        full_name: username,
        avatar_url: ''
      })
      .select()
      .single();
      
    if (error) {
      console.error("Error creating default profile:", error);
      return null;
    }
    
    console.log("Default profile created:", data);
    
    // Convert the data to ProfileType with default values for missing fields
    if (data) {
      const profile: ProfileType = {
        id: data.id,
        full_name: data.full_name || '',
        avatar_url: data.avatar_url || '',
        bio: data.bio || null,
        username: data.username || '',
        updated_at: data.updated_at || new Date().toISOString(),
        // Default values for fields not in the database
        created_at: new Date().toISOString(),
        email: email,
        is_public: true,
        headline: data.headline || null,
        location: data.location || null,
        language: data.language || null,
        timezone: data.timezone || null
      };
      return profile;
    }
    
    return null;
  } catch (error: any) {
    console.error("Exception creating default profile:", error.message);
    return null;
  }
};
