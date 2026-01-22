
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Plus, RefreshCw } from "lucide-react";
import { useAuth } from "@/context/auth";
import { fetchEvents } from "./eventService";
import { Event } from "../communities/types";
import EventFormDialog from "./EventFormDialog";
import EventCard from "./EventCard";
import { EmptyState } from "@/components/feed/EmptyState";
import { StatusBadge } from "@/components/ui/status-badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export const EventManagement = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { user } = useAuth();

  // Verificar se o usuário é admin (implementação simplificada, deve ser melhorada)
  const isAdmin = !!user;

  useEffect(() => {
    loadEvents();
  }, [refreshTrigger]);

  const loadEvents = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchEvents();
      setEvents(data);
    } catch (error) {
      console.error("Erro ao carregar eventos:", error);
      setLoadError("Não foi possível carregar os eventos. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = () => {
    setSelectedEvent(null);
    setOpenCreateDialog(true);
  };

  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event);
    setOpenCreateDialog(true);
  };

  const handleEventUpdated = () => {
    setOpenCreateDialog(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center p-12">
          <LoadingSpinner size="lg" text="Carregando eventos..." />
        </div>
      );
    }

    if (loadError) {
      return (
        <EmptyState
          variant="generic"
          title="Erro ao carregar eventos"
          description={loadError}
          icon={<RefreshCw className="h-12 w-12 text-muted-foreground/60" />}
          actionLabel="Tentar novamente"
          onAction={handleRefresh}
        />
      );
    }

    if (events.length === 0) {
      return (
        <EmptyState
          variant="generic"
          title="Nenhum evento encontrado"
          description="Não há eventos cadastrados no momento."
          icon={<Calendar className="h-12 w-12 text-muted-foreground/60" />}
          actionLabel={isAdmin ? "Criar evento" : undefined}
          onAction={isAdmin ? handleCreateEvent : undefined}
        />
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <EventCard 
            key={event.id} 
            event={event} 
            onEdit={isAdmin ? () => handleEditEvent(event) : undefined} 
          />
        ))}
      </div>
    );
  };

  // Usar o campo correto da data para filtrar eventos futuros
  const upcomingEventsCount = events.filter(
    event => new Date(event.date) > new Date()
  ).length;

  return (
    <Card className="border-[#ff920e]/20 neo-effect overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between bg-muted/50 dark:bg-muted/30 border-b">
        <div>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5 text-brand-primary" />
            Gerenciamento de Eventos
            {upcomingEventsCount > 0 && (
              <StatusBadge 
                variant="brand" 
                className="ml-2"
              >
                {upcomingEventsCount} próximo{upcomingEventsCount > 1 ? 's' : ''}
              </StatusBadge>
            )}
          </CardTitle>
          <CardDescription>Gerencie os eventos da plataforma</CardDescription>
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={loading}
            title="Atualizar eventos"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          
          {isAdmin && (
            <Button 
              onClick={handleCreateEvent}
              className="bg-brand-primary hover:bg-brand-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" /> Novo Evento
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {renderContent()}
      </CardContent>
      
      <EventFormDialog
        open={openCreateDialog}
        onOpenChange={setOpenCreateDialog}
        event={selectedEvent}
        onSuccess={handleEventUpdated}
      />
    </Card>
  );
};

export default EventManagement;
