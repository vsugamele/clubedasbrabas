
import { supabase } from "@/integrations/supabase/client";
import { Event, EventForm, mapEventFromSupabase } from "../communities/types";
import { toast } from "sonner";
import { 
  queryWithRetry, 
  asPromise,
  fetchWithTimeout,
  SHORT_TIMEOUT
} from "../hooks/utils/queryUtils";

// Função auxiliar para mostrar erros com toast
const handleError = (error: any, message: string) => {
  console.error(`${message}:`, error);
  toast.error(`Erro: ${message}`, { position: "bottom-right" });
};

// Carregar eventos do Supabase
export const fetchEvents = async (): Promise<Event[]> => {
  try {
    console.log("Iniciando carregamento de eventos...");
    
    const result = await queryWithRetry<any>(() => 
      asPromise(() => supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true }))
    );
    
    if (result.error) {
      throw result.error;
    }
    
    console.log("Eventos carregados do Supabase:", result.data);
    return result.data ? result.data.map((event: any) => mapEventFromSupabase(event)) : [];
  } catch (error) {
    handleError(error, "Não foi possível carregar os eventos");
    return [];
  }
};

// Adicionar novo evento no Supabase
export const addEvent = async (form: EventForm): Promise<Event> => {
  try {
    const eventData = {
      title: form.title,
      description: form.description,
      presenter: form.presenter,
      date: form.date.toISOString(),
      time_start: form.timeStart,
      time_end: form.timeEnd,
      location: form.location
    };
    
    // Use fetchWithTimeout para evitar problemas de conexão
    const insertPromise = async () => {
      return await supabase
        .from('events')
        .insert(eventData)
        .select()
        .single();
    };
    
    const { data, error } = await fetchWithTimeout(insertPromise, SHORT_TIMEOUT);
      
    if (error) {
      throw error;
    }
    
    if (!data) {
      throw new Error("Não foi possível obter os dados do evento após a criação");
    }
    
    const newEvent = mapEventFromSupabase(data);
    
    toast.success(`Evento "${form.title}" criado com sucesso`, { position: "bottom-right" });
    console.log("Evento criado no Supabase:", newEvent);
    
    return newEvent;
  } catch (error) {
    handleError(error, "Não foi possível criar o evento");
    
    // Retornar um evento de fallback em caso de erro
    return {
      id: String(Date.now()),
      title: form.title,
      description: form.description,
      presenter: form.presenter,
      date: form.date,
      timeStart: form.timeStart,
      timeEnd: form.timeEnd,
      location: form.location,
      createdAt: new Date().toISOString()
    };
  }
};

// Atualizar evento existente no Supabase
export const updateEvent = async (id: string, form: EventForm): Promise<Event> => {
  try {
    const eventData = {
      title: form.title,
      description: form.description,
      presenter: form.presenter,
      date: form.date.toISOString(),
      time_start: form.timeStart,
      time_end: form.timeEnd,
      location: form.location
    };
    
    // Use fetchWithTimeout para evitar problemas de conexão
    const updatePromise = async () => {
      return await supabase
        .from('events')
        .update(eventData)
        .eq('id', id)
        .select()
        .single();
    };
    
    const { data, error } = await fetchWithTimeout(updatePromise, SHORT_TIMEOUT);
      
    if (error) {
      throw error;
    }
    
    if (!data) {
      throw new Error("Não foi possível obter os dados do evento após a atualização");
    }
    
    const updatedEvent = mapEventFromSupabase(data);
    
    toast.success(`Evento "${form.title}" atualizado com sucesso`, { position: "bottom-right" });
    console.log("Evento atualizado no Supabase:", updatedEvent);
    
    return updatedEvent;
  } catch (error) {
    handleError(error, "Não foi possível atualizar o evento");
    
    // Retornar um evento de fallback com os dados atuais
    return {
      id,
      title: form.title,
      description: form.description,
      presenter: form.presenter,
      date: form.date,
      timeStart: form.timeStart,
      timeEnd: form.timeEnd,
      location: form.location,
      createdAt: new Date().toISOString()
    };
  }
};

// Excluir evento do Supabase
export const deleteEvent = async (id: string, name: string): Promise<void> => {
  try {
    // Use fetchWithTimeout para evitar problemas de conexão
    const deletePromise = async () => {
      return await supabase
        .from('events')
        .delete()
        .eq('id', id);
    };
    
    const { error } = await fetchWithTimeout(deletePromise, SHORT_TIMEOUT);
      
    if (error) {
      throw error;
    }
    
    toast.success(`Evento "${name}" excluído com sucesso`, { position: "bottom-right" });
    console.log("Evento excluído do Supabase, ID:", id);
  } catch (error) {
    handleError(error, "Não foi possível excluir o evento");
  }
};
