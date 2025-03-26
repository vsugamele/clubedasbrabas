
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";

interface ConnectionSuggestionsProps {
  suggestions: string[];
}

const ConnectionSuggestions = ({ suggestions }: ConnectionSuggestionsProps) => {
  return (
    <Card className="overflow-hidden border-[#ff920e]/20">
      <CardContent className="p-5">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-[#ff4400]" />
          <span>Sugestões de Conexões</span>
        </h3>
        
        <div className="space-y-4">
          {suggestions.map((name, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" alt={name} />
                  <AvatarFallback className={index % 2 === 0 ? "bg-[#ff4400]/10 text-[#ff4400]" : "bg-[#006bf7]/10 text-[#006bf7]"}>
                    {name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-sm">{name}</div>
                  <div className="text-xs text-muted-foreground">
                    {index === 0 ? "Marketing Digital" : index === 1 ? "Empreendedor" : "Vendas"}
                  </div>
                </div>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="border-[#ff920e]/30 hover:bg-[#ff4400]/10 hover:text-[#ff4400] hover:border-[#ff4400]"
              >
                Conectar
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ConnectionSuggestions;
