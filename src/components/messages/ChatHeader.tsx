
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { useMessages } from "./MessagesContext";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const ChatHeader = () => {
  const { selectedContact, setSelectedContact } = useMessages();

  if (!selectedContact) return null;
  
  const handleBack = () => {
    setSelectedContact(null);
  };

  return (
    <div className="p-3 border-b flex items-center gap-3">
      <Button 
        variant="ghost" 
        size="icon" 
        className="mr-1 md:hidden" 
        onClick={handleBack}
        aria-label="Voltar para lista de contatos"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      
      <Avatar>
        <AvatarImage src={selectedContact.avatar_url} alt={selectedContact.full_name} />
        <AvatarFallback>
          {selectedContact.full_name?.substring(0, 2).toUpperCase() || "??"}
        </AvatarFallback>
      </Avatar>
      
      <div>
        <p className="font-medium">{selectedContact.full_name}</p>
        <p className="text-sm text-muted-foreground">@{selectedContact.username}</p>
      </div>
    </div>
  );
};

export default ChatHeader;
