# 🏌️ Hooks-inv — Projekt-handoff till Claude

> **Detta dokument är start-punkten för Claude i en ny chat.**
> Läs det här först, sen följ länkar till relevanta filer baserat på vad Filip ber om.

---

## Snabbsammanfattning

**Vad:** En dual-mode golf-PWA byggd för 6 kompisar.
- **DIO** (Douche Invitational Only) — helg-turnering Hooks Herrgård
- **Täby Order of Merit** — säsongsliga Täby GK (april–oktober)

**Stack:** Next.js 14 (App Router) + Supabase + Vercel + PWA

**Live:** https://hooks-inv.vercel.app

**Repo:** github.com/filip703/Hooks-inv (lokalt: `/Users/filiphector/Hooks-inv/`)

**Status:** Täby är primärt fokus just nu. Båda lägena är produktion. Filip utvecklar solo med Claude via Desktop Commander MCP direkt på sin Mac.

---

## Vem är Filip?

Den enda utvecklaren. Stockholm. Pratar svenska. Jobbar inom hospitality tech och bygger det här på fritiden för sitt kompisgäng (där han också spelar). Säg semi-formellt, koncist, inga klyschor.

- **Hans nickname i appen:** Mr Vain (Täby) / Long Gone (DIO)
- **Spel-HCP:** 8.6
- **Roll:** Bygger appen + är aktiv spelare i båda lägena

---

## Vad du absolut måste veta direkt

### 1. Posta ALLTID en changelog i Täby-chatten efter användarpåverkande ändringar.

Det här är en **obligatorisk regel** (se `10-CONVENTIONS.md`). Sista steget i varje feature-leverans:

```sql
INSERT INTO taby_chat (player_id, message, msg_type)
VALUES (NULL, '📋 NYTT I APPEN\n\n...', 'shoutout');
```

Detaljer:
- **Täby-ändringar** → tabell `taby_chat`. **DIO-ändringar** → tabell `inv_chat`.
- `msg_type = 'shoutout'` + `player_id = NULL` — renderas centrerat i guld som "från appen".
- `msg_type = 'system'` filtreras bort av feeden — använd **aldrig** den.

### 2. HCP är capad till max 36 (SGF-regel)

Både input-fältet OCH beräkningarna (`getPlayingHcp`) capar till 0–36. Detta är ett **säkerhetsnät** efter en bugg där fel HCP gav orimliga stableford-poäng. Se `05-GOLF-LOGIC.md` för historik.

### 3. Stora filer kräver chunked reads

`app/page.js` är ~11 400 rader. Använd `grep -n` via `start_process` först för att hitta line numbers, sedan `read_file` med `offset`/`length`. Aldrig läsa hela filen.

### 4. Tonalitet

- Svenska, semi-formellt, koncist
- Bulletpoints, korta paragrafer
- **Aldrig horisontell linje `---` i löpande text/svar** (men i markdown-filer är de OK)
- Agera självständigt — fyll i info, fatta beslut
- Humoristisk när det passar DIO-kontext

---

## Var ska du läsa härnäst?

Beroende på vad Filip ber om:

| Filip säger... | Läs... |
|---|---|
| "Bygg en ny feature i Täby" | `03-ARCHITECTURE.md` + `07-FEATURES-TABY.md` + `09-WORKFLOW.md` |
| "Något är trasigt med scoring" | `05-GOLF-LOGIC.md` + `11-TROUBLESHOOTING.md` |
| "DB-fråga / migration" | `04-DATABASE-SCHEMA.md` |
| "Lägg till spelare / fixa profil" | `06-PLAYERS.md` |
| "Pusha / deploy" | `09-WORKFLOW.md` |
| "Roadmap / vad kommer härnäst" | `12-ROADMAP.md` |
| "Skriv copy / text till appen" | `13-FILIP-BRAND.md` |
| "Push fungerar inte" | `15-PUSH-INFRASTRUCTURE.md` + `11-TROUBLESHOOTING.md` |

---

## De viktigaste IDs (memorera)

| Vad | Värde |
|---|---|
| Supabase project_id | `swagnjpgddfakncovglo` |
| Vercel project_id | `prj_Q8wdcEh7xdRAQ38SL7ls2syd1FdN` |
| Vercel team_id | `team_S3T5nVpPYkFTPvSvLXxea2XX` |
| Filips player_id (Täby + DIO) | `12e1610b-32e0-43b8-96c2-49889b2ebb62` |
| Storage URL prefix | `https://swagnjpgddfakncovglo.supabase.co/storage/v1/object/public/inv-images/` |

---

## När du gör något

Standard-workflow varje gång:

1. **Hitta** rätt rad i `app/page.js`: `grep -n "söktermen" app/page.js`
2. **Läs** runtomkring med `read_file` (chunked)
3. **Edit** med `edit_block` (exakt strängmatchning)
4. **Bygg** med `npx next build 2>&1 | tail -4`
5. **Committa** med `--no-verify`
6. **Pusha** med `GIT_SSH_COMMAND="ssh -i ~/.ssh/id_ed25519_github -o StrictHostKeyChecking=no" git push origin main`
7. **Posta changelog** i `taby_chat` eller `inv_chat`

Detaljerade kommandon finns i `09-WORKFLOW.md`.

---

*Senast uppdaterad: 1 juni 2026 (efter session där achievements, runddetalj, klar-runda-shoutout, LIVE-spectate och HCP-cap byggdes).*
