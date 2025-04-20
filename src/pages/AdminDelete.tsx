import { useEffect, useState } from 'react';
import { deletePost, forceDeletePost } from '../services/postService';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';

export function AdminDelete() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  
  const navigate = useNavigate();
  
  // Obter email do usuário atual
  useEffect(() => {
    async function getUserEmail() {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.email) {
        setCurrentEmail(data.user.email);
      }
    }
    getUserEmail();
  }, []);

  const postToDelete = {
    id: '4e94d627-0cb6-4de5-9e22-4b46d3d25d4a',
    content: 'teste',
    authorId: '0ea0ac68-6048-41e8-8dbf-ae49368be227'
  };
  
  const handleSoftDelete = async () => {
    if (!currentEmail) {
      setError('É necessário estar logado para executar esta ação');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await deletePost(postToDelete.id, postToDelete.authorId, currentEmail);
      if (result.success) {
        toast.success('Post excluído com sucesso (soft delete)');
        setSuccess(true);
      } else {
        setError(result.error || 'Erro ao excluir o post');
      }
    } catch (err) {
      console.error('Erro ao excluir:', err);
      setError('Ocorreu um erro ao processar a solicitação');
    } finally {
      setLoading(false);
    }
  };
  
  const handleForceDelete = async () => {
    if (!currentEmail) {
      setError('É necessário estar logado para executar esta ação');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await forceDeletePost(postToDelete.id, currentEmail);
      if (result.success) {
        toast.success('Post removido permanentemente do banco de dados');
        setSuccess(true);
      } else {
        setError(result.error || 'Erro ao excluir permanentemente o post');
      }
    } catch (err) {
      console.error('Erro na exclusão permanente:', err);
      setError('Ocorreu um erro ao processar a solicitação de exclusão permanente');
    } finally {
      setLoading(false);
    }
  };
  
  const goToFeed = () => {
    navigate('/');
  };
  
  return (
    <div className="container max-w-xl mx-auto py-8">
      <Card className="w-full">
        <CardHeader className="bg-red-50">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-600" />
            <CardTitle className="text-red-700">Exclusão Administrativa</CardTitle>
          </div>
          <CardDescription>
            Você está prestes a excluir o post com ID: {postToDelete.id}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6">
          <div className="mb-4">
            <strong>Conteúdo do post:</strong> {postToDelete.content}
          </div>
          <div className="mb-4">
            <strong>ID do autor:</strong> {postToDelete.authorId}
          </div>
          
          {error && (
            <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
              {error}
            </div>
          )}
          
          {success && (
            <div className="p-3 mb-4 bg-green-50 border border-green-200 text-green-700 rounded-md">
              O post foi excluído com sucesso!
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col sm:flex-row gap-3">
          {!success && (
            <>
              <Button 
                variant="outline" 
                onClick={handleSoftDelete} 
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {loading ? 'Excluindo...' : 'Soft Delete (Ocultar Post)'}
              </Button>
              
              <Button 
                variant="destructive" 
                onClick={handleForceDelete} 
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {loading ? 'Excluindo...' : 'Excluir Permanentemente'}
              </Button>
            </>
          )}
          
          <Button
            variant={success ? "default" : "outline"}
            onClick={goToFeed}
            className={`w-full sm:w-auto ${success ? "bg-brand-500" : ""}`}
          >
            Voltar para o Feed
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default AdminDelete;
