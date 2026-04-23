// DOUCHE INVITATIONAL ONLY 2026 – Course & Tournament Data

// Spotify – all track IDs verified 2026-04-14
function sp(id, song, artist, day) {
  return { day, song, artist, url: `https://open.spotify.com/track/${id}` }
}
export const walkupMusic = {
  filip: [sp('57bgtoPSgt236HzfBOd8kj','Thunderstruck','AC/DC','Fredag'), sp('08mG3Y1vljYA6bvDt4Wqkj','Back in Black','AC/DC','Lördag'), sp('2zYzyRzz6pRmhPzyfMEC8s','Highway to Hell','AC/DC','Söndag')],
  matthis: [sp('003vvx7Niy0yvhvHt4a68B','Mr. Brightside','The Killers','Fredag'), sp('7HGTkn2aX7MNdKs7nV2xBt','Somebody Told Me','The Killers','Lördag'), sp('1Ov37jtRQ2YNAe8HzfczkL','Human','The Killers','Söndag')],
  magnus: [sp('2EPr9Wx7e1cpGEbNAtuN7x',"Surfin' U.S.A.",'Beach Boys','Fredag'), sp('5qHYXcVvc9xsFB2uH7GpMN','Kokomo','Beach Boys','Lördag'), sp('5t9KYe0Fhd5cW6UYT4qP8f','Good Vibrations','Beach Boys','Söndag')],
  marcus: [sp('0Puj4YlTm6xNzDDADXHMI9','Sabotage','Beastie Boys','Fredag'), sp('5NLuC70kZQv8q34QyQa1DP','Fight For Your Right','Beastie Boys','Lördag'), sp('5fpizYGbi5IQoEraj6FP0R','Intergalactic','Beastie Boys','Söndag')],
  fredrik: [sp('3XVozq1aeqsJwpXrEZrDJ9','Ice Ice Baby','Vanilla Ice','Fredag'), sp('2fuCquhmrzHpu5xcA1ci9x','Under Pressure','Queen & Bowie','Lördag'), sp('0u4gPwmm1Ymk38iQhgBbVC','Cold as Ice','Foreigner','Söndag')],
  martin: [sp('2KH16WveTQWT6KOG9Rg6e2','Eye of the Tiger','Survivor','Fredag'), sp('4bHsxqR3GMrXTxEPLuK5ue',"Don't Stop Believin'",'Journey','Lördag'), sp('7iXYRR70wewzVYzWScm99j','Gonna Fly Now','Bill Conti','Söndag')],
}

// Epic tournament playlists
export const playlists = [
  { name: '⛳ Walk-Up Anthems', desc: 'Alla walk-up låtar', url: 'https://open.spotify.com/playlist/37i9dQZF1DX6VdMW310YC7' },
  { name: '🏌️ Golf Vibes', desc: 'Chill beats för fairway', url: 'https://open.spotify.com/playlist/37i9dQZF1DX4SBhb3fqCJd' },
  { name: '🔥 Pump Up', desc: 'Innan första tee', url: 'https://open.spotify.com/playlist/37i9dQZF1DX4eRPd9frC1m' },
  { name: '🍺 19th Hole', desc: 'After round, vid baren', url: 'https://open.spotify.com/playlist/37i9dQZF1DX3rxVfibe1L0' },
]

// Special holes per round
export const specialHoles = {
  1: { ld: 6, np: 4, doubleStart: 16 },   // R1 Skog: LD hål 6 (svåraste), NP hål 4 (par 3)
  2: { ld: 10, np: 3, doubleStart: 16 },   // R2 Park: LD hål 10 (498m monster), NP hål 3 (lättaste)
  3: { ld: 1, np: 7, doubleStart: 16 },    // R3 Skog: LD hål 1 (öppning par 5), NP hål 7 (par 3)
  4: { ld: 17, np: 6, doubleStart: 16 },   // R4 Park: LD hål 17 (par 5), NP hål 6 (119m)
}

