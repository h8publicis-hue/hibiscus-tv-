"use client";

import { useEffect } from "react";

/**
 * Entra em tela cheia sozinho na primeira interação (clique/toque/tecla)
 * — a API de tela cheia do navegador exige um gesto real do usuário, não
 * pode ser chamada ao carregar a página. Depois disso não expõe nenhum
 * botão pra alternar: cada entrada/saída de tela cheia força o navegador
 * a reconstruir toda a árvore de composição da página, o que causava o
 * vídeo "girar" por um instante nas TVs com rotação forçada — um botão
 * fixo e sempre clicável era uma chance a mais desse glitch acontecer
 * toda vez que alguém tocava nele.
 */
export function AutoFullscreen() {
  useEffect(() => {
    if (document.fullscreenElement) return;

    function enter() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
      cleanup();
    }

    function cleanup() {
      window.removeEventListener("click", enter);
      window.removeEventListener("touchstart", enter);
      window.removeEventListener("keydown", enter);
    }

    window.addEventListener("click", enter);
    window.addEventListener("touchstart", enter);
    window.addEventListener("keydown", enter);
    return cleanup;
  }, []);

  return null;
}
