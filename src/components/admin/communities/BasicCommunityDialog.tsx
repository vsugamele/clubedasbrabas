import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CommunityForm } from './types';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { X } from 'lucide-react';

interface BasicCommunityDialogProps {
  isOpen: boolean;
  onClose: () => void;
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

export function BasicCommunityDialog({
  isOpen,
  onClose,
  title,
  confirmLabel,
  initialForm,
  onSave
}: BasicCommunityDialogProps) {
  // Estado local do formulário
  const [form, setForm] = useState<CommunityForm>({
    name: "",
    description: "",
    visibility: "public",
    postingRestrictions: "all_members",
    categoryId: "",
    icon: ""
  });
  
  // Estados de UI
  const [isProcessing, setIsProcessing] = useState(false);
  const [categories, setCategories] = useState<SimpleCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  
  // Atualizar o formulário quando as props mudarem
  useEffect(() => {
    if (isOpen && initialForm) {
      console.log("Atualizando formulário com dados iniciais:", initialForm);
      setForm({
        name: initialForm.name || "",
        description: initialForm.description || "",
        visibility: initialForm.visibility || "public",
        postingRestrictions: initialForm.postingRestrictions || "all_members",
        categoryId: initialForm.categoryId || "",
        icon: initialForm.icon || ""
      });
      
      // Carregar categorias quando o diálogo abrir
      loadCategories();
    }
  }, [initialForm, isOpen]);
  
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
      onClose();
    } catch (error) {
      console.error("Erro ao salvar comunidade:", error);
      toast.error("Erro ao processar solicitação");
    } finally {
      setIsProcessing(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Botão de fechar */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
          disabled={isProcessing}
        >
          <X size={20} />
        </button>
        
        {/* Cabeçalho */}
        <h2 className="text-lg font-semibold mb-1">{title}</h2>
        <p className="text-sm text-gray-500 mb-4">
          Preencha os detalhes da comunidade
        </p>
        
        {/* Formulário */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="icon" className="block text-sm font-medium">
              Ícone/Emoji
            </label>
            <div className="flex items-center">
              <div className="w-10 h-10 flex items-center justify-center border rounded-md mr-2 bg-gray-50">
                {form.icon ? (
                  <span className="text-2xl">{form.icon}</span>
                ) : (
                  <span className="text-gray-400">🏷️</span>
                )}
              </div>
              <Input
                id="icon"
                value={form.icon || ""}
                onChange={(e) => handleChange('icon', e.target.value)}
                placeholder="Insira um emoji (ex: 🚀, 🌟, 📚)"
                disabled={isProcessing}
                className="flex-1"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Dica: Você pode copiar e colar emojis de sites como <a href="https://emojipedia.org/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Emojipedia</a>
            </p>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium">
              Nome
            </label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Nome da comunidade"
              disabled={isProcessing}
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="description" className="block text-sm font-medium">
              Descrição
            </label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Descreva o propósito da comunidade"
              disabled={isProcessing}
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="visibility" className="block text-sm font-medium">
              Visibilidade
            </label>
            <select
              id="visibility"
              value={form.visibility}
              onChange={(e) => handleChange('visibility', e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2"
              disabled={isProcessing}
            >
              <option value="public">Pública</option>
              <option value="private">Privada</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="postingRestrictions" className="block text-sm font-medium">
              Postagens
            </label>
            <select
              id="postingRestrictions"
              value={form.postingRestrictions}
              onChange={(e) => handleChange('postingRestrictions', e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2"
              disabled={isProcessing}
            >
              <option value="all_members">Todos os membros</option>
              <option value="admin_only">Apenas administradores</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="category" className="block text-sm font-medium">
              Categoria
            </label>
            {isLoadingCategories ? (
              <div className="flex items-center p-2">
                <LoadingSpinner size="sm" className="mr-2" />
                <span className="text-sm text-gray-500">Carregando categorias...</span>
              </div>
            ) : (
              <select
                id="category"
                value={form.categoryId}
                onChange={(e) => handleChange('categoryId', e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2"
                disabled={isProcessing}
              >
                <option value="">Nenhuma categoria</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
        
        {/* Rodapé */}
        <div className="mt-6 flex justify-end">
          <Button 
            onClick={handleSubmit} 
            disabled={isProcessing}
            className="bg-[#ff4400] hover:bg-[#ff4400]/90"
          >
            {isProcessing && <LoadingSpinner size="sm" className="mr-2" />}
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
