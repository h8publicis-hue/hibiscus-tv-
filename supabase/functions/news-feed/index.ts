import { XMLParser } from "npm:fast-xml-parser@4";

// Proxy de manchetes de notícias (feeds RSS do G1) para o player público
// da TV. Função pública (verify_jwt = false) porque não expõe nenhum
// dado sensível — só reempacota um RSS público em JSON, contornando o
// bloqueio de CORS que os feeds de notícia costumam ter no navegador
// (mesmo motivo pelo qual o clima usa Open-Meteo direto: aquele serviço
// permite CORS; RSS de portais de notícia, em geral, não permite).

const FEEDS: Record<string, string> = {
  geral: "https://g1.globo.com/rss/g1/",
  turismo: "https://g1.globo.com/rss/g1/turismo-e-viagem/",
  bahia: "https://g1.globo.com/rss/g1/ba/bahia/",
};

const MAX_ITEMS = 8;

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

function extractImage(description: unknown): string | null {
  if (typeof description !== "string") return null;
  const match = description.match(/<img[^>]+src="([^"]+)"/);
  return match ? match[1] : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const categoria = url.searchParams.get("categoria") ?? "geral";
  const feedUrl = FEEDS[categoria];

  if (!feedUrl) {
    return jsonResponse(
      { error: `Categoria inválida. Use: ${Object.keys(FEEDS).join(", ")}` },
      400
    );
  }

  try {
    const res = await fetch(feedUrl, {
      headers: { "User-Agent": "HibiscusTV/1.0 (+https://hibiscus-tv.vercel.app)" },
    });
    if (!res.ok) {
      return jsonResponse({ error: "Não foi possível buscar as notícias." }, 502);
    }
    const xml = await res.text();

    const parser = new XMLParser({
      ignoreAttributes: false,
      cdataPropName: "__cdata",
    });
    const data = parser.parse(xml);

    const rawItems = data?.rss?.channel?.item;
    const items = (Array.isArray(rawItems) ? rawItems : [rawItems])
      .filter(Boolean)
      .slice(0, MAX_ITEMS)
      .map((item) => {
        const description = item.description?.__cdata ?? item.description ?? "";
        return {
          title: String(item.title ?? "").trim(),
          subtitle: String(item["atom:subtitle"] ?? "").trim(),
          link: String(item.link ?? ""),
          pubDate: String(item.pubDate ?? ""),
          imageUrl: extractImage(description),
        };
      });

    return jsonResponse({ categoria, items });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return jsonResponse({ error: message }, 500);
  }
});
