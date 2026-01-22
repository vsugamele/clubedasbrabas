
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const AccessDenied = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Acesso Restrito</CardTitle>
        <CardDescription>
          Você não tem permissão para acessar o painel de administração.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Este painel é restrito a administradores do sistema. Se você acredita que deveria ter acesso, 
          entre em contato com um administrador.
        </p>
      </CardContent>
    </Card>
  );
};

export default AccessDenied;
