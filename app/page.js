'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { courses, getPlayingHcp, calcStableford, getShoutout, getZeroRoast } from '../lib/courses'

const ROUND_COURSES = { 1: 'Skogsbanan', 2: 'Parkbanan', 3: 'Skogsbanan', 4: 'Parkbanan' }
const ROUND_LABELS = { 1: 'R1 Fre', 2: 'R2 Lör FM', 3: 'R3 Lör EM', 4: 'R4 Sön' }

export default function Home() {
  const [currentUser, setCurrentUser] = useState(null)
  const [view, setView] = useState('leaderboard')
  const [players, setPlayers] = useState([])
  const [rounds, setRounds] = useState([])
  const [scores, setScores] = useState([])
  const [selectedRound, setSelectedRound] = useState(1)
  const [shoutout, setShoutout] = useState(null)
  const [feed, setFeed] = useState([])
  const shoutoutTimer = useRef(null)

  const fetchData = useCallback(async () => {
    const [pRes, rRes, sRes] = await Promise.all([
      supabase.from('inv_players').select('*').order('hcp'),
      supabase.from('inv_rounds').select('*').order('round_number'),
      supabase.from('inv_scores').select('*'),
    ])
    if (pRes.data) setPlayers(pRes.data)
    if (rRes.data) setRounds(rRes.data)
    if (sRes.data) setScores(sRes.data)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Realtime subscription for live updates
  useEffect(() => {
    const channel = supabase.channel('inv_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inv_scores' }, (payload) => {
        fetchData()
        // Check for shoutout-worthy score
        if (payload.new && payload.new.stableford_points >= 3) {
          const p = players.find(pl => pl.id === payload.new.player_id)
          if (p) {
            const msg = getShoutout(p.name, p.nickname, payload.new.stableford_points, 0, 0)
            if (msg) {
              const finalMsg = msg.replace('{{hole}}', payload.new.hole)
              showShoutout(finalMsg, payload.new.stableford_points >= 4 ? 'eagle' : 'birdie')
              addFeedItem(finalMsg, payload.new.stableford_points >= 4 ? 'eagle' : 'birdie')
            }
          }
        }
        if (payload.new && payload.new.stableford_points === 0 && payload.new.strokes) {
          const p = players.find(pl => pl.id === payload.new.player_id)
          if (p) {
            const msg = getZeroRoast(p.nickname).replace('{{hole}}', payload.new.hole)
            addFeedItem(msg, 'zero')
          }
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchData, players])

  const showShoutout = (msg, type) => {
    setShoutout({ msg, type })
    if (shoutoutTimer.current) clearTimeout(shoutoutTimer.current)
    shoutoutTimer.current = setTimeout(() => setShoutout(null), 4000)
  }

  const addFeedItem = (msg, type) => {
    setFeed(prev => [{ msg, type, time: new Date().toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }) }, ...prev].slice(0, 50))
  }

  // Helper functions
  const getRoundId = (roundNum) => rounds.find(r => r.round_number === roundNum)?.id
  const getPlayerScores = (playerId, roundId) => scores.filter(s => s.player_id === playerId && s.round_id === roundId)

  const getPlayerRoundTotal = (playerId, roundNum) => {
    const roundId = getRoundId(roundNum)
    if (!roundId) return 0
    return getPlayerScores(playerId, roundId).reduce((sum, s) => sum + (s.stableford_points || 0), 0)
  }

  const getPlayerGrandTotal = (playerId) => [1,2,3,4].reduce((sum, r) => sum + getPlayerRoundTotal(playerId, r), 0)

  const getTeamRoundScore = (team, roundNum) => {
    const teamPlayers = players.filter(p => p.team === team)
    const ps = teamPlayers.map(p => ({ id: p.id, score: getPlayerRoundTotal(p.id, roundNum) }))
    ps.sort((a, b) => b.score - a.score)
    return { total: ps.slice(0, 2).reduce((s, p) => s + p.score, 0), counted: ps.slice(0, 2).map(p => p.id), dropped: ps.length > 2 ? [ps[2].id] : [] }
  }

  const getTeamTotal = (team) => [1,2,3,4].reduce((sum, r) => sum + getTeamRoundScore(team, r).total, 0)
  const getZeroCount = (playerId) => scores.filter(s => s.player_id === playerId && s.stableford_points === 0 && s.strokes).length

  // Save score with auto-Stableford
  const saveScore = async (hole, strokes) => {
    const roundId = getRoundId(selectedRound)
    if (!roundId || !currentUser || !strokes) return
    const courseName = ROUND_COURSES[selectedRound]
    const course = courses[courseName]
    const holeData = course.holes.find(h => h.hole === hole)
    const playingHcp = getPlayingHcp(Math.min(parseFloat(currentUser.hcp), 36), course.slope)
    const pts = calcStableford(parseInt(strokes), holeData.par, playingHcp, holeData.hcp)

    const { error } = await supabase.from('inv_scores').upsert({
      player_id: currentUser.id,
      round_id: roundId,
      hole,
      strokes: parseInt(strokes),
      stableford_points: pts,
    }, { onConflict: 'player_id,round_id,hole' })

    if (!error) fetchData()
  }

  // Leaderboard data
  const leaderboard = [...players].sort((a, b) => getPlayerGrandTotal(b.id) - getPlayerGrandTotal(a.id))
  const isAdmin = currentUser?.key === 'filip'

  // ====== LOGIN SCREEN ======
  if (!currentUser) {
    return (
      <div className="login-screen">
        <div className="login-badge">EST. 2026 · HOOKS HERRGÅRD</div>
        <h1 className="login-title">The <em>Invitational</em></h1>
        <p className="login-subtitle">Välj din profil för att börja</p>
        <div className="login-faces">
          {players.map(p => (
            <button key={p.id} className="login-face-btn" onClick={() => { setCurrentUser(p); setView('leaderboard') }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--surface2)', margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                {p.name.charAt(0)}
              </div>
              <div className="login-player-name">{p.name.split(' ')[0]}</div>
              <div className="login-player-nick">{p.nickname}</div>
            </button>
          ))}
        </div>
        <p style={{ fontSize: 11, color: 'var(--cream-muted)', marginTop: 24 }}>72 hål · 4 rundor · Oändligt med öl</p>
      </div>
    )
  }

  // ====== SCORECARD DATA ======
  const currentCourse = courses[ROUND_COURSES[selectedRound]]
  const currentRoundId = getRoundId(selectedRound)
  const myScores = currentUser && currentRoundId ? getPlayerScores(currentUser.id, currentRoundId) : []

  const getHoleStroke = (hole) => {
    const s = myScores.find(sc => sc.hole === hole)
    return s ? String(s.strokes) : ''
  }
  const getHolePts = (hole) => {
    const s = myScores.find(sc => sc.hole === hole)
    return s !== undefined ? s.stableford_points : null
  }

  const nineTotal = (holes) => holes.reduce((s, h) => {
    const p = getHolePts(h.hole)
    return s + (p !== null ? p : 0)
  }, 0)

  // ====== MAIN APP RENDER ======
  return (
    <div>
      {/* SHOUTOUT TOAST */}
      {shoutout && (
        <div className={`shoutout-toast ${shoutout.type === 'eagle' ? 'eagle-toast' : ''}`}>
          <div style={{ fontSize: 15, fontWeight: 500 }}>{shoutout.msg}</div>
        </div>
      )}

      {/* STATUS BAR */}
      <div className="status-bar">
        <span className="live-dot" /> The Invitational 2026 — {currentUser.nickname}
      </div>

      {/* PAGE CONTENT */}
      <div className="page-content">

        {/* ====== LEADERBOARD ====== */}
        {view === 'leaderboard' && (
          <>
            <div className="section-title">Leaderboard</div>
            <div className="section-sub">Stableford netto · 72 hål · Fullt handicap</div>
            <div className="lb-card">
              {leaderboard.map((p, i) => (
                <div className="lb-row" key={p.id}>
                  <div className="lb-team-indicator" style={{ background: p.team === 'green' ? '#6BBF7F' : '#8AB4D6' }} />
                  <div className="lb-pos">{i + 1}</div>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--surface2)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 500 }}>
                    {p.name.charAt(0)}
                  </div>
                  <div className="lb-info">
                    <div className="lb-name">{p.name}</div>
                    <div className="lb-hcp">HCP {p.hcp} · {p.nickname}</div>
                  </div>
                  <div className="lb-scores">
                    {[1,2,3,4].map(r => {
                      const rt = getPlayerRoundTotal(p.id, r)
                      return <div key={r} className="lb-round-pill">{rt || '-'}</div>
                    })}
                  </div>
                  <div className="lb-total">{getPlayerGrandTotal(p.id) || '-'}</div>
                </div>
              ))}
            </div>
            {/* Zero count */}
            <div style={{ marginTop: 16 }}>
              <div className="section-sub" style={{ marginBottom: 8 }}>Nollpoängaren (flest 0p-hål)</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[...players].sort((a,b) => getZeroCount(b.id) - getZeroCount(a.id)).map(p => (
                  <div key={p.id} style={{ background: 'var(--surface)', borderRadius: 8, padding: '6px 12px', fontFamily: 'var(--mono)', fontSize: 12 }}>
                    <span style={{ color: getZeroCount(p.id) > 5 ? 'var(--coral)' : 'var(--cream-muted)' }}>{p.nickname}: {getZeroCount(p.id)}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ====== SCORECARD ====== */}
        {view === 'scorecard' && currentCourse && (
          <>
            <div className="sc-header">
              <div>
                <div className="section-title">Scorekort</div>
                <div className="section-sub">{currentCourse.name} · Par {currentCourse.par} · {currentCourse.meters}m</div>
              </div>
            </div>
            <div className="sc-round-pills">
              {[1,2,3,4].map(r => (
                <button key={r} className={`sc-round-pill ${selectedRound === r ? 'active' : ''}`} onClick={() => setSelectedRound(r)}>
                  {ROUND_LABELS[r]}
                </button>
              ))}
            </div>

            {/* Front 9 */}
            <div className="sc-nine-header">
              <span>UT (HÅL 1–9)</span>
              <span>{nineTotal(currentCourse.holes.slice(0, 9))}p</span>
            </div>
            {currentCourse.holes.slice(0, 9).map(h => (
              <div className="sc-hole-card" key={h.hole}>
                <div className="sc-hole-num">{h.hole}</div>
                <div className="sc-hole-info">
                  <div className="sc-hole-par">Par {h.par} · Hcp {h.hcp}</div>
                  <div className="sc-hole-meters">{h.meters}m</div>
                  <div className="sc-hole-tip">{h.tip}</div>
                </div>
                <input
                  className="sc-stroke-input"
                  type="number" inputMode="numeric" pattern="[0-9]*"
                  min="1" max="15"
                  placeholder="-"
                  value={getHoleStroke(h.hole)}
                  onChange={(e) => {
                    const v = e.target.value
                    if (v && parseInt(v) > 0 && parseInt(v) <= 15) saveScore(h.hole, v)
                  }}
                />
                <div className={`sc-pts-badge pts-${getHolePts(h.hole) ?? ''}`}>
                  {getHolePts(h.hole) !== null ? getHolePts(h.hole) : ''}
                </div>
              </div>
            ))}

            {/* Back 9 */}
            <div className="sc-nine-header">
              <span>IN (HÅL 10–18)</span>
              <span>{nineTotal(currentCourse.holes.slice(9))}p</span>
            </div>
            {currentCourse.holes.slice(9).map(h => (
              <div className="sc-hole-card" key={h.hole}>
                <div className="sc-hole-num">{h.hole}</div>
                <div className="sc-hole-info">
                  <div className="sc-hole-par">Par {h.par} · Hcp {h.hcp}</div>
                  <div className="sc-hole-meters">{h.meters}m</div>
                  <div className="sc-hole-tip">{h.tip}</div>
                </div>
                <input
                  className="sc-stroke-input"
                  type="number" inputMode="numeric" pattern="[0-9]*"
                  min="1" max="15" placeholder="-"
                  value={getHoleStroke(h.hole)}
                  onChange={(e) => {
                    const v = e.target.value
                    if (v && parseInt(v) > 0 && parseInt(v) <= 15) saveScore(h.hole, v)
                  }}
                />
                <div className={`sc-pts-badge pts-${getHolePts(h.hole) ?? ''}`}>
                  {getHolePts(h.hole) !== null ? getHolePts(h.hole) : ''}
                </div>
              </div>
            ))}

            {/* Total bar */}
            <div className="sc-total-bar">
              <div className="sc-total-pts">{nineTotal(currentCourse.holes)}</div>
              <div className="sc-total-label">Stableford-poäng {ROUND_LABELS[selectedRound]}</div>
            </div>
          </>
        )}

        {/* ====== TEAM BATTLE ====== */}
        {view === 'teams' && (
          <>
            <div className="section-title">LIV Team Battle</div>
            <div className="section-sub">2 bästa scorer per runda räknas · Söndag 16–18 dubbla poäng</div>
            {['green', 'blue'].map(team => {
              const total = getTeamTotal(team)
              const teamPlayers = players.filter(p => p.team === team)
              return (
                <div key={team} className={`team-card ${team === 'green' ? 'team-green-bg' : 'team-blue-bg'}`}>
                  <div className="team-header">
                    <div className="team-title" style={{ color: team === 'green' ? '#6BBF7F' : '#8AB4D6' }}>
                      {team === 'green' ? 'Smaragderna' : 'Stålklubban'}
                    </div>
                    <div className="team-total" style={{ color: team === 'green' ? '#6BBF7F' : '#8AB4D6' }}>
                      {total || '-'}
                    </div>
                  </div>
                  <div className="team-rounds">
                    {[1,2,3,4].map(r => (
                      <div key={r} className="team-round-chip">{ROUND_LABELS[r]}: {getTeamRoundScore(team, r).total || '-'}</div>
                    ))}
                  </div>
                  <div className="team-players">
                    {teamPlayers.map(p => {
                      const pTotal = getPlayerGrandTotal(p.id)
                      const lastRound = getTeamRoundScore(team, selectedRound)
                      const isCounted = lastRound.counted.includes(p.id)
                      return (
                        <div key={p.id} className="team-p">
                          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', margin: '0 auto 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                            {p.name.charAt(0)}
                          </div>
                          <div className="team-p-name">{p.nickname}</div>
                          <div className={`team-p-score ${isCounted ? 'team-p-counted' : 'team-p-dropped'}`}>{pTotal || '-'}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </>
        )}

        {/* ====== LIVE FEED ====== */}
        {view === 'feed' && (
          <>
            <div className="section-title">Live Feed</div>
            <div className="section-sub">Birdies, eagles, nollor och annat kaos</div>
            {feed.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--cream-muted)' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🏌️</div>
                <div>Inga events än. Börja spela!</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Birdies och nollor dyker upp här automatiskt.</div>
              </div>
            )}
            {feed.map((f, i) => (
              <div key={i} className={`feed-card ${f.type}`}>
                <div className="feed-msg">{f.msg}</div>
                <div className="feed-time">{f.time}</div>
              </div>
            ))}
          </>
        )}

        {/* ====== INFO ====== */}
        {view === 'info' && (
          <>
            <div className="section-title">Helgen</div>
            <div className="section-sub">Schema, regler och all info du behöver</div>

            {/* SCHEDULE */}
            {[
              { day: 'FREDAG', items: ['12:00 – Incheckning + lunch + öl', '13:00 – R1 Skogsbanan', '~17:30 – Spa, dusch, fix', '19:00 – Middag + R1-resultat'], color: '#6BBF7F' },
              { day: 'LÖRDAG', items: ['07:00 – Frukost', '08:00 – R2 Parkbanan', '~12:30 – Lunch', '~14:00 – R3 Skogsbanan', '~18:30 – Spa + recovery-öl', '19:30 – Middag + halvtid'], color: '#E8C65A' },
              { day: 'SÖNDAG', items: ['07:30 – Frukost', '08:30 – R4 Parkbanan (Championship)', '~13:00 – Green Jacket-ceremoni', '~14:00 – Hemfärd'], color: '#E8634A' },
            ].map(d => (
              <div key={d.day} style={{ background: 'var(--surface)', borderRadius: 12, padding: 16, marginBottom: 8 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: d.color, letterSpacing: 2, marginBottom: 8 }}>{d.day}</div>
                {d.items.map((item, i) => (
                  <div key={i} style={{ fontSize: 13, color: 'var(--cream-dim)', padding: '3px 0' }}>{item}</div>
                ))}
              </div>
            ))}

            {/* COMPETITIONS */}
            <div style={{ marginTop: 20 }}>
              <div className="section-sub" style={{ fontFamily: 'var(--mono)', color: 'var(--gold)', letterSpacing: 2 }}>TÄVLINGAR</div>
              {[
                { t: 'I. The Green Jacket', d: 'Stableford 72 hål, fullt hcp. Vinnaren kröns.', c: 'var(--gold)' },
                { t: 'II. LIV Team Battle', d: '2 bästa per runda. Söndag 16-18 = dubbla poäng.', c: 'var(--green)' },
                { t: 'III. Daily Loser', d: 'Sämst per runda köper kvällens första.', c: 'var(--coral)' },
                { t: 'IV. Konsistenskungen', d: 'Lägst spridning mellan dina 4 rundor.', c: 'var(--gold-bright)' },
              ].map((comp, i) => (
                <div key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', padding: '12px 0' }}>
                  <div style={{ fontSize: 15, fontWeight: 500, color: comp.c }}>{comp.t}</div>
                  <div style={{ fontSize: 12, color: 'var(--cream-dim)', marginTop: 2 }}>{comp.d}</div>
                </div>
              ))}
            </div>

            {/* SIDE COMPS */}
            <div style={{ marginTop: 20 }}>
              <div className="section-sub" style={{ fontFamily: 'var(--mono)', color: 'var(--gold)', letterSpacing: 2 }}>SIDOTÄVLINGAR</div>
              {[
                { icon: '🏌️', t: 'Longest Drive', d: '1 hål per runda. Utdelning direkt.' },
                { icon: '🎯', t: 'Närmast Hål', d: '1 par-3 per runda. Mäts med tee.' },
                { icon: '🐦', t: 'Birdie King', d: 'Flest netto-birdies 72 hål. Utdelning söndag.' },
                { icon: '🔄', t: 'Comeback King', d: 'Störst diff bästa/sämsta 9.' },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ fontSize: 20 }}>{s.icon}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{s.t}</div>
                    <div style={{ fontSize: 11, color: 'var(--cream-muted)' }}>{s.d}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* SPECIAL RULES */}
            <div style={{ marginTop: 20 }}>
              <div className="section-sub" style={{ fontFamily: 'var(--mono)', color: 'var(--coral)', letterSpacing: 2 }}>SPECIALREGLER</div>
              <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 16 }}>
                {[
                  { k: 'ROOKIE RULE', v: 'Martin capped på 36 hcp i beräkningen.' },
                  { k: 'HOT HAND', v: '3 birdies i rad = +2 bonuspoäng.' },
                  { k: 'COLD TURKEY', v: '3 nollor i rad = -1 poäng.' },
                  { k: 'GRUDGE MATCH', v: 'R3: utmana en motståndare. +3 till lagtotalen.' },
                  { k: 'NOLLPOÄNGAREN', v: 'Löjlig hatt söndag + tacktal + runda nästa år.' },
                ].map((r, i) => (
                  <div key={i} style={{ padding: '8px 0', borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--gold)', letterSpacing: 1 }}>{r.k}</div>
                    <div style={{ fontSize: 12, color: 'var(--cream-dim)', marginTop: 2 }}>{r.v}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

      </div>

      {/* ====== BOTTOM NAVIGATION ====== */}
      <nav className="bottom-nav">
        {[
          { key: 'leaderboard', icon: '🏆', label: 'LEDARE' },
          { key: 'scorecard', icon: '📝', label: 'SCORE' },
          { key: 'teams', icon: '⚔️', label: 'LAG' },
          { key: 'feed', icon: '📡', label: 'LIVE' },
          { key: 'info', icon: '📋', label: 'INFO' },
        ].map(tab => (
          <button key={tab.key} className={`bottom-nav-btn ${view === tab.key ? 'active' : ''}`} onClick={() => setView(tab.key)}>
            <span className="nav-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
