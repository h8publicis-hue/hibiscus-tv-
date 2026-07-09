import { cn } from "@/lib/utils";
import type { Prioridade } from "@/types";
import { AlertTriangle } from "lucide-react";

const config: Record<Prioridade, { label: string; className: string }> = {
  urgente: { label: "Urgente", className: "bg-red-100 text-red-700" },
  alta: { label: "Alta", className: "bg-orange-100 text-orange-700" },
  normal: { label: "Normal", className: "bg-sky-100 text-sky-700" },
  baixa: { label: "Baixa", className: "bg-slate-100 text-slate-600" },
};

export function PriorityBadge({ prioridade }: { prioridade: Prioridade }) {
  const item = config[prioridade];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        item.className
      )}
    >
      {prioridade === "urgente" && <AlertTriangle className="h-3 w-3" />}
      {item.label}
    </span>
  );
}
