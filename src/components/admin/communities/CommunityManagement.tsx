import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Pencil, Trash2, Table, LayoutGrid, Search } from 'lucide-react';
import { BasicCommunityDialog } from './BasicCommunityDialog';
import { Community, CommunityForm } from './types';
import * as communityService from './communityService';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { syncCategories } from './categoryIntegration';
import { Input } from '@/components/ui/input';
import { CommunityCard } from './CommunityCard';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';

export function CommunityManagement() {
  // Refs para controle de estado
  const isLoadingRef = useRef(false);
  const isSubmittingRef = useRef(false);
  
  // Estados
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [isGridView, setIsGridView] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [communityForm, setCommunityForm] = useState<CommunityForm>({
    name: "",
    description: "",
    visibility: "public",
    postingRestrictions: "all_members",
    categoryId: ""
  });

  // Filtrar comunidades com base no termo de busca
  const filteredCommunities = communities.filter(community => {
    const searchTermLower = searchTerm.toLowerCase();
    const name = (community.name || "").toLowerCase();
    const description = (community.description || "").toLowerCase();
    
    return name.includes(searchTermLower) || description.includes(searchTermLower);
  });

  // Carregar comunidades
  const loadCommunities = useCallback(async () => {
    if (isLoadingRef.current) return;
    
    try {
      isLoadingRef.current = true;
      setLoading(true);
      
      const data = await communityService.fetchCommunities();
      setCommunities(data || []);
    } catch (error) {
      console.error("Erro ao carregar comunidades:", error);
      toast.error("Erro ao carregar comunidades");
    } finally {
      isLoadingRef.current = false;
      setLoading(false);
    }
  }, []);

  // Carregar comunidades na montagem do componente
  useEffect(() => {
    loadCommunities();
  }, [loadCommunities]);

  // Resetar o formulário
  const resetFormState = useCallback(() => {
    setCommunityForm({
      name: "",
      description: "",
      visibility: "public",
      postingRestrictions: "all_members",
      categoryId: ""
    });
    setSelectedCommunity(null);
  }, []);

  // Abrir diálogo para adicionar
  const openAddDialog = useCallback(() => {
    resetFormState();
    setDialogOpen(true);
  }, [resetFormState]);

  // Manipular clique no botão de edição
  const handleEditClick = useCallback((community: Community) => {
    console.log("Iniciando edição da comunidade:", community.name);
    
    // Primeiro, definir os dados da comunidade selecionada
    setSelectedCommunity(community);
    
    // Depois, atualizar o formulário com os dados da comunidade
    setCommunityForm({
      name: community.name || "",
      description: community.description || "",
      visibility: community.visibility || "public",
      postingRestrictions: community.postingRestrictions || "all_members",
      categoryId: community.categoryId || ""
    });
    
    // Por último, abrir o diálogo com um pequeno atraso para garantir que o estado foi atualizado
    setTimeout(() => {
      setDialogOpen(true);
    }, 100);
  }, []);

  // Manipular clique no botão de exclusão
  const handleDeleteClick = useCallback((community: Community) => {
    setSelectedCommunity(community);
    setDeleteDialogOpen(true);
  }, []);

  // Manipular alterações no formulário
  const handleFormChange = useCallback((field: keyof CommunityForm, value: string) => {
    console.log(`Campo ${field} alterado para:`, value);
    
    setCommunityForm(prevForm => {
      const newForm = {
        ...prevForm,
        [field]: value
      };
      console.log("Novo estado do formulário:", newForm);
      return newForm;
    });
  }, []);

  // Manipular envio do formulário
  const handleFormSubmit = useCallback(async (form: CommunityForm) => {
    if (isSubmittingRef.current) {
      console.log("Já existe uma submissão em andamento, ignorando...");
      return;
    }
    
    if (!form.name || form.name.trim() === "") {
      toast.error("O nome da comunidade é obrigatório");
      return;
    }
    
    console.log("Enviando formulário:", form);
    
    try {
      isSubmittingRef.current = true;
      
      if (selectedCommunity) {
        // Editar comunidade existente
        console.log(`Atualizando comunidade ${selectedCommunity.id}:`, form);
        await communityService.updateCommunity(selectedCommunity.id, form);
        toast.success("Comunidade atualizada com sucesso!");
      } else {
        // Adicionar nova comunidade
        console.log("Criando nova comunidade:", form);
        await communityService.addCommunity(form);
        toast.success("Comunidade criada com sucesso!");
      }
      
      // Forçar sincronização de categorias
      await syncCategories();
      
      // Recarregar comunidades e fechar diálogo
      await loadCommunities();
      setDialogOpen(false);
      resetFormState();
    } catch (error) {
      console.error("Erro ao processar comunidade:", error);
      toast.error("Erro ao processar comunidade");
    } finally {
      isSubmittingRef.current = false;
    }
  }, [selectedCommunity, loadCommunities, resetFormState]);

  // Manipular exclusão de comunidade
  const handleDeleteConfirm = useCallback(async () => {
    if (!selectedCommunity) return;
    
    try {
      await communityService.deleteCommunity(selectedCommunity.id, selectedCommunity.name);
      toast.success("Comunidade excluída com sucesso!");
      await loadCommunities();
      setDeleteDialogOpen(false);
      setSelectedCommunity(null);
    } catch (error) {
      console.error("Erro ao excluir comunidade:", error);
      toast.error("Erro ao excluir comunidade");
    }
  }, [selectedCommunity, loadCommunities]);

  // Manipular mudança de estado do diálogo
  const handleDialogOpenChange = useCallback((open: boolean) => {
    console.log("Alterando estado do diálogo para:", open);
    
    if (!open) {
      // Se estiver fechando o diálogo, resetar o estado do formulário
      setTimeout(() => {
        resetFormState();
      }, 100);
    }
    
    setDialogOpen(open);
  }, [resetFormState]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gerenciar Comunidades</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsGridView(!isGridView)}
            title={isGridView ? "Visualizar em lista" : "Visualizar em blocos"}
          >
            {isGridView ? (
              <Table className="h-4 w-4" />
            ) : (
              <LayoutGrid className="h-4 w-4" />
            )}
          </Button>
          <Button onClick={openAddDialog} className="bg-[#ff4400] hover:bg-[#ff4400]/90">
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Comunidade
          </Button>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar comunidades..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : isGridView ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCommunities.length === 0 ? (
            <div className="col-span-full p-8 text-center text-muted-foreground">
              Nenhuma comunidade encontrada
            </div>
          ) : (
            filteredCommunities.map(community => (
              <CommunityCard
                key={community.id}
                community={community}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
              />
            ))
          )}
        </div>
      ) : (
        <div className="rounded-md border">
          <div className="grid grid-cols-8 gap-4 p-4 bg-muted/50 font-medium">
            <div className="col-span-3">Comunidade</div>
            <div className="col-span-1">Membros</div>
            <div className="col-span-1">Visibilidade</div>
            <div className="col-span-1">Publicações</div>
            <div className="col-span-2 text-right">Ações</div>
          </div>
          
          {filteredCommunities.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Nenhuma comunidade encontrada
            </div>
          ) : (
            filteredCommunities.map(community => (
              <div key={community.id} className="grid grid-cols-8 gap-4 p-4 border-t items-center">
                <div className="col-span-3">
                  <div className="font-medium">{community.name}</div>
                  <div className="text-sm text-muted-foreground line-clamp-1">
                    {community.description}
                  </div>
                </div>
                
                <div className="col-span-1 text-sm">
                  {community.members}
                </div>
                
                <div className="col-span-1 text-sm">
                  {community.visibility === 'public' ? 'Pública' : 'Privada'}
                </div>
                
                <div className="col-span-1 text-sm">
                  {community.postingRestrictions === 'all_members' ? 'Todos' : 'Admin'}
                </div>
                
                <div className="col-span-2 flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditClick(community)}
                  >
                    <Pencil className="mr-1 h-4 w-4" />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(community)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    Excluir
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Renderização do diálogo de formulário usando o novo componente BasicCommunityDialog */}
      <BasicCommunityDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={selectedCommunity ? "Editar Comunidade" : "Nova Comunidade"}
        confirmLabel={selectedCommunity ? "Salvar Alterações" : "Criar Comunidade"}
        initialForm={communityForm}
        onSave={handleFormSubmit}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a comunidade "{selectedCommunity?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-500 hover:bg-red-600">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
