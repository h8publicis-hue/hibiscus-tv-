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

// Manchetes de violência/crime/tragédia pesam no clima de recepções,
// restaurantes etc — filtramos por palavra-chave no título/subtítulo
// antes de servir ao player. É uma lista heurística (não é análise de
// conteúdo por IA): captura a maior parte do noticiário pesado do G1
// sem depender de nenhuma chamada externa extra.
const HEAVY_CONTENT_KEYWORDS = [
  "morre", "morreu", "morte", "morta", "morto", "mortos", "mortas",
  "assassinado", "assassinada", "assassinato", "homicidio", "feminicidio",
  "estupro", "estuprada", "estuprado", "abuso sexual", "abuso infantil",
  "importunacao sexual", "pedofilia", "violencia domestica",
  "violencia sexual", "agressao", "espancado", "espancada", "baleado",
  "baleada", "esfaqueado", "esfaqueada", "tiroteio", "chacina",
  "chacinado", "sequestro", "sequestrado", "trafico", "traficante",
  "assalto", "assaltante", "latrocinio", "execucao", "cadaver",
  "corpo encontrado", "corpo e encontrado", "carbonizado", "carbonizada",
  "vitima fatal", "vitimas fatais", "acidente fatal", "tragedia",
  "suicidio", "enforcado", "enforcada", "atropelado", "atropelada",
  "atropelamento", "bala perdida", "arma de fogo", "tiro na cabeca",
  "explosao", "incendio", "maus-tratos", "maus tratos", "crueldade animal",
  "furto", "furtado", "furtada", "roubo", "roubado", "roubada",
  "cocaina", "maconha", "entorpecentes",
  "presa suspeita de", "preso suspeito de", "preso por", "presa por",
  "suspeito de matar", "suspeita de matar", "acusado de matar",
  "condenado por matar", "terrorista", "terrorismo", "guerra em",
  "ataque em",
];

const ITEMS_PER_FEED = 8;
const RAW_ITEMS_PER_FEED = 20;
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

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function isHeavyContent(title: string, subtitle: string): boolean {
  const text = normalize(`${title} ${subtitle}`);
  return HEAVY_CONTENT_KEYWORDS.some((keyword) => text.includes(keyword));
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
    .slice(0, RAW_ITEMS_PER_FEED)
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
    })
    .filter((item) => !isHeavyContent(item.title, item.subtitle))
    .slice(0, ITEMS_PER_FEED);
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
