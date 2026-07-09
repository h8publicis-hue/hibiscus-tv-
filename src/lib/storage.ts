import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
  type UploadTaskSnapshot,
} from "firebase/storage";
import { storage } from "@/lib/firebase";

export const IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
export const VIDEO_TYPES = ["video/mp4", "video/webm"];

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
export const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200 MB

export function validateFile(file: File): { valid: boolean; error?: string } {
  const isImage = IMAGE_TYPES.includes(file.type);
  const isVideo = VIDEO_TYPES.includes(file.type);

  if (!isImage && !isVideo) {
    return {
      valid: false,
      error: "Formato não suportado. Use JPG, PNG, WEBP, MP4 ou WEBM.",
    };
  }

  if (isImage && file.size > MAX_IMAGE_SIZE) {
    return { valid: false, error: "Imagem excede o tamanho máximo de 10 MB." };
  }

  if (isVideo && file.size > MAX_VIDEO_SIZE) {
    return { valid: false, error: "Vídeo excede o tamanho máximo de 200 MB." };
  }

  return { valid: true };
}

export function uploadContentFile(
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ url: string; path: string }> {
  return new Promise((resolve, reject) => {
    const validation = validateFile(file);
    if (!validation.valid) {
      reject(new Error(validation.error));
      return;
    }

    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `contents/${timestamp}_${safeName}`;
    const storageRef = ref(storage, path);
    const task = uploadBytesResumable(storageRef, file);

    task.on(
      "state_changed",
      (snapshot: UploadTaskSnapshot) => {
        const percent = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(percent);
      },
      (error) => reject(error),
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve({ url, path });
      }
    );
  });
}

export async function deleteContentFile(path: string) {
  const storageRef = ref(storage, path);
  return deleteObject(storageRef);
}
