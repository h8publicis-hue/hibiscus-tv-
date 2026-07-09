"use client";

import { useRef, useState } from "react";
import { UploadCloud, X, FileVideo, FileImage, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  uploadContentFile,
  validateFile,
  deleteContentFile,
  IMAGE_TYPES,
  VIDEO_TYPES,
} from "@/lib/storage";

interface UploadFieldProps {
  value?: string | null;
  path?: string | null;
  onChange: (result: { url: string; path: string } | null) => void;
  accept?: "imagem" | "video" | "all";
}

export function UploadField({ value, path, onChange, accept = "all" }: UploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);

  const acceptAttr =
    accept === "imagem"
      ? IMAGE_TYPES.join(",")
      : accept === "video"
      ? VIDEO_TYPES.join(",")
      : [...IMAGE_TYPES, ...VIDEO_TYPES].join(",");

  async function handleFile(file: File) {
    setError(null);
    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error || "Arquivo inválido.");
      return;
    }

    setIsVideo(VIDEO_TYPES.includes(file.type));
    setProgress(0);
    try {
      const result = await uploadContentFile(file, setProgress);
      onChange(result);
      toast.success("Arquivo enviado com sucesso!");
    } catch {
      setError("Falha no upload. Tente novamente.");
      toast.error("Falha no upload do arquivo.");
    } finally {
      setProgress(null);
    }
  }

  async function handleRemove() {
    if (path) {
      try {
        await deleteContentFile(path);
      } catch {
        // arquivo pode já ter sido removido; segue o fluxo
      }
    }
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const showingVideo =
    accept === "video" ||
    (accept === "all" &&
      (isVideo || Boolean(value?.match(/\.(mp4|webm)(\?|$)/i))));

  return (
    <div>
      {value ? (
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-900">
          {showingVideo ? (
            <video src={value} className="h-56 w-full object-contain" controls />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt="Prévia do arquivo"
              className="h-56 w-full object-contain"
            />
          )}
          <button
            type="button"
            onClick={handleRemove}
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
            aria-label="Remover arquivo"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center transition-colors hover:border-hibiscus-400 hover:bg-hibiscus-50/40"
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept={acceptAttr}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          {progress !== null ? (
            <div className="w-full max-w-xs">
              <p className="mb-2 text-sm text-slate-600">
                Enviando... {Math.round(progress)}%
              </p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-hibiscus-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <>
              <UploadCloud className="h-8 w-8 text-slate-400" />
              <p className="text-sm font-medium text-slate-600">
                Clique para enviar imagem ou vídeo
              </p>
              <p className="flex items-center gap-1 text-xs text-slate-400">
                <FileImage className="h-3.5 w-3.5" /> JPG, PNG, WEBP até 10MB ·{" "}
                <FileVideo className="h-3.5 w-3.5" /> MP4, WEBM até 200MB
              </p>
            </>
          )}
        </label>
      )}

      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-red-600">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </p>
      )}
    </div>
  );
}
