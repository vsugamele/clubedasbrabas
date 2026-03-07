
import { toast } from "sonner";

// Função auxiliar para mostrar erros com toast
export const handleError = (error: any, message: string) => {
  console.error(`${message}:`, error);
  toast.error(`Erro: ${message}`, { position: "bottom-right" });
};

// Renaming for backward compatibility
export const errorHandler = handleError;

// Função auxiliar para mostrar mensagens de sucesso
export const handleSuccess = (message: string) => {
  toast.success(message, { position: "bottom-right" });
};
