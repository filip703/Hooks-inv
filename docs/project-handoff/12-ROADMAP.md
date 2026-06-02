# Roadmap

> Vad som planeras härnäst. Snapshot per 1 juni 2026.

---

## 🔴 Kritiska (snart)

Inga akuta brännande issues just nu. Marcus HCP-bug fixad. Push verifierad. Klar-runda-shoutout + LIVE-spectate live.

---

## 🟡 Pending (när tid finns)

### Realtime + sync
- [ ] Säkerställ att alla taby_-tabeller är i realtime-publikationen
- [ ] Skapa SQL-snutt som listar saknade tabeller

### Splitta page.js
- [ ] `DIOApp.jsx` separat fil
- [ ] `TaByApp.jsx` separat fil
- [ ] Helper-functions i `lib/`
- [ ] State management via Context där tunga props skickas djupt

Filen är 11 400 rader. Funkar men blir svår.

### Achievements-utbyggnad
- [ ] Auto-trigger per cleanup (om scores ändras retroaktivt → omräkna achievements)
- [ ] Edge cases för completion när score editeras efter klar
- [ ] Fler achievements (HIO, etc)

### Banguide-förbättringar
- [ ] Fyll i `TABY_GPS.hazards[]` för vatten och bunkers
- [ ] Per-hål väderprognos (live)

### Wallet i Täby
- [ ] H2H auto-genererar expense
- [ ] LD/NP-bets settlment
- [ ] Skins-format settlement

### Push-utbyggnad
- [ ] Granular toggles per Täby-trigger
- [ ] "Tystläge"-schema (inga push 22-08)

### Chat-utbyggnad
- [ ] Threading (svar på meddelanden)
- [ ] Reactions (👍 ❤️ 🔥)
- [ ] Voice notes
- [ ] @-mentions i Täby

### Caddie AI för Täby
- [ ] Egen prompt med Täby-håldata
- [ ] Live väder-input
- [ ] Spelarspecifik form-info

### Live-events
- [ ] Live-leaderboard under events
- [ ] Event-resultats-modal med foto + roast

### Stats-djupdykning
- [ ] Hålstatistik per spelare (snitt/bästa/sämsta per hål)
- [ ] Format-statistik
- [ ] Tid-på-banan
- [ ] Föredragna par på H2H

### iOS App Store
- [ ] PWABuilder → App Store
- [ ] Apple Developer-account
- [ ] App-ikoner + screenshots
- [ ] Beta-test

---

## 🟢 Nice-to-have / ideas

### Sociala features
- [ ] Foton från rundan auto-postade i feed
- [ ] "Andra rundans pågång"-banner
- [ ] Tipsa andra spelare när de slår sitt PR

### Gamification
- [ ] Leaderboard-rivaliteter
- [ ] Säsongs-meta-achievements
- [ ] Pickleball-tabell?

### DIO-prep för 2027
- [ ] Verifiera countdown till nya datum
- [ ] Ny manual / in-app-guide
- [ ] Onboarding-flöde

### Tech debt
- [ ] TypeScript-migration?
- [ ] Component-library (basic)
- [ ] Tests (unit + e2e)
- [ ] Storybook?

---

## 🔵 Avklarade nyligen (senaste session)

- ✅ Bildkomprimering vid upload + bulk-compress av gamla bilder
- ✅ Täby som standardläge
- ✅ Ny splash ("The Roster")
- ✅ Separat taby_chat med realtime
- ✅ Klubbhuset gruppöversikt i Stats
- ✅ Säsongsmästar-krona ovanför OOM
- ✅ Dubbel streak-indikator (netto + gross)
- ✅ 12 achievements + medaljpoäng + ikon vid namnet
- ✅ Upplåsnings-notis + push på medaljer
- ✅ Historisk runddetalj-vy
- ✅ HCP cap 36 + Marcus omräknad (×2)
- ✅ Klar-runda-shoutout (18 hål) + push till alla utanför rundan
- ✅ Pulserande LIVE-badge i leaderboard
- ✅ Färsk HCP-läsning vid score-spar (cache-bug fix)
- ✅ Changelog-regel i CLAUDE.md
- ✅ Projekt-handoff dokumentation (denna mapp)

---

## 📋 Hur prioriteras nya features?

Filip prioriterar i denna ordning:
1. **Kritiska buggar** som påverkar spel
2. **Korrekthet** (poäng-fel, regel-fel)
3. **UX-förbättringar** som gänget märker
4. **Nice-to-have-features** när inspirationen finns
5. **Tech debt** sist (men inte aldrig)

---

## 📅 Säsongs-milestones 2026

| När | Vad |
|---|---|
| ✅ April-maj | Täby säsongsstart, grundscoring |
| ✅ 10 maj | The Opener |
| ✅ 22-24 maj | DIO 2026 |
| ⏳ 21 juni | Midsommar Match |
| ⏳ 15 aug | Sommar-KM |
| ⏳ 4 okt | The Final |
| ⏳ Okt-nov | Säsongs-summering |
| ⏳ Vinter | Tech debt + prep DIO 2027 |

---

## 🤔 Idéer att överväga

- Pickleball-tracker?
- Andra banor förutom Täby? (Bro Hof, Ullna)
- Multi-säsong-historik?
- AI-genererade post-round-roasts?

Inget bråttom. Bara idéer.
