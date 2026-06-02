# Session History & Lessons Learned

> Sammanfattning av alla större sessioner och kritiska lärdomar.

---

## Session-tidslinje (höglyckor)

### Session 1-7 (14-20 april 2026)
Grundbygge DIO + Täby.

### Session 8-9 (22 april)
Cleanup. Ta bort Rami från DIO via `dio_active`-filter.

### Session 10 (22 april) — MEGA
- Täby fullscreen scoring
- Strokes + betting + events + H2H
- Caddie AI för Täby
- Sparklines

### Session 11-14 (22 april)
- Täby DIO-parity (ljud, shoutouts, UT/IN)
- Spectator Mode
- Banguide-modal
- Bulk-upload Historia
- Visuell DIO-parity (LakeBadge, glass-cards, badges)
- One-pager scoring flow

### Session 15 (23 april) — KRITISK BUG
**Birdie/eagle på stableford-värde fix.** Tidigare bug triggade BIRDIE på stableford ≥ 3 vilket gav falska birdies för högHCP-spelare.

**Fix:** Använd alltid `strokes < par` för birdie.

### Session 16 (23 april)
GPS distance-to-green via OpenStreetMap. Rami-bild uppladdad.

### Session ~30 maj — Bildkomprimering + Täby standard + Splash
- Canvas-baserad bildkomprimering (max 1600px JPEG 0.82)
- Bulk-komprimering av 53 gamla foton (132MB sparat)
- Täby blev standardläge
- Ny "The Roster" splash
- Separat `taby_chat`-tabell
- **Realtime-publikation-fix** för taby_chat

### Session 31 maj — Klubbhuset + Achievements
- Klubbhuset (4 säsongsledare-kort) i Stats
- Säsongsmästar-krona ovanför OOM
- Dubbel streak-indikator (netto + gross)
- 12 achievements med medaljpoäng
- Ikon vid namnet i leaderboard
- Achievement badge-grid
- Upplåsnings-notis + push

### Session 1 juni — Marcus 65p-bug + LIVE-spectate + Handoff
- Historisk runddetalj-vy
- **Marcus 65p-bug** → omräknad
- **HCP cap 36** överallt
- Klar-runda-shoutout
- LIVE-badge
- **Marcus 53p-bug** (cache-bugg) → fix med färsk DB-läsning
- Komplett projekt-handoff (denna mapp)

---

## Topp-10 lärdomar

### 1. Realtime-publikation är INTE automatisk
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE <name>;
```
Detta missades med `taby_chat` initialt → chatten uppdaterades inte live.

### 2. `msg_type = 'system'` filtreras bort av feeden
Använd `msg_type = 'shoutout'` med `player_id = NULL`.

### 3. Storage anon-key kan INSERT men inte UPDATE
För bulk-overwrites: tillfällig RLS-policy, sen bort.

### 4. Hot Hand i Täby är netto, inte gross
Filips explicita preferens. 3p stableford i 3 hål i rad (för Täby).

### 5. Posta ALLTID changelog efter user-facing ändringar
Obligatorisk regel i CLAUDE.md.

### 6. Y-axeln på banbilder är inverterad
Top of image = green, bottom = tee. Korrigera med `1 - tapFracY`.

### 7. Lateral GPS-skala kräver kalibrering
`~0.002` för Täby (inte 0.00015).

### 8. HCP max är 36 (SGF)
Capa ALLTID i både input och beräkningar.

### 9. Birdie = strokes vs par, ALDRIG stableford
`strokes === par - 1`. Aldrig `stableford >= 3`.

### 10. Cache-buggar är försåtliga
Marcus 53p-incidenten. **Läs alltid färskt från DB för säkerhetskritiska beräkningar.**

---

## Detaljerade incidenter

### Marcus 65p-incidenten (1 juni 2026)

**Symptom:** Marcus solo-runda gav 65p på 6 hål (max 12p per hål).

**Reverse engineering:**
- 12p på par 4 → kräver nettoPar 14 → 10 extra slag
- 10 extra slag → spel-HCP ~170 → bas-HCP ~147
- Marcus DB-HCP är 14.7 ✓

**Root cause:** HCP-input-fältet hade ingen `max`. Filip (eller någon) skrev "147" istället för "14,7" som typo. Värdet sparades, scores räknades med fel HCP.

**Fix:**
1. `getPlayingHcp` capar till 0-36 internt
2. HCP-input `max="36"` + onBlur-cap
3. Marcus runda omräknad: 65p → 14p

### Marcus 53p-incidenten (samma dag)

**Symptom:** Efter fix-1, Marcus klar med 18 hål, total 53p. Hål 7-18 fortfarande för höga.

**Reverse engineering:**
- Spel-HCP ~41 vid registrering
- HCP 36 (cap) ger spel-HCP 41 ✓
- DB-HCP är 14.7

**Root cause:** Marcus `tabyUser` localStorage hade HCP 36 cachat från tidigare. När DB uppdaterades synkades inte hans aktiva session.

**Fix:** `saveHoleScore` läser nu färsk HCP från `inv_players` vid varje score-spar.

Marcus runda omräknad: 53p → 37p.

### Birdie-shoutout för icke-birdies (session 15)

**Symptom:** Spelare med hög HCP fick BIRDIE-shoutout för par eller bogey.

**Root cause:** Triggern testade `stableford >= 3` istället för `strokes < par`. Med extra slag är 3p stableford ofta bara par-bogey.

**Fix:** Testa alltid `strokes === par - 1` för birdie.

### Taby_chat realtime missade (session 16)

**Symptom:** Chatten uppdaterades inte live.

**Root cause:** Ny `taby_chat`-tabell var inte med i `supabase_realtime`-publikationen.

**Fix:**
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE taby_chat;
```

