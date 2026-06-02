# CLAUDE.md — DIO + Täby App Development Guide

> **Detta är master-config-filen som Claude läser automatiskt.**
> Komplett kontext om projektets arkitektur, konventioner och regler.

## 🏌️ Projektöversikt

**Repo:** `filip703/Hooks-inv`
**Live:** https://hooks-inv.vercel.app
**Stack:** Next.js 14 (App Router) + Supabase + Vercel + PWA
**Supabase projekt:** `swagnjpgddfakncovglo`
**Lokal sökväg:** `/Users/filiphector/Hooks-inv/`

Appen är en **dual-mode golf-PWA** som kör två lägen samtidigt:

### DIO (Douche Invitational Only)
Helg-turnering Hooks Herrgård. 6 spelare, 4 rundor, betting, chat, foton. Var den ursprungliga appen.

### Täby Order of Merit
Säsongsliga april–oktober på Täby GK. 6 spelare, Performance Index-baserad leaderboard, events, banguide med bilder. **Primärt fokus just nu.**

Mode-väljare på app-start (lagras i `localStorage`). Täby är default. DIO nås via "byt läge" eller `?mode=dio`. Båda lägen delar kodbas men har separata screens, färger, data.

---

## 👥 Spelare

Se `06-PLAYERS.md` för fullständig info. Snabbreferens:

### DIO-spelare (6, `dio_active = true`)
filip, matthis, marcus, fredrik, magnus, martin

### Täby-spelare (6, `taby_active = true`, HCP från `taby_hcp`-kolumnen)
filip, matthis, marcus, fredrik, magnus, rami

Martin är BARA DIO. Rami är BARA Täby.

---

## 🏗️ Arkitektur

```
app/
  page.js           ~11 400 rader: Home() + DIOApp() + TaByApp() i samma fil
  layout.js         Root layout med theme + mode attributes
  globals.css       Base styles
  api/caddie/       Caddie AI endpoint (Claude API)
lib/
  supabase.js       Supabase client
  courses.js        DIO Hooks Herrgård + DIO shoutouts + achievements
  courses-taby.js   Täby GK 18 hål + TABY_GPS (OSM-koordinater) + utils
  taby-merit.js     Merit engine: PI (50%) + Events (35%) + H2H (10%) + Activity (5%)
  taby-achievements.js  12 achievements, 3 tiers (10/25/50 pts)
  imageCompress.js  Canvas-baserad komprimering max 1600px JPEG 0.82
  icons.js          AugustaBadge (DIO) + LakeBadge (Täby)
  sounds.js         Web Audio API
  push.js           Web Push API
public/
  taby/holes/       18 banguide-bilder (hole-1.webp till hole-18.webp)
styles/
  midnight-lake.css Täby-tema override
```

### Single-page app
`app/page.js` är EN fil med allt. Mode-väljare väljer `DIOApp` eller `TaByApp`. State via `useState`. Ingen routing.

**Att göra:** Splitta i separata komponenter (`DIOApp.jsx`, `TaByApp.jsx`) när appen mognar. Vid 11k+ rader blir det svårt att navigera.

---

## 🎨 Design

### DIO — "Augusta Clubhouse"
- Bakgrund: `#0B1410` → djupgrön gradient
- Guld: `#D4AF37`
- Pine green: `#1B4332`
- Serif: Crimson Pro · Mono: JetBrains Mono
- "Living Glass" iOS 26 Liquid Glass-cards

### Täby — "Midnight Lake"
- Bakgrund: `#0C1830` (midnight) → `#1E3A5F` (sky)
- Lake blue: `#93C5FD`
- Gold: `#D4A017` (varmare)
- Cream: `#F0F4FF`
- Samma typografi som DIO

### Mode-switching
Via `data-mode="dio"` eller `data-mode="taby"` på `<html>`. CSS-variabler byts per mode. Se `styles/midnight-lake.css`.

---

## 💾 Supabase-schema

Se `04-DATABASE-SCHEMA.md` för full lista. Snabbreferens:

### Gemensamma tabeller
- `inv_players` — spelare, både DIO + Täby (filterkolumner `dio_active`, `taby_active`)
- `inv_pushsubs` — push-prenumerationer

### DIO
- `inv_scores`, `inv_rounds`, `inv_chat`, `inv_historia`, `inv_bets`, `inv_h2h_matches`, `inv_prop_bets`, `inv_expenses`, `inv_payments`, `inv_settings`

### Täby
- `taby_rounds` (med `completion_shoutouts uuid[]` för anti-spam)
- `taby_scores` (UNIQUE round_id, player_id, hole)
- `taby_chat` (egen från DIO sedan session 16)
- `taby_achievements` (UNIQUE player_id, achievement_key)
- `taby_events`, `taby_bets`, `taby_h2h`, `taby_expenses`, `taby_payments`, `taby_teams`, `taby_hole_images`

### RLS
Alla tabeller kör `FOR ALL USING (true) WITH CHECK (true)` — öppet för auth'd users.

