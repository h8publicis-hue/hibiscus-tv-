"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileStack,
  MonitorPlay,
  ListVideo,
  Settings,
  Palmtree,
  LogOut,
  X,
} from "lucide-react";
import { logout } from "@/lib/auth";
import { useAuth } from "@/components/shared/AuthProvider";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/conteudos", label: "Conteúdos", icon: FileStack },
  { href: "/admin/telas", label: "Telas", icon: MonitorPlay },
  { href: "/admin/playlists", label: "Playlists", icon: ListVideo },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

export function Sidebar({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { appUser, user } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    toast.success("Sessão encerrada.");
    router.replace("/login");
  }

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-hibiscus-700 to-tropical-900 text-white">
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
          <Palmtree className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-none">Hibiscus TV</p>
          <p className="mt-1 text-xs text-white/60">Painel administrativo</p>
        </div>
        <button
          className="ml-auto rounded-lg p-1.5 hover:bg-white/10 md:hidden"
          onClick={onNavigate}
          aria-label="Fechar menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-white text-hibiscus-700 shadow-sm"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="h-4.5 w-4.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-4 py-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-sm font-semibold">
            {(appUser?.nome || user?.email || "?").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {appUser?.nome || "Usuário"}
            </p>
            <p className="truncate text-xs text-white/60">
              {appUser?.role || user?.email}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </div>
  );
}
