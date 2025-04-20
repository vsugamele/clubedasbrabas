-- Script para excluir todos os posts com conteúdo "teste"

-- Para exclusão permanente
DELETE FROM posts 
WHERE content = 'teste';

-- OU para soft delete (marcar como excluído)
/*
UPDATE posts 
SET is_deleted = true 
WHERE content = 'teste';
*/

-- Para excluir apenas o post específico mencionado
/*
DELETE FROM posts 
WHERE id = '4e94d627-0cb6-4de5-9e22-4b46d3d25d4a';
*/

-- Limpar todos os posts associados ao usuário específico
/*
DELETE FROM posts 
WHERE user_id = '0ea0ac68-6048-41e8-8dbf-ae49368be227';
*/
