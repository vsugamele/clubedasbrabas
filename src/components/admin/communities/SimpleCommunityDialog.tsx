import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CommunityForm } from './types';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SimpleCommunityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  confirmLabel: string;
  initialForm: CommunityForm;
  onSave: (form: CommunityForm) => Promise<void>;
}

// Interface simplificada para categorias
interface SimpleCategory {
  id: string;
  name: string;
}

export function SimpleCommunityDialog({
  open,
  onOpenChange,
  title,
  confirmLabel,
  initialForm,
  onSave
}: SimpleCommunityDialogProps) {
  // Estado local do formulário
  const [form, setForm] = useState<CommunityForm>({
    name: "",
    description: "",
    visibility: "public",
    postingRestrictions: "all_members",
    categoryId: ""
  });
  
  // Estados de UI
  const [isProcessing, setIsProcessing] = useState(false);
  const [categories, setCategories] = useState<SimpleCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  
  // Atualizar o formulário quando as props mudarem
  useEffect(() => {
    if (open && initialForm) {
      console.log("Atualizando formulário com dados iniciais:", initialForm);
      setForm({
        name: initialForm.name || "",
        description: initialForm.description || "",
        visibility: initialForm.visibility || "public",
        postingRestrictions: initialForm.postingRestrictions || "all_members",
        categoryId: initialForm.categoryId || ""
      });
    }
  }, [initialForm, open]);
  
  // Carregar categorias quando o diálogo abrir
  useEffect(() => {
    if (open) {
      loadCategories();
    }
  }, [open]);
  
  // Função simplificada para carregar categorias diretamente
  const loadCategories = async () => {
    try {
      setIsLoadingCategories(true);
      console.log("Carregando categorias diretamente da tabela community_categories...");
      
      const { data, error } = await supabase
        .from('community_categories')
        .select('id, name')
        .order('name');
        
      if (error) {
        console.error("Erro ao carregar categorias:", error);
        toast.error("Erro ao carregar categorias");
        return;
      }
      
      console.log(`Carregadas ${data?.length || 0} categorias`);
      setCategories(data || []);
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
    } finally {
      setIsLoadingCategories(false);
    }
  };
  
  // Manipular mudanças nos campos
  const handleChange = (field: keyof CommunityForm, value: string) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Manipular envio do formulário
  const handleSubmit = async () => {
    if (isProcessing) return;
    
    if (!form.name || form.name.trim() === "") {
      toast.error("O nome da comunidade é obrigatório");
      return;
    }
    
    try {
      setIsProcessing(true);
      console.log("Enviando formulário:", form);
      await onSave(form);
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar comunidade:", error);
      toast.error("Erro ao processar solicitação");
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Preencha os detalhes da comunidade
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="name" className="text-right">
              Nome
            </label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="col-span-3"
              placeholder="Nome da comunidade"
              disabled={isProcessing}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="description" className="text-right">
              Descrição
            </label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="col-span-3"
              placeholder="Descreva o propósito da comunidade"
              disabled={isProcessing}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="visibility" className="text-right">
              Visibilidade
            </label>
            <Select
              value={form.visibility}
              onValueChange={(value) => handleChange('visibility', value)}
              disabled={isProcessing}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione a visibilidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Pública</SelectItem>
                <SelectItem value="private">Privada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="postingRestrictions" className="text-right">
              Postagens
            </label>
            <Select
              value={form.postingRestrictions}
              onValueChange={(value) => handleChange('postingRestrictions', value)}
              disabled={isProcessing}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Quem pode publicar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_members">Todos os membros</SelectItem>
                <SelectItem value="admin_only">Apenas administradores</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="category" className="text-right">
              Categoria
            </label>
            {isLoadingCategories ? (
              <div className="col-span-3 flex items-center">
                <LoadingSpinner size="sm" className="mr-2" />
                <span className="text-sm text-muted-foreground">Carregando categorias...</span>
              </div>
            ) : (
              <Select
                value={form.categoryId}
                onValueChange={(value) => handleChange('categoryId', value)}
                disabled={isProcessing}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione uma categoria (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhuma categoria</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button 
            onClick={handleSubmit} 
            disabled={isProcessing}
            className="bg-[#ff4400] hover:bg-[#ff4400]/90"
          >
            {isProcessing && <LoadingSpinner size="sm" className="mr-2" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
