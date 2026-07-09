import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DashboardCardData {
  label: string;
  value: number | string;
  icon: LucideIcon;
  accent: "hibiscus" | "tropical" | "sand" | "slate" | "red";
}

const accentClasses: Record<DashboardCardData["accent"], string> = {
  hibiscus: "bg-hibiscus-50 text-hibiscus-600",
  tropical: "bg-tropical-50 text-tropical-600",
  sand: "bg-sand-100 text-sand-700",
  slate: "bg-slate-100 text-slate-600",
  red: "bg-red-50 text-red-600",
};

export function DashboardCards({ cards }: { cards: DashboardCardData[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div
              className={cn(
                "mb-3 flex h-10 w-10 items-center justify-center rounded-xl",
                accentClasses[card.accent]
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{card.value}</p>
            <p className="mt-1 text-sm text-slate-500">{card.label}</p>
          </div>
        );
      })}
    </div>
  );
}
