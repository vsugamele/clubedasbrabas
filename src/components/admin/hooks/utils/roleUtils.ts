// roleUtils.ts - Utility functions for managing user roles
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '../types';
import { toast } from 'sonner';

/**
 * Get the role for a specific user
 */
export const getUserRole = async (userId: string): Promise<UserRole | null> => {
  try {
    // First try to get the role from our database structure
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      // No role record found, assume default role
      if (error.code === 'PGRST116') {
        return 'user';
      }
      
      console.error("Error fetching user role:", error);
      return null;
    }
    
    // Check if data has role property
    if (data && 'role' in data) {
      return data.role as UserRole;
    }
    
    return 'user'; // Default role
  } catch (error) {
    console.error("Error in getUserRole:", error);
    return null;
  }
};

/**
 * Check if a user has specific role
 */
export const hasRole = async (userId: string, role: UserRole): Promise<boolean> => {
  try {
    // First check if user is in admin emails list
    if (role === 'admin') {
      const { data } = await supabase.auth.getUser();
      if (data && data.user && data.user.id === userId && isAdminByEmail(data.user.email)) {
        return true;
      }
    }
    
    // Get the user's role and check if it matches
    const userRole = await getUserRole(userId);
    return userRole === role;
  } catch (error) {
    console.error("Error checking role:", error);
    return false;
  }
};

/**
 * Check if a user is admin
 */
export const isAdmin = async (userId: string): Promise<boolean> => {
  // First check if user is in admin emails list
  const { data } = await supabase.auth.getUser();
  if (data && data.user && data.user.id === userId && isAdminByEmail(data.user.email)) {
    return true;
  }
  
  return await hasRole(userId, 'admin');
};

/**
 * Check if a user is moderator or higher
 */
export const isModeratorOrHigher = async (userId: string): Promise<boolean> => {
  const role = await getUserRole(userId);
  return role === 'moderator' || role === 'admin';
};

/**
 * Assign a role to a user
 */
export const assignUserRole = async (userId: string, role: UserRole): Promise<boolean> => {
  try {
    console.log(`Assigning role ${role} to user ${userId}`);
    
    // Usar uma abordagem que evita a recursão infinita nas políticas RLS
    // Primeiro, verificamos se o usuário atual tem permissão para fazer esta operação
    const { data: currentUser } = await supabase.auth.getUser();
    
    if (!currentUser || !currentUser.user) {
      console.error("Usuário não autenticado");
      toast.error("Você precisa estar autenticado para atribuir papéis");
      return false;
    }
    
    // Verificar se o usuário atual é admin por email (bypass de segurança)
    const isCurrentUserAdminByEmail = isAdminByEmail(currentUser.user.email);
    
    // Usar uma função RPC personalizada para evitar problemas de RLS
    // Esta é uma abordagem mais segura que evita a recursão infinita
    try {
      // Usar tipagem genérica para evitar erros de tipo
      const { data, error } = await supabase.rpc('assign_user_role', {
        target_user_id: userId,
        new_role: role,
        is_admin_by_email: isCurrentUserAdminByEmail
      } as any);
      
      if (error) {
        console.error("Erro ao atribuir papel usando RPC:", error);
        
        // Se a função não existir ou os parâmetros estiverem errados, tentar com os parâmetros antigos
        if (error.code === 'PGRST202' || error.code === '42883') {
          console.log("Tentando com parâmetros alternativos...");
          const { data: altData, error: altError } = await supabase.rpc('assign_user_role', {
            p_user_id: userId,
            p_role: role
          } as any);
          
          if (altError) {
            console.error("Erro com parâmetros alternativos:", altError);
            // Último recurso: método direto
            return await assignUserRoleDirect(userId, role);
          }
          
          console.log("Papel atribuído com sucesso via RPC (parâmetros alternativos)");
          toast.success(`Papel ${role} atribuído com sucesso`);
          return true;
        }
        
        toast.error(`Erro ao atribuir papel: ${error.message}`);
        return false;
      }
      
      console.log("Papel atribuído com sucesso via RPC");
      toast.success(`Papel ${role} atribuído com sucesso`);
      return true;
    } catch (rpcError) {
      console.error("Exceção ao chamar RPC:", rpcError);
      // Fallback para o método direto
      return await assignUserRoleDirect(userId, role);
    }
  } catch (error) {
    console.error("Erro ao atribuir papel:", error);
    toast.error("Erro ao atribuir papel de usuário");
    return false;
  }
};

