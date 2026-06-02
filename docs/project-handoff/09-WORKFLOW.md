# Dev Workflow

> Hur Claude jobbar med koden via Desktop Commander MCP, Supabase MCP, etc.

---

## Setup (en gång)

### MCP-servrar Claude använder
- **Desktop Commander** — direktåtkomst till Filips Mac (read/edit/process)
- **Supabase** — SQL, migrations, edge functions
- **Vercel** — deployment-status, logs
- **GitHub** — opcionell (men Filip pushar oftast själv)

### Lokal sökväg
`/Users/filiphector/Hooks-inv/`

### Nyckel-filer
- `.env.local` — innehåller anon-nyckel, VAPID, Anthropic API key
- `~/.ssh/id_ed25519_github` — SSH-nyckel för push

---

## Standard-workflow per ändring

### 1. Hitta rätt rad i page.js
```
grep -n "söktermen" app/page.js
```

Eller via Desktop Commander:
```
start_process: cd /Users/filiphector/Hooks-inv && grep -n "söktermen" app/page.js | head -10
```

### 2. Läs runt rätt rad (chunked)
```
read_file path=/Users/filiphector/Hooks-inv/app/page.js offset=N length=30
```

ELLER:
```
start_process: sed -n 'N,Mp' app/page.js
```

### 3. Edit med exakt strängmatchning
```
edit_block:
  file_path: /Users/filiphector/Hooks-inv/app/page.js
  old_string: <exakt sträng inkl whitespace>
  new_string: <ny sträng>
```

**OBS:** `edit_block` kräver att `old_string` matchar EXAKT inklusive whitespace. Om filen ändrats sedan senaste läsning, re-läs först.

### 4. Bygg + verifiera
```
start_process: cd /Users/filiphector/Hooks-inv && npx next build 2>&1 | tail -4
```

Build tar ~30-60 sek. Bara `tail -4` räcker oftast.

### 5. Commit + push
```bash
git add -A && git commit --no-verify -m "Taby: kort beskrivning

Detaljer på flera rader om vad och varför.
Inga ÅÄÖ i commit messages."
```

```bash
GIT_SSH_COMMAND="ssh -i ~/.ssh/id_ed25519_github -o StrictHostKeyChecking=no" git push origin main
```

Kan slås ihop:
```bash
cd /Users/filiphector/Hooks-inv && \
npx next build 2>&1 | tail -3 && \
git add -A && git commit --no-verify -m "..." 2>&1 | tail -3 && \
GIT_SSH_COMMAND="ssh -i ~/.ssh/id_ed25519_github -o StrictHostKeyChecking=no" git push origin main 2>&1 | tail -2
```

### 6. Posta changelog (obligatoriskt)
```sql
INSERT INTO taby_chat (player_id, message, msg_type) VALUES
(NULL, '📋 NYTT I APPEN

✨ Vad: ...
🛡️ Varför: ...

Kör hårt! 🥃', 'shoutout');
```

Exekvera via Supabase MCP `execute_sql`.

---

## Supabase MCP — vanliga operationer

### Köra SQL
```
Supabase:execute_sql
  project_id: swagnjpgddfakncovglo
  query: SELECT ...
```

### Migration
```
Supabase:apply_migration
  project_id: swagnjpgddfakncovglo
  name: min_migration_namn
  query: ALTER TABLE ... ADD COLUMN ...
```

### Lista tabeller
```
Supabase:list_tables
  project_id: swagnjpgddfakncovglo
  schemas: ['public']
  verbose: false
```

### Lista edge functions
```
Supabase:list_edge_functions
  project_id: swagnjpgddfakncovglo
```

### Logs (debug)
```
Supabase:get_logs
  project_id: swagnjpgddfakncovglo
  service: edge-function
```

---

## Vercel — deployments

### Kolla senaste deploy
```
Vercel:list_deployments
  projectId: prj_Q8wdcEh7xdRAQ38SL7ls2syd1FdN
  teamId: team_S3T5nVpPYkFTPvSvLXxea2XX
```

### Build logs (debug)
```
Vercel:get_deployment_build_logs
  idOrUrl: <url>
  teamId: team_S3T5nVpPYkFTPvSvLXxea2XX
```

### Runtime logs
```
Vercel:get_runtime_logs
  projectId: prj_Q8wdcEh7xdRAQ38SL7ls2syd1FdN
  teamId: team_S3T5nVpPYkFTPvSvLXxea2XX
  level: ['error', 'warning']
  since: '1h'
```

---

## Vanliga test-kommandon

