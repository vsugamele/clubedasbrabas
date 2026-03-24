import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { ChevronLeft, PlayCircle, Lock, CheckCircle, Loader2, Award } from "lucide-react";
import { usePremiumFeatures } from "@/hooks/usePremiumFeatures";
import { PremiumModal } from "@/components/ui/premium-modal";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface Lesson {
    id: string;
    title: string;
    content?: string; // URL video actually
    video_url: string;
    order_index: number;
}

interface Module {
    id: string;
    title: string;
    description: string;
    lessons: Lesson[];
}

// Função para converter URLs do YouTube para formato embed
const getEmbedUrl = (url: string): string => {
    if (!url) return '';

    // Se já é um embed, retorna como está
    if (url.includes('youtube.com/embed/')) {
        return url;
    }

    // youtube.com/watch?v=VIDEO_ID
    const watchMatch = url.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/watch\?.+&v=)([^&]+)/);
    if (watchMatch) {
        return `https://www.youtube.com/embed/${watchMatch[1]}`;
    }

    // youtu.be/VIDEO_ID
    const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
    if (shortMatch) {
        return `https://www.youtube.com/embed/${shortMatch[1]}`;
    }

    // Para outros formatos (Vimeo, etc), retorna como está
    return url;
};

const TrackDetails = () => {
    const { id } = useParams<{ id: string }>();
    const [module, setModule] = useState<Module | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);

    const { canAccessTracks, showPremiumModal, setShowPremiumModal, currentFeature } = usePremiumFeatures();
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [checkingPermission, setCheckingPermission] = useState(true);

    useEffect(() => {
        const checkAccess = async () => {
            setCheckingPermission(true);
            const permission = await canAccessTracks();
            setHasPermission(permission);
            setCheckingPermission(false);
            if (permission && id) {
                fetchModuleDetails(id);
            }
        };
        checkAccess();
    }, [id, canAccessTracks]);

    const fetchModuleDetails = async (moduleId: string) => {
        try {
            // Fetch module info
            const { data: moduleData, error: moduleError } = await supabase
                .from("c_modules")
                .select("*")
                .eq("id", moduleId)
                .single();

            if (moduleError) throw moduleError;

            // Fetch lessons
            const { data: lessonsData, error: lessonsError } = await supabase
                .from("c_lessons")
                .select("*")
                .eq("module_id", moduleId)
                .order("order_index", { ascending: true });

            if (lessonsError) throw lessonsError;

            setModule({
                ...moduleData,
                lessons: lessonsData || []
            });

            if (lessonsData && lessonsData.length > 0) {
                setActiveLesson(lessonsData[0]);
            }
        } catch (error) {
            console.error("Erro ao carregar detalhes da trilha:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <MainLayout>
            <PremiumModal
                open={showPremiumModal}
                onOpenChange={setShowPremiumModal}
                feature={currentFeature}
            />
            <div className="container py-6 animate-fade-in">
                <Button variant="ghost" asChild className="mb-4 pl-0 hover:bg-transparent hover:text-primary">
                    <Link to="/trilhas">
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Voltar para Trilhas
                    </Link>
                </Button>

                {checkingPermission ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : !hasPermission ? (
                    <div className="text-center p-12 border border-primary/20 rounded-lg bg-primary/5 max-w-2xl mx-auto my-12">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                            <Lock className="h-10 w-10 text-primary" />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground mb-3">Acesso Exclusivo</h3>
                        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                            O acesso aos módulos e videoaulas desta trilha são recursos exclusivos para alunos do Clube das Brabas.
                        </p>
                        <Button 
                            onClick={() => setShowPremiumModal(true)}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 px-8 rounded-full mx-auto flex items-center shadow-lg shadow-primary/25"
                        >
                            <Award className="mr-2 h-5 w-5" />
                            Quero me tornar aluna Clube das Brabas
                        </Button>
                    </div>
                ) : loading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : !module ? (
                    <div className="text-center p-12">
                        <h3 className="text-xl font-semibold">Trilha não encontrada</h3>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Video Player Area */}
                        <div className="lg:col-span-2 space-y-4">
                            <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-lg relative group">
                                {activeLesson ? (
                                    <iframe
                                        src={getEmbedUrl(activeLesson.video_url || activeLesson.content)} // Just in case stored in content
                                        title={activeLesson.title}
                                        className="w-full h-full"
                                        allowFullScreen
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    ></iframe>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-900 text-white">
                                        <p>Selecione uma aula para assistir</p>
                                    </div>
                                )}
                            </div>

                            <div className="glass-card p-6 rounded-xl">
                                <h1 className="text-2xl font-bold mb-2">{activeLesson?.title || module.title}</h1>
                                <p className="text-muted-foreground">{module.description}</p>
                            </div>
                        </div>

                        {/* Playlist Sidebar */}
                        <div className="lg:col-span-1">
                            <div className="glass-card rounded-xl overflow-hidden h-full flex flex-col max-h-[600px]">
                                <div className="p-4 border-b border-border/50 bg-muted/20">
                                    <h3 className="font-semibold text-lg">Conteúdo do Módulo</h3>
                                    <p className="text-sm text-muted-foreground">{module.lessons.length} aulas</p>
                                </div>

                                <ScrollArea className="flex-1">
                                    <div className="p-2 space-y-1">
                                        {module.lessons.map((lesson, index) => (
                                            <button
                                                key={lesson.id}
                                                onClick={() => setActiveLesson(lesson)}
                                                className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors ${activeLesson?.id === lesson.id
                                                    ? "bg-primary/10 border border-primary/20"
                                                    : "hover:bg-muted/50"
                                                    }`}
                                            >
                                                <div className="mt-0.5">
                                                    {activeLesson?.id === lesson.id ? (
                                                        <PlayCircle className="h-5 w-5 text-primary fill-primary/20" />
                                                    ) : (
                                                        <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center text-xs font-medium text-muted-foreground">
                                                            {index + 1}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-medium truncate ${activeLesson?.id === lesson.id ? "text-primary" : "text-foreground"
                                                        }`}>
                                                        {lesson.title}
                                                    </p>
                                                    <span className="text-xs text-muted-foreground">Video • 10 min</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
};

export default TrackDetails;
