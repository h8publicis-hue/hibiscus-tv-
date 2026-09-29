const FUNCTIONS_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""}/functions/v1`;

export type NoticiaCategoria =
  | "geral"
  | "turismo"
  | "alagoas"
  | "nordeste"
  | "hibiscus"
  | "maceio";

export const NOTICIA_CATEGORIAS: { value: NoticiaCategoria; label: string }[] = [
  { value: "geral", label: "Geral" },
  { value: "turismo", label: "Turismo e Viagem" },
  { value: "alagoas", label: "Alagoas" },
  { value: "nordeste", label: "Turismo Nordeste" },
  { value: "hibiscus", label: "Hibiscus Beach Club" },
  { value: "maceio", label: "Turismo Maceió" },
];

export interface NewsItem {
  title: string;
  subtitle: string;
  link: string;
  pubDate: string;
  imageUrl: string | null;
  categoria: NoticiaCategoria;
}

export async function fetchNews(
  categorias: NoticiaCategoria[]
): Promise<NewsItem[]> {
  const res = await fetch(
    `${FUNCTIONS_URL}/news-feed?categoria=${encodeURIComponent(categorias.join(","))}`
  );
  if (!res.ok) throw new Error("Não foi possível carregar as notícias.");
  const data = await res.json();
  return data.items ?? [];
}
