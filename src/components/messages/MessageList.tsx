
import React, { useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useMessages } from "./MessagesContext";

const MessageList = () => {
  const { messages } = useMessages();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!messages.length) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">Comece a conversar agora</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => {
        const isMine = message.sender_id === user?.id;
        
        return (
          <div 
            key={message.id} 
            className={`flex ${isMine ? "justify-end" : "justify-start"}`}
          >
            <div 
              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                isMine 
                  ? "bg-brand-600 text-white" 
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              <p>{message.content}</p>
              <p className={`text-xs mt-1 ${isMine ? "text-brand-100" : "text-gray-500"}`}>
                {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
