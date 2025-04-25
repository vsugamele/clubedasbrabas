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
import { PlusCircle, RefreshCw, AlertCircle, ShieldAlert, UserCheck, UserX, Info, Trash2, Key, Lock, Unlock, DollarSign, Award, EyeOff, Eye, Power, PowerOff } from 'lucide-react';
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
  is_active?: boolean;
  subscription_type?: 'free' | 'premium' | null;
  subscription_start_date?: string | null;
  subscription_end_date?: string | null;
}

const UserManagement = () => {
  // Estados para gerenciar usuários
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para gerenciar papeis
  const [userRoles, setUserRoles] = useState<{[key: string]: UserRole}>({});
  const [updatingRole, setUpdatingRole] = useState(false);
  const [updatingRoleUserId, setUpdatingRoleUserId] = useState<string | null>(null);
  
  // Estados para alteração de assinatura (gratuito/premium)
  const [updatingSubscription, setUpdatingSubscription] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  
  // Estado para filtro de assinatura
  const [subscriptionFilter, setSubscriptionFilter] = useState<'all' | 'free' | 'premium'>('all');
  
  // Estados para criação de novo usuário
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [creatingUser, setCreatingUser] = useState(false);
  
  // Estado para dar feedback durante a atualização
  const [refreshing, setRefreshing] = useState(false);
  
  // Estado para gerenciar reset de senha
  const [newPassword, setNewPassword] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
  
  // Estado para exclusão de usuário
  const [deletingUser, setDeletingUser] = useState(false);
  
  // Estado para ativação/inativação de usuário
  const [updatingActiveStatus, setUpdatingActiveStatus] = useState(false);
  const [updatingActiveUserId, setUpdatingActiveUserId] = useState<string | null>(null);
  
  // Estado para filtro de status de ativação
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Buscar perfis de usuários
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      // Garantir que todos os usuários tenham a propriedade is_active definida
      const usersWithActiveStatus = (data || []).map(user => ({
        ...user,
        is_active: user.is_active === undefined ? true : user.is_active
      }));
      
      setUsers(usersWithActiveStatus);
      
      // Buscar papéis de usuários
      await fetchUserRoles(usersWithActiveStatus);
      
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Falha ao buscar usuários: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };

  const toggleSubscriptionType = async (userId: string, currentType: 'free' | 'premium' | null) => {
    try {
      setUpdatingSubscription(true);
      setUpdatingUserId(userId);
      
      // Determinar o novo tipo de assinatura
      const newType = currentType === 'premium' ? 'free' : 'premium';
      console.log(`Alterando tipo de assinatura do usuário ${userId} de ${currentType || 'indefinido'} para ${newType}`);
      
      // Calcular datas de assinatura para planos premium
      const currentDate = new Date();
      const oneYearLater = new Date(currentDate);
      oneYearLater.setFullYear(currentDate.getFullYear() + 1);
      
      // Atualizar o tipo de assinatura no banco de dados
      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_type: newType,
          subscription_start_date: newType === 'premium' ? currentDate.toISOString() : null,
          subscription_end_date: newType === 'premium' ? oneYearLater.toISOString() : null
        })
        .eq('id', userId);
      
      if (error) {
        throw error;
      }
      
      // Atualizar o estado local
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? {
                ...user,
                subscription_type: newType,
                subscription_start_date: newType === 'premium' ? currentDate.toISOString() : null,
                subscription_end_date: newType === 'premium' ? oneYearLater.toISOString() : null
              }
            : user
        )
      );
      
      toast.success(`Assinatura alterada para ${newType === 'premium' ? 'Premium' : 'Gratuito'} com sucesso`);
    } catch (error: any) {
      console.error('Erro ao alterar tipo de assinatura:', error);
      toast.error(`Falha ao alterar tipo de assinatura: ${error.message}`);
    } finally {
      setUpdatingSubscription(false);
      setUpdatingUserId(null);
    }
  };

  const toggleUserActiveStatus = async (userId: string, currentStatus: boolean = true) => {
    try {
      setUpdatingActiveStatus(true);
      setUpdatingActiveUserId(userId);
      
      // Determinar o novo status
      const newStatus = !currentStatus;
      console.log(`Alterando status do usuário ${userId} de ${currentStatus ? 'ativo' : 'inativo'} para ${newStatus ? 'ativo' : 'inativo'}`);
      
      // Atualizar o status no banco de dados
      const { error } = await supabase
        .from('profiles')
        .update({
          is_active: newStatus
        })
        .eq('id', userId);
      
      if (error) {
        throw error;
      }
      
      // Atualizar o estado local
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? {
                ...user,
                is_active: newStatus
              }
            : user
        )
      );
      
      toast.success(`Usuário ${newStatus ? 'ativado' : 'inativado'} com sucesso`);
    } catch (error: any) {
      console.error('Erro ao alterar status do usuário:', error);
      toast.error(`Falha ao alterar status do usuário: ${error.message}`);
    } finally {
      setUpdatingActiveStatus(false);
      setUpdatingActiveUserId(null);
    }
  };

  const getFilteredUsers = () => {
    let filteredUsers = users;
    
    // Filtrar por tipo de assinatura
    if (subscriptionFilter !== 'all') {
      filteredUsers = filteredUsers.filter(user => user.subscription_type === subscriptionFilter);
    }
    
    // Filtrar por status de ativação
    if (activeFilter !== 'all') {
      filteredUsers = filteredUsers.filter(user => {
        const isActive = user.is_active === undefined ? true : user.is_active;
        return activeFilter === 'active' ? isActive : !isActive;
      });
    }
    
    return filteredUsers;
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Gerenciamento de Usuários</CardTitle>
          <CardDescription>Gerencie contas de usuários e papéis</CardDescription>
        </div>
        <div className="flex flex-col sm:flex-row justify-between mb-6 gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select
              value={subscriptionFilter}
              onValueChange={(value) => setSubscriptionFilter(value as 'all' | 'free' | 'premium')}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Planos</SelectItem>
                <SelectItem value="free">Plano Gratuito</SelectItem>
                <SelectItem value="premium">Plano Premium</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={activeFilter}
              onValueChange={(value) => setActiveFilter(value as 'all' | 'active' | 'inactive')}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Usuários</SelectItem>
                <SelectItem value="active">Usuários Ativos</SelectItem>
                <SelectItem value="inactive">Usuários Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
                  onClick={() => {}}
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
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
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
                  <TableHead>Plano</TableHead>
                  <TableHead className="w-[120px] text-center">Status</TableHead>
                  <TableHead className="w-[120px] text-center">Ativo/Inativo</TableHead>
                  <TableHead className="w-[100px] text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getFilteredUsers().map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.full_name || user.username || "N/A"}
                    </TableCell>
                    <TableCell>
                      {user.email || "N/A"}
                    </TableCell>
                    <TableCell>{user.contact || "Não disponível"}</TableCell>
                    <TableCell>{user.created_at}</TableCell>
                    <TableCell>{user.last_sign_in_at}</TableCell>
                    <TableCell>
                      <Badge className="bg-blue-100 text-blue-800">
                        {getUserRoleFromCache(user.id)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={user.subscription_type === 'premium' ? "default" : "secondary"}
                        className={user.subscription_type === 'premium' ? "bg-amber-500 hover:bg-amber-600" : ""}
                      >
                        <div className="flex items-center">
                          {user.subscription_type === 'premium' ? (
                            <>
                              <Award className="mr-1 h-3 w-3" />
                              <span>Premium</span>
                            </>
                          ) : (
                            <>
                              <span>Gratuito</span>
                            </>
                          )}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={user.last_sign_in_at ? "success" : "destructive"}
                        className="mx-auto"
                      >
                        {user.last_sign_in_at ? "Acessou" : "Nunca Acessou"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {updatingActiveStatus && updatingActiveUserId === user.id ? (
                        <Button variant="ghost" size="icon" disabled>
                          <LoadingSpinner className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant={user.is_active ? "ghost" : "destructive"}
                          size="icon"
                          onClick={() => toggleUserActiveStatus(user.id, !!user.is_active)}
                          title={user.is_active ? "Inativar Usuário" : "Ativar Usuário"}
                          className="mx-auto"
                        >
                          {user.is_active ? (
                            <PowerOff className="h-4 w-4" />
                          ) : (
                            <Power className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      <Badge
                        variant={user.is_active ? "outline" : "destructive"}
                        className="ml-2"
                      >
                        {user.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        {/* Seletor para escolher plano gratuito/premium */}
                        <Select
                          value={user.subscription_type || 'free'}
                          onValueChange={(value) => toggleSubscriptionType(user.id, value as 'free' | 'premium')}
                          disabled={updatingSubscription && updatingUserId === user.id}
                        >
                          <SelectTrigger className={`w-[120px] ${user.subscription_type === 'premium' ? 'border-amber-500 text-amber-500' : ''}`}>
                            <SelectValue>
                              {updatingSubscription && updatingUserId === user.id ? (
                                <div className="flex items-center"><LoadingSpinner size="sm" /><span className="ml-2">Alterando...</span></div>
                              ) : (
                                <div className="flex items-center">
                                  {user.subscription_type === 'premium' && <Award className="mr-2 h-4 w-4" />}
                                  <span>{user.subscription_type === 'premium' ? 'Premium' : 'Free'}</span>
                                </div>
                              )}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="free">Free</SelectItem>
                            <SelectItem value="premium">
                              <div className="flex items-center">
                                <Award className="mr-2 h-4 w-4" />
                                <span>Premium</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        
                        {/* Botão para alterar senha */}
                        <Dialog open={resetPasswordModalOpen && selectedUserId === user.id} onOpenChange={(open) => {
                          if (!open) {
                            setResetPasswordModalOpen(false);
                            setResetPasswordDialogOpen(false);
                            setNewPassword('');
                            setConfirmPassword('');
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="icon"
                              className="h-10 w-10"
                              onClick={() => {
                                setSelectedUserId(user.id);
                                setSelectedUserEmail(getUserDisplayEmail(user));
                                setResetPasswordDialogOpen(true);
                              }}
                            >
                              <Key className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Redefinir Senha</DialogTitle>
                              <DialogDescription>
                                Enviar email de redefinição de senha para {selectedUserEmail}.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                              <p className="text-sm text-muted-foreground mb-4">
                                Um email será enviado para o usuário com instruções para redefinir sua senha.
                                O usuário precisará clicar no link recebido para definir uma nova senha.
                              </p>
                            </div>
                            <DialogFooter>
                              <Button 
                                type="submit" 
                                onClick={resetUserPassword}
                                disabled={updatingPassword}
                              >
                                {updatingPassword ? <LoadingSpinner size="sm" /> : 'Enviar Email de Redefinição'}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        
                        {/* Botão para ativar/inativar usuário */}
                        <Button 
                          variant={user.is_active ? "destructive" : "outline"} 
                          size="icon"
                          className="h-10 w-10"
                          onClick={() => toggleUserStatus(user.id, user.is_active || false)}
                          disabled={updatingUserStatus && updatingUserId === user.id}
                        >
                          {updatingUserStatus && updatingUserId === user.id ? (
                            <LoadingSpinner size="sm" />
                          ) : user.is_active ? (
                            <Lock className="h-4 w-4" />
                          ) : (
                            <Unlock className="h-4 w-4" />
                          )}
                        </Button>
                        
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
