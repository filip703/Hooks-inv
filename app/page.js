'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { courses, getPlayingHcp, calcStableford, checkStreaks, getShoutout, getZeroRoast, specialHoles, walkupMusic, pepTalks, guideUrls, getRandomRoast, venueImages, achievements, flyovers, playlists, getStrokesGiven } from '../lib/courses'
import { TABY_GPS, distanceToGreen, distanceToTee, haversineDistance } from '../lib/courses-taby'
import { soundBirdie, soundEagle, soundZero, soundChat, soundScore, initAudio } from '../lib/sounds'
import { isPushSupported, getSubscriptionStatus, subscribeToPush, unsubscribeFromPush, sendPush } from '../lib/push'
import { AugustaBadge, LakeBadge, IconTrophy, IconFlag, IconLeaderboard, IconScorecard, IconMenu, IconSwords, IconChat, IconWallet, IconDice, IconCamera, IconInfo, IconUser, IconSettings, IconBell, IconSun, IconMoon, IconRefresh, IconLock, IconSwish, IconGreenJacket, IconGolfBall } from '../lib/icons'
import QRCode from 'qrcode'

const RC_DEFAULT = { 1: 'Skogsbanan', 2: 'Parkbanan', 3: 'Skogsbanan', 4: 'Parkbanan' }
const RL = { 1: 'R1 Fre', 2: 'R2 Lör FM', 3: 'R3 Lör EM', 4: 'R4 Sön' }
const DAYS = { 1: 'Fredag', 2: 'Lördag', 3: 'Lördag', 4: 'Söndag' }

