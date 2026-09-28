// lib/TabySeasonSummary.jsx — Sasongssummering TOOM 2026. Add-on overlay, isolerad.
// Laser: taby_final (champion_id, snapshot, h2h), rounds, scores, players, events, playerStats. Skriver inget.
'use client'
import { useState, useEffect } from 'react'

const G = '#D4A017', CREAM = '#FAF8F0', MUT = 'rgba(240,244,255,0.45)', LAKE = '#93C5FD', CORAL = '#E8634A', GREEN = '#4ADE80'
const mono = { fontFamily: 'var(--mono)' }
const card = { background: 'rgba(147,197,253,0.04)', border: '0.5px solid rgba(147,197,253,0.12)', borderRadius: 14, padding: 14, marginBottom: 12 }
const lbl = { ...mono, fontSize: 8, letterSpacing: 2.5, color: 'rgba(212,160,23,0.7)', marginBottom: 8 }
const PAR = { 1:5,2:4,3:4,4:3,5:4,6:5,7:3,8:4,9:4,10:4,11:4,12:5,13:4,14:3,15:4,16:4,17:3,18:5 }
const CROWN_CSS = `
@keyframes tss-rise { from { opacity:0; transform: translateY(18px) } to { opacity:1; transform: translateY(0) } }
@keyframes tss-glow { 0%,100% { box-shadow: 0 0 40px rgba(212,160,23,0.25) } 50% { box-shadow: 0 0 90px rgba(212,160,23,0.55) } }
@keyframes tss-fall { 0% { transform: translateY(-20px) rotate(0deg); opacity: 0 } 10% { opacity: 1 } 100% { transform: translateY(110vh) rotate(720deg); opacity: 0 } }
.tss-rise { animation: tss-rise .7s ease-out both }
.tss-glow { animation: tss-glow 3s ease-in-out infinite }
.tss-conf { position:absolute; top:0; width:8px; height:14px; border-radius:2px; animation: tss-fall linear infinite; pointer-events:none }
`

