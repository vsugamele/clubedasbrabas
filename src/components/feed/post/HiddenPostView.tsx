
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface HiddenPostViewProps {
  showPost: () => void;
}

export const HiddenPostView = ({ showPost }: HiddenPostViewProps) => {
  return (
    <Card className="w-full mb-6 overflow-hidden transition-all animate-fade-in">
      <CardContent className="p-6 text-center text-muted-foreground">
        <p>Esta publicação foi ocultada.</p>
        <Button variant="link" onClick={showPost}>
          Mostrar novamente
        </Button>
      </CardContent>
    </Card>
  );
};
