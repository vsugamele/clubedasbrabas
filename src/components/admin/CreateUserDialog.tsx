
import React, { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";

const createUserSchema = z.object({
  name: z.string().min(2, { message: "Nome deve ter pelo menos 2 caracteres" }),
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "Senha deve ter pelo menos 6 caracteres" }),
  role: z.enum(["user", "moderator", "admin"], { 
    required_error: "Por favor selecione um papel" 
  }),
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;

interface CreateUserDialogProps {
  onUserCreated: (user: any) => void;
}

export const CreateUserDialog = ({ onUserCreated }: CreateUserDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "user",
    },
  });

  const onSubmit = async (data: CreateUserFormValues) => {
    try {
      setIsLoading(true);
      
      console.log("Creating user with data:", data);
      
      // In a real application with Supabase, we would create the user here
      // For now, we'll simulate creating a user with a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate a fake user ID
      const userId = `user_${Date.now()}`;
      console.log("Generated user ID:", userId);
      
      const newUser = {
        id: userId,
        name: data.name,
        email: data.email,
        role: data.role,
        status: "active",
        avatar: "",
        joinedAt: new Date().toISOString()
      };
      
      console.log("Created new user object:", newUser);
      
      // Get existing users from localStorage directly (not using any cached state)
      let existingUsers = [];
      try {
        const storedUsers = localStorage.getItem('adminUsers');
        console.log("Raw localStorage 'adminUsers' content:", storedUsers);
        
        existingUsers = storedUsers ? JSON.parse(storedUsers) : [];
        console.log("Existing users from localStorage:", existingUsers);
        
        // Validate existing users array
        if (!Array.isArray(existingUsers)) {
          console.error("Existing users is not an array:", existingUsers);
          existingUsers = [];
        }
      } catch (error) {
        console.error("Error loading existing users from localStorage:", error);
        existingUsers = [];
      }
      
      // Check for duplicate emails
      const isDuplicate = existingUsers.some((user: any) => user.email === data.email);
      if (isDuplicate) {
        console.error("Duplicate email detected:", data.email);
        toast.error(`Usuário com email ${data.email} já existe`, {
          position: "bottom-right",
        });
        setIsLoading(false);
        return;
      }
      
      // Add the new user to the existing users
      existingUsers.push(newUser);
      
      // Update localStorage directly
      localStorage.setItem('adminUsers', JSON.stringify(existingUsers));
      console.log("Updated localStorage with new user added. Total users:", existingUsers.length);
      
      // Log the current localStorage state for debugging
      console.log("Current localStorage 'adminUsers' content after update:", localStorage.getItem('adminUsers'));
      
      // Trigger the event manually to notify other tabs
      try {
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'adminUsers',
          newValue: localStorage.getItem('adminUsers'),
          storageArea: localStorage
        }));
        console.log("Dispatched storage event for adminUsers");
      } catch (error) {
        console.error("Error dispatching storage event:", error);
      }
      
      // Call the callback to update the parent component's state
      console.log("Calling onUserCreated with new user:", newUser);
      onUserCreated(newUser);
      
      toast.success(`Usuário ${data.name} criado com sucesso!`, {
        position: "bottom-right",
      });
      
      // Close the dialog and reset form
      setIsOpen(false);
      form.reset();
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error("Erro ao criar usuário.", {
        position: "bottom-right",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Adicionar Usuário
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Novo Usuário</DialogTitle>
          <DialogDescription>
            Preencha os dados para criar um novo usuário na plataforma.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Nome do usuário" 
                      {...field}
                      className="border-[#ff920e]/20 focus-visible:ring-[#ff4400]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="email@exemplo.com" 
                      {...field}
                      className="border-[#ff920e]/20 focus-visible:ring-[#ff4400]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="******" 
                      {...field}
                      className="border-[#ff920e]/20 focus-visible:ring-[#ff4400]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Papel</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="border-[#ff920e]/20 focus-visible:ring-[#ff4400]">
                        <SelectValue placeholder="Selecione um papel" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="user">Usuário</SelectItem>
                      <SelectItem value="moderator">Moderador</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-[#ff4400] hover:bg-[#ff4400]/90"
                disabled={isLoading}
              >
                {isLoading ? "Criando..." : "Criar Usuário"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateUserDialog;
