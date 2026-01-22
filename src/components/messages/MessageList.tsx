import React, { useRef, useEffect } from "react";
import { useAuth } from "@/context/auth";
import { useMessages } from "./MessagesContext";
import { Check, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const MessageList = () => {
  const { messages, selectedContact } = useMessages();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
    }
  };

  if (!messages.length) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </div>
        <h3 className="text-lg font-medium mb-2">Nenhuma mensagem ainda</h3>
        <p className="text-muted-foreground text-sm">
          Comece uma conversa com {selectedContact?.full_name || "este contato"}
        </p>
      </div>
    );
  }

  // Agrupar mensagens por data
  const groupedMessages: { [date: string]: typeof messages } = {};
  messages.forEach((message) => {
    const date = new Date(message.created_at).toDateString();
    if (!groupedMessages[date]) {
      groupedMessages[date] = [];
    }
    groupedMessages[date].push(message);
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      {Object.entries(groupedMessages).map(([date, dateMessages]) => (
        <div key={date} className="space-y-4">
          <div className="flex justify-center">
            <div className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full">
              {new Date(date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
          </div>
          
          {dateMessages.map((message, index) => {
            const isMine = message.sender_id === user?.id;
            const showAvatar = !isMine && (index === 0 || dateMessages[index - 1]?.sender_id !== message.sender_id);
            const isConsecutive = index > 0 && dateMessages[index - 1]?.sender_id === message.sender_id;
            
            return (
              <div 
                key={message.id} 
                className={`flex ${isMine ? "justify-end" : "justify-start"} ${isConsecutive ? "mt-1" : "mt-4"}`}
              >
                <div 
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    isMine 
                      ? "bg-brand-600 text-white" 
                      : "bg-gray-100 text-gray-800"
                  } ${isConsecutive ? "rounded-t-md" : ""}`}
                >
                  <p className="whitespace-pre-line">{message.content}</p>
                  <div className={`flex items-center justify-end gap-1 text-xs mt-1 ${isMine ? "text-brand-100" : "text-gray-500"}`}>
                    <span>{formatMessageDate(message.created_at)}</span>
                    {isMine && (
                      message.is_read 
                        ? <CheckCheck className="h-3 w-3" /> 
                        : <Check className="h-3 w-3" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
