
import { useEffect } from "react";
import { useAuth } from "@/context/auth";
import MainLayout from "@/components/layout/MainLayout";
import PostFeed from "@/components/feed/PostFeed";
import TrendingPosts from "@/components/feed/TrendingPosts";
import EventsList from "@/components/feed/EventsList";
import ConnectionSuggestions from "@/components/feed/ConnectionSuggestions";

// Sample data for sidebar components
const mockTrendingPosts = [
  { id: "1", title: "Como aumentar seu networking profissional", author: "Marina Silva", likes: 45 },
  { id: "2", title: "5 dicas para organizar sua rotina de trabalho", author: "Carlos Oliveira", likes: 38 },
  { id: "3", title: "Empreendedorismo feminino: desafios e conquistas", author: "Ana Souza", likes: 27 }
];

const mockEvents = [
  { 
    id: "1", 
    title: "Workshop de Marketing Digital", 
    presenter: "João Paulo", 
    date: new Date("2023-10-25"), 
    timeStart: "14:00", 
    timeEnd: "16:00" 
  },
  { 
    id: "2", 
    title: "Palestra sobre Liderança", 
    presenter: "Carla Mendes", 
    date: new Date("2023-10-28"), 
    timeStart: "18:30", 
    timeEnd: "20:00" 
  }
];

const mockSuggestions = [
  "Fernanda Oliveira",
  "Roberto Almeida",
  "Luciana Torres"
];

const Index = () => {
  const { user } = useAuth();
  
  useEffect(() => {
    document.title = "Clube das Brabas";
  }, []);

  return (
    <MainLayout>
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="col-span-1 md:col-span-2">
            <h1 className="text-2xl font-bold mb-6">Destaques</h1>
            <PostFeed />
          </div>
          
          <div className="space-y-8">
            <TrendingPosts posts={mockTrendingPosts} />
            <EventsList events={mockEvents} />
            <ConnectionSuggestions suggestions={mockSuggestions} />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
