import type { Content } from "@/types";
import { isWithinPeriod } from "@/utils/date";
import { PRIORIDADE_PESO } from "@/types";

export function generateScreenId(nome: string): string {
  const slug = nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const random = Math.random().toString(36).slice(2, 6);
  return `${slug}-${random}`;
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