Plus: bytte realtime-handler från prepend till re-fetch hela listan.

---

## Mönster som funkar bra

### Optimistic UI + realtime
```js
setTabyChat(prev => [{ id: 'tmp-' + Date.now(), player_id, message }, ...prev])
await supabase.from('taby_chat').insert({ player_id, message })

// Realtime-handler: re-fetch hela listan, ersätter tmp-rader
```

### Anti-spam för engångs-shoutouts
```sql
ALTER TABLE taby_rounds ADD COLUMN completion_shoutouts uuid[] DEFAULT '{}';
```
Check innan post, append efter post.

### Retroaktiv catch-up vid första körning
För achievements: när en spelare har 0 rader, spara alla nuvarande **tyst** (utan notis).

```js
if (existing.length === 0) return  // tyst catch-up
```

### Färsk DB-läsning för säkerhetskritiska beräkningar
```js
const { data: freshPlayer } = await supabase.from('inv_players').select('taby_hcp, hcp').eq('id', pid).single()
const liveHcp = freshPlayer.taby_hcp || freshPlayer.hcp
```

### Sanity-check i input
```jsx
<input type="number" min="0" max="36" step="0.1" onBlur={(e) => {
  const v = parseFloat(e.target.value)
  if (isNaN(v)) return
  const capped = Math.min(36, Math.max(0, v))
  if (capped !== v) { e.target.value = capped; showToast(`Capad till ${capped}`) }
}} />
```

---

## När du upptäcker en bugg, jobba så här

1. **Reproducera** (om möjligt) — eller hämta data från DB
2. **Reverse engineer** — räkna baklänges från formeln
3. **Identifiera root cause** — input, cache, formel-bugg, eller logik-fel?
4. **Fix båda lager** — data + kod. Räkna om data i DB. Lägg sanity-check i kod.
5. **Verifiera** — kör formeln manuellt för nya scenarios
6. **Posta changelog** — användarna ska veta att det fixats

---

## Anti-patterns att aldrig göra

- ❌ Hårdkoda säkerhetsregler i UI utan motsvarande logik-cap
- ❌ Lita på cached state för kritiska beräkningar
- ❌ Posta i chatten utan `msg_type`
- ❌ Glömma `ALTER PUBLICATION` för nya tabeller
- ❌ Använda `msg_type = 'system'`
- ❌ Trigga birdie/eagle på stableford-värde
- ❌ Force-push till main
- ❌ Läsa hela `page.js` på en gång
