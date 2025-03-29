-- Script SQL para remover posts problemáticos diretamente do banco de dados
-- Execute este script no SQL Editor do Supabase

-- Desativar temporariamente as políticas RLS (Row Level Security)
BEGIN;

-- Remover registros relacionados para o post 'a0a0d7b4-63e4-493b-bc62-0bc45407a677'
DELETE FROM post_likes WHERE post_id = 'a0a0d7b4-63e4-493b-bc62-0bc45407a677';
DELETE FROM post_comments WHERE post_id = 'a0a0d7b4-63e4-493b-bc62-0bc45407a677';
DELETE FROM post_media WHERE post_id = 'a0a0d7b4-63e4-493b-bc62-0bc45407a677';
UPDATE posts SET is_trending = false WHERE id = 'a0a0d7b4-63e4-493b-bc62-0bc45407a677';
DELETE FROM posts WHERE id = 'a0a0d7b4-63e4-493b-bc62-0bc45407a677';

-- Remover registros relacionados para o post 'd4bcb5eb-1e81-4dff-af36-632f84f0df83' (ID visto na imagem)
DELETE FROM post_likes WHERE post_id = 'd4bcb5eb-1e81-4dff-af36-632f84f0df83';
DELETE FROM post_comments WHERE post_id = 'd4bcb5eb-1e81-4dff-af36-632f84f0df83';
DELETE FROM post_media WHERE post_id = 'd4bcb5eb-1e81-4dff-af36-632f84f0df83';
UPDATE posts SET is_trending = false WHERE id = 'd4bcb5eb-1e81-4dff-af36-632f84f0df83';
DELETE FROM posts WHERE id = 'd4bcb5eb-1e81-4dff-af36-632f84f0df83';

-- Remover todos os posts com "teste" no título ou conteúdo
DELETE FROM post_likes WHERE post_id IN (SELECT id FROM posts WHERE content ILIKE '%teste%' OR title ILIKE '%teste%');
DELETE FROM post_comments WHERE post_id IN (SELECT id FROM posts WHERE content ILIKE '%teste%' OR title ILIKE '%teste%');
DELETE FROM post_media WHERE post_id IN (SELECT id FROM posts WHERE content ILIKE '%teste%' OR title ILIKE '%teste%');
DELETE FROM posts WHERE content ILIKE '%teste%' OR title ILIKE '%teste%';

-- Remover posts específicos pelo título
DELETE FROM post_likes WHERE post_id IN (SELECT id FROM posts WHERE title = 'teste' OR title = 'teste2' OR title = 'teste3');
DELETE FROM post_comments WHERE post_id IN (SELECT id FROM posts WHERE title = 'teste' OR title = 'teste2' OR title = 'teste3');
DELETE FROM post_media WHERE post_id IN (SELECT id FROM posts WHERE title = 'teste' OR title = 'teste2' OR title = 'teste3');
DELETE FROM posts WHERE title = 'teste' OR title = 'teste2' OR title = 'teste3';

-- Remover posts criados na data específica (28/03/2025 ou 26/03/2025)
DELETE FROM post_likes WHERE post_id IN (SELECT id FROM posts WHERE created_at::date = '2025-03-28' OR created_at::date = '2025-03-26');
DELETE FROM post_comments WHERE post_id IN (SELECT id FROM posts WHERE created_at::date = '2025-03-28' OR created_at::date = '2025-03-26');
DELETE FROM post_media WHERE post_id IN (SELECT id FROM posts WHERE created_at::date = '2025-03-28' OR created_at::date = '2025-03-26');
DELETE FROM posts WHERE created_at::date = '2025-03-28' OR created_at::date = '2025-03-26';

COMMIT;
