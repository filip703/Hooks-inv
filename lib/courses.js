export const courses = {
  Skogsbanan: {
    name: 'Skogsbanan', par: 72, meters: 5658,
    cr: 70.1, slope: 128,
    description: 'Tight, skogsinklädd och oförlåtande. Här straffas slarv.',
    holes: [
      { hole: 1, par: 5, hcp: 15, meters: 438, tip: 'Bred öppning men smalar av. Säkert spel lönar sig.' },
      { hole: 2, par: 4, hcp: 3, meters: 339, tip: 'Tredje svåraste. Börja bra eller börja gråta.' },
      { hole: 3, par: 4, hcp: 5, meters: 349, tip: 'Dogleg. Placering från tee avgör allt.' },
      { hole: 4, par: 3, hcp: 13, meters: 132, tip: 'Kort par 3. Precision > kraft. NP-kandidat.' },
      { hole: 5, par: 5, hcp: 7, meters: 467, tip: 'Lång par 5. Eagle-chans om du vågar.' },
      { hole: 6, par: 4, hcp: 1, meters: 365, tip: 'SVÅRASTE HÅLET. Respektera det.' },
      { hole: 7, par: 3, hcp: 17, meters: 136, tip: 'Lättaste par 3. Här SKA du ta poäng.' },
      { hole: 8, par: 4, hcp: 11, meters: 292, tip: 'Kort par 4. Birdie-chans med bra drive.' },
      { hole: 9, par: 4, hcp: 9, meters: 345, tip: 'Svänger. Fairway-trä kan vara smart.' },
      { hole: 10, par: 4, hcp: 10, meters: 312, tip: 'Ny nio. Nollställ hjärnan.' },
      { hole: 11, par: 4, hcp: 4, meters: 344, tip: 'Fjärde svåraste. Håll fairway.' },
      { hole: 12, par: 5, hcp: 12, meters: 423, tip: 'Nåbar i två om du hittar fairway.' },
      { hole: 13, par: 3, hcp: 14, meters: 126, tip: 'Kortaste hålet. Inga ursäkter.' },
      { hole: 14, par: 4, hcp: 18, meters: 307, tip: 'LÄTTASTE HÅLET. Gratis poäng.' },
      { hole: 15, par: 4, hcp: 8, meters: 339, tip: 'Vatten. Respektera vattnet.' },
      { hole: 16, par: 3, hcp: 16, meters: 157, tip: 'Par 3 in mot slutet. Lugn och fin.' },
      { hole: 17, par: 4, hcp: 2, meters: 329, tip: 'Näst svåraste! Härifrån börjar söndagens dubbla.' },
      { hole: 18, par: 5, hcp: 6, meters: 458, tip: 'Avslutaren. Eagle = hjälte. Trippel = Daily Loser.' },
    ]
  },
  Parkbanan: {
    name: 'Parkbanan', par: 72, meters: 5698,
    cr: 70.8, slope: 130,
    description: 'Öppnare och längre. Här belönas power och mod.',
    holes: [
      { hole: 1, par: 4, hcp: 9, meters: 322, tip: 'Uppvärmning. Hitta fairway.' },
      { hole: 2, par: 4, hcp: 15, meters: 337, tip: 'Generöst. Ta poäng här.' },
      { hole: 3, par: 3, hcp: 18, meters: 130, tip: 'LÄTTASTE HÅLET. Ingen par = skam.' },
      { hole: 4, par: 5, hcp: 1, meters: 437, tip: 'SVÅRASTE HÅLET. Lång och elak.' },
      { hole: 5, par: 4, hcp: 5, meters: 321, tip: 'Kort par 4 men lurigt.' },
      { hole: 6, par: 3, hcp: 13, meters: 119, tip: 'Kortaste hålet. Wedge och bön.' },
      { hole: 7, par: 3, hcp: 17, meters: 141, tip: 'Tredje par 3 på raken! Sällsynt.' },
      { hole: 8, par: 4, hcp: 7, meters: 350, tip: 'Längre par 4. Klubbval avgör.' },
      { hole: 9, par: 4, hcp: 11, meters: 314, tip: 'Sista ut. Samla ihop dig.' },
      { hole: 10, par: 5, hcp: 3, meters: 498, tip: 'MONSTER. 498m. LD-hål. Slå långt.' },
      { hole: 11, par: 4, hcp: 12, meters: 362, tip: 'Sjöutsikt. Njut men fokusera.' },
      { hole: 12, par: 4, hcp: 8, meters: 344, tip: 'Bunkrar vaktar. Respektera dem.' },
      { hole: 13, par: 3, hcp: 14, meters: 142, tip: 'Par 3 vid vattnet. Vackert och lurigt.' },
      { hole: 14, par: 4, hcp: 4, meters: 320, tip: 'Fjärde svåraste. Precision här.' },
      { hole: 15, par: 5, hcp: 16, meters: 435, tip: 'Nåbar par 5. Eagle-jakt möjlig.' },
      { hole: 16, par: 4, hcp: 6, meters: 324, tip: 'Dubbla poäng söndag börjar HÄR.' },
      { hole: 17, par: 5, hcp: 2, meters: 452, tip: 'Näst svåraste. Dubbla poäng söndag.' },
      { hole: 18, par: 4, hcp: 10, meters: 350, tip: 'Sista hålet. Ge allt. Eller ta en öl.' },
    ]
  }
}
// Stableford calculation with slope adjustment
// Playing handicap = HCP index * (slope/113) rounded
export function getPlayingHcp(hcpIndex, slope) {
  return Math.round(hcpIndex * (slope / 113))
}

