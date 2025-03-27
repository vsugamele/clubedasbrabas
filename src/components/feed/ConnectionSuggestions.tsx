import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { SuggestedConnection } from "@/services/connectionService";
import { useState } from "react";
import { createConnection } from "@/services/connectionService";
import { toast } from "sonner";
import { useAuth } from "@/context/auth";

interface ConnectionSuggestionsProps {
  suggestions: SuggestedConnection[];
  onConnect?: (userId: string) => void;
}

const ConnectionSuggestions = ({ suggestions, onConnect }: ConnectionSuggestionsProps) => {
  const { user } = useAuth();
  const [connectingIds, setConnectingIds] = useState<string[]>([]);
  const [connectedIds, setConnectedIds] = useState<string[]>([]);

  const handleConnect = async (userId: string) => {
    if (!user) return;
    
    setConnectingIds(prev => [...prev, userId]);
    
    try {
      const success = await createConnection(user.id, userId);
      
      if (success) {
        setConnectedIds(prev => [...prev, userId]);
        toast.success("Conexão realizada com sucesso!", { position: "bottom-right" });
        if (onConnect) onConnect(userId);
      } else {
        toast.error("Não foi possível realizar a conexão.", { position: "bottom-right" });
      }
    } catch (error) {
      console.error("Erro ao conectar:", error);
      toast.error("Erro ao realizar a conexão.", { position: "bottom-right" });
    } finally {
      setConnectingIds(prev => prev.filter(id => id !== userId));
    }
  };

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <Card className="overflow-hidden border-[#ff920e]/20">
      <CardContent className="p-5">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-[#ff4400]" />
          <span>Sugestões de Conexões</span>
        </h3>
        
        <div className="space-y-4">
          {suggestions.map((connection) => (
            <div key={connection.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={connection.avatar_url || ""} alt={connection.full_name} />
                  <AvatarFallback className="bg-[#ff4400]/10 text-[#ff4400]">
                    {connection.full_name 
                      ? connection.full_name.substring(0, 2).toUpperCase() 
                      : connection.username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-sm">{connection.full_name || connection.username}</div>
                  <div className="text-xs text-muted-foreground">
                    {connection.occupation || "Membro da comunidade"}
                  </div>
                </div>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className={
                  connectedIds.includes(connection.id)
                    ? "bg-[#ff4400]/10 text-[#ff4400] border-[#ff4400]"
                    : "border-[#ff920e]/30 hover:bg-[#ff4400]/10 hover:text-[#ff4400] hover:border-[#ff4400]"
                }
                disabled={connectingIds.includes(connection.id) || connectedIds.includes(connection.id)}
                onClick={() => handleConnect(connection.id)}
              >
                {connectingIds.includes(connection.id) 
                  ? "Conectando..." 
                  : connectedIds.includes(connection.id) 
                    ? "Conectado" 
                    : "Conectar"}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ConnectionSuggestions;
