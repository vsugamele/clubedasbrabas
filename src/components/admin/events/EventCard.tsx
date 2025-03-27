import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, User, Link as LinkIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Event } from "../communities/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";

interface EventCardProps {
  event: Event;
  onEdit?: () => void;
}

export const EventCard = ({ event, onEdit }: EventCardProps) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <>
      <Card className="overflow-hidden border-[#ff920e]/20 hover:border-[#ff4400]/30 transition-colors">
        <CardHeader className="bg-orange-50/50 pb-2">
          <h3 className="font-semibold text-lg line-clamp-1">{event.title}</h3>
          <div className="flex items-center text-sm text-muted-foreground">
            <User className="h-4 w-4 mr-1" />
            <span>{event.presenter}</span>
          </div>
        </CardHeader>
        
        <CardContent className="pt-3">
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-[#ff4400] mt-1 shrink-0" />
              <span className="text-sm">
                {format(new Date(event.date), "PPPP", { locale: ptBR })}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#ff4400] shrink-0" />
              <span className="text-sm">
                {event.timeStart} - {event.timeEnd}
              </span>
            </div>
            
            {event.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#ff4400] shrink-0" />
                <span className="text-sm line-clamp-1">{event.location}</span>
              </div>
            )}
            
            {event.link && (
              <div className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4 text-[#ff4400] shrink-0" />
                <span className="text-sm line-clamp-1">Link disponível</span>
              </div>
            )}
            
            <p className="text-sm text-muted-foreground line-clamp-3 pt-1">
              {event.description}
            </p>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between pt-2 pb-3">
          <Button 
            variant="outline" 
            size="sm"
            className="text-xs"
            onClick={() => setShowDetails(true)}
          >
            Ver Detalhes
          </Button>
          
          {onEdit && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onEdit}
              className="text-xs"
            >
              Editar
            </Button>
          )}
        </CardFooter>
      </Card>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl text-brand-700">{event.title}</DialogTitle>
            <div className="flex items-center text-sm mt-2">
              <Calendar className="h-4 w-4 mr-2" />
              <span>{format(new Date(event.date), "PPPP", { locale: ptBR })}</span>
            </div>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center">
              <User className="h-5 w-5 mr-3 text-brand-600" />
              <div>
                <p className="text-sm font-medium">Apresentador</p>
                <p className="text-sm text-muted-foreground">{event.presenter}</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-3 text-brand-600" />
              <div>
                <p className="text-sm font-medium">Horário</p>
                <p className="text-sm text-muted-foreground">{event.timeStart} - {event.timeEnd}</p>
              </div>
            </div>
            
            {event.location && (
              <div className="flex items-center">
                <MapPin className="h-5 w-5 mr-3 text-brand-600" />
                <div>
                  <p className="text-sm font-medium">Local</p>
                  <p className="text-sm text-muted-foreground">{event.location}</p>
                </div>
              </div>
            )}
            
            {event.link && (
              <div className="flex items-center">
                <LinkIcon className="h-5 w-5 mr-3 text-brand-600" />
                <div className="max-w-full">
                  <p className="text-sm font-medium">Link</p>
                  <a 
                    href={event.link} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-sm text-brand-600 hover:underline break-all"
                  >
                    {event.link}
                  </a>
                </div>
              </div>
            )}
            
            <div className="mt-6">
              <h4 className="text-sm font-medium mb-2">Descrição</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {event.description}
              </p>
            </div>
          </div>
          
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => setShowDetails(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EventCard;
