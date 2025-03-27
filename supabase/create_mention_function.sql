-- Criar uma função RPC segura para buscar usuários para menção
-- Esta função evita o problema de recursão infinita nas políticas de segurança
CREATE OR REPLACE FUNCTION public.search_users_for_mention(search_term TEXT)
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com privilégios do criador da função
AS $$
BEGIN
  -- Retornar usuários que correspondem ao termo de busca
  RETURN QUERY
  SELECT 
    json_build_object(
      'id', p.id,
      'username', p.username,
      'full_name', p.full_name,
      'avatar_url', p.avatar_url
    )
  FROM 
    profiles p
  WHERE 
    (search_term = '' OR 
     p.username ILIKE '%' || search_term || '%' OR 
     p.full_name ILIKE '%' || search_term || '%')
  ORDER BY 
    p.updated_at DESC
  LIMIT 10;
END;
$$;

-- Conceder permissão para todos os usuários autenticados chamarem esta função
GRANT EXECUTE ON FUNCTION public.search_users_for_mention TO authenticated;

-- Comentário explicativo
COMMENT ON FUNCTION public.search_users_for_mention IS 
'Função segura para buscar usuários para menção em posts, evitando o problema de recursão infinita nas políticas de segurança.';
