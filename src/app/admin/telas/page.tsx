"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Plus,
  MonitorPlay,
  Copy,
  ExternalLink,
  Pencil,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Spinner } from "@/components/shared/Spinner";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { watchScreens, deleteScreen } from "@/lib/firestore";
import { formatRelative } from "@/utils/date";
import { isScreenOnline } from "@/utils/date";
import { getTvUrl } from "@/utils/screen";
import { UNIDADES, SETORES, type Screen } from "@/types";

export default function TelasPage() {
  const [screens, setScreens] = useState<Screen[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Screen | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const unsub = watchScreens((data) => {
      setScreens(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  function unidadeLabel(v: string) {
    return UNIDADES.find((u) => u.value === v)?.label ?? v;
  }
  function setorLabel(v: string) {
    return SETORES.find((s) => s.value === v)?.label ?? v;
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteScreen(deleteTarget.id);
      toast.success("Tela excluída.");
      setDeleteTarget(null);
    } catch {
      toast.error("Não foi possível excluir a tela.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Telas"
        description="Gerencie os monitores conectados à plataforma."
        action={
          <Link href="/admin/telas/nova">
            <Button>
              <Plus className="h-4 w-4" />
              Nova tela
            </Button>
          </Link>
        }
      />

      {loading ? (
        <Spinner />
      ) : screens.length === 0 ? (
        <EmptyState
          icon={MonitorPlay}
          title="Nenhuma tela cadastrada"
          description="Cadastre a primeira tela para começar a exibir conteúdos nos monitores."
          action={
            <Link href="/admin/telas/nova">
              <Button size="sm">
                <Plus className="h-4 w-4" />
                Nova tela
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {screens.map((screen) => {
            const online = isScreenOnline(screen.lastSeenAt);
            return (
              <Card key={screen.id} className="flex flex-col p-5">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-slate-900">
                      {screen.nome}
                    </h3>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {unidadeLabel(screen.unidade)} · {setorLabel(screen.setor)}
                    </p>
                  </div>
                  <StatusBadge status={online ? "online" : "offline"} />
                </div>

                <p className="mb-1 truncate text-sm text-slate-600">
                  {screen.localizacao}
                </p>
                <p className="mb-4 font-mono text-xs text-slate-400">
                  /tv/{screen.screenId}
                </p>

                <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <StatusBadge status={screen.status} />
                  <span>
                    {screen.orientacao === "horizontal"
                      ? "Horizontal"
                      : "Vertical"}
                  </span>
                  <span>· Visto {formatRelative(screen.lastSeenAt)}</span>
                </div>

                <div className="mt-auto flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(getTvUrl(screen.screenId));
                      toast.success("Link copiado!");
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copiar link
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      window.open(getTvUrl(screen.screenId), "_blank")
                    }
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                  <Link href={`/admin/telas/${screen.id}/editar`}>
                    <Button variant="ghost" size="sm">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => setDeleteTarget(screen)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Excluir "${deleteTarget?.nome}"?`}
        description="Essa ação não pode ser desfeita. Os conteúdos vinculados a esta tela deixarão de ser exibidos."
        confirmLabel="Excluir"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
