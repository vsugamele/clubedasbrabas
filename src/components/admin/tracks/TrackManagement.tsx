import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { uploadImageToStorage } from "@/services/mediaService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash, Video, GripVertical, Loader2, Upload, X, Image } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Lesson {
    id: string;
    title: string;
    video_url: string;
    content: string;
    order_index: number;
}

interface Module {
    id: string;
    title: string;
    description: string;
    image_url?: string;
    order_index: number;
    lessons?: Lesson[];
}

export const TrackManagement = () => {
    const [modules, setModules] = useState<Module[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedModule, setSelectedModule] = useState<Module | null>(null);

    // States for Module Dialog
    const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);
    const [moduleTitle, setModuleTitle] = useState("");
    const [moduleDescription, setModuleDescription] = useState("");
    const [moduleImageUrl, setModuleImageUrl] = useState("");
    const [moduleImageFile, setModuleImageFile] = useState<File | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [editingModuleId, setEditingModuleId] = useState<string | null>(null);

    // States for Lesson Dialog
    const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);
    const [lessonTitle, setLessonTitle] = useState("");
    const [lessonVideoUrl, setLessonVideoUrl] = useState("");
    const [editingLessonId, setEditingLessonId] = useState<string | null>(null);

    useEffect(() => {
        fetchModules();
    }, []);

    const fetchModules = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("modules")
                .select("*, lessons(*)")
                .order("order_index", { ascending: true });

            if (error) throw error;

            // Sort lessons by order_index
            const modulesWithSortedLessons = data?.map(m => ({
                ...m,
                lessons: m.lessons?.sort((a: any, b: any) => a.order_index - b.order_index)
            })) || [];

            setModules(modulesWithSortedLessons);
        } catch (error) {
            console.error("Error fetching modules:", error);
            toast.error("Erro ao carregar trilhas");
        } finally {
            setLoading(false);
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                toast.error("Por favor, selecione uma imagem válida");
                return;
            }
            setModuleImageFile(file);
            const preview = URL.createObjectURL(file);
            setImagePreview(preview);
        }
    };

    const clearImage = () => {
        setModuleImageFile(null);
        setImagePreview(null);
        setModuleImageUrl("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleCreateOrUpdateModule = async () => {
        if (!moduleTitle) return;

        try {
            let finalImageUrl = moduleImageUrl;

            // Se há um arquivo de imagem selecionado, fazer upload
            if (moduleImageFile) {
                setUploadingImage(true);
                try {
                    const uploadedUrl = await uploadImageToStorage(moduleImageFile);
                    if (uploadedUrl) {
                        finalImageUrl = uploadedUrl;
                    }
                } catch (uploadError) {
                    console.error("Erro no upload da imagem:", uploadError);
                    toast.error("Erro ao fazer upload da imagem");
                    setUploadingImage(false);
                    return;
                }
                setUploadingImage(false);
            }

            const moduleData = {
                title: moduleTitle,
                description: moduleDescription,
                image_url: finalImageUrl,
                // If creating, put at end; if updating, keep index (or handle reorder separately)
                order_index: editingModuleId
                    ? modules.find(m => m.id === editingModuleId)?.order_index
                    : modules.length
            };

            if (editingModuleId) {
                const { error } = await supabase
                    .from("modules")
                    .update(moduleData)
                    .eq("id", editingModuleId);

                if (error) throw error;
                toast.success("Trilha atualizada com sucesso");
            } else {
                const { error } = await supabase
                    .from("modules")
                    .insert([moduleData]);

                if (error) throw error;
                toast.success("Trilha criada com sucesso");
            }

            setIsModuleDialogOpen(false);
            resetModuleForm();
            fetchModules();
        } catch (error) {
            console.error("Error saving module:", error);
            toast.error("Erro ao salvar trilha");
        }
    };

    const handleDeleteModule = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir esta trilha? Todas as aulas serão excluídas.")) return;

        try {
            const { error } = await supabase.from("modules").delete().eq("id", id);
            if (error) throw error;

            setModules(modules.filter(m => m.id !== id));
            toast.success("Trilha excluída");
        } catch (error) {
            console.error("Error deleting module:", error);
            toast.error("Erro ao excluir trilha");
        }
    };

    const handleCreateOrUpdateLesson = async () => {
        if (!lessonTitle || !selectedModule) return;

        try {
            const lessonData = {
                title: lessonTitle,
                video_url: lessonVideoUrl,
                module_id: selectedModule.id,
                order_index: editingLessonId
                    ? selectedModule.lessons?.find(l => l.id === editingLessonId)?.order_index
                    : (selectedModule.lessons?.length || 0)
            };

            if (editingLessonId) {
                const { error } = await supabase
                    .from("lessons")
                    .update(lessonData)
                    .eq("id", editingLessonId);

                if (error) throw error;
                toast.success("Aula atualizada com sucesso");
            } else {
                const { error } = await supabase
                    .from("lessons")
                    .insert([lessonData]);

                if (error) throw error;
                toast.success("Aula adicionada com sucesso");
            }

            setIsLessonDialogOpen(false);
            resetLessonForm();
            fetchModules(); // Refresh everything to update the specific module's lessons
        } catch (error) {
            console.error("Error saving lesson:", error);
            toast.error("Erro ao salvar aula");
        }
    };

    const handleDeleteLesson = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir esta aula?")) return;

        try {
            const { error } = await supabase.from("lessons").delete().eq("id", id);
            if (error) throw error;

            // Optimistic update
            if (selectedModule && selectedModule.lessons) {
                setSelectedModule({
                    ...selectedModule,
                    lessons: selectedModule.lessons.filter(l => l.id !== id)
                });
            }

            fetchModules(); // Full refresh to be safe
            toast.success("Aula excluída");
        } catch (error) {
            console.error("Error deleting lesson:", error);
            toast.error("Erro ao excluir aula");
        }
    };

    const openModuleDialog = (module?: Module) => {
        if (module) {
            setEditingModuleId(module.id);
            setModuleTitle(module.title);
            setModuleDescription(module.description);
            setModuleImageUrl(module.image_url || "");
            if (module.image_url) {
                setImagePreview(module.image_url);
            }
        } else {
            resetModuleForm();
        }
        setIsModuleDialogOpen(true);
    };

    const resetModuleForm = () => {
        setEditingModuleId(null);
        setModuleTitle("");
        setModuleDescription("");
        setModuleImageUrl("");
        setModuleImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const openLessonDialog = (lesson?: Lesson) => {
        if (lesson) {
            setEditingLessonId(lesson.id);
            setLessonTitle(lesson.title);
            setLessonVideoUrl(lesson.video_url);
        } else {
            resetLessonForm();
        }
        setIsLessonDialogOpen(true);
    };

    const resetLessonForm = () => {
        setEditingLessonId(null);
        setLessonTitle("");
        setLessonVideoUrl("");
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Gerenciar Trilhas</h2>
                    <p className="text-muted-foreground">Crie e edite trilhas de aprendizado e suas aulas.</p>
                </div>
                <Button onClick={() => openModuleDialog()}>
                    <Plus className="mr-2 h-4 w-4" /> Nova Trilha
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {modules.map((module) => (
                        <Card key={module.id} className="flex flex-col">
                            <CardHeader className="pb-2">
                                <CardTitle className="flex justify-between items-start">
                                    <span>{module.title}</span>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openModuleDialog(module)}>
                                            <Edit className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteModule(module.id)}>
                                            <Trash className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardTitle>
                                <CardDescription className="line-clamp-2 min-h-[40px]">
                                    {module.description || "Sem descrição"}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 pb-2">
                                <div className="text-sm text-muted-foreground mb-2">
                                    {module.lessons?.length || 0} aulas
                                </div>
                                <ScrollArea className="h-[150px] w-full rounded-md border p-2">
                                    {module.lessons && module.lessons.length > 0 ? (
                                        <div className="space-y-2">
                                            {module.lessons.map((lesson) => (
                                                <div key={lesson.id} className="flex items-center justify-between text-sm p-1 hover:bg-muted rounded group">
                                                    <div className="flex items-center gap-2 truncate">
                                                        <Video className="h-3 w-3 text-muted-foreground" />
                                                        <span className="truncate">{lesson.title}</span>
                                                    </div>
                                                    <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                                                            setSelectedModule(module);
                                                            openLessonDialog(lesson);
                                                        }}>
                                                            <Edit className="h-3 w-3" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDeleteLesson(lesson.id)}>
                                                            <Trash className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-xs text-center text-muted-foreground py-8">
                                            Nenhuma aula adicionada
                                        </div>
                                    )}
                                </ScrollArea>
                            </CardContent>
                            <CardFooter className="pt-2">
                                <Button variant="outline" className="w-full" onClick={() => {
                                    setSelectedModule(module);
                                    openLessonDialog();
                                }}>
                                    <Plus className="mr-2 h-4 w-4" /> Adicionar Aula
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            {/* Module Dialog */}
            <Dialog open={isModuleDialogOpen} onOpenChange={setIsModuleDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingModuleId ? "Editar Trilha" : "Nova Trilha"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Título</label>
                            <Input
                                value={moduleTitle}
                                onChange={(e) => setModuleTitle(e.target.value)}
                                placeholder="Ex: Introdução ao Marketing"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Descrição</label>
                            <Textarea
                                value={moduleDescription}
                                onChange={(e) => setModuleDescription(e.target.value)}
                                placeholder="Breve descrição sobre o conteúdo desta trilha"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Imagem da Capa</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageSelect}
                                ref={fileInputRef}
                                className="hidden"
                                id="module-image-upload"
                            />
                            {imagePreview ? (
                                <div className="relative">
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="w-full h-32 object-cover rounded-lg border"
                                    />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="absolute top-2 right-2 h-6 w-6"
                                        onClick={clearImage}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <label
                                    htmlFor="module-image-upload"
                                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <Image className="h-8 w-8 text-muted-foreground mb-2" />
                                        <p className="text-sm text-muted-foreground">
                                            <span className="font-semibold">Clique para selecionar</span>
                                        </p>
                                        <p className="text-xs text-muted-foreground">PNG, JPG ou WEBP</p>
                                    </div>
                                </label>
                            )}
                            <p className="text-xs text-muted-foreground">Selecione uma imagem de capa (opcional)</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModuleDialogOpen(false)} disabled={uploadingImage}>Cancelar</Button>
                        <Button onClick={handleCreateOrUpdateModule} disabled={uploadingImage}>
                            {uploadingImage ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</>
                            ) : (
                                editingModuleId ? "Salvar" : "Criar"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Lesson Dialog */}
            <Dialog open={isLessonDialogOpen} onOpenChange={setIsLessonDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingLessonId ? "Editar Aula" : "Nova Aula"}
                            {selectedModule && <span className="text-muted-foreground font-normal text-sm ml-2">em {selectedModule.title}</span>}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Título da Aula</label>
                            <Input
                                value={lessonTitle}
                                onChange={(e) => setLessonTitle(e.target.value)}
                                placeholder="Ex: Aula 1 - Conceitos Básicos"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">URL do Vídeo</label>
                            <Input
                                value={lessonVideoUrl}
                                onChange={(e) => setLessonVideoUrl(e.target.value)}
                                placeholder="https://youtube.com/..."
                            />
                            <p className="text-xs text-muted-foreground">Cole o link do vídeo (YouTube, Vimeo, etc)</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsLessonDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleCreateOrUpdateLesson}>{editingLessonId ? "Salvar" : "Adicionar"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
