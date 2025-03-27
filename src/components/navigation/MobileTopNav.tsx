import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const MobileTopNav = () => {
  const location = useLocation();
  const { toggleSidebar } = useSidebar();
  
  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };
  
  return (
    <div className="sticky top-0 z-30 w-full bg-white border-b border-gray-200 md:hidden">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#ff4400] mr-2">
            <img 
              alt="Logo Clube das Brabas" 
              className="w-6 h-6 object-contain" 
              src="/lovable-uploads/fe794e0a-f834-4651-8887-e813c0115ade.png" 
            />
          </div>
          <h1 className="text-lg font-bold text-[#ff4400]">Clube das Brabas</h1>
        </div>
      </div>
      
      <div className="flex items-center justify-between px-2 py-1 bg-gray-50">
        <div className="grid grid-cols-3 w-full">
          <Link 
            to="/" 
            className={cn(
              "flex flex-col items-center justify-center py-1 px-3 rounded-full text-sm font-medium",
              isActive('/') 
                ? "bg-[#ff4400] text-white" 
                : "text-gray-600 hover:bg-gray-200"
            )}
          >
            Feed
          </Link>
          
          <button
            onClick={toggleSidebar}
            className="flex flex-col items-center justify-center py-1 px-3 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-200"
          >
            <span className="flex items-center">
              <Menu className="h-4 w-4 mr-1" />
              Espaços
            </span>
          </button>
          
          <Link 
            to="/eventos" 
            className={cn(
              "flex flex-col items-center justify-center py-1 px-3 rounded-full text-sm font-medium",
              isActive('/eventos') 
                ? "bg-[#ff4400] text-white" 
                : "text-gray-600 hover:bg-gray-200"
            )}
          >
            Eventos
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MobileTopNav;
