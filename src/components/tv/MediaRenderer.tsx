"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { AlertTriangle, ImageOff, Megaphone, Sparkles } from "lucide-react";
import type { Content, Rotacao } from "@/types";
import { cn } from "@/lib/utils";

interface MediaRendererProps {
  content: Content;
  onEnded?: () => void;
  className?: string;
}

export function MediaRenderer({ content, onEnded, className }: MediaRendererProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-slate-900 text-white">
        <ImageOff className="h-10 w-10 text-white/50" />
        <p className="text-sm text-white/70">
          Não foi possível carregar este conteúdo.
        </p>
      </div>
    );
  }

  switch (content.tipo) {
    case "imagem":
      return (
        <div className={cn("relative h-full w-full bg-black", className)}>
          <RotatedMedia rotacao={content.rotacao}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={content.arquivoUrl ?? undefined}
              alt={content.titulo}
              className="h-full w-full object-contain"
              onError={() => setFailed(true)}
            />
          </RotatedMedia>
        </div>
      );

    case "video":
      return (
        <div className={cn("relative h-full w-full bg-black", className)}>
          <RotatedMedia rotacao={content.rotacao}>
            <video
              src={content.arquivoUrl ?? undefined}
              className="h-full w-full object-contain"
              autoPlay
              muted
              playsInline
              controls={false}
              onEnded={onEnded}
              onError={() => setFailed(true)}
            />
          </RotatedMedia>
        </div>
      );

    case "iframe":
      return (
        <div className={cn("relative h-full w-full bg-white", className)}>
          {content.iframeUrl ? (
            <iframe
              src={content.iframeUrl}
              className="h-full w-full border-0"
              onError={() => setFailed(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-900 text-white/70">
              Link não configurado
            </div>
          )}
        </div>
      );

    case "urgente":
      return (
        <div
          className={cn(
            "flex h-full w-full flex-col items-center justify-center gap-6 bg-gradient-to-br from-red-600 via-red-700 to-red-900 px-16 text-center text-white",
            className
          )}
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/15">
            <AlertTriangle className="h-10 w-10" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/80">
            Aviso urgente
          </p>
          <h2 className="max-w-4xl text-5xl font-bold leading-tight">
            {content.titulo}
          </h2>
          {content.texto || content.descricao ? (
            <p className="max-w-3xl text-xl text-white/90">
              {content.texto || content.descricao}
            </p>
          ) : null}
        </div>
      );

    case "promocao":
      return (
        <div
          className={cn(
            "flex h-full w-full flex-col items-center justify-center gap-6 bg-gradient-to-br from-hibiscus-500 via-hibiscus-600 to-tropical-700 px-16 text-center text-white",
            className
          )}
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/15">
            <Sparkles className="h-10 w-10" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/80">
            Promoção
          </p>
          <h2 className="max-w-4xl text-5xl font-bold leading-tight">
            {content.titulo}
          </h2>
          {content.texto || content.descricao ? (
            <p className="max-w-3xl text-xl text-white/90">
              {content.texto || content.descricao}
            </p>
          ) : null}
        </div>
      );

    case "texto":
    default:
      return (
        <div
          className={cn(
            "flex h-full w-full flex-col items-center justify-center gap-6 bg-gradient-to-br from-tropical-700 via-tropical-800 to-hibiscus-900 px-16 text-center text-white",
            className
          )}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15">
            <Megaphone className="h-8 w-8" />
          </div>
          <h2 className="max-w-4xl text-4xl font-bold leading-tight">
            {content.titulo}
          </h2>
          {content.texto || content.descricao ? (
            <p className="max-w-3xl whitespace-pre-line text-lg text-white/90">
              {content.texto || content.descricao}
            </p>
          ) : null}
        </div>
      );
  }
}

/**
 * Gira o conteúdo (imagem/vídeo) em 90/180/270°. Para 90/270, a caixa
 * precisa trocar largura por altura para continuar preenchendo o
 * container (que pode ser a tela cheia da TV ou a prévia do admin, de
 * tamanhos bem diferentes) — por isso medimos o container via
 * ResizeObserver em vez de depender de vw/vh fixos.
 */
function RotatedMedia({
  rotacao,
  children,
}: {
  rotacao?: Rotacao;
  children: React.ReactNode;
}) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null
  );

  const normalized = rotacao ?? 0;
  const swapped = normalized === 90 || normalized === 270;

  useLayoutEffect(() => {
    if (!swapped) return;
    const parent = anchorRef.current?.parentElement;
    if (!parent) return;

    function measure() {
      if (!parent) return;
      setSize({ width: parent.clientWidth, height: parent.clientHeight });
    }
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(parent);
    return () => observer.disconnect();
  }, [swapped]);

  if (normalized === 0) {
    return <>{children}</>;
  }

  if (!swapped) {
    return (
      <div className="h-full w-full" style={{ transform: "rotate(180deg)" }}>
        {children}
      </div>
    );
  }

  return (
    <div
      ref={anchorRef}
      className="absolute left-1/2 top-1/2"
      style={
        size
          ? {
              width: size.height,
              height: size.width,
              transform: `translate(-50%, -50%) rotate(${normalized}deg)`,
            }
          : { visibility: "hidden" }
      }
    >
      {children}
    </div>
  );
}
