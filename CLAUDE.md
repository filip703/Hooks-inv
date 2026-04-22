# CLAUDE.md – DIO + Täby App Development Guide

Denna fil läses automatiskt av Claude (Claude Code, Claude i chatten, eller via Project) för att förstå projektets kontext, arkitektur och konventioner.

## 🏌️ Projektöversikt

**Repo:** `filip703/Hooks-inv`
**Live:** https://hooks-inv.vercel.app
**Stack:** Next.js 14 (App Router) + Supabase + Vercel
**Supabase projekt:** `swagnjpgddfakncovglo`
**Lokal sökväg:** `/Users/filiphector/Hooks-inv/`

Appen är en **dual-mode golf PWA** som kör två lägen samtidigt:

### DIO (Douche Invitational Only)
Intensiv helg-turnering – Hooks Herrgård, 1–4 maj 2026. 6 spelare, 4 rundor, betting, chat, foton.

### Täby Order of Merit
Säsongsliga – Täby GK, april–oktober 2026. 6 spelare, löpande rundor, Performance Index-baserad leaderboard, events.

En mode-väljare på app-start väljer läge (sparas i `localStorage`). Både lägen delar samma kodbas men har separata screens, färger, data.

---

## 👥 Spelare

### DIO-spelare (6 st)
| Key | Namn | Nickname | HCP |
|-----|------|----------|-----|
| filip | Filip Hector | Long Gone | 7 |
| matthis | Matthis Jackobson | Pro Am | 18 |
| marcus | Marcus Ullholm | The Spreadsheet | 11.7 |
| fredrik | Fredrik Hellstenius | Old Fashioned | 15 |
| magnus | Magnus Jarlgren | Plan B | 22 |
| martin | Martin | Plus One | 40 |

### Täby-spelare (6 st)
Samma som DIO minus Martin, plus **Rami Hamdeh (Säpo, HCP 23.7)**.
Filtreras på `inv_players.taby_active = true`. HCP hämtas från `taby_hcp`-kolumnen.

---

## 🏗️ Arkitektur

### Fil-struktur
```
app/
  page.js           # Huvudfil – Home() med mode-väljare, DIOApp, TaByApp
  layout.js         # Root layout med theme + mode attributes
  globals.css       # Base styles
  api/caddie/       # Caddie AI endpoint (Claude API)
lib/
  supabase.js       # Supabase client
  courses.js        # Hooks Herrgård (Skogsbanan/Parkbanan) + DIO data
  courses-taby.js   # Täby GK – 18 hål, tees, inspel, green sections
  taby-merit.js     # Merit engine: PI (50%) + Events (35%) + H2H (10%) + Activity (5%)
  icons.js          # Custom SVG icons (Augusta style)
  sounds.js         # Audio feedback
  push.js           # Web push notifications
public/
  taby/holes/       # 18 banguide-bilder för Täby (hole-1.webp etc)
styles/
  midnight-lake.css # Täby Midnight Lake theme (blå/guld)
```

### Komponenter i page.js
- `Home()` – Mode selector (DIO / Täby), persistent via localStorage
- `DIOApp()` – Fullständig DIO-app (ca 2800 rader)
- `TaByApp()` – Täby-app med scoring, banguide, merit-leaderboard (ca 400 rader)
- `SwishModal`, `PushSubscribeButton`, `Av`, `Badge` – shared components

### Routing
Single-page app i `app/page.js`. View-state hanteras med `useState` (`appMode`, `tabyView`, etc), inte med Next routes.

---

## 🎨 Design

### DIO – "Augusta Clubhouse" (mörkt)
- Bakgrund: #0B1410 → djupgrön gradient
- Guld: #D4AF37
- Serif: Crimson Pro
- Mono: JetBrains Mono
- "Living Glass" iOS 26 Liquid Glass-cards

### Täby – "Midnight Lake" (mörkt)
- Bakgrund: #0C1830 (midnight) → #1E3A5F (sky)
- Lake blue: #93C5FD
- Gold: #D4A017 (warmer)
- Samma typografi som DIO

### CSS-arkitektur
Mode aktiveras via `data-mode="dio"` eller `data-mode="taby"` på `<html>`. CSS-variabler byts baserat på mode. Se `styles/midnight-lake.css` för Täby-override.

---

## 💾 Supabase-schema

### Gemensamma tabeller (DIO + Täby)
- `inv_players` – spelare, profilbilder, nicknames, HCP, `taby_active`, `taby_hcp`
- `inv_chat` – chat-meddelanden
- `inv_historia` – delat fotogalleri med historia
- `inv_pushsubs` – push-notis-prenumerationer

### DIO-specifika tabeller
- `inv_scores` – score per runda/hål (rond 1-4)
- `inv_bets` – H2H, LD, NP, props
- `inv_drunkometer`, `inv_bounty`, `inv_achievements` etc.

