# Changelog – Douche Invitational Only 2026

Alla ändringar i appen dokumenteras här. Lägg till dina ändringar överst innan du pushar.

Format: `## [datum] Beskrivning (@vem)`

---

## [2026-04-15] PWA-ikoner: Le Douche de Golf bucklan (@filip)
- Alla ikoner genererade från det riktiga trofé-fotot
- icon-512, icon-192, apple-touch-icon, favicon
- Bucklan med "DIO 2026" i guld text
- Mörk gradient-overlay för läsbarhet

## [2026-04-15] Namnfix: Douche Invitational Only (@filip)
- Tävlingen: "Douche Invitational Only" (DIO)
- Bucklan: "Le Douche de Golf"
- Ingen grön kavaj – bara bucklan
- PWA short name: DIO 2026
- Marcus hade rätt hela tiden

## [2026-04-15] Rename till Le Deusch de Golf (@filip)
- Bytt namn från "The Invitational" till "Le Deusch de Golf" överallt
- Manifest, page title, login, info-sida, PWA-namn

## [2026-04-15] PWA-fix för iOS Safari (@filip)
- Separerade ikon-purposes (any/maskable) – Safari-krav
- Borttagen crossorigin på manifest-länk
- Nya ikoner med Georgia Bold
- apple-mobile-web-app-title fixad

## [2026-04-14] Phase 11: Spotify-fix, slag/hål, spellistor (@filip)
- 8 av 18 Spotify-låtar hade döda track IDs – alla ersatta och verifierade
- Extra slag visas som gröna prickar per hål (●● = 2 slag)
- Fullscreen: "+X slag" med gröna cirklar
- 4 episka spellistor: Walk-Up Anthems, Golf Vibes, Pump Up, 19th Hole
- iOS install-prompt banner
- Stableford trippelkollad mot EGA/WHS

## [2026-04-14] Phase 10: PWA-optimering (@filip)
- Viewport tillåter zoom (maximumScale: 3)
- Safe areas för Dynamic Island/notch/home indicator
- Standalone-mode CSS
- Nya ikoner (HI 2026, rundad fyrkant, guld på svart)

## [2026-04-14] Phase 9: Notification center + ljud (@filip)
- 🔔 i status-baren med oläst-badge
- Dropdown med alla events (birdies, eagles, nollor)
- Web Audio API ljudeffekter (fungerar på silent mode):
  - Birdie: stigande 3-tons chime
  - Eagle: 5-tons fanfar
  - Nolla: sjunkande sawtooth
  - Chat: dubbel-pip
  - Score registrerad: bekräftelseton
- Ljud triggas vid egna scores + andras via realtime

## [2026-04-14] Phase 8: Fullscreen score-input (@filip)
- Hål-för-hål fullscreen-vy med STORA +/- knappar (64x64px)
- Par som default, klicka för att registrera
- Flyover-video inline per hål
- LD/NP/2x badges i fullscreen
- Alla motståndarnas score synligt
- Prev/Next hål-navigation
- "Starta runda"-knapp i scorekortet
- Spectator separerad från spelargrid

## [2026-04-14] Phase 7: Flyovers, chat delete/tag, spectator (@filip)
- 36 flyover-videos (18 per bana) streamade från CloudFront
- Autoplay muted i banguide-modal
- Radera egna chattmeddelanden (admin: alla)
- @-mention med autocomplete
- @-namn highlightas i guld
- Spectator-login (kan se + chatta, inte scora)

## [2026-04-14] Phase 6: Score UX, shoutouts, gamification (@filip)
- Score-input: par som default med +/- knappar
- Dubbla poäng (2×) visas visuellt hål 16-18
- Shoutouts triggas direkt (inte bara via realtime)
- Birdie = grön toast, Eagle = guld, Nolla = röd
- Auto-post till chatten
- Spotify deeplinks (öppnar appen direkt)
- 6 venue-bilder från Hooks hemsida i Supabase Storage
- 8 achievements: First Blood, Eagle Eye, Steady Eddie, Clean Sheet, Hot Hand, On Fire, No Blanks, Hål 19
- Favicon (guld H på svart)

## [2026-04-14] Phase 5: Banguide, roasts, chat-fix (@filip)
- Klicka hålnummer → modal med banguide + alla spelares resultat
- LiveCaddie-länk per hål
- 5-6 roasts per spelare, random rotation
- Chat: optimistisk uppdatering (syns direkt)
- fetchChat körs efter insert

## [2026-04-14] Phase 4: Spotify, streaks, specialhål (@filip)
- Dubbla poäng hål 16-18 i lagtävling (2× multiplier)
- Hot Hand: 3 birdies i rad = +2 bonus
- Cold Turkey: 3 nollor i rad = -1
- LD och NP-hål markerade per runda med badges
- Nästa tomma hål highlighted
- Motståndarnas progress under scorekortet
- Spotify: 3 låtar per spelare per dag (fre/lör/sön)
- Service Worker + PWA
- Pep talks, team lead/trail-indikator

## [2026-04-14] Phase 3: Spelarfoton, chat, bildupload (@filip)
- Riktiga spelarfoton från Supabase Storage
- Avatar-komponent genom hela appen
- Chat med bildupload (kamera + galleri)
- Roasts synliga i Info
- Walk-up music per spelare
- Leaderboard med rundfördelning
- Playing HCP visas (slope-justerat)

## [2026-04-14] Phase 2: Chat, admin, persistent login (@filip)
- Live chat med Supabase realtime
- Auto-post birdies/nollor till chatten
- Admin-mode: Filip kan scora för alla
- Persistent login (localStorage)
- PWA manifest + ikoner

## [2026-04-14] Phase 1: Grundapp (@filip)
- Next.js + Supabase + Vercel
- Login via spelarval
- 5 vyer: Leaderboard, Score, Lag, Chat, Info
- Live Stableford scoring med slope-justerat HCP
- Supabase realtime – alla ser uppdateringar live
- Shoutouts vid birdie+
- Roasts vid 0-poängare
- Full info: schema, tävlingar, regler
- Bandata: Skogsbanan (CR 70.1/S128) & Parkbanan (CR 70.8/S130)
- Alla 36 hål med par, hcp, meter, tips
