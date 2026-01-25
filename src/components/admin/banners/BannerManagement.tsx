import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { uploadImageToStorage } from "@/services/mediaService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Loader2, Image, Link, ArrowUp, ArrowDown, Eye, EyeOff } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface Banner {
    id: string;
    title: string;
    desktop_image_url: string;
    mobile_image_url: string | null;
    link_url: string | null;
    order_index: number;
    is_active: boolean;
}

export const BannerManagement = () => {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

    // Form states
    const [title, setTitle] = useState("");
    const [linkUrl, setLinkUrl] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [desktopFile, setDesktopFile] = useState<File | null>(null);
    const [mobileFile, setMobileFile] = useState<File | null>(null);
    const [desktopPreview, setDesktopPreview] = useState<string | null>(null);
    const [mobilePreview, setMobilePreview] = useState<string | null>(null);
    const desktopInputRef = useRef<HTMLInputElement>(null);
    const mobileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("banners" as any)
                .select("*")
                .order("order_index", { ascending: true });

            if (error) throw error;
            setBanners((data as unknown as Banner[]) || []);
        } catch (error) {
            console.error("Erro ao carregar banners:", error);
            toast.error("Erro ao carregar banners");
        } finally {
            setLoading(false);
        }
    };

    const handleDesktopSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith("image/")) {
            setDesktopFile(file);
            setDesktopPreview(URL.createObjectURL(file));
        }
    };

    const handleMobileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith("image/")) {
            setMobileFile(file);
            setMobilePreview(URL.createObjectURL(file));
        }
    };

    const resetForm = () => {
        setTitle("");
        setLinkUrl("");
        setIsActive(true);
        setDesktopFile(null);
        setMobileFile(null);
        setDesktopPreview(null);
        setMobilePreview(null);
        setEditingBanner(null);
    };

    const openDialog = (banner?: Banner) => {
        if (banner) {
            setEditingBanner(banner);
            setTitle(banner.title);
            setLinkUrl(banner.link_url || "");
            setIsActive(banner.is_active);
            setDesktopPreview(banner.desktop_image_url);
            setMobilePreview(banner.mobile_image_url);
        } else {
            resetForm();
        }
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!title) {
            toast.error("Titulo e obrigatorio");
            return;
        }

        if (!editingBanner && !desktopFile) {
            toast.error("Selecione uma imagem desktop");
            return;
        }

        try {
            setSaving(true);

            let desktopUrl = editingBanner?.desktop_image_url || "";
            let mobileUrl = editingBanner?.mobile_image_url || null;

            // Upload desktop image if new file selected
            if (desktopFile) {
                const uploaded = await uploadImageToStorage(desktopFile);
                if (uploaded) desktopUrl = uploaded;
            }

            // Upload mobile image if new file selected
            if (mobileFile) {
                const uploaded = await uploadImageToStorage(mobileFile);
                if (uploaded) mobileUrl = uploaded;
            }

            const bannerData = {
                title,
                desktop_image_url: desktopUrl,
                mobile_image_url: mobileUrl,
                link_url: linkUrl || null,
                is_active: isActive,
                order_index: editingBanner?.order_index ?? banners.length,
            };

            if (editingBanner) {
                // Update existing
                const { error } = await supabase
                    .from("banners" as any)
                    .update(bannerData)
                    .eq("id", editingBanner.id);

                if (error) throw error;
                toast.success("Banner atualizado!");
            } else {
                // Create new
                const { error } = await supabase
                    .from("banners" as any)
                    .insert(bannerData);

                if (error) throw error;
                toast.success("Banner criado!");
            }

            setDialogOpen(false);
            resetForm();
            fetchBanners();
        } catch (error) {
            console.error("Erro ao salvar banner:", error);
            toast.error("Erro ao salvar banner");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Excluir este banner?")) return;

        try {
            const { error } = await supabase.from("banners" as any).delete().eq("id", id);
            if (error) throw error;
            toast.success("Banner excluido!");
            fetchBanners();
        } catch (error) {
            console.error("Erro ao excluir:", error);
            toast.error("Erro ao excluir banner");
        }
    };

    const toggleActive = async (banner: Banner) => {
        try {
            const { error } = await supabase
                .from("banners" as any)
                .update({ is_active: !banner.is_active })
                .eq("id", banner.id);

            if (error) throw error;
            fetchBanners();
        } catch (error) {
            console.error("Erro ao alterar status:", error);
            toast.error("Erro ao alterar status");
        }
    };

    const moveUp = async (index: number) => {
        if (index === 0) return;
        const current = banners[index];
        const prev = banners[index - 1];

        try {
            await supabase.from("banners" as any).update({ order_index: prev.order_index }).eq("id", current.id);
            await supabase.from("banners" as any).update({ order_index: current.order_index }).eq("id", prev.id);
            fetchBanners();
        } catch (error) {
            console.error("Erro ao reordenar:", error);
        }
    };

    const moveDown = async (index: number) => {
        if (index === banners.length - 1) return;
        const current = banners[index];
        const next = banners[index + 1];

        try {
            await supabase.from("banners" as any).update({ order_index: next.order_index }).eq("id", current.id);
            await supabase.from("banners" as any).update({ order_index: current.order_index }).eq("id", next.id);
            fetchBanners();
        } catch (error) {
            console.error("Erro ao reordenar:", error);
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Gerenciar Banners</CardTitle>
                    <CardDescription>Configure os banners do carrossel principal</CardDescription>
                </div>
                <Button onClick={() => openDialog()} className="bg-[#ff4400] hover:bg-[#ff4400]/90">
                    <Plus className="h-4 w-4 mr-2" /> Novo Banner
                </Button>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center p-8">
                        <LoadingSpinner size="lg" />
                    </div>
                ) : banners.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhum banner cadastrado</p>
                        <p className="text-sm">Clique em "Novo Banner" para adicionar</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {banners.map((banner, index) => (
                            <div
                                key={banner.id}
                                className={`flex items-center gap-4 p-4 rounded-lg border ${banner.is_active ? "bg-card" : "bg-muted/50 opacity-60"
                                    }`}
                            >
                                <div className="flex flex-col gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => moveUp(index)} disabled={index === 0}>
                                        <ArrowUp className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => moveDown(index)} disabled={index === banners.length - 1}>
                                        <ArrowDown className="h-4 w-4" />
                                    </Button>
                                </div>

                                <img
                                    src={banner.desktop_image_url}
                                    alt={banner.title}
                                    className="w-32 h-20 object-cover rounded"
                                />

                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium truncate">{banner.title}</h3>
                                    {banner.link_url && (
                                        <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                                            <Link className="h-3 w-3" /> {banner.link_url}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => toggleActive(banner)}
                                        title={banner.is_active ? "Desativar" : "Ativar"}
                                    >
                                        {banner.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => openDialog(banner)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(banner.id)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>

            {/* Dialog for creating/editing banner */}
            <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setDialogOpen(open); }}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingBanner ? "Editar Banner" : "Novo Banner"}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label>Titulo</Label>
                            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nome do banner" />
                        </div>

                        <div>
                            <Label>Link (opcional)</Label>
                            <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." />
                        </div>

                        <div className="flex items-center gap-2">
                            <Switch checked={isActive} onCheckedChange={setIsActive} />
                            <Label>Banner ativo</Label>
                        </div>

                        <div>
                            <Label>Imagem Desktop (obrigatoria)</Label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleDesktopSelect}
                                ref={desktopInputRef}
                                className="hidden"
                            />
                            {desktopPreview ? (
                                <div className="relative mt-2">
                                    <img src={desktopPreview} alt="Desktop preview" className="w-full h-32 object-cover rounded border" />
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        className="absolute bottom-2 right-2"
                                        onClick={() => desktopInputRef.current?.click()}
                                    >
                                        Trocar
                                    </Button>
                                </div>
                            ) : (
                                <div
                                    onClick={() => desktopInputRef.current?.click()}
                                    className="mt-2 border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50"
                                >
                                    <Image className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">Clique para selecionar</p>
                                    <p className="text-xs text-muted-foreground">Recomendado: 1200x400px</p>
                                </div>
                            )}
                        </div>

                        <div>
                            <Label>Imagem Mobile (opcional)</Label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleMobileSelect}
                                ref={mobileInputRef}
                                className="hidden"
                            />
                            {mobilePreview ? (
                                <div className="relative mt-2">
                                    <img src={mobilePreview} alt="Mobile preview" className="w-full h-24 object-cover rounded border" />
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        className="absolute bottom-2 right-2"
                                        onClick={() => mobileInputRef.current?.click()}
                                    >
                                        Trocar
                                    </Button>
                                </div>
                            ) : (
                                <div
                                    onClick={() => mobileInputRef.current?.click()}
                                    className="mt-2 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50"
                                >
                                    <p className="text-sm text-muted-foreground">Clique para selecionar (opcional)</p>
                                    <p className="text-xs text-muted-foreground">Recomendado: 600x300px</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando...</> : "Salvar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
};
