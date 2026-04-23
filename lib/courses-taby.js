// Täby GK – 18-hålsbanan – KOMPLETT HÅLDATA
// Extraherad från officiella banguide-bilder (tabygk.se)
// Skålhamra Gård, 187 70 Täby · Arkitekt: Nils Sköld (1969-1972)
// Slope: 130 (tee 60), CR: 70.0, Par: 72

export const TABY_COURSE = {
  name: 'Täby GK', fullName: 'Täby Golfklubb',
  address: 'Skålhamra Gård, 187 70 Täby',
  phone: '08-510 232 61', email: 'receptionen@tabygk.se', web: 'https://tabygk.se',
  logo: 'https://tabygk.se/wp-content/uploads/2024/04/Taby-GK.svg',
  architect: 'Nils Sköld', built: '1969-1972', founded: 1968,
  par: 72, holes: 18,
  slope: { 60: 130, 58: 128, 54: 125, 49: 120, 45: 116, 39: 110 },
  cr: { 60: 70.0, 58: 69.0, 54: 67.5, 49: 65.5, 45: 63.5, 39: 60.0 },
  clubhouse: { lat: 59.4835, lng: 18.0230 },
  description: 'En av Stockholms mest natursköna golfbanor vid Vallentunasjöns västra strand. Trots begränsad längd ställer banan stora krav med alla sorters lutande lägen och utmanande puttar.',
}

