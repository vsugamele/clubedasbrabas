// This file handles the user management in the admin panel
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { assignUserRole, getUserRole, getAllUserRoles, isAdminByEmail } from "./hooks/utils/roleUtils";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { UserRole } from './hooks/types';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlusCircle, RefreshCw, AlertCircle, ShieldAlert, UserCheck, UserX, Info, Trash2 } from 'lucide-react';
import { retryOperation } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface UserData {
  id: string;
  email?: string | null;
  username?: string | null;
  full_name?: string | null;
  contact?: string | null;
  last_sign_in_at?: string | null;
  created_at?: string | null;
}

const UserManagement = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingRole, setUpdatingRole] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [userRoles, setUserRoles] = useState<{[key: string]: UserRole}>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [creatingUser, setCreatingUser] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  const [deletingUser, setDeletingUser] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      
      // Create a map to store combined user data
      const usersMap = new Map<string, UserData>();

      // First try to use auth API to get detailed user information
      try {
        const { data, error } = await supabase.auth.admin.listUsers();
        
        if (!error && data?.users && Array.isArray(data.users)) {
          console.log('Users fetched from auth API:', data.users.length);
          
          // Add users from auth API
          data.users.forEach((user: any) => {
            if (user && typeof user === 'object' && 'id' in user) {
              usersMap.set(user.id, {
                id: user.id,
                email: user.email,
                created_at: user.created_at,
                last_sign_in_at: user.last_sign_in_at,
                contact: null,
                full_name: null,
                username: null
              });
            }
          });
        } else {
          console.warn('Auth API access error or no users returned:', error);
        }
      } catch (adminError) {
        console.error('Error with admin API:', adminError);
      }
      
      // If admin API failed, try to get users from profiles table
      if (usersMap.size === 0) {
        try {
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, username, full_name, updated_at');
          
          if (!profilesError && profilesData && profilesData.length > 0) {
            console.log('Users fetched from profiles table:', profilesData.length);
            
            // Add profiles data to the map
            profilesData.forEach(profile => {
              usersMap.set(profile.id, {
                id: profile.id,
                email: profile.username, 
                username: profile.username,
                full_name: profile.full_name,
                contact: null, 
                last_sign_in_at: null,
                created_at: profile.updated_at 
              });
            });
          } else {
            console.warn('Profiles table access error or no profiles returned:', profilesError);
          }
        } catch (profilesError) {
          console.error('Error fetching profiles:', profilesError);
        }
      }
      
      // Last resort: get current user only
      if (usersMap.size === 0) {
        const { data: userData } = await supabase.auth.getUser();
        if (userData && userData.user) {
          usersMap.set(userData.user.id, {
            id: userData.user.id,
            email: userData.user.email,
            created_at: userData.user.created_at,
            last_sign_in_at: userData.user.last_sign_in_at,
            contact: null,
            full_name: null,
            username: null
          });
        } else {
          setErrorMessage("Não foi possível obter informações de usuários. Verifique se você está autenticado e tem permissões suficientes.");
        }
      }
      
      // Convert map to array
      const usersArray = Array.from(usersMap.values());
      
      if (usersArray.length === 0) {
        setErrorMessage("Não foi possível obter a lista de usuários. Acesso limitado ou nenhum usuário encontrado.");
      }
      
      setUsers(usersArray);
      fetchUserRoles(usersArray);
    } catch (error: any) {
      console.error('Error fetching users:', error.message);
      setErrorMessage(`Falha ao carregar usuários: ${error.message}`);
      toast.error('Falha ao carregar usuários. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRoles = async (users: UserData[]) => {
    try {
      // Get all user roles at once to reduce API calls
      const allUserRoles = await getAllUserRoles();
      
      const rolesMap: {[key: string]: UserRole} = {};
      
      // Use a type guard to ensure we only process valid role data
      if (Array.isArray(allUserRoles)) {
        allUserRoles.forEach((roleData: any) => {
          if (roleData && typeof roleData === 'object' && 'user_id' in roleData && 'role' in roleData) {
            rolesMap[roleData.user_id] = roleData.role as UserRole;
          }
        });
      }
      
      // Ensure current user has a role if they are in admin emails
      for (const user of users) {
        if (!rolesMap[user.id] && user.email && isAdminByEmail(user.email)) {
          // First user in the system might need a role
          try {
            const success = await assignUserRole(user.id, 'admin');
            if (success) {
              rolesMap[user.id] = 'admin';
              console.log(`Atribuído papel admin para ${user.email} (${user.id}) por estar na lista de emails privilegiados`);
            }
          } catch (err) {
            console.error('Error assigning initial admin role:', err);
          }
        }
        
        // Set default role if none found
        if (!rolesMap[user.id]) {
          rolesMap[user.id] = 'user';
        }
      }
      
      console.log("Papéis de usuários carregados:", rolesMap);
      setUserRoles(rolesMap);
      
      // Salvar os papéis no localStorage para persistência entre navegações
      localStorage.setItem('userRoles', JSON.stringify(rolesMap));
    } catch (error: any) {
      console.error('Error fetching user roles:', error.message);
      toast.error('Erro ao buscar funções de usuários');
      
      // Tentar recuperar do localStorage se falhar
      const savedRoles = localStorage.getItem('userRoles');
      if (savedRoles) {
        try {
          const parsedRoles = JSON.parse(savedRoles);
          setUserRoles(parsedRoles);
          console.log("Papéis recuperados do localStorage");
        } catch (e) {
          console.error("Erro ao recuperar papéis do localStorage:", e);
        }
      }
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'moderator':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      setUpdatingUserId(userId);
      setUpdatingRole(true);
      
      console.log(`Attempting to assign role ${newRole} to user ${userId}`);
      const success = await assignUserRole(userId, newRole);
      
      if (success) {
        // Update the local state
        const updatedRoles = {
          ...userRoles,
          [userId]: newRole
        };
        
        setUserRoles(updatedRoles);
        
        // Salvar no localStorage para persistência
        localStorage.setItem('userRoles', JSON.stringify(updatedRoles));
        
        toast.success(`Papel atualizado para ${newRole} com sucesso`);
      } else {
        toast.error('Falha ao atualizar papel. Por favor, tente novamente.');
        setShowTroubleshooting(true);
      }
    } catch (error: any) {
      console.error('Error updating role:', error.message);
      toast.error(`Erro ao atualizar papel: ${error.message}`);
      setShowTroubleshooting(true);
    } finally {
      setUpdatingRole(false);
      setUpdatingUserId(null);
    }
  };

  const getUserRoleFromCache = (userId: string): UserRole => {
    return userRoles[userId] || 'user';
  };
  
  const createNewUser = async () => {
    try {
      setCreatingUser(true);
      
      if (!newUserEmail || !newUserPassword) {
        toast.error('Email e senha são obrigatórios');
        return;
      }
      
      // First try with admin API
      let userData;
      try {
        const { data, error } = await supabase.auth.admin.createUser({
          email: newUserEmail,
          password: newUserPassword,
          email_confirm: true
        });
        
        if (error) throw error;
        userData = data.user;
        
        // Also assign the default role
        if (userData) {
          await assignUserRole(userData.id, 'user');
        }
      } catch (adminError) {
        console.error('Admin user creation failed:', adminError);
        
        // Fallback to regular signup (user will need to confirm email)
        const { data, error } = await supabase.auth.signUp({
          email: newUserEmail,
          password: newUserPassword
        });
        
        if (error) throw error;
        userData = data.user;
        
        toast.info(
          'Usuário criado, mas precisará confirmar o email',
          { 
            description: 'Você não tem permissões de admin do Supabase para criar usuários diretamente.' 
          }
        );
      }
      
      if (userData) {
        toast.success('Usuário criado com sucesso');
        setDialogOpen(false);
        setNewUserEmail('');
        setNewUserPassword('');
        
        // Refresh the users list
        await fetchUsers();
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(`Falha ao criar usuário: ${error.message}`);
    } finally {
      setCreatingUser(false);
    }
  };
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };

  // Função para deletar um usuário
  const deleteUser = async (userId: string) => {
    try {
      setDeletingUser(true);
      
      // Primeiro, verificar se o usuário existe
      const userToDelete = users.find(user => user.id === userId);
      if (!userToDelete) {
        toast.error("Usuário não encontrado");
        return;
      }
      
      // Deletar o usuário
      const { error } = await supabase.auth.admin.deleteUser(userId);
      
      if (error) {
        console.error("Erro ao deletar usuário:", error);
        
        // Se não tiver permissão de admin, tentar deletar apenas o perfil
        if (error.message.includes("not authorized") || error.message.includes("permission")) {
          toast.info("Tentando deletar apenas o perfil do usuário...");
          
          // Deletar o perfil do usuário
          const { error: profileError } = await supabase
            .from('profiles')
            .delete()
            .eq('id', userId);
            
          if (profileError) {
            toast.error(`Erro ao deletar perfil: ${profileError.message}`);
            return;
          }
          
          toast.success("Perfil do usuário deletado com sucesso");
          setUsers(users.filter(user => user.id !== userId));
          return;
        }
        
        toast.error(`Erro ao deletar usuário: ${error.message}`);
        return;
      }
      
      toast.success("Usuário deletado com sucesso");
      
      // Atualizar a lista de usuários
      setUsers(users.filter(user => user.id !== userId));
    } catch (error: any) {
      console.error("Erro ao deletar usuário:", error);
      toast.error(`Erro ao deletar usuário: ${error.message}`);
    } finally {
      setDeletingUser(false);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Desconhecido";
    
    try {
      return new Date(dateString).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return "Formato inválido";
    }
  };

  // Função para obter o email ou identificador do usuário para exibição
  const getUserDisplayEmail = (user: UserData): string => {
    // Priorizar o email completo quando disponível
    if (user.email) {
      return user.email;
    }
    
    // Usar o nome de usuário como fallback
    if (user.username) {
      return user.username;
    }
    
    // Último caso, usar o ID do usuário
    return `Usuário ${user.id.substring(0, 8)}...`;
  };

  // Função para executar a correção da política RLS
  const fixRlsPolicy = async () => {
    try {
      toast.info("Tentando corrigir políticas de segurança...");
      
      // Executar a função RPC para corrigir as políticas
      // Usando uma abordagem mais segura para evitar erros de tipo
      const { data, error } = await supabase.rpc(
        'fix_user_roles_policies' as any, // Usamos 'as any' para contornar a verificação de tipo
        {}
      );
      
      if (error) {
        console.error("Erro ao corrigir políticas:", error);
        toast.error(`Erro ao corrigir políticas: ${error.message}`);
        
        // Se a função não existir, mostrar instruções
        if (error.code === '42883') {
          toast.info(
            "Função de correção não encontrada no banco de dados",
            { 
              description: "É necessário executar o script SQL para criar a função de correção.",
              duration: 8000
            }
          );
        }
        return false;
      }
      
      toast.success("Políticas de segurança corrigidas com sucesso!");
      return true;
    } catch (error: any) {
      console.error("Erro ao tentar corrigir políticas:", error);
      toast.error(`Erro ao tentar corrigir políticas: ${error.message}`);
      return false;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Gerenciamento de Usuários</CardTitle>
          <CardDescription>Gerencie contas de usuários e papéis</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            size="sm"
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-[#ff4400] hover:bg-[#ff4400]/90">
                <PlusCircle className="h-4 w-4 mr-1" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Usuário</DialogTitle>
                <DialogDescription>
                  Crie uma nova conta de usuário no sistema.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="email" className="text-right">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="col-span-3"
                    placeholder="usuario@exemplo.com"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="password" className="text-right">
                    Senha
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="col-span-3"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="submit" 
                  onClick={createNewUser}
                  disabled={creatingUser || !newUserEmail || !newUserPassword}
                >
                  {creatingUser ? <LoadingSpinner size="sm" /> : 'Criar Usuário'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {errorMessage && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        
        {showTroubleshooting && (
          <Alert className="mb-4 bg-amber-50 border-amber-200">
            <Info className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">Problemas com atribuição de papéis</AlertTitle>
            <AlertDescription className="text-amber-700">
              <p className="mb-2">Detectamos um problema com as políticas de segurança do banco de dados ao atribuir papéis de usuário.</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 border-amber-300 bg-amber-100 hover:bg-amber-200"
                onClick={fixRlsPolicy}
              >
                <ShieldAlert className="h-4 w-4 mr-1 text-amber-600" />
                Corrigir Políticas de Segurança
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <LoadingSpinner size="lg" />
            <span className="ml-2">Carregando usuários...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum usuário encontrado
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Último login</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.full_name || user.username || "N/A"}
                    </TableCell>
                    <TableCell>
                      {user.email || "N/A"}
                      {user.email && isAdminByEmail(user.email) && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant="outline" className="ml-2 bg-purple-100 text-purple-800 border-purple-200">
                                <ShieldAlert className="h-3 w-3 mr-1" />
                                Admin por Email
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Este usuário é administrador por estar na lista de emails privilegiados</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </TableCell>
                    <TableCell>{user.contact || "Não disponível"}</TableCell>
                    <TableCell>{formatDate(user.created_at)}</TableCell>
                    <TableCell>{formatDate(user.last_sign_in_at)}</TableCell>
                    <TableCell>
                      <Badge className={getRoleColor(getUserRoleFromCache(user.id))}>
                        {getUserRoleFromCache(user.id)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Select
                          value={getUserRoleFromCache(user.id)}
                          onValueChange={(value) => handleRoleChange(user.id, value as UserRole)}
                          disabled={updatingRole && updatingUserId === user.id}
                        >
                          <SelectTrigger className="w-[110px]">
                            <SelectValue placeholder="Selecionar papel" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">Usuário</SelectItem>
                            <SelectItem value="moderator">Moderador</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="destructive" 
                              size="icon"
                              className="h-10 w-10"
                              disabled={deletingUser}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Deletar Usuário</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja deletar o usuário {getUserDisplayEmail(user)}? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                className="bg-red-500 hover:bg-red-600"
                                onClick={() => deleteUser(user.id)}
                              >
                                Deletar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserManagement;
