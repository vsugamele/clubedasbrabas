import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Json } from "@/integrations/supabase/types";

export interface ReferenceItem {
  id: string;
  title: string;
  type: string;
  before_image: string;
  after_image: string;
  hair_type: string;
  finger_projection: string;
  angle: string;
  line_type: string;
  texture: string;
  cut_type: string;
  products_used: string;
  estimated_time: string;
  observations: string;
  created_at: string;
  created_by: string;
}

export interface ReferenceCreateInput {
  title: string;
  type: string;
  before_image: string;
  after_image: string;
  hair_type: string;
  finger_projection: string;
  angle: string;
  line_type: string;
  texture: string;
  cut_type: string;
  products_used: string;
  estimated_time: string;
  observations: string;
}

// Interface para a tabela documents no Supabase
interface DocumentRow {
  content: string | null;
  embedding: string | null;
  id: number;
  metadata: Json | null;
}

// Buscar todas as referências
export const fetchReferences = async () => {
  try {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .filter("metadata->document_type", "eq", "reference")
      .order("metadata->created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar referências:", error);
      toast.error("Erro ao carregar referências");
      return [];
    }

    // Converter os documentos para o formato de referência
    const references = data.map(doc => {
      const metadata = doc.metadata as Record<string, any> || {};
      return {
        id: String(doc.id),
        title: metadata.title || "Sem título",
        type: metadata.type || "",
        before_image: metadata.before_image || "",
        after_image: metadata.after_image || "",
        hair_type: metadata.hair_type || "",
        finger_projection: metadata.finger_projection || "",
        angle: metadata.angle || "",
        line_type: metadata.line_type || "",
        texture: metadata.texture || "",
        cut_type: metadata.cut_type || "",
        products_used: metadata.products_used || "",
        estimated_time: metadata.estimated_time || "",
        observations: metadata.observations || "",
        created_at: metadata.created_at || new Date().toISOString(),
        created_by: metadata.created_by || ""
      };
    });

    return references;
  } catch (error) {
    console.error("Exceção ao buscar referências:", error);
    toast.error("Erro ao carregar referências");
    return [];
  }
};

// Buscar referências por tipo
export const fetchReferencesByType = async (type: string) => {
  try {
    let query = supabase
      .from("documents")
      .select("*")
      .filter("metadata->document_type", "eq", "reference");
      
    if (type !== "all") {
      // Usando a sintaxe correta para filtrar em campos JSON
      query = query.filter("metadata->type", "eq", type);
    }

    // Ordenar por data de criação (armazenada em metadata)
    query = query.order("metadata->created_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error("Erro ao buscar referências por tipo:", error);
      toast.error("Erro ao carregar referências");
      return [];
    }

    // Converter os documentos para o formato de referência
    const references = data.map(doc => {
      const metadata = doc.metadata as Record<string, any> || {};
      return {
        id: String(doc.id),
        title: metadata.title || "Sem título",
        type: metadata.type || "",
        before_image: metadata.before_image || "",
        after_image: metadata.after_image || "",
        hair_type: metadata.hair_type || "",
        finger_projection: metadata.finger_projection || "",
        angle: metadata.angle || "",
        line_type: metadata.line_type || "",
        texture: metadata.texture || "",
        cut_type: metadata.cut_type || "",
        products_used: metadata.products_used || "",
        estimated_time: metadata.estimated_time || "",
        observations: metadata.observations || "",
        created_at: metadata.created_at || new Date().toISOString(),
        created_by: metadata.created_by || ""
      };
    });

    return references;
  } catch (error) {
    console.error("Exceção ao buscar referências por tipo:", error);
    toast.error("Erro ao carregar referências");
    return [];
  }
};

