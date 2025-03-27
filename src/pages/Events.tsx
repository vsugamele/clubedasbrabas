import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth";
import MainLayout from "@/components/layout/MainLayout";
import { fetchEvents } from "@/components/admin/events/eventService";
import { Event } from "@/components/admin/communities/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, MapPin, User, Link as LinkIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const Events = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    document.title = "Eventos | Clube das Brabas";
    
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
        
        setEvents(sortedEvents);
      } catch (error) {
        console.error("Erro ao carregar eventos:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadEvents();
  }, []);

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setIsDialogOpen(true);
  };

  const formatEventDate = (date: Date) => {
    return format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  return (
    <MainLayout>
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Próximos Eventos</h1>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, index) => (
              <Card key={index} className="overflow-hidden">
                <CardHeader>
                  <Skeleton className="h-8 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Card 
                key={event.id} 
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleEventClick(event)}
              >
                <CardHeader className="bg-brand-50 border-b">
                  <CardTitle className="text-xl text-brand-700">{event.title}</CardTitle>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>{formatEventDate(new Date(event.date))}</span>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center text-sm">
                      <User className="h-4 w-4 mr-2 text-brand-600" />
                      <span>{event.presenter}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Clock className="h-4 w-4 mr-2 text-brand-600" />
                      <span>{event.timeStart} - {event.timeEnd}</span>
                    </div>
                    {event.location && (
                      <div className="flex items-center text-sm">
                        <MapPin className="h-4 w-4 mr-2 text-brand-600" />
                        <span>{event.location}</span>
                      </div>
                    )}
                    {event.link && (
                      <div className="flex items-center text-sm">
                        <LinkIcon className="h-4 w-4 mr-2 text-brand-600" />
                        <span className="truncate">Link disponível</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-xl font-medium mb-2">Nenhum evento encontrado</h3>
            <p className="text-muted-foreground">
              Não há eventos programados para os próximos dias.
            </p>
          </div>
        )}
      </div>

      {/* Dialog de detalhes do evento */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl text-brand-700">{selectedEvent.title}</DialogTitle>
                <div className="flex items-center text-sm mt-2">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>{formatEventDate(new Date(selectedEvent.date))}</span>
                </div>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="flex items-center">
                  <User className="h-5 w-5 mr-3 text-brand-600" />
                  <div>
                    <p className="text-sm font-medium">Apresentador</p>
                    <p className="text-sm text-muted-foreground">{selectedEvent.presenter}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-3 text-brand-600" />
                  <div>
                    <p className="text-sm font-medium">Horário</p>
                    <p className="text-sm text-muted-foreground">{selectedEvent.timeStart} - {selectedEvent.timeEnd}</p>
                  </div>
                </div>
                
                {selectedEvent.location && (
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 mr-3 text-brand-600" />
                    <div>
                      <p className="text-sm font-medium">Local</p>
                      <p className="text-sm text-muted-foreground">{selectedEvent.location}</p>
                    </div>
                  </div>
                )}
                
                {selectedEvent.link && (
                  <div className="flex items-center">
                    <LinkIcon className="h-5 w-5 mr-3 text-brand-600" />
                    <div>
                      <p className="text-sm font-medium">Link</p>
                      <a 
                        href={selectedEvent.link} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-sm text-brand-600 hover:underline"
                      >
                        {selectedEvent.link}
                      </a>
                    </div>
                  </div>
                )}
                
                {selectedEvent.description && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium mb-2">Descrição</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {selectedEvent.description}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end mt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Fechar
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Events;
