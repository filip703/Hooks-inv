# Push-infrastructure

> Hela end-to-end-kedjan för push-notiser i Hooks-inv.

---

## Översikt

```
[Klient]              [Supabase]                [Edge Function]              [Browser]
                                                                                 │
1. Subscribe          → INSERT inv_pushsubs                                      │
                      ← endpoint, p256dh, auth                                   │
                                                                                 │
2. Trigger event      → Direct API call                                          │
                      → send-push                                                │
                                                                                 │
                                                  → Web Push                     │
                                                  ← endpoint, payload            │
                                                                                 │
                                                  → Push service (Apple/Google)  │
                                                                                 ▼
                                                                            [Notis]
```

---

## Komponenter

### 1. VAPID-nycklar

**Generera (en gång):**
```bash
npx web-push generate-vapid-keys
```

**Lagring:**
- `VAPID_PUBLIC_KEY` — i Vercel env vars (klient-side)
- `VAPID_PRIVATE_KEY` — i Vercel env vars (server-side) + Supabase edge function secrets

**Aldrig** committa till git.

---

### 2. Klient (`lib/push.js`)

**Subscribe-flöde:**
1. Be om Notification permission
2. Få service worker
3. `serviceWorker.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: VAPID_PUBLIC_KEY })`
4. POST endpoint till Supabase `inv_pushsubs`

**Send-flöde (från app):**
1. Bestäm payload (`title`, `body`, `url`, `type`, `target_player_id` eller `exclude_player_id`)
2. POST till `https://swagnjpgddfakncovglo.supabase.co/functions/v1/send-push`

---

### 3. Service Worker (`public/sw.js`)

**Push-handler:**
```js
self.addEventListener('push', (event) => {
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/badge.png',
      data: { url: data.url }
    })
  )
})
```

**Click-handler:**
```js
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      // Fokusera befintlig PWA-tab eller öppna ny
      for (const client of clientList) {
        if (client.url.includes('hooks-inv.vercel.app')) {
          return client.focus()
        }
      }
      return clients.openWindow(url)
    })
  )
})
```

---

### 4. Edge Function `send-push`

**Status:** ACTIVE
**Endpoint:** `https://swagnjpgddfakncovglo.supabase.co/functions/v1/send-push`
**Auth:** Bearer-token (anon-nyckel)

**Vad den gör:**
1. Tar emot POST med `{title, body, url, type, target_player_id?, exclude_player_id?}`
2. Filtrerar prenumerationer baserat på target/exclude
3. Skickar Web Push till varje prenumeration parallellt
4. Returnerar `{sent: N, failed: N, total: N}`

**Targeting:**
- `target_player_id` (uuid) → bara den spelaren
- `exclude_player_id` (uuid) → alla utom den spelaren
- Inget av dem → alla med prenumerationer

**Vid push-fail** (HTTP 410 Gone t.ex.):
- Endpoint utgången → tabort prenumerationen (eventuellt manuellt)

---

## Push-triggers i appen

### Täby
- **Ny medalj upplåst** — `checkNewAchievements` postar shoutout + skickar push till alla utom spelaren
- **Klar-runda** — `checkRoundCompletion` postar shoutout + push till alla taby-spelare som inte var med
- **Ny runda startad** — postar i feed + skickar push till spelare i rundan
- **Birdie/eagle/HIO** — auto-shoutout + push till andra
- **Broadcast från admin** — manuell push till valt mottagar-set

### DIO
- **Eagles/Birdies** av andra
- **Prop bet avgjord**
- **H2H avgjord**
- **Ny skuld** i Even Steven
- **Chat @-mention**
- **Ledarbyte** i leaderboard
- **Broadcast** (Tee-off / Bar / Spa / Middag / Prisutdelning / Gruppfoto)

Granular toggles per spelare i `inv_players.notif_*` (5 bools).

---

## Test-kommandon

### Skicka test-push till Filip
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

Returnerar `{"sent":N,"failed":N,"total":N}`.

### Räkna prenumerationer
```sql
SELECT
  (SELECT COUNT(*) FROM inv_pushsubs) AS antal_pren,
  (SELECT COUNT(DISTINCT player_id) FROM inv_pushsubs) AS antal_spelare;
```

### Lista prenumerationer per spelare
```sql
SELECT p.key, p.nickname, COUNT(s.endpoint) AS enheter
FROM inv_players p
LEFT JOIN inv_pushsubs s ON s.player_id = p.id
WHERE p.taby_active = true OR p.dio_active = true
GROUP BY p.key, p.nickname
ORDER BY enheter DESC;
```

### Hitta orsaken till en push-fail
1. Edge function logs:
   ```
   Supabase:get_logs
     project_id: swagnjpgddfakncovglo
     service: edge-function
   ```
2. Sök efter 410 Gone, 404, etc.

---

## Vanliga problem

### "Push funkar inte alls"

Kolla kedjan:
1. VAPID-nycklar i Vercel env vars
2. Edge function ACTIVE
3. Prenumerationer i DB (inv_pushsubs)
4. Service worker registrerad (DevTools → Application)
5. Användaren har gett Notification permission

### "Push når en spelare men inte en annan"

- Personen har inte prenumererat på denna enhet
- Notification permission denied
- Endpoint har gått ut

### "Push når en användare flera gånger"

Spelaren har flera prenumerationer (iPhone + Mac → 2 enheter). Förväntat beteende.

### "Notifikationen visar inte rätt URL"

- Service worker click-handler är felaktig
- Eller PWA-cache är gammal — re-installera PWA

---

## iOS-specifika gotchas

- PWA måste vara installerad på hemskärmen för push att funka
- Notification permission frågas BARA om appen är öppen
- Background push fungerar endast efter PWA-installation
- Cache är extra envis — `?reset=1` rensar

---

## Säkerhetshänsyn

- Anon-nyckeln kan inte missbrukas för spam (rate limits på Supabase + Web Push)
- Endpoints är opaka (innehåller token)
- Edge function verifierar bearer-token

---

## Förbättringar att överväga

- [ ] Granular toggles per Täby-trigger
- [ ] "Tystläge"-schema (inga push 22-08)
- [ ] Bättre felhantering vid 410 Gone (auto-städning av endpoints)
- [ ] Push-statistik (vad har skickats, när)
