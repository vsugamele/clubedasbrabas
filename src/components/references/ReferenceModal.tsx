import React, { useEffect, useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ReferenceItem } from "@/services/referenceService";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";

interface ReferenceModalProps {
  reference: ReferenceItem;
  onClose: () => void;
  isOpen: boolean; 
}

const ReferenceModal: React.FC<ReferenceModalProps> = ({
  reference,
  onClose,
  isOpen
}) => {
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
    } catch (error) {
      return "Data inválida";
    }
  };

  const InfoItem = ({ label, value }: { label: string; value: string }) => (
    <div className="mb-4">
      <h4 className="text-sm font-medium text-muted-foreground">{label}</h4>
      <p className="text-sm">{value || "Não informado"}</p>
    </div>
  );
  
  const toggleAudioPlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
      setIsMuted(!isMuted);
    }
  };
  
  // Parar a reprodução quando o modal for fechado
  useEffect(() => {
    if (!isOpen && audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [isOpen, isPlaying]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{reference.title}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {formatDate(reference.created_at)}
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-3">Antes e Depois</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-2">Antes</p>
                  {reference.before_image ? (
                    <img
                      src={reference.before_image}
                      alt="Antes"
                      className="w-full h-auto rounded-md object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-muted rounded-md flex items-center justify-center">
                      <p className="text-sm text-muted-foreground">Sem imagem</p>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Depois</p>
                  {reference.after_image ? (
                    <img
                      src={reference.after_image}
                      alt="Depois"
                      className="w-full h-auto rounded-md object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-muted rounded-md flex items-center justify-center">
                      <p className="text-sm text-muted-foreground">Sem imagem</p>
                    </div>
                  )}
                </div>
              </div>
              
              {reference.audio_description && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                    <audio 
                      ref={audioRef} 
                      src={reference.audio_description} 
                      onEnded={() => setIsPlaying(false)}
                      className="hidden" 
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={toggleAudioPlayback}
                    >
                      {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                    </Button>
                    <div className="text-sm flex-1">
                      {isPlaying ? "Ouvindo descrição de áudio..." : "Ouvir descrição de áudio"}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={toggleMute}
                    >
                      {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3">Informações Gerais</h3>
              <div className="grid grid-cols-2 gap-4">
                <InfoItem label="Tipo" value={reference.type} />
                <InfoItem label="Tipo de Cabelo" value={reference.hair_type} />
                <InfoItem label="Tempo Estimado" value={reference.estimated_time} />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-3">Detalhes Técnicos</h3>
              <div className="grid grid-cols-2 gap-4">
                <InfoItem label="Projeções dos dedos" value={reference.finger_projection} />
                <InfoItem label="Ângulos" value={reference.angle} />
                <InfoItem label="Linhas" value={reference.line_type} />
                <InfoItem label="Textura" value={reference.texture} />
                <InfoItem label="Corte" value={reference.cut_type} />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3">Produtos e Observações</h3>
              <InfoItem label="Produtos Utilizados" value={reference.products_used} />
              <InfoItem label="Observações" value={reference.observations} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReferenceModal;