export function calcStableford(strokes, par, playingHcp, holeHcp) {
  if (!strokes || strokes <= 0) return null
  // How many extra strokes on this hole
  const extraStrokes = Math.floor(playingHcp / 18)
  const remainder = playingHcp % 18
  const strokesGiven = extraStrokes + (holeHcp <= remainder ? 1 : 0)
  const netStrokes = strokes - strokesGiven
  const diff = netStrokes - par
  if (diff >= 2) return 0
  if (diff === 1) return 1
  if (diff === 0) return 2
  if (diff === -1) return 3
  if (diff === -2) return 4
  if (diff <= -3) return 5
  return 0
}

// Shoutout messages for good scores
export function getShoutout(playerName, nickname, points, holePar, strokes) {
  const netResult = points >= 3 ? 'birdie' : points >= 4 ? 'eagle' : 'albatross'
  const messages = {
    3: [
      `🐦 BIRDIE! ${nickname} levererar på hål {{hole}}!`,
      `🔥 ${nickname} droppar en birdie! Någon sa "ingen press"?`,
      `🐦 ${playerName} med birdie! Ölen smakar bättre nu.`,
      `💪 BIRDIE för ${nickname}! Laget jublar (eller gråter).`,
    ],
    4: [
      `🦅 EAGLE!! ${nickname} är på riktigt! Hål {{hole}}!`,
      `🦅🦅 EAGLE! ${playerName} just went full tour mode!`,
      `🤯 ${nickname} med EAGLE! Är det ens lagligt?!`,
    ],
    5: [
      `🏆🏆🏆 ALBATROSS!!! ${nickname}!!! RÖR INTE BOLLEN!!!`,
      `💎 ALBATROSS av ${playerName}! Stäng appen. Gå hem. Det blir inte bättre.`,
    ]
  }
  if (points >= 5) {
    const arr = messages[5]
    return arr[Math.floor(Math.random() * arr.length)]
  }
  if (points >= 4) {
    const arr = messages[4]
    return arr[Math.floor(Math.random() * arr.length)]
  }
  if (points >= 3) {
    const arr = messages[3]
    return arr[Math.floor(Math.random() * arr.length)]
  }
  return null
}

// Zero-point roasts
export function getZeroRoast(nickname) {
  const roasts = [
    `💀 ${nickname} tar en nolla. Nollpoängartrofén kallar.`,
    `🕳️ ${nickname} med 0 poäng. Hålet vann.`,
    `😬 0p för ${nickname}. Nästa hål, nästa chans.`,
    `🪦 RIP ${nickname}s scorecard. Hål {{hole}}.`,
    `🍺 ${nickname} behöver en öl efter den där.`,
  ]
  return roasts[Math.floor(Math.random() * roasts.length)]
}
