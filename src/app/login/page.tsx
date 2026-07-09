"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Palmtree, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { login } from "@/lib/auth";
import { useAuth } from "@/components/shared/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldError } from "@/components/ui/Input";

const schema = z.object({
  email: z.email("Informe um e-mail válido"),
  password: z.string().min(6, "A senha deve ter ao menos 6 caracteres"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!loading && user) {
      router.replace("/admin");
    }
  }, [loading, user, router]);

  async function onSubmit(data: FormData) {
    setSubmitting(true);
    try {
      await login(data.email, data.password);
      toast.success("Login realizado com sucesso!");
      router.replace("/admin");
    } catch {
      toast.error("E-mail ou senha inválidos.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-hibiscus-600 via-hibiscus-700 to-tropical-800 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-hibiscus-500 to-tropical-500 text-white shadow-lg">
            <Palmtree className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Hibiscus TV</h1>
          <p className="mt-1 text-sm text-slate-500">
            Painel administrativo — Grupo Hibiscus
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="email" required>
              E-mail
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="email"
                type="email"
                placeholder="voce@grupohibiscus.com"
                className="pl-9"
                error={errors.email?.message}
                {...register("email")}
              />
            </div>
            <FieldError message={errors.email?.message} />
          </div>

          <div>
            <Label htmlFor="password" required>
              Senha
            </Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="pl-9"
                error={errors.password?.message}
                {...register("password")}
              />
            </div>
            <FieldError message={errors.password?.message} />
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            loading={submitting}
          >
            Entrar
          </Button>
        </form>
      </div>
    </div>
  );
}
