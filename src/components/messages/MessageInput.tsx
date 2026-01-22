import React, { KeyboardEvent } from "react";
import { Send, Smile, PaperclipIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMessages } from "./MessagesContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const MessageInput = () => {
  const { newMessage, setNewMessage, sendMessage } = useMessages();

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Enviar mensagem com Enter (sem Shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (newMessage.trim()) {
        sendMessage(e as any);
      }
    }
  };

  return (
    <div className="p-3 border-t bg-white">
      <form onSubmit={sendMessage} className="flex items-center gap-2 relative">
        <div className="flex-1 relative">
          <Input 
            placeholder="Digite sua mensagem..." 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pr-20 py-6 focus-visible:ring-brand-500"
            autoComplete="off"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    type="button" 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8 text-gray-500 hover:text-gray-700"
                  >
                    <Smile className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Emojis (em breve)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    type="button" 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8 text-gray-500 hover:text-gray-700"
                  >
                    <PaperclipIcon className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Anexos (em breve)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <Button 
          type="submit" 
          size="icon" 
          className="h-10 w-10 rounded-full bg-brand-600 hover:bg-brand-700"
          disabled={!newMessage.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
      <div className="text-xs text-gray-400 mt-1 text-center">
        Pressione Enter para enviar, Shift+Enter para nova linha
      </div>
    </div>
  );
};

export default MessageInput;
