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

// "rss2" = formato clássico do G1 (<rss><channel><item>). "atom" = formato
// do Google Alertas (<feed><entry>) — estrutura de tags e datas diferentes,
// por isso cada categoria também guarda o formato do próprio feed.
type FeedFormat = "rss2" | "atom";

const FEEDS: Record<string, { url: string; format: FeedFormat }> = {
  geral: { url: "https://g1.globo.com/rss/g1/", format: "rss2" },
  turismo: { url: "https://g1.globo.com/rss/g1/turismo-e-viagem/", format: "rss2" },
  alagoas: { url: "https://g1.globo.com/rss/g1/al/alagoas/", format: "rss2" },
  // Google Alertas, configurados pra entregar como feed RSS (Atom) em vez
  // de e-mail — ver google.com/alerts.
  nordeste: {
    url: "https://www.google.com/alerts/feeds/12072209538546298245/14305717745939241973",
    format: "atom",
  },
  hibiscus: {
    url: "https://www.google.com/alerts/feeds/12072209538546298245/4882315839834075618",
    format: "atom",
  },
  maceio: {
    url: "https://www.google.com/alerts/feeds/12072209538546298245/3099495718455677185",
    format: "atom",
  },
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
  // Formas do verbo "matar" (em vez de frases fixas tipo "condenado por
  // matar") — uma frase fixa não pega variações como "condenado a 22 anos
  // de prisão por matar", onde algo se intromete entre as duas palavras.
  "matar", "matou", "matado", "matada",
  "terrorista", "terrorismo", "guerra em",
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

// O título/resumo do Google Alertas vem com tags <b> destacando o termo
// buscado e com entidades HTML escapadas duas vezes (ex: "&amp;nbsp;"),
// já que o feed inteiro é XML mas o conteúdo dentro é HTML por natureza.
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_match, code) => String.fromCharCode(Number(code)));
}

function stripHtml(text: string): string {
  return decodeHtmlEntities(text.replace(/<[^>]+>/g, "")).trim();
}

// O link de cada item do Google Alertas passa por um redirecionador
// (google.com/url?...&url=<destino real>&...) — extrai o destino real pra
// não fazer o player depender de um redirect extra do Google.
function extractRealLink(googleUrl: string): string {
  try {
    return new URL(googleUrl).searchParams.get("url") ?? googleUrl;
  } catch {
    return googleUrl;
  }
}

function textOf(node: unknown): string {
  if (node && typeof node === "object") {
    return String((node as Record<string, unknown>)["#text"] ?? "");
  }
  return String(node ?? "");
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

// deno-lint-ignore no-explicit-any
function parseRss2(data: any, categoria: string): NewsItem[] {
  const rawItems = data?.rss?.channel?.item;
  return (Array.isArray(rawItems) ? rawItems : [rawItems]).filter(Boolean).map((item) => {
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

// deno-lint-ignore no-explicit-any
function parseAtom(data: any, categoria: string): NewsItem[] {
  const rawEntries = data?.feed?.entry;
  return (Array.isArray(rawEntries) ? rawEntries : [rawEntries]).filter(Boolean).map((entry) => ({
    title: stripHtml(textOf(entry.title)),
    subtitle: stripHtml(textOf(entry.content)),
    link: extractRealLink(String(entry.link?.["@_href"] ?? "")),
    pubDate: String(entry.published ?? ""),
    imageUrl: null,
    categoria,
  }));
}

// O Google Alertas não manda imagem nenhuma no feed — só o link da matéria
// original. Busca a página real e lê a meta tag og:image (praticamente
// todo portal de notícia marca uma), com timeout curto pra não travar a
// resposta se algum site estiver lento ou bloquear o fetch. Falha em
// silêncio: pior caso é o item ficar sem imagem, igual hoje.
async function fetchOgImage(articleUrl: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(articleUrl, {
      headers: { "User-Agent": "HibiscusTV/1.0 (+https://hibiscus-tv.vercel.app)" },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const html = await res.text();
    const match =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ??
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

async function fetchFeed(
  categoria: string,
  feedUrl: string,
  format: FeedFormat
): Promise<NewsItem[]> {
  const res = await fetch(feedUrl, {
    headers: { "User-Agent": "HibiscusTV/1.0 (+https://hibiscus-tv.vercel.app)" },
  });
  if (!res.ok) return [];
  const xml = await res.text();

  const parser = new XMLParser({ ignoreAttributes: false, cdataPropName: "__cdata" });
  const data = parser.parse(xml);

  const items = format === "atom" ? parseAtom(data, categoria) : parseRss2(data, categoria);
  const filtered = items
    .slice(0, RAW_ITEMS_PER_FEED)
    .filter((item) => !isHeavyContent(item.title, item.subtitle))
    .slice(0, ITEMS_PER_FEED);

  if (format !== "atom") return filtered;

  return Promise.all(
    filtered.map(async (item) => ({ ...item, imageUrl: await fetchOgImage(item.link) }))
  );
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
      categorias.map((c) => fetchFeed(c, FEEDS[c].url, FEEDS[c].format))
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
