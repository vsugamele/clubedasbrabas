import React, { useState, useEffect } from "react";
import { fetchReferencesByType, ReferenceItem } from "@/services/referenceService";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ReferenceModal from "@/components/references/ReferenceModal";
import MainLayout from "@/components/layout/MainLayout";
import { Home, BookOpen, Image, ScissorsSquare, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const ReferenceGallery = () => {
  const [references, setReferences] = useState<ReferenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState("all");
  const [selectedReference, setSelectedReference] = useState<ReferenceItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadReferences();
  }, [selectedType]);

  const loadReferences = async () => {
    setLoading(true);
    const data = await fetchReferencesByType(selectedType);
    setReferences(data);
    setLoading(false);
  };

  const handleReferenceClick = (reference: ReferenceItem) => {
    setSelectedReference(reference);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedReference(null);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
    } catch (error) {
      return "Data inválida";
    }
  };

  // Componente de navegação superior para desktop e tablet
  const TopNavigation = () => (
    <div className="hidden sm:flex items-center gap-4 mb-6 bg-white dark:bg-gray-900 p-3 rounded-lg shadow-sm">
      <Link to="/">
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          <Home className="h-4 w-4" />
          <span>Início</span>
        </Button>
      </Link>
      <div className="text-gray-400">/</div>
      <Link to="/referencias">
        <Button variant="ghost" size="sm" className="flex items-center gap-2 font-medium text-orange-600">
          <BookOpen className="h-4 w-4" />
          <span>Galeria de Referências</span>
        </Button>
      </Link>
    </div>
  );

  // Componente de navegação superior para mobile
  const MobileTopNavigation = () => (
    <div className="flex sm:hidden items-center justify-between mb-4 bg-white dark:bg-gray-900 p-3 rounded-lg shadow-sm">
      <div className="flex items-center gap-2">
        <Link to="/">
          <Button variant="ghost" size="sm" className="p-1">
            <Home className="h-4 w-4" />
          </Button>
        </Link>
        <div className="text-gray-400">/</div>
        <span className="font-medium text-orange-600 text-sm">Galeria</span>
      </div>
      <div className="flex items-center">
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <Filter className="h-3 w-3 mr-1" />
            <SelectValue placeholder="Filtrar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="2B">Tipo 2B</SelectItem>
            <SelectItem value="2C">Tipo 2C</SelectItem>
            <SelectItem value="3A">Tipo 3A</SelectItem>
            <SelectItem value="3B">Tipo 3B</SelectItem>
            <SelectItem value="3C">Tipo 3C</SelectItem>
            <SelectItem value="4A">Tipo 4A</SelectItem>
            <SelectItem value="4B">Tipo 4B</SelectItem>
            <SelectItem value="4C">Tipo 4C</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <MainLayout>
      <div className="container mx-auto py-4 px-4">
        {/* Navegação superior */}
        <TopNavigation />
        <MobileTopNavigation />

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Galeria de Referências</h1>
          <p className="text-muted-foreground">
            Veja todos os seus trabalhos antes e depois.
          </p>
        </div>

        {/* Filtro de tipo para desktop e tablet */}
        <div className="hidden sm:flex mb-6">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">Filtrar por tipo:</p>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="2B">Tipo 2B</SelectItem>
                <SelectItem value="2C">Tipo 2C</SelectItem>
                <SelectItem value="3A">Tipo 3A</SelectItem>
                <SelectItem value="3B">Tipo 3B</SelectItem>
                <SelectItem value="3C">Tipo 3C</SelectItem>
                <SelectItem value="4A">Tipo 4A</SelectItem>
                <SelectItem value="4B">Tipo 4B</SelectItem>
                <SelectItem value="4C">Tipo 4C</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <LoadingSpinner size="lg" text="Carregando referências..." />
          </div>
        ) : references.length === 0 ? (
          <div className="text-center p-12 border rounded-lg bg-muted/20">
            <h3 className="text-lg font-medium mb-2">Nenhuma referência encontrada</h3>
            <p className="text-muted-foreground">
              Não há referências disponíveis para os filtros selecionados.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {references.map((reference) => (
              <Card 
                key={reference.id} 
                className="overflow-hidden cursor-pointer transition-all hover:shadow-md"
                onClick={() => handleReferenceClick(reference)}
              >
                <div className="relative">
                  <div className="grid grid-cols-2">
                    <div className="relative">
                      <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-md">
                        Antes
                      </div>
                      <img 
                        src={reference.before_image || '/placeholder-image.jpg'} 
                        alt="Antes" 
                        className="w-full h-48 object-cover"
                      />
                    </div>
                    <div className="relative">
                      <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-md">
                        Depois
                      </div>
                      <img 
                        src={reference.after_image || '/placeholder-image.jpg'} 
                        alt="Depois" 
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                    <h3 className="text-white font-medium truncate">{reference.title}</h3>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      Tipo {reference.type}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(reference.created_at)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {isModalOpen && selectedReference && (
          <ReferenceModal
            reference={selectedReference}
            onClose={handleCloseModal}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default ReferenceGallery;
