# Database Schema

> **Supabase project_id:** `swagnjpgddfakncovglo`
> **Connection:** Via `lib/supabase.js` (anon-nyckel från `.env.local`)
> **RLS-policy:** Alla tabeller `FOR ALL USING (true) WITH CHECK (true)` (öppet för auth'd users)

---

## Tabell-översikt

### Gemensamma (DIO + Täby)
- `inv_players` — alla spelare
- `inv_pushsubs` — push-prenumerationer
- `inv_historia` — delat fotogalleri
- `inv_settings` — key-value settings

### DIO
- `inv_scores`, `inv_rounds`, `inv_chat`
- `inv_expenses`, `inv_payments`
- `inv_h2h_matches`, `inv_prop_bets`, `inv_odds_bets`, `inv_odds_options`, `inv_odds_wagers`
- `inv_drunkometer`, `inv_bounty`, `inv_achievements`

### Täby
- `taby_rounds`, `taby_scores`, `taby_chat`
- `taby_achievements`, `taby_events`
- `taby_bets`, `taby_bet_options`, `taby_bet_wagers`
- `taby_h2h`, `taby_expenses`, `taby_payments`, `taby_teams`, `taby_hole_images`

---

## Centrala tabeller i detalj

### `inv_players`

| Kolumn | Typ | Anmärkning |
|---|---|---|
| `id` | uuid PK | |
| `key` | text UNIQUE | "filip", "matthis", etc. Användbar som lookup. |
| `name` | text | Fullständigt namn |
| `nickname` | text | Spelnamn (DIO) |
| `hcp` | numeric | DIO-HCP |
| `taby_hcp` | numeric | Täby-HCP (kan skilja från DIO) |
| `team` | text | "green", "blue", etc (DIO) |
| `image_url` | text | Profilbild (Supabase storage) |
| `phone` | text | För Swish |
| `email` | text | |
| `pin` | text | För login |
| `must_change_pin` | bool | |
| `notif_*` | bool | Push-toggles (6 st) |
| `drunk_level` | int | DIO drunk-o-meter |
| `dio_active` | bool | Visas i DIO |
| `taby_active` | bool | Visas i Täby |
| `hcp_updated_at` | timestamp | När HCP senast ändrades |

**Filterregler:**
- DIO: `WHERE dio_active = true`
- Täby: `WHERE taby_active = true` + använd `taby_hcp`-kolumnen (fallback `hcp`)

---

### `taby_rounds`

| Kolumn | Typ | Anmärkning |
|---|---|---|
| `id` | uuid PK | |
| `date` | date | |
| `type` | text | "solo" \| "group" \| "event" |
| `format` | text | "stableford" \| "stroke" \| "matchplay" \| "skins" \| "lag" |
| `player_ids` | uuid[] | Deltagare |
| `created_by` | uuid | |
| `event_id` | uuid | Ref till `taby_events` om event |
| `event_name` | text | |
| `opponent_id` | uuid | För matchplay |
| `notes` | text | JSON-string: `{"ldHole":N,"npHole":N}` |
| `counts_for_oom` | bool | Räknas för Order of Merit |
| `skins_stake` | int | För skins-format |
| `h2h_pairs` | jsonb | H2H-par i rundan |
| `status` | text | "active" \| "completed" |
| `completion_shoutouts` | uuid[] | **Anti-spam:** spelare som redan blivit shoutoutade |
| `placements` | jsonb | Event-resultat: `{playerId: position}` |
| `created_at` | timestamp | |

---

### `taby_scores`

| Kolumn | Typ | Anmärkning |
|---|---|---|
| `id` | uuid PK | |
| `round_id` | uuid FK → taby_rounds | |
| `player_id` | uuid FK → inv_players | |
| `hole` | int | 1-18 |
| `strokes` | int | |
| `stableford` | int | Beräknat från strokes+par+extra |
| `created_at` | timestamp | |

**UNIQUE constraint:** `(round_id, player_id, hole)`. Upsert används vid score-spar.

---

### `taby_chat`

| Kolumn | Typ | Anmärkning |
|---|---|---|
| `id` | uuid PK | |
| `player_id` | uuid \| NULL | NULL = "från appen" (shoutout) |
| `message` | text | |
| `image_url` | text | Om bild/video |
| `msg_type` | text | "chat" \| "shoutout" \| "image" \| "video" |
| `created_at` | timestamp | |

**Kritiskt:**
- Feed filtrerar bort `msg_type` som inte är `chat/shoutout/image/video` (t.ex. `system`)
- `shoutout` med `player_id: NULL` renderas centrerat i guld som "från appen"

---

### `taby_achievements`

| Kolumn | Typ | Anmärkning |
|---|---|---|
| `id` | uuid PK | |
| `player_id` | uuid FK → inv_players | |
| `achievement_key` | text | Se `lib/taby-achievements.js` |
| `unlocked_at` | timestamp | |
| `round_id` | uuid FK → taby_rounds | Rundan som triggade |

**UNIQUE constraint:** `(player_id, achievement_key)` — varje achievement bara en gång per spelare.

---

### `taby_events`

| Kolumn | Typ | Anmärkning |
|---|---|---|
| `id` | uuid PK | |
| `name` | text | "The Opener", "Sommar-KM", etc |
| `event_type` | text | "event" |
| `date` | date | |
| `format` | text | |
| `participants` | uuid[] | |
| `placements` | jsonb | `{playerId: 1-6}` ger merit-poäng |
| `status` | text | "upcoming" \| "active" \| "completed" |

**Merit-poäng vid placering (1-6):** 25, 18, 12, 8, 5, 2

---

### `taby_h2h`

Head-to-head-matcher mellan två spelare.

| Kolumn | Typ |
|---|---|
| `player1_id`, `player2_id` | uuid |
| `winner_id` | uuid \| NULL |
| `stake` | int |
| `round_id` | uuid |

---

### `inv_pushsubs`

| Kolumn | Typ |
|---|---|
| `player_id` | uuid |
| `endpoint` | text |
| `p256dh` | text |
| `auth` | text |

En spelare kan ha flera enheter (iPhone + Mac → 2 prenumerationer).

---

## Realtime-publikation

**Kritiskt — kör explicit för nya tabeller:**

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE <table_name>;
```

Redan tillagda:
- `taby_scores`, `taby_rounds`, `taby_h2h`, `taby_bets`, `taby_teams`, `taby_expenses`, `taby_chat`, `taby_achievements`
- DIO-tabeller också

---

## Storage

**Bucket:** `inv-images`
**Publik read:** Ja
**Anon insert:** Ja
**Anon update:** **Nej** (kräver tillfällig policy eller service_role)

**URL-format:**
```
https://swagnjpgddfakncovglo.supabase.co/storage/v1/object/public/inv-images/<path>
```

**Paths:**
- `players/<key>.jpg` — profilbilder
- `taby-chat/<timestamp>.<ext>` — chat-bilder
- `taby/holes/hole-<N>.webp` — banguide
- `historia/<...>` — historia-galleri

**Bulk-uppdatera bilder:**
```sql
CREATE POLICY temp_update ON storage.objects FOR UPDATE TO anon USING (true) WITH CHECK (true);
-- gör overwrites
DROP POLICY temp_update ON storage.objects;
```

---

## Edge Functions

| Function | Slug | Status | Syfte |
|---|---|---|---|
| Send Push | `send-push` | ACTIVE | Skickar Web Push-notiser |

**Anropa send-push:**
```bash
curl -X POST "https://swagnjpgddfakncovglo.supabase.co/functions/v1/send-push" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Titel",
    "body": "Meddelande",
    "url": "/?taby_only=1",
    "type": "test",
    "target_player_id": "<uuid>"
  }'
