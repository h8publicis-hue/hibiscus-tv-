"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  FileStack,
  MonitorPlay,
  Wifi,
  WifiOff,
  CalendarClock,
  CheckCircle2,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Spinner } from "@/components/shared/Spinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { DashboardCards, type DashboardCardData } from "@/components/admin/DashboardCards";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { watchContents, watchScreens } from "@/lib/firestore";
import { formatDateTime, isScreenOnline, isFutureDate } from "@/utils/date";
import type { Content, Screen } from "@/types";

export default function DashboardPage() {
  const [contents, setContents] = useState<Content[]>([]);
  const [screens, setScreens] = useState<Screen[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let contentsLoaded = false;
    let screensLoaded = false;
    const check = () => {
      if (contentsLoaded && screensLoaded) setLoading(false);
    };
    const unsub1 = watchContents((data) => {
      setContents(data);
      contentsLoaded = true;
      check();
    });
    const unsub2 = watchScreens((data) => {
      setScreens(data);
      screensLoaded = true;
      check();
    });
    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  const metrics = useMemo(() => {
    const ativos = contents.filter((c) => c.status === "ativo").length;
    const online = screens.filter((s) => isScreenOnline(s.lastSeenAt)).length;
    const offline = screens.length - online;
    const agendados = contents.filter((c) => isFutureDate(c.dataInicio)).length;
    return { ativos, online, offline, agendados };
  }, [contents, screens]);

  const cards: DashboardCardData[] = [
    {
      label: "Conteúdos ativos",
      value: metrics.ativos,
      icon: CheckCircle2,
      accent: "tropical",
    },
    {
      label: "Telas cadastradas",
      value: screens.length,
      icon: MonitorPlay,
      accent: "hibiscus",
    },
    {
      label: "Telas online",
      value: metrics.online,
      icon: Wifi,
      accent: "tropical",
    },
    {
      label: "Telas offline",
      value: metrics.offline,
      icon: WifiOff,
      accent: "red",
    },
    {
      label: "Conteúdos agendados",
      value: metrics.agendados,
      icon: CalendarClock,
      accent: "sand",
    },
    {
      label: "Total de conteúdos",
      value: contents.length,
      icon: FileStack,
      accent: "slate",
    },
  ];

  const ultimosConteudos = contents.slice(0, 6);

  if (loading) {
    return (
      <div>
        <PageHeader title="Dashboard" description="Visão geral da plataforma Hibiscus TV." />
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Visão geral da plataforma Hibiscus TV."
      />

      <DashboardCards cards={cards} />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Últimos conteúdos publicados</CardTitle>
        </CardHeader>
        <CardContent>
          {ultimosConteudos.length === 0 ? (
            <EmptyState
              icon={FileStack}
              title="Nenhum conteúdo cadastrado ainda"
              description="Cadastre o primeiro conteúdo para começar a exibir nas telas."
              action={
                <Link
                  href="/admin/conteudos/novo"
                  className="text-sm font-medium text-hibiscus-600 hover:underline"
                >
                  Criar conteúdo →
                </Link>
              }
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {ultimosConteudos.map((c) => (
                <Link
                  key={c.id}
                  href={`/admin/conteudos/${c.id}/editar`}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 hover:bg-slate-50/60"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {c.titulo}
                    </p>
                    <p className="text-xs text-slate-500">
                      Criado em {formatDateTime(c.criadoEm)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <PriorityBadge prioridade={c.prioridade} />
                    <StatusBadge status={c.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
