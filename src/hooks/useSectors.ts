"use client";

import { useEffect, useState } from "react";
import { watchSectors } from "@/lib/firestore";
import type { Sector } from "@/types";

export function useSectors() {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = watchSectors((data) => {
      setSectors(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return { sectors, loading };
}
