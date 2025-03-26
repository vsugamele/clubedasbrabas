import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CommunityForm } from './types';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { fetchCategories, Category } from './categoryIntegration';
import { toast } from 'sonner';

interface CommunityFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  confirmLabel: string;
  form: CommunityForm;
  onFormChange: (field: keyof CommunityForm, value: string) => void;
  onSubmit: (form: CommunityForm) => Promise<void>;
}

export function CommunityFormDialog(props: CommunityFormDialogProps) {
  // Estados básicos
  const [isProcessing, setIsProcessing] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  
  // Carregar categorias quando o componente montar
  useEffect(() => {
    if (props.open) {
      loadCategories();
    }
  }, [props.open]);
  
  // Função para carregar categorias
  const loadCategories = async () => {
    try {
      setIsLoadingCategories(true);
      const data = await fetchCategories();
      setCategories(data || []);
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
    } finally {
      setIsLoadingCategories(false);
    }
  };
  
  // Função para lidar com mudanças nos campos do formulário
  const handleFieldChange = (field: keyof CommunityForm, value: string) => {
    props.onFormChange(field, value);
  };
  
  // Função para lidar com o envio do formulário
  const handleSubmit = async () => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      await props.onSubmit(props.form);
    } catch (error) {
      console.error("Erro ao enviar formulário:", error);
      toast.error("Erro ao processar solicitação");
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Valores seguros para o formulário
  const name = props.form?.name || "";
  const description = props.form?.description || "";
  const visibility = props.form?.visibility || "public";
  const postingRestrictions = props.form?.postingRestrictions || "all_members";
  const categoryId = props.form?.categoryId || "";
  
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{props.title}</DialogTitle>
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
              value={name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
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
              value={description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
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
              value={visibility}
              onValueChange={(value) => handleFieldChange('visibility', value)}
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
              value={postingRestrictions}
              onValueChange={(value) => handleFieldChange('postingRestrictions', value)}
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
                value={categoryId}
                onValueChange={(value) => handleFieldChange('categoryId', value)}
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
            {props.confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