export const courses = {
  Skogsbanan: {
    name: 'Skogsbanan', par: 72, meters: 5658, cr: 70.1, slope: 128,
    vibe: 'Tight, skogsinklädd och oförlåtande.',
    holes: [
      { hole: 1, par: 5, hcp: 15, meters: 438, tip: '438m par 5 öppningshål. Rikta driver mot fairways mitt – den breddar sig 200m ut sen smalar av mellan tallarna. Säkert lay-up till 100m. Martin: ta en extra boll ur fickan nu, du kommer behöva den.' },
      { hole: 2, par: 4, hcp: 3, meters: 339, tip: 'Tredje svåraste på banan. 339m rakt men greenen är upphöjd och bunkerskyddad. Välj klubba som ger dig 130-150m in. Bogey här är helt ok – det vet du bara inte ännu, Fredrik.' },
      { hole: 3, par: 4, hcp: 5, meters: 349, tip: 'Dogleg vänster. Frestande att cutta men träden straffar. Sikta höger fairwaykant med hybrid/3-trä och spela in med kort järn. Magnus cutade hörnet en gång. Bollen hittades aldrig.' },
      { hole: 4, par: 3, hcp: 13, meters: 132, tip: '🎯 NP-hål. 132m – full PW eller kort 9:a beroende på vind. Greenen är liten men öppen framtill, rulla upp den. Matthis tar 8-järn, hamnar 2m från pin – och 3-puttar ändå. Tradition.' },
      { hole: 5, par: 5, hcp: 7, meters: 467, tip: '467m par 5 med vatten i spel på andrslaget. Lay-up till 80-100m före hindret eller gå för greenen i två med lång trä. Risken är värd det om du ligger bra – fega ut annars. Marcus pratar alltid om att gå för det. Han fegar alltid.' },
      { hole: 6, par: 4, hcp: 1, meters: 365, tip: '🏌️ SVÅRASTE HÅLET + LD. 365m genom skog med trångt landningsområde. Driver bara om du litar på din linje – annars 3-trä mitt i gatan och lång järn in. Fairway-bunkrar vänster. Respektera det här hålet. Eller bli Daily Loser.' },
      { hole: 7, par: 3, hcp: 17, meters: 136, tip: '136m näst lättaste. Pliktområde höger (rött, oändligt). Sikta vänster halvan av green. Pitching wedge räcker. Om du nollar här ska du skämmas i bastun ikväll. Martin: det gäller särskilt dig.' },
      { hole: 8, par: 4, hcp: 11, meters: 292, tip: '292m kort par 4. Birdie-hål! Driver sätter dig på 50-60m. Carry över rough till fairway – undvik bunkern höger om green. Filip driver green ibland. Missar putten alltid. Bygger en app istället för att träna putt.' },
      { hole: 9, par: 4, hcp: 9, meters: 345, tip: 'Dogleg höger genom skogen. Fairway-trä från tee ger bästa vinkeln in. Greenen lutar bakåt-vänster, spela under hålet. Kiosk vid halvvägs – ta en korv och nollställ hjärnan. Sista chansen innan back nine.' },
      { hole: 10, par: 4, hcp: 10, meters: 312, tip: '312m med rött pliktområde hela vänster sida (oändligt per lokala regler). Håll höger från tee. Kort järn in till tvådelad green. Ny nio, nytt liv – glöm allt du just gjorde. Speciellt du, Fredrik.' },
      { hole: 11, par: 4, hcp: 4, meters: 344, tip: 'Fjärde svåraste. Skog båda sidor, trångt som Martins chans att vinna Le Douche. Driv rakt – miss höger/vänster = skog och plikt. Greenen är smal – kortsidesmiss är bättre än långt.' },
      { hole: 12, par: 5, hcp: 12, meters: 423, tip: '423m par 5. Pliktområde mellan hål 12 och 7 (rött). Två raka slag mitt i fairway sen wedge in. Nåbar i två för Filip/Marcus, men risky med vatten. Magnus brukar vara i skogen och leta medan alla andra puttar.' },
      { hole: 13, par: 3, hcp: 14, meters: 126, tip: '126m – KORTASTE HÅLET. Gap wedge eller PW. Green skyddad av bunkrar framvänster. Rulla en låg boll in bakifrån om vinden är emot. Om du inte får minst 2 poäng här borde du ge bort dina klubbor.' },
      { hole: 14, par: 4, hcp: 18, meters: 307, tip: '😎 LÄTTASTE HÅLET. 307m rakt, brett, inga hinder. Driver + wedge = birdie-chans. Om du bogar här bjuder du öl åt alla. Det är skrivet i DIO-reglementet (§14, tillägg B).' },
      { hole: 15, par: 4, hcp: 8, meters: 339, tip: '339m med vatten framför green. Klubba som ger dig 100m lay-up FÖRE vattnet, sen full wedge. Gå INTE för green i två – vattnet äter bollar. Marcus: "Det är bara en liten bäck." Också Marcus: *plask*. Varje. Gång.' },
      { hole: 16, par: 3, hcp: 16, meters: 157, tip: '⚡ DUBBLA POÄNG STARTAR. 157m par 3 – 7 eller 6-järn. Greenen är stor, sikta mitten och ta dina 2 poäng. Varje birdie = 6p. Varje nolla = dubbel skam. Andas. Slå.' },
      { hole: 17, par: 4, hcp: 2, meters: 329, tip: '⚡ NÄST SVÅRASTE. 329m men trång landing med skog och bunkrar. 3-trä från tee för precision, lämna dig 140m in. Greenen lutar – spela under hålet. Händerna skakar. Matthis tar en G&T för nerverna.' },
      { hole: 18, par: 5, hcp: 6, meters: 458, tip: '⚡ AVSLUTAREN. 458m par 5. Gå för greenen i två bara om du ligger bra i tävlingen – annars smart lay-up och birdie-putt. Eagle = legend. Birdie = hjälte. Par = ok. Bogey = tyst middag. Trippel = du ÄR Daily Loser.' },
    ]
  },
  Parkbanan: {
    name: 'Parkbanan', par: 72, meters: 5698, cr: 70.8, slope: 130,
    vibe: 'Öppnare och längre. Power och mod belönas.',
    holes: [
      { hole: 1, par: 4, hcp: 9, meters: 322, tip: '322m rakt öppningshål. Bred fairway, inget vatten. Driver eller 3-trä mitt i gatan, kort järn in. Uppvärmningshål – ta par och gå vidare. Om du missar fairway här har du antingen bakfylla eller heter Martin.' },
      { hole: 2, par: 4, hcp: 15, meters: 337, tip: '337m, fjärde lättaste. Parallellt fairway utan stora hinder. Full driver + PW in. Poäng-hål – birdie är realistiskt. Den som nollar här bär allas väskor till hål 3.' },
      { hole: 3, par: 3, hcp: 18, meters: 130, tip: '🎯 NP-hål. LÄTTASTE HÅLET. 130m – pitching wedge rakt på flaggan. Green öppen framtill, spela rullboll vid motvind. Nolla här = runda i baren. Ingen diskussion.' },
      { hole: 4, par: 5, hcp: 1, meters: 437, tip: '🏌️ SVÅRASTE HÅLET. 437m med vatten och OB. Två raka slag mitt i fairway, lay-up till 100m och wedge in. Jaga INTE eagle – par är bra. Filip: "Jag har koll." Narrator: han hade inte koll.' },
      { hole: 5, par: 4, hcp: 5, meters: 321, tip: '321m kort par 4 men bunkrar runt green. Driver ger dig 80m kvar – en halvswing wedge. Undvik greensidebunkern höger, den är djup. Kort men lurigt. Typ som Matthis efter tredje G&T.' },
      { hole: 6, par: 3, hcp: 13, meters: 119, tip: '119m – KORTASTE HÅLET PÅ HOOKS. Sand wedge eller gap wedge, max. Green skyddad av bunker höger. Spela mot vänster halva. Fredrik tar full swing 9-järn för säkerhets skull. Alla: *suck*.' },
      { hole: 7, par: 3, hcp: 17, meters: 141, tip: '141m – tredje par 3 på fyra hål. PW eller 9-järn. Inget vatten, inga träd, bara green och bunker. Parkbanans "andningshål". Magnus har tappat tre bollar hittills. Det är först hål 7.' },
      { hole: 8, par: 4, hcp: 7, meters: 350, tip: '350m dogleg med Hokasjön i bakgrunden. Driver rakt, undvik bunkrarna i doglegkröken. Andra in med 7-8 järn till upphöjd green. Här separeras de som kan dribbla från de som hoppas – Martin hoppas.' },
      { hole: 9, par: 4, hcp: 11, meters: 314, tip: '314m sista före svängen. Rakt och ärligt. Använd klubban som ger dig fairway, sen 9-järn eller PW in. Smart = par, girig = trouble. Marcus kör driver i buskarna och chippar en räddning. Legend eller idiot. Linjen är tunnare än han tror.' },
      { hole: 10, par: 5, hcp: 3, meters: 498, tip: '🏌️ 498m – LÄNGSTA HÅLET. Monster par 5 utmed Hokasjön med vatten hela vänster sida. Tre raka slag mittfairway. Försök INTE cutta sjön. Lay-up till 120m och wedge in. Martin behöver fem slag. Och ett mirakel.' },
      { hole: 11, par: 4, hcp: 12, meters: 362, tip: '362m vid sjön. Vackrast på banan – utsikt över Hokasjön som kan distrahera. Driver rakt, undvik vattnet vänster. Green vid sjökanten. Njut av vyn men fokusera. Magnus toppar sin drive 60m. Stämningen dör.' },
      { hole: 12, par: 4, hcp: 8, meters: 344, tip: '344m med strategiska bunkrar runt green. Placera driven på höger halva av fairway för bästa vinkel in. Greenside bunker vänster-fram är djup – hellre lång än kort. Matthis landar ALLTID i bunker här. Det är hans signaturdrag.' },
      { hole: 13, par: 3, hcp: 14, meters: 142, tip: '142m par 3 vid vattnet. Vind från sjön gör klubbvalet knepigt – tag en klubba mer vid motvind. Green lutar mot sjön, spela upper halvan. Vackert och farligt, precis som en fredagskväll med DIO-gänget.' },
      { hole: 14, par: 4, hcp: 4, meters: 320, tip: '320m fjärde svåraste. Smalt fairway, OB höger. Precisionsdriv med 3-trä eller hybrid. Andra in med kort järn till liten, bunkrad green. Marcus pratar om sin "strategi" här. Strategin: slå hårt och be till golfgudarna.' },
      { hole: 15, par: 5, hcp: 16, meters: 435, tip: '435m nåbar par 5. Öppet fairway, inga vattenhinder. Eagle-jakt realistisk för låga hcp – gå för green i två med lång trä om du ligger bra. Filip drömmer om eagle. Matthis drömmer om par. Martin drömmer om att hitta sin boll.' },
      { hole: 16, par: 4, hcp: 6, meters: 324, tip: '⚡ DUBBLA POÄNG. 324m par 4 vid sjön. Vatten vänster hela vägen. Sikta mitt-höger fairway med driver. Andra in med wedge. Säkert spel = säkra poäng. Hjärtat pumpar. Svetten rinner. Fredrik: "Jag är lugn." Fredrik ljuger.' },
      { hole: 17, par: 5, hcp: 2, meters: 452, tip: '⚡ LD-hål + näst svåraste. 452m par 5 med vatten och bunkrar. Lång drive ger eagle-chans men vattnet lurar. Tre kontrollerade slag > två desperata. Det här hålet har avgjort turneringar. Det här hålet har förstört vänskaper.' },
      { hole: 18, par: 4, hcp: 10, meters: 350, tip: '⚡ SISTA DRAGET. 350m tillbaka mot klubbhuset. Driver mitt i fairway, 8-järn eller 9-järn in. Green synlig från tee – publiken (läs: de som redan druckit sin första öl) tittar på. Den som birdiar blir legend. Den som nollar köper champagnen.' },
    ]
  }
}

