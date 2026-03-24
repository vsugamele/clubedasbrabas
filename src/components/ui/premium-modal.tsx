import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PremiumModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: 'messaging' | 'posting' | 'gallery' | 'tracks' | 'general';
}

export function PremiumModal({ open, onOpenChange, feature = 'general' }: PremiumModalProps) {
  const navigate = useNavigate();

  // Texto personalizado baseado na feature que o usuário tentou acessar
  const getFeatureSpecificText = () => {
    switch (feature) {
      case 'messaging':
        return "Desbloquear mensagens ilimitadas para se conectar com toda nossa comunidade!";
      case 'posting':
        return "Criar postagens ilimitadas para compartilhar todo seu conhecimento e experiência!";
      case 'gallery':
        return "Acessar todas as galerias de referências para se inspirar e elevar seu trabalho!";
      case 'tracks':
        return "Acessar todas as trilhas exclusivas para dominar técnicas e se especializar no mercado!";
      default:
        return "Acessar todos os recursos premium e elevar seu nível de profissionalismo!";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-[95vw] max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader className="text-center space-y-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 shadow-[0_0_20px_rgba(255,102,0,0.15)] mb-1">
            <Award className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-xl md:text-2xl font-bold tracking-tight text-center px-1">
            Destaque-se no mercado das cacheadas com o <span className="text-primary">Clube das Brabas</span>
          </DialogTitle>
        </DialogHeader>
        <div className="text-center space-y-3 pt-2">
          <DialogDescription className="text-sm md:text-base leading-relaxed">
            O Clube das Brabas é o foguete que vai elevar seu nível de profissionalismo no mercado.
          </DialogDescription>
          <div className="font-semibold px-3 py-3 bg-muted/30 rounded-lg text-primary text-sm border border-border/50">
            {getFeatureSpecificText()}
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-2 pt-2 pb-0">
          <Button 
            variant="default" 
            onClick={() => {
              onOpenChange(false);
              navigate('/premium');
            }}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/25"
          >
            Quero fazer parte do Clube
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)} 
            className="w-full text-muted-foreground hover:text-foreground"
          >
            Continuar no plano gratuito
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
