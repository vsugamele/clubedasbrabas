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
<<<<<<< HEAD

=======
  
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
  // Estados de UI
  const [isProcessing, setIsProcessing] = useState(false);
  const [categories, setCategories] = useState<SimpleCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
<<<<<<< HEAD

=======
  
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
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
<<<<<<< HEAD

=======
      
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
      // Carregar categorias quando o diálogo abrir
      loadCategories();
    }
  }, [initialForm, isOpen]);
<<<<<<< HEAD

=======
  
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
  // Função simplificada para carregar categorias diretamente
  const loadCategories = async () => {
    try {
      setIsLoadingCategories(true);
      console.log("Carregando categorias diretamente da tabela community_categories...");
<<<<<<< HEAD

      const { data, error } = await supabase
        .from('c_community_categories')
        .select('id, name')
        .order('name');

=======
      
      const { data, error } = await supabase
        .from('community_categories')
        .select('id, name')
        .order('name');
        
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
      if (error) {
        console.error("Erro ao carregar categorias:", error);
        toast.error("Erro ao carregar categorias");
        return;
      }
<<<<<<< HEAD

=======
      
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
      console.log(`Carregadas ${data?.length || 0} categorias`);
      setCategories(data || []);
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
    } finally {
      setIsLoadingCategories(false);
    }
  };
<<<<<<< HEAD

=======
  
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
  // Manipular mudanças nos campos
  const handleChange = (field: keyof CommunityForm, value: string) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  };
<<<<<<< HEAD

  // Manipular envio do formulário
  const handleSubmit = async () => {
    if (isProcessing) return;

=======
  
  // Manipular envio do formulário
  const handleSubmit = async () => {
    if (isProcessing) return;
    
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
    if (!form.name || form.name.trim() === "") {
      toast.error("O nome da comunidade é obrigatório");
      return;
    }
<<<<<<< HEAD

=======
    
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
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
<<<<<<< HEAD

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="relative bg-[#1A1F2C] text-white border border-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Botão de fechar */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors"
=======
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Botão de fechar */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
          disabled={isProcessing}
        >
          <X size={20} />
        </button>
<<<<<<< HEAD

        {/* Cabeçalho */}
        <h2 className="text-xl font-bold mb-1">{title}</h2>
        <p className="text-sm text-gray-400 mb-6">
          Preencha os detalhes da comunidade
        </p>

        {/* Formulário */}
        <div className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="icon" className="block text-sm font-medium text-gray-200">
              Ícone/Emoji
            </label>
            <div className="flex items-center">
              <div className="w-10 h-10 flex items-center justify-center border border-gray-700 rounded-md mr-3 bg-[#0F1219]">
                {form.icon ? (
                  <span className="text-xl">{form.icon}</span>
                ) : (
                  <span className="text-gray-500">🏷️</span>
=======
        
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
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
                )}
              </div>
              <Input
                id="icon"
                value={form.icon || ""}
                onChange={(e) => handleChange('icon', e.target.value)}
<<<<<<< HEAD
                placeholder="Ex: 🚀, 🌟, 📚"
                disabled={isProcessing}
                className="flex-1 bg-[#0F1219] border-gray-700 text-white"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Dica: Copie e cole emojis do <a href="https://emojipedia.org/" target="_blank" rel="noopener noreferrer" className="text-[#ff4400] hover:underline">Emojipedia</a>
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-200">
=======
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
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
              Nome
            </label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Nome da comunidade"
              disabled={isProcessing}
<<<<<<< HEAD
              className="bg-[#0F1219] border-gray-700 text-white"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-200">
=======
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="description" className="block text-sm font-medium">
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
              Descrição
            </label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Descreva o propósito da comunidade"
              disabled={isProcessing}
<<<<<<< HEAD
              className="bg-[#0F1219] border-gray-700 text-white min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="visibility" className="block text-sm font-medium text-gray-200">
=======
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="visibility" className="block text-sm font-medium">
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
              Visibilidade
            </label>
            <select
              id="visibility"
              value={form.visibility}
              onChange={(e) => handleChange('visibility', e.target.value)}
<<<<<<< HEAD
              className="w-full bg-[#0F1219] text-white rounded-md border border-gray-700 p-2.5 focus:border-[#ff4400] focus:ring-1 focus:ring-[#ff4400] outline-none transition-all"
=======
              className="w-full rounded-md border border-gray-300 p-2"
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
              disabled={isProcessing}
            >
              <option value="public">Pública</option>
              <option value="private">Privada</option>
            </select>
          </div>
<<<<<<< HEAD

          <div className="space-y-2">
            <label htmlFor="postingRestrictions" className="block text-sm font-medium text-gray-200">
=======
          
          <div className="space-y-2">
            <label htmlFor="postingRestrictions" className="block text-sm font-medium">
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
              Postagens
            </label>
            <select
              id="postingRestrictions"
              value={form.postingRestrictions}
              onChange={(e) => handleChange('postingRestrictions', e.target.value)}
<<<<<<< HEAD
              className="w-full bg-[#0F1219] text-white rounded-md border border-gray-700 p-2.5 focus:border-[#ff4400] focus:ring-1 focus:ring-[#ff4400] outline-none transition-all"
=======
              className="w-full rounded-md border border-gray-300 p-2"
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
              disabled={isProcessing}
            >
              <option value="all_members">Todos os membros</option>
              <option value="admin_only">Apenas administradores</option>
            </select>
          </div>
<<<<<<< HEAD

          <div className="space-y-2">
            <label htmlFor="category" className="block text-sm font-medium text-gray-200">
              Categoria
            </label>
            {isLoadingCategories ? (
              <div className="flex items-center p-3 bg-[#0F1219] border border-gray-700 rounded-md">
                <LoadingSpinner size="sm" className="mr-3" />
                <span className="text-sm text-gray-400">Carregando categorias...</span>
=======
          
          <div className="space-y-2">
            <label htmlFor="category" className="block text-sm font-medium">
              Categoria
            </label>
            {isLoadingCategories ? (
              <div className="flex items-center p-2">
                <LoadingSpinner size="sm" className="mr-2" />
                <span className="text-sm text-gray-500">Carregando categorias...</span>
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
              </div>
            ) : (
              <select
                id="category"
                value={form.categoryId}
                onChange={(e) => handleChange('categoryId', e.target.value)}
<<<<<<< HEAD
                className="w-full bg-[#0F1219] text-white rounded-md border border-gray-700 p-2.5 focus:border-[#ff4400] focus:ring-1 focus:ring-[#ff4400] outline-none transition-all"
=======
                className="w-full rounded-md border border-gray-300 p-2"
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
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
<<<<<<< HEAD

        {/* Rodapé */}
        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleSubmit}
=======
        
        {/* Rodapé */}
        <div className="mt-6 flex justify-end">
          <Button 
            onClick={handleSubmit} 
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
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