// Playing HCP (slope adjusted)
export function getPlayingHcp(hcpIndex, slope) {
  return Math.round(hcpIndex * (slope / 113))
}

// Stableford calculation
export function calcStableford(strokes, par, playingHcp, holeHcp) {
  if (!strokes || strokes <= 0) return null
  const given = getStrokesGiven(playingHcp, holeHcp)
  const net = strokes - given
  const diff = net - par
  if (diff >= 2) return 0
  if (diff === 1) return 1
  if (diff === 0) return 2
  if (diff === -1) return 3
  if (diff === -2) return 4
  if (diff <= -3) return 5
  return 0
}

// How many extra strokes on this hole
export function getStrokesGiven(playingHcp, holeHcp) {
  const extra = Math.floor(playingHcp / 18)
  const rem = playingHcp % 18
  return extra + (holeHcp <= rem ? 1 : 0)
}

// Check for streaks in a round's scores (ordered by hole)
export function checkStreaks(holeScores) {
  // holeScores = [{hole, pts}, ...] sorted by hole
  const result = { hotHand: 0, coldTurkey: 0 }
  let birdieStreak = 0, zeroStreak = 0
  for (const s of holeScores) {
    if (s.pts >= 3) { birdieStreak++; zeroStreak = 0 }
    else if (s.pts === 0) { zeroStreak++; birdieStreak = 0 }
    else { birdieStreak = 0; zeroStreak = 0 }
    if (birdieStreak >= 3) result.hotHand++
    if (zeroStreak >= 3) result.coldTurkey++
  }
  return result // hotHand * 2 bonus, coldTurkey * -1 penalty
}

