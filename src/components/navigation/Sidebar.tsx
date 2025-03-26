import { Link, useLocation } from "react-router-dom";
import { 
  Home, 
  MessageCircle, 
  Users, 
  User, 
  Calendar, 
  BellDot,
  ExternalLink,
  Hash,
  Folder,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useEffect, useState, useCallback } from "react";
import { supabase, retryOperation } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { clearAllCache } from "../admin/communities/services/fetchService";
import { ExternalLink as ExternalLinkType, useExternalLinks } from "./ExternalLinksProvider";

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  external?: boolean;
}

interface SidebarCategory {
  id: string;
  name: string;
  slug: string;
  communities: Array<{
    id: string;
    name: string;
    icon?: string;
  }>;
}

interface ExternalLink {
  id: string;
  name: string;
  url: string;
  order_index: number;
}

const NavItem = ({ href, icon, label, active, onClick, external }: NavItemProps) => {
  // Componente comum para estilização
  const commonClassNames = cn(
    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
    active 
      ? "bg-gradient-to-r from-orange-100/80 to-orange-50/50 text-orange-600 dark:from-orange-900/30 dark:to-orange-800/20 dark:text-orange-400" 
      : "hover:bg-gray-100/80 text-gray-700 dark:hover:bg-gray-800/50 dark:text-gray-300"
  );
  
  const iconClassNames = cn(
    "p-1.5 rounded-md transition-colors",
    active 
      ? "text-orange-600 dark:text-orange-400" 
      : "text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300"
  );
  
  // Renderizar um elemento <a> para links externos
  if (external) {
    return (
      <a 
        href={href} 
        className={commonClassNames}
        onClick={onClick}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className={iconClassNames}>
          {icon}
        </span>
        <span className="font-medium">{label}</span>
        <ExternalLink className="h-3.5 w-3.5 ml-auto opacity-70" />
      </a>
    );
  }
  
  // Renderizar um componente Link para links internos
  return (
    <Link 
      to={href} 
      className={commonClassNames}
      onClick={onClick}
    >
      <span className={iconClassNames}>
        {icon}
      </span>
      <span className="font-medium">{label}</span>
    </Link>
  );
};

interface SidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
}

