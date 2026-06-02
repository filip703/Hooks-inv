# Troubleshooting

> Kända problem och hur de löses.

---

## Score- och poäng-problem

### "Marcus får supermånga poäng / orimliga stableford"

**Symptom:** Spelare har 10+ stableford på ett hål, total över 50p på 6 hål, etc.

**Diagnos:**
1. Verifiera spelarens DB-HCP: `SELECT taby_hcp FROM inv_players WHERE key='...'`
2. Reverse engineer formeln: `stableford = max(0, par + extra - strokes + 2)` → räkna ut vilken `extra` som måste ha använts
3. Räkna ut motsvarande spel-HCP
4. Räkna ut bas-HCP: `hcp ≈ phcp * 113/130`
5. Om bas-HCP är > 36 → cap-bugg
6. Om bas-HCP matchar DB → cache-bugg i klienten

**Två kända root causes:**
- **HCP-input typo (147 istället för 14,7)** → fixad med `max="36"` i input + onBlur-cap
- **Cached `tabyUser` i localStorage** → fixad med färsk DB-läsning i `saveHoleScore`

**Fix:**
1. Räkna om scoren i DB:
   ```sql
   UPDATE taby_scores SET stableford = CASE hole
     WHEN 1 THEN GREATEST(0, <par> + <extra> - strokes + 2)
   END WHERE round_id = '...' AND player_id = '...';
   ```
2. Posta korrigerings-changelog i chatten

---

### "Birdie/eagle-shoutout för spelare som inte gjort birdie"

**Root cause:** Triggern testar `stableford >= 3` istället för `strokes === par - 1`.

**Fix:** Testa alltid `strokes === par - 1` för birdie, `strokes === par - 2` för eagle.

---

### "Stableford > 6 sparas i DB"

**Diagnos:** Stableford > 6 är fysiskt omöjligt.

**Fix:** Verifiera HCP-cap är aktiv. Lägg sanity-check om nödvändigt.

---

## Chat och meddelanden

### "Chatten uppdateras inte live"

**Root cause:** Tabellen är inte med i Supabase Realtime-publikationen.

**Verifiera:**
```sql
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```

**Fix:**
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE <tabellnamn>;
```

---

### "Min changelog syns inte i chatten"

**Root cause:** Använde `msg_type = 'system'`. Feeden filtrerar bort den.

**Fix:** Använd `msg_type = 'shoutout'` med `player_id: NULL`.

```sql
INSERT INTO taby_chat (player_id, message, msg_type)
VALUES (NULL, '📋 ...', 'shoutout');
```

---

### "Dubbletter av meddelanden visas"

**Root cause:** Optimistic update + realtime INSERT triggar båda.

**Fix-mönster:**
```js
// Skicka:
setTabyChat(prev => [{ id: 'tmp-' + Date.now(), ... }, ...prev])
await supabase.from('taby_chat').insert({ ... })