// Shoutout messages based on REAL birdie/eagle (strokes vs par), NOT stableford!
// A birdie is ALWAYS 1 under par, regardless of HCP or extra strokes.
export function getShoutout(name, nick, strokes, par) {
  if (!strokes || !par) return null
  const diff = strokes - par  // negative = under par
  const m_birdie = [
    `🐦 BIRDIE! ${nick} levererar!`, `🔥 ${nick} droppar en birdie!`,
    `🐦 ${name} med birdie! Ölen smakar bättre.`, `💪 BIRDIE för ${nick}!`,
    `🐦 ${nick} visar vägen!`, `🎯 Birdie av ${nick}! Ren klass.`,
  ]
  const m_eagle = [
    `🦅 EAGLE!! ${nick} är PÅ RIKTIGT!`, `🦅🦅 EAGLE! ${name} went full tour mode!`,
    `🤯 ${nick} med EAGLE! Är det ens lagligt?!`,
  ]
  const m_albatross = [
    `🏆🏆🏆 ALBATROSS!!! ${nick}!!! STÄNG APPEN!`,
    `💎 ALBATROSS av ${name}! Det blir inte bättre.`,
  ]
  const m_hio = [
    `⛳✨ HOLE-IN-ONE! ${nick}! LEGENDARY!`,
    `🎯🎯🎯 ACE av ${name}! Hela klubben bjuds på öl!`,
  ]
  // Special: hole-in-one on par 3 trumps everything
  if (strokes === 1) return m_hio[Math.floor(Math.random() * m_hio.length)]
  if (diff <= -3) return m_albatross[Math.floor(Math.random() * m_albatross.length)]
  if (diff === -2) return m_eagle[Math.floor(Math.random() * m_eagle.length)]
  if (diff === -1) return m_birdie[Math.floor(Math.random() * m_birdie.length)]
  return null
}

