import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth";
import { useLocation, useSearchParams } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import PostFeed from "@/components/feed/PostFeed";
import TrendingPosts from "@/components/feed/TrendingPosts";
import EventsList from "@/components/feed/EventsList";
import { fetchEvents } from "@/components/admin/events/eventService";
import { Event } from "@/components/admin/communities/types";

// Sample data for sidebar components
const mockTrendingPosts = [
  { id: "1", title: "Como aumentar seu networking profissional", author: "Marina Silva", likes: 45 },
  { id: "2", title: "5 dicas para organizar sua rotina de trabalho", author: "Carlos Oliveira", likes: 38 },
  { id: "3", title: "Empreendedorismo feminino: desafios e conquistas", author: "Ana Souza", likes: 27 }
];

const Index = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Obter os parâmetros da URL
  const communityId = searchParams.get('community');
  const categoryId = searchParams.get('category');
  
  // Log para depuração
  useEffect(() => {
    if (communityId || categoryId) {
      console.log(`Página Index - Parâmetros da URL: communityId=${communityId}, categoryId=${categoryId}`);
      
      // Verificar se estamos na comunidade "Sejam Bem Vindas"
      if (communityId === "4") { // Assumindo que 4 é o ID da comunidade "Sejam Bem Vindas"
        console.log("Acessando a comunidade Sejam Bem Vindas");
      }
      
      // Verificar se estamos na comunidade "Marketing"
      if (communityId === "5") { // Assumindo que 5 é o ID da comunidade "Marketing"
        console.log("Acessando a comunidade Marketing");
      }
      
      // Verificar todos os IDs de comunidade possíveis
      if (communityId) {
        console.log(`ID da comunidade atual: ${communityId}`);
      }
    }
  }, [communityId, categoryId]);
  
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
            <h1 className="text-2xl font-bold mb-6">Destaques</h1>
            <PostFeed communityId={communityId || undefined} categoryId={categoryId || undefined} />
          </div>
          
          <div className="space-y-8">
            <TrendingPosts posts={mockTrendingPosts} />
            <EventsList events={events} />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
