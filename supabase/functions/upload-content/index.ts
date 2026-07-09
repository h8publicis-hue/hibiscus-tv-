import { createClient } from "npm:@supabase/supabase-js@2";
import { createRemoteJWKSet, jwtVerify } from "npm:jose@5";

// Este projeto usa Firebase Auth (não Supabase Auth) para o painel
// administrativo. Esta function verifica o ID token do Firebase
// manualmente (via JWKS público do Google) antes de autorizar o
// upload/exclusão de arquivos, usando a chave secreta do Supabase
// (nunca exposta ao navegador) para gravar no Storage.
//
// Por isso é implantada com verify_jwt = false: a autenticação é
// implementada manualmente aqui dentro (equivalente a uma API key
// customizada), não pelo gateway de JWT do Supabase.

const FIREBASE_PROJECT_ID = Deno.env.get("FIREBASE_PROJECT_ID") ?? "hibiscus-beach";
const JWKS = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
  )
);

const IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const VIDEO_TYPES = ["video/mp4", "video/webm"];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 200 * 1024 * 1024;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let uid: string;
  try {
    uid = await verifyFirebaseToken(req.headers.get("Authorization"));
  } catch {
    return jsonResponse({ error: "Não autenticado." }, 401);
  }

  const SUPABASE_SECRET_KEYS = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")!);
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    SUPABASE_SECRET_KEYS["default"]
  );

  try {
    if (req.method === "POST") {
      const formData = await req.formData();
      const file = formData.get("file");

      if (!(file instanceof File)) {
        return jsonResponse({ error: "Arquivo não enviado." }, 400);
      }

      const isImage = IMAGE_TYPES.includes(file.type);
      const isVideo = VIDEO_TYPES.includes(file.type);

      if (!isImage && !isVideo) {
        return jsonResponse(
          { error: "Formato não suportado. Use JPG, PNG, WEBP, MP4 ou WEBM." },
          400
        );
      }
      if (isImage && file.size > MAX_IMAGE_SIZE) {
        return jsonResponse({ error: "Imagem excede o tamanho máximo de 10 MB." }, 400);
      }
      if (isVideo && file.size > MAX_VIDEO_SIZE) {
        return jsonResponse({ error: "Vídeo excede o tamanho máximo de 200 MB." }, 400);
      }

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${uid}/${Date.now()}_${safeName}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from("contents")
        .upload(path, file, { contentType: file.type, upsert: false });

      if (uploadError) {
        return jsonResponse({ error: uploadError.message }, 500);
      }

      const { data: publicUrlData } = supabaseAdmin.storage.from("contents").getPublicUrl(path);

      return jsonResponse({ url: publicUrlData.publicUrl, path });
    }

    if (req.method === "DELETE") {
      const body = await req.json().catch(() => null);
      const path = body?.path;

      if (!path || typeof path !== "string") {
        return jsonResponse({ error: "path é obrigatório." }, 400);
      }

      const { error: deleteError } = await supabaseAdmin.storage.from("contents").remove([path]);

      if (deleteError) {
        return jsonResponse({ error: deleteError.message }, 500);
      }

      return jsonResponse({ success: true });
    }

    return jsonResponse({ error: "Método não suportado." }, 405);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return jsonResponse({ error: message }, 500);
  }
});
