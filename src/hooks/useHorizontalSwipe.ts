import { useRef, useEffect, useState } from 'react';

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

/**
 * Hook para detectar gestos de swipe horizontal e permitir navegação por deslize
 * @param elementRef Referência ao elemento que receberá os eventos de toque
 * @param handlers Handlers para eventos de swipe
 * @param threshold Limiar de deslocamento mínimo para considerar um swipe (em pixels)
 */
const useHorizontalSwipe = (
  elementRef: React.RefObject<HTMLElement>,
  handlers: SwipeHandlers,
  threshold: number = 50
) => {
  const [isSwiping, setIsSwiping] = useState(false);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      startXRef.current = e.touches[0].clientX;
      currentXRef.current = startXRef.current;
      setIsSwiping(true);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isSwiping) return;
      currentXRef.current = e.touches[0].clientX;
      
      // Prevenir rolagem vertical se estiver detectando um swipe horizontal significativo
      const diffX = Math.abs(currentXRef.current - startXRef.current);
      
      // Apenas previne o comportamento padrão se o deslize for claramente horizontal
      // mas permite rolagem vertical normal em outros casos
      if (diffX > 20) {
        try {
          e.preventDefault();
        } catch (err) {
          // Ignora erros em alguns navegadores que não permitem preventDefault
          console.log("Não foi possível prevenir comportamento padrão", err);
        }
      }
    };

    const handleTouchEnd = () => {
      if (!isSwiping) return;
      
      const diff = currentXRef.current - startXRef.current;
      const absDiff = Math.abs(diff);
      
      if (absDiff > threshold) {
        if (diff > 0 && handlers.onSwipeRight) {
          handlers.onSwipeRight();
        } else if (diff < 0 && handlers.onSwipeLeft) {
          handlers.onSwipeLeft();
        }
      }
      
      setIsSwiping(false);
    };

    // Usa passive: true para touchMove para melhor performance, 
    // mas isso significa que preventDefault não funcionará nesses eventos
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    // Adicionar eventos para botões de navegação também
    const leftButton = document.querySelector('.scroll-button-left');
    const rightButton = document.querySelector('.scroll-button-right');
    
    if (leftButton && handlers.onSwipeRight) {
      leftButton.addEventListener('click', handlers.onSwipeRight);
    }
    
    if (rightButton && handlers.onSwipeLeft) {
      rightButton.addEventListener('click', handlers.onSwipeLeft);
    }

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      
      // Remover listeners dos botões
      const leftButton = document.querySelector('.scroll-button-left');
      const rightButton = document.querySelector('.scroll-button-right');
      
      if (leftButton && handlers.onSwipeRight) {
        leftButton.removeEventListener('click', handlers.onSwipeRight);
      }
      
      if (rightButton && handlers.onSwipeLeft) {
        rightButton.removeEventListener('click', handlers.onSwipeLeft);
      }
    };
  }, [elementRef, handlers, isSwiping, threshold]);

  return {
    isSwiping
  };
};

export default useHorizontalSwipe;
