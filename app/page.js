'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { courses, getPlayingHcp, calcStableford, checkStreaks, getShoutout, getZeroRoast, specialHoles, walkupMusic, pepTalks, guideUrls, getRandomRoast, venueImages, achievements, flyovers, playlists, getStrokesGiven } from '../lib/courses'
import { soundBirdie, soundEagle, soundZero, soundChat, soundScore, initAudio } from '../lib/sounds'
import { isPushSupported, getSubscriptionStatus, subscribeToPush, unsubscribeFromPush, sendPush } from '../lib/push'
import QRCode from 'qrcode'

const RC_DEFAULT = { 1: 'Skogsbanan', 2: 'Parkbanan', 3: 'Skogsbanan', 4: 'Parkbanan' }
const RL = { 1: 'R1 Fre', 2: 'R2 Lör FM', 3: 'R3 Lör EM', 4: 'R4 Sön' }
const DAYS = { 1: 'Fredag', 2: 'Lördag', 3: 'Lördag', 4: 'Söndag' }

function SwishModal({ open, onClose, toPlayer, fromPlayer, amount }) {
  const [qrDataUrl, setQrDataUrl] = useState('')

  useEffect(() => {
    if (!open || !toPlayer?.phone) return
    const phone = toPlayer.phone.replace(/\D/g, '').replace(/^0/, '46')
    // Swish QR payload format (officiellt spec för privat swish)
    // C för mottagare-nummer, #-separerat: C{phone};{amount};{message};{lock}
    const msg = `DIO 2026 - ${fromPlayer?.nickname} till ${toPlayer?.nickname}`.replace(/[^a-zA-Z0-9 åäöÅÄÖ:.,?!()]/g, '')
    const qrPayload = `C${phone};${amount};${msg};0`
    QRCode.toDataURL(qrPayload, { width: 280, margin: 2, color: { dark: '#0A0F0A', light: '#F5F0E8' } })
      .then(setQrDataUrl).catch(console.error)
  }, [open, toPlayer, fromPlayer, amount])

  if (!open || !toPlayer) return null

  const phone = toPlayer.phone?.replace(/\D/g, '') || ''
  const copyAll = async () => {
    const text = `Swish: ${phone}\nBelopp: ${amount} kr\nMedd: DIO 2026 - ${fromPlayer?.nickname} till ${toPlayer?.nickname}`
    try { await navigator.clipboard.writeText(text); alert('✅ Kopierat! Klistra in i Swish') } catch {}
  }
  const copyPhone = async () => {
    try { await navigator.clipboard.writeText(phone); alert('✅ ' + phone + ' kopierat') } catch {}
  }

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 20, maxWidth: 360, width: '100%', textAlign: 'center', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 20, color: 'var(--gold)' }}>💸 Swisha</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--cream-muted)', fontSize: 22, cursor: 'pointer', padding: 4 }}>✕</button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 14 }}>
          <Av p={fromPlayer} size={32} />
          <span style={{ color: 'var(--coral)', fontSize: 14 }}>{fromPlayer?.nickname}</span>
          <span style={{ color: 'var(--cream-muted)', fontSize: 16 }}>→</span>
          <Av p={toPlayer} size={32} />
          <span style={{ color: 'var(--green)', fontSize: 14 }}>{toPlayer?.nickname}</span>
        </div>

        <div style={{ fontFamily: 'var(--mono)', fontSize: 32, color: 'var(--gold)', marginBottom: 14 }}>{amount} kr</div>

        {qrDataUrl && (
          <div style={{ background: '#F5F0E8', padding: 12, borderRadius: 12, marginBottom: 12, display: 'inline-block' }}>
            <img src={qrDataUrl} alt="Swish QR" style={{ width: 240, height: 240, display: 'block' }} />
          </div>
        )}

        <div style={{ fontSize: 11, color: 'var(--cream-muted)', marginBottom: 14, lineHeight: 1.5 }}>
          Öppna Swish → Skanna QR-kod (kamera-ikonen) → bekräfta med BankID
        </div>

        <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: 12, marginBottom: 12, textAlign: 'left' }}>
          <div style={{ fontSize: 10, color: 'var(--cream-muted)', fontFamily: 'var(--mono)', letterSpacing: 1.5, marginBottom: 6 }}>MANUELLT</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
            <span style={{ color: 'var(--cream-muted)' }}>Nummer:</span>
            <span style={{ fontFamily: 'var(--mono)', color: 'var(--cream)' }}>{phone}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
            <span style={{ color: 'var(--cream-muted)' }}>Belopp:</span>
            <span style={{ fontFamily: 'var(--mono)', color: 'var(--cream)' }}>{amount} kr</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--cream-dim)', marginTop: 6 }}>DIO 2026 – {fromPlayer?.nickname} → {toPlayer?.nickname}</div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={copyPhone} style={{ flex: 1, padding: '11px', background: 'var(--surface2)', color: 'var(--cream)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>📋 Nummer</button>
          <button onClick={copyAll} style={{ flex: 1, padding: '11px', background: '#EF6C00', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>📋 Allt</button>
        </div>
      </div>
    </div>
  )
}

