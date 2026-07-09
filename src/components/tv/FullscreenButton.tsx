"use client";

import { useEffect, useState } from "react";
import { Maximize, Minimize } from "lucide-react";

export function FullscreenButton() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function handleChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // navegador pode bloquear fullscreen sem interação direta do usuário
    }
  }

  return (
    <button
      onClick={toggleFullscreen}
      className="fixed bottom-4 right-4 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white/70 backdrop-blur-sm transition-opacity hover:bg-black/50 hover:text-white opacity-40 hover:opacity-100"
      aria-label="Alternar tela cheia"
      title="Tela cheia"
    >
      {isFullscreen ? (
        <Minimize className="h-4 w-4" />
      ) : (
        <Maximize className="h-4 w-4" />
      )}
    </button>
  );
}
