'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { courses, getPlayingHcp, calcStableford, getShoutout, getZeroRoast } from '../lib/courses'

const RC = { 1: 'Skogsbanan', 2: 'Parkbanan', 3: 'Skogsbanan', 4: 'Parkbanan' }
const RL = { 1: 'R1 Fre', 2: 'R2 Lör FM', 3: 'R3 Lör EM', 4: 'R4 Sön' }

function Avatar({ player, size = 36 }) {
  if (!player) return null
  const bg = player.team === 'green' ? '#1A3A2A' : '#1A3550'
  const color = player.team === 'green' ? '#6BBF7F' : '#8AB4D6'
  return player.image_url 
    ? <img src={player.image_url} alt={player.name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)' }} />
    : <div style={{ width: size, height: size, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.4, fontWeight: 500, color, border: '2px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>{player.name?.charAt(0)}</div>
}

export default function Home() {
  const [user, setUser] = useState(null)
  const [view, setView] = useState('leaderboard')
  const [players, setPlayers] = useState([])
  const [rounds, setRounds] = useState([])
  const [scores, setScores] = useState([])
  const [selRound, setSelRound] = useState(1)
  const [toast, setToast] = useState(null)
  const [chat, setChat] = useState([])
  const [chatMsg, setChatMsg] = useState('')
  const [adminPid, setAdminPid] = useState(null)
  const chatEnd = useRef(null)
  const toastT = useRef(null)

  // Persist session
  useEffect(() => {
    if (typeof window === 'undefined') return
    const s = localStorage.getItem('inv_user')
    if (s) try { setUser(JSON.parse(s)) } catch(e) {}
  }, [])
  useEffect(() => {
    if (user && typeof window !== 'undefined') localStorage.setItem('inv_user', JSON.stringify(user))
  }, [user])

  const fetchAll = useCallback(async () => {
    if (!supabase) return
    const [p, r, s] = await Promise.all([
      supabase.from('inv_players').select('*').order('hcp'),
      supabase.from('inv_rounds').select('*').order('round_number'),
      supabase.from('inv_scores').select('*'),
    ])
    if (p.data) setPlayers(p.data)
    if (r.data) setRounds(r.data)
    if (s.data) setScores(s.data)
  }, [])

  const fetchChat = useCallback(async () => {
    if (!supabase) return
    const { data } = await supabase.from('inv_chat').select('*, inv_players(name, nickname, image_url)').order('created_at', { ascending: true }).limit(200)
    if (data) setChat(data)
  }, [])

  useEffect(() => { fetchAll(); fetchChat() }, [fetchAll, fetchChat])
  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }) }, [chat])

  // Realtime
  useEffect(() => {
    if (!supabase) return
    const ch1 = supabase.channel('inv_s').on('postgres_changes', { event: '*', schema: 'public', table: 'inv_scores' }, (p) => {
      fetchAll()
      if (p.new?.stableford_points >= 3) {
        const pl = players.find(x => x.id === p.new.player_id)
        if (pl) {
          const m = getShoutout(pl.name, pl.nickname, p.new.stableford_points, 0, 0)
          if (m) { const fm = m.replace('{{hole}}', p.new.hole); showToast(fm, p.new.stableford_points >= 4 ? 'eagle' : 'birdie') }
        }
      }
    }).subscribe()
    const ch2 = supabase.channel('inv_c').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'inv_chat' }, () => fetchChat()).subscribe()
    return () => { supabase.removeChannel(ch1); supabase.removeChannel(ch2) }
  }, [fetchAll, fetchChat, players])

  const showToast = (msg, type) => {
    setToast({ msg, type })
    if (toastT.current) clearTimeout(toastT.current)
    toastT.current = setTimeout(() => setToast(null), 4000)
  }

  // Helpers
  const rid = (rn) => rounds.find(r => r.round_number === rn)?.id
  const pScores = (pid, roundId) => scores.filter(s => s.player_id === pid && s.round_id === roundId)
  const pRoundPts = (pid, rn) => { const r = rid(rn); return r ? pScores(pid, r).reduce((s, x) => s + (x.stableford_points || 0), 0) : 0 }
  const pTotal = (pid) => [1,2,3,4].reduce((s, r) => s + pRoundPts(pid, r), 0)
  const teamRound = (team, rn) => {
    const ps = players.filter(p => p.team === team).map(p => ({ id: p.id, pts: pRoundPts(p.id, rn) })).sort((a,b) => b.pts - a.pts)
    return { total: ps.slice(0,2).reduce((s,p) => s + p.pts, 0), counted: ps.slice(0,2).map(p => p.id) }
  }
  const teamTotal = (team) => [1,2,3,4].reduce((s, r) => s + teamRound(team, r).total, 0)
  const zeros = (pid) => scores.filter(s => s.player_id === pid && s.stableford_points === 0 && s.strokes).length
  const isAdmin = user?.key === 'filip'
  const scoreFor = adminPid && isAdmin ? players.find(p => p.id === adminPid) : user
  const course = courses[RC[selRound]]
  const roundId = rid(selRound)
  const myScores = scoreFor && roundId ? pScores(scoreFor.id, roundId) : []
  const hStroke = (h) => { const s = myScores.find(x => x.hole === h); return s ? String(s.strokes) : '' }
  const hPts = (h) => { const s = myScores.find(x => x.hole === h); return s ? s.stableford_points : null }
  const ninePts = (holes) => holes.reduce((s, h) => s + (hPts(h.hole) || 0), 0)
  const lb = [...players].sort((a, b) => pTotal(b.id) - pTotal(a.id))

  const save = async (hole, strokes) => {
    if (!roundId || !scoreFor || !strokes) return
    const c = courses[RC[selRound]]
    const hd = c.holes.find(h => h.hole === hole)
    const phcp = getPlayingHcp(Math.min(parseFloat(scoreFor.hcp), 36), c.slope)
    const pts = calcStableford(parseInt(strokes), hd.par, phcp, hd.hcp)
    await supabase.from('inv_scores').upsert({ player_id: scoreFor.id, round_id: roundId, hole, strokes: parseInt(strokes), stableford_points: pts }, { onConflict: 'player_id,round_id,hole' })
    fetchAll()
  }

  const sendMsg = async () => {
    if (!chatMsg.trim() || !user || !supabase) return
    await supabase.from('inv_chat').insert({ player_id: user.id, message: chatMsg.trim(), msg_type: 'chat' })
    setChatMsg('')
  }

  const uploadImg = async (file) => {
    if (!file || !user || !supabase) return
    const ext = file.name.split('.').pop()
    const path = `chat/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('inv-images').upload(path, file, { contentType: file.type })
    if (!error) {
      const url = `https://swagnjpgddfakncovglo.supabase.co/storage/v1/object/public/inv-images/${path}`
      await supabase.from('inv_chat').insert({ player_id: user.id, message: '📸', image_url: url, msg_type: 'image' })
    }
  }

  // ===== LOGIN =====
  if (!user) return (
    <div className="login-screen">
      <div className="login-badge">EST. 2026 · HOOKS HERRGÅRD</div>
      <h1 className="login-title">The <em>Invitational</em></h1>
      <p className="login-subtitle">Tryck på ditt ansikte</p>
      <div className="login-faces">
        {players.map(p => (
          <button key={p.id} className="login-face-btn" onClick={() => { setUser(p); setView('leaderboard') }}>
            <Avatar player={p} size={64} />
            <div className="login-player-name">{p.name.split(' ')[0]}</div>
            <div className="login-player-nick">{p.nickname}</div>
          </button>
        ))}
      </div>
      <p style={{ fontSize: 11, color: 'var(--cream-muted)', marginTop: 32, fontStyle: 'italic' }}>"72 hål. Oändligt med öl. Och en kavaj som ingen förtjänar."</p>
    </div>
  )

  // ===== APP =====
  return (
    <div>
      {toast && <div className={`shoutout-toast ${toast.type === 'eagle' ? 'eagle-toast' : ''}`}><div style={{ fontSize: 15, fontWeight: 500 }}>{toast.msg}</div></div>}

      <div className="status-bar">
        <span className="live-dot" />
        <Avatar player={user} size={18} />
        <span style={{ marginLeft: 6 }}>{user.nickname}</span>
        {isAdmin && <span style={{ marginLeft: 6, fontSize: 9, color: 'var(--gold)', background: 'rgba(201,168,76,0.15)', padding: '2px 6px', borderRadius: 4 }}>ADMIN</span>}
        <button onClick={() => { setUser(null); if(typeof window !== 'undefined') localStorage.removeItem('inv_user') }} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--cream-muted)', fontSize: 10, cursor: 'pointer' }}>Logga ut</button>
      </div>

      <div className="page-content">

        {/* ===== LEADERBOARD ===== */}
        {view === 'leaderboard' && (<>
          <div className="section-title">Leaderboard</div>
          <div className="section-sub">Stableford netto · 72 hål</div>
          <div className="lb-card">
            {lb.map((p, i) => (
              <div className="lb-row" key={p.id} style={p.id === user?.id ? { background: 'rgba(201,168,76,0.06)' } : {}}>
                <div className="lb-team-indicator" style={{ background: p.team === 'green' ? '#6BBF7F' : '#8AB4D6' }} />
                <div className="lb-pos">{i === 0 ? '👑' : i + 1}</div>
                <Avatar player={p} size={36} />
                <div className="lb-info">
                  <div className="lb-name">{p.name}</div>
                  <div className="lb-hcp">{p.nickname} · {p.hcp}</div>
                </div>
                <div className="lb-scores" style={{ display: 'none' }}>
                  {[1,2,3,4].map(r => <div key={r} className="lb-round-pill">{pRoundPts(p.id, r) || '-'}</div>)}
                </div>
                <div className="lb-total">{pTotal(p.id) || '-'}</div>
              </div>
            ))}
          </div>
          {/* Round breakdown */}
          <div style={{ marginTop: 12, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'var(--mono)' }}>
              <thead>
                <tr style={{ color: 'var(--cream-muted)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 400 }}>Spelare</th>
                  {[1,2,3,4].map(r => <th key={r} style={{ padding: '6px 4px', fontWeight: 400, fontSize: 10 }}>{RL[r]}</th>)}
                  <th style={{ padding: '6px 8px', fontWeight: 500 }}>Tot</th>
                  <th style={{ padding: '6px 8px', fontWeight: 400, color: 'var(--coral)' }}>0p</th>
                </tr>
              </thead>
              <tbody>
                {lb.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '6px 8px', color: 'var(--cream-dim)' }}>{p.name.split(' ')[0]}</td>
                    {[1,2,3,4].map(r => <td key={r} style={{ textAlign: 'center', padding: '6px 4px', color: 'var(--cream-muted)' }}>{pRoundPts(p.id, r) || '-'}</td>)}
                    <td style={{ textAlign: 'center', padding: '6px 8px', fontWeight: 500, color: 'var(--gold-bright)' }}>{pTotal(p.id) || '-'}</td>
                    <td style={{ textAlign: 'center', padding: '6px 8px', color: zeros(p.id) > 5 ? 'var(--coral)' : 'var(--cream-muted)' }}>{zeros(p.id) || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>)}

        {/* ===== SCORECARD ===== */}
        {view === 'scorecard' && course && (<>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Avatar player={scoreFor} size={32} />
            <div>
              <div className="section-title" style={{ fontSize: 18 }}>{scoreFor?.name}</div>
              <div className="section-sub" style={{ margin: 0 }}>HCP {scoreFor?.hcp} → Playing {getPlayingHcp(Math.min(parseFloat(scoreFor?.hcp || 0), 36), course.slope)} · {course.name}</div>
            </div>
          </div>

          {isAdmin && (
            <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
              <button onClick={() => setAdminPid(null)} style={{ fontSize: 10, padding: '4px 8px', border: !adminPid ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.08)', background: !adminPid ? 'rgba(201,168,76,0.1)' : 'transparent', color: !adminPid ? 'var(--gold)' : 'var(--cream-muted)', borderRadius: 6, cursor: 'pointer', fontFamily: 'var(--mono)' }}>Mig</button>
              {players.filter(p => p.id !== user.id).map(p => (
                <button key={p.id} onClick={() => setAdminPid(p.id)} style={{ fontSize: 10, padding: '4px 8px', border: adminPid === p.id ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.08)', background: adminPid === p.id ? 'rgba(201,168,76,0.1)' : 'transparent', color: adminPid === p.id ? 'var(--gold)' : 'var(--cream-muted)', borderRadius: 6, cursor: 'pointer', fontFamily: 'var(--mono)' }}>{p.name.split(' ')[0]}</button>
              ))}
            </div>
          )}

          <div className="sc-round-pills">
            {[1,2,3,4].map(r => (
              <button key={r} className={`sc-round-pill ${selRound === r ? 'active' : ''}`} onClick={() => setSelRound(r)}>{RL[r]}</button>
            ))}
          </div>

          {[{ lbl: 'UT (1–9)', h: course.holes.slice(0,9) }, { lbl: 'IN (10–18)', h: course.holes.slice(9) }].map(nine => (
            <div key={nine.lbl}>
              <div className="sc-nine-header"><span>{nine.lbl}</span><span style={{ color: 'var(--gold)' }}>{ninePts(nine.h)}p</span></div>
              {nine.h.map(h => {
                const pts = hPts(h.hole)
                return (
                  <div className="sc-hole-card" key={h.hole}>
                    <div className="sc-hole-num" style={{ color: h.par === 3 ? 'var(--coral)' : h.par === 5 ? 'var(--green)' : 'var(--cream)' }}>{h.hole}</div>
                    <div className="sc-hole-info">
                      <div className="sc-hole-par">Par {h.par} · Hcp {h.hcp} · {h.meters}m</div>
                      <div className="sc-hole-tip">{h.tip}</div>
                    </div>
                    <input className="sc-stroke-input" type="number" inputMode="numeric" min="1" max="15" placeholder="–"
                      value={hStroke(h.hole)} onChange={e => { const v = e.target.value; if (v && +v > 0 && +v <= 15) save(h.hole, v) }} />
                    <div className={`sc-pts-badge pts-${pts ?? ''}`}>{pts !== null ? pts : ''}</div>
                  </div>
                )
              })}
            </div>
          ))}
          <div className="sc-total-bar">
            <div className="sc-total-pts">{ninePts(course.holes)}</div>
            <div className="sc-total-label">{RL[selRound]} · {scoreFor?.nickname}</div>
          </div>
        </>)}

        {/* ===== TEAMS ===== */}
        {view === 'teams' && (<>
          <div className="section-title">LIV Team Battle</div>
          <div className="section-sub">2 bästa per runda · Dubbla poäng sön 16–18</div>
          {['green', 'blue'].map(team => {
            const tot = teamTotal(team)
            const tp = players.filter(p => p.team === team)
            const c = team === 'green' ? '#6BBF7F' : '#8AB4D6'
            return (
              <div key={team} className={`team-card ${team === 'green' ? 'team-green-bg' : 'team-blue-bg'}`}>
                <div className="team-header">
                  <div className="team-title" style={{ color: c }}>{team === 'green' ? 'Smaragderna' : 'Stålklubban'}</div>
                  <div className="team-total" style={{ color: c }}>{tot || '-'}</div>
                </div>
                <div className="team-rounds">
                  {[1,2,3,4].map(r => <div key={r} className="team-round-chip">{RL[r]}: {teamRound(team, r).total || '-'}</div>)}
                </div>
                <div className="team-players">
                  {tp.map(p => (
                    <div key={p.id} className="team-p">
                      <Avatar player={p} size={44} />
                      <div className="team-p-name" style={{ marginTop: 4 }}>{p.nickname}</div>
                      <div className="team-p-score" style={{ color: c }}>{pTotal(p.id) || '-'}</div>
                      <div style={{ fontSize: 9, color: 'var(--cream-muted)', fontStyle: 'italic', marginTop: 2 }}>{p.roast?.substring(0, 50)}...</div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </>)}

        {/* ===== CHAT ===== */}
        {view === 'feed' && (<>
          <div className="section-title">Live Feed</div>
          <div className="section-sub">Chat, birdies, nollor och skitsnack</div>
          <div style={{ background: 'var(--surface)', borderRadius: 12, maxHeight: 'calc(100vh - 280px)', overflowY: 'auto', padding: 12 }}>
            {chat.length === 0 && (
              <div style={{ textAlign: 'center', padding: 32, color: 'var(--cream-muted)' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🏌️</div>
                <div style={{ fontSize: 13 }}>Tomt här. Skriv något!</div>
              </div>
            )}
            {chat.map((m, i) => {
              const isMe = m.player_id === user?.id
              const isSys = m.msg_type === 'shoutout' || m.msg_type === 'roast'
              const border = m.msg_type === 'shoutout' ? 'var(--green)' : m.msg_type === 'roast' ? 'var(--coral)' : isMe ? 'var(--gold-dim)' : 'transparent'
              return (
                <div key={m.id || i} style={{ marginBottom: 8, padding: '8px 12px', background: isSys ? 'rgba(255,255,255,0.03)' : 'var(--surface2)', borderRadius: 10, borderLeft: `3px solid ${border}` }}>
                  {!isSys && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Avatar player={m.inv_players || { name: '?', team: 'green' }} size={20} />
                      <span style={{ fontSize: 12, fontWeight: 500, color: isMe ? 'var(--gold)' : 'var(--cream-dim)' }}>{m.inv_players?.nickname || '?'}</span>
                    </div>
                  )}
                  <div style={{ fontSize: 13, lineHeight: 1.5, color: isSys ? 'var(--cream-dim)' : 'var(--cream)' }}>{m.message}</div>
                  {m.image_url && <img src={m.image_url} alt="" style={{ maxWidth: '100%', borderRadius: 8, marginTop: 6 }} />}
                  <div style={{ fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--cream-muted)', marginTop: 4 }}>
                    {new Date(m.created_at).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              )
            })}
            <div ref={chatEnd} />
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <label style={{ background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 12px', cursor: 'pointer', fontSize: 16 }}>
              📷<input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => { if(e.target.files[0]) uploadImg(e.target.files[0]) }} />
            </label>
            <input value={chatMsg} onChange={e => setChatMsg(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') sendMsg() }}
              placeholder="Skriv något..." style={{ flex: 1, background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--cream)', padding: '10px 14px', borderRadius: 10, fontSize: 14, fontFamily: 'var(--sans)', outline: 'none' }} />
            <button onClick={sendMsg} style={{ background: 'var(--gold)', color: '#0A0A08', border: 'none', borderRadius: 10, padding: '10px 16px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>↑</button>
          </div>
        </>)}

        {/* ===== INFO ===== */}
        {view === 'info' && (<>
          <div className="section-title">The Invitational 2026</div>
          <div className="section-sub">Hooks Herrgård · Allt du behöver veta</div>

          {/* Player cards with roasts */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--gold)', letterSpacing: 2, marginBottom: 8 }}>SPELARNA</div>
            {players.map(p => (
              <div key={p.id} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center' }}>
                <Avatar player={p} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{p.name} <span style={{ fontSize: 11, color: p.team === 'green' ? 'var(--green)' : 'var(--blue)', fontFamily: 'var(--mono)' }}>{p.hcp}</span></div>
                  <div style={{ fontSize: 11, color: 'var(--cream-muted)' }}>{p.nickname} · ♫ {p.song}</div>
                  <div style={{ fontSize: 11, color: 'var(--cream-dim)', fontStyle: 'italic', marginTop: 2 }}>"{p.roast}"</div>
                </div>
              </div>
            ))}
          </div>

          {/* Schedule */}
          {[
            { day: 'FREDAG', items: ['12:00 – Lunch + öl', '13:00 – R1 Skogsbanan', '~17:30 – Spa & fix', '19:00 – Middag'], color: '#6BBF7F' },
            { day: 'LÖRDAG', items: ['07:00 – Frukost', '08:00 – R2 Parkbanan', '~12:30 – Lunch', '~14:00 – R3 Skogsbanan', '~18:30 – Spa', '19:30 – Middag'], color: '#E8C65A' },
            { day: 'SÖNDAG', items: ['07:30 – Frukost', '08:30 – R4 Parkbanan', '~13:00 – Green Jacket', '~14:00 – Hemfärd'], color: '#E8634A' },
          ].map(d => (
            <div key={d.day} style={{ background: 'var(--surface)', borderRadius: 12, padding: 14, marginBottom: 8 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: d.color, letterSpacing: 2, marginBottom: 6 }}>{d.day}</div>
              {d.items.map((it, i) => <div key={i} style={{ fontSize: 13, color: 'var(--cream-dim)', padding: '2px 0' }}>{it}</div>)}
            </div>
          ))}

          {/* Competitions + rules */}
          <div style={{ marginTop: 16 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--gold)', letterSpacing: 2, marginBottom: 8 }}>TÄVLINGAR</div>
            {[
              { t: 'I. The Green Jacket', d: 'Stableford 72 hål. Fullt hcp. Vinnaren kröns.', c: 'var(--gold)' },
              { t: 'II. LIV Team Battle', d: '2 bästa per runda. Söndag 16–18 dubbla.', c: 'var(--green)' },
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
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--gold)', letterSpacing: 2, marginBottom: 8 }}>SIDOTÄVLINGAR</div>
            {['🏌️ Longest Drive – 1 hål/runda', '🎯 Närmast Hål – 1 par-3/runda', '🐦 Birdie King – flest birdies 72 hål', '🔄 Comeback King – störst diff bästa/sämsta 9'].map((s, i) => (
              <div key={i} style={{ fontSize: 13, color: 'var(--cream-dim)', padding: '4px 0' }}>{s}</div>
            ))}
          </div>
          <div style={{ marginTop: 16, background: 'var(--surface)', borderRadius: 12, padding: 14 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--coral)', letterSpacing: 2, marginBottom: 8 }}>SPECIALREGLER</div>
            {[
              { k: 'ROOKIE RULE', v: 'Martin capped på 36 hcp.' },
              { k: 'HOT HAND', v: '3 birdies i rad = +2 bonus.' },
              { k: 'COLD TURKEY', v: '3 nollor i rad = -1 poäng.' },
              { k: 'GRUDGE MATCH', v: 'R3: utmana motståndare head-to-head. +3 lag.' },
              { k: 'NOLLPOÄNGAREN', v: 'Hatt söndag + tacktal + runda nästa år.' },
            ].map((r, i) => (
              <div key={i} style={{ padding: '6px 0', borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--gold)' }}>{r.k}</span>
                <span style={{ fontSize: 12, color: 'var(--cream-dim)', marginLeft: 8 }}>{r.v}</span>
              </div>
            ))}
          </div>
        </>)}
      </div>

      {/* ===== BOTTOM NAV ===== */}
      <nav className="bottom-nav">
        {[
          { key: 'leaderboard', icon: '🏆', label: 'LEDARE' },
          { key: 'scorecard', icon: '📝', label: 'SCORE' },
          { key: 'teams', icon: '⚔️', label: 'LAG' },
          { key: 'feed', icon: '💬', label: 'CHAT' },
          { key: 'info', icon: '📋', label: 'INFO' },
        ].map(t => (
          <button key={t.key} className={`bottom-nav-btn ${view === t.key ? 'active' : ''}`} onClick={() => setView(t.key)}>
            <span className="nav-icon">{t.icon}</span>{t.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
