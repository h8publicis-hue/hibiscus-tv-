import { FirebaseError } from "firebase/app";
import {
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  type User,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { AppUser } from "@/types";

export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "E-mail ou senha inválidos.";
      case "auth/too-many-requests":
        return "Muitas tentativas de login. Aguarde alguns minutos e tente novamente.";
      case "auth/user-disabled":
        return "Esta conta está desativada.";
      case "auth/network-request-failed":
        return "Falha de conexão. Verifique sua internet e tente novamente.";
      case "auth/weak-password":
        return "A senha é muito fraca.";
      default:
        return `Não foi possível entrar (${error.code}).`;
    }
  }
  return "Não foi possível entrar. Tente novamente.";
}

export function login(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function logout() {
  return signOut(auth);
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
) {
  const user = auth.currentUser;
  if (!user || !user.email) {
    throw new Error("Nenhum usuário autenticado.");
  }
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
}

export function watchAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function getAppUser(uid: string): Promise<AppUser | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return { uid, ...(snap.data() as Omit<AppUser, "uid">) };
}

export async function ensureAppUser(user: User): Promise<AppUser> {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    return { uid: user.uid, ...(snap.data() as Omit<AppUser, "uid">) };
  }

  const newUser: Omit<AppUser, "uid"> = {
    nome: user.displayName || user.email?.split("@")[0] || "Usuário",
    email: user.email || "",
    role: "viewer",
    ativo: true,
    criadoEm: serverTimestamp() as AppUser["criadoEm"],
  };

  await setDoc(ref, newUser);
  return { uid: user.uid, ...newUser };
}
