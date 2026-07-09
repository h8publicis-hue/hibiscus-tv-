import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { PlaylistForm } from "@/components/admin/PlaylistForm";

export default function NovaPlaylistPage() {
  return (
    <div>
      <PageHeader
        title="Nova playlist"
        description="Agrupe conteúdos e defina a ordem de exibição."
      />
      <Card>
        <CardContent>
          <PlaylistForm />
        </CardContent>
      </Card>
    </div>
  );
}
