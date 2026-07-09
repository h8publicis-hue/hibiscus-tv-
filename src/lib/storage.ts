import { auth } from "@/lib/firebase";

export const IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
export const VIDEO_TYPES = ["video/mp4", "video/webm"];

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
export const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200 MB

const FUNCTIONS_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""}/functions/v1`;

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

/**
 * Upload de mídia via Supabase Edge Function ("upload-content"). A function
 * verifica o ID token do Firebase do usuário logado antes de gravar no
 * Storage usando a chave secreta do Supabase (nunca exposta ao navegador).
 */
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

    const user = auth.currentUser;
    if (!user) {
      reject(new Error("Você precisa estar autenticado para enviar arquivos."));
      return;
    }

    user
      .getIdToken()
      .then((idToken) => {
        const formData = new FormData();
        formData.append("file", file);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${FUNCTIONS_URL}/upload-content`);
        xhr.setRequestHeader("Authorization", `Bearer ${idToken}`);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            onProgress?.((event.loaded / event.total) * 100);
          }
        };

        xhr.onload = () => {
          let data: { url?: string; path?: string; error?: string } = {};
          try {
            data = JSON.parse(xhr.responseText);
          } catch {
            // resposta não-JSON tratada abaixo pelo status
          }
          if (xhr.status >= 200 && xhr.status < 300 && data.url && data.path) {
            resolve({ url: data.url, path: data.path });
          } else {
            reject(new Error(data.error || "Falha no upload do arquivo."));
          }
        };

        xhr.onerror = () => reject(new Error("Falha no upload do arquivo."));
        xhr.send(formData);
      })
      .catch(() => reject(new Error("Não foi possível validar sua sessão.")));
  });
}

export async function deleteContentFile(path: string) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Você precisa estar autenticado para excluir arquivos.");
  }
  const idToken = await user.getIdToken();

  const res = await fetch(`${FUNCTIONS_URL}/upload-content`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ path }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Falha ao excluir arquivo.");
  }
}
