import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PremiumModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: 'messaging' | 'posting' | 'gallery' | 'general';
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
      default:
        return "Acessar todos os recursos premium e elevar seu nível de profissionalismo!";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900 mb-4">
            <Award className="h-10 w-10 text-amber-600 dark:text-amber-300" />
          </div>
          <DialogTitle className="text-xl font-bold text-center">
            SE VOCÊ QUER SE DESTACAR NO MERCADO DAS CACHEADAS VOCÊ PRECISA ESTAR DENTRO DO CLUBE DAS BRABAS!
          </DialogTitle>
        </DialogHeader>
        <div className="text-center space-y-2 pt-2 px-6">
          <DialogDescription className="text-lg">
            Entenda, o Clube das Brabas é o foguete que vai elevar seu nível de profissionalismo no mercado das cacheadas.
          </DialogDescription>
          <div className="font-medium text-amber-600 dark:text-amber-400">
            {getFeatureSpecificText()}
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-center gap-2 pt-4">
          <Button 
            variant="default" 
            onClick={() => {
              onOpenChange(false);
              navigate('/premium'); // Redireciona para a página de adesão premium
            }}
            className="w-full bg-amber-500 hover:bg-amber-600"
          >
            QUERO FAZER PARTE DO CLUBE DAS BRABAS
          </Button>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            className="w-full"
          >
            Continuar no plano gratuito
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
