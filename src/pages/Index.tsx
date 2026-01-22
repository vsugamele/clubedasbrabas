import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth";
import { useLocation, useSearchParams, useParams } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import PostFeed from "@/components/feed/PostFeed";
import TrendingPosts from "@/components/feed/TrendingPosts";
import EventsList from "@/components/feed/EventsList";
import { fetchEvents } from "@/components/admin/events/eventService";
import { Event } from "@/components/admin/communities/types";
import { TrendingPost } from "@/services/trendingService";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const params = useParams();
  const [communityName, setCommunityName] = useState<string | null>(null);
  
  // Obter os parâmetros da URL
  const communityIdFromParams = params.id; // ID da comunidade da rota /c/:id
  const communityIdFromQuery = searchParams.get('community'); // ID da comunidade de query params
  const categoryId = searchParams.get('category');
  
  // Usar o ID da comunidade da rota se disponível, caso contrário usar o ID da query
  const communityId = communityIdFromParams || communityIdFromQuery;
  
  // Log para depuração
  useEffect(() => {
    if (communityId || categoryId) {
      console.log(`Página Index - Parâmetros da URL: communityId=${communityId}, categoryId=${categoryId}`);
    }
  }, [communityId, categoryId]);
  
  // Buscar o nome da comunidade quando o communityId mudar
  useEffect(() => {
    const fetchCommunityName = async () => {
      if (communityId) {
        try {
          const { data, error } = await supabase
            .from('communities')
            .select('name')
            .eq('id', communityId)
            .single();
            
          if (error) {
            console.error("Erro ao buscar nome da comunidade:", error);
            return;
          }
          
          if (data && data.name) {
            setCommunityName(data.name);
            // Atualizar o título da página com o nome da comunidade
            document.title = `${data.name} | Clube das Brabas`;
          }
        } catch (error) {
          console.error("Erro ao buscar nome da comunidade:", error);
        }
      } else {
        // Resetar o nome da comunidade e o título da página
        setCommunityName(null);
        document.title = "Clube das Brabas";
      }
    };
    
    fetchCommunityName();
  }, [communityId]);
  
  useEffect(() => {
    document.title = "Clube das Brabas";
    
    // Carregar eventos
    const loadEvents = async () => {
      try {
        setIsLoading(true);
        const eventsData = await fetchEvents();
        
        // Filtrar apenas os próximos eventos (a partir de hoje)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const upcomingEvents = eventsData.filter(event => {
          const eventDate = new Date(event.date);
          eventDate.setHours(0, 0, 0, 0);
          return eventDate >= today;
        });
        
        // Ordenar por data (mais próximos primeiro)
        const sortedEvents = upcomingEvents.sort((a, b) => {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        });
        
        // Limitar a 3 eventos
        setEvents(sortedEvents.slice(0, 3));
      } catch (error) {
        console.error("Erro ao carregar eventos:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadEvents();
  }, []);

  return (
    <MainLayout>
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="col-span-1 md:col-span-2">
            <h1 className="text-2xl font-bold mb-6">
              {communityName ? communityName : "Destaques"}
            </h1>
            <PostFeed communityId={communityId || undefined} categoryId={categoryId || undefined} />
          </div>
          
          <div className="space-y-8">
            <TrendingPosts />
            <EventsList events={events} />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
