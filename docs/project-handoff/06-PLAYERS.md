# Spelare

> Snabbreferens för alla spelare i båda lägena.

---

## Täby Order of Merit (6 spelare, `taby_active = true`)

| Key | Namn | Nickname | taby_hcp | Notes |
|---|---|---|---|---|
| `filip` | Filip Hector | Mr Vain | 8.6 | Utvecklaren + spelare |
| `matthis` | Matthis Jackobson | The Grinder | 16.8 | Leder Order of Merit just nu |
| `marcus` | Marcus Ullholm | Dr Erektor | 14.7 | "65p-incidenten" — se 05-GOLF-LOGIC.md |
| `fredrik` | Fredrik Hellstenius | The Fossil | 22.5 | |
| `magnus` | Magnus Jarlgren | The Hybrid | 22.9 | Mycket välbärgad (privat detalj) |
| `rami` | Rami Hamdeh | Snutas | — | Bara Täby, inte DIO |

Martin är BARA DIO (`taby_active = false`).

**Filip's ID:** `12e1610b-32e0-43b8-96c2-49889b2ebb62`

---

## DIO (Douche Invitational Only) (6 spelare, `dio_active = true`)

| Key | Namn | Nickname | hcp | Team | Notes |
|---|---|---|---|---|---|
| `filip` | Filip Hector | Long Gone | 8.6 | Jägermeister | |
| `matthis` | Matthis Jackobson | Pro Am | 16.8 | Jägermeister | Vinnare 2025 ("Matthis The Great") |
| `marcus` | Marcus Ullholm | The Spreadsheet | 13.8 | Fernet | Vinnare 2021 |
| `fredrik` | Fredrik Hellstenius | Old Fashioned | 22.3 | Fernet | |
| `magnus` | Magnus Jarlgren | Plan B | 22.8 | Jägermeister | Vinnare 2024 |
| `martin` | Martin Jarlgren | Plus One | 40.0 | Fernet | Magnus syskon |

Plus `spectator` (åskådarläge, ingen poäng).

---

## Historik och vinnare

### DIO-vinnare per år
- 2021: Marcus
- 2022: Filip
- 2024: Magnus
- 2025: Matthis ("The Great")
- 2026: TBD

### Filip 2026
- DIO: 8.6 HCP
- Täby: 8.6 HCP
- Spelar nyckelroll i båda men ligger efter Matthis i Täby

---

## Push-prenumerationer (per 1 juni 2026)

| Spelare | Antal enheter |
|---|---|
| Filip | 3 (iPhone + Mac × 2) |
| Övriga | Varierar |
| **Total** | 9 prenumerationer / 6 spelare |

Aktivera push: profil → "🔔 Aktivera push-notiser på denna enhet".

---

## Notis-toggles (per spelare)

I `inv_players`-tabellen finns 5 bools för granular push-styrning:

- `notif_eagles_birdies` — birdies/eagles av andra
- `notif_prop_settled` — prop bets avgjorda
- `notif_h2h_settled` — H2H avgjord
- `notif_new_debt` — ny skuld
- `notif_mentions` — @-mentions i chat
- `notif_leader_change` — ledarbyte

Plus Täby-specifika (alla pushar default):
- Nya rundor startade
- Achievements upplåsta
- Klar-runda av andra

Inga separata toggles för Täby än — alla aktiva push-spelare får alla pushar.

---

## Profilbilder

Sparade i Supabase storage:
- Path: `players/<key>.jpg`
- URL: `https://swagnjpgddfakncovglo.supabase.co/storage/v1/object/public/inv-images/players/<key>.jpg`
- Refereras i `inv_players.image_url`

Bilder komprimeras automatiskt vid uppladdning (max 1600px, JPEG 0.82).

---

## DIO Group Lore (internt skämt — endast för DIO-kontext)

- **Magnus** = "Plan B / The Hybrid" — välbärgad
- **Matthis** = "Pro Am / The Grinder" — varit arbetslös
- **Martin** = "Plus One" — kommunist-skämt
- **Filip** = "Long Gone / Mr Vain" — utvecklaren
- **Marcus** = "The Spreadsheet / Dr Erektor" — analyst-typ
- **Fredrik** = "Old Fashioned / The Fossil" — äldsta

Dessa nicknames används brutalt-humoristiskt mellan spelarna i DIO-kontext. Försiktig användning i Täby (mer professionellt).

---

## Vanliga ändringar

### Lägga till en spelare i Täby
```sql
UPDATE inv_players SET taby_active = true, taby_hcp = 18.0 WHERE key = 'newuser';
```

### Ändra HCP
Använd admin-vyn i appen (Settings → Täby Handicap). Capar automatiskt till 0-36.

Eller via SQL (om nödvändigt):
```sql
UPDATE inv_players SET taby_hcp = 14.7, hcp_updated_at = NOW() WHERE key = 'marcus';
```

### Inaktivera spelare temporärt
```sql
UPDATE inv_players SET taby_active = false WHERE key = '...';
```

---

## Filip's personliga config

- **Player ID:** `12e1610b-32e0-43b8-96c2-49889b2ebb62`
- **Email:** `filip@make.golf`
- **Phone:** För Swish (privat — finns i DB)
- **Walk-up song (DIO):** Specifik Spotify-track
- **Push:** 3 enheter aktiva
- **Roll:** Admin + spelare. Kan ändra HCP, settings, allt.

Admin-rättigheter i appen kontrolleras med `tabyUser?.key === 'filip' || tabyUser?.key === 'marcus'` (Marcus har också admin för redundans).
