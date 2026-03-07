-- Script para adicionar links úteis à tabela external_links

-- Primeiro, vamos verificar se a tabela existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'external_links') THEN
        CREATE TABLE public.external_links (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name TEXT NOT NULL,
            url TEXT NOT NULL,
            order_index INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
    END IF;
END
$$;

-- Limpar links existentes (opcional - remova esta linha se quiser manter os links existentes)
DELETE FROM public.external_links;

-- Inserir os novos links
INSERT INTO public.external_links (name, url, order_index) VALUES
('Formação JP Hair Education', 'https://jphaireducation.com/', 1),
('JP Hair Collection', 'https://jpcollections.com.br/', 2),
('Área de Membro', 'https://plataforma.haireducation.com.br/', 3),
('Cortes Descomplicados', 'https://jphaireducation.com/cortes-descomplicados', 4);

-- Configurar políticas de segurança para a tabela (se necessário)
ALTER TABLE public.external_links ENABLE ROW LEVEL SECURITY;

-- Política para permitir que todos os usuários autenticados vejam os links
DROP POLICY IF EXISTS external_links_select_policy ON public.external_links;
CREATE POLICY external_links_select_policy ON public.external_links
    FOR SELECT
    TO authenticated
    USING (true);

-- Política para permitir que apenas administradores modifiquem os links
DROP POLICY IF EXISTS external_links_insert_policy ON public.external_links;
CREATE POLICY external_links_insert_policy ON public.external_links
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

DROP POLICY IF EXISTS external_links_update_policy ON public.external_links;
CREATE POLICY external_links_update_policy ON public.external_links
    FOR UPDATE
    TO authenticated
    USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

DROP POLICY IF EXISTS external_links_delete_policy ON public.external_links;
CREATE POLICY external_links_delete_policy ON public.external_links
    FOR DELETE
    TO authenticated
    USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));