export function getZeroRoast(nick) {
  const r = [
    `💀 ${nick} tar en nolla. Nollpoängartrofén kallar.`,
    `🕳️ ${nick} med 0 poäng. Hålet vann.`,
    `😬 0p för ${nick}. Nästa hål kanske...`,
    `🍺 ${nick} behöver en öl efter den där.`,
    `📉 ${nick} i fritt fall.`,
    `🪦 RIP ${nick}s scorecard.`,
  ]
  return r[Math.floor(Math.random() * r.length)]
}

// Pepp / mood messages
export const pepTalks = [
  "Ingen har vunnit Le Douche de Golf genom att spela safe.",
  "Öl nummer 3 har aldrig förbättrat någons swing. Men den har förbättrat attityden.",
  "Du spelar inte mot banan. Du spelar mot dig själv. Och dig själv drack för mycket igår.",
  "Varje runda är en ny chans. Varje hål är en ny chans. Varje öl är... ja, du fattar.",
  "Steady Eddie vinner turneringar. Crazy Eddie vinner Daily Loser.",
  "Kom ihåg: Martin har 40 i hcp. Du har inga ursäkter.",
  "Det enda som är värre än en trippelbogey är att berätta om den vid middagen.",
  "72 hål. Det är en maraton, inte en sprint. Drick vatten. Skoja, drick öl.",
]


