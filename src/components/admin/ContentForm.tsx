"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Timestamp } from "firebase/firestore";
import { Button } from "@/components/ui/Button";
import {
  Input,
  Label,
  FieldError,
  Select,
  Textarea,
} from "@/components/ui/Input";
import { UploadField } from "@/components/admin/UploadField";
import { ContentPreview } from "@/components/admin/ContentPreview";
import { createContent, updateContent, watchScreens } from "@/lib/firestore";
import { dateInputToTimestamp, timestampToDateInput } from "@/utils/date";
import { useAuth } from "@/components/shared/AuthProvider";
import {
  UNIDADES,
  SETORES,
  TIPOS_CONTEUDO,
  PRIORIDADES,
  STATUS_CONTEUDO,
  type Content,
  type Screen,
  type TipoConteudo,
} from "@/types";

const schema = z.object({
  titulo: z.string().min(2, "Informe um título"),
  descricao: z.string().optional(),
  tipo: z.enum(["imagem", "video", "texto", "promocao", "urgente", "iframe"]),
  unidade: z.enum(["hibiscus", "mar-cia", "grupo"]),
  setor: z.enum([
    "recepcao",
    "cozinha",
    "atendimento",
    "rh",
    "financeiro",
    "loja",
    "pdv",
    "area-colaboradores",
  ]),
  status: z.enum(["ativo", "inativo", "rascunho"]),
  prioridade: z.enum(["baixa", "normal", "alta", "urgente"]),
  duracaoEmSegundos: z.number().min(3, "Mínimo de 3 segundos"),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const NEEDS_FILE: TipoConteudo[] = ["imagem", "video"];
const NEEDS_TEXT: TipoConteudo[] = ["texto", "promocao", "urgente"];

export function ContentForm({ content }: { content?: Content }) {
  const router = useRouter();
  const { user } = useAuth();
  const isEdit = Boolean(content);
  const [submitting, setSubmitting] = useState(false);
  const [screens, setScreens] = useState<Screen[]>([]);

  const [file, setFile] = useState<{ url: string; path: string } | null>(
    content?.arquivoUrl && content?.arquivoPath
      ? { url: content.arquivoUrl, path: content.arquivoPath }
      : null
  );
  const [texto, setTexto] = useState(content?.texto ?? "");
  const [iframeUrl, setIframeUrl] = useState(content?.iframeUrl ?? "");
  const [selectedTelas, setSelectedTelas] = useState<string[]>(
    content?.telas ?? []
  );

  useEffect(() => {
    const unsub = watchScreens(setScreens);
    return () => unsub();
  }, []);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: content
      ? {
          titulo: content.titulo,
          descricao: content.descricao,
          tipo: content.tipo,
          unidade: content.unidade,
          setor: content.setor,
          status: content.status,
          prioridade: content.prioridade,
          duracaoEmSegundos: content.duracaoEmSegundos,
          dataInicio: timestampToDateInput(content.dataInicio),
          dataFim: timestampToDateInput(content.dataFim),
        }
      : {
          tipo: "imagem",
          unidade: "grupo",
          setor: "recepcao",
          status: "rascunho",
          prioridade: "normal",
          duracaoEmSegundos: 10,
        },
  });

  const tipo = useWatch({ control, name: "tipo" });
  const titulo = useWatch({ control, name: "titulo" });
  const descricao = useWatch({ control, name: "descricao" });
  const duracaoEmSegundos = useWatch({ control, name: "duracaoEmSegundos" });

  const previewContent: Content = useMemo(
    () => ({
      id: content?.id ?? "preview",
      titulo: titulo || "Título do conteúdo",
      descricao: descricao || "",
      tipo,
      arquivoUrl: file?.url ?? null,
      arquivoPath: file?.path ?? null,
      texto: texto || null,
      iframeUrl: iframeUrl || null,
      unidade: "grupo",
      setor: "recepcao",
      status: "rascunho",
      prioridade: "normal",
      duracaoEmSegundos: Number(duracaoEmSegundos) || 10,
      dataInicio: null,
      dataFim: null,
      telas: [],
      criadoEm: Timestamp.now(),
      atualizadoEm: Timestamp.now(),
      criadoPor: "",
    }),
    [content?.id, titulo, descricao, tipo, file, texto, iframeUrl, duracaoEmSegundos]
  );

  function toggleTela(id: string) {
    setSelectedTelas((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }

  async function onSubmit(data: FormData) {
    if (NEEDS_FILE.includes(data.tipo) && !file) {
      toast.error("Envie um arquivo de imagem ou vídeo.");
      return;
    }
    if (NEEDS_TEXT.includes(data.tipo) && !texto.trim()) {
      toast.error("Escreva o texto do conteúdo.");
      return;
    }
    if (data.tipo === "iframe" && !iframeUrl.trim()) {
      toast.error("Informe a URL do link/iframe.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        titulo: data.titulo,
        descricao: data.descricao || "",
        tipo: data.tipo,
        arquivoUrl: file?.url ?? null,
        arquivoPath: file?.path ?? null,
        texto: NEEDS_TEXT.includes(data.tipo) ? texto : null,
        iframeUrl: data.tipo === "iframe" ? iframeUrl : null,
        unidade: data.unidade,
        setor: data.setor,
        status: data.status,
        prioridade: data.prioridade,
        duracaoEmSegundos: Number(data.duracaoEmSegundos),
        dataInicio: dateInputToTimestamp(data.dataInicio || ""),
        dataFim: dateInputToTimestamp(data.dataFim || ""),
        telas: selectedTelas,
      };

      if (isEdit && content) {
        await updateContent(content.id, payload);
        toast.success("Conteúdo atualizado com sucesso!");
      } else {
        await createContent({
          ...payload,
          criadoPor: user?.uid ?? "",
        });
        toast.success("Conteúdo criado com sucesso!");
      }
      router.push("/admin/conteudos");
      router.refresh();
    } catch {
      toast.error("Não foi possível salvar o conteúdo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="titulo" required>
              Título
            </Label>
            <Input
              id="titulo"
              placeholder="Ex: Promoção de verão"
              error={errors.titulo?.message}
              {...register("titulo")}
            />
            <FieldError message={errors.titulo?.message} />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              placeholder="Descrição interna deste conteúdo (não exibida na TV para imagem/vídeo)"
              {...register("descricao")}
            />
          </div>

          <div>
            <Label htmlFor="tipo" required>
              Tipo de conteúdo
            </Label>
            <Select id="tipo" {...register("tipo")}>
              {TIPOS_CONTEUDO.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="prioridade" required>
              Prioridade
            </Label>
            <Select id="prioridade" {...register("prioridade")}>
              {PRIORIDADES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </Select>
          </div>

          {NEEDS_FILE.includes(tipo) && (
            <div className="sm:col-span-2">
              <Label required>Arquivo</Label>
              <UploadField
                value={file?.url}
                path={file?.path}
                onChange={setFile}
                accept={tipo === "imagem" ? "imagem" : "video"}
              />
            </div>
          )}

          {NEEDS_TEXT.includes(tipo) && (
            <div className="sm:col-span-2">
              <Label required>Texto exibido na TV</Label>
              <Textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Escreva a mensagem que aparecerá na tela..."
                className="min-h-[120px]"
              />
            </div>
          )}

          {tipo === "iframe" && (
            <div className="sm:col-span-2">
              <Label required>URL do link/iframe</Label>
              <Input
                value={iframeUrl}
                onChange={(e) => setIframeUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          )}

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
              {STATUS_CONTEUDO.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="duracaoEmSegundos" required>
              Duração (segundos)
            </Label>
            <Input
              id="duracaoEmSegundos"
              type="number"
              min={3}
              error={errors.duracaoEmSegundos?.message}
              {...register("duracaoEmSegundos", { valueAsNumber: true })}
            />
            <FieldError message={errors.duracaoEmSegundos?.message} />
          </div>

          <div>
            <Label htmlFor="dataInicio">Início da exibição</Label>
            <Input id="dataInicio" type="datetime-local" {...register("dataInicio")} />
          </div>

          <div>
            <Label htmlFor="dataFim">Fim da exibição</Label>
            <Input id="dataFim" type="datetime-local" {...register("dataFim")} />
          </div>

          <div className="sm:col-span-2">
            <Label>Telas vinculadas</Label>
            <p className="mb-2 text-xs text-slate-500">
              Se nenhuma tela for selecionada, o conteúdo poderá ser buscado
              por unidade/setor nas telas sem playlist definida.
            </p>
            <div className="grid gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-2 max-h-56 overflow-y-auto">
              {screens.length === 0 && (
                <p className="text-sm text-slate-400">
                  Nenhuma tela cadastrada ainda.
                </p>
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
        </div>

        <div className="flex gap-3">
          <Button type="submit" loading={submitting}>
            {isEdit ? "Salvar alterações" : "Criar conteúdo"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/conteudos")}
          >
            Cancelar
          </Button>
        </div>
      </form>

      <div className="lg:sticky lg:top-6 lg:self-start">
        <p className="mb-2 text-sm font-medium text-slate-600">
          Prévia do conteúdo
        </p>
        <ContentPreview content={previewContent} />
      </div>
    </div>
  );
}
