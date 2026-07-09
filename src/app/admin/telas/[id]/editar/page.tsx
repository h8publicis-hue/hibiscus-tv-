"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { Spinner } from "@/components/shared/Spinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { ScreenForm } from "@/components/admin/ScreenForm";
import { getScreenById } from "@/lib/firestore";
import type { Screen } from "@/types";

export default function EditarTelaPage() {
  const params = useParams<{ id: string }>();
  const [screen, setScreen] = useState<Screen | null | undefined>(undefined);

  useEffect(() => {
    getScreenById(params.id).then(setScreen);
  }, [params.id]);

  return (
    <div>
      <PageHeader
        title="Editar tela"
        description="Atualize as informações do monitor."
      />
      <Card className="max-w-3xl">
        <CardContent>
          {screen === undefined ? (
            <Spinner />
          ) : screen === null ? (
            <EmptyState title="Tela não encontrada" />
          ) : (
            <ScreenForm screen={screen} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
