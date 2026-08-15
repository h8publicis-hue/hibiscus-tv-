export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Se o valor colado for um bloco <iframe ...></iframe> completo (comum
 * ao copiar do botão "Compartilhar > Incorporar" do YouTube e afins),
 * extrai só a URL do atributo src. Caso contrário devolve o valor como
 * veio, sem alterar.
 */
export function extractIframeSrc(value: string): string {
  const trimmed = value.trim();
  if (!trimmed.toLowerCase().includes("<iframe")) return value;

  const match = trimmed.match(/src\s*=\s*["']([^"']+)["']/i);
  return match ? match[1] : value;
}
