# DIO (Douche Invitational Only) — Features

> Allt som finns i DIO-läget. Sist använt på riktigt i maj 2026, kvar som produktion-redo.

---

## Översikt

DIO är den **ursprungliga** appen. En helg-turnering på Hooks Herrgård där 6 kompisar spelar 4 rundor över 3 dagar med betting, chat, foto, achievements.

**Datum 2026:** 22-24 maj (klart)
**Bana:** Hooks Herrgård (Skogsbanan + Parkbanan)
**Antal rundor:** 4
**Antal spelare:** 6
**Trofé:** Le Douche de Golf

---

## 🏆 The Green Jacket (huvudtävling)

72 hål stableford netto (fullt HCP, slope-justerat). Vinnaren får trofén.

## ⚔️ LIV Team Battle

**Två lag:**
- **Jägermeister** (filip, matthis, magnus)
- **Fernet** (marcus, fredrik, martin)

**Regler:**
- 2 bästa av 3 spelares poäng räknas per runda
- Hål 16-18 = dubbla stableford-poäng

## 💔 Daily Loser

Sämst stableford per runda köper kvällens första dryck.

## 📊 Konsistenskungen

Lägst standardavvikelse mellan rundorna.

## 🔥 Streak-bonusar

- **Hot Hand:** 3 birdies (3+ poäng) i rad = +2 bonus
- **Cold Turkey:** 3 nollor i rad = -1

## ⚡ Rookie Rule

Martin capad på 36 HCP (specialregel).

---

## Sidotävlingar per runda

- **Longest Drive (LD)** — markerat hål per runda
- **Närmast Pin (NP)** — markerat hål per runda

---

## 💰 Even Steven (Wallet)

**3 tags:** mat / bar / aktivitet
**Person-to-person** ("Marcus betalar") eller **shared** (delas lika)
**Settlement-plan** minimerar transaktioner
**H2H bets** (100 kr standardbas)
**LD/NP sidospel** (50 kr)
**Swish-deeplink** + QR-kod

**Tre typer:**
- **Bet:** Loser betalar, winner får
- **Personal:** La ut pengar → skyldig
- **Shared:** Delas lika

---

## 🎲 Prop Bets

Fri fråga + odds + alternativ.

- Skapa: question + odds + bank (banker_key)
- Alternativ som komma-separerad lista
- Röster per spelare
- Admin avgör vinnare → auto-settlement
- Bank-mode: bank betalar vinnare, förlorare betalar bank
- Utan bank: förlorar-pool delas jämnt

---

## ⚔️ Head-to-Head (DIO)

Alla spelare kan skapa H2H-matcher (ingen gräns per runda). Multi-matchup i leaderboard med + knapp. Auto-genererad expense när winner_key sätts.

---

## 📸 Fotogalleri (Historia)

- 2-kolumns grid med år + caption
- Gradient overlay + lazy loading
- Multi-upload med automatisk komprimering
- Aktuella + historiska foton (2021-2026)

---

## 🎵 Walk-up music + Playlists

Varje spelare har unik Spotify-låt per dag.

- 18 verifierade track IDs
- Spotify deeplinks
- 4 curaterade playlists: Walk-Up Anthems, Golf Vibes, Pump Up, 19th Hole

---

## 🏅 Achievements (DIO)

8 stycken som låses upp automatiskt:
- **First Blood** — första birdie
- **Eagle Eye** — gör en eagle
- **Steady Eddie** — låg standardavvikelse
- **Clean Sheet** — full runda utan nolla
- **Hot Hand** — 3 birdies i rad
- **On Fire** — många birdies
- **No Blanks** — alla 18 hål med poäng
- **Hål 19** — 19:e hålet (sociala)

---

## 🎬 3D Flyovers

Streamade flyover-videos per hål (36 UUIDs från CloudFront).

- Klick på hål → modal med flyover
- Streamad (behöver inte laddas ner)
- Per Skogsbanan + Parkbanan

---

## 📍 Banguide (DIO)

**Två banor:**
- **Skogsbanan** — Par 72, 5658m, CR 70.1, Slope 128
- **Parkbanan** — Par 72, 5698m, CR 70.8, Slope 130

**Per hål visas:**
- Par, längd, hcp-index
- Strategi-tips för hcp 7-22
- Bana-specifika varningar (vatten, bunkers, OB)
- Roterande roasts
- Klubbrekommendationer

---

## 🔔 Push (DIO)

**6 triggers:**
- Eagles/Birdies av andra
- Prop bet avgjord
- H2H avgjord
- Ny skuld i Even Steven
- Chat @-mention
- Ledarbyte i leaderboard

**Granular toggles per spelare** i profilen (5 bools i inv_players).

---

## 📢 Admin Broadcast

Admin (Filip/Marcus) kan skicka push till alla.

**6 snabbval:** Tee-off / Bar / Spa / Middag / Prisutdelning / Gruppfoto
**Mottagar-val:** alla / alla utom mig / specifik spelare
**Live preview** innan skick
**Titel + meddelande:** 60 + 200 tecken

---

## 🍻 Drunk-o-meter

Slider 0-100 per spelare i profilen. Synlig för alla. Komik-feature.

---

## 💸 Swish-betalningar

**URL-encoded JSON** i `swish://payment?data=...`
- Phone som "0701234567" (svenskt)
- Amount som number
- Message editable
- QR-kod backup
- Copy-knappar

**Var:** `SwishModal` rad 17-155

---

## 🔒 PIN-system

- Default PIN: `0000`
- Tvingad PIN-ändring vid första inloggning
- PIN-verifiering vid login
- Admin kan resetta PIN
- ⚠️ "ej bytt"-flagga för default-PIN

---

## 🎨 Design ("Augusta Clubhouse")

- Bakgrund: `#0B1410` → djupgrön gradient
- Guld: `#D4AF37`
- Pine green: `#1B4332`
- Masters-green jacket gradient på #1
- Guld pin-stripe på scorecard
- Röd accent på svåra hål, grön på lätta
- Login-titel med guld/cream gradient-text

---

## 🤖 Caddie AI (DIO)

**Inkluderar:**
- Hål-data (Skog/Park)
- Spelar-specifika roasts vävda i strategin
- Klubbrekommendationer per HCP-range
- Lokala regler (röd straff oändligt vänster hål 10 Skog)
- Vatten på hål 5/10/12/15 (Skog), 10/11/13/16/17 (Park)

---

## 🏗️ DIO-state i page.js

`DIOApp()` börjar ungefär rad 4500. Tar resten av filen (~6900 rader).

**Huvudregioner:**
- Login + PIN
- Leaderboard (med Masters-jacket på #1)
- Scoring (per hål, fullscreen)
- Lag-tävlingen
- Chat
- Banguide + flyovers
- Walk-up music + playlists
- Achievements
- Notifications
- Even Steven (Wallet)
- Prop bets + H2H
- Admin settings
- Foto-galleri (Historia)

---

## När arbetar vi i DIO-koden?

Just nu sällan — Täby är fokus. Men:
- Buggar som dyker upp efter en DIO-helg
- Förbereda DIO 2027
- Förbättringar som ska över till Täby

**Aldrig blanda DIO + Täby-kod i samma commit** om du kan undvika det. Tydlig separation hjälper underhåll.
