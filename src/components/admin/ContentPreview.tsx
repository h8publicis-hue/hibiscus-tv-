"use client";

import { useState } from "react";
import { RectangleHorizontal, RectangleVertical } from "lucide-react";
import { MediaRenderer } from "@/components/tv/MediaRenderer";
import { cn } from "@/lib/utils";
import type { Content } from "@/types";

export function ContentPreview({ content }: { content: Content }) {
  const [vertical, setVertical] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
      <div
        className={cn(
          "flex w-full items-center justify-center bg-slate-950",
          vertical ? "aspect-square" : "aspect-video"
        )}
      >
        <div
          className={cn(
            "h-full bg-slate-900",
            vertical ? "aspect-[9/16]" : "w-full"
          )}
        >
          <MediaRenderer content={content} />
        </div>
      </div>
      <div className="flex items-center justify-between bg-white px-3 py-2 text-xs text-slate-500">
        <span>
          Prévia — {vertical ? "simulando tela vertical (9:16)" : "proporção 16:9"}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            title="Simular tela horizontal"
            onClick={() => setVertical(false)}
            className={cn(
              "rounded-md p-1.5 transition-colors",
              !vertical
                ? "bg-hibiscus-50 text-hibiscus-600"
                : "text-slate-400 hover:bg-slate-100"
            )}
          >
            <RectangleHorizontal className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="Simular tela vertical"
            onClick={() => setVertical(true)}
            className={cn(
              "rounded-md p-1.5 transition-colors",
              vertical
                ? "bg-hibiscus-50 text-hibiscus-600"
                : "text-slate-400 hover:bg-slate-100"
            )}
          >
            <RectangleVertical className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