const Sidebar = ({ isMobile = false, onClose }: SidebarProps) => {
  const location = useLocation();
  const path = location.pathname;
  const [categories, setCategories] = useState<SidebarCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [communitiesWithoutCategory, setCommunitiesWithoutCategory] = useState<{id: string, name: string, icon?: string}[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Usar o hook useExternalLinks para obter os links úteis
  const { links: externalLinks } = useExternalLinks();
  
  const loadCategoriesAndCommunities = useCallback(async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      
      if (forceRefresh) {
        setIsRefreshing(true);
        // Limpa o cache quando forçamos refresh
        clearAllCache();
      }
      
      // Carregamos todas as categorias do banco
      const { data: categoriesData, error: categoriesError } = await retryOperation(async () => {
        return await supabase
          .from('community_categories')
          .select('id, name, slug, order_index')
          .order('order_index', { ascending: true });
      }, 3);
      
      if (categoriesError) throw categoriesError;
      console.log("Categorias carregadas:", categoriesData);
      
      if (!categoriesData || categoriesData.length === 0) {
        console.log("Nenhuma categoria encontrada");
        setCategories([]);
      } else {
        // Para cada categoria, buscar suas comunidades
        const categoriesWithCommunitiesPromises = categoriesData.map(async (category) => {
          try {
            // Buscamos os campos incluindo o icon que agora existe
            const { data: communitiesData, error: communitiesError } = await retryOperation(async () => {
              return await supabase
                .from('communities')
                .select('id, name, icon')
                .eq('category_id', category.id);
            }, 3);
                
            if (communitiesError) {
              console.error(`Erro ao buscar comunidades para categoria ${category.name}:`, communitiesError);
              return {
                id: category.id,
                name: category.name,
                slug: category.slug,
                communities: []
              };
            }
            
            // Adicionamos ícones padrão apenas para comunidades que não têm ícone definido
            const communitiesWithIcons = communitiesData?.map(community => {
              // Usamos type assertion para acessar a propriedade icon com segurança
              const communityWithIcon = community as any;
              
              // Se a comunidade já tiver um ícone, usamos ele
              if (communityWithIcon.icon) {
                return communityWithIcon;
              }
              
              // Verificamos se é a comunidade "Sejam Bem Vindas" para atribuir o emoji de coração
              if (communityWithIcon.name === "Sejam Bem Vindas") {
                return {
                  ...communityWithIcon,
                  icon: '❤️' // Emoji de coração
                };
              }
              
              // Caso contrário, geramos um ícone com base no nome
              return {
                ...communityWithIcon,
                icon: getDefaultIcon(communityWithIcon.name)
              };
            }) || [];
            
            console.log(`Comunidades na categoria ${category.name}:`, communitiesWithIcons);
            
            return {
              id: category.id,
              name: category.name,
              slug: category.slug,
              communities: communitiesWithIcons
            };
          } catch (error) {
            console.error(`Erro ao buscar comunidades para categoria ${category.name}:`, error);
            return {
              id: category.id,
              name: category.name,
              slug: category.slug,
              communities: []
            };
          }
        });
        
        const categoriesWithCommunities = await Promise.all(categoriesWithCommunitiesPromises);
        
        // Mostramos todas as categorias, mesmo as vazias
        setCategories(categoriesWithCommunities);
      }
      
      // Carregamos todas as comunidades sem categoria
      const { data: communitiesData, error: communitiesError } = await retryOperation(async () => {
        return await supabase
          .from('communities')
          .select('id, name, icon')
          .is('category_id', null);
      }, 3);
          
      if (communitiesError) throw communitiesError;
      
      // Adicionamos ícones padrão apenas para comunidades que não têm ícone definido
      const communitiesWithoutCategoryWithIcons = communitiesData?.map(community => {
        // Usamos type assertion para acessar a propriedade icon com segurança
        const communityWithIcon = community as any;
        
        // Se a comunidade já tiver um ícone, usamos ele
        if (communityWithIcon.icon) {
          return communityWithIcon;
        }
        
        // Verificamos se é a comunidade "Sejam Bem Vindas" para atribuir o emoji de coração
        if (communityWithIcon.name === "Sejam Bem Vindas") {
          return {
            ...communityWithIcon,
            icon: '❤️' // Emoji de coração
          };
        }
        
        // Caso contrário, geramos um ícone com base no nome
        return {
          ...communityWithIcon,
          icon: getDefaultIcon(communityWithIcon.name)
        };
      }) || [];
      
      console.log("Comunidades sem categoria:", communitiesWithoutCategoryWithIcons);
      setCommunitiesWithoutCategory(communitiesWithoutCategoryWithIcons);
      
      // Removida a consulta aos links externos, pois agora usamos o ExternalLinksProvider
      
      if (forceRefresh) {
        toast.success("Dados atualizados com sucesso!");
      }
    } catch (error) {
      console.error("Error loading sidebar data:", error);
      toast.error("Falha ao carregar dados do menu lateral");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);
  
  useEffect(() => {
    loadCategoriesAndCommunities();
  }, [loadCategoriesAndCommunities]);
  
  const handleRefresh = () => {
    loadCategoriesAndCommunities(true);
  };
  
  const isActive = (route: string) => 
    path === route || (route !== "/" && path.startsWith(route));
  
  const communityActive = () => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.has('community');
  };
  
  const isCommunityActive = (communityId: string) => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get('community') === communityId;
  };
  
  const getDefaultIcon = (name: string) => {
    // Lista de palavras-chave e seus emojis correspondentes
    const keywordToEmoji: Record<string, string> = {
      // Tecnologia
      'tecnologia': '💻',
      'tech': '🖥️',
      'programação': '👨‍💻',
      'código': '⌨️',
      'desenvolvimento': '🚀',
      'software': '📱',
      'inovação': '💡',
      
      // Negócios
      'negócio': '💼',
      'empreendedorismo': '🏢',
      'startup': '📈',
      'vendas': '💰',
      'marketing': '📊',
      'finanças': '💵',
      'investimento': '📉',
      
      // Educação
      'educação': '📚',
      'escola': '🎓',
      'aprendizado': '✏️',
      'ensino': '🏫',
      'curso': '📝',
      'aula': '🧑‍🏫',
      
      // Comunicação
      'comunicação': '📣',
      'mídia': '📱',
      'social': '👥',
      'rede': '🌐',
      
      // Arte e Cultura
      'arte': '🎨',
      'música': '🎵',
      'cinema': '🎬',
      'literatura': '📖',
      'cultura': '🏛️',
      
      // Saúde
      'saúde': '🏥',
      'medicina': '⚕️',
      'bem-estar': '🧘',
      'fitness': '💪',
      
      // Outros
      'comida': '🍔',
      'viagem': '✈️',
      'esporte': '⚽',
      'jogo': '🎮',
      'natureza': '🌳',
      'ciência': '🔬'
    };
    
    // Converter o nome para minúsculas para facilitar a comparação
    const nameLower = name.toLowerCase();
    
    // Verificar se alguma palavra-chave está presente no nome
    for (const [keyword, emoji] of Object.entries(keywordToEmoji)) {
      if (nameLower.includes(keyword)) {
        return emoji;
      }
    }
    
    // Se nenhuma palavra-chave for encontrada, usar um emoji baseado na primeira letra
    const firstChar = name.charAt(0).toUpperCase();
    
    // Emojis para cada letra do alfabeto
    const letterEmojis: Record<string, string> = {
      'A': '🅰️', 'B': '🅱️', 'C': '©️', 'D': '🇩', 'E': '📧', 'F': '🎏',
      'G': '🇬', 'H': '♓', 'I': 'ℹ️', 'J': '🇯', 'K': '🇰', 'L': '🇱',
      'M': 'Ⓜ️', 'N': '🇳', 'O': '⭕', 'P': '🅿️', 'Q': '🇶', 'R': '®️',
      'S': '💲', 'T': '✝️', 'U': '⛎', 'V': '♈', 'W': '〰️', 'X': '❌',
      'Y': '💹', 'Z': '💤'
    };
    
    return letterEmojis[firstChar] || '🏷️'; // Emoji padrão se a letra não for encontrada
  };
  
  const Content = () => (
    <div className="flex flex-col justify-between h-full">
      <div className="space-y-6 mt-4">
        <div className="space-y-1 px-2">
          <NavItem 
            href="/" 
            icon={<Home className="h-5 w-5" />} 
            label="Feed Principal" 
            active={path === "/" && !communityActive()}
            onClick={onClose}
          />
        </div>
        
        <div className="space-y-2 px-2 mt-2">
          <div className="px-3 py-2 flex justify-between items-center">
            <span className="text-xs uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400">Categorias e Comunidades</span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 rounded-full hover:bg-orange-100/70 dark:hover:bg-orange-900/30 text-gray-500 dark:text-gray-400"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          
          <Accordion type="multiple" className="space-y-2">
            {isLoading ? (
              <div className="px-3 py-2 flex items-center gap-2">
                <div className="h-5 w-5 rounded-full animate-pulse bg-orange-100 dark:bg-orange-900/30"></div>
                <div className="h-4 w-32 animate-pulse bg-orange-100 dark:bg-orange-900/30 rounded"></div>
              </div>
            ) : (
              <>
                {categories.map(category => (
                  <AccordionItem 
                    key={category.id} 
                    value={category.slug}
                    className="border-none"
                  >
                    <AccordionTrigger className="px-3 py-2 hover:bg-orange-50/60 dark:hover:bg-orange-900/20 rounded-lg transition-colors hover:no-underline">
                      <div className="flex items-center gap-3">
                        <Folder className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        <span className="font-medium text-gray-700 dark:text-gray-300">{category.name}</span>
                        {category.communities.length > 0 && (
                          <span className="ml-1 text-xs bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 px-1.5 py-0.5 rounded-full">
                            {category.communities.length}
                          </span>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-1 pl-8">
                        {category.communities.length > 0 ? (
                          category.communities.map(community => (
                            <Link 
                              key={community.id} 
                              to={`/?community=${community.id}`}
                              onClick={onClose}
                            >
                              <div 
                                className={cn(
                                  "px-3 py-2 rounded-lg hover:bg-orange-50/60 dark:hover:bg-orange-900/20 transition-colors flex items-center gap-2", 
                                  isCommunityActive(community.id) && "bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
                                )}
                              >
                                {community.icon && <span className="text-lg">{community.icon}</span>}
                                <span className="font-medium text-gray-700 dark:text-gray-300">{community.name}</span>
                              </div>
                            </Link>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 italic">
                            Nenhuma comunidade nesta categoria
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
                
                {/* Comunidades sem categoria */}
                {communitiesWithoutCategory.length > 0 && (
                  <AccordionItem 
                    value="sem-categoria"
                    className="border-none"
                  >
                    <AccordionTrigger className="px-3 py-2 hover:bg-orange-50/60 dark:hover:bg-orange-900/20 rounded-lg transition-colors hover:no-underline">
                      <div className="flex items-center gap-3">
                        <Folder className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        <span className="font-medium text-gray-700 dark:text-gray-300">Feed Principal</span>
                        <span className="ml-1 text-xs bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 px-1.5 py-0.5 rounded-full">
                          {communitiesWithoutCategory.length}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-1 pl-8">
                        {communitiesWithoutCategory.map(community => (
                          <Link 
                            key={community.id} 
                            to={`/?community=${community.id}`}
                            onClick={onClose}
                          >
                            <div 
                              className={cn(
                                "px-3 py-2 rounded-lg hover:bg-orange-50/60 dark:hover:bg-orange-900/20 transition-colors flex items-center gap-2", 
                                isCommunityActive(community.id) && "bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
                              )}
                            >
                              {community.icon && <span className="text-lg">{community.icon}</span>}
                              <span className="font-medium text-gray-700 dark:text-gray-300">{community.name}</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}
              </>
            )}
          </Accordion>
          
          {externalLinks.length > 0 && (
            <div className="mt-6">
              <div className="px-3 py-2 mb-2">
                <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">LINKS ÚTEIS</span>
              </div>
              <div className="space-y-1">
                {externalLinks.map(link => (
                  <NavItem
                    key={link.id}
                    href={link.url}
                    icon={<ExternalLink className="h-5 w-5" />}
                    label={link.name}
                    onClick={onClose}
                    external={true}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
  
  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Users className="h-5 w-5" />
            <span className="sr-only">Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0">
          <Content />
        </SheetContent>
      </Sheet>
    );
  }
  
  return (
    <div className="hidden md:block w-64 border-r min-h-screen sticky top-0">
      <Content />
    </div>
  );
};

export default Sidebar;
