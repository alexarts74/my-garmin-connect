# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"my-garmin-connect" — a personal running app connected to Garmin. The Garmin Connect npm lib (`garmin-connect`) requires Node.js APIs, so a separate Express backend acts as proxy.

## Repository Structure

```
my-garmin-connect/
├── CLAUDE.md                  ← This file (root)
├── my-garmin-connect/         ← Expo / React Native client
│   ├── src/
│   ├── package.json
│   ├── app.json
│   └── tsconfig.json
└── my-garmin-connect-server/  ← Express backend (Node.js)
    ├── package.json
    ├── tsconfig.json
    └── index.ts
```

**Two separate Node.js projects** with their own `package.json` and `node_modules`.

## Architecture

```
App Expo (RN)  ◄──  HTTP/JSON  ──►  Express Server  ◄──  garmin-connect  ──►  Garmin APIs
```

- **Single-user, in-memory**: no database. Server restart = re-login required.
- App calls server via fetch, uses React Query for caching.
- Auth flow: login screen → POST /auth/login → redirect to activities list.

## Commands

### Client (from `my-garmin-connect/`)
- `npx expo start` — Start the dev server
- `npx expo start --ios` / `--android` / `--web` — Start for a specific platform
- `npx expo lint` — Run linting (ESLint via Expo)
- `npx tsc --noEmit` — TypeScript check

### Server (from `my-garmin-connect-server/`)
- `npx tsx index.ts` — Start the Express server (port 3001)
- `npx tsx watch index.ts` — Start with file watching

**Both must run simultaneously** (two terminals).

No test framework is configured yet.

## Client Structure (`my-garmin-connect/`)

Built with Expo SDK 55, React 19, TypeScript (strict mode), expo-router (file-based routing).

- **`src/app/_layout.tsx`** — Root Stack layout with `QueryClientProvider`, `AuthProvider`, `ThemeProvider`.
- **`src/app/login.tsx`** — Login screen (email/password → Garmin credentials). Redirects to `/` on success.
- **`src/app/(tabs)/`** — Tab navigation group. `index.tsx` is the activities list. Redirects to `/login` if not authenticated.
- **`src/app/activity/[id].tsx`** — Activity detail screen (stack screen with back navigation).
- **`src/components/`** — Shared components. Platform-specific variants use `.web.tsx` suffix.
  - `activity-card.tsx` — Pressable card for the activities list.
  - `stat-row.tsx` — Label/value row for activity stats.
  - `app-tabs.tsx` / `app-tabs.web.tsx` — Tab bar (native tabs on mobile, custom on web).
- **`src/hooks/`** — Custom hooks.
  - `use-auth.ts` — `AuthProvider` context + `useAuth()` hook (login, logout, isAuthenticated).
  - `use-activities.ts` — `useActivities()` and `useActivity(id)` via React Query (enabled only when authenticated).
  - `use-theme.ts` — Returns current color palette.
- **`src/lib/`** — Utilities.
  - `api-client.ts` — Typed fetch wrapper (`get<T>`, `post<T>`) pointing to the Express server.
  - `format.ts` — `formatDistance`, `formatDuration`, `formatPace`, `formatDate`.
- **`src/types/garmin.ts`** — TypeScript interfaces for Garmin data.
- **`src/constants/config.ts`** — `API_BASE_URL` (auto-detects host from Expo dev server).
- **`src/constants/theme.ts`** — Design tokens: `Colors` (light/dark), `Fonts`, `Spacing` scale.

## Server Structure (`my-garmin-connect-server/`)

- **`index.ts`** — Express entry point (cors, json parsing, routes). Binds on `0.0.0.0:3001`.
- **`routes/auth.ts`** — `POST /auth/login`, `GET /auth/status`, `POST /auth/logout`. Holds `garmin-connect` client instance in memory.
- **`routes/activities.ts`** — `GET /activities?start=0&limit=20` (filtered to running only), `GET /activities/:id`.

## Design Philosophy

**Raison d'etre**: L'app Garmin Connect officielle est moche et datée. Ce projet existe pour offrir une expérience running premium, avec un design moderne, épuré et agréable à utiliser au quotidien.

### Principes UX

