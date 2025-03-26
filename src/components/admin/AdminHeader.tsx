
import { ProfileType } from "@/context/AuthContext";

interface AdminHeaderProps {
  profile?: ProfileType | null;
  userEmail?: string | null;
}

export const AdminHeader = ({ profile, userEmail }: AdminHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold text-[#ff4400]">Painel de Administração</h1>
      <div className="text-sm text-muted-foreground">
        Conectado como: <span className="font-semibold">{profile?.full_name || userEmail}</span>
      </div>
    </div>
  );
};

export default AdminHeader;
