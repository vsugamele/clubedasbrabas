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
  Menu
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
  highlighted?: boolean;
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

const NavItem = ({ href, icon, label, active, onClick, external, highlighted }: NavItemProps) => {
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
            ? "bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" 
            : "text-gray-700 dark:text-gray-300 hover:bg-orange-50/60 dark:hover:bg-orange-900/20",
          highlighted && "border border-orange-300 dark:border-orange-700"
        )}
      >
        <div className={highlighted ? "text-orange-500 dark:text-orange-400" : ""}>
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
                              to={`/?community=${community.id}&category=${category.id}`}
                              onClick={() => {
                                console.log(`Navegando para comunidade ${community.name} (ID: ${community.id}) na categoria ${category.name} (ID: ${category.id})`);
                                console.log(`Link gerado: /?community=${community.id}&category=${category.id}`);
                                if (onClose) onClose();
                              }}
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
                        <Hash className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        <span className="font-medium text-gray-700 dark:text-gray-300">Outras Comunidades</span>
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
                            onClick={() => {
                              console.log(`Navegando para comunidade sem categoria ${community.name} (ID: ${community.id})`);
                              console.log(`Link gerado: /?community=${community.id}`);
                              if (onClose) onClose();
                            }}
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
        </div>
        
        {/* Links Úteis */}
        {externalLinks && externalLinks.length > 0 && (
          <div className="space-y-2 px-2 mt-4">
            <div className="px-3 py-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400">Links Úteis</span>
            </div>
            <div className="space-y-1">
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
        
        {/* Links de navegação fixos */}
        <div className="space-y-2 px-2 mt-4">
          <div className="px-3 py-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400">Navegação</span>
          </div>
          <div className="space-y-1">
            <NavItem 
              href="/messages" 
              icon={<MessageCircle className="h-5 w-5" />} 
              label="Mensagens" 
              active={isActive("/messages")}
              onClick={onClose}
            />
            <NavItem 
              href="/notifications" 
              icon={<BellDot className="h-5 w-5" />} 
              label="Notificações" 
              active={isActive("/notifications")}
              onClick={onClose}
            />
            <NavItem 
              href="/eventos" 
              icon={<Calendar className="h-5 w-5" />} 
              label="Eventos" 
              active={isActive("/eventos")}
              onClick={onClose}
            />
            <NavItem 
              href="/membros" 
              icon={<Users className="h-5 w-5" />} 
              label="Membros" 
              active={isActive("/membros")}
              onClick={onClose}
            />
            <NavItem 
              href="/profile" 
              icon={<User className="h-5 w-5" />} 
              label="Meu Perfil" 
              active={isActive("/profile")}
              onClick={onClose}
            />
            <NavItem 
              href="/area-membro" 
              icon={<Crown className="h-5 w-5" />} 
              label="Área de Membro" 
              active={isActive("/area-membro")}
              onClick={onClose}
            />
            <NavItem 
              href="/conteudos" 
              icon={<BookOpen className="h-5 w-5" />} 
              label="Conteúdos" 
              active={isActive("/conteudos")}
              onClick={onClose}
            />
          </div>
        </div>
      </div>
    </div>
  );

  // No modo mobile, renderizamos apenas o conteúdo diretamente
  if (isMobile) {
    return <Content />;
  }
  
  // No modo desktop, usamos o componente Sheet sem o botão de trigger
  return (
    <div className="hidden md:block w-64 border-r min-h-screen sticky top-0">
      <Content />
    </div>
  );
};

export default Sidebar;
