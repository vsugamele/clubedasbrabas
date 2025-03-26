
import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { useMessages } from "./MessagesContext";

const ContactList = () => {
  const { 
    filteredContacts, 
    setSelectedContact, 
    selectedContact, 
    loading, 
    searchQuery, 
    setSearchQuery 
  } = useMessages();

  return (
    <div className="border-r border-gray-200 h-full flex flex-col">
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar contatos" 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <div className="overflow-y-auto flex-1">
        {loading ? (
          <div className="p-4 text-center text-muted-foreground">Carregando...</div>
        ) : filteredContacts.length > 0 ? (
          filteredContacts.map(contact => (
            <div 
              key={contact.id}
              onClick={() => setSelectedContact(contact)}
              className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedContact?.id === contact.id ? "bg-gray-100" : ""
              }`}
            >
              <div className="relative">
                <Avatar>
                  <AvatarImage src={contact.avatar_url} alt={contact.full_name} />
                  <AvatarFallback>
                    {contact.full_name?.substring(0, 2).toUpperCase() || "??"}
                  </AvatarFallback>
                </Avatar>
                {contact.unread_count > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-600 rounded-full text-[10px] text-white flex items-center justify-center">
                    {contact.unread_count}
                  </span>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{contact.full_name}</p>
                <p className="text-sm text-muted-foreground truncate">
                  @{contact.username}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            Nenhum contato encontrado
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactList;
