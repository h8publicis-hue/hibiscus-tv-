"use client";

import { useParams, useSearchParams } from "next/navigation";
import { TvPlayer } from "@/components/tv/TvPlayer";

export default function TvScreenPage() {
  const params = useParams<{ screenId: string }>();
  const searchParams = useSearchParams();
  const previewMode = searchParams.get("preview") === "1";
  return <TvPlayer screenId={params.screenId} previewMode={previewMode} />;
}
