import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { ScreenForm } from "@/components/admin/ScreenForm";

export default function NovaTelaPage() {
  return (
    <div>
      <PageHeader
        title="Nova tela"
        description="Cadastre um novo monitor para exibir conteúdos."
      />
      <Card className="max-w-3xl">
        <CardContent>
          <ScreenForm />
        </CardContent>
      </Card>
    </div>
  );
}
