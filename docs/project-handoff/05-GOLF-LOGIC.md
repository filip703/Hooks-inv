# Golf-logik

> Alla scoring-formler + viktiga gotchas + bugghistorik.

---

## Stableford

```js
calcStab(strokes, par, extraStrokes) {
  if (!strokes || strokes <= 0) return 0
  const nettoPar = par + extraStrokes
  return Math.max(0, nettoPar - strokes + 2)
}
```

**Tolkning:**
- `nettoPar` = par justerat för extra slag (HCP-handicap per hål)
- Stableford = `max(0, nettoPar - strokes + 2)`
- Vanliga poäng (utan extra): 2p (par), 3p (birdie), 4p (eagle), 5p (albatross)
- Med 1 extra slag: par 4 + 4 slag → nettoPar 5 → 3p

**Max möjlig poäng**: I praktiken 5-6 per hål under normala HCP. Mer än 6 = något är fel.

---

## Spel-HCP (slope-justerad) — MED CAP

```js
const getPlayingHcp = (hcp) => Math.round(Math.min(36, Math.max(0, hcp || 0)) * 130 / 113)
```

- **130** = slope Täby GK
- **113** = standard slope (referens-bana)
- **Cap 0-36** = SGF-max för registrerade spelare

**OBS:** Cap är ett **säkerhetsnät** efter en historisk bugg. Aldrig ta bort den.

---

## Extra slag per hål

```js
const getExtra = (holeIdx, hcp) => {
  const phcp = getPlayingHcp(hcp)
  const base = Math.floor(phcp / 18)
  const rem = phcp % 18
  return base + (holeIdx <= rem ? 1 : 0)
}
```

**Tolkning:**
- `holeIdx` är hålets HCP-INDEX (1-18, 1 = svårast), inte hålnumret
- `base` = grundläggande extra slag (om spel-HCP > 18 får alla hål +1 extra här)
- `rem` = de svåraste hålen som får ytterligare +1
- Resultat: 0, 1, 2, 3... extra slag per hål

**Exempel:**
- HCP 14.7 → spel-HCP 17 → base=0, rem=17 → 1 extra på idx 1-17, 0 på idx 18
- HCP 22 → spel-HCP 25 → base=1, rem=7 → 2 extra på idx 1-7, 1 på idx 8-18

---

## Täby-banans struktur

Hämtas från `lib/courses-taby.js`. Snabbreferens:

| Hål | Par | Index |
|---|---|---|
| 1 | 5 | 13 |
| 2 | 4 | 9 |
| 3 | 4 | 3 |
| 4 | 3 | 17 |
| 5 | 4 | 1 |
| 6 | 5 | 7 |
| 7 | 3 | 15 |
| 8 | 4 | 5 |
| 9 | 4 | 11 |
| 10 | 4 | 8 |
| 11 | 4 | 12 |
| 12 | 5 | 4 |
| 13 | 4 | 14 |
| 14 | 3 | 2 |
| 15 | 4 | 18 |
| 16 | 4 | 6 |
| 17 | 3 | 16 |
| 18 | 5 | 10 |

**Totalt par:** 72 · **Slope:** 130 · **CR:** 70.0

---

## Birdie/Eagle/HIO — ALLTID strokes vs par

```js
// I saveHoleScore:
if (strokes === 1) showTabyToast('HOLE-IN-ONE!', 'eagle')
else if (strokes <= par - 3) showTabyToast('ALBATROSS!', 'eagle')
else if (strokes === par - 2) showTabyToast('EAGLE!', 'eagle')
else if (strokes === par - 1) showTabyToast('BIRDIE!', 'birdie')
```

**ALDRIG** trigga birdie/eagle på stableford-värde.

---

## Performance Index (Täby OOM)

```js
const best8 = roundStableford.sort(desc).slice(0, 8)
const pi = best8.reduce((s, r) => s + r.total, 0) / best8.length
```

**Total Order of Merit-poäng:**
- 50% Performance Index
- 35% Events (placering 1-6 = 25/18/12/8/5/2 merit-poäng per event)
- 10% H2H-vinst-% (kräver minst 3 H2H-matcher)
- 5% Aktivitet (antal rundor, capped vid 12)

---

## Hot Hand & Cold Turkey (Filips Täby-regel)

```js
// Hot Hand (NETTO — Filips preferens, inte DIO:s gross-regel)
if (stableford >= 3 in 3 consecutive holes) → BONUS

// Cold Turkey
if (stableford === 0 in 3 consecutive holes) → MALUS
```

**Hot Hand i Täby = NETTO stableford ≥ 3 i rad** (inte gross-birdies som DIO).

Plus ett separat "🦅 birdies i rad"-mått som visar riktiga gross-birdies. Båda visas i scoring-UI.

---

## Achievements (Täby)

