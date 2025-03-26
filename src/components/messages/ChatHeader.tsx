
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { useMessages } from "./MessagesContext";

const ChatHeader = () => {
  const { selectedContact } = useMessages();

  if (!selectedContact) return null;

  return (
    <div className="p-3 border-b flex items-center gap-3">
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
