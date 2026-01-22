
export const postCategories = [
  {
    id: "comunicacao",
    name: "Comunicação e Vendas",
  },
  {
    id: "marketing",
    name: "Marketing Digital",
  },
  {
    id: "tecnologia",
    name: "Tecnologia e Inovação",
  },
  {
    id: "negocios",
    name: "Empreendedorismo",
  }
];

export type PostCategory = {
  id: string;
  name: string;
  description?: string;
};
