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
  RefreshCw,
  Crown, // Ícone para Área de Membro
  BookOpen,
  Menu,
  X,
  ChevronDown,
  Star,
  Image
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
  label: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  external?: boolean;
  highlighted?: boolean;
  className?: string;
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
  highlighted?: boolean;
}

const NavItem = ({ href, icon, label, active, onClick, external, highlighted, className }: NavItemProps) => {
  return (
    <Link 
      to={href} 
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      onClick={onClick}
    >
      <div 
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
          active 
            ? "bg-gradient-to-r from-orange-500/20 to-orange-400/10 text-orange-600 dark:from-orange-900/40 dark:to-orange-800/20 dark:text-orange-400 font-medium" 
            : "text-gray-800 dark:text-white hover:bg-orange-50/60 dark:hover:bg-orange-900/20",
          highlighted && "border border-orange-300 dark:border-orange-700",
          className
        )}
      >
        <div className={cn(
          "flex items-center justify-center w-8 h-8 rounded-full",
          active 
            ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400" 
            : "bg-orange-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300",
          highlighted && "bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400"
        )}>
          {icon}
        </div>
        <span className={cn(
          "font-medium", 
          highlighted && "text-orange-600 dark:text-orange-400"
        )}>
          {label}
        </span>
        {external && <ExternalLink className="h-3 w-3 ml-auto" />}
      </div>
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
  
  // Estado para controlar quais categorias estão expandidas
  // No modo mobile, começamos com todas as categorias expandidas
  const [expandedCategories, setExpandedCategories] = useState<string[]>(isMobile ? ['all-categories'] : []);
  
  // Função para expandir todas as categorias quando estiver no mobile
  useEffect(() => {
    if (isMobile && categories.length > 0) {
      // Expandir todas as categorias no mobile
      const allCategorySlugs = categories.map(category => category.slug);
      
      // Adicionar também "sem-categoria" se houver comunidades sem categoria
      if (communitiesWithoutCategory.length > 0) {
        allCategorySlugs.push("sem-categoria");
      }
      
      setExpandedCategories(allCategorySlugs);
      console.log("Mobile view: Expanded all categories", allCategorySlugs);
    }
  }, [isMobile, categories, communitiesWithoutCategory]);
  
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
        const categoriesWithCommunitiesPromises = categoriesData.map(async (category: any) => {
          try {
            // Buscamos os campos incluindo o icon que agora existe
            const { data: communitiesData, error: communitiesError } = await retryOperation(async () => {
              return await supabase
                .from('communities')
                .select('id, name, icon, category_id')
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
            
            console.log(`Comunidades da categoria ${category.name} (ID: ${category.id}):`, communitiesData);
            
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
            
            console.log(`Comunidades na categoria ${category.name} (ID: ${category.id}):`, communitiesWithIcons);
            
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
        
        // Se estamos no mobile, expandimos todas as categorias imediatamente
        if (isMobile) {
          setExpandedCategories(categoriesWithCommunities.map(cat => cat.slug));
        }
      }
      
      // Carregamos todas as comunidades sem categoria
      const { data: communitiesWithoutCategoryData, error: communitiesError } = await retryOperation(async () => {
        return await supabase
          .from('communities')
          .select('id, name, icon')
          .is('category_id', null);
      }, 3);
      
      if (communitiesError) {
        console.error("Erro ao buscar comunidades sem categoria:", communitiesError);
        setCommunitiesWithoutCategory([]);
      } else {
        console.log("Comunidades sem categoria:", communitiesWithoutCategoryData);
        
        // Adicionar ícones padrão para comunidades sem categoria
        const communitiesWithIcons = communitiesWithoutCategoryData?.map(community => {
          // Usamos type assertion para acessar a propriedade icon com segurança
          const communityWithIcon = community as any;
          
          // Se a comunidade já tiver um ícone, usamos ele
          if (communityWithIcon.icon) {
            return communityWithIcon;
          }
          
          // Verificamos se é a comunidade "Sejam Bem Vindas" para atribuir o emoji de coração
          if (communityWithIcon.name === "Sejam Bem Vindas") {
            console.log("Encontrada comunidade 'Sejam Bem Vindas' sem categoria");
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
        
        console.log("Comunidades sem categoria com ícones:", communitiesWithIcons);
        setCommunitiesWithoutCategory(communitiesWithIcons);
        
        // Se estamos no mobile e temos comunidades sem categoria, expandimos essa seção também
        if (isMobile && communitiesWithIcons.length > 0) {
          setExpandedCategories(prev => [...prev, "sem-categoria"]);
        }
      }
      
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
  }, [isMobile]);
  
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
  
  const CategoryItem = ({ category, isExpanded, onToggle, communities }: any) => {
    return (
      <div className="mb-2">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-orange-50/50 dark:bg-gray-800/50 hover:bg-orange-100/70 dark:hover:bg-gray-700/70 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Folder className="h-4 w-4 text-orange-500 dark:text-orange-400" />
            <span className="font-medium text-gray-800 dark:text-gray-100">{category.name}</span>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-gray-500 dark:text-gray-400 transition-transform",
              isExpanded && "transform rotate-180"
            )}
          />
        </button>
      </div>
    );
  };

  const Content = () => (
    <div className="flex flex-col justify-between h-full">
      <div className="space-y-6 mt-4">
        <div className="space-y-2 px-2">
          <div className="px-3 py-2 flex justify-between items-center">
            <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 tracking-wider">
              CATEGORIAS E COMUNIDADES
            </h2>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleRefresh}
              className="h-7 w-7 rounded-full hover:bg-orange-100 dark:hover:bg-gray-800"
            >
              <RefreshCw className="h-4 w-4 text-gray-600 dark:text-gray-300" />
            </Button>
          </div>
          
          <Accordion 
            type="multiple" 
            className="space-y-2"
            value={expandedCategories}
            onValueChange={setExpandedCategories}
            defaultValue={isMobile ? categories.map(category => category.slug).concat(communitiesWithoutCategory.length > 0 ? ["sem-categoria"] : []) : []}
          >
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
                      <CategoryItem 
                        category={category} 
                        isExpanded={expandedCategories.includes(category.slug)} 
                        onToggle={() => setExpandedCategories(prev => {
                          if (prev.includes(category.slug)) {
                            return prev.filter(slug => slug !== category.slug);
                          } else {
                            return [...prev, category.slug];
                          }
                        })}
                        communities={category.communities}
                      />
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-1 pl-8">
                        {category.communities.length === 0 && (
                          <div className="px-3 py-2 text-sm text-gray-800 dark:text-white italic">
                            Nenhuma comunidade nesta categoria
                          </div>
                        )}
                        {category.communities.length > 0 ? (
                          category.communities.map(community => (
                            <Link 
                              key={community.id} 
                              to={`/c/${community.id}`}
                              className="flex items-center gap-2 px-3 py-2 mt-1 rounded-md hover:bg-orange-50/80 dark:hover:bg-gray-800/60 text-gray-700 dark:text-gray-200"
                            >
                              {community.icon ? (
                                <span className="text-lg">{community.icon}</span>
                              ) : (
                                <Hash className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                              )}
                              <span className="truncate">{community.name}</span>
                            </Link>
                          ))
                        ) : (
                          <></>
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
                      <CategoryItem 
                        category={{ name: "Outras Comunidades", slug: "sem-categoria" }} 
                        isExpanded={expandedCategories.includes("sem-categoria")} 
                        onToggle={() => setExpandedCategories(prev => {
                          if (prev.includes("sem-categoria")) {
                            return prev.filter(slug => slug !== "sem-categoria");
                          } else {
                            return [...prev, "sem-categoria"];
                          }
                        })}
                        communities={communitiesWithoutCategory}
                      />
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-1 pl-8">
                        {communitiesWithoutCategory.map(community => (
                          <Link 
                            key={community.id} 
                            to={`/c/${community.id}`}
                            className="flex items-center gap-2 px-3 py-2 mt-1 rounded-md hover:bg-orange-50/80 dark:hover:bg-gray-800/60 text-gray-700 dark:text-gray-200"
                          >
                            {community.icon ? (
                              <span className="text-lg">{community.icon}</span>
                            ) : (
                              <Hash className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            )}
                            <span className="truncate">{community.name}</span>
                          </Link>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}
              </>
            )}
          </Accordion>
        </div>
        
        {/* Links Úteis */}
        {externalLinks && externalLinks.length > 0 && (
          <div className="space-y-2 px-2 mt-4">
            <div className="px-3 py-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400">Links Úteis</span>
            </div>
            <div className="space-y-1">
              <div className="relative mb-2">
                <NavItem 
                  href="/referencias"
                  icon={<Image className="h-5 w-5 text-white" />}
                  label={
                    <div className="flex items-center gap-1">
                      Galeria de Referências
                      <Star className="h-3 w-3 text-yellow-200 animate-pulse" />
                    </div>
                  }
                  active={isActive("/referencias")}
                  onClick={onClose}
                  className="bg-gradient-to-r from-amber-500 to-orange-600 text-white font-medium rounded-md hover:from-amber-600 hover:to-orange-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-300 rounded-full animate-ping"></div>
              </div>
              {externalLinks.map(link => (
                <NavItem 
                  key={link.id}
                  href={link.url}
                  icon={<ExternalLink className="h-5 w-5" />}
                  label={link.name}
                  external={true}
                  highlighted={link.highlighted}
                  onClick={onClose}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {isMobile ? (
        <div className="fixed inset-0 z-50 flex">
          {/* Overlay escuro para fechar a sidebar */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={onClose}
          />
          
          {/* Sidebar com fundo branco para melhor contraste */}
          <div className="relative w-[85%] max-w-[350px] h-full bg-white dark:bg-gray-900 overflow-y-auto border-r border-orange-200/30 dark:border-gray-700 shadow-xl">
            <div className="sticky top-0 z-10 flex justify-between items-center p-4 bg-orange-50/80 dark:bg-gray-900/90 backdrop-blur-md border-b border-orange-200/30 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <img src="/lovable-uploads/fe794e0a-f834-4651-8887-e813c0115ade.png" alt="Logo" className="w-8 h-8 object-contain" />
                <span className="text-xl font-bold text-[#ff4400]">Clube das Brabas</span>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose}
                className="rounded-full hover:bg-orange-100 dark:hover:bg-gray-700"
              >
                <X className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </Button>
            </div>
            
            <div className="p-2 bg-white dark:bg-gray-900">
              <Content />
            </div>
          </div>
        </div>
      ) : (
        <div className="h-full overflow-y-auto border-r border-border">
          <div className="p-2">
            <Content />
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
