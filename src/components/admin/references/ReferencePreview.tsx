import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ReferenceItem } from "@/services/referenceService";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ReferencePreviewProps {
  reference: ReferenceItem;
  onClose: () => void;
}

const ReferencePreview: React.FC<ReferencePreviewProps> = ({
  reference,
  onClose,
}) => {
  const [open, setOpen] = React.useState(true);

  const handleClose = () => {
    setOpen(false);
    onClose();
  };

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{reference.title}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Criado em {formatDate(reference.created_at)}
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

        <DialogFooter>
          <Button onClick={handleClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReferencePreview;
