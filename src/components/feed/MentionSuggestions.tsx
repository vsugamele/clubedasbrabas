import { useState, useEffect, useRef } from 'react';
import { UserMention } from '@/services/userService';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';

interface MentionSuggestionsProps {
  searchTerm: string;
  users: UserMention[];
  isLoading: boolean;
  onSelectUser: (user: UserMention) => void;
  position: { top: number; left: number };
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

const MentionSuggestions = ({ 
  searchTerm, 
  users, 
  isLoading, 
  onSelectUser,
  position
}: MentionSuggestionsProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset selected index when users list changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [users]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!users.length) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % users.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + users.length) % users.length);
          break;
        case 'Enter':
          e.preventDefault();
          if (users[selectedIndex]) {
            onSelectUser(users[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          // Close suggestions (handled by parent)
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [users, selectedIndex, onSelectUser]);

  // Sempre mostrar o componente durante o carregamento ou se houver usuários
  const shouldShow = isLoading || users.length > 0;
  
  if (!shouldShow) {
    return null;
  }

  console.log("Renderizando sugestões de menção", { users, isLoading });

  return (
    <div 
      ref={containerRef}
      className="absolute z-50 bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 w-64 max-h-60 overflow-y-auto"
      style={{ 
        top: `${position.top}px`, 
        left: `${position.left}px`,
        display: shouldShow ? 'block' : 'none'
      }}
    >
      {isLoading ? (
        <div className="p-2 text-sm text-gray-500 dark:text-gray-400">
          Buscando usuários...
        </div>
      ) : users.length === 0 ? (
        <div className="p-2 text-sm text-gray-500 dark:text-gray-400">
          Nenhum usuário encontrado
        </div>
      ) : (
        <ul className="py-1">
          {users.map((user, index) => (
            <li 
              key={user.id}
              className={`px-3 py-2 flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                index === selectedIndex ? 'bg-gray-100 dark:bg-gray-700' : ''
              }`}
              onClick={() => onSelectUser(user)}
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src={user.avatar_url || undefined} alt={user.full_name} />
                <AvatarFallback>
                  {getInitials(user.full_name || user.username)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium text-sm">{user.full_name || user.username}</div>
                {user.username && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">@{user.username}</div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MentionSuggestions;