12 stycken i 3 tiers (10/25/50 bonuspoäng). Definierade i `lib/taby-achievements.js`.

**Lista:**
- **Tier 1 (10p):** First Blood 🩸, First Birdie 🐦, Veteran 5 📅
- **Tier 2 (25p):** Clean Sheet 🛡️, Hot Hand 🔥, Big Round 36+ 💪, Birdie Machine 10 🎯, Par Machine 50 🏞️, Consistent ⚖️
- **Tier 3 (50p):** Eagle 🦅, Veteran 10 🏛️, Leader 👑

**Visning:**
- Den finaste medaljen visas som ikon bredvid spelarens namn
- Hela grid (alla 12) syns i player card under stats
- Medaljpoäng visas separat (påverkar INTE Order of Merit, är bonus)

**Upplåsning:**
- `checkNewAchievements` körs efter varje sparad score
- Första gången spelaren saknar achievements i DB → spara alla retroaktivt TYST
- Därefter: pling + shoutout + push vid genuint nya

---

## Klar-runda-shoutout

När en spelare registrerat alla 18 hål:
- `checkRoundCompletion` triggar
- Postar shoutout i `taby_chat` med totaler + flair-text
- Skickar push till alla taby-spelare som INTE var med i rundan
- Anti-spam via `taby_rounds.completion_shoutouts uuid[]`

**Flair-text:**
- 40+ → "🔥 Hett!"
- 36+ → "💪 Riktigt bra!"
- 30+ → "👏 Solid."
- 24+ → "👍 OK runda."
- <24 → "🥃 Bättre lycka nästa gång."

---

## ⚠️ Bugghistorik (lär av detta)

### Marcus 65p-rundan (1 juni 2026)

**Symptom:** Marcus fick 65p på 6 hål (max 12p på ett par-4-hål). Fysiskt omöjligt.

**Diagnos:**
- 12p på par 4 → kräver nettoPar 14 → extra 10 slag på det hålet
- 10 extra slag per hål → kräver spel-HCP ~170 → bas-HCP ~147
- Marcus DB-HCP är 14.7 → spel-HCP 17 → 1 extra per hål → max 3-4p på par-bogey

**Root cause:** HCP-input-fältet hade ingen cap. Typo "147" istället för "14,7" (komma) → sparades i DB → fel HCP → orimliga poäng.

**Fix:**
1. `getPlayingHcp` capar nu internt 0-36
2. HCP-input `max="36"` + cap i onBlur → toast "HCP capad till 36"
3. Marcus 1 juni-runda omräknad: 65p → 14p

### Marcus klar-runda 53p-incident (samma dag)

**Symptom:** Efter fix-1, Marcus klar med 18 hål, total 53p. Hål 7-18 fortfarande för höga.

**Diagnos:**
- Reverse engineering visade spel-HCP ~41 vid registreringen
- Det matchar HCP 36 (vår nya max-cap)
- Marcus DB-HCP är 14.7. Hans `tabyUser` localStorage hade dock 36.

**Root cause:** `saveHoleScore` använde `scoringPlayer.taby_hcp` från cached `tabyUser`-objekt i localStorage. När HCP ändras i DB synkades inte aktiva inloggade sessioner.

**Fix:** `saveHoleScore` läser nu **färsk HCP från DB** vid varje score-spar. Synkar tillbaka till `tabyUser` om det är spelarens egen profil.

Marcus runda omräknad: 53p → 37p.

### Lärdomar
1. **Aldrig lita på cached state för säkerhetskritiska beräkningar.** HCP, poäng, regler — läs alltid färskt från DB.
2. **Capa alltid input** i HTML (`max`-attribut) OCH i logik (Math.min/max).
3. **Sanity-checks** — om stableford > 6 är något fel.
4. **Reverse engineering är snabb diagnostik.** När data ser fel ut, räkna baklänges från formeln för att hitta vilken input som måste ha varit fel.

---

## Vanliga beräkningsfel att undvika

### ❌ Skicka holeNumber till getExtra istället för holeIdx
`getExtra(holeData.i, hcp)` — `holeData.i` är HCP-INDEX, inte hålnumret. Skicka aldrig 1-18 från `hole`-variabeln.

### ❌ Använda hcp = 0 för spectator
Spectator har ingen HCP. `hcp || 0` ger 0 → spel-HCP 0 → ingen extra. Det är OK, men kontrollera att spectator inte registrerar scores.

### ❌ Räkna stableford manuellt vs koden
Använd alltid `calcStab(strokes, par, extra)`-funktionen. Aldrig duplicera formeln inline.

### ❌ Glömma att par + extra ändras vid HCP-uppdatering
Om en spelares HCP ändras retroaktivt behöver befintliga scores RÄKNAS OM (UPDATE i DB). Inte automatiskt.
