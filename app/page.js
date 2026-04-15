'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { courses, getPlayingHcp, calcStableford, checkStreaks, getShoutout, getZeroRoast, specialHoles, walkupMusic, pepTalks, guideUrls, getRandomRoast, venueImages, achievements, flyovers, playlists, getStrokesGiven } from '../lib/courses'
import { soundBirdie, soundEagle, soundZero, soundChat, soundScore, initAudio } from '../lib/sounds'

const RC = { 1: 'Skogsbanan', 2: 'Parkbanan', 3: 'Skogsbanan', 4: 'Parkbanan' }
const RL = { 1: 'R1 Fre', 2: 'R2 Lör FM', 3: 'R3 Lör EM', 4: 'R4 Sön' }
const DAYS = { 1: 'Fredag', 2: 'Lördag', 3: 'Lördag', 4: 'Söndag' }

function Av({ p, size = 36 }) {
  if (!p) return null
  const bg = p.team === 'green' ? '#1A3A2A' : '#1A3550'
  const c = p.team === 'green' ? '#6BBF7F' : '#8AB4D6'
  return p.image_url
    ? <img src={p.image_url} alt={p.name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)', flexShrink: 0 }} />
    : <div style={{ width: size, height: size, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size*0.38, fontWeight: 500, color: c, border: '2px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>{p.name?.charAt(0)}</div>
}

function Badge({ text, color, bg }) {
  return <span style={{ fontSize: 9, fontFamily: 'var(--mono)', color, background: bg, padding: '2px 6px', borderRadius: 4, letterSpacing: 1 }}>{text}</span>
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
  const [guideHole, setGuideHole] = useState(null)
  const [activeHole, setActiveHole] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [showNotifs, setShowNotifs] = useState(false)
  const [unread, setUnread] = useState(0)
  const [showInstall, setShowInstall] = useState(false)
  const [splash, setSplash] = useState(true)
  const [pep] = useState(pepTalks[Math.floor(Math.random() * pepTalks.length)])
  const chatEnd = useRef(null)
  const toastT = useRef(null)
  const fileRef = useRef(null)

  useEffect(() => { if (typeof window !== 'undefined') { const s = localStorage.getItem('inv_user'); if (s) try { setUser(JSON.parse(s)) } catch(e) {} } }, [])
  useEffect(() => { if (user && typeof window !== 'undefined') localStorage.setItem('inv_user', JSON.stringify(user)) }, [user])
  // Show iOS install prompt if not in standalone mode
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone
      const dismissed = localStorage.getItem('inv_install_dismissed')
      if (!isStandalone && !dismissed) setShowInstall(true)
    }
  }, [])
  // Splash screen timer
  useEffect(() => {
    const t = setTimeout(() => setSplash(false), 2800)
    return () => clearTimeout(t)
  }, [])

  const fetchAll = useCallback(async () => {
    if (!supabase) return
    const [p, r, s] = await Promise.all([supabase.from('inv_players').select('*').order('hcp'), supabase.from('inv_rounds').select('*').order('round_number'), supabase.from('inv_scores').select('*')])
    if (p.data) setPlayers(p.data); if (r.data) setRounds(r.data); if (s.data) setScores(s.data)
  }, [])
  const fetchChat = useCallback(async () => {
    if (!supabase) return
    const { data } = await supabase.from('inv_chat').select('*, inv_players(name, nickname, image_url, team)').order('created_at', { ascending: true }).limit(200)
    if (data) setChat(data)
  }, [])
  useEffect(() => { fetchAll(); fetchChat() }, [fetchAll, fetchChat])
  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }) }, [chat])

  // Realtime
  useEffect(() => {
    if (!supabase) return
    const c1 = supabase.channel('s1').on('postgres_changes', { event: '*', schema: 'public', table: 'inv_scores' }, p => {
      fetchAll()
      if (p.new?.player_id !== user?.id) {
        if (p.new?.stableford_points >= 3) {
          const pl = players.find(x => x.id === p.new.player_id)
          if (pl) { const m = getShoutout(pl.name, pl.nickname, p.new.stableford_points); if (m) showToast(m, p.new.stableford_points >= 4 ? 'eagle' : 'birdie') }
        } else if (p.new?.stableford_points === 0 && p.new?.strokes) {
          const pl = players.find(x => x.id === p.new.player_id)
          if (pl) { const m = getZeroRoast(pl.nickname); addNotif(m, 'zero'); soundZero() }
        }
      }
    }).subscribe()
    const c2 = supabase.channel('c1').on('postgres_changes', { event: '*', schema: 'public', table: 'inv_chat' }, (p) => { setTimeout(() => fetchChat(), 300); if (p.new?.player_id !== user?.id) soundChat() }).subscribe()
    return () => { supabase.removeChannel(c1); supabase.removeChannel(c2) }
  }, [fetchAll, fetchChat, players])

  const addNotif = (msg, type) => {
    const n = { id: Date.now(), msg, type, time: new Date().toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }) }
    setNotifications(prev => [n, ...prev].slice(0, 50))
    setUnread(prev => prev + 1)
  }
  const showToast = (msg, type) => {
    setToast({ msg, type })
    addNotif(msg, type)
    if (toastT.current) clearTimeout(toastT.current)
    toastT.current = setTimeout(() => setToast(null), 4500)
    // Sound effects
    if (type === 'eagle') soundEagle()
    else if (type === 'birdie') soundBirdie()
    else if (type === 'zero') soundZero()
  }

  // Core helpers
  const rid = rn => rounds.find(r => r.round_number === rn)?.id
  const pSc = (pid, roundId) => scores.filter(s => s.player_id === pid && s.round_id === roundId)
  const pRoundRaw = (pid, rn) => { const r = rid(rn); return r ? pSc(pid, r).reduce((s, x) => s + (x.stableford_points || 0), 0) : 0 }

  // Double points for holes 16-18 in team battle
  const pRoundTeamPts = (pid, rn) => {
    const r = rid(rn); if (!r) return 0
    const sc = pSc(pid, r)
    return sc.reduce((s, x) => {
      const mult = x.hole >= 16 ? 2 : 1
      return s + (x.stableford_points || 0) * mult
    }, 0)
  }

  // Streak bonus for a round
  const pRoundBonus = (pid, rn) => {
    const r = rid(rn); if (!r) return 0
    const sc = pSc(pid, r).filter(x => x.strokes).sort((a,b) => a.hole - b.hole).map(x => ({ hole: x.hole, pts: x.stableford_points }))
    const { hotHand, coldTurkey } = checkStreaks(sc)
    return (hotHand * 2) + (coldTurkey * -1)
  }

  // Individual total = raw pts + streak bonuses
  const pTotal = pid => [1,2,3,4].reduce((s, r) => s + pRoundRaw(pid, r) + pRoundBonus(pid, r), 0)
  // Team uses double-pts scoring
  const teamRound = (team, rn) => {
    const ps = players.filter(p => p.team === team).map(p => ({ id: p.id, pts: pRoundTeamPts(p.id, rn) })).sort((a,b) => b.pts - a.pts)
    return { total: ps.slice(0,2).reduce((s,p) => s + p.pts, 0), counted: ps.slice(0,2).map(p => p.id) }
  }
  const teamTotal = team => [1,2,3,4].reduce((s, r) => s + teamRound(team, r).total, 0)
  const zeros = pid => scores.filter(s => s.player_id === pid && s.stableford_points === 0 && s.strokes).length
  const isAdmin = user?.key === 'filip'
  const isSpectator = user?.key === 'spectator'
  const activePlayers = players.filter(p => p.key !== 'spectator')

  // Scorecard state
  const scoreFor = adminPid && isAdmin ? players.find(p => p.id === adminPid) : user
  const course = courses[RC[selRound]]
  const roundId = rid(selRound)
  const myScores = scoreFor && roundId ? pSc(scoreFor.id, roundId) : []
  const hStr = h => { const s = myScores.find(x => x.hole === h); return s ? String(s.strokes) : '' }
  const hPts = h => { const s = myScores.find(x => x.hole === h); return s ? s.stableford_points : null }
  const ninePts = holes => holes.reduce((s, h) => s + (hPts(h.hole) || 0), 0)
  const lb = [...activePlayers].sort((a, b) => pTotal(b.id) - pTotal(a.id))
  const sp = specialHoles[selRound] || {}
  const nextHole = course ? course.holes.find(h => !hStr(h.hole))?.hole : null

  const save = async (hole, strokes) => {
    if (!roundId || !scoreFor || !strokes || !supabase) return
    const c = courses[RC[selRound]]
    const hd = c.holes.find(h => h.hole === hole)
    const phcp = getPlayingHcp(Math.min(parseFloat(scoreFor.hcp), 36), c.slope)
    const pts = calcStableford(parseInt(strokes), hd.par, phcp, hd.hcp)
    await supabase.from('inv_scores').upsert({ player_id: scoreFor.id, round_id: roundId, hole, strokes: parseInt(strokes), stableford_points: pts }, { onConflict: 'player_id,round_id,hole' })
    // Sound + shoutout
    if (pts >= 3) {
      const m = getShoutout(scoreFor.name, scoreFor.nickname, pts)
      if (m) { showToast(m.replace('{{hole}}', hole), pts >= 4 ? 'eagle' : 'birdie'); supabase.from('inv_chat').insert({ player_id: scoreFor.id, message: m.replace('{{hole}}', hole), msg_type: 'shoutout' }) }
    } else if (pts === 0) {
      const m = getZeroRoast(scoreFor.nickname).replace('{{hole}}', hole)
      showToast(m, 'zero')
      supabase.from('inv_chat').insert({ player_id: scoreFor.id, message: m, msg_type: 'roast' })
    } else {
      soundScore()
    }
    fetchAll()
  }

  const sendMsg = async () => {
    if (!chatMsg.trim() || !user || !supabase) return
    const msg = chatMsg.trim()
    setChatMsg('')
    // Optimistic: add immediately so sender sees it
    setChat(prev => [...prev, { id: 'tmp-' + Date.now(), player_id: user.id, message: msg, msg_type: 'chat', created_at: new Date().toISOString(), inv_players: { name: user.name, nickname: user.nickname, image_url: user.image_url, team: user.team } }])
    await supabase.from('inv_chat').insert({ player_id: user.id, message: msg, msg_type: 'chat' })
    fetchChat()
  }
  const uploadImg = async file => {
    if (!file || !user || !supabase) return
    const path = `chat/${Date.now()}.${file.name.split('.').pop()}`
    const { error } = await supabase.storage.from('inv-images').upload(path, file, { contentType: file.type })
    if (!error) {
      const url = `https://swagnjpgddfakncovglo.supabase.co/storage/v1/object/public/inv-images/${path}`
      await supabase.from('inv_chat').insert({ player_id: user.id, message: '📸', image_url: url, msg_type: 'image' })
      fetchChat()
    }
  }

  // ===== LOGIN =====
  // ===== SPLASH SCREEN =====
  if (splash) return (
    <div className="splash-screen">
      <div className="splash-badge">
        <img src="/dio-badge.png" alt="DIO" className="splash-img" />
      </div>
      <div className="splash-year">2026</div>
      <div className="splash-location">HOOKS HERRGÅRD · SMÅLAND</div>
    </div>
  )

  // ===== LOGIN =====
  if (!user) return (
    <div className="login-screen">
      {/* iOS Install Prompt */}
      {showInstall && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--surface)', borderTop: '1px solid var(--gold-dim)', padding: '16px', zIndex: 500, paddingBottom: 'calc(16px + var(--safe-bottom))' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, maxWidth: 400, margin: '0 auto' }}>
            <div style={{ fontSize: 28, flexShrink: 0 }}>📲</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cream)', marginBottom: 4 }}>Installera appen!</div>
              <div style={{ fontSize: 12, color: 'var(--cream-dim)', lineHeight: 1.5 }}>
                Tryck <span style={{ fontSize: 16 }}>⎋</span> (dela-knappen) → <strong>"Lägg till på hemskärmen"</strong>
              </div>
            </div>
            <button onClick={() => { setShowInstall(false); localStorage?.setItem('inv_install_dismissed', '1') }} style={{ background: 'none', border: 'none', color: 'var(--cream-muted)', fontSize: 18, cursor: 'pointer', padding: '0 4px' }}>×</button>
          </div>
        </div>
      )}
      <div className="login-badge">DOUCHE INVITATIONAL ONLY · EST. 2026</div>
      <h1 className="login-title">Douche Invitational <em>Only</em></h1>
      <p className="login-subtitle">Tryck på ditt ansikte för att börja</p>
      <div className="login-faces">
        {activePlayers.map(p => (
          <button key={p.id} className="login-face-btn" onClick={() => { initAudio(); setUser(p); setView('leaderboard') }}>
            <Av p={p} size={64} />
            <div className="login-player-name">{p.name.split(' ')[0]}</div>
            <div className="login-player-nick">{p.nickname}</div>
          </button>
        ))}
      </div>
      {/* Spectator login separate */}
      {players.find(p => p.key === 'spectator') && (
        <button onClick={() => { initAudio(); setUser(players.find(p => p.key === 'spectator')); setView('leaderboard') }}
          style={{ marginTop: 16, background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 24px', color: 'var(--cream-muted)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--mono)' }}>
          👀 Gå med som Åskådare
        </button>
      )}
      <div style={{ maxWidth: 280, margin: '24px auto 0', padding: 16, background: 'var(--surface)', borderRadius: 12, textAlign: 'center' }}>
        <div style={{ fontSize: 12, color: 'var(--cream-dim)', fontStyle: 'italic', lineHeight: 1.6 }}>"{pep}"</div>
      </div>
    </div>
  )

  // ===== APP =====
  return (
    <div>
      {toast && <div className={`shoutout-toast ${toast.type === 'eagle' ? 'eagle-toast' : toast.type === 'zero' ? 'zero-toast' : ''}`}><div style={{ fontSize: 15, fontWeight: 500 }}>{toast.msg}</div></div>}

      {/* BANGUIDE MODAL */}
      {guideHole && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 300, display: 'flex', flexDirection: 'column', overflowY: 'auto' }} onClick={() => setGuideHole(null)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 1 }}>
            <div>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 16, color: 'var(--gold)', fontWeight: 500 }}>Hål {guideHole}</span>
              <span style={{ fontSize: 12, color: 'var(--cream-dim)', marginLeft: 8 }}>{course?.name} · Par {course?.holes.find(h=>h.hole===guideHole)?.par} · {course?.holes.find(h=>h.hole===guideHole)?.meters}m</span>
            </div>
            <button onClick={() => setGuideHole(null)} style={{ background: 'none', border: 'none', color: 'var(--cream)', fontSize: 28, cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}>×</button>
          </div>
          {/* Flyover video */}
          {flyovers[RC[selRound]]?.[guideHole] && (
            <div style={{ padding: '8px 16px 0' }} onClick={e => e.stopPropagation()}>
              <video src={flyovers[RC[selRound]][guideHole]} controls playsInline autoPlay muted
                style={{ width: '100%', borderRadius: 12, maxHeight: '40vh', background: '#000' }} />
              <div style={{ fontSize: 10, color: 'var(--cream-muted)', textAlign: 'center', marginTop: 4 }}>3D Flyover · LiveCaddie</div>
            </div>
          )}
          <div style={{ padding: '12px 16px' }}>
            <div style={{ fontSize: 13, color: 'var(--cream-dim)', fontStyle: 'italic', marginBottom: 12 }}>{course?.holes.find(h=>h.hole===guideHole)?.tip}</div>
          </div>
          {/* All players on this hole */}
          <div style={{ padding: '0 16px', paddingBottom: 24 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--cream-muted)', letterSpacing: 1, marginBottom: 6 }}>ALLA PÅ DETTA HÅL</div>
            {players.filter(p => p.key !== 'spectator').map(p => {
              const s = roundId ? pSc(p.id, roundId).find(x => x.hole === guideHole) : null
              return (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <Av p={p} size={24} />
                  <div style={{ flex: 1, fontSize: 12, color: 'var(--cream-dim)' }}>{p.nickname}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 14, color: s?.strokes ? 'var(--cream)' : 'var(--cream-muted)' }}>{s?.strokes || '–'}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 14, minWidth: 28, textAlign: 'center', fontWeight: 500, color: s?.stableford_points >= 3 ? 'var(--green)' : s?.stableford_points === 0 ? 'var(--coral)' : 'var(--cream-muted)' }}>{s?.stableford_points ?? ''}{s?.stableford_points != null ? 'p' : ''}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}
      {/* FULLSCREEN HOLE SCORING */}
      {activeHole && course && !isSpectator && (() => {
        const h = course.holes.find(x => x.hole === activeHole)
        if (!h) return null
        const pts = hPts(h.hole)
        const strokes = hStr(h.hole)
        const currentVal = strokes ? parseInt(strokes) : h.par
        const isLD = h.hole === sp.ld
        const isNP = h.hole === sp.np
        const isDouble = h.hole >= (sp.doubleStart || 16)
        const flyUrl = flyovers[RC[selRound]]?.[h.hole]
        const prevHole = h.hole > 1 ? h.hole - 1 : null
        const nextH = h.hole < 18 ? h.hole + 1 : null
        return (
          <div style={{ position: 'fixed', inset: 0, background: 'var(--bg)', zIndex: 400, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Top bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--surface)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <button onClick={() => setActiveHole(null)} style={{ background: 'none', border: 'none', color: 'var(--cream)', fontSize: 16, cursor: 'pointer' }}>← Alla hål</button>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--cream-muted)' }}>{RL[selRound]} · {course.name}</div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
              {/* Hole number & info */}
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 56, fontFamily: 'var(--serif)', fontWeight: 500, color: h.par === 3 ? 'var(--coral)' : h.par === 5 ? 'var(--green)' : 'var(--cream)' }}>{h.hole}</div>
                <div style={{ fontSize: 14, color: 'var(--cream-dim)', marginTop: -4 }}>Par {h.par} · {h.meters}m · Hcp {h.hcp}</div>
                {/* Extra strokes indicator */}
                {(() => {
                  const phcp = getPlayingHcp(Math.min(parseFloat(scoreFor?.hcp || 0), 36), course.slope)
                  const sg = getStrokesGiven(phcp, h.hcp)
                  return sg > 0 ? (
                    <div style={{ marginTop: 6, display: 'flex', justifyContent: 'center', gap: 4 }}>
                      {Array.from({length: sg}).map((_, i) => <span key={i} style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: 'var(--green)' }} />)}
                      <span style={{ fontSize: 12, color: 'var(--green)', marginLeft: 4, fontWeight: 500 }}>+{sg} slag</span>
                    </div>
                  ) : null
                })()}
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 8 }}>
                  {isLD && <Badge text=" 🏌️ LONGEST DRIVE " color="var(--gold)" bg="rgba(201,168,76,0.15)" />}
                  {isNP && <Badge text=" 🎯 NÄRMAST PIN " color="var(--green)" bg="rgba(107,191,127,0.15)" />}
                  {isDouble && <Badge text=" ⚡ DUBBLA POÄNG " color="var(--coral)" bg="rgba(232,99,74,0.15)" />}
                </div>
                <div style={{ fontSize: 13, color: 'var(--cream-muted)', fontStyle: 'italic', marginTop: 8 }}>{h.tip}</div>
              </div>

              {/* Flyover mini */}
              {flyUrl && (
                <div style={{ marginBottom: 16 }}>
                  <video src={flyUrl} controls playsInline muted style={{ width: '100%', borderRadius: 12, maxHeight: 180, background: '#000' }} />
                </div>
              )}

              {/* BIG SCORE INPUT */}
              <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 24, marginBottom: 16 }}>
                <div style={{ textAlign: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--cream-muted)', letterSpacing: 1 }}>SLAG</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                  <button onClick={() => { if (currentVal > 1) save(h.hole, currentVal - 1) }}
                    style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--cream)', fontSize: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                  <div onClick={() => { if (!strokes) save(h.hole, h.par) }}
                    style={{ width: 80, height: 80, borderRadius: 20, background: strokes ? 'var(--surface2)' : 'rgba(201,168,76,0.1)', border: strokes ? '2px solid rgba(255,255,255,0.1)' : '2px solid var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', cursor: strokes ? 'default' : 'pointer' }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 36, fontWeight: 500, color: strokes ? 'var(--cream)' : 'var(--gold)' }}>{strokes || h.par}</div>
                    {!strokes && <div style={{ fontSize: 9, color: 'var(--gold)', marginTop: -4 }}>TRYCK</div>}
                  </div>
                  <button onClick={() => { if (currentVal < 15) save(h.hole, currentVal + 1) }}
                    style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--cream)', fontSize: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                </div>
                {/* Points display */}
                {pts !== null && (
                  <div style={{ textAlign: 'center', marginTop: 16 }}>
                    <span style={{ fontSize: 32, fontFamily: 'var(--mono)', fontWeight: 500, color: pts === 0 ? 'var(--coral)' : pts >= 3 ? 'var(--green)' : pts >= 4 ? 'var(--gold-bright)' : 'var(--cream)' }}>
                      {isDouble ? pts * 2 : pts}p
                    </span>
                    {isDouble && <span style={{ fontSize: 14, color: 'var(--coral)', marginLeft: 6 }}>2×</span>}
                  </div>
                )}
              </div>

              {/* Others on this hole */}
              <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 12 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--cream-muted)', letterSpacing: 1, marginBottom: 6 }}>ALLA PÅ HÅL {h.hole}</div>
                {activePlayers.filter(p => p.id !== scoreFor?.id).map(p => {
                  const s = roundId ? pSc(p.id, roundId).find(x => x.hole === h.hole) : null
                  return (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <Av p={p} size={24} />
                      <div style={{ flex: 1, fontSize: 13, color: 'var(--cream-dim)' }}>{p.nickname}</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 14 }}>{s?.strokes || '–'}</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 14, minWidth: 28, textAlign: 'right', color: s?.stableford_points >= 3 ? 'var(--green)' : s?.stableford_points === 0 ? 'var(--coral)' : 'var(--cream-muted)' }}>{s?.stableford_points != null ? s.stableford_points + 'p' : ''}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Bottom nav: prev / next */}
            <div style={{ display: 'flex', gap: 8, padding: '12px 16px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0))', background: 'var(--surface)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button onClick={() => prevHole && setActiveHole(prevHole)} disabled={!prevHole}
                style={{ flex: 1, padding: '14px 0', borderRadius: 12, background: prevHole ? 'var(--surface2)' : 'transparent', border: '1px solid rgba(255,255,255,0.06)', color: prevHole ? 'var(--cream)' : 'var(--cream-muted)', fontSize: 14, cursor: prevHole ? 'pointer' : 'default', opacity: prevHole ? 1 : 0.3 }}>← Hål {prevHole || ''}</button>
              <button onClick={() => nextH ? setActiveHole(nextH) : setActiveHole(null)}
                style={{ flex: 1, padding: '14px 0', borderRadius: 12, background: 'var(--gold)', border: 'none', color: '#0A0A08', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>{nextH ? `Hål ${nextH} →` : '✓ Klar'}</button>
            </div>
          </div>
        )
      })()}

      <div className="status-bar" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span className="live-dot" /><Av p={user} size={18} /><span>{user.nickname}</span>
        {isAdmin && <Badge text="ADMIN" color="var(--gold)" bg="rgba(201,168,76,0.15)" />}
        {/* Notification bell */}
        <button onClick={() => { setShowNotifs(!showNotifs); setUnread(0) }} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: unread > 0 ? 'var(--gold)' : 'var(--cream-muted)', fontSize: 16, cursor: 'pointer', position: 'relative', padding: '4px' }}>
          🔔
          {unread > 0 && <span style={{ position: 'absolute', top: 0, right: 0, background: 'var(--coral)', color: '#fff', fontSize: 8, fontWeight: 600, borderRadius: '50%', width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unread > 9 ? '9+' : unread}</span>}
        </button>
        <button onClick={() => { setUser(null); localStorage?.removeItem('inv_user') }} style={{ background: 'none', border: 'none', color: 'var(--cream-muted)', fontSize: 10, cursor: 'pointer' }}>Byt</button>
      </div>

      {/* Notification Center Panel */}
      {showNotifs && (
        <div style={{ position: 'fixed', top: 36, right: 8, width: 'calc(100vw - 16px)', maxWidth: 340, maxHeight: '60vh', background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, zIndex: 250, overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--gold)', letterSpacing: 1 }}>NOTISER</span>
            {notifications.length > 0 && <button onClick={() => setNotifications([])} style={{ background: 'none', border: 'none', color: 'var(--cream-muted)', fontSize: 10, cursor: 'pointer' }}>Rensa</button>}
          </div>
          {notifications.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: 'var(--cream-muted)', fontSize: 12 }}>Inga notiser än</div>}
          {notifications.map(n => (
            <div key={n.id} style={{ padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)', borderLeft: `3px solid ${n.type === 'eagle' ? 'var(--gold-bright)' : n.type === 'birdie' ? 'var(--green)' : n.type === 'zero' ? 'var(--coral)' : 'var(--cream-muted)'}` }}>
              <div style={{ fontSize: 12, color: 'var(--cream-dim)', lineHeight: 1.4 }}>{n.msg}</div>
              <div style={{ fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--cream-muted)', marginTop: 2 }}>{n.time}</div>
            </div>
          ))}
        </div>
      )}

      <div className="page-content" onClick={() => showNotifs && setShowNotifs(false)}>

        {/* ===== LEADERBOARD ===== */}
        {view === 'leaderboard' && (<>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div className="section-title">Leaderboard</div>
            <div className="section-sub">Stableford netto · 72 hål · Hot Hand +2 · Cold Turkey -1</div>
          </div>
          <div className="lb-card">
            {lb.map((p, i) => {
              const tot = pTotal(p.id)
              const bonus = [1,2,3,4].reduce((s, r) => s + pRoundBonus(p.id, r), 0)
              return (
                <div className="lb-row" key={p.id} style={p.id === user?.id ? { background: 'rgba(201,168,76,0.06)' } : {}}>
                  <div className="lb-team-indicator" style={{ background: p.team === 'green' ? '#6BBF7F' : '#8AB4D6' }} />
                  <div className="lb-pos">{i === 0 && tot > 0 ? '👑' : i + 1}</div>
                  <Av p={p} size={38} />
                  <div className="lb-info">
                    <div className="lb-name">{p.name}</div>
                    <div className="lb-hcp">{p.nickname} · {p.hcp}
                      {bonus !== 0 && <span style={{ marginLeft: 4, fontSize: 10, color: bonus > 0 ? 'var(--green)' : 'var(--coral)' }}>{bonus > 0 ? '+' : ''}{bonus} streak</span>}
                    </div>
                  </div>
                  <div className="lb-total">{tot || '-'}</div>
                </div>
              )
            })}
          </div>
          {/* Compact round table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: 'var(--mono)', marginTop: 12 }}>
            <thead><tr style={{ color: 'var(--cream-muted)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <th style={{ textAlign: 'left', padding: '6px 4px', fontWeight: 400 }}></th>
              {[1,2,3,4].map(r => <th key={r} style={{ padding: '6px 2px', fontWeight: 400, fontSize: 9 }}>{RL[r]}</th>)}
              <th style={{ padding: '6px 4px', fontWeight: 500 }}>Tot</th>
              <th style={{ padding: '6px 4px', color: 'var(--coral)' }}>💀</th>
            </tr></thead>
            <tbody>{lb.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '5px 4px', color: 'var(--cream-dim)' }}>{p.name.split(' ')[0]}</td>
                {[1,2,3,4].map(r => <td key={r} style={{ textAlign: 'center', padding: '5px 2px', color: 'var(--cream-muted)' }}>{pRoundRaw(p.id, r) || '-'}</td>)}
                <td style={{ textAlign: 'center', padding: '5px 4px', fontWeight: 500, color: 'var(--gold-bright)' }}>{pTotal(p.id) || '-'}</td>
                <td style={{ textAlign: 'center', padding: '5px 4px', color: zeros(p.id) > 5 ? 'var(--coral)' : 'var(--cream-muted)' }}>{zeros(p.id) || '-'}</td>
              </tr>
            ))}</tbody>
          </table>
        </>)}

        {/* ===== SCORECARD ===== */}
        {view === 'scorecard' && course && isSpectator && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>👀</div>
            <div className="section-title">Spectator Mode</div>
            <div style={{ fontSize: 13, color: 'var(--cream-muted)', marginTop: 8 }}>Du kan följa score i leaderboard och chatta, men inte mata in resultat.</div>
          </div>
        )}
        {view === 'scorecard' && course && !isSpectator && (<>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <Av p={scoreFor} size={36} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 500 }}>{scoreFor?.name}</div>
              <div style={{ fontSize: 11, color: 'var(--cream-muted)' }}>HCP {scoreFor?.hcp} → Spelhcp {getPlayingHcp(Math.min(parseFloat(scoreFor?.hcp || 0), 36), course.slope)} · {course.name}</div>
            </div>
          </div>

          {isAdmin && <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
            <button onClick={() => setAdminPid(null)} style={{ fontSize: 9, padding: '3px 7px', border: !adminPid ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.06)', background: !adminPid ? 'rgba(201,168,76,0.1)' : 'transparent', color: !adminPid ? 'var(--gold)' : 'var(--cream-muted)', borderRadius: 5, cursor: 'pointer', fontFamily: 'var(--mono)' }}>Mig</button>
            {players.filter(p => p.id !== user.id).map(p => (
              <button key={p.id} onClick={() => setAdminPid(p.id)} style={{ fontSize: 9, padding: '3px 7px', border: adminPid === p.id ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.06)', background: adminPid === p.id ? 'rgba(201,168,76,0.1)' : 'transparent', color: adminPid === p.id ? 'var(--gold)' : 'var(--cream-muted)', borderRadius: 5, cursor: 'pointer', fontFamily: 'var(--mono)' }}>{p.name.split(' ')[0]}</button>
            ))}
          </div>}

          <div className="sc-round-pills">
            {[1,2,3,4].map(r => <button key={r} className={`sc-round-pill ${selRound === r ? 'active' : ''}`} onClick={() => setSelRound(r)}>{RL[r]}</button>)}
          </div>

          {/* Quick start button */}
          <button onClick={() => setActiveHole(nextHole || 1)} style={{ width: '100%', padding: '14px', background: 'var(--gold)', color: '#0A0A08', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: 'pointer', marginTop: 8, marginBottom: 12 }}>
            {nextHole ? `▶ Hål ${nextHole} – Registrera score` : '▶ Starta runda – Hål 1'}
          </button>

          {/* Special holes banner */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
            <Badge text={`🏌️ LD: HÅL ${sp.ld}`} color="var(--gold)" bg="rgba(201,168,76,0.12)" />
            <Badge text={`🎯 NP: HÅL ${sp.np}`} color="var(--green)" bg="rgba(107,191,127,0.12)" />
            <Badge text={`⚡ 2x: HÅL ${sp.doubleStart}-18`} color="var(--coral)" bg="rgba(232,99,74,0.12)" />
          </div>

          {[{ lbl: 'UT (1–9)', h: course.holes.slice(0,9) }, { lbl: 'IN (10–18)', h: course.holes.slice(9) }].map(nine => (
            <div key={nine.lbl}>
              <div className="sc-nine-header"><span>{nine.lbl}</span><span style={{ color: 'var(--gold)' }}>{ninePts(nine.h)}p</span></div>
              {nine.h.map(h => {
                const pts = hPts(h.hole)
                const strokes = hStr(h.hole)
                const isLD = h.hole === sp.ld
                const isNP = h.hole === sp.np
                const isDouble = h.hole >= sp.doubleStart
                const isNext = h.hole === nextHole
                const accent = isLD ? 'var(--gold)' : isNP ? 'var(--green)' : isDouble ? 'var(--coral)' : null
                const currentVal = strokes ? parseInt(strokes) : h.par
                return (
                  <div className="sc-hole-card" key={h.hole} id={`hole-${h.hole}`} style={{
                    borderLeft: accent ? `3px solid ${accent}` : isNext ? '3px solid rgba(201,168,76,0.4)' : '3px solid transparent',
                    background: isNext ? 'var(--surface2)' : isDouble ? 'rgba(232,99,74,0.03)' : 'var(--surface)',
                    gridTemplateColumns: '36px 1fr auto auto',
                  }}>
                    <div className="sc-hole-num" style={{ color: h.par === 3 ? 'var(--coral)' : h.par === 5 ? 'var(--green)' : 'var(--cream)', cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: 3 }} onClick={() => setActiveHole(h.hole)}>{h.hole}</div>
                    <div className="sc-hole-info">
                      <div className="sc-hole-par">
                        Par {h.par} · {h.meters}m
                        {(() => { const sg = getStrokesGiven(getPlayingHcp(Math.min(parseFloat(scoreFor?.hcp||0),36), course.slope), h.hcp); return sg > 0 ? <span style={{ color: 'var(--green)', fontWeight: 500 }}> {'●'.repeat(sg)}</span> : null })()}
                        {isLD && <Badge text=" LD " color="var(--gold)" bg="rgba(201,168,76,0.2)" />}
                        {isNP && <Badge text=" NP " color="var(--green)" bg="rgba(107,191,127,0.2)" />}
                        {isDouble && <Badge text=" 2× " color="var(--coral)" bg="rgba(232,99,74,0.2)" />}
                      </div>
                      <div className="sc-hole-tip">{h.tip}</div>
                    </div>
                    {/* +/- Score input defaulting to par */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                      <button onClick={() => { if (currentVal > 1) save(h.hole, currentVal - 1) }} style={{ width: 28, height: 36, background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px 0 0 8px', color: 'var(--cream)', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                      <div onClick={() => { if (!strokes) save(h.hole, h.par) }} style={{ width: 36, height: 36, background: strokes ? 'var(--surface3)' : 'var(--surface2)', border: '1px solid rgba(255,255,255,0.08)', borderLeft: 'none', borderRight: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 500, color: strokes ? 'var(--cream)' : 'var(--cream-muted)', cursor: strokes ? 'default' : 'pointer' }}>
                        {strokes || h.par}
                      </div>
                      <button onClick={() => { if (currentVal < 15) save(h.hole, currentVal + 1) }} style={{ width: 28, height: 36, background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0 8px 8px 0', color: 'var(--cream)', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                    </div>
                    <div style={{ minWidth: 36, textAlign: 'center' }}>
                      {pts !== null && <div className={`sc-pts-badge pts-${pts}`}>{isDouble ? pts * 2 : pts}</div>}
                      {pts !== null && isDouble && <div style={{ fontSize: 8, fontFamily: 'var(--mono)', color: 'var(--coral)', marginTop: -2 }}>2×</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}

          {/* Total + streak info */}
          <div className="sc-total-bar">
            <div className="sc-total-pts">{ninePts(course.holes)}</div>
            <div className="sc-total-label">{RL[selRound]} · {scoreFor?.nickname}</div>
            {pRoundBonus(scoreFor?.id, selRound) !== 0 && (
              <div style={{ fontSize: 12, marginTop: 4, color: pRoundBonus(scoreFor?.id, selRound) > 0 ? 'var(--green)' : 'var(--coral)' }}>
                Streak-bonus: {pRoundBonus(scoreFor?.id, selRound) > 0 ? '+' : ''}{pRoundBonus(scoreFor?.id, selRound)}p
              </div>
            )}
          </div>

          {/* Other players this round */}
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--cream-muted)', letterSpacing: 1, marginBottom: 8 }}>MOTSTÅNDARNA</div>
            {activePlayers.filter(p => p.id !== scoreFor?.id).map(p => {
              const rPts = pRoundRaw(p.id, selRound)
              const played = roundId ? pSc(p.id, roundId).filter(x => x.strokes).length : 0
              return (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <Av p={p} size={28} />
                  <div style={{ flex: 1, fontSize: 13 }}>{p.nickname}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--cream-muted)' }}>{played}/18</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 500, color: 'var(--gold-bright)', minWidth: 30, textAlign: 'right' }}>{rPts || '-'}</div>
                </div>
              )
            })}
          </div>
        </>)}

        {/* ===== TEAMS ===== */}
        {view === 'teams' && (<>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div className="section-title">LIV Team Battle</div>
            <div className="section-sub">2 bästa per runda · Hål 16-18 = dubbla poäng</div>
          </div>
          {['green', 'blue'].map(team => {
            const tot = teamTotal(team)
            const tp = activePlayers.filter(p => p.team === team)
            const c = team === 'green' ? '#6BBF7F' : '#8AB4D6'
            const otherTotal = teamTotal(team === 'green' ? 'blue' : 'green')
            const diff = tot - otherTotal
            return (
              <div key={team} className={`team-card ${team === 'green' ? 'team-green-bg' : 'team-blue-bg'}`}>
                <div className="team-header">
                  <div>
                    <div className="team-title" style={{ color: c }}>{team === 'green' ? 'Smaragderna' : 'Stålklubban'}</div>
                    {diff !== 0 && tot > 0 && <div style={{ fontSize: 11, color: diff > 0 ? c : 'var(--cream-muted)' }}>{diff > 0 ? `+${diff} ledning` : `${diff}`}</div>}
                  </div>
                  <div className="team-total" style={{ color: c }}>{tot || '-'}</div>
                </div>
                <div className="team-rounds">{[1,2,3,4].map(r => <div key={r} className="team-round-chip">{RL[r]}: {teamRound(team, r).total || '-'}</div>)}</div>
                <div className="team-players">
                  {tp.map(p => (
                    <div key={p.id} className="team-p">
                      <Av p={p} size={44} />
                      <div className="team-p-name" style={{ marginTop: 4 }}>{p.nickname}</div>
                      <div className="team-p-score" style={{ color: c }}>{pTotal(p.id) || '-'}</div>
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
          <div style={{ background: 'var(--surface)', borderRadius: 12, maxHeight: 'calc(100vh - 280px)', overflowY: 'auto', padding: 10 }}>
            {chat.length === 0 && <div style={{ textAlign: 'center', padding: 32, color: 'var(--cream-muted)', fontSize: 13 }}>🏌️ Tomt här. Skriv något!</div>}
            {chat.map((m, i) => {
              const me = m.player_id === user?.id
              const sys = m.msg_type === 'shoutout' || m.msg_type === 'roast'
              const brd = sys ? (m.msg_type === 'shoutout' ? 'var(--green)' : 'var(--coral)') : me ? 'var(--gold-dim)' : 'transparent'
              const canDel = me || isAdmin
              // Highlight @mentions
              const renderMsg = (text) => {
                if (!text) return text
                return text.split(/(@\w+)/g).map((part, j) => {
                  if (part.startsWith('@')) {
                    const nick = part.slice(1).toLowerCase()
                    const tagged = players.find(p => p.nickname?.toLowerCase().includes(nick) || p.name?.split(' ')[0].toLowerCase() === nick)
                    return <span key={j} style={{ color: 'var(--gold)', fontWeight: 500 }}>{part}</span>
                  }
                  return part
                })
              }
              return (
                <div key={m.id || i} style={{ marginBottom: 6, padding: '8px 10px', background: sys ? 'rgba(255,255,255,0.02)' : 'var(--surface2)', borderRadius: 10, borderLeft: `3px solid ${brd}`, position: 'relative' }}>
                  {!sys && <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                    <Av p={m.inv_players || { name: '?', team: 'green' }} size={18} />
                    <span style={{ fontSize: 11, fontWeight: 500, color: me ? 'var(--gold)' : 'var(--cream-dim)' }}>{m.inv_players?.nickname || '?'}</span>
                    {canDel && m.id && !String(m.id).startsWith('tmp') && (
                      <button onClick={async () => { await supabase.from('inv_chat').delete().eq('id', m.id); fetchChat() }} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--cream-muted)', fontSize: 10, cursor: 'pointer', opacity: 0.5 }}>✕</button>
                    )}
                  </div>}
                  <div style={{ fontSize: 13, lineHeight: 1.5, color: sys ? 'var(--cream-dim)' : 'var(--cream)' }}>{renderMsg(m.message)}</div>
                  {m.image_url && <img src={m.image_url} alt="" style={{ maxWidth: '100%', borderRadius: 8, marginTop: 6 }} loading="lazy" />}
                  <div style={{ fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--cream-muted)', marginTop: 3 }}>{new Date(m.created_at).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              )
            })}
            <div ref={chatEnd} />
          </div>
          {/* @-mention suggestions */}
          {chatMsg.includes('@') && (() => {
            const match = chatMsg.match(/@(\w*)$/)
            if (!match) return null
            const q = match[1].toLowerCase()
            const suggestions = players.filter(p => p.key !== 'spectator' && (p.nickname?.toLowerCase().includes(q) || p.name?.split(' ')[0].toLowerCase().includes(q)))
            if (!suggestions.length) return null
            return (
              <div style={{ display: 'flex', gap: 4, padding: '6px 0', flexWrap: 'wrap' }}>
                {suggestions.map(p => (
                  <button key={p.id} onClick={() => setChatMsg(chatMsg.replace(/@\w*$/, `@${p.name.split(' ')[0]} `))} style={{ fontSize: 11, padding: '4px 8px', background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'var(--cream)', cursor: 'pointer' }}>@{p.name.split(' ')[0]}</button>
                ))}
              </div>
            )
          })()}
          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            <label style={{ background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 12px', cursor: 'pointer', fontSize: 16 }}>
              📷<input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => { if(e.target.files[0]) uploadImg(e.target.files[0]) }} />
            </label>
            <input value={chatMsg} onChange={e => setChatMsg(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') sendMsg() }}
              placeholder="Skriv något... @namn för att tagga" style={{ flex: 1, background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--cream)', padding: '10px 14px', borderRadius: 10, fontSize: 14, fontFamily: 'var(--sans)', outline: 'none' }} />
            <button onClick={sendMsg} style={{ background: 'var(--gold)', color: '#0A0A08', border: 'none', borderRadius: 10, padding: '10px 16px', fontWeight: 600, cursor: 'pointer' }}>↑</button>
          </div>
        </>)}

        {/* ===== INFO ===== */}
        {view === 'info' && (<>
          <div className="section-title">Douche Invitational Only 2026</div>
          <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 16, marginBottom: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: 'var(--cream-dim)', fontStyle: 'italic', lineHeight: 1.6 }}>"{pep}"</div>
          </div>

          {/* Epic playlists */}
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--gold)', letterSpacing: 2, marginBottom: 8 }}>SPELLISTOR FÖR HELGEN</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
            {playlists.map((pl, i) => (
              <a key={i} href={pl.url} target="_blank" rel="noopener noreferrer" style={{ background: 'var(--surface)', borderRadius: 12, padding: '14px 12px', textDecoration: 'none', color: 'inherit', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ fontSize: 18, marginBottom: 4 }}>{pl.name.split(' ')[0]}</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--cream)' }}>{pl.name.split(' ').slice(1).join(' ')}</div>
                <div style={{ fontSize: 10, color: 'var(--cream-muted)', marginTop: 2 }}>{pl.desc}</div>
              </a>
            ))}
          </div>

          {/* Gamification - Achievements */}
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--gold)', letterSpacing: 2, marginBottom: 8 }}>ACHIEVEMENTS</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 20 }}>
            {achievements.map(a => {
              const myScores = scores.filter(s => s.player_id === user?.id && s.strokes > 0).sort((x,y) => x.hole - y.hole)
              const unlocked = a.check(myScores)
              return (
                <div key={a.id} style={{ background: unlocked ? 'rgba(201,168,76,0.1)' : 'var(--surface)', borderRadius: 10, padding: '10px 4px', textAlign: 'center', opacity: unlocked ? 1 : 0.4, border: unlocked ? '1px solid var(--gold-dim)' : '1px solid transparent' }}>
                  <div style={{ fontSize: 20, marginBottom: 2 }}>{a.icon}</div>
                  <div style={{ fontSize: 9, fontWeight: 500, color: unlocked ? 'var(--gold)' : 'var(--cream-muted)' }}>{a.title}</div>
                  <div style={{ fontSize: 8, color: 'var(--cream-muted)', marginTop: 1 }}>{a.desc}</div>
                </div>
              )
            })}
          </div>

          {/* Walk-up music with Spotify deeplinks */}
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--gold)', letterSpacing: 2, marginBottom: 8 }}>WALK-UP MUSIC IDAG</div>
          {players.map(p => {
            const today = walkupMusic[p.key]
            const dayName = new Date().toLocaleDateString('sv-SE', { weekday: 'long' })
            const dayMap = { 'fredag': 'Fredag', 'lördag': 'Lördag', 'söndag': 'Söndag' }
            const song = today?.find(s => s.day === dayMap[dayName]) || today?.[0]
            return song ? (
              <a key={p.id} href={song.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', textDecoration: 'none', color: 'inherit', alignItems: 'center' }}>
                <Av p={p} size={32} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{p.name.split(' ')[0]}</div>
                  <div style={{ fontSize: 11, color: 'var(--cream-muted)' }}>{song.song} – {song.artist}</div>
                </div>
                <div style={{ fontSize: 16 }}>🎵</div>
              </a>
            ) : null
          })}

          {/* Players with roasts */}
          <div style={{ marginTop: 20, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--gold)', letterSpacing: 2, marginBottom: 8 }}>SPELARNA</div>
          {players.map(p => (
            <div key={p.id} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <Av p={p} size={40} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{p.name} <span style={{ fontSize: 11, color: p.team === 'green' ? 'var(--green)' : 'var(--blue)', fontFamily: 'var(--mono)' }}>{p.hcp}</span></div>
                <div style={{ fontSize: 11, color: 'var(--cream-muted)' }}>{p.nickname} · {p.team === 'green' ? 'Smaragderna' : 'Stålklubban'}</div>
                <div style={{ fontSize: 11, color: 'var(--cream-dim)', fontStyle: 'italic', marginTop: 2 }}>"{getRandomRoast(p.key)}"</div>
              </div>
            </div>
          ))}

          {/* Schedule */}
          <div style={{ marginTop: 20, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--gold)', letterSpacing: 2, marginBottom: 8 }}>SCHEMA</div>
          {[
            { day: 'FREDAG', items: ['12:00 – Lunch + öl', '13:00 – R1 Skogsbanan', '~17:30 – Spa & fix', '19:00 – Middag'], c: '#6BBF7F' },
            { day: 'LÖRDAG', items: ['07:00 – Frukost', '08:00 – R2 Parkbanan', '~12:30 – Lunch', '~14:00 – R3 Skogsbanan', '~18:30 – Spa', '19:30 – Middag'], c: '#E8C65A' },
            { day: 'SÖNDAG', items: ['07:30 – Frukost', '08:30 – R4 Parkbanan', '~13:00 – Le Douche de Golf', '~14:00 – Hemfärd'], c: '#E8634A' },
          ].map(d => (
            <div key={d.day} style={{ background: 'var(--surface)', borderRadius: 10, padding: 12, marginBottom: 6 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: d.c, letterSpacing: 2, marginBottom: 4 }}>{d.day}</div>
              {d.items.map((it, i) => <div key={i} style={{ fontSize: 12, color: 'var(--cream-dim)', padding: '1px 0' }}>{it}</div>)}
            </div>
          ))}

          {/* Rules compact */}
          <div style={{ marginTop: 16, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--gold)', letterSpacing: 2, marginBottom: 8 }}>TÄVLINGAR & REGLER</div>
          <div style={{ background: 'var(--surface)', borderRadius: 10, padding: 12 }}>
            {[
              { k: 'GREEN JACKET', v: 'Stableford 72 hål. Fullt hcp.', c: 'var(--gold)' },
              { k: 'TEAM BATTLE', v: '2 bästa/runda. 2x poäng hål 16-18.', c: 'var(--green)' },
              { k: 'DAILY LOSER', v: 'Sämst per runda köper runda.', c: 'var(--coral)' },
              { k: 'HOT HAND', v: '3 birdies i rad = +2 bonus.', c: 'var(--green)' },
              { k: 'COLD TURKEY', v: '3 nollor i rad = -1 poäng.', c: 'var(--coral)' },
              { k: 'ROOKIE RULE', v: 'Martin capped på 36 hcp.', c: 'var(--cream-muted)' },
              { k: 'NOLLPOÄNGAREN', v: 'Hatt + tacktal + runda nästa år.', c: 'var(--coral)' },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, padding: '5px 0', borderBottom: i < 6 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: r.c, minWidth: 90 }}>{r.k}</span>
                <span style={{ fontSize: 12, color: 'var(--cream-dim)' }}>{r.v}</span>
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
