"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Timestamp } from "firebase/firestore";
import { Plus, Trash2 } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { geocodeCity } from "@/lib/weather";
import { NOTICIA_CATEGORIAS, type NoticiaCategoria } from "@/lib/news";
import { dateInputToTimestamp, timestampToDateInput } from "@/utils/date";
import { extractIframeSrc } from "@/utils/text";
import { useAuth } from "@/components/shared/AuthProvider";
import { useSectors } from "@/hooks/useSectors";
import {
  UNIDADES,
  TIPOS_CONTEUDO,
  PRIORIDADES,
  STATUS_CONTEUDO,
  type Aniversariante,
  type Content,
  type Screen,
  type TipoConteudo,
  type Rotacao,
} from "@/types";

const ROTACOES: { value: Rotacao; label: string }[] = [
  { value: 0, label: "0°" },
  { value: 90, label: "90°" },
  { value: 180, label: "180°" },
  { value: 270, label: "270°" },
];

const schema = z.object({
  titulo: z.string().min(2, "Informe um título"),
  descricao: z.string().optional(),
  tipo: z.enum([
    "imagem",
    "video",
    "texto",
    "promocao",
    "urgente",
    "iframe",
    "clima",
    "noticias",
    "aniversariante",
    "boasvindas",
    "avisoseguranca",
  ]),
  unidade: z.enum(["hibiscus", "mar-cia", "grupo"]),
  setor: z.string().min(1, "Selecione um setor"),
  status: z.enum(["ativo", "inativo", "rascunho"]),
  prioridade: z.enum(["baixa", "normal", "alta", "urgente"]),
  duracaoEmSegundos: z.number().min(3, "Mínimo de 3 segundos"),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const NEEDS_FILE: TipoConteudo[] = ["imagem", "video"];
const NEEDS_TEXT: TipoConteudo[] = ["texto", "promocao", "urgente"];
const NEEDS_LOCATION: TipoConteudo[] = ["clima"];
const NEEDS_NEWS_CATEGORY: TipoConteudo[] = ["noticias"];
// Foto e texto opcionais (não bloqueiam o salvamento se vazios) — o
// template já cai num layout sem foto sozinho.
const OPTIONAL_PHOTO_TEMPLATES: TipoConteudo[] = ["boasvindas", "avisoseguranca"];
const NEEDS_ANIVERSARIANTES: TipoConteudo[] = ["aniversariante"];

function novoAniversariante(): Aniversariante {
  return { nome: "", cargo: "", data: "", fotoUrl: null };
}

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
  const [rotacao, setRotacao] = useState<Rotacao>(content?.rotacao ?? 0);
  const [intervaloMinutos, setIntervaloMinutos] = useState<string>(
    content?.intervaloMinutos ? String(content.intervaloMinutos) : ""
  );
  const [cidadeInput, setCidadeInput] = useState(content?.cidade ?? "");
  const [cidade, setCidade] = useState(content?.cidade ?? "");
  const [latitude, setLatitude] = useState<number | null>(
    content?.latitude ?? null
  );
  const [longitude, setLongitude] = useState<number | null>(
    content?.longitude ?? null
  );
  const [buscandoCidade, setBuscandoCidade] = useState(false);
  const [noticiaCategorias, setNoticiaCategorias] = useState<NoticiaCategoria[]>(
    content?.noticiaCategorias ?? ["geral"]
  );

  function toggleNoticiaCategoria(value: NoticiaCategoria) {
    setNoticiaCategorias((prev) =>
      prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value]
    );
  }
  const [aniversariantes, setAniversariantes] = useState<Aniversariante[]>(
    content?.aniversariantes && content.aniversariantes.length > 0
      ? content.aniversariantes
      : [novoAniversariante()]
  );

  function updateAniversariante(index: number, patch: Partial<Aniversariante>) {
    setAniversariantes((prev) =>
      prev.map((a, i) => (i === index ? { ...a, ...patch } : a))
    );
  }
  function addAniversariante() {
    setAniversariantes((prev) => [...prev, novoAniversariante()]);
  }
  function removeAniversariante(index: number) {
    setAniversariantes((prev) => prev.filter((_, i) => i !== index));
  }
  const [selectedTelas, setSelectedTelas] = useState<string[]>(
    content?.telas ?? []
  );

  function handleIframeUrlChange(value: string) {
    const extracted = extractIframeSrc(value);
    if (extracted !== value) {
      toast.success("Peguei só o link de dentro do código incorporado.");
    }
    setIframeUrl(extracted);
  }

  async function handleBuscarCidade() {
    if (!cidadeInput.trim()) return;
    setBuscandoCidade(true);
    try {
      const result = await geocodeCity(cidadeInput.trim());
      if (!result) {
        toast.error("Cidade não encontrada. Tente outro nome.");
        return;
      }
      setCidade(result.name);
      setCidadeInput(result.name);
      setLatitude(result.latitude);
      setLongitude(result.longitude);
      toast.success(`Cidade encontrada: ${result.name}`);
    } catch {
      toast.error("Não foi possível buscar a cidade agora.");
    } finally {
      setBuscandoCidade(false);
    }
  }

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
          setor: "",
          status: "rascunho",
          prioridade: "normal",
          duracaoEmSegundos: 10,
        },
  });

  const { sectors } = useSectors();

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
      rotacao,
      cidade: cidade || null,
      latitude,
      longitude,
      noticiaCategorias,
      aniversariantes,
      intervaloMinutos: Number(intervaloMinutos) || null,
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
    [
      content?.id,
      titulo,
      descricao,
      tipo,
      file,
      texto,
      iframeUrl,
      rotacao,
      cidade,
      latitude,
      longitude,
      noticiaCategorias,
      aniversariantes,
      intervaloMinutos,
      duracaoEmSegundos,
    ]
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
    if (NEEDS_LOCATION.includes(data.tipo) && (latitude == null || longitude == null)) {
      toast.error("Busque uma cidade válida antes de salvar.");
      return;
    }
    if (
      NEEDS_NEWS_CATEGORY.includes(data.tipo) &&
      noticiaCategorias.length === 0
    ) {
      toast.error("Selecione ao menos uma categoria de notícias.");
      return;
    }
    if (
      NEEDS_ANIVERSARIANTES.includes(data.tipo) &&
      !aniversariantes.some((a) => a.nome.trim())
    ) {
      toast.error("Adicione ao menos um aniversariante com nome.");
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
        rotacao,
        cidade: NEEDS_LOCATION.includes(data.tipo) ? cidade : null,
        latitude: NEEDS_LOCATION.includes(data.tipo) ? latitude : null,
        longitude: NEEDS_LOCATION.includes(data.tipo) ? longitude : null,
        noticiaCategorias: NEEDS_NEWS_CATEGORY.includes(data.tipo)
          ? noticiaCategorias
          : [],
        aniversariantes: NEEDS_ANIVERSARIANTES.includes(data.tipo)
          ? aniversariantes.filter((a) => a.nome.trim())
          : [],
        intervaloMinutos: Number(intervaloMinutos) || null,
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

          {OPTIONAL_PHOTO_TEMPLATES.includes(tipo) && (
            <div className="sm:col-span-2">
              <Label>Foto</Label>
              <p className="mb-2 text-xs text-slate-500">
                Opcional — sem foto, o modelo usa um fundo colorido com
                ícone.
              </p>
              <UploadField
                value={file?.url}
                path={file?.path}
                onChange={setFile}
                accept="imagem"
              />
            </div>
          )}

          <div className="sm:col-span-2">
            <Label>Rotação</Label>
            <p className="mb-2 text-xs text-slate-500">
              Gira este conteúdo — útil quando a tela é vertical mas o
              monitor não gira sozinho.
            </p>
            <div className="flex gap-2">
              {ROTACOES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRotacao(r.value)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                    rotacao === r.value
                      ? "border-hibiscus-600 bg-hibiscus-50 text-hibiscus-700"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

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

          {OPTIONAL_PHOTO_TEMPLATES.includes(tipo) && (
            <div className="sm:col-span-2">
              <Label>Mensagem</Label>
              <Textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder={
                  tipo === "boasvindas"
                    ? "Ex: Cargo, setor ou uma mensagem de boas-vindas..."
                    : "Ex: Detalhe do aviso de segurança..."
                }
                className="min-h-[90px]"
              />
            </div>
          )}

          {NEEDS_ANIVERSARIANTES.includes(tipo) && (
            <div className="sm:col-span-2">
              <Label required>Aniversariantes</Label>
              <p className="mb-2 text-xs text-slate-500">
                Use o título acima para o cabeçalho (ex: &quot;Aniversariantes
                de Dezembro&quot;) e adicione cada pessoa abaixo.
              </p>
              <div className="space-y-3">
                {aniversariantes.map((pessoa, index) => (
                  <div
                    key={index}
                    className="grid gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1fr_1fr_auto_auto]"
                  >
                    <Input
                      placeholder="Nome"
                      value={pessoa.nome}
                      onChange={(e) =>
                        updateAniversariante(index, { nome: e.target.value })
                      }
                    />
                    <Input
                      placeholder="Cargo/setor (opcional)"
                      value={pessoa.cargo}
                      onChange={(e) =>
                        updateAniversariante(index, { cargo: e.target.value })
                      }
                    />
                    <Input
                      placeholder="Ex: 12/12"
                      value={pessoa.data}
                      onChange={(e) =>
                        updateAniversariante(index, { data: e.target.value })
                      }
                      className="sm:w-28"
                    />
                    <button
                      type="button"
                      onClick={() => removeAniversariante(index)}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-red-600 hover:bg-red-50"
                      title="Remover"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <div className="sm:col-span-4">
                      <UploadField
                        value={pessoa.fotoUrl}
                        onChange={(result) =>
                          updateAniversariante(index, {
                            fotoUrl: result?.url ?? null,
                          })
                        }
                        accept="imagem"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={addAniversariante}
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar aniversariante
              </Button>
            </div>
          )}

          {tipo === "iframe" && (
            <div className="sm:col-span-2">
              <Label required>URL do link/iframe</Label>
              <Input
                value={iframeUrl}
                onChange={(e) => handleIframeUrlChange(e.target.value)}
                placeholder="https://..."
              />
              <p className="mt-1.5 text-xs text-slate-400">
                Cole a URL diretamente, ou o código {"<iframe>"} inteiro —
                a gente extrai o link sozinho.
              </p>
            </div>
          )}

          {tipo === "clima" && (
            <div className="sm:col-span-2">
              <Label required>Cidade</Label>
              <div className="flex gap-2">
                <Input
                  value={cidadeInput}
                  onChange={(e) => setCidadeInput(e.target.value)}
                  placeholder="Ex: Ilhéus"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  loading={buscandoCidade}
                  onClick={handleBuscarCidade}
                >
                  Buscar
                </Button>
              </div>
              {latitude != null && longitude != null ? (
                <p className="mt-1.5 text-xs text-tropical-700">
                  Localização encontrada: {cidade}
                </p>
              ) : (
                <p className="mt-1.5 text-xs text-slate-400">
                  Busque a cidade para confirmar a localização exata antes de
                  salvar.
                </p>
              )}
            </div>
          )}

          {tipo === "noticias" && (
            <div className="sm:col-span-2">
              <Label required>Categorias de notícias</Label>
              <p className="mb-2 text-xs text-slate-500">
                Selecione uma ou mais — as manchetes são mescladas
                automaticamente por data, sem duplicatas.
              </p>
              <div className="flex flex-wrap gap-2">
                {NOTICIA_CATEGORIAS.map((c) => {
                  const checked = noticiaCategorias.includes(c.value);
                  return (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => toggleNoticiaCategoria(c.value)}
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                        checked
                          ? "border-hibiscus-600 bg-hibiscus-50 text-hibiscus-700"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 text-xs text-slate-400">
                Manchetes atualizadas automaticamente a partir do G1.
              </p>
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
            <Select id="setor" error={errors.setor?.message} {...register("setor")}>
              <option value="">Selecione um setor</option>
              {sectors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </Select>
            <FieldError message={errors.setor?.message} />
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
            <Label htmlFor="intervaloMinutos">
              Intervalo mínimo entre exibições (minutos)
            </Label>
            <Input
              id="intervaloMinutos"
              type="number"
              min={1}
              placeholder="Deixe vazio para aparecer sempre"
              value={intervaloMinutos}
              onChange={(e) => setIntervaloMinutos(e.target.value)}
            />
            <p className="mt-1.5 text-xs text-slate-400">
              Continua no rodízio normalmente, mas é pulado se sua vez
              chegar antes desse tempo passar desde a última exibição.
            </p>
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
