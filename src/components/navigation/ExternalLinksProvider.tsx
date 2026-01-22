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
    const fetchLinks = async () => {
      try {
        const { data, error } = await supabase
          .from('useful_links')
          .select('*')
          .order('created_at', { ascending: true }); // Using created_at since order_index might not exist yet

        if (error) {
          console.error('Error fetching useful links:', error);
          setError(error as any);
          // Fallback to defaults if DB fail
          const defaultLinksWithIds = defaultLinks.map((link, index) => ({
            ...link,
            id: `default-${index}`
          }));
          setLinks(defaultLinksWithIds);
        } else {
          // Map DB fields to ExternalLink interface
          const dbData = data || [];
          const mappedLinks = dbData.map((item: any, index: number) => ({
            id: item.id,
            name: item.title,
            url: item.url,
            order_index: index,
            description: item.description,
            category: item.category
          }));

          // If no links in DB, use default links
          if (mappedLinks.length === 0) {
            const defaultLinksWithIds = defaultLinks.map((link, index) => ({
              ...link,
              id: `default-${index}`
            }));
            setLinks(defaultLinksWithIds);
          } else {
            setLinks(mappedLinks as any);
          }
        }
      } catch (err) {
        console.error('Error in fetchLinks:', err);
        // Fallback to defaults on critical error
        const defaultLinksWithIds = defaultLinks.map((link, index) => ({
          ...link,
          id: `default-${index}`
        }));
        setLinks(defaultLinksWithIds);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLinks();
  }, []);

  return (
    <ExternalLinksContext.Provider value={{ links, isLoading, error }}>
      {children}
    </ExternalLinksContext.Provider>
  );
};
