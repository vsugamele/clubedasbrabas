
import React from "react";
import { Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMessages } from "./MessagesContext";

const MessageInput = () => {
  const { newMessage, setNewMessage, sendMessage } = useMessages();

  return (
    <form onSubmit={sendMessage} className="p-3 border-t flex gap-2">
      <Input 
        placeholder="Digite sua mensagem..." 
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
      />
      <Button type="submit" size="icon">
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
};

export default MessageInput;
