"use client";

import { MediaRenderer } from "@/components/tv/MediaRenderer";
import type { Content } from "@/types";

export function ContentPreview({ content }: { content: Content }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
      <div className="aspect-video w-full bg-slate-900">
        <MediaRenderer content={content} />
      </div>
      <div className="bg-white px-3 py-2 text-xs text-slate-500">
        Prévia — proporção 16:9
      </div>
    </div>
  );
}
