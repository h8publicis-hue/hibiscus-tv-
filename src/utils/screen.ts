import type { Content } from "@/types";
import { isWithinPeriod } from "@/utils/date";
import { PRIORIDADE_PESO } from "@/types";
import { slugify } from "@/utils/text";

export function generateScreenId(nome: string): string {
  const random = Math.random().toString(36).slice(2, 6);
  return `${slugify(nome)}-${random}`;
}

export function getTvUrl(screenId: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/tv/${screenId}`;
  }
  return `/tv/${screenId}`;
}

/**
 * Filtra conteúdos que podem ser exibidos agora: status ativo e
 * dentro do período de dataInicio/dataFim.
 */
export function filterPlayableContents(contents: Content[]): Content[] {
  return contents.filter(
    (c) => c.status === "ativo" && isWithinPeriod(c.dataInicio, c.dataFim)
  );
}

/**
 * Verifica se o horário atual está dentro do horário de funcionamento
 * configurado para a tela. Sem restrição configurada, está sempre dentro.
 * Suporta intervalos que cruzam a meia-noite (ex: 22:00 às 06:00).
 */
export function isWithinBusinessHours(
  horario: { inicio: string; fim: string } | null | undefined,
  now: Date = new Date()
): boolean {
  if (!horario) return true;

  const [hIni, mIni] = horario.inicio.split(":").map(Number);
  const [hFim, mFim] = horario.fim.split(":").map(Number);
  if ([hIni, mIni, hFim, mFim].some(Number.isNaN)) return true;

  const minutosAgora = now.getHours() * 60 + now.getMinutes();
  const minutosInicio = hIni * 60 + mIni;
  const minutosFim = hFim * 60 + mFim;

  if (minutosInicio === minutosFim) return true;
  if (minutosInicio < minutosFim) {
    return minutosAgora >= minutosInicio && minutosAgora < minutosFim;
  }
  return minutosAgora >= minutosInicio || minutosAgora < minutosFim;
}

/**
 * Ordena por prioridade (urgente primeiro) e depois por data de criação
 * (mais recente primeiro).
 */
export function sortContentsByPriority(contents: Content[]): Content[] {
  return [...contents].sort((a, b) => {
    const pesoA = PRIORIDADE_PESO[a.prioridade] ?? 99;
    const pesoB = PRIORIDADE_PESO[b.prioridade] ?? 99;
    if (pesoA !== pesoB) return pesoA - pesoB;

    const dateA = a.criadoEm?.toMillis?.() ?? 0;
    const dateB = b.criadoEm?.toMillis?.() ?? 0;
    return dateB - dateA;
  });
}
