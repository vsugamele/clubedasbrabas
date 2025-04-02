import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, PlusCircle, Bell, MessageCircle, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth';

const MobileNavbar = () => {
  const location = useLocation();
  const { user } = useAuth();
  
  // Se não houver usuário logado, não exibir a barra de navegação
  if (!user) return null;
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 h-16 z-50 md:hidden">
      <div className="grid grid-cols-5 h-full">
        <Link 
          to="/" 
          className={cn(
            "flex flex-col items-center justify-center text-xs",
            isActive('/') ? "text-brand-600" : "text-gray-500"
          )}
        >
          <Home className="h-6 w-6 mb-1" />
          <span>Início</span>
        </Link>
        
        <Link 
          to="/links" 
          className={cn(
            "flex flex-col items-center justify-center text-xs",
            isActive('/links') ? "text-brand-600" : "text-gray-500"
          )}
        >
          <ExternalLink className="h-6 w-6 mb-1" />
          <span>Links</span>
        </Link>
        
        <Link 
          to="/create-post" 
          className="flex flex-col items-center justify-center text-xs text-brand-600"
        >
          <div className="bg-brand-600 text-white rounded-full p-2 -mt-5 shadow-lg">
            <PlusCircle className="h-6 w-6" />
          </div>
          <span className="mt-1">Postar</span>
        </Link>
        
        <Link 
          to="/notifications" 
          className={cn(
            "flex flex-col items-center justify-center text-xs",
            isActive('/notifications') ? "text-brand-600" : "text-gray-500"
          )}
        >
          <Bell className="h-6 w-6 mb-1" />
          <span>Alertas</span>
        </Link>
        
        <Link 
          to="/messages" 
          className={cn(
            "flex flex-col items-center justify-center text-xs",
            isActive('/messages') ? "text-brand-600" : "text-gray-500"
          )}
        >
          <MessageCircle className="h-6 w-6 mb-1" />
          <span>Chat</span>
        </Link>
      </div>
    </div>
  );
};

export default MobileNavbar;
