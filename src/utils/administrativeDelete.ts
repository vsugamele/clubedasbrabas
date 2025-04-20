/**
 * Sistema simplificado para exclusão administrativa de posts
 * Esta abordagem usa o SDK do Supabase com casting para contornar problemas de tipagem
 */

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Função de exclusão de post para administradores
 * Usa abordagem simples com casting explícito para evitar problemas de tipagem
 */
export async function adminDeletePost(postId: string): Promise<boolean> {
  try {
    // Verifica parâmetro
    if (!postId) {
      console.error('ID do post não fornecido');
      return false;
    }

    console.log(`Tentando excluir post ${postId} como administrador`);
    toast.loading('Excluindo publicação...');

    // Limpar as tabelas relacionadas uma a uma com casting explícito
    // 1. Comentários
    await supabase
      .from('post_comments' as any)
      .delete()
      .eq('post_id', postId);
      
    // 2. Curtidas
    await supabase
      .from('post_likes' as any)
      .delete()
      .eq('post_id', postId);
      
    // 3. Salvos
    await supabase
      .from('post_saves' as any)
      .delete()
      .eq('post_id', postId);
      
    // 4. Relatórios/denúncias
    await supabase
      .from('post_reports' as any)
      .delete()
      .eq('post_id', postId);
      
    // 5. Visualizações
    await supabase
      .from('post_views' as any)
      .delete()
      .eq('post_id', postId);
      
    // 6. Agora exclui o post
    const { error } = await supabase
      .from('posts' as any)
      .delete()
      .eq('id', postId);
      
    if (error) {
      console.error('Erro ao excluir post:', error);
      toast.dismiss();
      toast.error('Não foi possível excluir o post');
      return false;
    }
    
    console.log(`Post ${postId} excluído com sucesso!`);
    toast.dismiss();
    toast.success('Post excluído com sucesso');
    
    return true;
  } catch (error) {
    console.error('Erro ao excluir post:', error);
    toast.dismiss();
    toast.error('Ocorreu um erro ao excluir o post');
    return false;
  }
}

/**
 * Função para recarregar a página após um tempo
 */
export function reloadPage(delay = 1500): void {
  setTimeout(() => {
    window.location.reload();
  }, delay);
}
