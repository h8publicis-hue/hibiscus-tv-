import { XMLParser } from "npm:fast-xml-parser@4";

// Proxy de manchetes de notícias (feeds RSS do G1) para o player público
// da TV. Função pública (verify_jwt = false) porque não expõe nenhum
// dado sensível — só reempacota um RSS público em JSON, contornando o
// bloqueio de CORS que os feeds de notícia costumam ter no navegador
// (mesmo motivo pelo qual o clima usa Open-Meteo direto: aquele serviço
// permite CORS; RSS de portais de notícia, em geral, não permite).
//
// Aceita uma ou mais categorias separadas por vírgula (?categoria=turismo,alagoas):
// busca cada feed em paralelo e devolve uma lista única, mesclada por
// data de publicação e sem duplicatas.

const FEEDS: Record<string, string> = {
  geral: "https://g1.globo.com/rss/g1/",
  turismo: "https://g1.globo.com/rss/g1/turismo-e-viagem/",
  alagoas: "https://g1.globo.com/rss/g1/al/alagoas/",
};

const ITEMS_PER_FEED = 8;
const MAX_TOTAL_ITEMS = 12;

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

interface NewsItem {
  title: string;
  subtitle: string;
  link: string;
  pubDate: string;
  imageUrl: string | null;
  categoria: string;
}

async function fetchFeed(categoria: string, feedUrl: string): Promise<NewsItem[]> {
  const res = await fetch(feedUrl, {
    headers: { "User-Agent": "HibiscusTV/1.0 (+https://hibiscus-tv.vercel.app)" },
  });
  if (!res.ok) return [];
  const xml = await res.text();

  const parser = new XMLParser({ ignoreAttributes: false, cdataPropName: "__cdata" });
  const data = parser.parse(xml);

  const rawItems = data?.rss?.channel?.item;
  return (Array.isArray(rawItems) ? rawItems : [rawItems])
    .filter(Boolean)
    .slice(0, ITEMS_PER_FEED)
    .map((item) => {
      const description = item.description?.__cdata ?? item.description ?? "";
      return {
        title: String(item.title ?? "").trim(),
        subtitle: String(item["atom:subtitle"] ?? "").trim(),
        link: String(item.link ?? ""),
        pubDate: String(item.pubDate ?? ""),
        imageUrl: extractImage(description),
        categoria,
      };
    });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const categorias = (url.searchParams.get("categoria") ?? "geral")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);

  const invalidas = categorias.filter((c) => !FEEDS[c]);
  if (invalidas.length > 0 || categorias.length === 0) {
    return jsonResponse(
      {
        error: `Categoria inválida: ${invalidas.join(", ")}. Use: ${Object.keys(FEEDS).join(", ")}`,
      },
      400
    );
  }

  try {
    const results = await Promise.all(
      categorias.map((c) => fetchFeed(c, FEEDS[c]))
    );

    const seen = new Set<string>();
    const merged = results
      .flat()
      .filter((item) => {
        if (seen.has(item.link)) return false;
        seen.add(item.link);
        return true;
      })
      .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
      .slice(0, MAX_TOTAL_ITEMS);

    return jsonResponse({ categorias, items: merged });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return jsonResponse({ error: message }, 500);
  }
});
