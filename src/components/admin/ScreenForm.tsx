"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldError, Select, Textarea } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { createScreen, updateScreen } from "@/lib/firestore";
import { generateScreenId, getScreenRotation, getTvUrl } from "@/utils/screen";
import { useSectors } from "@/hooks/useSectors";
import { UNIDADES, type Rotacao, type Screen } from "@/types";

const ROTACOES: { value: Rotacao; label: string }[] = [
  { value: 0, label: "0°" },
  { value: 90, label: "90°" },
  { value: 180, label: "180°" },
  { value: 270, label: "270°" },
];

const schema = z.object({
  nome: z.string().min(2, "Informe o nome da tela"),
  unidade: z.enum(["hibiscus", "mar-cia", "grupo"]),
  setor: z.string().min(1, "Selecione um setor"),
  localizacao: z.string().min(2, "Informe a localização"),
  orientacao: z.enum(["horizontal", "vertical"]),
  restringirHorario: z.boolean().optional(),
  horaAbertura: z.string().optional(),
  horaFechamento: z.string().optional(),
  status: z.enum(["ativa", "inativa"]),
  observacoes: z.string().optional(),
}).refine(
  (data) =>
    !data.restringirHorario || (data.horaAbertura && data.horaFechamento),
  {
    message: "Informe o horário de abertura e fechamento.",
    path: ["horaAbertura"],
  }
);

type FormData = z.infer<typeof schema>;

export function ScreenForm({ screen }: { screen?: Screen }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const isEdit = Boolean(screen);
  const { sectors } = useSectors();
  const [rotacaoGraus, setRotacaoGraus] = useState<Rotacao>(
    screen ? getScreenRotation(screen) : 0
  );

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: screen
      ? {
          nome: screen.nome,
          unidade: screen.unidade,
          setor: screen.setor,
          localizacao: screen.localizacao,
          orientacao: screen.orientacao,
          restringirHorario: Boolean(screen.horarioFuncionamento),
          horaAbertura: screen.horarioFuncionamento?.inicio ?? "08:00",
          horaFechamento: screen.horarioFuncionamento?.fim ?? "17:00",
          status: screen.status,
          observacoes: screen.observacoes,
        }
      : {
          unidade: "grupo",
          setor: "",
          orientacao: "horizontal",
          restringirHorario: false,
          horaAbertura: "08:00",
          horaFechamento: "17:00",
          status: "ativa",
          observacoes: "",
        },
  });

  const restringirHorario = useWatch({ control, name: "restringirHorario" });

  async function onSubmit(data: FormData) {
    setSubmitting(true);
    try {
      const { restringirHorario, horaAbertura, horaFechamento, ...rest } = data;
      const payload = {
        ...rest,
        rotacaoGraus,
        horarioFuncionamento: restringirHorario
          ? { inicio: horaAbertura!, fim: horaFechamento! }
          : null,
      };
      if (isEdit && screen) {
        await updateScreen(screen.id, payload);
        toast.success("Tela atualizada com sucesso!");
      } else {
        await createScreen({
          ...payload,
          observacoes: payload.observacoes || "",
          screenId: generateScreenId(data.nome),
          reloadRequestedAt: null,
        });
        toast.success("Tela criada com sucesso!");
      }
      router.push("/admin/telas");
      router.refresh();
    } catch {
      toast.error("Não foi possível salvar a tela.");
    } finally {
      setSubmitting(false);
    }
  }

  function copyLink() {
    if (!screen) return;
    navigator.clipboard.writeText(getTvUrl(screen.screenId));
    toast.success("Link da TV copiado!");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {isEdit && screen && (
        <div className="flex flex-col gap-3 rounded-xl border border-tropical-200 bg-tropical-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-tropical-700">
              URL da TV
            </p>
            <p className="mt-0.5 font-mono text-sm text-tropical-900">
              /tv/{screen.screenId}
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={copyLink}>
              <Copy className="h-3.5 w-3.5" />
              Copiar link
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => window.open(getTvUrl(screen.screenId), "_blank")}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Abrir
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="nome" required>
            Nome da tela
          </Label>
          <Input
            id="nome"
            placeholder="Ex: Recepção Hibiscus"
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
          <Label htmlFor="localizacao" required>
            Localização
          </Label>
          <Input
            id="localizacao"
            placeholder="Ex: Hall de entrada, térreo"
            error={errors.localizacao?.message}
            {...register("localizacao")}
          />
          <FieldError message={errors.localizacao?.message} />
        </div>

        <div>
          <Label htmlFor="orientacao" required>
            Orientação
          </Label>
          <Select id="orientacao" {...register("orientacao")}>
            <option value="horizontal">Horizontal</option>
            <option value="vertical">Vertical</option>
          </Select>
        </div>

        <div className="sm:col-span-2">
          <Label>Forçar rotação por software</Label>
          <p className="mb-2 text-xs text-slate-500">
            Gira toda a exibição da tela nesse ângulo — use só se o monitor
            físico não gira o conteúdo sozinho (ex: monitor comum montado
            na vertical, ou instalado de cabeça para baixo). Se a TV já
            roda nativamente na orientação certa, deixe em 0°.
          </p>
          <div className="flex gap-2">
            {ROTACOES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRotacaoGraus(r.value)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                  rotacaoGraus === r.value
                    ? "border-hibiscus-600 bg-hibiscus-50 text-hibiscus-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-hibiscus-600 focus:ring-hibiscus-500"
              {...register("restringirHorario")}
            />
            <span>
              <span className="font-medium text-slate-700">
                Restringir ao horário de funcionamento
              </span>
              <span className="mt-0.5 block text-xs text-slate-500">
                Fora do horário definido, a tela exibe uma mensagem
                institucional e para de baixar imagens/vídeos — economiza
                banda do plano do Supabase quando a casa está fechada.
              </span>
            </span>
          </label>

          {restringirHorario && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="horaAbertura">Abre às</Label>
                <Input
                  id="horaAbertura"
                  type="time"
                  error={errors.horaAbertura?.message}
                  {...register("horaAbertura")}
                />
                <FieldError message={errors.horaAbertura?.message} />
              </div>
              <div>
                <Label htmlFor="horaFechamento">Fecha às</Label>
                <Input
                  id="horaFechamento"
                  type="time"
                  {...register("horaFechamento")}
                />
              </div>
            </div>
          )}
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

        <div className="sm:col-span-2">
          <Label htmlFor="observacoes">Observações</Label>
          <Textarea
            id="observacoes"
            placeholder="Notas internas sobre esta tela..."
            {...register("observacoes")}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" loading={submitting}>
          {isEdit ? "Salvar alterações" : "Criar tela"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/telas")}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
