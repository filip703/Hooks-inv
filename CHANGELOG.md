# DIO – Douche Invitational Only 2026

## Changelog

Komplett utvecklingshistorik för DIO-appen (hooks-inv.vercel.app).

Turnering: **1–3 maj 2026 · Hooks Herrgård · 6 spelare · 4 rundor**

## 22 april 2026 (session 11) – Täby scoring DIO-parity + Spectator mode

### 🎯 Score-hantering som DIO
- **Ljudeffekter** vid birdies/eagles/blowups (soundBirdie, soundEagle, soundZero)
- **Toast notifications** dyker upp vid varje score – eagle = guldgradient, birdie = grön, blowup = röd
- **Auto-post till chat** vid birdies och eagles (så DIO-spelare också ser Täby-drama)
- **UT/IN 9-hålstotaler** i scoring-vyn med slag + stableford per 9
- **Hot Hand / Cold Turkey streak-indikator** live i rundan (3+ birdies i rad eller 3+ nollor)
- **MOTSTÅNDARNA-panel** i scoring-vyn – alla andra spelare i rundan med deras totala slag + poäng + progress
- **Min hål-historik** i fullscreen: "Förra: X slag (Yp) · Bäst: Zp · N gånger spelat"

### 👀 Spectator Mode
- **Följ annan spelares runda** – klicka på vem som helst i Order of Merit-leaderboard
- Full read-only vy med stor stats-card (stableford, slag vs par, hål spelade)
- Hål-för-hål breakdown (UT/IN) med färgkodning på stableford
- Visar "🔴 LIVE" om rundan pågår, annars datum för senaste rundan
- Realtime-uppdatering via Supabase (ändringar i annans runda syns direkt)

### 📖 Banguide-modal från scoring
- Klickbar banguide-bild i fullscreen-vyn öppnar full-screen banguide-modal
- Större bild + speltips + vatten-varning
- Snabbkoll utan att lämna scoringflödet

## 22 april 2026 (session 10) – Mega-feature-release

### Täby Fullscreen Scoring
- Täby-scoring nu med DIO's fullscreen-UX: stort hålnummer, +/- score-input, Caddie AI
- Ghost Match vs förra rundan
- "Andra på detta hål" live
- Vatten-badges på relevanta hål

### Strokes-visibility
- Totalt antal slag visas nu i både DIO och Täby leaderboards
- DIO compact round table visar slag-kolumn
- Per-rund snitt slag per spelare i Täby

### Täby Betting
- Odds-bets med auto-odds från HCP
- H2H-matcher med stake
- Insats-system med 50kr quick-bet
- Avgjorda bets sektion

### H2H-Matris
- Alla-mot-alla win/loss matris i Täby stats
- Per hål-jämförelse av stableford över gemensamma rundor

### Event-System
- 4 events visas i leaderboard: The Opener, Midsommar Match, Sommar-KM, The Final
- Status-badges: Upcoming / Aktiv / Avslutad

### Caddie AI för Täby
- Samma /api/caddie route, nu med Täby-hålkontext
- Vattenhål, index, meters, speltips inkluderat i prompt

### Formkurva
- SVG Sparkline per spelare i båda leaderboards
- Senaste 4-8 rundors poäng visualiserat

## 22 april 2026

### Rami-fix + repo-städning
- Tog bort Rami från DIO-läget via ny dio_active=false flagga i Supabase
- DIO-query filtrerar nu på dio_active=true (app/page.js rad 703)
- Rami kvar i Täby-läget som vanligt (via taby_active=true)
- Raderade hela hooks-clean/ duplikatmappen (~40 filer, 10MB)
- Raderade alla .DS_Store-filer, lade till i .gitignore

### Dokumentation + workflow
- CLAUDE.md uppdaterad med full projektarkitektur
- Ny SESSION-LOG.md för att spåra sessions-arbete
- Etablerat workflow: chatten (planering) → Claude Code (exekvering) → GitHub Desktop (backup)

---

## 16 april 2026

### 🔔 Push-notis-system
- Komplett push notification-system med **6 triggers**: Eagles/Birdies, Prop bet avgjord, H2H avgjord, Ny skuld, Chat @-mention, Ledarbyte
- VAPID-nycklar genererade + edge function `send-push` deployad
- Service worker uppdaterad med push-handler + click-to-open
- Per-enhet push-subscription (iPhone + Mac = dubbla notiser)
- 5 granulära toggles per spelare (kan stänga av specifika typer)
- `inv_push_subscriptions`-tabell + 5 `notif_*`-kolumner

