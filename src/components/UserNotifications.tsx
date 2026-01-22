import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface AdminMessage {
    id: string;
    title: string;
    message: string;
    created_at: string;
}

export function UserNotifications() {
    const [messages, setMessages] = useState<AdminMessage[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        fetchMessages();

        // Subscribe to new messages
        const channel = supabase
            .channel('public:admin_messages')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'admin_messages' },
                (payload) => {
                    setMessages((current) => [payload.new as AdminMessage, ...current]);
                    if (!isOpen) {
                        setUnreadCount((prev) => prev + 1);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [isOpen]);

    const fetchMessages = async () => {
        const { data, error } = await supabase
            .from("admin_messages")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(10);

        if (error) {
            console.error("Erro ao buscar mensagens:", error);
            return;
        }

        setMessages(data || []);
    };

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (open) {
            setUnreadCount(0);
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative hover:bg-white/10">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-primary text-white text-[10px] border-none"
                        >
                            {unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 mr-4 glass-card border-slate-200/50 dark:border-slate-800/50">
                <div className="p-4 border-b border-border/50">
                    <h4 className="font-semibold leading-none">Notificações</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                        Comunicados da administração
                    </p>
                </div>
                <ScrollArea className="h-[300px]">
                    {messages.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground text-sm">
                            Nenhuma notificação no momento.
                        </div>
                    ) : (
                        <div className="divide-y divide-border/30">
                            {messages.map((msg) => (
                                <div key={msg.id} className="p-4 hover:bg-muted/30 transition-colors">
                                    <h5 className="text-sm font-medium mb-1">{msg.title}</h5>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        {msg.message}
                                    </p>
                                    <span className="text-[10px] text-muted-foreground/60 mt-2 block">
                                        {new Date(msg.created_at).toLocaleDateString("pt-BR", {
                                            day: '2-digit',
                                            month: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
