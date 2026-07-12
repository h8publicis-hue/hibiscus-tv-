"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { useSectors } from "@/hooks/useSectors";
import { createSector, deleteSector } from "@/lib/firestore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { Sector } from "@/types";

export function SectorsManager() {
  const { sectors, loading } = useSectors();
  const [newLabel, setNewLabel] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Sector | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!newLabel.trim()) return;
    setSubmitting(true);
    try {
      await createSector(newLabel);
      toast.success("Setor adicionado!");
      setNewLabel("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível adicionar o setor."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteSector(deleteTarget.id);
      toast.success("Setor excluído.");
      setDeleteTarget(null);
    } catch {
      toast.error("Não foi possível excluir o setor.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleAdd} className="mb-4 flex gap-2">
        <Input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Nome do novo setor"
        />
        <Button type="submit" loading={submitting} size="sm">
          <Plus className="h-4 w-4" />
          Adicionar
        </Button>
      </form>

      {loading ? (
        <p className="text-sm text-slate-400">Carregando...</p>
      ) : sectors.length === 0 ? (
        <p className="text-sm text-slate-400">Nenhum setor cadastrado.</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {sectors.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
            >
              <span className="text-sm font-medium text-slate-700">{s.label}</span>
              <button
                type="button"
                onClick={() => setDeleteTarget(s)}
                className="text-slate-400 hover:text-red-600"
                aria-label={`Excluir ${s.label}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Excluir "${deleteTarget?.label}"?`}
        description="Telas, conteúdos ou playlists que já usam esse setor mantêm o valor salvo, mas ele deixa de aparecer nas opções de cadastro."
        confirmLabel="Excluir"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
