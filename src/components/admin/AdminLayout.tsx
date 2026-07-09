"use client";

import { useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "@/components/admin/Sidebar";

export function AdminLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar desktop */}
      <aside className="hidden w-64 shrink-0 md:block">
        <div className="fixed h-screen w-64">
          <Sidebar />
        </div>
      </aside>

      {/* Sidebar mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative h-full w-64">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4 md:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 hover:bg-slate-100"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-slate-800">
            Hibiscus TV
          </span>
        </header>

        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
