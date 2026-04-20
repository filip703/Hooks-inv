// Täby Order of Merit – Merit Calculation Engine
// Poängsystem: PI 50% | Events 35% | H2H 10% | Activity 5%

export function calcPerformanceIndex(rounds) {
  if (!rounds || rounds.length === 0) return { pi: 0, counted: [], struck: [] }
  const sorted = [...rounds].sort((a, b) => b.stableford - a.stableford)
  const counted = sorted.slice(0, 8)
  const struck = sorted.slice(8)
  const pi = counted.length > 0 ? counted.reduce((sum, r) => sum + r.stableford, 0) / counted.length : 0
  return { pi: Math.round(pi * 10) / 10, counted: counted.map(r => r.id), struck: struck.map(r => r.id), totalRounds: rounds.length, qualifies: rounds.length >= 8 }
}

const EVENT_POINTS = { 1: 25, 2: 18, 3: 12, 4: 8, 5: 5, 6: 2, dns: 0 }

export function calcEventPoints(eventResults) {
  if (!eventResults) return { total: 0, events: [] }
  let total = 0
  const events = eventResults.map(er => { const points = EVENT_POINTS[er.position] || 0; total += points; return { ...er, points } })
  return { total, events, max: 100 }
}

export function calcH2HRecord(h2hResults, playerId) {
  if (!h2hResults || h2hResults.length === 0) return { wins: 0, losses: 0, draws: 0, pct: 0 }
  let wins = 0, losses = 0, draws = 0
  for (const match of h2hResults) {
    if (match.winner_id === playerId) wins++
    else if (match.winner_id === null) draws++
    else losses++
  }
  const total = wins + losses + draws
  return { wins, losses, draws, pct: total > 0 ? Math.round((wins / total) * 1000) / 10 : 0, total }
}

export function calcActivityBonus(roundCount) { return Math.min(roundCount, 12) }

export function calcMeritStanding(playerData) {
  const { rounds, eventResults, h2hResults, playerId } = playerData
  const pi = calcPerformanceIndex(rounds)
  const events = calcEventPoints(eventResults)
  const h2h = calcH2HRecord(h2hResults, playerId)
  const activity = calcActivityBonus(rounds?.length || 0)
  return { playerId, performanceIndex: pi, events, h2h, activity, qualifies: pi.qualifies }
}

export function calcLeaderboard(allPlayerData) {
  const standings = allPlayerData.map(pd => calcMeritStanding(pd))
  const maxPI = Math.max(...standings.map(s => s.performanceIndex.pi), 1)
  const maxEvents = Math.max(...standings.map(s => s.events.total), 1)
  const maxH2H = Math.max(...standings.map(s => s.h2h.pct), 1)
  const ranked = standings.map(s => {
    const piNorm = (s.performanceIndex.pi / maxPI) * 100
    const evNorm = (s.events.total / maxEvents) * 100
    const h2hNorm = (s.h2h.pct / maxH2H) * 100
    const actNorm = (s.activity / 12) * 100
    const total = (piNorm * 0.50) + (evNorm * 0.35) + (h2hNorm * 0.10) + (actNorm * 0.05)
    return { ...s, normalized: { pi: piNorm, events: evNorm, h2h: h2hNorm, activity: actNorm }, total: Math.round(total * 10) / 10 }
  })
  ranked.sort((a, b) => b.total - a.total)
  ranked.forEach((s, i) => { s.position = i + 1 })
  return ranked
}

export function getRoundType(playerIdsInRound, allMemberIds) {
  const memberCount = playerIdsInRound.filter(id => allMemberIds.includes(id)).length
  if (memberCount >= 5) return 'event'
  if (memberCount >= 2) return 'group'
  return 'solo'
}

export function calcBonusPoints(holeScores, holePars) {
  let bonus = 0, birdies = 0, eagles = 0, hasSkull = false
  for (let i = 0; i < holeScores.length; i++) {
    const diff = holeScores[i] - holePars[i]
    if (diff <= -2) { eagles++; bonus += 5 }
    else if (diff === -1) { birdies++; bonus += 2 }
    if (holeScores[i] === 0) hasSkull = true
  }
  if (!hasSkull && holeScores.length === 18) bonus += 10
  return { bonus, birdies, eagles, cleanSheet: !hasSkull }
}
