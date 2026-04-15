# Douche Invitational Only 2026 🏆

> *Marcus U 2021 · Filip H 2022 · Magnus J 2024 · Matthis The Great – Överlägsen 2025*

Live scoring-app för **Douche Invitational Only** (DIO) – en årlig golftävling på Hooks Herrgård, Småland. Bucklan heter **Le Douche de Golf**.

**Live:** [hooks-inv.vercel.app](https://hooks-inv.vercel.app)

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14, React 18 |
| Backend | Supabase (Postgres + Realtime + Storage) |
| Hosting | Vercel (auto-deploy via GitHub) |
| PWA | Service Worker, Web App Manifest |
| Audio | Web Audio API (fungerar på silent mode) |

## Features

**Scoring**
- Stableford netto med slope-justerat playing HCP
- Fullscreen hål-för-hål scoring med stora +/- knappar
- Par som default – ett klick för att registrera
- Extra slag visas som gröna prickar per hål
- Dubbla poäng hål 16-18 (lagtävling)
- Hot Hand (+2 vid 3 birdies i rad) / Cold Turkey (-1 vid 3 nollor)

**Tävlingar**
- The Green Jacket – individuellt, 72 hål (vinnaren får Le Douche de Golf)
- LIV Team Battle – 2 bästa per runda, 2x poäng sista 3 hålen
- Daily Loser – sämst per runda köper kvällens första
- Konsistenskungen – lägst spridning
- LD & NP – markerade per runda i scorekortet

**Social**
- Live chat med bildupload (kamera/galleri)
- @-tagging med autocomplete
- Radera egna meddelanden (admin kan radera alla)
- Auto-postade birdies/eagles/nollor i chatten

**Banguide**
- 36 flyover-videos (18 per bana) streamade från CloudFront/LiveCaddie
- Klicka hålnumret → fullscreen med video + alla spelares resultat
- Tips per hål

**Gamification**
- 8 achievements (First Blood, Eagle Eye, Steady Eddie, etc.)
- Notification center med oläst-badge
- Ljudeffekter: birdie-chime, eagle-fanfar, nolla-trombon, chat-pip
- Roterande roasts (5-6 per spelare)
- Pep talks på login-skärmen

**Musik**
- Walk-up music per spelare per dag (fre/lör/sön) med Spotify-länkar
- 4 episka spellistor för helgen

**PWA**
- Installerbar på hemskärmen (iOS + Android)
- Offline-stöd via Service Worker
- Safe areas för Dynamic Island/notch
- Zoom tillåtet
- Netflix-style splash screen med DIO-badge

**Even Steven (expense split)**
- Lägg till utgifter med belopp, beskrivning och tagg
- Auto-split mellan alla spelare
- Optimal settlement plan (minimalt antal transaktioner)
- Live-balans och "gör upp"-instruktioner
- Supabase realtime

**Stats & Awards**
- Head-to-head jämförelse mellan valfria spelare
- Prisutdelning: Le Douche de Golf, Daily Loser, Konsistenskungen
- Rundstats: birdies, nollor, topscorer per runda
- Live-ticker med ▲▼ pilar på leaderboard
- Countdown till första tee

## Projektstruktur

```
app/
  layout.js        – Root layout, PWA meta, fonts, service worker
  globals.css      – Mobile-first dark theme, safe areas, PWA styles
  page.js          – Hela appen (single-page, ~780 rader)
lib/
  courses.js       – Bandata, Stableford, roasts, Spotify, achievements, flyovers
  supabase.js      – Supabase client (hanterar saknade env vars vid build)
  sounds.js        – Web Audio API ljudeffekter
public/
  manifest.json    – PWA manifest
  sw.js            – Service Worker
  favicon.ico      – Favicon (DIO 2026, bucklan)
  icon-192.png     – PWA ikon 192x192 (bucklan)
  icon-512.png     – PWA ikon 512x512 (bucklan)
  apple-touch-icon.png – iOS hemskärmsikon (bucklan)
```

## Supabase

Alla tabeller prefixade `inv_` (delar projekt med Site Survey).

| Tabell | Syfte |
|--------|-------|
| `inv_players` | Spelare + spectator, hcp, team, roast, image_url |
| `inv_rounds` | 4 rundor med bana och status |
| `inv_scores` | Score per spelare/runda/hål (strokes + stableford) |
| `inv_chat` | Chat + auto-postade shoutouts/roasts |
| `inv_side_comps` | LD/NP-vinnare per runda |

Storage bucket: `inv-images` (spelarfoton + chatbilder)

## Utveckling

```bash
# Klona
git clone git@github.com:filip703/Hooks-inv.git
cd Hooks-inv

# Installera
npm install

# Env vars (skapa .env.local)
NEXT_PUBLIC_SUPABASE_URL=https://swagnjpgddfakncovglo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<se Vercel env vars>

# Kör lokalt
npm run dev
```

## Deploy

Push till `main` → Vercel auto-deployer.

**Viktigt innan push:**
1. Testa lokalt med `npm run dev`
2. Kolla CHANGELOG.md – lägg till dina ändringar
3. Beskriv vad du ändrat i commit-meddelandet
4. Pusha till main → deploy triggas automatiskt

## Kontakt

- **Filip Hector** – app, design, allt
- **Marcus Ullholm** – collaborator

## Spelare 2026

| Spelare | HCP | Nickname | Team |
|---------|-----|----------|------|
| Filip Hector | 7.5 | The Captain | Smaragderna |
| Matthis Jackobson | 14.8 | G&T | Smaragderna |
| Magnus Jarlgren | 22.8 | Beach Boy | Smaragderna |
| Marcus Ullholm | 11.7 | The Blazer | Stålklubban |
| Fredrik Hellstenius | 22.3 | Iceman | Stålklubban |
| Martin Jarlgren | ~40 | The Rookie | Stålklubban |
