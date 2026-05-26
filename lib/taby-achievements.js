// Täby achievements — badges som låses upp från spelhistorik.
// Tier styr "finhet" (1=vanlig, 2=ovanlig, 3=sällsynt) → används för ikon vid namnet + medaljpoäng.
export const TABY_ACHIEVEMENTS = [
  { key: 'first_round', icon: '🩸', name: 'First Blood', desc: 'Spela din första runda', tier: 1, pts: 10 },
  { key: 'birdie', icon: '🐦', name: 'Birdie', desc: 'Gör din första birdie', tier: 1, pts: 10 },
  { key: 'veteran_5', icon: '📅', name: 'Stammis', desc: 'Spela 5 fulla rundor', tier: 1, pts: 10 },
  { key: 'clean_sheet', icon: '🛡️', name: 'Clean Sheet', desc: 'En 18-hålsrunda utan en enda nolla', tier: 2, pts: 25 },
  { key: 'hot_hand', icon: '🔥', name: 'Hot Hand', desc: 'Två birdies i rad', tier: 2, pts: 25 },
  { key: 'big_round', icon: '💪', name: 'Toppform', desc: '36+ poäng på en runda', tier: 2, pts: 25 },
  { key: 'birdie_machine', icon: '🎯', name: 'Birdiemaskin', desc: '10 birdies totalt', tier: 2, pts: 25 },
  { key: 'par_machine', icon: '🏞️', name: 'Parmästare', desc: '50 pars totalt', tier: 2, pts: 25 },
  { key: 'consistent', icon: '⚖️', name: 'Mr Consistent', desc: '3 fulla rundor i rad inom 4 poäng', tier: 2, pts: 25 },
  { key: 'eagle', icon: '🦅', name: 'Örnblick', desc: 'Gör en eagle', tier: 3, pts: 50 },
  { key: 'veteran_10', icon: '🏛️', name: 'Klubbtrogen', desc: 'Spela 10 fulla rundor', tier: 3, pts: 50 },
  { key: 'leader', icon: '👑', name: 'Ledartröjan', desc: 'Toppa Order of Merit', tier: 3, pts: 50 },
]

export const ACH_BY_KEY = Object.fromEntries(TABY_ACHIEVEMENTS.map(a => [a.key, a]))

// rounds: [{ holes: [{hole, strokes, stableford, par}] }], opts: { isLeader }
// Returnerar Set av upplåsta keys.
export function evalAchievements(rounds, opts = {}) {
  const unlocked = new Set()
  let totalBirdies = 0, totalPars = 0, fullRounds = 0
  const fullTotals = []
  rounds.forEach(r => {
    const holes = [...r.holes].sort((a, b) => a.hole - b.hole)
    const isFull = holes.length >= 18
    if (isFull) fullRounds++
    let roundTotal = 0, zeros = 0, prevBirdie = false
    holes.forEach(h => {
      roundTotal += h.stableford || 0
      const birdie = h.strokes > 0 && h.strokes < h.par
      const eagle = h.strokes > 0 && h.strokes <= h.par - 2
      if (birdie) totalBirdies++
      if (h.strokes === h.par && h.strokes > 0) totalPars++
      if (eagle) unlocked.add('eagle')
      if (birdie && prevBirdie) unlocked.add('hot_hand')
      prevBirdie = birdie
      if ((h.stableford || 0) === 0) zeros++
    })
    if (isFull && zeros === 0) unlocked.add('clean_sheet')
    if (roundTotal >= 36) unlocked.add('big_round')
    if (isFull) fullTotals.push(roundTotal)
  })
  if (rounds.length >= 1) unlocked.add('first_round')
  if (totalBirdies >= 1) unlocked.add('birdie')
  if (totalBirdies >= 10) unlocked.add('birdie_machine')
  if (totalPars >= 50) unlocked.add('par_machine')
  if (fullRounds >= 5) unlocked.add('veteran_5')
  if (fullRounds >= 10) unlocked.add('veteran_10')
  for (let i = 0; i + 2 < fullTotals.length; i++) {
    const w = [fullTotals[i], fullTotals[i + 1], fullTotals[i + 2]]
    if (Math.max(...w) - Math.min(...w) <= 4) { unlocked.add('consistent'); break }
  }
  if (opts.isLeader) unlocked.add('leader')
  return unlocked
}

// Finaste upplåsta achievement (högsta tier, sen pts) — för ikon vid namnet.
export function topAchievement(unlockedSet) {
  let best = null
  TABY_ACHIEVEMENTS.forEach(a => {
    if (unlockedSet.has(a.key) && (!best || a.tier > best.tier || (a.tier === best.tier && a.pts > best.pts))) best = a
  })
  return best
}

export function medalPoints(unlockedSet) {
  return TABY_ACHIEVEMENTS.reduce((s, a) => s + (unlockedSet.has(a.key) ? a.pts : 0), 0)
}
