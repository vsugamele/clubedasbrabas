import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Event, EventForm } from "../communities/types";
import { addEvent, updateEvent } from "./eventService";

const formSchema = z.object({
  title: z.string().min(3, "O título deve ter pelo menos 3 caracteres").max(100, "O título não pode exceder 100 caracteres"),
  description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres"),
  presenter: z.string().min(3, "O nome do apresentador deve ter pelo menos 3 caracteres"),
  date: z.date({ required_error: "Uma data é obrigatória" }),
  timeStart: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido (HH:MM)"),
  timeEnd: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido (HH:MM)"),
  location: z.string().optional(),
  link: z.string().url("O link deve ser uma URL válida").optional(),
});

interface EventFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event | null;
  onSuccess: () => void;
}

export const EventFormDialog = ({ open, onOpenChange, event, onSuccess }: EventFormDialogProps) => {
  const [loading, setLoading] = useState(false);
  const isEditing = !!event;
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: event?.title || "",
      description: event?.description || "",
      presenter: event?.presenter || "",
      date: event?.date || new Date(),
      timeStart: event?.timeStart || "09:00",
      timeEnd: event?.timeEnd || "17:00",
      location: event?.location || "",
      link: event?.link || "",
    },
  });
  
  useEffect(() => {
    if (event) {
      form.reset({
        title: event.title,
        description: event.description,
        presenter: event.presenter,
        date: new Date(event.date),
        timeStart: event.timeStart,
        timeEnd: event.timeEnd,
        location: event.location || "",
        link: event.link || "",
      });
    } else {
      form.reset({
        title: "",
        description: "",
        presenter: "",
        date: new Date(),
        timeStart: "09:00",
        timeEnd: "17:00",
        location: "",
        link: "",
      });
    }
  }, [event, form]);
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      const eventForm: EventForm = {
        title: values.title,
        description: values.description,
        presenter: values.presenter,
        date: values.date,
        timeStart: values.timeStart,
        timeEnd: values.timeEnd,
        location: values.location,
        link: values.link,
      };
      
      if (isEditing && event) {
        await updateEvent(event.id, eventForm);
      } else {
        await addEvent(eventForm);
      }
      
      onSuccess();
    } catch (error) {
      console.error("Erro ao salvar evento:", error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Evento" : "Criar Novo Evento"}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Atualize os detalhes do evento existente" 
              : "Adicione um novo evento para a comunidade"}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título do Evento</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Título do evento"
                      className="border-[#ff920e]/20 focus-visible:ring-[#ff4400]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descrição detalhada do evento"
                      className="border-[#ff920e]/20 focus-visible:ring-[#ff4400]"
                      rows={4}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="presenter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apresentador</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Nome do apresentador"
                      className="border-[#ff920e]/20 focus-visible:ring-[#ff4400]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal border-[#ff920e]/20 focus-visible:ring-[#ff4400]",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: ptBR })
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Local (opcional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Local do evento"
                        className="border-[#ff920e]/20 focus-visible:ring-[#ff4400]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link (opcional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Link do evento"
                      className="border-[#ff920e]/20 focus-visible:ring-[#ff4400]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="timeStart"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora de Início</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="00:00"
                        className="border-[#ff920e]/20 focus-visible:ring-[#ff4400]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="timeEnd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora de Término</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="00:00"
                        className="border-[#ff920e]/20 focus-visible:ring-[#ff4400]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-[#ff4400] hover:bg-[#ff4400]/90"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span> 
                    Salvando...
                  </>
                ) : isEditing ? "Atualizar Evento" : "Criar Evento"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EventFormDialog;