/**
 * Método direto para atribuir papel (fallback)
 * Este método tenta contornar as políticas RLS usando operações diretas
 */
const assignUserRoleDirect = async (userId: string, role: UserRole): Promise<boolean> => {
  try {
    // Primeiro verificamos se já existe um registro
    const { data: existingRole, error: checkError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (checkError) {
      console.error("Erro ao verificar papel existente:", checkError);
      // Continuamos mesmo com erro, tentando inserir
    }
    
    if (!existingRole) {
      // Não existe papel, inserir novo
      console.log("Nenhum papel existente encontrado, inserindo novo papel");
      
      // Tentar inserção direta como último recurso
      const { error: directInsertError } = await supabase
        .from('user_roles')
        .insert([
          { user_id: userId, role: role }
        ]);
      
      if (directInsertError) {
        console.error("Falha ao inserir papel diretamente:", directInsertError);
        toast.error("Não foi possível atribuir o papel ao usuário");
        return false;
      }
      
      console.log("Papel inserido com sucesso");
      return true;
    } else {
      // Atualizar papel existente
      console.log("Atualizando papel existente");
      
      // Tentar atualizar via API de serviço primeiro
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        userId,
        { user_metadata: { role: role } }
      );
      
      if (updateError) {
        console.error("Falha ao atualizar papel via API de serviço:", updateError);
        
        // Tentar atualização direta como último recurso
        const { error: directUpdateError } = await supabase
          .from('user_roles')
          .update({ role: role })
          .eq('user_id', userId);
        
        if (directUpdateError) {
          console.error("Falha ao atualizar papel diretamente:", directUpdateError);
          throw directUpdateError;
        }
      }
      
      console.log("Papel atualizado com sucesso");
      return true;
    }
  } catch (error) {
    console.error("Erro no método direto de atribuição de papel:", error);
    return false;
  }
};

/**
 * Get a user's current role
 */
export const getCurrentRole = async (userId: string): Promise<UserRole> => {
  try {
    const role = await getUserRole(userId);
    return role || 'user';
  } catch (error) {
    console.error("Error in getCurrentRole:", error);
    return 'user'; // Default to user on error
  }
};

// Alias to maintain compatibility with imports in useAdminRole.ts
export const getCurrentUserRoles = getCurrentRole;

/**
 * Get all user roles
 */
