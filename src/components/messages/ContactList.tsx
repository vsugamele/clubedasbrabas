import React, { useState } from "react";
import { Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { useMessages } from "./MessagesContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ContactList = () => {
  const { 
    filteredContacts, 
    setSelectedContact, 
    selectedContact, 
    loading, 
    searchQuery, 
    setSearchQuery,
    allMembers,
    loadingMembers
  } = useMessages();

  const [activeTab, setActiveTab] = useState<"chats" | "members">("chats");

  return (
    <div className="border-r border-gray-200 h-full flex flex-col">
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder={activeTab === "chats" ? "Buscar contatos" : "Buscar membros"} 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <Tabs 
        defaultValue="chats" 
        className="w-full" 
        onValueChange={(value) => setActiveTab(value as "chats" | "members")}
      >
        <div className="border-b px-1">
          <TabsList className="w-full">
            <TabsTrigger value="chats" className="flex-1">Conversas</TabsTrigger>
            <TabsTrigger value="members" className="flex-1">Membros</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="chats" className="overflow-y-auto flex-1 m-0 p-0">
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
        </TabsContent>
        
        <TabsContent value="members" className="overflow-y-auto flex-1 m-0 p-0">
          {loadingMembers ? (
            <div className="p-4 text-center text-muted-foreground">Carregando membros...</div>
          ) : allMembers && allMembers.length > 0 ? (
            allMembers.map(member => (
              <div 
                key={member.id}
                onClick={() => setSelectedContact(member)}
                className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedContact?.id === member.id ? "bg-gray-100" : ""
                }`}
              >
                <Avatar>
                  <AvatarImage src={member.avatar_url} alt={member.full_name} />
                  <AvatarFallback>
                    {member.full_name?.substring(0, 2).toUpperCase() || "??"}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{member.full_name}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    @{member.username}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              Nenhum membro encontrado
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContactList;
