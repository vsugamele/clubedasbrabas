import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Image, 
  Video, 
  Smile, 
  PlusCircle,
  AlertCircle,
  BarChart3,
  Search,
  X,
  Folder,
  Hash
} from "lucide-react";
import {
  Avatar, 
  AvatarImage, 
  AvatarFallback,
} from "@/components/ui/Avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator
} from "@/components/ui/select";
import { postCategories } from "@/data/postCategories";
import { 
  fetchCategories, 
  fetchCommunities, 
  uploadGif
} from "@/services/postService";
import { createPost } from "@/services/postService";
// Funções inlined do mediaService para evitar problemas de importação no Vercel
async function uploadVideoToStorage(videoFile: File): Promise<string | null> {
  try {
    if (!videoFile.type.startsWith('video/')) {
      throw new Error("O arquivo selecionado não é um vídeo válido.");
    }
    
    // Criar nome único para o arquivo
    const fileExt = videoFile.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `videos/${fileName}`;
    
    // Upload direto para o bucket media
    const { data, error } = await supabase.storage
      .from('media')
      .upload(filePath, videoFile, {
        cacheControl: '3600',
        upsert: true
      });
      
    if (error) {
      throw error;
    }
    
    return supabase.storage.from('media').getPublicUrl(filePath).data.publicUrl;
  } catch (error) {
    console.error("Falha no upload do vídeo:", error);
    // Fallback para base64 em caso de erro
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(videoFile);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  }
}

async function uploadImageToStorage(imageFile: File): Promise<string | null> {
  try {
    if (!imageFile.type.startsWith('image/')) {
      throw new Error("O arquivo selecionado não é uma imagem válida.");
    }
    
    // Criar nome único para o arquivo
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `images/${fileName}`;
    
    // Upload direto para o bucket media
    const { data, error } = await supabase.storage
      .from('media')
      .upload(filePath, imageFile, {
        cacheControl: '3600',
        upsert: true
      });
      
    if (error) {
      throw error;
    }
    
    return supabase.storage.from('media').getPublicUrl(filePath).data.publicUrl;
  } catch (error) {
    console.error("Falha no upload da imagem:", error);
    // Fallback para base64 em caso de erro
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(imageFile);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  }
}
import type { PostData } from "@/services/postService";
import { useAuth } from "@/context/auth";
import { AttachmentsPreview } from "./post/AttachmentsPreview";
import { supabase } from "@/integrations/supabase/client";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import MentionSuggestions from "./MentionSuggestions";
import { searchUsersForMention, UserMention } from "@/services/userService";
import { toast } from "sonner";

// Interface para usuários mencionados
// interface UserMention {
//   id: string;
//   username: string;
//   full_name: string;
//   avatar_url: string | null;
// }

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

interface CreatePostFormProps {
  communityId?: string | null;
  onPostCreated?: (post: PostData | null) => void;
}

interface Category {
  id: string;
  name: string;
  slug?: string;
  communities: {
    id: string;
    name: string;
    posting_restrictions?: string;
  }[];
}

