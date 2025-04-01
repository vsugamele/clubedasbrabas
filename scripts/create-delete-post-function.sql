-- Função SQL para excluir um post e todos os seus registros relacionados
-- Execute este script no console SQL do Supabase para criar a função

-- Criar a função de exclusão de posts
CREATE OR REPLACE FUNCTION delete_post_completely(post_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  post_id_to_delete UUID := post_id_param;
  table_exists BOOLEAN;
  post_exists BOOLEAN;
BEGIN
  -- Verificar se o post existe
  SELECT EXISTS (SELECT 1 FROM posts WHERE id = post_id_to_delete) INTO post_exists;
  
  IF NOT post_exists THEN
    RAISE EXCEPTION 'Post com ID % não encontrado', post_id_to_delete;
    RETURN FALSE;
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
    END IF;
    
    DELETE FROM post_polls WHERE post_id = post_id_to_delete;
    RAISE NOTICE 'Enquetes excluídas';
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
  END IF;

  -- Finalmente, excluir o post
  DELETE FROM posts WHERE id = post_id_to_delete;
  RAISE NOTICE 'Post % excluído com sucesso!', post_id_to_delete;
  
  -- Confirmar a exclusão completa
  SELECT NOT EXISTS (SELECT 1 FROM posts WHERE id = post_id_to_delete) INTO post_exists;
  
  IF NOT post_exists THEN
    RAISE NOTICE 'Confirmado: Post % não existe mais no banco de dados', post_id_to_delete;
    RETURN TRUE;
  ELSE
    RAISE EXCEPTION 'Falha ao excluir o post % - ainda existe na tabela posts', post_id_to_delete;
    RETURN FALSE;
  END IF;
END $$;

-- Conceder permissões para a função
GRANT EXECUTE ON FUNCTION delete_post_completely(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_post_completely(UUID) TO anon;
GRANT EXECUTE ON FUNCTION delete_post_completely(UUID) TO service_role;
