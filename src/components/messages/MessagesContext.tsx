
import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
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

interface ContactType {
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
  messages: MessageType[];
  newMessage: string;
  setNewMessage: React.Dispatch<React.SetStateAction<string>>;
  loading: boolean;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  sendMessage: (e: React.FormEvent) => Promise<void>;
  filteredContacts: ContactType[];
}

const MessagesContext = createContext<MessagesContextProps | undefined>(undefined);

export const MessagesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [selectedContact, setSelectedContact] = useState<ContactType | null>(null);
  const [contacts, setContacts] = useState<ContactType[]>([]);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
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

              return {
                ...profile,
                unread_count: countError ? 0 : (count || 0)
              } as ContactType;
            })
          );

          setContacts(contactsWithUnread);
        }
      } catch (error) {
        console.error("Error loading contacts:", error);
        toast.error("Erro ao carregar contatos");
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();

    // Subscribe to new messages
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `receiver_id=eq.${user.id}`
        },
        async (payload) => {
          // Update messages if currently viewing chat with sender
          if (selectedContact && payload.new.sender_id === selectedContact.id) {
            setMessages(prev => [...prev, payload.new as MessageType]);
            
            // Mark as read
            await supabase
              .from("direct_messages")
              .update({ is_read: true })
              .eq("id", payload.new.id);
          }
          
          // Update contacts/unread count
          fetchContacts();
          
          // Show notification
          if (payload.new.sender_id !== user.id) {
            const { data: sender } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", payload.new.sender_id)
              .single();
              
            toast(`Nova mensagem de ${sender?.full_name || "Usuário"}`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedContact]);

  useEffect(() => {
    if (!user || !selectedContact) return;

    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from("direct_messages")
          .select("*")
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedContact.id}),and(sender_id.eq.${selectedContact.id},receiver_id.eq.${user.id})`)
          .order("created_at", { ascending: true });

        if (error) {
          throw error;
        }

        setMessages(data || []);

        // Mark messages as read
        await supabase
          .from("direct_messages")
          .update({ is_read: true })
          .eq("sender_id", selectedContact.id)
          .eq("receiver_id", user.id)
          .eq("is_read", false);
          
        // Update unread count
        setContacts(prev => 
          prev.map(contact => 
            contact.id === selectedContact.id 
              ? { ...contact, unread_count: 0 } 
              : contact
          )
        );
      } catch (error) {
        console.error("Error loading messages:", error);
        toast.error("Erro ao carregar mensagens");
      }
    };

    fetchMessages();
  }, [user, selectedContact]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !selectedContact) return;

    try {
      const { data, error } = await supabase
        .from("direct_messages")
        .insert({
          sender_id: user.id,
          receiver_id: selectedContact.id,
          content: newMessage.trim()
        })
        .select();

      if (error) {
        throw error;
      }

      setMessages(prev => [...prev, data[0] as MessageType]);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Erro ao enviar mensagem");
    }
  };

  const filteredContacts = contacts.filter(contact => 
    contact.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MessagesContext.Provider
      value={{
        selectedContact,
        setSelectedContact,
        contacts,
        messages,
        newMessage,
        setNewMessage,
        loading,
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

export type { MessageType, ContactType };
