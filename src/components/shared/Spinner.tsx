import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Spinner({
  className,
  label = "Carregando...",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-16 text-slate-500",
        className
      )}
    >
      <Loader2 className="h-6 w-6 animate-spin text-hibiscus-500" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