// Banguide URLs (LiveCaddie)
export const guideUrls = {
  Skogsbanan: 'https://courses.livecaddie.com/course-graphics.php?course=209',
  Parkbanan: 'https://courses.livecaddie.com/course-graphics.php?course=208',
}

// Flyover videos from CloudFront (LiveCaddie)
const CF = 'https://d3l9itmr3g1hfy.cloudfront.net'
export const flyovers = {
  Skogsbanan: { 1:`${CF}/dc8dd628-3bcf-11f0-8d30-020b6d3bcef9`,2:`${CF}/e21a18d9-3bcf-11f0-8d30-020b6d3bcef9`,3:`${CF}/e8c4ab60-3bcf-11f0-8d30-020b6d3bcef9`,4:`${CF}/edf9bbfb-3bcf-11f0-8d30-020b6d3bcef9`,5:`${CF}/f88efa3a-3bcf-11f0-8d30-020b6d3bcef9`,6:`${CF}/062d8714-3bd0-11f0-8d30-020b6d3bcef9`,7:`${CF}/0fa68456-3bd0-11f0-8d30-020b6d3bcef9`,8:`${CF}/17fc5928-3bd0-11f0-8d30-020b6d3bcef9`,9:`${CF}/1f405e98-3bd0-11f0-8d30-020b6d3bcef9`,10:`${CF}/2752fae1-3bd0-11f0-8d30-020b6d3bcef9`,11:`${CF}/2da3c6c3-3bd0-11f0-8d30-020b6d3bcef9`,12:`${CF}/34e472d3-3bd0-11f0-8d30-020b6d3bcef9`,13:`${CF}/38e0fed4-3bd0-11f0-8d30-020b6d3bcef9`,14:`${CF}/3f2a6267-3bd0-11f0-8d30-020b6d3bcef9`,15:`${CF}/45935925-3bd0-11f0-8d30-020b6d3bcef9`,16:`${CF}/4a1bea31-3bd0-11f0-8d30-020b6d3bcef9`,17:`${CF}/50aae72a-3bd0-11f0-8d30-020b6d3bcef9`,18:`${CF}/5902d1bd-3bd0-11f0-8d30-020b6d3bcef9` },
  Parkbanan: { 1:`${CF}/31699eb3-3bce-11f0-8d30-020b6d3bcef9`,2:`${CF}/38612c2f-3bce-11f0-8d30-020b6d3bcef9`,3:`${CF}/3c5d0220-3bce-11f0-8d30-020b6d3bcef9`,4:`${CF}/429ef938-3bce-11f0-8d30-020b6d3bcef9`,5:`${CF}/481f1b4b-3bce-11f0-8d30-020b6d3bcef9`,6:`${CF}/4bbac7ba-3bce-11f0-8d30-020b6d3bcef9`,7:`${CF}/501bf600-3bce-11f0-8d30-020b6d3bcef9`,8:`${CF}/547c3018-3bce-11f0-8d30-020b6d3bcef9`,9:`${CF}/59887986-3bce-11f0-8d30-020b6d3bcef9`,10:`${CF}/602980d9-3bce-11f0-8d30-020b6d3bcef9`,11:`${CF}/65627803-3bce-11f0-8d30-020b6d3bcef9`,12:`${CF}/6bab7b45-3bce-11f0-8d30-020b6d3bcef9`,13:`${CF}/6e715297-3bce-11f0-8d30-020b6d3bcef9`,14:`${CF}/72cfddca-3bce-11f0-8d30-020b6d3bcef9`,15:`${CF}/7a40292a-3bce-11f0-8d30-020b6d3bcef9`,16:`${CF}/802cadaa-3bce-11f0-8d30-020b6d3bcef9`,17:`${CF}/874a567a-3bce-11f0-8d30-020b6d3bcef9`,18:`${CF}/8e130c6e-3bce-11f0-8d30-020b6d3bcef9` },
}

