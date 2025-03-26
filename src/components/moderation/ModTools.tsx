import { useState, useEffect } from "react";
import { 
  Hammer, 
  UserX, 
  Trash, 
  User, 
  CheckCircle, 
  AlertTriangle,
  XCircle,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { Separator } from "@/components/ui/separator";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";

interface UserReport {
  id: string;
  reporter: {
    id: string;
    name: string;
    avatar?: string;
  };
  reportedUser: {
    id: string;
    name: string;
    avatar?: string;
  };
  reason: string;
  createdAt: Date;
}

interface PostReport {
  id: string;
  reporter: {
    id: string;
    name: string;
    avatar?: string;
  };
  post: {
    id: string;
    content: string;
    author: {
      id: string;
      name: string;
      avatar?: string;
    };
  };
  reason: string;
  createdAt: Date;
}

const mockUserReports: UserReport[] = [
  {
    id: "ur1",
    reporter: {
      id: "rep1",
      name: "Alice Johnson",
      avatar: "",
    },
    reportedUser: {
      id: "user1",
      name: "Bob Smith",
      avatar: "",
    },
    reason: "Assédio",
    createdAt: new Date(),
  },
  {
    id: "ur2",
    reporter: {
      id: "rep2",
      name: "Charlie Brown",
      avatar: "",
    },
    reportedUser: {
      id: "user2",
      name: "Diana Lee",
      avatar: "",
    },
    reason: "Spam",
    createdAt: new Date(),
  },
];

const mockPostReports: PostReport[] = [
  {
    id: "pr1",
    reporter: {
      id: "rep3",
      name: "Eve Williams",
      avatar: "",
    },
    post: {
      id: "post1",
      content: "Conteúdo ofensivo",
      author: {
        id: "user3",
        name: "Frank Miller",
        avatar: "",
      },
    },
    reason: "Discurso de ódio",
    createdAt: new Date(),
  },
  {
    id: "pr2",
    reporter: {
      id: "rep4",
      name: "Grace Davis",
      avatar: "",
    },
    post: {
      id: "post2",
      content: "Informação falsa",
      author: {
        id: "user4",
        name: "Henry Wilson",
        avatar: "",
      },
    },
    reason: "Notícias falsas",
    createdAt: new Date(),
  },
];

const ModTools = () => {
  const [userReports, setUserReports] = useState<UserReport[]>(mockUserReports);
  const [postReports, setPostReports] = useState<PostReport[]>(mockPostReports);

  const handleBanUser = (userId: string) => {
    console.log(`Usuário ${userId} banido.`);
    setUserReports(reports => reports.filter(report => report.reportedUser.id !== userId));
  };

  const handleRemovePost = (postId: string) => {
    console.log(`Post ${postId} removido.`);
    setPostReports(reports => reports.filter(report => report.post.id !== postId));
  };

  const handleResolveUserReport = (reportId: string) => {
    console.log(`Reporte de usuário ${reportId} resolvido.`);
    setUserReports(reports => reports.filter(report => report.id !== reportId));
  };

  const handleResolvePostReport = (reportId: string) => {
    console.log(`Reporte de post ${reportId} resolvido.`);
    setPostReports(reports => reports.filter(report => report.id !== reportId));
  };

  return (
    <Tabs defaultValue="userReports" className="w-full">
      <TabsList>
        <TabsTrigger value="userReports">
          <UserX className="mr-2 h-4 w-4" />
          Denúncias de Usuários
        </TabsTrigger>
        <TabsTrigger value="postReports">
          <Hammer className="mr-2 h-4 w-4" />
          Denúncias de Publicações
        </TabsTrigger>
      </TabsList>
      <TabsContent value="userReports" className="space-y-4">
        {userReports.length > 0 ? (
          userReports.map((report) => (
            <div key={report.id} className="rounded-md border p-4">
              <div className="mb-2 flex items-center space-x-4">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={report.reporter.avatar} alt={report.reporter.name} />
                  <AvatarFallback>
                    {report.reporter.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{report.reporter.name}</p>
                  <p className="text-xs text-muted-foreground">Reportou</p>
                </div>
                <User className="h-4 w-4 text-muted-foreground" />
                <Avatar className="h-8 w-8">
                  <AvatarImage src={report.reportedUser.avatar} alt={report.reportedUser.name} />
                  <AvatarFallback>
                    {report.reportedUser.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{report.reportedUser.name}</p>
                  <p className="text-xs text-muted-foreground">Usuário Reportado</p>
                </div>
              </div>
              <p className="text-sm">
                <strong>Motivo:</strong> {report.reason}
              </p>
              <div className="mt-4 flex justify-end space-x-2">
                <Button variant="outline" size="sm" onClick={() => handleResolveUserReport(report.id)}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Ignorar Denúncia
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleBanUser(report.reportedUser.id)}>
                  <UserX className="mr-2 h-4 w-4" />
                  Banir Usuário
                </Button>
              </div>
              <Separator className="my-4" />
            </div>
          ))
        ) : (
          <div className="text-center text-muted-foreground">
            Nenhuma denúncia de usuário pendente.
          </div>
        )}
      </TabsContent>
      <TabsContent value="postReports" className="space-y-4">
        {postReports.length > 0 ? (
          postReports.map((report) => (
            <div key={report.id} className="rounded-md border p-4">
              <div className="mb-2 flex items-center space-x-4">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={report.reporter.avatar} alt={report.reporter.name} />
                  <AvatarFallback>
                    {report.reporter.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{report.reporter.name}</p>
                  <p className="text-xs text-muted-foreground">Reportou</p>
                </div>
                <Shield className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{report.post.author.name}</p>
                  <p className="text-xs text-muted-foreground">Autor da Publicação</p>
                </div>
              </div>
              <p className="text-sm">
                <strong>Conteúdo:</strong> {report.post.content}
              </p>
              <p className="text-sm">
                <strong>Motivo:</strong> {report.reason}
              </p>
              <div className="mt-4 flex justify-end space-x-2">
                <Button variant="outline" size="sm" onClick={() => handleResolvePostReport(report.id)}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Ignorar Denúncia
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleRemovePost(report.post.id)}>
                  <Trash className="mr-2 h-4 w-4" />
                  Remover Publicação
                </Button>
              </div>
              <Separator className="my-4" />
            </div>
          ))
        ) : (
          <div className="text-center text-muted-foreground">
            Nenhuma denúncia de publicação pendente.
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
};

export default ModTools;
