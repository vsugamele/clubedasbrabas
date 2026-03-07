import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, ChevronRight, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

interface Module {
    id: string;
    title: string;
    description: string;
    image_url?: string;
    order_index: number;
}

const TracksList = () => {
    const [modules, setModules] = useState<Module[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchModules();
    }, []);

    const fetchModules = async () => {
        try {
            const { data, error } = await supabase
<<<<<<< HEAD
                .from("c_modules")
=======
                .from("modules")
>>>>>>> ec7a81647a509e3df9940de4e7db217a340f7e94
                .select("*")
                .order("order_index", { ascending: true });

            if (error) throw error;
            setModules(data || []);
        } catch (error) {
            console.error("Erro ao carregar trilhas:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <MainLayout>
            <div className="container py-8 animate-fade-in">
                <div className="flex flex-col mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        Trilhas de Aprendizagem
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Aprofunde seus conhecimentos com nossas trilhas exclusivas.
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : modules.length === 0 ? (
                    <div className="text-center p-12 glass-card rounded-xl">
                        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Nenhuma trilha encontrada</h3>
                        <p className="text-muted-foreground">
                            Em breve teremos novos conteúdos para você!
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {modules.map((module) => (
                            <Card key={module.id} className="card-hover glass-card border-none overflow-hidden flex flex-col h-full group">
                                <div className="h-48 overflow-hidden bg-muted relative">
                                    {module.image_url ? (
                                        <img
                                            src={module.image_url}
                                            alt={module.title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-50 dark:from-orange-900/20 dark:to-orange-950/20">
                                            <BookOpen className="h-12 w-12 text-primary/40" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                </div>
                                <CardHeader>
                                    <CardTitle className="text-xl text-primary line-clamp-2">{module.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <CardDescription className="text-base line-clamp-3">
                                        {module.description}
                                    </CardDescription>
                                </CardContent>
                                <CardFooter className="pt-4 bg-muted/20 mt-auto">
                                    <Button asChild className="w-full">
                                        <Link to={`/trilhas/${module.id}`}>
                                            Acessar Trilha
                                            <ChevronRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </MainLayout>
    );
};

export default TracksList;
