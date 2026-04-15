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
      { hole: 1, par: 5, hcp: 15, meters: 438, tip: 'Bred öppning men smalar av. Säkert spel lönar sig.' },
      { hole: 2, par: 4, hcp: 3, meters: 339, tip: 'Tredje svåraste. Börja bra eller börja gråta.' },
      { hole: 3, par: 4, hcp: 5, meters: 349, tip: 'Dogleg. Placering från tee avgör allt.' },
      { hole: 4, par: 3, hcp: 13, meters: 132, tip: '🎯 Kort par 3. Precision > kraft.' },
      { hole: 5, par: 5, hcp: 7, meters: 467, tip: 'Lång par 5. Eagle-chans om du vågar.' },
      { hole: 6, par: 4, hcp: 1, meters: 365, tip: '🏌️ SVÅRASTE HÅLET. Respektera det.' },
      { hole: 7, par: 3, hcp: 17, meters: 136, tip: 'Lättaste par 3. Här SKA du ta poäng.' },
      { hole: 8, par: 4, hcp: 11, meters: 292, tip: 'Kort par 4. Birdie-chans med bra drive.' },
      { hole: 9, par: 4, hcp: 9, meters: 345, tip: 'Svänger. Fairway-trä kan vara smart.' },
      { hole: 10, par: 4, hcp: 10, meters: 312, tip: 'Ny nio. Nollställ hjärnan, hämta en öl.' },
      { hole: 11, par: 4, hcp: 4, meters: 344, tip: 'Fjärde svåraste. Håll fairway.' },
      { hole: 12, par: 5, hcp: 12, meters: 423, tip: 'Nåbar i två om du hittar fairway.' },
      { hole: 13, par: 3, hcp: 14, meters: 126, tip: 'Kortaste hålet. Inga ursäkter.' },
      { hole: 14, par: 4, hcp: 18, meters: 307, tip: '😎 LÄTTASTE HÅLET. Gratis poäng.' },
      { hole: 15, par: 4, hcp: 8, meters: 339, tip: 'Vatten. Respektera vattnet.' },
      { hole: 16, par: 3, hcp: 16, meters: 157, tip: '⚡ DUBBLA POÄNG BÖRJAR HÄR.' },
      { hole: 17, par: 4, hcp: 2, meters: 329, tip: '⚡ Näst svåraste! Dubbla poäng.' },
      { hole: 18, par: 5, hcp: 6, meters: 458, tip: '⚡ AVSLUTAREN. Eagle = hjälte. Trippel = Daily Loser.' },
    ]
  },
  Parkbanan: {
    name: 'Parkbanan', par: 72, meters: 5698, cr: 70.8, slope: 130,
    vibe: 'Öppnare och längre. Power och mod belönas.',
    holes: [
      { hole: 1, par: 4, hcp: 9, meters: 322, tip: 'Uppvärmning. Hitta fairway.' },
      { hole: 2, par: 4, hcp: 15, meters: 337, tip: 'Generöst. Ta poäng här.' },
      { hole: 3, par: 3, hcp: 18, meters: 130, tip: '🎯 LÄTTASTE HÅLET. Ingen par = skam.' },
      { hole: 4, par: 5, hcp: 1, meters: 437, tip: '🏌️ SVÅRASTE HÅLET. Lång och elak.' },
      { hole: 5, par: 4, hcp: 5, meters: 321, tip: 'Kort par 4 men lurigt.' },
      { hole: 6, par: 3, hcp: 13, meters: 119, tip: 'Kortaste hålet. Wedge och bön.' },
      { hole: 7, par: 3, hcp: 17, meters: 141, tip: 'Tredje par 3 på raken! Sällsynt.' },
      { hole: 8, par: 4, hcp: 7, meters: 350, tip: 'Längre par 4. Klubbval avgör.' },
      { hole: 9, par: 4, hcp: 11, meters: 314, tip: 'Sista ut. Samla ihop dig.' },
      { hole: 10, par: 5, hcp: 3, meters: 498, tip: '🏌️ MONSTER. 498m. Slå långt eller gå hem.' },
      { hole: 11, par: 4, hcp: 12, meters: 362, tip: 'Sjöutsikt. Njut men fokusera.' },
      { hole: 12, par: 4, hcp: 8, meters: 344, tip: 'Bunkrar vaktar. Respektera dem.' },
      { hole: 13, par: 3, hcp: 14, meters: 142, tip: 'Par 3 vid vattnet. Vackert och lurigt.' },
      { hole: 14, par: 4, hcp: 4, meters: 320, tip: 'Fjärde svåraste. Precision.' },
      { hole: 15, par: 5, hcp: 16, meters: 435, tip: 'Nåbar par 5. Eagle-jakt möjlig.' },
      { hole: 16, par: 4, hcp: 6, meters: 324, tip: '⚡ DUBBLA POÄNG BÖRJAR HÄR.' },
      { hole: 17, par: 5, hcp: 2, meters: 452, tip: '⚡ Näst svåraste. Allt kan vända.' },
      { hole: 18, par: 4, hcp: 10, meters: 350, tip: '⚡ SISTA HÅLET. Ge allt. Sen öl.' },
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

// Shoutout messages
export function getShoutout(name, nick, pts) {
  const m3 = [
    `🐦 BIRDIE! ${nick} levererar!`, `🔥 ${nick} droppar en birdie!`,
    `🐦 ${name} med birdie! Ölen smakar bättre.`, `💪 BIRDIE för ${nick}!`,
    `🐦 ${nick} visar vägen!`, `🎯 Birdie av ${nick}! Ren klass.`,
  ]
  const m4 = [
    `🦅 EAGLE!! ${nick} är PÅ RIKTIGT!`, `🦅🦅 EAGLE! ${name} went full tour mode!`,
    `🤯 ${nick} med EAGLE! Är det ens lagligt?!`,
  ]
  const m5 = [
    `🏆🏆🏆 ALBATROSS!!! ${nick}!!! STÄNG APPEN!`,
    `💎 ALBATROSS av ${name}! Det blir inte bättre.`,
  ]
  if (pts >= 5) return m5[Math.floor(Math.random() * m5.length)]
  if (pts >= 4) return m4[Math.floor(Math.random() * m4.length)]
  if (pts >= 3) return m3[Math.floor(Math.random() * m3.length)]
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
    'Lägst hcp, störst press. Alla väntar på att du ska bära laget.',
    'Tar golfen på allvar. Tar ölen på ännu mer allvar.',
    '7.5 i hcp och fortfarande inte nöjd. Typiskt.',
    'Spelar som en pro. Klagar som en 36-handikappare.',
    'Captain? Mer som en överambitiös lagledare med controlfreak-tendenser.',
    'Bygger appar för att tracka score istället för att träna på sin putt.',
  ],
  matthis: [
    'Spelar bäst med en drink i handen. Problemet? Han har alltid en drink.',
    'G&T på banan, G&T vid middagen, G&T i bastun. Mannen är konsekvent.',
    'Har aldrig sett en par-3 han inte kunde 3-putta.',
    'Walk-up music: Mr. Brightside. Matchar hans optimism efter en 8:a.',
    'Swingen ser bra ut. Resultatet... nja.',
    'Beställer dubbel G&T. Spelar dubbelbogey. Allt i balans.',
  ],
  magnus: [
    'Fairwayn är hans beach – mest för att bollen aldrig landar där.',
    'Ray-Bans och strandvibbar. Ser cool ut i OB.',
    'Beach Boy? Mer som Bunker Boy.',
    'Spelar golf som han surfar – med mer stil än precision.',
    'Har aldrig mött en hazard han inte kunnat hitta.',
    'Solglasögon på hela rundan. Kanske för att slippa se scorekortet.',
  ],
  marcus: [
    'Öppnar en öl "bara för att smaka" och vaknar tre dagar senare i Båstad.',
    'Har aldrig sagt nej till en öl. Inte en enda gång. I hela sitt liv.',
    'Bäst i laget på att läsa greener. Sämst på att läsa sin egen ölgräns.',
    'Första ölen tar 5 minuter. Sen finns ingen broms.',
    '11.7 i hcp men 54 i ölsinne. Farlig kombination.',
    'Dricker öl som andra dricker vatten. Spelar golf som andra kör go-kart.',
  ],
  fredrik: [
    'Noll känslor på greenen. Tyvärr gäller det även puttarna.',
    'Iceman. Kall som is, lugn som en sten, seg som en trippelbogey.',
    'Ser ut som han ska på jobblunch. Spelar som det också.',
    'Har aldrig visat en känsla på golfbanan. Eller någon annanstans.',
    'Kan göra en 8:a utan att ändra ansiktsuttryck.',
    'Iceman? Mer som Ice Age – allt tar väldigt lång tid.',
  ],
  martin: [
    '40 i hcp, max i självförtroende. Behöver varje spelslag han kan få.',
    'The Rookie. Spelar som att han upptäckte golf förra veckan.',
    'Får spelslag på varje hål – och behöver vartenda ett.',
    'Hans handicap är högre än hans ålder. Imponerande på fel sätt.',
    'Eye of the Tiger som walk-up. Mer som Eye of the Bogey.',
    'Martin spelar inte mot banan. Banan spelar mot Martin.',
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
