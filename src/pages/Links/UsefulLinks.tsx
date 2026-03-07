import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Link as LinkIcon, Loader2, Globe, Search, Navigation } from "lucide-react";
import { Input } from "@/components/ui/input";

interface UsefulLink {
    id: string;
    title: string;
    description: string | null;
    url?: string;
    href?: string;
    category?: string | null;
    icon?: string | null;
    source: 'sidebar' | 'navbar';
}

const UsefulLinks = () => {
    const [sidebarLinks, setSidebarLinks] = useState<UsefulLink[]>([]);
    const [navbarLinks, setNavbarLinks] = useState<UsefulLink[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchLinks();
    }, []);

    const fetchLinks = async () => {
        try {
            // Fetch sidebar links (c_external_links)
            const { data: sidebarData, error: sidebarError } = await supabase
                .from("c_external_links")
                .select("*")
                .order("title", { ascending: true });

            if (sidebarError) throw sidebarError;

            const mappedSidebarLinks = (sidebarData || []).map((link: any) => ({
                id: link.id,
                title: link.title || link.name || "Link sem nome",
                description: link.description,
                url: link.url,
                category: link.category,
                source: 'sidebar' as const
            }));

            setSidebarLinks(mappedSidebarLinks);

            // Fetch top menu links (c_navbar_links)
            const { data: navbarData, error: navbarError } = await supabase
                .from("c_navbar_links")
                .select("*")
                .eq("enabled", true)
                .order("order_index", { ascending: true });

            if (navbarError) throw navbarError;

            const mappedNavbarLinks = (navbarData || []).map((link: any) => ({
                id: link.id,
                title: link.label || link.name || "Link do Menu",
                description: "Link do menu de navegação superior",
                url: link.href,
                source: 'navbar' as const
            }));

            setNavbarLinks(mappedNavbarLinks);

        } catch (error) {
            console.error("Erro ao carregar links:", error);
        } finally {
            setLoading(false);
        }
    };

    const filterLinks = (linksArray: UsefulLink[]) => {
        return linksArray.filter(link =>
            link.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            link.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    };

    const filteredSidebarLinks = filterLinks(sidebarLinks);
    const filteredNavbarLinks = filterLinks(navbarLinks);
    const hasAnyLinks = filteredSidebarLinks.length > 0 || filteredNavbarLinks.length > 0;

    const renderLinkCard = (link: UsefulLink, icon: React.ReactNode) => (
        <Card key={link.id} className="card-hover glass-card border-none overflow-hidden flex flex-col h-full group">
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                    <CardTitle className="text-lg text-primary flex items-center gap-2">
                        {icon}
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
                ) : !hasAnyLinks ? (
                    <div className="text-center p-12 glass-card rounded-xl">
                        <LinkIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Nenhum link encontrado</h3>
                        <p className="text-muted-foreground">
                            {searchTerm ? "Tente buscar por outro termo." : "Em breve adicionaremos novos recursos!"}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-10">
                        {/* Seção da Barra Lateral */}
                        {filteredSidebarLinks.length > 0 && (
                            <section>
                                <h2 className="text-xl font-semibold flex items-center gap-2 mb-4 text-[#ff4400]">
                                    <Globe className="h-5 w-5" />
                                    Links da Barra Lateral
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredSidebarLinks.map((link) => renderLinkCard(link, <Globe className="h-4 w-4" />))}
                                </div>
                            </section>
                        )}

                        {/* Seção do Menu Superior */}
                        {filteredNavbarLinks.length > 0 && (
                            <section>
                                <h2 className="text-xl font-semibold flex items-center gap-2 mb-4 text-primary">
                                    <Navigation className="h-5 w-5" />
                                    Links do Menu Superior
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredNavbarLinks.map((link) => renderLinkCard(link, <Navigation className="h-4 w-4" />))}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </div>
        </MainLayout>
    );
};

export default UsefulLinks;
