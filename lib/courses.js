// HOOKS HERRGÅRD INVITATIONAL 2026 – Course & Tournament Data

// Spotify track URIs for walk-up music (random daily picks)
export const walkupMusic = {
  filip: [
    { day: 'Fredag', song: 'Thunderstruck', artist: 'AC/DC', url: 'https://open.spotify.com/track/57bgtoPSgt236HzfBOd8kj' },
    { day: 'Lördag', song: 'Back in Black', artist: 'AC/DC', url: 'https://open.spotify.com/track/08mG3Y1vljYA6bvDt4Wqkj' },
    { day: 'Söndag', song: 'Highway to Hell', artist: 'AC/DC', url: 'https://open.spotify.com/track/2zYzyRzz6pRmhPzyfMEC8s' },
  ],
  matthis: [
    { day: 'Fredag', song: 'Mr. Brightside', artist: 'The Killers', url: 'https://open.spotify.com/track/003vvx7Niy0yvhvHt4a68B' },
    { day: 'Lördag', song: 'Somebody Told Me', artist: 'The Killers', url: 'https://open.spotify.com/track/4KV2M0cqETzpBEfCTsM7kK' },
    { day: 'Söndag', song: 'Human', artist: 'The Killers', url: 'https://open.spotify.com/track/1Ov37jtRQ2YNAe8HzfczkL' },
  ],
  magnus: [
    { day: 'Fredag', song: "Surfin' U.S.A.", artist: 'Beach Boys', url: 'https://open.spotify.com/track/26gFMjSEBBJDFBLYqVLHul' },
    { day: 'Lördag', song: 'Kokomo', artist: 'Beach Boys', url: 'https://open.spotify.com/track/3EsUBG7lHTJgan460ypJbMJ' },
    { day: 'Söndag', song: 'Good Vibrations', artist: 'Beach Boys', url: 'https://open.spotify.com/track/5t9KYe0Fhd5cW6UYT4qP8f' },
  ],
  marcus: [
    { day: 'Fredag', song: 'Sabotage', artist: 'Beastie Boys', url: 'https://open.spotify.com/track/5QLhGjKVFhJb8Aq1GJmKXE' },
    { day: 'Lördag', song: "Fight For Your Right", artist: 'Beastie Boys', url: 'https://open.spotify.com/track/0sFnBif5zwBimPNJvrDOmN' },
    { day: 'Söndag', song: 'Intergalactic', artist: 'Beastie Boys', url: 'https://open.spotify.com/track/5fpizYOjMUbGMTyjtVMXMw' },
  ],
  fredrik: [
    { day: 'Fredag', song: 'Ice Ice Baby', artist: 'Vanilla Ice', url: 'https://open.spotify.com/track/3XVozq1aeqsJwpXrEZrDJ9' },
    { day: 'Lördag', song: 'Under Pressure', artist: 'Queen & Bowie', url: 'https://open.spotify.com/track/2fuCquhmrzHpu5xcA1ci9x' },
    { day: 'Söndag', song: 'Cold as Ice', artist: 'Foreigner', url: 'https://open.spotify.com/track/4MRMEOg3AYeRWBm0A8MZdK' },
  ],
  martin: [
    { day: 'Fredag', song: 'Eye of the Tiger', artist: 'Survivor', url: 'https://open.spotify.com/track/2KH16WveTQWT6KOG9Rg6e2' },
    { day: 'Lördag', song: "Don't Stop Believin'", artist: 'Journey', url: 'https://open.spotify.com/track/4bHsxqR3GMrXTxEPLuK5ue' },
    { day: 'Söndag', song: 'Gonna Fly Now', artist: 'Rocky Theme', url: 'https://open.spotify.com/track/0kBbtU1H0RFMIlbWMCaVfl' },
  ],
}

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
  const extra = Math.floor(playingHcp / 18)
  const rem = playingHcp % 18
  const given = extra + (holeHcp <= rem ? 1 : 0)
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
  "Ingen har vunnit The Green Jacket genom att spela safe.",
  "Öl nummer 3 har aldrig förbättrat någons swing. Men den har förbättrat attityden.",
  "Du spelar inte mot banan. Du spelar mot dig själv. Och dig själv drack för mycket igår.",
  "Varje runda är en ny chans. Varje hål är en ny chans. Varje öl är... ja, du fattar.",
  "Steady Eddie vinner turneringar. Crazy Eddie vinner Daily Loser.",
  "Kom ihåg: Martin har 40 i hcp. Du har inga ursäkter.",
  "Det enda som är värre än en trippelbogey är att berätta om den vid middagen.",
  "72 hål. Det är en maraton, inte en sprint. Drick vatten. Skoja, drick öl.",
]
