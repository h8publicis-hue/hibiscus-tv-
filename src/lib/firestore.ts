import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Content, Playlist, Screen, ScreenLog, Sector } from "@/types";
import { slugify } from "@/utils/text";

// ---------- Collections refs ----------

export const screensCol = collection(db, "screens");
export const contentsCol = collection(db, "contents");
export const playlistsCol = collection(db, "playlists");
export const screenLogsCol = collection(db, "screenLogs");
export const usersCol = collection(db, "users");
export const sectorsCol = collection(db, "sectors");

// ---------- Screens ----------

export async function createScreen(
  data: Omit<Screen, "id" | "criadoEm" | "atualizadoEm" | "lastSeenAt">
) {
  return addDoc(screensCol, {
    ...data,
    lastSeenAt: null,
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  });
}

export async function updateScreen(id: string, data: Partial<Screen>) {
  return updateDoc(doc(db, "screens", id), {
    ...data,
    atualizadoEm: serverTimestamp(),
  });
}

export async function deleteScreen(id: string) {
  return deleteDoc(doc(db, "screens", id));
}

export async function getScreenById(id: string) {
  const snap = await getDoc(doc(db, "screens", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<Screen, "id">) };
}

export async function getScreenByScreenId(screenId: string) {
  const q = query(screensCol, where("screenId", "==", screenId));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...(d.data() as Omit<Screen, "id">) };
}

export function watchScreens(callback: (screens: Screen[]) => void): Unsubscribe {
  const q = query(screensCol, orderBy("criadoEm", "desc"));
  return onSnapshot(
    q,
    (snap) => {
      callback(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Screen, "id">) }))
      );
    },
    (error) => {
      console.error("watchScreens error:", error);
      callback([]);
    }
  );
}

export function watchScreenByScreenId(
  screenId: string,
  callback: (screen: Screen | null) => void
): Unsubscribe {
  const q = query(screensCol, where("screenId", "==", screenId));
  return onSnapshot(
    q,
    (snap) => {
      if (snap.empty) {
        callback(null);
        return;
      }
      const d = snap.docs[0];
      callback({ id: d.id, ...(d.data() as Omit<Screen, "id">) });
    },
    (error) => {
      console.error("watchScreenByScreenId error:", error);
      callback(null);
    }
  );
}

export async function sendHeartbeat(screenDocId: string) {
  return updateDoc(doc(db, "screens", screenDocId), {
    lastSeenAt: serverTimestamp(),
  });
}

// ---------- Contents ----------

export async function createContent(
  data: Omit<Content, "id" | "criadoEm" | "atualizadoEm">
) {
  return addDoc(contentsCol, {
    ...data,
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  });
}

export async function updateContent(id: string, data: Partial<Content>) {
  return updateDoc(doc(db, "contents", id), {
    ...data,
    atualizadoEm: serverTimestamp(),
  });
}

export async function deleteContent(id: string) {
  return deleteDoc(doc(db, "contents", id));
}

export async function getContentById(id: string) {
  const snap = await getDoc(doc(db, "contents", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<Content, "id">) };
}

export function watchContents(callback: (contents: Content[]) => void): Unsubscribe {
  const q = query(contentsCol, orderBy("criadoEm", "desc"));
  return onSnapshot(
    q,
    (snap) => {
      callback(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Content, "id">) }))
      );
    },
    (error) => {
      console.error("watchContents error:", error);
      callback([]);
    }
  );
}

/**
 * Usado pelo player público. A regra do Firestore só permite listar
 * conteúdos sem estar autenticado quando a query já filtra por
 * status "ativo" (leitura de documentos com outro status exige staff).
 */
export function watchActiveContents(callback: (contents: Content[]) => void): Unsubscribe {
  const q = query(contentsCol, where("status", "==", "ativo"));
  return onSnapshot(
    q,
    (snap) => {
      callback(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Content, "id">) }))
      );
    },
    (error) => {
      console.error("watchActiveContents error:", error);
      callback([]);
    }
  );
}

// ---------- Playlists ----------

export async function createPlaylist(
  data: Omit<Playlist, "id" | "criadoEm" | "atualizadoEm">
) {
  return addDoc(playlistsCol, {
    ...data,
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  });
}

export async function updatePlaylist(id: string, data: Partial<Playlist>) {
  return updateDoc(doc(db, "playlists", id), {
    ...data,
    atualizadoEm: serverTimestamp(),
  });
}

export async function deletePlaylist(id: string) {
  return deleteDoc(doc(db, "playlists", id));
}

export async function getPlaylistById(id: string) {
  const snap = await getDoc(doc(db, "playlists", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<Playlist, "id">) };
}

export function watchPlaylists(callback: (playlists: Playlist[]) => void): Unsubscribe {
  const q = query(playlistsCol, orderBy("criadoEm", "desc"));
  return onSnapshot(
    q,
    (snap) => {
      callback(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Playlist, "id">) }))
      );
    },
    (error) => {
      console.error("watchPlaylists error:", error);
      callback([]);
    }
  );
}

export function watchPlaylistForScreen(
  screenDocId: string,
  callback: (playlist: Playlist | null) => void
): Unsubscribe {
  const q = query(
    playlistsCol,
    where("status", "==", "ativa"),
    where("telas", "array-contains", screenDocId)
  );
  return onSnapshot(
    q,
    (snap) => {
      if (snap.empty) {
        callback(null);
        return;
      }
      const d = snap.docs[0];
      callback({ id: d.id, ...(d.data() as Omit<Playlist, "id">) });
    },
    (error) => {
      console.error("watchPlaylistForScreen error:", error);
      callback(null);
    }
  );
}

// ---------- Screen logs ----------

export async function logScreenExhibition(
  data: Omit<ScreenLog, "id" | "exibidoEm">
) {
  return addDoc(screenLogsCol, {
    ...data,
    exibidoEm: serverTimestamp(),
  });
}

// ---------- Sectors ----------

/**
 * O id do setor é o slug do nome (ex: "recepcao"), não um id gerado
 * automaticamente, para que fique legível nos documentos de telas,
 * conteúdos e playlists que referenciam esse valor.
 */
export async function createSector(label: string): Promise<string> {
  const trimmed = label.trim();
  if (!trimmed) throw new Error("Informe um nome para o setor.");

  const id = slugify(trimmed);
  if (!id) throw new Error("Nome de setor inválido.");

  const ref = doc(db, "sectors", id);
  const existing = await getDoc(ref);
  if (existing.exists()) {
    throw new Error("Já existe um setor com esse nome.");
  }

  await setDoc(ref, { label: trimmed, criadoEm: serverTimestamp() });
  return id;
}

export async function deleteSector(id: string) {
  return deleteDoc(doc(db, "sectors", id));
}

export function watchSectors(callback: (sectors: Sector[]) => void): Unsubscribe {
  const q = query(sectorsCol, orderBy("label"));
  return onSnapshot(
    q,
    (snap) => {
      callback(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Sector, "id">) }))
      );
    },
    (error) => {
      console.error("watchSectors error:", error);
      callback([]);
    }
  );
}