### 📢 Admin broadcast
- Ny admin-sektion: **📢 Skicka push-notis**
- 6 snabbval: Tee-off / Bar / Spa / Middag / Prisutdelning / Gruppfoto
- Mottagar-val: alla / alla utom mig / specifik spelare
- Live förhandsgranskning innan skick
- Titel (60 tecken) + meddelande (200 tecken)

### 🎨 GUI-uppgradering (golf-känsla)
- Bottom nav reducerad från **9 → 3 tabs** (LEDARE, SCORE, MENY)
- **Hamburger-meny** med slide-in animation + backdrop blur
- Masters-green jacket gradient på #1 på leaderboard
- Scorecard-kort med guld pin-stripe: röd accent på svåra hål (hcp 1-3), grön på lätta (16-18)
- Fairway-grön + guld radial gradients i bakgrunden
- Login-titel med guld/cream gradient-text
- Button press-animation (scale 0.98)

### 🔒 Säkerhet – PIN-system
- Default PIN **0000** för alla spelare (ej spectator)
- Tvingad PIN-ändring vid första inloggning
- PIN-verifiering vid alla framtida inloggningar
- Admin kan resetta/sätta PIN per spelare
- ⚠️ "ej bytt"-flagga visas för spelare med default-PIN

### 💸 Swish-betalningar
- **💸 Swisha-knapp** i settlement "GÖR UPP"-sektion
- Använder `swish://payment` URL-schema
- Öppnar Swish-appen med nummer + belopp + meddelande förifyllt
- Visas endast när **du** är skyldig någon som har telefon

### 👤 Min Profil-flik
- Avatar + nickname + HCP + lag
- Telefon (för Swish) + email
- Walk-up anthem + profilbild URL
- Granulära notis-toggles (5 st)
- Daglig sammanfattning + ljudeffekter
- PIN-hantering
- Snabbåtgärder: maila sammanfattning, dela status, logga ut
- Tydlig **💾 Spara profil**-knapp (kontrollerade inputs)

### 🐛 Bugfixar
- Profil-form synkas nu korrekt när view öppnas
- `user`-state uppdateras direkt efter spara (ingen stale data)
- Prop bets-wrapper `<div>` återställd
- Dubbel Even Steven-rubrik borttagen
- Swish-knapp-visibilitet korrekt (bara egna skulder)

---

## 15 april 2026 (kväll)

### ⛳ Banguide omskriven
- **Alla 36 hål** har nu riktiga strategier + episka roasts
- Klubbrekommendationer för 7-22 hcp
- Bana-specifika tips (vatten, bunkers, doglegs, OB)
- Skogsbanan: tät skog med vatten på hål 5/10/12/15
- Parkbanan: öppen, Hokasjön-vatten på hål 10/11/13/16/17
- Lokala regler refererade (röd straff oändligt vänster hål 10 Skog)
- Spelar-specifika roasts vävda in i strategin

### 💰 Even Steven – settlement fix
- **3 separata logiker** för olika transaktionstyper:
  - **Bet** (bet_type satt): LOSER betalar, WINNER får
  - **Personal** (target, ingen bet_type): la ut pengar → skyldig
  - **Shared** (ingen target): delas lika mellan alla
- LD/NP winner-display fixad (visade förlorare innan)
- Delete-knappar på prop bets + H2H-matcher
- Auto-generated expenses raderas när bet tas bort

---

## 15 april 2026 (eftermiddag)

### 🎲 Prop Bets
- Fri fråga + odds + valfri bank (banker_key)
- Alternativ som komma-separerad lista
- Röster sparas per spelare
- Admin avgör vinnare → auto-settlement via Even Steven
- Bank-mode: bank betalar vinnare, förlorare betalar bank
- Utan bank: förlorar-pool delas jämnt mellan vinnare

### ⚔️ Head-to-Head
- Alla spelare kan skapa H2H-matcher (ingen gräns per runda)
- Multi-matchup i leaderboard med + knapp
- Auto-genererad expense när winner_key sätts

### 📸 Fotogalleri
- 2-kolumns grid från chat-bilder
- Gradient overlay + lazy loading

### 🧹 Stor städning
- **243 rader** dubbla sektioner borttagna (Even Steven, H2H, Stats, Gallery)

---

## 15 april 2026 (förmiddag)

