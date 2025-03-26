
import { PostProps } from "@/components/feed/PostCard";

// Mock data for posts
export const mockPosts: PostProps[] = [
  {
    id: "post1",
    author: {
      id: "author1",
      name: "Maria Clara Almeida",
      avatar: "",
      role: "Empreendedor"
    },
    category: {
      id: "negocios",
      name: "Empreendedorismo"
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    content: "Criar conteúdo autêntico não é sobre mostrar tudo, mas sobre mostrar o que importa. Quais são as melhores práticas que vocês utilizam para criar conteúdo que realmente conecta com a audiência?",
    likes: 15,
    comments: 5,
    isLiked: false,
  },
  {
    id: "post2",
    author: {
      id: "author2",
      name: "Ricardo Alvarinho",
      avatar: "",
      role: "Especialista em Vendas"
    },
    category: {
      id: "comunicacao",
      name: "Comunicação e Vendas"
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    content: "Hoje na aula semanal falamos sobre como gerar valor e conduzir o cliente para o fechamento. Compartilho aqui um resumo dos principais pontos abordados:\n\n1. Entenda a real necessidade do cliente\n2. Demonstre soluções personalizadas\n3. Construa um relacionamento baseado em confiança\n4. Comunique o valor de forma clara\n\nQual desses pontos vocês acham mais desafiador?",
    media: [
      {
        type: "image",
        url: "https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80",
        aspectRatio: 16/9,
      },
    ],
    likes: 32,
    comments: 8,
    isLiked: true,
  },
  {
    id: "post3",
    author: {
      id: "author3",
      name: "Vinícius de Almeida Freitas",
      avatar: "",
    },
    category: {
      id: "tecnologia",
      name: "Tecnologia e Inovação"
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    content: "Vamos falar de Agentes IA de verdade (na prática, sem exageros). Depois de implementar em 3 empresas diferentes, posso dizer que o ganho de produtividade é real, mas existem desafios importantes:\n\n- Treinamento constante da equipe\n- Ajustes frequentes nos prompts\n- Integração com sistemas legados\n\nAlguém mais está experimentando com IA no dia a dia de trabalho?",
    media: [
      {
        type: "image",
        url: "https://images.unsplash.com/photo-1677442135136-760c813a743d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1332&q=80",
        aspectRatio: 16/9,
      },
    ],
    likes: 47,
    comments: 13,
  },
];

// Mock data for events
export const mockEvents = [
  {
    id: "event1",
    title: "Aula Semanal 439 - Os erros mais comuns em estratégias de crescimento",
    presenter: "Leo Naylor",
    date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2), // 2 days from now
    timeStart: "07:00",
    timeEnd: "08:00",
  },
  {
    id: "event2",
    title: "Comunidade AO VIVO #97 - Como gerar valor e conduzir o cliente para o fechamento",
    presenter: "Ricardo Alvarinho",
    date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3), // 3 days from now
    timeStart: "06:00",
    timeEnd: "07:00",
  },
];

// Mock data for trending posts
export const mockTrendingPosts = [
  {
    id: "trending1",
    title: "Como Criar uma Página de Vendas Perfeita?",
    author: "Antonio Mike",
    likes: 156,
  },
  {
    id: "trending2",
    title: "Prestadores de serviço, como vocês estão captando clientes ultimamente?",
    author: "Caio Herculano Crepaldi",
    likes: 98,
  },
];

// Mock data for connection suggestions
export const mockConnectionSuggestions = ["Ana Lima", "Carlos Mendes", "Julia Ferreira"];
