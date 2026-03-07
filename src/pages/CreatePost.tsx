import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import CreatePostForm from '@/components/feed/CreatePostForm';
import { useNavigate } from 'react-router-dom';
import { PostData } from '@/services/postService';
import { toast } from 'sonner';

const CreatePost = () => {
  const navigate = useNavigate();
  
  const handlePostCreated = (newPost: PostData | null) => {
    if (newPost) {
      toast.success("Publicação criada com sucesso!", {
        position: "bottom-right",
      });
      // Redirecionar para a página inicial após criar o post
      navigate('/');
    }
  };
  
  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Criar Publicação</h1>
        <CreatePostForm onPostCreated={handlePostCreated} />
      </div>
    </MainLayout>
  );
};

export default CreatePost;