### 💰 Even Steven v1
- Utgifter med 3 tags: mat / bar / aktivitet
- Person-to-person: "Marcus betalar" dropdown
- Shared expenses delas lika mellan alla
- Settlement-plan minimerar transaktioner
- H2H bets (100 kr standardbas)
- LD/NP sidospel (50 kr)

### 🏆 Stats & Awards
- Le Douche de Golf (individuellt)
- LIV Team Battle (2 bästa per runda, hål 16-18 dubbla)
- Daily Loser (sämst per runda)
- Konsistenskungen (lägst σ)
- Hot Hand (+2 vid 3 birdies i rad)
- Cold Turkey (-1 vid 3 nollor)
- Live-ticker ▲▼ för positionsändringar

### ⏰ Countdown
- Timer till turneringsstart
- UI-polish: glassmorphism, animations

---

## 15 april 2026 (morgon)

### ⚙️ Admin Settings
- HCP per spelare (realtime-update)
- Lagindelning (green/blue)
- Banval per runda (Skog/Park)
- Slope/CR-justering
- Specialhål-setup
- Delete scores/rundor

### 📱 PWA-fix iOS
- Install-prompt med Safari-instruktioner
- Safe-area-inset-support
- Icon-manifest korrekt

### 🎨 Identity
- Namn fastställt: **Douche Invitational Only**
- Trofé: **Le Douche de Golf**
- Official DIO badge (golfer + beer) som app-ikon
- Netflix-style splash screen (2.8s animation)
- README + initial CHANGELOG

---

## 14 april 2026 (sen kväll)

### 🎵 Spotify + gamification
- Walk-up music per spelare (18 verifierade track IDs)
- Spotify deeplinks (öppnar appen direkt)
- Playlists per runda
- Strokes + Stableford visas per hål
- PWA-optimering: service worker, offline support
- Install-prompt

### 🔔 Notification center
- Notishistorik (50 senaste)
- Forced sound effects (eagle/birdie/zero)
- Unread-badge

### ⛳ Score-UX
- Fullscreen score input (mobile-first)
- Hole-för-hole navigation
- Shoutouts auto-postade till chat (eagle/birdie)
- Zero roasts (auto-hån)
- Venue images per bana

---

## 14 april 2026 (kväll)

### Phase 7-9: Polish
- Flyover-videos (36 UUIDs från CloudFront)
- Chat: delete, @-tagging, bilduppladdning
- Spectator-mode (ingen PIN, observera only)
- Specialhål markerade
- Streak-detection

### Phase 5-6: Banguide
- Modal för hole-info
- Roterande roasts
- Chat-fix (realtime)

### Phase 3-4: UI
- Spelarbilder
- Streaks (Hot Hand / Cold Turkey)
- Mood-system

---

## 14 april 2026 (eftermiddag–start)

### Phase 1-2: Grundbygge
- **Phase 1:** Initial app-struktur, 6 spelare, 4 rundor
- **Phase 2:** Chat, admin-scoring, persistent login, PWA
- Supabase-schema: players, rounds, scores, chat
- Next.js 14 + React + Supabase realtime
- Vercel auto-deploy
- Mobile-first dark theme (guld/grön/cream palett)

---

## Teknisk stack

| Lager | Tech |
|-------|------|
| Frontend | Next.js 14 + React + Tailwind-style inline CSS |
| Backend | Supabase (Postgres + Realtime) |
| Edge functions | Deno runtime (`send-push`) |
| Push | Web Push API + VAPID |
| Hosting | Vercel (auto-deploy från GitHub main) |
| Repo | github.com/filip703/Hooks-inv |
| DB ref | swagnjpgddfakncovglo |

---

## Databas-tabeller

- `inv_players` – spelare (17 kolumner inkl. phone, email, pin, 5 notif-preferences)
- `inv_rounds` – 4 rundor
- `inv_scores` – score per spelare/runda/hål
- `inv_chat` – meddelanden med text + bilder
- `inv_expenses` – Even Steven transaktioner
- `inv_h2h_matches` – 1v1 bets per runda
- `inv_prop_bets` – odds-baserade prop bets
- `inv_push_subscriptions` – push-endpoints per enhet
- `inv_settings` – key-value settings

---

## Kvar att bygga

- [ ] Riktigt decimal odds-betting-system med bank (spec klar)
- [ ] Daily Loser auto-expense
- [ ] Uppdaterad DIO-Manual PDF
- [ ] Fulltest innan turneringen
- [ ] Verifiera countdown-datum

---

**Byggd av Filip + Claude · DIO 2026 · Hooks Herrgård**
