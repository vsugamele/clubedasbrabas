import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchPosts } from "@/services/postService";
import { fetchCategories } from "@/services/postService";
import PostCard from "@/components/feed/PostCard";
import { PostData } from "@/services/postService";
import MainLayout from "@/components/layout/MainLayout";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default function CategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<PostData[]>([]);
  const [category, setCategory] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCategoryAndPosts = async () => {
      try {
        setLoading(true);

        // 1. Carregar informações da categoria
        const categories = await fetchCategories();
        const foundCategory = categories.find(cat => cat.id === categoryId);

        if (!foundCategory) {
          console.error(`Categoria não encontrada: ${categoryId}`);
          setError(`Categoria não encontrada`);
          setLoading(false);
          return;
        }

        setCategory(foundCategory);

        // 2. Carregar posts da categoria
        const { posts: categoryPosts } = await fetchPosts({
          categoryId: foundCategory.id
        });

        setPosts(categoryPosts);
        setLoading(false);
      } catch (err) {
        console.error("Erro ao carregar categoria:", err);
        setError("Ocorreu um erro ao carregar a categoria");
        setLoading(false);
      }
    };

    loadCategoryAndPosts();
  }, [categoryId]);

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center min-h-[400px]">
          <LoadingSpinner size="lg" text="Carregando posts da categoria..." />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex flex-col justify-center items-center min-h-[400px] gap-4">
          <h2 className="text-xl font-semibold text-center">{error}</h2>
          <p className="text-muted-foreground text-center mb-4">
            A categoria que você está procurando não foi encontrada ou pode ter sido removida.
          </p>
          <Button onClick={handleBack} variant="outline" className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Button onClick={handleBack} variant="ghost" size="icon" className="h-8 w-8">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">
            {category?.name || "Categoria"}
          </h1>
        </div>
        
        {posts.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-muted/20">
            <p className="text-muted-foreground">
              Não há posts nesta categoria ainda.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
