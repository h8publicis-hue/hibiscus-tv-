"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useAuth } from "@/components/shared/AuthProvider";
import { UNIDADES, SETORES } from "@/types";
import { formatDateTime } from "@/utils/date";

export default function ConfiguracoesPage() {
  const { user, appUser } = useAuth();

  return (
    <div>
      <PageHeader
        title="Configurações"
        description="Informações da conta e parâmetros gerais da plataforma."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Minha conta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Nome</span>
              <span className="font-medium text-slate-800">
                {appUser?.nome ?? "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">E-mail</span>
              <span className="font-medium text-slate-800">
                {user?.email ?? "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Perfil</span>
              <span className="font-medium capitalize text-slate-800">
                {appUser?.role ?? "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status</span>
              <StatusBadge status={appUser?.ativo ? "ativo" : "inativo"} />
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Conta criada em</span>
              <span className="font-medium text-slate-800">
                {formatDateTime(appUser?.criadoEm)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Unidades do Grupo Hibiscus</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {UNIDADES.map((u) => (
                <li
                  key={u.value}
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
                >
                  <span className="font-medium text-slate-700">{u.label}</span>
                  <span className="text-xs text-slate-400">{u.value}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Setores disponíveis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {SETORES.map((s) => (
                <div
                  key={s.value}
                  className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700"
                >
                  {s.label}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sobre a plataforma</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600">
            <p>
              O Hibiscus TV gerencia comunicados, promoções, campanhas e
              avisos exibidos nos monitores internos do Grupo Hibiscus.
            </p>
            <p>
              Para conectar um novo monitor, cadastre uma tela em{" "}
              <span className="font-medium text-slate-800">Telas</span> e
              abra o link gerado (<code className="rounded bg-slate-100 px-1">/tv/[screenId]</code>) em modo
              tela cheia no navegador do dispositivo.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
