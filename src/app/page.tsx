"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/shared/AuthProvider";
import { Spinner } from "@/components/shared/Spinner";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? "/admin" : "/login");
  }, [loading, user, router]);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-50">
      <Spinner label="Carregando Hibiscus TV..." />
    </div>
  );
}
