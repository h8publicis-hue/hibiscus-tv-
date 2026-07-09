import { Timestamp } from "firebase/firestore";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function toDate(value: Timestamp | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toDate();
  return value;
}

export function formatDateTime(value: Timestamp | Date | null | undefined): string {
  const date = toDate(value);
  if (!date) return "-";
  return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}

export function formatDate(value: Timestamp | Date | null | undefined): string {
  const date = toDate(value);
  if (!date) return "-";
  return format(date, "dd/MM/yyyy", { locale: ptBR });
}

export function formatRelative(value: Timestamp | Date | null | undefined): string {
  const date = toDate(value);
  if (!date) return "nunca";
  return formatDistanceToNow(date, { locale: ptBR, addSuffix: true });
}

export function dateInputToTimestamp(value: string): Timestamp | null {
  if (!value) return null;
  return Timestamp.fromDate(new Date(value));
}

export function timestampToDateInput(
  value: Timestamp | Date | null | undefined
): string {
  const date = toDate(value);
  if (!date) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Um conteúdo é considerado "dentro do período" quando a data atual
 * está entre dataInicio e dataFim, se essas datas existirem.
 */
export function isWithinPeriod(
  dataInicio: Timestamp | null | undefined,
  dataFim: Timestamp | null | undefined
): boolean {
  const now = new Date();
  const start = toDate(dataInicio);
  const end = toDate(dataFim);

  if (start && now < start) return false;
  if (end && now > end) return false;
  return true;
}

const OFFLINE_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutos

export function isScreenOnline(lastSeenAt: Timestamp | null | undefined): boolean {
  const date = toDate(lastSeenAt);
  if (!date) return false;
  return Date.now() - date.getTime() < OFFLINE_THRESHOLD_MS;
}

export function isFutureDate(value: Timestamp | Date | null | undefined): boolean {
  const date = toDate(value);
  if (!date) return false;
  return date.getTime() > Date.now();
}