export const TABY_HOLES = [
  // === FRONT NINE ===
  { hole: 1, par: 5, index: 13,
    meters: { 60: 441, 58: 431, 54: 420, 49: 353, 45: 353, 39: 273 },
    approaches: { 60: 272, 58: 262, 54: 251, 49: 182, 45: 182, 39: 100 },
    layup: { 60: 230, 58: 220, 54: 209, 49: 140, 45: 140 },
    inspel: [78, 110, 163, 210], greenSections: [2, 3, 1],
    elevation: 'flat', water: false, bunkers: true,
    tip: 'Placera utslaget i linje mot högsta tallen i förlängningen av fairway. Bakom och till höger om green är en brant slänt, framför green en svacka.',
    banGuideImage: 'hole-1.webp' },

  { hole: 2, par: 4, index: 9,
    meters: { 60: 372, 58: 360, 54: 351, 49: 330, 45: 290, 39: 226 },
    approaches: { 60: 233, 58: 223, 54: 212, 49: 190, 45: 151, 39: 87 },
    layup: { 60: 205, 58: 198, 54: 185, 49: 162, 45: 125 },
    inspel: [56, 96, 124, 151], greenSections: [3, 1, 2],
    elevation: 'uphill finish', water: false, bunkers: true,
    tip: 'Utslag på vänster sida av fairway ger bättre vinkel mot flaggan när den är placerad på höger sida av green.',
    banGuideImage: 'hole-2.webp' },

  { hole: 3, par: 4, index: 3,
    meters: { 60: 357, 58: 337, 54: 318, 49: 298, 45: 298, 39: 215 },
    approaches: { 60: 220, 58: 200, 54: 180, 49: 160, 45: 160 },
    layup: { 60: 195, 58: 175, 54: 155, 49: 135, 45: 135 },
    inspel: [55, 80, 132, 152], greenSections: [1, 2, 3],
    elevation: 'uphill to green', water: true, bunkers: true,
    tip: 'Se upp för dammen vid vänster fairwaykant, inspel sker mot en upphöjd green.',
    banGuideImage: 'hole-3.webp' },

  { hole: 4, par: 3, index: 17,
    meters: { 60: 137, 58: 132, 54: 116, 49: 106, 45: 82, 39: 82 },
    approaches: { 60: 122, 58: 117, 54: 101, 49: 91, 45: 65, 39: 65 },
    inspel: [], greenSections: [3, 1, 2],
    elevation: 'slight downhill', water: true, bunkers: true,
    tip: 'Vattenkanten följer vänster greenkant. Bakre delen av greenen lutar kraftigt, uppförsputt är att föredra.',
    banGuideImage: 'hole-4.webp' },

  { hole: 5, par: 4, index: 1,
    meters: { 60: 396, 58: 367, 54: 345, 49: 289, 45: 289, 39: 254 },
    approaches: { 60: 250, 58: 220, 54: 200, 49: 145, 45: 145 },
    layup: { 60: 225, 58: 195, 54: 175, 49: 120, 45: 120 },
    inspel: [100, 135], greenSections: [2, 3, 1],
    elevation: 'uphill entire hole', water: false, bunkers: true,
    tip: 'Hela hålet spelas uppför. Placera utslaget på vänster sida av fairway.',
    banGuideImage: 'hole-5.webp' },

  { hole: 6, par: 5, index: 7,
    meters: { 60: 484, 58: 445, 54: 434, 49: 401, 45: 350, 39: 282 },
    approaches: { 60: 280, 58: 240, 54: 230, 49: 195, 45: 145 },
    layup: { 60: 245, 58: 205, 54: 195, 49: 160, 45: 110 },
    thirdShot: { 60: 200, 58: 160, 54: 150, 49: 115 },
    inspel: [60, 130, 170, 207, 235], greenSections: [1, 3, 2],
    elevation: 'rolling 20m', water: false, bunkers: true, bell: true,
    tip: 'Fairway lutar kraftigt mot vänster. Inspel görs enklast från vänster sida. Blint inspel – invänta klocksignal. Ring i klockan på väg mot hål 7.',
    banGuideImage: 'hole-6.webp' },

  { hole: 7, par: 3, index: 15,
    meters: { 60: 178, 58: 163, 54: 151, 49: 145, 45: 116, 39: 116 },
    approaches: { 60: 164, 58: 149, 54: 137, 49: 131, 45: 102, 39: 102 },
    inspel: [], greenSections: [2, 3, 1],
    elevation: 'downhill 20m', water: false, bunkers: true,
    tip: 'Utslag som landar kort och till vänster på green tenderar att rulla över green ner mot bunkrarna.',
    banGuideImage: 'hole-7.webp' },

  { hole: 8, par: 4, index: 5,
    meters: { 60: 383, 58: 373, 54: 358, 49: 308, 45: 308, 39: 275 },
    approaches: { 60: 245, 58: 235, 54: 220, 49: 170, 45: 170 },
    layup: { 60: 205, 58: 195, 54: 180, 49: 130, 45: 130 },
    inspel: [78, 113, 145, 185], greenSections: [1, 3, 2],
    elevation: 'flat', water: false, bunkers: true,
    tip: 'Håll utslaget så mycket vänster som möjligt för optimal vinkel mot green.',
    banGuideImage: 'hole-8.webp' },

  { hole: 9, par: 4, index: 11,
    meters: { 60: 320, 58: 310, 54: 290, 49: 223, 45: 223, 39: 223 },
    approaches: { 60: 255, 58: 245, 54: 225, 49: 160, 45: 160, 39: 160 },
    layup: { 60: 215, 58: 205, 54: 185, 49: 120, 45: 120, 39: 120 },
    thirdShot: { 60: 165, 58: 155, 54: 135 },
    inspel: [50, 90, 120, 135], greenSections: [1, 2, 3],
    elevation: 'rolling', water: true, bunkers: true,
    tip: 'Sikta på talldungen till höger om fairway för bäst vinkel mot green. Se upp för dammen strax vänster om green.',
    banGuideImage: 'hole-9.webp' },

  // === BACK NINE ===
  { hole: 10, par: 4, index: 8,
    meters: { 60: 378, 58: 368, 54: 300, 49: 300, 45: 265, 39: 265 },
    approaches: { 60: 230, 58: 220, 54: 153, 49: 153, 45: 123, 39: 123 },
    layup: { 60: 195, 58: 185, 54: 117, 49: 117, 45: 85, 39: 85 },
    thirdShot: { 60: 160, 58: 150 },
    inspel: [50, 75, 100, 120, 145, 160, 215], greenSections: [2, 3, 1],
    elevation: 'flat', water: true, bunkers: true,
    tip: 'Placera utslaget rakt över stora kullen mitt i fairway och se upp för dammen till höger.',
    banGuideImage: 'hole-10.webp' },

  { hole: 11, par: 4, index: 12,
    meters: { 60: 350, 58: 338, 54: 317, 49: 296, 45: 296, 39: 206 },
    approaches: { 60: 230, 58: 218, 54: 197, 49: 176, 45: 176 },
    inspel: [45, 95], greenSections: [1, 2, 3],
    elevation: 'flat', water: true, bunkers: true,
    tip: 'Håll utslaget mot höger sida av hög gran nära green. Se upp för vattenhinder kort och höger om green.',
    banGuideImage: 'hole-11.webp' },

  { hole: 12, par: 5, index: 4,
    meters: { 60: 472, 58: 462, 54: 418, 49: 403, 45: 326, 39: 326 },
    approaches: { 60: 245, 58: 235, 54: 190, 49: 175, 45: 100, 39: 100 },
    layup: { 60: 210, 58: 200, 54: 155, 49: 140, 45: 65, 39: 65 },
    inspel: [93, 175, 220, 250], greenSections: [3, 2, 1],
    elevation: 'rolling plateau', water: true, bunkers: true, bell: true,
    tip: 'Lång drive till första platån. Damm på vänster sida bakom krönet. Invänta klocksignal innan du slår över krönet. Upphöjd ondulerad green. Ring i klockan.',
    banGuideImage: 'hole-12.webp' },

  { hole: 13, par: 4, index: 14,
    meters: { 60: 310, 58: 300, 54: 300, 49: 249, 45: 249, 39: 188 },
    approaches: { 60: 230, 58: 220, 54: 220, 49: 170, 45: 170 },
    layup: { 60: 200, 58: 190, 54: 190, 49: 140, 45: 140 },
    inspel: [50, 80, 100], greenSections: [1, 3, 2],
    elevation: 'downhill', water: false, bunkers: true, blind: true,
    tip: 'Blint utslag – använd utsiktstornet! Utslag vänster om tallen ger minst sluttande läge. Inspel höger om pinnen på kraftigt lutande green. Här börjar Sveriges finaste golfhål!',
    banGuideImage: 'hole-13.webp' },

  { hole: 14, par: 3, index: 2,
    meters: { 60: 180, 58: 160, 54: 148, 49: 139, 45: 98, 39: 98 },
    approaches: { 60: 162, 58: 142, 54: 130, 49: 121, 45: 80, 39: 80 },
    inspel: [], greenSections: [2, 1, 3],
    elevation: 'downhill to lake', water: true, bunkers: true, signature: true,
    tip: 'Bollen tenderar att rulla mot sjön när den landat på green, så håll lite vänster om pinnen.',
    banGuideImage: 'hole-14.webp' },

  { hole: 15, par: 4, index: 18,
    meters: { 60: 309, 58: 280, 54: 273, 49: 258, 45: 258, 39: 205 },
    approaches: { 60: 250, 58: 220, 54: 215, 49: 200, 45: 200, 39: 150 },
    layup: { 60: 200, 58: 170, 54: 165, 49: 150, 45: 150, 39: 100 },
    inspel: [45, 70, 110], greenSections: [2, 1, 3],
    elevation: 'slight downhill', water: true, bunkers: true, signature: true,
    tip: 'Ta sikte mot högsta granen i fairways förlängning. Ett av Sveriges vackraste golfhål.',
    banGuideImage: 'hole-15.webp' },

  { hole: 16, par: 4, index: 6,
    meters: { 60: 363, 58: 363, 54: 313, 49: 298, 45: 298, 39: 237 },
    approaches: { 60: 251, 58: 251, 54: 201, 49: 186, 45: 186, 39: 125 },
    layup: { 60: 215, 58: 215, 54: 165, 49: 150, 45: 150, 39: 90 },
    inspel: [65, 95, 140], greenSections: [1, 3, 2],
    elevation: 'flat', water: true, bunkers: true,
    tip: 'Dold damm i förlängningen av vänster fairway. Kraftigt lutande green – "pin high" vänster ger rak uppförsputt.',
    banGuideImage: 'hole-16.webp' },

  { hole: 17, par: 3, index: 16,
    meters: { 60: 157, 58: 151, 54: 140, 49: 111, 45: 111, 39: 111 },
    approaches: { 60: 140, 58: 134, 54: 123, 49: 94, 45: 94, 39: 94 },
    inspel: [], greenSections: [3, 1, 2],
    elevation: 'slight downhill', water: true, bunkers: true, signature: true,
    tip: 'Sjöhålet! Vatten framför och vänster om green. Dropzon finns.',
    banGuideImage: 'hole-17.webp' },

  { hole: 18, par: 5, index: 10,
    meters: { 60: 440, 58: 430, 54: 417, 49: 370, 45: 325, 39: 325 },
    approaches: { 60: 260, 58: 250, 54: 237, 49: 190, 45: 144, 39: 144 },
    layup: { 60: 185, 58: 175, 54: 162, 49: 113 },
    inspel: [50, 75, 105, 165, 205, 240], greenSections: [1, 2, 3],
    elevation: 'flat', water: true, bunkers: true, newGreen2026: true,
    tip: 'Sikta utslaget mot bunkern. OB vänster, vatten höger. Miss höger om green är att föredra. Ny green 2026!',
    banGuideImage: 'hole-18.webp' },
]