export default function TabySeasonSummary({ final, players, playerStats, rounds, scores, events, user, onClose }) {
  const [step, setStep] = useState(0)
  useEffect(() => { const t = setTimeout(() => setStep(1), 1800); return () => clearTimeout(t) }, [])
  if (!final?.season_closed) return null

  const byId = Object.fromEntries(players.map(p => [p.id, p]))
  const champ = byId[final.champion_id]
  const year = final.season_year || 2026
  const guestIds = new Set((final.snapshot || []).filter(s => s.merit_total == null).map(s => s.player_id))

  // Slutstallning TOOM (fran appens merit-berakning), gaster exkluderade
  const standings = (playerStats || []).filter(p => !guestIds.has(p.id)).sort((a, b) => (b.stats.meritTotal || 0) - (a.stats.meritTotal || 0))

  // Sasongsstatistik per spelare
  const perRound = {}
  scores.forEach(s => {
    if (!s.strokes) return
    const k = s.player_id + '|' + s.round_id
    const r = perRound[k] ||= { pid: s.player_id, rid: s.round_id, holes: 0, pts: 0, strokes: 0, birdies: 0, pars: 0 }
    r.holes++; r.pts += s.stableford || 0; r.strokes += s.strokes
    if (s.strokes === PAR[s.hole] - 1) r.birdies++
    if (s.strokes <= PAR[s.hole] - 2) r.birdies++  // eagle raknas dubbelt = "birdie eller battre"
    if (s.strokes === PAR[s.hole]) r.pars++
  })
  const stat = {}
  Object.values(perRound).forEach(r => {
    const s = stat[r.pid] ||= { rounds: 0, best: 0, birdies: 0, pars: 0, holes: 0, bestStrokes: null }
    if (r.holes === 18 || r.holes === 9) { s.rounds++; const t = r.holes === 9 ? r.pts * 2 : r.pts; if (t > s.best) s.best = t; if (r.holes === 18 && (s.bestStrokes == null || r.strokes < s.bestStrokes)) s.bestStrokes = r.strokes }
    s.birdies += r.birdies; s.pars += r.pars; s.holes += r.holes
  })
  const top = (fn, filter = () => true) => Object.entries(stat).filter(([pid]) => filter(pid)).sort((a, b) => fn(b[1]) - fn(a[1]))[0]
  const notGuest = pid => !guestIds.has(pid)
  const mostActive = top(s => s.rounds, notGuest)
  const mostBirdies = top(s => s.birdies, notGuest)
  const bestRound = top(s => s.best, notGuest)
  const fewestStrokes = Object.entries(stat).filter(([pid, s]) => s.bestStrokes != null).sort((a, b) => a[1].bestStrokes - b[1].bestStrokes)[0]
  const totalRounds = rounds.length
  const totalHoles = scores.filter(s => s.strokes).length
  const totalBirdies = Object.values(stat).reduce((a, s) => a + s.birdies, 0)

  // Finalen
  const finalEv = events.find(e => e.id === final.event_id)
  const finalRoundIds = new Set(rounds.filter(r => r.event_id === final.event_id).map(r => r.id))
  const finalRows = (final.snapshot || []).map(s => {
    const rs = Object.values(perRound).filter(r => r.pid === s.player_id && finalRoundIds.has(r.rid))
    const pts = rs.reduce((a, r) => a + r.pts, 0), strokes = rs.reduce((a, r) => a + r.strokes, 0)
    return { ...s, player: byId[s.player_id], pts, strokes, total: Math.round(((s.start || 0) + pts) * 10) / 10 }
  }).sort((a, b) => b.total - a.total || (b.merit_total ?? -1) - (a.merit_total ?? -1))

  // H2H-resultat
  const h2hRows = (final.h2h || []).filter(m => m.p1 && m.p2).map(m => {
    const p = pid => Object.values(perRound).filter(r => r.pid === pid && finalRoundIds.has(r.rid)).reduce((a, r) => a + r.pts, 0)
    const a = p(m.p1), b = p(m.p2)
    return { ...m, a, b, winner: a === b ? null : a > b ? m.p1 : m.p2 }
  })

  const Name = ({ id, big }) => <span style={{ fontSize: big ? 15 : 13, color: CREAM, fontWeight: 600 }}>{byId[id]?.nickname || '?'}</span>
  const confetti = Array.from({ length: 26 }, (_, i) => ({ left: (i * 37) % 100, delay: (i * 0.37) % 4, dur: 5 + (i % 4), color: [G, LAKE, CREAM, CORAL][i % 4] }))

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1160, background: 'linear-gradient(180deg, #0C1830 0%, #14294A 100%)', display: 'flex', flexDirection: 'column', overflow: 'hidden', touchAction: 'pan-y' }}>
      <style>{CROWN_CSS}</style>
      {confetti.map((c, i) => <div key={i} className="tss-conf" style={{ left: c.left + '%', background: c.color, animationDelay: c.delay + 's', animationDuration: c.dur + 's', opacity: 0.8 }} />)}

      <div style={{ flexShrink: 0, background: 'rgba(12,24,48,0.96)', borderBottom: '0.5px solid rgba(212,160,23,0.3)', padding: '12px 16px 10px', paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))', display: 'flex', alignItems: 'center', gap: 10, position: 'relative', zIndex: 2 }}>
        <button onClick={onClose} style={{ background: 'rgba(147,197,253,0.08)', border: '1px solid rgba(147,197,253,0.25)', borderRadius: 10, color: LAKE, fontSize: 14, cursor: 'pointer', padding: '8px 12px' }}>← Stäng</button>
        <div style={{ flex: 1, textAlign: 'center', ...mono, fontSize: 8, color: G, letterSpacing: 3 }}>TÄBY ORDER OF MERIT · {year}</div>
        <div style={{ width: 70 }} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', position: 'relative', zIndex: 1 }}>
        <div style={{ padding: '18px 16px 40px', maxWidth: 560, margin: '0 auto' }}>

          {/* MÄSTAREN */}
          <div className="tss-rise tss-glow" style={{ ...card, textAlign: 'center', padding: '28px 18px 22px', background: 'linear-gradient(160deg, rgba(212,160,23,0.22), rgba(20,41,74,0.5) 60%, rgba(12,24,48,0.6))', border: '1px solid rgba(212,160,23,0.7)' }}>
            <div style={{ ...mono, fontSize: 9, color: G, letterSpacing: 4, marginBottom: 14 }}>SÄSONGSMÄSTARE {year}</div>
            <div style={{ fontSize: 46, lineHeight: 1, marginBottom: 10 }}>👑</div>
            {champ?.image_url && <img src={champ.image_url} alt="" style={{ width: 112, height: 112, borderRadius: '50%', objectFit: 'cover', border: '3px solid ' + G, boxShadow: '0 0 30px rgba(212,160,23,0.5)', marginBottom: 12 }} />}
            <div style={{ fontFamily: 'var(--serif)', fontSize: 38, color: CREAM, lineHeight: 1 }}>{champ?.nickname || 'Mästaren'}</div>
            <div style={{ fontSize: 14, color: MUT, marginTop: 6 }}>{champ?.name}</div>
            <div style={{ ...mono, fontSize: 9, color: G, letterSpacing: 2, marginTop: 16 }}>TÄBY ORDER OF MERIT · CHAMPION</div>
            {step > 0 && <div className="tss-rise" style={{ marginTop: 14, fontSize: 12, color: 'rgba(240,244,255,0.75)', lineHeight: 1.6 }}>
              Ledde säsongen delat inför finalen, satte {finalRows[0]?.pts}p på finaldagen och tog hem hela potten. Grattis.
            </div>}
          </div>

          {step > 0 && <>
            {/* SLUTSTÄLLNING */}
            <div className="tss-rise" style={card}>
              <div style={lbl}>SLUTSTÄLLNING · ORDER OF MERIT {year}</div>
              {standings.map((p, i) => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 4px', borderTop: i ? '0.5px solid rgba(147,197,253,0.08)' : 'none', background: p.id === user?.id ? 'rgba(147,197,253,0.05)' : 'transparent', borderRadius: 6 }}>
                  <div style={{ ...mono, fontSize: 13, color: i === 0 ? G : MUT, fontWeight: 700, width: 20 }}>{i + 1}</div>
                  {p.image_url ? <img src={p.image_url} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: i === 0 ? '2px solid ' + G : '1px solid rgba(147,197,253,0.2)' }} /> : <div style={{ width: 32 }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: CREAM, fontWeight: i === 0 ? 700 : 500 }}>{i === 0 && '👑 '}{p.nickname}</div>
                    <div style={{ ...mono, fontSize: 8, color: MUT }}>PI {p.stats.basPi} · event +{p.stats.eventBonus} · {stat[p.id]?.rounds || 0} rundor</div>
                  </div>
                  <div style={{ ...mono, fontSize: 18, fontWeight: 700, color: i === 0 ? G : CREAM }}>{p.stats.meritTotal}</div>
                </div>
              ))}
            </div>

            {/* FINALEN */}
            <div className="tss-rise" style={card}>
              <div style={lbl}>🏁 THE FINAL · {finalEv?.date || ''} · POTT {((final.pot_per_player || 200) * (final.snapshot || []).length).toLocaleString('sv-SE')} KR TILL VINNAREN</div>
              <div style={{ display: 'grid', gridTemplateColumns: '18px 1fr 40px 40px 48px', gap: 4, ...mono, fontSize: 8, color: MUT, padding: '0 4px 6px' }}>
                <div>#</div><div>SPELARE</div><div style={{ textAlign: 'right' }}>START</div><div style={{ textAlign: 'right' }}>POÄNG</div><div style={{ textAlign: 'right' }}>TOTAL</div>
              </div>
              {finalRows.map((r, i) => (
                <div key={r.player_id} style={{ display: 'grid', gridTemplateColumns: '18px 1fr 40px 40px 48px', gap: 4, alignItems: 'center', padding: '7px 4px', borderTop: '0.5px solid rgba(147,197,253,0.08)' }}>
                  <div style={{ ...mono, fontSize: 11, color: i === 0 ? G : MUT }}>{i + 1}</div>
                  <div style={{ fontSize: 12, color: CREAM }}>{r.player?.nickname}{r.merit_total == null && <span style={{ ...mono, fontSize: 7, color: MUT, marginLeft: 5 }}>GÄST</span>}<div style={{ ...mono, fontSize: 8, color: MUT }}>{r.strokes} slag</div></div>
                  <div style={{ ...mono, fontSize: 11, color: r.start > 0 ? G : MUT, textAlign: 'right' }}>{r.start > 0 ? '+' + r.start : '0'}</div>
                  <div style={{ ...mono, fontSize: 11, color: CREAM, textAlign: 'right' }}>{r.pts}</div>
                  <div style={{ ...mono, fontSize: 14, fontWeight: 700, color: i === 0 ? G : CREAM, textAlign: 'right' }}>{r.total}</div>
                </div>
              ))}
              {h2hRows.length > 0 && <>
                <div style={{ ...lbl, marginTop: 14 }}>HEAD TO HEAD</div>
                {h2hRows.map((m, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 4px', fontSize: 12 }}>
                    <span style={{ color: m.winner === m.p1 ? G : CREAM, fontWeight: m.winner === m.p1 ? 700 : 400 }}>{byId[m.p1]?.nickname} {m.a}</span>
                    <span style={{ ...mono, fontSize: 9, color: MUT }}>–</span>
                    <span style={{ color: m.winner === m.p2 ? G : CREAM, fontWeight: m.winner === m.p2 ? 700 : 400 }}>{m.b} {byId[m.p2]?.nickname}</span>
                    <span style={{ flex: 1 }} />
                    <span style={{ ...mono, fontSize: 9, color: MUT }}>{m.winner ? (m.stake ? m.stake + ' kr' : 'äran') : 'lika'}</span>
                  </div>
                ))}
              </>}
            </div>

            {/* SÄSONGENS UTMÄRKELSER */}
            <div className="tss-rise" style={card}>
              <div style={lbl}>SÄSONGENS UTMÄRKELSER</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  mostActive && { e: '🔥', t: 'Mest aktiv', n: byId[mostActive[0]]?.nickname, v: mostActive[1].rounds + ' rundor' },
                  mostBirdies && { e: '🐦', t: 'Flest birdies', n: byId[mostBirdies[0]]?.nickname, v: mostBirdies[1].birdies + ' st' },
                  bestRound && { e: '💪', t: 'Bästa runda', n: byId[bestRound[0]]?.nickname, v: bestRound[1].best + 'p' },
                  fewestStrokes && { e: '🎯', t: 'Lägst slag (18 hål)', n: byId[fewestStrokes[0]]?.nickname, v: fewestStrokes[1].bestStrokes + ' slag' },
                ].filter(Boolean).map((a, i) => (
                  <div key={i} style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(212,160,23,0.06)', border: '0.5px solid rgba(212,160,23,0.2)' }}>
                    <div style={{ fontSize: 18 }}>{a.e}</div>
                    <div style={{ ...mono, fontSize: 7, color: MUT, letterSpacing: 1.5, marginTop: 4 }}>{a.t.toUpperCase()}</div>
                    <div style={{ fontSize: 13, color: CREAM, fontWeight: 600, marginTop: 2 }}>{a.n}</div>
                    <div style={{ ...mono, fontSize: 10, color: G }}>{a.v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* SÄSONGEN I SIFFROR */}
            <div className="tss-rise" style={card}>
              <div style={lbl}>SÄSONGEN I SIFFROR</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, textAlign: 'center' }}>
                {[[totalRounds, 'rundor'], [totalHoles, 'hål spelade'], [totalBirdies, 'birdies'], [events.filter(e => e.status === 'completed').length, 'events'], [standings.length, 'spelare'], [Object.values(stat).reduce((a, s) => a + s.pars, 0), 'par']].map(([v, l], i) => (
                  <div key={i}><div style={{ ...mono, fontSize: 22, fontWeight: 700, color: G }}>{v}</div><div style={{ ...mono, fontSize: 8, color: MUT, letterSpacing: 1 }}>{l.toUpperCase()}</div></div>
                ))}
              </div>
              <div style={{ ...mono, fontSize: 8, color: MUT, marginTop: 12, lineHeight: 1.6 }}>
                {events.filter(e => e.status === 'completed').map(e => {
                  const w = Object.entries(e.placements || {}).find(([, pos]) => pos === 1)?.[0]
                  return `${e.name}: ${byId[w]?.nickname || '–'}`
                }).join(' · ')}
              </div>
            </div>

            <div className="tss-rise" style={{ textAlign: 'center', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, color: 'rgba(240,244,255,0.6)', padding: '10px 0 0', lineHeight: 1.5 }}>
              Tack för säsongen. Vi ses på rangen i april.
            </div>
          </>}
        </div>
      </div>

      <div style={{ flexShrink: 0, padding: '10px 16px', paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))', background: 'rgba(12,24,48,0.96)', borderTop: '0.5px solid rgba(212,160,23,0.3)', position: 'relative', zIndex: 2 }}>
        <button onClick={onClose} style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px solid rgba(212,160,23,0.5)', background: 'rgba(212,160,23,0.12)', color: G, fontSize: 14, fontWeight: 700, cursor: 'pointer', ...mono, letterSpacing: 1 }}>TILL LEADERBOARDEN →</button>
      </div>
    </div>
  )
}
