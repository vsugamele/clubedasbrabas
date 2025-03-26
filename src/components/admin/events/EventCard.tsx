
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Event } from "../communities/types";

interface EventCardProps {
  event: Event;
  onEdit?: () => void;
}

export const EventCard = ({ event, onEdit }: EventCardProps) => {
  return (
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
              {format(event.date, "PPPP", { locale: ptBR })}
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
  );
};

export default EventCard;
