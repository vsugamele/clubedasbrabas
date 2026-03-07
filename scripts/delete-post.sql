-- Script SQL para excluir um post e todos os seus registros relacionados
-- Para usar: substitua o ID do post que deseja excluir (sem espaços extras)
-- Execute este script no console SQL do Supabase

-- Definir o ID do post a ser excluído
DO $$
DECLARE
    post_id_to_delete UUID := '2dfa8411-7702-43af-ae94-154c19ebcd1c';
    table_exists BOOLEAN;
BEGIN
    -- Verificar se o post existe
    IF NOT EXISTS (SELECT 1 FROM posts WHERE id = post_id_to_delete) THEN
        RAISE EXCEPTION 'Post com ID % não encontrado', post_id_to_delete;
    END IF;

    -- Excluir registros relacionados em todas as tabelas
    -- Comentários do post
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'post_comments'
    ) INTO table_exists;
    
    IF table_exists THEN
        DELETE FROM post_comments WHERE post_id = post_id_to_delete;
        RAISE NOTICE 'Comentários excluídos';
    ELSE
        RAISE NOTICE 'Tabela post_comments não existe, pulando...';
    END IF;

    -- Curtidas do post
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'post_likes'
    ) INTO table_exists;
    
    IF table_exists THEN
        DELETE FROM post_likes WHERE post_id = post_id_to_delete;
        RAISE NOTICE 'Curtidas excluídas';
    ELSE
        RAISE NOTICE 'Tabela post_likes não existe, pulando...';
    END IF;

    -- Mídia do post
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'post_media'
    ) INTO table_exists;
    
    IF table_exists THEN
        DELETE FROM post_media WHERE post_id = post_id_to_delete;
        RAISE NOTICE 'Mídia excluída';
    ELSE
        RAISE NOTICE 'Tabela post_media não existe, pulando...';
    END IF;

    -- Enquetes do post
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'post_polls'
    ) INTO table_exists;
    
    IF table_exists THEN
        -- Verificar se existe a tabela de votos
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'poll_votes'
        ) INTO table_exists;
        
        IF table_exists THEN
            DELETE FROM poll_votes WHERE poll_id IN (SELECT id FROM post_polls WHERE post_id = post_id_to_delete);
            RAISE NOTICE 'Votos de enquetes excluídos';
        ELSE
            RAISE NOTICE 'Tabela poll_votes não existe, pulando...';
        END IF;
        
        DELETE FROM post_polls WHERE post_id = post_id_to_delete;
        RAISE NOTICE 'Enquetes excluídas';
    ELSE
        RAISE NOTICE 'Tabela post_polls não existe, pulando...';
    END IF;

    -- Visualizações do post
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'post_views'
    ) INTO table_exists;
    
    IF table_exists THEN
        DELETE FROM post_views WHERE post_id = post_id_to_delete;
        RAISE NOTICE 'Visualizações excluídas';
    ELSE
        RAISE NOTICE 'Tabela post_views não existe, pulando...';
    END IF;

    -- Compartilhamentos do post
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'post_shares'
    ) INTO table_exists;
    
    IF table_exists THEN
        DELETE FROM post_shares WHERE post_id = post_id_to_delete;
        RAISE NOTICE 'Compartilhamentos excluídos';
    ELSE
        RAISE NOTICE 'Tabela post_shares não existe, pulando...';
    END IF;

    -- Salvamentos do post
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'post_saves'
    ) INTO table_exists;
    
    IF table_exists THEN
        DELETE FROM post_saves WHERE post_id = post_id_to_delete;
        RAISE NOTICE 'Salvamentos excluídos';
    ELSE
        RAISE NOTICE 'Tabela post_saves não existe, pulando...';
    END IF;

    -- Denúncias do post
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'post_reports'
    ) INTO table_exists;
    
    IF table_exists THEN
        DELETE FROM post_reports WHERE post_id = post_id_to_delete;
        RAISE NOTICE 'Denúncias excluídas';
    ELSE
        RAISE NOTICE 'Tabela post_reports não existe, pulando...';
    END IF;

    -- Finalmente, excluir o post
    DELETE FROM posts WHERE id = post_id_to_delete;
    RAISE NOTICE 'Post % excluído com sucesso!', post_id_to_delete;
    
    -- Confirmar a exclusão completa
    IF EXISTS (SELECT 1 FROM posts WHERE id = post_id_to_delete) THEN
        RAISE EXCEPTION 'Falha ao excluir o post % - ainda existe na tabela posts', post_id_to_delete;
    ELSE
        RAISE NOTICE 'Confirmado: Post % não existe mais no banco de dados', post_id_to_delete;
    END IF;
END $$;
