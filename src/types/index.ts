import { Timestamp } from "firebase/firestore";

// ---------- Enums / literais ----------

export type Unidade = "hibiscus" | "mar-cia" | "grupo";

// Setores são configuráveis pelo admin (coleção "sectors" no Firestore,
// ver Configurações). O valor é o id do documento (slug), não um union
// fixo, já que novos setores podem ser criados em runtime.
export type Setor = string;

export type StatusConteudo = "ativo" | "inativo" | "rascunho";

export type Prioridade = "baixa" | "normal" | "alta" | "urgente";

export type TipoConteudo =
  | "imagem"
  | "video"
  | "texto"
  | "promocao"
  | "urgente"
  | "iframe";

export type StatusTela = "ativa" | "inativa";

export type Orientacao = "horizontal" | "vertical";

export type StatusPlaylist = "ativa" | "inativa";

export type UserRole = "admin" | "marketing" | "rh" | "viewer";

// ---------- Coleções Firestore ----------

export interface AppUser {
  uid: string;
  nome: string;
  email: string;
  role: UserRole;
  ativo: boolean;
  criadoEm: Timestamp;
}

export interface Screen {
  id: string;
  nome: string;
  unidade: Unidade;
  setor: Setor;
  localizacao: string;
  screenId: string;
  status: StatusTela;
  orientacao: Orientacao;
  lastSeenAt: Timestamp | null;
  observacoes: string;
  criadoEm: Timestamp;
  atualizadoEm: Timestamp;
}

export interface Content {
  id: string;
  titulo: string;
  descricao: string;
  tipo: TipoConteudo;
  arquivoUrl: string | null;
  arquivoPath: string | null;
  texto: string | null;
  iframeUrl: string | null;
  unidade: Unidade;
  setor: Setor;
  status: StatusConteudo;
  prioridade: Prioridade;
  duracaoEmSegundos: number;
  dataInicio: Timestamp | null;
  dataFim: Timestamp | null;
  telas: string[];
  criadoEm: Timestamp;
  atualizadoEm: Timestamp;
  criadoPor: string;
}

export interface PlaylistItem {
  contentId: string;
  ordem: number;
}

export interface Playlist {
  id: string;
  nome: string;
  unidade: Unidade;
  setor: Setor | "todos";
  telas: string[];
  conteudos: PlaylistItem[];
  status: StatusPlaylist;
  criadoEm: Timestamp;
  atualizadoEm: Timestamp;
}

export interface ScreenLog {
  id: string;
  screenId: string;
  contentId: string;
  exibidoEm: Timestamp;
  duracaoEmSegundos: number;
}

export interface Sector {
  id: string;
  label: string;
  criadoEm: Timestamp;
}

// ---------- Helpers de UI ----------

export const UNIDADES: { value: Unidade; label: string }[] = [
  { value: "grupo", label: "Grupo Hibiscus" },
  { value: "hibiscus", label: "Hibiscus Beach Club" },
  { value: "mar-cia", label: "Hibiscus Mar & Cia" },
];

export const TIPOS_CONTEUDO: { value: TipoConteudo; label: string }[] = [
  { value: "imagem", label: "Imagem" },
  { value: "video", label: "Vídeo" },
  { value: "texto", label: "Texto/Comunicado" },
  { value: "promocao", label: "Promoção" },
  { value: "urgente", label: "Aviso Urgente" },
  { value: "iframe", label: "Link/Iframe" },
];

export const PRIORIDADES: { value: Prioridade; label: string }[] = [
  { value: "urgente", label: "Urgente" },
  { value: "alta", label: "Alta" },
  { value: "normal", label: "Normal" },
  { value: "baixa", label: "Baixa" },
];

export const STATUS_CONTEUDO: { value: StatusConteudo; label: string }[] = [
  { value: "ativo", label: "Ativo" },
  { value: "inativo", label: "Inativo" },
  { value: "rascunho", label: "Rascunho" },
];

export const PRIORIDADE_PESO: Record<Prioridade, number> = {
  urgente: 0,
  alta: 1,
  normal: 2,
  baixa: 3,
};
