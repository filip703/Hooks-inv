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
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [adminPlayer, setAdminPlayer] = useState(null)
  const shoutoutTimer = useRef(null)
  const chatEndRef = useRef(null)

  // Persist login
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('inv_user') : null
    if (saved) {
      try { setCurrentUser(JSON.parse(saved)) } catch(e) {}
    }
  }, [])
  useEffect(() => {
    if (currentUser && typeof window !== 'undefined') localStorage.setItem('inv_user', JSON.stringify(currentUser))
  }, [currentUser])

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

  const fetchChat = useCallback(async () => {
    const { data } = await supabase.from('inv_chat').select('*, inv_players(name, nickname)').order('created_at', { ascending: true }).limit(100)
    if (data) setChatMessages(data)
  }, [])

  useEffect(() => { fetchData(); fetchChat() }, [fetchData, fetchChat])

  // Realtime subscriptions
  useEffect(() => {
    const scoreChannel = supabase.channel('inv_scores_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inv_scores' }, (payload) => {
        fetchData()
        if (payload.new?.stableford_points >= 3) {
          const p = players.find(pl => pl.id === payload.new.player_id)
          if (p) {
            const msg = getShoutout(p.name, p.nickname, payload.new.stableford_points, 0, 0)
            if (msg) {
              const finalMsg = msg.replace('{{hole}}', payload.new.hole)
              showShoutout(finalMsg, payload.new.stableford_points >= 4 ? 'eagle' : 'birdie')
              // Auto-post to chat
              supabase.from('inv_chat').insert({ player_id: p.id, message: finalMsg, msg_type: payload.new.stableford_points >= 4 ? 'shoutout' : 'shoutout' })
            }
          }
        }
        if (payload.new?.stableford_points === 0 && payload.new?.strokes) {
          const p = players.find(pl => pl.id === payload.new.player_id)
          if (p) {
            const msg = getZeroRoast(p.nickname).replace('{{hole}}', payload.new.hole)
            supabase.from('inv_chat').insert({ player_id: p.id, message: msg, msg_type: 'roast' })
          }
        }
      }).subscribe()

    const chatChannel = supabase.channel('inv_chat_rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'inv_chat' }, () => {
        fetchChat()
      }).subscribe()

    return () => { supabase.removeChannel(scoreChannel); supabase.removeChannel(chatChannel) }
  }, [fetchData, fetchChat, players])

  // Auto-scroll chat
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMessages])

  const showShoutout = (msg, type) => {
    setShoutout({ msg, type })
    if (shoutoutTimer.current) clearTimeout(shoutoutTimer.current)
    shoutoutTimer.current = setTimeout(() => setShoutout(null), 4000)
  }

  // Helpers
  const getRoundId = (rn) => rounds.find(r => r.round_number === rn)?.id
  const getPlayerScores = (pid, rid) => scores.filter(s => s.player_id === pid && s.round_id === rid)
  const getPlayerRoundTotal = (pid, rn) => { const rid = getRoundId(rn); return rid ? getPlayerScores(pid, rid).reduce((s, sc) => s + (sc.stableford_points || 0), 0) : 0 }
  const getPlayerGrandTotal = (pid) => [1,2,3,4].reduce((s, r) => s + getPlayerRoundTotal(pid, r), 0)
  const getTeamRoundScore = (team, rn) => {
    const tp = players.filter(p => p.team === team).map(p => ({ id: p.id, score: getPlayerRoundTotal(p.id, rn) })).sort((a,b) => b.score - a.score)
    return { total: tp.slice(0,2).reduce((s,p) => s + p.score, 0), counted: tp.slice(0,2).map(p => p.id) }
  }
  const getTeamTotal = (team) => [1,2,3,4].reduce((s, r) => s + getTeamRoundScore(team, r).total, 0)
  const getZeroCount = (pid) => scores.filter(s => s.player_id === pid && s.stableford_points === 0 && s.strokes).length
  const isAdmin = currentUser?.key === 'filip'

  // Save score – works for self, or any player if admin
  const saveScore = async (playerId, roundNum, hole, strokes) => {
    const rid = getRoundId(roundNum)
    if (!rid || !strokes) return
    const player = players.find(p => p.id === playerId)
    if (!player) return
    const courseName = ROUND_COURSES[roundNum]
    const course = courses[courseName]
    const holeData = course.holes.find(h => h.hole === hole)
    const playingHcp = getPlayingHcp(Math.min(parseFloat(player.hcp), 36), course.slope)
    const pts = calcStableford(parseInt(strokes), holeData.par, playingHcp, holeData.hcp)
    await supabase.from('inv_scores').upsert({
      player_id: playerId, round_id: rid, hole, strokes: parseInt(strokes), stableford_points: pts,
    }, { onConflict: 'player_id,round_id,hole' })
    fetchData()
  }

  // Send chat message
  const sendChat = async () => {
    if (!chatInput.trim() || !currentUser) return
    await supabase.from('inv_chat').insert({ player_id: currentUser.id, message: chatInput.trim(), msg_type: 'chat' })
    setChatInput('')
  }

  // Scorecard helpers
  const scorePlayer = adminPlayer && isAdmin ? players.find(p => p.id === adminPlayer) : currentUser
  const currentCourse = courses[ROUND_COURSES[selectedRound]]
  const currentRoundId = getRoundId(selectedRound)
  const activeScores = scorePlayer && currentRoundId ? getPlayerScores(scorePlayer.id, currentRoundId) : []
  const getHoleStroke = (hole) => { const s = activeScores.find(sc => sc.hole === hole); return s ? String(s.strokes) : '' }
  const getHolePts = (hole) => { const s = activeScores.find(sc => sc.hole === hole); return s ? s.stableford_points : null }
  const nineTotal = (holes) => holes.reduce((s, h) => s + (getHolePts(h.hole) || 0), 0)
  const leaderboard = [...players].sort((a, b) => getPlayerGrandTotal(b.id) - getPlayerGrandTotal(a.id))

  // ====== LOGIN SCREEN ======
  if (!currentUser) {
    return (
      <div className="login-screen">
        <div className="login-badge">EST. 2026 · HOOKS HERRGÅRD</div>
        <h1 className="login-title">The <em>Invitational</em></h1>
        <p className="login-subtitle">Välj din profil</p>
        <div className="login-faces">
          {players.map(p => (
            <button key={p.id} className="login-face-btn" onClick={() => { setCurrentUser(p); setView('leaderboard') }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: p.team === 'green' ? 'var(--green-deep)' : 'var(--blue-deep)', margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 500, color: p.team === 'green' ? 'var(--green)' : 'var(--blue)', border: '2px solid rgba(255,255,255,0.1)' }}>
                {p.name.charAt(0)}
              </div>
              <div className="login-player-name">{p.name.split(' ')[0]}</div>
              <div className="login-player-nick">{p.nickname}</div>
            </button>
          ))}
        </div>
        <p style={{ fontSize: 11, color: 'var(--cream-muted)', marginTop: 32 }}>72 hål · 4 rundor · Oändligt med öl</p>
      </div>
    )
  }

  // ====== MAIN APP ======
  return (
    <div>
      {shoutout && <div className={`shoutout-toast ${shoutout.type === 'eagle' ? 'eagle-toast' : ''}`}><div style={{ fontSize: 15, fontWeight: 500 }}>{shoutout.msg}</div></div>}
      <div className="status-bar"><span className="live-dot" /> The Invitational — {currentUser.nickname}
        {isAdmin && <span style={{ marginLeft: 8, fontSize: 10, color: 'var(--gold)' }}>ADMIN</span>}
        <button onClick={() => { setCurrentUser(null); if(typeof window !== 'undefined') localStorage.removeItem('inv_user') }} style={{ marginLeft: 12, background: 'none', border: 'none', color: 'var(--cream-muted)', fontSize: 10, cursor: 'pointer', textDecoration: 'underline' }}>Byt</button>
      </div>
      <div className="page-content">

        {/* ====== LEADERBOARD ====== */}
        {view === 'leaderboard' && (<>
          <div className="section-title">Leaderboard</div>
          <div className="section-sub">Stableford netto · 72 hål</div>
          <div className="lb-card">
            {leaderboard.map((p, i) => (
              <div className="lb-row" key={p.id}>
                <div className="lb-team-indicator" style={{ background: p.team === 'green' ? '#6BBF7F' : '#8AB4D6' }} />
                <div className="lb-pos">{i + 1}</div>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: p.team === 'green' ? 'var(--green-deep)' : 'var(--blue-deep)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 500, color: p.team === 'green' ? 'var(--green)' : 'var(--blue)' }}>
                  {p.name.charAt(0)}
                </div>
                <div className="lb-info">
                  <div className="lb-name">{p.name}</div>
                  <div className="lb-hcp">{p.nickname} · HCP {p.hcp}</div>
                </div>
                <div className="lb-scores">
                  {[1,2,3,4].map(r => <div key={r} className="lb-round-pill">{getPlayerRoundTotal(p.id, r) || '-'}</div>)}
                </div>
                <div className="lb-total">{getPlayerGrandTotal(p.id) || '-'}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <div className="section-sub" style={{ width: '100%', marginBottom: 4 }}>💀 Nollpoängaren</div>
            {[...players].sort((a,b) => getZeroCount(b.id) - getZeroCount(a.id)).map(p => (
              <div key={p.id} style={{ background: 'var(--surface)', borderRadius: 8, padding: '5px 10px', fontFamily: 'var(--mono)', fontSize: 11, color: getZeroCount(p.id) > 5 ? 'var(--coral)' : 'var(--cream-muted)' }}>
                {p.nickname}: {getZeroCount(p.id)}
              </div>
            ))}
          </div>
        </>)}

        {/* ====== SCORECARD ====== */}
        {view === 'scorecard' && currentCourse && (<>
          <div className="sc-header">
            <div>
              <div className="section-title">Scorekort</div>
              <div className="section-sub">
                {scorePlayer?.name} · HCP {scorePlayer?.hcp} · {currentCourse.name}
              </div>
            </div>
          </div>

          {/* Admin: select player to score for */}
          {isAdmin && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
              <button onClick={() => setAdminPlayer(null)} style={{ fontFamily: 'var(--mono)', fontSize: 10, padding: '5px 10px', border: adminPlayer === null ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.1)', background: adminPlayer === null ? 'rgba(201,168,76,0.1)' : 'var(--surface)', color: adminPlayer === null ? 'var(--gold)' : 'var(--cream-muted)', borderRadius: 6, cursor: 'pointer' }}>Mig själv</button>
              {players.filter(p => p.id !== currentUser.id).map(p => (
                <button key={p.id} onClick={() => setAdminPlayer(p.id)} style={{ fontFamily: 'var(--mono)', fontSize: 10, padding: '5px 10px', border: adminPlayer === p.id ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.1)', background: adminPlayer === p.id ? 'rgba(201,168,76,0.1)' : 'var(--surface)', color: adminPlayer === p.id ? 'var(--gold)' : 'var(--cream-muted)', borderRadius: 6, cursor: 'pointer' }}>{p.name.split(' ')[0]}</button>
              ))}
            </div>
          )}

          <div className="sc-round-pills">
            {[1,2,3,4].map(r => (
              <button key={r} className={`sc-round-pill ${selectedRound === r ? 'active' : ''}`} onClick={() => setSelectedRound(r)}>{ROUND_LABELS[r]}</button>
            ))}
          </div>

          {[{ label: 'UT (1–9)', holes: currentCourse.holes.slice(0,9) }, { label: 'IN (10–18)', holes: currentCourse.holes.slice(9) }].map(nine => (
            <div key={nine.label}>
              <div className="sc-nine-header"><span>{nine.label}</span><span>{nineTotal(nine.holes)}p</span></div>
              {nine.holes.map(h => (
                <div className="sc-hole-card" key={h.hole}>
                  <div className="sc-hole-num">{h.hole}</div>
                  <div className="sc-hole-info">
                    <div className="sc-hole-par">Par {h.par} · Hcp {h.hcp}</div>
                    <div className="sc-hole-meters">{h.meters}m</div>
                    <div className="sc-hole-tip">{h.tip}</div>
                  </div>
                  <input className="sc-stroke-input" type="number" inputMode="numeric" pattern="[0-9]*" min="1" max="15" placeholder="-"
                    value={getHoleStroke(h.hole)}
                    onChange={e => { const v = e.target.value; if (v && parseInt(v) > 0 && parseInt(v) <= 15) saveScore(scorePlayer.id, selectedRound, h.hole, v) }}
                  />
                  <div className={`sc-pts-badge pts-${getHolePts(h.hole) ?? ''}`}>{getHolePts(h.hole) !== null ? getHolePts(h.hole) : ''}</div>
                </div>
              ))}
            </div>
          ))}

          <div className="sc-total-bar">
            <div className="sc-total-pts">{nineTotal(currentCourse.holes)}</div>
            <div className="sc-total-label">Stableford · {ROUND_LABELS[selectedRound]} · {scorePlayer?.nickname}</div>
          </div>
        </>)}

        {/* ====== TEAM BATTLE ====== */}
        {view === 'teams' && (<>
          <div className="section-title">LIV Team Battle</div>
          <div className="section-sub">2 bästa scorer per runda</div>
          {['green', 'blue'].map(team => {
            const total = getTeamTotal(team)
            const tp = players.filter(p => p.team === team)
            const accent = team === 'green' ? '#6BBF7F' : '#8AB4D6'
            return (
              <div key={team} className={`team-card ${team === 'green' ? 'team-green-bg' : 'team-blue-bg'}`}>
                <div className="team-header">
                  <div className="team-title" style={{ color: accent }}>{team === 'green' ? 'Smaragderna' : 'Stålklubban'}</div>
                  <div className="team-total" style={{ color: accent }}>{total || '-'}</div>
                </div>
                <div className="team-rounds">
                  {[1,2,3,4].map(r => <div key={r} className="team-round-chip">{ROUND_LABELS[r]}: {getTeamRoundScore(team, r).total || '-'}</div>)}
                </div>
                <div className="team-players">
                  {tp.map(p => {
                    const pt = getPlayerGrandTotal(p.id)
                    return (
                      <div key={p.id} className="team-p">
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', margin: '0 auto 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: accent }}>{p.name.charAt(0)}</div>
                        <div className="team-p-name">{p.nickname}</div>
                        <div className="team-p-score" style={{ color: accent }}>{pt || '-'}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </>)}

        {/* ====== CHAT / LIVE FEED ====== */}
        {view === 'feed' && (<>
          <div className="section-title">Live Feed</div>
          <div className="section-sub">Chat, birdies, nollor och annat kaos</div>
          <div style={{ background: 'var(--surface)', borderRadius: 12, maxHeight: 'calc(100vh - 260px)', overflowY: 'auto', padding: 12 }}>
            {chatMessages.length === 0 && (
              <div style={{ textAlign: 'center', padding: 32, color: 'var(--cream-muted)' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🏌️</div>
                <div style={{ fontSize: 13 }}>Inga meddelanden än.</div>
                <div style={{ fontSize: 11, marginTop: 4 }}>Birdies och nollor dyker upp automatiskt. Eller skriv något!</div>
              </div>
            )}
            {chatMessages.map((msg, i) => {
              const isMe = msg.player_id === currentUser?.id
              const isSys = msg.msg_type === 'shoutout' || msg.msg_type === 'roast' || msg.msg_type === 'system'
              const borderColor = msg.msg_type === 'shoutout' ? 'var(--green)' : msg.msg_type === 'roast' ? 'var(--coral)' : isMe ? 'var(--gold-dim)' : 'transparent'
              return (
                <div key={msg.id || i} style={{ marginBottom: 8, padding: '8px 12px', background: isSys ? 'rgba(255,255,255,0.03)' : 'var(--surface2)', borderRadius: 10, borderLeft: `3px solid ${borderColor}` }}>
                  {!isSys && (
                    <div style={{ fontSize: 11, fontWeight: 500, color: isMe ? 'var(--gold)' : 'var(--cream-dim)', marginBottom: 2 }}>
                      {msg.inv_players?.nickname || msg.inv_players?.name || 'Okänd'}
                    </div>
                  )}
                  <div style={{ fontSize: 13, lineHeight: 1.5, color: isSys ? 'var(--cream-dim)' : 'var(--cream)' }}>{msg.message}</div>
                  <div style={{ fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--cream-muted)', marginTop: 4 }}>
                    {new Date(msg.created_at).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              )
            })}
            <div ref={chatEndRef} />
          </div>
          {/* Chat input */}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') sendChat() }}
              placeholder="Skriv något..." style={{ flex: 1, background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--cream)', padding: '10px 14px', borderRadius: 10, fontSize: 14, fontFamily: 'var(--sans)', outline: 'none' }} />
            <button onClick={sendChat} style={{ background: 'var(--gold)', color: 'var(--bg)', border: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 500, fontSize: 14, cursor: 'pointer' }}>Skicka</button>
          </div>
        </>)}

        {/* ====== INFO ====== */}
        {view === 'info' && (<>
          <div className="section-title">Helgen</div>
          <div className="section-sub">Allt du behöver veta</div>
          {[
            { day: 'FREDAG', items: ['12:00 – Lunch + öl (eller 3)', '13:00 – R1 Skogsbanan', '~17:30 – Spa & fix', '19:00 – Middag + Daily Loser'], color: '#6BBF7F' },
            { day: 'LÖRDAG', items: ['07:00 – Frukost', '08:00 – R2 Parkbanan', '~12:30 – Lunch', '~14:00 – R3 Skogsbanan', '~18:30 – Spa + öl', '19:30 – Middag + halvtid'], color: '#E8C65A' },
            { day: 'SÖNDAG', items: ['07:30 – Frukost', '08:30 – R4 Parkbanan', '~13:00 – Green Jacket', '~14:00 – Hemfärd'], color: '#E8634A' },
          ].map(d => (
            <div key={d.day} style={{ background: 'var(--surface)', borderRadius: 12, padding: 14, marginBottom: 8 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: d.color, letterSpacing: 2, marginBottom: 6 }}>{d.day}</div>
              {d.items.map((it, i) => <div key={i} style={{ fontSize: 13, color: 'var(--cream-dim)', padding: '2px 0' }}>{it}</div>)}
            </div>
          ))}
          <div style={{ marginTop: 16 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--gold)', letterSpacing: 2, marginBottom: 8 }}>TÄVLINGAR</div>
            {[
              { t: 'I. The Green Jacket', d: 'Stableford 72 hål. Vinnaren kröns.', c: 'var(--gold)' },
              { t: 'II. LIV Team Battle', d: '2 bästa per runda. Dubbla poäng sön 16–18.', c: 'var(--green)' },
              { t: 'III. Daily Loser', d: 'Sämst per runda köper kvällens första.', c: 'var(--coral)' },
              { t: 'IV. Konsistenskungen', d: 'Lägst spridning mellan 4 rundor.', c: 'var(--gold-bright)' },
            ].map((c, i) => (
              <div key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', padding: '10px 0' }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: c.c }}>{c.t}</div>
                <div style={{ fontSize: 12, color: 'var(--cream-dim)', marginTop: 2 }}>{c.d}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--coral)', letterSpacing: 2, marginBottom: 8 }}>SPECIALREGLER</div>
            <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 14 }}>
              {[
                { k: 'ROOKIE RULE', v: 'Martin capped på 36 hcp.' },
                { k: 'HOT HAND', v: '3 birdies i rad = +2 bonus.' },
                { k: 'COLD TURKEY', v: '3 nollor i rad = -1 poäng.' },
                { k: 'GRUDGE MATCH', v: 'R3: utmana motståndare. +3 lag.' },
                { k: 'NOLLPOÄNGAREN', v: 'Hatt + tacktal + runda nästa år.' },
              ].map((r, i) => (
                <div key={i} style={{ padding: '6px 0', borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--gold)', letterSpacing: 1 }}>{r.k}</div>
                  <div style={{ fontSize: 12, color: 'var(--cream-dim)', marginTop: 2 }}>{r.v}</div>
                </div>
              ))}
            </div>
          </div>
        </>)}

      </div>

      {/* ====== BOTTOM NAV ====== */}
      <nav className="bottom-nav">
        {[
          { key: 'leaderboard', icon: '🏆', label: 'LEDARE' },
          { key: 'scorecard', icon: '📝', label: 'SCORE' },
          { key: 'teams', icon: '⚔️', label: 'LAG' },
          { key: 'feed', icon: '💬', label: 'CHAT' },
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
