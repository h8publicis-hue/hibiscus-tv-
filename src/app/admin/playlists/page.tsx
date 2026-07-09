"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, ListVideo, Pencil, Trash2, MonitorPlay } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Spinner } from "@/components/shared/Spinner";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { watchPlaylists, deletePlaylist } from "@/lib/firestore";
import { UNIDADES, SETORES, type Playlist } from "@/types";

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Playlist | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const unsub = watchPlaylists((data) => {
      setPlaylists(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  function unidadeLabel(v: string) {
    return UNIDADES.find((u) => u.value === v)?.label ?? v;
  }
  function setorLabel(v: string) {
    if (v === "todos") return "Todos os setores";
    return SETORES.find((s) => s.value === v)?.label ?? v;
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deletePlaylist(deleteTarget.id);
      toast.success("Playlist excluída.");
      setDeleteTarget(null);
    } catch {
      toast.error("Não foi possível excluir a playlist.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Playlists"
        description="Agrupe conteúdos e defina a ordem de exibição por tela."
        action={
          <Link href="/admin/playlists/nova">
            <Button>
              <Plus className="h-4 w-4" />
              Nova playlist
            </Button>
          </Link>
        }
      />

      {loading ? (
        <Spinner />
      ) : playlists.length === 0 ? (
        <EmptyState
          icon={ListVideo}
          title="Nenhuma playlist cadastrada"
          description="Crie playlists para controlar a ordem de exibição dos conteúdos em cada tela."
          action={
            <Link href="/admin/playlists/nova">
              <Button size="sm">
                <Plus className="h-4 w-4" />
                Nova playlist
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {playlists.map((p) => (
            <Card key={p.id} className="flex flex-col p-5">
              <div className="mb-3 flex items-start justify-between gap-2">
                <h3 className="truncate font-semibold text-slate-900">
                  {p.nome}
                </h3>
                <StatusBadge status={p.status} />
              </div>
              <p className="mb-3 text-xs text-slate-500">
                {unidadeLabel(p.unidade)} · {setorLabel(p.setor)}
              </p>
              <div className="mb-4 flex flex-wrap gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <ListVideo className="h-3.5 w-3.5" />
                  {p.conteudos.length} conteúdo(s)
                </span>
                <span className="flex items-center gap-1">
                  <MonitorPlay className="h-3.5 w-3.5" />
                  {p.telas.length} tela(s)
                </span>
              </div>
              <div className="mt-auto flex gap-2">
                <Link href={`/admin/playlists/${p.id}/editar`}>
                  <Button variant="outline" size="sm">
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => setDeleteTarget(p)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Excluir "${deleteTarget?.nome}"?`}
        description="As telas vinculadas a esta playlist voltarão a exibir conteúdos por unidade/setor."
        confirmLabel="Excluir"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