const CreatePostForm = ({ communityId, onPostCreated }: CreatePostFormProps) => {
  const { user, profile } = useAuth();
  const [content, setContent] = useState("");
  const [selectedOption, setSelectedOption] = useState<string>('none');
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string>("");
  
  // Estado para armazenar a categoria atual para debug
  const [selectedCategoryDebug, setSelectedCategoryDebug] = useState<{id: string, name: string} | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  
  // Carregar avatar do usuário assim que o componente for montado
  useEffect(() => {
    const loadUserAvatar = async () => {
      try {
        if (user?.id) {
          // Tenta buscar o avatar do perfil do usuário
          const { data } = await supabase.auth.getUser();
          if (data?.user) {
            console.log("Auth user data:", data.user);
            
            // Busca o perfil do usuário para obter o avatar
            const { data: profileData } = await supabase
              .from('profiles')
              .select('avatar_url, full_name')
              .eq('id', data.user.id)
              .single();
              
            console.log("User profile data:", profileData);
            
            if (profileData?.avatar_url) {
              setUserAvatar(profileData.avatar_url);
            }
          }
        }
      } catch (error) {
        console.error("Erro ao carregar o avatar do usuário:", error);
      }
    };
    
    loadUserAvatar();
  }, [user?.id]);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [communitiesWithoutCategory, setCommunitiesWithoutCategory] = useState<{id: string, name: string, posting_restrictions?: string}[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  // Media attachments
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // GIF support
  const [showGifSearch, setShowGifSearch] = useState(false);
  const [gifSearchQuery, setGifSearchQuery] = useState("");
  const [selectedGif, setSelectedGif] = useState<string | null>(null);
  
  // Poll support
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  
  // Menção de usuários
  const [mentionSearch, setMentionSearch] = useState<string | null>(null);
  const [mentionUsers, setMentionUsers] = useState<UserMention[]>([]);
  const [isMentionLoading, setIsMentionLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Estado para armazenar se o usuário é admin
  const [userIsAdmin, setUserIsAdmin] = useState(false);

  // Verificar se o usuário é administrador
  const isAdmin = useCallback(async () => {
    if (!user?.id) return false;
    
    try {
      // Solução alternativa para contornar o problema de recursão infinita
      // Verificar se o email do usuário está na lista de emails de administradores conhecidos
      const adminEmails = ['souzadecarvalho1986@gmail.com', 'vsugamele@gmail.com', 'admin@example.com'];
      
      if (user.email && adminEmails.includes(user.email)) {
        console.log("Usuário é administrador (verificado por email)");
        return true;
      }
      
      // Tentar verificar diretamente na tabela profiles se o usuário é admin
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();
          
        if (!profileError && profileData && 'is_admin' in profileData && profileData.is_admin) {
          console.log("Usuário é administrador (verificado por is_admin)");
          return true;
        }
      } catch (profileErr) {
        console.error("Erro ao verificar is_admin:", profileErr);
      }
      
      // Apenas se as verificações anteriores falharem, tentar a verificação original
      // que pode causar o erro de recursão infinita
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();
          
        if (error) {
          console.error("Erro ao verificar papel do usuário:", error);
          return false;
        }
        
        return data?.role === 'admin';
      } catch (err) {
        console.error("Erro ao verificar papel do usuário:", err);
        return false;
      }
    } catch (err) {
      console.error("Erro ao verificar papel do usuário:", err);
      return false;
    }
  }, [user?.id, user?.email]);

  // Função para verificar se o usuário pode postar em uma comunidade
  const canPostInCommunity = useCallback((posting_restrictions?: string) => {
    if (!posting_restrictions || posting_restrictions === 'all_members') {
      return true;
    }
    return userIsAdmin;
  }, [userIsAdmin]);
  
  // Carregar o status de admin do usuário
  useEffect(() => {
    const checkAdminStatus = async () => {
      const adminStatus = await isAdmin();
      setUserIsAdmin(adminStatus);
    };
    
    checkAdminStatus();
  }, [isAdmin]);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingOptions(true);
        
        // Carregamos todas as categorias do banco
        const categoriesData = await fetchCategories();
        
        // Carregamos todas as comunidades
        const { data: communitiesData, error: communitiesError } = await supabase
          .from('communities')
          .select('id, name, category_id, posting_restrictions');
          
        if (communitiesError) throw communitiesError;
        
        // Comunidades sem categoria - filtrando por permissões
        const communitiesWithoutCat = communitiesData
          .filter(community => !community.category_id)
          .filter(community => canPostInCommunity(community.posting_restrictions))
          .map(community => ({
            id: community.id,
            name: community.name,
            posting_restrictions: community.posting_restrictions
          }));
            
        setCommunitiesWithoutCategory(communitiesWithoutCat);
        
        // Mapeia as comunidades para suas respectivas categorias
        const categoriesWithCommunities: Category[] = categoriesData.map(category => {
          const communitiesInCategory = communitiesData
            .filter(community => community.category_id === category.id)
            .filter(community => canPostInCommunity(community.posting_restrictions))
            .map(community => ({
              id: community.id,
              name: community.name,
              posting_restrictions: community.posting_restrictions
            }));
            
          return {
            id: category.id,
            name: category.name,
            slug: category.slug,
            communities: communitiesInCategory
          };
        });
        
        // Filtro para mostrar apenas categorias que têm comunidades
        const filteredCategories = categoriesWithCommunities.filter(
          category => category.communities.length > 0
        );
        
        // Mostramos apenas categorias que têm comunidades onde o usuário pode postar
        setCategories(filteredCategories);
        
        console.log("Categorias disponíveis:", categoriesData.map(cat => ({ id: cat.id, name: cat.name })));
        
        // Não definir categoria padrão automaticamente, deixar o usuário escolher
        // ou definir explicitamente quando em um contexto específico (comunidade)
        
        if (communityId) {
          setSelectedCommunityId(communityId);
          setSelectedOption("community");
        }
      } catch (error) {
        console.error("Error loading form data:", error);
      } finally {
        setIsLoadingOptions(false);
      }
    };
    
    loadData();
  }, [communityId, canPostInCommunity]);
  
  const handleAttachmentUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Validar os arquivos antes de adicionar
      const MAX_IMAGE_SIZE_MB = 10;
      const MAX_VIDEO_SIZE_MB = 100;
      const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
      const MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024;
      const newFiles = Array.from(e.target.files);
      
      // Filtrar arquivos que excedem o tamanho ou são de tipo inválido
      const validFiles = [];
      const invalidFiles = [];
      
      for (const file of newFiles) {
        // Verificar tamanho baseado no tipo do arquivo
        const isVideo = file.type.startsWith('video/');
        const maxAllowedSize = isVideo ? MAX_VIDEO_SIZE_BYTES : MAX_IMAGE_SIZE_BYTES;
        const maxAllowedSizeMB = isVideo ? MAX_VIDEO_SIZE_MB : MAX_IMAGE_SIZE_MB;
        
        if (file.size > maxAllowedSize) {
          invalidFiles.push({
            name: file.name,
            reason: `excede o tamanho máximo de ${maxAllowedSizeMB}MB (${(file.size / (1024 * 1024)).toFixed(1)}MB)`
          });
          continue;
        }
        
        // Verificar tipo
        if (file.type.startsWith('video/') && !['video/mp4', 'video/quicktime', 'video/x-m4v'].includes(file.type)) {
          invalidFiles.push({
            name: file.name,
            reason: `formato de vídeo não suportado: ${file.type}. Use MP4, MOV ou M4V.`
          });
          continue;
        }
        
        validFiles.push(file);
      }
      
      // Adicionar apenas arquivos válidos
      if (validFiles.length > 0) {
        setAttachments(prev => [...prev, ...validFiles]);
        console.log(`${validFiles.length} arquivo(s) válido(s) adicionado(s)`);
      }
      
      // Mostrar avisos para arquivos inválidos
      if (invalidFiles.length > 0) {
        for (const invalid of invalidFiles) {
          toast.error(`Erro: ${invalid.name} - ${invalid.reason}`);
        }
      }
      
      // Reset input value
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };
  
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };
  
  const addPollOption = () => {
    if (pollOptions.length < 5) {
      setPollOptions([...pollOptions, ""]);
    }
  };
  
  const updatePollOption = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };
  
  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };
  
  const handleGifSelect = (gifUrl: string) => {
    setSelectedGif(gifUrl);
    setShowGifSearch(false);
  };
  
  const handleGifSearch = () => {
    // In a real implementation, you would search for GIFs using an API like Giphy or Tenor
    // For now, we'll simulate a search result with placeholder GIFs
    console.log("Searching for GIFs:", gifSearchQuery);
  };
  
  const handleCommunitySelect = (value: string, type: 'community' | 'category' | 'none') => {
    setSelectedOption(type);
    console.log(`handleCommunitySelect: ${type} = ${value}`);
    
    // Se selecionou 'none', limpar tudo
    if (type === 'none') {
      setSelectedCommunityId(null);
      setCategoryId("");
      setSelectedCategoryDebug(null);
      return;
    }
    
    if (type === 'category') {
      // Selecionou uma categoria
      setCategoryId(value);
      setSelectedCommunityId(null); // Limpar comunidade selecionada
      
      // Debug da categoria selecionada
      const cat = categories.find(c => c.id === value);
      if (cat) {
        setSelectedCategoryDebug({id: cat.id, name: cat.name});
        console.log(`Categoria selecionada: ${cat.name} (ID: ${cat.id})`);
      } else {
        console.warn("Categoria não encontrada no array de categorias:", value);
        setSelectedCategoryDebug(null);
      }
      
      return;
    }
    
    if (type === 'community') {
      // Selecionou uma comunidade
      setSelectedCommunityId(value);
      
      // Tentar encontrar a categoria da comunidade
      let categoryFound = false;
      
      for (const category of categories) {
        const community = category.communities.find(c => c.id === value);
        if (community) {
          console.log(`Comunidade ${community.name} pertence à categoria: ${category.name} (ID: ${category.id})`);
          setCategoryId(category.id);
          setSelectedCategoryDebug({id: category.id, name: category.name});
          categoryFound = true;
          break;
        }
      }
      
      // Se não encontrou em nenhuma categoria, verificar nas comunidades sem categoria
      if (!categoryFound) {
        const foundCommunity = communitiesWithoutCategory.find(c => c.id === value);
        if (foundCommunity) {
          console.log(`Comunidade sem categoria: ${foundCommunity.name}`);
          setCategoryId(""); // Limpar categoria
          setSelectedCategoryDebug(null);
        } else {
          console.warn("Comunidade não encontrada em nenhuma lista:", value);
        }
      }
      const selectedCategory = categories.find(cat => cat.id === value);
      if (selectedCategory) {
        setSelectedCategoryDebug({
          id: selectedCategory.id,
          name: selectedCategory.name
        });
        console.log(`Categoria selecionada diretamente: ${selectedCategory.name} (ID: ${selectedCategory.id})`);
      }
    } else {
      setSelectedCommunityId(null);
      setCategoryId("");
      setSelectedOption('none');
      setSelectedCategoryDebug(null);
    }
    setDropdownOpen(false);
  };
  
  const getSelectedText = () => {
    if (selectedOption === 'none') {
      return 'Feed Principal';
    }
    
    // Check if it's a community ID
    const community = categories.flatMap(cat => cat.communities).find(c => c.id === selectedCommunityId);
    if (community) {
      return community.name;
    }
    
    // Check if it's a community without category
    const communityWithoutCategory = communitiesWithoutCategory.find(c => c.id === selectedCommunityId);
    if (communityWithoutCategory) {
      return communityWithoutCategory.name;
    }
    
    // Check if it's a category ID
    const category = categories.find(cat => cat.id === selectedOption);
    if (category) {
      return category.name;
    }
    
    return 'Feed Principal';
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar se há conteúdo ou anexos
    const hasContent = content.trim().length > 0;
    const hasAttachments = attachments.length > 0;
    const hasGif = selectedGif !== null;
    const hasPoll = showPollCreator && pollQuestion.trim() && pollOptions.filter(opt => opt.trim()).length >= 2;
    
    // Se não houver conteúdo nem anexos, não prosseguir
    if (!hasContent && !hasAttachments && !hasGif && !hasPoll) {
      toast.error("Adicione algum conteúdo à sua publicação.");
      return;
    }
    
    try {
      setIsSubmitting(true);
      console.log("Iniciando envio de post", { 
        hasContent, 
        hasAttachments, 
        hasGif, 
        hasPoll,
        content, 
        attachmentsCount: attachments.length 
      });
      
      // Prepare media data
      const mediaData: {
        type: "image" | "video" | "gif";
        url: string;
        aspectRatio?: number;
        isBase64?: boolean;
      }[] = [];
      
      // Handle GIF if selected
      if (selectedGif) {
        mediaData.push({
          type: "gif",
          url: selectedGif
        });
      }
      
      // Handle file attachments (images and videos)
      let uploadSuccess = false;
      
      if (attachments.length > 0) {
        console.log("Processando anexos:", attachments);
        // Upload each attachment
        for (const file of attachments) {
          let url = null;
          
          try {
            if (file.type.startsWith('image/')) {
              console.log(`Iniciando upload da imagem ${file.name}...`);
              toast.loading(`Enviando imagem ${file.name}...`, {
                id: `upload-${file.name}`,
              });
              
              // Todas as imagens agora usam storage
              url = await uploadImageToStorage(file);
              
              console.log(`Resultado do upload da imagem ${file.name}:`, url ? (url.startsWith('data:') ? 'Base64 image (truncated)' : url) : 'null');
              
              if (url) {
                uploadSuccess = true;
                toast.success(`Imagem ${file.name} enviada com sucesso!`, {
                  id: `upload-${file.name}`,
                });
                
                // Verificar se a URL é uma string base64
                const isBase64 = url.startsWith('data:');
                
                mediaData.push({
                  type: "image",
                  url,
                  // Se for base64, adicionar uma flag para indicar isso
                  isBase64: isBase64
                });
              } else {
                toast.error(`Falha ao enviar imagem ${file.name}`, {
                  id: `upload-${file.name}`,
                });
              }
            } else if (file.type.startsWith('video/')) {
              try {
                console.log(`Iniciando upload do vídeo ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)}MB)...`);
                
                // Iniciar toast com barra de progresso
                const toastId = `upload-${file.name}`;
                toast.loading(`Enviando vídeo...`, {
                  id: toastId,
                  duration: 30000, // Toast mais longo para uploads
                });
                
                // Usar o novo serviço de upload para o Storage
                url = await uploadVideoToStorage(file);
                
                console.log(`Upload de vídeo concluído: ${file.name}`);
                
                if (url) {
                  uploadSuccess = true;
                  toast.success(`Vídeo enviado com sucesso!`, {
                    id: toastId,
                  });
                  
                  mediaData.push({
                    type: "video",
                    url
                  });
                }
              } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao processar o vídeo";
                console.error(`Erro no upload do vídeo ${file.name}:`, error);
                toast.error(`Falha ao enviar vídeo: ${errorMessage}`, {
                  id: `upload-${file.name}`,
                });
              }
            }
          } catch (error) {
            console.error(`Erro ao enviar arquivo ${file.name}:`, error);
            toast.error(`Erro ao enviar arquivo ${file.name}`, {
              id: `upload-${file.name}`,
            });
          }
        }
      }
      
      console.log("Resultado do processamento de mídia:", { 
        mediaData, 
        uploadSuccess, 
        hasContent,
        hasAttachments,
        hasGif,
        hasPoll
      });
      
      // Se tinha anexos para upload mas nenhum foi bem-sucedido, e não há outro conteúdo
      if (hasAttachments && !uploadSuccess && !hasContent && !hasGif && !hasPoll) {
        console.error("Falha no upload de todos os anexos e não há outro conteúdo");
        toast.error("Não foi possível enviar os arquivos. Tente novamente ou adicione algum texto.");
        setIsSubmitting(false);
        return;
      }
      
      // Se não há conteúdo de nenhum tipo após processamento
      if (mediaData.length === 0 && !hasContent && !hasPoll) {
        console.error("Nenhum conteúdo válido para criar post");
        toast.error("Não foi possível criar a publicação. Adicione conteúdo ou tente novamente.");
        setIsSubmitting(false);
        return;
      }
      
      // Handle poll data
      let pollData = undefined;
      if (hasPoll) {
        pollData = {
          question: pollQuestion,
          options: pollOptions.filter(opt => opt.trim())
        };
      }
      
      // Se chegou até aqui, temos conteúdo válido para criar o post
      console.log("Enviando dados para criar post:", {
        content,
        categoryId,
        selectedCommunityId,
        mediaData,
        pollData
      });
      
      toast.loading("Criando publicação...", {
        id: "create-post",
      });
      
      // Garantir que sempre haja conteúdo, mesmo que vazio
      const finalContent = content.trim() || " ";
      
      // Log detalhado da categoria antes de enviar
      const categoryToUse = categoryId || "";
      const categoryName = categories.find(cat => cat.id === categoryToUse)?.name || "Geral";
      
      console.log("========== DETALHES DO POST ==========");
      console.log(`Categoria selecionada: ID="${categoryToUse}", Nome="${categoryName}"`);
      console.log(`Comunidade selecionada: ${selectedCommunityId || "Nenhuma"}`);
      console.log(`Opção selecionada: ${selectedOption}`);
      console.log(`Categoria Debug: ${JSON.stringify(selectedCategoryDebug)}`);
      console.log("=======================================");
      
      // Ajustar a categoria se necessário antes de criar o post
      let finalCategoryId = categoryToUse;
      
      // Se não há categoria definida e estamos em uma comunidade específica, tentar encontrar a categoria
      if ((!finalCategoryId || finalCategoryId === "") && selectedCommunityId) {
        // Procurar a categoria da comunidade selecionada
        for (const category of categories) {
          const community = category.communities.find(c => c.id === selectedCommunityId);
          if (community) {
            console.log(`Ajuste automático: Comunidade ${community.name} pertence à categoria ${category.name} (ID: ${category.id})`);
            finalCategoryId = category.id;
            // Nota: Não chamamos setCategoryId aqui para evitar re-renderização durante o submit
            // A atualização do estado visual acontecerá no próximo ciclo
            break; // Sair do loop assim que encontrar a categoria
          }
        }
      }
      
      console.log("Categoria final após ajustes:", finalCategoryId);
      
      // Criar o post com a categoria final (pode ser a original ou a ajustada)
      const postId = await createPost({
        content: finalContent,
        category_id: finalCategoryId, // Usar a categoria ajustada (se houver)
        communityId: selectedCommunityId,
        media: mediaData.length > 0 ? mediaData : undefined,
        poll: pollData
      });
      
      console.log("Resultado da criação do post:", postId);
      
      if (postId) {
        toast.success("Publicação criada com sucesso!", {
          id: "create-post",
        });
        
        // Se tivemos que ajustar a categoria, atualizar o estado visual agora
        if (finalCategoryId !== categoryToUse) {
          setCategoryId(finalCategoryId);
        }
        
        // Reset form
        setContent("");
        setSelectedGif(null);
        setShowGifSearch(false);
        setShowPollCreator(false);
        setPollQuestion("");
        setPollOptions(["", ""]);
        setAttachments([]);
        
        if (onPostCreated) {
          // Usar a categoria final para o objeto de post
          const category = categories.find(c => c.id === finalCategoryId);
          const newPost: PostData = {
            id: postId,
            content,
            author: {
              id: user?.id || '',
              name: profile?.full_name || user?.email?.split('@')[0] || 'Usuário',
              avatar: profile?.avatar_url,
            },
            category: category || { id: 'other', name: 'Categoria' },
            createdAt: new Date().toISOString(), // Convertendo para string ISO
            likes: 0,
            comments: 0,
            isPinned: false,
            communityId: selectedCommunityId,
            media: mediaData,
            poll: pollData
          };
          
          onPostCreated(newPost);
        }
      } else {
        toast.error("Falha ao criar a publicação. Tente novamente.", {
          id: "create-post",
        });
      }
    } catch (error) {
      console.error("Erro ao criar publicação:", error);
      toast.error("Erro ao criar publicação. Tente novamente mais tarde.", {
        id: "create-post",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Função para lidar com a digitação no textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    
    // Verificar se o usuário está tentando mencionar alguém
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = newContent.substring(0, cursorPosition);
    
    // Encontrar a última ocorrência de @ antes do cursor
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtSymbol !== -1) {
      // Verificar se há um espaço entre o último @ e o cursor
      const textBetweenAtAndCursor = textBeforeCursor.substring(lastAtSymbol + 1);
      
      // Condição simplificada: se @ está no início ou precedido por espaço/quebra de linha
      const isValidMention = lastAtSymbol === 0 || 
                            textBeforeCursor[lastAtSymbol - 1] === ' ' || 
                            textBeforeCursor[lastAtSymbol - 1] === '\n';
      
      if (!textBetweenAtAndCursor.includes(' ') && isValidMention) {
        // Usuário está digitando uma menção
        const searchTerm = textBetweenAtAndCursor;
        setMentionSearch(searchTerm);
        return;
      }
    }
    
    // Se chegou aqui, não está digitando uma menção
    setMentionSearch(null);
  };
  
  // Buscar usuários para menção
  useEffect(() => {
    const fetchUsers = async () => {
      if (mentionSearch === null) {
        setMentionUsers([]);
        return;
      }
      
      console.log("Buscando usuários para menção com termo:", mentionSearch);
      setIsMentionLoading(true);
      
      try {
        const users = await searchUsersForMention(mentionSearch);
        setMentionUsers(users);
      } catch (error) {
        console.error("Erro ao processar menções:", error);
        setMentionUsers([]);
      } finally {
        setIsMentionLoading(false);
      }
    };
    
    // Executar imediatamente para @ sem termo
    fetchUsers();
  }, [mentionSearch]);
  
  // Função para selecionar um usuário mencionado
  const handleSelectMention = (selectedUser: UserMention) => {
    if (textareaRef.current) {
      const cursorPosition = textareaRef.current.selectionStart;
      const textBeforeCursor = content.substring(0, cursorPosition);
      const textAfterCursor = content.substring(cursorPosition);
      
      // Encontrar a última ocorrência de @ antes do cursor
      const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
      
      if (lastAtSymbol !== -1) {
        // Substituir o texto entre @ e o cursor pela menção
        const textBeforeAt = textBeforeCursor.substring(0, lastAtSymbol);
        const newContent = `${textBeforeAt}@${selectedUser.username} ${textAfterCursor}`;
        
        setContent(newContent);
        
        // Calcular a nova posição do cursor após a menção
        const newCursorPosition = textBeforeAt.length + selectedUser.username.length + 2; // +2 para @ e espaço
        
        // Definir o foco e a posição do cursor após a renderização
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
          }
        }, 0);
      }
    }
    
    // Limpar a busca de menção
    setMentionSearch(null);
  };
  
  if (!user) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 text-muted-foreground">
            <AlertCircle className="h-5 w-5" />
            <p>Faça login para criar uma publicação</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="mb-4 overflow-hidden">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit}>
          <div className="flex items-start gap-3 mb-4">
            <Avatar>
              <AvatarImage 
                src={userAvatar || profile?.avatar_url || undefined} 
                alt={profile?.full_name || "User"} 
              />
              <AvatarFallback>
                {profile?.full_name ? getInitials(profile.full_name) : user?.email?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                placeholder="Compartilhe algo interessante... Use @ para mencionar usuários"
                value={content}
                onChange={handleTextareaChange}
                className="w-full border rounded-md p-3 min-h-[80px] max-h-[200px] resize-none focus:outline-none focus:ring-1 focus:ring-brand-500 bg-transparent"
                disabled={isSubmitting}
              />
              
              {mentionSearch !== null && (
                <div className="absolute top-full left-0 right-0 mt-1 z-50">
                  <div className="bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 w-full max-h-60 overflow-y-auto">
                    {isMentionLoading ? (
                      <div className="p-2 text-sm text-gray-500 dark:text-gray-400">
                        Buscando usuários...
                      </div>
                    ) : mentionUsers.length === 0 ? (
                      <div className="p-2 text-sm text-gray-500 dark:text-gray-400">
                        Nenhum usuário encontrado
                      </div>
                    ) : (
                      <ul className="py-1">
                        {mentionUsers.map((user, index) => (
                          <li 
                            key={user.id}
                            className="px-3 py-2 flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={() => handleSelectMention(user)}
                          >
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={user.avatar_url || undefined} alt={user.full_name} />
                              <AvatarFallback>
                                {getInitials(user.full_name || user.username)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-sm">{user.full_name || user.username}</div>
                              {user.username && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">@{user.username}</div>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {selectedGif && (
            <div className="relative rounded-md overflow-hidden">
              <img 
                src={selectedGif} 
                alt="Selected GIF" 
                className="w-full max-h-[200px] object-contain bg-muted"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6"
                onClick={() => setSelectedGif(null)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          
          <AttachmentsPreview 
            attachments={attachments} 
            onRemove={removeAttachment} 
          />
          
          {showGifSearch && (
            <div className="p-3 border rounded-md bg-muted/50">
              <div className="flex gap-2 mb-3">
                <Input
                  placeholder="Pesquisar GIFs..."
                  value={gifSearchQuery}
                  onChange={(e) => setGifSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  size="sm"
                  variant="secondary" 
                  onClick={handleGifSearch}
                >
                  <Search className="h-4 w-4 mr-1" />
                  Buscar
                </Button>
                <Button 
                  type="button" 
                  size="sm"
                  variant="ghost" 
                  onClick={() => setShowGifSearch(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
                {/* Placeholder GIFs - in a real app, these would come from an API */}
                <img 
                  src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM29zcjdvYjM2NTQ1eW1ucXp3N2x3NnhqdzRkMHBkOXFiZG5lYzhmeSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l41JMg1yXmGNDHSHm/giphy.gif" 
                  alt="GIF 1"
                  className="w-full h-40 object-cover rounded cursor-pointer hover:ring-2 ring-primary"
                  onClick={() => handleGifSelect("https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM29zcjdvYjM2NTQ1eW1ucXp3N2x3NnhqdzRkMHBkOXFiZG5lYzhmeSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l41JMg1yXmGNDHSHm/giphy.gif")}
                />
                <img 
                  src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcjYyZG0wbDJqajExaXVnY2FubG92ZHkzbzluaGdkdTB5cXM5NzM4MCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3oEjHGr1Fhz0kyv8Ig/giphy.gif" 
                  alt="GIF 2"
                  className="w-full h-40 object-cover rounded cursor-pointer hover:ring-2 ring-primary"
                  onClick={() => handleGifSelect("https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcjYyZG0wbDJqajExaXVnY2FubG92ZHkzbzluaGdkdTB5cXM5NzM4MCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3oEjHGr1Fhz0kyv8Ig/giphy.gif")}
                />
              </div>
            </div>
          )}
          
          {showPollCreator && (
            <div className="p-3 border rounded-md bg-muted/50">
              <div className="space-y-3">
                <Input
                  placeholder="Pergunta da enquete..."
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  className="w-full"
                />
                
                {pollOptions.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={`Opção ${index + 1}`}
                      value={option}
                      onChange={(e) => updatePollOption(index, e.target.value)}
                      className="flex-1"
                    />
                    {pollOptions.length > 2 && (
                      <Button 
                        type="button" 
                        size="icon"
                        variant="ghost"
                        onClick={() => removePollOption(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                
                {pollOptions.length < 5 && (
                  <Button 
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addPollOption}
                    className="w-full"
                  >
                    Adicionar opção
                  </Button>
                )}
                
                <div className="flex justify-end">
                  <Button 
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPollCreator(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex flex-wrap gap-3 justify-between mt-4">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-gray-500"
                disabled={isSubmitting}
                onClick={handleAttachmentUpload}
              >
                <Image className="h-4 w-4 mr-1" />
                Foto
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-gray-500"
                disabled={isSubmitting}
                onClick={handleAttachmentUpload}
              >
                <Video className="h-4 w-4 mr-1" />
                Vídeo
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-gray-500"
                disabled={isSubmitting || showPollCreator}
                onClick={() => setShowGifSearch(prev => !prev)}
              >
                <Smile className="h-4 w-4 mr-1" />
                GIF
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-gray-500"
                disabled={isSubmitting || showGifSearch}
                onClick={() => setShowPollCreator(prev => !prev)}
              >
                <BarChart3 className="h-4 w-4 mr-1" />
                Enquete
              </Button>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,video/*"
                multiple
                className="hidden"
              />
            </div>
            
            <div className="flex flex-wrap gap-2 w-full md:w-auto mt-3 md:mt-0">
              {!communityId && (
                <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full md:w-[240px] justify-between"
                      disabled={isSubmitting || isLoadingOptions}
                    >
                      {isLoadingOptions ? (
                        <span className="flex items-center">
                          <div className="h-4 w-4 rounded-full border-2 border-muted-foreground border-t-transparent animate-spin mr-2"></div>
                          Carregando...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          {getSelectedText()}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[240px] max-h-[400px] overflow-y-auto p-2">
                    <DropdownMenuItem 
                      className="flex items-center gap-2 cursor-pointer rounded-md"
                      onClick={() => handleCommunitySelect('none', 'none')}
                    >
                      Feed Principal
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    {categories.map((category) => (
                      <div key={category.id}>
                        <DropdownMenuLabel 
                          className="flex items-center gap-2 cursor-pointer rounded-md hover:bg-muted px-2 py-1.5"
                          onClick={() => handleCommunitySelect(category.id, 'category')}
                        >
                          <Folder className="h-4 w-4" />
                          <span>{category.name}</span>
                        </DropdownMenuLabel>
                        
                        {category.communities.length > 0 && (
                          <div className="pl-6 space-y-1 my-1">
                            {category.communities.map(community => (
                              <DropdownMenuItem 
                                key={community.id}
                                className="flex items-center gap-2 cursor-pointer rounded-md"
                                onClick={() => handleCommunitySelect(community.id, 'community')}
                              >
                                <Hash className="h-3 w-3" />
                                <span>{community.name}</span>
                              </DropdownMenuItem>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {communitiesWithoutCategory.length > 0 && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Sem categoria</DropdownMenuLabel>
                        
                        <div className="space-y-1 my-1">
                          {communitiesWithoutCategory.map(community => (
                            <DropdownMenuItem 
                              key={community.id}
                              className="flex items-center gap-2 cursor-pointer rounded-md pl-6"
                              onClick={() => handleCommunitySelect(community.id, 'community')}
                            >
                              <Hash className="h-3 w-3" />
                              <span>{community.name}</span>
                            </DropdownMenuItem>
                          ))}
                        </div>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              
              <Button 
                type="submit" 
                className="bg-[#ff4400] hover:bg-[#ff4400]/90 ml-auto"
                disabled={(!content.trim() && !selectedGif && !showPollCreator && attachments.length === 0) || isSubmitting}
              >
                {isSubmitting ? (
                  <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2"></div>
                ) : (
                  <PlusCircle className="h-4 w-4 mr-1" />
                )}
                Publicar
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreatePostForm;
