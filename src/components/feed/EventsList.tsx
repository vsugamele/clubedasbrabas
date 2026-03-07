
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

interface Event {
  id: string;
  title: string;
  presenter: string;
  date: Date;
  timeStart: string;
  timeEnd: string;
}

interface EventsListProps {
  events: Event[];
}

const EventsList = ({ events }: EventsListProps) => {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-brand-600" />
          <span>Próximos Eventos</span>
        </h3>
        
        <div className="space-y-4">
          {events.map((event) => (
            <div key={event.id} className="group animate-fade-in">
              <div className="flex gap-3">
                <div className="flex flex-col items-center min-w-fit">
                  <div className="text-2xl font-bold text-brand-600">
                    {event.date.getDate()}
                  </div>
                  <div className="text-xs uppercase text-muted-foreground">
                    {event.date.toLocaleString('pt-BR', { month: 'short' })}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <h4 className="font-medium line-clamp-2 group-hover:text-brand-600 transition-colors">
                    <Link to={`/eventos/${event.id}`}>{event.title}</Link>
                  </h4>
                  <p className="text-sm text-muted-foreground">com {event.presenter}</p>
                  <p className="text-xs text-muted-foreground">
                    {event.timeStart} - {event.timeEnd} PM
                  </p>
                </div>
              </div>
              
              <Separator className="my-3" />
            </div>
          ))}
        </div>
        
        <Button variant="outline" className="w-full mt-2" asChild>
          <Link to="/eventos" className="flex items-center gap-2">
            <span>Ver todos os eventos</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default EventsList;
