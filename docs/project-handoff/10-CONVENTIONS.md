# Conventions

> Hur vi skriver kod, ton-of-voice, och de **obligatoriska reglerna**.

---

## 🚨 OBLIGATORISKA REGLER

### 1. Posta ALLTID changelog efter användarpåverkande ändringar

Efter varje feature/fix som påverkar slutanvändare:

**SQL-template (Täby):**
```sql
INSERT INTO taby_chat (player_id, message, msg_type) VALUES
(NULL, '📋 NYTT I APPEN

✨ <Vad ändrades>
🛡️ <Eventuell fix-info>

Kör hårt! 🥃', 'shoutout');
```

**SQL-template (DIO):**
```sql
INSERT INTO inv_chat (player_id, message, msg_type) VALUES
(NULL, '📋 ...', 'shoutout');
```

**Kritiska detaljer:**
- `player_id = NULL` → renderas centrerat i guld som "från appen"
- `msg_type = 'shoutout'` → passerar feed-filtret
- **`msg_type = 'system'` filtreras BORT av feeden** → använd aldrig
- Täby-ändringar → `taby_chat`
- DIO-ändringar → `inv_chat`

### 2. HCP capad till max 36
Både input-fältet (`max="36"` + onBlur-cap) och beräkningar (`getPlayingHcp`). Säkerhetsnät efter historisk bugg.

### 3. Birdie/Eagle/HIO ALLTID strokes vs par
Aldrig på stableford-värde.

### 4. Läs aldrig hela `app/page.js`
11 400 rader. Använd `grep -n` → `read_file` med offset/length.

### 5. Aldrig force-push till main
Solo-utvecklare, men ändå.

---

## Språk

### UI (allt synligt i appen)
**Svenska**. Inga undantag.

### Kod (variabler, funktioner, kommentarer)
**Engelska**. CamelCase för funktioner/variabler. snake_case för databasfält.

### Commit-meddelanden
**Engelska**, deskriptiva. Undvik ÅÄÖ.

### Markdown-filer
**Svenska**. Mest läses av Filip.

---

## Skrivstil i appen

### Ton
- Semi-formell, men varm
- Könsneutral som default
- Brutalt-humoristisk i DIO-kontext
- Mer professionell i Täby

### Längd
- Korta paragrafer
- Bullet points när det är listor
- Mycket vita ytor

### Inga klyschor
- ❌ "i en ständigt föränderlig värld"
- ❌ "game-changer"
- ❌ "synergier"
- ❌ "next-level"

### Aktiv form
- ✅ "Appen postar nu shoutout"
- ❌ "Shoutout postas nu av appen"

---

## Kod-stil

### React/Next.js
- **Funktionella komponenter + hooks**
- **Inline styles** eller styled-jsx — ingen Tailwind
- **CSS-variabler** för temat
- **useState** för all state

### Filer
- Allt i `app/page.js` (monolit)
- Helpers i `lib/`
- Ingen TypeScript

### Naming
- Funktioner: `camelCase`
- Komponenter: `PascalCase`
- Konstanter: `UPPER_SNAKE_CASE`
- Databasfält: `snake_case`
- CSS-vars: `--kebab-case`

### Comments
- Korta, beskrivande, **engelska**
- Förklara **varför**, inte **vad**
- Markera kritiska sektioner med `// VIKTIGT:` eller `// KRITISKT:`

### Async/await
- Använd `async/await` för all async-kod
- Catch errors med try/catch
- `.catch(() => {})` för fire-and-forget

---

## Stil i markdown-dokument

### Tabeller
För strukturerad data. Inte för flow.

### Code blocks
- ` ``` ` med språk-tag (`js`, `sql`, `bash`)
- Inline `kod` för korta referenser

### Emojis
- 🏌️ för golf-tema
- 🔥 / 💪 / 👏 för celebrations
- ⚠️ / 🛡️ för warnings
- 📋 för listor
- Sparsamt

### Headers
- H1 (#) för dokumenttitel
- H2 (##) för huvudsektioner
- H3 (###) för subsektioner
- H4 (####) för listobjekt med titel

### Horisontella linjer
- I markdown-filer: OK för att separera sektioner
- I appens UI och chat-meddelanden: **ALDRIG**
- I Claude's chat-svar: **ALDRIG**

---

## Git-commits

### Format
```
<scope>: <kort beskrivning på rad 1>

Detaljer på flera rader.
Vad ändrades. Varför. Effekter.
Inga ÅÄÖ.
```

### Scope
- `Taby:` — Täby-specifik
- `DIO:` — DIO-specifik
- `CLAUDE.md:` — dokumentation
- Ingen prefix för delade saker

### Bra exempel
```
Taby: klar-runda-shoutout (18 hal) + pulserande LIVE-badge i leaderboard

1. KLAR-RUNDA-SHOUTOUT: checkRoundCompletion korr efter sista hal-spar.
   Nar alla 18 hal ar reggade -> shoutout i taby_chat med totaler + flair
   ('Hett!' for 40+, 'Riktigt bra!' for 36+ etc) + push till alla taby-
   spelare UTANFOR rundan + toast + ljud till spelaren sjalv.
   Anti-spam via taby_rounds.completion_shoutouts uuid[].

2. LIVE-BADGE: pulserande rod 'LIVE'-badge bredvid namnet i leaderboarden
   nar nagon har en pagaende runda.
```

---

## Säkerhetsregler

### RLS
- Alla tabeller måste ha RLS aktiverat
- Policy: `FOR ALL USING (true) WITH CHECK (true)`
- Inga personuppgifter utanför skyddade tabeller

### Secrets
- `.env.local` (lokalt, ej commited)
- Vercel env vars (production)
- **Aldrig** hårdkoda anon-nyckel eller API keys i `app/page.js`

### Storage
- `inv-images`-bucket är publikt read
- Anon kan INSERT (för chat-uploads)
- Anon kan EJ UPDATE (säkerhet) — kräver tillfällig policy för bulk

---

## Sammanfattning för Claude i en ny chat

1. **Svenska** i UI och chat-meddelanden
2. **Engelska** i kod, kommentarer, commits
3. **Ingen `---`** i löpande svar eller i app-text
4. **Posta changelog** efter varje feature
5. **Capa HCP** till 0-36 ALLTID
6. **Birdie/eagle** = strokes vs par, aldrig stableford
7. **Chunked reads** av page.js (11k+ rader)
8. **`msg_type: 'shoutout'`** med `player_id: NULL` för "från appen"
9. **Aldrig** force-push
10. **Verifiera** med `git log` eller `grep` efter MCP-timeouts