export const getAllUserRoles = async (): Promise<any[]> => {
  try {
    console.log("Buscando todos os papéis de usuários...");
    
    // Primeiro, tentar recuperar do localStorage para evitar problemas de RLS
    const savedRoles = localStorage.getItem('userRoles');
    if (savedRoles) {
      try {
        const parsedRoles = JSON.parse(savedRoles);
        console.log("Papéis recuperados do localStorage:", parsedRoles);
        
        // Converter o objeto em um array de {user_id, role}
        const rolesArray = Object.entries(parsedRoles).map(([user_id, role]) => ({
          user_id,
          role
        }));
        
        return rolesArray;
      } catch (e) {
        console.error("Erro ao recuperar papéis do localStorage:", e);
      }
    }
    
    // Se não tiver no localStorage, tentar buscar do banco de dados
    try {
      // Tentar usar a função RPC sync_user_roles que evita problemas de RLS
      const { data: syncData, error: syncError } = await supabase.rpc('sync_user_roles' as any);
      
      if (!syncError && syncData) {
        console.log("Papéis sincronizados via RPC:", syncData);
        
        // Salvar no localStorage para futuras consultas
        const rolesMap: Record<string, string> = {};
        if (Array.isArray(syncData)) {
          syncData.forEach((role: any) => {
            if (role && typeof role === 'object' && 'user_id' in role && 'role' in role) {
              rolesMap[role.user_id] = role.role;
            }
          });
          localStorage.setItem('userRoles', JSON.stringify(rolesMap));
        }
        
        return syncData as any[];
      }
    } catch (rpcError) {
      console.error("Erro ao sincronizar papéis via RPC:", rpcError);
    }
    
    // Último recurso: buscar diretamente da tabela
    const { data, error } = await supabase
      .from('user_roles')
      .select('*');
    
    if (error) {
      console.error("Error fetching all user roles:", error);
      return [];
    }
    
    // Salvar no localStorage para futuras consultas
    if (data && data.length > 0) {
      const rolesMap: Record<string, string> = {};
      data.forEach(role => {
        if (role && typeof role === 'object' && 'user_id' in role && 'role' in role) {
          rolesMap[role.user_id] = role.role;
        }
      });
      localStorage.setItem('userRoles', JSON.stringify(rolesMap));
    }
    
    return data || [];
  } catch (error) {
    console.error("Error in getAllUserRoles:", error);
    return [];
  }
};

/**
 * Check if a user has a specific role by their user ID
 */
export const checkUserRole = async (userId: string, role: UserRole): Promise<boolean> => {
  return await hasRole(userId, role);
};

/**
 * Check if the current user's email is in admin list
 */
export const isAdminByCurrentEmail = async (): Promise<boolean> => {
  const { data } = await supabase.auth.getUser();
  if (!data || !data.user || !data.user.email) return false;
  
  return isAdminByEmail(data.user.email);
};

/**
 * Check if an email is an admin email
 */
export const isAdminByEmail = (email: string | null | undefined): boolean => {
  if (!email) return false;
  
  // Lista de emails de administradores
  const adminEmails = [
    'admin@example.com',
    'superadmin@example.com',
    'tech@yourcompany.com',
    'vsugamele@gmail.com',
    'souzadecarvalho1986@gmail.com'
  ];
  
  return adminEmails.includes(email.toLowerCase());
};

/**
 * Verify current user's role
 */
export const verifyCurrentUserRole = async (): Promise<boolean> => {
  try {
    const { data } = await supabase.auth.getUser();
    if (!data || !data.user) return false;
    
    // Check if the user is an admin by email first (for initial setup)
    if (isAdminByEmail(data.user.email)) {
      // Automatically assign admin role if they have an admin email
      await assignUserRole(data.user.id, 'admin');
      return true;
    }
    
    return await isAdmin(data.user.id);
  } catch (error) {
    console.error("Error verifying current user role:", error);
    return false;
  }
};

/**
 * Utility function to handle role change
 */
export const handleRoleChange = (userId: string, newRole: UserRole) => async () => {
  try {
    const success = await assignUserRole(userId, newRole);
    
    if (success) {
      toast.success(`Role updated to ${newRole} successfully`);
      return true;
    } else {
      toast.error('Failed to update role');
      return false;
    }
  } catch (error) {
    console.error("Error changing role:", error);
    toast.error('Error updating role');
    return false;
  }
};

/**
 * Função auxiliar para criar um usuário diretamente
 */
export const createUserDirectly = async (email: string, password: string, role: UserRole = 'user'): Promise<boolean> => {
  try {
    // Tentativa de criar usuário com a API de admin
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });
    
    if (error) {
      console.error("Error creating user with admin API:", error);
      return false;
    }
    
    if (data && data.user) {
      // Atribuir papel ao novo usuário
      await assignUserRole(data.user.id, role);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("Error in createUserDirectly:", error);
    return false;
  }
};

// Alias for backward compatibility with existing code
export const AssignRoleForm = assignUserRole;
