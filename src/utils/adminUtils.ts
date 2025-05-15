/**
 * Utilitários para verificação de administradores
 */
import { supabase } from "@/integrations/supabase/client";

/**
 * Lista centralizada de emails de administradores
 * Mantenha esta lista atualizada com todos os emails de administradores
 * Usada como fallback se a verificação no banco de dados falhar
 */
export const ADMIN_EMAILS = [
  'souzadecarvalho1986@gmail.com',
  'vsugamele@gmail.com',
  'admin@example.com',
  'superadmin@example.com',
  'ipcompanidigital@gmail.com', // adicionado para teste se necessário
  'tech@yourcompany.com',
  'jpjpfreitasestudo@gmail.com' // adicionado conforme solicitado
];

/**
 * Verifica se um email pertence a um administrador
 * 
 * NOTA: Esta função foi atualizada para primeiro verificar no banco de dados
 * e usar a lista estática de administradores como fallback
 * 
 * @param email Email a ser verificado
 * @returns true se o email pertence a um administrador, false caso contrário
 */
export const isAdminByEmail = async (email: string | null | undefined): Promise<boolean> => {
  if (!email) return false;
  
  // Normaliza o email para minúsculas para garantir comparação consistente
  const normalizedEmail = email.toLowerCase();
  
  // Lista hardcoded de emails críticos que SEMPRE devem ter permissão de administrador
  // Isto garante que mesmo que a lista principal falhe, esses usuários ainda terão acesso
  const criticalAdmins = [
    'vsugamele@gmail.com',
    'souzadecarvalho1986@gmail.com',
    'admin@example.com',
    'jpjpfreitasestudo@gmail.com' // adicionado como admin crítico
  ].map(e => e.toLowerCase());
  
  // Verifica se é um admin crítico primeiro (bypass imediato)
  if (criticalAdmins.includes(normalizedEmail)) {
    console.log(`Admin crítico identificado: ${normalizedEmail}`);
    return true;
  }
  
  try {
    // 1. Primeiro tenta verificar no banco de dados
    const { data, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('email', normalizedEmail)
      .single();
    
    if (!error && data && data.is_admin === true) {
      console.log(`Admin verificado no banco de dados: ${normalizedEmail}`);
      return true;
    }
    
    // 2. Se falhou ou retornou falso, verifica na lista de backup
    const isInList = ADMIN_EMAILS.map(e => e.toLowerCase()).includes(normalizedEmail);
    
    if (isInList) {
      console.log(`Admin da lista oficial identificado: ${normalizedEmail}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Erro ao verificar status de admin no banco:', error);
    
    // 3. Em caso de erro, recorre à lista estática
    return ADMIN_EMAILS.map(e => e.toLowerCase()).includes(normalizedEmail);
  }
};

// Função síncrona para compatibilidade com código existente
export const isAdminByEmailSync = (email: string | null | undefined): boolean => {
  if (!email) return false;
  
  // Normaliza o email para minúsculas para garantir comparação consistente
  const normalizedEmail = email.toLowerCase();
  
  // Versão síncrona que apenas verifica a lista de emails (para manter compatibilidade)
  const criticalAdmins = [
    'vsugamele@gmail.com',
    'souzadecarvalho1986@gmail.com',
    'admin@example.com',
    'jpjpfreitasestudo@gmail.com'
  ].map(e => e.toLowerCase());
  
  // Verifica se é um admin crítico
  if (criticalAdmins.includes(normalizedEmail)) {
    return true;
  }
  
  // Verifica na lista oficial
  return ADMIN_EMAILS.map(e => e.toLowerCase()).includes(normalizedEmail);
};

/**
 * Verifica se o usuário atual é administrador
 * @param userEmail Email do usuário atual
 * @returns true se o usuário é administrador, false caso contrário
 */
export const isCurrentUserAdmin = async (userEmail: string | null | undefined): Promise<boolean> => {
  return await isAdminByEmail(userEmail);
};

// Por compatibilidade, mantemos a versão sync como alias da função principal
export const isCurrentUserAdminSync = isCurrentUserAdmin;
