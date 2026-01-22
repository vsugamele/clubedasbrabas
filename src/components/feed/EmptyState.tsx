
import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RefreshCw, Newspaper, Plus } from "lucide-react";

type EmptyStateVariant = "posts" | "communities" | "messages" | "notifications" | "generic";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  variant?: EmptyStateVariant;
  className?: string;
  isLoading?: boolean;
}

export function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  variant = "generic",
  className,
  isLoading = false,
}: EmptyStateProps) {
  const getDefaultContent = () => {
    switch (variant) {
      case "posts":
        return {
          title: title || "Nenhuma publicação encontrada",
          description: description || "Não encontramos nenhuma publicação para exibir neste momento.",
          icon: icon || <Newspaper className="h-12 w-12 text-muted-foreground/60" />,
          actionLabel: actionLabel || "Criar publicação",
        };
      case "communities":
        return {
          title: title || "Nenhuma comunidade encontrada",
          description: description || "Não há comunidades disponíveis no momento.",
          icon: icon || <Newspaper className="h-12 w-12 text-muted-foreground/60" />,
          actionLabel: actionLabel || "Explorar comunidades",
        };
      case "messages":
        return {
          title: title || "Nenhuma mensagem",
          description: description || "Você não tem mensagens para exibir.",
          icon: icon || <Newspaper className="h-12 w-12 text-muted-foreground/60" />,
          actionLabel: actionLabel || "Iniciar conversa",
        };
      case "notifications":
        return {
          title: title || "Nenhuma notificação",
          description: description || "Você não tem notificações para exibir.",
          icon: icon || <Newspaper className="h-12 w-12 text-muted-foreground/60" />,
        };
      default:
        return {
          title: title || "Nenhum conteúdo encontrado",
          description: description || "Não há conteúdo para exibir neste momento.",
          icon: icon || <Newspaper className="h-12 w-12 text-muted-foreground/60" />,
        };
    }
  };

  const content = getDefaultContent();

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50",
        className
      )}
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/30">
        {isLoading ? (
          <RefreshCw className="h-12 w-12 animate-spin text-muted-foreground/60" />
        ) : (
          content.icon
        )}
      </div>
      <h3 className="mt-4 text-lg font-semibold">{content.title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{content.description}</p>
      <div className="mt-6 flex flex-col sm:flex-row gap-2">
        {content.actionLabel && onAction && (
          <Button 
            onClick={onAction} 
            disabled={isLoading}
            className="bg-brand-primary hover:bg-brand-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            {content.actionLabel}
          </Button>
        )}
        {secondaryActionLabel && onSecondaryAction && (
          <Button 
            variant="outline" 
            onClick={onSecondaryAction}
            disabled={isLoading}
          >
            {secondaryActionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

export default EmptyState;
