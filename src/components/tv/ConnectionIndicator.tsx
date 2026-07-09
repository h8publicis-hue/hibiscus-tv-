"use client";

import { WifiOff } from "lucide-react";

export function ConnectionIndicator({ show }: { show: boolean }) {
  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-full bg-red-600/80 px-3 py-1.5 text-xs text-white backdrop-blur-sm">
      <WifiOff className="h-3.5 w-3.5" />
      Conexão instável
    </div>
  );
}