export const TABY_SUMMARY = {
  front9: { par: 36, meters60: TABY_HOLES.slice(0,9).reduce((s,h) => s + h.meters[60], 0) },
  back9: { par: 36, meters60: TABY_HOLES.slice(9).reduce((s,h) => s + h.meters[60], 0) },
  par3s: [4, 7, 14, 17], par4s: [2, 3, 5, 8, 9, 10, 11, 13, 15, 16], par5s: [1, 6, 12, 18],
  waterHoles: [3, 4, 9, 10, 11, 12, 14, 15, 16, 17, 18],
  signatureHoles: [14, 15, 17], bellHoles: [6, 12], blindHoles: [13],
}

// GPS coordinates per hole (to be filled from Google Maps)
// Format: { tee: {lat,lng}, green: {lat,lng}, hazards: [{type, lat, lng, desc}] }
// Can be queried via window.navigator.geolocation to show distance-to-green
export const TABY_GPS = {
  1: { tee: null, green: null, hazards: [] },
  2: { tee: null, green: null, hazards: [] },
  3: { tee: null, green: null, hazards: [] },
  4: { tee: null, green: null, hazards: [] },
  5: { tee: null, green: null, hazards: [] },
  6: { tee: null, green: null, hazards: [] },
  7: { tee: null, green: null, hazards: [] },
  8: { tee: null, green: null, hazards: [] },
  9: { tee: null, green: null, hazards: [] },
  10: { tee: null, green: null, hazards: [] },
  11: { tee: null, green: null, hazards: [] },
  12: { tee: null, green: null, hazards: [] },
  13: { tee: null, green: null, hazards: [] },
  14: { tee: null, green: null, hazards: [] },
  15: { tee: null, green: null, hazards: [] },
  16: { tee: null, green: null, hazards: [] },
  17: { tee: null, green: null, hazards: [] },
  18: { tee: null, green: null, hazards: [] },
}

// GPS utilities
export function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

export function distanceToGreen(lat, lng, holeNum) {
  const hole = TABY_HOLES.find(h => h.hole === holeNum)
  if (!hole?.gps?.green?.lat) return null
  return Math.round(haversineDistance(lat, lng, hole.gps.green.lat, hole.gps.green.lng))
}

export function getExtraStrokes(holeIndex, playerHcp, slope = 130) {
  const playingHcp = Math.round(playerHcp * slope / 113)
  const base = Math.floor(playingHcp / 18)
  const remainder = playingHcp % 18
  return base + (holeIndex <= remainder ? 1 : 0)
}
