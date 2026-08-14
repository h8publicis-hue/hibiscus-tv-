"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, MonitorPlay, FileStack, Clock } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Spinner } from "@/components/shared/Spinner";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Input";
import { DashboardCards, type DashboardCardData } from "@/components/admin/DashboardCards";
import {
  watchRecentScreenLogs,
  watchScreens,
  watchContents,
} from "@/lib/firestore";
import { formatDateTime } from "@/utils/date";
import type { Screen, Content, ScreenLog } from "@/types";

const LIMIT_COUNT = 300;

export default function RelatoriosPage() {
  const [logs, setLogs] = useState<ScreenLog[] | null>(null);
  const [screens, setScreens] = useState<Screen[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [screenId, setScreenId] = useState("");

  useEffect(() => {
    const unsub = watchScreens(setScreens);
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = watchContents(setContents);
    return () => unsub();
  }, []);

  useEffect(() => {
    setLogs(null);
    const unsub = watchRecentScreenLogs(setLogs, {
      screenId: screenId || undefined,
      limitCount: LIMIT_COUNT,
    });
    return () => unsub();
  }, [screenId]);

  const screenMap = useMemo(
    () => new Map(screens.map((s) => [s.id, s])),
    [screens]
  );
  const contentMap = useMemo(
    () => new Map(contents.map((c) => [c.id, c])),
    [contents]
  );

  const stats = useMemo(() => {
    if (!logs) return null;

    const porTela = new Map<string, number>();
    const porConteudo = new Map<string, number>();
    for (const log of logs) {
      porTela.set(log.screenId, (porTela.get(log.screenId) ?? 0) + 1);
      porConteudo.set(log.contentId, (porConteudo.get(log.contentId) ?? 0) + 1);
    }

    const telaMaisAtiva = [...porTela.entries()].sort((a, b) => b[1] - a[1])[0];
    const conteudoMaisExibido = [...porConteudo.entries()].sort(
      (a, b) => b[1] - a[1]
    )[0];

    return {
      total: logs.length,
      telaMaisAtivaNome: telaMaisAtiva
        ? screenMap.get(telaMaisAtiva[0])?.nome ?? "Tela removida"
        : "-",
      conteudoMaisExibidoNome: conteudoMaisExibido
        ? contentMap.get(conteudoMaisExibido[0])?.titulo ?? "Conteúdo removido"
        : "-",
    };
  }, [logs, screenMap, contentMap]);

  const cards: DashboardCardData[] = [
    {
      label: screenId ? `Exibições (últimas ${LIMIT_COUNT})` : `Exibições recentes (últimas ${LIMIT_COUNT})`,
      value: stats?.total ?? 0,
      icon: BarChart3,
      accent: "hibiscus",
    },
    {
      label: "Tela mais ativa no período",
      value: stats?.telaMaisAtivaNome ?? "-",
      icon: MonitorPlay,
      accent: "tropical",
    },
    {
      label: "Conteúdo mais exibido",
      value: stats?.conteudoMaisExibidoNome ?? "-",
      icon: FileStack,
      accent: "sand",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Relatórios"
        description="Histórico de exibição das telas, direto dos registros gravados pelo player."
      />

      <div className="mb-6 max-w-xs">
        <Select value={screenId} onChange={(e) => setScreenId(e.target.value)}>
          <option value="">Todas as telas</option>
          {screens.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nome}
            </option>
          ))}
        </Select>
      </div>

      {!logs ? (
        <Spinner />
      ) : (
        <>
          <DashboardCards cards={cards} />

          {logs.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                icon={Clock}
                title="Nenhuma exibição registrada ainda"
                description="Assim que as telas começarem a rodar conteúdo, os registros aparecem aqui."
              />
            </div>
          ) : (
            <Card className="mt-6 overflow-hidden">
              <div className="max-h-[60vh] overflow-y-auto overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Tela</th>
                      <th className="px-4 py-3 font-medium">Conteúdo</th>
                      <th className="px-4 py-3 font-medium">Exibido em</th>
                      <th className="px-4 py-3 font-medium">Duração</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3 text-slate-700">
                          {screenMap.get(log.screenId)?.nome ?? "Tela removida"}
                        </td>
                        <td className="max-w-[260px] truncate px-4 py-3 text-slate-700">
                          {contentMap.get(log.contentId)?.titulo ??
                            "Conteúdo removido"}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {formatDateTime(log.exibidoEm)}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {log.duracaoEmSegundos}s
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
