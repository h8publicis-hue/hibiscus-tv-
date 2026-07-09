"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Spinner } from "@/components/shared/Spinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { ContentForm } from "@/components/admin/ContentForm";
import { getContentById } from "@/lib/firestore";
import type { Content } from "@/types";

export default function EditarConteudoPage() {
  const params = useParams<{ id: string }>();
  const [content, setContent] = useState<Content | null | undefined>(undefined);

  useEffect(() => {
    getContentById(params.id).then(setContent);
  }, [params.id]);

  return (
    <div>
      <PageHeader
        title="Editar conteúdo"
        description="Atualize as informações do conteúdo."
      />
      {content === undefined ? (
        <Spinner />
      ) : content === null ? (
        <EmptyState title="Conteúdo não encontrado" />
      ) : (
        <ContentForm content={content} />
      )}
    </div>
  );
}
