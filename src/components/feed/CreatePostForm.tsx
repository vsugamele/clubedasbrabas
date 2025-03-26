import { useState, useEffect, useRef } from "react";
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
import { createPost, fetchCategories, fetchCommunities, uploadGif } from "@/services/postService";
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
  }[];
}

const CreatePostForm = ({ communityId, onPostCreated }: CreatePostFormProps) => {
  const { user, profile } = useAuth();
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(communityId || null);
  const [selectedOption, setSelectedOption] = useState<string>(communityId ? "community" : "none");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [communitiesWithoutCategory, setCommunitiesWithoutCategory] = useState<{id: string, name: string}[]>([]);
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
  
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingOptions(true);
        
        // Carregamos todas as categorias do banco
        const categoriesData = await fetchCategories();
        
        // Carregamos todas as comunidades
        const { data: communitiesData, error: communitiesError } = await supabase
          .from('communities')
          .select('id, name, category_id');
          
        if (communitiesError) throw communitiesError;
        
        // Comunidades sem categoria
        const communitiesWithoutCat = communitiesData
          .filter(community => !community.category_id)
          .map(community => ({
            id: community.id,
            name: community.name
          }));
            
        setCommunitiesWithoutCategory(communitiesWithoutCat);
        
        // Mapeia as comunidades para suas respectivas categorias
        const categoriesWithCommunities: Category[] = categoriesData.map(category => {
          const communitiesInCategory = communitiesData
            .filter(community => community.category_id === category.id)
            .map(community => ({
              id: community.id,
              name: community.name
            }));
            
          return {
            id: category.id,
            name: category.name,
            slug: category.slug,
            communities: communitiesInCategory
          };
        });
        
        // Filtro para mostrar apenas categorias que têm comunidades
        // const filteredCategories = categoriesWithCommunities.filter(
        //   category => category.communities.length > 0
        // );
        
        // Mostramos todas as categorias, mesmo as vazias
        setCategories(categoriesWithCommunities);
        
        if (categoriesData.length > 0 && !categoryId) {
          setCategoryId(categoriesData[0].id);
        }
        
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
  }, [communityId]);
  
  const handleAttachmentUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...newFiles]);
      
      // Reset the input so the same file can be selected again
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
    if (type === 'community') {
      setSelectedCommunityId(value);
      setSelectedOption(value);
    } else if (type === 'category') {
      setCategoryId(value);
      setSelectedCommunityId(null);
      setSelectedOption(value);
    } else {
      setSelectedCommunityId(null);
      setCategoryId("");
      setSelectedOption('none');
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
    
    if (!content.trim() && !selectedGif && !showPollCreator) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Prepare media data
      const mediaData: {
        type: "image" | "video" | "gif";
        url: string;
        aspectRatio?: number;
      }[] = [];
      
      // Handle GIF if selected
      if (selectedGif) {
        mediaData.push({
          type: "gif",
          url: selectedGif
        });
      }
      
      // Handle poll data
      let pollData = undefined;
      if (showPollCreator && pollQuestion.trim() && pollOptions.filter(opt => opt.trim()).length >= 2) {
        pollData = {
          question: pollQuestion,
          options: pollOptions.filter(opt => opt.trim())
        };
      }
      
      const postId = await createPost({
        content,
        category_id: categoryId,
        communityId: selectedCommunityId,
        media: mediaData,
        poll: pollData
      });
      
      if (postId) {
        // Reset form
        setContent("");
        setSelectedGif(null);
        setShowGifSearch(false);
        setShowPollCreator(false);
        setPollQuestion("");
        setPollOptions(["", ""]);
        setAttachments([]);
        
        if (onPostCreated) {
          const category = categories.find(c => c.id === categoryId);
          const newPost: PostData = {
            id: postId,
            content,
            author: {
              id: user?.id || '',
              name: profile?.full_name || user?.email?.split('@')[0] || 'Usuário',
              avatar: profile?.avatar_url,
            },
            category: category || { id: 'other', name: 'Categoria' },
            createdAt: new Date(),
            likes: 0,
            comments: 0,
            isPinned: false,
            communityId: selectedCommunityId,
            media: mediaData,
            poll: pollData
          };
          
          onPostCreated(newPost);
        }
      }
    } catch (error) {
      console.error("Error creating post:", error);
    } finally {
      setIsSubmitting(false);
    }
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
    <Card>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit}>
          <div className="flex gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || "User"} />
              <AvatarFallback>
                {getInitials(profile?.full_name || user.email?.split('@')[0] || "User")}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-4">
              <textarea
                className="min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Compartilhe algo interessante..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={isSubmitting}
              ></textarea>
              
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
              
              <div className="flex flex-wrap gap-3 justify-between">
                <div className="flex gap-2">
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
                
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
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
                    disabled={(!content.trim() && !selectedGif && !showPollCreator) || isSubmitting}
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
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreatePostForm;
