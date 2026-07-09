import { cn } from "@/lib/utils";
import type { StatusConteudo, StatusTela, StatusPlaylist } from "@/types";

type Status = StatusConteudo | StatusTela | StatusPlaylist | "online" | "offline";

const config: Record<Status, { label: string; className: string }> = {
  ativo: { label: "Ativo", className: "bg-tropical-100 text-tropical-700" },
  ativa: { label: "Ativa", className: "bg-tropical-100 text-tropical-700" },
  inativo: { label: "Inativo", className: "bg-slate-100 text-slate-600" },
  inativa: { label: "Inativa", className: "bg-slate-100 text-slate-600" },
  rascunho: { label: "Rascunho", className: "bg-sand-100 text-sand-700" },
  online: { label: "Online", className: "bg-tropical-100 text-tropical-700" },
  offline: { label: "Offline", className: "bg-red-100 text-red-600" },
};

export function StatusBadge({ status }: { status: Status }) {
  const item = config[status] ?? { label: status, className: "bg-slate-100 text-slate-600" };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        item.className
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "ativo" || status === "ativa" || status === "online"
            ? "bg-tropical-500"
            : status === "offline"
            ? "bg-red-500"
            : status === "rascunho"
            ? "bg-sand-500"
            : "bg-slate-400"
        )}
      />
      {item.label}
    </span>
  );
}