function SwishModal({ open, onClose, toPlayer, fromPlayer, amount, onMarkPaid }) {
  const [qrDataUrl, setQrDataUrl] = useState('')

  useEffect(() => {
    if (!open || !toPlayer?.phone) return
    const phone = toPlayer.phone.replace(/\D/g, '').replace(/^0/, '46')
    const msg = `DIO 2026 - ${fromPlayer?.nickname} till ${toPlayer?.nickname}`.replace(/[^a-zA-Z0-9 åäöÅÄÖ:.,?!()]/g, '')
    const qrPayload = `C${phone};${amount};${msg};0`
    QRCode.toDataURL(qrPayload, { width: 280, margin: 2, color: { dark: '#0A0F0A', light: '#F5F0E8' } })
      .then(setQrDataUrl).catch(console.error)
  }, [open, toPlayer, fromPlayer, amount])

  if (!open || !toPlayer) return null

  const phone = toPlayer.phone?.replace(/\D/g, '') || ''
  const message = `DIO 2026 - ${fromPlayer?.nickname} till ${toPlayer?.nickname}`

  const openSwishDirect = () => {
    const phoneSwedish = phone.replace(/^46/, '0')
    const url = `swish://payment?data=${encodeURIComponent(JSON.stringify({ version: 1, payee: { value: phoneSwedish, editable: false }, amount: { value: amount, editable: false }, message: { value: message, editable: true } }))}`
    window.location.href = url
  }

  const copyAll = async () => {
    const text = `Swish: ${phone}\nBelopp: ${amount} kr\nMedd: ${message}`
    try { await navigator.clipboard.writeText(text); alert('✅ Kopierat! Öppna Swish och klistra in') } catch {}
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

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
          <Av p={fromPlayer} size={32} />
          <span style={{ color: 'var(--coral)', fontSize: 14 }}>{fromPlayer?.nickname}</span>
          <span style={{ color: 'var(--cream-muted)', fontSize: 16 }}>→</span>
          <Av p={toPlayer} size={32} />
          <span style={{ color: 'var(--green)', fontSize: 14 }}>{toPlayer?.nickname}</span>
        </div>

        <div style={{ fontFamily: 'var(--mono)', fontSize: 32, color: 'var(--gold)', marginBottom: 14 }}>{amount} kr</div>

        {/* Primär: Öppna Swish direkt */}
        <button onClick={openSwishDirect} style={{ width: '100%', padding: '14px', background: '#EF6C00', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer', marginBottom: 10 }}>
          🚀 Öppna Swish direkt
        </button>

        {/* Markera som betald */}
        <button onClick={() => { onMarkPaid && onMarkPaid(); onClose() }} style={{ width: '100%', padding: '12px', background: 'rgba(107,191,127,0.15)', color: 'var(--green)', border: '1px solid var(--green)', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 10 }}>
          ✅ Markera som betald
        </button>

        <div style={{ fontSize: 11, color: 'var(--cream-muted)', marginBottom: 14, lineHeight: 1.4 }}>
          Om knappen inte öppnar Swish → använd QR-koden eller kopiera manuellt nedan
        </div>

        {qrDataUrl && (
          <details style={{ marginBottom: 10, textAlign: 'left' }}>
            <summary style={{ cursor: 'pointer', fontSize: 12, color: 'var(--cream-dim)', padding: '8px 0', textAlign: 'center' }}>📲 Visa QR-kod</summary>
            <div style={{ background: '#F5F0E8', padding: 12, borderRadius: 12, marginTop: 8, textAlign: 'center' }}>
              <img src={qrDataUrl} alt="Swish QR" style={{ width: 240, height: 240, display: 'inline-block' }} />
              <div style={{ fontSize: 10, color: '#0A0F0A', marginTop: 6 }}>Öppna Swish → kamera-ikonen → skanna</div>
            </div>
          </details>
        )}

        <details style={{ textAlign: 'left' }}>
          <summary style={{ cursor: 'pointer', fontSize: 12, color: 'var(--cream-dim)', padding: '8px 0', textAlign: 'center' }}>📋 Kopiera manuellt</summary>
          <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: 12, marginTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
              <span style={{ color: 'var(--cream-muted)' }}>Nummer:</span>
              <span style={{ fontFamily: 'var(--mono)', color: 'var(--cream)' }}>{phone}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
              <span style={{ color: 'var(--cream-muted)' }}>Belopp:</span>
              <span style={{ fontFamily: 'var(--mono)', color: 'var(--cream)' }}>{amount} kr</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--cream-dim)', marginTop: 6, marginBottom: 10 }}>{message}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={copyPhone} style={{ flex: 1, padding: '10px', background: 'var(--surface)', color: 'var(--cream)', border: '1px solid var(--card-border)', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>📋 Nummer</button>
              <button onClick={copyAll} style={{ flex: 1, padding: '10px', background: 'var(--gold)', color: '#0A0A08', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>📋 Allt</button>
            </div>
          </div>
        </details>
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
    ? <img src={p.image_url} alt={p.name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--card-border)', flexShrink: 0 }} />
    : <div style={{ width: size, height: size, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size*0.38, fontWeight: 500, color: c, border: '2px solid var(--card-border)', flexShrink: 0 }}>{p.name?.charAt(0)}</div>
}

function Badge({ text, color, bg }) {
  return <span style={{ fontSize: 9, fontFamily: 'var(--mono)', color, background: bg, padding: '2px 6px', borderRadius: 4, letterSpacing: 1 }}>{text}</span>
}

export default function Home() {
  const [appMode, setAppMode] = useState(null)
  useEffect(() => { if (typeof window !== 'undefined') { const s = localStorage.getItem('app_mode'); if (s === 'dio' || s === 'taby') setAppMode(s) } }, [])
  useEffect(() => { if (appMode && typeof window !== 'undefined') { localStorage.setItem('app_mode', appMode); document.documentElement.setAttribute('data-mode', appMode) } }, [appMode])

  if (!appMode) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0B1410 0%, #0C1830 50%, #0B1410 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 20 }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: 4, color: 'rgba(250,248,240,0.3)', textTransform: 'uppercase' }}>Välj läge</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: 340 }}>
        <button onClick={() => setAppMode('dio')} style={{ padding: '28px 20px', borderRadius: 20, cursor: 'pointer', border: '0.5px solid rgba(212,175,55,0.2)', background: 'linear-gradient(135deg, rgba(27,67,50,0.15), rgba(27,67,50,0.05))', backdropFilter: 'blur(20px)', textAlign: 'left', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%)', pointerEvents: 'none', borderRadius: 20 }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 24, color: '#D4AF37', marginBottom: 4 }}>DIO 2026</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'rgba(250,248,240,0.4)', letterSpacing: 1 }}>HOOKS HERRGÅRD · 1–4 MAJ</div>
            <div style={{ fontSize: 12, color: 'rgba(250,248,240,0.5)', marginTop: 8 }}>Douche Invitational Only</div>
          </div>
        </button>
        <button onClick={() => setAppMode('taby')} style={{ padding: '28px 20px', borderRadius: 20, cursor: 'pointer', border: '0.5px solid rgba(147,197,253,0.2)', background: 'linear-gradient(135deg, rgba(12,24,48,0.4), rgba(30,58,95,0.2))', backdropFilter: 'blur(20px)', textAlign: 'left', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(147,197,253,0.04) 0%, transparent 50%)', pointerEvents: 'none', borderRadius: 20 }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 24, color: '#93C5FD', marginBottom: 4 }}>Täby Order of Merit</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'rgba(147,197,253,0.4)', letterSpacing: 1 }}>TÄBY GK · SÄSONG 2026</div>
            <div style={{ fontSize: 12, color: 'rgba(240,244,255,0.5)', marginTop: 8 }}>April – Oktober</div>
          </div>
        </button>
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'rgba(250,248,240,0.15)', letterSpacing: 2, marginTop: 12 }}>POWERED BY CHAOS</div>
    </div>
  )
  if (appMode === 'taby') return <TaByApp onSwitchMode={() => { setAppMode(null); localStorage.removeItem('app_mode') }} />
  return <DIOApp onSwitchMode={() => { setAppMode(null); localStorage.removeItem('app_mode') }} />
}

// Sparkline component for form curves
const Sparkline = ({ values, width = 60, height = 16, color = '#D4A017' }) => {
  if (!values || values.length < 2) return null
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width
    const y = height - ((v - min) / range) * (height - 2) - 1
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={width} height={height} style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function TaByApp({ onSwitchMode }) {
  const [tabySplash, setTabySplash] = useState(true)
  const [tabySplashExit, setTabySplashExit] = useState(false)
  const [tabyView, setTabyView] = useState('leaderboard')
  const [tabyHole, setTabyHole] = useState(1)
  const [tabyPlayers, setTabyPlayers] = useState([])
  const [tabyUser, setTabyUser] = useState(null)
  const [tabyRounds, setTabyRounds] = useState([])
  const [tabyScores, setTabyScores] = useState([])
  const [newRound, setNewRound] = useState(null)
  const [scoreInput, setScoreInput] = useState({})
  const [tabyActiveHole, setTabyActiveHole] = useState(null)
  const [tabyCaddieMsg, setTabyCaddieMsg] = useState(null)
  const [tabyCaddieLoading, setTabyCaddieLoading] = useState(false)
  const [tabyEvents, setTabyEvents] = useState([])
  const [tabyBets, setTabyBets] = useState([])
  const [tabyBetOptions, setTabyBetOptions] = useState([])
  const [tabyBetWagers, setTabyBetWagers] = useState([])
  const [tabyH2H, setTabyH2H] = useState([])
  const [h2hPlayer1, setH2hPlayer1] = useState('')
  const [h2hPlayer2, setH2hPlayer2] = useState('')
  const [h2hStake, setH2hStake] = useState(100)
  const [newBetQuestion, setNewBetQuestion] = useState('')
  const [newBetPlayers, setNewBetPlayers] = useState([])
  const [h2hMatrixOpen, setH2hMatrixOpen] = useState(false)
  const [tabyToast, setTabyToast] = useState(null)
  const [tabySpectatePid, setTabySpectatePid] = useState(null)
  const [tabyBanguideOpen, setTabyBanguideOpen] = useState(false)
  const tabyToastT = useRef(null)
  // GPS state
  const [tabyUserLoc, setTabyUserLoc] = useState(null) // {lat, lng, accuracy}
  const [tabyGpsError, setTabyGpsError] = useState(null)
  const tabyGpsWatchId = useRef(null)
  const [tapPoint, setTapPoint] = useState(null) // { hole, dist, x, y }
  const [measureMode, setMeasureMode] = useState(false)
  const [tabySettings, setTabySettings] = useState({
    slope: 130, cr: 70.0, qualifyingRounds: 8,
    nassauStake: 50, skinsStake: 10, npStake: 50, ldStake: 50,
    meritPi: 50, meritEvents: 35, meritH2H: 10, meritActivity: 5
  })
  // Settings state
  const [editingEventId, setEditingEventId] = useState(null)
  const [newEventForm, setNewEventForm] = useState({ name: '', event_type: 'event', date: '', format: 'stableford', description: '', participants: [] })
  const [tabyBroadcastForm, setTabyBroadcastForm] = useState({ title: '', body: '', target: 'all' })
  const [tabyBroadcastSending, setTabyBroadcastSending] = useState(false)
  const [showInactivePlayers, setShowInactivePlayers] = useState(false)
  const [tabyAllPlayers, setTabyAllPlayers] = useState([])

  // Fetch helpers (for settings view actions)
  const fetchTabyPlayers = async () => {
    const { data: active } = await supabase.from('inv_players').select('*').eq('taby_active', true).order('taby_hcp')
    if (active) setTabyPlayers(active)
    const { data: all } = await supabase.from('inv_players').select('*').order('name')
    if (all) setTabyAllPlayers(all)
  }
  const fetchTabyRounds = async () => {
    const { data } = await supabase.from('taby_rounds').select('*').order('date', { ascending: false })
    if (data) setTabyRounds(data)
  }
  const fetchTabyScores = async () => {
    const { data } = await supabase.from('taby_scores').select('*')
    if (data) setTabyScores(data)
  }
  const fetchTabyEvents = async () => {
    const { data } = await supabase.from('taby_events').select('*').order('date')
    if (data) setTabyEvents(data)
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark')
    document.documentElement.setAttribute('data-mode', 'taby')
    const t1 = setTimeout(() => setTabySplashExit(true), 5500)
    const t2 = setTimeout(() => setTabySplash(false), 6200)
    // Load taby players
    const loadData = async () => {
      const { data: players } = await supabase.from('inv_players').select('*').eq('taby_active', true).order('taby_hcp')
      if (players) setTabyPlayers(players)
      // Also load all players (for admin view)
      const { data: allPlayers } = await supabase.from('inv_players').select('*').order('name')
      if (allPlayers) setTabyAllPlayers(allPlayers)
      // Load saved user
      const saved = localStorage.getItem('taby_user')
      if (saved) try { setTabyUser(JSON.parse(saved)) } catch(e) {}
      // Load settings
      const savedSettings = localStorage.getItem('taby_settings')
      if (savedSettings) try { setTabySettings(prev => ({ ...prev, ...JSON.parse(savedSettings) })) } catch(e) {}
      // Load rounds + scores
      const { data: rounds } = await supabase.from('taby_rounds').select('*').order('date', { ascending: false })
      if (rounds) setTabyRounds(rounds)
      const { data: scores } = await supabase.from('taby_scores').select('*')
      if (scores) setTabyScores(scores)
      // Load events
      const { data: events } = await supabase.from('taby_events').select('*').order('date')
      if (events) setTabyEvents(events)
      // Load betting data
      const { data: bets } = await supabase.from('taby_bets').select('*').order('created_at', { ascending: false })
      if (bets) setTabyBets(bets)
      const { data: opts } = await supabase.from('taby_bet_options').select('*')
      if (opts) setTabyBetOptions(opts)
      const { data: wagers } = await supabase.from('taby_bet_wagers').select('*')
      if (wagers) setTabyBetWagers(wagers)
      const { data: h2h } = await supabase.from('taby_h2h').select('*').order('created_at', { ascending: false })
      if (h2h) setTabyH2H(h2h)
    }
    loadData()
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  useEffect(() => { if (tabyUser) localStorage.setItem('taby_user', JSON.stringify(tabyUser)) }, [tabyUser])

  const holes = [
    { h:1,p:5,i:13,m:441,t:'Sikta mot högsta tallen. Brant slänt bakom green.',w:false },
    { h:2,p:4,i:9,m:372,t:'Vänster fairway ger bättre vinkel.',w:false },
    { h:3,p:4,i:3,m:357,t:'Damm vänster fairway. Upphöjd green.',w:true },
    { h:4,p:3,i:17,m:137,t:'Vatten följer vänster green. Uppförsputt föredras.',w:true },
    { h:5,p:4,i:1,m:396,t:'Svåraste hålet. Hela vägen uppför.',w:false },
    { h:6,p:5,i:7,m:484,t:'Längsta hålet. Blint inspel – invänta klocka.',w:false },
    { h:7,p:3,i:15,m:178,t:'20m nedför. Kort/vänster rullar till bunkrarna.',w:false },
    { h:8,p:4,i:5,m:383,t:'Håll vänster för optimal vinkel mot green.',w:false },
    { h:9,p:4,i:11,m:320,t:'Sikta talldungen höger. Damm vänster green.',w:true },
    { h:10,p:4,i:8,m:378,t:'Över kullen mitt i fairway. Damm höger.',w:true },
    { h:11,p:4,i:12,m:350,t:'Vatten kort och höger om green.',w:true },
    { h:12,p:5,i:4,m:472,t:'Platå-hål. Damm bakom krönet. Klocksignal!',w:true },
    { h:13,p:4,i:14,m:310,t:'Blint utslag! Utsiktstornet.',w:false },
    { h:14,p:3,i:2,m:180,t:'Signaturhål! Sjön. Bollen rullar mot vattnet.',w:true },
    { h:15,p:4,i:18,m:309,t:'Ett av Sveriges vackraste hål.',w:true },
    { h:16,p:4,i:6,m:363,t:'Dold damm vänster. Kraftigt lutande green.',w:true },
    { h:17,p:3,i:16,m:157,t:'Sjöhålet! Vatten framför och vänster.',w:true },
    { h:18,p:5,i:10,m:440,t:'Ny green 2026. OB vänster, vatten höger.',w:true },
  ]
  const PARS = holes.map(h => h.p)
  const totalPar = PARS.reduce((s, p) => s + p, 0) // 72
  const curHole = holes[tabyHole - 1]

  // Calc stableford for a hole given strokes, par, and extra strokes
  const calcStab = (strokes, par, extraStrokes) => {
    if (!strokes || strokes <= 0) return 0
    const nettoPar = par + extraStrokes
    const diff = nettoPar - strokes + 2
    return Math.max(0, diff)
  }

  // Get playing HCP (slope adjusted)
  const getPlayingHcp = (hcp) => Math.round((hcp || 0) * 130 / 113)

  // Get extra strokes for a specific hole
  const getExtra = (holeIdx, hcp) => {
    const phcp = getPlayingHcp(hcp)
    const base = Math.floor(phcp / 18)
    const rem = phcp % 18
    return base + (holeIdx <= rem ? 1 : 0)
  }

  // Get player stats from scores
  const getPlayerStats = (playerId) => {
    const playerScores = tabyScores.filter(s => s.player_id === playerId)
    const roundIds = [...new Set(playerScores.map(s => s.round_id))]
    const roundCount = roundIds.length
    const totalStableford = playerScores.reduce((s, sc) => s + (sc.stableford || 0), 0)
    const totalStrokes = playerScores.reduce((s, sc) => s + (sc.strokes || 0), 0)
    const roundStableford = roundIds.map(rid => {
      const rs = playerScores.filter(s => s.round_id === rid)
      return { roundId: rid, total: rs.reduce((s, sc) => s + (sc.stableford || 0), 0), strokes: rs.reduce((s, sc) => s + (sc.strokes || 0), 0), holes: rs.length }
    }).filter(r => r.holes === 18)
    const best8 = [...roundStableford].sort((a, b) => b.total - a.total).slice(0, 8)
    const pi = best8.length > 0 ? Math.round(best8.reduce((s, r) => s + r.total, 0) / best8.length * 10) / 10 : 0
    const avgStrokes = roundStableford.length > 0 ? Math.round(roundStableford.reduce((s, r) => s + r.strokes, 0) / roundStableford.length * 10) / 10 : 0
    return { roundCount, totalStableford, totalStrokes, pi, avgStrokes, best8, fullRounds: roundStableford.length }
  }

  // Create new round
  const startRound = async (selectedPlayers) => {
    const playerIds = selectedPlayers.map(p => p.id)
    const type = playerIds.length >= 5 ? 'event' : playerIds.length >= 2 ? 'group' : 'solo'
    const { data } = await supabase.from('taby_rounds').insert({
      date: new Date().toISOString().split('T')[0],
      type,
      player_ids: playerIds,
      created_by: tabyUser?.id
    }).select().single()
    if (data) {
      setNewRound(data)
      setScoreInput({})
      setTabyRounds(prev => [data, ...prev])
      setTabyView('scoring')
      setTabyActiveHole(1) // Auto-open fullscreen on hole 1 (one-pager flow)
    }
  }

  // Resume active round → jump straight into fullscreen on next unplayed hole
  const resumeRound = (round) => {
    setNewRound(round)
    setTabyView('scoring')
    const played = tabyScores.filter(s => s.round_id === round.id && s.player_id === tabyUser?.id).map(s => s.hole)
    const nextUnplayed = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18].find(h => !played.includes(h)) || 1
    setTabyActiveHole(nextUnplayed)
  }

  // Auto-jump to fullscreen when entering scoring view with active round (one-pager flow)
  useEffect(() => {
    if (tabyView === 'scoring' && newRound && tabyActiveHole == null) {
      const played = tabyScores.filter(s => s.round_id === newRound.id && s.player_id === tabyUser?.id).map(s => s.hole)
      const nextUnplayed = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18].find(h => !played.includes(h)) || 1
      setTabyActiveHole(nextUnplayed)
    }
  }, [tabyView, newRound?.id])

  // GPS tracking — start watching when any round is active (for Dynamic Island badge) or fullscreen scoring open
  useEffect(() => {
    const gpsShouldBeOn = (newRound || tabyActiveHole) && typeof navigator !== 'undefined' && navigator.geolocation
    if (gpsShouldBeOn) {
      if (tabyGpsWatchId.current == null) {
        tabyGpsWatchId.current = navigator.geolocation.watchPosition(
          pos => {
            setTabyUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy })
            setTabyGpsError(null)
          },
          err => { setTabyGpsError(err.message || 'GPS ej tillgänglig'); setTabyUserLoc(null) },
          { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
        )
      }
    } else {
      if (tabyGpsWatchId.current != null && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(tabyGpsWatchId.current)
        tabyGpsWatchId.current = null
        setTabyUserLoc(null)
      }
    }
    return () => {
      if (tabyGpsWatchId.current != null && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(tabyGpsWatchId.current)
        tabyGpsWatchId.current = null
      }
    }
  }, [newRound?.id, tabyActiveHole])

  // Save score for a hole
  const showTabyToast = (msg, type) => {
    setTabyToast({ msg, type })
    if (tabyToastT.current) clearTimeout(tabyToastT.current)
    tabyToastT.current = setTimeout(() => setTabyToast(null), 4500)
    if (type === 'eagle') soundEagle()
    else if (type === 'birdie') soundBirdie()
    else if (type === 'zero') soundZero()
    else soundScore()
  }

  const saveTabySetting = (key, value) => {
    setTabySettings(prev => {
      const next = { ...prev, [key]: value }
      try { localStorage.setItem('taby_settings', JSON.stringify(next)) } catch(e) {}
      return next
    })
  }

  // Tap-to-distance: interpolate GPS from image tap position
  // tapFracY=0 = top of image = GREEN end (Swedish hole guides: tee at bottom, green at top)
  const tapToGpsCoords = (tapFracX, tapFracY, holeNum) => {
    const gps = TABY_GPS[holeNum]
    if (!gps?.tee?.lat || !gps?.green?.lat) return null
    const t = Math.max(0, Math.min(1, 1 - tapFracY)) // flip: top=green, bottom=tee
    const lat = gps.tee.lat + (gps.green.lat - gps.tee.lat) * t
    const lng = gps.tee.lng + (gps.green.lng - gps.tee.lng) * t
    const dlat = gps.green.lat - gps.tee.lat
    const dlng = gps.green.lng - gps.tee.lng
    const len = Math.sqrt(dlat*dlat + dlng*dlng) || 1
    const lateral = (tapFracX - 0.5) * 0.002 // ±57m at image edges
    return { lat: lat - dlng/len*lateral, lng: lng + dlat/len*lateral }
  }

  const tapDistToGreen = (tapFracX, tapFracY, holeNum) => {
    const gps = TABY_GPS[holeNum]
    if (!gps?.green?.lat) return null
    const coords = tapToGpsCoords(tapFracX, tapFracY, holeNum)
    if (!coords) return null
    return Math.round(haversineDistance(coords.lat, coords.lng, gps.green.lat, gps.green.lng))
  }

  // Find player's previous result on a specific hole
  const getTabyHoleHistory = (playerId, hole) => {
    const playerPrevScores = tabyScores.filter(s => s.player_id === playerId && s.hole === hole && (!newRound || s.round_id !== newRound.id))
    if (playerPrevScores.length === 0) return null
    const sorted = playerPrevScores.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    return { last: sorted[0], count: sorted.length, bestStab: Math.max(...sorted.map(s => s.stableford || 0)) }
  }

  // Check for hot hand / cold turkey in current round
  const getTabyStreak = () => {
    if (!newRound || !tabyUser) return { hot: 0, cold: 0 }
    const sc = tabyScores.filter(s => s.round_id === newRound.id && s.player_id === tabyUser.id && s.strokes).sort((a,b) => a.hole - b.hole)
    let hotRun = 0, coldRun = 0, currentHot = 0, currentCold = 0
    sc.forEach(s => {
      if ((s.stableford || 0) >= 3) { currentHot++; currentCold = 0; if (currentHot === 3) hotRun++; if (currentHot > 3) hotRun++ }
      else if (s.stableford === 0) { currentCold++; currentHot = 0; if (currentCold === 3) coldRun++; if (currentCold > 3) coldRun++ }
      else { currentHot = 0; currentCold = 0 }
    })
    return { hot: hotRun, cold: coldRun, currentHot, currentCold }
  }

  const saveHoleScore = async (hole, strokes) => {
    if (!newRound || !tabyUser || !strokes) return
    const par = PARS[hole - 1]
    const holeData = holes[hole - 1]
    const extra = getExtra(holeData.i, tabyUser.taby_hcp || tabyUser.hcp)
    const stab = calcStab(strokes, par, extra)

    const { data } = await supabase.from('taby_scores').upsert({
      round_id: newRound.id,
      player_id: tabyUser.id,
      hole,
      strokes,
      stableford: stab
    }, { onConflict: 'round_id,player_id,hole' }).select().single()

    if (data) {
      setTabyScores(prev => {
        const filtered = prev.filter(s => !(s.round_id === newRound.id && s.player_id === tabyUser.id && s.hole === hole))
        return [...filtered, data]
      })
    }
    setScoreInput(prev => ({ ...prev, [hole]: strokes }))

    // Sounds + toasts + chat shoutouts — based on REAL birdie/eagle (strokes vs par), NOT stableford
    const diffToPar = strokes - par
    if (strokes === 1) {
      showTabyToast(`⛳✨ HOLE-IN-ONE! ${tabyUser.nickname} på hål ${hole}! LEGENDARY!`, 'eagle')
      supabase.from('inv_chat').insert({ player_id: tabyUser.id, message: `⛳ HOLE-IN-ONE på Täby hål ${hole}! Drinks on me!`, msg_type: 'shoutout' })
    } else if (diffToPar <= -3) {
      showTabyToast(`🏆 ALBATROSS! ${tabyUser.nickname} på hål ${hole}! ${strokes} slag på par ${par}!`, 'eagle')
      supabase.from('inv_chat').insert({ player_id: tabyUser.id, message: `🏆 ALBATROSS på Täby hål ${hole}! ${strokes} slag (par ${par})`, msg_type: 'shoutout' })
    } else if (diffToPar === -2) {
      showTabyToast(`🦅 EAGLE! ${tabyUser.nickname} på hål ${hole}! ${strokes} slag på par ${par}!`, 'eagle')
      supabase.from('inv_chat').insert({ player_id: tabyUser.id, message: `🦅 EAGLE på Täby hål ${hole}! ${strokes} slag (par ${par})`, msg_type: 'shoutout' })
    } else if (diffToPar === -1) {
      showTabyToast(`🐦 Birdie! ${tabyUser.nickname} på hål ${hole}!`, 'birdie')
      supabase.from('inv_chat').insert({ player_id: tabyUser.id, message: `🐦 Birdie på Täby hål ${hole}! ${strokes} slag (par ${par})`, msg_type: 'shoutout' })
    } else if (stab === 0) {
      showTabyToast(`💀 Blowup på hål ${hole}... ${strokes} slag`, 'zero')
    } else {
      soundScore()
    }
  }

  // Caddie AI for Täby
  const askTabyCaddie = async (hole, holeData) => {
    setTabyCaddieLoading(true); setTabyCaddieMsg(null)
    const playerHcp = tabyUser?.taby_hcp || tabyUser?.hcp
    const phcpVal = getPlayingHcp(playerHcp)
    const extra = getExtra(holeData.i, playerHcp)
    const rScores = newRound ? tabyScores.filter(s => s.round_id === newRound.id && s.player_id === tabyUser.id) : []
    const last5 = rScores.filter(s => s.hole < hole).slice(-5)
    const avgPts = last5.length > 0 ? (last5.reduce((s,x) => s + (x.stableford || 0), 0) / last5.length).toFixed(1) : null
    const prompt = `Du är caddie på Täby GK (Vallentunasjön). ${tabyUser?.nickname} (HCP ${playerHcp}) står på hål ${hole} – par ${holeData.p}, ${holeData.m}m, index ${holeData.i}. ${extra > 0 ? 'Har ' + extra + ' extraslag.' : ''} ${holeData.w ? 'Vatten i spel.' : ''} Speltips: "${holeData.t}". ${avgPts ? 'Snitt senaste 5 hål: ' + avgPts + 'p.' : ''}

VIKTIGT: Repetera INTE hålbeskrivningen. Ge istället:
1. Klubbval + strategi
2. Vad ska undvikas
Max 2-3 meningar. Svenska. Använd spelarens nickname.`
    try {
      const res = await fetch('/api/caddie', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) })
      const data = await res.json()
      setTabyCaddieMsg(data.text || 'Caddien är tyst...')
    } catch (e) { setTabyCaddieMsg('Caddien tappade signalen! Lita på magkänslan.') }
    setTabyCaddieLoading(false)
  }

  // H2H matrix: calculate head-to-head wins between all player pairs
  const calcH2HMatrix = () => {
    const matrix = {}
    tabyPlayers.forEach(p1 => {
      matrix[p1.id] = {}
      tabyPlayers.forEach(p2 => {
        if (p1.id === p2.id) { matrix[p1.id][p2.id] = null; return }
        let w = 0, l = 0, d = 0
        const commonRounds = tabyRounds.filter(r => r.player_ids?.includes(p1.id) && r.player_ids?.includes(p2.id))
        commonRounds.forEach(r => {
          const s1 = tabyScores.filter(s => s.round_id === r.id && s.player_id === p1.id)
          const s2 = tabyScores.filter(s => s.round_id === r.id && s.player_id === p2.id)
          let hw = 0, hl = 0
          for (let h = 1; h <= 18; h++) {
            const sc1 = s1.find(s => s.hole === h)
            const sc2 = s2.find(s => s.hole === h)
            if (!sc1 || !sc2) continue
            if (sc1.stableford > sc2.stableford) hw++
            else if (sc1.stableford < sc2.stableford) hl++
          }
          if (hw > hl) w++; else if (hl > hw) l++; else d++
        })
        matrix[p1.id][p2.id] = { w, l, d, total: w + l + d }
      })
    })
    return matrix
  }

  // Auto-odds from HCP
  const calcAutoOdds = (player) => {
    if (!player) return 2.0
    const hcp = parseFloat(player.taby_hcp || player.hcp) || 18
    let odds = 1 + hcp / 10
    return Math.max(1.2, Math.min(8.0, Math.round(odds * 10) / 10))
  }

  // Create H2H match
  const createH2H = async () => {
    if (!h2hPlayer1 || !h2hPlayer2 || h2hPlayer1 === h2hPlayer2) return
    const roundId = newRound?.id || null
    const { data } = await supabase.from('taby_h2h').insert({ round_id: roundId, player1_id: h2hPlayer1, player2_id: h2hPlayer2, stake: h2hStake }).select().single()
    if (data) setTabyH2H(prev => [data, ...prev])
    setH2hPlayer1(''); setH2hPlayer2('')
  }

  // Create odds bet
  const createBet = async () => {
    if (!newBetQuestion || newBetPlayers.length < 2) return
    const { data: bet } = await supabase.from('taby_bets').insert({ bet_type: 'odds', question: newBetQuestion, stake: 50, banker_id: tabyUser?.id, status: 'open', created_by: tabyUser?.id }).select().single()
    if (bet) {
      const opts = newBetPlayers.map(pid => {
        const p = tabyPlayers.find(x => x.id === pid)
        return { bet_id: bet.id, label: p?.nickname || 'Unknown', odds: calcAutoOdds(p), player_id: pid }
      })
      const { data: optData } = await supabase.from('taby_bet_options').insert(opts).select()
      if (optData) setTabyBetOptions(prev => [...prev, ...optData])
      setTabyBets(prev => [bet, ...prev])
    }
    setNewBetQuestion(''); setNewBetPlayers([])
  }

  // Get sparkline values for a player (last 8 complete rounds)
  const getSparklineValues = (playerId) => {
    const playerScores = tabyScores.filter(s => s.player_id === playerId)
    const roundIds = [...new Set(playerScores.map(s => s.round_id))]
    const roundTotals = roundIds.map(rid => {
      const rs = playerScores.filter(s => s.round_id === rid)
      if (rs.length < 18) return null
      return { roundId: rid, total: rs.reduce((s, sc) => s + (sc.stableford || 0), 0) }
    }).filter(Boolean)
    // Sort by round date
    const sorted = roundTotals.sort((a, b) => {
      const rA = tabyRounds.find(r => r.id === a.roundId)
      const rB = tabyRounds.find(r => r.id === b.roundId)
      return (rA?.date || '').localeCompare(rB?.date || '')
    })
    return sorted.slice(-8).map(r => r.total)
  }

  // Login screen
  if (!tabyUser && !tabySplash) return (
    <div style={{ minHeight: '100vh', background: '#0C1830', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 24, color: '#93C5FD', marginBottom: 4 }}>Täby Order of Merit</div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'rgba(212,175,55,0.5)', letterSpacing: 2, marginBottom: 32 }}>VÄLJ SPELARE</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, maxWidth: 340, width: '100%' }}>
        {tabyPlayers.map(p => (
          <button key={p.id} onClick={() => setTabyUser(p)} style={{
            background: 'rgba(147,197,253,0.06)', border: '0.5px solid rgba(147,197,253,0.12)', borderRadius: 16,
            padding: '16px 8px', cursor: 'pointer', textAlign: 'center'
          }}>
            {p.image_url ? <img src={p.image_url} style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', marginBottom: 6, border: '2px solid rgba(147,197,253,0.2)' }} /> : <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(147,197,253,0.1)', border: '2px solid rgba(147,197,253,0.2)', margin: '0 auto 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#93C5FD' }}>{p.name?.charAt(0)}</div>}
            <div style={{ fontSize: 13, fontWeight: 500, color: '#F0F4FF' }}>{p.nickname}</div>
            <div style={{ fontSize: 9, color: 'rgba(147,197,253,0.4)', fontFamily: 'var(--mono)', marginTop: 2 }}>HCP {p.taby_hcp || p.hcp}</div>
          </button>
        ))}
      </div>
      <button onClick={onSwitchMode} style={{ marginTop: 24, background: 'none', border: '0.5px solid rgba(147,197,253,0.1)', borderRadius: 8, padding: '8px 16px', color: 'rgba(147,197,253,0.4)', fontSize: 10, fontFamily: 'var(--mono)', cursor: 'pointer' }}>← DIO</button>
    </div>
  )

  // Splash
  if (tabySplash) return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'linear-gradient(180deg, #0C1830 0%, #1E3A5F 40%, #0C1830 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: tabySplashExit ? 0 : 1, transition: 'opacity 0.7s ease' }}>
      <style>{`@keyframes tabyFadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } } @keyframes tabyGlow { 0%,100% { text-shadow: 0 0 20px rgba(147,197,253,0.3); } 50% { text-shadow: 0 0 40px rgba(147,197,253,0.6); } } @keyframes tabyLine { from { width: 0; } to { width: 120px; } } @keyframes tabyPlayerSlide { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }`}</style>
      <div style={{ animation: 'tabyFadeUp 0.8s ease 0.3s both', fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: 5, color: 'rgba(147,197,253,0.4)', textTransform: 'uppercase' }}>The Lake Club</div>
      <div style={{ animation: 'tabyFadeUp 0.8s ease 0.6s both, tabyGlow 3s ease-in-out infinite 1.5s', fontFamily: 'var(--serif)', fontSize: 32, color: '#93C5FD', margin: '8px 0 4px', letterSpacing: 2 }}>Täby Order of Merit</div>
      <div style={{ animation: 'tabyLine 0.6s ease 1s both', height: 1, background: 'linear-gradient(90deg, transparent, #D4A017, transparent)', margin: '8px 0' }} />
      <div style={{ animation: 'tabyFadeUp 0.8s ease 1.2s both', fontFamily: 'var(--mono)', fontSize: 10, color: 'rgba(212,175,55,0.5)', letterSpacing: 3 }}>SÄSONG 2026</div>
      <div style={{ animation: 'tabyFadeUp 0.8s ease 1.5s both', fontFamily: 'var(--mono)', fontSize: 8, color: 'rgba(240,244,255,0.2)', letterSpacing: 2, marginTop: 6 }}>VALLENTUNASJÖN · EST. 1968</div>
      <div style={{ animation: 'tabyFadeUp 0.8s ease 4s both', marginTop: 24, fontFamily: 'var(--mono)', fontSize: 7, color: 'rgba(147,197,253,0.15)', letterSpacing: 3 }}>APRIL — OKTOBER</div>
    </div>
  )

  // Current round scores for user
  const roundScores = newRound ? tabyScores.filter(s => s.round_id === newRound.id && s.player_id === tabyUser.id) : []
  const totalStab = roundScores.reduce((s, sc) => s + (sc.stableford || 0), 0)
  const totalStrokes = roundScores.reduce((s, sc) => s + (sc.strokes || 0), 0)
  const holesPlayed = roundScores.length
  const parPlayed = roundScores.reduce((s, sc) => s + PARS[sc.hole - 1], 0)
  const vsParStr = totalStrokes - parPlayed
  const phcp = getPlayingHcp(tabyUser?.taby_hcp || tabyUser?.hcp || 0)

  // Stats for leaderboard
  const playerStats = tabyPlayers.map(p => ({ ...p, stats: getPlayerStats(p.id) })).sort((a, b) => b.stats.pi - a.stats.pi)

  // MAIN APP
  return (
    <div style={{ minHeight: '100vh', background: '#0C1830', color: '#F0F4FF', paddingBottom: 80 }}>
      {/* TOAST NOTIFICATIONS */}
      {tabyToast && (
        <div style={{
          position: 'fixed', top: 'calc(20px + env(safe-area-inset-top, 0px))', left: '50%', transform: 'translateX(-50%)',
          zIndex: 2000, padding: '12px 20px', borderRadius: 12, maxWidth: '90vw',
          background: tabyToast.type === 'eagle' ? 'linear-gradient(135deg, #D4A017, #F5D76E)' : tabyToast.type === 'birdie' ? 'rgba(74,222,128,0.95)' : tabyToast.type === 'zero' ? 'rgba(232,99,74,0.95)' : 'rgba(147,197,253,0.95)',
          color: tabyToast.type === 'eagle' ? '#0C1830' : '#fff', fontWeight: 600, fontSize: 14,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          border: tabyToast.type === 'eagle' ? '2px solid #F5D76E' : 'none'
        }}>
          {tabyToast.msg}
        </div>
      )}

      {/* BANGUIDE MODAL */}
      {tabyBanguideOpen && tabyActiveHole && (() => {
        const h = holes[tabyActiveHole - 1]
        if (!h) return null
        return (
          <div onClick={() => setTabyBanguideOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 500, display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: 16, paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 28, color: '#93C5FD' }}>Hål {h.h}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'rgba(240,244,255,0.5)' }}>PAR {h.p} · INDEX {h.i} · {h.m}m</div>
              </div>
              <button onClick={() => setTabyBanguideOpen(false)} style={{ background: 'rgba(147,197,253,0.08)', border: '0.5px solid rgba(147,197,253,0.2)', color: '#93C5FD', fontSize: 18, cursor: 'pointer', width: 36, height: 36, borderRadius: 10 }}>✕</button>
            </div>
            <img src={`/taby/holes/hole-${h.h}.webp`} alt={`Hål ${h.h}`}
              onClick={e => e.stopPropagation()}
              style={{ width: '100%', height: 'auto', borderRadius: 12, marginBottom: 12 }} />
            <div onClick={e => e.stopPropagation()} style={{ padding: 14, background: 'rgba(147,197,253,0.06)', borderRadius: 12, border: '0.5px solid rgba(147,197,253,0.12)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#D4A017', letterSpacing: 1.5, marginBottom: 6 }}>SPELTIPS</div>
              <div style={{ fontSize: 14, color: 'rgba(240,244,255,0.8)', lineHeight: 1.6 }}>{h.t}</div>
              {h.w && <div style={{ marginTop: 8, padding: '6px 10px', background: 'rgba(96,165,250,0.12)', borderRadius: 8, color: '#60A5FA', fontSize: 12 }}>💧 Vatten i spel på detta hål</div>}
            </div>
          </div>
        )
      })()}

      {/* SPECTATOR MODE */}
      {tabySpectatePid && (() => {
        const spectator = tabyPlayers.find(p => p.id === tabySpectatePid)
        if (!spectator) return null
        const theirRounds = tabyRounds.filter(r => r.player_ids?.includes(tabySpectatePid)).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        const latestRound = theirRounds[0]
        const theirScores = latestRound ? tabyScores.filter(s => s.round_id === latestRound.id && s.player_id === tabySpectatePid) : []
        const theirTotalStab = theirScores.reduce((sum, s) => sum + (s.stableford || 0), 0)
        const theirTotalStrokes = theirScores.reduce((sum, s) => sum + (s.strokes || 0), 0)
        const theirPlayed = theirScores.length
        const theirPar = theirScores.reduce((sum, s) => sum + PARS[s.hole - 1], 0)
        const vsPar = theirTotalStrokes - theirPar
        const isLive = theirPlayed > 0 && theirPlayed < 18
        return (
          <div style={{ position: 'fixed', inset: 0, background: '#0C1830', zIndex: 450, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))', background: 'rgba(147,197,253,0.04)', borderBottom: '0.5px solid rgba(147,197,253,0.1)' }}>
              <button onClick={() => setTabySpectatePid(null)} style={{ background: 'none', border: 'none', color: '#93C5FD', fontSize: 16, cursor: 'pointer' }}>← Tillbaka</button>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, color: '#F0F4FF', fontWeight: 500 }}>👀 Följer {spectator.nickname}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'rgba(147,197,253,0.4)' }}>HCP {spectator.taby_hcp || spectator.hcp} {isLive ? '· 🔴 LIVE' : latestRound ? `· ${latestRound.date}` : ''}</div>
              </div>
              {spectator.image_url ? <img src={spectator.image_url} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid #93C5FD' }} /> : <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(147,197,253,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#93C5FD', fontSize: 13 }}>{spectator.name?.charAt(0)}</div>}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
              {!latestRound ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'rgba(147,197,253,0.4)' }}>Inga rundor ännu för {spectator.nickname}</div>
              ) : (<>
                <div style={{ padding: 16, background: 'rgba(147,197,253,0.06)', borderRadius: 14, border: '0.5px solid rgba(147,197,253,0.12)', marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#D4A017', letterSpacing: 1.5 }}>{isLive ? '🔴 PÅGÅENDE RUNDA' : 'SENASTE RUNDAN'}</div>
                    <div style={{ fontSize: 11, color: 'rgba(240,244,255,0.4)' }}>{latestRound.date} · {latestRound.type}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1, textAlign: 'center', padding: 10, background: 'rgba(147,197,253,0.04)', borderRadius: 10 }}>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 22, color: '#D4A017', fontWeight: 600 }}>{theirTotalStab}p</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'rgba(147,197,253,0.4)', letterSpacing: 1 }}>STABLEFORD</div>
                    </div>
                    <div style={{ flex: 1, textAlign: 'center', padding: 10, background: 'rgba(147,197,253,0.04)', borderRadius: 10 }}>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 22, color: '#F0F4FF', fontWeight: 600 }}>{theirTotalStrokes || '—'}</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'rgba(147,197,253,0.4)', letterSpacing: 1 }}>SLAG {theirPlayed > 0 ? `(${vsPar > 0 ? '+' : ''}${vsPar})` : ''}</div>
                    </div>
                    <div style={{ flex: 1, textAlign: 'center', padding: 10, background: 'rgba(147,197,253,0.04)', borderRadius: 10 }}>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 22, color: '#93C5FD', fontWeight: 600 }}>{theirPlayed}/18</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'rgba(147,197,253,0.4)', letterSpacing: 1 }}>HÅL</div>
                    </div>
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'rgba(147,197,253,0.4)', letterSpacing: 1.5, marginBottom: 8 }}>HÅL FÖR HÅL</div>
                {[0, 9].map(offset => (
                  <div key={offset} style={{ marginBottom: 10 }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'rgba(147,197,253,0.3)', letterSpacing: 1, marginBottom: 4 }}>{offset === 0 ? 'UT (1-9)' : 'IN (10-18)'}</div>
                    {holes.slice(offset, offset + 9).map(h => {
                      const sc = theirScores.find(s => s.hole === h.h)
                      return (
                        <div key={h.h} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', marginBottom: 2, background: sc ? (sc.stableford >= 3 ? 'rgba(74,222,128,0.06)' : sc.stableford === 0 ? 'rgba(232,99,74,0.06)' : 'rgba(147,197,253,0.03)') : 'rgba(147,197,253,0.02)', borderRadius: 8 }}>
                          <div style={{ width: 28, fontFamily: 'var(--mono)', fontSize: 13, color: '#93C5FD', fontWeight: 600 }}>{h.h}</div>
                          <div style={{ flex: 1, fontSize: 10, color: 'rgba(240,244,255,0.4)', fontFamily: 'var(--mono)' }}>P{h.p}{h.w ? ' 💧' : ''}</div>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: sc?.strokes ? '#F0F4FF' : 'rgba(147,197,253,0.2)', minWidth: 30, textAlign: 'right' }}>{sc?.strokes || '—'}</div>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, color: sc?.stableford >= 3 ? '#4ADE80' : sc?.stableford === 0 ? '#E8634A' : sc ? 'rgba(147,197,253,0.5)' : 'rgba(147,197,253,0.2)', minWidth: 32, textAlign: 'right' }}>{sc ? `${sc.stableford}p` : ''}</div>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </>)}
            </div>
          </div>
        )
      })()}

      {/* Header */}
      <div style={{ padding: '12px 16px', paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ flexShrink: 0 }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 18, color: '#93C5FD' }}>Order of Merit</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'rgba(212,175,55,0.4)', letterSpacing: 2 }}>TÄBY GK · {tabyUser?.nickname}</div>
        </div>

        {/* GPS distance pill — shown when round is active + GPS is locked + on course */}
        {(() => {
          if (!newRound || !tabyUserLoc) return null
          // Determine which hole to show distance for: active fullscreen hole, or next unplayed in round
          const played = tabyScores.filter(s => s.round_id === newRound.id && s.player_id === tabyUser?.id).map(s => s.hole)
          const displayHole = tabyActiveHole || [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18].find(h => !played.includes(h)) || 18
          const distGreen = distanceToGreen(tabyUserLoc.lat, tabyUserLoc.lng, displayHole)
          if (distGreen == null || distGreen > 1500) return null // Not on course
          return (
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', maxWidth: 180 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 11px', background: 'linear-gradient(135deg, rgba(74,222,128,0.15), rgba(30,58,95,0.35))', border: '0.5px solid rgba(74,222,128,0.35)', borderRadius: 14, backdropFilter: 'blur(10px)' }}>
                <span style={{ fontSize: 12, lineHeight: 1 }}>🚩</span>
                <div style={{ lineHeight: 1 }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 15, color: '#4ADE80', fontWeight: 600, letterSpacing: -0.3 }}>{distGreen}m</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 7, color: 'rgba(74,222,128,0.6)', letterSpacing: 1, marginTop: 1 }}>HÅL {displayHole}</div>
                </div>
              </div>
            </div>
          )
        })()}

        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button onClick={() => { setTabyUser(null); localStorage.removeItem('taby_user') }} style={{ background: 'rgba(147,197,253,0.06)', border: '0.5px solid rgba(147,197,253,0.12)', borderRadius: 8, padding: '6px 10px', color: 'rgba(147,197,253,0.4)', fontSize: 9, fontFamily: 'var(--mono)', cursor: 'pointer' }}>Byt</button>
          <button onClick={onSwitchMode} style={{ background: 'rgba(147,197,253,0.06)', border: '0.5px solid rgba(147,197,253,0.12)', borderRadius: 8, padding: '6px 10px', color: '#93C5FD', fontSize: 9, fontFamily: 'var(--mono)', cursor: 'pointer', letterSpacing: 1 }}>DIO ↔</button>
        </div>
      </div>

      {/* Tab nav */}
      <div style={{ display: 'flex', gap: 4, padding: '0 16px 12px', overflowX: 'auto' }}>
        {[
          ['leaderboard','Merit'],['scoring','Spela'],['holes','Banguide'],['betting','Betting'],['stats','Stats'],
          ...(tabyUser?.is_admin || tabyUser?.key === 'filip' || tabyUser?.key === 'marcus' ? [['settings','⚙️']] : [])
        ].map(([key, label]) => (
          <button key={key} onClick={() => setTabyView(key)} style={{
            padding: '6px 14px', borderRadius: 8, fontSize: 11, fontFamily: 'var(--mono)',
            background: tabyView === key ? 'rgba(147,197,253,0.12)' : 'transparent',
            border: tabyView === key ? '0.5px solid rgba(147,197,253,0.2)' : '0.5px solid transparent',
            color: tabyView === key ? '#93C5FD' : 'rgba(240,244,255,0.3)',
            cursor: 'pointer', letterSpacing: 0.5, whiteSpace: 'nowrap'
          }}>{label}{key === 'scoring' && newRound ? ' ●' : ''}</button>
        ))}
      </div>

      {/* LEADERBOARD */}
      {tabyView === 'leaderboard' && (
        <div style={{ padding: '0 16px' }}>
          {/* Events section */}
          {tabyEvents.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'rgba(212,175,55,0.5)', letterSpacing: 2, marginBottom: 8 }}>KOMMANDE EVENTS</div>
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
                {tabyEvents.map(ev => {
                  const evDate = new Date(ev.date)
                  const now = new Date()
                  const status = ev.status === 'completed' ? 'Avslutad' : evDate < now ? 'Aktiv' : 'Upcoming'
                  const emoji = ev.event_name?.includes('Opener') ? '🌱' : ev.event_name?.includes('Midsommar') ? '☀️' : ev.event_name?.includes('Sommar') ? '🏖️' : '🏁'
                  return (
                    <div key={ev.id} style={{ flexShrink: 0, minWidth: 140, background: 'rgba(212,175,55,0.04)', border: '0.5px solid rgba(212,175,55,0.12)', borderRadius: 12, padding: '10px 12px' }}>
                      <div style={{ fontSize: 16, marginBottom: 4 }}>{emoji}</div>
                      <div style={{ fontSize: 11, color: '#D4A017', fontWeight: 600, marginBottom: 2 }}>{ev.event_name}</div>
                      <div style={{ fontSize: 9, color: 'rgba(240,244,255,0.4)', fontFamily: 'var(--mono)' }}>{ev.date} · {ev.format || 'stableford'}</div>
                      <div style={{ fontSize: 8, color: status === 'Upcoming' ? '#93C5FD' : status === 'Aktiv' ? '#4ADE80' : 'rgba(240,244,255,0.3)', fontFamily: 'var(--mono)', marginTop: 4, letterSpacing: 1 }}>{status.toUpperCase()}</div>
                      {ev.winner_id && (() => { const w = tabyPlayers.find(p => p.id === ev.winner_id); return w ? <div style={{ fontSize: 9, color: '#D4A017', marginTop: 2 }}>🏆 {w.nickname}</div> : null })()}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {[[getPlayerStats(tabyUser?.id).fullRounds || '—','RUNDOR','#93C5FD'],[getPlayerStats(tabyUser?.id).pi || '—','SNITT PI','#D4A017'],[getPlayerStats(tabyUser?.id).avgStrokes || '—','SNITT SLAG','#4ADE80']].map(([v,l,cl]) => (
              <div key={l} style={{ flex: 1, background: 'rgba(147,197,253,0.04)', border: '0.5px solid rgba(147,197,253,0.08)', borderRadius: 10, padding: '10px 6px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 600, color: cl }}>{v}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 7, color: 'rgba(240,244,255,0.25)', letterSpacing: 1, marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ background: 'rgba(147,197,253,0.04)', borderRadius: 16, border: '0.5px solid rgba(147,197,253,0.1)', overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px 6px', fontFamily: 'var(--mono)', fontSize: 8, color: 'rgba(147,197,253,0.4)', letterSpacing: 2 }}>ORDER OF MERIT</div>
            {playerStats.map((pl, idx) => {
              const sparkVals = getSparklineValues(pl.id)
              return (
                <div key={pl.id} onClick={() => pl.id !== tabyUser?.id && setTabySpectatePid(pl.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderTop: idx === 0 ? 'none' : '0.5px solid rgba(147,197,253,0.06)', cursor: pl.id !== tabyUser?.id ? 'pointer' : 'default', transition: 'background 0.2s' }}
                  onMouseEnter={e => { if (pl.id !== tabyUser?.id) e.currentTarget.style.background = 'rgba(147,197,253,0.04)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: idx === 0 ? 20 : 16, color: idx === 0 ? '#D4A017' : 'rgba(240,244,255,0.4)', width: 24 }}>{idx + 1}</div>
                  {pl.image_url ? <img src={pl.image_url} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: `1.5px solid ${idx === 0 ? '#D4A017' : 'rgba(147,197,253,0.15)'}` }} /> : <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(147,197,253,0.08)', border: `1.5px solid ${idx === 0 ? '#D4A017' : 'rgba(147,197,253,0.15)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#93C5FD', fontWeight: 500 }}>{pl.name?.charAt(0)}{pl.name?.split(' ')[1]?.charAt(0)}</div>}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 13, color: '#F0F4FF', fontWeight: idx === 0 ? 600 : 400 }}>{pl.nickname}</span>
                      {sparkVals.length >= 2 && <Sparkline values={sparkVals} width={50} height={14} color={idx === 0 ? '#D4A017' : '#93C5FD'} />}
                      {pl.id !== tabyUser?.id && <span style={{ fontSize: 9, color: 'rgba(147,197,253,0.3)', fontFamily: 'var(--mono)', marginLeft: 'auto' }}>👀</span>}
                    </div>
                    <div style={{ fontSize: 9, color: 'rgba(147,197,253,0.4)', fontFamily: 'var(--mono)' }}>HCP {pl.taby_hcp || pl.hcp} · {pl.stats.fullRounds} rundor{pl.stats.avgStrokes ? ` · ${pl.stats.avgStrokes} snitt slag` : ''}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: idx === 0 ? 18 : 15, color: idx === 0 ? '#D4A017' : 'rgba(240,244,255,0.5)', fontWeight: 500 }}>{pl.stats.pi || '—'}</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'rgba(147,197,253,0.3)' }}>PI</div>
                  </div>
                </div>
              )
            })}
          </div>
          <button onClick={() => setTabyView('scoring')} style={{ width: '100%', marginTop: 12, padding: 14, borderRadius: 12, cursor: 'pointer', background: 'linear-gradient(135deg, rgba(147,197,253,0.12), rgba(147,197,253,0.04))', border: '0.5px solid rgba(147,197,253,0.2)', color: '#93C5FD', fontSize: 14, fontWeight: 600, fontFamily: 'var(--serif)', letterSpacing: 1 }}>Spela runda →</button>
        </div>
      )}

      {/* SCORING VIEW */}
      {tabyView === 'scoring' && (
        <div style={{ padding: '0 16px' }}>
          {!newRound ? (
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'rgba(212,175,55,0.5)', letterSpacing: 1.5, marginBottom: 12 }}>SKAPA BOLL</div>
              <div style={{ fontSize: 12, color: 'rgba(240,244,255,0.5)', marginBottom: 12 }}>Välj vilka som spelar:</div>
              {tabyPlayers.map(p => (
                <button key={p.id} onClick={() => {}} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', marginBottom: 4,
                  background: p.id === tabyUser?.id ? 'rgba(212,175,55,0.08)' : 'rgba(147,197,253,0.03)',
                  border: p.id === tabyUser?.id ? '0.5px solid rgba(212,175,55,0.2)' : '0.5px solid rgba(147,197,253,0.06)',
                  borderRadius: 10, cursor: 'pointer', textAlign: 'left'
                }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: p.id === tabyUser?.id ? 'rgba(212,175,55,0.2)' : 'rgba(147,197,253,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: p.id === tabyUser?.id ? '#D4A017' : '#93C5FD' }}>{p.name?.charAt(0)}</div>
                  <div style={{ flex: 1, fontSize: 13, color: '#F0F4FF' }}>{p.nickname}</div>
                  <div style={{ fontSize: 9, color: 'rgba(147,197,253,0.4)', fontFamily: 'var(--mono)' }}>HCP {p.taby_hcp || p.hcp}</div>
                </button>
              ))}
              <button onClick={() => startRound(tabyPlayers.filter(p => p.id === tabyUser?.id))} style={{
                width: '100%', marginTop: 12, padding: 14, borderRadius: 12, cursor: 'pointer',
                background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))',
                border: '0.5px solid rgba(212,175,55,0.3)', color: '#D4A017', fontSize: 14, fontWeight: 600
              }}>Starta solo-runda →</button>
              <button onClick={() => startRound(tabyPlayers)} style={{
                width: '100%', marginTop: 6, padding: 14, borderRadius: 12, cursor: 'pointer',
                background: 'rgba(147,197,253,0.06)', border: '0.5px solid rgba(147,197,253,0.12)',
                color: '#93C5FD', fontSize: 13
              }}>Starta med alla →</button>

              {/* Mini banguide med avståndsmätning */}
              {(() => {
                const curH = holes.find(h => h.h === tabyHole) || holes[0]
                const gps = TABY_GPS[tabyHole]
                return (
                  <div style={{ marginTop: 20 }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'rgba(147,197,253,0.5)', letterSpacing: 1.5, marginBottom: 8 }}>📍 BANGUIDE & AVSTÅND</div>
                    {/* Hole selector */}
                    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginBottom: 10 }}>
                      {holes.map(h => (
                        <button key={h.h} onClick={() => { setTabyHole(h.h); setTapPoint(null) }} style={{ width: 30, height: 30, borderRadius: 7, fontSize: 11, fontFamily: 'var(--mono)', fontWeight: 600, cursor: 'pointer', background: tabyHole === h.h ? 'rgba(147,197,253,0.15)' : 'rgba(147,197,253,0.03)', border: tabyHole === h.h ? '1px solid #93C5FD' : '0.5px solid rgba(147,197,253,0.08)', color: tabyHole === h.h ? '#93C5FD' : 'rgba(240,244,255,0.3)' }}>{h.h}</button>
                      ))}
                    </div>
                    {/* Hole info row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <div style={{ fontFamily: 'var(--serif)', fontSize: 28, color: '#93C5FD', fontWeight: 700, lineHeight: 1 }}>{curH.h}</div>
                      <div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'rgba(240,244,255,0.6)' }}>PAR {curH.p} · IDX {curH.i}</div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'rgba(212,175,55,0.5)' }}>{curH.m}m</div>
                      </div>
                      {curH.w && <div style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: 'rgba(96,165,250,0.1)', border: '0.5px solid rgba(96,165,250,0.2)', color: '#60A5FA', fontFamily: 'var(--mono)' }}>💧</div>}
                      {/* GPS distance to green from user position */}
                      {tabyUserLoc && (() => {
                        const d = distanceToGreen(tabyUserLoc.lat, tabyUserLoc.lng, tabyHole)
                        if (!d || d > 1500) return null
                        return <div style={{ marginLeft: 'auto', padding: '4px 10px', background: 'rgba(74,222,128,0.1)', border: '0.5px solid rgba(74,222,128,0.25)', borderRadius: 10 }}>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: '#4ADE80' }}>{d}m</div>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 7, color: 'rgba(74,222,128,0.6)', letterSpacing: 1 }}>TILL GREEN</div>
                        </div>
                      })()}
                    </div>
                    {/* Tappable image */}
                    <div style={{ borderRadius: 14, overflow: 'hidden', border: tapPoint?.hole === tabyHole ? '1px solid rgba(212,160,23,0.5)' : '0.5px solid rgba(147,197,253,0.12)', position: 'relative', cursor: 'crosshair', marginBottom: 6 }}
                      onClick={e => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        const fx = (e.clientX - rect.left) / rect.width
                        const fy = (e.clientY - rect.top) / rect.height
                        const tapCoords = tapToGpsCoords(fx, fy, tabyHole)
                        const distGreen = tapCoords ? Math.round(haversineDistance(tapCoords.lat, tapCoords.lng, gps.green.lat, gps.green.lng)) : null
                        const distUser = (tapCoords && tabyUserLoc) ? Math.round(haversineDistance(tabyUserLoc.lat, tabyUserLoc.lng, tapCoords.lat, tapCoords.lng)) : null
                        setTapPoint({ hole: tabyHole, distGreen, distUser, x: fx, y: fy })
                      }}>
                      <img src={`/taby/holes/hole-${tabyHole}.webp`} alt={`Hål ${tabyHole}`} style={{ width: '100%', height: 'auto', display: 'block' }} />
                      {/* Tap marker */}
                      {tapPoint?.hole === tabyHole && (
                        <div style={{ position: 'absolute', left: `calc(${tapPoint.x * 100}% - 8px)`, top: `calc(${tapPoint.y * 100}% - 8px)`, width: 16, height: 16, borderRadius: '50%', background: 'rgba(212,160,23,0.9)', border: '2px solid #fff', boxShadow: '0 0 8px rgba(212,160,23,0.8)', pointerEvents: 'none' }} />
                      )}
                      {/* Distance pills on image */}
                      {tapPoint?.hole === tabyHole ? (
                        <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', background: 'rgba(12,24,48,0.92)', border: '0.5px solid rgba(212,160,23,0.5)', borderRadius: 20, padding: '5px 14px', display: 'flex', alignItems: 'center', gap: 10, backdropFilter: 'blur(8px)', pointerEvents: 'none', whiteSpace: 'nowrap' }}>
                          {tapPoint.distUser != null && <><span style={{ fontSize: 10 }}>📍</span><span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: '#93C5FD' }}>{tapPoint.distUser}m</span><span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'rgba(147,197,253,0.5)' }}>från dig</span></>}
                          {tapPoint.distUser != null && tapPoint.distGreen != null && <span style={{ color: 'rgba(240,244,255,0.2)', fontSize: 10 }}>·</span>}
                          {tapPoint.distGreen != null && <><span style={{ fontSize: 10 }}>🚩</span><span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: '#D4A017' }}>{tapPoint.distGreen}m</span><span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'rgba(212,160,23,0.5)' }}>till green</span></>}
                        </div>
                      ) : (
                        <div style={{ position: 'absolute', bottom: 6, right: 8, fontSize: 9, fontFamily: 'var(--mono)', color: 'rgba(147,197,253,0.4)', letterSpacing: 1 }}>📏 TRYCK FÖR AVSTÅND</div>
                      )}
                    </div>
                    {/* Tip */}
                    <div style={{ fontSize: 11, color: 'rgba(240,244,255,0.5)', lineHeight: 1.4, fontStyle: 'italic' }}>{curH.t}</div>
                  </div>
                )
              })()}
            </div>
          ) : (
            <div>
              {/* Active round header */}
              <div style={{ background: 'rgba(212,175,55,0.06)', border: '0.5px solid rgba(212,175,55,0.15)', borderRadius: 12, padding: '10px 14px', marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'rgba(212,175,55,0.5)', letterSpacing: 1.5 }}>AKTIV RUNDA</div>
                    <div style={{ fontSize: 13, color: '#D4A017', fontWeight: 500 }}>{holesPlayed}/18 hål</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 20, color: '#D4A017', fontWeight: 600 }}>{totalStab}p</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'rgba(240,244,255,0.5)', fontWeight: 500 }}>{totalStrokes} slag {vsParStr > 0 ? `+${vsParStr}` : vsParStr} vs par</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <div style={{ fontSize: 9, color: 'rgba(147,197,253,0.4)', fontFamily: 'var(--mono)' }}>Spel-HCP: {phcp}</div>
                  <div style={{ fontSize: 9, color: 'rgba(147,197,253,0.4)', fontFamily: 'var(--mono)' }}>Netto: {totalStrokes > 0 ? totalStrokes - Math.round(phcp * holesPlayed / 18) : '—'}</div>
                </div>
              </div>
              {/* Hole list - each row clickable for fullscreen */}
              {holes.map(h => {
                const sc = roundScores.find(s => s.hole === h.h)
                const extra = getExtra(h.i, tabyUser?.taby_hcp || tabyUser?.hcp)
                return (
                  <div key={h.h} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', marginBottom: 3, background: sc ? (sc.stableford >= 3 ? 'rgba(74,222,128,0.06)' : sc.stableford === 0 ? 'rgba(232,99,74,0.06)' : 'rgba(147,197,253,0.03)') : 'rgba(147,197,253,0.02)', border: `0.5px solid ${sc ? (sc.stableford >= 3 ? 'rgba(74,222,128,0.15)' : sc.stableford === 0 ? 'rgba(232,99,74,0.15)' : 'rgba(147,197,253,0.08)') : 'rgba(147,197,253,0.06)'}`, borderRadius: 10 }}>
                    <button onClick={() => { setTabyActiveHole(h.h); setTabyCaddieMsg(null) }} style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(147,197,253,0.08)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                      <div style={{ fontFamily: 'var(--serif)', fontSize: 16, color: h.p === 3 ? '#E8634A' : h.p === 5 ? '#4ADE80' : '#93C5FD', fontWeight: 600, lineHeight: 1 }}>{h.h}</div>
                    </button>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, color: 'rgba(240,244,255,0.5)', fontFamily: 'var(--mono)' }}>P{h.p} · {h.m}m · idx {h.i}{extra > 0 ? ` · +${extra}` : ''}</div>
                      {h.w && <span style={{ fontSize: 8, color: '#60A5FA' }}>💧</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button onClick={(e) => { e.stopPropagation(); const cur = sc?.strokes || h.p; if (cur > 1) saveHoleScore(h.h, cur - 1) }} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(147,197,253,0.06)', border: '0.5px solid rgba(147,197,253,0.12)', color: '#93C5FD', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                      <div onClick={() => { if (!sc) saveHoleScore(h.h, h.p) }} style={{ width: 40, height: 36, borderRadius: 8, background: sc ? 'rgba(147,197,253,0.06)' : 'rgba(212,175,55,0.08)', border: sc ? '0.5px solid rgba(147,197,253,0.12)' : '1px solid rgba(212,175,55,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', cursor: sc ? 'default' : 'pointer' }}>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 600, color: sc ? '#F0F4FF' : '#D4A017' }}>{sc?.strokes || h.p}</div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); const cur = sc?.strokes || h.p; if (cur < 12) saveHoleScore(h.h, cur + 1) }} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(147,197,253,0.06)', border: '0.5px solid rgba(147,197,253,0.12)', color: '#93C5FD', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                    </div>
                    <div style={{ minWidth: 28, textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 600, color: sc ? (sc.stableford >= 3 ? '#4ADE80' : sc.stableford === 0 ? '#E8634A' : 'rgba(147,197,253,0.5)') : 'rgba(147,197,253,0.2)' }}>{sc ? `${sc.stableford}p` : ''}</div>
                  </div>
                )
              })}
              {/* UT / IN sub-totals */}
              {(() => {
                const utStrokes = roundScores.filter(s => s.hole <= 9).reduce((sum, s) => sum + (s.strokes || 0), 0)
                const utStab = roundScores.filter(s => s.hole <= 9).reduce((sum, s) => sum + (s.stableford || 0), 0)
                const utPlayed = roundScores.filter(s => s.hole <= 9).length
                const inStrokes = roundScores.filter(s => s.hole > 9).reduce((sum, s) => sum + (s.strokes || 0), 0)
                const inStab = roundScores.filter(s => s.hole > 9).reduce((sum, s) => sum + (s.stableford || 0), 0)
                const inPlayed = roundScores.filter(s => s.hole > 9).length
                return (
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    <div style={{ flex: 1, padding: '8px 10px', background: 'rgba(147,197,253,0.04)', borderRadius: 8, border: '0.5px solid rgba(147,197,253,0.08)' }}>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'rgba(147,197,253,0.4)', letterSpacing: 1.5 }}>UT (1-9)</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: '#F0F4FF' }}>{utPlayed > 0 ? `${utStrokes} slag` : '—'} <span style={{ color: '#D4A017', fontWeight: 600 }}>{utPlayed > 0 ? `${utStab}p` : ''}</span></div>
                    </div>
                    <div style={{ flex: 1, padding: '8px 10px', background: 'rgba(147,197,253,0.04)', borderRadius: 8, border: '0.5px solid rgba(147,197,253,0.08)' }}>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'rgba(147,197,253,0.4)', letterSpacing: 1.5 }}>IN (10-18)</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: '#F0F4FF' }}>{inPlayed > 0 ? `${inStrokes} slag` : '—'} <span style={{ color: '#D4A017', fontWeight: 600 }}>{inPlayed > 0 ? `${inStab}p` : ''}</span></div>
                    </div>
                  </div>
                )
              })()}
              {/* Totals bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, padding: '10px 14px', background: 'rgba(212,175,55,0.06)', borderRadius: 10, border: '0.5px solid rgba(212,175,55,0.12)' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'rgba(240,244,255,0.5)' }}>{holesPlayed}/18 hål</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'rgba(240,244,255,0.5)' }}>{totalStrokes} slag ({vsParStr > 0 ? '+' : ''}{vsParStr})</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#D4A017', fontWeight: 600 }}>{totalStab}p stableford</div>
              </div>

              {/* Streak indicator */}
              {(() => {
                const streak = getTabyStreak()
                if (streak.hot > 0 || streak.cold > 0 || streak.currentHot >= 2 || streak.currentCold >= 2) {
                  return (
                    <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                      {streak.currentHot >= 2 && <div style={{ flex: 1, padding: '8px 10px', background: 'rgba(74,222,128,0.08)', borderRadius: 8, border: '0.5px solid rgba(74,222,128,0.2)', fontSize: 11, color: '#4ADE80' }}>🔥 HOT HAND: {streak.currentHot} i rad</div>}
                      {streak.currentCold >= 2 && <div style={{ flex: 1, padding: '8px 10px', background: 'rgba(232,99,74,0.08)', borderRadius: 8, border: '0.5px solid rgba(232,99,74,0.2)', fontSize: 11, color: '#E8634A' }}>❄️ COLD TURKEY: {streak.currentCold} nollor</div>}
                    </div>
                  )
                }
                return null
              })()}

              {/* MOTSTÅNDARNA - other players in this round */}
              {newRound.player_ids && newRound.player_ids.length > 1 && (
                <div style={{ marginTop: 12, padding: 12, background: 'rgba(147,197,253,0.04)', borderRadius: 12, border: '0.5px solid rgba(147,197,253,0.08)' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'rgba(147,197,253,0.4)', letterSpacing: 1.5, marginBottom: 8 }}>MOTSTÅNDARNA I RUNDAN</div>
                  {newRound.player_ids.filter(pid => pid !== tabyUser?.id).map(pid => {
                    const p = tabyPlayers.find(x => x.id === pid)
                    if (!p) return null
                    const theirScores = tabyScores.filter(s => s.round_id === newRound.id && s.player_id === pid)
                    const theirStab = theirScores.reduce((sum, s) => sum + (s.stableford || 0), 0)
                    const theirStrokes = theirScores.reduce((sum, s) => sum + (s.strokes || 0), 0)
                    const theirPlayed = theirScores.length
                    return (
                      <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '0.5px solid rgba(147,197,253,0.06)' }}>
                        {p.image_url ? <img src={p.image_url} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} /> : <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(147,197,253,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#93C5FD' }}>{p.name?.charAt(0)}</div>}
                        <div style={{ flex: 1, fontSize: 13, color: '#F0F4FF' }}>{p.nickname}</div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'rgba(240,244,255,0.4)' }}>{theirPlayed}/18</div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'rgba(240,244,255,0.5)' }}>{theirStrokes || '—'} slag</div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 600, color: '#D4A017', minWidth: 32, textAlign: 'right' }}>{theirStab || '—'}p</div>
                      </div>
                    )
                  })}
                </div>
              )}

              {holesPlayed === 18 && (
                <button onClick={() => { setNewRound(null); setScoreInput({}); setTabyView('leaderboard') }} style={{
                  width: '100%', marginTop: 8, padding: 14, borderRadius: 12, cursor: 'pointer',
                  background: 'linear-gradient(135deg, rgba(74,222,128,0.15), rgba(74,222,128,0.05))',
                  border: '0.5px solid rgba(74,222,128,0.3)', color: '#4ADE80', fontSize: 14, fontWeight: 600
                }}>Avsluta runda ✓</button>
              )}
            </div>
          )}
        </div>
      )}

      {/* FULLSCREEN HOLE SCORING */}
      {tabyActiveHole && newRound && (() => {
        const h = holes[tabyActiveHole - 1]
        if (!h) return null
        const sc = roundScores.find(s => s.hole === h.h)
        const currentVal = sc?.strokes || h.p
        const extra = getExtra(h.i, tabyUser?.taby_hcp || tabyUser?.hcp)
        const stab = sc?.stableford ?? null
        const prevHole = h.h > 1 ? h.h - 1 : null
        const nextH = h.h < 18 ? h.h + 1 : null
        // Ghost match: find user's most recent completed round before this one
        const prevRound = tabyRounds.find(r => r.id !== newRound.id && r.player_ids?.includes(tabyUser?.id) && tabyScores.filter(s => s.round_id === r.id && s.player_id === tabyUser?.id).length >= 18)
        const ghostScore = prevRound ? tabyScores.find(s => s.round_id === prevRound.id && s.player_id === tabyUser?.id && s.hole === h.h) : null
        const ghostCum = prevRound ? tabyScores.filter(s => s.round_id === prevRound.id && s.player_id === tabyUser?.id && s.hole <= h.h).reduce((sum, s) => sum + (s.stableford || 0), 0) : 0
        const currCum = roundScores.filter(s => s.hole <= h.h).reduce((sum, s) => sum + (s.stableford || 0), 0)
        const cumDiff = prevRound ? currCum - ghostCum : 0
        // Others on this hole
        const othersOnHole = newRound.player_ids?.filter(pid => pid !== tabyUser?.id).map(pid => {
          const p = tabyPlayers.find(x => x.id === pid)
          const s = tabyScores.find(x => x.round_id === newRound.id && x.player_id === pid && x.hole === h.h)
          return { player: p, score: s }
        }).filter(x => x.player) || []
        return (
          <div style={{ position: 'fixed', inset: 0, background: '#0C1830', zIndex: 400, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Top bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))', background: 'rgba(147,197,253,0.04)', borderBottom: '0.5px solid rgba(147,197,253,0.1)' }}>
              <button onClick={() => setTabyActiveHole(null)} style={{ background: 'none', border: 'none', color: '#F0F4FF', fontSize: 16, cursor: 'pointer' }}>← Alla hål</button>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'rgba(240,244,255,0.5)' }}>{newRound?.date || 'Runda'} · Täby GK</div>
            </div>

            {/* HOLE STRIP - jump to any hole, color-coded by score */}
            <div style={{ display: 'flex', gap: 2, padding: '8px 12px', background: 'rgba(147,197,253,0.02)', overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
              {holes.map(hs => {
                const hsc = roundScores.find(s => s.hole === hs.h)
                const isActive = hs.h === h.h
                const bg = hsc ? (hsc.stableford >= 4 ? '#D4A017' : hsc.stableford >= 3 ? '#4ADE80' : hsc.stableford >= 1 ? 'rgba(147,197,253,0.2)' : '#E8634A') : 'rgba(147,197,253,0.06)'
                const color = hsc ? (hsc.stableford === 0 ? '#fff' : hsc.stableford >= 3 ? '#0C1830' : '#F0F4FF') : (isActive ? '#D4A017' : 'rgba(147,197,253,0.5)')
                return (
                  <button key={hs.h} onClick={() => { setTabyActiveHole(hs.h); setTabyCaddieMsg(null) }}
                    style={{ minWidth: 28, height: 28, borderRadius: 6, background: bg, color, border: isActive ? '1.5px solid #D4A017' : '0.5px solid rgba(147,197,253,0.1)', fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {hs.h}
                  </button>
                )
              })}
            </div>

            {/* Running totals - always visible under strip */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 16px', fontSize: 11, fontFamily: 'var(--mono)', color: 'rgba(240,244,255,0.5)', borderBottom: '0.5px solid rgba(147,197,253,0.08)' }}>
              <span>{holesPlayed}/18 hål</span>
              <span>{totalStrokes} slag {vsParStr !== 0 ? `(${vsParStr > 0 ? '+' : ''}${vsParStr})` : ''}</span>
              <span style={{ color: '#D4A017', fontWeight: 600 }}>{totalStab}p</span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
              {/* Hole number & info */}
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 56, fontFamily: 'var(--serif)', fontWeight: 500, color: h.p === 3 ? '#E8634A' : h.p === 5 ? '#4ADE80' : '#F0F4FF' }}>{h.h}</div>
                <div style={{ fontSize: 14, color: 'rgba(240,244,255,0.6)', marginTop: -4 }}>Par {h.p} · {h.m}m · Hcp {h.i}</div>
                {/* Extra strokes indicator */}
                {extra > 0 && (
                  <div style={{ marginTop: 6, display: 'flex', justifyContent: 'center', gap: 4 }}>
                    {Array.from({length: extra}).map((_, i) => <span key={i} style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#4ADE80' }} />)}
                    <span style={{ fontSize: 12, color: '#4ADE80', marginLeft: 4, fontWeight: 500 }}>+{extra} slag</span>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 8 }}>
                  {h.w && <div style={{ padding: '3px 10px', borderRadius: 8, background: 'rgba(96,165,250,0.15)', border: '0.5px solid rgba(96,165,250,0.3)', color: '#60A5FA', fontSize: 10, fontFamily: 'var(--mono)', letterSpacing: 1 }}>💧 VATTEN I SPEL</div>}
                  {h.i <= 3 && <div style={{ padding: '3px 10px', borderRadius: 8, background: 'rgba(232,99,74,0.1)', border: '0.5px solid rgba(232,99,74,0.2)', color: '#E8634A', fontSize: 10, fontFamily: 'var(--mono)', letterSpacing: 1 }}>🔥 SVÅRASTE</div>}
                  {h.i >= 16 && <div style={{ padding: '3px 10px', borderRadius: 8, background: 'rgba(74,222,128,0.1)', border: '0.5px solid rgba(74,222,128,0.2)', color: '#4ADE80', fontSize: 10, fontFamily: 'var(--mono)', letterSpacing: 1 }}>🎯 ENKLASTE</div>}
                </div>
                <div style={{ fontSize: 13, color: 'rgba(240,244,255,0.65)', fontStyle: 'italic', marginTop: 8, lineHeight: 1.5 }}>{h.t}</div>
              </div>

              {/* GPS distance-to-green widget */}
              {(() => {
                const distToGreen = tabyUserLoc ? distanceToGreen(tabyUserLoc.lat, tabyUserLoc.lng, h.h) : null
                const distToTee = tabyUserLoc ? distanceToTee(tabyUserLoc.lat, tabyUserLoc.lng, h.h) : null
                const accuracy = tabyUserLoc?.accuracy
                // If distance is huge (>1km), user is not on course - hide
                const onCourse = distToGreen != null && distToGreen < 1500
                return (
                  <div style={{ marginBottom: 16, padding: '12px 14px', background: 'linear-gradient(135deg, rgba(74,222,128,0.08), rgba(30,58,95,0.15))', borderRadius: 12, border: '0.5px solid rgba(74,222,128,0.2)' }}>
                    {tabyUserLoc && onCourse ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ fontSize: 28 }}>📍</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'rgba(74,222,128,0.7)', letterSpacing: 1.5 }}>TILL GREEN</div>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                            <div style={{ fontSize: 28, fontFamily: 'var(--mono)', fontWeight: 600, color: '#4ADE80' }}>{distToGreen}m</div>
                            {accuracy > 20 && <div style={{ fontSize: 9, color: 'rgba(240,244,255,0.3)', fontFamily: 'var(--mono)' }}>±{Math.round(accuracy)}m</div>}
                          </div>
                        </div>
                        {distToTee != null && (
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'rgba(240,244,255,0.4)', letterSpacing: 1 }}>FRÅN TEE</div>
                            <div style={{ fontSize: 16, fontFamily: 'var(--mono)', color: '#F0F4FF' }}>{distToTee}m</div>
                          </div>
                        )}
                      </div>
                    ) : tabyUserLoc && !onCourse ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(240,244,255,0.5)' }}>
                        <span>📍</span>
                        <span>Du är långt från banan ({distToGreen >= 1000 ? (distToGreen/1000).toFixed(1) + 'km' : distToGreen + 'm'} till green)</span>
                      </div>
                    ) : tabyGpsError ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(232,99,74,0.8)' }}>
                        <span>⚠️</span>
                        <span>GPS ej tillgänglig – aktivera platstjänster för Safari</span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(240,244,255,0.5)', fontFamily: 'var(--mono)' }}>
                        <span style={{ animation: 'pulse 1.5s infinite' }}>📍</span>
                        <span>Hämtar GPS-position...</span>
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* Banguide image - tap to measure distance, or hold to open full modal */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ borderRadius: 12, overflow: 'hidden', border: `0.5px solid ${measureMode ? 'rgba(212,160,23,0.4)' : 'rgba(147,197,253,0.15)'}`, position: 'relative', cursor: measureMode ? 'crosshair' : 'pointer' }}
                  onClick={e => {
                    if (measureMode) {
                      const rect = e.currentTarget.getBoundingClientRect()
                      const fx = (e.clientX - rect.left) / rect.width
                      const fy = (e.clientY - rect.top) / rect.height
                      const dist = tapDistToGreen(fx, fy, h.h)
                      setTapPoint({ hole: h.h, dist, x: fx, y: fy })
                    } else {
                      setTabyBanguideOpen(true)
                    }
                  }}>
                  <img src={`/taby/holes/hole-${h.h}.webp`} alt={`Hål ${h.h}`} style={{ width: '100%', height: 'auto', display: 'block', maxHeight: 180, objectFit: 'cover' }} />
                  {/* Tap marker */}
                  {measureMode && tapPoint?.hole === h.h && (
                    <div style={{ position: 'absolute', left: `calc(${tapPoint.x * 100}% - 8px)`, top: `calc(${tapPoint.y * 100}% - 8px)`, width: 16, height: 16, borderRadius: '50%', background: 'rgba(212,160,23,0.9)', border: '2px solid #fff', boxShadow: '0 0 8px rgba(212,160,23,0.8)', pointerEvents: 'none' }} />
                  )}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '6px 12px', background: 'linear-gradient(180deg, transparent, rgba(12,24,48,0.9))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#93C5FD', fontSize: 9, fontFamily: 'var(--mono)', letterSpacing: 1.5 }}>BANGUIDE · HÅL {h.h}</span>
                    {measureMode && tapPoint?.hole === h.h
                      ? <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, color: '#D4A017' }}>🎯 {tapPoint.dist}m till green</span>
                      : <span style={{ color: 'rgba(147,197,253,0.5)', fontSize: 9, fontFamily: 'var(--mono)' }}>{measureMode ? '📏 TRYCK FÖR AVSTÅND' : '📖 TRYCK FÖR STOR VY'}</span>
                    }
                  </div>
                </div>
                {/* Measure toggle button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                  <button onClick={() => { setMeasureMode(m => !m); setTapPoint(null) }}
                    style={{ padding: '4px 10px', borderRadius: 8, fontSize: 10, fontFamily: 'var(--mono)', cursor: 'pointer', background: measureMode ? 'rgba(212,160,23,0.15)' : 'rgba(147,197,253,0.06)', border: measureMode ? '0.5px solid rgba(212,160,23,0.4)' : '0.5px solid rgba(147,197,253,0.12)', color: measureMode ? '#D4A017' : 'rgba(147,197,253,0.5)', letterSpacing: 0.5 }}>
                    {measureMode ? '📏 Mätläge på' : '📏 Mät avstånd'}
                  </button>
                </div>
              </div>

              {/* CADDIE AI - identical style to DIO */}
              <div style={{ marginBottom: 16 }}>
                {!tabyCaddieMsg && !tabyCaddieLoading && (
                  <button onClick={() => askTabyCaddie(h.h, h)} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'linear-gradient(135deg, rgba(30,58,95,0.45), rgba(212,160,23,0.1))', border: '1px solid rgba(212,160,23,0.25)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#D4A017', fontSize: 13, fontWeight: 500, fontFamily: 'var(--sans)' }}>
                    <LakeBadge size={24}><IconFlag size={12} color="#F0F4FF" /></LakeBadge>
                    Fråga Caddien
                  </button>
                )}
                {tabyCaddieLoading && (
                  <div style={{ textAlign: 'center', padding: '16px', color: '#D4A017', fontSize: 13, fontFamily: 'var(--mono)' }}>
                    <span style={{ animation: 'pulse 1s infinite' }}>Caddien analyserar...</span>
                  </div>
                )}
                {tabyCaddieMsg && (
                  <div style={{ padding: '14px 16px', borderRadius: 12, background: 'linear-gradient(135deg, rgba(30,58,95,0.4), rgba(147,197,253,0.08))', border: '1px solid rgba(147,197,253,0.15)' }}>
                    <div style={{ fontSize: 9, fontFamily: 'var(--mono)', color: '#D4A017', letterSpacing: 1.5, marginBottom: 6 }}>CADDIE AI</div>
                    <div style={{ fontSize: 13, color: 'rgba(240,244,255,0.8)', lineHeight: 1.5 }}>{tabyCaddieMsg}</div>
                    <button onClick={() => setTabyCaddieMsg(null)} style={{ background: 'none', border: 'none', color: 'rgba(240,244,255,0.4)', fontSize: 10, cursor: 'pointer', marginTop: 6, padding: 0 }}>Stäng</button>
                  </div>
                )}
              </div>

              {/* BIG SCORE INPUT - DIO-style glass card */}
              <div style={{ background: 'linear-gradient(135deg, rgba(147,197,253,0.06), rgba(30,58,95,0.2))', border: '0.5px solid rgba(147,197,253,0.15)', borderRadius: 16, padding: 24, marginBottom: 16, backdropFilter: 'blur(10px)' }}>
                <div style={{ textAlign: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'rgba(240,244,255,0.5)', letterSpacing: 1 }}>SLAG</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                  <button onClick={() => { if (currentVal > 1) saveHoleScore(h.h, currentVal - 1) }}
                    style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(147,197,253,0.08)', border: '1px solid rgba(147,197,253,0.15)', color: '#F0F4FF', fontSize: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                  <div onClick={() => { if (!sc) saveHoleScore(h.h, h.p) }}
                    style={{ width: 80, height: 80, borderRadius: 20, background: sc ? 'rgba(147,197,253,0.08)' : 'rgba(212,160,23,0.12)', border: sc ? '2px solid rgba(147,197,253,0.2)' : '2px solid #D4A017', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', cursor: sc ? 'default' : 'pointer' }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 36, fontWeight: 500, color: sc ? '#F0F4FF' : '#D4A017' }}>{sc?.strokes || h.p}</div>
                    {!sc && <div style={{ fontSize: 9, color: '#D4A017', marginTop: -4 }}>TRYCK</div>}
                  </div>
                  <button onClick={() => { if (currentVal < 15) saveHoleScore(h.h, currentVal + 1) }}
                    style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(147,197,253,0.08)', border: '1px solid rgba(147,197,253,0.15)', color: '#F0F4FF', fontSize: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                </div>
                {stab !== null && (
                  <div style={{ textAlign: 'center', marginTop: 16 }}>
                    <span style={{ fontSize: 32, fontFamily: 'var(--mono)', fontWeight: 500, color: stab === 0 ? '#E8634A' : stab >= 4 ? '#D4A017' : stab >= 3 ? '#4ADE80' : 'rgba(240,244,255,0.7)' }}>
                      {stab}p
                    </span>
                  </div>
                )}
              </div>

              {/* Min historik på detta hål */}
              {(() => {
                const history = getTabyHoleHistory(tabyUser?.id, h.h)
                if (!history) return null
                return (
                  <div style={{ marginBottom: 12, padding: 12, background: 'rgba(147,197,253,0.04)', borderRadius: 12, border: '0.5px solid rgba(147,197,253,0.08)' }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'rgba(240,244,255,0.5)', letterSpacing: 1, marginBottom: 4 }}>📜 MIN HISTORIK PÅ HÅLET</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: 12, color: 'rgba(240,244,255,0.65)' }}>Förra: <span style={{ fontFamily: 'var(--mono)', fontWeight: 500, color: '#F0F4FF' }}>{history.last.strokes} slag ({history.last.stableford}p)</span></div>
                      <div style={{ fontSize: 10, color: 'rgba(240,244,255,0.4)', fontFamily: 'var(--mono)' }}>Bäst: {history.bestStab}p · {history.count}x spelat</div>
                    </div>
                  </div>
                )
              })()}

              {/* Others on this hole */}
              {othersOnHole.length > 0 && (
                <div style={{ background: 'rgba(147,197,253,0.04)', borderRadius: 12, padding: 12, marginBottom: 12 }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'rgba(240,244,255,0.5)', letterSpacing: 1, marginBottom: 6 }}>ALLA PÅ HÅL {h.h}</div>
                  {othersOnHole.map(({ player: p, score: s }) => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '0.5px solid rgba(147,197,253,0.06)' }}>
                      {p.image_url ? <img src={p.image_url} style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} /> : <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(147,197,253,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#93C5FD' }}>{p.name?.charAt(0)}</div>}
                      <div style={{ flex: 1, fontSize: 13, color: 'rgba(240,244,255,0.65)' }}>{p.nickname}</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 14, color: 'rgba(240,244,255,0.85)' }}>{s?.strokes || '–'}</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 14, minWidth: 28, textAlign: 'right', color: (s?.stableford || 0) >= 3 ? '#4ADE80' : s?.stableford === 0 ? '#E8634A' : 'rgba(240,244,255,0.5)' }}>{s?.stableford != null ? s.stableford + 'p' : ''}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Ghost Match */}
              {ghostScore && (
                <div style={{ background: 'linear-gradient(135deg, rgba(147,197,253,0.06), rgba(30,58,95,0.15))', border: '0.5px solid rgba(147,197,253,0.1)', borderRadius: 12, padding: 12 }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'rgba(240,244,255,0.5)', letterSpacing: 1, marginBottom: 4 }}>👻 GHOST MATCH vs förra rundan</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 12, color: 'rgba(240,244,255,0.65)' }}>Förra: <span style={{ fontFamily: 'var(--mono)', fontWeight: 500, color: '#F0F4FF' }}>{ghostScore.strokes} slag ({ghostScore.stableford}p)</span></div>
                    <div style={{ fontSize: 14, fontFamily: 'var(--mono)', fontWeight: 600, color: cumDiff > 0 ? '#4ADE80' : cumDiff < 0 ? '#E8634A' : 'rgba(240,244,255,0.5)' }}>
                      {cumDiff > 0 ? '+' : ''}{cumDiff}p tot
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom nav - identical to DIO style */}
            <div style={{ display: 'flex', gap: 8, padding: '12px 16px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0))', background: 'rgba(147,197,253,0.04)', borderTop: '0.5px solid rgba(147,197,253,0.1)' }}>
              {holesPlayed === 18 ? (
                <button onClick={() => { setTabyActiveHole(null); setNewRound(null); setScoreInput({}); setTabyView('leaderboard') }}
                  style={{ flex: 1, padding: '14px 0', borderRadius: 12, background: 'linear-gradient(135deg, #D4A017, #F5D76E)', border: 'none', color: '#0C1830', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  🏆 Avsluta runda ({totalStab}p)
                </button>
              ) : (<>
                <button onClick={() => prevHole && (setTabyActiveHole(prevHole), setTabyCaddieMsg(null))} disabled={!prevHole}
                  style={{ flex: 1, padding: '14px 0', borderRadius: 12, background: prevHole ? 'rgba(147,197,253,0.08)' : 'transparent', border: '1px solid rgba(147,197,253,0.12)', color: prevHole ? '#F0F4FF' : 'rgba(147,197,253,0.2)', fontSize: 14, cursor: prevHole ? 'pointer' : 'default', opacity: prevHole ? 1 : 0.3 }}>← Hål {prevHole || ''}</button>
                <button onClick={() => nextH ? (setTabyActiveHole(nextH), setTabyCaddieMsg(null)) : setTabyActiveHole(null)}
                  style={{ flex: 1, padding: '14px 0', borderRadius: 12, background: '#D4A017', border: 'none', color: '#0C1830', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>{nextH ? `Hål ${nextH} →` : '✓ Klar'}</button>
              </>)}
            </div>
          </div>
        )
      })()}

      {/* HOLE VIEW / BANGUIDE */}
      {tabyView === 'holes' && (
        <div style={{ padding: '0 16px' }}>
          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginBottom: 10 }}>
            {holes.map(h => (
              <button key={h.h} onClick={() => setTabyHole(h.h)} style={{ width: 32, height: 32, borderRadius: 8, fontSize: 12, fontFamily: 'var(--mono)', fontWeight: 600, cursor: 'pointer', background: tabyHole === h.h ? 'rgba(147,197,253,0.15)' : 'rgba(147,197,253,0.03)', border: tabyHole === h.h ? '1px solid #93C5FD' : '0.5px solid rgba(147,197,253,0.08)', color: tabyHole === h.h ? '#93C5FD' : 'rgba(240,244,255,0.3)' }}>{h.h}</button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 36, color: '#93C5FD', fontWeight: 700, lineHeight: 1 }}>{curHole.h}</div>
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'rgba(240,244,255,0.6)' }}>PAR {curHole.p} · INDEX {curHole.i}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'rgba(212,175,55,0.5)' }}>{curHole.m}m (tee 60)</div>
            </div>
            {curHole.w && <div style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: 'rgba(96,165,250,0.1)', border: '0.5px solid rgba(96,165,250,0.2)', color: '#60A5FA', fontFamily: 'var(--mono)' }}>💧</div>}
          </div>
          <div style={{ borderRadius: 16, overflow: 'hidden', border: tapPoint?.hole === curHole.h ? '1px solid rgba(147,197,253,0.4)' : '0.5px solid rgba(147,197,253,0.1)', marginBottom: 8, position: 'relative', cursor: 'crosshair' }}
            onClick={e => {
              const rect = e.currentTarget.getBoundingClientRect()
              const fx = (e.clientX - rect.left) / rect.width
              const fy = (e.clientY - rect.top) / rect.height
              const dist = tapDistToGreen(fx, fy, curHole.h)
              setTapPoint({ hole: curHole.h, dist, x: fx, y: fy })
            }}>
            <img src={`/taby/holes/hole-${curHole.h}.webp`} alt={`Hål ${curHole.h}`} style={{ width: '100%', height: 'auto', display: 'block' }} />
            {tapPoint?.hole === curHole.h && (
              <>
                {/* Tap marker */}
                <div style={{ position: 'absolute', left: `calc(${tapPoint.x * 100}% - 8px)`, top: `calc(${tapPoint.y * 100}% - 8px)`, width: 16, height: 16, borderRadius: '50%', background: 'rgba(212,160,23,0.9)', border: '2px solid #fff', boxShadow: '0 0 8px rgba(212,160,23,0.8)', pointerEvents: 'none' }} />
                {/* Distance pill */}
                <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', background: 'rgba(12,24,48,0.92)', border: '0.5px solid rgba(212,160,23,0.5)', borderRadius: 20, padding: '4px 14px', display: 'flex', alignItems: 'center', gap: 6, backdropFilter: 'blur(8px)', pointerEvents: 'none' }}>
                  <span style={{ fontSize: 12 }}>🎯</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700, color: '#D4A017' }}>{tapPoint.dist}m</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'rgba(240,244,255,0.5)' }}>till green</span>
                </div>
              </>
            )}
            {!tapPoint?.hole && (
              <div style={{ position: 'absolute', bottom: 6, right: 8, fontSize: 9, fontFamily: 'var(--mono)', color: 'rgba(147,197,253,0.4)', letterSpacing: 1 }}>📏 TRYCK FÖR AVSTÅND</div>
            )}
          </div>
          <div style={{ background: 'rgba(147,197,253,0.04)', borderRadius: 12, border: '0.5px solid rgba(147,197,253,0.08)', padding: '10px 14px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'rgba(212,175,55,0.5)', letterSpacing: 1.5, marginBottom: 4 }}>SPELTIPS</div>
            <div style={{ fontSize: 12, color: 'rgba(240,244,255,0.7)', lineHeight: 1.5 }}>{curHole.t}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button onClick={() => setTabyHole(Math.max(1, tabyHole - 1))} disabled={tabyHole === 1} style={{ flex: 1, padding: '10px', borderRadius: 10, cursor: 'pointer', background: 'rgba(147,197,253,0.04)', border: '0.5px solid rgba(147,197,253,0.08)', color: tabyHole === 1 ? 'rgba(240,244,255,0.1)' : '#93C5FD', fontSize: 12, fontFamily: 'var(--mono)' }}>← Hål {Math.max(1, tabyHole - 1)}</button>
            <button onClick={() => setTabyHole(Math.min(18, tabyHole + 1))} disabled={tabyHole === 18} style={{ flex: 1, padding: '10px', borderRadius: 10, cursor: 'pointer', background: 'rgba(147,197,253,0.04)', border: '0.5px solid rgba(147,197,253,0.08)', color: tabyHole === 18 ? 'rgba(240,244,255,0.1)' : '#93C5FD', fontSize: 12, fontFamily: 'var(--mono)' }}>Hål {Math.min(18, tabyHole + 1)} →</button>
          </div>
        </div>
      )}

      {/* BETTING VIEW */}
      {tabyView === 'betting' && (
        <div style={{ padding: '0 16px' }}>
          {/* H2H Matches */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#93C5FD', letterSpacing: 2, marginBottom: 8 }}>HEAD-TO-HEAD MATCHER</div>
            {tabyH2H.map(match => {
              const p1 = tabyPlayers.find(p => p.id === match.player1_id)
              const p2 = tabyPlayers.find(p => p.id === match.player2_id)
              const winner = match.winner_id ? tabyPlayers.find(p => p.id === match.winner_id) : null
              return (
                <div key={match.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', marginBottom: 4, background: 'rgba(147,197,253,0.04)', border: '0.5px solid rgba(147,197,253,0.08)', borderRadius: 10 }}>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {p1?.image_url ? <img src={p1.image_url} style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} /> : <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(147,197,253,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#93C5FD' }}>{p1?.name?.charAt(0)}</div>}
                    <span style={{ fontSize: 12, color: match.winner_id === p1?.id ? '#4ADE80' : '#F0F4FF' }}>{p1?.nickname}</span>
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(147,197,253,0.4)', fontFamily: 'var(--mono)' }}>vs</div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: 12, color: match.winner_id === p2?.id ? '#4ADE80' : '#F0F4FF' }}>{p2?.nickname}</span>
                    {p2?.image_url ? <img src={p2.image_url} style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} /> : <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(147,197,253,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#93C5FD' }}>{p2?.name?.charAt(0)}</div>}
                  </div>
                  <div style={{ minWidth: 50, textAlign: 'right' }}>
                    {winner ? <span style={{ fontSize: 10, color: '#D4A017', fontFamily: 'var(--mono)' }}>🏆 {winner.nickname}</span> : <span style={{ fontSize: 9, color: 'rgba(147,197,253,0.3)', fontFamily: 'var(--mono)' }}>Pågår</span>}
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'rgba(212,175,55,0.5)' }}>{match.stake}kr</div>
                </div>
              )
            })}
            {/* Create H2H */}
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <select value={h2hPlayer1} onChange={e => setH2hPlayer1(e.target.value)} style={{ flex: 1, padding: '8px', borderRadius: 8, background: 'rgba(147,197,253,0.06)', border: '0.5px solid rgba(147,197,253,0.12)', color: '#F0F4FF', fontSize: 11 }}>
                <option value="">Spelare 1</option>
                {tabyPlayers.map(p => <option key={p.id} value={p.id}>{p.nickname}</option>)}
              </select>
              <select value={h2hPlayer2} onChange={e => setH2hPlayer2(e.target.value)} style={{ flex: 1, padding: '8px', borderRadius: 8, background: 'rgba(147,197,253,0.06)', border: '0.5px solid rgba(147,197,253,0.12)', color: '#F0F4FF', fontSize: 11 }}>
                <option value="">Spelare 2</option>
                {tabyPlayers.map(p => <option key={p.id} value={p.id}>{p.nickname}</option>)}
              </select>
              <button onClick={createH2H} style={{ padding: '8px 14px', borderRadius: 8, background: '#93C5FD', border: 'none', color: '#0C1830', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>+</button>
            </div>
          </div>

          {/* Odds Bets */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#D4A017', letterSpacing: 2, marginBottom: 8 }}>ODDS-BETS</div>
            {tabyBets.filter(b => b.status === 'open').map(bet => {
              const opts = tabyBetOptions.filter(o => o.bet_id === bet.id)
              const wagers = tabyBetWagers.filter(w => w.bet_id === bet.id)
              const totalPool = wagers.reduce((s, w) => s + (w.amount || 0), 0)
              return (
                <div key={bet.id} style={{ background: 'rgba(212,175,55,0.04)', border: '0.5px solid rgba(212,175,55,0.12)', borderRadius: 12, padding: '12px 14px', marginBottom: 6 }}>
                  <div style={{ fontSize: 13, color: '#D4A017', fontWeight: 600, marginBottom: 6 }}>{bet.question}</div>
                  <div style={{ fontSize: 9, color: 'rgba(240,244,255,0.4)', fontFamily: 'var(--mono)', marginBottom: 8 }}>Pool: {totalPool}kr · {wagers.length} insatser</div>
                  {opts.map(opt => {
                    const myWager = wagers.find(w => w.option_id === opt.id && w.player_id === tabyUser?.id)
                    return (
                      <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '0.5px solid rgba(212,175,55,0.08)' }}>
                        <div style={{ flex: 1, fontSize: 12, color: '#F0F4FF' }}>{opt.label}</div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: '#D4A017', fontWeight: 600 }}>{opt.odds}x</div>
                        {myWager && <div style={{ fontSize: 9, color: '#4ADE80', fontFamily: 'var(--mono)' }}>💰 {myWager.amount}kr</div>}
                        {!myWager && !bet.locked && (
                          <button onClick={async () => {
                            const { data } = await supabase.from('taby_bet_wagers').insert({ bet_id: bet.id, option_id: opt.id, player_id: tabyUser?.id, amount: 50 }).select().single()
                            if (data) setTabyBetWagers(prev => [...prev, data])
                          }} style={{ padding: '4px 8px', borderRadius: 6, background: 'rgba(212,175,55,0.1)', border: '0.5px solid rgba(212,175,55,0.2)', color: '#D4A017', fontSize: 9, cursor: 'pointer', fontFamily: 'var(--mono)' }}>50kr</button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
            {/* Create bet */}
            <div style={{ background: 'rgba(147,197,253,0.04)', borderRadius: 12, padding: '12px 14px', border: '0.5px solid rgba(147,197,253,0.08)' }}>
              <input value={newBetQuestion} onChange={e => setNewBetQuestion(e.target.value)} placeholder="Ny fråga..." style={{ width: '100%', padding: '8px 10px', borderRadius: 8, background: 'rgba(147,197,253,0.06)', border: '0.5px solid rgba(147,197,253,0.12)', color: '#F0F4FF', fontSize: 12, marginBottom: 8, boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                {tabyPlayers.map(p => (
                  <button key={p.id} onClick={() => setNewBetPlayers(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id])} style={{
                    padding: '4px 8px', borderRadius: 6, fontSize: 10, cursor: 'pointer', fontFamily: 'var(--mono)',
                    background: newBetPlayers.includes(p.id) ? 'rgba(212,175,55,0.15)' : 'rgba(147,197,253,0.04)',
                    border: newBetPlayers.includes(p.id) ? '1px solid #D4A017' : '0.5px solid rgba(147,197,253,0.08)',
                    color: newBetPlayers.includes(p.id) ? '#D4A017' : 'rgba(240,244,255,0.4)'
                  }}>{p.nickname} {calcAutoOdds(p)}x</button>
                ))}
              </div>
              <button onClick={createBet} disabled={!newBetQuestion || newBetPlayers.length < 2} style={{ width: '100%', padding: '10px', borderRadius: 8, background: newBetQuestion && newBetPlayers.length >= 2 ? '#93C5FD' : 'rgba(147,197,253,0.1)', border: 'none', color: newBetQuestion && newBetPlayers.length >= 2 ? '#0C1830' : 'rgba(147,197,253,0.3)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Skapa bet</button>
            </div>
          </div>

          {/* Settled bets */}
          {tabyBets.filter(b => b.status === 'settled').length > 0 && (
            <details style={{ marginTop: 12 }}>
              <summary style={{ cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 9, color: 'rgba(147,197,253,0.4)', letterSpacing: 1 }}>AVGJORDA BETS ({tabyBets.filter(b => b.status === 'settled').length})</summary>
              {tabyBets.filter(b => b.status === 'settled').map(bet => (
                <div key={bet.id} style={{ padding: '8px 0', borderBottom: '0.5px solid rgba(147,197,253,0.06)', fontSize: 11, color: 'rgba(240,244,255,0.4)' }}>
                  {bet.question} → {tabyBetOptions.find(o => o.id === bet.winner_option_id)?.label || '?'}
                </div>
              ))}
            </details>
          )}
        </div>
      )}

      {/* STATS VIEW */}
      {tabyView === 'stats' && (
        <div style={{ padding: '0 16px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'rgba(212,175,55,0.5)', letterSpacing: 1.5, marginBottom: 12 }}>DINA RUNDOR</div>
          {tabyRounds.filter(r => r.player_ids?.includes(tabyUser?.id)).length === 0 ? (
            <div style={{ background: 'rgba(147,197,253,0.04)', borderRadius: 12, padding: 30, textAlign: 'center', color: 'rgba(240,244,255,0.3)' }}>Inga rundor ännu. Spela din första!</div>
          ) : (
            tabyRounds.filter(r => r.player_ids?.includes(tabyUser?.id)).map(round => {
              const rs = tabyScores.filter(s => s.round_id === round.id && s.player_id === tabyUser?.id)
              const stab = rs.reduce((s, sc) => s + sc.stableford, 0)
              const strokes = rs.reduce((s, sc) => s + sc.strokes, 0)
              const par = rs.reduce((s, sc) => s + PARS[sc.hole - 1], 0)
              return (
                <div key={round.id} style={{ background: 'rgba(147,197,253,0.04)', border: '0.5px solid rgba(147,197,253,0.08)', borderRadius: 12, padding: '12px 14px', marginBottom: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 13, color: '#F0F4FF', fontWeight: 500 }}>{round.date}</div>
                      <div style={{ fontSize: 9, color: 'rgba(147,197,253,0.4)', fontFamily: 'var(--mono)' }}>{round.type} · {rs.length} hål</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 18, color: '#D4A017', fontWeight: 600 }}>{stab}p</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'rgba(240,244,255,0.4)' }}>{strokes} slag ({strokes - par > 0 ? '+' : ''}{strokes - par} vs par)</div>
                    </div>
                  </div>
                </div>
              )
            })
          )}

          {/* H2H Matrix */}
          <div style={{ marginTop: 16 }}>
            <button onClick={() => setH2hMatrixOpen(!h2hMatrixOpen)} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: 'rgba(147,197,253,0.04)', border: '0.5px solid rgba(147,197,253,0.08)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#93C5FD', letterSpacing: 2 }}>HEAD-TO-HEAD MATRIS</span>
              <span style={{ color: 'rgba(147,197,253,0.4)', fontSize: 12 }}>{h2hMatrixOpen ? '▲' : '▼'}</span>
            </button>
            {h2hMatrixOpen && (() => {
              const matrix = calcH2HMatrix()
              return (
                <div style={{ overflowX: 'auto', marginTop: 8, scrollbarWidth: 'none' }}>
                  <table style={{ borderCollapse: 'collapse', fontSize: 9, fontFamily: 'var(--mono)', minWidth: '100%' }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '4px 6px', color: 'rgba(147,197,253,0.4)', textAlign: 'left' }}></th>
                        {tabyPlayers.map(p => <th key={p.id} style={{ padding: '4px 4px', color: 'rgba(147,197,253,0.4)', textAlign: 'center', fontSize: 8 }}>{p.nickname?.slice(0, 4)}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {tabyPlayers.map(p1 => (
                        <tr key={p1.id}>
                          <td style={{ padding: '4px 6px', color: '#93C5FD', fontSize: 8, whiteSpace: 'nowrap' }}>{p1.nickname?.slice(0, 6)}</td>
                          {tabyPlayers.map(p2 => {
                            const cell = matrix[p1.id]?.[p2.id]
                            if (!cell) return <td key={p2.id} style={{ padding: '4px', textAlign: 'center', color: 'rgba(147,197,253,0.15)' }}>—</td>
                            const clr = cell.w > cell.l ? '#4ADE80' : cell.l > cell.w ? '#E8634A' : 'rgba(240,244,255,0.4)'
                            return <td key={p2.id} style={{ padding: '4px', textAlign: 'center', color: cell.total > 0 ? clr : 'rgba(147,197,253,0.15)', fontSize: 8 }}>{cell.total > 0 ? `${cell.w}-${cell.l}` : '—'}</td>
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* ======================================== */}
      {/* SETTINGS (admin-only)                     */}
      {/* ======================================== */}
      {tabyView === 'settings' && (tabyUser?.is_admin || tabyUser?.key === 'filip' || tabyUser?.key === 'marcus') && (
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 20, color: '#D4A017', marginBottom: 4 }}>⚙️ Settings</div>
          <div style={{ fontSize: 11, color: 'rgba(240,244,255,0.4)', marginBottom: 16 }}>Admin-panel för Täby Order of Merit</div>

          {/* HCP per spelare */}
          <div style={{ background: 'rgba(147,197,253,0.04)', borderRadius: 12, padding: 14, marginBottom: 14, border: '0.5px solid rgba(147,197,253,0.08)' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#D4A017', letterSpacing: 2, marginBottom: 10 }}>TÄBY HANDICAP</div>
            <div style={{ fontSize: 11, color: 'rgba(240,244,255,0.4)', marginBottom: 10 }}>HCP per spelare (Täby-specifik, skiljer från DIO-HCP)</div>
            {tabyPlayers.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '0.5px solid rgba(147,197,253,0.06)' }}>
                {p.image_url ? <img src={p.image_url} style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} /> : <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(147,197,253,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#93C5FD' }}>{p.name?.charAt(0)}</div>}
                <div style={{ flex: 1, fontSize: 13, color: '#F0F4FF' }}>{p.nickname} <span style={{ color: 'rgba(147,197,253,0.4)', fontSize: 10 }}>({p.name?.split(' ')[0]})</span></div>
                <input type="number" step="0.1" defaultValue={p.taby_hcp ?? p.hcp} style={{ width: 60, background: 'rgba(147,197,253,0.08)', border: '1px solid rgba(147,197,253,0.15)', borderRadius: 6, color: '#F0F4FF', padding: '4px 6px', fontSize: 14, textAlign: 'center', fontFamily: 'var(--mono)' }}
                  onBlur={async (e) => {
                    const v = parseFloat(e.target.value)
                    if (!isNaN(v) && v !== parseFloat(p.taby_hcp ?? p.hcp)) {
                      await supabase.from('inv_players').update({ taby_hcp: v }).eq('id', p.id)
                      fetchTabyPlayers()
                      showTabyToast(`${p.nickname} Täby-HCP → ${v}`, 'birdie')
                    }
                  }} />
              </div>
            ))}
          </div>

          {/* Spelare admin – aktivera/inaktivera taby_active */}
          <div style={{ background: 'rgba(147,197,253,0.04)', borderRadius: 12, padding: 14, marginBottom: 14, border: '0.5px solid rgba(147,197,253,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#D4A017', letterSpacing: 2 }}>SPELARE</div>
              <button onClick={() => setShowInactivePlayers(v => !v)} style={{ fontSize: 9, background: 'rgba(147,197,253,0.06)', border: '0.5px solid rgba(147,197,253,0.12)', color: '#93C5FD', padding: '4px 8px', borderRadius: 6, cursor: 'pointer', fontFamily: 'var(--mono)' }}>{showInactivePlayers ? 'Göm inaktiva' : 'Visa inaktiva'}</button>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(240,244,255,0.4)', marginBottom: 10 }}>Vilka spelare är aktiva i Täby Order of Merit</div>
            {tabyAllPlayers.filter(p => showInactivePlayers || p.taby_active).map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '0.5px solid rgba(147,197,253,0.06)' }}>
                {p.image_url ? <img src={p.image_url} style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', opacity: p.taby_active ? 1 : 0.4 }} /> : <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(147,197,253,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#93C5FD', opacity: p.taby_active ? 1 : 0.4 }}>{p.name?.charAt(0)}</div>}
                <div style={{ flex: 1, fontSize: 13, color: p.taby_active ? '#F0F4FF' : 'rgba(240,244,255,0.4)' }}>{p.nickname || p.name}</div>
                <button onClick={async () => { await supabase.from('inv_players').update({ taby_active: !p.taby_active }).eq('id', p.id); fetchTabyPlayers(); showTabyToast(`${p.nickname || p.name} ${!p.taby_active ? 'aktiverad' : 'inaktiverad'}`, 'birdie') }}
                  style={{ padding: '4px 10px', borderRadius: 6, fontSize: 10, fontFamily: 'var(--mono)', cursor: 'pointer', background: p.taby_active ? 'rgba(74,222,128,0.12)' : 'rgba(147,197,253,0.06)', border: `0.5px solid ${p.taby_active ? 'rgba(74,222,128,0.3)' : 'rgba(147,197,253,0.15)'}`, color: p.taby_active ? '#4ADE80' : 'rgba(147,197,253,0.5)' }}>
                  {p.taby_active ? '✓ Aktiv' : 'Inaktiv'}
                </button>
              </div>
            ))}
          </div>

          {/* Events (turneringar) CRUD */}
          <div style={{ background: 'rgba(147,197,253,0.04)', borderRadius: 12, padding: 14, marginBottom: 14, border: '0.5px solid rgba(147,197,253,0.08)' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#D4A017', letterSpacing: 2, marginBottom: 6 }}>TURNERINGAR & EVENTS</div>
            <div style={{ fontSize: 11, color: 'rgba(240,244,255,0.4)', marginBottom: 12 }}>Redigera existerande events eller skapa nya</div>

            {tabyEvents.sort((a, b) => (a.date || '').localeCompare(b.date || '')).map(ev => {
              const isEditing = editingEventId === ev.id
              return (
                <div key={ev.id} style={{ background: 'rgba(30,58,95,0.2)', borderRadius: 10, padding: 12, marginBottom: 8, border: '0.5px solid rgba(147,197,253,0.1)' }}>
                  {!isEditing ? (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                        <div>
                          <div style={{ fontSize: 14, color: '#F0F4FF', fontWeight: 600 }}>{ev.name}</div>
                          <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'rgba(147,197,253,0.5)', marginTop: 2 }}>{ev.date} · {ev.format || 'stableford'} · {ev.status}</div>
                          {ev.description && <div style={{ fontSize: 11, color: 'rgba(240,244,255,0.5)', marginTop: 4 }}>{ev.description}</div>}
                        </div>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => setEditingEventId(ev.id)} style={{ padding: '4px 8px', fontSize: 10, background: 'rgba(147,197,253,0.08)', border: '0.5px solid rgba(147,197,253,0.15)', borderRadius: 6, color: '#93C5FD', cursor: 'pointer' }}>✏️</button>
                          <button onClick={async () => { if (confirm(`Ta bort event "${ev.name}"?`)) { await supabase.from('taby_events').delete().eq('id', ev.id); fetchTabyEvents(); showTabyToast('Event borttaget', 'birdie') } }} style={{ padding: '4px 8px', fontSize: 10, background: 'rgba(232,99,74,0.08)', border: '0.5px solid rgba(232,99,74,0.2)', borderRadius: 6, color: '#E8634A', cursor: 'pointer' }}>🗑️</button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <input defaultValue={ev.name} placeholder="Namn" style={{ background: 'rgba(147,197,253,0.08)', border: '1px solid rgba(147,197,253,0.2)', borderRadius: 6, color: '#F0F4FF', padding: '6px 10px', fontSize: 13 }}
                        onBlur={async (e) => { if (e.target.value !== ev.name) { await supabase.from('taby_events').update({ name: e.target.value }).eq('id', ev.id); fetchTabyEvents() } }} />
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input type="date" defaultValue={ev.date} style={{ flex: 1, background: 'rgba(147,197,253,0.08)', border: '1px solid rgba(147,197,253,0.2)', borderRadius: 6, color: '#F0F4FF', padding: '6px 10px', fontSize: 12, fontFamily: 'var(--mono)' }}
                          onBlur={async (e) => { if (e.target.value !== ev.date) { await supabase.from('taby_events').update({ date: e.target.value }).eq('id', ev.id); fetchTabyEvents() } }} />
                        <select defaultValue={ev.format || 'stableford'} style={{ flex: 1, background: 'rgba(147,197,253,0.08)', border: '1px solid rgba(147,197,253,0.2)', borderRadius: 6, color: '#F0F4FF', padding: '6px 10px', fontSize: 12 }}
                          onChange={async (e) => { await supabase.from('taby_events').update({ format: e.target.value }).eq('id', ev.id); fetchTabyEvents() }}>
                          <option value="stableford">Stableford</option>
                          <option value="matchplay">Matchplay</option>
                          <option value="scramble">Scramble</option>
                          <option value="foursomes">Foursomes</option>
                          <option value="36_holes">36 hål</option>
                          <option value="shotgun">Shotgun</option>
                        </select>
                      </div>
                      <textarea defaultValue={ev.description || ''} placeholder="Beskrivning" rows={2} style={{ background: 'rgba(147,197,253,0.08)', border: '1px solid rgba(147,197,253,0.2)', borderRadius: 6, color: '#F0F4FF', padding: '6px 10px', fontSize: 12, resize: 'vertical', fontFamily: 'inherit' }}
                        onBlur={async (e) => { await supabase.from('taby_events').update({ description: e.target.value }).eq('id', ev.id); fetchTabyEvents() }} />
                      <select defaultValue={ev.status || 'upcoming'} style={{ background: 'rgba(147,197,253,0.08)', border: '1px solid rgba(147,197,253,0.2)', borderRadius: 6, color: '#F0F4FF', padding: '6px 10px', fontSize: 12 }}
                        onChange={async (e) => { await supabase.from('taby_events').update({ status: e.target.value }).eq('id', ev.id); fetchTabyEvents() }}>
                        <option value="upcoming">Kommande</option>
                        <option value="active">Pågående</option>
                        <option value="completed">Avslutat</option>
                        <option value="cancelled">Inställt</option>
                      </select>
                      <button onClick={() => setEditingEventId(null)} style={{ padding: '8px', background: 'rgba(74,222,128,0.12)', border: '0.5px solid rgba(74,222,128,0.3)', borderRadius: 6, color: '#4ADE80', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>✓ Klar</button>
                    </div>
                  )}
                </div>
              )
            })}

            {/* Skapa nytt event */}
            <div style={{ marginTop: 12, padding: 12, background: 'rgba(212,160,23,0.06)', borderRadius: 10, border: '0.5px dashed rgba(212,160,23,0.3)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#D4A017', letterSpacing: 1.5, marginBottom: 8 }}>+ NYTT EVENT</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <input value={newEventForm.name} onChange={e => setNewEventForm(f => ({ ...f, name: e.target.value }))} placeholder="Eventnamn (ex. Höstkuppen)" style={{ background: 'rgba(147,197,253,0.08)', border: '1px solid rgba(147,197,253,0.2)', borderRadius: 6, color: '#F0F4FF', padding: '8px 10px', fontSize: 13 }} />
                <div style={{ display: 'flex', gap: 6 }}>
                  <input type="date" value={newEventForm.date} onChange={e => setNewEventForm(f => ({ ...f, date: e.target.value }))} style={{ flex: 1, background: 'rgba(147,197,253,0.08)', border: '1px solid rgba(147,197,253,0.2)', borderRadius: 6, color: '#F0F4FF', padding: '6px 10px', fontSize: 12, fontFamily: 'var(--mono)' }} />
                  <select value={newEventForm.format} onChange={e => setNewEventForm(f => ({ ...f, format: e.target.value }))} style={{ flex: 1, background: 'rgba(147,197,253,0.08)', border: '1px solid rgba(147,197,253,0.2)', borderRadius: 6, color: '#F0F4FF', padding: '6px 10px', fontSize: 12 }}>
                    <option value="stableford">Stableford</option>
                    <option value="matchplay">Matchplay</option>
                    <option value="scramble">Scramble</option>
                    <option value="foursomes">Foursomes</option>
                    <option value="36_holes">36 hål</option>
                    <option value="shotgun">Shotgun</option>
                  </select>
                </div>
                <textarea value={newEventForm.description} onChange={e => setNewEventForm(f => ({ ...f, description: e.target.value }))} placeholder="Beskrivning (valfritt)" rows={2} style={{ background: 'rgba(147,197,253,0.08)', border: '1px solid rgba(147,197,253,0.2)', borderRadius: 6, color: '#F0F4FF', padding: '6px 10px', fontSize: 12, resize: 'vertical', fontFamily: 'inherit' }} />
                <button onClick={async () => {
                  if (!newEventForm.name || !newEventForm.date) { showTabyToast('Namn och datum krävs', 'zero'); return }
                  await supabase.from('taby_events').insert({ name: newEventForm.name, event_type: 'event', date: newEventForm.date, format: newEventForm.format, description: newEventForm.description, status: 'upcoming', participant_ids: tabyPlayers.map(p => p.id) })
                  setNewEventForm({ name: '', event_type: 'event', date: '', format: 'stableford', description: '', participants: [] })
                  fetchTabyEvents()
                  showTabyToast(`Event "${newEventForm.name}" skapat`, 'eagle')
                }} style={{ padding: '10px', background: 'linear-gradient(135deg, #D4A017, #F5D76E)', border: 'none', borderRadius: 6, color: '#0C1830', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>+ Skapa event</button>
              </div>
            </div>
          </div>

          {/* Rundor & Bollar management */}
          <div style={{ background: 'rgba(147,197,253,0.04)', borderRadius: 12, padding: 14, marginBottom: 14, border: '0.5px solid rgba(147,197,253,0.08)' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#D4A017', letterSpacing: 2, marginBottom: 6 }}>RUNDOR & BOLLAR</div>
            <div style={{ fontSize: 11, color: 'rgba(240,244,255,0.4)', marginBottom: 12 }}>Alla registrerade rundor. Ta bort rundor med problem.</div>
            {tabyRounds.length === 0 && <div style={{ textAlign: 'center', padding: 20, fontSize: 12, color: 'rgba(240,244,255,0.3)' }}>Inga rundor ännu</div>}
            {tabyRounds.slice(0, 20).map(r => {
              const scoreCount = tabyScores.filter(s => s.round_id === r.id).length
              const playerCount = r.player_ids?.length || 0
              const progress = playerCount > 0 ? Math.round((scoreCount / (playerCount * 18)) * 100) : 0
              return (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', marginBottom: 4, background: 'rgba(147,197,253,0.03)', borderRadius: 8, border: '0.5px solid rgba(147,197,253,0.06)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: '#F0F4FF' }}>{r.date} {r.event_name ? `· ${r.event_name}` : ''}</div>
                    <div style={{ fontSize: 9, fontFamily: 'var(--mono)', color: 'rgba(147,197,253,0.5)' }}>{r.type} · {playerCount} spelare · {scoreCount} scores · {progress}%</div>
                  </div>
                  <button onClick={async () => {
                    if (confirm(`Ta bort rundan från ${r.date}? Alla scores försvinner permanent.`)) {
                      await supabase.from('taby_scores').delete().eq('round_id', r.id)
                      await supabase.from('taby_rounds').delete().eq('id', r.id)
                      fetchTabyRounds(); fetchTabyScores()
                      showTabyToast('Runda borttagen', 'birdie')
                    }
                  }} style={{ padding: '4px 10px', fontSize: 10, background: 'rgba(232,99,74,0.08)', border: '0.5px solid rgba(232,99,74,0.2)', borderRadius: 6, color: '#E8634A', cursor: 'pointer' }}>🗑️</button>
                </div>
              )
            })}
          </div>

          {/* Push broadcast */}
          <div style={{ background: 'rgba(147,197,253,0.04)', borderRadius: 12, padding: 14, marginBottom: 14, border: '0.5px solid rgba(147,197,253,0.08)' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#D4A017', letterSpacing: 2, marginBottom: 6 }}>📢 PUSH-NOTIS</div>
            <div style={{ fontSize: 11, color: 'rgba(240,244,255,0.4)', marginBottom: 10 }}>Skicka meddelande till Täby-spelare</div>

            <div style={{ fontSize: 9, color: 'rgba(147,197,253,0.5)', fontFamily: 'var(--mono)', letterSpacing: 1.5, marginBottom: 6 }}>SNABBVAL</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              {[
                { t: '🏌️ Tee-off-påminnelse', b: 'Dags att värma upp!' },
                { t: '⛳ Nästa runda bokad', b: 'Kolla rundorna i appen' },
                { t: '🏆 Nytt event klart', b: 'Se det nya eventet i Merit-fliken' },
                { t: '📊 Nya rundor registrerade', b: 'Kolla leaderboarden – nya poäng uppe' },
              ].map((q, i) => (
                <button key={i} onClick={() => setTabyBroadcastForm(f => ({ ...f, title: q.t, body: q.b }))}
                  style={{ fontSize: 10, padding: '5px 9px', background: 'rgba(147,197,253,0.06)', border: '0.5px solid rgba(147,197,253,0.15)', color: 'rgba(240,244,255,0.7)', borderRadius: 6, cursor: 'pointer', fontFamily: 'var(--mono)' }}>
                  {q.t}
                </button>
              ))}
            </div>

            <select value={tabyBroadcastForm.target} onChange={e => setTabyBroadcastForm(f => ({ ...f, target: e.target.value }))}
              style={{ width: '100%', background: 'rgba(147,197,253,0.08)', border: '1px solid rgba(147,197,253,0.15)', borderRadius: 8, color: '#F0F4FF', padding: '8px', fontSize: 12, marginBottom: 8 }}>
              <option value="all">📣 Alla Täby-spelare</option>
              <option value="others">📣 Alla utom mig</option>
              {tabyPlayers.map(p => <option key={p.id} value={p.id}>👤 {p.nickname}</option>)}
            </select>
            <input value={tabyBroadcastForm.title} onChange={e => setTabyBroadcastForm(f => ({ ...f, title: e.target.value }))} placeholder="Titel" maxLength={60}
              style={{ width: '100%', background: 'rgba(147,197,253,0.08)', border: '1px solid rgba(147,197,253,0.15)', borderRadius: 8, color: '#F0F4FF', padding: '8px', fontSize: 12, marginBottom: 8, boxSizing: 'border-box' }} />
            <textarea value={tabyBroadcastForm.body} onChange={e => setTabyBroadcastForm(f => ({ ...f, body: e.target.value }))} placeholder="Meddelande" rows={3} maxLength={200}
              style={{ width: '100%', background: 'rgba(147,197,253,0.08)', border: '1px solid rgba(147,197,253,0.15)', borderRadius: 8, color: '#F0F4FF', padding: '8px', fontSize: 12, marginBottom: 8, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }} />
            <button disabled={tabyBroadcastSending || !tabyBroadcastForm.title || !tabyBroadcastForm.body} onClick={async () => {
              setTabyBroadcastSending(true)
              try {
                const payload = { title: tabyBroadcastForm.title, body: tabyBroadcastForm.body, type: 'broadcast' }
                if (tabyBroadcastForm.target === 'others') payload.excludePlayerId = tabyUser?.id
                else if (tabyBroadcastForm.target !== 'all') payload.targetPlayerId = tabyBroadcastForm.target
                await sendPush(payload)
                showTabyToast('Push skickad!', 'eagle')
                setTabyBroadcastForm({ title: '', body: '', target: 'all' })
              } catch (e) { showTabyToast('Push-fel: ' + e.message, 'zero') }
              setTabyBroadcastSending(false)
            }} style={{ width: '100%', padding: '10px', background: (tabyBroadcastSending || !tabyBroadcastForm.title || !tabyBroadcastForm.body) ? 'rgba(147,197,253,0.08)' : 'linear-gradient(135deg, #D4A017, #F5D76E)', border: 'none', borderRadius: 8, color: (tabyBroadcastSending || !tabyBroadcastForm.title || !tabyBroadcastForm.body) ? 'rgba(147,197,253,0.3)' : '#0C1830', cursor: (tabyBroadcastSending || !tabyBroadcastForm.title || !tabyBroadcastForm.body) ? 'default' : 'pointer', fontSize: 13, fontWeight: 700 }}>
              {tabyBroadcastSending ? '⏳ Skickar...' : '📤 Skicka push'}
            </button>
          </div>

          {/* Säsong & Bana */}
          <div style={{ background: 'rgba(147,197,253,0.04)', borderRadius: 12, padding: 14, marginBottom: 14, border: '0.5px solid rgba(147,197,253,0.08)' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#D4A017', letterSpacing: 2, marginBottom: 10 }}>⛳ SÄSONG & BANA</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Slope', key: 'slope', step: 1, min: 55, max: 155 },
                { label: 'CR', key: 'cr', step: 0.1, min: 60, max: 80 },
                { label: 'Qualifying-rundor (för PI)', key: 'qualifyingRounds', step: 1, min: 1, max: 20 },
              ].map(({ label, key, step, min, max }) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, fontSize: 12, color: '#F0F4FF' }}>{label}</div>
                  <input type="number" step={step} min={min} max={max} value={tabySettings[key]} onChange={e => saveTabySetting(key, parseFloat(e.target.value))}
                    style={{ width: 70, background: 'rgba(147,197,253,0.08)', border: '1px solid rgba(147,197,253,0.15)', borderRadius: 6, color: '#F0F4FF', padding: '4px 6px', fontSize: 14, textAlign: 'center', fontFamily: 'var(--mono)' }} />
                </div>
              ))}
            </div>
          </div>

          {/* Merit-vikter */}
          <div style={{ background: 'rgba(147,197,253,0.04)', borderRadius: 12, padding: 14, marginBottom: 14, border: '0.5px solid rgba(147,197,253,0.08)' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#D4A017', letterSpacing: 2, marginBottom: 6 }}>🏆 MERIT-VIKTER (%)</div>
            <div style={{ fontSize: 11, color: 'rgba(240,244,255,0.4)', marginBottom: 10 }}>Totalt ska vara 100%. Spara = reload appen.</div>
            {[
              { label: 'Performance Index (PI)', key: 'meritPi', color: '#93C5FD' },
              { label: 'Events', key: 'meritEvents', color: '#D4A017' },
              { label: 'Head-to-Head', key: 'meritH2H', color: '#4ADE80' },
              { label: 'Aktivitet (cap 12 rundor)', key: 'meritActivity', color: '#E8634A' },
            ].map(({ label, key, color }) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ flex: 1, fontSize: 12, color: '#F0F4FF' }}>{label}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input type="number" step={5} min={0} max={100} value={tabySettings[key]} onChange={e => saveTabySetting(key, parseInt(e.target.value) || 0)}
                    style={{ width: 52, background: 'rgba(147,197,253,0.08)', border: `1px solid ${color}30`, borderRadius: 6, color, padding: '4px 6px', fontSize: 14, textAlign: 'center', fontFamily: 'var(--mono)' }} />
                  <span style={{ fontSize: 12, color: 'rgba(240,244,255,0.4)' }}>%</span>
                </div>
              </div>
            ))}
            {(() => {
              const sum = (tabySettings.meritPi||0)+(tabySettings.meritEvents||0)+(tabySettings.meritH2H||0)+(tabySettings.meritActivity||0)
              return <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: sum === 100 ? '#4ADE80' : '#E8634A', marginTop: 4 }}>Summa: {sum}% {sum === 100 ? '✓' : `(bör vara 100%)`}</div>
            })()}
          </div>

          {/* Sidospelspriser */}
          <div style={{ background: 'rgba(147,197,253,0.04)', borderRadius: 12, padding: 14, marginBottom: 14, border: '0.5px solid rgba(147,197,253,0.08)' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#D4A017', letterSpacing: 2, marginBottom: 10 }}>💰 SIDOSPELSPRISER (kr)</div>
            <div style={{ fontSize: 11, color: 'rgba(240,244,255,0.4)', marginBottom: 10 }}>Standardinsats för bollar och sidospel</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Nassau per sida', key: 'nassauStake' },
                { label: 'Skins per hål', key: 'skinsStake' },
                { label: 'Närmast pin (NP)', key: 'npStake' },
                { label: 'Längst drive (LD)', key: 'ldStake' },
              ].map(({ label, key }) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, fontSize: 12, color: '#F0F4FF' }}>{label}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {[10,25,50,100].map(v => (
                      <button key={v} onClick={() => saveTabySetting(key, v)} style={{ padding: '4px 8px', borderRadius: 6, fontSize: 10, fontFamily: 'var(--mono)', cursor: 'pointer', background: tabySettings[key] === v ? 'rgba(147,197,253,0.2)' : 'rgba(147,197,253,0.04)', border: tabySettings[key] === v ? '1px solid #93C5FD' : '0.5px solid rgba(147,197,253,0.1)', color: tabySettings[key] === v ? '#93C5FD' : 'rgba(240,244,255,0.4)' }}>{v}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Event-vinnare */}
          <div style={{ background: 'rgba(147,197,253,0.04)', borderRadius: 12, padding: 14, marginBottom: 14, border: '0.5px solid rgba(147,197,253,0.08)' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#D4A017', letterSpacing: 2, marginBottom: 6 }}>🎖️ EVENT-VINNARE</div>
            <div style={{ fontSize: 11, color: 'rgba(240,244,255,0.4)', marginBottom: 10 }}>Sätt plats (1-6) per spelare per event. Ger Merit-poäng.</div>
            {tabyEvents.map(ev => (
              <div key={ev.id} style={{ background: 'rgba(30,58,95,0.2)', borderRadius: 10, padding: 12, marginBottom: 8, border: '0.5px solid rgba(147,197,253,0.1)' }}>
                <div style={{ fontSize: 13, color: '#F0F4FF', fontWeight: 600, marginBottom: 8 }}>{ev.event_name || ev.name} <span style={{ fontSize: 9, color: 'rgba(147,197,253,0.4)', fontFamily: 'var(--mono)' }}>{ev.date}</span></div>
                {tabyPlayers.map(p => {
                  const results = ev.results || {}
                  const pos = results[p.id]
                  return (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <div style={{ flex: 1, fontSize: 12, color: '#F0F4FF' }}>{p.nickname}</div>
                      <div style={{ display: 'flex', gap: 3 }}>
                        {[1,2,3,4,5,6,'DNS'].map(v => (
                          <button key={v} onClick={async () => {
                            const newResults = { ...(ev.results || {}), [p.id]: v }
                            await supabase.from('taby_events').update({ results: newResults }).eq('id', ev.id)
                            fetchTabyEvents()
                          }} style={{ padding: '3px 6px', borderRadius: 5, fontSize: 10, fontFamily: 'var(--mono)', cursor: 'pointer', background: pos === v ? (v === 1 ? 'rgba(212,160,23,0.25)' : 'rgba(147,197,253,0.15)') : 'rgba(147,197,253,0.03)', border: pos === v ? (v === 1 ? '1px solid #D4A017' : '1px solid #93C5FD') : '0.5px solid rgba(147,197,253,0.08)', color: pos === v ? (v === 1 ? '#D4A017' : '#93C5FD') : 'rgba(240,244,255,0.3)' }}>{v}</button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
            {tabyEvents.length === 0 && <div style={{ textAlign: 'center', padding: 12, fontSize: 12, color: 'rgba(240,244,255,0.3)' }}>Inga events ännu – skapa ett ovan</div>}
          </div>

          {/* Danger zone */}
          <div style={{ background: 'rgba(232,99,74,0.05)', borderRadius: 12, padding: 14, marginBottom: 14, border: '0.5px solid rgba(232,99,74,0.15)' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#E8634A', letterSpacing: 2, marginBottom: 6 }}>⚠️ DANGER ZONE</div>
            <div style={{ fontSize: 11, color: 'rgba(240,244,255,0.5)', marginBottom: 10 }}>Oåterkalleliga actions</div>
            <button onClick={async () => {
              if (confirm('RENSA ALLA RUNDOR OCH SCORES? Detta kan ej ångras!')) {
                if (confirm('Är du HELT säker? Alla Täby-rundor och scores försvinner.')) {
                  await supabase.from('taby_scores').delete().neq('id', '00000000-0000-0000-0000-000000000000')
                  await supabase.from('taby_rounds').delete().neq('id', '00000000-0000-0000-0000-000000000000')
                  fetchTabyRounds(); fetchTabyScores()
                  showTabyToast('Alla rundor raderade', 'zero')
                }
              }
            }} style={{ width: '100%', padding: '10px', background: 'rgba(232,99,74,0.12)', border: '0.5px solid rgba(232,99,74,0.3)', borderRadius: 8, color: '#E8634A', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--mono)' }}>
              🗑️ Rensa ALLA rundor + scores
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function DIOApp({ onSwitchMode }) {
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
  const [caddieMsg, setCaddieMsg] = useState(null)
  const [caddieLoading, setCaddieLoading] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [showNotifs, setShowNotifs] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  useEffect(() => {
    const saved = typeof window !== 'undefined' && localStorage?.getItem('dio_theme')
    if (saved === 'light') setDarkMode(false)
  }, [])
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
    localStorage?.setItem('dio_theme', darkMode ? 'dark' : 'light')
  }, [darkMode])
  const [unread, setUnread] = useState(0)
  const [showInstall, setShowInstall] = useState(false)
  const [splash, setSplash] = useState(true)
  const [historia, setHistoria] = useState([])
  const [weather, setWeather] = useState(null)
  const [shotVotes, setShotVotes] = useState({})
  const [historiaCaption, setHistoriaCaption] = useState('')
  const [historiaYear, setHistoriaYear] = useState('2025')
  const [historiaQueue, setHistoriaQueue] = useState([]) // { id, file, preview, caption, year, status }
  const [historiaUploading, setHistoriaUploading] = useState(false)
  const [splashExit, setSplashExit] = useState(false)
  const [expenses, setExpenses] = useState([])
  const [payments, setPayments] = useState([])
  const [oddsBets, setOddsBets] = useState([])
  const [oddsOptions, setOddsOptions] = useState([])
  const [oddsWagers, setOddsWagers] = useState([])
  const [oddsForm, setOddsForm] = useState({ question: '', options: [], banker: '', useAutoOdds: true })
  const [wagerInputs, setWagerInputs] = useState({})
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
    const t1 = setTimeout(() => setSplashExit(true), 9200)
    const t = setTimeout(() => setSplash(false), 9800)
    return () => { clearTimeout(t1); clearTimeout(t) }
  }, [])

  const fetchAll = useCallback(async () => {
    if (!supabase) return
    const [p, r, s, ex] = await Promise.all([supabase.from('inv_players').select('*').eq('dio_active', true).order('hcp'), supabase.from('inv_rounds').select('*').order('round_number'), supabase.from('inv_scores').select('*'), supabase.from('inv_expenses').select('*').order('created_at', { ascending: false })])
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
  const fetchPayments = useCallback(async () => {
    if (!supabase) return
    const { data } = await supabase.from('inv_payments').select('*').order('created_at', { ascending: false })
    if (data) setPayments(data)
  }, [])
  const fetchOdds = useCallback(async () => {
    if (!supabase) return
    const [b, o, w] = await Promise.all([
      supabase.from('inv_odds_bets').select('*').order('created_at', { ascending: false }),
      supabase.from('inv_odds_options').select('*'),
      supabase.from('inv_odds_wagers').select('*')
    ])
    if (b.data) setOddsBets(b.data)
    if (o.data) setOddsOptions(o.data)
    if (w.data) setOddsWagers(w.data)
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
  useEffect(() => { fetchAll(); fetchChat(); fetchExpenses(); fetchH2h(); fetchProps(); fetchPayments(); fetchOdds() }, [fetchAll, fetchChat, fetchExpenses, fetchH2h, fetchProps, fetchPayments, fetchOdds])

  // Auto-refresh när appen blir synlig (PWA: när man växlar tillbaka)
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        fetchAll(); fetchChat(); fetchExpenses(); fetchH2h(); fetchProps(); fetchPayments(); fetchOdds()
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [fetchAll, fetchChat, fetchExpenses, fetchH2h, fetchProps, fetchPayments, fetchOdds])
  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }) }, [chat])

  // Realtime
  useEffect(() => {
    if (!supabase) return
    const c1 = supabase.channel('s1').on('postgres_changes', { event: '*', schema: 'public', table: 'inv_scores' }, p => {
      fetchAll()
      if (p.new?.player_id !== user?.id) {
        if (p.new?.stableford_points >= 3) {
          const pl = players.find(x => x.id === p.new.player_id)
          if (pl) {
            // Real birdie/eagle check: strokes vs par (NOT stableford!)
            const holePar = (courses.Skogsbanan.holes[p.new.hole - 1]?.par) || 4
            const m = getShoutout(pl.name, pl.nickname, p.new.strokes, holePar)
            if (m) { const diff = p.new.strokes - holePar; showToast(m, diff <= -2 ? 'eagle' : 'birdie') }
          }
        } else if (p.new?.stableford_points === 0 && p.new?.strokes) {
          const pl = players.find(x => x.id === p.new.player_id)
          if (pl) { const m = getZeroRoast(pl.nickname); addNotif(m, 'zero'); soundZero() }
        }
      }
    }).subscribe()
    const c2 = supabase.channel('c1').on('postgres_changes', { event: '*', schema: 'public', table: 'inv_chat' }, (p) => { setTimeout(() => fetchChat(), 300); if (p.new?.player_id !== user?.id) soundChat() }).subscribe()
    const c3 = supabase.channel('e1').on('postgres_changes', { event: '*', schema: 'public', table: 'inv_expenses' }, () => fetchExpenses()).subscribe()
    const c6 = supabase.channel('pay1').on('postgres_changes', { event: '*', schema: 'public', table: 'inv_payments' }, () => fetchPayments()).subscribe()
    const c7 = supabase.channel('odds1').on('postgres_changes', { event: '*', schema: 'public', table: 'inv_odds_bets' }, () => fetchOdds()).subscribe()
    const c8 = supabase.channel('odds2').on('postgres_changes', { event: '*', schema: 'public', table: 'inv_odds_options' }, () => fetchOdds()).subscribe()
    const c9 = supabase.channel('odds3').on('postgres_changes', { event: '*', schema: 'public', table: 'inv_odds_wagers' }, () => fetchOdds()).subscribe()
    const c4 = supabase.channel('h2h1').on('postgres_changes', { event: '*', schema: 'public', table: 'inv_h2h_matches' }, () => fetchH2h()).subscribe()
    const c5 = supabase.channel('prop1').on('postgres_changes', { event: '*', schema: 'public', table: 'inv_prop_bets' }, () => fetchProps()).subscribe()
    return () => { supabase.removeChannel(c1); supabase.removeChannel(c2); supabase.removeChannel(c3); supabase.removeChannel(c4); supabase.removeChannel(c5); supabase.removeChannel(c6); supabase.removeChannel(c7); supabase.removeChannel(c8); supabase.removeChannel(c9) }
  }, [fetchAll, fetchChat, fetchExpenses, fetchH2h, fetchProps, fetchPayments, fetchOdds, players])

  const addNotif = (msg, type) => {
    const n = { id: Date.now(), msg, type, time: new Date().toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }) }
    setNotifications(prev => [n, ...prev].slice(0, 50))
    setUnread(prev => { const v = prev + 1; navigator?.setAppBadge?.(v).catch(() => {}); return v })
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

  // Caddie AI
  const askCaddie = async (hole, holeData) => {
    setCaddieLoading(true); setCaddieMsg(null)
    const myScores = roundId ? pSc(scoreFor?.id, roundId) : []
    const last5 = myScores.filter(s => s.hole < hole.hole).slice(-5)
    const avgPts = last5.length > 0 ? (last5.reduce((s,x) => s + (x.stableford_points || 0), 0) / last5.length).toFixed(1) : null
    const myPos = lb.findIndex(p => p.id === scoreFor?.id) + 1
    const phcp = getPlayingHcp(Math.min(parseFloat(scoreFor?.hcp || 0), 36), course.slope)
    const sg = getStrokesGiven(phcp, hole.hcp)
    const prompt = `Du är caddie på Hooks GK. Ge ${scoreFor?.nickname || 'spelaren'} (HCP ${scoreFor?.hcp}) ett kort taktiskt råd för hål ${hole.hole} (par ${hole.par}, ${hole.meters}m). ${sg > 0 ? 'Har ' + sg + ' extraslag.' : ''} ${avgPts ? 'Senaste formen: ' + avgPts + ' poäng/hål.' : ''} ${myPos > 0 ? 'Ligger ' + myPos + ' av ' + lb.length + '.' : ''} ${hole.hole >= 16 ? 'DUBBLA POÄNG-hål!' : ''}

VIKTIGT: Repetera INTE hålets beskrivning eller banguide. Spelaren ser redan den infon. Ge istället:
1. En specifik taktisk rekommendation (klubbval, strategi)
2. En kort peppande/roastande kommentar i DIO-anda

Max 2-3 meningar. Svenska. Använd spelarens nickname.`
    try {
      const res = await fetch('/api/caddie', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      })
      const data = await res.json()
      setCaddieMsg(data.text || 'Caddien är tyst...')
    } catch (e) { setCaddieMsg('Caddien tappade signalen! Lita på magkänslan.') }
    setCaddieLoading(false)
  }

  const fetchHistoria = async () => { const { data } = await supabase.from('inv_historia').select('*').order('created_at', { ascending: false }); if (data) setHistoria(data) }
  const shotOfDay = scores.some(s => s.strokes > 0)

  const clutchRating = (pid) => {
    let clutchPts = 0, clutchHoles = 0
    ;[1,2,3,4].forEach(rn => {
      const rid = rounds.find(r => r.round_number === rn)?.id
      if (!rid) return
      pSc(pid, rid).forEach(s => { if (s.hole >= 16) { clutchPts += (s.stableford_points || 0); clutchHoles++ } })
    })
    return clutchHoles > 0 ? (clutchPts / clutchHoles).toFixed(1) : null
  }

  const momentum = (pid) => {
    const lastRound = [4,3,2,1].find(rn => pRoundRaw(pid, rn) > 0) || 0
    if (!lastRound || !roundId) return null
    const sc = pSc(pid, rounds.find(r => r.round_number === lastRound)?.id)
    if (!sc || sc.length < 3) return null
    const last5 = sc.slice(-5)
    return (last5.reduce((s, x) => s + (x.stableford_points || 0), 0) / last5.length).toFixed(1)
  }

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
  // Leaderboard: sort by stableford (desc). Tie-breaker: fewer total strokes = better (asc).
  const pTotalStrokes = pid => scores.filter(s => s.player_id === pid && s.strokes).reduce((sum, s) => sum + s.strokes, 0)
  const lb = [...activePlayers].sort((a, b) => {
    const diff = pTotal(b.id) - pTotal(a.id)
    if (diff !== 0) return diff
    // Tie-breaker: fewer strokes wins, but only if both have played
    const aStrokes = pTotalStrokes(a.id), bStrokes = pTotalStrokes(b.id)
    if (aStrokes > 0 && bStrokes > 0) return aStrokes - bStrokes
    return 0
  })
  const sp = specialHoles[selRound] || {}
  const nextHole = course ? course.holes.find(h => !hStr(h.hole))?.hole : null

  const save = async (hole, strokes) => {
    if (!roundId || !scoreFor || !strokes || !supabase) return
    const c = courses[RC[selRound]]
    const hd = c.holes.find(h => h.hole === hole)
    const phcp = getPlayingHcp(Math.min(parseFloat(scoreFor.hcp), 36), c.slope)
    const pts = calcStableford(parseInt(strokes), hd.par, phcp, hd.hcp)
    await supabase.from('inv_scores').upsert({ player_id: scoreFor.id, round_id: roundId, hole, strokes: parseInt(strokes), stableford_points: pts }, { onConflict: 'player_id,round_id,hole' })
    // Sound + shoutout — based on REAL birdie/eagle (strokes vs par), NOT stableford
    const strokesInt = parseInt(strokes)
    const diffToPar = strokesInt - hd.par
    const isRealBirdie = diffToPar === -1
    const isRealEagle = diffToPar === -2
    const isRealAlbatross = diffToPar <= -3
    const isHIO = strokesInt === 1
    if (isRealBirdie || isRealEagle || isRealAlbatross || isHIO) {
      const m = getShoutout(scoreFor.name, scoreFor.nickname, strokesInt, hd.par)
      if (m) { showToast(m.replace('{{hole}}', hole), (isRealEagle || isRealAlbatross || isHIO) ? 'eagle' : 'birdie'); supabase.from('inv_chat').insert({ player_id: scoreFor.id, message: m.replace('{{hole}}', hole), msg_type: 'shoutout' }) }
      // Push notis till alla utom scoraren
      sendPush({
        title: isHIO ? `⛳ HOLE-IN-ONE! ${scoreFor.nickname}` : (isRealEagle || isRealAlbatross) ? `🦅 EAGLE! ${scoreFor.nickname}` : `🐦 BIRDIE! ${scoreFor.nickname}`,
        body: `Hål ${hole} · ${strokesInt} slag (par ${hd.par}) · ${c.name}`,
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

  // === ODDS-BETTING HELPERS ===
  const calcAutoOdds = (player) => {
    if (!player) return 2.0
    const hcp = parseFloat(player.hcp) || 18
    // Base odds: 1 + hcp/10 → Filip 7.5 = 1.75, Martin 40 = 5.0
    let odds = 1 + hcp / 10
    // Form adjustment: senaste 2 rundornas snitt vs HCP-förväntning
    const total = pTotal(player.id)
    const completedHoles = scores.filter(s => s.player_id === player.id && s.strokes).length
    if (completedHoles >= 9) {
      const avgPts = total / completedHoles
      // Förväntat snitt ≈ 1.8-2.0 för normal HCP-prestation
      if (avgPts > 2.2) odds *= 0.8 // I form → lägre odds
      else if (avgPts < 1.5) odds *= 1.3 // Dålig form → högre odds
    }
    return Math.max(1.2, Math.min(8.0, Math.round(odds * 10) / 10))
  }

  const placeWager = async (betId, optionId, amount) => {
    if (!user || amount <= 0) return
    const bet = oddsBets.find(b => b.id === betId)
    if (bet?.locked) { showToast('🔒 Bet är låst för nya insatser', 'zero'); return }
    // Check if player already has wager on this bet
    const existing = oddsWagers.find(w => w.bet_id === betId && w.player_key === user.key)
    if (existing) {
      await supabase.from('inv_odds_wagers').update({ option_id: optionId, amount }).eq('id', existing.id)
    } else {
      await supabase.from('inv_odds_wagers').insert({ bet_id: betId, option_id: optionId, player_key: user.key, amount })
    }
    fetchOdds()
    showToast(`💰 Bet lagt: ${amount} kr`, 'birdie')
  }

  const settleOddsBet = async (bet, winnerOptionId) => {
    const winnerOpt = oddsOptions.find(o => o.id === winnerOptionId)
    if (!winnerOpt) return
    const allWagers = oddsWagers.filter(w => w.bet_id === bet.id)
    // Settle each wager
    for (const w of allWagers) {
      const opt = oddsOptions.find(o => o.id === w.option_id)
      if (!opt) continue
      if (w.option_id === winnerOptionId) {
        // Winner: bank pays out (insats × odds - insats = vinst)
        const payout = Math.round(w.amount * parseFloat(opt.odds))
        const winnings = payout - w.amount // net vinst från bank
        if (bet.banker_key && bet.banker_key !== w.player_key) {
          await supabase.from('inv_expenses').insert({
            paid_by: bet.banker_key, amount: winnings,
            description: `🎲 Odds-vinst: "${bet.question}" (${opt.label} @ ${opt.odds})`,
            tag: 'bet', target_player: w.player_key, split_between: [w.player_key],
            bet_type: 'odds', created_by: user.key
          })
        }
      } else {
        // Loser: insats går till bank
        if (bet.banker_key && bet.banker_key !== w.player_key) {
          await supabase.from('inv_expenses').insert({
            paid_by: w.player_key, amount: w.amount,
            description: `🎲 Odds-förlust: "${bet.question}" (${opt.label})`,
            tag: 'bet', target_player: bet.banker_key, split_between: [bet.banker_key],
            bet_type: 'odds', created_by: user.key
          })
        }
      }
    }
    await supabase.from('inv_odds_bets').update({ status: 'settled', winner_option_id: winnerOptionId }).eq('id', bet.id)
    fetchOdds(); fetchExpenses()
    showToast(`🎲 Bet avgjord: ${winnerOpt.label}!`, 'birdie')
    sendPush({
      title: `🎲 Odds-bet avgjord!`,
      body: `"${bet.question}" → ${winnerOpt.label} vann (${opt.odds}x)`,
      type: 'odds',
      prefKey: 'notif_bets'
    })
  }

  const STANDARD_BETS = [
    { q: 'Vem vinner Le Douche de Golf 2026?', useAllPlayers: true },
    { q: 'Vem gör flest birdies totalt?', useAllPlayers: true },
    { q: 'Vem är Daily Loser Round 1?', useAllPlayers: true },
    { q: 'Vem gör första eagle?', extra: ['Ingen eagle'], useAllPlayers: true },
    { q: 'Vem dricker mest öl?', useAllPlayers: true },
    { q: 'Vem hittar flest bollar i vattnet?', useAllPlayers: true },
  ]

  const createOddsBet = async (question, options, banker = null) => {
    const { data: bet } = await supabase.from('inv_odds_bets').insert({ question, banker_key: banker || null, created_by: user.key }).select().single()
    if (!bet) return
    for (const opt of options) {
      await supabase.from('inv_odds_options').insert({ bet_id: bet.id, label: opt.label, odds: opt.odds, player_key: opt.player_key || null })
    }
    fetchOdds()
    showToast(`🎲 Bet skapad!`, 'birdie')
    sendPush({
      title: `🎲 Ny odds-bet!`,
      body: question,
      type: 'odds',
      excludePlayerId: user.id,
      prefKey: 'notif_bets'
    })
  }

  const createStandardBet = async (template) => {
    const opts = activePlayers.map(p => ({
      label: p.nickname,
      odds: calcAutoOdds(p),
      player_key: p.key
    }))
    if (template.extra) {
      template.extra.forEach(e => opts.push({ label: e, odds: 3.0, player_key: null }))
    }
    await createOddsBet(template.q, opts, user.key) // user är bank by default
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
    const fetchHist = async () => { const { data } = await supabase.from('inv_historia').select('*').order('created_at', { ascending: false }); if (data) setHistoria(data) }
    fetchHist()
    fetch('https://api.open-meteo.com/v1/forecast?latitude=57.72&longitude=14.83&current=temperature_2m,wind_speed_10m,weather_code&timezone=Europe/Stockholm')
      .then(r => r.json()).then(d => {
        const wc = d.current.weather_code
        const icons = {0:'☀️',1:'🌤️',2:'⛅',3:'☁️',45:'🌫️',48:'🌫️',51:'🌦️',53:'🌧️',55:'🌧️',61:'🌧️',63:'🌧️',65:'🌧️',71:'🌨️',73:'🌨️',80:'🌦️',95:'⛈️'}
        const descs = {0:'Klart',1:'Mestadels klart',2:'Halvklart',3:'Mulet',45:'Dimma',48:'Dimma',51:'Lätt duggregn',53:'Duggregn',55:'Regn',61:'Lätt regn',63:'Regn',65:'Kraftigt regn',71:'Lätt snö',73:'Snö',80:'Skurar',95:'Åska'}
        setWeather({ temp: Math.round(d.current.temperature_2m) + '°C', wind: Math.round(d.current.wind_speed_10m) + ' km/h', icon: icons[wc] || '🌤️', desc: descs[wc] || 'Okänt' })
      }).catch(() => {})
  }
  const uploadImg = async file => {
    if (!file || !user || !supabase) return
    const path = `chat/${Date.now()}.${file.name.split('.').pop()}`
    const isVideo = file.type.startsWith('video/')
    const { error } = await supabase.storage.from('inv-images').upload(path, file, { contentType: file.type })
    if (!error) {
      const url = `https://swagnjpgddfakncovglo.supabase.co/storage/v1/object/public/inv-images/${path}`
      await supabase.from('inv_chat').insert({ player_id: user.id, message: isVideo ? '🎬' : '📸', image_url: url, msg_type: isVideo ? 'video' : 'image' })
      fetchChat()
    }
  }

  // ===== LOGIN =====
  // ===== SPLASH SCREEN =====
  // Player intro sequence
  const introPlayers = [
    { name: 'Marcus Ullholm', nick: 'The Spreadsheet', img: 'https://swagnjpgddfakncovglo.supabase.co/storage/v1/object/public/inv-images/players/marcus.jpg', team: 'blue' },
    { name: 'Matthis Jackobson', nick: 'Pro Am', img: 'https://swagnjpgddfakncovglo.supabase.co/storage/v1/object/public/inv-images/players/matthis.jpg', team: 'green' },
    { name: 'Fredrik Hellstenius', nick: 'Old Fashioned', img: 'https://swagnjpgddfakncovglo.supabase.co/storage/v1/object/public/inv-images/players/fredrik.jpg', team: 'blue' },
    { name: 'Magnus Jarlgren', nick: 'Plan B', img: 'https://swagnjpgddfakncovglo.supabase.co/storage/v1/object/public/inv-images/players/magnus.jpg', team: 'blue' },
    { name: 'Filip Hector', nick: 'Long Gone', img: 'https://swagnjpgddfakncovglo.supabase.co/storage/v1/object/public/inv-images/players/filip.jpg', team: 'green' },
    { name: 'Martin Jarlgren', nick: 'Plus One', img: 'https://swagnjpgddfakncovglo.supabase.co/storage/v1/object/public/inv-images/players/martin.jpg', team: 'green' },
  ]

  if (splash) return (
    <div className={`splash-screen ${splashExit ? 'splash-exit' : ''}`}>
      {/* Phase 1: The Reveal (0-3.5s) */}
      <div className="reveal-phase">
        <div className="reveal-line reveal-l1" />
        <div className="reveal-badge">
          <img src="/dio-badge.png" alt="Douche Invitational Only" className="splash-img" />
        </div>
        <div className="reveal-line reveal-l2" />
        <div className="reveal-title">Douche Invitational <em>Only</em></div>
        <div className="reveal-line reveal-l3" />
        <div className="reveal-sub">HOOKS HERRGÅRD · 2026</div>
        <div className="reveal-tagline">Le Douche de Golf</div>
      </div>

      {/* Phase 2: Player Intros (3.5-7.5s) */}
      <div className="intro-phase">
        {introPlayers.map((p, i) => (
          <div key={i} className="intro-card" style={{ animationDelay: `${3.6 + i * 0.65}s` }}>
            <div className="intro-img-ring" style={{ borderColor: p.team === 'green' ? '#22c55e' : '#60a5fa' }}>
              <img src={p.img} alt={p.nick} className="intro-img" />
            </div>
            <div className="intro-nick" style={{ color: p.team === 'green' ? '#22c55e' : '#60a5fa' }}>{p.nick}</div>
            <div className="intro-name">{p.name.split(' ')[0]}</div>
          </div>
        ))}
      </div>

      {/* Phase 3: LET'S DOUCHE on clean screen */}
      <div className="intro-finale">
        <div className="finale-text">LET&apos;S</div>
        <div className="finale-douche">DOUCHE</div>
        <div className="finale-icon"><AugustaBadge size={44}><IconFlag size={22} color="#FAF8F0" /></AugustaBadge></div>
      </div>
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
                style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--card-border)', borderRadius: 10, color: 'var(--cream)', padding: '14px', fontSize: 28, letterSpacing: 16, textAlign: 'center', fontFamily: 'var(--mono)', marginBottom: 8 }} />
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
                style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--card-border)', borderRadius: 10, color: 'var(--cream)', padding: '12px', fontSize: 22, letterSpacing: 12, textAlign: 'center', fontFamily: 'var(--mono)', marginBottom: 10 }} />

              <div style={{ fontSize: 11, color: 'var(--cream-muted)', marginBottom: 4, textAlign: 'left' }}>BEKRÄFTA PIN</div>
              <input type="password" inputMode="numeric" maxLength={4} value={confirmPin}
                onChange={e => { setConfirmPin(e.target.value.replace(/\D/g, '').slice(0,4)); setPinError('') }}
                style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--card-border)', borderRadius: 10, color: 'var(--cream)', padding: '12px', fontSize: 22, letterSpacing: 12, textAlign: 'center', fontFamily: 'var(--mono)', marginBottom: 8 }} />

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
          style={{ marginTop: 16, background: 'var(--surface)', border: '1px solid var(--card-border)', borderRadius: 10, padding: '10px 24px', color: 'var(--cream-muted)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--mono)' }}>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))', background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 1 }}>
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
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--card-border)' }}>
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))', background: 'var(--surface)', borderBottom: '1px solid var(--card-border)' }}>
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

              {/* CADDIE AI */}
              <div style={{ marginBottom: 16 }}>
                {!caddieMsg && !caddieLoading && (
                  <button onClick={() => askCaddie(h, course)} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'linear-gradient(135deg, rgba(27,67,50,0.15), rgba(212,175,55,0.08))', border: '1px solid rgba(212,175,55,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--gold)', fontSize: 13, fontWeight: 500, fontFamily: 'var(--sans)' }}>
                    <AugustaBadge size={24}><IconFlag size={12} color="#FAF8F0" /></AugustaBadge>
                    Fråga Caddien
                  </button>
                )}
                {caddieLoading && (
                  <div style={{ textAlign: 'center', padding: '16px', color: 'var(--gold)', fontSize: 13, fontFamily: 'var(--mono)' }}>
                    <span style={{ animation: 'pulse 1s infinite' }}>Caddien analyserar...</span>
                  </div>
                )}
                {caddieMsg && (
                  <div className="glass-card" style={{ padding: '14px 16px', borderRadius: 12 }}>
                    <div style={{ fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--gold)', letterSpacing: 1.5, marginBottom: 6 }}>CADDIE AI</div>
                    <div style={{ fontSize: 13, color: 'var(--cream-dim)', lineHeight: 1.5 }}>{caddieMsg}</div>
                    <button onClick={() => setCaddieMsg(null)} style={{ background: 'none', border: 'none', color: 'var(--cream-muted)', fontSize: 10, cursor: 'pointer', marginTop: 6, padding: 0 }}>Stäng</button>
                  </div>
                )}
              </div>

              {/* BIG SCORE INPUT */}
              <div className="glass-card" style={{ borderRadius: 16, padding: 24, marginBottom: 16 }}>
                <div style={{ textAlign: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--cream-muted)', letterSpacing: 1 }}>SLAG</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                  <button onClick={() => { if (currentVal > 1) save(h.hole, currentVal - 1) }}
                    style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--surface2)', border: '1px solid var(--card-border)', color: 'var(--cream)', fontSize: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                  <div onClick={() => { if (!strokes) save(h.hole, h.par) }}
                    style={{ width: 80, height: 80, borderRadius: 20, background: strokes ? 'var(--surface2)' : 'rgba(201,168,76,0.1)', border: strokes ? '2px solid var(--card-border)' : '2px solid var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', cursor: strokes ? 'default' : 'pointer' }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 36, fontWeight: 500, color: strokes ? 'var(--cream)' : 'var(--gold)' }}>{strokes || h.par}</div>
                    {!strokes && <div style={{ fontSize: 9, color: 'var(--gold)', marginTop: -4 }}>TRYCK</div>}
                  </div>
                  <button onClick={() => { if (currentVal < 15) save(h.hole, currentVal + 1) }}
                    style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--surface2)', border: '1px solid var(--card-border)', color: 'var(--cream)', fontSize: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
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
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid var(--card-border)' }}>
                      <Av p={p} size={24} />
                      <div style={{ flex: 1, fontSize: 13, color: 'var(--cream-dim)' }}>{p.nickname}</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 14 }}>{s?.strokes || '–'}</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 14, minWidth: 28, textAlign: 'right', color: s?.stableford_points >= 3 ? 'var(--green)' : s?.stableford_points === 0 ? 'var(--coral)' : 'var(--cream-muted)' }}>{s?.stableford_points != null ? s.stableford_points + 'p' : ''}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Ghost Match */}
            {(() => {
              const prevRound = selRound > 1 ? selRound - 1 : null
              if (!prevRound) return null
              const prevRid = rounds.find(r => r.round_number === prevRound)?.id
              if (!prevRid) return null
              const prevScore = pSc(scoreFor?.id, prevRid).find(s => s.hole === activeHole)
              if (!prevScore) return null
              const prevCum = pSc(scoreFor?.id, prevRid).filter(s => s.hole <= activeHole).reduce((s,x) => s + (x.stableford_points || 0), 0)
              const currCum = roundId ? pSc(scoreFor?.id, roundId).filter(s => s.hole <= activeHole).reduce((s,x) => s + (x.stableford_points || 0), 0) : 0
              const cumDiff = currCum - prevCum
              return (
                <div className="glass-card" style={{ borderRadius: 12, padding: 12, marginTop: 8 }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--cream-muted)', letterSpacing: 1, marginBottom: 4 }}>👻 GHOST MATCH vs {RL[prevRound]}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 12, color: 'var(--cream-dim)' }}>Förra rundan: <span style={{ fontFamily: 'var(--mono)', fontWeight: 500 }}>{prevScore.strokes} slag ({prevScore.stableford_points}p)</span></div>
                    <div style={{ fontSize: 14, fontFamily: 'var(--mono)', fontWeight: 600, color: cumDiff > 0 ? 'var(--green)' : cumDiff < 0 ? 'var(--coral)' : 'var(--cream-muted)' }}>
                      {cumDiff > 0 ? '+' : ''}{cumDiff}p tot
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* Bottom nav: prev / next */}
            <div style={{ display: 'flex', gap: 8, padding: '12px 16px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0))', background: 'var(--surface)', borderTop: '1px solid var(--card-border)' }}>
              <button onClick={() => prevHole && (setActiveHole(prevHole), setCaddieMsg(null))} disabled={!prevHole}
                style={{ flex: 1, padding: '14px 0', borderRadius: 12, background: prevHole ? 'var(--surface2)' : 'transparent', border: '1px solid var(--card-border)', color: prevHole ? 'var(--cream)' : 'var(--cream-muted)', fontSize: 14, cursor: prevHole ? 'pointer' : 'default', opacity: prevHole ? 1 : 0.3 }}>← Hål {prevHole || ''}</button>
              <button onClick={() => nextH ? (setActiveHole(nextH), setCaddieMsg(null)) : setActiveHole(null)}
                style={{ flex: 1, padding: '14px 0', borderRadius: 12, background: 'var(--gold)', border: 'none', color: '#0A0A08', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>{nextH ? `Hål ${nextH} →` : '✓ Klar'}</button>
            </div>
          </div>
        )
      })()}

      {/* ===== DYNAMIC ISLAND PILL STATUS BAR ===== */}
      <div className="status-bar" style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        <div className="island-pill" style={{
          display: 'flex', alignItems: 'center', gap: 8, flex: 1,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 24, padding: '6px 12px', margin: '0 8px',
          border: '1px solid rgba(212,175,55,0.15)',
        }}>
          <span className="live-dot" /><Av p={user} size={20} /><span style={{ fontSize: 12, fontWeight: 500, color: '#FAF8F0' }}>{user.nickname}</span>
          {isAdmin && <Badge text="ADM" color="var(--gold)" bg="rgba(201,168,76,0.15)" />}
          {(() => {
            // Only show leader pill if someone actually has points. Use tie-breaker on total strokes (fewer = better).
            const leader = lb.find(p => pTotal(p.id) > 0)
            if (!leader) return null
            const leaderPts = pTotal(leader.id)
            const isMe = leader.id === user.id
            return (
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '2px 8px', background: isMe ? 'rgba(201,168,76,0.25)' : 'rgba(27,67,50,0.6)', borderRadius: 12, border: isMe ? '1px solid var(--gold-bright)' : '1px solid rgba(212,175,55,0.2)' }}>
                <span style={{ fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--gold)', letterSpacing: 1 }}>{isMe ? '👑 DU' : 'LEADER'}</span>
                {!isMe && <span style={{ fontSize: 11, fontWeight: 600, color: '#FAF8F0' }}>{leader.nickname?.substring(0,6)}</span>}
                <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--green)' }}>{leaderPts}p</span>
              </div>
            )
          })()}
          <div style={{ marginLeft: lb.length > 0 ? 6 : 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
            <button onClick={() => setDarkMode(d => !d)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', lineHeight: 1, color: '#FAF8F0', display: 'flex' }}>{darkMode ? <IconSun size={16} /> : <IconMoon size={16} />}</button>
            <button onClick={() => { setShowNotifs(!showNotifs); setUnread(0); navigator?.clearAppBadge?.().catch(() => {}) }} style={{ background: 'none', border: 'none', color: unread > 0 ? 'var(--gold-bright)' : 'rgba(250,248,240,0.4)', cursor: 'pointer', position: 'relative', padding: '4px', display: 'flex' }}>
              <IconBell size={16} />
              {unread > 0 && <span style={{ position: 'absolute', top: 0, right: 0, background: 'var(--coral)', color: '#fff', fontSize: 7, fontWeight: 600, borderRadius: '50%', width: 12, height: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unread > 9 ? '9+' : unread}</span>}
            </button>
          </div>
        </div>
        <button onClick={() => { setUser(null); localStorage?.removeItem('inv_user') }} style={{ background: 'none', border: 'none', color: 'var(--cream-muted)', fontSize: 9, cursor: 'pointer', padding: '4px 4px 4px 0' }}>Byt</button>
      </div>

      {/* Notification Center Panel */}
      {showNotifs && (
        <div style={{ position: 'fixed', top: 'calc(50px + env(safe-area-inset-top, 0px))', right: 8, width: 'calc(100vw - 16px)', maxWidth: 340, maxHeight: '60vh', background: 'var(--surface)', border: '1px solid var(--card-border)', borderRadius: 14, zIndex: 250, overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--gold)', letterSpacing: 1 }}>NOTISER</span>
            {notifications.length > 0 && <button onClick={() => setNotifications([])} style={{ background: 'none', border: 'none', color: 'var(--cream-muted)', fontSize: 10, cursor: 'pointer' }}>Rensa</button>}
          </div>
          {notifications.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: 'var(--cream-muted)', fontSize: 12 }}>Inga notiser än</div>}
          {notifications.map(n => (
            <div key={n.id} style={{ padding: '8px 14px', borderBottom: '1px solid var(--card-border)', borderLeft: `3px solid ${n.type === 'eagle' ? 'var(--gold-bright)' : n.type === 'birdie' ? 'var(--green)' : n.type === 'zero' ? 'var(--coral)' : 'var(--cream-muted)'}` }}>
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
                    <div className="lb-name" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>{p.name}
                      {(() => { const vals = [1,2,3,4].map(rn => pRoundRaw(p.id, rn)).filter(v => v > 0); return vals.length >= 2 ? <Sparkline values={vals} width={44} height={12} color="var(--gold)" /> : null })()}
                    </div>
                    <div className="lb-hcp">{p.nickname} · {p.hcp}
                      {(() => { const totalStr = scores.filter(s => s.player_id === p.id && s.strokes > 0).reduce((sum, s) => sum + s.strokes, 0); return totalStr > 0 ? <span style={{ marginLeft: 4, fontSize: 9, color: 'var(--cream-muted)' }}>· {totalStr} slag</span> : null })()}
                      {bonus !== 0 && <span style={{ marginLeft: 4, fontSize: 10, color: bonus > 0 ? 'var(--green)' : 'var(--coral)' }}>{bonus > 0 ? '+' : ''}{bonus} streak</span>}
                      {momentum(p.id) && (() => {
                        const m = parseFloat(momentum(p.id))
                        const color = m >= 2.5 ? '#22c55e' : m >= 1.5 ? '#D4AF37' : '#E8634A'
                        return <span style={{ marginLeft: 6, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <span style={{ display: 'inline-flex', gap: 1 }}>{[1,2,3,4,5].map(b => <span key={b} style={{ width: 3, height: b <= Math.round(m * 2) ? 8 + b : 4, background: b <= Math.round(m * 2) ? color : 'var(--card-border)', borderRadius: 1, transition: 'height 0.3s' }} />)}</span>
                          <span style={{ fontSize: 9, color, fontFamily: 'var(--mono)' }}>{momentum(p.id)}</span>
                        </span>
                      })()}
                    </div>
                  </div>
                  <div className="lb-total">{tot || '-'}</div>
                </div>
              )
            })}
          </div>
          {/* Compact round table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: 'var(--mono)', marginTop: 12 }}>
            <thead><tr style={{ color: 'var(--cream-muted)', borderBottom: '1px solid var(--card-border)' }}>
              <th style={{ textAlign: 'left', padding: '6px 4px', fontWeight: 400 }}></th>
              {[1,2,3,4].map(r => <th key={r} style={{ padding: '6px 2px', fontWeight: 400, fontSize: 9 }}>{RL[r]}</th>)}
              <th style={{ padding: '6px 4px', fontWeight: 500 }}>Tot</th>
              <th style={{ padding: '6px 4px', color: 'var(--cream-muted)', fontSize: 8 }}>Slag</th>
              <th style={{ padding: '6px 4px', color: 'var(--coral)' }}>💀</th>
            </tr></thead>
            <tbody>{lb.map(p => {
              const totalStr = scores.filter(s => s.player_id === p.id && s.strokes > 0).reduce((sum, s) => sum + s.strokes, 0)
              return (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--card-border)' }}>
                <td style={{ padding: '5px 4px', color: 'var(--cream-dim)' }}>{p.name.split(' ')[0]}</td>
                {[1,2,3,4].map(r => <td key={r} style={{ textAlign: 'center', padding: '5px 2px', color: 'var(--cream-muted)' }}>{pRoundRaw(p.id, r) || '-'}</td>)}
                <td style={{ textAlign: 'center', padding: '5px 4px', fontWeight: 500, color: 'var(--gold-bright)' }}>{pTotal(p.id) || '-'}</td>
                <td style={{ textAlign: 'center', padding: '5px 4px', color: 'var(--cream-muted)', fontSize: 10 }}>{totalStr || '-'}</td>
                <td style={{ textAlign: 'center', padding: '5px 4px', color: zeros(p.id) > 5 ? 'var(--coral)' : 'var(--cream-muted)' }}>{zeros(p.id) || '-'}</td>
              </tr>
            )})}</tbody>
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
                <div className="glass-card" style={{ borderRadius: 12, padding: 14, marginBottom: 14, textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--gold)', letterSpacing: 2 }}>COUNTDOWN TILL FÖRSTA TEE</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 28, color: 'var(--cream)', fontWeight: 500, marginTop: 4 }}>{d}d {h}h</div>
                </div>
              )
            }
            return null
          })()}

          {/* Weather */}
          {weather && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 10, padding: '8px 12px', background: 'var(--surface)', borderRadius: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 24 }}>{weather.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--cream)' }}>{weather.temp} · {weather.desc}</div>
                <div style={{ fontSize: 10, color: 'var(--cream-muted)', fontFamily: 'var(--mono)' }}>Vind: {weather.wind} · Hooks GK</div>
              </div>
            </div>
          )}

          {/* Live Activity Feed */}
          {(() => {
            const recentScores = []
            activePlayers.forEach(p => {
              const lastRound = [4,3,2,1].find(rn => pRoundRaw(p.id, rn) > 0)
              if (lastRound) {
                const rid = rounds.find(r => r.round_number === lastRound)?.id
                const sc = rid ? pSc(p.id, rid) : []
                sc.slice(-3).forEach(s => {
                  if (s.stableford_points >= 3) recentScores.push({ player: p, pts: s.stableford_points, hole: s.hole })
                  else if (s.stableford_points === 0) recentScores.push({ player: p, pts: 0, hole: s.hole })
                })
              }
            })
            if (recentScores.length === 0) return null
            return (
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '8px 0', marginBottom: 10, scrollbarWidth: 'none' }}>
                {recentScores.sort((a,b) => b.pts - a.pts).slice(0, 4).map((s, i) => (
                  <div key={i} style={{ flexShrink: 0, padding: '6px 10px', borderRadius: 10, fontSize: 11, fontFamily: 'var(--mono)',
                    background: s.pts >= 4 ? 'rgba(212,175,55,0.12)' : s.pts >= 3 ? 'rgba(34,197,94,0.1)' : 'rgba(232,99,74,0.1)',
                    color: s.pts >= 4 ? 'var(--gold)' : s.pts >= 3 ? 'var(--green)' : 'var(--coral)',
                    border: '0.5px solid ' + (s.pts >= 4 ? 'rgba(212,175,55,0.2)' : s.pts >= 3 ? 'rgba(34,197,94,0.15)' : 'rgba(232,99,74,0.15)'),
                    whiteSpace: 'nowrap'
                  }}>
                    {s.pts >= 4 ? '🦅' : s.pts >= 3 ? '🐦' : '💀'} {s.player.nickname} H{s.hole}
                  </div>
                ))}
              </div>
            )
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
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--card-border)' }}>
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
                  <select id="h2h-add-p1" style={{ flex: 1, background: 'var(--surface2)', border: '1px solid var(--card-border)', borderRadius: 8, color: 'var(--cream)', padding: '6px', fontSize: 11 }}>
                    <option value="">Spelare 1</option>
                    {activePlayers.map(p => <option key={p.key} value={p.key}>{p.nickname}</option>)}
                  </select>
                  <select id="h2h-add-p2" style={{ flex: 1, background: 'var(--surface2)', border: '1px solid var(--card-border)', borderRadius: 8, color: 'var(--cream)', padding: '6px', fontSize: 11 }}>
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
            <button onClick={() => setAdminPid(null)} style={{ fontSize: 9, padding: '3px 7px', border: !adminPid ? '1px solid var(--gold)' : '1px solid var(--card-border)', background: !adminPid ? 'rgba(201,168,76,0.1)' : 'transparent', color: !adminPid ? 'var(--gold)' : 'var(--cream-muted)', borderRadius: 5, cursor: 'pointer', fontFamily: 'var(--mono)' }}>Mig</button>
            {players.filter(p => p.id !== user.id).map(p => (
              <button key={p.id} onClick={() => setAdminPid(p.id)} style={{ fontSize: 9, padding: '3px 7px', border: adminPid === p.id ? '1px solid var(--gold)' : '1px solid var(--card-border)', background: adminPid === p.id ? 'rgba(201,168,76,0.1)' : 'transparent', color: adminPid === p.id ? 'var(--gold)' : 'var(--cream-muted)', borderRadius: 5, cursor: 'pointer', fontFamily: 'var(--mono)' }}>{p.name.split(' ')[0]}</button>
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
                      <button onClick={() => { if (currentVal > 1) save(h.hole, currentVal - 1) }} style={{ width: 28, height: 36, background: 'var(--surface2)', border: '1px solid var(--card-border)', borderRadius: '8px 0 0 8px', color: 'var(--cream)', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                      <div onClick={() => { if (!strokes) save(h.hole, h.par) }} style={{ width: 36, height: 36, background: strokes ? 'var(--surface3)' : 'var(--surface2)', border: '1px solid var(--card-border)', borderLeft: 'none', borderRight: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 500, color: strokes ? 'var(--cream)' : 'var(--cream-muted)', cursor: strokes ? 'default' : 'pointer' }}>
                        {strokes || h.par}
                      </div>
                      <button onClick={() => { if (currentVal < 15) save(h.hole, currentVal + 1) }} style={{ width: 28, height: 36, background: 'var(--surface2)', border: '1px solid var(--card-border)', borderRadius: '0 8px 8px 0', color: 'var(--cream)', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
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
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--card-border)' }}>
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
                    <div className="team-title" style={{ color: c }}>{team === 'green' ? 'Jägermeister' : 'Fernet'}</div>
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
        {view === 'inbox' && (<>
          <div className="section-title">Inkorg</div>
          <div className="section-sub">Utmaningar, omnämnanden & reaktioner</div>
          {(() => {
            const myId = user?.id
            const myNick = user?.nickname || ''
            const myFirst = user?.name?.split(' ')[0]?.toLowerCase() || ''
            const items = []
            chat.filter(m => m.msg_type === 'bounty' && m.message?.includes(myNick) && m.player_id !== myId)
              .forEach(m => items.push({ type: 'bounty', msg: m, label: 'UTMANING', icon: '⚔️', color: 'var(--coral)' }))
            chat.filter(m => m.player_id !== myId && m.msg_type === 'chat' && myFirst && m.message?.toLowerCase().includes('@' + myFirst))
              .forEach(m => items.push({ type: 'mention', msg: m, label: 'OMNÄMND', icon: '💬', color: 'var(--gold)' }))
            chat.filter(m => m.player_id === myId && m.reactions && Object.keys(typeof m.reactions === 'string' ? JSON.parse(m.reactions) : m.reactions).length > 0)
              .forEach(m => {
                const rxns = typeof m.reactions === 'string' ? JSON.parse(m.reactions) : m.reactions
                const total = Object.values(rxns).reduce((s, arr) => s + arr.length, 0)
                items.push({ type: 'reaction', msg: m, label: total + ' REAKTIONER', icon: '🔥', color: 'var(--green)' })
              })
            items.sort((a, b) => new Date(b.msg.created_at) - new Date(a.msg.created_at))
            if (items.length === 0) return <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 40, textAlign: 'center', color: 'var(--cream-muted)' }}>Inget nytt! Inga utmaningar eller omnämnanden.</div>
            return items.slice(0, 20).map((item, i) => {
              const sender = activePlayers.find(p => p.id === item.msg.player_id) || {}
              return (
                <div key={i} onClick={() => { if (item.type !== 'reaction') setView('feed') }}
                  style={{ display: 'flex', gap: 10, padding: '12px 14px', background: 'var(--surface)', borderRadius: 10, marginBottom: 6, cursor: 'pointer', border: '1px solid var(--card-border)' }}>
                  <div style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: item.color, letterSpacing: 0.5, fontWeight: 600 }}>{item.label}</span>
                      <span style={{ fontSize: 10, color: 'var(--cream-muted)', marginLeft: 'auto' }}>{new Date(item.msg.created_at).toLocaleString('sv-SE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Av p={sender} size={16} />
                      <span style={{ fontSize: 11, color: 'var(--cream-dim)' }}>{sender.nickname || '?'}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--cream-muted)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.msg.message}</div>
                  </div>
                </div>
              )
            })
          })()}
        </>)}

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
                <div key={m.id || i} style={{ marginBottom: 6, padding: '8px 10px', background: sys ? 'var(--surface2)' : 'var(--surface2)', borderRadius: 10, borderLeft: `3px solid ${brd}`, position: 'relative' }}>
                  {!sys && <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                    <Av p={m.inv_players || { name: '?', team: 'green' }} size={18} />
                    <span style={{ fontSize: 11, fontWeight: 500, color: me ? 'var(--gold)' : 'var(--cream-dim)' }}>{m.inv_players?.nickname || '?'}</span>
                    {canDel && m.id && !String(m.id).startsWith('tmp') && (
                      <button onClick={async () => { await supabase.from('inv_chat').delete().eq('id', m.id); fetchChat() }} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--cream-muted)', fontSize: 10, cursor: 'pointer', opacity: 0.5 }}>✕</button>
                    )}
                  </div>}
                  {/* Reaction emojis */}
                  {!sys && m.id && !String(m.id).startsWith('tmp') && (
                    <div style={{ display: 'flex', gap: 2, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                      {['🔥','😂','👏','💀','🗑️'].map(emoji => {
                        const rxns = m.reactions ? (typeof m.reactions === 'string' ? JSON.parse(m.reactions) : m.reactions) : {}
                        const users = rxns[emoji] || []
                        const myR = users.includes(user?.key)
                        return (
                          <button key={emoji} onClick={async () => {
                            const curr = m.reactions ? (typeof m.reactions === 'string' ? JSON.parse(m.reactions) : m.reactions) : {}
                            const list = curr[emoji] || []
                            if (list.includes(user?.key)) { curr[emoji] = list.filter(k => k !== user.key) }
                            else { curr[emoji] = [...list, user.key] }
                            if (curr[emoji].length === 0) delete curr[emoji]
                            await supabase.from('inv_chat').update({ reactions: curr }).eq('id', m.id)
                            fetchChat()
                          }} style={{
                            background: myR ? 'rgba(212,175,55,0.12)' : 'transparent',
                            border: myR ? '1px solid var(--gold-dim)' : '1px solid transparent',
                            borderRadius: 6, padding: '1px 4px', cursor: 'pointer', fontSize: 12,
                            display: 'flex', alignItems: 'center', gap: 2,
                          }}>
                            {emoji}{users.length > 0 && <span style={{ fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--cream-muted)' }}>{users.length}</span>}
                          </button>
                        )
                      })}
                    </div>
                  )}
                  <div style={{ fontSize: 13, lineHeight: 1.5, color: sys ? 'var(--cream-dim)' : 'var(--cream)' }}>{renderMsg(m.message)}</div>
                  {m.image_url && (m.msg_type === 'video' ? <video src={m.image_url} controls playsInline style={{ maxWidth: '100%', borderRadius: 8, marginTop: 6 }} /> : <img src={m.image_url} alt="" style={{ maxWidth: '100%', borderRadius: 8, marginTop: 6 }} loading="lazy" />)}
                  <div style={{ fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--cream-muted)', marginTop: 3 }}>{new Date(m.created_at).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              )
            })}
            <div ref={chatEnd} />
          </div>
          {/* Shot of the Day */}
          {shotOfDay && (
            <div style={{ background: 'linear-gradient(135deg, rgba(27,67,50,0.12), rgba(212,175,55,0.06))', borderRadius: 12, padding: 14, marginBottom: 12, border: '1px solid rgba(212,175,55,0.15)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--gold)', letterSpacing: 1.5, marginBottom: 6 }}>SHOT OF THE DAY</div>
              <div style={{ fontSize: 13, color: 'var(--cream-dim)', marginBottom: 10 }}>Vem slog helgens bästa slag?</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {activePlayers.map(p => {
                  const votes = (shotVotes[p.key] || 0)
                  const voted = shotVotes._myVote === p.key
                  return (
                    <button key={p.key} onClick={async () => {
                      if (shotVotes._myVote) return
                      setShotVotes(v => ({ ...v, [p.key]: (v[p.key] || 0) + 1, _myVote: p.key }))
                      await supabase.from('inv_chat').insert({ player_id: user.id, message: 'SOTD:' + p.key, msg_type: 'vote' })
                      showToast('Röst registrerad!', 'birdie')
                    }} style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 8,
                      cursor: voted || shotVotes._myVote ? 'default' : 'pointer',
                      background: voted ? 'rgba(212,175,55,0.15)' : 'var(--surface)',
                      border: voted ? '1px solid var(--gold-dim)' : '1px solid var(--card-border)',
                      opacity: shotVotes._myVote && !voted ? 0.5 : 1,
                    }}>
                      <Av p={p} size={20} />
                      <span style={{ fontSize: 11, color: voted ? 'var(--gold)' : 'var(--cream-dim)' }}>{p.nickname}</span>
                      {votes > 0 && <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--gold)', marginLeft: 2 }}>{votes}</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

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
                  <button key={p.id} onClick={() => setChatMsg(chatMsg.replace(/@\w*$/, `@${p.name.split(' ')[0]} `))} style={{ fontSize: 11, padding: '4px 8px', background: 'var(--surface)', border: '1px solid var(--card-border)', borderRadius: 6, color: 'var(--cream)', cursor: 'pointer' }}>@{p.name.split(' ')[0]}</button>
                ))}
              </div>
            )
          })()}
          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            <label style={{ background: 'var(--surface)', border: '1px solid var(--card-border)', borderRadius: 10, padding: '10px 12px', cursor: 'pointer', fontSize: 16 }}>
              📷<input ref={fileRef} type="file" accept="image/*,video/*" capture="environment" style={{ display: 'none' }} onChange={e => { if(e.target.files[0]) uploadImg(e.target.files[0]) }} />
            </label>
            <input value={chatMsg} onChange={e => setChatMsg(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') sendMsg() }}
              placeholder="Skriv något... @namn för att tagga" style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--card-border)', color: 'var(--cream)', padding: '10px 14px', borderRadius: 10, fontSize: 14, fontFamily: 'var(--sans)', outline: 'none' }} />
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
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--card-border)' }}>
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
                    <div key={rn} style={{ padding: '8px 0', borderBottom: '1px solid var(--card-border)' }}>
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
              <a key={i} href={pl.url} target="_blank" rel="noopener noreferrer" style={{ background: 'var(--surface)', borderRadius: 12, padding: '14px 12px', textDecoration: 'none', color: 'inherit', border: '1px solid var(--card-border)' }}>
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
              <a key={p.id} href={song.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--card-border)', textDecoration: 'none', color: 'inherit', alignItems: 'center' }}>
                <Av p={p} size={32} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{p.name.split(' ')[0]}</div>
                  <div style={{ fontSize: 11, color: 'var(--cream-muted)' }}>{song.song} – {song.artist}</div>
                </div>
                <div style={{ background: '#1DB954', borderRadius: 20, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 12, color: '#fff', fontWeight: 600 }}>▶</span>
                  <span style={{ fontSize: 9, color: '#fff', fontFamily: 'var(--mono)' }}>PLAY</span>
                </div>
              </a>
            ) : null
          })}

          {/* Venue Mode */}
          <div style={{ marginTop: 20, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--gold)', letterSpacing: 2, marginBottom: 8 }}>HOOKS HERRGÅRD</div>
          <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 14, marginBottom: 16 }}>
            {[
              { icon: '📶', label: 'WiFi', value: 'HooksGuest / hooks2026' },
              { icon: '🍽️', label: 'Frukost', value: '07:00–09:30 i matsalen' },
              { icon: '🧖', label: 'Spa', value: '08:00–21:00 (handduk i rummet)' },
              { icon: '🍺', label: 'Baren', value: '15:00–sent (tab på rummet)' },
              { icon: '🚗', label: 'Taxi Tranås', value: '0140-163 00' },
              { icon: '📍', label: 'Adress', value: 'Hooks Herrgård, 573 94 Hok' },
              { icon: '🏌️', label: 'Pro Shop', value: '08:00–18:00 (bollar, handskar)' },
              { icon: '🚑', label: 'Nödnummer', value: '112 / Hooks reception: 0393-210 00' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < 7 ? '1px solid var(--card-border)' : 'none' }}>
                <span style={{ fontSize: 16, width: 24, textAlign: 'center' }}>{item.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'var(--cream-muted)', fontFamily: 'var(--mono)' }}>{item.label}</div>
                  <div style={{ fontSize: 13, color: 'var(--cream-dim)' }}>{item.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Venue images */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginBottom: 20 }}>
            {venueImages.map((v, i) => (
              <div key={i} style={{ borderRadius: 10, overflow: 'hidden', position: 'relative', aspectRatio: '4/3' }}>
                <img src={v.url} alt={v.caption} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.6))', padding: '12px 8px 6px' }}>
                  <span style={{ fontSize: 10, color: '#fff' }}>{v.caption}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Players with roasts */}
          <div style={{ marginTop: 20, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--gold)', letterSpacing: 2, marginBottom: 8 }}>SPELARNA</div>
          {players.map(p => (
            <div key={p.id} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--card-border)' }}>
              <Av p={p} size={40} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{p.name} <span style={{ fontSize: 11, color: p.team === 'green' ? 'var(--green)' : 'var(--blue)', fontFamily: 'var(--mono)' }}>{p.hcp}</span></div>
                <div style={{ fontSize: 11, color: 'var(--cream-muted)' }}>{p.nickname} · {p.team === 'green' ? 'Jägermeister' : 'Fernet'}</div>
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
              <div key={i} style={{ display: 'flex', gap: 8, padding: '5px 0', borderBottom: i < 6 ? '1px solid var(--card-border)' : 'none' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: r.c, minWidth: 90 }}>{r.k}</span>
                <span style={{ fontSize: 12, color: 'var(--cream-dim)' }}>{r.v}</span>
              </div>
            ))}
          </div>
        </>)}
        {/* ===== PHOTO GALLERY ===== */}
        {view === 'historia' && (<>
          <div className="section-title">Douche Historia</div>
          <div className="section-sub">Legender, minnen & skamliga ögonblick</div>

          {/* BULK UPLOAD UI */}
          <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 14, marginBottom: 16 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--gold)', letterSpacing: 1.5, marginBottom: 8 }}>
              LÄGG TILL MINNEN {historiaQueue.length > 0 && <span style={{ color: 'var(--cream-muted)' }}>· {historiaQueue.length} i kö</span>}
            </div>

            {/* Quick single text entry */}
            {historiaQueue.length === 0 && (<>
              <input value={historiaCaption || ''} onChange={e => setHistoriaCaption(e.target.value)} placeholder="Skriv ett minne eller händelse..." style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--card-border)', color: 'var(--cream)', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 8, fontFamily: 'var(--sans)', outline: 'none', boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', gap: 6 }}>
                <select value={historiaYear || '2025'} onChange={e => setHistoriaYear(e.target.value)} style={{ background: 'var(--surface2)', border: '1px solid var(--card-border)', color: 'var(--cream)', padding: '8px 10px', borderRadius: 8, fontSize: 12 }}>
                  <option value="2025">Pre-DIO 2025</option><option value="2024">2024</option><option value="2023">2023</option><option value="2022">2022</option><option value="2021">2021</option><option value="earlier">Längesen</option>
                </select>
                <label style={{ flex: 1, background: 'var(--surface2)', border: '1px dashed var(--gold-dim)', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontSize: 12, color: 'var(--gold)', textAlign: 'center' }}>
                  📷 Välj bilder/videos (flera)
                  <input type="file" accept="image/*,video/*" multiple style={{ display: 'none' }} onChange={e => {
                    const files = Array.from(e.target.files)
                    if (!files.length) return
                    const items = files.map((f, i) => ({
                      id: Date.now() + '-' + i,
                      file: f,
                      preview: URL.createObjectURL(f),
                      caption: historiaCaption || '',
                      year: historiaYear || '2025',
                      status: 'pending'
                    }))
                    setHistoriaQueue(items)
                    e.target.value = '' // Allow re-selecting same files
                  }} />
                </label>
                {historiaCaption && <button onClick={async () => {
                  await supabase.from('inv_historia').insert({ player_id: user.id, caption: historiaCaption, year: historiaYear || '2025', media_url: null, media_type: 'text' })
                  setHistoriaCaption(''); fetchHistoria()
                  showToast('Minne tillagt!', 'birdie')
                }} style={{ background: 'var(--gold)', color: '#0A0A08', border: 'none', borderRadius: 8, padding: '8px 14px', fontWeight: 600, cursor: 'pointer', fontSize: 12 }}>💾 Spara text</button>}
              </div>
            </>)}

            {/* QUEUE EDITOR - when files are selected */}
            {historiaQueue.length > 0 && (<>
              {/* Bulk actions bar */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10, color: 'var(--cream-muted)', fontFamily: 'var(--mono)' }}>GEMENSAMT:</span>
                <select value={historiaYear} onChange={e => {
                  setHistoriaYear(e.target.value)
                  setHistoriaQueue(q => q.map(item => ({ ...item, year: e.target.value })))
                }} style={{ background: 'var(--surface2)', border: '1px solid var(--card-border)', color: 'var(--cream)', padding: '6px 10px', borderRadius: 8, fontSize: 11 }}>
                  <option value="2025">2025</option><option value="2024">2024</option><option value="2023">2023</option><option value="2022">2022</option><option value="2021">2021</option><option value="earlier">Längesen</option>
                </select>
                <input placeholder="Caption för alla (valfritt)" value={historiaCaption} onChange={e => {
                  setHistoriaCaption(e.target.value)
                  setHistoriaQueue(q => q.map(item => item.caption ? item : { ...item, caption: e.target.value }))
                }} style={{ flex: 1, minWidth: 150, background: 'var(--surface2)', border: '1px solid var(--card-border)', color: 'var(--cream)', padding: '6px 10px', borderRadius: 8, fontSize: 11 }} />
                <button onClick={() => { setHistoriaQueue(q => q.map(item => ({ ...item, caption: historiaCaption }))); showToast('Caption satt på alla', 'birdie') }} style={{ background: 'var(--surface2)', border: '1px solid var(--card-border)', color: 'var(--cream-muted)', padding: '6px 10px', borderRadius: 8, fontSize: 10, cursor: 'pointer' }}>↓ Alla</button>
              </div>

              {/* File queue with per-item edit */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8, marginBottom: 12 }}>
                {historiaQueue.map((item, idx) => (
                  <div key={item.id} style={{ background: 'var(--surface2)', borderRadius: 10, overflow: 'hidden', border: item.status === 'done' ? '1px solid var(--green)' : item.status === 'error' ? '1px solid var(--coral)' : '1px solid var(--card-border)', position: 'relative' }}>
                    {item.file.type.startsWith('video/') ? (
                      <video src={item.preview} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} muted />
                    ) : (
                      <img src={item.preview} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
                    )}
                    {item.status === 'uploading' && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', fontSize: 11 }}>⏳ Laddar...</div>}
                    {item.status === 'done' && <div style={{ position: 'absolute', top: 4, right: 4, background: 'var(--green)', color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</div>}
                    {item.status === 'error' && <div style={{ position: 'absolute', top: 4, right: 4, background: 'var(--coral)', color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✕</div>}
                    <div style={{ padding: 6 }}>
                      <input value={item.caption} onChange={e => setHistoriaQueue(q => q.map(x => x.id === item.id ? { ...x, caption: e.target.value } : x))} placeholder="Caption..." style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--card-border)', color: 'var(--cream)', padding: '4px 6px', borderRadius: 4, fontSize: 10, marginBottom: 4, boxSizing: 'border-box' }} />
                      <div style={{ display: 'flex', gap: 4 }}>
                        <select value={item.year} onChange={e => setHistoriaQueue(q => q.map(x => x.id === item.id ? { ...x, year: e.target.value } : x))} style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--card-border)', color: 'var(--cream-muted)', padding: '3px', borderRadius: 4, fontSize: 9 }}>
                          <option value="2025">2025</option><option value="2024">2024</option><option value="2023">2023</option><option value="2022">2022</option><option value="2021">2021</option><option value="earlier">Längesen</option>
                        </select>
                        <button onClick={() => { URL.revokeObjectURL(item.preview); setHistoriaQueue(q => q.filter(x => x.id !== item.id)) }} style={{ background: 'transparent', border: '1px solid var(--card-border)', color: 'var(--coral)', fontSize: 10, padding: '2px 6px', borderRadius: 4, cursor: 'pointer' }}>✕</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => {
                  historiaQueue.forEach(item => URL.revokeObjectURL(item.preview))
                  setHistoriaQueue([]); setHistoriaCaption('')
                }} disabled={historiaUploading} style={{ flex: 1, background: 'var(--surface2)', border: '1px solid var(--card-border)', color: 'var(--cream-muted)', padding: '10px', borderRadius: 8, fontSize: 12, cursor: historiaUploading ? 'default' : 'pointer', opacity: historiaUploading ? 0.5 : 1 }}>Avbryt</button>
                <button onClick={async () => {
                  if (historiaUploading) return
                  setHistoriaUploading(true)
                  let success = 0, fail = 0
                  // Upload in parallel for speed (3 at a time)
                  const uploadOne = async (item) => {
                    setHistoriaQueue(q => q.map(x => x.id === item.id ? { ...x, status: 'uploading' } : x))
                    try {
                      const ext = item.file.name.split('.').pop()?.toLowerCase() || 'jpg'
                      const path = 'historia/' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.' + ext
                      const { error: upErr } = await supabase.storage.from('inv-images').upload(path, item.file, { contentType: item.file.type, upsert: false })
                      if (upErr) throw upErr
                      const url = supabase.storage.from('inv-images').getPublicUrl(path).data.publicUrl
                      const { error: dbErr } = await supabase.from('inv_historia').insert({
                        player_id: user.id, caption: item.caption || '', year: item.year || '2025',
                        media_url: url, media_type: item.file.type.startsWith('video/') ? 'video' : 'image'
                      })
                      if (dbErr) throw dbErr
                      setHistoriaQueue(q => q.map(x => x.id === item.id ? { ...x, status: 'done' } : x))
                      success++
                    } catch (e) {
                      console.error('Upload failed:', e)
                      setHistoriaQueue(q => q.map(x => x.id === item.id ? { ...x, status: 'error' } : x))
                      fail++
                    }
                  }
                  // Chunked parallel upload (3 concurrent)
                  const chunks = []
                  for (let i = 0; i < historiaQueue.length; i += 3) chunks.push(historiaQueue.slice(i, i + 3))
                  for (const chunk of chunks) await Promise.all(chunk.map(uploadOne))
                  await fetchHistoria()
                  showToast(`✅ ${success} tillagda${fail > 0 ? ` · ${fail} misslyckades` : ''}`, fail > 0 ? 'zero' : 'birdie')
                  // Clean up successful items, keep failed for retry
                  setTimeout(() => {
                    setHistoriaQueue(q => {
                      q.filter(x => x.status === 'done').forEach(x => URL.revokeObjectURL(x.preview))
                      return q.filter(x => x.status !== 'done')
                    })
                    setHistoriaUploading(false)
                    if (fail === 0) setHistoriaCaption('')
                  }, 1500)
                }} disabled={historiaUploading || historiaQueue.length === 0} style={{ flex: 2, background: historiaUploading ? 'var(--surface2)' : 'var(--gold)', color: historiaUploading ? 'var(--cream-muted)' : '#0A0A08', border: 'none', borderRadius: 8, padding: '10px', fontSize: 13, fontWeight: 600, cursor: historiaUploading ? 'default' : 'pointer' }}>
                  {historiaUploading ? '⏳ Laddar upp...' : `📤 Ladda upp ${historiaQueue.length} minnen`}
                </button>
              </div>
            </>)}
          </div>
          {(() => {
            const years = [...new Set((historia || []).map(h => h.year))].sort((a,b) => b.localeCompare(a))
            if (years.length === 0) return <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 40, textAlign: 'center', color: 'var(--cream-muted)' }}>Inga minnen ännu. Var den första att lägga till!</div>
            return years.map(year => (
              <div key={year} style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--gold)', letterSpacing: 2, marginBottom: 8, paddingLeft: 4 }}>{year === 'earlier' ? 'LEGENDER' : year}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                  {(historia || []).filter(h => h.year === year).map(h => {
                    const p = activePlayers.find(x => x.id === h.player_id) || {}
                    return (
                      <div key={h.id} style={{ background: 'var(--surface)', borderRadius: 10, overflow: 'hidden' }}>
                        {h.media_url && h.media_type === 'video' ? (
                          <video src={h.media_url} playsInline muted style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover' }} onClick={e => { e.target.muted = false; e.target.controls = true; e.target.play() }} />
                        ) : h.media_url ? (
                          <img src={h.media_url} alt="" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover' }} loading="lazy" />
                        ) : null}
                        <div style={{ padding: '8px 10px' }}>
                          <div style={{ fontSize: 12, color: 'var(--cream-dim)', lineHeight: 1.4 }}>{h.caption}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                            <Av p={p} size={14} />
                            <span style={{ fontSize: 9, color: 'var(--cream-muted)', fontFamily: 'var(--mono)' }}>{p.nickname || '?'}</span>
                            {h.media_url && <a href={h.media_url} download style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--cream-muted)', textDecoration: 'none' }}>⬇</a>}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          })()}
        </>)}

        {view === 'gallery' && (<>
          <div className="section-title">📸 Helgen i bilder</div>
          <div className="section-sub">{chat.filter(m => m.image_url && m.msg_type !== 'video').length} foton · {chat.filter(m => m.msg_type === 'video').length} videos</div>
          {(() => {
            const photos = chat.filter(m => m.image_url).sort((a,b) => new Date(b.created_at) - new Date(a.created_at))
            if (photos.length === 0) return <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 40, textAlign: 'center', color: 'var(--cream-muted)' }}>Inga bilder ännu. Skicka foton i chatten!</div>
            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                {photos.map(m => {
                  const p = m.inv_players || activePlayers.find(x => x.id === m.player_id) || {}
                  return (
                    <div key={m.id} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', aspectRatio: '1', background: 'var(--surface)' }}>
                      {m.msg_type === 'video' ? (
                        <video src={m.image_url} playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} onClick={e => { e.target.muted = false; e.target.controls = true; e.target.play() }} />
                      ) : (
                        <img src={m.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                      )}
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', padding: '16px 8px 6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Av p={p} size={16} />
                          <span style={{ fontSize: 10, color: '#fff' }}>{p.nickname || '?'}</span>
                          <a href={m.image_url} download style={{ marginLeft: 'auto', fontSize: 14, color: '#fff', textDecoration: 'none', opacity: 0.7 }}>⬇</a>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <div className="section-title">💰 Even Steven</div>
            <button onClick={() => {
              fetchExpenses(); fetchH2h(); fetchProps(); fetchPayments(); fetchOdds(); fetchAll()
              showToast('🔄 Uppdaterad!', 'birdie')
            }} style={{ background: 'var(--surface2)', border: '1px solid var(--card-border)', borderRadius: 8, color: 'var(--cream-dim)', padding: '8px 12px', fontSize: 12, cursor: 'pointer' }}>🔄 Uppdatera</button>
          </div>
          <div className="section-sub">Utgifter & settlement (Swish)</div>
          </>)}

        {view === 'betting' && (<>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <div className="section-title">🎰 Betting</div>
            <button onClick={() => {
              fetchExpenses(); fetchH2h(); fetchProps(); fetchPayments(); fetchOdds(); fetchAll()
              showToast('🔄 Uppdaterad!', 'birdie')
            }} style={{ background: 'var(--surface2)', border: '1px solid var(--card-border)', borderRadius: 8, color: 'var(--cream-dim)', padding: '8px 12px', fontSize: 12, cursor: 'pointer' }}>🔄 Uppdatera</button>
          </div>
          <div className="section-sub">Odds, H2H, LD/NP & Bounties</div>

          {/* Bounty Board */}
          <div style={{ background: 'linear-gradient(135deg, rgba(232,99,74,0.08), rgba(212,175,55,0.06))', borderRadius: 12, padding: 14, marginBottom: 16, border: '1px solid rgba(232,99,74,0.15)' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--coral)', letterSpacing: 1.5, marginBottom: 8 }}>BOUNTY BOARD</div>
            <div style={{ fontSize: 11, color: 'var(--cream-muted)', marginBottom: 10 }}>Utmana en spelare på ett specifikt hål</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <select id="bountyTarget" style={{ flex: 1, background: 'var(--surface2)', border: '1px solid var(--card-border)', color: 'var(--cream)', padding: '8px', borderRadius: 8, fontSize: 12 }}>
                {activePlayers.filter(p => p.id !== user?.id).map(p => <option key={p.key} value={p.key}>{p.nickname}</option>)}
              </select>
              <select id="bountyHole" style={{ width: 70, background: 'var(--surface2)', border: '1px solid var(--card-border)', color: 'var(--cream)', padding: '8px', borderRadius: 8, fontSize: 12 }}>
                {Array.from({length: 18}, (_, i) => <option key={i+1} value={i+1}>H{i+1}</option>)}
              </select>
              <select id="bountyAmount" style={{ width: 80, background: 'var(--surface2)', border: '1px solid var(--card-border)', color: 'var(--cream)', padding: '8px', borderRadius: 8, fontSize: 12 }}>
                <option value="50">50kr</option><option value="100">100kr</option><option value="200">200kr</option><option value="500">500kr</option>
              </select>
            </div>
            <button onClick={async () => {
              const target = document.getElementById('bountyTarget').value
              const hole = document.getElementById('bountyHole').value
              const amount = document.getElementById('bountyAmount').value
              const tp = activePlayers.find(p => p.key === target)
              await supabase.from('inv_chat').insert({ player_id: user.id, message: 'BOUNTY: Jag utmanar ' + (tp?.nickname || target) + ' på hål ' + hole + ' om ' + amount + 'kr! Bäst Stableford vinner. Acceptera?', msg_type: 'bounty' })
              showToast('Bounty skickad!', 'birdie')
              fetchChat()
            }} style={{ width: '100%', padding: '10px', borderRadius: 8, background: 'var(--coral)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Skicka utmaning
            </button>
          </div>

          {/* 🎰 ODDS BETTING */}
          <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--gold)', letterSpacing: 2, marginBottom: 8 }}>🎰 ODDS BETTING</div>

            {/* Aktiva bets */}
            {oddsBets.filter(b => b.status === 'open').map(bet => {
              const opts = oddsOptions.filter(o => o.bet_id === bet.id)
              const wagers = oddsWagers.filter(w => w.bet_id === bet.id)
              const myWager = wagers.find(w => w.player_key === user.key)
              const banker = activePlayers.find(p => p.key === bet.banker_key)
              const totalPool = wagers.reduce((s, w) => s + parseFloat(w.amount), 0)
              return (
                <div key={bet.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--card-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--cream)' }}>{bet.question}</div>
                      <div style={{ fontSize: 10, color: 'var(--cream-muted)', marginTop: 2 }}>
                        {banker && <span>🏦 Bank: {banker.nickname} · </span>}
                        Pott: {totalPool} kr · {wagers.length} bets
                      </div>
                    </div>
                    {(isAdmin || bet.created_by === user.key) && <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <button onClick={async () => {
                        await supabase.from('inv_odds_bets').update({ locked: !bet.locked }).eq('id', bet.id)
                        fetchOdds()
                        showToast(bet.locked ? '🔓 Bet öppnad' : '🔒 Bet låst', 'birdie')
                      }} style={{ background: bet.locked ? 'rgba(232,99,74,0.15)' : 'var(--surface2)', border: '1px solid var(--card-border)', color: bet.locked ? 'var(--coral)' : 'var(--cream-dim)', fontSize: 11, padding: '3px 8px', borderRadius: 6, cursor: 'pointer' }}>
                        {bet.locked ? '🔒 Låst' : '🔓 Lås'}
                      </button>
                      <button onClick={async () => {
                        if (confirm('Radera denna odds-bet?')) {
                          await supabase.from('inv_odds_bets').delete().eq('id', bet.id)
                          fetchOdds()
                        }
                      }} style={{ background: 'none', border: 'none', color: 'var(--coral)', fontSize: 14, cursor: 'pointer' }}>✕</button>
                    </div>}
                  </div>
                  {/* Options med odds */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 6 }}>
                    {opts.map(opt => {
                      const optWagers = wagers.filter(w => w.option_id === opt.id)
                      const isMyChoice = myWager?.option_id === opt.id
                      const cantBetOnSelf = opt.player_key === user.key
                      const isLocked = bet.locked
                      return (
                        <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', background: isMyChoice ? 'rgba(201,168,76,0.1)' : 'var(--surface2)', borderRadius: 6, border: isMyChoice ? '1px solid var(--gold-dim)' : '1px solid transparent' }}>
                          <div style={{ flex: 1, fontSize: 12, color: 'var(--cream)' }}>{opt.label}</div>
                          {(bet.created_by === user.key || isAdmin) && !bet.locked ? (
                            <input type="number" step="0.1" defaultValue={parseFloat(opt.odds).toFixed(2)}
                              onBlur={async (e) => {
                                const newOdds = parseFloat(e.target.value)
                                if (newOdds > 1 && newOdds !== parseFloat(opt.odds)) {
                                  await supabase.from('inv_odds_options').update({ odds: newOdds }).eq('id', opt.id)
                                  fetchOdds()
                                }
                              }}
                              style={{ width: 50, fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--gold)', fontWeight: 600, background: 'transparent', border: '1px dashed rgba(201,168,76,0.3)', borderRadius: 4, padding: '1px 4px', textAlign: 'center' }} />
                          ) : (
                            <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--gold)', fontWeight: 600, minWidth: 38 }}>{parseFloat(opt.odds).toFixed(2)}x</div>
                          )}
                          {cantBetOnSelf ? <span style={{ fontSize: 9, color: 'var(--cream-muted)', fontStyle: 'italic', minWidth: 60, textAlign: 'right' }}>du själv</span> : isLocked ? <span style={{ fontSize: 9, color: 'var(--cream-muted)', fontStyle: 'italic', minWidth: 60, textAlign: 'right' }}>🔒 låst</span> : (
                            <input type="number" placeholder="kr" value={wagerInputs[`${bet.id}-${opt.id}`] || ''}
                              onChange={e => setWagerInputs(w => ({...w, [`${bet.id}-${opt.id}`]: e.target.value}))}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  const amt = parseFloat(e.target.value)
                                  if (amt > 0) { placeWager(bet.id, opt.id, amt); setWagerInputs(w => ({...w, [`${bet.id}-${opt.id}`]: ''})) }
                                }
                              }}
                              style={{ width: 60, background: 'var(--surface)', border: '1px solid var(--card-border)', borderRadius: 4, color: 'var(--cream)', padding: '4px 6px', fontSize: 12, textAlign: 'right', fontFamily: 'var(--mono)' }} />
                          )}
                          {optWagers.length > 0 && <span style={{ fontSize: 9, color: 'var(--cream-muted)' }}>{optWagers.length}🎯</span>}
                        </div>
                      )
                    })}
                  </div>
                  {myWager && (() => {
                    const myOpt = opts.find(o => o.id === myWager.option_id)
                    if (!myOpt) return null
                    const potential = Math.round(myWager.amount * parseFloat(myOpt.odds))
                    return <div style={{ fontSize: 10, color: 'var(--green)', marginBottom: 4 }}>💰 Du: {myWager.amount} kr på {myOpt.label} → potentiell vinst {potential} kr</div>
                  })()}
                  {/* Admin/banker: avgör */}
                  {(isAdmin || bet.banker_key === user.key) && (
                    <select onChange={e => { if (e.target.value) settleOddsBet(bet, e.target.value) }}
                      style={{ background: 'var(--surface2)', border: '1px solid var(--card-border)', borderRadius: 6, color: 'var(--cream)', padding: '4px 8px', fontSize: 11, marginTop: 4 }}>
                      <option value="">Avgör vinnare...</option>
                      {opts.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                    </select>
                  )}
                </div>
              )
            })}

            {/* Skapa ny odds-bet */}
            <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: 12, marginTop: 10 }}>
              <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--cream-muted)', letterSpacing: 1.5, marginBottom: 6 }}>SNABB-BETS (auto-odds från HCP)</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                {STANDARD_BETS.map((b, i) => (
                  <button key={i} onClick={() => createStandardBet(b)}
                    style={{ fontSize: 10, padding: '5px 9px', background: 'var(--surface2)', border: '1px solid var(--card-border)', color: 'var(--cream-dim)', borderRadius: 6, cursor: 'pointer' }}>
                    + {b.q}
                  </button>
                ))}
              </div>

              <details>
                <summary style={{ cursor: 'pointer', fontSize: 11, color: 'var(--cream-muted)', padding: '6px 0' }}>🛠️ Skapa custom odds-bet</summary>
                <div style={{ marginTop: 8 }}>
                  <input placeholder="Fråga? (t.ex. Vem chipar in först?)" value={oddsForm.question}
                    onChange={e => setOddsForm(f => ({...f, question: e.target.value}))}
                    style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--card-border)', borderRadius: 8, color: 'var(--cream)', padding: '8px', fontSize: 12, marginBottom: 8 }} />

                  <div style={{ fontSize: 10, color: 'var(--cream-muted)', marginBottom: 4 }}>ALTERNATIV (välj spelare → auto-odds)</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                    {activePlayers.map(p => {
                      const included = oddsForm.options.some(o => o.player_key === p.key)
                      return (
                        <button key={p.key} onClick={() => {
                          if (included) {
                            setOddsForm(f => ({...f, options: f.options.filter(o => o.player_key !== p.key)}))
                          } else {
                            setOddsForm(f => ({...f, options: [...f.options, { label: p.nickname, odds: calcAutoOdds(p), player_key: p.key }]}))
                          }
                        }} style={{ fontSize: 11, padding: '5px 9px', background: included ? 'rgba(201,168,76,0.15)' : 'var(--surface2)', border: included ? '1px solid var(--gold-dim)' : '1px solid var(--card-border)', color: included ? 'var(--gold)' : 'var(--cream-dim)', borderRadius: 6, cursor: 'pointer' }}>
                          {p.nickname} ({calcAutoOdds(p).toFixed(1)}x)
                        </button>
                      )
                    })}
                  </div>

                  {oddsForm.options.length > 0 && (
                    <div style={{ background: 'var(--surface2)', borderRadius: 6, padding: 8, marginBottom: 8 }}>
                      <div style={{ fontSize: 9, color: 'var(--cream-muted)', marginBottom: 4 }}>JUSTERA ODDS</div>
                      {oddsForm.options.map((o, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0' }}>
                          <span style={{ flex: 1, fontSize: 12, color: 'var(--cream)' }}>{o.label}</span>
                          <input type="number" step="0.1" value={o.odds}
                            onChange={e => {
                              const newOpts = [...oddsForm.options]
                              newOpts[i].odds = parseFloat(e.target.value) || 1
                              setOddsForm(f => ({...f, options: newOpts}))
                            }}
                            style={{ width: 60, background: 'var(--surface)', border: '1px solid var(--card-border)', borderRadius: 4, color: 'var(--gold)', padding: '3px 6px', fontSize: 12, textAlign: 'right', fontFamily: 'var(--mono)' }} />
                          <span style={{ fontSize: 10, color: 'var(--cream-muted)' }}>x</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ fontSize: 10, color: 'var(--cream-muted)', marginBottom: 4 }}>🏦 BANK (betalar ut vinster)</div>
                  <select value={oddsForm.banker} onChange={e => setOddsForm(f => ({...f, banker: e.target.value}))}
                    style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--card-border)', borderRadius: 6, color: 'var(--cream)', padding: '6px', fontSize: 12, marginBottom: 10 }}>
                    <option value="">Jag är bank ({user?.nickname})</option>
                    {activePlayers.filter(p => p.key !== user?.key).map(p => <option key={p.key} value={p.key}>{p.nickname}</option>)}
                  </select>

                  <button onClick={async () => {
                    if (!oddsForm.question || oddsForm.options.length < 2) {
                      showToast('Behöver fråga + minst 2 alternativ', 'zero')
                      return
                    }
                    const banker = oddsForm.banker || user.key
                    await createOddsBet(oddsForm.question, oddsForm.options, banker)
                    setOddsForm({ question: '', options: [], banker: '', useAutoOdds: true })
                  }} style={{ width: '100%', padding: '10px', background: 'var(--gold)', color: '#0A0A08', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    🎰 Skapa odds-bet
                  </button>
                </div>
              </details>
            </div>

            {/* Settled bets (collapsed) */}
            {oddsBets.filter(b => b.status === 'settled').length > 0 && (
              <details style={{ marginTop: 10 }}>
                <summary style={{ cursor: 'pointer', fontSize: 11, color: 'var(--cream-muted)' }}>📜 Avgjorda bets ({oddsBets.filter(b => b.status === 'settled').length})</summary>
                {oddsBets.filter(b => b.status === 'settled').map(bet => {
                  const winnerOpt = oddsOptions.find(o => o.id === bet.winner_option_id)
                  return (
                    <div key={bet.id} style={{ fontSize: 11, color: 'var(--cream-dim)', padding: '4px 0' }}>
                      ✅ {bet.question} → <strong style={{ color: 'var(--green)' }}>{winnerOpt?.label}</strong> @ {winnerOpt?.odds}x
                    </div>
                  )
                })}
              </details>
            )}
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
                      <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 0', borderBottom: '1px solid var(--card-border)' }}>
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
                          }} style={{ width: 70, background: 'var(--surface2)', border: '1px solid var(--card-border)', borderRadius: 6, color: 'var(--cream)', padding: '3px', fontSize: 10 }}>
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
                      <select id={`h2h-p1-${rn}`} style={{ flex: 1, background: 'var(--surface2)', border: '1px solid var(--card-border)', borderRadius: 6, color: 'var(--cream)', padding: '4px', fontSize: 10 }}>
                        <option value="">Spelare 1</option>
                        {activePlayers.map(p => <option key={p.key} value={p.key}>{p.nickname}</option>)}
                      </select>
                      <select id={`h2h-p2-${rn}`} style={{ flex: 1, background: 'var(--surface2)', border: '1px solid var(--card-border)', borderRadius: 6, color: 'var(--cream)', padding: '4px', fontSize: 10 }}>
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
                <div key={rn} style={{ padding: '6px 0', borderBottom: '1px solid var(--card-border)' }}>
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
                          }} style={{ background: 'var(--surface2)', border: '1px solid var(--card-border)', borderRadius: 4, color: 'var(--cream)', padding: '2px', fontSize: 10 }}>
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
                          }} style={{ background: 'var(--surface2)', border: '1px solid var(--card-border)', borderRadius: 4, color: 'var(--cream)', padding: '2px', fontSize: 10 }}>
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

          </>)}

        {view === 'expenses' && (<>
          <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--gold)', letterSpacing: 2, marginBottom: 8 }}>LÄGG TILL UTGIFT</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <input placeholder="Vad?" value={expenseForm.description} onChange={e => setExpenseForm(f => ({...f, description: e.target.value}))}
                style={{ flex: 2, background: 'var(--surface2)', border: '1px solid var(--card-border)', borderRadius: 8, color: 'var(--cream)', padding: '10px', fontSize: 14 }} />
              <input placeholder="SEK" type="number" value={expenseForm.amount} onChange={e => setExpenseForm(f => ({...f, amount: e.target.value}))}
                style={{ flex: 1, background: 'var(--surface2)', border: '1px solid var(--card-border)', borderRadius: 8, color: 'var(--cream)', padding: '10px', fontSize: 14, fontFamily: 'var(--mono)' }} />
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
                style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--card-border)', borderRadius: 8, color: 'var(--cream)', padding: '8px', fontSize: 12 }}>
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
              showToast(`💰 ${ins.amount} kr tillagt!`, 'birdie')
            }} style={{ width: '100%', padding: '12px', background: 'var(--gold)', color: '#0A0A08', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Lägg till
            </button>
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
            // Apply payments (Swish-betalningar): from_key pays to_key → reducerar skuld
            payments.forEach(p => {
              const amt = parseFloat(p.amount)
              if (totals[p.from_key]) totals[p.from_key].paid += amt
              if (totals[p.to_key]) totals[p.to_key].owes += amt
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
                    <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid var(--card-border)' }}>
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
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--card-border)', flexWrap: 'wrap' }}>
                        <Av p={fromPlayer} size={22} />
                        <span style={{ fontSize: 13, color: 'var(--coral)' }}>{getName(s.from)}</span>
                        <span style={{ color: 'var(--cream-muted)' }}>→</span>
                        <Av p={toPlayer} size={22} />
                        <span style={{ fontSize: 13, color: 'var(--green)' }}>{getName(s.to)}</span>
                        <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 600 }}>{s.amount} kr</span>
                        {canSwish && <button onClick={() => setSwishModal({ toPlayer, fromPlayer, amount: s.amount })} style={{ background: '#EF6C00', color: '#fff', fontSize: 11, fontWeight: 600, padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer' }}>💸 Swisha</button>}
                        {isMyDebt && <button onClick={async () => {
                          if (!confirm(`Markera ${s.amount} kr till ${toPlayer?.nickname} som betald?`)) return
                          await supabase.from('inv_payments').insert({ from_key: s.from, to_key: s.to, amount: s.amount, method: 'swish', created_by: user.key })
                          fetchPayments()
                          showToast(`✅ Betalning registrerad`, 'birdie')
                        }} style={{ background: 'rgba(107,191,127,0.15)', color: 'var(--green)', fontSize: 11, fontWeight: 600, padding: '6px 10px', borderRadius: 6, border: '1px solid var(--green)', cursor: 'pointer' }}>✅ Betald</button>}
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
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 0', borderBottom: '1px solid var(--card-border)' }}>
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
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--cream-muted)', marginTop: 4 }}>HCP {user.hcp} · {user.team === 'green' ? '🟢 Jägermeister' : '🔵 Fernet'}</div>
          </div>

          {/* Kontaktuppgifter */}
          <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--gold)', letterSpacing: 2, marginBottom: 10 }}>KONTAKT</div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: 'var(--cream-muted)', marginBottom: 4 }}>📱 TELEFON (för Swish)</div>
              <input type="tel" value={profileForm.phone} placeholder="070xxxxxxx"
                onChange={e => setProfileForm(f => ({...f, phone: e.target.value}))}
                style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--card-border)', borderRadius: 8, color: 'var(--cream)', padding: '10px', fontSize: 14 }} />
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: 'var(--cream-muted)', marginBottom: 4 }}>✉️ EMAIL</div>
              <input type="email" value={profileForm.email} placeholder="din@email.se"
                onChange={e => setProfileForm(f => ({...f, email: e.target.value}))}
                style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--card-border)', borderRadius: 8, color: 'var(--cream)', padding: '10px', fontSize: 14 }} />
            </div>
          </div>

          {/* Profilinställningar */}
          <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--gold)', letterSpacing: 2, marginBottom: 10 }}>PROFIL</div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: 'var(--cream-muted)', marginBottom: 4 }}>NICKNAME</div>
              <input value={profileForm.nickname}
                onChange={e => setProfileForm(f => ({...f, nickname: e.target.value}))}
                style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--card-border)', borderRadius: 8, color: 'var(--cream)', padding: '10px', fontSize: 14 }} />
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: 'var(--cream-muted)', marginBottom: 4 }}>🎵 WALK-UP ANTHEM</div>
              <input value={profileForm.song} placeholder="Din låt"
                onChange={e => setProfileForm(f => ({...f, song: e.target.value}))}
                style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--card-border)', borderRadius: 8, color: 'var(--cream)', padding: '10px', fontSize: 14 }} />
            </div>

            <div>
              <div style={{ fontSize: 10, color: 'var(--cream-muted)', marginBottom: 4 }}>📸 PROFILBILD (URL)</div>
              <input value={profileForm.image_url} placeholder="https://..."
                onChange={e => setProfileForm(f => ({...f, image_url: e.target.value}))}
                style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--card-border)', borderRadius: 8, color: 'var(--cream)', padding: '10px', fontSize: 12, fontFamily: 'var(--mono)' }} />
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
              <label key={n.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--card-border)', cursor: 'pointer' }}>
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

            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--card-border)', cursor: 'pointer' }}>
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
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--gold)', letterSpacing: 2, marginBottom: 10 }}>🍺 DRUNK-O-METER</div>
            <div style={{ fontSize: 12, color: 'var(--cream-muted)', marginBottom: 8 }}>Hur mår du just nu?</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
              {[
                { v: 1, l: 'Nykter', e: '😐' },
                { v: 2, l: 'Lagom', e: '😊' },
                { v: 3, l: 'Glad', e: '😄' },
                { v: 4, l: 'Full', e: '🍺' },
                { v: 5, l: 'Kaos', e: '🤪' },
              ].map(d => (
                <button key={d.v} onClick={async () => {
                  await supabase.from('inv_players').update({ drunk_level: d.v }).eq('id', user.id)
                  setUser(u => ({ ...u, drunk_level: d.v }))
                  showToast(d.e + ' ' + d.l + '!', 'birdie')
                }} style={{
                  flex: 1, padding: '10px 4px', borderRadius: 10, cursor: 'pointer', textAlign: 'center',
                  background: user.drunk_level === d.v ? 'rgba(212,175,55,0.15)' : 'var(--surface2)',
                  border: user.drunk_level === d.v ? '1.5px solid var(--gold)' : '1px solid var(--card-border)',
                }}>
                  <div style={{ fontSize: 20 }}>{d.e}</div>
                  <div style={{ fontSize: 8, fontFamily: 'var(--mono)', color: user.drunk_level === d.v ? 'var(--gold)' : 'var(--cream-muted)', marginTop: 2 }}>{d.l}</div>
                </button>
              ))}
            </div>

            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--gold)', letterSpacing: 2, marginBottom: 10 }}>🏆 ACHIEVEMENTS</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginBottom: 20 }}>
              {achievements.map(a => {
                const myScores = scores.filter(s => s.player_id === user.id)
                const unlocked = a.check(myScores, rounds)
                return (
                  <div key={a.id} style={{ padding: '10px', borderRadius: 10, background: unlocked ? 'rgba(212,175,55,0.1)' : 'var(--surface2)', border: unlocked ? '1px solid var(--gold-dim)' : '1px solid var(--card-border)', opacity: unlocked ? 1 : 0.4 }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{a.icon}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: unlocked ? 'var(--gold)' : 'var(--cream-muted)' }}>{a.title}</div>
                    <div style={{ fontSize: 9, color: 'var(--cream-muted)', marginTop: 2 }}>{a.desc}</div>
                  </div>
                )
              })}
            </div>

            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--gold)', letterSpacing: 2, marginBottom: 10 }}>🔒 PIN-KOD</div>
            <div style={{ fontSize: 11, color: 'var(--cream-muted)', marginBottom: 8 }}>Valfri 4-siffrig PIN (tom = ingen PIN)</div>
            <input type="password" inputMode="numeric" maxLength={4} value={profileForm.pin} placeholder="••••"
              onChange={e => setProfileForm(f => ({...f, pin: e.target.value.replace(/\D/g, '').slice(0, 4)}))}
              style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--card-border)', borderRadius: 8, color: 'var(--cream)', padding: '10px', fontSize: 18, letterSpacing: 8, textAlign: 'center', fontFamily: 'var(--mono)' }} />
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
            }} style={{ width: '100%', padding: '12px', background: 'var(--surface2)', color: 'var(--cream)', border: '1px solid var(--card-border)', borderRadius: 8, fontSize: 13, cursor: 'pointer', marginBottom: 8 }}>
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
            }} style={{ width: '100%', padding: '12px', background: 'var(--surface2)', color: 'var(--cream)', border: '1px solid var(--card-border)', borderRadius: 8, fontSize: 13, cursor: 'pointer', marginBottom: 8 }}>
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
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--card-border)' }}>
                <Av p={p} size={24} />
                <div style={{ flex: 1, fontSize: 13 }}>{p.nickname}</div>
                <input type="number" step="0.1" defaultValue={p.hcp} style={{ width: 60, background: 'var(--surface2)', border: '1px solid var(--card-border)', borderRadius: 6, color: 'var(--cream)', padding: '4px 6px', fontSize: 14, textAlign: 'center', fontFamily: 'var(--mono)' }}
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
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--card-border)' }}>
                <Av p={p} size={24} />
                <div style={{ flex: 1, fontSize: 13 }}>{p.nickname}</div>
                <input type="tel" defaultValue={p.phone || ''} placeholder="070xxxxxxx" style={{ width: 130, background: 'var(--surface2)', border: '1px solid var(--card-border)', borderRadius: 6, color: 'var(--cream)', padding: '4px 8px', fontSize: 12, fontFamily: 'var(--mono)' }}
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
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--card-border)' }}>
                <Av p={p} size={24} />
                <div style={{ flex: 1, fontSize: 13 }}>
                  {p.nickname}
                  {p.must_change_pin && <span style={{ fontSize: 9, color: 'var(--coral)', marginLeft: 6 }}>⚠️ ej bytt</span>}
                </div>
                <input type="text" inputMode="numeric" maxLength={4} placeholder="••••" style={{ width: 70, background: 'var(--surface2)', border: '1px solid var(--card-border)', borderRadius: 6, color: 'var(--cream)', padding: '4px 8px', fontSize: 14, fontFamily: 'var(--mono)', letterSpacing: 4, textAlign: 'center' }}
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
                }} style={{ background: 'var(--surface2)', border: '1px solid var(--card-border)', color: 'var(--cream-muted)', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>
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
                  style={{ fontSize: 10, padding: '6px 10px', background: 'var(--surface2)', border: '1px solid var(--card-border)', color: 'var(--cream-dim)', borderRadius: 6, cursor: 'pointer' }}>
                  {q.t}
                </button>
              ))}
            </div>

            {/* Mottagare */}
            <div style={{ fontSize: 10, color: 'var(--cream-muted)', marginBottom: 4 }}>MOTTAGARE</div>
            <select value={broadcastForm.target} onChange={e => setBroadcastForm(f => ({...f, target: e.target.value}))}
              style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--card-border)', borderRadius: 8, color: 'var(--cream)', padding: '10px', fontSize: 13, marginBottom: 10 }}>
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
              style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--card-border)', borderRadius: 8, color: 'var(--cream)', padding: '10px', fontSize: 13, marginBottom: 10 }} />

            {/* Body */}
            <div style={{ fontSize: 10, color: 'var(--cream-muted)', marginBottom: 4 }}>MEDDELANDE</div>
            <textarea value={broadcastForm.body} onChange={e => setBroadcastForm(f => ({...f, body: e.target.value}))}
              placeholder="Skriv ditt meddelande..." maxLength={200} rows={3}
              style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--card-border)', borderRadius: 8, color: 'var(--cream)', padding: '10px', fontSize: 13, marginBottom: 4, resize: 'vertical', fontFamily: 'inherit' }} />
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
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--card-border)' }}>
                <Av p={p} size={24} />
                <div style={{ flex: 1, fontSize: 13 }}>{p.nickname}</div>
                <select defaultValue={p.team} style={{ background: 'var(--surface2)', border: '1px solid var(--card-border)', borderRadius: 6, color: 'var(--cream)', padding: '4px 8px', fontSize: 12 }}
                  onChange={async (e) => {
                    await supabase.from('inv_players').update({ team: e.target.value }).eq('id', p.id)
                    fetchAll()
                    showToast(`${p.nickname} → ${e.target.value === 'green' ? 'Jägermeister' : 'Fernet'}`, 'birdie')
                  }}>
                  <option value="green">Jägermeister</option>
                  <option value="blue">Fernet</option>
                </select>
              </div>
            ))}
          </div>

          {/* Rundor & Banval */}
          <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--gold)', letterSpacing: 2, marginBottom: 10 }}>RUNDOR & BANVAL</div>
            {[1,2,3,4].map(rn => (
              <div key={rn} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--card-border)' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--cream)', minWidth: 30 }}>R{rn}</div>
                <select defaultValue={rounds.find(x => x.round_number === rn)?.course || RC[rn]} style={{ flex: 1, background: 'var(--surface2)', border: '1px solid var(--card-border)', borderRadius: 6, color: 'var(--cream)', padding: '6px 8px', fontSize: 12 }}
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
                    <input type="number" defaultValue={c.slope} style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--card-border)', borderRadius: 6, color: 'var(--cream)', padding: '4px 6px', fontSize: 14, fontFamily: 'var(--mono)' }}
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
                    <input type="number" step="0.1" defaultValue={c.cr} style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--card-border)', borderRadius: 6, color: 'var(--cream)', padding: '4px 6px', fontSize: 14, fontFamily: 'var(--mono)' }}
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
                <div key={rn} style={{ padding: '8px 0', borderBottom: '1px solid var(--card-border)' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--cream)', marginBottom: 6 }}>R{rn} – {RC[rn]}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--cream-muted)' }}>🏌️ LD HÅL</div>
                      <input type="number" min="1" max="18" defaultValue={specialHoles[rn]?.ld} style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--card-border)', borderRadius: 6, color: 'var(--cream)', padding: '4px 6px', fontSize: 14, fontFamily: 'var(--mono)' }}
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
                      <input type="number" min="1" max="18" defaultValue={specialHoles[rn]?.np} style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--card-border)', borderRadius: 6, color: 'var(--cream)', padding: '4px 6px', fontSize: 14, fontFamily: 'var(--mono)' }}
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
                      <input type="number" min="1" max="18" defaultValue={specialHoles[rn]?.doubleStart || 16} style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--card-border)', borderRadius: 6, color: 'var(--cream)', padding: '4px 6px', fontSize: 14, fontFamily: 'var(--mono)' }}
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
              <select id="del-player" style={{ flex: 1, background: 'var(--surface2)', border: '1px solid var(--card-border)', borderRadius: 6, color: 'var(--cream)', padding: '6px 8px', fontSize: 12 }}>
                {activePlayers.map(p => <option key={p.id} value={p.id}>{p.nickname}</option>)}
              </select>
              <select id="del-round" style={{ flex: 1, background: 'var(--surface2)', border: '1px solid var(--card-border)', borderRadius: 6, color: 'var(--cream)', padding: '6px 8px', fontSize: 12 }}>
                {[1,2,3,4].map(r => <option key={r} value={r}>R{r}</option>)}
              </select>
              <input id="del-hole" type="number" min="1" max="18" placeholder="Hål" style={{ width: 50, background: 'var(--surface2)', border: '1px solid var(--card-border)', borderRadius: 6, color: 'var(--cream)', padding: '6px', fontSize: 12, fontFamily: 'var(--mono)' }} />
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
              <select id="reset-round" style={{ flex: 1, background: 'var(--surface2)', border: '1px solid var(--card-border)', borderRadius: 6, color: 'var(--cream)', padding: '6px 8px', fontSize: 12 }}>
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
          <div style={{ width: '300px', maxWidth: '85vw', background: 'var(--surface)', height: '100%', overflowY: 'auto', paddingTop: 'var(--safe-top)', animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)', borderLeft: '1px solid var(--card-border)' }}>
            {/* Header */}
            <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--card-border)' }}>
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
                { key: 'teams', icon: <IconSwords size={16} />, label: 'Lag-battle', desc: 'Jägermeister vs Fernet' },
                { key: 'inbox', icon: <IconBell size={16} />, label: 'Inkorg', desc: 'Utmaningar & mentions' },
                { key: 'feed', icon: <IconChat size={16} />, label: 'Chat', desc: 'Trash talk i realtid' },
                { key: 'expenses', icon: <IconWallet size={16} />, label: 'Even Steven', desc: 'Utgifter & settlement' },
                { key: 'betting', icon: <IconDice size={16} />, label: 'Betting', desc: 'Odds, H2H & LD/NP' },
                { key: 'gallery', icon: <IconCamera size={16} />, label: 'Foton', desc: 'Helgen i bilder' },
                { key: 'historia', icon: <IconTrophy size={16} />, label: 'Douche Historia', desc: 'Minnen & legender' },
                { key: 'info', icon: <IconInfo size={16} />, label: 'Turneringsinfo', desc: 'Schema, stats, awards' },
                { key: 'profile', icon: <IconUser size={16} />, label: 'Min profil', desc: 'Inställningar & kontakt' },
                ...(isAdmin ? [{ key: 'settings', icon: <IconSettings size={16} />, label: 'Admin', desc: 'HCP, lag, bana, PIN' }] : []),
              ].map(t => (
                <button key={t.key} onClick={() => { setView(t.key); setShowMenu(false) }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 14px', background: view === t.key ? 'rgba(201,168,76,0.08)' : 'transparent', border: view === t.key ? '1px solid var(--gold-dim)' : '1px solid transparent', borderRadius: 12, cursor: 'pointer', textAlign: 'left', marginBottom: 4 }}>
                  <AugustaBadge size={32} active={view === t.key}><span style={{ color: view === t.key ? '#1B4332' : '#FAF8F0', display: 'flex' }}>{t.icon}</span></AugustaBadge>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 500, color: view === t.key ? 'var(--gold)' : 'var(--cream)' }}>{t.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--cream-muted)', marginTop: 2 }}>{t.desc}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--card-border)', marginTop: 10 }}>
              <button onClick={() => { setShowMenu(false); onSwitchMode() }} style={{ width: '100%', padding: '10px', borderRadius: 10, cursor: 'pointer', marginBottom: 10, background: 'linear-gradient(135deg, rgba(147,197,253,0.08), rgba(147,197,253,0.03))', border: '0.5px solid rgba(147,197,253,0.15)', color: '#93C5FD', fontSize: 11, fontFamily: 'var(--mono)', letterSpacing: 1, textAlign: 'center' }}>↔ BYT TILL TÄBY ORDER OF MERIT</button>
              <div style={{ fontSize: 10, color: 'var(--cream-muted)', fontFamily: 'var(--mono)', textAlign: 'center', letterSpacing: 2 }}>DIO · 2026 · HOOKS HERRGÅRD</div>
              <div style={{ fontSize: 9, color: 'var(--cream-muted)', textAlign: 'center', marginTop: 4 }}>⛳ Le Douche de Golf</div>
            </div>
          </div>
        </div>
      )}

      {/* ===== SWISH MODAL ===== */}
      <SwishModal open={!!swishModal} onClose={() => setSwishModal(null)}
        toPlayer={swishModal?.toPlayer} fromPlayer={swishModal?.fromPlayer} amount={swishModal?.amount}
        onMarkPaid={async () => {
          if (!swishModal) return
          await supabase.from('inv_payments').insert({
            from_key: swishModal.fromPlayer.key, to_key: swishModal.toPlayer.key,
            amount: swishModal.amount, method: 'swish', created_by: user.key
          })
          fetchPayments()
          showToast('✅ Betalning registrerad', 'birdie')
        }} />

      {/* ===== BOTTOM NAV - iOS 26 Liquid Glass + Team Scores ===== */}
      <nav className="bottom-nav">
        <div className="nav-teams-strip">
          <span className={`nav-team green ${teamTotal('green') > teamTotal('blue') ? 'leading' : ''}`}>JÄGER {teamTotal('green') || '–'}p</span>
          <span className="nav-team-vs">vs</span>
          <span className={`nav-team blue ${teamTotal('blue') > teamTotal('green') ? 'leading' : ''}`}>FERNET {teamTotal('blue') || '–'}p</span>
        </div>
        <div className="nav-buttons">
          <button className={`bottom-nav-btn ${view === 'leaderboard' ? 'active' : ''}`} onClick={() => setView('leaderboard')}>
            <AugustaBadge size={28} active={view === 'leaderboard'}><IconLeaderboard size={13} color={view === 'leaderboard' ? '#1B4332' : '#FAF8F0'} /></AugustaBadge>
            <span className="nav-label">LEDARE</span>
          </button>
          <button className={`bottom-nav-btn ${view === 'scorecard' ? 'active' : ''}`} onClick={() => setView('scorecard')}>
            <AugustaBadge size={28} active={view === 'scorecard'}><IconScorecard size={13} color={view === 'scorecard' ? '#1B4332' : '#FAF8F0'} /></AugustaBadge>
            <span className="nav-label">SCORE</span>
          </button>
          <button className={`bottom-nav-btn ${view === 'teams' ? 'active' : ''}`} onClick={() => setView('teams')}>
            <AugustaBadge size={28} active={view === 'teams'}><IconSwords size={13} color={view === 'teams' ? '#1B4332' : '#FAF8F0'} /></AugustaBadge>
            <span className="nav-label">LAG</span>
          </button>
          <button className="bottom-nav-btn" onClick={() => setShowMenu(true)}>
            <AugustaBadge size={28}><IconMenu size={13} color="#FAF8F0" /></AugustaBadge>
            <span className="nav-label">MENY</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
