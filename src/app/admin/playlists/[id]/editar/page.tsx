"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { Spinner } from "@/components/shared/Spinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { PlaylistForm } from "@/components/admin/PlaylistForm";
import { getPlaylistById } from "@/lib/firestore";
import type { Playlist } from "@/types";

export default function EditarPlaylistPage() {
  const params = useParams<{ id: string }>();
  const [playlist, setPlaylist] = useState<Playlist | null | undefined>(
    undefined
  );

  useEffect(() => {
    getPlaylistById(params.id).then(setPlaylist);
  }, [params.id]);

  return (
    <div>
      <PageHeader
        title="Editar playlist"
        description="Atualize os conteúdos, telas e ordem de exibição."
      />
      <Card>
        <CardContent>
          {playlist === undefined ? (
            <Spinner />
          ) : playlist === null ? (
            <EmptyState title="Playlist não encontrada" />
          ) : (
            <PlaylistForm playlist={playlist} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