// Buscar uma referência por ID
export const fetchReferenceById = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("id", parseInt(id))
      .filter("metadata->document_type", "eq", "reference")
      .single();

    if (error) {
      console.error("Erro ao buscar referência:", error);
      toast.error("Erro ao carregar referência");
      return null;
    }

    const metadata = data.metadata as Record<string, any> || {};
    const reference = {
      id: String(data.id),
      title: metadata.title || "Sem título",
      type: metadata.type || "",
      before_image: metadata.before_image || "",
      after_image: metadata.after_image || "",
      hair_type: metadata.hair_type || "",
      finger_projection: metadata.finger_projection || "",
      angle: metadata.angle || "",
      line_type: metadata.line_type || "",
      texture: metadata.texture || "",
      cut_type: metadata.cut_type || "",
      products_used: metadata.products_used || "",
      estimated_time: metadata.estimated_time || "",
      observations: metadata.observations || "",
      created_at: metadata.created_at || new Date().toISOString(),
      created_by: metadata.created_by || ""
    };

    return reference;
  } catch (error) {
    console.error("Exceção ao buscar referência:", error);
    toast.error("Erro ao carregar referência");
    return null;
  }
};

// Criar uma nova referência
export const createReference = async (
  reference: ReferenceCreateInput,
  userId: string
) => {
  try {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from("documents")
      .insert([
        {
          content: reference.title, // Usando o título como conteúdo
          metadata: {
            document_type: "reference",
            title: reference.title,
            type: reference.type,
            before_image: reference.before_image,
            after_image: reference.after_image,
            hair_type: reference.hair_type,
            finger_projection: reference.finger_projection,
            angle: reference.angle,
            line_type: reference.line_type,
            texture: reference.texture,
            cut_type: reference.cut_type,
            products_used: reference.products_used,
            estimated_time: reference.estimated_time,
            observations: reference.observations,
            created_by: userId,
            created_at: now
          }
        },
      ])
      .select();

    if (error) {
      console.error("Erro ao criar referência:", error);
      toast.error("Erro ao criar referência");
      return null;
    }

    toast.success("Referência criada com sucesso!");
    
    const metadata = data[0].metadata as Record<string, any> || {};
    const newReference = {
      id: String(data[0].id),
      title: metadata.title || "Sem título",
      type: metadata.type || "",
      before_image: metadata.before_image || "",
      after_image: metadata.after_image || "",
      hair_type: metadata.hair_type || "",
      finger_projection: metadata.finger_projection || "",
      angle: metadata.angle || "",
      line_type: metadata.line_type || "",
      texture: metadata.texture || "",
      cut_type: metadata.cut_type || "",
      products_used: metadata.products_used || "",
      estimated_time: metadata.estimated_time || "",
      observations: metadata.observations || "",
      created_at: metadata.created_at || now,
      created_by: metadata.created_by || userId
    };
    
    return newReference;
  } catch (error) {
    console.error("Exceção ao criar referência:", error);
    toast.error("Erro ao criar referência");
    return null;
  }
};

