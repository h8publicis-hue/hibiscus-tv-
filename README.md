# Hibiscus TV

Plataforma de TV interna e interativa do **Grupo Hibiscus** — gerencia comunicados, promoções, campanhas, avisos de RH e conteúdos institucionais exibidos nos monitores das unidades **Hibiscus Beach Club** e **Hibiscus Mar & Cia**.

- Painel administrativo para cadastro e gestão de conteúdos, telas e playlists.
- Player de TV em tela cheia (`/tv/[screenId]`), atualizado em tempo real via Firestore.
- Agendamento de exibição, prioridades, upload de mídia e controle por unidade/setor/tela.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS v4 · Firebase (Auth + Firestore) · Supabase (Storage, via Edge Function) · React Hook Form · Zod · Lucide React · Sonner · @dnd-kit

**Por que dois backends?** Autenticação e banco de dados usam Firebase. O upload de imagens/vídeos usa Supabase Storage porque o Firebase Storage passou a exigir o plano pago (Blaze) mesmo para uso gratuito — o Supabase tem um plano gratuito real, sem cartão de crédito. Veja a seção 6 (Segurança) para entender como os dois ficam integrados com segurança.

## Estrutura do projeto

```
src/
  app/
    login/                       Tela de login
    admin/                       Painel administrativo (protegido)
      conteudos/                 CRUD de conteúdos
      telas/                     CRUD de telas/monitores
      playlists/                 CRUD de playlists
      configuracoes/             Conta e informações da plataforma
    tv/[screenId]/                Player público da TV
  components/
    admin/                       Formulários e componentes do painel
    tv/                          MediaRenderer, TvPlayer, FullscreenButton...
    shared/                      AuthProvider, StatusBadge, EmptyState...
    ui/                          Button, Input, Card, ConfirmDialog...
  lib/                           firebase.ts, auth.ts, firestore.ts, storage.ts
  types/                         Tipos e constantes (unidades, setores, etc.)
  utils/                         date.ts, screen.ts
  scripts/seed.ts                Dados iniciais (telas de exemplo)
supabase/
  functions/upload-content/      Edge Function que recebe o upload/exclusão
  migrations/                    SQL do bucket "contents" e suas policies
firestore.rules                  Regras de segurança do Firestore
firestore.indexes.json           Índices compostos necessários
```

## 1. Rodando localmente

```bash
npm install
cp .env.example .env.local   # preencha com as credenciais do seu Firebase e Supabase
npm run dev
```

Acesse `http://localhost:3000`. Sem um `.env.local` válido o app builda e abre normalmente, mas as telas que dependem do Firebase (login, dashboard, player) ficam em estado de carregamento — configure o Firebase e o Supabase antes de usar de verdade (seções 2 e 3).

## 2. Configurando o Firebase (Auth + Firestore)

