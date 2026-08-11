const FUNCTIONS_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""}/functions/v1`;

export type NoticiaCategoria = "geral" | "turismo" | "bahia";

export const NOTICIA_CATEGORIAS: { value: NoticiaCategoria; label: string }[] = [
  { value: "geral", label: "Geral" },
  { value: "turismo", label: "Turismo e Viagem" },
  { value: "bahia", label: "Bahia" },
];

export interface NewsItem {
  title: string;
  subtitle: string;
  link: string;
  pubDate: string;
  imageUrl: string | null;
}

export async function fetchNews(categoria: NoticiaCategoria): Promise<NewsItem[]> {
  const res = await fetch(
    `${FUNCTIONS_URL}/news-feed?categoria=${encodeURIComponent(categoria)}`
  );
  if (!res.ok) throw new Error("Não foi possível carregar as notícias.");
  const data = await res.json();
  return data.items ?? [];
}
