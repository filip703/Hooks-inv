# Hooks-inv – DIO + Täby Golf PWA

Dual-mode golf-app byggd i Next.js 14 + Supabase + Vercel.

## 🏌️ Två lägen i en app

### DIO (Douche Invitational Only)
Helg-turnering Hooks Herrgård 1–4 maj 2026. 6 spelare, 4 rundor, full scoring, betting, chat, foto, Caddie AI.

### Täby Order of Merit
Säsong april–oktober 2026 på Täby GK. 6 spelare, Performance Index-baserad leaderboard, events, banguide med bilder.

Mode väljs på app-start och sparas i `localStorage`.

## 🚀 Komma igång

```bash
git clone https://github.com/filip703/Hooks-inv.git
cd Hooks-inv
npm install
npm run dev
```

Öppna http://localhost:3000

## 🔧 Environment

Skapa `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://swagnjpgddfakncovglo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
ANTHROPIC_API_KEY=<key för Caddie AI>
VAPID_PUBLIC_KEY=<för push notifications>
VAPID_PRIVATE_KEY=<för push notifications>
```

## 📦 Deploy

Push till `main` → Vercel deployar automatiskt till hooks-inv.vercel.app.

## 🧱 Arkitektur

```
app/page.js         Huvudfil – Home() med mode-väljare, DIOApp, TaByApp
lib/courses.js      DIO – Hooks Herrgård håldata
lib/courses-taby.js Täby GK – 18 hål, tees, inspel
lib/taby-merit.js   Performance Index-engine
lib/supabase.js     Supabase client
styles/midnight-lake.css  Täby-tema
public/taby/holes/  18 banguide-bilder
```

## 📝 Utvecklingsguide

Se `CLAUDE.md` för full dokumentation om arkitektur, konventioner, Supabase-schema och golf-logik.

## 🎯 Roadmap

Se `CLAUDE.md` sektion "Top-of-mind".

## 📄 Licens

Privat projekt för Douche Invitational Only och Täby Order of Merit.
