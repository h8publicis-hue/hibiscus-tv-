"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Palmtree } from "lucide-react";
import { MediaRenderer } from "@/components/tv/MediaRenderer";
import { FullscreenButton } from "@/components/tv/FullscreenButton";
import { ConnectionIndicator } from "@/components/tv/ConnectionIndicator";
import {
  watchScreenByScreenId,
  watchActiveContents,
  watchPlaylistForScreen,
  sendHeartbeat,
  logScreenExhibition,
} from "@/lib/firestore";
import { filterPlayableContents, sortContentsByPriority } from "@/utils/screen";
import type { Content, Playlist, Screen } from "@/types";

const HEARTBEAT_INTERVAL_MS = 30_000;

export function TvPlayer({ screenId }: { screenId: string }) {
  const [screen, setScreen] = useState<Screen | null | undefined>(undefined);
  const [allContents, setAllContents] = useState<Content[]>([]);
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [offline, setOffline] = useState(() =>
    typeof navigator === "undefined" ? false : !navigator.onLine
  );

  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loggedKeyRef = useRef<string | null>(null);
  const advancedRef = useRef(false);

  // Localiza a tela pelo screenId e mantém em tempo real
  useEffect(() => {
    const unsub = watchScreenByScreenId(screenId, setScreen);
    return () => unsub();
  }, [screenId]);

  // Conteúdos ativos e playlist da tela, ambos em tempo real. A query já
  // filtra status "ativo" no servidor: é o que a regra do Firestore exige
  // para permitir a leitura sem autenticação (ver firestore.rules).
  useEffect(() => {
    const unsub = watchActiveContents(setAllContents);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!screen) return;
    const unsub = watchPlaylistForScreen(screen.id, setPlaylist);
    return () => unsub();
    // Reassina apenas quando o doc id muda, não a cada snapshot da tela
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen?.id]);

  // Heartbeat: atualiza lastSeenAt a cada 30s
  useEffect(() => {
    if (!screen) return;
    sendHeartbeat(screen.id).catch(() => {});
    const interval = setInterval(() => {
      sendHeartbeat(screen.id).catch(() => {});
    }, HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen?.id]);

  // Indicador de conexão baseado no estado da rede do navegador
  useEffect(() => {
    function goOnline() {
      setOffline(false);
    }
    function goOffline() {
      setOffline(true);
    }
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  const playableContents = useMemo<Content[]>(() => {
    if (!screen) return [];
    const playable = filterPlayableContents(allContents);

    if (playlist && playlist.conteudos.length > 0) {
      const map = new Map(playable.map((c) => [c.id, c]));
      return [...playlist.conteudos]
        .sort((a, b) => a.ordem - b.ordem)
        .map((item) => map.get(item.contentId))
        .filter((c): c is Content => Boolean(c));
    }

    const relevant = playable.filter((c) => {
      const explicitlyAssigned = c.telas?.includes(screen.id);
      const matchesSector =
        (c.telas?.length ?? 0) === 0 &&
        (c.unidade === "grupo" || c.unidade === screen.unidade) &&
        c.setor === screen.setor;
      return explicitlyAssigned || matchesSector;
    });

    return sortContentsByPriority(relevant);
  }, [allContents, playlist, screen]);

  // Índice seguro: recalculado a cada render em vez de corrigido em efeito,
  // para não "pular" para o início sempre que a lista mudar de tamanho.
  const safeIndex =
    playableContents.length > 0 ? currentIndex % playableContents.length : 0;
  const current = playableContents[safeIndex] ?? null;

  function advance() {
    if (advancedRef.current) return;
    advancedRef.current = true;
    setCurrentIndex((prev) => {
      if (playableContents.length === 0) return 0;
      return (prev + 1) % playableContents.length;
    });
  }

  // Agenda a troca automática de conteúdo conforme duracaoEmSegundos
  // (para vídeos, o evento onEnded do player também pode disparar a troca)
  useEffect(() => {
    advancedRef.current = false;
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    if (!current) return;

    const durationMs = Math.max(current.duracaoEmSegundos, 3) * 1000;
    advanceTimerRef.current = setTimeout(advance, durationMs);

    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  // Registra exibição no screenLogs (uma vez por troca de conteúdo)
  useEffect(() => {
    if (!screen || !current) return;
    const key = `${screen.id}:${current.id}:${currentIndex}`;
    if (loggedKeyRef.current === key) return;
    loggedKeyRef.current = key;
    logScreenExhibition({
      screenId: screen.id,
      contentId: current.id,
      duracaoEmSegundos: current.duracaoEmSegundos,
    }).catch(() => {});
  }, [screen, current, currentIndex]);

  // ---------- Renderização ----------

  if (screen === undefined) {
    return <PlayerShell><LoadingState /></PlayerShell>;
  }

  if (screen === null) {
    return (
      <PlayerShell>
        <InstitutionalScreen message="Tela não encontrada." />
      </PlayerShell>
    );
  }

  if (screen.status !== "ativa") {
    return (
      <PlayerShell showFullscreen>
        <InstitutionalScreen message="Esta tela está temporariamente inativa." />
      </PlayerShell>
    );
  }

  if (!current) {
    return (
      <PlayerShell showFullscreen offline={offline}>
        <InstitutionalScreen message="Nenhum conteúdo programado no momento." />
      </PlayerShell>
    );
  }

  return (
    <PlayerShell showFullscreen offline={offline}>
      <MediaRenderer key={current.id} content={current} onEnded={advance} />
    </PlayerShell>
  );
}

function PlayerShell({
  children,
  showFullscreen,
  offline,
}: {
  children: React.ReactNode;
  showFullscreen?: boolean;
  offline?: boolean;
}) {
  return (
    <div className="fixed inset-0 h-screen w-screen overflow-hidden bg-black">
      <div className="animate-fade-in h-full w-full">{children}</div>
      {showFullscreen && <FullscreenButton />}
      <ConnectionIndicator show={Boolean(offline)} />
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-slate-950">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
    </div>
  );
}

function InstitutionalScreen({ message }: { message: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 bg-gradient-to-br from-tropical-900 via-tropical-950 to-hibiscus-950 text-white">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/10">
        <Palmtree className="h-12 w-12" />
      </div>
      <div className="text-center">
        <p className="text-3xl font-bold tracking-tight">Hibiscus TV</p>
        <p className="mt-3 text-lg text-white/70">{message}</p>
      </div>
    </div>
  );
}
