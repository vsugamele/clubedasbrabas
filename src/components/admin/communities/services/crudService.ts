import { supabase } from "@/integrations/supabase/client";
import { Community, CommunityForm, mapCommunityFromSupabase } from "../types";
import { toast } from "sonner";
import { 
  withTimeout, fetchWithTimeout, SHORT_TIMEOUT, isNetworkRelatedError, asPromise 
} from "@/components/admin/hooks/utils/queryUtils";
import { errorHandler } from "../utils/serviceUtils";

// Helper function to safely map data to Community type
const safeCommunityMapper = (data: any): Community | null => {
  if (!data) return null;
  
  try {
    return {
      id: data.id || String(Date.now()),
      name: data.name || 'Unnamed Community',
      description: data.description || '',
      members: typeof data.members === 'number' ? data.members : 0,
      posts: typeof data.posts === 'number' ? data.posts : 0,
      visibility: (data.visibility as "public" | "private") || 'public',
      postingRestrictions: (data.posting_restrictions as "all_members" | "admin_only") || 'all_members',
      createdAt: data.created_at || new Date().toISOString(),
      updatedAt: data.updated_at,
      categoryId: data.category_id
    };
  } catch (error) {
    console.error("Error mapping community data:", error);
    return null;
  }
};

// Adicionar nova comunidade no Supabase
export const addCommunity = async (form: CommunityForm): Promise<Community | null> => {
  try {
    const communityData = {
      name: form.name,
      description: form.description,
      category_id: form.categoryId,
      visibility: form.visibility,
      posting_restrictions: form.postingRestrictions,
      // Optional fields
      owner_id: form.ownerId,
      is_active: form.isActive,
      is_private: form.isPrivate,
      posting_restricted_to_members: form.postingRestrictedToMembers,
      location: form.location,
      tags: form.tags,
      contact_email: form.contactEmail,
      contact_phone: form.contactPhone,
      website_url: form.websiteUrl,
      social_links: form.socialLinks,
      meeting_details: form.meetingDetails,
      welcome_message: form.welcomeMessage,
      rules: form.rules,
      moderation_policy: form.moderationPolicy,
    };
    
    const insertPromise = async () => {
      return await supabase
        .from('communities')
        .insert({
          name: form.name,
          description: form.description,
          category_id: form.categoryId,
          visibility: form.visibility,
          posting_restrictions: form.postingRestrictions
        } as any)
        .select()
        .single();
    };
    
    const { data, error } = await fetchWithTimeout(insertPromise, SHORT_TIMEOUT);
      
    if (error) {
      errorHandler(error, "Erro ao criar comunidade");
      return null;
    }
    
    if (!data) {
      errorHandler(new Error("No data returned"), "Não foi possível obter os dados da comunidade após a criação");
      return null;
    }
    
    const newCommunity = safeCommunityMapper(data);
    
    if (!newCommunity) {
      errorHandler(new Error("Failed to map community data"), "Erro ao processar dados da comunidade");
      return null;
    }
    
    toast.success(`Comunidade "${form.name}" criada com sucesso`, { position: "bottom-right" });
    console.log("Comunidade criada no Supabase:", newCommunity);
    
    return newCommunity;
  } catch (error: any) {
    errorHandler(error, "Não foi possível criar a comunidade");
    return null;
  }
};

// Atualizar comunidade existente no Supabase
export const updateCommunity = async (id: string, form: CommunityForm): Promise<Community | null> => {
  try {
    const communityData = {
      name: form.name,
      description: form.description,
      visibility: form.visibility,
      posting_restrictions: form.postingRestrictions,
      category_id: form.categoryId,
      // Optional fields
      owner_id: form.ownerId,
      is_active: form.isActive,
      is_private: form.isPrivate,
      posting_restricted_to_members: form.postingRestrictedToMembers,
      location: form.location,
      tags: form.tags,
      contact_email: form.contactEmail,
      contact_phone: form.contactPhone,
      website_url: form.websiteUrl,
      social_links: form.socialLinks,
      meeting_details: form.meetingDetails,
      welcome_message: form.welcomeMessage,
      rules: form.rules,
      moderation_policy: form.moderationPolicy,
    };
    
    const updatePromise = async () => {
      return await supabase
        .from('communities')
        .update({
          name: form.name,
          description: form.description,
          visibility: form.visibility,
          posting_restrictions: form.postingRestrictions,
          category_id: form.categoryId
        } as any)
        .eq('id', id as any)
        .select()
        .single();
    };
    
    const { data, error } = await fetchWithTimeout(updatePromise, SHORT_TIMEOUT);
      
    if (error) {
      errorHandler(error, "Erro ao atualizar comunidade");
      return null;
    }
    
    if (!data) {
      errorHandler(new Error("No data returned"), "Não foi possível obter os dados da comunidade após a atualização");
      return null;
    }
    
    const updatedCommunity = safeCommunityMapper(data);
    
    if (!updatedCommunity) {
      errorHandler(new Error("Failed to map community data"), "Erro ao processar dados da comunidade");
      return null;
    }
    
    toast.success(`Comunidade "${form.name}" atualizada com sucesso`, { position: "bottom-right" });
    console.log("Comunidade atualizada no Supabase:", updatedCommunity);
    
    return updatedCommunity;
  } catch (error: any) {
    errorHandler(error, "Não foi possível atualizar a comunidade");
    return null;
  }
};

// Excluir comunidade do Supabase
export const deleteCommunity = async (id: string, name: string): Promise<boolean> => {
  try {
    const deletePromise = async () => {
      return await supabase
        .from('communities')
        .delete()
        .eq('id', id as any);
    };
    
    const { error } = await fetchWithTimeout(deletePromise, SHORT_TIMEOUT);
      
    if (error) {
      errorHandler(error, "Erro ao excluir comunidade");
      return false;
    }
    
    toast.success(`Comunidade "${name}" excluída com sucesso`, { position: "bottom-right" });
    console.log("Comunidade excluída do Supabase, ID:", id);
    return true;
  } catch (error: any) {
    errorHandler(error, "Não foi possível excluir a comunidade");
    return false;
  }
};