// Realtime-handler: re-fetch hela listan
.on('postgres_changes', { event: 'INSERT', ... },
  () => {
    supabase.from('taby_chat').select('*').order(...).limit(150)
      .then(({ data }) => { if (data) setTabyChat(data) })
  }
)
```

---

## Push-notiser

### "Push fungerar inte"

**Verifiera kedjan:**

1. **Edge function ACTIVE?**
   `Supabase:list_edge_functions` → `send-push` ska vara `ACTIVE`

2. **Service worker registrerad?**
   DevTools → Application → Service Workers → aktiv för hooks-inv.vercel.app

3. **Prenumerationer finns?**
   ```sql
   SELECT COUNT(*) FROM inv_pushsubs;
   ```

4. **VAPID-nycklar OK?**
   - Vercel env vars: `VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY`

5. **Test-push:**
   ```bash
   ANON=$(grep ANON_KEY .env.local | cut -d= -f2)
   curl -X POST "https://swagnjpgddfakncovglo.supabase.co/functions/v1/send-push" \
     -H "Authorization: Bearer $ANON" \
     -H "Content-Type: application/json" \
     -d '{"title":"Test","body":"Test","target_player_id":"<uuid>"}'
   ```

---

### "Push når en spelare men inte en annan"

**Vanliga orsaker:**
- Spelaren har inte aktiverat push på sin enhet
- Push-toggles avstängda i deras profil
- Endpoint har gått ut → spelaren behöver re-prenumerera

**Fix:** Be spelaren öppna profil → "🔔 Aktivera push-notiser på denna enhet".

---

## Build- och deployment-problem

### "npx next build failar"

**Diagnos:** Läs felmeddelandet noga.

**Snabb syntax-check:**
```bash
python3 -c "
with open('/Users/filiphector/Hooks-inv/app/page.js') as f: s = f.read()
print('{ vs }:', s.count('{') - s.count('}'))
print('( vs ):', s.count('(') - s.count(')'))
"
```

Diff = 0 = balanserat.

**Fix:** Re-läs regionen kring edit och fixa manuellt.

---

### "Vercel build failar trots att lokal build funkar"

**Sällsynt.** Vanligt:
- ENV-variabler saknas i Vercel
- Branch/cache-problem

**Fix:** Vercel dashboard → Settings → Environment Variables. Eller tom commit för fresh build.

---

### "Deploy klar men ändring syns inte"

**Root cause:** PWA cache (iOS Safari är extra envis).

**Fixar:**
1. Öppna i vanlig Safari (inte PWA)
2. `?v=N` i URL för cache-bypass
3. `?reset=1` (rensar localStorage + sessionStorage + avregistrerar SW)
4. Sista utväg: ta bort PWA, installera igen

---

## Realtime-problem

### "Score uppdateras inte live för andra"

1. Verifiera `taby_scores` är i realtime-publikationen
2. Kolla browser-console efter Supabase-subscription-fel
3. Verifiera RLS tillåter SELECT för anon

---

## MCP-problem

### "Desktop Commander hänger"

**Tecken:** `start_process` ger inget output, `read_file` timeoutar.

**Fix:**
1. Vänta 30 sek, försök igen
2. Om fortfarande hängd: restart MCP via Mac System Preferences → Profiles
3. Eller: använd Supabase MCP för verifiering

---

### "edit_block matchar inte"

**Root cause:** Filen ändrades sedan senaste läsning, eller whitespace skiljer.

**Fix:**
1. Re-läs regionen färskt
2. Kopiera EXAKT (inklusive whitespace) som `old_string`
3. Försök igen

Om edit_block visar character-diff, läs `{-removed-}` och `{+added+}` markeringarna noga.

---

## Storage-problem

### "Bilduppladdning failar"

**Verifiera:**
- Bucket `inv-images` finns och är publik read
- Anon-policy tillåter INSERT
- Filstorlek inom Supabase-limits

**Vid bulk-overwrite (anon kan inte UPDATE):**
```sql
CREATE POLICY temp_update ON storage.objects FOR UPDATE TO anon USING (true);
-- Kör overwrites
DROP POLICY temp_update ON storage.objects;
```

---

## Vanliga "varför"-frågor

### "Varför är page.js så enorm?"
Medvetet enkelt — en utvecklare som iterar snabbt. Splittas i framtiden.

### "Varför ingen TypeScript?"
Filip prioriterar hastighet över type-safety.

### "Varför inline styles överallt?"
Snabbare iteration än CSS-filer. Mode-switching via `data-mode`-attribut.

### "Varför ingen routing?"
Single-page-app, state-driven. Mode + view via useState.

### "Varför saveHoleScore läser HCP varje gång?"
Säkerhetsnät mot cache-buggar. Extra DB-läsning är försumbar.

---

## När allt annat misslyckas

1. **Kolla senaste commits:** `git log --oneline -10`
2. **Verifiera mot DB:** allt i Supabase är sanningens källa
3. **Reset client:** `?reset=1` i URL → ren start
4. **Fråga Filip:** han känner appen bäst