// Atualizar uma referência existente
export const updateReference = async (
  id: string,
  reference: Partial<ReferenceCreateInput>
) => {
  try {
    // Primeiro, obter o documento atual para mesclar os metadados
    const { data: currentDoc, error: fetchError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", parseInt(id))
      .filter("metadata->document_type", "eq", "reference")
      .single();

    if (fetchError) {
      console.error("Erro ao buscar referência para atualização:", fetchError);
      toast.error("Erro ao atualizar referência");
      return null;
    }

    // Mesclar os metadados atuais com os novos
    const currentMetadata = currentDoc.metadata as Record<string, any> || {};
    const updatedMetadata = { ...currentMetadata };
    
    // Atualizar apenas os campos fornecidos
    if (reference.title) {
      updatedMetadata.title = reference.title;
      // Também atualizar o conteúdo do documento
      currentDoc.content = reference.title;
    }
    if (reference.type) updatedMetadata.type = reference.type;
    if (reference.before_image) updatedMetadata.before_image = reference.before_image;
    if (reference.after_image) updatedMetadata.after_image = reference.after_image;
    if (reference.hair_type) updatedMetadata.hair_type = reference.hair_type;
    if (reference.finger_projection) updatedMetadata.finger_projection = reference.finger_projection;
    if (reference.angle) updatedMetadata.angle = reference.angle;
    if (reference.line_type) updatedMetadata.line_type = reference.line_type;
    if (reference.texture) updatedMetadata.texture = reference.texture;
    if (reference.cut_type) updatedMetadata.cut_type = reference.cut_type;
    if (reference.products_used) updatedMetadata.products_used = reference.products_used;
    if (reference.estimated_time) updatedMetadata.estimated_time = reference.estimated_time;
    if (reference.observations) updatedMetadata.observations = reference.observations;
    
    // Adicionar data de atualização
    updatedMetadata.updated_at = new Date().toISOString();

    // Atualizar o documento
    const { data, error } = await supabase
      .from("documents")
      .update({
        content: currentDoc.content,
        metadata: updatedMetadata
      })
      .eq("id", parseInt(id))
      .select();

    if (error) {
      console.error("Erro ao atualizar referência:", error);
      toast.error("Erro ao atualizar referência");
      return null;
    }

    toast.success("Referência atualizada com sucesso!");
    
    const metadata = data[0].metadata as Record<string, any> || {};
    const updatedReference = {
      id: String(data[0].id),
      title: metadata.title || "Sem título",
      type: metadata.type || "",
      before_image: metadata.before_image || "",
      after_image: metadata.after_image || "",
      hair_type: metadata.hair_type || "",
      finger_projection: metadata.finger_projection || "",
      angle: metadata.angle || "",
      line_type: metadata.line_type || "",
      texture: metadata.texture || "",
      cut_type: metadata.cut_type || "",
      products_used: metadata.products_used || "",
      estimated_time: metadata.estimated_time || "",
      observations: metadata.observations || "",
      created_at: metadata.created_at || new Date().toISOString(),
      created_by: metadata.created_by || ""
    };
    
    return updatedReference;
  } catch (error) {
    console.error("Exceção ao atualizar referência:", error);
    toast.error("Erro ao atualizar referência");
    return null;
  }
};

// Excluir uma referência
export const deleteReference = async (id: string) => {
  try {
    // Primeiro, verificar se o documento é uma referência
    const { data: document, error: fetchError } = await supabase
      .from("documents")
      .select("metadata")
      .eq("id", parseInt(id))
      .single();

    if (fetchError) {
      console.error("Erro ao verificar referência para exclusão:", fetchError);
      toast.error("Erro ao excluir referência");
      return false;
    }

    const metadata = document.metadata as Record<string, any> || {};
    if (metadata.document_type !== "reference") {
      console.error("Tentativa de excluir um documento que não é uma referência");
      toast.error("Erro ao excluir referência: documento inválido");
      return false;
    }

    const { error } = await supabase
      .from("documents")
      .delete()
      .eq("id", parseInt(id));

    if (error) {
      console.error("Erro ao excluir referência:", error);
      toast.error("Erro ao excluir referência");
      return false;
    }

    toast.success("Referência excluída com sucesso!");
    return true;
  } catch (error) {
    console.error("Exceção ao excluir referência:", error);
    toast.error("Erro ao excluir referência");
    return false;
  }
};

// Upload de imagem para o storage do Supabase
export const uploadReferenceImage = async (
  file: File,
  userId: string,
  type: "before" | "after"
) => {
  try {
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}-${Date.now()}-${type}.${fileExt}`;
    const filePath = `references/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("images")
      .upload(filePath, file);

    if (uploadError) {
      console.error("Erro ao fazer upload da imagem:", uploadError);
      toast.error("Erro ao fazer upload da imagem");
      return null;
    }

    const { data } = supabase.storage.from("images").getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error("Exceção ao fazer upload da imagem:", error);
    toast.error("Erro ao fazer upload da imagem");
    return null;
  }
};