### Täby-specifika tabeller
- `taby_rounds` – rundor (id, date, type, player_ids[], event_name, notes)
- `taby_scores` – score per hål (round_id, player_id, hole, strokes, stableford)
- Unique constraint på (round_id, player_id, hole)

### RLS
Alla tabeller kör `FOR ALL USING (true) WITH CHECK (true)` – dvs öppet för auth'd users.

---

## 🏌️ Golf-logik

### Stableford
```js
calcStab(strokes, par, extraStrokes) {
  if (!strokes || strokes <= 0) return 0
  const nettoPar = par + extraStrokes
  return Math.max(0, nettoPar - strokes + 2)
}
```

### Spel-HCP (slope-justerad)
```js
getPlayingHcp(hcp) = Math.round(hcp * 130 / 113)  // Täby slope 130
```

### Extra slag per hål
Baserat på hålets index (1-18, 1 = svårast). Om spel-HCP > 18 får alla hål +1, resten efter index.

### Täby Merit (Performance Index)
- Bästa 8 av alla rundor räknas
- PI = snitt av bästa 8 rundors stableford
- Totalpoäng = PI(50%) + Events(35%) + H2H(10%) + Activity(5%, cap 12)

---

## 🛠️ Utvecklings-workflow

### Lokalt
```bash
cd ~/Hooks-inv
npm install
npm run dev  # http://localhost:3000
```

### Deploy
Push till `main` → Vercel auto-deploy på hooks-inv.vercel.app.

### Supabase-migreringar
Kör SQL direkt i Supabase Dashboard eller via MCP (`Supabase:execute_sql`). Glöm inte RLS-policies!

### Skapa nya features
1. Definiera i Supabase (om DB behövs)
2. Lägg till state i `TaByApp` eller `DIOApp` i `page.js`
3. Lägg till view i tab-nav
4. Testa på lokal `npm run dev`
5. Commit + push

---

## 📋 Konventioner

### Språk
- UI: **svenska** (alla texter i app)
- Code comments: engelska
- Commit messages: engelska, deskriptiva (se CHANGELOG.md)

### Stil
- Semi-formellt, könsneutralt
- Ingen "---" i dokument eller output
- Brutala, humoristiska roasts OK mellan spelarna (DIO-kultur)

### Kod-stil
- Inline styles (styled-jsx/inline style objects)
- Funktionella komponenter + hooks
- Ingen TypeScript (än)
- Funktionsnamn i camelCase, databasfält i snake_case

### Git
- Commit per feature eller batch
- Beskriv vad + varför i message
- Ingen force-push till main

---

## 🎯 Top-of-mind (oktober 2026)

### Klart och live
- [x] Dual mode DIO ↔ Täby med localStorage
- [x] Täby login med 6 spelare från DB
- [x] Skapa runda (solo/grupp/event), spara till taby_rounds
- [x] 18-hål scorekort med stableford, auto-save
- [x] Totalslag vs par, netto, spel-HCP
- [x] Leaderboard med Performance Index
- [x] Rundhistorik (stats-vy)
- [x] 18 banguide-bilder + speltips
- [x] DIO historia fetch-on-load + multi-upload

### Pending (prioriterat)
- [ ] Rami profilbild till Supabase storage (kräver service_role key eller dashboard)
- [ ] **Täby betting** – Nassau, Skins, Bounties (återanvänd DIO-logik)
- [ ] **H2H-matris** – alla mot alla, win/loss per par
- [ ] **Hålstatistik per spelare** – snitt per hål, bästa/sämsta
- [ ] **Event-system** – The Opener (maj), Midsommar Match (jun), Sommar-KM (aug), The Final (okt)
- [ ] **Caddie AI för Täby** – anpassa prompt med Täby håldata
- [ ] **Formkurva/sparkline** per spelare
- [ ] **Chat delad** DIO + Täby
- [ ] **Push-notiser** för nya Täby-rundor
- [ ] **GPS-positionering** på banguide-bilder

### DIO Pending
- [ ] Verifiera countdown (2026-05-01T09:00:00+02:00)
- [ ] Full mobiltest före 1 maj
- [ ] PWABuilder → App Store

---

## 🔑 Viktiga URLs och IDs

| Resurs | URL/ID |
|--------|--------|
| Live app | https://hooks-inv.vercel.app |
| GitHub | https://github.com/filip703/Hooks-inv |
| Supabase | swagnjpgddfakncovglo |
| Vercel projekt | prj_Q8wdcEh7xdRAQ38SL7ls2syd1FdN |
| DIO countdown | 2026-05-01T09:00:00+02:00 |

---

## 🎭 Tone & Style för kommunikation

När Claude pratar med Filip om denna app:
- Svenska, semi-formellt, koncist
- Bulletpoints, korta paragrafer, luft
- Agera självständigt – fyll i info, fatta beslut
- Ingen horisontell linje `---` i svar
- Markdown för kod, tabeller för data
- Humoristisk när det passar DIO-kontext

---

*Senast uppdaterad: 20 april 2026 (efter session 7)*
