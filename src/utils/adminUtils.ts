/**
 * Utilitários para verificação de administradores
 */

/**
 * Lista centralizada de emails de administradores
 * Mantenha esta lista atualizada com todos os emails de administradores
 */
export const ADMIN_EMAILS = [
  'souzadecarvalho1986@gmail.com',
  'vsugamele@gmail.com',
  'admin@example.com',
  'superadmin@example.com',
  'tech@yourcompany.com'
];

/**
 * Verifica se um email pertence a um administrador
 * @param email Email a ser verificado
 * @returns true se o email pertence a um administrador, false caso contrário
 */
export const isAdminByEmail = (email: string | null | undefined): boolean => {
  if (!email) return false;
  
  // Normaliza o email para minúsculas para garantir comparação consistente
  const normalizedEmail = email.toLowerCase();
  
  // Verifica se o email está na lista de administradores
  return ADMIN_EMAILS.map(e => e.toLowerCase()).includes(normalizedEmail);
};

/**
 * Verifica se o usuário atual é administrador
 * @param userEmail Email do usuário atual
 * @returns true se o usuário é administrador, false caso contrário
 */
export const isCurrentUserAdmin = (userEmail: string | null | undefined): boolean => {
  return isAdminByEmail(userEmail);
};
