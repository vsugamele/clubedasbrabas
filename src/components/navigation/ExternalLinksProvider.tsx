import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Definir a interface para os links externos
export interface ExternalLink {
  id: string;
  name: string;
  url: string;
  order_index: number;
  highlighted?: boolean; // Novo campo para indicar se o link deve ser destacado
}

// Definir os links padrão que queremos ter sempre disponíveis
const defaultLinks: Omit<ExternalLink, 'id'>[] = [
  {
    name: 'Área de Membro',
    url: 'https://plataforma.haireducation.com.br/',
    order_index: 1,
    highlighted: true // Destacar este link
  },
  {
    name: 'Formação JP Hair Education',
    url: 'https://jphaireducation.com/',
    order_index: 2
  },
  {
    name: 'JP Hair Collection',
    url: 'https://jpcollections.com.br/',
    order_index: 3
  },
  {
    name: 'Cortes Descomplicados',
    url: 'https://jphaireducation.com/cortes-descomplicados',
    order_index: 4
  }
];

// Criar o contexto
interface ExternalLinksContextType {
  links: ExternalLink[];
  isLoading: boolean;
  error: Error | null;
}

const ExternalLinksContext = createContext<ExternalLinksContextType>({
  links: [],
  isLoading: true,
  error: null
});

// Hook para usar o contexto
export const useExternalLinks = () => useContext(ExternalLinksContext);

// Provedor do contexto
interface ExternalLinksProviderProps {
  children: ReactNode;
}

export const ExternalLinksProvider = ({ children }: ExternalLinksProviderProps) => {
  const [links, setLinks] = useState<ExternalLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Usar diretamente os links padrão para evitar duplicação
    const defaultLinksWithIds = defaultLinks.map((link, index) => ({
      ...link,
      id: `default-${index}`
    }));
    
    setLinks(defaultLinksWithIds);
    setIsLoading(false);
  }, []);
  
  return (
    <ExternalLinksContext.Provider value={{ links, isLoading, error }}>
      {children}
    </ExternalLinksContext.Provider>
  );
};
