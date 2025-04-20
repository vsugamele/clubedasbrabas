/**
 * Utilitários para verificação de administradores
 */

/**
 * Lista centralizada de emails de administradores
 * Mantenha esta lista atualizada com todos os emails de administradores
 * O banco de dados foi atualizado para refletir esses mesmos valores
 */
export const ADMIN_EMAILS = [
  'souzadecarvalho1986@gmail.com',
  'vsugamele@gmail.com',
  'admin@example.com',
  'superadmin@example.com',
  'ipcompanidigital@gmail.com', // adicionado para teste se necessário
  'tech@yourcompany.com'
  // vinaum123@gmail.com removido da lista de administradores
];

/**
 * Verifica se um email pertence a um administrador
 * 
 * NOTA: Esta função utiliza apenas a lista estática de administradores
 * O banco já foi atualizado manualmente para espelhar a mesma lista
 * 
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

// Como a função principal agora é síncrona, providenciamos um alias por compatibilidade
export const isAdminByEmailSync = isAdminByEmail;

/**
 * Verifica se o usuário atual é administrador
 * @param userEmail Email do usuário atual
 * @returns true se o usuário é administrador, false caso contrário
 */
export const isCurrentUserAdmin = (userEmail: string | null | undefined): boolean => {
  return isAdminByEmail(userEmail);
};

// Por compatibilidade, mantemos a versão sync como alias da função principal
export const isCurrentUserAdminSync = isCurrentUserAdmin;
