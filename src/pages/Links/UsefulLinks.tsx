import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Link as LinkIcon, Loader2, Globe, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface UsefulLink {
    id: string;
    title: string;
    description: string | null;
    url: string;
    category?: string | null;
    icon?: string | null;
}

const UsefulLinks = () => {
    const [links, setLinks] = useState<UsefulLink[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchLinks();
    }, []);

    const fetchLinks = async () => {
        try {
            const { data, error } = await supabase
                .from("useful_links") // ensure this table matches schema
                .select("*")
                .order("title", { ascending: true });

            if (error) throw error;
            setLinks(data || []);
        } catch (error) {
            console.error("Erro ao carregar links:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredLinks = links.filter(link =>
        link.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        link.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <MainLayout>
            <div className="container py-8 animate-fade-in">
                <div className="flex flex-col mb-8 text-center items-center">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
                        Links Úteis
                    </h1>
                    <p className="text-muted-foreground max-w-2xl text-center">
                        Uma seleção de ferramentas, artigos e recursos externos para impulsionar seu aprendizado e negócios.
                    </p>

                    <div className="mt-8 w-full max-w-md relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Pesquisar recursos..."
                            className="pl-10 bg-muted/50 border-primary/20 focus-visible:ring-primary"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : filteredLinks.length === 0 ? (
                    <div className="text-center p-12 glass-card rounded-xl">
                        <LinkIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Nenhum link encontrado</h3>
                        <p className="text-muted-foreground">
                            {searchTerm ? "Tente buscar por outro termo." : "Em breve adicionaremos novos recursos!"}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredLinks.map((link) => (
                            <Card key={link.id} className="card-hover glass-card border-none overflow-hidden flex flex-col h-full group">
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between">
                                        <CardTitle className="text-lg text-primary flex items-center gap-2">
                                            <Globe className="h-4 w-4" />
                                            {link.title}
                                        </CardTitle>
                                        {link.category && (
                                            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                                                {link.category}
                                            </span>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <CardDescription className="text-sm line-clamp-3">
                                        {link.description}
                                    </CardDescription>
                                </CardContent>
                                <CardFooter className="pt-2 bg-muted/20">
                                    <Button asChild size="sm" variant="outline" className="w-full group-hover:bg-primary group-hover:text-white transition-colors">
                                        <a href={link.url} target="_blank" rel="noopener noreferrer">
                                            Acessar Recurso
                                            <ExternalLink className="ml-2 h-3 w-3" />
                                        </a>
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

export default UsefulLinks;
