"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { FirebaseError } from "firebase/app";
import { changePassword } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldError } from "@/components/ui/Input";

const schema = z
  .object({
    currentPassword: z.string().min(1, "Informe a senha atual"),
    newPassword: z.string().min(6, "A nova senha deve ter ao menos 6 caracteres"),
    confirmPassword: z.string().min(1, "Confirme a nova senha"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

function firebaseErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "Senha atual incorreta.";
      case "auth/too-many-requests":
        return "Muitas tentativas. Aguarde um pouco antes de tentar de novo.";
      case "auth/weak-password":
        return "A nova senha é muito fraca.";
      default:
        return "Não foi possível trocar a senha.";
    }
  }
  return "Não foi possível trocar a senha.";
}

export function ChangePasswordForm() {
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setSubmitting(true);
    try {
      await changePassword(data.currentPassword, data.newPassword);
      toast.success("Senha alterada com sucesso!");
      reset();
    } catch (error) {
      toast.error(firebaseErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="currentPassword" required>
          Senha atual
        </Label>
        <Input
          id="currentPassword"
          type="password"
          autoComplete="current-password"
          error={errors.currentPassword?.message}
          {...register("currentPassword")}
        />
        <FieldError message={errors.currentPassword?.message} />
      </div>

      <div>
        <Label htmlFor="newPassword" required>
          Nova senha
        </Label>
        <Input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          error={errors.newPassword?.message}
          {...register("newPassword")}
        />
        <FieldError message={errors.newPassword?.message} />
      </div>

      <div>
        <Label htmlFor="confirmPassword" required>
          Confirmar nova senha
        </Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />
        <FieldError message={errors.confirmPassword?.message} />
      </div>

      <Button type="submit" loading={submitting}>
        Trocar senha
      </Button>
    </form>
  );
}
