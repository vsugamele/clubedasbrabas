import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search as SearchIcon } from 'lucide-react';
import { PostData, fetchPosts } from '@/services/postService';
import PostCard from '@/components/feed/PostCard';
import { fetchUsers } from '@/services/userService';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Link } from 'react-router-dom';

interface UserProfile {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
}

const Search = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState<PostData[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    
    try {
      // Buscar posts que contenham a query no conteúdo
      const postsResult = await fetchPosts({
        limit: 20,
        searchTerm: searchQuery
      });
      
      setPosts(postsResult.posts || []);
      
      // Buscar usuários que correspondam à query
      const usersResult = await fetchUsers(searchQuery);
      setUsers(usersResult || []);
    } catch (error) {
      console.error('Erro ao buscar resultados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Auto-busca quando o query tem pelo menos 3 caracteres
    if (searchQuery.length >= 3) {
      const timer = setTimeout(() => {
        handleSearch();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [searchQuery]);

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Buscar</h1>
        
        <div className="relative mb-6">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar posts, pessoas, tópicos..."
            className="pl-10 pr-20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button 
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 px-3"
            onClick={handleSearch}
            disabled={isLoading}
          >
            Buscar
          </Button>
        </div>
        
        {searchQuery && (
          <Tabs defaultValue="posts" className="w-full" onValueChange={(value) => setActiveTab(value)}>
            <TabsList className="w-full mb-4">
              <TabsTrigger value="posts" className="flex-1">Posts</TabsTrigger>
              <TabsTrigger value="people" className="flex-1">Pessoas</TabsTrigger>
            </TabsList>
            
            <TabsContent value="posts" className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
              ) : posts.length > 0 ? (
                posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))
              ) : (
                <div className="text-center py-8 border rounded-lg bg-gray-50">
                  <p className="text-gray-500">Nenhum post encontrado para "{searchQuery}"</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="people" className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
              ) : users.length > 0 ? (
                <div className="space-y-2">
                  {users.map((user) => (
                    <Link 
                      key={user.id} 
                      to={`/profile/${user.id}`}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Avatar>
                        <AvatarImage src={user.avatar_url || undefined} alt={user.full_name} />
                        <AvatarFallback className="bg-brand-100 text-brand-700">
                          {user.full_name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.full_name}</p>
                        <p className="text-sm text-muted-foreground">@{user.username}</p>
                        {user.bio && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-1">{user.bio}</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border rounded-lg bg-gray-50">
                  <p className="text-gray-500">Nenhuma pessoa encontrada para "{searchQuery}"</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </MainLayout>
  );
};

export default Search;
