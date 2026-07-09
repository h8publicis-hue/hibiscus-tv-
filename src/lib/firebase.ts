import { getApps, initializeApp, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Valores de fallback evitam que `next build` quebre antes de o projeto
// ser conectado a um Firebase real (ver .env.example). Em runtime, sem
// variáveis de ambiente válidas, as chamadas ao Firebase falharão de
// forma controlada (erros tratados na UI), não no build.
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "demo-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "demo.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:000000000000:web:0000000000000000000000",
};

if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY && typeof window !== "undefined") {
  console.warn(
    "[hibiscus-tv] Variáveis NEXT_PUBLIC_FIREBASE_* não configuradas. Copie .env.example para .env.local e preencha com as credenciais do seu projeto Firebase."
  );
}

export const firebaseApp =
  getApps().length > 0 ? getApps()[0]! : initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);
