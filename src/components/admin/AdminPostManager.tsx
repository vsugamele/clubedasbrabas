/**
 * AdminPostManager
 * Componente dedicado para administradores gerenciarem posts
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { softDeletePost, reloadAfterDelay } from '@/utils/softDeleteService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, RefreshCcw, Search, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/auth';
import { isAdminByEmailSync } from '@/utils/adminUtils';

interface Post {
  id: string;
  title: string;
  content: string;
  created_at: string;
  user_id: string; // Em vez de author_id
  author_name?: string;
  author_email?: string;
}

export default function AdminPostManager() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const { user } = useAuth();
  const isAdmin = user ? isAdminByEmailSync(user.email) : false;

  // Verificar se o usuário é administrador
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-red-50 text-red-800 rounded-lg">
        <ShieldAlert className="w-12 h-12 mb-4" />
        <h2 className="text-xl font-bold mb-2">Acesso Restrito</h2>
        <p>Este painel é exclusivo para administradores.</p>
      </div>
    );
  }

  // Carregar posts ao inicializar o componente
  useEffect(() => {
    fetchPosts();
  }, []);

  // Função para buscar posts
  const fetchPosts = async () => {
    try {
      setLoading(true);
      
      // Buscar posts com simplificação para evitar erros de relação
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id, 
          title, 
          content, 
          created_at, 
          user_id
        `)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) {
        console.error('Erro ao buscar posts:', error);
        toast.error('Não foi possível carregar os posts');
        return;
      }
      
      // Formatar dados simplificados (sem juntar tabelas)
      const formattedPosts = data.map(post => ({
        id: post.id,
        title: post.title || 'Sem título',
        content: post.content || 'Sem conteúdo',
        created_at: post.created_at,
        user_id: post.user_id,
        author_name: 'Usuário ID: ' + post.user_id,
        author_email: '', // Não temos o email com esta abordagem simplificada
      }));
      
      setPosts(formattedPosts);
    } catch (error) {
      console.error('Erro ao buscar posts:', error);
      toast.error('Ocorreu um erro ao carregar os posts');
    } finally {
      setLoading(false);
    }
  };

  // Função para marcar post como excluído (soft delete)
  const deletePost = async (postId: string) => {
    try {
      setDeleting(postId);
      
      console.log(`Usando abordagem soft delete para post ${postId}...`);
      
      // Chamar o serviço de soft delete
      const success = await softDeletePost(postId);
      
      if (!success) {
        console.error('Falha no soft delete');
        return false;
      }
      
      console.log(`Post ${postId} removido com sucesso via soft delete!`);
      
      // Atualizar a lista de posts - remover da UI mesmo que fisicamente ainda exista
      setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
      
      // Recarregar a página após um pequeno delay para garantir que as mudanças sejam aplicadas
      setTimeout(() => {
        fetchPosts(); // Atualizar a lista de posts
      }, 1000);
      
      return true;
    } catch (error) {
      console.error('Erro ao excluir post:', error);
      toast.error('Ocorreu um erro ao excluir o post');
      return false;
    } finally {
      setDeleting(null);
    }
  };

  // Filtrar posts com base no termo de busca
  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.author_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.author_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center">
              <ShieldAlert className="w-5 h-5 mr-2 text-red-500" />
              Gerenciamento Administrativo de Posts
            </h1>
            <p className="text-gray-600 mt-1">
              Esta ferramenta permite excluir posts diretamente, contornando permissões regulares.
            </p>
          </div>
          <Button 
            onClick={fetchPosts} 
            variant="outline" 
            size="sm"
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCcw className="w-4 h-4" />
            {loading ? 'Carregando...' : 'Atualizar'}
          </Button>
        </div>
        
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Buscar posts por título, conteúdo ou autor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Carregando posts...</p>
            </div>
          ) : filteredPosts.length > 0 ? (
            filteredPosts.map(post => (
              <Card key={post.id} className="relative">
                <CardHeader>
                  <CardTitle>{post.title}</CardTitle>
                  <CardDescription>
                    Por: {post.author_name}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <p className="text-gray-700">
                    {post.content.length > 150 
                      ? `${post.content.substring(0, 150)}...` 
                      : post.content}
                  </p>
                  <div className="text-xs text-gray-500 mt-2">
                    ID: {post.id}
                  </div>
                </CardContent>
                
                <CardFooter className="flex justify-between border-t pt-4">
                  <div className="text-sm text-gray-500">
                    {new Date(post.created_at).toLocaleString('pt-BR')}
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deletePost(post.id)}
                    disabled={deleting === post.id}
                    className="flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    {deleting === post.id ? 'Removendo...' : 'Remover Post'}
                  </Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="text-center py-12 border rounded-lg">
              <p className="text-gray-500">
                {searchTerm 
                  ? 'Nenhum post encontrado para esta busca' 
                  : 'Nenhum post disponível'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
