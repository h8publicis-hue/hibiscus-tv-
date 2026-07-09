"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  danger,
  loading,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-red-600">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        {description && (
          <p className="mt-1.5 text-sm text-slate-500">{description}</p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            variant={danger ? "danger" : "primary"}
            size="sm"
            loading={loading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
