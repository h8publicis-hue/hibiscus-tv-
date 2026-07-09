# Hibiscus TV

Plataforma de TV interna e interativa do **Grupo Hibiscus** — gerencia comunicados, promoções, campanhas, avisos de RH e conteúdos institucionais exibidos nos monitores das unidades **Hibiscus Beach Club** e **Hibiscus Mar & Cia**.

- Painel administrativo para cadastro e gestão de conteúdos, telas e playlists.
- Player de TV em tela cheia (`/tv/[screenId]`), atualizado em tempo real via Firestore.
- Agendamento de exibição, prioridades, upload de mídia e controle por unidade/setor/tela.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS v4 · Firebase (Auth, Firestore, Storage) · React Hook Form · Zod · Lucide React · Sonner · @dnd-kit

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
firestore.rules                  Regras de segurança do Firestore
storage.rules                    Regras de segurança do Storage
firestore.indexes.json           Índices compostos necessários
```

## 1. Rodando localmente

```bash
npm install
cp .env.example .env.local   # preencha com as credenciais do seu projeto Firebase
npm run dev
```

Acesse `http://localhost:3000`. Sem um `.env.local` válido o app builda e abre normalmente, mas as telas que dependem do Firebase (login, dashboard, player) ficam em estado de carregamento — configure o Firebase antes de usar de verdade (veja a seção 2).

## 2. Configurando o Firebase

1. Crie um projeto em [console.firebase.google.com](https://console.firebase.google.com).
2. **Authentication** → Sign-in method → ative **E-mail/senha**.
3. **Firestore Database** → crie o banco (modo produção).
4. **Storage** → ative o bucket padrão.
5. Em **Configurações do projeto → Geral → Seus apps**, crie um app Web e copie as credenciais para `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

6. Publique as regras de segurança (via [Firebase CLI](https://firebase.google.com/docs/cli)):

```bash
npm install -g firebase-tools
firebase login
firebase use --add          # selecione o projeto criado
firebase deploy --only firestore:rules,firestore:indexes,storage
```

Isso publica `firestore.rules`, `firestore.indexes.json` e `storage.rules`. Sem o índice composto de `playlists` (status + telas), a query do player para playlists vinculadas a uma tela falhará — o próprio console do Firebase mostra um link para criar o índice manualmente caso prefira não usar a CLI.

### Bootstrap do primeiro admin

As regras do Firestore exigem que o usuário autenticado tenha um documento em `users/{uid}` com `role` em `admin`, `marketing` ou `rh` e `ativo: true` para poder criar/editar conteúdos, telas e playlists. Novos usuários são criados automaticamente no primeiro login com `role: "viewer"` (somente leitura) por segurança.

Para promover o primeiro administrador:

1. Crie o usuário em **Authentication → Users → Add user** (ou faça login uma vez pela tela `/login`, o que cria o documento em `users` automaticamente).
2. No **Firestore**, abra o documento `users/{uid}` correspondente e altere `role` para `"admin"`.
3. Faça login novamente — o painel administrativo estará liberado.

## 3. Dados iniciais (seed)

O script `src/scripts/seed.ts` cadastra as telas de exemplo (Recepção Hibiscus, Recepção Mar & Cia, Cozinha Hibiscus, RH Colaboradores, PDV Loja, Área de Espera). Ele autentica como um admin já existente (ver bootstrap acima) para respeitar as regras de segurança:

```bash
SEED_ADMIN_EMAIL=voce@grupohibiscus.com SEED_ADMIN_PASSWORD=suasenha npm run seed
```

Unidades (Grupo Hibiscus, Hibiscus Beach Club, Hibiscus Mar & Cia) e setores (Recepção, Cozinha, Atendimento, RH, Financeiro, Loja, PDV, Área de Colaboradores) são constantes da aplicação (`src/types/index.ts`), não precisam de seed.

## 4. Abrindo uma TV em modo kiosk

1. No painel, vá em **Telas → Nova tela** e cadastre o monitor (nome, unidade, setor, localização, orientação).
2. Clique em **Copiar link da TV** — o link segue o padrão `https://seu-dominio.com/tv/[screenId]`.
3. Abra o link no navegador do dispositivo (Smart TV, notebook conectado à TV, tablet, Chromebox, Fire Stick com navegador, etc.) e ative o modo tela cheia:
   - **Chrome/Edge (kiosk real)**: `chrome --kiosk "https://seu-dominio.com/tv/SEU_SCREEN_ID"`
   - **Sem acesso à linha de comando**: use o botão discreto de **tela cheia** no canto inferior direito do player, ou pressione `F11`.
4. O player atualiza sozinho quando o conteúdo muda no Firestore — não é necessário recarregar a página manualmente.
5. Deixe o dispositivo sempre ligado e com a tela sem suspensão (nas configurações do SO/TV), já que o player roda em loop contínuo.

## 5. Fluxo de conteúdo

- Um conteúdo só é exibido se `status = "ativo"` **e** a data atual estiver entre `dataInicio`/`dataFim` (quando definidas).
- Conteúdos com prioridade `urgente` são exibidos antes dos demais (ordenação por prioridade, depois por data de criação).
- Se a tela pertence a uma **playlist ativa**, a ordem definida na playlist prevalece sobre a prioridade.
- Sem playlist, a tela busca conteúdos vinculados explicitamente a ela (`telas`) ou, na ausência de vínculo explícito, conteúdos da mesma unidade/setor.
- Telas com `status = "inativa"` nunca exibem conteúdo — mostram uma mensagem institucional.
- Uma tela é considerada **offline** no painel se `lastSeenAt` não é atualizado há mais de 2 minutos (heartbeat enviado a cada 30s pelo player).

## 6. Segurança

- `firestore.rules`: leitura pública de telas e playlists (necessária para o player resolver o que exibir); conteúdos públicos apenas com `status = "ativo"`; escrita restrita a usuários autenticados com papel `admin`/`marketing`/`rh` e `ativo: true`; exceção pontual para o heartbeat (`lastSeenAt`), que o player público pode atualizar.
- `storage.rules`: leitura pública das mídias (necessária para exibição nas TVs); upload restrito a usuários autenticados, validando tipo de arquivo (`image/jpeg|png|webp`, `video/mp4|webm`) e tamanho máximo de 200MB.
- Validação de tipo e tamanho de arquivo também no frontend (`src/lib/storage.ts`): imagens até 10MB, vídeos até 200MB.
- Exclusão de conteúdo nunca remove o arquivo do Storage automaticamente — é preciso confirmar a exclusão explicitamente no painel.

## 7. Scripts

```bash
npm run dev      # desenvolvimento local
npm run build    # build de produção
npm run start    # servidor de produção
npm run lint     # ESLint
npm run seed     # popular telas de exemplo (requer admin já criado)
```

## 8. Deploy

O projeto é um app Next.js padrão — pode ser publicado na Vercel, Firebase App Hosting ou qualquer plataforma com suporte a Next.js. Lembre-se de configurar as mesmas variáveis de `.env.example` no ambiente de produção e publicar as regras de segurança (`firebase deploy --only firestore:rules,firestore:indexes,storage`) antes de liberar o acesso público às TVs.
