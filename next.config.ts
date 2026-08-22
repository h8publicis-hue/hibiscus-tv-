import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    // Commit da Vercel embutido no bundle do cliente em build time — usado
    // pra saber se uma tela já ligada está rodando o deploy mais recente
    // (ver Screen.lastBuildId / TvPlayer). Fora da Vercel (dev local),
    // fica "dev" e a comparação de versão é simplesmente ignorada.
    NEXT_PUBLIC_BUILD_ID: process.env.VERCEL_GIT_COMMIT_SHA ?? "dev",
  },
};

export default nextConfig;
