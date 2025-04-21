
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface AdminTabsProps {
  reportsCount: number;
}

export const AdminTabs = ({ reportsCount }: AdminTabsProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);

  useEffect(() => {
    const checkScroll = () => {
      if (scrollContainerRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        setShowLeftScroll(scrollLeft > 0);
        setShowRightScroll(scrollLeft + clientWidth < scrollWidth - 10);
      }
    };

    // Verificar inicialmente
    checkScroll();

    // Configurar o observer para reajuste em mudanças de tamanho
    const resizeObserver = new ResizeObserver(checkScroll);
    if (scrollContainerRef.current) {
      resizeObserver.observe(scrollContainerRef.current);
    }

    // Adicionar listener para evento de scroll
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', checkScroll);
      }
      resizeObserver.disconnect();
    };
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 150;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const commonTabClass = "data-[state=active]:bg-[#ff4400] data-[state=active]:text-white whitespace-nowrap flex-shrink-0";

  return (
    <div className="relative mb-4 flex items-center">
      {showLeftScroll && (
        <button 
          onClick={() => scroll('left')} 
          className="absolute left-0 z-10 flex h-full items-center justify-center bg-gradient-to-r from-orange-50 to-transparent pr-4 pl-1"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </button>
      )}
      
      <div 
        ref={scrollContainerRef} 
        className="flex w-full overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <TabsList className="flex bg-orange-50 w-full overflow-visible p-1">
          <TabsTrigger value="dashboard" className={commonTabClass}>Dashboard</TabsTrigger>
          <TabsTrigger value="users" className={commonTabClass}>Usuários</TabsTrigger>
          <TabsTrigger value="posts" className={`${commonTabClass} bg-red-50`}>
            <span className="flex items-center gap-1">
              Gerenciar Posts
            </span>
          </TabsTrigger>
          <TabsTrigger value="communities" className={commonTabClass}>Comunidades</TabsTrigger>
          <TabsTrigger value="categories" className={commonTabClass}>Categorias</TabsTrigger>
          <TabsTrigger value="events" className={commonTabClass}>Eventos</TabsTrigger>
          <TabsTrigger value="trending" className={commonTabClass}>Trending</TabsTrigger>
          <TabsTrigger value="rankings" className={commonTabClass}>Rankings</TabsTrigger>
          <TabsTrigger value="reports" className={commonTabClass}>
            Denúncias
            {reportsCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-red-500 text-white">
                {reportsCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
      </div>
      
      {showRightScroll && (
        <button 
          onClick={() => scroll('right')} 
          className="absolute right-0 z-10 flex h-full items-center justify-center bg-gradient-to-l from-orange-50 to-transparent pl-4 pr-1"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-5 w-5 text-gray-600" />
        </button>
      )}
    </div>
  );
};

export default AdminTabs;
