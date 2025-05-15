import React, { useState, useRef, useEffect } from 'react';
import { Button } from './button';
import { Mic, MicOff, Square, Save } from 'lucide-react';
import { toast } from 'sonner';

interface AudioRecorderProps {
  onAudioCaptured: (audioBase64: string) => void;
  existingAudio?: string;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onAudioCaptured,
  existingAudio
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(existingAudio || null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      // Limpar o timer quando o componente for desmontado
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Limpar a URL do objeto se existir
      if (audioUrl && !audioUrl.startsWith('data:')) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    audioChunksRef.current = [];
    
    try {
      console.log('Solicitando acesso ao microfone...');
      if (!navigator.mediaDevices) {
        throw new Error('MediaDevices API não disponível neste navegador');
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        .catch(err => {
          console.error('Erro específico de getUserMedia:', err.name, err.message);
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            throw new Error('Permissão para acessar o microfone foi negada. Por favor, permita o acesso no seu navegador.');
          } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            throw new Error('Nenhum dispositivo de microfone foi encontrado. Verifique se um microfone está conectado.');
          } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
            throw new Error('Seu microfone está em uso por outro aplicativo ou não pode ser acessado.');
          } else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
            throw new Error('Não foi possível aplicar as configurações solicitadas ao microfone.');
          } else if (err.name === 'TypeError') {
            throw new Error('Tipo de mídia solicitada não é suportada pelo navegador.');
          } else {
            throw new Error(`Erro ao acessar o microfone: ${err.message || 'Acesso negado'}`);
          }
        });
      
      if (!stream) {
        throw new Error('Não foi possível obter acesso ao stream de áudio');
      }
      
      console.log('Acesso ao microfone concedido, configurando MediaRecorder...');
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorder.onstop = () => {
        console.log('Gravação finalizada, processando áudio...');
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        
        // Converter para base64
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          setAudioUrl(base64data);
          onAudioCaptured(base64data);
          console.log('Áudio convertido para base64 e disponibilizado');
        };
        reader.onerror = () => {
          console.error('Erro ao ler o blob de áudio:', reader.error);
          toast.error('Erro ao processar o áudio gravado');
        };
        reader.readAsDataURL(audioBlob);
        
        // Parar todas as faixas do stream
        stream.getTracks().forEach(track => track.stop());
      };
      
      // Listener para erros durante a gravação
      mediaRecorder.onerror = (event) => {
        console.error('Erro no MediaRecorder:', event);
        toast.error('Ocorreu um erro durante a gravação');
        stopRecording();
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);
      
      // Iniciar timer para mostrar tempo de gravação
      timerRef.current = setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);
      
      console.log('Gravação iniciada com sucesso');
      toast.success("Gravação iniciada! Fale agora...");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('Erro ao acessar o microfone:', error);
      toast.error(`Não foi possível acessar o microfone: ${errorMessage}`);
      
      // Mostrar instruções para o usuário
      toast.info(
        'Para usar a gravação de áudio, você precisa permitir o acesso ao microfone nas configurações do navegador.',
        { duration: 6000 }
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Limpar o timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      toast.success("Gravação concluída!");
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="flex items-center gap-3">
          {isRecording ? (
            <div className="animate-pulse">
              <Mic className="h-5 w-5 text-red-500" />
            </div>
          ) : (
            <Mic className="h-5 w-5" />
          )}
          
          <div>
            {isRecording ? (
              <p className="text-sm font-medium text-red-500">
                Gravando... {formatTime(recordingTime)}
              </p>
            ) : audioUrl ? (
              <p className="text-sm font-medium text-green-600">Áudio gravado com sucesso!</p>
            ) : (
              <p className="text-sm font-medium">Clique para gravar um áudio</p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {!isRecording && !audioUrl && (
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={startRecording}
            >
              <Mic className="mr-2 h-4 w-4" />
              Iniciar Gravação
            </Button>
          )}
          
          {isRecording && (
            <Button 
              type="button" 
              variant="destructive" 
              size="sm" 
              onClick={stopRecording}
            >
              <Square className="mr-2 h-4 w-4" />
              Parar Gravação
            </Button>
          )}
          
          {audioUrl && !isRecording && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => startRecording()}
            >
              <Mic className="mr-2 h-4 w-4" />
              Regravar
            </Button>
          )}
        </div>
      </div>
      
      {audioUrl && (
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground mb-2">Pré-visualização do áudio:</p>
          <audio src={audioUrl} controls className="w-full" />
        </div>
      )}
    </div>
  );
};
