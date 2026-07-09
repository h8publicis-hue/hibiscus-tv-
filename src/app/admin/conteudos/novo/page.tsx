import { PageHeader } from "@/components/shared/PageHeader";
import { ContentForm } from "@/components/admin/ContentForm";

export default function NovoConteudoPage() {
  return (
    <div>
      <PageHeader
        title="Novo conteúdo"
        description="Cadastre um comunicado, promoção, aviso ou mídia para exibição."
      />
      <ContentForm />
    </div>
  );
}
