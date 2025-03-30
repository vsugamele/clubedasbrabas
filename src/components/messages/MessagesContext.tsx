import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "@/context/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MessageType {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  is_read: boolean;
}

export interface ContactType {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string;
  last_message?: string;
  unread_count: number;
}

interface MessagesContextProps {
  selectedContact: ContactType | null;
  setSelectedContact: React.Dispatch<React.SetStateAction<ContactType | null>>;
  contacts: ContactType[];
  allMembers: ContactType[];
  messages: MessageType[];
  newMessage: string;
  setNewMessage: React.Dispatch<React.SetStateAction<string>>;
  loading: boolean;
  loadingMembers: boolean;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  sendMessage: (e: React.FormEvent) => Promise<void>;
  filteredContacts: ContactType[];
}

const MessagesContext = createContext<MessagesContextProps | undefined>(undefined);

interface MessagesProviderProps {
  children: React.ReactNode;
  initialSelectedContact?: ContactType;
}

export const MessagesProvider: React.FC<MessagesProviderProps> = ({ 
  children, 
  initialSelectedContact 
}) => {
  const { user } = useAuth();
  const [selectedContact, setSelectedContact] = useState<ContactType | null>(initialSelectedContact || null);
  const [contacts, setContacts] = useState<ContactType[]>([]);
  const [allMembers, setAllMembers] = useState<ContactType[]>([]);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user) return;

    const fetchContacts = async () => {
      try {
        // Fetch users who have messaged with current user
        const { data: sentMessages, error: sentError } = await supabase
          .from("direct_messages")
          .select("receiver_id")
          .eq("sender_id", user.id);

        if (sentError) throw sentError;

        const { data: receivedMessages, error: receivedError } = await supabase
          .from("direct_messages")
          .select("sender_id")
          .eq("receiver_id", user.id);

        if (receivedError) throw receivedError;

        // Get unique user IDs
        const userIds = new Set([
          ...sentMessages.map(msg => msg.receiver_id),
          ...receivedMessages.map(msg => msg.sender_id)
        ]);

        // Adicionar o contato inicial se não estiver na lista
        if (initialSelectedContact && !userIds.has(initialSelectedContact.id)) {
          userIds.add(initialSelectedContact.id);
        }

        // Fetch user profiles
        if (userIds.size > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from("profiles")
            .select("*")
            .in("id", Array.from(userIds));

          if (profilesError) throw profilesError;

          // Get unread count for each contact
          const contactsWithUnread = await Promise.all(
            profilesData.map(async (profile) => {
              const { count, error: countError } = await supabase
                .from("direct_messages")
                .select("*", { count: "exact", head: true })
                .eq("sender_id", profile.id)
                .eq("receiver_id", user.id)
                .eq("is_read", false);

              if (countError) throw countError;

              return {
                id: profile.id,
                full_name: profile.full_name,
                username: profile.username,
                avatar_url: profile.avatar_url,
                unread_count: count || 0
              };
            })
          );

          setContacts(contactsWithUnread);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching contacts:", error);
        toast.error("Erro ao carregar contatos");
        setLoading(false);
      }
    };

    fetchContacts();
    fetchAllMembers();
  }, [user, initialSelectedContact]);

  // Função para buscar todos os membros ativos
  const fetchAllMembers = async () => {
    if (!user) return;
    
    setLoadingMembers(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .neq("id", user.id) // Excluir o usuário atual
        .order("full_name", { ascending: true });

      if (error) throw error;

      const membersWithUnreadCount = data.map(profile => ({
        id: profile.id,
        full_name: profile.full_name,
        username: profile.username,
        avatar_url: profile.avatar_url,
        unread_count: 0 // Inicialmente zero, podemos atualizar depois se necessário
      }));

      setAllMembers(membersWithUnreadCount);
      setLoadingMembers(false);
    } catch (error) {
      console.error("Erro ao buscar membros:", error);
      toast.error("Erro ao carregar membros");
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    if (!user || !selectedContact) return;

    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from("direct_messages")
          .select("*")
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedContact.id}),and(sender_id.eq.${selectedContact.id},receiver_id.eq.${user.id})`)
          .order("created_at", { ascending: true });

        if (error) throw error;

        setMessages(data || []);

        // Mark messages as read
        const unreadMessages = data?.filter(
          msg => msg.sender_id === selectedContact.id && !msg.is_read
        );

        if (unreadMessages && unreadMessages.length > 0) {
          await supabase
            .from("direct_messages")
            .update({ is_read: true })
            .in("id", unreadMessages.map(msg => msg.id));

          // Update unread count in contacts
          setContacts(prev => 
            prev.map(contact => 
              contact.id === selectedContact.id 
                ? { ...contact, unread_count: 0 } 
                : contact
            )
          );
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
        toast.error("Erro ao carregar mensagens");
      }
    };

    fetchMessages();

    // Setup realtime subscription
    const channel = supabase
      .channel("direct_messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `or(and(sender_id=eq.${user.id},receiver_id=eq.${selectedContact.id}),and(sender_id=eq.${selectedContact.id},receiver_id=eq.${user.id}))`,
        },
        (payload) => {
          const newMessage = payload.new as MessageType;
          
          setMessages(prev => [...prev, newMessage]);
          
          // If message is from the selected contact, mark as read
          if (newMessage.sender_id === selectedContact.id) {
            supabase
              .from("direct_messages")
              .update({ is_read: true })
              .eq("id", newMessage.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedContact]);

  useEffect(() => {
    if (!user) return;

    // Setup realtime subscription para todas as mensagens do usuário
    const channel = supabase
      .channel("global_messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `or(sender_id=eq.${user.id},receiver_id=eq.${user.id})`,
        },
        async (payload) => {
          const newMessage = payload.new as MessageType;
          
          // Se a mensagem é para a conversa atual, atualizar a lista de mensagens
          if (selectedContact && 
              ((newMessage.sender_id === selectedContact.id && newMessage.receiver_id === user.id) ||
               (newMessage.sender_id === user.id && newMessage.receiver_id === selectedContact.id))) {
            
            // Verificar se a mensagem já existe na lista (para evitar duplicatas)
            const messageExists = messages.some(msg => msg.id === newMessage.id);
            if (!messageExists) {
              setMessages(prev => [...prev, newMessage]);
            }
            
            // Se a mensagem é do contato selecionado, marcar como lida
            if (newMessage.sender_id === selectedContact.id && !newMessage.is_read) {
              await supabase
                .from("direct_messages")
                .update({ is_read: true })
                .eq("id", newMessage.id);
            }
          }
          
          // Atualizar a lista de contatos com a nova mensagem
          const otherUserId = newMessage.sender_id === user.id ? newMessage.receiver_id : newMessage.sender_id;
          
          // Buscar informações do contato se não estiver na lista
          let contactExists = contacts.some(c => c.id === otherUserId);
          
          if (!contactExists) {
            try {
              const { data: profileData } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", otherUserId)
                .single();
                
              if (profileData) {
                const newContact: ContactType = {
                  id: profileData.id,
                  full_name: profileData.full_name,
                  username: profileData.username,
                  avatar_url: profileData.avatar_url,
                  unread_count: newMessage.sender_id === user.id ? 0 : 1,
                  last_message: newMessage.content
                };
                
                setContacts(prev => [newContact, ...prev]);
              }
            } catch (error) {
              console.error("Erro ao buscar perfil do contato:", error);
            }
          } else {
            // Atualizar o contato existente
            setContacts(prev => 
              prev.map(contact => {
                if (contact.id === otherUserId) {
                  return {
                    ...contact,
                    last_message: newMessage.content,
                    unread_count: newMessage.sender_id === user.id 
                      ? contact.unread_count 
                      : contact.unread_count + (selectedContact?.id === otherUserId ? 0 : 1)
                  };
                }
                return contact;
              })
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedContact, contacts, messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !selectedContact || !newMessage.trim()) return;

    try {
      // Criar um ID temporário para a mensagem
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Adicionar a mensagem localmente primeiro para feedback instantâneo
      const tempMessage: MessageType = {
        id: tempId,
        content: newMessage.trim(),
        sender_id: user.id,
        receiver_id: selectedContact.id,
        created_at: new Date().toISOString(),
        is_read: false
      };
      
      // Atualizar a interface imediatamente
      setMessages(prev => [...prev, tempMessage]);
      
      // Limpar o campo de entrada
      setNewMessage("");
      
      // Enviar a mensagem para o servidor
      const { data, error } = await supabase
        .from("direct_messages")
        .insert({
          content: tempMessage.content,
          sender_id: user.id,
          receiver_id: selectedContact.id,
          is_read: false
        })
        .select();

      if (error) throw error;
      
      // Se a mensagem foi enviada com sucesso, substituir a mensagem temporária pela real
      if (data && data.length > 0) {
        setMessages(prev => 
          prev.map(msg => msg.id === tempId ? data[0] : msg)
        );
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Erro ao enviar mensagem");
      
      // Em caso de erro, remover a mensagem temporária
      setMessages(prev => prev.filter(msg => !msg.id.includes('temp-')));
    }
  };

  // Filter contacts based on search query
  const filteredContacts = contacts.filter(contact => 
    contact.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMembers = allMembers.filter(member =>
    member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MessagesContext.Provider
      value={{
        selectedContact,
        setSelectedContact,
        contacts,
        allMembers: filteredMembers,
        messages,
        newMessage,
        setNewMessage,
        loading,
        loadingMembers,
        searchQuery,
        setSearchQuery,
        sendMessage,
        filteredContacts
      }}
    >
      {children}
    </MessagesContext.Provider>
  );
};

export const useMessages = () => {
  const context = useContext(MessagesContext);
  if (context === undefined) {
    throw new Error("useMessages must be used within a MessagesProvider");
  }
  return context;
};
