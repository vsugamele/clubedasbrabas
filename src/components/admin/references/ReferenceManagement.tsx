import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/auth/AuthContext";
import {
  fetchReferences,
  deleteReference,
  ReferenceItem,
} from "@/services/referenceService";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { PlusCircle, Edit, Trash2, Eye } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ReferenceForm from "./ReferenceForm";
import ReferencePreview from "./ReferencePreview";

export const ReferenceManagement = () => {
  const { user } = useAuth();
  const [references, setReferences] = useState<ReferenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [currentReference, setCurrentReference] = useState<ReferenceItem | null>(
    null
  );
  const [isEditing, setIsEditing] = useState(false);

  const loadReferences = async () => {
    setLoading(true);
    const data = await fetchReferences();
    setReferences(data);
    setLoading(false);
  };

  useEffect(() => {
    loadReferences();
  }, []);

  const handleAddNew = () => {
    setCurrentReference(null);
    setIsEditing(false);
    setIsFormOpen(true);
  };

  const handleEdit = (reference: ReferenceItem) => {
    setCurrentReference(reference);
    setIsEditing(true);
    setIsFormOpen(true);
  };

  const handlePreview = (reference: ReferenceItem) => {
    setCurrentReference(reference);
    setIsPreviewOpen(true);
  };

  const handleDelete = async (id: string) => {
    console.log(`Botão excluir clicado para referência ID: ${id}`);
    try {
      if (window.confirm("Tem certeza que deseja excluir esta referência?")) {
        console.log(`Confirmação de exclusão aceita para ID: ${id}`);
        const success = await deleteReference(id);
        console.log(`Resultado da exclusão para ID ${id}:`, success);
        if (success) {
          console.log(`Recarregando lista após exclusão bem-sucedida`);
          loadReferences();
        } else {
          console.error(`Falha ao excluir referência ID: ${id}`);
          toast.error("Não foi possível excluir a referência. Verifique o console para mais detalhes.");
        }
      } else {
        console.log(`Exclusão cancelada pelo usuário para ID: ${id}`);
      }
    } catch (error) {
      console.error(`Erro ao processar exclusão da referência ID: ${id}:`, error);
      toast.error(`Erro ao excluir: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const handleFormClose = (refreshData: boolean = false) => {
    setIsFormOpen(false);
    if (refreshData) {
      loadReferences();
    }
  };

  const handlePreviewClose = () => {
    setIsPreviewOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gerenciamento de Referências</h2>
          <p className="text-muted-foreground">
            Adicione e gerencie as referências de antes/depois
          </p>
        </div>
        <Button onClick={handleAddNew} className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          Nova Referência
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <LoadingSpinner size="lg" text="Carregando referências..." />
        </div>
      ) : references.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8">
            <p className="text-muted-foreground mb-4 text-center">
              Nenhuma referência encontrada. Adicione sua primeira referência!
            </p>
            <Button onClick={handleAddNew} variant="outline">
              Adicionar Referência
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Referências</CardTitle>
            <CardDescription>
              Total de {references.length} referências cadastradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Tipo de Cabelo</TableHead>
                    <TableHead>Data de Criação</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {references.map((reference) => (
                    <TableRow key={reference.id}>
                      <TableCell className="font-medium">
                        {reference.title}
                      </TableCell>
                      <TableCell>{reference.type}</TableCell>
                      <TableCell>{reference.hair_type}</TableCell>
                      <TableCell>
                        {format(
                          new Date(reference.created_at),
                          "dd/MM/yyyy HH:mm",
                          { locale: ptBR }
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlePreview(reference)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(reference)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              console.log('Botão de excluir clicado diretamente');
                              console.log('Referência para exclusão:', reference);
                              console.log('ID da referência:', reference.id);
                              handleDelete(reference.id);
                            }}
                            data-ref-id={reference.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {isFormOpen && (
        <ReferenceForm
          reference={currentReference}
          isEditing={isEditing}
          onClose={handleFormClose}
          userId={user?.id || ""}
        />
      )}

      {isPreviewOpen && currentReference && (
        <ReferencePreview
          reference={currentReference}
          onClose={handlePreviewClose}
        />
      )}
    </div>
  );
};
