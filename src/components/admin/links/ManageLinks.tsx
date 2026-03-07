import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Plus, Edit, Trash, ExternalLink, Loader2, Menu, GripVertical, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

interface UsefulLink {
    id: string;
    name: string;
    description: string | null;
    url: string;
    category: string | null;
    show_in_sidebar?: boolean;
    show_in_links_page?: boolean;
}

interface NavbarLink {
    id: string;
    label: string;
    href: string;
    order_index: number;
    enabled: boolean;
}

export const ManageLinks = () => {
    const [activeTab, setActiveTab] = useState("navbar");

    // Sidebar Links State
    const [sidebarLinks, setSidebarLinks] = useState<UsefulLink[]>([]);
    const [sidebarLoading, setSidebarLoading] = useState(true);

    // Navbar Links State
    const [navbarLinks, setNavbarLinks] = useState<NavbarLink[]>([]);
    const [navbarLoading, setNavbarLoading] = useState(true);

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [dialogType, setDialogType] = useState<"navbar" | "sidebar">("navbar");

    // Form States
    const [sidebarFormData, setSidebarFormData] = useState({
        name: "",
        description: "",
        url: "",
        category: "",
        show_in_sidebar: true,
        show_in_links_page: true
    });

    const [navbarFormData, setNavbarFormData] = useState({
        label: "",
        href: "",
        order_index: 0,
        enabled: true
    });

    useEffect(() => {
        fetchSidebarLinks();
        fetchNavbarLinks();
    }, []);

    // ========== SIDEBAR LINKS FUNCTIONS ==========
    const fetchSidebarLinks = async () => {
        setSidebarLoading(true);
        try {
            const { data, error } = await supabase
                .from("c_external_links")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setSidebarLinks(data || []);
        } catch (error) {
            console.error("Error fetching sidebar links:", error);
            toast.error("Erro ao carregar links da sidebar");
        } finally {
            setSidebarLoading(false);
        }
    };

    // ========== NAVBAR LINKS FUNCTIONS ==========
    const fetchNavbarLinks = async () => {
        setNavbarLoading(true);
        try {
            const { data, error } = await supabase
                .from("c_navbar_links")
                .select("*")
                .order("order_index", { ascending: true });

            if (error) throw error;
            setNavbarLinks(data || []);
        } catch (error) {
            console.error("Error fetching navbar links:", error);
            toast.error("Erro ao carregar links do menu");
        } finally {
            setNavbarLoading(false);
        }
    };

    // ========== CRUD OPERATIONS ==========
    const handleCreateOrUpdate = async () => {
        if (dialogType === "navbar") {
            if (!navbarFormData.label || !navbarFormData.href) {
                toast.error("Nome e caminho são obrigatórios");
                return;
            }

            try {
                if (editingId) {
                    const { error } = await supabase
                        .from("c_navbar_links")
                        .update(navbarFormData)
                        .eq("id", editingId);

                    if (error) throw error;
                    toast.success("Link do menu atualizado");
                } else {
                    // Get max order_index
                    const maxOrder = navbarLinks.reduce((max, link) =>
                        Math.max(max, link.order_index), 0);

                    const { error } = await supabase
                        .from("c_navbar_links")
                        .insert([{ ...navbarFormData, order_index: maxOrder + 1 }]);

                    if (error) throw error;
                    toast.success("Link do menu criado");
                }

                setIsDialogOpen(false);
                resetForm();
                fetchNavbarLinks();
            } catch (error) {
                console.error("Error saving navbar link:", error);
                toast.error("Erro ao salvar link do menu");
            }
        } else {
            if (!sidebarFormData.name || !sidebarFormData.url) {
                toast.error("Título e URL são obrigatórios");
                return;
            }

            try {
                if (editingId) {
                    const { error } = await supabase
                        .from("c_external_links")
                        .update(sidebarFormData)
                        .eq("id", editingId);

                    if (error) throw error;
                    toast.success("Link atualizado com sucesso");
                } else {
                    const { error } = await supabase
                        .from("c_external_links")
                        .insert([sidebarFormData]);

                    if (error) throw error;
                    toast.success("Link criado com sucesso");
                }

                setIsDialogOpen(false);
                resetForm();
                fetchSidebarLinks();
            } catch (error) {
                console.error("Error saving sidebar link:", error);
                toast.error("Erro ao salvar link");
            }
        }
    };

    const handleDeleteNavbar = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir este link do menu?")) return;

        try {
            const { error } = await supabase.from("c_navbar_links").delete().eq("id", id);
            if (error) throw error;

            setNavbarLinks(navbarLinks.filter(l => l.id !== id));
            toast.success("Link do menu excluído");
        } catch (error) {
            console.error("Error deleting navbar link:", error);
            toast.error("Erro ao excluir link do menu");
        }
    };

    const handleDeleteSidebar = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir este link?")) return;

        try {
            const { error } = await supabase.from("c_external_links").delete().eq("id", id);
            if (error) throw error;

            setSidebarLinks(sidebarLinks.filter(l => l.id !== id));
            toast.success("Link excluído");
        } catch (error) {
            console.error("Error deleting sidebar link:", error);
            toast.error("Erro ao excluir link");
        }
    };

    const toggleNavbarLink = async (id: string, enabled: boolean) => {
        try {
            const { error } = await supabase
                .from("c_navbar_links")
                .update({ enabled })
                .eq("id", id);

            if (error) throw error;

            setNavbarLinks(navbarLinks.map(link =>
                link.id === id ? { ...link, enabled } : link
            ));
            toast.success(enabled ? "Link ativado" : "Link desativado");
        } catch (error) {
            console.error("Error toggling navbar link:", error);
            toast.error("Erro ao atualizar link");
        }
    };

    // ========== DIALOG HELPERS ==========
    const openNavbarDialog = (link?: NavbarLink) => {
        setDialogType("navbar");
        if (link) {
            setEditingId(link.id);
            setNavbarFormData({
                label: link.label,
                href: link.href,
                order_index: link.order_index,
                enabled: link.enabled
            });
        } else {
            resetForm();
        }
        setIsDialogOpen(true);
    };

    const openSidebarDialog = (link?: UsefulLink) => {
        setDialogType("sidebar");
        if (link) {
            setEditingId(link.id);
            setSidebarFormData({
                name: link.name,
                description: link.description || "",
                url: link.url,
                category: link.category || "",
                show_in_sidebar: link.show_in_sidebar !== false,
                show_in_links_page: link.show_in_links_page !== false
            });
        } else {
            resetForm();
        }
        setIsDialogOpen(true);
    };

    const resetForm = () => {
        setEditingId(null);
        setSidebarFormData({ name: "", description: "", url: "", category: "", show_in_sidebar: true, show_in_links_page: true });
        setNavbarFormData({ label: "", href: "", order_index: 0, enabled: true });
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Gerenciar Links</h2>
                <p className="text-muted-foreground">Configure os links do menu superior e da barra lateral.</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 max-w-md">
                    <TabsTrigger value="navbar" className="flex items-center gap-2">
                        <Menu className="h-4 w-4" />
                        Menu do Topo
                    </TabsTrigger>
                    <TabsTrigger value="sidebar" className="flex items-center gap-2">
                        <Link2 className="h-4 w-4" />
                        Links Úteis
                    </TabsTrigger>
                </TabsList>

                {/* NAVBAR LINKS TAB */}
                <TabsContent value="navbar" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground">
                            Links exibidos no menu de navegação principal.
                        </p>
                        <Button onClick={() => openNavbarDialog()}>
                            <Plus className="mr-2 h-4 w-4" /> Novo Link
                        </Button>
                    </div>

                    {navbarLoading ? (
                        <div className="flex justify-center p-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {navbarLinks.map((link) => (
                                <Card key={link.id} className={`transition-opacity ${!link.enabled ? 'opacity-50' : ''}`}>
                                    <CardContent className="flex items-center justify-between p-4">
                                        <div className="flex items-center gap-4">
                                            <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                                            <div>
                                                <p className="font-medium">{link.label}</p>
                                                <p className="text-sm text-muted-foreground">{link.href}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Switch
                                                checked={link.enabled}
                                                onCheckedChange={(checked) => toggleNavbarLink(link.id, checked)}
                                            />
                                            <Button variant="ghost" size="icon" onClick={() => openNavbarDialog(link)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() => handleDeleteNavbar(link.id)}
                                            >
                                                <Trash className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                            {navbarLinks.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    Nenhum link configurado. Clique em "Novo Link" para adicionar.
                                </div>
                            )}
                        </div>
                    )}
                </TabsContent>

                {/* SIDEBAR LINKS TAB */}
                <TabsContent value="sidebar" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground">
                            Links externos exibidos na barra lateral e página de Links Úteis.
                        </p>
                        <Button onClick={() => openSidebarDialog()}>
                            <Plus className="mr-2 h-4 w-4" /> Novo Link
                        </Button>
                    </div>

                    {sidebarLoading ? (
                        <div className="flex justify-center p-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {sidebarLinks.map((link) => (
                                <Card key={link.id} className="flex flex-col">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg flex justify-between items-start">
                                            <span className="truncate pr-2">{link.name}</span>
                                            <div className="flex gap-1 shrink-0">
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openSidebarDialog(link)}>
                                                    <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteSidebar(link.id)}>
                                                    <Trash className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </CardTitle>
                                        <div className="text-xs text-muted-foreground px-0.5 pt-1">
                                            {link.category && <span className="bg-muted px-1.5 py-0.5 rounded">{link.category}</span>}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex-1 pb-4">
                                        <p className="text-sm text-muted-foreground line-clamp-3">
                                            {link.description || "Sem descrição"}
                                        </p>
                                        <div className="flex gap-2 mt-3 mb-1">
                                            {link.show_in_sidebar !== false && (
                                                <span className="text-[10px] bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 px-2 py-0.5 rounded-full font-medium">
                                                    Sidebar
                                                </span>
                                            )}
                                            {link.show_in_links_page !== false && (
                                                <span className="text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">
                                                    Página de Links
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-4 pt-2 border-t flex items-center text-xs text-blue-500 truncate">
                                            <ExternalLink className="h-3 w-3 mr-1 shrink-0" />
                                            <a href={link.url} target="_blank" rel="noopener noreferrer" className="truncate hover:underline">
                                                {link.url}
                                            </a>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* DIALOG */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingId ? "Editar Link" : "Novo Link"}
                            {dialogType === "navbar" ? " - Menu" : " - Sidebar"}
                        </DialogTitle>
                    </DialogHeader>

                    {dialogType === "navbar" ? (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Nome *</Label>
                                <Input
                                    value={navbarFormData.label}
                                    onChange={(e) => setNavbarFormData({ ...navbarFormData, label: e.target.value })}
                                    placeholder="Ex: Início, Explorar, Trilhas"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Caminho (Rota) *</Label>
                                <Input
                                    value={navbarFormData.href}
                                    onChange={(e) => setNavbarFormData({ ...navbarFormData, href: e.target.value })}
                                    placeholder="Ex: /search, /trilhas, /eventos"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Use caminhos internos como /search ou /trilhas
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={navbarFormData.enabled}
                                    onCheckedChange={(checked) => setNavbarFormData({ ...navbarFormData, enabled: checked })}
                                />
                                <Label>Link ativo</Label>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Título *</Label>
                                <Input
                                    value={sidebarFormData.name}
                                    onChange={(e) => setSidebarFormData({ ...sidebarFormData, name: e.target.value })}
                                    placeholder="Ex: Trello"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>URL *</Label>
                                <Input
                                    value={sidebarFormData.url}
                                    onChange={(e) => setSidebarFormData({ ...sidebarFormData, url: e.target.value })}
                                    placeholder="https://trello.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Categoria (Opcional)</Label>
                                <Input
                                    value={sidebarFormData.category}
                                    onChange={(e) => setSidebarFormData({ ...sidebarFormData, category: e.target.value })}
                                    placeholder="Ex: Produtividade"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Descrição</Label>
                                <Textarea
                                    value={sidebarFormData.description}
                                    onChange={(e) => setSidebarFormData({ ...sidebarFormData, description: e.target.value })}
                                    placeholder="Breve descrição sobre o recurso"
                                    rows={3}
                                />
                            </div>
                            <div className="flex gap-6 mt-2">
                                <div className="flex items-center gap-2">
                                    <Switch
                                        checked={sidebarFormData.show_in_sidebar}
                                        onCheckedChange={(checked) => setSidebarFormData({ ...sidebarFormData, show_in_sidebar: checked })}
                                    />
                                    <Label>Mostrar na Barra Lateral</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Switch
                                        checked={sidebarFormData.show_in_links_page}
                                        onCheckedChange={(checked) => setSidebarFormData({ ...sidebarFormData, show_in_links_page: checked })}
                                    />
                                    <Label>Mostrar na Página de Links</Label>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleCreateOrUpdate}>{editingId ? "Salvar" : "Criar"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
