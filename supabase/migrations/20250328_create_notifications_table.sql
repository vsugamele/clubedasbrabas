-- Criar a tabela de notificações
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    related_id TEXT,
    reference_type TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_read BOOLEAN NOT NULL DEFAULT FALSE
);

-- Adicionar índices para melhorar a performance
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications(created_at);

-- Configurar RLS (Row Level Security)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam apenas suas próprias notificações
CREATE POLICY "Usuários podem ver apenas suas próprias notificações" 
ON public.notifications FOR SELECT 
USING (auth.uid() = user_id);

-- Política para permitir que usuários marquem suas próprias notificações como lidas
CREATE POLICY "Usuários podem atualizar suas próprias notificações" 
ON public.notifications FOR UPDATE 
USING (auth.uid() = user_id);

-- Política para permitir que usuários excluam suas próprias notificações
CREATE POLICY "Usuários podem excluir suas próprias notificações" 
ON public.notifications FOR DELETE 
USING (auth.uid() = user_id);

-- Política para permitir que o sistema crie notificações para qualquer usuário
CREATE POLICY "Sistema pode criar notificações" 
ON public.notifications FOR INSERT 
WITH CHECK (true);

-- Trigger para notificar clientes em tempo real quando uma nova notificação é criada
CREATE OR REPLACE FUNCTION public.handle_new_notification()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('new_notification', json_build_object(
    'id', NEW.id,
    'user_id', NEW.user_id,
    'type', NEW.type,
    'title', NEW.title,
    'content', NEW.content,
    'created_at', NEW.created_at
  )::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_notification_created ON public.notifications;
CREATE TRIGGER on_notification_created
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_notification();