1. Crie um projeto em [console.firebase.google.com](https://console.firebase.google.com).
2. **Authentication** → Sign-in method → ative **E-mail/senha**.
3. **Firestore Database** → crie o banco (modo produção).
4. Em **Configurações do projeto → Geral → Seus apps**, crie um app Web e copie as credenciais para `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

5. Publique as regras de segurança (via [Firebase CLI](https://firebase.google.com/docs/cli)):

```bash
npm install -g firebase-tools
firebase login
firebase use --add          # selecione o projeto criado
firebase deploy --only firestore:rules,firestore:indexes
```

Isso publica `firestore.rules` e `firestore.indexes.json`. Sem o índice composto de `playlists` (status + telas), a query do player para playlists vinculadas a uma tela falhará — o próprio console do Firebase mostra um link para criar o índice manualmente caso prefira não usar a CLI.

### Bootstrap do primeiro admin

As regras do Firestore exigem que o usuário autenticado tenha um documento em `users/{uid}` com `role` em `admin`, `marketing` ou `rh` e `ativo: true` para poder criar/editar conteúdos, telas e playlists. Novos usuários são criados automaticamente no primeiro login com `role: "viewer"` (somente leitura) por segurança.

Para promover o primeiro administrador:

1. Crie o usuário em **Authentication → Users → Add user** (ou faça login uma vez pela tela `/login`, o que cria o documento em `users` automaticamente).
2. No **Firestore**, abra o documento `users/{uid}` correspondente e altere `role` para `"admin"`.
3. Faça login novamente — o painel administrativo estará liberado.

## 3. Configurando o Supabase (upload de imagens/vídeos)

1. Crie um projeto em [supabase.com/dashboard](https://supabase.com/dashboard) (plano gratuito).
2. Copie a **Project URL** (Settings → Data API) para `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
```

3. Rode a migration que cria o bucket `contents` (público, até 200MB, aceita apenas `jpg/png/webp/mp4/webm`):

```bash
npm install -g supabase
supabase login
supabase link --project-ref SEU_PROJECT_REF
supabase db push          # aplica supabase/migrations/*.sql
```

4. Publique a Edge Function que faz o upload (ela verifica o login do Firebase antes de gravar no Storage — ver seção 6):

```bash
supabase functions deploy upload-content --no-verify-jwt
```

Se o seu `projectId` do Firebase for diferente de `hibiscus-beach`, defina o secret correspondente antes do deploy:

```bash
supabase secrets set FIREBASE_PROJECT_ID=seu-projeto-firebase
```

## 4. Dados iniciais (seed)

O script `src/scripts/seed.ts` cadastra as telas de exemplo (Recepção Hibiscus, Recepção Mar & Cia, Cozinha Hibiscus, RH Colaboradores, PDV Loja, Área de Espera). Ele autentica como um admin já existente (ver bootstrap acima) para respeitar as regras de segurança:

```bash
SEED_ADMIN_EMAIL=voce@grupohibiscus.com SEED_ADMIN_PASSWORD=suasenha npm run seed
```

Unidades (Grupo Hibiscus, Hibiscus Beach Club, Hibiscus Mar & Cia) e setores (Recepção, Cozinha, Atendimento, RH, Financeiro, Loja, PDV, Área de Colaboradores) são constantes da aplicação (`src/types/index.ts`), não precisam de seed.

## 5. Abrindo uma TV em modo kiosk

1. No painel, vá em **Telas → Nova tela** e cadastre o monitor (nome, unidade, setor, localização, orientação).
2. Clique em **Copiar link da TV** — o link segue o padrão `https://seu-dominio.com/tv/[screenId]`.
3. Abra o link no navegador do dispositivo (Smart TV, notebook conectado à TV, tablet, Chromebox, Fire Stick com navegador, etc.) e ative o modo tela cheia:
   - **Chrome/Edge (kiosk real)**: `chrome --kiosk "https://seu-dominio.com/tv/SEU_SCREEN_ID"`
   - **Sem acesso à linha de comando**: use o botão discreto de **tela cheia** no canto inferior direito do player, ou pressione `F11`.
4. O player atualiza sozinho quando o conteúdo muda no Firestore — não é necessário recarregar a página manualmente.
5. Deixe o dispositivo sempre ligado e com a tela sem suspensão (nas configurações do SO/TV), já que o player roda em loop contínuo.

## 6. Fluxo de conteúdo

- Um conteúdo só é exibido se `status = "ativo"` **e** a data atual estiver entre `dataInicio`/`dataFim` (quando definidas).
- Conteúdos com prioridade `urgente` são exibidos antes dos demais (ordenação por prioridade, depois por data de criação).
- Se a tela pertence a uma **playlist ativa**, a ordem definida na playlist prevalece sobre a prioridade.
- Sem playlist, a tela busca conteúdos vinculados explicitamente a ela (`telas`) ou, na ausência de vínculo explícito, conteúdos da mesma unidade/setor.
- Telas com `status = "inativa"` nunca exibem conteúdo — mostram uma mensagem institucional.
- Uma tela é considerada **offline** no painel se `lastSeenAt` não é atualizado há mais de 2 minutos (heartbeat enviado a cada 30s pelo player).

## 7. Segurança

- **`firestore.rules`**: leitura pública de telas e playlists (necessária para o player resolver o que exibir); conteúdos públicos apenas com `status = "ativo"` — e a query do player já filtra isso no servidor (`where status == "ativo"`), pois o Firestore exige esse filtro na própria consulta para permitir leitura sem login; escrita restrita a usuários autenticados com papel `admin`/`marketing`/`rh` e `ativo: true`; exceção pontual para o heartbeat (`lastSeenAt`), que o player público pode atualizar.
- **Upload de mídia (Supabase)**: como o app usa Firebase Auth (não Supabase Auth), o Supabase não reconhece a sessão do painel automaticamente. Por isso o upload não vai direto do navegador para o Storage — ele passa pela Edge Function `supabase/functions/upload-content`, que:
  1. Recebe o ID token do Firebase do usuário logado (`Authorization: Bearer <token>`).
  2. Verifica esse token contra o JWKS público do Google (sem precisar de nenhuma credencial do Firebase no lado do Supabase).
  3. Só então grava/exclui o arquivo usando a chave secreta do Supabase — que nunca é exposta ao navegador.
  
  O bucket `contents` propositalmente **não** libera escrita para os papéis padrão do Supabase (`anon`/`authenticated`), já que essa sessão nunca existe nesse app — toda escrita passa pela function.
- Validação de tipo e tamanho de arquivo em três camadas: frontend (`src/lib/storage.ts`), Edge Function e o próprio bucket do Supabase (`allowed_mime_types`, `file_size_limit`). Imagens até 10MB, vídeos até 200MB.
- Exclusão de conteúdo nunca remove o arquivo do Storage automaticamente — é preciso confirmar a exclusão explicitamente no painel.

## 8. Scripts

```bash
npm run dev      # desenvolvimento local
npm run build    # build de produção
npm run start    # servidor de produção
npm run lint     # ESLint
npm run seed     # popular telas de exemplo (requer admin já criado)
```

## 9. Deploy

O projeto é um app Next.js padrão — pode ser publicado na Vercel, Firebase App Hosting ou qualquer plataforma com suporte a Next.js. Lembre-se de:

1. Configurar as mesmas variáveis de `.env.example` no ambiente de produção.
2. Publicar as regras do Firestore (`firebase deploy --only firestore:rules,firestore:indexes`).
3. Aplicar as migrations e publicar a Edge Function do Supabase (`supabase db push` e `supabase functions deploy upload-content --no-verify-jwt`) antes de liberar o acesso público às TVs.
