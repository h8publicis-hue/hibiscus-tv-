"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/shared/AuthProvider";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Spinner } from "@/components/shared/Spinner";

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Spinner label="Verificando autenticação..." />
      </div>
    );
  }

  return <AdminLayout>{children}</AdminLayout>;
}
