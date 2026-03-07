
import React from "react";
import { Send } from "lucide-react";

const EmptyState = () => {
  return (
    <div className="h-full flex items-center justify-center flex-col p-6">
      <div className="rounded-full bg-gray-100 p-3 mb-4">
        <Send className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="font-medium text-lg">Suas mensagens</h3>
      <p className="text-muted-foreground text-center mt-2">
        Selecione um contato para começar a conversar
      </p>
    </div>
  );
};

export default EmptyState;
