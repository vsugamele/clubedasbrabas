import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReferenceItem, createReference, updateReference, uploadReferenceImage, uploadReferenceAudio } from "@/services/referenceService";
import { AudioRecorder } from "@/components/ui/audio-recorder";
import { toast } from "sonner";
import { Mic, Play, Pause, X, ChevronDown, Upload } from "lucide-react";

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
  const [selectedAngles, setSelectedAngles] = useState<string[]>([]);
  const [lineType, setLineType] = useState("");
  const [texture, setTexture] = useState("");
  const [cutType, setCutType] = useState("");
  const [productsUsed, setProductsUsed] = useState("");
  const [tools, setTools] = useState<string[]>([]);
  const [estimatedTime, setEstimatedTime] = useState("");
  const [observations, setObservations] = useState("");
  
  const [beforeImage, setBeforeImage] = useState<File | null>(null);
  const [afterImage, setAfterImage] = useState<File | null>(null);
  const [beforeImageUrl, setBeforeImageUrl] = useState("");
  const [afterImageUrl, setAfterImageUrl] = useState("");
  
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (reference) {
      setTitle(reference.title || "");
      setType(reference.type || "");
      setHairType(reference.hair_type || "");
      setFingerProjection(reference.finger_projection || "");
      setSelectedAngles(reference.angle ? reference.angle.split(", ") : []);
      setLineType(reference.line_type || "");
      setTexture(reference.texture || "");
      setCutType(reference.cut_type || "");
      setProductsUsed(reference.products_used || "");
      setTools(reference.tools ? reference.tools.split(", ") : []);
      setEstimatedTime(reference.estimated_time || "");
      setObservations(reference.observations || "");
      setBeforeImageUrl(reference.before_image || "");
      setAfterImageUrl(reference.after_image || "");
      setAudioUrl(reference.audio_description || "");
      
      // Resetar o estado de reprodução quando a referência muda
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
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

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAudioFile(file);
      setAudioUrl(URL.createObjectURL(file));
      
      // Resetar o estado de reprodução quando um novo áudio é selecionado
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const toggleAudioPlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        // Tentar reproduzir o áudio
        const playPromise = audioRef.current.play();
        
        // Tratamento para browsers que implementam a reprodução como uma Promise
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              // Reprodução iniciada com sucesso
              console.log('Reprodução de áudio iniciada com sucesso');
            })
            .catch(error => {
              // Erro ao iniciar reprodução (comum em alguns navegadores sem interação do usuário)
              console.error('Erro ao reproduzir áudio:', error);
              toast.error('Não foi possível reproduzir o áudio automaticamente');
            });
        }
      }
      setIsPlaying(!isPlaying);
    }
  };

  const removeAudio = () => {
    setAudioFile(null);
    setAudioUrl("");
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalBeforeImageUrl = beforeImageUrl;
      let finalAfterImageUrl = afterImageUrl;
      let finalAudioUrl = audioUrl;

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
      
      // Upload do áudio se for novo
      // Se tem audioFile, faz upload do arquivo
      if (audioFile) {
        console.log("Fazendo upload de arquivo de áudio");
        const uploadedAudioUrl = await uploadReferenceAudio(audioFile, userId);
        if (uploadedAudioUrl) {
          finalAudioUrl = uploadedAudioUrl;
        } else {
          toast.error("Erro ao fazer upload do áudio");
          setLoading(false);
          return;
        }
      } 
      // Se não tem audioFile mas tem audioUrl começando com data:, usa o base64 diretamente
      else if (audioUrl && audioUrl.startsWith('data:')) {
        console.log("Usando áudio gravado diretamente (base64)");
        finalAudioUrl = audioUrl;
      }

      const referenceData = {
        title,
        type,
        before_image: finalBeforeImageUrl,
        after_image: finalAfterImageUrl,
        audio_description: finalAudioUrl,
        hair_type: hairType,
        finger_projection: fingerProjection,
        angle: selectedAngles.join(", "),
        line_type: lineType,
        texture,
        cut_type: cutType,
        tools: tools.join(", "),
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
                    <SelectItem value="2A">Tipo 2A</SelectItem>
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

              <div className="space-y-2">
                <Label htmlFor="audio-description">Áudio Descritivo</Label>
                
                <Tabs defaultValue="record" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="record" className="flex items-center gap-1">
                      <Mic className="h-4 w-4" /> Gravar Áudio
                    </TabsTrigger>
                    <TabsTrigger value="upload" className="flex items-center gap-1">
                      <Upload className="h-4 w-4" /> Fazer Upload
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="record" className="mt-4">
                    <AudioRecorder 
                      onAudioCaptured={(audioBase64) => {
                        setAudioUrl(audioBase64);
                        setAudioFile(null);
                      }}
                      existingAudio={audioUrl}
                    />
                  </TabsContent>
                  
                  <TabsContent value="upload" className="mt-4">
                    <div className="border rounded-md p-4">
                      {audioUrl ? (
                        <div className="relative">
                          <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} className="hidden" />
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-10 w-10 rounded-full"
                                onClick={toggleAudioPlayback}
                              >
                                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                              </Button>
                              <div className="text-sm">
                                {isPlaying ? "Reproduzindo..." : audioUrl.startsWith('data:') ? "Áudio gravado" : "Áudio carregado"}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => document.getElementById("audio-description")?.click()}
                              >
                                Alterar
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={removeAudio}
                              >
                                Remover
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="flex flex-col items-center justify-center h-32 bg-muted rounded-md cursor-pointer"
                          onClick={() => document.getElementById("audio-description")?.click()}
                        >
                          <Upload size={24} className="mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground mb-1">
                            Clique para fazer upload de um áudio
                          </p>
                          <p className="text-xs text-muted-foreground">
                            MP3 ou WAV (máx. 5MB)
                          </p>
                        </div>
                      )}
                      <Input
                        id="audio-description"
                        type="file"
                        accept="audio/mp3,audio/wav,audio/mpeg"
                        className="hidden"
                        onChange={handleAudioChange}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
                
                <p className="text-xs text-muted-foreground">
                  Adicione um áudio explicando detalhes sobre o antes e depois que não são visíveis nas fotos
                </p>
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
                    <SelectItem value="Para Dentro">Para Dentro</SelectItem>
                    <SelectItem value="Para Fora">Para Fora</SelectItem>
                    <SelectItem value="Natural">Natural</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="angle">Ângulos</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                      id="angle"
                    >
                      {selectedAngles.length > 0
                        ? `${selectedAngles.length} ângulo${selectedAngles.length > 1 ? 's' : ''} selecionado${selectedAngles.length > 1 ? 's' : ''}`
                        : "Selecione os ângulos"}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <div className="p-2 space-y-2">
                      <div className="grid grid-cols-1 gap-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="angle-0" 
                            checked={selectedAngles.includes("Ângulo 0°")}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedAngles([...selectedAngles, "Ângulo 0°"]);
                              } else {
                                setSelectedAngles(selectedAngles.filter(a => a !== "Ângulo 0°"));
                              }
                            }}
                          />
                          <label htmlFor="angle-0" className="text-sm cursor-pointer">Ângulo 0°</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="angle-45" 
                            checked={selectedAngles.includes("Ângulo 45°")}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedAngles([...selectedAngles, "Ângulo 45°"]);
                              } else {
                                setSelectedAngles(selectedAngles.filter(a => a !== "Ângulo 45°"));
                              }
                            }}
                          />
                          <label htmlFor="angle-45" className="text-sm cursor-pointer">Ângulo 45°</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="angle-90" 
                            checked={selectedAngles.includes("Ângulo 90°")}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedAngles([...selectedAngles, "Ângulo 90°"]);
                              } else {
                                setSelectedAngles(selectedAngles.filter(a => a !== "Ângulo 90°"));
                              }
                            }}
                          />
                          <label htmlFor="angle-90" className="text-sm cursor-pointer">Ângulo 90°</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="angle-135" 
                            checked={selectedAngles.includes("Ângulo 135°")}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedAngles([...selectedAngles, "Ângulo 135°"]);
                              } else {
                                setSelectedAngles(selectedAngles.filter(a => a !== "Ângulo 135°"));
                              }
                            }}
                          />
                          <label htmlFor="angle-135" className="text-sm cursor-pointer">Ângulo 135°</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="angle-180" 
                            checked={selectedAngles.includes("Ângulo 180°")}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedAngles([...selectedAngles, "Ângulo 180°"]);
                              } else {
                                setSelectedAngles(selectedAngles.filter(a => a !== "Ângulo 180°"));
                              }
                            }}
                          />
                          <label htmlFor="angle-180" className="text-sm cursor-pointer">Ângulo 180°</label>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
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
                <Label htmlFor="tools">Ferramentas</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                      id="tools"
                    >
                      {tools.length > 0
                        ? `${tools.length} ferramenta${tools.length > 1 ? 's' : ''} selecionada${tools.length > 1 ? 's' : ''}`
                        : "Selecione as ferramentas"}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <div className="p-2 space-y-2">
                      <div className="grid grid-cols-1 gap-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="tool-tesoura-laser" 
                            checked={tools.includes("TESOURA FIO LASER")}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setTools([...tools, "TESOURA FIO LASER"]);
                              } else {
                                setTools(tools.filter(t => t !== "TESOURA FIO LASER"));
                              }
                            }}
                          />
                          <label htmlFor="tool-tesoura-laser" className="text-sm cursor-pointer">TESOURA FIO LASER</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="tool-tesoura-navalha" 
                            checked={tools.includes("TESOURA FIO NAVALHA")}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setTools([...tools, "TESOURA FIO NAVALHA"]);
                              } else {
                                setTools(tools.filter(t => t !== "TESOURA FIO NAVALHA"));
                              }
                            }}
                          />
                          <label htmlFor="tool-tesoura-navalha" className="text-sm cursor-pointer">TESOURA FIO NAVALHA</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="tool-pente-corte" 
                            checked={tools.includes("PENTE DE CORTE")}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setTools([...tools, "PENTE DE CORTE"]);
                              } else {
                                setTools(tools.filter(t => t !== "PENTE DE CORTE"));
                              }
                            }}
                          />
                          <label htmlFor="tool-pente-corte" className="text-sm cursor-pointer">PENTE DE CORTE</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="tool-pente-cabo" 
                            checked={tools.includes("PENTE DE CABO")}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setTools([...tools, "PENTE DE CABO"]);
                              } else {
                                setTools(tools.filter(t => t !== "PENTE DE CABO"));
                              }
                            }}
                          />
                          <label htmlFor="tool-pente-cabo" className="text-sm cursor-pointer">PENTE DE CABO</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="tool-pente-garfo" 
                            checked={tools.includes("PENTE GARFO")}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setTools([...tools, "PENTE GARFO"]);
                              } else {
                                setTools(tools.filter(t => t !== "PENTE GARFO"));
                              }
                            }}
                          />
                          <label htmlFor="tool-pente-garfo" className="text-sm cursor-pointer">PENTE GARFO</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="tool-pente-largo" 
                            checked={tools.includes("PENTE LARGO")}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setTools([...tools, "PENTE LARGO"]);
                              } else {
                                setTools(tools.filter(t => t !== "PENTE LARGO"));
                              }
                            }}
                          />
                          <label htmlFor="tool-pente-largo" className="text-sm cursor-pointer">PENTE LARGO</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="tool-borrifador" 
                            checked={tools.includes("BORRIFADOR DE ÁGUA")}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setTools([...tools, "BORRIFADOR DE ÁGUA"]);
                              } else {
                                setTools(tools.filter(t => t !== "BORRIFADOR DE ÁGUA"));
                              }
                            }}
                          />
                          <label htmlFor="tool-borrifador" className="text-sm cursor-pointer">BORRIFADOR DE ÁGUA</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="tool-prendedores" 
                            checked={tools.includes("PRENDEDORES DE CABELO")}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setTools([...tools, "PRENDEDORES DE CABELO"]);
                              } else {
                                setTools(tools.filter(t => t !== "PRENDEDORES DE CABELO"));
                              }
                            }}
                          />
                          <label htmlFor="tool-prendedores" className="text-sm cursor-pointer">PRENDEDORES DE CABELO</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="tool-secador" 
                            checked={tools.includes("SECADOR")}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setTools([...tools, "SECADOR"]);
                              } else {
                                setTools(tools.filter(t => t !== "SECADOR"));
                              }
                            }}
                          />
                          <label htmlFor="tool-secador" className="text-sm cursor-pointer">SECADOR</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="tool-difusor-manual" 
                            checked={tools.includes("DIFUSOR MANUAL")}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setTools([...tools, "DIFUSOR MANUAL"]);
                              } else {
                                setTools(tools.filter(t => t !== "DIFUSOR MANUAL"));
                              }
                            }}
                          />
                          <label htmlFor="tool-difusor-manual" className="text-sm cursor-pointer">DIFUSOR MANUAL</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="tool-difusor-360" 
                            checked={tools.includes("DIFUSOR 360")}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setTools([...tools, "DIFUSOR 360"]);
                              } else {
                                setTools(tools.filter(t => t !== "DIFUSOR 360"));
                              }
                            }}
                          />
                          <label htmlFor="tool-difusor-360" className="text-sm cursor-pointer">DIFUSOR 360</label>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
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
