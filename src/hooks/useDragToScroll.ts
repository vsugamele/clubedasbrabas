import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Hook avançado para adicionar funcionalidade de arrastar para rolar (drag-to-scroll)
 * em elementos com overflow, otimizado para dispositivos móveis e desktop
 * 
 * @param containerRef Referência para o elemento container 
 * @param options Opções de configuração
 */
const useDragToScroll = (
  containerRef: React.RefObject<HTMLElement>,
  options: {
    direction?: 'horizontal' | 'vertical' | 'both';
    sensitivity?: number;
    onScrollLeft?: () => void;
    onScrollRight?: () => void;
    scrollAmount?: number;
    behavior?: ScrollBehavior;
  } = {}
) => {
  const {
    direction = 'horizontal',
    sensitivity = 1.5,
    onScrollLeft,
    onScrollRight,
    scrollAmount = 200,
    behavior = 'smooth'
  } = options;

  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [didMove, setDidMove] = useState(false);
  const velocityRef = useRef(0);
  const lastXRef = useRef(0);
  const lastTimeRef = useRef(0);
  const animationRef = useRef<number | null>(null);
  const thresholdExceededRef = useRef(false);

  // Função para rolar para a esquerda
  const scrollToLeft = useCallback(() => {
    if (!containerRef.current) return;
    
    containerRef.current.scrollBy({
      left: -scrollAmount,
      behavior
    });
    
    if (onScrollLeft) onScrollLeft();
    console.log("Scroll to left executed");
  }, [containerRef, scrollAmount, behavior, onScrollLeft]);

  // Função para rolar para a direita
  const scrollToRight = useCallback(() => {
    if (!containerRef.current) return;
    
    containerRef.current.scrollBy({
      left: scrollAmount,
      behavior
    });
    
    if (onScrollRight) onScrollRight();
    console.log("Scroll to right executed");
  }, [containerRef, scrollAmount, behavior, onScrollRight]);

  // Atualizar evento de iniciar arrastar
  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;
    
    setIsDragging(true);
    setDidMove(false);
    setStartX(e.pageX - containerRef.current.offsetLeft);
    setStartY(e.pageY - containerRef.current.offsetTop);
    setScrollLeft(containerRef.current.scrollLeft);
    setScrollTop(containerRef.current.scrollTop);
    
    lastTimeRef.current = Date.now();
    lastXRef.current = e.pageX;
    velocityRef.current = 0;
    thresholdExceededRef.current = false;
  }, [containerRef]);

  // Atualizar evento de arrastar
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    e.preventDefault();
    
    const x = e.pageX - containerRef.current.offsetLeft;
    const y = e.pageY - containerRef.current.offsetTop;
    const walkX = (x - startX) * sensitivity;
    const walkY = (y - startY) * sensitivity;
    
    // Calcular velocidade para momentum
    const now = Date.now();
    const dt = now - lastTimeRef.current;
    if (dt > 0) {
      const dx = e.pageX - lastXRef.current;
      velocityRef.current = dx / dt; // pixels por milissegundo
    }
    
    lastTimeRef.current = now;
    lastXRef.current = e.pageX;
    
    setDidMove(true);
    
    // Detectar se excedeu o limiar de deslocamento para considerar um swipe
    if (Math.abs(walkX) > 50 && !thresholdExceededRef.current) {
      thresholdExceededRef.current = true;
      if (walkX > 0) {
        console.log("Threshold exceeded to right");
      } else {
        console.log("Threshold exceeded to left");
      }
    }
    
    if (direction === 'horizontal' || direction === 'both') {
      containerRef.current.scrollLeft = scrollLeft - walkX;
    }
    
    if (direction === 'vertical' || direction === 'both') {
      containerRef.current.scrollTop = scrollTop - walkY;
    }
  }, [isDragging, containerRef, startX, startY, scrollLeft, scrollTop, sensitivity, direction]);

  // Atualizar evento de finalizar arrasto
  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    setIsDragging(false);

    // Se realmente houve um movimento significativo e não apenas um clique
    if (didMove && thresholdExceededRef.current) {
      // Pegar posição final
      const x = e.pageX - containerRef.current.offsetLeft;
      const walkX = x - startX;
      
      // Identificar direção do swipe e chamar o callback correspondente
      if (walkX > 50) {
        // Swipe para a direita (movimento da esquerda para a direita)
        scrollToLeft();
        console.log("Swipe right detected, scrolling left");
      } else if (walkX < -50) {
        // Swipe para a esquerda (movimento da direita para a esquerda)
        scrollToRight();
        console.log("Swipe left detected, scrolling right");
      }
    }
    
    // Aplicar inércia (momentum scrolling)
    const applyMomentum = () => {
      if (!containerRef.current || Math.abs(velocityRef.current) < 0.1) {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }
        return;
      }
      
      containerRef.current.scrollLeft -= velocityRef.current * 10;
      velocityRef.current *= 0.95; // desaceleração
      
      animationRef.current = requestAnimationFrame(applyMomentum);
    };
    
    if (Math.abs(velocityRef.current) > 0.5) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      animationRef.current = requestAnimationFrame(applyMomentum);
    }
  }, [isDragging, containerRef, startX, didMove, scrollToLeft, scrollToRight]);

  // Configurar eventos de toque
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!containerRef.current || e.touches.length !== 1) return;
    
    setIsDragging(true);
    setDidMove(false);
    
    const touch = e.touches[0];
    setStartX(touch.pageX - containerRef.current.offsetLeft);
    setStartY(touch.pageY - containerRef.current.offsetTop);
    setScrollLeft(containerRef.current.scrollLeft);
    setScrollTop(containerRef.current.scrollTop);
    
    lastTimeRef.current = Date.now();
    lastXRef.current = touch.pageX;
    velocityRef.current = 0;
    thresholdExceededRef.current = false;
    
    console.log("Touch start registered");
  }, [containerRef]);

  // Configurar movimento de toque
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging || !containerRef.current || e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    const x = touch.pageX - containerRef.current.offsetLeft;
    const y = touch.pageY - containerRef.current.offsetTop;
    const walkX = (x - startX) * sensitivity;
    const walkY = (y - startY) * sensitivity;
    
    // Calcular velocidade
    const now = Date.now();
    const dt = now - lastTimeRef.current;
    if (dt > 0) {
      const dx = touch.pageX - lastXRef.current;
      velocityRef.current = dx / dt;
    }
    
    lastTimeRef.current = now;
    lastXRef.current = touch.pageX;
    
    setDidMove(true);
    
    // Detectar movimento horizontal significativo
    if (Math.abs(walkX) > 30 && !thresholdExceededRef.current) {
      thresholdExceededRef.current = true;
      console.log(`Threshold exceeded with walkX: ${walkX}`);
    }
    
    if (direction === 'horizontal' || direction === 'both') {
      containerRef.current.scrollLeft = scrollLeft - walkX;
    }
    
    if (direction === 'vertical' || direction === 'both') {
      containerRef.current.scrollTop = scrollTop - walkY;
    }
    
    // Prevenir scrolling da página apenas se o movimento for primariamente horizontal
    if (Math.abs(walkX) > Math.abs(walkY)) {
      e.preventDefault();
    }
  }, [isDragging, containerRef, startX, startY, scrollLeft, scrollTop, sensitivity, direction]);

  // Finalizar toque
  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    setIsDragging(false);
    
    // Se houve movimento significativo
    if (didMove && thresholdExceededRef.current) {
      // Calcular a distância total percorrida
      const finalX = e.changedTouches[0].pageX - containerRef.current.offsetLeft;
      const totalWalkX = finalX - startX;
      
      console.log(`Touch end with total walk X: ${totalWalkX}`);
      
      // Determinar direção do swipe
      if (totalWalkX > 50) {
        // Swipe para a direita -> navegamos para a esquerda
        scrollToLeft();
        console.log("Swipe right detected, calling onScrollLeft");
      } else if (totalWalkX < -50) {
        // Swipe para a esquerda -> navegamos para a direita
        scrollToRight();
        console.log("Swipe left detected, calling onScrollRight");
      }
    }
    
    // Aplicar momentum
    const applyMomentum = () => {
      if (!containerRef.current || Math.abs(velocityRef.current) < 0.1) {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }
        return;
      }
      
      containerRef.current.scrollLeft -= velocityRef.current * 10;
      velocityRef.current *= 0.95;
      
      animationRef.current = requestAnimationFrame(applyMomentum);
    };
    
    if (Math.abs(velocityRef.current) > 0.5) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      animationRef.current = requestAnimationFrame(applyMomentum);
    }
  }, [isDragging, containerRef, startX, didMove, scrollToLeft, scrollToRight]);

  // Cancelar arrasto se o mouse sair da janela
  const handleMouseLeave = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    }
  }, [isDragging]);

  // Configurar e limpar eventos
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    // Registrar todos os eventos
    element.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    element.addEventListener('mouseleave', handleMouseLeave);
    
    // Eventos de toque
    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      // Limpar eventos ao desmontar
      element.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      element.removeEventListener('mouseleave', handleMouseLeave);
      
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [
    containerRef, 
    handleMouseDown, 
    handleMouseMove, 
    handleMouseUp, 
    handleMouseLeave,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  ]);

  return {
    isDragging,
    scrollToLeft,
    scrollToRight
  };
};

export default useDragToScroll;
