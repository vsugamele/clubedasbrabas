import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ReferenceItem, createReference, updateReference, uploadReferenceImage } from "@/services/referenceService";
import { toast } from "sonner";

interface ReferenceFormProps {
  reference: ReferenceItem | null;
  isEditing: boolean;
  onClose: (refreshData?: boolean) => void;
  userId: string;
}

const ReferenceForm: React.FC<ReferenceFormProps> = ({
  reference,
  isEditing,
  onClose,
  userId,
}) => {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("");
  const [hairType, setHairType] = useState("");
  const [fingerProjection, setFingerProjection] = useState("");
  const [angle, setAngle] = useState("");
  const [lineType, setLineType] = useState("");
  const [texture, setTexture] = useState("");
  const [cutType, setCutType] = useState("");
  const [productsUsed, setProductsUsed] = useState("");
  const [estimatedTime, setEstimatedTime] = useState("");
  const [observations, setObservations] = useState("");
  
  const [beforeImage, setBeforeImage] = useState<File | null>(null);
  const [afterImage, setAfterImage] = useState<File | null>(null);
  const [beforeImageUrl, setBeforeImageUrl] = useState("");
  const [afterImageUrl, setAfterImageUrl] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (reference) {
      setTitle(reference.title || "");
      setType(reference.type || "");
      setHairType(reference.hair_type || "");
      setFingerProjection(reference.finger_projection || "");
      setAngle(reference.angle || "");
      setLineType(reference.line_type || "");
      setTexture(reference.texture || "");
      setCutType(reference.cut_type || "");
      setProductsUsed(reference.products_used || "");
      setEstimatedTime(reference.estimated_time || "");
      setObservations(reference.observations || "");
      setBeforeImageUrl(reference.before_image || "");
      setAfterImageUrl(reference.after_image || "");
    }
  }, [reference]);

  const handleClose = () => {
    setOpen(false);
    onClose();
  };

  const handleBeforeImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBeforeImage(e.target.files[0]);
      setBeforeImageUrl(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleAfterImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAfterImage(e.target.files[0]);
      setAfterImageUrl(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalBeforeImageUrl = beforeImageUrl;
      let finalAfterImageUrl = afterImageUrl;

      // Upload das imagens se forem novas
      if (beforeImage) {
        const uploadedBeforeUrl = await uploadReferenceImage(beforeImage, userId, "before");
        if (uploadedBeforeUrl) {
          finalBeforeImageUrl = uploadedBeforeUrl;
        } else {
          toast.error("Erro ao fazer upload da imagem 'antes'");
          setLoading(false);
          return;
        }
      }

      if (afterImage) {
        const uploadedAfterUrl = await uploadReferenceImage(afterImage, userId, "after");
        if (uploadedAfterUrl) {
          finalAfterImageUrl = uploadedAfterUrl;
        } else {
          toast.error("Erro ao fazer upload da imagem 'depois'");
          setLoading(false);
          return;
        }
      }

      const referenceData = {
        title,
        type,
        before_image: finalBeforeImageUrl,
        after_image: finalAfterImageUrl,
        hair_type: hairType,
        finger_projection: fingerProjection,
        angle,
        line_type: lineType,
        texture,
        cut_type: cutType,
        products_used: productsUsed,
        estimated_time: estimatedTime,
        observations,
      };

      let success = false;

      if (isEditing && reference) {
        const result = await updateReference(reference.id, referenceData);
        success = !!result;
      } else {
        const result = await createReference(referenceData, userId);
        success = !!result;
      }

      if (success) {
        setOpen(false);
        onClose(true);
      }
    } catch (error) {
      console.error("Erro ao salvar referência:", error);
      toast.error("Erro ao salvar referência");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Referência" : "Nova Referência"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Título da referência"
                  required
                />
              </div>

              <div>
                <Label htmlFor="type">Tipo</Label>
                <Select value={type} onValueChange={setType} required>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2B">Tipo 2B</SelectItem>
                    <SelectItem value="2C">Tipo 2C</SelectItem>
                    <SelectItem value="3A">Tipo 3A</SelectItem>
                    <SelectItem value="3B">Tipo 3B</SelectItem>
                    <SelectItem value="3C">Tipo 3C</SelectItem>
                    <SelectItem value="4A">Tipo 4A</SelectItem>
                    <SelectItem value="4B">Tipo 4B</SelectItem>
                    <SelectItem value="4C">Tipo 4C</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="before-image">Foto Antes</Label>
                <div className="border rounded-md p-2">
                  {beforeImageUrl ? (
                    <div className="relative">
                      <img
                        src={beforeImageUrl}
                        alt="Antes"
                        className="w-full h-48 object-cover rounded-md"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="absolute bottom-2 right-2"
                        onClick={() => document.getElementById("before-image")?.click()}
                      >
                        Alterar
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="flex flex-col items-center justify-center h-48 bg-muted rounded-md cursor-pointer"
                      onClick={() => document.getElementById("before-image")?.click()}
                    >
                      <p className="text-sm text-muted-foreground mb-2">
                        Clique para fazer upload ou arrastar a imagem
                      </p>
                      <p className="text-xs text-muted-foreground">
                        JPEG ou PNG
                      </p>
                    </div>
                  )}
                  <Input
                    id="before-image"
                    type="file"
                    accept="image/jpeg,image/png"
                    className="hidden"
                    onChange={handleBeforeImageChange}
                    required={!isEditing || !beforeImageUrl}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="after-image">Foto Depois</Label>
                <div className="border rounded-md p-2">
                  {afterImageUrl ? (
                    <div className="relative">
                      <img
                        src={afterImageUrl}
                        alt="Depois"
                        className="w-full h-48 object-cover rounded-md"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="absolute bottom-2 right-2"
                        onClick={() => document.getElementById("after-image")?.click()}
                      >
                        Alterar
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="flex flex-col items-center justify-center h-48 bg-muted rounded-md cursor-pointer"
                      onClick={() => document.getElementById("after-image")?.click()}
                    >
                      <p className="text-sm text-muted-foreground mb-2">
                        Clique para fazer upload ou arrastar a imagem
                      </p>
                      <p className="text-xs text-muted-foreground">
                        JPEG ou PNG
                      </p>
                    </div>
                  )}
                  <Input
                    id="after-image"
                    type="file"
                    accept="image/jpeg,image/png"
                    className="hidden"
                    onChange={handleAfterImageChange}
                    required={!isEditing || !afterImageUrl}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="hair-type">Tipo de Cabelo</Label>
                <Select value={hairType} onValueChange={setHairType}>
                  <SelectTrigger id="hair-type">
                    <SelectValue placeholder="Selecione o tipo de cabelo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cacheado">Cacheado</SelectItem>
                    <SelectItem value="Crespo">Crespo</SelectItem>
                    <SelectItem value="Ondulado">Ondulado</SelectItem>
                    <SelectItem value="Liso">Liso</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="finger-projection">Projeções dos dedos</Label>
                <Select value={fingerProjection} onValueChange={setFingerProjection}>
                  <SelectTrigger id="finger-projection">
                    <SelectValue placeholder="Selecione a projeção dos dedos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Projeção 1">Projeção 1</SelectItem>
                    <SelectItem value="Projeção 2">Projeção 2</SelectItem>
                    <SelectItem value="Projeção 3">Projeção 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="angle">Ângulos</Label>
                <Select value={angle} onValueChange={setAngle}>
                  <SelectTrigger id="angle">
                    <SelectValue placeholder="Selecione o ângulo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ângulo 45°">Ângulo 45°</SelectItem>
                    <SelectItem value="Ângulo 90°">Ângulo 90°</SelectItem>
                    <SelectItem value="Ângulo 180°">Ângulo 180°</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="line-type">Linhas</Label>
                <Select value={lineType} onValueChange={setLineType}>
                  <SelectTrigger id="line-type">
                    <SelectValue placeholder="Selecione o tipo de linha" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Linha Reta">Linha Reta</SelectItem>
                    <SelectItem value="Linha Curva">Linha Curva</SelectItem>
                    <SelectItem value="Linha Diagonal">Linha Diagonal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="texture">Textura</Label>
                <Select value={texture} onValueChange={setTexture}>
                  <SelectTrigger id="texture">
                    <SelectValue placeholder="Selecione o tipo de textura" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Textura Lisa">Textura Lisa</SelectItem>
                    <SelectItem value="Textura Média">Textura Média</SelectItem>
                    <SelectItem value="Textura Grossa">Textura Grossa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="cut-type">Corte</Label>
                <Select value={cutType} onValueChange={setCutType}>
                  <SelectTrigger id="cut-type">
                    <SelectValue placeholder="Selecione o tipo de corte" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Corte Seco">Corte Seco</SelectItem>
                    <SelectItem value="Corte Molhado">Corte Molhado</SelectItem>
                    <SelectItem value="Corte Misto">Corte Misto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="products-used">Produtos Usados</Label>
                <Textarea
                  id="products-used"
                  value={productsUsed}
                  onChange={(e) => setProductsUsed(e.target.value)}
                  placeholder="Liste os produtos utilizados"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="estimated-time">Tempo Estimado</Label>
                <Input
                  id="estimated-time"
                  value={estimatedTime}
                  onChange={(e) => setEstimatedTime(e.target.value)}
                  placeholder="Ex: 2 horas"
                />
              </div>

              <div>
                <Label htmlFor="observations">Observações</Label>
                <Textarea
                  id="observations"
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Observações adicionais"
                  rows={3}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <LoadingSpinner className="mr-2" size="sm" />
                  Salvando...
                </>
              ) : isEditing ? (
                "Atualizar"
              ) : (
                "Criar"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReferenceForm;
