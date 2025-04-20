import React, { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { fetchPosts, PostData, FetchPostsOptions, deletePost, togglePinPost, fetchCommunities } from "@/services/postService";
import PostCard from "./PostCard";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import CreatePostForm from "./CreatePostForm";
import { useAuth } from "@/context/auth";

export interface PostFeedProps {
  communityId?: string;
  categoryId?: string;
  isLoading?: boolean;
}

const PostFeed = ({ communityId, categoryId, isLoading: initialLoading }: PostFeedProps) => {
  const [posts, setPosts] = useState<PostData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(initialLoading || true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [communityRestrictions, setCommunityRestrictions] = useState<Record<string, string>>({});
  const { user } = useAuth();
  
  // Verificar se o usuário é administrador usando a função do adminUtils
  const userEmail = user?.email;
  const userId = user?.id;
  
  // Função de verificação inline para evitar problemas de importação
  const isAdmin = userEmail === "souzadecarvalho1986@gmail.com" || 
                  userEmail === "vsugamele@gmail.com" || 
                  userEmail === "admin@example.com";
  
  // Por enquanto, consideramos que administradores são moderadores de todas as comunidades
  const isModerator = isAdmin;

  // Carregar as restrições de postagem das comunidades
  useEffect(() => {
    const loadCommunityRestrictions = async () => {
      try {
        const communities = await fetchCommunities();
        const restrictionsMap: Record<string, string> = {};
        
        communities.forEach(community => {
          restrictionsMap[community.id] = community.posting_restrictions;
        });
        
        setCommunityRestrictions(restrictionsMap);
      } catch (error) {
        console.error("Erro ao carregar restrições de comunidades:", error);
      }
    };
    
    loadCommunityRestrictions();
  }, []);

  // Verificar se o usuário pode postar na comunidade atual
  const canPostInCurrentCommunity = useCallback(() => {
    // Se o usuário não estiver autenticado, não pode postar
    if (!user) return false;
    
    // Se não há comunidade selecionada, qualquer usuário autenticado pode postar
    if (!communityId) return true;
    
    // Obter as restrições da comunidade atual
    const restrictions = communityRestrictions[communityId];
    
    // Se não há restrições ou as restrições são para todos os membros, qualquer usuário autenticado pode postar
    if (!restrictions || restrictions === 'all_members') return true;
    
    // Se as restrições são apenas para administradores, apenas administradores podem postar
    return isAdmin;
  }, [communityId, communityRestrictions, isAdmin, user]);

  useEffect(() => {
    loadPosts();
  }, [communityId, categoryId, retryCount]);

  const loadPosts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log(`Carregando posts ${communityId ? `para comunidade ${communityId}` : 'do feed principal'} ${categoryId ? `na categoria ${categoryId}` : ''}`);
      
      // Pass proper FetchPostsOptions object
      const options: FetchPostsOptions = {
        limit: 20
      };
      
      if (communityId) {
        options.communityId = communityId;
        console.log(`PostFeed - Filtrando por comunidade: ${communityId}`);
      }
      
      if (categoryId) {
        options.categoryId = categoryId;
        console.log(`PostFeed - Filtrando por categoria: ${categoryId}`);
      }
      
      const result = await fetchPosts(options);
      console.log(`PostFeed - Posts carregados: ${result.posts.length}`);
      setPosts(result.posts);
    } catch (error) {
      console.error("Erro ao carregar posts:", error);
      setError("Não foi possível carregar as publicações. Tente novamente mais tarde.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostCreated = (newPost: PostData | null) => {
    if (newPost) {
      setPosts(currentPosts => [newPost, ...currentPosts]);
    }
    loadPosts();
  };

  // Adicionar um estado para controlar o recarregamento
  const [reloadTrigger, setReloadTrigger] = useState(0);
  
  // Função para forçar o recarregamento dos posts
  const forceReload = () => {
    setReloadTrigger(prev => prev + 1);
  };
  
  // Usar o reloadTrigger como dependência para o useEffect
  useEffect(() => {
    loadPosts();
  }, [communityId, categoryId, reloadTrigger]);

  const handleDeletePost = async (postId: string, postAuthorId?: string) => {
    try {
      console.log(`Tentando excluir post ${postId} com userEmail ${userEmail} e userId ${userId}`);
      
      // Verifica se temos o ID do autor do post, se não, usa o userId atual (para compatibilidade)
      const authorIdToUse = postAuthorId || userId;
      
      // Passa todos os parâmetros necessários para a função deletePost
      const result = await deletePost(postId, userEmail, userId);
      
      if (result.success) {
        // Primeiro, remover o post da lista atual para efeito visual imediato
        setPosts(currentPosts => currentPosts.filter(post => post.id !== postId));
        
        toast.success("Publicação excluída com sucesso", {
          position: "bottom-right",
        });
        
        // Aguardar um breve momento e forçar o recarregamento dos posts
        // para garantir que a UI reflita o estado real do banco de dados
        setTimeout(() => {
          console.log('Forçando recarregamento após exclusão');
          forceReload();
        }, 300);
      } else {
        toast.error("Não foi possível excluir a publicação", {
          position: "bottom-right",
        });
        // Forçar recarregamento mesmo em caso de erro para garantir sincronização
        forceReload();
      }
    } catch (error) {
      console.error("Erro ao excluir post:", error);
      toast.error("Erro ao excluir a publicação", {
        position: "bottom-right",
      });
      // Forçar recarregamento mesmo em caso de erro para garantir sincronização
      forceReload();
    }
  };
  
  const handlePinPost = async (postId: string, isPinned: boolean) => {
    try {
      const success = await togglePinPost(postId, isPinned);
      if (success) {
        // Atualizar o estado do post na lista
        setPosts(currentPosts => 
          currentPosts.map(post => 
            post.id === postId 
              ? { ...post, isPinned } 
              : post
          )
        );
        
        toast.success(
          isPinned 
            ? "Publicação fixada com sucesso" 
            : "Publicação desafixada com sucesso", 
          { position: "bottom-right" }
        );
        
        // Recarregar posts para garantir a ordem correta
        loadPosts();
      } else {
        toast.error(
          isPinned 
            ? "Não foi possível fixar a publicação" 
            : "Não foi possível desafixar a publicação", 
          { position: "bottom-right" }
        );
      }
    } catch (error) {
      console.error(`Erro ao ${isPinned ? 'fixar' : 'desafixar'} post:`, error);
      toast.error(`Erro ao ${isPinned ? 'fixar' : 'desafixar'} a publicação`, {
        position: "bottom-right",
      });
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };
  
  // Ordenar posts para mostrar os fixados primeiro
  const sortedPosts = useMemo(() => {
    return [...posts].sort((a, b) => {
      // Primeiro critério: posts fixados vêm primeiro
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      
      // Segundo critério: posts mais recentes primeiro
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [posts]);

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        {user ? (
          canPostInCurrentCommunity() ? (
            <CreatePostForm communityId={communityId} onPostCreated={handlePostCreated} />
          ) : (
            <div className="text-center py-12 border rounded-lg bg-gray-50">
              <p className="text-gray-500 mb-4">Você não tem permissão para postar nessa comunidade.</p>
            </div>
          )
        ) : (
          <div className="text-center py-12 border rounded-lg bg-gray-50">
            <p className="text-gray-500 mb-4">Faça login para criar publicações.</p>
          </div>
        )}
        <div className="flex flex-col items-center py-12 text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button 
            onClick={handleRetry}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  if (posts.length === 0 && !isLoading && !error) {
    return (
      <div className="space-y-4">
        {user ? (
          canPostInCurrentCommunity() ? (
            <CreatePostForm communityId={communityId} onPostCreated={handlePostCreated} />
          ) : (
            <div className="text-center py-12 border rounded-lg bg-gray-50">
              <p className="text-gray-500 mb-4">Você não tem permissão para postar nessa comunidade.</p>
            </div>
          )
        ) : (
          <div className="text-center py-12 border rounded-lg bg-gray-50">
            <p className="text-gray-500 mb-4">Faça login para criar publicações.</p>
          </div>
        )}
        <div className="text-center py-12 border rounded-lg bg-gray-50">
          <p className="text-gray-500 mb-4">Não há publicações para exibir</p>
          <Button 
            onClick={handleRetry}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar feed
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {user ? (
        canPostInCurrentCommunity() ? (
          <CreatePostForm communityId={communityId} onPostCreated={handlePostCreated} />
        ) : (
          <div className="text-center py-12 border rounded-lg bg-gray-50">
            <p className="text-gray-500 mb-4">Você não tem permissão para postar nessa comunidade.</p>
          </div>
        )
      ) : (
        <div className="text-center py-12 border rounded-lg bg-gray-50">
          <p className="text-gray-500 mb-4">Faça login para criar publicações.</p>
        </div>
      )}
      {sortedPosts.map((post) => (
        <PostCard 
          key={post.id} 
          post={post} 
          onPostUpdated={loadPosts} 
          onDeletePost={handleDeletePost}
          onPinPost={handlePinPost}
          isModerator={isModerator}
        />
      ))}
    </div>
  );
};

export default PostFeed;