function PushSubscribeButton({ playerId }) {
  const [status, setStatus] = useState('loading')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    getSubscriptionStatus().then(setStatus)
  }, [])

  const subscribe = async () => {
    setBusy(true)
    try {
      await subscribeToPush(playerId)
      setStatus('subscribed')
    } catch (err) {
      alert('Kunde inte aktivera: ' + err.message)
    }
    setBusy(false)
  }

  const unsub = async () => {
    setBusy(true)
    await unsubscribeFromPush(playerId)
    setStatus('default')
    setBusy(false)
  }

  if (status === 'loading') return <div style={{ fontSize: 11, color: 'var(--cream-muted)' }}>Kollar status...</div>
  if (status === 'unsupported') return <div style={{ fontSize: 11, color: 'var(--coral)' }}>❌ Notiser stöds inte i denna browser</div>
  if (status === 'denied') return <div style={{ fontSize: 11, color: 'var(--coral)' }}>🚫 Notiser blockerade – aktivera i systemsettings</div>
  if (status === 'subscribed') return (
    <button onClick={unsub} disabled={busy} style={{ width: '100%', padding: '10px', background: 'rgba(107,191,127,0.15)', color: 'var(--green)', border: '1px solid var(--green)', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>
      ✅ Notiser aktiverade – klicka för att stänga av
    </button>
  )
  return (
    <button onClick={subscribe} disabled={busy} style={{ width: '100%', padding: '12px', background: 'var(--gold)', color: '#0A0A08', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
      {busy ? '...' : '🔔 Aktivera push-notiser på denna enhet'}
    </button>
  )
}

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
  const [showMenu, setShowMenu] = useState(false)
  const [unread, setUnread] = useState(0)
  const [showInstall, setShowInstall] = useState(false)
  const [splash, setSplash] = useState(true)
  const [expenses, setExpenses] = useState([])
  const [expenseForm, setExpenseForm] = useState({ description: '', amount: '', tag: 'mat' })
  const [h2hPlayers, setH2hPlayers] = useState([])
  const [h2hMatches, setH2hMatches] = useState([])
  const [expenseTarget, setExpenseTarget] = useState('')
  const [propBets, setPropBets] = useState([])
  const [propForm, setPropForm] = useState({ question: '', odds: 'Even', stake: 50, options: '', banker: '' })
  const [profileForm, setProfileForm] = useState(null)
  const [broadcastForm, setBroadcastForm] = useState({ title: '', body: '', target: 'all' })
  const [broadcastSending, setBroadcastSending] = useState(false)
  const [swishModal, setSwishModal] = useState(null)
  const [pendingUser, setPendingUser] = useState(null)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState('')
  const [pinMode, setPinMode] = useState('verify')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  useEffect(() => {
    if (user && view === 'profile') setProfileForm({
      phone: user.phone || '', email: user.email || '', nickname: user.nickname || '',
      song: user.song || '', image_url: user.image_url || '', pin: user.pin || '',
      daily_summary: user.daily_summary !== false, notifications: user.notifications !== false,
      notif_eagles: user.notif_eagles !== false, notif_bets: user.notif_bets !== false,
      notif_mentions: user.notif_mentions !== false, notif_debts: user.notif_debts !== false,
      notif_leader: user.notif_leader !== false
    })
  }, [user?.id, view])
  const [pep] = useState(pepTalks[Math.floor(Math.random() * pepTalks.length)])
  const chatEnd = useRef(null)
  const toastT = useRef(null)
  const fileRef = useRef(null)
  const leaderRef = useRef(null)

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
    const [p, r, s, ex] = await Promise.all([supabase.from('inv_players').select('*').order('hcp'), supabase.from('inv_rounds').select('*').order('round_number'), supabase.from('inv_scores').select('*'), supabase.from('inv_expenses').select('*').order('created_at', { ascending: false })])
    if (p.data) setPlayers(p.data); if (r.data) setRounds(r.data); if (s.data) setScores(s.data); if (ex.data) setExpenses(ex.data)
  }, [])
  const fetchChat = useCallback(async () => {
    if (!supabase) return
    const { data } = await supabase.from('inv_chat').select('*, inv_players(name, nickname, image_url, team)').order('created_at', { ascending: true }).limit(200)
    if (data) setChat(data)
  }, [])
  const fetchExpenses = useCallback(async () => {
    if (!supabase) return
    const { data } = await supabase.from('inv_expenses').select('*').order('created_at', { ascending: false })
    if (data) setExpenses(data)
  }, [])
  const fetchH2h = useCallback(async () => {
    if (!supabase) return
    const { data } = await supabase.from('inv_h2h_matches').select('*').order('round_number')
    if (data) setH2hMatches(data)
  }, [])
  const fetchProps = useCallback(async () => {
    if (!supabase) return
    const { data } = await supabase.from('inv_prop_bets').select('*').order('created_at', { ascending: false })
    if (data) setPropBets(data)
  }, [])
  useEffect(() => { fetchAll(); fetchChat(); fetchExpenses(); fetchH2h(); fetchProps() }, [fetchAll, fetchChat, fetchExpenses, fetchH2h, fetchProps])
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
    const c3 = supabase.channel('e1').on('postgres_changes', { event: '*', schema: 'public', table: 'inv_expenses' }, () => fetchExpenses()).subscribe()
    const c4 = supabase.channel('h2h1').on('postgres_changes', { event: '*', schema: 'public', table: 'inv_h2h_matches' }, () => fetchH2h()).subscribe()
    const c5 = supabase.channel('prop1').on('postgres_changes', { event: '*', schema: 'public', table: 'inv_prop_bets' }, () => fetchProps()).subscribe()
    return () => { supabase.removeChannel(c1); supabase.removeChannel(c2); supabase.removeChannel(c3); supabase.removeChannel(c4); supabase.removeChannel(c5) }
  }, [fetchAll, fetchChat, fetchExpenses, fetchH2h, fetchProps, players])

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
    const ds = specialHoles[rn]?.doubleStart || 16
    return sc.reduce((s, x) => {
      const mult = x.hole >= ds ? 2 : 1
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
  const isAdmin = user?.key === 'filip' || user?.key === 'marcus'
  const isSpectator = user?.key === 'spectator'
  const activePlayers = players.filter(p => p.key !== 'spectator')

  // Dynamic round-to-course mapping (reads from DB, falls back to defaults)
  const RC = rounds.length > 0
    ? rounds.reduce((m, r) => ({ ...m, [r.round_number]: r.course }), {})
    : RC_DEFAULT

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
      // Push notis till alla utom scoraren
      sendPush({
        title: pts >= 4 ? `🦅 EAGLE! ${scoreFor.nickname}` : `🐦 BIRDIE! ${scoreFor.nickname}`,
        body: `Hål ${hole} · ${pts} poäng · ${c.name}`,
        type: 'score',
        excludePlayerId: scoreFor.id,
        prefKey: 'notif_eagles'
      })
    } else if (pts === 0) {
      const m = getZeroRoast(scoreFor.nickname).replace('{{hole}}', hole)
      showToast(m, 'zero')
      supabase.from('inv_chat').insert({ player_id: scoreFor.id, message: m, msg_type: 'roast' })
    } else {
      soundScore()
    }
    // Kolla om ledare bytt
    checkLeaderChange()
    fetchAll()
  }

  const checkLeaderChange = () => {
    const sorted = [...activePlayers].filter(p => p.key !== 'spectator').map(p => ({ p, pts: pTotal(p.id) })).sort((a,b) => b.pts - a.pts)
    const newLeader = sorted[0]?.p
    if (!newLeader) return
    if (leaderRef.current && leaderRef.current !== newLeader.id) {
      sendPush({
        title: `👑 Ny ledare: ${newLeader.nickname}!`,
        body: `${newLeader.nickname} toppar nu leaderboarden med ${sorted[0].pts}p`,
        type: 'leader',
        excludePlayerId: newLeader.id,
        prefKey: 'notif_leader'
      })
    }
    leaderRef.current = newLeader.id
  }

  const sendMsg = async () => {
    if (!chatMsg.trim() || !user || !supabase) return
    const msg = chatMsg.trim()
    setChatMsg('')
    // Optimistic: add immediately so sender sees it
    setChat(prev => [...prev, { id: 'tmp-' + Date.now(), player_id: user.id, message: msg, msg_type: 'chat', created_at: new Date().toISOString(), inv_players: { name: user.name, nickname: user.nickname, image_url: user.image_url, team: user.team } }])
    await supabase.from('inv_chat').insert({ player_id: user.id, message: msg, msg_type: 'chat' })
    // @-mentions → push
    const mentions = msg.match(/@(\w+)/g) || []
    for (const m of mentions) {
      const name = m.slice(1).toLowerCase()
      const target = activePlayers.find(p => p.id !== user.id && (p.nickname?.toLowerCase().includes(name) || p.name?.toLowerCase().includes(name) || p.key?.toLowerCase() === name))
      if (target) {
        sendPush({
          title: `💬 ${user.nickname} nämnde dig`,
          body: msg.length > 80 ? msg.slice(0, 80) + '…' : msg,
          type: 'mention',
          targetPlayerId: target.id,
          prefKey: 'notif_mentions'
        })
      }
    }
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
      {/* PIN MODAL */}
      {pendingUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={(e) => { if (e.target === e.currentTarget) { setPendingUser(null) } }}>
          <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 24, maxWidth: 340, width: '100%', textAlign: 'center' }}>
            <Av p={pendingUser} size={72} />
            <div style={{ fontFamily: 'var(--serif)', fontSize: 22, color: 'var(--gold)', marginTop: 10 }}>{pendingUser.nickname}</div>
            <div style={{ fontSize: 12, color: 'var(--cream-muted)', marginBottom: 20 }}>{pendingUser.name}</div>

            {pinMode === 'verify' ? (<>
              <div style={{ fontSize: 13, color: 'var(--cream-dim)', marginBottom: 12 }}>Ange din PIN-kod</div>
              <input type="password" inputMode="numeric" autoFocus maxLength={4} value={pinInput}
                onChange={e => { setPinInput(e.target.value.replace(/\D/g, '').slice(0,4)); setPinError('') }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && pinInput.length === 4) {
                    if (pinInput === pendingUser.pin) {
                      setUser(pendingUser); setView('leaderboard'); setPendingUser(null)
                    } else { setPinError('Fel PIN – försök igen'); setPinInput('') }
                  }
                }}
                style={{ width: '100%', background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'var(--cream)', padding: '14px', fontSize: 28, letterSpacing: 16, textAlign: 'center', fontFamily: 'var(--mono)', marginBottom: 8 }} />
              {pinError && <div style={{ fontSize: 12, color: 'var(--coral)', marginBottom: 8 }}>{pinError}</div>}
              <button onClick={() => {
                if (pinInput === pendingUser.pin) {
                  setUser(pendingUser); setView('leaderboard'); setPendingUser(null)
                } else { setPinError('Fel PIN – försök igen'); setPinInput('') }
              }} disabled={pinInput.length !== 4}
                style={{ width: '100%', padding: '12px', background: pinInput.length === 4 ? 'var(--gold)' : 'var(--surface2)', color: pinInput.length === 4 ? '#0A0A08' : 'var(--cream-muted)', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: pinInput.length === 4 ? 'pointer' : 'not-allowed', marginBottom: 8 }}>
                🔓 Logga in
              </button>
              <button onClick={() => setPendingUser(null)} style={{ background: 'none', border: 'none', color: 'var(--cream-muted)', fontSize: 12, cursor: 'pointer' }}>Avbryt</button>
            </>) : (<>
              <div style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid var(--gold-dim)', borderRadius: 10, padding: 10, marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 600, marginBottom: 4 }}>⚠️ Första inloggning</div>
                <div style={{ fontSize: 11, color: 'var(--cream-dim)', lineHeight: 1.5 }}>Välj din egen 4-siffriga PIN-kod. Använd inte 0000 – den är default.</div>
              </div>

              <div style={{ fontSize: 11, color: 'var(--cream-muted)', marginBottom: 4, textAlign: 'left' }}>NY PIN (4 siffror)</div>
              <input type="password" inputMode="numeric" autoFocus maxLength={4} value={newPin}
                onChange={e => { setNewPin(e.target.value.replace(/\D/g, '').slice(0,4)); setPinError('') }}
                style={{ width: '100%', background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'var(--cream)', padding: '12px', fontSize: 22, letterSpacing: 12, textAlign: 'center', fontFamily: 'var(--mono)', marginBottom: 10 }} />

              <div style={{ fontSize: 11, color: 'var(--cream-muted)', marginBottom: 4, textAlign: 'left' }}>BEKRÄFTA PIN</div>
              <input type="password" inputMode="numeric" maxLength={4} value={confirmPin}
                onChange={e => { setConfirmPin(e.target.value.replace(/\D/g, '').slice(0,4)); setPinError('') }}
                style={{ width: '100%', background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'var(--cream)', padding: '12px', fontSize: 22, letterSpacing: 12, textAlign: 'center', fontFamily: 'var(--mono)', marginBottom: 8 }} />

              {pinError && <div style={{ fontSize: 12, color: 'var(--coral)', marginBottom: 8 }}>{pinError}</div>}

              <button onClick={async () => {
                if (newPin.length !== 4) { setPinError('PIN måste vara 4 siffror'); return }
                if (newPin === '0000') { setPinError('Välj något annat än 0000'); return }
                if (newPin !== confirmPin) { setPinError('PIN-koderna matchar inte'); return }
                await supabase.from('inv_players').update({ pin: newPin, must_change_pin: false }).eq('id', pendingUser.id)
                await fetchAll()
                setUser({ ...pendingUser, pin: newPin, must_change_pin: false }); setView('leaderboard')
                setPendingUser(null); setPinInput(''); setNewPin(''); setConfirmPin('')
                showToast('✅ PIN sparad!', 'birdie')
              }} disabled={newPin.length !== 4 || confirmPin.length !== 4}
                style={{ width: '100%', padding: '12px', background: (newPin.length === 4 && confirmPin.length === 4) ? 'var(--gold)' : 'var(--surface2)', color: (newPin.length === 4 && confirmPin.length === 4) ? '#0A0A08' : 'var(--cream-muted)', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 8 }}>
                💾 Spara PIN & logga in
              </button>
              <button onClick={() => setPendingUser(null)} style={{ background: 'none', border: 'none', color: 'var(--cream-muted)', fontSize: 12, cursor: 'pointer' }}>Avbryt</button>
            </>)}
          </div>
        </div>
      )}

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
          <button key={p.id} className="login-face-btn" onClick={() => {
            initAudio()
            if (p.key === 'spectator' || !p.pin) {
              setUser(p); setView('leaderboard')
            } else {
              setPendingUser(p)
              setPinMode(p.must_change_pin ? 'change' : 'verify')
              setPinInput(''); setNewPin(''); setConfirmPin(''); setPinError('')
            }
          }}>
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
              // Calculate rank without last round to show movement
              const lastPlayed = [4,3,2,1].find(rn => pRoundRaw(p.id, rn) > 0) || 0
              const prevTotal = pid => pTotal(pid) - pRoundRaw(pid, lastPlayed) - pRoundBonus(pid, lastPlayed)
              const prevLb = [...activePlayers].sort((a, b) => prevTotal(b.id) - prevTotal(a.id))
              const prevPos = prevLb.findIndex(x => x.id === p.id)
              const movement = lastPlayed > 0 && prevTotal(p.id) > 0 ? prevPos - i : 0
              return (
                <div className="lb-row" key={p.id} style={p.id === user?.id ? { background: 'rgba(201,168,76,0.06)' } : {}}>
                  <div className="lb-team-indicator" style={{ background: p.team === 'green' ? '#6BBF7F' : '#8AB4D6' }} />
                  <div className="lb-pos">{i === 0 && tot > 0 ? '👑' : i + 1}</div>
                  {movement !== 0 && <div style={{ fontSize: 10, color: movement > 0 ? 'var(--green)' : 'var(--coral)', minWidth: 14 }}>{movement > 0 ? '▲' : '▼'}</div>}
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
          {/* Countdown to first tee */}
          {(() => {
            const teeOff = new Date('2026-05-01T09:00:00+02:00')
            const now = new Date()
            const diff = teeOff - now
            if (diff > 0 && diff < 30 * 24 * 60 * 60 * 1000) {
              const d = Math.floor(diff / 86400000)
              const h = Math.floor((diff % 86400000) / 3600000)
              return (
                <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 14, marginBottom: 14, textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--gold)', letterSpacing: 2 }}>COUNTDOWN TILL FÖRSTA TEE</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 28, color: 'var(--cream)', fontWeight: 500, marginTop: 4 }}>{d}d {h}h</div>
                </div>
              )
            }
            return null
          })()}

          {/* Head-to-head comparisons */}
          <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 14, marginTop: 14 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--gold)', letterSpacing: 2, marginBottom: 8 }}>HEAD-TO-HEAD</div>

            {/* Saved H2H matchups from leaderboard context */}
            {(() => {
              const calcH2h = (k1, k2) => {
                const p1 = activePlayers.find(p => p.key === k1), p2 = activePlayers.find(p => p.key === k2)
                if (!p1 || !p2) return null
                const t1 = pTotal(p1.id), t2 = pTotal(p2.id)
                let w1 = 0, w2 = 0, ties = 0
                ;[1,2,3,4].forEach(rn => {
                  const r = rid(rn); if (!r) return
                  const s1 = pSc(p1.id, r), s2 = pSc(p2.id, r)
                  for (let h = 1; h <= 18; h++) {
                    const a = s1.find(x => x.hole === h), b = s2.find(x => x.hole === h)
                    if (a?.stableford_points != null && b?.stableford_points != null) {
                      const d = a.stableford_points - b.stableford_points
                      if (d > 0) w1++; else if (d < 0) w2++; else ties++
                    }
                  }
                })
                return { p1, p2, t1, t2, w1, w2, ties }
              }

              // Show all stored H2H pairs
              const pairs = h2hPlayers.filter(p => p && p[0] && p[1] && p[0] !== p[1])
              return (<>
                {pairs.map((pair, idx) => {
                  const h = calcH2h(pair[0], pair[1])
                  if (!h) return null
                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <div style={{ textAlign: 'center', flex: 1 }}>
                        <Av p={h.p1} size={28} />
                        <div style={{ fontSize: 10, fontWeight: 500, marginTop: 2 }}>{h.p1.nickname}</div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 18, color: h.t1 >= h.t2 ? 'var(--green)' : 'var(--cream-muted)' }}>{h.t1}</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '0 6px' }}>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--cream-muted)' }}>VS</div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--gold)', marginTop: 2 }}>{h.w1}–{h.ties}–{h.w2}</div>
                      </div>
                      <div style={{ textAlign: 'center', flex: 1 }}>
                        <Av p={h.p2} size={28} />
                        <div style={{ fontSize: 10, fontWeight: 500, marginTop: 2 }}>{h.p2.nickname}</div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 18, color: h.t2 >= h.t1 ? 'var(--green)' : 'var(--cream-muted)' }}>{h.t2}</div>
                      </div>
                      <button onClick={() => setH2hPlayers(prev => prev.filter((_, i) => i !== idx))}
                        style={{ background: 'none', border: 'none', color: 'var(--cream-muted)', fontSize: 14, cursor: 'pointer', padding: '0 4px', marginLeft: 4 }}>✕</button>
                    </div>
                  )
                })}

                {/* Add new matchup */}
                <div style={{ display: 'flex', gap: 4, marginTop: pairs.length > 0 ? 8 : 0 }}>
                  <select id="h2h-add-p1" style={{ flex: 1, background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'var(--cream)', padding: '6px', fontSize: 11 }}>
                    <option value="">Spelare 1</option>
                    {activePlayers.map(p => <option key={p.key} value={p.key}>{p.nickname}</option>)}
                  </select>
                  <select id="h2h-add-p2" style={{ flex: 1, background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'var(--cream)', padding: '6px', fontSize: 11 }}>
                    <option value="">Spelare 2</option>
                    {activePlayers.map(p => <option key={p.key} value={p.key}>{p.nickname}</option>)}
                  </select>
                  <button onClick={() => {
                    const p1 = document.getElementById('h2h-add-p1').value
                    const p2 = document.getElementById('h2h-add-p2').value
                    if (p1 && p2 && p1 !== p2) {
                      setH2hPlayers(prev => [...prev, [p1, p2]])
                      document.getElementById('h2h-add-p1').value = ''
                      document.getElementById('h2h-add-p2').value = ''
                    }
                  }} style={{ padding: '6px 14px', background: 'var(--gold)', color: '#0A0A08', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>+</button>
                </div>
              </>)
            })()}
          </div>
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
            <Badge text={`⚡ 2x: HÅL ${sp.doubleStart || 16}-18`} color="var(--coral)" bg="rgba(232,99,74,0.12)" />
          </div>

          {[{ lbl: 'UT (1–9)', h: course.holes.slice(0,9) }, { lbl: 'IN (10–18)', h: course.holes.slice(9) }].map(nine => (
            <div key={nine.lbl}>
              <div className="sc-nine-header"><span>{nine.lbl}</span><span style={{ color: 'var(--gold)' }}>{ninePts(nine.h)}p</span></div>
              {nine.h.map(h => {
                const pts = hPts(h.hole)
                const strokes = hStr(h.hole)
                const isLD = h.hole === sp.ld
                const isNP = h.hole === sp.np
                const isDouble = h.hole >= (sp.doubleStart || 16)
                const isNext = h.hole === nextHole
                const accent = isLD ? 'var(--gold)' : isNP ? 'var(--green)' : isDouble ? 'var(--coral)' : null
                const currentVal = strokes ? parseInt(strokes) : h.par
                return (
                  <div className={`sc-hole-card ${h.hcp <= 3 ? 'hole-hard' : h.hcp >= 16 ? 'hole-easy' : ''}`} key={h.hole} id={`hole-${h.hole}`} style={{
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

          {/* 🏆 PRISUTDELNING */}
          {isAdmin && (
            <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 14, marginBottom: 14 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--gold)', letterSpacing: 2, marginBottom: 10 }}>🏆 PRISUTDELNING</div>
              {(() => {
                const cats = []
                // Le Douche de Golf (individual winner)
                if (lb.length > 0 && pTotal(lb[0].id) > 0) cats.push({ title: 'Le Douche de Golf', icon: '🏆', winner: lb[0], value: `${pTotal(lb[0].id)}p` })
                // Daily Loser per round
                ;[1,2,3,4].forEach(rn => {
                  const r = rid(rn); if (!r) return
                  const played = activePlayers.filter(p => pSc(p.id, r).length > 0)
                  if (played.length > 0) {
                    const loser = played.sort((a,b) => pRoundRaw(a.id, rn) - pRoundRaw(b.id, rn))[0]
                    if (pRoundRaw(loser.id, rn) > 0) cats.push({ title: `Daily Loser R${rn}`, icon: '🍺', winner: loser, value: `${pRoundRaw(loser.id, rn)}p` })
                  }
                })
                // Konsistenskungen (lowest std dev)
                const withStdDev = activePlayers.filter(p => [1,2,3,4].filter(r => pRoundRaw(p.id, r) > 0).length >= 2).map(p => {
                  const vals = [1,2,3,4].map(r => pRoundRaw(p.id, r)).filter(v => v > 0)
                  const mean = vals.reduce((s,v) => s+v, 0) / vals.length
                  const variance = vals.reduce((s,v) => s + Math.pow(v - mean, 2), 0) / vals.length
                  return { player: p, stdDev: Math.sqrt(variance) }
                }).sort((a,b) => a.stdDev - b.stdDev)
                if (withStdDev.length > 0) cats.push({ title: 'Konsistenskungen', icon: '📏', winner: withStdDev[0].player, value: `σ ${withStdDev[0].stdDev.toFixed(1)}` })

                if (cats.length === 0) return <div style={{ fontSize: 12, color: 'var(--cream-muted)', textAlign: 'center', padding: 10 }}>Spela först – vinnare avslöjas här</div>
                return cats.map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ fontSize: 22 }}>{c.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--gold)' }}>{c.title}</div>
                      <div style={{ fontSize: 13, color: 'var(--cream)' }}>{c.winner.name}</div>
                    </div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 14, color: 'var(--cream-muted)' }}>{c.value}</div>
                  </div>
                ))
              })()}
            </div>
          )}

          {/* 📊 ROUND STATS */}
          {(() => {
            const playedRounds = [1,2,3,4].filter(rn => { const r = rid(rn); return r && scores.filter(s => s.round_id === r && s.strokes > 0).length > 0 })
            if (playedRounds.length === 0) return null
            return (
              <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 14, marginBottom: 14 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--gold)', letterSpacing: 2, marginBottom: 10 }}>📊 RUNDSTATS</div>
                {playedRounds.map(rn => {
                  const r = rid(rn)
                  const roundScores = scores.filter(s => s.round_id === r && s.strokes > 0)
                  const birdiesPlus = roundScores.filter(s => s.stableford_points >= 3).length
                  const zeros = roundScores.filter(s => s.stableford_points === 0).length
                  const bestHole = roundScores.sort((a,b) => b.stableford_points - a.stableford_points)[0]
                  const bestPlayer = bestHole ? activePlayers.find(p => p.id === bestHole.player_id) : null
                  const topScorer = activePlayers.sort((a,b) => pRoundRaw(b.id, rn) - pRoundRaw(a.id, rn))[0]
                  return (
                    <div key={rn} style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--cream)', marginBottom: 4 }}>R{rn} – {RC[rn]}</div>
                      <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--cream-muted)' }}>
                        <span>🐦 {birdiesPlus} birdies+</span>
                        <span>💀 {zeros} nollor</span>
                        {topScorer && pRoundRaw(topScorer.id, rn) > 0 && <span>👑 {topScorer.nickname} ({pRoundRaw(topScorer.id, rn)}p)</span>}
                      </div>
                      {bestPlayer && bestHole.stableford_points >= 4 && <div style={{ fontSize: 10, color: 'var(--gold)', marginTop: 2 }}>⭐ {bestPlayer.nickname} – {bestHole.stableford_points}p på hål {bestHole.hole}</div>}
                    </div>
                  )
                })}
              </div>
            )
          })()}

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
        {/* ===== PHOTO GALLERY ===== */}
        {view === 'gallery' && (<>
          <div className="section-title">📸 Helgen i bilder</div>
          <div className="section-sub">{chat.filter(m => m.image_url).length} foton</div>
          {(() => {
            const photos = chat.filter(m => m.image_url).sort((a,b) => new Date(b.created_at) - new Date(a.created_at))
            if (photos.length === 0) return <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 40, textAlign: 'center', color: 'var(--cream-muted)' }}>Inga bilder ännu. Skicka foton i chatten!</div>
            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                {photos.map(m => {
                  const p = m.inv_players || activePlayers.find(x => x.id === m.player_id) || {}
                  return (
                    <div key={m.id} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', aspectRatio: '1', background: 'var(--surface)' }}>
                      <img src={m.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', padding: '16px 8px 6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Av p={p} size={16} />
                          <span style={{ fontSize: 10, color: '#fff' }}>{p.nickname || '?'}</span>
                          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', marginLeft: 'auto' }}>{new Date(m.created_at).toLocaleString('sv-SE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })()}
        </>)}

        {/* ===== EVEN STEVEN (EXPENSE SPLIT + BETS) ===== */}
        {view === 'expenses' && (<>
          <div className="section-title">💰 Even Steven</div>
          <div className="section-sub">Utgifter, bets & sidospel – allt räknas ihop</div>

          {/* 🎲 PROP BETS */}
          <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--gold)', letterSpacing: 2, marginBottom: 8 }}>🎲 PROP BETS</div>

            {/* Active bets */}
            {propBets.map(bet => {
              const opts = bet.options || []
              const bets = bet.bets || {}
              const myBet = bets[user?.key]
              const banker = bet.banker_key ? activePlayers.find(p => p.key === bet.banker_key) : null
              return (
                <div key={bet.id} style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--cream)' }}>{bet.question}</div>
                      <div style={{ fontSize: 10, color: 'var(--cream-muted)', marginTop: 2 }}>
                        {bet.stake} kr · Odds: {bet.odds}
                        {banker && <span> · 🏦 Bank: {banker.nickname}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {bet.settled && <Badge text="AVGJORD" color="var(--green)" bg="rgba(107,191,127,0.15)" />}
                      {(isAdmin || bet.created_by === user?.key) && <button onClick={async () => {
                        if (confirm('Radera denna bet?')) {
                          await supabase.from('inv_prop_bets').delete().eq('id', bet.id)
                          // Also remove any auto-generated expenses from this bet
                          await supabase.from('inv_expenses').delete().match({ bet_type: 'prop', description: `Prop: "${bet.question}"` })
                          fetchProps(); fetchExpenses()
                        }
                      }} style={{ background: 'none', border: 'none', color: 'var(--coral)', fontSize: 14, cursor: 'pointer' }}>✕</button>}
                    </div>
                  </div>
                  {/* Options to bet on */}
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
                    {opts.map((opt, oi) => {
                      const voters = Object.entries(bets).filter(([k, v]) => v === opt).map(([k]) => activePlayers.find(p => p.key === k)?.nickname).filter(Boolean)
                      const isWinner = bet.winner_option === opt
                      return (
                        <button key={oi} onClick={async () => {
                          if (bet.settled) return
                          const newBets = { ...bets, [user.key]: opt }
                          await supabase.from('inv_prop_bets').update({ bets: newBets }).eq('id', bet.id)
                          fetchProps()
                        }} style={{
                          fontSize: 11, padding: '5px 10px', borderRadius: 8, cursor: bet.settled ? 'default' : 'pointer',
                          border: myBet === opt ? '1.5px solid var(--gold)' : '1px solid rgba(255,255,255,0.1)',
                          background: isWinner ? 'rgba(107,191,127,0.15)' : myBet === opt ? 'rgba(201,168,76,0.1)' : 'var(--surface2)',
                          color: isWinner ? 'var(--green)' : myBet === opt ? 'var(--gold)' : 'var(--cream-dim)'
                        }}>
                          {isWinner && '🏆 '}{opt} {voters.length > 0 && <span style={{ fontSize: 9, opacity: 0.7 }}>({voters.join(', ')})</span>}
                        </button>
                      )
                    })}
                  </div>
                  {/* Admin: declare winner */}
                  {isAdmin && !bet.settled && (
                    <select onChange={async (e) => {
                      if (!e.target.value) return
                      await supabase.from('inv_prop_bets').update({ winner_option: e.target.value, settled: true }).eq('id', bet.id)
                      // Settle: losers pay winners via Even Steven
                      const winners = Object.entries(bets).filter(([k, v]) => v === e.target.value).map(([k]) => k)
                      const losers = Object.entries(bets).filter(([k, v]) => v !== e.target.value).map(([k]) => k)
                      if (bet.banker_key) {
                        // Bank mode: bank pays winners, losers pay bank
                        for (const w of winners) {
                          if (w !== bet.banker_key) {
                            await supabase.from('inv_expenses').insert({ paid_by: bet.banker_key, amount: bet.stake, description: `Prop: "${bet.question}" → ${activePlayers.find(p => p.key === w)?.nickname}`, tag: 'bet', target_player: w, split_between: [w], bet_type: 'prop', created_by: user.key })
                          }
                        }
                        for (const l of losers) {
                          if (l !== bet.banker_key) {
                            await supabase.from('inv_expenses').insert({ paid_by: l, amount: bet.stake, description: `Prop: "${bet.question}" → Bank`, tag: 'bet', target_player: bet.banker_key, split_between: [bet.banker_key], bet_type: 'prop', created_by: user.key })
                          }
                        }
                      } else {
                        // Even split: losers pay into pool, winners split
                        for (const l of losers) {
                          for (const w of winners) {
                            const share = Math.round(bet.stake / winners.length)
                            await supabase.from('inv_expenses').insert({ paid_by: l, amount: share, description: `Prop: "${bet.question}"`, tag: 'bet', target_player: w, split_between: [w], bet_type: 'prop', created_by: user.key })
                          }
                        }
                      }
                      fetchProps(); fetchExpenses()
                      showToast(`Prop avgjord: ${e.target.value}!`, 'birdie')
                      // Push till alla
                      sendPush({
                        title: `🎲 Prop avgjord!`,
                        body: `"${bet.question}" → ${e.target.value} vann`,
                        type: 'prop',
                        prefKey: 'notif_bets'
                      })
                    }} style={{ background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'var(--cream)', padding: '3px 6px', fontSize: 10, marginTop: 4 }}>
                      <option value="">Avgör vinnare...</option>
                      {opts.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                    </select>
                  )}
                </div>
              )
            })}

            {/* Create new prop bet – alla kan skapa */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10, marginTop: 8 }}>
                <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--cream-muted)', marginBottom: 6 }}>SKAPA NY PROP</div>
                <input placeholder="Fråga? (t.ex. Vem gör första birdien?)" value={propForm.question} onChange={e => setPropForm(f => ({...f, question: e.target.value}))}
                  style={{ width: '100%', background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'var(--cream)', padding: '8px', fontSize: 12, marginBottom: 6 }} />
                <input placeholder="Alternativ (komma-separerade: Filip, Marcus, Magnus...)" value={propForm.options} onChange={e => setPropForm(f => ({...f, options: e.target.value}))}
                  style={{ width: '100%', background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'var(--cream)', padding: '8px', fontSize: 12, marginBottom: 6 }} />
                <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, color: 'var(--cream-muted)' }}>INSATS (kr)</div>
                    <input type="number" value={propForm.stake} onChange={e => setPropForm(f => ({...f, stake: parseInt(e.target.value) || 50}))}
                      style={{ width: '100%', background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'var(--cream)', padding: '6px', fontSize: 12, fontFamily: 'var(--mono)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, color: 'var(--cream-muted)' }}>ODDS</div>
                    <input value={propForm.odds} onChange={e => setPropForm(f => ({...f, odds: e.target.value}))}
                      style={{ width: '100%', background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'var(--cream)', padding: '6px', fontSize: 12, fontFamily: 'var(--mono)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, color: 'var(--cream-muted)' }}>🏦 BANK</div>
                    <select value={propForm.banker} onChange={e => setPropForm(f => ({...f, banker: e.target.value}))}
                      style={{ width: '100%', background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'var(--cream)', padding: '6px', fontSize: 10 }}>
                      <option value="">Ingen bank</option>
                      {activePlayers.map(p => <option key={p.key} value={p.key}>{p.nickname}</option>)}
                    </select>
                  </div>
                </div>
                <button onClick={async () => {
                  if (!propForm.question || !propForm.options) return
                  const opts = propForm.options.split(',').map(o => o.trim()).filter(Boolean)
                  if (opts.length < 2) return
                  await supabase.from('inv_prop_bets').insert({
                    question: propForm.question, odds: propForm.odds, stake: propForm.stake,
                    options: opts, banker_key: propForm.banker || null, created_by: user.key
                  })
                  setPropForm({ question: '', odds: 'Even', stake: 50, options: '', banker: '' })
                  fetchProps(); soundScore()
                }} style={{ width: '100%', padding: '10px', background: 'var(--gold)', color: '#0A0A08', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  🎲 Skapa prop bet
                </button>
              </div>
          </div>


          {/* Add expense form */}
          <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--gold)', letterSpacing: 2, marginBottom: 8 }}>LÄGG TILL UTGIFT</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <input placeholder="Vad?" value={expenseForm.description} onChange={e => setExpenseForm(f => ({...f, description: e.target.value}))}
                style={{ flex: 2, background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'var(--cream)', padding: '10px', fontSize: 14 }} />
              <input placeholder="SEK" type="number" value={expenseForm.amount} onChange={e => setExpenseForm(f => ({...f, amount: e.target.value}))}
                style={{ flex: 1, background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'var(--cream)', padding: '10px', fontSize: 14, fontFamily: 'var(--mono)' }} />
            </div>
            <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
              {['mat','dryck','golf','spa','transport','bet','övrigt'].map(t => (
                <button key={t} onClick={() => setExpenseForm(f => ({...f, tag: t}))}
                  style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, border: 'none', cursor: 'pointer', background: expenseForm.tag === t ? 'var(--gold)' : 'var(--surface2)', color: expenseForm.tag === t ? '#0A0A08' : 'var(--cream-muted)' }}>
                  {t === 'mat' ? '🍔' : t === 'dryck' ? '🍺' : t === 'golf' ? '⛳' : t === 'spa' ? '🧖' : t === 'transport' ? '🚗' : t === 'bet' ? '🎰' : '📦'} {t}
                </button>
              ))}
            </div>
            {/* Target player (optional – person-to-person) */}
            <div style={{ marginBottom: 8 }}>
              <select value={expenseTarget} onChange={e => setExpenseTarget(e.target.value)}
                style={{ width: '100%', background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'var(--cream)', padding: '8px', fontSize: 12 }}>
                <option value="">Delas av alla</option>
                {activePlayers.filter(p => p.key !== user?.key).map(p => (
                  <option key={p.key} value={p.key}>{p.nickname} ska betala (1-till-1)</option>
                ))}
              </select>
            </div>
            <button onClick={async () => {
              if (!expenseForm.description || !expenseForm.amount || !user) return
              const ins = {
                paid_by: user.key, amount: parseFloat(expenseForm.amount),
                description: expenseForm.description, tag: expenseForm.tag,
                created_by: user.key
              }
              if (expenseTarget) {
                ins.target_player = expenseTarget
                ins.split_between = [expenseTarget]
              } else {
                ins.split_between = activePlayers.map(p => p.key)
              }
              await supabase.from('inv_expenses').insert(ins)
              // Push till target_player om någon specifik
              if (expenseTarget) {
                const targetP = activePlayers.find(p => p.key === expenseTarget)
                if (targetP && targetP.id !== user.id) {
                  sendPush({
                    title: `💰 Ny skuld: ${ins.amount} kr`,
                    body: `${user.nickname} la ut "${ins.description}" – du är skyldig`,
                    type: 'expense',
                    targetPlayerId: targetP.id,
                    prefKey: 'notif_debts'
                  })
                }
              }
              setExpenseForm({ description: '', amount: '', tag: 'mat' })
              setExpenseTarget('')
              fetchExpenses()
              soundScore()
            }} style={{ width: '100%', padding: '12px', background: 'var(--gold)', color: '#0A0A08', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Lägg till
            </button>
          </div>

          {/* HEAD-TO-HEAD BETS */}
          <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--gold)', letterSpacing: 2, marginBottom: 8 }}>🆚 HEAD-TO-HEAD · 100 KR/VINST</div>
            <div style={{ fontSize: 11, color: 'var(--cream-muted)', marginBottom: 10 }}>3 matcher per dag. Förloraren betalar 100 kr.</div>
            {[1,2,3,4].map(rn => {
              const dayMatches = h2hMatches.filter(m => m.round_number === rn)
              const dayName = { 1: 'FREDAG', 2: 'LÖRDAG FM', 3: 'LÖRDAG EM', 4: 'SÖNDAG' }[rn]
              return (
                <div key={rn} style={{ marginBottom: 12 }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--cream-muted)', letterSpacing: 1, marginBottom: 4 }}>{dayName} (R{rn})</div>
                  {dayMatches.map(m => {
                    const p1 = activePlayers.find(p => p.key === m.player1_key)
                    const p2 = activePlayers.find(p => p.key === m.player2_key)
                    const w = m.winner_key ? activePlayers.find(p => p.key === m.winner_key) : null
                    return (
                      <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <Av p={p1} size={20} /><span style={{ fontSize: 11, color: m.winner_key === m.player1_key ? 'var(--green)' : 'var(--cream-dim)' }}>{p1?.nickname}</span>
                        <span style={{ fontSize: 10, color: 'var(--cream-muted)' }}>vs</span>
                        <Av p={p2} size={20} /><span style={{ fontSize: 11, color: m.winner_key === m.player2_key ? 'var(--green)' : 'var(--cream-dim)' }}>{p2?.nickname}</span>
                        <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 11 }}>
                          {w ? <span style={{ color: 'var(--green)' }}>🏆 {w.nickname}</span> : <span style={{ color: 'var(--cream-muted)' }}>Pågår</span>}
                        </span>
                        {isAdmin && !m.winner_key && (
                          <select onChange={async (e) => {
                            if (!e.target.value) return
                            await supabase.from('inv_h2h_matches').update({ winner_key: e.target.value }).eq('id', m.id)
                            // Auto-add to expenses
                            const loserKey = e.target.value === m.player1_key ? m.player2_key : m.player1_key
                            const winnerP = activePlayers.find(p => p.key === e.target.value)
                            const loserP = activePlayers.find(p => p.key === loserKey)
                            await supabase.from('inv_expenses').insert({
                              paid_by: loserKey, amount: m.stake, description: `H2H: ${loserP?.nickname} → ${winnerP?.nickname} R${rn}`,
                              tag: 'bet', target_player: e.target.value, split_between: [e.target.value], bet_type: 'h2h', created_by: user.key
                            })
                            fetchH2h(); fetchExpenses()
                            showToast(`${winnerP?.nickname} vinner H2H!`, 'birdie')
                            sendPush({
                              title: `⚔️ H2H avgjord!`,
                              body: `${winnerP?.nickname} besegrade ${loserP?.nickname} (${m.stake} kr) R${rn}`,
                              type: 'h2h',
                              prefKey: 'notif_bets'
                            })
                          }} style={{ width: 70, background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'var(--cream)', padding: '3px', fontSize: 10 }}>
                            <option value="">Vinnare?</option>
                            <option value={m.player1_key}>{p1?.nickname}</option>
                            <option value={m.player2_key}>{p2?.nickname}</option>
                          </select>
                        )}
                        <button onClick={async () => {
                          if (confirm('Radera H2H-match?')) {
                            await supabase.from('inv_h2h_matches').delete().eq('id', m.id)
                            await supabase.from('inv_expenses').delete().match({ bet_type: 'h2h', description: `H2H: ${activePlayers.find(p=>p.key===(m.winner_key===m.player1_key?m.player2_key:m.player1_key))?.nickname} → ${activePlayers.find(p=>p.key===m.winner_key)?.nickname} R${rn}` })
                            fetchH2h(); fetchExpenses()
                          }
                        }} style={{ background: 'none', border: 'none', color: 'var(--cream-muted)', fontSize: 12, cursor: 'pointer' }}>✕</button>
                      </div>
                    )
                  })}
                  <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                      <select id={`h2h-p1-${rn}`} style={{ flex: 1, background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'var(--cream)', padding: '4px', fontSize: 10 }}>
                        <option value="">Spelare 1</option>
                        {activePlayers.map(p => <option key={p.key} value={p.key}>{p.nickname}</option>)}
                      </select>
                      <select id={`h2h-p2-${rn}`} style={{ flex: 1, background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'var(--cream)', padding: '4px', fontSize: 10 }}>
                        <option value="">Spelare 2</option>
                        {activePlayers.map(p => <option key={p.key} value={p.key}>{p.nickname}</option>)}
                      </select>
                      <button onClick={async () => {
                        const p1 = document.getElementById(`h2h-p1-${rn}`).value
                        const p2 = document.getElementById(`h2h-p2-${rn}`).value
                        if (p1 && p2 && p1 !== p2) {
                          await supabase.from('inv_h2h_matches').insert({ round_number: rn, player1_key: p1, player2_key: p2, stake: 100 })
                          fetchH2h()
                          soundScore()
                        }
                      }} style={{ padding: '4px 10px', background: 'var(--gold)', color: '#0A0A08', border: 'none', borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>+</button>
                    </div>
                </div>
              )
            })}
          </div>

          {/* LD & NP BETS */}
          <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--gold)', letterSpacing: 2, marginBottom: 8 }}>🏌️ LD & 🎯 NP · 50 KR/RUNDA</div>
            <div style={{ fontSize: 11, color: 'var(--cream-muted)', marginBottom: 10 }}>Alla lägger i 50 kr. Vinnaren tar potten (300 kr).</div>
            {[1,2,3,4].map(rn => {
              const ldExpense = expenses.find(e => e.bet_type === 'ld' && e.description?.includes(`R${rn}`))
              const npExpense = expenses.find(e => e.bet_type === 'np' && e.description?.includes(`R${rn}`))
              return (
                <div key={rn} style={{ padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--cream-muted)', letterSpacing: 1 }}>R{rn}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 11 }}>🏌️ LD: </span>
                      {ldExpense ? <span style={{ fontSize: 11, color: 'var(--green)' }}>{activePlayers.find(p => p.key === ldExpense.target_player)?.nickname} 🏆</span>
                        : isAdmin ? (
                          <select onChange={async (e) => {
                            if (!e.target.value) return
                            const winner = activePlayers.find(p => p.key === e.target.value)
                            // Each player pays 50 to the winner
                            for (const p of activePlayers.filter(x => x.key !== e.target.value)) {
                              await supabase.from('inv_expenses').insert({
                                paid_by: p.key, amount: 50, description: `LD R${rn} → ${winner.nickname}`,
                                tag: 'bet', target_player: e.target.value, split_between: [e.target.value], bet_type: 'ld', created_by: user.key
                              })
                            }
                            fetchExpenses(); showToast(`${winner.nickname} vinner LD R${rn}!`, 'birdie')
                          }} style={{ background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, color: 'var(--cream)', padding: '2px', fontSize: 10 }}>
                            <option value="">Vinnare?</option>
                            {activePlayers.map(p => <option key={p.key} value={p.key}>{p.nickname}</option>)}
                          </select>
                        ) : <span style={{ fontSize: 11, color: 'var(--cream-muted)' }}>Ej avgjord</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 11 }}>🎯 NP: </span>
                      {npExpense ? <span style={{ fontSize: 11, color: 'var(--green)' }}>{activePlayers.find(p => p.key === npExpense.target_player)?.nickname} 🏆</span>
                        : isAdmin ? (
                          <select onChange={async (e) => {
                            if (!e.target.value) return
                            const winner = activePlayers.find(p => p.key === e.target.value)
                            for (const p of activePlayers.filter(x => x.key !== e.target.value)) {
                              await supabase.from('inv_expenses').insert({
                                paid_by: p.key, amount: 50, description: `NP R${rn} → ${winner.nickname}`,
                                tag: 'bet', target_player: e.target.value, split_between: [e.target.value], bet_type: 'np', created_by: user.key
                              })
                            }
                            fetchExpenses(); showToast(`${winner.nickname} vinner NP R${rn}!`, 'birdie')
                          }} style={{ background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, color: 'var(--cream)', padding: '2px', fontSize: 10 }}>
                            <option value="">Vinnare?</option>
                            {activePlayers.map(p => <option key={p.key} value={p.key}>{p.nickname}</option>)}
                          </select>
                        ) : <span style={{ fontSize: 11, color: 'var(--cream-muted)' }}>Ej avgjord</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Settlement summary */}
          {(() => {
            const playerKeys = activePlayers.map(p => p.key)
            const totals = {}
            playerKeys.forEach(k => { totals[k] = { paid: 0, owes: 0 } })
            expenses.forEach(e => {
              const amt = parseFloat(e.amount)
              if (e.target_player && e.bet_type) {
                // BET (LD/NP/H2H/prop): paid_by is the LOSER who owes target_player
                if (totals[e.paid_by]) totals[e.paid_by].owes += amt
                if (totals[e.target_player]) totals[e.target_player].paid += amt
              } else if (e.target_player && !e.bet_type) {
                // PERSONAL EXPENSE: paid_by LAID OUT money for target_player
                // target_player owes paid_by
                if (totals[e.paid_by]) totals[e.paid_by].paid += amt
                if (totals[e.target_player]) totals[e.target_player].owes += amt
              } else {
                // SHARED: paid_by laid out money, everyone shares equally
                if (totals[e.paid_by]) totals[e.paid_by].paid += amt
                const split = (e.split_between?.length > 0 ? e.split_between : playerKeys).filter(k => totals[k])
                const share = amt / split.length
                split.forEach(k => { if (totals[k]) totals[k].owes += share })
              }
            })
            const balances = {}
            playerKeys.forEach(k => { balances[k] = Math.round((totals[k].paid - totals[k].owes) * 100) / 100 })
            const debtors = playerKeys.filter(k => balances[k] < -0.01).map(k => ({ key: k, amount: -balances[k] })).sort((a,b) => b.amount - a.amount)
            const creditors = playerKeys.filter(k => balances[k] > 0.01).map(k => ({ key: k, amount: balances[k] })).sort((a,b) => b.amount - a.amount)
            const settlements = []
            let di = 0, ci = 0
            while (di < debtors.length && ci < creditors.length) {
              const amt = Math.min(debtors[di].amount, creditors[ci].amount)
              if (amt > 0.5) settlements.push({ from: debtors[di].key, to: creditors[ci].key, amount: Math.round(amt) })
              debtors[di].amount -= amt; creditors[ci].amount -= amt
              if (debtors[di].amount < 0.01) di++; if (creditors[ci].amount < 0.01) ci++
            }
            const grandTotal = expenses.reduce((s, e) => s + parseFloat(e.amount), 0)
            const getName = k => activePlayers.find(p => p.key === k)?.nickname || k
            return (<>
              <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 14, marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--gold)', letterSpacing: 2 }}>BALANS</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 18, color: 'var(--cream)' }}>{Math.round(grandTotal).toLocaleString()} kr totalt</div>
                </div>
                {playerKeys.map(k => {
                  const p = activePlayers.find(x => x.key === k); const bal = balances[k]
                  return (
                    <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <Av p={p} size={22} />
                      <div style={{ flex: 1, fontSize: 12 }}>{p?.nickname}</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--cream-muted)', minWidth: 55, textAlign: 'right' }}>{Math.round(totals[k]?.paid || 0)} kr</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 500, minWidth: 55, textAlign: 'right', color: bal > 0.5 ? 'var(--green)' : bal < -0.5 ? 'var(--coral)' : 'var(--cream-muted)' }}>
                        {bal > 0.5 ? `+${Math.round(bal)}` : bal < -0.5 ? Math.round(bal) : '±0'} kr
                      </div>
                    </div>
                  )
                })}
              </div>
              {settlements.length > 0 && (
                <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 14, marginBottom: 14 }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--gold)', letterSpacing: 2, marginBottom: 10 }}>GÖR UPP 🤝</div>
                  {settlements.map((s, i) => {
                    const toPlayer = activePlayers.find(p => p.key === s.to)
                    const fromPlayer = activePlayers.find(p => p.key === s.from)
                    const isMyDebt = s.from === user?.key
                    const canSwish = isMyDebt && toPlayer?.phone
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', flexWrap: 'wrap' }}>
                        <Av p={fromPlayer} size={22} />
                        <span style={{ fontSize: 13, color: 'var(--coral)' }}>{getName(s.from)}</span>
                        <span style={{ color: 'var(--cream-muted)' }}>→</span>
                        <Av p={toPlayer} size={22} />
                        <span style={{ fontSize: 13, color: 'var(--green)' }}>{getName(s.to)}</span>
                        <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 600 }}>{s.amount} kr</span>
                        {canSwish && <button onClick={() => setSwishModal({ toPlayer, fromPlayer, amount: s.amount })} style={{ background: '#EF6C00', color: '#fff', fontSize: 11, fontWeight: 600, padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer' }}>💸 Swisha</button>}
                        {isMyDebt && !toPlayer?.phone && <span style={{ fontSize: 10, color: 'var(--cream-muted)', fontStyle: 'italic' }}>Inget tel</span>}
                      </div>
                    )
                  })}
                </div>
              )}
            </>)
          })()}

          {/* Expense list */}
          <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--gold)', letterSpacing: 2, marginBottom: 10 }}>ALLA UTGIFTER & BETS</div>
            {expenses.length === 0 && <div style={{ fontSize: 13, color: 'var(--cream-muted)', textAlign: 'center', padding: 20 }}>Inga utgifter ännu</div>}
            {expenses.map(e => {
              const p = activePlayers.find(x => x.key === e.paid_by)
              const target = e.target_player ? activePlayers.find(x => x.key === e.target_player) : null
              const tagEmoji = { mat: '🍔', dryck: '🍺', golf: '⛳', spa: '🧖', transport: '🚗', bet: '🎰', övrigt: '📦' }
              return (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <Av p={p} size={18} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: 'var(--cream)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tagEmoji[e.tag] || '📦'} {e.description}</div>
                    <div style={{ fontSize: 9, color: 'var(--cream-muted)' }}>{p?.nickname}{target ? ` → ${target.nickname}` : ''} · {new Date(e.created_at).toLocaleString('sv-SE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 500, flexShrink: 0 }}>{Math.round(parseFloat(e.amount))} kr</div>
                  {(isAdmin || e.created_by === user?.key || e.paid_by === user?.key) && <button onClick={async () => { if (confirm('Radera utgift?')) { await supabase.from('inv_expenses').delete().eq('id', e.id); fetchExpenses() }}} style={{ background: 'none', border: 'none', color: 'var(--cream-muted)', fontSize: 11, cursor: 'pointer', flexShrink: 0 }}>✕</button>}
                </div>
              )
            })}
          </div>
        </>)}

        {/* ===== MIN PROFIL ===== */}
        {view === 'profile' && user && profileForm && (<>
          <div className="section-title">👤 Min profil</div>
          <div className="section-sub">Redigera dina uppgifter – glöm inte spara</div>

          {/* Avatar + nickname */}
          <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 16, marginBottom: 14, textAlign: 'center' }}>
            <Av p={user} size={80} />
            <div style={{ fontFamily: 'var(--serif)', fontSize: 22, color: 'var(--gold)', marginTop: 8 }}>{user.nickname}</div>
            <div style={{ fontSize: 12, color: 'var(--cream-muted)' }}>{user.name}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--cream-muted)', marginTop: 4 }}>HCP {user.hcp} · {user.team === 'green' ? '🟢 Smaragderna' : '🔵 Stålklubban'}</div>
          </div>

          {/* Kontaktuppgifter */}
          <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--gold)', letterSpacing: 2, marginBottom: 10 }}>KONTAKT</div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: 'var(--cream-muted)', marginBottom: 4 }}>📱 TELEFON (för Swish)</div>
              <input type="tel" value={profileForm.phone} placeholder="070xxxxxxx"
                onChange={e => setProfileForm(f => ({...f, phone: e.target.value}))}
                style={{ width: '100%', background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'var(--cream)', padding: '10px', fontSize: 14 }} />
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: 'var(--cream-muted)', marginBottom: 4 }}>✉️ EMAIL</div>
              <input type="email" value={profileForm.email} placeholder="din@email.se"
                onChange={e => setProfileForm(f => ({...f, email: e.target.value}))}
                style={{ width: '100%', background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'var(--cream)', padding: '10px', fontSize: 14 }} />
            </div>
          </div>

          {/* Profilinställningar */}
          <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--gold)', letterSpacing: 2, marginBottom: 10 }}>PROFIL</div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: 'var(--cream-muted)', marginBottom: 4 }}>NICKNAME</div>
              <input value={profileForm.nickname}
                onChange={e => setProfileForm(f => ({...f, nickname: e.target.value}))}
                style={{ width: '100%', background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'var(--cream)', padding: '10px', fontSize: 14 }} />
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: 'var(--cream-muted)', marginBottom: 4 }}>🎵 WALK-UP ANTHEM</div>
              <input value={profileForm.song} placeholder="Din låt"
                onChange={e => setProfileForm(f => ({...f, song: e.target.value}))}
                style={{ width: '100%', background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'var(--cream)', padding: '10px', fontSize: 14 }} />
            </div>

            <div>
              <div style={{ fontSize: 10, color: 'var(--cream-muted)', marginBottom: 4 }}>📸 PROFILBILD (URL)</div>
              <input value={profileForm.image_url} placeholder="https://..."
                onChange={e => setProfileForm(f => ({...f, image_url: e.target.value}))}
                style={{ width: '100%', background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'var(--cream)', padding: '10px', fontSize: 12, fontFamily: 'var(--mono)' }} />
            </div>
          </div>

          {/* Push-notiser */}
          <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--gold)', letterSpacing: 2, marginBottom: 10 }}>🔔 PUSH-NOTISER</div>
            <PushSubscribeButton playerId={user.id} />
            <div style={{ fontSize: 10, color: 'var(--cream-muted)', marginTop: 10, marginBottom: 10, lineHeight: 1.5 }}>
              På iPhone: lägg till appen på hemskärmen först. Öppna sedan därifrån och aktivera notiser.
            </div>

            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--cream-muted)', letterSpacing: 1.5, marginTop: 14, marginBottom: 6 }}>VAD VILL DU FÅ?</div>

            {[
              { key: 'notif_eagles', label: '🦅 Eagles & Birdies', desc: 'När någon gör 3+ poäng' },
              { key: 'notif_bets', label: '🎲 Bet-avgöranden', desc: 'H2H, LD/NP, Prop bets' },
              { key: 'notif_mentions', label: '💬 @-mentions i chat', desc: 'När någon taggar dig' },
              { key: 'notif_debts', label: '💰 Nya skulder', desc: 'När någon la ut åt dig' },
              { key: 'notif_leader', label: '👑 Ny ledare', desc: 'Förstaplatsen byter händer' },
            ].map(n => (
              <label key={n.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--cream)' }}>{n.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--cream-muted)' }}>{n.desc}</div>
                </div>
                <input type="checkbox" checked={profileForm[n.key] !== false}
                  onChange={e => setProfileForm(f => ({...f, [n.key]: e.target.checked}))}
                  style={{ width: 20, height: 20, accentColor: 'var(--gold)' }} />
              </label>
            ))}
          </div>

          {/* Övriga inställningar */}
          <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--gold)', letterSpacing: 2, marginBottom: 10 }}>ÖVRIGT</div>

            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}>
              <div>
                <div style={{ fontSize: 13, color: 'var(--cream)' }}>📊 Daglig sammanfattning</div>
                <div style={{ fontSize: 10, color: 'var(--cream-muted)' }}>Mail kl 22 med dagens stats</div>
              </div>
              <input type="checkbox" checked={profileForm.daily_summary}
                onChange={e => setProfileForm(f => ({...f, daily_summary: e.target.checked}))}
                style={{ width: 20, height: 20, accentColor: 'var(--gold)' }} />
            </label>

            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', cursor: 'pointer' }}>
              <div>
                <div style={{ fontSize: 13, color: 'var(--cream)' }}>🔊 Ljudeffekter i appen</div>
                <div style={{ fontSize: 10, color: 'var(--cream-muted)' }}>Ljud vid birdies/eagles när appen är öppen</div>
              </div>
              <input type="checkbox" checked={profileForm.notifications}
                onChange={e => setProfileForm(f => ({...f, notifications: e.target.checked}))}
                style={{ width: 20, height: 20, accentColor: 'var(--gold)' }} />
            </label>
          </div>

          {/* PIN */}
          <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--gold)', letterSpacing: 2, marginBottom: 10 }}>🔒 PIN-KOD</div>
            <div style={{ fontSize: 11, color: 'var(--cream-muted)', marginBottom: 8 }}>Valfri 4-siffrig PIN (tom = ingen PIN)</div>
            <input type="password" inputMode="numeric" maxLength={4} value={profileForm.pin} placeholder="••••"
              onChange={e => setProfileForm(f => ({...f, pin: e.target.value.replace(/\D/g, '').slice(0, 4)}))}
              style={{ width: '100%', background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'var(--cream)', padding: '10px', fontSize: 18, letterSpacing: 8, textAlign: 'center', fontFamily: 'var(--mono)' }} />
          </div>

          {/* SPARA-KNAPP */}
          <button onClick={async () => {
            const updates = {
              phone: profileForm.phone || null,
              email: profileForm.email || null,
              nickname: profileForm.nickname,
              song: profileForm.song || null,
              image_url: profileForm.image_url || null,
              pin: profileForm.pin || null,
              daily_summary: profileForm.daily_summary,
              notifications: profileForm.notifications,
              notif_eagles: profileForm.notif_eagles,
              notif_bets: profileForm.notif_bets,
              notif_mentions: profileForm.notif_mentions,
              notif_debts: profileForm.notif_debts,
              notif_leader: profileForm.notif_leader
            }
            const { error } = await supabase.from('inv_players').update(updates).eq('id', user.id)
            if (error) {
              showToast('❌ Spara misslyckades', 'zero')
              console.error('Save error:', error)
              return
            }
            setUser(u => ({ ...u, ...updates }))
            await fetchAll()
            showToast('✅ Profil sparad!', 'birdie')
            soundScore && soundScore()
          }} style={{ width: '100%', padding: '14px', background: 'var(--gold)', color: '#0A0A08', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer', marginBottom: 14 }}>
            💾 Spara profil
          </button>

          {/* Snabbåtgärder */}
          <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--gold)', letterSpacing: 2, marginBottom: 10 }}>SNABBÅTGÄRDER</div>
            <button onClick={() => {
              if (user.email) {
                const subject = `DIO 2026 – Dagens sammanfattning`
                const body = `Hej ${user.nickname}!\n\nHär är dagens snabbinfo från DIO-appen:\n\n📊 Ledare: ${lb[0]?.nickname || '–'} (${lb[0] ? pTotal(lb[0].id) : 0}p)\n🎯 Din plats: ${lb.findIndex(p => p.id === user.id) + 1} av ${lb.length}\n💰 Din poäng: ${pTotal(user.id)}p\n\n⛳ Fortsätt köra!\nDIO-appen`
                window.location.href = `mailto:${user.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
              } else {
                showToast('Lägg till email först', 'zero')
              }
            }} style={{ width: '100%', padding: '12px', background: 'var(--surface2)', color: 'var(--cream)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 13, cursor: 'pointer', marginBottom: 8 }}>
              📧 Maila dagens sammanfattning
            </button>
            <button onClick={() => {
              const shareUrl = window.location.origin
              const text = `Häng med i DIO 2026! Jag ligger #${lb.findIndex(p => p.id === user.id) + 1} med ${pTotal(user.id)}p. ${shareUrl}`
              if (navigator.share) {
                navigator.share({ title: 'DIO 2026', text, url: shareUrl })
              } else {
                navigator.clipboard.writeText(text)
                showToast('Kopierat!', 'birdie')
              }
            }} style={{ width: '100%', padding: '12px', background: 'var(--surface2)', color: 'var(--cream)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 13, cursor: 'pointer', marginBottom: 8 }}>
              🔗 Dela min status
            </button>
            <button onClick={() => { setUser(null); setProfileForm(null); setView('leaderboard') }}
              style={{ width: '100%', padding: '12px', background: 'transparent', color: 'var(--coral)', border: '1px solid var(--coral)', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
              🚪 Logga ut
            </button>
          </div>
        </>)}

        {/* ===== SETTINGS (ADMIN ONLY) ===== */}
        {view === 'settings' && isAdmin && (<>
          <div className="section-title">⚙️ Admin Settings</div>

          {/* HCP per spelare */}
          <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--gold)', letterSpacing: 2, marginBottom: 10 }}>HANDICAP</div>
            {activePlayers.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <Av p={p} size={24} />
                <div style={{ flex: 1, fontSize: 13 }}>{p.nickname}</div>
                <input type="number" step="0.1" defaultValue={p.hcp} style={{ width: 60, background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'var(--cream)', padding: '4px 6px', fontSize: 14, textAlign: 'center', fontFamily: 'var(--mono)' }}
                  onBlur={async (e) => {
                    const v = parseFloat(e.target.value)
                    if (!isNaN(v) && v !== parseFloat(p.hcp)) {
                      await supabase.from('inv_players').update({ hcp: v }).eq('id', p.id)
                      fetchAll()
                      showToast(`${p.nickname} HCP → ${v}`, 'birdie')
                    }
                  }} />
              </div>
            ))}
          </div>

          {/* 📱 Swish-nummer */}
          <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--gold)', letterSpacing: 2, marginBottom: 6 }}>📱 SWISH-NUMMER</div>
            <div style={{ fontSize: 11, color: 'var(--cream-muted)', marginBottom: 10 }}>Används för "💸 Swisha"-knapparna i settlement</div>
            {activePlayers.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <Av p={p} size={24} />
                <div style={{ flex: 1, fontSize: 13 }}>{p.nickname}</div>
                <input type="tel" defaultValue={p.phone || ''} placeholder="070xxxxxxx" style={{ width: 130, background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'var(--cream)', padding: '4px 8px', fontSize: 12, fontFamily: 'var(--mono)' }}
                  onBlur={async (e) => {
                    const phone = e.target.value.replace(/\s/g, '')
                    if (phone !== (p.phone || '')) {
                      await supabase.from('inv_players').update({ phone: phone || null }).eq('id', p.id)
                      fetchAll()
                      showToast(`${p.nickname} telefon sparad`, 'birdie')
                    }
                  }} />
              </div>
            ))}
          </div>

          {/* 🔒 PIN-hantering (admin) */}
          <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--gold)', letterSpacing: 2, marginBottom: 6 }}>🔒 PIN-HANTERING</div>
            <div style={{ fontSize: 11, color: 'var(--cream-muted)', marginBottom: 10 }}>Sätt eller återställ PIN för spelare. Reset → 0000 + kräver byte vid nästa login.</div>
            {activePlayers.filter(p => p.key !== 'spectator').map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <Av p={p} size={24} />
                <div style={{ flex: 1, fontSize: 13 }}>
                  {p.nickname}
                  {p.must_change_pin && <span style={{ fontSize: 9, color: 'var(--coral)', marginLeft: 6 }}>⚠️ ej bytt</span>}
                </div>
                <input type="text" inputMode="numeric" maxLength={4} placeholder="••••" style={{ width: 70, background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'var(--cream)', padding: '4px 8px', fontSize: 14, fontFamily: 'var(--mono)', letterSpacing: 4, textAlign: 'center' }}
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter') {
                      const pin = e.target.value.replace(/\D/g, '').slice(0, 4)
                      if (pin.length === 4) {
                        await supabase.from('inv_players').update({ pin, must_change_pin: pin === '0000' }).eq('id', p.id)
                        fetchAll()
                        showToast(`${p.nickname} PIN satt`, 'birdie')
                        e.target.value = ''
                      }
                    }
                  }} />
                <button onClick={async () => {
                  if (confirm(`Återställ ${p.nickname}s PIN till 0000? Måste bytas vid nästa inloggning.`)) {
                    await supabase.from('inv_players').update({ pin: '0000', must_change_pin: true }).eq('id', p.id)
                    fetchAll()
                    showToast(`${p.nickname} PIN återställd`, 'birdie')
                  }
                }} style={{ background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--cream-muted)', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>
                  🔄 Reset
                </button>
              </div>
            ))}
          </div>

          {/* 📢 BROADCAST – Skicka custom push */}
          <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--gold)', letterSpacing: 2, marginBottom: 6 }}>📢 SKICKA PUSH-NOTIS</div>
            <div style={{ fontSize: 11, color: 'var(--cream-muted)', marginBottom: 12 }}>Skicka ett custom meddelande till alla eller en specifik spelare</div>

            {/* Snabbval */}
            <div style={{ fontSize: 9, color: 'var(--cream-muted)', fontFamily: 'var(--mono)', letterSpacing: 1.5, marginBottom: 6 }}>SNABBVAL</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
              {[
                { t: '⏰ Tee-off om 30 min', b: 'Dags att värma upp på rangen!' },
                { t: '🍺 Möts i baren', b: 'Samling i baren nu – dags för drinkar' },
                { t: '🧖 Spa kl 20:00', b: 'Dags att slappna av – spa öppnar nu' },
                { t: '🍽️ Middag serveras', b: 'Kom till matsalen – middagen är serverad' },
                { t: '🏆 Prisutdelning!', b: 'Samling för Le Douche de Golf-ceremonin' },
                { t: '📸 Grupp-foto', b: 'Alla till first tee för gruppfoto' },
              ].map((q, i) => (
                <button key={i} onClick={() => setBroadcastForm(f => ({ ...f, title: q.t, body: q.b }))}
                  style={{ fontSize: 10, padding: '6px 10px', background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--cream-dim)', borderRadius: 6, cursor: 'pointer' }}>
                  {q.t}
                </button>
              ))}
            </div>

            {/* Mottagare */}
            <div style={{ fontSize: 10, color: 'var(--cream-muted)', marginBottom: 4 }}>MOTTAGARE</div>
            <select value={broadcastForm.target} onChange={e => setBroadcastForm(f => ({...f, target: e.target.value}))}
              style={{ width: '100%', background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'var(--cream)', padding: '10px', fontSize: 13, marginBottom: 10 }}>
              <option value="all">📣 Alla spelare</option>
              <option value="others">📣 Alla utom mig</option>
              {activePlayers.filter(p => p.key !== 'spectator').map(p => (
                <option key={p.id} value={p.id}>👤 {p.nickname} ({p.name.split(' ')[0]})</option>
              ))}
            </select>

            {/* Titel */}
            <div style={{ fontSize: 10, color: 'var(--cream-muted)', marginBottom: 4 }}>TITEL</div>
            <input value={broadcastForm.title} onChange={e => setBroadcastForm(f => ({...f, title: e.target.value}))}
              placeholder="t.ex. ⛳ Dags för tee-off!" maxLength={60}
              style={{ width: '100%', background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'var(--cream)', padding: '10px', fontSize: 13, marginBottom: 10 }} />

            {/* Body */}
            <div style={{ fontSize: 10, color: 'var(--cream-muted)', marginBottom: 4 }}>MEDDELANDE</div>
            <textarea value={broadcastForm.body} onChange={e => setBroadcastForm(f => ({...f, body: e.target.value}))}
              placeholder="Skriv ditt meddelande..." maxLength={200} rows={3}
              style={{ width: '100%', background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'var(--cream)', padding: '10px', fontSize: 13, marginBottom: 4, resize: 'vertical', fontFamily: 'inherit' }} />
            <div style={{ fontSize: 9, color: 'var(--cream-muted)', textAlign: 'right', marginBottom: 12 }}>{broadcastForm.body.length}/200</div>

            {/* Förhandsgranskning */}
            {(broadcastForm.title || broadcastForm.body) && (
              <div style={{ background: 'linear-gradient(135deg, #0D2818 0%, #1A3A2A 100%)', border: '1px solid var(--green-fairway)', borderRadius: 10, padding: 12, marginBottom: 12 }}>
                <div style={{ fontSize: 9, color: 'var(--cream-muted)', fontFamily: 'var(--mono)', letterSpacing: 1.5, marginBottom: 6 }}>FÖRHANDSGRANSKNING</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cream)', marginBottom: 2 }}>{broadcastForm.title || '(titel saknas)'}</div>
                <div style={{ fontSize: 12, color: 'var(--cream-dim)', lineHeight: 1.4 }}>{broadcastForm.body || '(meddelande saknas)'}</div>
              </div>
            )}

            {/* Skicka */}
            <button onClick={async () => {
              if (!broadcastForm.title || !broadcastForm.body) {
                showToast('Fyll i både titel och meddelande', 'zero')
                return
              }
              setBroadcastSending(true)
              try {
                const payload = {
                  title: broadcastForm.title,
                  body: broadcastForm.body,
                  type: 'broadcast'
                }
                if (broadcastForm.target === 'all') {
                  // Skicka till alla – ingen exclude
                } else if (broadcastForm.target === 'others') {
                  payload.excludePlayerId = user.id
                } else {
                  payload.targetPlayerId = broadcastForm.target
                }
                await sendPush(payload)
                showToast(`📢 Push skickad till ${broadcastForm.target === 'all' ? 'alla' : broadcastForm.target === 'others' ? 'alla utom dig' : activePlayers.find(p => p.id === broadcastForm.target)?.nickname}!`, 'birdie')
                setBroadcastForm({ title: '', body: '', target: 'all' })
              } catch (err) {
                showToast('❌ Kunde inte skicka: ' + err.message, 'zero')
              }
              setBroadcastSending(false)
            }} disabled={broadcastSending || !broadcastForm.title || !broadcastForm.body}
              style={{ width: '100%', padding: '12px', background: (broadcastForm.title && broadcastForm.body && !broadcastSending) ? 'var(--gold)' : 'var(--surface2)', color: (broadcastForm.title && broadcastForm.body && !broadcastSending) ? '#0A0A08' : 'var(--cream-muted)', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: broadcastSending ? 'wait' : 'pointer' }}>
              {broadcastSending ? '⏳ Skickar...' : '🚀 Skicka push-notis'}
            </button>
          </div>

          {/* Lagindelning */}
          <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--gold)', letterSpacing: 2, marginBottom: 10 }}>LAGINDELNING</div>
            {activePlayers.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <Av p={p} size={24} />
                <div style={{ flex: 1, fontSize: 13 }}>{p.nickname}</div>
                <select defaultValue={p.team} style={{ background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'var(--cream)', padding: '4px 8px', fontSize: 12 }}
                  onChange={async (e) => {
                    await supabase.from('inv_players').update({ team: e.target.value }).eq('id', p.id)
                    fetchAll()
                    showToast(`${p.nickname} → ${e.target.value === 'green' ? 'Smaragderna' : 'Stålklubban'}`, 'birdie')
                  }}>
                  <option value="green">Smaragderna</option>
                  <option value="blue">Stålklubban</option>
                </select>
              </div>
            ))}
          </div>

          {/* Rundor & Banval */}
          <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--gold)', letterSpacing: 2, marginBottom: 10 }}>RUNDOR & BANVAL</div>
            {[1,2,3,4].map(rn => (
              <div key={rn} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--cream)', minWidth: 30 }}>R{rn}</div>
                <select defaultValue={rounds.find(x => x.round_number === rn)?.course || RC[rn]} style={{ flex: 1, background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'var(--cream)', padding: '6px 8px', fontSize: 12 }}
                  onChange={async (e) => {
                    const r = rounds.find(x => x.round_number === rn)
                    if (r) {
                      await supabase.from('inv_rounds').update({ course: e.target.value }).eq('id', r.id)
                      fetchAll()
                      showToast(`R${rn} → ${e.target.value}`, 'birdie')
                    }
                  }}>
                  <option value="Skogsbanan">Skogsbanan</option>
                  <option value="Parkbanan">Parkbanan</option>
                </select>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--cream-muted)' }}>{RL[rn]}</div>
              </div>
            ))}
          </div>

          {/* Slope & CR override */}
          <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--gold)', letterSpacing: 2, marginBottom: 10 }}>SLOPE & CR (BANDATA)</div>
            {Object.entries(courses).map(([name, c]) => (
              <div key={name} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--cream)', marginBottom: 6 }}>{name}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--cream-muted)' }}>SLOPE</div>
                    <input type="number" defaultValue={c.slope} style={{ width: '100%', background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'var(--cream)', padding: '4px 6px', fontSize: 14, fontFamily: 'var(--mono)' }}
                      onBlur={async (e) => {
                        const v = parseInt(e.target.value)
                        if (!isNaN(v) && v !== c.slope) {
                          await supabase.from('inv_settings').upsert({ key: `slope_${name}`, value: v, updated_by: user.nickname })
                          showToast(`${name} slope → ${v}`, 'birdie')
                        }
                      }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--cream-muted)' }}>CR</div>
                    <input type="number" step="0.1" defaultValue={c.cr} style={{ width: '100%', background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'var(--cream)', padding: '4px 6px', fontSize: 14, fontFamily: 'var(--mono)' }}
                      onBlur={async (e) => {
                        const v = parseFloat(e.target.value)
                        if (!isNaN(v)) {
                          await supabase.from('inv_settings').upsert({ key: `cr_${name}`, value: v, updated_by: user.nickname })
                          showToast(`${name} CR → ${v}`, 'birdie')
                        }
                      }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* LD / NP / Double per runda */}
          <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--gold)', letterSpacing: 2, marginBottom: 10 }}>SPECIALHÅL PER RUNDA</div>
            {[1,2,3,4].map(rn => {
              const s = sp || specialHoles[rn] || {}
              return (
                <div key={rn} style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--cream)', marginBottom: 6 }}>R{rn} – {RC[rn]}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--cream-muted)' }}>🏌️ LD HÅL</div>
                      <input type="number" min="1" max="18" defaultValue={specialHoles[rn]?.ld} style={{ width: '100%', background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'var(--cream)', padding: '4px 6px', fontSize: 14, fontFamily: 'var(--mono)' }}
                        onBlur={async (e) => {
                          const v = parseInt(e.target.value)
                          if (v >= 1 && v <= 18) {
                            const cur = specialHoles[rn] || {}
                            cur.ld = v
                            const all = { ...specialHoles, [rn]: cur }
                            await supabase.from('inv_settings').upsert({ key: 'special_holes', value: all, updated_by: user.nickname })
                            showToast(`R${rn} LD → Hål ${v}`, 'birdie')
                          }
                        }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--cream-muted)' }}>🎯 NP HÅL</div>
                      <input type="number" min="1" max="18" defaultValue={specialHoles[rn]?.np} style={{ width: '100%', background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'var(--cream)', padding: '4px 6px', fontSize: 14, fontFamily: 'var(--mono)' }}
                        onBlur={async (e) => {
                          const v = parseInt(e.target.value)
                          if (v >= 1 && v <= 18) {
                            const cur = specialHoles[rn] || {}
                            cur.np = v
                            const all = { ...specialHoles, [rn]: cur }
                            await supabase.from('inv_settings').upsert({ key: 'special_holes', value: all, updated_by: user.nickname })
                            showToast(`R${rn} NP → Hål ${v}`, 'birdie')
                          }
                        }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--cream-muted)' }}>⚡ 2× FRÅN</div>
                      <input type="number" min="1" max="18" defaultValue={specialHoles[rn]?.doubleStart || 16} style={{ width: '100%', background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'var(--cream)', padding: '4px 6px', fontSize: 14, fontFamily: 'var(--mono)' }}
                        onBlur={async (e) => {
                          const v = parseInt(e.target.value)
                          if (v >= 1 && v <= 18) {
                            const cur = specialHoles[rn] || {}
                            cur.doubleStart = v
                            const all = { ...specialHoles, [rn]: cur }
                            await supabase.from('inv_settings').upsert({ key: 'special_holes', value: all, updated_by: user.nickname })
                            showToast(`R${rn} 2× från hål ${v}`, 'birdie')
                          }
                        }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Radera scores */}
          <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--gold)', letterSpacing: 2, marginBottom: 10 }}>RADERA SCORE</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <select id="del-player" style={{ flex: 1, background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'var(--cream)', padding: '6px 8px', fontSize: 12 }}>
                {activePlayers.map(p => <option key={p.id} value={p.id}>{p.nickname}</option>)}
              </select>
              <select id="del-round" style={{ flex: 1, background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'var(--cream)', padding: '6px 8px', fontSize: 12 }}>
                {[1,2,3,4].map(r => <option key={r} value={r}>R{r}</option>)}
              </select>
              <input id="del-hole" type="number" min="1" max="18" placeholder="Hål" style={{ width: 50, background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'var(--cream)', padding: '6px', fontSize: 12, fontFamily: 'var(--mono)' }} />
            </div>
            <button onClick={async () => {
              const pid = document.getElementById('del-player').value
              const rn = parseInt(document.getElementById('del-round').value)
              const hole = parseInt(document.getElementById('del-hole').value)
              const r = rounds.find(x => x.round_number === rn)
              if (r && hole >= 1 && hole <= 18) {
                const pl = activePlayers.find(p => p.id === pid)
                if (confirm(`Radera ${pl?.nickname} R${rn} Hål ${hole}?`)) {
                  await supabase.from('inv_scores').delete().eq('player_id', pid).eq('round_id', r.id).eq('hole', hole)
                  fetchAll()
                  showToast(`Raderat: ${pl?.nickname} R${rn} H${hole}`, 'zero')
                }
              }
            }} style={{ width: '100%', padding: '10px', background: 'var(--coral)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
              🗑️ Radera score
            </button>
          </div>

          {/* Nollställ hel runda */}
          <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--coral)', letterSpacing: 2, marginBottom: 10 }}>DANGER ZONE</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <select id="reset-round" style={{ flex: 1, background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'var(--cream)', padding: '6px 8px', fontSize: 12 }}>
                {[1,2,3,4].map(r => <option key={r} value={r}>R{r} – {RC[r]}</option>)}
              </select>
              <button onClick={async () => {
                const rn = parseInt(document.getElementById('reset-round').value)
                const r = rounds.find(x => x.round_number === rn)
                if (r && confirm(`⚠️ NOLLSTÄLL ALLA SCORES för R${rn}? Detta kan inte ångras!`)) {
                  await supabase.from('inv_scores').delete().eq('round_id', r.id)
                  fetchAll()
                  showToast(`R${rn} nollställd`, 'zero')
                }
              }} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--coral)', color: 'var(--coral)', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>
                ⚠️ Nollställ runda
              </button>
            </div>
          </div>
        </>)}

      </div>

      {/* ===== SIDE MENU (hamburger) ===== */}
      {showMenu && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setShowMenu(false) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 500, display: 'flex', justifyContent: 'flex-end', animation: 'fadeIn 0.2s ease' }}>
          <div style={{ width: '280px', maxWidth: '85vw', background: 'linear-gradient(180deg, var(--surface) 0%, #0E1A12 100%)', height: '100%', overflowY: 'auto', paddingTop: 'var(--safe-top)', animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            {/* Header */}
            <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Av p={user} size={44} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 18, color: 'var(--gold)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.nickname}</div>
                  <div style={{ fontSize: 11, color: 'var(--cream-muted)', fontFamily: 'var(--mono)' }}>#{lb.findIndex(p => p.id === user.id) + 1} · {pTotal(user.id)}p</div>
                </div>
                <button onClick={() => setShowMenu(false)} style={{ background: 'none', border: 'none', color: 'var(--cream-muted)', fontSize: 22, cursor: 'pointer', padding: 4 }}>✕</button>
              </div>
            </div>

            {/* Menu items */}
            <div style={{ padding: 12 }}>
              {[
                { key: 'teams', icon: '⚔️', label: 'Lag-battle', desc: 'Smaragderna vs Stålklubban' },
                { key: 'feed', icon: '💬', label: 'Chat', desc: 'Trash talk i realtid' },
                { key: 'expenses', icon: '💰', label: 'Even Steven', desc: 'Utgifter, bets & Swish' },
                { key: 'gallery', icon: '📸', label: 'Foton', desc: 'Helgen i bilder' },
                { key: 'info', icon: '📋', label: 'Turneringsinfo', desc: 'Schema, stats, awards' },
                { key: 'profile', icon: '👤', label: 'Min profil', desc: 'Inställningar & kontakt' },
                ...(isAdmin ? [{ key: 'settings', icon: '⚙️', label: 'Admin', desc: 'HCP, lag, bana, PIN' }] : []),
              ].map(t => (
                <button key={t.key} onClick={() => { setView(t.key); setShowMenu(false) }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '12px 12px', background: view === t.key ? 'rgba(201,168,76,0.1)' : 'transparent', border: view === t.key ? '1px solid var(--gold-dim)' : '1px solid transparent', borderRadius: 10, cursor: 'pointer', textAlign: 'left', marginBottom: 4 }}>
                  <span style={{ fontSize: 24 }}>{t.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: view === t.key ? 'var(--gold)' : 'var(--cream)' }}>{t.label}</div>
                    <div style={{ fontSize: 10, color: 'var(--cream-muted)', marginTop: 1 }}>{t.desc}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.04)', marginTop: 10 }}>
              <div style={{ fontSize: 10, color: 'var(--cream-muted)', fontFamily: 'var(--mono)', textAlign: 'center', letterSpacing: 2 }}>DIO · 2026 · HOOKS HERRGÅRD</div>
              <div style={{ fontSize: 9, color: 'var(--cream-muted)', textAlign: 'center', marginTop: 4 }}>⛳ Le Douche de Golf</div>
            </div>
          </div>
        </div>
      )}

      {/* ===== SWISH MODAL ===== */}
      <SwishModal open={!!swishModal} onClose={() => setSwishModal(null)}
        toPlayer={swishModal?.toPlayer} fromPlayer={swishModal?.fromPlayer} amount={swishModal?.amount} />

      {/* ===== BOTTOM NAV (2 main + hamburger) ===== */}
      <nav className="bottom-nav">
        {[
          { key: 'leaderboard', icon: '🏆', label: 'LEDARE' },
          { key: 'scorecard', icon: '⛳', label: 'SCORE' },
        ].map(t => (
          <button key={t.key} className={`bottom-nav-btn ${view === t.key ? 'active' : ''}`} onClick={() => setView(t.key)}>
            <span className="nav-icon">{t.icon}</span>{t.label}
          </button>
        ))}
        <button className="bottom-nav-btn" onClick={() => setShowMenu(true)}>
          <span className="nav-icon">☰</span>MENY
        </button>
      </nav>
    </div>
  )
}