### Push-test till specifik spelare
```bash
ANON=$(grep NEXT_PUBLIC_SUPABASE_ANON_KEY /Users/filiphector/Hooks-inv/.env.local | cut -d= -f2 | tr -d '"' | tr -d ' ')

curl -X POST "https://swagnjpgddfakncovglo.supabase.co/functions/v1/send-push" \
  -H "Authorization: Bearer $ANON" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test",
    "body": "Test-meddelande",
    "url": "/?taby_only=1",
    "type": "test",
    "target_player_id": "12e1610b-32e0-43b8-96c2-49889b2ebb62"
  }'
```

### Lokal dev-server
```bash
cd ~/Hooks-inv && npm run dev
```

### JSX-syntax-check (snabb)
```bash
cd /Users/filiphector/Hooks-inv && \
python3 -c "
with open('app/page.js') as f: s = f.read()
print('{ vs }:', s.count('{') - s.count('}'))
print('( vs ):', s.count('(') - s.count(')'))
print('[ vs ]:', s.count('[') - s.count(']'))
"
```

Diff = 0 → balanserat.

---

## Hantering av stora filer

`app/page.js` är ~11 400 rader. Strategier:

### Aldrig läs hela filen
```
❌ read_file path=app/page.js  (ingen offset/length)
```

### Använd grep för att hitta rader först
```
✅ grep -n "söktermen" app/page.js
```

### Läs chunked
```
✅ read_file path=app/page.js offset=1000 length=50
```

### Visa flera rader vid edit-debug
```
sed -n '1018,1090p' app/page.js
```

---

## Felsökning av hängd MCP

**Desktop Commander hänger ibland** vid långa sessioner. Tecken:
- `start_process` returnerar inget
- `read_file` ger timeout

**Fix:**
1. Restart Mac System Preferences → Profiles → ta bort & lägg till MCP
2. Eller verifiera resultat via Supabase MCP / Vercel MCP istället
3. Verifiera commits med `git log --oneline -5` när det funkar igen

---

## Git-praxis

### Commit-meddelanden
- **Engelska**, deskriptiva
- Format:
  ```
  <scope>: <kort sammanfattning>
  
  Detaljer på flera rader om vad och varför.
  Inga ÅÄÖ (kan orsaka problem i pipelines).
  ```

### Scope-prefix
- `Taby:` — Täby-specifik
- `DIO:` — DIO-specifik
- `CLAUDE.md:` — dokumentation
- Ingen prefix för delade saker

### Branches
- Använder bara `main`

### Force-push
- **Aldrig** till main

### Hooks
- `--no-verify` används för att skippa pre-commit hooks

---

## När något går fel under deployment

### Build failar på Vercel
1. Kolla Vercel build logs: `Vercel:get_deployment_build_logs`
2. Kör samma build lokalt: `npx next build`
3. Vanligt: syntax error från ofullständig edit_block. Re-läs och fixa.

### Runtime error
1. Vercel runtime logs
2. Supabase logs

### Realtime fungerar inte
1. Verifiera publikation: `SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';`
2. Om tabellen saknas: `ALTER PUBLICATION supabase_realtime ADD TABLE x;`

### Score-bug eller HCP-fel
1. Hämta scoren från DB
2. Reverse engineer formeln för att hitta extra-värdet
3. Identifiera vilken HCP som ger det extra-värdet
4. Hitta källa till felaktig HCP (cache, input, etc)
5. Räkna om i DB + lägg sanity-check

---

## Roller och rättigheter

### Filip
- Admin i appen
- Pushar själv från sin Mac
- All access till Supabase/Vercel via MCP

### Claude (denna agent)
- Får ändra kod via Desktop Commander
- Får exekvera SQL via Supabase MCP
- Får deploya via git push
- Får posta i taby_chat / inv_chat (changelogs)
- **Får INTE:** ändra Filips personliga data utan explicit tillstånd

### Marcus
- Admin i appen (för redundans)
- Ingen MCP-access

---

## Common gotchas

### Kommatecken i SQL
SQL-strängar med svenska tecken funkar i Supabase. Skriv ut direkt.

### onBlur vs onChange för input
Använd `onBlur` för att spara HCP — `onChange` triggar för varje tangent.

### Realtime + optimistic updates
För chat: posta lokalt först med `id: 'tmp-' + Date.now()`, sen ersätter realtime-handler hela listan vid INSERT. Dedupar automatiskt.

### React #310 (early returns)
`useEffect`-hooks måste ligga **före** alla early returns för att undvika React error #310.

### `--no-verify` på commits
Använd `git commit --no-verify` för att skippa pre-commit hooks. Snabbare iteration.
