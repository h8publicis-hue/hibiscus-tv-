"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { GripVertical, Trash2 } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldError, Select } from "@/components/ui/Input";
import { createPlaylist, updatePlaylist, watchScreens, watchContents } from "@/lib/firestore";
import { UNIDADES, SETORES, type Playlist, type Screen, type Content } from "@/types";

const schema = z.object({
  nome: z.string().min(2, "Informe o nome da playlist"),
  unidade: z.enum(["hibiscus", "mar-cia", "grupo"]),
  setor: z.string().min(1),
  status: z.enum(["ativa", "inativa"]),
});

type FormData = z.infer<typeof schema>;

export function PlaylistForm({ playlist }: { playlist?: Playlist }) {
  const router = useRouter();
  const isEdit = Boolean(playlist);
  const [submitting, setSubmitting] = useState(false);
  const [screens, setScreens] = useState<Screen[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [selectedTelas, setSelectedTelas] = useState<string[]>(
    playlist?.telas ?? []
  );
  const [orderedContentIds, setOrderedContentIds] = useState<string[]>(
    (playlist?.conteudos ?? [])
      .slice()
      .sort((a, b) => a.ordem - b.ordem)
      .map((c) => c.contentId)
  );

  useEffect(() => {
    const unsub1 = watchScreens(setScreens);
    const unsub2 = watchContents(setContents);
    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: playlist
      ? {
          nome: playlist.nome,
          unidade: playlist.unidade,
          setor: playlist.setor,
          status: playlist.status,
        }
      : {
          unidade: "grupo",
          setor: "todos",
          status: "ativa",
        },
  });

  const sensors = useSensors(useSensor(PointerSensor));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setOrderedContentIds((items) => {
      const oldIndex = items.indexOf(String(active.id));
      const newIndex = items.indexOf(String(over.id));
      return arrayMove(items, oldIndex, newIndex);
    });
  }

  function toggleTela(id: string) {
    setSelectedTelas((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }

  function toggleContent(id: string) {
    setOrderedContentIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  async function onSubmit(data: FormData) {
    setSubmitting(true);
    try {
      const payload = {
        nome: data.nome,
        unidade: data.unidade,
        setor: data.setor as Playlist["setor"],
        status: data.status,
        telas: selectedTelas,
        conteudos: orderedContentIds.map((contentId, index) => ({
          contentId,
          ordem: index,
        })),
      };

      if (isEdit && playlist) {
        await updatePlaylist(playlist.id, payload);
        toast.success("Playlist atualizada com sucesso!");
      } else {
        await createPlaylist(payload);
        toast.success("Playlist criada com sucesso!");
      }
      router.push("/admin/playlists");
      router.refresh();
    } catch {
      toast.error("Não foi possível salvar a playlist.");
    } finally {
      setSubmitting(false);
    }
  }

  const contentMap = new Map(contents.map((c) => [c.id, c]));
  const availableContents = contents.filter(
    (c) => !orderedContentIds.includes(c.id)
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-3">
        <div className="sm:col-span-3">
          <Label htmlFor="nome" required>
            Nome da playlist
          </Label>
          <Input
            id="nome"
            placeholder="Ex: Recepção — Comunicados gerais"
            error={errors.nome?.message}
            {...register("nome")}
          />
          <FieldError message={errors.nome?.message} />
        </div>

        <div>
          <Label htmlFor="unidade" required>
            Unidade
          </Label>
          <Select id="unidade" {...register("unidade")}>
            {UNIDADES.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="setor" required>
            Setor
          </Label>
          <Select id="setor" {...register("setor")}>
            <option value="todos">Todos os setores</option>
            {SETORES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="status" required>
            Status
          </Label>
          <Select id="status" {...register("status")}>
            <option value="ativa">Ativa</option>
            <option value="inativa">Inativa</option>
          </Select>
        </div>
      </div>

      <div>
        <Label>Telas vinculadas</Label>
        <div className="grid gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-3 max-h-48 overflow-y-auto">
          {screens.length === 0 && (
            <p className="text-sm text-slate-400">Nenhuma tela cadastrada.</p>
          )}
          {screens.map((screen) => (
            <label
              key={screen.id}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50"
            >
              <input
                type="checkbox"
                checked={selectedTelas.includes(screen.id)}
                onChange={() => toggleTela(screen.id)}
                className="h-4 w-4 rounded border-slate-300 text-hibiscus-600 focus:ring-hibiscus-500"
              />
              <span className="truncate">{screen.nome}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <Label>Conteúdos disponíveis</Label>
          <div className="max-h-72 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-2">
            {availableContents.length === 0 && (
              <p className="p-2 text-sm text-slate-400">
                Todos os conteúdos já foram adicionados.
              </p>
            )}
            {availableContents.map((c) => (
              <button
                type="button"
                key={c.id}
                onClick={() => toggleContent(c.id)}
                className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm hover:bg-slate-50"
              >
                <span className="truncate">{c.titulo}</span>
                <span className="text-xs text-hibiscus-600">Adicionar</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label>Ordem de exibição</Label>
          <div className="min-h-[4rem] space-y-2 rounded-xl border border-slate-200 p-2">
            {orderedContentIds.length === 0 && (
              <p className="p-2 text-sm text-slate-400">
                Nenhum conteúdo adicionado ainda.
              </p>
            )}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={orderedContentIds}
                strategy={verticalListSortingStrategy}
              >
                {orderedContentIds.map((id, index) => {
                  const c = contentMap.get(id);
                  return (
                    <SortablePlaylistItem
                      key={id}
                      id={id}
                      index={index}
                      title={c?.titulo ?? "Conteúdo removido"}
                      onRemove={() => toggleContent(id)}
                    />
                  );
                })}
              </SortableContext>
            </DndContext>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" loading={submitting}>
          {isEdit ? "Salvar alterações" : "Criar playlist"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/playlists")}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function SortablePlaylistItem({
  id,
  index,
  title,
  onRemove,
}: {
  id: string;
  index: number;
  title: string;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm shadow-sm"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-slate-400 hover:text-slate-600"
        aria-label="Reordenar"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-hibiscus-100 text-xs font-semibold text-hibiscus-700">
        {index + 1}
      </span>
      <span className="min-w-0 flex-1 truncate">{title}</span>
      <button
        type="button"
        onClick={onRemove}
        className="text-slate-400 hover:text-red-600"
        aria-label="Remover"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
