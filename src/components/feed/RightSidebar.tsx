import { useState, useEffect, useCallback } from "react";
import EventsList from "./EventsList";
import TrendingPosts from "./TrendingPosts";
import ConnectionSuggestions from "./ConnectionSuggestions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Event {
  id: string;
  title: string;
  presenter: string;
  date: Date;
  timeStart: string;
  timeEnd: string;
}

interface TrendingPost {
  id: string;
  title: string;
  author: string;
  likes: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface RightSidebarProps {
  events: Event[];
  trendingPosts: TrendingPost[];
  connectionSuggestions: string[];
}

const RightSidebar = ({ events, trendingPosts, connectionSuggestions }: RightSidebarProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Add a retry mechanism with backoff
  const loadCategoriesWithRetry = useCallback(async (attempt = 0, forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      console.log(`Sidebar: Tentativa ${attempt + 1} de carregar categorias da community_categories...`);

      // Se forceRefresh for true, limpar o cache
      if (forceRefresh) {
        try {
          localStorage.removeItem('sidebar_categories');
          localStorage.removeItem('sidebar_categories_timestamp');
          console.log("Sidebar: Cache de categorias limpo forçadamente");
        } catch (e) {
          console.warn("Sidebar: Erro ao limpar cache:", e);
        }
      }

      const { data, error } = await supabase
        .from('community_categories')
        .select('*')
        .order('name');

      if (error) {
        console.error("Sidebar: Erro ao carregar categorias:", error);
        
        // If we haven't exceeded max retries, try again with exponential backoff
        if (attempt < 3) {
          const backoffTime = Math.min(1000 * Math.pow(2, attempt), 8000); // Exponential backoff: 1s, 2s, 4s, max 8s
          console.log(`Sidebar: Tentando novamente em ${backoffTime/1000}s...`);
          
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            loadCategoriesWithRetry(attempt + 1);
          }, backoffTime);
          return;
        }
        
        setError("Não foi possível carregar as categorias");
        return;
      }
      
      if (!data || data.length === 0) {
        console.log("Sidebar: Nenhuma categoria encontrada");
        setCategories([]);
        return;
      }
      
      console.log(`Sidebar: ${data.length} categorias carregadas com sucesso`);
      setCategories(data);
      
      // Cache the categories for future use
      try {
        localStorage.setItem('sidebar_categories', JSON.stringify(data));
        localStorage.setItem('sidebar_categories_timestamp', Date.now().toString());
        console.log("Sidebar: Categorias salvas em cache");
      } catch (e) {
        console.warn("Sidebar: Erro ao salvar cache:", e);
      }
    } catch (e) {
      console.error("Sidebar: Erro não tratado ao carregar categorias:", e);
      setError("Erro ao carregar categorias");
    } finally {
      setLoading(false);
    }
  }, []);

  // Effect to load categories on mount and when retryCount changes
  useEffect(() => {
    // Tentar usar cache primeiro
    try {
      const cachedData = localStorage.getItem('sidebar_categories');
      const timestamp = localStorage.getItem('sidebar_categories_timestamp');
      
      if (cachedData && timestamp) {
        const cachedTime = parseInt(timestamp);
        const now = Date.now();
        const cacheAge = now - cachedTime;
        
        // Use cache if it's less than 1 minute old (reduzido de 5 minutos para 1 minuto)
        if (cacheAge < 1 * 60 * 1000) {
          const parsedData = JSON.parse(cachedData);
          if (Array.isArray(parsedData) && parsedData.length > 0) {
            console.log("Sidebar: Usando categorias em cache");
            setCategories(parsedData);
            
            // Still load in background for next time, but don't show loading state
            loadCategoriesWithRetry(0, false);
            return;
          }
        } else {
          console.log("Sidebar: Cache expirado, recarregando categorias");
          loadCategoriesWithRetry(0, true);
          return;
        }
      }
    } catch (e) {
      console.warn("Erro ao ler cache de categorias:", e);
    }
    
    // If we get here, we need to load from API with loading state
    loadCategoriesWithRetry(0, true);
  }, [loadCategoriesWithRetry, retryCount]);

  // Manual refresh function
  const handleRefresh = () => {
    setRetryCount(prev => prev + 1);
    loadCategoriesWithRetry(0, true);
  };

  return (
    <div className="space-y-6">
      <EventsList events={events} />
      <TrendingPosts posts={trendingPosts} />
      
      {/* Lista de Categorias */}
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-medium">Categorias</h3>
          {error && (
            <button 
              onClick={handleRefresh}
              className="text-xs text-blue-500 hover:text-blue-700"
            >
              Tentar novamente
            </button>
          )}
        </div>
        
        {loading && categories.length === 0 ? (
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
          </div>
        ) : error && categories.length === 0 ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma categoria encontrada</p>
        ) : (
          <ul className="space-y-2">
            {categories.map((category) => (
              <li key={category.id} className="text-sm">
                <a href={`/category/${category.slug}`} className="hover:text-[#ff4400] transition-colors">
                  {category.name}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <ConnectionSuggestions suggestions={connectionSuggestions} />
    </div>
  );
};

export default RightSidebar;
