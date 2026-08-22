"use client";

import { useEffect, useRef, useState } from "react";
import { RectangleHorizontal, RectangleVertical } from "lucide-react";
import { MediaRenderer } from "@/components/tv/MediaRenderer";
import { cn } from "@/lib/utils";
import type { Content } from "@/types";

// Resolução de referência de uma TV real. O conteúdo é sempre renderizado
// nesse tamanho "de verdade" — exatamente como apareceria na tela física,
// com os mesmos paddings e tamanhos de fonte em escala de TV — e depois
// encolhido proporcionalmente (CSS scale) pra caber na caixinha pequena
// da prévia. Sem isso, um layout pensado pra 1920×1080 (ex: a grade de
// aniversariantes) simplesmente estoura uma caixa de poucas centenas de
// pixels em vez de aparecer em miniatura.
const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;

export function ContentPreview({ content }: { content: Content }) {
  const [vertical, setVertical] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  const canvasWidth = vertical ? CANVAS_HEIGHT : CANVAS_WIDTH;
  const canvasHeight = vertical ? CANVAS_WIDTH : CANVAS_HEIGHT;

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    function measure() {
      if (!frame) return;
      setScale(
        Math.min(frame.clientWidth / canvasWidth, frame.clientHeight / canvasHeight)
      );
    }
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [canvasWidth, canvasHeight]);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
      <div
        ref={frameRef}
        className={cn(
          "relative w-full overflow-hidden bg-slate-950",
          vertical ? "aspect-square" : "aspect-video"
        )}
      >
        <div
          className="absolute left-1/2 top-1/2 bg-slate-900"
          style={{
            width: canvasWidth,
            height: canvasHeight,
            transform: `translate(-50%, -50%) scale(${scale})`,
            visibility: scale ? "visible" : "hidden",
          }}
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
