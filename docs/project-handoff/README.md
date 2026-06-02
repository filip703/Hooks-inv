# Hooks-inv — Projekt-handoff

> 17 markdown-filer som ger Claude komplett kontext om appen.
> Ladda upp alla i ett nytt Claude Project för att starta fresh utan att förlora kunskap.

---

## Filer

| # | Fil | Innehåll |
|---|---|---|
| 00 | `00-START-HERE.md` | Index + quick start för ny chat |
| 01 | `01-CLAUDE.md` | Master config med alla regler |
| 02 | `02-PROJECT-OVERVIEW.md` | Status, IDs, URLs, stack |
| 03 | `03-ARCHITECTURE.md` | Single-page app struktur, region-karta |
| 04 | `04-DATABASE-SCHEMA.md` | Komplett DB med alla tabeller |
| 05 | `05-GOLF-LOGIC.md` | Stableford, HCP-formler + bugghistorik |
| 06 | `06-PLAYERS.md` | Alla spelare med ID, HCP, push-data |
| 07 | `07-FEATURES-TABY.md` | Full Täby feature-lista |
| 08 | `08-FEATURES-DIO.md` | Full DIO feature-lista |
| 09 | `09-WORKFLOW.md` | Dev-workflow MCP/git/build |
| 10 | `10-CONVENTIONS.md` | Språk, stil, regler, changelog-regel |
| 11 | `11-TROUBLESHOOTING.md` | Vanliga problem + lösningar |
| 12 | `12-ROADMAP.md` | Pending features, milestones 2026 |
| 13 | `13-FILIP-BRAND.md` | Filips brand standard + tonalitet |
| 14 | `14-SESSION-LEARNINGS.md` | Session-historik, topp-10 lärdomar |
| 15 | `15-PUSH-INFRASTRUCTURE.md` | Push end-to-end (VAPID + SW + edge) |
| 16 | `16-IMAGE-COMPRESSION.md` | Komprimerings-logik + bulk-process |

---

## Så här startar du ett nytt Claude Project

1. Gå till **claude.ai → Projects → New project**
2. Namnge projektet "Hooks-inv" (eller liknande)
3. I projekt-instruktioner, klistra in följande:

```
Detta projekt är dual-mode golf-PWA Hooks-inv som körs på 
hooks-inv.vercel.app. Läs filerna i project-handoff/ för full kontext.

Börja varje session med att förstå:
1. 00-START-HERE.md (start-punkten)
2. 01-CLAUDE.md (master config)
3. Andra relevanta filer baserat på vad jag ber om

Följ ALLTID changelog-regeln: posta en kort uppdatering i taby_chat 
efter användarpåverkande ändringar.
```

4. **Ladda upp alla 17 filer** från denna mapp (`00-START-HERE.md` till `16-IMAGE-COMPRESSION.md`)
5. Starta en chat och säg t.ex. "Läs filerna och hjälp mig med X"

---

## Vad som är NYCKEL

Om du inte vill ladda upp allt, dessa 5 är kritiska för att Claude ska komma igång:

1. **`00-START-HERE.md`** — index + quick start
2. **`01-CLAUDE.md`** — master config med regler
3. **`04-DATABASE-SCHEMA.md`** — DB-strukturen
4. **`05-GOLF-LOGIC.md`** — scoring + bugghistorik
5. **`10-CONVENTIONS.md`** — språk, stil, regler

Resten är fördjupning.

---

## Underhåll

Uppdatera dessa filer när:
- Större features läggs till
- Buggar fixas (lägg i `14-SESSION-LEARNINGS.md`)
- Spelar-info ändras
- Schema ändras
- Workflow förbättras

Ingen automatisk synk — manuell uppdatering vid behov.

---

*Skapad 1 juni 2026 av Claude i samband med Hooks-inv session där HCP-cap, klar-runda-shoutout, LIVE-spectate och achievements byggdes.*