// Rotating roasts per player (random each time)
export const playerRoasts = {
  filip: [
    'ADHD:n märks redan på första tee. Regler? Aldrig hört talas om.',
    'Slår gärna rakt men inte så ofta. En lyckad thai-spinner är bättre än par i hans värld.',
    'Slår längst i gänget och när allt stämmer är han svårslagen. Allt stämmer ungefär vart tredje år.',
    'Bygger en app istället för att träna putt. Har nu en AI-caddie som ger honom råd han ändå inte lyssnar på.',
    'Driver green på 8:an ibland. Treputtar varje gång. Prioriteringar.',
    'Har aldrig läst en lokal regel i sitt liv. Droppar var han vill, spelar fel boll, och vinner ändå ibland.',
    'Mannen som tog med sig en laptoptill driving rangen. "Jag fixar bara en grej snabbt."',
    'Hans swing ser ut som en olycka i slow motion. Bollen vet dock inte det.',
  ],
  matthis: [
    'Ett under att han klarar sig i livet med färre kromosomer. Ex-säljare som tar sig själv på tok för stort allvar.',
    'Har lagt hundratals timmar på golfträning. Trist att det inte hjälper ett skit.',
    'Den högst värderade deltagaren – enligt sig själv. Klart sämst – enligt alla andra.',
    'Utan Matthis ingen mening med livet. Och med Matthis ingen mening med golfen.',
    'Levererar alltid när det gäller. Tragiskt nog gäller det aldrig på golfbanan.',
    'G&T – Gin & Trippelbogey. Dricker det ena, spelar det andra. Konsekvent i alla fall.',
    'Har inget jobb, ingen golf-game, men världens bästa självförtroende. Imponerande egentligen.',
    'Matthis pep talk till sig själv varar längre än hans drives. Och det säger en del.',
  ],
  marcus: [
    'Tävlingsledaren med Excel i blodet och regler i ryggraden. Fram till första ölen – sen lämnar tävlingsdjävulen snabbare än Martin hittar OB.',
    'Den säkraste golfaren i gänget. Missar sällan stort. Lika tråkigt som det låter.',
    'Har aldrig sagt nej till en öl. Inte en enda gång. I hela sitt liv. Det är hans verkliga handicap.',
    'Första ölen tar 5 minuter. Sen finns ingen broms. HCP 11.7 i golf, 54 i ölsinne.',
    'Öppnar en öl "bara för att smaka" och vaknar tre dagar senare i Båstad med en sombrero.',
    'The Blazer – han blazer igenom öl-förrådet snabbare än han blazer igenom en runda.',
    'Marcus golfstrategi: bogey-free golf. Marcus kvällsstrategi: minne-free kväll.',
    'Dricker öl som andra dricker vatten. Spelar golf som andra kör go-kart. Kraschar i bunkern.',
  ],
  fredrik: [
    'Äldst i gänget men det märks inte i bunkern – där stannar han några extra slag likt en treåring på stranden.',
    'Åldermannen uppskattas av alla och är alltid först till biran. Sist från bunkern dock.',
    'Iceman – kall som is, lugn som en sten, seg som en trippelbogey. Noll känslor. Noll puttskänsla.',
    'Kan göra en 8:a utan att ändra ansiktsuttryck. Imponerande. Eller deprimerande.',
    'Ser ut som han ska på jobblunch 1997. Spelar som det också.',
    'Fredrik har aldrig visat en känsla på golfbanan. Eller hemma. Eller någonstans. Någonsin.',
    'Iceman? Mer som Ice Age – allt tar väldigt lång tid. Och inget smälter.',
    'Hans pre-shot routine är längre än Martins drive. Och den är inte lång.',
  ],
  magnus: [
    'Duktig som få på mycket men kanske inte på golf. Tar hellre en bärs än slår en rak 6:a.',
    'Kan bomba sin hybrid lika bra som DeChambeau slår sin 8:a. Resten av spelet? Tja.',
    'Beach Boy – mer strandkänsla än golfkänsla. Tyvärr finns det ingen strand i Småland.',
    'Magnus spelar inte golf. Golf spelar Magnus. Och golf vinner. Varje gång.',
    'Bäst i laget på att hitta bunkrar. Ingen har bett honom om det. Han gör det ändå.',
    'Tar en öl mitt på rundan som om det vore Gatorade. Och spelar också som om det vore Gatorade.',
    'Hans short game är lika kort som hans tålamod. Båda slutar efter andra putten.',
    'Magnus handicap sjunker aldrig. Hans ölförråd dock. Korrelation? Absolut.',
  ],
  martin: [
    'Lillebror i dubbel bemärkelse – kämpar tappert i bakvattnet och hoppas gå runt 18 hål utan att märkas.',
    'På hål 19 finns goda chanser för lika dålig humor som golf. Det ena uppskattas mer. Spoiler: det är inte golfen.',
    '40 i hcp, max i självförtroende. Klyftan är imponerande.',
    'The Rookie – spelar som att han upptäckte golf förra veckan. Det stämmer ungefär.',
    'Eye of the Tiger som walk-up. Mer som Eye of the Bogey i verkligheten. Rocky förlorade också ibland.',
    'Får spelslag på varje hål och behöver vartenda ett. Plus lite till.',
    'Martin spelar inte mot banan. Banan spelar mot Martin. Banan leder med 40 slag.',
    'Hans handicap är högre än hans ålder. Det är faktiskt svårt att uppnå.',
  ],
}

