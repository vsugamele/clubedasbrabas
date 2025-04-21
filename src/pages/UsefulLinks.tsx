import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Instagram, Youtube, Scissors, Book, Calendar, Gift } from "lucide-react";

interface LinkItem {
  title: string;
  description: string;
  url: string;
  icon: React.ReactNode;
  color: string;
}

const UsefulLinks = () => {
  const links: LinkItem[] = [
    {
      title: "Instagram Oficial",
      description: "Siga nosso perfil oficial e fique por dentro das novidades",
      url: "https://www.instagram.com/jpfreitas06/",
      icon: <Instagram className="h-6 w-6" />,
      color: "bg-gradient-to-br from-pink-500 to-purple-600"
    },
    {
      title: "Canal no YouTube",
      description: "Tutoriais, dicas e conteúdo exclusivo em vídeo",
      url: "https://www.youtube.com/channel/UCjUoPsSp9iX0FkDsy3yV_Ng",
      icon: <Youtube className="h-6 w-6" />,
      color: "bg-gradient-to-br from-red-500 to-red-700"
    },
    {
      title: "Curso de Corte",
      description: "Aprenda técnicas avançadas de corte com nossas especialistas",
      url: "https://jphaireducation.com/",
      icon: <Scissors className="h-6 w-6" />,
      color: "bg-gradient-to-br from-blue-500 to-indigo-600"
    },
    {
      title: "Agenda de Eventos",
      description: "Confira os próximos workshops e encontros da comunidade",
      url: "/events", // Link interno para a página de eventos
      icon: <Calendar className="h-6 w-6" />,
      color: "bg-gradient-to-br from-amber-500 to-orange-600"
    }
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Links Úteis</h1>
          <p className="text-muted-foreground mt-2">
            Acesse recursos, ferramentas e conteúdos exclusivos para membros do Clube das Brabas
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {links.map((link, index) => (
            <Card key={index} className="overflow-hidden border-t-4" style={{ borderTopColor: link.color.split(" ")[0].replace("from-", "") }}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-md text-white ${link.color}`}>
                    {link.icon}
                  </div>
                  <CardTitle className="text-lg">{link.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <CardDescription>{link.description}</CardDescription>
              </CardContent>
              <CardFooter>
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="w-full">
                  <Button variant="outline" className="w-full">
                    Acessar
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </a>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  );
};

export default UsefulLinks;
