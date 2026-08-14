"use client";

import { useEffect, useState } from "react";
import { HardDrive } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { getStorageUsage } from "@/lib/storage";
import { cn } from "@/lib/utils";

function formatMB(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

export function StorageUsageCard() {
  const [usage, setUsage] = useState<{ usedBytes: number; limitBytes: number } | null>(
    null
  );
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    getStorageUsage()
      .then(setUsage)
      .catch(() => setFailed(true));
  }, []);

  if (failed) return null;

  const percent = usage ? Math.min(100, (usage.usedBytes / usage.limitBytes) * 100) : 0;
  const nearLimit = percent >= 80;
  const overLimit = percent >= 95;

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="h-4 w-4 text-slate-400" />
          Armazenamento de mídia
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!usage ? (
          <div className="h-2 w-full animate-pulse rounded-full bg-slate-100" />
        ) : (
          <>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  overLimit
                    ? "bg-red-500"
                    : nearLimit
                    ? "bg-sand-500"
                    : "bg-tropical-500"
                )}
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {formatMB(usage.usedBytes)} de {formatMB(usage.limitBytes)} usados
              <span className="text-slate-400"> · {percent.toFixed(1)}%</span>
            </p>
            {nearLimit && (
              <p className="mt-1 text-xs font-medium text-hibiscus-600">
                {overLimit
                  ? "Armazenamento quase cheio — comprima vídeos ou faça upgrade do plano Supabase."
                  : "Chegando perto do limite do plano gratuito do Supabase (1GB)."}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
