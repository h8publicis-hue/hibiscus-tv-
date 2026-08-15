"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Plus,
  MonitorPlay,
  MonitorOff,
  Copy,
  ExternalLink,
  Pencil,
  Trash2,
  RefreshCw,
  Search,
  Maximize2,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Spinner } from "@/components/shared/Spinner";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { watchScreens, deleteScreen, requestScreenReload } from "@/lib/firestore";
import { cn } from "@/lib/utils";
import { formatRelative } from "@/utils/date";
import { isScreenOnline } from "@/utils/date";
import { getTvUrl } from "@/utils/screen";
import { useSectors } from "@/hooks/useSectors";
import { UNIDADES, type Screen } from "@/types";

const PAGE_SIZE = 30;

export default function TelasPage() {
  const [screens, setScreens] = useState<Screen[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Screen | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [reloadingId, setReloadingId] = useState<string | null>(null);
  const [expandedScreen, setExpandedScreen] = useState<Screen | null>(null);
  const { sectors } = useSectors();

  const [search, setSearch] = useState("");
  const [unidade, setUnidade] = useState("");
  const [setor, setSetor] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("");
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const hasActiveFilter = Boolean(search || unidade || setor || statusFiltro);

  useEffect(() => {
    if (!expandedScreen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setExpandedScreen(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [expandedScreen]);

  useEffect(() => {
    const unsub = watchScreens((data) => {
      setScreens(data);
      setLoading(false);
    }, hasActiveFilter ? undefined : pageSize);
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize, hasActiveFilter]);

  const filtered = useMemo(() => {
    return screens.filter((s) => {
      if (
        search &&
        !s.nome.toLowerCase().includes(search.toLowerCase()) &&
        !s.localizacao.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      if (unidade && s.unidade !== unidade) return false;
      if (setor && s.setor !== setor) return false;
      if (statusFiltro === "online" && !isScreenOnline(s.lastSeenAt)) return false;
      if (statusFiltro === "offline" && isScreenOnline(s.lastSeenAt)) return false;
      return true;
    });
  }, [screens, search, unidade, setor, statusFiltro]);

  async function handleReload(screen: Screen) {
    setReloadingId(screen.id);
    try {
      await requestScreenReload(screen.id);
      toast.success(
        isScreenOnline(screen.lastSeenAt)
          ? "Comando enviado — a tela deve recarregar em instantes."
          : "Comando enviado, mas essa tela está offline agora — ela só vai recarregar quando reconectar."
      );
    } catch {
      toast.error("Não foi possível enviar o comando de recarregar.");
    } finally {
      setReloadingId(null);
    }
  }

  function unidadeLabel(v: string) {
    return UNIDADES.find((u) => u.value === v)?.label ?? v;
  }
  function setorLabel(v: string) {
    return sectors.find((s) => s.id === v)?.label ?? v;
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

      {screens.length > 0 && (
        <Card className="mb-6 p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative lg:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Buscar por nome ou localização..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={unidade} onChange={(e) => setUnidade(e.target.value)}>
              <option value="">Todas as unidades</option>
              {UNIDADES.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </Select>
            <Select value={setor} onChange={(e) => setSetor(e.target.value)}>
              <option value="">Todos os setores</option>
              {sectors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </Select>
            <Select
              value={statusFiltro}
              onChange={(e) => setStatusFiltro(e.target.value)}
              className="sm:col-span-2 lg:col-span-4"
            >
              <option value="">Online e offline</option>
              <option value="online">Só online</option>
              <option value="offline">Só offline</option>
            </Select>
          </div>
        </Card>
      )}

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
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Nenhuma tela encontrada"
          description="Ajuste a busca ou os filtros."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((screen) => {
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

                <div className="group relative mb-3 aspect-video w-full overflow-hidden rounded-lg bg-slate-900">
                  {online ? (
                    <>
                      <iframe
                        src={`${getTvUrl(screen.screenId)}?preview=1`}
                        className="h-full w-full border-0"
                        title={`Prévia ao vivo — ${screen.nome}`}
                      />
                      <button
                        type="button"
                        onClick={() => setExpandedScreen(screen)}
                        title="Expandir prévia"
                        className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-sm">
                          <Maximize2 className="h-4 w-4" />
                        </span>
                      </button>
                    </>
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-slate-500">
                      <MonitorOff className="h-6 w-6" />
                      <span className="text-xs">Tela offline</span>
                    </div>
                  )}
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
                  <Button
                    variant="ghost"
                    size="sm"
                    title="Recarregar tela remotamente"
                    loading={reloadingId === screen.id}
                    onClick={() => handleReload(screen)}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
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

      {!hasActiveFilter && screens.length === pageSize && (
        <div className="mt-4 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageSize((n) => n + PAGE_SIZE)}
          >
            Carregar mais
          </Button>
        </div>
      )}

      {expandedScreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setExpandedScreen(null)}
          />
          <div
            className={cn(
              "relative w-full overflow-hidden rounded-2xl bg-slate-900 shadow-2xl",
              expandedScreen.orientacao === "vertical"
                ? "max-h-[85vh] max-w-md"
                : "max-w-4xl"
            )}
          >
            <div className="flex items-center justify-between gap-3 bg-slate-900 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {expandedScreen.nome}
                </p>
                <p className="truncate text-xs text-slate-400">
                  {expandedScreen.localizacao}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setExpandedScreen(null)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div
              className={cn(
                "w-full bg-black",
                expandedScreen.orientacao === "vertical"
                  ? "aspect-[9/16]"
                  : "aspect-video"
              )}
            >
              <iframe
                src={`${getTvUrl(expandedScreen.screenId)}?preview=1`}
                className="h-full w-full border-0"
                title={`Prévia ampliada — ${expandedScreen.nome}`}
              />
            </div>
          </div>
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
