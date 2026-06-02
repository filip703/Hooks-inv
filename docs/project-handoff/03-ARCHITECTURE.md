# Arkitektur

## Översikt

`app/page.js` är **en monolitisk fil** på ca **11 400 rader** som innehåller hela appen — både DIO och Täby. Det är medvetet enkelt (en utvecklare, snabb iteration), men har konsekvenser för hur Claude jobbar i koden.

```
Home() (root)
 ├── Mode-väljare (DIO eller Täby)
 ├── DIOApp() (om appMode === 'dio')
 └── TaByApp() (om appMode === 'taby')
```

State hanteras med `useState`. Ingen routing — view-state via state-variabler (`tabyView`, `tabyHole`, `newRound`, etc).

---

## Filstruktur

```
/Users/filiphector/Hooks-inv/
├── app/
│   ├── page.js                   ← ~11 400 rader, allt här
│   ├── layout.js                 ← Root layout, theme + mode attributes
│   ├── globals.css               ← Base styles
│   └── api/
│       └── caddie/route.js       ← Server-side Claude API endpoint
├── lib/
│   ├── supabase.js               ← Supabase client init
│   ├── courses.js                ← DIO Hooks Herrgård + DIO shoutouts + achievements
│   ├── courses-taby.js           ← Täby GK 18 hål + GPS-koordinater + utils
│   ├── taby-merit.js             ← Performance Index engine
│   ├── taby-achievements.js      ← 12 achievements, 3 tiers
│   ├── imageCompress.js          ← Canvas-baserad komprimering
│   ├── icons.js                  ← AugustaBadge + LakeBadge + ikoner
│   ├── sounds.js                 ← Web Audio API
│   └── push.js                   ← Web Push API
├── public/
│   ├── sw.js                     ← Service Worker (push + cache)
│   ├── manifest.json             ← PWA manifest
│   └── taby/holes/
│       ├── hole-1.webp           ← Banguide-bilder
│       └── ...
├── styles/
│   └── midnight-lake.css         ← Täby-tema override
├── .env.local                    ← Secrets (anon-key, VAPID, Anthropic)
├── CLAUDE.md                     ← Dev guide (lokalt + i docs/)
├── README.md
└── package.json
```

---

## Region-karta i `app/page.js`

Ungefärliga radnummer för viktiga regioner:

| Område | Rader |
|---|---|
| Imports + constants | 1–15 |
| `SwishModal` (DIO) | 17–155 |
| `PushSubscribeButton` | 130–175 |
| Helpers (Av, Badge, safeParse, fetchWithTimeout) | 176–200 |
| `PullToRefresh` | 200–253 |
| `Home()` + mode-väljare | 254–315 |
| `Sparkline` | 320–340 |
| **`TaByApp()` start** | 340 |
| State-deklarationer | 340–450 |
| Fetch helpers | 450–510 |
| `loadData()` + realtime subscriptions | 510–700 |
| Konstanter (TABY_HOLES → holes) | 700–720 |
| **Golf-logik: calcStab, getPlayingHcp, getExtra** | 715–740 |
| `getPlayerStats` | 740–780 |
| `getPlayerAchievements` | 780–795 |
| `startRound` | 795–870 |
| `resumeRound` + GPS-effekter | 870–970 |
| `getTabyStreak` | 970–990 |
| `checkNewAchievements` | 992–1017 |
| **`checkRoundCompletion`** | 1021–1066 |
| **`saveHoleScore`** | 1068–1140 |
| Splash render | 1135–1200 |
| Login screen | 1200–1280 |
| Mästar-krona på leaderboard | 1616 |
| Spectate-overlay | 1453–1579 (historisk) + 1581–1670 (live) |
| Header (top bar med GPS) | 1670–1720 |
| Bottom nav | 1720–1770 |
| Leaderboard-vy | 1780–1970 |
| Scoring-vy + fullscreen-hål | 1970–2700 |
| Stats-vy | 2900–3200 |
| Klubbhuset (gruppöversikt) | ~3022 |
| Rundhistorik | 3177 |
| Achievements badge-grid | ~3057 |
| Banguide-modal | 3300–3400 |
| Feed (chat) | 3400–3550 |
| Settings-vy | 3700–4200 |
| HCP-input + admin | 3818–3850 |
| **`DIOApp()` start** | ~4500 |
| ... (resten DIO-kod) | 4500–11 400 |

