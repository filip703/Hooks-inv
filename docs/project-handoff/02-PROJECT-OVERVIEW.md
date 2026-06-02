# Projektöversikt

## Vad är Hooks-inv?

En **dual-mode golf-PWA** byggd av Filip för 6 kompisar. Appen kör två separata "lägen" i samma kodbas:

- **DIO** (Douche Invitational Only) — årlig helg-turnering Hooks Herrgård
- **Täby Order of Merit** — säsongsliga Täby GK (april–oktober)

Mode väljs på app-start och sparas i `localStorage`. Täby är default.

---

## Status (1 juni 2026)

### DIO
- Senaste turneringen avslutad i maj 2026
- Appen är produktion-redo och fullt utvecklad
- Nästa DIO 2027 (datum ej satt)

### Täby
- **Aktivt fokus just nu**
- Säsongen pågår (april–oktober 2026)
- Just nu ligger flera nya features färska:
  - 12 achievements med medaljpoäng
  - Klubbhuset (gruppöversikt i Stats)
  - Säsongsmästar-krona på leaderboard
  - Historisk runddetalj (klicka en runda → hela scorekortet)
  - LIVE-spectate (pulserande badge när någon spelar)
  - Klar-runda-shoutout med push till alla utanför rundan
  - HCP cap 36 (efter bugg)

### Användare
6 spelare aktiva. Push-prenumerationer på 6 spelare / 9 enheter. Filip har 3 enheter.

---

## Live-resurser

| Resurs | URL |
|---|---|
| **Live app** | https://hooks-inv.vercel.app |
| **GitHub** | https://github.com/filip703/Hooks-inv |
| **Repo (lokalt)** | `/Users/filiphector/Hooks-inv/` |
| **Manual (publik Google Doc)** | https://docs.google.com/document/d/1QfOTn9ZjmSAk6sEpG0rY0Ylw_YqDrkRM78iKH-AR-uU |

---

## Cloud-IDs

### Supabase
- **project_id:** `swagnjpgddfakncovglo`
- **URL:** `https://swagnjpgddfakncovglo.supabase.co`
- **Organisation:** Make Golf AI (`tmqoeismvgxplokwjpja`)
- **Anon-nyckel:** I `.env.local` som `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Service role:** Finns INTE i .env.local — använd dashboard eller temporär RLS-policy för admin-actions

### Vercel
- **project_id:** `prj_Q8wdcEh7xdRAQ38SL7ls2syd1FdN`
- **team_id:** `team_S3T5nVpPYkFTPvSvLXxea2XX`
- **Auto-deploy:** Push till `main` → bygger på Vercel

### GitHub
- **Repo:** filip703/Hooks-inv
- **Filips email:** filip@make.golf
- **SSH-nyckel:** `~/.ssh/id_ed25519_github`
- **Push-kommando:**
  ```
  GIT_SSH_COMMAND="ssh -i ~/.ssh/id_ed25519_github -o StrictHostKeyChecking=no" git push origin main
  ```

---

## Stack

| Lager | Tech |
|---|---|
| Frontend | Next.js 14 (App Router) + React + inline CSS |
| Backend | Supabase (Postgres + Realtime + Storage) |
| Edge functions | Deno runtime (`send-push`) |
| Push | Web Push API + VAPID |
| Hosting | Vercel (auto-deploy från main) |
| AI (Caddie) | Anthropic API via `app/api/caddie/route.js` |
| PWA | Service Worker + manifest |

---

## Live URLs i koden

Storage:
- **Prefix:** `https://swagnjpgddfakncovglo.supabase.co/storage/v1/object/public/inv-images/`
- **Bucket:** `inv-images` (publik read, anon insert tillåten, update kräver tillfällig policy)

Send-push edge function:
- **Endpoint:** `https://swagnjpgddfakncovglo.supabase.co/functions/v1/send-push`
- **Status:** ACTIVE
- **Auth:** Bearer-token (anon-nyckel)

---

## Lokal utveckling

```bash
cd ~/Hooks-inv
npm install
npm run dev  # http://localhost:3000
```

`.env.local` ska innehålla:
```
NEXT_PUBLIC_SUPABASE_URL=https://swagnjpgddfakncovglo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
ANTHROPIC_API_KEY=<key för Caddie AI>
VAPID_PUBLIC_KEY=<för push>
VAPID_PRIVATE_KEY=<för push>
```

---

## Deploy-flöde

1. Filip ändrar kod lokalt
2. `git add -A && git commit --no-verify -m "..."`
3. Push till main → Vercel auto-deploy (~60s)
4. Live på hooks-inv.vercel.app

Inga staging/preview-environments används aktivt. Direkt till produktion.

---

## Senaste deployment

Senaste commit på main: `b9223f9` (1 juni 2026)
- "Taby: las farsk HCP fran DB vid score-spar (fix cache-bugg)"

Tidigare nyckel-commits från denna session:
- `193965d` — Klar-runda-shoutout + LIVE-badge
- `fafcdd2` — HCP cap 36 + Marcus omräknad
- `a5b93ae` — Historisk runddetalj
- `bec6e89` — Achievements upplåsnings-notis + push
- `dc729ab` — Täby achievements + medaljpoäng

Se `12-ROADMAP.md` för vad som planeras härnäst.
