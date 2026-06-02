# Täby Order of Merit — Features

> Allt som finns i Täby-läget per 1 juni 2026.

---

## 🎬 Splash — "The Roster"

**Vad:** Cinematisk presentation av startfältet när appen öppnas i Täby-läge.

**Detaljer:**
- Ledaren visas stor med statisk gold-krona 👑 + "LEDER ORDER OF MERIT"
- Övriga 5 spelare i mindre format med stagger-animation (0.42s mellan)
- Mjuk gold glow runt hjälten
- Total timing: 6800ms exit-start, 7500ms borta
- Bypassas vid push-klick (sessionStorage.pending_view)

**Var i koden:** `app/page.js` rad ~1135-1196
**State:** `rosterPlayers`, `rosterHero`

---

## 🏆 Leaderboard (Order of Merit)

**Vad:** Listar alla 6 spelare rankade efter Performance Index (50%) + Events (35%) + H2H (10%) + Activity (5%).

**Visar per spelare:**
- Ranking (1-6)
- Profilbild (med gold-kant på ledare, grön kant om LIVE)
- Nickname + ev. **achievement-ikon** (finaste medaljen)
- 🔴 **LIVE-badge** (pulserande röd) om pågående runda
- Trendpil (▲▼)
- Sparkline (formkurva)
- HCP + antal fulla rundor
- Event-poäng (om har)
- Performance Index

**Klick:**
- Egen → öppnar Stats-vy med deep dive
- Annan → öppnar **Spectate-overlay** (live om pågående, annars senaste rundan)

---

## 👑 Säsongsmästar-krona

**Vad:** Premium gold-banner ovanför Order of Merit som lyfter PI-ledaren.

**Detaljer:**
- Foto med 👑, nickname, PI, antal rundor
- Klick → öppnar djupvy
- Visas bara om ledaren har minst 1 full runda

---

## 🔴 LIVE-spectate

**Vad:** Tjuvkik på en kompis pågående runda i realtid.

**Hur det fungerar:**
1. Live-detektion: runda skapad senaste 24h + 1-17 hål reggade + ej completed
2. Visas som pulserande röd badge bredvid namnet i leaderboarden
3. Klick på spelare → spectate-overlay öppnas
4. `taby_scores_rt`-realtime-kanalen → score uppdateras hål för hål LIVE
5. Visar hela 18-håls scorekortet med UT/IN

---

## 📜 Historisk runddetalj

**Vad:** Klicka en historisk runda → se hela scorekortet för alla deltagare.

**Detaljer:**
- Matris: alla deltagare × 18 hål
- Färgkodning mot par: guld=eagle+, grön=birdie, blå=par, ljus=bogey, röd=dubbel+
- Sorterat på stableford med 👑 på vinnaren
- Sticky namnkolumn + horisontell scroll (mobilvänligt)
- Par-rad, totalkolumn (poäng + slag), färgförklaring

**Tillgång:** Stats-vy → välj spelare → klick på en runda i Rundhistorik

---

## 🏅 Achievements & medaljer

**12 achievements i 3 tiers** (10/25/50 bonuspoäng):

### Tier 1 (10p)
- 🩸 First Blood — första rundan
- 🐦 First Birdie — din första birdie
- 📅 Veteran — 5 fulla rundor

### Tier 2 (25p)
- 🛡️ Clean Sheet — full runda utan nolla
- 🔥 Hot Hand — netto stableford ≥3 i 3 hål i rad
- 💪 Big Round — 36+ stableford
- 🎯 Birdie Machine — 10 birdies totalt
- 🏞️ Par Machine — 50 par totalt
- ⚖️ Consistent — 3 fulla rundor i rad inom 4p

### Tier 3 (50p)
- 🦅 Eagle — gör en eagle
- 🏛️ Veteran 10 — 10 fulla rundor
- 👑 Leader — ledare i Order of Merit

**Visning:**
- Finaste medaljen som ikon bredvid namnet
- Hela grid (4×3) i player card
- Medaljpoäng (bonus, påverkar INTE OOM)

**Upplåsning:**
- `checkNewAchievements()` körs efter varje sparad score
- Första gången → tyst catch-up (sparar alla retroaktiva utan notiser)
- Därefter → shoutout + push + toast + eagle-sound

---

## ⛳ Klar-runda-shoutout

**Vad:** När en spelare reggat alla 18 hål postas en shoutout.

**Triggas av:** `checkRoundCompletion()` i `saveHoleScore` när 18 hål är klara.

**Vad postas:**
- Shoutout i `taby_chat`: `"⛳ {nickname} är klar med rundan! {stab}p · {slag} slag ({vsPar}) · 18 hål · Täby GK\n{flair}"`
- Push till alla taby-spelare som **inte** var med i rundan
- Toast + eagle-sound till spelaren själv

**Flair:**
- 40+ → "🔥 Hett!"
- 36+ → "💪 Riktigt bra!"
- 30+ → "👏 Solid."
- 24+ → "👍 OK runda."
- <24 → "🥃 Bättre lycka nästa gång."

**Anti-spam:** `taby_rounds.completion_shoutouts uuid[]` — spelaren postas bara en gång per runda.

---

