import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Send, Loader2 } from "lucide-react";

export function AdminMessageComposer() {
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [isSending, setIsSending] = useState(false);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !message.trim()) {
            toast.error("Por favor, preencha todos os campos.");
            return;
        }

        setIsSending(true);

        try {
            const { error } = await supabase.from("admin_messages").insert({
                title,
                message,
            });

            if (error) throw error;

            toast.success("Mensagem enviada com sucesso!");
            setTitle("");
            setMessage("");
        } catch (error) {
            console.error("Erro ao enviar mensagem:", error);
            toast.error("Erro ao enviar mensagem.");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="glass-card p-6 rounded-xl animate-fade-in max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-primary/10 p-2 rounded-full">
                    <Send className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Nova Mensagem para Usuários
                </h2>
            </div>

            <form onSubmit={handleSendMessage} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium">
                        Título
                    </Label>
                    <Input
                        id="title"
                        placeholder="Ex: Novidade na plataforma!"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="bg-background/50 border-border/50 focus:border-primary transition-colors"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="message" className="text-sm font-medium">
                        Mensagem
                    </Label>
                    <Textarea
                        id="message"
                        placeholder="Digite o conteúdo da mensagem..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="min-h-[150px] bg-background/50 border-border/50 focus:border-primary transition-colors resize-y"
                    />
                </div>

                <div className="pt-2">
                    <Button
                        type="submit"
                        disabled={isSending}
                        className="w-full sm:w-auto bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
                    >
                        {isSending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Enviando...
                            </>
                        ) : (
                            <>
                                <Send className="mr-2 h-4 w-4" />
                                Enviar Mensagem
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
