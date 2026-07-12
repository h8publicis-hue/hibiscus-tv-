"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Plus,
  FileStack,
  Search,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Spinner } from "@/components/shared/Spinner";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { watchContents, deleteContent, updateContent } from "@/lib/firestore";
import { formatDateTime } from "@/utils/date";
import { useSectors } from "@/hooks/useSectors";
import {
  UNIDADES,
  TIPOS_CONTEUDO,
  PRIORIDADES,
  type Content,
} from "@/types";

export default function ConteudosPage() {
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Content | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { sectors } = useSectors();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [tipo, setTipo] = useState("");
  const [unidade, setUnidade] = useState("");
  const [setor, setSetor] = useState("");
  const [prioridade, setPrioridade] = useState("");

  useEffect(() => {
    const unsub = watchContents((data) => {
      setContents(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    return contents.filter((c) => {
      if (search && !c.titulo.toLowerCase().includes(search.toLowerCase()))
        return false;
      if (status && c.status !== status) return false;
      if (tipo && c.tipo !== tipo) return false;
      if (unidade && c.unidade !== unidade) return false;
      if (setor && c.setor !== setor) return false;
      if (prioridade && c.prioridade !== prioridade) return false;
      return true;
    });
  }, [contents, search, status, tipo, unidade, setor, prioridade]);

  function label(list: { value: string; label: string }[], v: string) {
    return list.find((i) => i.value === v)?.label ?? v;
  }

  function sectorLabel(v: string) {
    return sectors.find((s) => s.id === v)?.label ?? v;
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteContent(deleteTarget.id);
      toast.success("Conteúdo excluído.");
      setDeleteTarget(null);
    } catch {
      toast.error("Não foi possível excluir o conteúdo.");
    } finally {
      setDeleting(false);
    }
  }

  async function toggleStatus(content: Content) {
    const novoStatus = content.status === "ativo" ? "inativo" : "ativo";
    try {
      await updateContent(content.id, { status: novoStatus });
      toast.success(
        novoStatus === "ativo" ? "Conteúdo ativado." : "Conteúdo desativado."
      );
    } catch {
      toast.error("Não foi possível atualizar o status.");
    }
  }

  return (
    <div>
      <PageHeader
        title="Conteúdos"
        description="Gerencie comunicados, promoções, avisos e campanhas."
        action={
          <Link href="/admin/conteudos/novo">
            <Button>
              <Plus className="h-4 w-4" />
              Novo conteúdo
            </Button>
          </Link>
        }
      />

      <Card className="mb-6 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="relative lg:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Buscar por título..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos os status</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
            <option value="rascunho">Rascunho</option>
          </Select>
          <Select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="">Todos os tipos</option>
            {TIPOS_CONTEUDO.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
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
            value={prioridade}
            onChange={(e) => setPrioridade(e.target.value)}
            className="lg:col-span-1"
          >
            <option value="">Todas as prioridades</option>
            {PRIORIDADES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {loading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileStack}
          title="Nenhum conteúdo encontrado"
          description="Ajuste os filtros ou cadastre um novo conteúdo."
          action={
            <Link href="/admin/conteudos/novo">
              <Button size="sm">
                <Plus className="h-4 w-4" />
                Novo conteúdo
              </Button>
            </Link>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Título</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Unidade / Setor</th>
                  <th className="px-4 py-3 font-medium">Prioridade</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Atualizado em</th>
                  <th className="px-4 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60">
                    <td className="max-w-[240px] truncate px-4 py-3 font-medium text-slate-800">
                      {c.titulo}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {label(TIPOS_CONTEUDO, c.tipo)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {label(UNIDADES, c.unidade)} · {sectorLabel(c.setor)}
                    </td>
                    <td className="px-4 py-3">
                      <PriorityBadge prioridade={c.prioridade} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {formatDateTime(c.atualizadoEm)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleStatus(c)}
                          title={c.status === "ativo" ? "Desativar" : "Ativar"}
                        >
                          {c.status === "ativo" ? (
                            <EyeOff className="h-3.5 w-3.5" />
                          ) : (
                            <Eye className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Link href={`/admin/conteudos/${c.id}/editar`}>
                          <Button variant="ghost" size="sm">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => setDeleteTarget(c)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Excluir "${deleteTarget?.titulo}"?`}
        description="O registro será removido do Firestore. O arquivo de mídia no Storage não é excluído automaticamente."
        confirmLabel="Excluir"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