## 🏛️ Klubbhuset (gruppöversikt)

**Vad:** 4 säsongsledare-kort överst i Stats-vyn.

**Visar:**
- 🐦 Flest birdies
- 📈 Bäst form (snitt 3 senaste rundorna)
- 🎯 Högst snitt
- 🔥 Mest aktiv (flest rundor)

Tryck på kort → öppnar spelarens djupvy.

---

## 📊 Player deep dive

**Vad:** Detaljerad stats-vy per spelare.

**Sektioner:**
- Profilbild + HCP + antal rundor + PI
- **Rundhistorik** — alla rundor som klickbara staplar
- **Achievements grid** — alla 12 medaljer
- Medaljpoäng-total
- Event-poäng + placeringar
- H2H-statistik

---

## 🔥 Dubbel streak-indikator

**Vad:** I scoring-vyn under en aktiv runda:

- 🔥 **Hot Hand (netto)** — 3p stableford i 3 hål i rad — Filips formregel
- 🦅 **Gross birdies i rad** — riktiga birdies — DIO-stil
- ❄️ **Cold Turkey** — 0p i 3 hål i rad

Två separata streak-räknare visas parallellt.

---

## ⛳ Scoring-flow

**Vad:** Hål för hål-registrering med one-pager-känsla.

**Detaljer:**
- Auto-öppna senaste ospelade hål när rundan startas/återupptas
- Hole-strip överst med visuell progress + score-färger (per format)
- Stort knappgränssnitt för stableford / slag
- Auto-shoutout vid birdie/eagle/HIO med ljud
- "Marker-mode" — registrera score åt en annan spelare
- Auto-save till `taby_scores` (upsert)
- Realtime till andra klienter

---

## 🗺️ GPS + Banguide

**Vad:** Avstånd till green per hål, tap-to-distance på banbild.

**Detaljer:**
- GPS-prick på app-toppen visar "Hål N · 142m"
- Banguide-modal per hål: bild + speltips + tap för avstånd
- OpenStreetMap-koordinater (gratis, Täby GK kartlagd)
- Y-axeln är inverterad (top of image = green, bottom = tee)
- Lateral GPS scale kalibrerad (~0.002)

---

## 🎲 Spelformat

**Vad:** Stöd för flera spelformat.

**Format:**
- **Stableford** (default) — räknas för OOM
- **Slagspel** (stroke play)
- **Matchplay** — välj motståndare
- **Skins** — pott per hål
- **Lag** (lagspel)

Hole-strip-färger, totalrad och widgets anpassar sig efter format.

---

## 🎯 Events

**Vad:** Säsongens nyckelhändelser. Placeringar 1-6 ger merit-poäng.

**Standard-events:**
- The Opener (10 maj)
- Midsommar Match (21 juni)
- Sommar-KM (15 aug)
- The Final (4 okt)

**Merit-poäng vid placering:** 25, 18, 12, 8, 5, 2

---

## ⚔️ H2H (Head-to-Head)

**Vad:** En-mot-en-matcher.

**Detaljer:**
- Skapa H2H mellan två spelare i Settings
- Stake (default 100kr)
- Avgör vinnare → auto-genererar expense i wallet
- Statistik per spelare: vinst-% (kräver minst 3 matcher)

---

## 💰 Wallet (Even Steven)

**Vad:** Skuld-tracker.

**Detaljer:**
- Utgifter med tags: mat / bar / aktivitet / övrigt
- Person-to-person eller delat-på-alla
- Settlement-plan som minimerar transaktioner
- Swish-deeplink + QR-kod backup
- Auto-genererade expenses från avgjorda bets/H2H

---

## 💬 Chat (Feed)

**Vad:** Egen Täby-chatt (separat från DIO).

**Detaljer:**
- Realtime via `taby_chat_rt`-kanal
- Text + bilder + videos (komprimerade)
- @-mentions med autocomplete
- Optimistic update (visas direkt med "tmp-" prefix-ID)
- Shoutouts med `player_id: NULL` renderas centrerat i guld
- Pull-to-refresh
- Bilder komprimeras automatiskt

**Auto-postar:**
- Birdies/eagles/HIO
- Achievement-upplåsningar
- Klar-runda
- Changelogs (från Claude/Filip)

---

## 🤖 Caddie AI

**Vad:** Anthropic Claude API ger råd inför slaget.

**Endpoint:** `/api/caddie/route.js`
**Triggers:** Knapp i scoring-fullscreen
**Input:** Hål, par, distans, väder, spelarens form
**Output:** Kort råd (klubbval, riktning, mental approach)

---

## 🖼️ Bildkomprimering

**Vad:** Alla bilder komprimeras automatiskt.

**Detaljer:**
- Canvas-baserat
- Max 1600px (längsta sidan)
- JPEG quality 0.82
- ~10–20× mindre filer
- Bevarar EXIF-orientation

**Var:** `lib/imageCompress.js`

---

## 🔔 Push-notiser (Täby)

**Triggas av:**
- Ny runda startad → "Joina rundan!" / "FYI"
- Birdie/eagle/HIO av andra
- Ny medalj upplåst
- Klar-runda av andra
- Broadcast från admin
- Mentions i chat
