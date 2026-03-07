import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, AlertTriangle } from "lucide-react";
import { forceDeletePost } from "@/services/postService";
import { toast } from "sonner";

export const QuickPostRemover = () => {
  const [postId, setPostId] = useState<string>("");
  const [deleting, setDeleting] = useState<boolean>(false);
  const [result, setResult] = useState<{success: boolean, message: string} | null>(null);

  const handleForceDelete = async () => {
    if (!postId.trim()) {
      toast.error("Por favor, insira um ID de post válido");
      return;
    }

    try {
      setDeleting(true);
      setResult(null);
      
      console.log(`Tentando remover post com ID: ${postId}`);
      const success = await forceDeletePost(postId);
      
      if (success) {
        setResult({
          success: true,
          message: `Post ${postId} removido com sucesso!`
        });
        toast.success("Post removido com sucesso");
      } else {
        setResult({
          success: false,
          message: `Não foi possível remover o post ${postId}. Verifique o console para mais detalhes.`
        });
        toast.error("Não foi possível remover o post");
      }
    } catch (error) {
      console.error("Erro ao forçar exclusão:", error);
      setResult({
        success: false,
        message: `Erro ao tentar remover o post: ${error instanceof Error ? error.message : String(error)}`
      });
      toast.error("Erro ao tentar remover o post");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className="border-red-200">
      <CardHeader className="bg-red-50">
        <CardTitle className="flex items-center gap-2 text-lg text-red-700">
          <AlertTriangle className="h-5 w-5" />
          <span>Removedor Rápido de Posts</span>
        </CardTitle>
        <CardDescription className="text-red-600">
          Use esta ferramenta para remover rapidamente um post específico pelo ID.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-4">
        <div className="mb-4 flex gap-2">
          <Input
            placeholder="ID do post a ser removido..."
            value={postId}
            onChange={(e) => setPostId(e.target.value)}
            className="flex-1"
          />
          <Button
            variant="destructive"
            onClick={handleForceDelete}
            disabled={deleting || !postId.trim()}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            {deleting ? "Removendo..." : "Remover"}
          </Button>
        </div>
        
        {result && (
          <div className={`p-3 rounded-lg mt-4 ${result.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {result.message}
          </div>
        )}
        
        <div className="mt-4 text-sm text-muted-foreground">
          <p className="font-medium">Como encontrar o ID do post:</p>
          <ol className="list-decimal pl-5 mt-2 space-y-1">
            <li>Clique com o botão direito no post e selecione "Inspecionar"</li>
            <li>Procure por atributos como <code>data-post-id</code> ou <code>id</code> que contenham o ID do post</li>
            <li>Copie esse ID e cole no campo acima</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickPostRemover;
