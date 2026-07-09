"use client";

import { useParams } from "next/navigation";
import { TvPlayer } from "@/components/tv/TvPlayer";

export default function TvScreenPage() {
  const params = useParams<{ screenId: string }>();
  return <TvPlayer screenId={params.screenId} />;
}