**Använd `grep -n "söktermen" app/page.js`** för att hitta exakta rader.

---

## Single-page state-management

Hela appen är en gigantisk React-komponent med många `useState`-hooks.

### Mode + user
- `appMode` ("dio" | "taby")
- `tabyUser` / `dioUser` (sparas i localStorage)

### Täby-specifika state
- `tabyView` ("leaderboard" | "scoring" | "stats" | "settings" | "feed" | "wallet" | etc)
- `tabyHole`, `tabyActiveHole` (vilket hål visas i fullscreen)
- `tabyPlayers` (alla aktiva spelare)
- `tabyRounds`, `tabyScores` (data från DB)
- `newRound` (aktuell pågående runda)
- `tabySpectatePid` (vilken spelare jag tjuvkikar på)
- `tabyRoundDetail` (vilken historisk runda jag öppnat)
- `tabyEvents`, `tabyBets`, `tabyH2H`
- `tabyChat` (chattmeddelanden)
- `tabyUserLoc` (GPS-position)
- `tabySettings` (lokala settings i localStorage)

---

## Realtime-subscriptions

I `TaByApp`-useEffect (rad ~620+) finns subscription till flera Supabase Realtime-kanaler:

```js
supabase.channel('taby_scores_rt').on('postgres_changes', ...)  // optimerad snabb path
supabase.channel('taby_rounds_rt').on(...)                       // re-fetch hela
supabase.channel('taby_h2h_rt').on(...)
supabase.channel('taby_bets_rt').on(...)
supabase.channel('taby_teams_rt').on(...)
supabase.channel('taby_expenses_rt').on(...)
supabase.channel('taby_chat_rt').on(...)
```

**Viktigt:** Nya Supabase-tabeller måste explicit läggas till i publikationen för att Realtime ska funka:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE <table_name>;
```

---

## Modaler + overlays

Många "modaler" är fixed-positioned overlays med `zIndex` 450–1100, t.ex.:

- `tabyRoundDetail` (historisk runddetalj) — z 1100
- `tabySpectatePid` (live-spectate) — z 450
- `showEndRoundModal` (avsluta runda)
- `showBollSetup` (skapa runda)
- `selectedEventModal` (event-detaljer)
- `ldNpModal` (LD/NP-modal)
- `tabyBanguideOpen` (banguide modal)

Mönster:
```jsx
{tabyRoundDetail && (() => {
  const round = tabyRounds.find(r => r.id === tabyRoundDetail)
  if (!round) return null
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, ... }}>
      <button onClick={() => setTabyRoundDetail(null)}>← Tillbaka</button>
    </div>
  )
})()}
```

---

## Anti-patterns att undvika

### ❌ Läsa hela page.js
Filen är 11 400 rader. Använd `grep -n` + `read_file` med `offset`/`length`.

### ❌ Lita på cached `tabyUser` för HCP
Cache-bugg orsakade Marcus 65p-incident. Läs alltid färsk HCP från DB i `saveHoleScore`:
```js
const { data: freshPlayer } = await supabase.from('inv_players').select('taby_hcp, hcp').eq('id', pid).single()
```

### ❌ Posta `msg_type: 'system'` i chatten
Feeden filtrerar bort den. Använd `msg_type: 'shoutout'` med `player_id: NULL` för "från appen"-meddelanden.

### ❌ Glömma att lägga in nya tabeller i realtime-publikation
Tabellen finns men inga uppdateringar når klienterna. Kör `ALTER PUBLICATION supabase_realtime ADD TABLE x;`.

### ❌ Trigga birdie/eagle på stableford-värde
ALLTID strokes vs par. En birdie är `strokes === par - 1`, inget annat.

---

## Mönster för nya features

1. **DB först**: lägg kolumn/tabell via Supabase MCP `apply_migration`
2. **State**: `useState` i `TaByApp` eller `DIOApp`
3. **Fetch + realtime**: ladda data i `loadData()`, prenumerera om realtime behövs
4. **UI**: nya komponenter inline i samma fil
5. **Helpers**: nya funktioner ovanför render-blocken
6. **Build**: `npx next build 2>&1 | tail -4`
7. **Commit + push + changelog** (regeln)
