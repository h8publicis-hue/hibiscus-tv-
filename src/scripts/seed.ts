/**
 * Script de dados iniciais do Hibiscus TV.
 *
 * Cadastra as telas de exemplo descritas na especificação do projeto.
 * Requer um usuário admin já existente (ver README, seção "Bootstrap do
 * primeiro admin") para autenticar antes de gravar no Firestore, já que
 * as regras de segurança exigem staff autenticado para criar telas.
 *
 * Uso:
 *   SEED_ADMIN_EMAIL=voce@grupohibiscus.com SEED_ADMIN_PASSWORD=senha npm run seed
 */
import "dotenv/config";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { generateScreenId } from "../utils/screen";
import type { Screen } from "../types";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

type SeedScreen = Pick<
  Screen,
  "nome" | "unidade" | "setor" | "localizacao" | "orientacao" | "observacoes"
>;

const SCREENS: SeedScreen[] = [
  {
    nome: "Recepção Hibiscus",
    unidade: "hibiscus",
    setor: "recepcao",
    localizacao: "Hall de entrada — Hibiscus Beach Club",
    orientacao: "horizontal",
    observacoes: "Tela principal de boas-vindas aos hóspedes.",
  },
  {
    nome: "Recepção Mar & Cia",
    unidade: "mar-cia",
    setor: "recepcao",
    localizacao: "Hall de entrada — Hibiscus Mar & Cia",
    orientacao: "horizontal",
    observacoes: "Tela principal de boas-vindas aos hóspedes.",
  },
  {
    nome: "Cozinha Hibiscus",
    unidade: "hibiscus",
    setor: "cozinha",
    localizacao: "Área de produção — Hibiscus Beach Club",
    orientacao: "vertical",
    observacoes: "Avisos operacionais para a equipe de cozinha.",
  },
  {
    nome: "RH Colaboradores",
    unidade: "grupo",
    setor: "rh",
    localizacao: "Área de colaboradores — Grupo Hibiscus",
    orientacao: "vertical",
    observacoes: "Comunicados de RH e informações institucionais.",
  },
  {
    nome: "PDV Loja",
    unidade: "grupo",
    setor: "pdv",
    localizacao: "Loja de conveniência",
    orientacao: "horizontal",
    observacoes: "Promoções e campanhas da loja.",
  },
  {
    nome: "Área de Espera",
    unidade: "grupo",
    setor: "atendimento",
    localizacao: "Sala de espera — atendimento ao cliente",
    orientacao: "horizontal",
    observacoes: "Conteúdos institucionais e de entretenimento.",
  },
];

async function main() {
  const { SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD } = process.env;
  if (!SEED_ADMIN_EMAIL || !SEED_ADMIN_PASSWORD) {
    console.error(
      "Defina SEED_ADMIN_EMAIL e SEED_ADMIN_PASSWORD (usuário admin já existente) antes de rodar o seed."
    );
    process.exit(1);
  }

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  console.log(`Autenticando como ${SEED_ADMIN_EMAIL}...`);
  await signInWithEmailAndPassword(auth, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD);

  const screensCol = collection(db, "screens");

  for (const screen of SCREENS) {
    const existing = await getDocs(
      query(screensCol, where("nome", "==", screen.nome))
    );

    if (!existing.empty) {
      console.log(`↷ Tela "${screen.nome}" já existe, pulando.`);
      continue;
    }

    await addDoc(screensCol, {
      ...screen,
      screenId: generateScreenId(screen.nome),
      status: "ativa",
      lastSeenAt: null,
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    });
    console.log(`✓ Tela "${screen.nome}" criada.`);
  }

  console.log("Seed concluído.");
  process.exit(0);
}

main().catch((error) => {
  console.error("Falha ao executar o seed:", error);
  process.exit(1);
});
