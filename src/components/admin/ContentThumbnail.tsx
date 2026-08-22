import {
  AlertTriangle,
  Cake,
  Cloud,
  HardHat,
  ImageOff,
  Link2,
  Megaphone,
  Newspaper,
  Sparkles,
  UserPlus,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Content } from "@/types";

/**
 * Miniatura estática da lista de Conteúdos — só mostra imagem de verdade
 * pra imagem/vídeo/boas-vindas/aviso (arquivos já com cache longo, então
 * é barato) e um ícone colorido por tipo pra todo o resto. Não renderiza
 * o MediaRenderer real: com 20-30 linhas na tabela, tocar vídeo, carregar
 * iframes externos e disparar chamadas de clima/notícias em paralelo pra
 * cada linha custaria banda à toa — foi exatamente esse tipo de consumo
 * que corrigimos mais cedo nesta mesma sessão.
 */
export function ContentThumbnail({ content }: { content: Content }) {
  const base = "flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg";

  if (content.tipo === "imagem") {
    if (!content.arquivoUrl) {
      return (
        <div className={cn(base, "bg-slate-100 text-slate-400")}>
          <ImageOff className="h-4 w-4" />
        </div>
      );
    }
    return (
      <div className={cn(base, "bg-slate-900")}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={content.arquivoUrl}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  if (
    (content.tipo === "boasvindas" || content.tipo === "avisoseguranca") &&
    content.arquivoUrl
  ) {
    return (
      <div className={cn(base, "bg-slate-900")}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={content.arquivoUrl}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  const config: Record<string, { icon: React.ReactNode; className: string }> = {
    video: { icon: <Video className="h-4 w-4" />, className: "bg-slate-800 text-white" },
    iframe: { icon: <Link2 className="h-4 w-4" />, className: "bg-slate-700 text-white" },
    clima: { icon: <Cloud className="h-4 w-4" />, className: "bg-navy-900 text-white" },
    noticias: { icon: <Newspaper className="h-4 w-4" />, className: "bg-navy-950 text-white" },
    aniversariante: { icon: <Cake className="h-4 w-4" />, className: "bg-hibiscus-900 text-white" },
    boasvindas: { icon: <UserPlus className="h-4 w-4" />, className: "bg-tropical-700 text-white" },
    avisoseguranca: { icon: <HardHat className="h-4 w-4" />, className: "bg-amber-600 text-white" },
    promocao: { icon: <Sparkles className="h-4 w-4" />, className: "bg-hibiscus-600 text-white" },
    urgente: { icon: <AlertTriangle className="h-4 w-4" />, className: "bg-red-700 text-white" },
    texto: { icon: <Megaphone className="h-4 w-4" />, className: "bg-tropical-800 text-white" },
  };

  const { icon, className } = config[content.tipo] ?? {
    icon: <Megaphone className="h-4 w-4" />,
    className: "bg-slate-400 text-white",
  };

  return <div className={cn(base, className)}>{icon}</div>;
}
