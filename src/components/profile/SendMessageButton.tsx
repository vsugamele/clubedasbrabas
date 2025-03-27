import React from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SendMessageButtonProps {
  userId: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

const SendMessageButton: React.FC<SendMessageButtonProps> = ({
  userId,
  username,
  fullName,
  avatarUrl,
  variant = "secondary",
  size = "sm",
  className = "",
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSendMessage = async () => {
    if (!user) {
      toast.error("Você precisa estar logado para enviar mensagens", {
        position: "bottom-right",
      });
      return;
    }

    if (user.id === userId) {
      toast.error("Você não pode enviar mensagens para si mesmo", {
        position: "bottom-right",
      });
      return;
    }

    try {
      // Verificar se o contato já existe na lista de mensagens
      const { data: existingContact, error: contactError } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .eq("id", userId)
        .single();

      if (contactError) {
        throw contactError;
      }

      // Navegar para a página de mensagens com o contato selecionado
      navigate("/messages", {
        state: {
          selectedContact: {
            id: existingContact.id,
            username: existingContact.username || username,
            full_name: existingContact.full_name || fullName,
            avatar_url: existingContact.avatar_url || avatarUrl || "",
            unread_count: 0,
          },
        },
      });
    } catch (error) {
      console.error("Erro ao iniciar conversa:", error);
      toast.error("Não foi possível iniciar a conversa. Tente novamente mais tarde.", {
        position: "bottom-right",
      });
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSendMessage}
      className={className}
    >
      <MessageSquare className="h-4 w-4 mr-2" />
      Enviar Mensagem
    </Button>
  );
};

export default SendMessageButton;
