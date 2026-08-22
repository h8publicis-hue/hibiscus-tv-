import { Timestamp } from "firebase/firestore";
import type { NoticiaCategoria } from "@/lib/news";

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
  | "iframe"
  | "clima"
  | "noticias"
  | "aniversariante"
  | "boasvindas"
  | "avisoseguranca";

// Rotação aplicada na exibição de imagem/vídeo (graus, sentido horário).
export type Rotacao = 0 | 90 | 180 | 270;

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
  // @deprecated usar rotacaoGraus. Mantido só para ler telas antigas
  // (true equivale a rotacaoGraus: 90) — nunca mais escrito pelo app.
  rotacaoForcada?: boolean;
  // Gira toda a exibição via CSS em 0/90/180/270° quando o monitor físico
  // não gira sozinho (comum em telas verticais sem suporte por hardware,
  // ou montadas de cabeça para baixo). null/undefined = sem rotação.
  rotacaoGraus?: Rotacao | null;
  // Restringe a exibição de conteúdo ao horário de funcionamento da
  // unidade (formato "HH:mm"). null/undefined = exibe 24h por dia.
  horarioFuncionamento: { inicio: string; fim: string } | null;
  lastSeenAt: Timestamp | null;
  // Commit (NEXT_PUBLIC_BUILD_ID) que o player estava rodando no último
  // heartbeat. Comparado ao build atual do admin pra avisar quando uma
  // tela já ligada ainda não pegou um deploy novo. undefined/null em
  // telas antigas que nunca mandaram essa informação.
  lastBuildId?: string | null;
  observacoes: string;
  reloadRequestedAt: Timestamp | null;
  criadoEm: Timestamp;
  atualizadoEm: Timestamp;
}

export interface Aniversariante {
  nome: string;
  cargo: string;
  data: string;
  fotoUrl: string | null;
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
  rotacao: Rotacao;
  cidade: string | null;
  latitude: number | null;
  longitude: number | null;
  noticiaCategorias: NoticiaCategoria[];
  // Usado só no tipo "aniversariante" — lista de pessoas exibidas em grade.
  aniversariantes: Aniversariante[];
  // Intervalo mínimo (minutos) entre duas exibições deste conteúdo. Ele
  // continua no rodízio normalmente, mas se sua vez chegar antes desse
  // tempo ter passado desde a última vez, é pulado — sem isso, cada
  // conteúdo aparece uma vez a cada volta completa do rodízio.
  // null/undefined = sem restrição, aparece em toda volta.
  intervaloMinutos: number | null;
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
  { value: "clima", label: "Previsão do Tempo" },
  { value: "noticias", label: "Notícias" },
  { value: "aniversariante", label: "Aniversariantes" },
  { value: "boasvindas", label: "Boas-vindas" },
  { value: "avisoseguranca", label: "Aviso de Segurança" },
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
