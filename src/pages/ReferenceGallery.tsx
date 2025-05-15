import React, { useState, useEffect } from "react";
import { fetchReferencesByType, ReferenceItem } from "@/services/referenceService";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ReferenceModal from "@/components/references/ReferenceModal";
import MainLayout from "@/components/layout/MainLayout";
import { Home, BookOpen, Image, ScissorsSquare, Filter, PlusCircle, Lock, Award } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth";
import { isAdminByEmailSync } from "@/utils/adminUtils";
import ReferenceForm from "@/components/admin/references/ReferenceForm";
import { usePremiumFeatures } from "@/hooks/usePremiumFeatures";
import { PremiumModal } from "@/components/ui/premium-modal";

const ReferenceGallery = () => {
  const [references, setReferences] = useState<ReferenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState("all");
  const [selectedReference, setSelectedReference] = useState<ReferenceItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { user } = useAuth();
  const { canAccessGallery, showPremiumModal, setShowPremiumModal, currentFeature } = usePremiumFeatures();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [checkingPermission, setCheckingPermission] = useState(true);
  
  // Verificar se o usuário é admin usando a função síncrona centralizada do adminUtils
  const isAdmin = user ? isAdminByEmailSync(user.email) : false;
  console.log(`ReferenceGallery - Verificação de admin para ${user?.email}: ${isAdmin}`);


  // Verificar se o usuário pode acessar a galeria
  useEffect(() => {
    const checkGalleryAccess = async () => {
      setCheckingPermission(true);
      // Administradores sempre têm acesso, independente do plano
      if (isAdmin) {
        setHasPermission(true);
        setCheckingPermission(false);
        loadReferences();
        return;
      }
      
      const permission = await canAccessGallery();
      setHasPermission(permission);
      setCheckingPermission(false);
      
      // Só carrega as referências se tiver permissão
      if (permission) {
        loadReferences();
      }
    };
    
    checkGalleryAccess();
  }, [canAccessGallery, isAdmin]);
  
  useEffect(() => {
    // Só carrega as referências se tiver permissão
    if (hasPermission) {
      loadReferences();
    }
  }, [selectedType, hasPermission]);
  
  const handleAddReference = () => {
    setIsFormOpen(true);
  };
  
  const handleFormClose = (refreshData: boolean = false) => {
    setIsFormOpen(false);
    if (refreshData) {
      loadReferences();
    }
  };

  const loadReferences = async () => {
    setLoading(true);
    const data = await fetchReferencesByType(selectedType);
    setReferences(data);
    setLoading(false);
  };

  const handleReferenceClick = (reference: ReferenceItem) => {
    setSelectedReference(reference);
    setTimeout(() => {
      setIsModalOpen(true);
    }, 0);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setSelectedReference(null);
    }, 300);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
    } catch (error) {
      return "Data inválida";
    }
  };

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
      <PremiumModal
        open={showPremiumModal}
        onOpenChange={setShowPremiumModal}
        feature={currentFeature}
      />
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        <TopNavigation />
        <MobileTopNavigation />
        
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Galeria de Referências</h1>
          
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Button onClick={handleAddReference} className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                <span>Adicionar</span>
              </Button>
            )}
            
            {hasPermission && (
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar por tipo" />
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
            )}
          </div>
        </div>

        {checkingPermission ? (
          <div className="flex justify-center p-12">
            <LoadingSpinner size="lg" text="Verificando acesso..." />
          </div>
        ) : !hasPermission ? (
          <div className="text-center p-12 border border-amber-200 rounded-lg bg-amber-50">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 mb-4">
              <Lock className="h-10 w-10 text-amber-600" />
            </div>
            <h3 className="text-xl font-bold text-amber-800 mb-3">Acesso Exclusivo para Membros Premium</h3>
            <p className="text-amber-700 mb-6 max-w-md mx-auto">
              Nossa galeria de referências é um recurso exclusivo para membros do Clube das Brabas.
              Atualize seu plano para ter acesso a todas as referências de cortes e styling.
            </p>
            <Button 
              onClick={() => setShowPremiumModal(true)}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-6 rounded-full mx-auto flex items-center"
            >
              <Award className="mr-2 h-5 w-5" />
              Fazer parte do Clube das Brabas
            </Button>
          </div>
        ) : loading ? (
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
            isOpen={isModalOpen}
          />
        )}
        
        {isFormOpen && (
          <ReferenceForm
            reference={null}
            isEditing={false}
            onClose={handleFormClose}
            userId={user?.id || ""}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default ReferenceGallery;
