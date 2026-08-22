"use client";

import { useLayoutEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Cake,
  HardHat,
  ImageOff,
  Megaphone,
  Sparkles,
  User,
  UserPlus,
} from "lucide-react";
import type { Content, Rotacao } from "@/types";
import { cn } from "@/lib/utils";
import { WeatherCard } from "@/components/tv/WeatherCard";
import { NewsCard } from "@/components/tv/NewsCard";

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

  // A rotação é aplicada uma única vez aqui fora, envolvendo qualquer tipo
  // de conteúdo — não só imagem/vídeo. Um aviso/texto/notícia também pode
  // precisar girar quando a tela é vertical mas o dispositivo físico não
  // gira sozinho.
  return (
    <RotatedMedia rotacao={content.rotacao}>
      {renderConteudo(content, className, onEnded, () => setFailed(true))}
    </RotatedMedia>
  );
}

function renderConteudo(
  content: Content,
  className: string | undefined,
  onEnded: (() => void) | undefined,
  onError: () => void
) {
  switch (content.tipo) {
    case "imagem":
      return (
        <div className={cn("relative h-full w-full bg-black", className)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={content.arquivoUrl ?? undefined}
            alt={content.titulo}
            className="h-full w-full object-contain"
            onError={onError}
          />
        </div>
      );

    case "video":
      return (
        <div className={cn("relative h-full w-full bg-black", className)}>
          <video
            src={content.arquivoUrl ?? undefined}
            className="h-full w-full object-contain"
            autoPlay
            muted
            playsInline
            controls={false}
            onEnded={onEnded}
            onError={onError}
          />
        </div>
      );

    case "iframe":
      return (
        <div className={cn("relative h-full w-full bg-white", className)}>
          {content.iframeUrl ? (
            <iframe
              src={withAutoplay(content.iframeUrl)}
              className="h-full w-full border-0"
              allow="autoplay; encrypted-media; fullscreen"
              onError={onError}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-900 text-white/70">
              Link não configurado
            </div>
          )}
        </div>
      );

    case "clima":
      return (
        <WeatherCard
          cidade={content.cidade}
          latitude={content.latitude}
          longitude={content.longitude}
        />
      );

    case "noticias":
      return <NewsCard categorias={content.noticiaCategorias} />;

    case "urgente":
      return (
        <div
          className={cn(
            "flex h-full w-full flex-col items-center justify-center gap-6 bg-gradient-to-br from-red-600 via-red-700 to-red-900 px-16 text-center text-white",
            className
          )}
        >
          <div className="relative flex h-20 w-20 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-white/30" />
            <span className="absolute inset-0 animate-pulse rounded-full bg-white/10" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white/15">
              <AlertTriangle className="h-10 w-10" />
            </div>
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

    case "boasvindas":
      return (
        <PhotoTemplate
          className={className}
          fotoUrl={content.arquivoUrl}
          accentFrom="from-tropical-600"
          accentVia="via-tropical-700"
          accentTo="to-navy-900"
          icon={<UserPlus className="h-10 w-10" />}
          eyebrow="Boas-vindas"
          titulo={content.titulo}
          texto={content.texto || content.descricao}
        />
      );

    case "avisoseguranca":
      return (
        <PhotoTemplate
          className={className}
          fotoUrl={content.arquivoUrl}
          accentFrom="from-amber-500"
          accentVia="via-amber-600"
          accentTo="to-navy-950"
          icon={<HardHat className="h-10 w-10" />}
          eyebrow="Aviso de Segurança"
          titulo={content.titulo}
          texto={content.texto || content.descricao}
        />
      );

    case "aniversariante":
      return (
        <div
          className={cn(
            "flex h-full w-full flex-col gap-8 bg-gradient-to-br from-navy-900 via-navy-950 to-hibiscus-950 px-16 py-14 text-white",
            className
          )}
        >
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15">
              <Cake className="h-7 w-7" />
            </div>
            <h2 className="text-4xl font-bold leading-tight">
              {content.titulo || "Aniversariantes"}
            </h2>
          </div>
          <div className="flex flex-1 flex-wrap content-start gap-6 overflow-hidden">
            {content.aniversariantes.length === 0 ? (
              <p className="text-lg text-white/70">
                Nenhum aniversariante cadastrado.
              </p>
            ) : (
              content.aniversariantes.map((pessoa, i) => (
                <div
                  key={`${pessoa.nome}-${i}`}
                  // Largura fixa (não um grid-cols dinâmico baseado na
                  // quantidade) — com só 1-2 pessoas, um grid de poucas
                  // colunas faria o card esticar pra ocupar a largura
                  // toda, e como a foto é quadrada, a altura ia junto,
                  // estourando a tela. Card de tamanho fixo sempre cabe,
                  // não importa quantas pessoas tenham na lista.
                  className="flex w-[420px] flex-col overflow-hidden rounded-2xl bg-white/10"
                >
                  <div className="flex aspect-square w-full items-center justify-center overflow-hidden bg-white/10">
                    {pessoa.fotoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={pessoa.fotoUrl}
                        alt={pessoa.nome}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-16 w-16 text-white/40" />
                    )}
                  </div>
                  <div className="flex flex-col gap-1 p-4">
                    <span className="text-2xl font-bold leading-tight">
                      {pessoa.data}
                    </span>
                    <span className="truncate text-lg font-semibold">
                      {pessoa.nome}
                    </span>
                    {pessoa.cargo && (
                      <span className="truncate text-sm text-white/60">
                        {pessoa.cargo}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
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
 * Layout compartilhado por "boasvindas" e "avisoseguranca": foto ocupando
 * a maior parte do quadro com um painel colorido de texto sobreposto no
 * canto. Sem foto, cai num layout central com ícone — mesmo padrão visual
 * de "promocao"/"urgente" — para o conteúdo nunca ficar vazio.
 */
function PhotoTemplate({
  className,
  fotoUrl,
  accentFrom,
  accentVia,
  accentTo,
  icon,
  eyebrow,
  titulo,
  texto,
}: {
  className?: string;
  fotoUrl: string | null;
  accentFrom: string;
  accentVia: string;
  accentTo: string;
  icon: React.ReactNode;
  eyebrow: string;
  titulo: string;
  texto: string | null;
}) {
  if (!fotoUrl) {
    return (
      <div
        className={cn(
          "flex h-full w-full flex-col items-center justify-center gap-6 bg-gradient-to-br px-16 text-center text-white",
          accentFrom,
          accentVia,
          accentTo,
          className
        )}
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/15">
          {icon}
        </div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/80">
          {eyebrow}
        </p>
        <h2 className="max-w-4xl text-5xl font-bold leading-tight">
          {titulo}
        </h2>
        {texto && <p className="max-w-3xl text-xl text-white/90">{texto}</p>}
      </div>
    );
  }

  return (
    <div className={cn("relative h-full w-full bg-black", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={fotoUrl}
        alt={titulo}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-gradient-to-br px-16 py-12 text-white",
          accentFrom,
          accentVia,
          accentTo,
          "bg-opacity-90"
        )}
        style={{ opacity: 0.94 }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
            {icon}
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/80">
            {eyebrow}
          </p>
        </div>
        <h2 className="max-w-4xl text-4xl font-bold leading-tight">
          {titulo}
        </h2>
        {texto && <p className="max-w-3xl text-lg text-white/90">{texto}</p>}
      </div>
    </div>
  );
}

/**
 * Liga autoplay (mudo, já que navegadores só autoplayam vídeo sem som)
 * para provedores conhecidos, para o conteúdo já começar rodando sozinho
 * em vez de esperar alguém clicar em play numa TV sem controle remoto.
 */
function withAutoplay(url: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtube.com" || host === "youtube-nocookie.com") {
      parsed.searchParams.set("autoplay", "1");
      parsed.searchParams.set("mute", "1");
      parsed.searchParams.set("playsinline", "1");
      return parsed.toString();
    }

    if (host === "player.vimeo.com") {
      parsed.searchParams.set("autoplay", "1");
      parsed.searchParams.set("muted", "1");
      return parsed.toString();
    }

    return url;
  } catch {
    return url;
  }
}

/**
 * Gira o conteúdo (imagem/vídeo/texto/etc) em 90/180/270°. Para 90/270, a
 * caixa precisa trocar largura por altura para continuar preenchendo o
 * container (que pode ser a tela cheia da TV ou a prévia do admin, de
 * tamanhos bem diferentes) — por isso medimos o container via
 * ResizeObserver em vez de depender de vw/vh fixos.
 *
 * O wrapper "relative" próprio é essencial: sem ele, o `position: absolute`
 * do conteúdo giraria em relação ao ancestral posicionado mais próximo —
 * que pode ser a própria tela já girada pela orientação forçada da TV
 * (ver `rotacaoGraus` da tela), somando as duas rotações e quebrando o
 * layout. Com o wrapper, cada camada de rotação fica isolada na sua
 * própria caixa, então as duas podem coexistir sem interferir uma na
 * outra.
 */
function RotatedMedia({
  rotacao,
  children,
}: {
  rotacao?: Rotacao;
  children: React.ReactNode;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null
  );

  const normalized = rotacao ?? 0;
  const swapped = normalized === 90 || normalized === 270;

  useLayoutEffect(() => {
    if (!swapped) return;
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    function measure() {
      if (!wrapper) return;
      setSize({ width: wrapper.clientWidth, height: wrapper.clientHeight });
    }
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [swapped]);

  if (normalized === 0) {
    return <>{children}</>;
  }

  if (!swapped) {
    return (
      <div
        className="h-full w-full"
        style={{
          transform: "rotate(180deg)",
          willChange: "transform",
          WebkitBackfaceVisibility: "hidden",
          backfaceVisibility: "hidden",
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative h-full w-full overflow-hidden">
      <div
        className="absolute left-1/2 top-1/2"
        style={
          size
            ? {
                width: size.height,
                height: size.width,
                transform: `translate3d(-50%, -50%, 0) rotate(${normalized}deg)`,
                // Mesmo motivo do PlayerShell: mantém a camada de GPU
                // pronta pra evitar 1-2 quadros sem girar quando um
                // <video> novo é montado dentro dessa rotação.
                willChange: "transform",
                WebkitBackfaceVisibility: "hidden",
                backfaceVisibility: "hidden",
              }
            : { visibility: "hidden" }
        }
      >
        {children}
      </div>
    </div>
  );
}