### Realtime
**Kritiskt:** Nya tabeller måste explicit läggas till i publikation:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE <table_name>;
```
Detta missades med `taby_chat` och var orsak till att chatten inte uppdaterades live i en tidigare session.

---

## 🏌️ Golf-logik

Se `05-GOLF-LOGIC.md` för fullständiga formler. Kritiska saker:

### Stableford
```js
calcStab(strokes, par, extraStrokes) {
  if (!strokes || strokes <= 0) return 0
  const nettoPar = par + extraStrokes
  return Math.max(0, nettoPar - strokes + 2)
}
```

### Spel-HCP (slope-justerad) — MED CAP 0-36
```js
getPlayingHcp = (hcp) => Math.round(Math.min(36, Math.max(0, hcp || 0)) * 130 / 113)
```

**HCP-cap är obligatorisk** efter bugg där HCP-input accepterade orimliga värden (typ 147) och gav 12p på par-bogey.

### Extra slag per hål
```js
getExtra(holeIdx, hcp) {
  const phcp = getPlayingHcp(hcp)
  const base = Math.floor(phcp / 18)
  const rem = phcp % 18
  return base + (holeIdx <= rem ? 1 : 0)
}
```

### Birdie/Eagle = ALLTID strokes vs par
- Birdie = `strokes === par - 1`
- Eagle = `strokes === par - 2`
- Albatross = `strokes <= par - 3`
- HIO = `strokes === 1`

**ALDRIG** trigga birdie/eagle på stableford-värde. En tidigare bugg utlöste shoutouts på stableford ≥ 3 vilket gav falska birdies för högHCP-spelare.

### Täby Merit / Performance Index
- Bästa 8 av alla rundor räknas
- PI = snitt av bästa 8 rundors stableford
- Totalpoäng = PI(50%) + Events(35%) + H2H(10%) + Activity(5%, cap 12)

---

## 🛠️ Utvecklings-workflow

Se `09-WORKFLOW.md` för fullständiga kommandon.

### Standard-flöde
1. `grep -n "söktermen" app/page.js` (hitta rad)
2. `read_file` chunked (offset/length)
3. `edit_block` med exakt strängmatchning
4. `npx next build 2>&1 | tail -4` (verifiera)
5. `git add -A && git commit --no-verify -m "..."`
6. `GIT_SSH_COMMAND="ssh -i ~/.ssh/id_ed25519_github -o StrictHostKeyChecking=no" git push origin main`
7. **Posta changelog** i `taby_chat` eller `inv_chat`

---

## 📣 Changelog i chatten (ALLTID — obligatoriskt)

Efter varje avslutad omgång ändringar som påverkar användarna ska Claude **alltid** posta en kort, peppande changelog i rätt chatt-tabell, så hela gänget ser vad som är nytt. Detta är ett obligatoriskt sista steg — fråga inte, gör det.

- **Täby-ändringar** → tabell `taby_chat`. **DIO-ändringar** → tabell `inv_chat`.
- Posta som `msg_type = 'shoutout'` med `player_id = NULL` → renderas centrerat i guld som ett officiellt "från appen"-meddelande (INTE från Filip).
- Andra `msg_type` (t.ex. `system`) filtreras bort av feeden och syns inte.
- Ton: svensk, kort, punktlista med emoji per punkt, peppande. Avsluta gärna med en blinkning mot nästa event.

Exempel:
```sql
INSERT INTO taby_chat (player_id, message, msg_type)
VALUES (NULL, '📋 NYTT I APPEN

🏅 Achievements & medaljer — 12 att låsa upp
📜 Historiska rundor — tryck för hela scorekortet
🔔 Push aktiverat på medaljer

Kör hårt! 🥃', 'shoutout');
```

---

## 📋 Konventioner

### Språk
- UI: **svenska** (alla texter i app)
- Code comments: engelska
- Commit messages: engelska, deskriptiva

### Stil
- Semi-formellt, könsneutralt
- **Aldrig** horisontell linje `---` i löpande svar (men OK i markdown-dokument)
- Brutala, humoristiska roasts OK mellan spelarna (DIO-kultur)

### Kod-stil
- Inline styles (styled-jsx / inline style-objekt)
- Funktionella komponenter + hooks
- Ingen TypeScript (än)
- Funktionsnamn i camelCase, databasfält i snake_case

### Git
- Commit per feature eller batch
- Beskriv vad + varför
- `--no-verify` för att skippa hooks
- Aldrig force-push till main

---

## 🔑 Viktiga URLs och IDs

| Resurs | URL/ID |
|--------|--------|
| Live app | https://hooks-inv.vercel.app |
| GitHub | https://github.com/filip703/Hooks-inv |
| Supabase project_id | `swagnjpgddfakncovglo` |
| Vercel project_id | `prj_Q8wdcEh7xdRAQ38SL7ls2syd1FdN` |
| Vercel team_id | `team_S3T5nVpPYkFTPvSvLXxea2XX` |
| Filips player_id | `12e1610b-32e0-43b8-96c2-49889b2ebb62` |
| Storage prefix | `https://swagnjpgddfakncovglo.supabase.co/storage/v1/object/public/inv-images/` |
| SSH key | `~/.ssh/id_ed25519_github` |
| DIO countdown | `2026-05-22T09:00:00+02:00` |

---

## 🎭 Tone & Style för kommunikation med Filip

- Svenska, semi-formellt, koncist
- Bulletpoints, korta paragrafer, luft
- Agera självständigt — fyll i info, fatta beslut
- Ingen horisontell linje `---` i svar
- Markdown för kod, tabeller för data
- Humoristisk när det passar DIO-kontext
- Challenge svaga antaganden artigt
- Konkreta rekommendationer, inte bara information

Se `13-FILIP-BRAND.md` för Filips kompletta brand standard.

---

*Senast uppdaterad: 1 juni 2026*