export function getRandomRoast(playerKey) {
  const roasts = playerRoasts[playerKey]
  if (!roasts) return ''
  return roasts[Math.floor(Math.random() * roasts.length)]
}


// Venue images from Hooks Herrgård
const SB = 'https://swagnjpgddfakncovglo.supabase.co/storage/v1/object/public/inv-images'
export const venueImages = [
  { url: `${SB}/venue/golf-fairway.jpg`, caption: 'Fairway, Hooks GK' },
  { url: `${SB}/venue/golf-green.jpg`, caption: 'Green med sjöutsikt' },
  { url: `${SB}/venue/golf-course.jpg`, caption: 'Hooks Golfklubb' },
  { url: `${SB}/venue/golf-tee.jpg`, caption: 'Tee-shot' },
  { url: `${SB}/venue/herrgard.jpg`, caption: 'Hooks Herrgård' },
  { url: `${SB}/venue/spa.jpg`, caption: 'Hooks Spa' },
]

// Gamification - achievements
export const achievements = [
  { id: 'first_birdie', icon: '🐦', title: 'First Blood', desc: 'Gör din första birdie', check: (scores) => scores.some(s => s.stableford_points >= 3) },
  { id: 'eagle', icon: '🦅', title: 'Eagle Eye', desc: 'Gör en eagle', check: (scores) => scores.some(s => s.stableford_points >= 4) },
  { id: 'par_streak_5', icon: '🎯', title: 'Steady Eddie', desc: '5 par (2p) i rad', check: (scores) => { let streak = 0; for (const s of scores) { if (s.stableford_points === 2) { streak++; if (streak >= 5) return true } else streak = 0 } return false } },
  { id: 'no_zeros_9', icon: '💪', title: 'Clean Sheet', desc: '9 hål utan en enda nolla', check: (scores) => { const sorted = [...scores].sort((a,b) => a.hole - b.hole); let clean = 0; for (const s of sorted) { if (s.stableford_points > 0) { clean++; if (clean >= 9) return true } else clean = 0 } return false } },
  { id: 'hot_hand', icon: '🔥', title: 'Hot Hand', desc: '3 birdies i rad', check: (scores) => { let streak = 0; for (const s of scores) { if (s.stableford_points >= 3) { streak++; if (streak >= 3) return true } else streak = 0 } return false } },
  { id: 'round_36', icon: '⭐', title: 'On Fire', desc: '36+ poäng i en runda', check: (scores, rounds) => { /* checked per round in component */ return false } },
  { id: 'all_points', icon: '🏆', title: 'No Blanks', desc: 'Poäng på alla 18 hål i en runda', check: (scores) => scores.filter(s => s.stableford_points > 0 && s.strokes > 0).length >= 18 },
  { id: 'beer_o_clock', icon: '🍺', title: 'Hål 19', desc: 'Avsluta en runda (18 hål spelade)', check: (scores) => scores.filter(s => s.strokes > 0).length >= 18 },
]
