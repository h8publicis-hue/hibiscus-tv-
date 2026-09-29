"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Newspaper } from "lucide-react";
import {
  fetchNews,
  NOTICIA_CATEGORIAS,
  type NewsItem,
  type NoticiaCategoria,
} from "@/lib/news";

const REFRESH_INTERVAL_MS = 15 * 60 * 1000; // 15 minutos
const MAX_VISIBLE = 5;

interface NewsCardProps {
  categorias: NoticiaCategoria[] | null;
}

export function NewsCard({ categorias }: NewsCardProps) {
  const [items, setItems] = useState<NewsItem[] | null>(null);
  const [failed, setFailed] = useState(false);
  const key = categorias?.join(",") ?? "";

  useEffect(() => {
    if (!categorias || categorias.length === 0) {
      setFailed(true);
      return;
    }

    let cancelled = false;
    setFailed(false);

    function load() {
      fetchNews(categorias as NoticiaCategoria[])
        .then((data) => {
          if (!cancelled) setItems(data);
        })
        .catch(() => {
          if (!cancelled) setFailed(true);
        });
    }

    load();
    const interval = setInterval(load, REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const categoriaLabel = (categorias ?? [])
    .map((c) => NOTICIA_CATEGORIAS.find((n) => n.value === c)?.label ?? c)
    .join(" + ") || "Notícias";

  if (failed || !categorias || categorias.length === 0) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-gradient-to-br from-navy-900 via-navy-950 to-hibiscus-950 text-white">
        <Newspaper className="h-14 w-14 text-white/60" />
        <p className="text-lg text-white/80">
          Não foi possível carregar as notícias.
        </p>
      </div>
    );
  }

  if (!items) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-navy-900 via-navy-950 to-hibiscus-950">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col gap-6 bg-gradient-to-br from-navy-900 via-navy-950 to-hibiscus-950 px-16 py-12 text-white">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
          <Newspaper className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-white/60">
            Notícias
          </p>
          <p className="text-xl font-bold">{categoriaLabel}</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-center gap-4">
        {items.length === 0 && (
          <p className="text-lg text-white/70">
            Nenhuma notícia disponível no momento.
          </p>
        )}
        {items.slice(0, MAX_VISIBLE).map((item) => {
          const topico =
            NOTICIA_CATEGORIAS.find((c) => c.value === item.categoria)?.label ??
            item.categoria;
          return (
            <div
              key={item.link}
              className="flex items-center gap-5 rounded-2xl bg-white/10 p-4"
            >
              {/* Sem imagem, o card não reserva espaço de miniatura — evita
                  simular uma foto que não existe (a maioria das fontes do
                  Google Alertas não traz imagem). */}
              {item.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.imageUrl}
                  alt=""
                  className="h-20 w-32 shrink-0 rounded-xl object-cover"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
                  {topico}
                </p>
                <p className="mt-1 line-clamp-2 text-xl font-semibold leading-snug">
                  {item.title}
                </p>
                {item.subtitle && (
                  <p className="mt-1 line-clamp-2 text-base text-white/70">
                    {item.subtitle}
                  </p>
                )}
                {item.pubDate && (
                  <p className="mt-1 text-sm text-white/50">
                    {formatDistanceToNow(new Date(item.pubDate), {
                      locale: ptBR,
                      addSuffix: true,
                    })}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
