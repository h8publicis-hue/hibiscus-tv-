-- Bucket público para mídias de conteúdo (imagens e vídeos) do Hibiscus TV
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'contents',
  'contents',
  true,
  209715200, -- 200MB
  array['image/jpeg','image/jpg','image/png','image/webp','video/mp4','video/webm']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Leitura pública (necessária para exibição nas TVs, sem autenticação)
create policy "Public read contents"
on storage.objects for select
using (bucket_id = 'contents');

-- Escrita (insert/update/delete) NÃO é liberada para os papéis padrão do
-- Supabase (anon/authenticated) propositalmente: o app usa Firebase Auth,
-- então nunca haverá uma sessão "authenticated" do Supabase no navegador.
-- Todo upload/exclusão passa pela Edge Function `upload-content`, que usa
-- a chave secreta do Supabase (bypassa RLS) somente após validar o ID
-- token do Firebase do usuário. Ver supabase/functions/upload-content.