- **Content-first**: les données (distance, pace, durée) sont les stars. Minimiser le chrome UI autour.
- **Glanceable**: un runner doit pouvoir lire ses stats en un coup d'oeil, même en mouvement. Gros chiffres, bon contraste, hiérarchie visuelle claire.
- **Fluid & responsive**: transitions fluides, feedback haptique sur les interactions, pull-to-refresh naturel. L'app doit sembler vivante.
- **Progressive disclosure**: montrer l'essentiel d'abord, le détail au tap. Pas de surcharge d'information.

### Principes UI

- **Style**: minimaliste, contemporain, inspiré par des apps comme Strava, Nike Run Club, Apple Fitness, et les design systems de Linear/Raycast.
- **Typographie forte**: utiliser les font weights et sizes pour créer la hiérarchie — pas des bordures ou des séparateurs. Privilégier la font system (SF Pro sur iOS) pour un feel natif premium.
- **Espacement généreux**: beaucoup de whitespace. Les éléments respirent. Utiliser l'échelle `Spacing` existante de manière cohérente.
- **Couleurs**: palette neutre (noir/blanc/gris) avec une couleur d'accent pour les éléments interactifs et les données clés. Éviter les couleurs criardes. Le dark mode doit être aussi soigné que le light mode.
- **Cards & surfaces**: coins arrondis (border-radius ~12-16px), ombres subtiles ou élévation par contraste de fond. Pas de bordures dures.
- **Animations**: transitions douces (200-300ms), micro-interactions sur les boutons/cards. Utiliser `react-native-reanimated` pour les animations performantes. Pas d'animations gratuites — chaque animation doit servir le feedback utilisateur.
- **Touch targets**: minimum 44x44pt sur mobile (guideline Apple HIG). Les zones pressables doivent avoir un feedback visuel au press (opacity ou scale).

### Patterns de composants

- **Activity Card**: format horizontal, info clé visible (type d'activité icône, distance, durée, pace). Pressable avec feedback. Pas de bordure — différenciation par fond (`backgroundElement`).
- **Stat display**: gros chiffre + label petit en dessous. Utiliser la font mono pour les chiffres afin d'éviter le layout shift.
- **Listes**: `FlatList` avec séparation par espace (gap), pas par lignes/dividers.
- **Headers**: titre large style iOS (large title), sticky si pertinent.
- **Empty states & loading**: toujours soignés. Skeleton loaders plutôt que spinners. Messages d'empty state utiles et visuellement propres.

### Règles anti-clipping (IMPORTANT)

Le texte et les icônes se coupent facilement dans React Native. Respecter ces règles systématiquement :

- **`overflow: 'visible'`** sur tout conteneur à largeur contrainte (pourcentage, fixe) qui contient du texte large.
- **`paddingHorizontal`** à l'intérieur des cellules de grille — le texte ne doit jamais toucher les bords.
- **Font sizes raisonnables** : max 24px pour du texte dans une grille 50%. Les fonts mono (`Fonts.mono`) sont ~20% plus larges que les fonts système — en tenir compte.
- **Tester avec des données réelles** : ne pas valider un composant avec "54" si la donnée réelle peut être "72000". Toujours simuler les cas longs.
- **Conversion des unités Garmin côté serveur** : le poids Garmin est en grammes (72000 = 72 kg), toujours convertir dans `routes/` avant d'envoyer au client. Ne jamais afficher de valeurs brutes Garmin.

### Anti-patterns à éviter

- Bordures partout (1px solid gray) — utiliser le spacing et les fonds à la place.
- Trop de couleurs — rester sobre, max 1 accent + neutres.
- Spinners basiques — préférer les skeletons.
- Texte trop petit ou trop tassé — toujours lisible, toujours aéré.
- Texte ou icônes coupés/clippés — toujours vérifier `overflow`, padding, et taille de font dans les conteneurs contraints.
- Copier le style Garmin Connect — c'est exactement ce qu'on veut éviter.
- Composants génériques sans personnalité — chaque écran doit avoir du caractère.

## Key Conventions

- Path aliases: `@/*` maps to `./src/*`, `@/assets/*` maps to `./assets/*` (in `my-garmin-connect/tsconfig.json`).
- Experiments enabled: `typedRoutes` and `reactCompiler` (in `my-garmin-connect/app.json`).
- App uses automatic dark/light mode via `userInterfaceStyle: "automatic"`.
- Platform-specific files use Expo/RN convention: `.web.ts`, `.ios.ts`, `.android.ts`.