```

Returnerar `{sent, failed, total}`.

---

## Vanliga SQL-snuttar

### Marcus alla rundor
```sql
SELECT r.id, r.date, r.type, COUNT(s.hole) AS hal, SUM(s.stableford) AS total
FROM taby_rounds r
JOIN taby_scores s ON s.round_id = r.id
WHERE s.player_id = (SELECT id FROM inv_players WHERE key='marcus')
GROUP BY r.id, r.date, r.type
ORDER BY r.date DESC;
```

### Räkna om stableford
```sql
UPDATE taby_scores SET stableford = CASE hole
  WHEN 1 THEN GREATEST(0, 5 + 1 - strokes + 2)
  WHEN 2 THEN GREATEST(0, 4 + 1 - strokes + 2)
END WHERE round_id = '...' AND player_id = '...';
```

### Posta changelog
```sql
INSERT INTO taby_chat (player_id, message, msg_type) VALUES
(NULL, '📋 NYTT I APPEN

🏅 ...
📜 ...

Kör hårt! 🥃', 'shoutout');
```

### Lista push-prenumerationer
```sql
SELECT
  (SELECT COUNT(*) FROM inv_pushsubs) AS antal_pren,
  (SELECT COUNT(DISTINCT player_id) FROM inv_pushsubs) AS antal_spelare;
```

---

## Migrations

Hanteras via Supabase MCP `apply_migration`. Exempel:

```
Supabase:apply_migration
  name: add_completion_shoutouts_to_taby_rounds
  query: ALTER TABLE taby_rounds ADD COLUMN IF NOT EXISTS completion_shoutouts uuid[] DEFAULT '{}';
```

Glöm aldrig RLS för nya tabeller:
```sql
ALTER TABLE my_new_table ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open" ON my_new_table FOR ALL USING (true) WITH CHECK (true);
```

Och realtime:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE my_new_table;
```
