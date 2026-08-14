import { createClient } from "npm:@supabase/supabase-js@2";
import { createRemoteJWKSet, jwtVerify } from "npm:jose@5";

// Devolve o total de bytes usados no bucket "contents", pra mostrar um
// aviso no Dashboard antes que o plano gratuito do Supabase (1GB) fique
// sem espaço. Staff-only, mesmo padrão de autenticação do upload-content.

const FIREBASE_PROJECT_ID = Deno.env.get("FIREBASE_PROJECT_ID") ?? "hibiscus-beach";
const JWKS = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
  )
);

const BUCKET = "contents";
// Plano gratuito do Supabase: 1GB de armazenamento total no projeto.
const FREE_PLAN_LIMIT_BYTES = 1024 * 1024 * 1024;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function verifyFirebaseToken(authHeader: string | null): Promise<string> {
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("token ausente");
  }
  const token = authHeader.slice("Bearer ".length);
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
    audience: FIREBASE_PROJECT_ID,
  });
  if (!payload.sub) throw new Error("token inválido");
  return payload.sub as string;
}

// deno-lint-ignore no-explicit-any
async function getTotalSize(supabaseAdmin: any, bucket: string): Promise<number> {
  let total = 0;

  async function walk(prefix: string) {
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .list(prefix, { limit: 1000 });
    if (error || !data) return;

    for (const item of data) {
      const childPrefix = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id === null) {
        // Storage representa "pastas" (prefixos) como entradas sem id.
        await walk(childPrefix);
      } else {
        total += item.metadata?.size ?? 0;
      }
    }
  }

  await walk("");
  return total;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    await verifyFirebaseToken(req.headers.get("Authorization"));
  } catch {
    return jsonResponse({ error: "Não autenticado." }, 401);
  }

  const SUPABASE_SECRET_KEYS = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")!);
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    SUPABASE_SECRET_KEYS["default"]
  );

  try {
    const usedBytes = await getTotalSize(supabaseAdmin, BUCKET);
    return jsonResponse({ usedBytes, limitBytes: FREE_PLAN_LIMIT_BYTES });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return jsonResponse({ error: message }, 500);
  }
});
