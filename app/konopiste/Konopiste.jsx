'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'

// ─── Trip constants ───────────────────────────────────────────────
const FIRST_TEE = '2027-05-06T13:30:00+02:00'
const BOOK_BY = '2026-12-15T23:59:00+01:00'
const TRIP_START = '2027-05-06T00:00:00+02:00'
const TRIP_END = '2027-05-09T23:59:00+02:00'
const EUR_SEK = 11.0 // approximate
const RESORT = { lat: 49.7508, lon: 14.6293 }
const WEBCAM = 'https://www.golf-konopiste.cz/kamera/jamka10.jpg'
const HERO_VIDEO = 'bbHigsU0YdE'

const STATUS = [
  { date: '23 nov', text: 'Datum klart: 6–9 maj 2027 (6 röster)', done: true },
  { date: '23 nov', text: 'Gruppförfrågan skickad till resorten', done: true },
  { date: 'Väntar', text: 'Offert på Stay & Play, tee-tider och transfer', done: false },
  { date: '15 dec', text: 'Alla har bokat flyg', done: false },
]

const PLAYER_KEYS = ['filip', 'marcus', 'matthis', 'fredrik', 'magnus', 'martin', 'rami', 'marten']
const FALLBACK_PLAYERS = [
  { key: 'filip', name: 'Filip Hector', nickname: 'Mr Vain', hcp: 8.6 },
  { key: 'marcus', name: 'Marcus Ullholm', nickname: 'Dr Erektor', hcp: 13.8 },
  { key: 'matthis', name: 'Matthis Jackobson', nickname: 'The Grinder', hcp: 16.8 },
  { key: 'fredrik', name: 'Fredrik Hellstenius', nickname: 'The Fossil', hcp: 22.5 },
  { key: 'magnus', name: 'Magnus Jarlgren', nickname: 'The Hybrid', hcp: 22.9 },
  { key: 'martin', name: 'Martin Jarlgren', nickname: 'Plus One', hcp: 40 },
  { key: 'rami', name: 'Rami Hamdeh', nickname: 'Snutas', hcp: 23.7 },
  { key: 'marten', name: 'Mårten Eker', nickname: 'The Guest', hcp: -1.5 },
]
const FROM = { martin: 'Landvetter' }

const DAYS = [
  {
    id: 'tor', label: 'Tor', date: '6 maj', title: 'Ankomst', iso: '2027-05-06',
    items: [
      ['07:00', 'Flyg ARN → PRG (Martin GOT → PRG)'],
      ['11:30', 'Minibuss till slottet, ca 45 min'],
      ['12:30', 'Lunch på klubbhuset'],
      ['13:30', 'R1 · Radecký · poängbogey', true],
      ['19:30', 'Välkomstmiddag och lagdragning'],
    ],
  },
  {
    id: 'fre', label: 'Fre', date: '7 maj', title: '36 hål', iso: '2027-05-07',
    items: [
      ['07:00', 'Frukost'],
      ['08:00', 'R2 · d’Este · fyrboll bästboll', true],
      ['12:30', 'Lunch'],
      ['13:30', 'R3 · Radecký · greensome', true],
      ['19:30', 'Middag på Steak House'],
    ],
  },
  {
    id: 'lor', label: 'Lör', date: '8 maj', title: '36 hål + gala', iso: '2027-05-08',
    items: [
      ['07:00', 'Frukost'],
      ['08:00', 'R4 · Radecký · Ryder 2 mot 2', true],
      ['12:30', 'Lunch'],
      ['13:30', 'R5 · d’Este · poängbogey', true],
      ['20:00', 'Galamiddag och prisutdelning'],
    ],
  },
  {
    id: 'son', label: 'Sön', date: '9 maj', title: 'Sista rundan', iso: '2027-05-09',
    items: [
      ['06:45', 'Frukost, utcheckning, väskor i förvaring'],
      ['07:30', 'R6 · d’Este · singlar', true],
      ['12:15', 'Dusch och snabblunch'],
      ['13:15', 'Minibuss till PRG'],
      ['16:00', 'Hemflyg'],
    ],
  },
]

const ROUNDS = [
  { r: 'R1', day: 'Tor', course: 'Radecký', format: 'Individuell poängbogey', counts: 'Individ + lag', note: 'Seedar fältet. Ingen press. Lite press.' },
  { r: 'R2', day: 'Fre fm', course: 'd’Este', format: 'Fyrboll bästboll', counts: 'Lag', note: 'Rumskompisen bär dig, eller tvärtom.' },
  { r: 'R3', day: 'Fre em', course: 'Radecký', format: 'Greensome', counts: 'Lag', note: 'Båda slår ut, ni väljer bästa, sedan varannan. Relationstest.' },
  { r: 'R4', day: 'Lör fm', course: 'Radecký', format: 'Ryder: 2 lag mot 2', counts: 'Ryder', note: 'Matchspel, sida mot sida.' },
  { r: 'R5', day: 'Lör em', course: 'd’Este', format: 'Individuell poängbogey', counts: 'Individ', note: 'Sista chansen före galan.' },
  { r: 'R6', day: 'Sön', course: 'd’Este', format: 'Singelmatcher', counts: 'Ryder-final + individ', note: 'Seedade efter ställningen. Avgör allt.' },
]

const PRIZES = [
  { icon: '🏆', name: 'Ferdinand Cup', desc: 'Bästa individuella poängsumma över R1, R5 och R6. Döpt efter slottets gamla ärkehertig.' },
  { icon: '🤝', name: 'Lagpokalen', desc: 'Bästa tvåmannalaget över R1–R3.' },
  { icon: '⚔️', name: 'Ryder', desc: 'Sidan som vinner lagmatcherna på lördagen och singlarna på söndagen.' },
  { icon: '🎯', name: 'Daily', desc: 'Längsta drive och närmast hål, varje runda.' },
  { icon: '🐸', name: 'Träsket', desc: 'Sämst totalt bjuder på första rundan på galan.' },
]

const VIDEOS = [
  { id: 'K936fcPzs_A', title: 'Info video 1', short: true },
  { id: '4Jl4yrk9I84', title: 'Info video 2', short: true },
  { id: 'FZEw_F3nbKU', title: 'Stefan from Sweden', short: true },
  { id: 'easl9KDlU5k', title: 'Our guests from Denmark', short: true },
]

const LINKS = [
  { group: 'Jämför', items: [
    { label: 'Google Flights · ARN–PRG 6–9 maj', url: 'https://www.google.com/travel/flights?q=Flights%20to%20PRG%20from%20ARN%20on%202027-05-06%20through%202027-05-09' },
    { label: 'Skyscanner · ARN–PRG, 7 resenärer', url: 'https://www.skyscanner.se/transport/flyg/arn/prg/270506/270509/?adultsv2=7' },
  ] },
  { group: 'Flygbolag', items: [
    { label: 'SAS', url: 'https://www.flysas.com/se-sv/' },
    { label: 'Norwegian', url: 'https://www.norwegian.com/se/' },
    { label: 'Eurowings', url: 'https://www.eurowings.com' },
  ] },
  { group: 'Martin från Göteborg', items: [
    { label: 'Skyscanner · GOT–PRG 6–9 maj', url: 'https://www.skyscanner.se/transport/flyg/got/prg/270506/270509/?adultsv2=1' },
    { label: 'Ryanair', url: 'https://www.ryanair.com/se/sv' },
  ] },
]

const TASKS = [
  { id: 'flight', label: 'Flyg bokat', short: 'Flyg' },
  { id: 'info', label: 'Namn, hcp och golf-ID skickat', short: 'Info' },
  { id: 'deposit', label: 'Handpenning swishad', short: 'Swish' },
]

const WEATHER = {
  0: ['☀️', 'Klart'], 1: ['🌤️', 'Mest klart'], 2: ['⛅', 'Halvklart'], 3: ['☁️', 'Mulet'],
  45: ['🌫️', 'Dimma'], 48: ['🌫️', 'Dimma'], 51: ['🌦️', 'Duggregn'], 53: ['🌦️', 'Duggregn'], 55: ['🌧️', 'Duggregn'],
  61: ['🌧️', 'Regn'], 63: ['🌧️', 'Regn'], 65: ['🌧️', 'Kraftigt regn'], 71: ['🌨️', 'Snö'], 73: ['🌨️', 'Snö'], 75: ['❄️', 'Mycket snö'],
  80: ['🌦️', 'Skurar'], 81: ['🌧️', 'Skurar'], 82: ['⛈️', 'Kraftiga skurar'], 95: ['⛈️', 'Åska'],
}

// ─── Design tokens (DIO "Augusta Clubhouse") ─────────────────────
const C = {
  bg: '#0B1410', surface: 'rgba(19,29,22,0.72)', line: 'rgba(212,175,55,0.16)',
  gold: '#D4AF37', goldBright: '#E8C65A', cream: '#FAF8F0', dim: '#B8B3A8', muted: '#8E897E',
  green: '#6BBF7F', coral: '#E07060',
}

const CSS = `
.kp-root { background: ${C.bg}; color: ${C.cream}; min-height: 100vh; font-family: var(--sans); -webkit-font-smoothing: antialiased; overflow-x: hidden; }
.kp-root a { color: inherit; }
.kp-wrap { max-width: 760px; margin: 0 auto; padding: 0 18px; }
.kp-mono { font-family: var(--mono); letter-spacing: 2px; text-transform: uppercase; font-size: 10px; }
.kp-serif { font-family: var(--serif); }
.kp-card { background: ${C.surface}; border: 0.5px solid ${C.line}; border-radius: 22px; backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); position: relative; overflow: hidden; }
.kp-card::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 45%); pointer-events: none; }
.kp-section { padding: 56px 0 8px; scroll-margin-top: 64px; }
.kp-h2 { font-family: var(--serif); font-weight: 400; font-size: 34px; line-height: 1.08; margin: 8px 0 22px; letter-spacing: -0.5px; }
.kp-h2 i { color: ${C.gold}; }
.kp-reveal { opacity: 0; transform: translateY(26px); transition: opacity .7s ease, transform .7s cubic-bezier(.2,.8,.2,1); }
.kp-reveal.kp-in { opacity: 1; transform: none; }
.kp-btn { border: 0.5px solid rgba(212,175,55,0.45); background: rgba(212,175,55,0.1); color: ${C.goldBright}; border-radius: 999px; padding: 11px 18px; font-family: var(--mono); font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; cursor: pointer; transition: transform .15s ease, background .2s ease; }
.kp-btn:active { transform: scale(0.96); }
.kp-btn:hover { background: rgba(212,175,55,0.2); }
.kp-chip { display: inline-flex; align-items: center; gap: 8px; padding: 7px 13px; border-radius: 999px; border: 0.5px solid ${C.line}; background: rgba(11,20,16,0.6); font-family: var(--mono); font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: ${C.dim}; }
.kp-dot { width: 7px; height: 7px; border-radius: 50%; background: ${C.green}; box-shadow: 0 0 0 0 rgba(107,191,127,0.6); animation: kp-pulse 2s infinite; }
@keyframes kp-pulse { 0% { box-shadow: 0 0 0 0 rgba(107,191,127,0.55) } 70% { box-shadow: 0 0 0 9px rgba(107,191,127,0) } 100% { box-shadow: 0 0 0 0 rgba(107,191,127,0) } }
@keyframes kp-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }
@keyframes kp-shine { from { background-position: -200% 0 } to { background-position: 200% 0 } }
.kp-shine { background: linear-gradient(90deg, ${C.gold} 0%, #FFF3C4 45%, ${C.gold} 55%, ${C.gold} 100%); background-size: 200% 100%; -webkit-background-clip: text; background-clip: text; color: transparent; animation: kp-shine 6s linear infinite; }
.kp-nav { position: sticky; top: 0; z-index: 40; background: rgba(11,20,16,0.82); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); border-bottom: 0.5px solid ${C.line}; }
.kp-nav-inner { display: flex; gap: 6px; overflow-x: auto; padding: 10px 14px; padding-top: calc(10px + var(--safe-top)); scrollbar-width: none; max-width: 760px; margin: 0 auto; }
.kp-nav-inner::-webkit-scrollbar { display: none; }
.kp-nav a { flex: none; text-decoration: none; padding: 7px 12px; border-radius: 999px; font-family: var(--mono); font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: ${C.muted}; transition: all .2s ease; }
.kp-nav a.kp-active { color: ${C.bg}; background: ${C.gold}; }
.kp-scroll-x { display: flex; gap: 12px; overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: 6px; scrollbar-width: none; }
.kp-scroll-x::-webkit-scrollbar { display: none; }
.kp-scroll-x > * { scroll-snap-align: start; flex: none; }
.kp-flip { perspective: 900px; cursor: pointer; }
.kp-flip-inner { position: relative; transition: transform .6s cubic-bezier(.2,.8,.2,1); transform-style: preserve-3d; height: 100%; }
.kp-flip.kp-flipped .kp-flip-inner { transform: rotateY(180deg); }
.kp-face { position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; border-radius: 20px; }
.kp-back { transform: rotateY(180deg); }
.kp-range { width: 100%; accent-color: ${C.gold}; }
.kp-team-enter { animation: kp-team .55s cubic-bezier(.2,.8,.2,1) both; }
@keyframes kp-team { from { opacity: 0; transform: translateY(14px) scale(.96) } to { opacity: 1; transform: none } }
.kp-ticker { display: inline-block; min-width: 2ch; text-align: center; }
@media (min-width: 700px) { .kp-h2 { font-size: 44px; } }
`

// ─── Helpers ──────────────────────────────────────────────────────
function useNow(ms = 1000) {
  // Start at 0 so server and first client render match (no hydration mismatch)
  const [now, setNow] = useState(0)
  useEffect(() => {
    setNow(Date.now())
    const t = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(t)
  }, [ms])
  return now
}

function diffParts(target, now) {
  const d = Math.max(0, new Date(target).getTime() - now)
  return {
    total: d,
    days: Math.floor(d / 86400000),
    hours: Math.floor(d / 3600000) % 24,
    mins: Math.floor(d / 60000) % 60,
    secs: Math.floor(d / 1000) % 60,
  }
}

const kr = n => Math.round(n).toLocaleString('sv-SE') + ' kr'
const fmtHcp = h => (h == null ? '–' : (Number(h) < 0 ? '+' + Math.abs(Number(h)).toFixed(1) : Number(h).toFixed(1)).replace('.', ','))

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.kp-reveal')
    if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('kp-in')); return }
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('kp-in'); io.unobserve(e.target) } })
    }, { threshold: 0.12 })
    els.forEach(e => io.observe(e))
    return () => io.disconnect()
  }, [])
}

function Eyebrow({ n, children }) {
  return <div className="kp-mono" style={{ color: C.gold }}>{n ? `No. ${n} — ` : ''}{children}</div>
}

// ─── Main component ───────────────────────────────────────────────
export default function Konopiste() {
  const now = useNow(1000)
  const [players, setPlayers] = useState(FALLBACK_PLAYERS)
  const [tasks, setTasks] = useState({})
  const [me, setMe] = useState(null)
  const [active, setActive] = useState('start')
  const [mapOpen, setMapOpen] = useState(false)

  useReveal()

  // Players (live from Supabase)
  useEffect(() => {
    if (!supabase) return
    supabase.from('inv_players').select('key,name,nickname,hcp,image_url,roast').in('key', PLAYER_KEYS)
      .then(({ data }) => {
        if (data && data.length) {
          const byKey = Object.fromEntries(data.map(p => [p.key, p]))
          setPlayers(PLAYER_KEYS.map(k => ({ ...FALLBACK_PLAYERS.find(f => f.key === k), ...(byKey[k] || {}) })))
        }
      })
  }, [])

  // Shared checklist (live)
  const loadTasks = () => {
    if (!supabase) return
    supabase.from('konopiste_tasks').select('*').then(({ data }) => {
      const m = {}
      ;(data || []).forEach(r => { m[`${r.player_key}:${r.item}`] = r.done })
      setTasks(m)
    })
  }
  useEffect(() => {
    try { setMe(localStorage.getItem('kp_me')) } catch (e) {}
    loadTasks()
    if (!supabase) return
    const ch = supabase.channel('kp-tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'konopiste_tasks' }, loadTasks)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  const toggleTask = async (item) => {
    if (!me) return
    const k = `${me}:${item}`
    const next = !tasks[k]
    setTasks(t => ({ ...t, [k]: next }))
    if (next && navigator.vibrate) navigator.vibrate(30)
    if (supabase) {
      await supabase.from('konopiste_tasks').upsert({ player_key: me, item, done: next, updated_at: new Date().toISOString() })
    }
  }

  const chooseMe = (key) => {
    setMe(key)
    try { localStorage.setItem('kp_me', key) } catch (e) {}
  }

  // Active nav section
  useEffect(() => {
    const ids = ['start', 'live', 'faltet', 'program', 'format', 'resorten', 'filmer', 'flyg', 'pengar', 'laxa']
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id) })
    }, { rootMargin: '-40% 0px -55% 0px' })
    ids.forEach(id => { const el = document.getElementById(id); if (el) io.observe(el) })
    return () => io.disconnect()
  }, [])

  const tee = diffParts(FIRST_TEE, now)
  const bookBy = diffParts(BOOK_BY, now)
  const onTrip = !!now && now >= new Date(TRIP_START).getTime() && now <= new Date(TRIP_END).getTime()

  const nav = [
    ['start', 'Start'], ['live', 'Live'], ['faltet', 'Fältet'], ['program', 'Program'], ['format', 'Format'],
    ['resorten', 'Resorten'], ['filmer', 'Filmer'], ['flyg', 'Flyg'], ['pengar', 'Pengar'], ['laxa', 'Läxan'],
  ]

  return (
    <div className="kp-root">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ── HERO ── */}
      <header id="start" style={{ position: 'relative', minHeight: '92vh', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(/konopiste/hero.webp)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <HeroVideo />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(11,20,16,0.35) 0%, rgba(11,20,16,0.25) 35%, rgba(11,20,16,0.92) 82%, #0B1410 100%)' }} />
        <a href="/" className="kp-chip" style={{ position: 'absolute', top: 'calc(16px + var(--safe-top))', left: 16, textDecoration: 'none', zIndex: 3 }}>← Appen</a>
        <div className="kp-wrap" style={{ position: 'relative', zIndex: 2, width: '100%', paddingBottom: 44 }}>
          <div className="kp-mono" style={{ color: 'rgba(250,248,240,0.6)', marginBottom: 14 }}>Douche Invitational Only · presenterar</div>
          <h1 className="kp-serif" style={{ fontWeight: 300, fontSize: 'clamp(72px, 19vw, 150px)', lineHeight: 0.9, margin: 0, letterSpacing: -3 }}>
            DIO <span className="kp-shine">2027</span>
          </h1>
          <div className="kp-serif" style={{ fontStyle: 'italic', fontSize: 'clamp(28px, 7vw, 44px)', color: C.gold, margin: '10px 0 14px' }}>Konopiště Edition</div>
          <div style={{ fontSize: 15, color: C.dim, marginBottom: 26 }}>6–9 maj 2027 · Golf & Spa Resort Konopiště, Tjeckien</div>

          <div className="kp-card" style={{ padding: '18px 16px 16px' }}>
            <div className="kp-mono" style={{ color: C.muted, marginBottom: 10 }}>{onTrip ? 'Vi är på plats' : 'Till första utslag · R1 Radecký'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, textAlign: 'center' }}>
              {[['dagar', tee.days], ['tim', tee.hours], ['min', tee.mins], ['sek', tee.secs]].map(([l, v]) => (
                <div key={l}>
                  <div className="kp-serif" style={{ fontSize: 'clamp(34px, 10vw, 52px)', fontWeight: 300, color: C.cream, fontVariantNumeric: 'tabular-nums' }}>{now ? String(v).padStart(l === 'dagar' ? 1 : 2, '0') : '–'}</div>
                  <div className="kp-mono" style={{ color: C.gold, fontSize: 9 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
            <span className="kp-chip">108 hål</span>
            <span className="kp-chip">8 spelare</span>
            <span className="kp-chip">1 slott</span>
            <span className="kp-chip">0 ursäkter</span>
          </div>
        </div>
      </header>

      {/* ── NAV ── */}
      <nav className="kp-nav">
        <div className="kp-nav-inner">
          {nav.map(([id, l]) => <a key={id} href={`#${id}`} className={active === id ? 'kp-active' : ''}>{l}</a>)}
        </div>
      </nav>

      <main className="kp-wrap">
        {/* ── STATUS ── */}
        <section className="kp-section kp-reveal" style={{ paddingTop: 32 }}>
          <div className="kp-card" style={{ padding: 18 }}>
            <div className="kp-mono" style={{ color: C.gold, marginBottom: 12 }}>Status för resan</div>
            {STATUS.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '8px 0', borderTop: i ? `0.5px solid ${C.line}` : 'none' }}>
                <div style={{ width: 20, height: 20, borderRadius: 10, flex: 'none', marginTop: 1, display: 'grid', placeItems: 'center', fontSize: 11, background: s.done ? C.green : 'transparent', border: s.done ? 'none' : `1px dashed ${C.muted}`, color: C.bg }}>{s.done ? '✓' : ''}</div>
                <div style={{ flex: 1, fontSize: 14, color: s.done ? C.cream : C.dim }}>{s.text}</div>
                <div className="kp-mono" style={{ color: s.done ? C.muted : C.gold, fontSize: 9, marginTop: 3 }}>{s.date}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── LIVE ── */}
        <section id="live" className="kp-section">
          <div className="kp-reveal">
            <Eyebrow n="01">Konopiště just nu</Eyebrow>
            <h2 className="kp-h2">Live från hål 10. <i>Så ser det ut idag.</i></h2>
          </div>
          <LiveBlock />
        </section>

        {/* ── FÄLTET ── */}
        <section id="faltet" className="kp-section">
          <div className="kp-reveal">
            <Eyebrow n="02">Startfältet</Eyebrow>
            <h2 className="kp-h2">Åtta spelare. <i>En buckla.</i></h2>
            <p style={{ color: C.dim, fontSize: 14, margin: '-8px 0 18px' }}>Tryck på ett kort för att vända det. Hcp hämtas live från appen.</p>
          </div>
          <div className="kp-reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            {players.map(p => <PlayerCard key={p.key} p={p} />)}
          </div>
          <TeamDraw players={players} />
        </section>

        {/* ── PROGRAM ── */}
        <section id="program" className="kp-section">
          <div className="kp-reveal">
            <Eyebrow n="03">Programmet</Eyebrow>
            <h2 className="kp-h2">18 + 36 + 36 + 18. <i>Sömn är valfritt.</i></h2>
          </div>
          <Program now={now} />
        </section>

        {/* ── FORMAT ── */}
        <section id="format" className="kp-section">
          <div className="kp-reveal">
            <Eyebrow n="04">Formatet</Eyebrow>
            <h2 className="kp-h2">Rummet är laget. <i>Välj rumskompis med omsorg.</i></h2>
          </div>
          <Rounds />
          <div className="kp-reveal" style={{ marginTop: 26 }}>
            <div className="kp-mono" style={{ color: C.gold, marginBottom: 12 }}>Det står på spel</div>
            <div className="kp-scroll-x">
              {PRIZES.map((p, i) => (
                <div key={p.name} className="kp-card" style={{ width: 210, padding: 18 }}>
                  <div style={{ fontSize: 32, animation: `kp-float 3.4s ease-in-out ${i * 0.3}s infinite` }}>{p.icon}</div>
                  <div className="kp-serif" style={{ fontSize: 24, margin: '10px 0 6px', color: C.cream }}>{p.name}</div>
                  <div style={{ fontSize: 13, lineHeight: 1.5, color: C.dim }}>{p.desc}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="kp-reveal kp-card" style={{ padding: 18, marginTop: 14 }}>
            <div className="kp-mono" style={{ color: C.gold, marginBottom: 8 }}>Sidospelet</div>
            <div style={{ fontSize: 14, lineHeight: 1.6, color: C.dim }}>Even Steven, H2H-bets, prop bets och odds med bank, precis som på Hooks. <span style={{ color: C.cream }}>Flest bollar i vattnet? Först i baren? Vem missar flyget?</span></div>
          </div>
        </section>

        {/* ── RESORTEN ── */}
        <section id="resorten" className="kp-section">
          <div className="kp-reveal">
            <Eyebrow n="05">Resorten</Eyebrow>
            <h2 className="kp-h2">Ett slott, två mästerskapsbanor <i>och ingenstans att gömma sig.</i></h2>
          </div>
          <div className="kp-reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <CourseCard name="Radecký" lines={['18 hål · par 72', 'Öppnad 2002', 'Öppen och kuperad, blinda hål och vind', 'Spelas R1, R3 och R4']} />
            <CourseCard name="d’Este" lines={['18 hål · par 72', 'Uppkallad efter Franz Ferdinand d’Este, slottets gamla ägare', 'Spelas R2, R5 och R6']} />
          </div>
          <div className="kp-reveal kp-card" style={{ marginTop: 12, padding: 0, cursor: 'zoom-in' }} onClick={() => setMapOpen(true)}>
            <img src="/konopiste/resort-map.webp" alt="Karta över Golf Resort Konopiště med hotell, restauranger och banor" style={{ width: '100%', display: 'block' }} />
            <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="kp-mono" style={{ color: C.dim }}>Områdeskarta</div>
              <div className="kp-mono" style={{ color: C.gold }}>Tryck för att zooma</div>
            </div>
          </div>
          <div className="kp-reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 12 }}>
            {[['135', 'dubbelrum'], ['2', 'restauranger'], ['40 km', 'till Prag']].map(([n, l]) => (
              <div key={l} className="kp-card" style={{ padding: '14px 10px', textAlign: 'center' }}>
                <div className="kp-serif" style={{ fontSize: 28, color: C.gold }}>{n}</div>
                <div className="kp-mono" style={{ color: C.muted, fontSize: 9 }}>{l}</div>
              </div>
            ))}
          </div>
          <p className="kp-reveal" style={{ color: C.dim, fontSize: 14, lineHeight: 1.6, marginTop: 14 }}>Steak House och slottsrestaurangen på plats, spa och pool till ryggarna efter 36 hål. Konopiště slott ligger ett par kilometer bort.</p>
        </section>

        {/* ── FILMER ── */}
        <section id="filmer" className="kp-section">
          <div className="kp-reveal">
            <Eyebrow n="06">Filmer</Eyebrow>
            <h2 className="kp-h2">Lite förhandstitt. <i>Inklusive en svensk.</i></h2>
          </div>
          <div className="kp-reveal"><VideoLite id={HERO_VIDEO} title="Golf & Spa Resort Konopiště" /></div>
          <div className="kp-reveal kp-scroll-x" style={{ marginTop: 12 }}>
            {VIDEOS.map(v => <ShortCard key={v.id} v={v} />)}
          </div>
        </section>

        {/* ── FLYG ── */}
        <section id="flyg" className="kp-section">
          <div className="kp-reveal">
            <Eyebrow n="07">Flyget</Eyebrow>
            <h2 className="kp-h2">6 maj är Kristi himmelfärd. <i>Boka senast 15 december.</i></h2>
          </div>
          <div className="kp-reveal kp-card" style={{ padding: 18, borderColor: 'rgba(224,112,96,0.35)' }}>
            <div className="kp-mono" style={{ color: C.coral, marginBottom: 6 }}>Bokningsfönstret stänger om</div>
            <div className="kp-serif" style={{ fontSize: 44, fontWeight: 300 }}>
              {!now ? '–' : bookBy.total > 0 ? <>{bookBy.days} <span style={{ fontSize: 20, color: C.dim }}>dagar</span> {bookBy.hours} <span style={{ fontSize: 20, color: C.dim }}>tim</span></> : 'Nu är det bråttom'}
            </div>
            <div style={{ fontSize: 14, color: C.dim, marginTop: 8, lineHeight: 1.6 }}>Hela Sverige är ledigt den helgen. Ut torsdag morgon, landa senast ca 11:00. Hem söndag, avgång tidigast 16:00. Lägg till golfbagen direkt.</div>
          </div>
          <div className="kp-reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 12 }}>
            <div className="kp-card" style={{ padding: 18 }}>
              <div className="kp-serif" style={{ fontSize: 22, fontStyle: 'italic', marginBottom: 6 }}>Arlanda, 7 st</div>
              <div style={{ fontSize: 14, color: C.dim, lineHeight: 1.6 }}>Direktflyg ARN → PRG med SAS, Norwegian och Eurowings. Ca 1 h 55 min.</div>
            </div>
            <div className="kp-card" style={{ padding: 18 }}>
              <div className="kp-serif" style={{ fontSize: 22, fontStyle: 'italic', marginBottom: 6 }}>Landvetter, Martin</div>
              <div style={{ fontSize: 14, color: C.dim, lineHeight: 1.6 }}>Ryanair har flugit GOT → PRG några dagar i veckan. Kolla att linjen går i maj 2027, annars via Köpenhamn eller Arlanda.</div>
            </div>
          </div>
          <div className="kp-reveal" style={{ marginTop: 12 }}>
            {LINKS.map(g => (
              <div key={g.group} style={{ marginTop: 14 }}>
                <div className="kp-mono" style={{ color: C.muted, marginBottom: 8 }}>{g.group}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {g.items.map(l => <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="kp-btn" style={{ textDecoration: 'none' }}>{l.label} ↗</a>)}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── PENGAR ── */}
        <section id="pengar" className="kp-section">
          <div className="kp-reveal">
            <Eyebrow n="08">Pengarna</Eyebrow>
            <h2 className="kp-h2">Vad det kostar. <i>Dra i reglagen.</i></h2>
          </div>
          <Budget />
        </section>

        {/* ── LÄXAN ── */}
        <section id="laxa" className="kp-section">
          <div className="kp-reveal">
            <Eyebrow n="09">Läxan</Eyebrow>
            <h2 className="kp-h2">Tre saker <i>före 15 december.</i></h2>
            <p style={{ color: C.dim, fontSize: 14, margin: '-8px 0 18px' }}>Välj vem du är och bocka av. Alla ser allas status live, så ingen kan gömma sig.</p>
          </div>
          <Checklist players={players} tasks={tasks} me={me} chooseMe={chooseMe} toggleTask={toggleTask} />
        </section>

        <footer style={{ padding: '70px 0 calc(60px + var(--safe-bottom))', textAlign: 'center' }}>
          <div className="kp-serif" style={{ fontSize: 40, fontWeight: 300 }}>Vi ses på första tee.</div>
          <div className="kp-serif" style={{ fontStyle: 'italic', color: C.gold, fontSize: 20, marginTop: 8 }}>Ingen mulligan på flygbokningen.</div>
          <div className="kp-mono" style={{ color: 'rgba(250,248,240,0.2)', marginTop: 28, fontSize: 9 }}>Powered by chaos</div>
        </footer>
      </main>

      {mapOpen && (
        <div onClick={() => setMapOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(5,10,8,0.95)', overflow: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div className="kp-mono" style={{ position: 'sticky', top: 0, left: 0, padding: 'calc(14px + var(--safe-top)) 16px 14px', color: C.gold, background: 'rgba(5,10,8,0.8)' }}>Tryck för att stänga · nyp för att zooma</div>
          <img src="/konopiste/resort-map.webp" alt="Områdeskarta i full storlek" style={{ width: '180%', maxWidth: 'none', display: 'block' }} />
        </div>
      )}
    </div>
  )
}

// ─── Sub components ───────────────────────────────────────────────
function HeroVideo() {
  const [ok, setOk] = useState(false)
  useEffect(() => {
    // Skip autoplay video if user prefers reduced motion or saves data
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const save = navigator.connection && navigator.connection.saveData
    if (!reduce && !save) setOk(true)
  }, [])
  if (!ok) return null
  const src = `https://www.youtube-nocookie.com/embed/${HERO_VIDEO}?autoplay=1&mute=1&loop=1&playlist=${HERO_VIDEO}&controls=0&playsinline=1&modestbranding=1&rel=0&showinfo=0&disablekb=1&iv_load_policy=3`
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      <iframe
        title="Golf & Spa Resort Konopiště"
        src={src}
        allow="autoplay; encrypted-media"
        style={{ position: 'absolute', top: '50%', left: '50%', width: 'max(100vw, 177.78vh)', height: 'max(56.25vw, 100vh)', transform: 'translate(-50%, -50%) scale(1.15)', border: 0 }}
      />
    </div>
  )
}

function LiveBlock() {
  const now = useNow(60000)
  const [wx, setWx] = useState(null)
  const [camOk, setCamOk] = useState(true)
  useEffect(() => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${RESORT.lat}&longitude=${RESORT.lon}&current=temperature_2m,wind_speed_10m,weather_code&wind_speed_unit=ms&timezone=Europe%2FPrague`
    if (!now) return
    fetch(url).then(r => r.json()).then(d => setWx(d.current)).catch(() => {})
  }, [Math.floor(now / 600000)])
  const w = wx ? (WEATHER[wx.weather_code] || ['🌡️', 'Väder']) : null
  const local = !now ? '…' : new Date(now).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Prague' })
  return (
    <div className="kp-reveal kp-card" style={{ padding: 0 }}>
      {camOk ? (
        <div style={{ position: 'relative', aspectRatio: '720 / 576', background: '#111' }}>
          <img
            src={now ? `${WEBCAM}?t=${Math.floor(now / 60000)}` : WEBCAM}
            alt="Livebild från webbkameran vid hål 10 på Konopiště"
            onError={() => setCamOk(false)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          <div className="kp-chip" style={{ position: 'absolute', top: 12, left: 12 }}><span className="kp-dot" /> Live · hål 10</div>
        </div>
      ) : (
        <div style={{ padding: 24, color: C.dim, fontSize: 14 }}>Webbkameran svarar inte just nu.</div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', padding: '14px 8px' }}>
        <Stat label="Lokal tid" value={local} />
        <Stat label={w ? w[1] : 'Väder'} value={wx ? `${w[0]} ${Math.round(wx.temperature_2m)}°` : '…'} />
        <Stat label="Vind" value={wx ? `${Math.round(wx.wind_speed_10m)} m/s` : '…'} />
      </div>
      <div className="kp-mono" style={{ color: C.muted, fontSize: 9, padding: '0 16px 14px', textAlign: 'center' }}>Bilden uppdateras varje minut · väder från Open-Meteo</div>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div className="kp-serif" style={{ fontSize: 24, color: C.cream }}>{value}</div>
      <div className="kp-mono" style={{ color: C.gold, fontSize: 9, marginTop: 2 }}>{label}</div>
    </div>
  )
}

function PlayerCard({ p }) {
  const [flipped, setFlipped] = useState(false)
  const initials = (p.name || '?').split(' ').map(s => s[0]).join('').slice(0, 2)
  return (
    <div className={`kp-flip${flipped ? ' kp-flipped' : ''}`} style={{ height: 230 }} onClick={() => setFlipped(f => !f)}>
      <div className="kp-flip-inner">
        <div className="kp-face kp-card" style={{ padding: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          {p.image_url
            ? <img src={p.image_url} alt={p.name} style={{ width: 84, height: 84, borderRadius: '50%', objectFit: 'cover', border: `1.5px solid ${C.gold}` }} />
            : <div style={{ width: 84, height: 84, borderRadius: '50%', display: 'grid', placeItems: 'center', border: `1.5px solid ${C.gold}`, fontFamily: 'var(--serif)', fontSize: 30, color: C.gold }}>{initials}</div>}
          <div className="kp-serif" style={{ fontSize: 19, marginTop: 10, color: C.cream, fontStyle: 'italic' }}>{p.nickname}</div>
          <div style={{ fontSize: 12, color: C.dim, marginTop: 2 }}>{p.name}</div>
          <div style={{ marginTop: 'auto', display: 'flex', gap: 6 }}>
            <span className="kp-chip" style={{ padding: '4px 9px', fontSize: 9 }}>hcp {fmtHcp(p.hcp)}</span>
            <span className="kp-chip" style={{ padding: '4px 9px', fontSize: 9 }}>{FROM[p.key] || 'Arlanda'}</span>
          </div>
        </div>
        <div className="kp-face kp-back kp-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className="kp-mono" style={{ color: C.gold, fontSize: 9, marginBottom: 10 }}>Scoutrapport</div>
          <div className="kp-serif" style={{ fontSize: 17, lineHeight: 1.35, color: C.cream, fontStyle: 'italic' }}>
            {p.roast || (p.key === 'marten' ? 'Plushcp och gäst. Ska hållas ödmjuk med alla medel.' : 'Rookie på DIO. Okänd form, okänd risk.')}
          </div>
        </div>
      </div>
    </div>
  )
}

function TeamDraw({ players }) {
  const [teams, setTeams] = useState(null)
  const [round, setRound] = useState(0)
  const draw = () => {
    const ps = players.map(p => ({ ...p, h: Number(p.hcp) || 0 }))
    let best = []
    for (let i = 0; i < 300; i++) {
      const s = [...ps].sort(() => Math.random() - 0.5)
      const t = [[s[0], s[1]], [s[2], s[3]], [s[4], s[5]], [s[6], s[7]]]
      const sums = t.map(x => x[0].h + x[1].h)
      const spread = Math.max(...sums) - Math.min(...sums)
      best.push({ t, spread })
    }
    best.sort((a, b) => a.spread - b.spread)
    const pick = best[Math.floor(Math.random() * 6)]
    setTeams(pick.t)
    setRound(r => r + 1)
    if (navigator.vibrate) navigator.vibrate([20, 40, 20])
  }
  return (
    <div className="kp-reveal kp-card" style={{ padding: 18, marginTop: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div className="kp-mono" style={{ color: C.gold }}>Provdragning av lagen</div>
          <div style={{ fontSize: 13, color: C.dim, marginTop: 4 }}>Den riktiga dragningen sker torsdag kväll. Det här är bara för att börja tjafsa.</div>
        </div>
        <button className="kp-btn" onClick={draw}>{teams ? 'Dra igen' : 'Dra lag'} 🎲</button>
      </div>
      {teams && (
        <div key={round} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginTop: 16 }}>
          {teams.map((t, i) => (
            <div key={i} className="kp-team-enter" style={{ animationDelay: `${i * 110}ms`, border: `0.5px solid ${C.line}`, borderRadius: 16, padding: 12, background: 'rgba(212,175,55,0.05)' }}>
              <div className="kp-mono" style={{ color: C.gold, fontSize: 9 }}>Rum {i + 1} · hcp {fmtHcp(t[0].h + t[1].h)}</div>
              {t.map(p => <div key={p.key} className="kp-serif" style={{ fontSize: 17, marginTop: 6, fontStyle: 'italic' }}>{p.nickname}</div>)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Program({ now }) {
  const todayIso = new Date(now).toLocaleDateString('sv-SE', { timeZone: 'Europe/Prague' })
  const initial = DAYS.find(d => d.iso === todayIso)?.id || 'tor'
  const [day, setDay] = useState('tor')
  const jumped = useRef(false)
  useEffect(() => { if (now && !jumped.current) { jumped.current = true; setDay(initial) } }, [now, initial])
  const d = DAYS.find(x => x.id === day)
  const nowHm = new Date(now).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Prague' })
  const isToday = d.iso === todayIso
  const nextIdx = isToday ? d.items.findIndex(it => it[0] >= nowHm) : -1
  return (
    <div className="kp-reveal">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 12 }}>
        {DAYS.map(x => (
          <button key={x.id} onClick={() => setDay(x.id)} style={{
            cursor: 'pointer', borderRadius: 16, padding: '12px 4px', textAlign: 'center',
            border: `0.5px solid ${x.id === day ? C.gold : C.line}`,
            background: x.id === day ? 'rgba(212,175,55,0.14)' : 'rgba(19,29,22,0.6)', color: C.cream, transition: 'all .2s ease',
          }}>
            <div className="kp-serif" style={{ fontSize: 20 }}>{x.label}</div>
            <div className="kp-mono" style={{ color: x.id === day ? C.gold : C.muted, fontSize: 9 }}>{x.date}</div>
          </button>
        ))}
      </div>
      <div key={day} className="kp-card kp-team-enter" style={{ padding: 18 }}>
        <div className="kp-serif" style={{ fontSize: 26, fontStyle: 'italic', marginBottom: 10 }}>{d.title}</div>
        {d.items.map(([t, txt, key], i) => (
          <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'baseline', padding: '10px 0', borderTop: i ? `0.5px solid ${C.line}` : 'none' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: key ? C.gold : C.muted, width: 48, flex: 'none' }}>{t}</div>
            <div style={{ fontSize: 15, color: key ? C.cream : C.dim, fontWeight: key ? 600 : 400, flex: 1 }}>{key ? '⛳ ' : ''}{txt}</div>
            {i === nextIdx && <span className="kp-chip" style={{ padding: '3px 8px', fontSize: 8 }}><span className="kp-dot" />Nästa</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

function Rounds() {
  const [open, setOpen] = useState(null)
  return (
    <div className="kp-reveal" style={{ display: 'grid', gap: 8 }}>
      {ROUNDS.map((r, i) => (
        <div key={r.r} className="kp-card" style={{ padding: 0, cursor: 'pointer' }} onClick={() => setOpen(open === i ? null : i)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px' }}>
            <div className="kp-serif" style={{ fontSize: 26, color: C.gold, width: 40 }}>{r.r}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, color: C.cream, fontWeight: 600 }}>{r.format}</div>
              <div className="kp-mono" style={{ color: C.muted, fontSize: 9, marginTop: 3 }}>{r.day} · {r.course}</div>
            </div>
            <div style={{ color: C.gold, transition: 'transform .25s ease', transform: open === i ? 'rotate(45deg)' : 'none', fontSize: 20 }}>+</div>
          </div>
          <div style={{ maxHeight: open === i ? 120 : 0, overflow: 'hidden', transition: 'max-height .35s ease' }}>
            <div style={{ padding: '0 16px 14px 70px', fontSize: 14, color: C.dim, lineHeight: 1.55 }}>
              {r.note}<br /><span style={{ color: C.gold }}>Räknas till: {r.counts}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function CourseCard({ name, lines }) {
  return (
    <div className="kp-card" style={{ padding: 18 }}>
      <div className="kp-serif" style={{ fontSize: 30, color: C.gold }}>{name}</div>
      {lines.map((l, i) => <div key={i} style={{ fontSize: 14, color: i ? C.dim : C.cream, marginTop: 6, lineHeight: 1.5 }}>{l}</div>)}
    </div>
  )
}

function VideoLite({ id, title }) {
  const [play, setPlay] = useState(false)
  return (
    <div className="kp-card" style={{ padding: 0, aspectRatio: '16 / 9' }}>
      {play ? (
        <iframe title={title} src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1&rel=0`} allow="autoplay; encrypted-media; fullscreen" allowFullScreen style={{ width: '100%', height: '100%', border: 0, display: 'block' }} />
      ) : (
        <button onClick={() => setPlay(true)} aria-label={`Spela ${title}`} style={{ all: 'unset', cursor: 'pointer', position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', backgroundImage: `linear-gradient(180deg, rgba(11,20,16,0.1), rgba(11,20,16,0.7)), url(https://i.ytimg.com/vi/${id}/maxresdefault.jpg)`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <span style={{ width: 68, height: 68, borderRadius: '50%', background: 'rgba(212,175,55,0.92)', display: 'grid', placeItems: 'center', color: C.bg, fontSize: 24, paddingLeft: 4, boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>▶</span>
          <span className="kp-mono" style={{ position: 'absolute', left: 16, bottom: 14, color: C.cream }}>{title}</span>
        </button>
      )}
    </div>
  )
}

function ShortCard({ v }) {
  const [play, setPlay] = useState(false)
  return (
    <div className="kp-card" style={{ width: 170, aspectRatio: '9 / 16', padding: 0 }}>
      {play ? (
        <iframe title={v.title} src={`https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&playsinline=1&rel=0`} allow="autoplay; encrypted-media; fullscreen" allowFullScreen style={{ width: '100%', height: '100%', border: 0, display: 'block' }} />
      ) : (
        <button onClick={() => setPlay(true)} aria-label={`Spela ${v.title}`} style={{ all: 'unset', cursor: 'pointer', position: 'absolute', inset: 0, backgroundImage: `linear-gradient(180deg, transparent 50%, rgba(11,20,16,0.85)), url(https://i.ytimg.com/vi/${v.id}/hqdefault.jpg)`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <span style={{ position: 'absolute', top: 12, right: 12, width: 34, height: 34, borderRadius: '50%', background: 'rgba(212,175,55,0.9)', display: 'grid', placeItems: 'center', color: C.bg, fontSize: 13, paddingLeft: 2 }}>▶</span>
          <span style={{ position: 'absolute', left: 12, right: 12, bottom: 12, fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 16, color: C.cream }}>{v.title}</span>
        </button>
      )}
    </div>
  )
}

function Budget() {
  const [flight, setFlight] = useState(4000)
  const [pack, setPack] = useState('stay')
  const [hotel, setHotel] = useState(2500)
  const [stay, setStay] = useState(6500)
  const [dinner, setDinner] = useState(650)
  const [bar, setBar] = useState(1500)
  const transfer = 450
  const greenfeeSek = 540 * EUR_SEK
  const golfHotel = pack === 'stay' ? stay : hotel + greenfeeSek
  const total = flight + golfHotel + transfer + dinner * 3 + bar
  const rows = [
    ['Flyg t/r + golfbag', flight],
    [pack === 'stay' ? 'Stay & Play (boende, frukost, fri golf, spa)' : `Hotell + greenfee (540 € ≈ ${kr(greenfeeSek)})`, golfHotel],
    ['Transfer t/r', transfer],
    ['Middagar x 3', dinner * 3],
    ['Bar & bets', bar],
  ]
  return (
    <div className="kp-reveal kp-card" style={{ padding: 18 }}>
      <div style={{ textAlign: 'center', padding: '6px 0 18px' }}>
        <div className="kp-mono" style={{ color: C.muted }}>Per person, uppskattat</div>
        <div className="kp-serif" style={{ fontSize: 56, fontWeight: 300, color: C.gold, fontVariantNumeric: 'tabular-nums', transition: 'all .2s' }}>{kr(total)}</div>
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {[['stay', 'Stay & Play'], ['fee', 'Styckvis']].map(([k, l]) => (
          <button key={k} onClick={() => setPack(k)} style={{ flex: 1, cursor: 'pointer', padding: '10px 6px', borderRadius: 999, border: `0.5px solid ${pack === k ? C.gold : C.line}`, background: pack === k ? 'rgba(212,175,55,0.15)' : 'transparent', color: pack === k ? C.goldBright : C.dim, fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' }}>{l}</button>
        ))}
      </div>
      <Slider label="Flyg t/r" value={flight} set={setFlight} min={2000} max={7000} step={250} />
      {pack === 'stay'
        ? <Slider label="Stay & Play, 3 nätter (väntar offert)" value={stay} set={setStay} min={4000} max={10000} step={250} />
        : <Slider label="Hotell 3 nätter, delat rum" value={hotel} set={setHotel} min={1500} max={5000} step={250} />}
      <Slider label="Middag per kväll" value={dinner} set={setDinner} min={300} max={1200} step={50} />
      <Slider label="Bar & bets" value={bar} set={setBar} min={0} max={6000} step={250} hint={bar >= 4500 ? 'Marcus-nivå' : bar === 0 ? 'Ljuger du?' : null} />
      <div style={{ marginTop: 16 }}>
        {rows.map(([l, v]) => (
          <div key={l} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderTop: `0.5px solid ${C.line}`, fontSize: 13 }}>
            <span style={{ color: C.dim }}>{l}</span>
            <span style={{ color: C.cream, fontFamily: 'var(--mono)', whiteSpace: 'nowrap' }}>{kr(v)}</span>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 12, color: C.muted, marginTop: 10, lineHeight: 1.5 }}>Greenfee enligt resortens prislista: 80 € tor, 92 € fre–sön. Euro räknat som ca {EUR_SEK} kr. Offerten avgör slutsumman.</div>
    </div>
  )
}

function Slider({ label, value, set, min, max, step, hint }) {
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
        <span style={{ color: C.dim }}>{label}{hint ? <span style={{ color: C.coral }}> · {hint}</span> : ''}</span>
        <span style={{ fontFamily: 'var(--mono)', color: C.cream }}>{kr(value)}</span>
      </div>
      <input className="kp-range" type="range" min={min} max={max} step={step} value={value} onChange={e => set(Number(e.target.value))} aria-label={label} />
    </div>
  )
}

function Checklist({ players, tasks, me, chooseMe, toggleTask }) {
  const doneCount = players.reduce((n, p) => n + TASKS.filter(t => tasks[`${p.key}:${t.id}`]).length, 0)
  const pct = Math.round((doneCount / (players.length * TASKS.length)) * 100)
  const meP = players.find(p => p.key === me)
  return (
    <div className="kp-reveal">
      <div className="kp-card" style={{ padding: 18 }}>
        <div className="kp-mono" style={{ color: C.gold, marginBottom: 10 }}>{meP ? `Du är ${meP.nickname}` : 'Vem är du?'}</div>
        <div className="kp-scroll-x">
          {players.map(p => (
            <button key={p.key} onClick={() => chooseMe(p.key)} style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0, textAlign: 'center', width: 62, color: C.cream, opacity: !me || me === p.key ? 1 : 0.45, transition: 'opacity .2s' }}>
              {p.image_url
                ? <img src={p.image_url} alt={p.name} style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${me === p.key ? C.gold : 'transparent'}` }} />
                : <div style={{ width: 52, height: 52, borderRadius: '50%', margin: '0 auto', display: 'grid', placeItems: 'center', border: `2px solid ${me === p.key ? C.gold : C.line}`, fontFamily: 'var(--serif)', fontSize: 20, color: C.gold }}>{(p.name || '?')[0]}</div>}
              <div style={{ fontSize: 10, marginTop: 4, color: C.dim }}>{(p.name || '').split(' ')[0]}</div>
            </button>
          ))}
        </div>
        {meP && (
          <div style={{ marginTop: 14, display: 'grid', gap: 8 }}>
            {TASKS.map(t => {
              const done = !!tasks[`${me}:${t.id}`]
              return (
                <button key={t.id} onClick={() => toggleTask(t.id)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, border: `0.5px solid ${done ? 'rgba(107,191,127,0.5)' : C.line}`, background: done ? 'rgba(107,191,127,0.1)' : 'rgba(11,20,16,0.4)', color: C.cream, textAlign: 'left', transition: 'all .2s ease' }}>
                  <span style={{ width: 24, height: 24, borderRadius: 12, flex: 'none', display: 'grid', placeItems: 'center', background: done ? C.green : 'transparent', border: done ? 'none' : `1.5px solid ${C.muted}`, color: C.bg, fontSize: 13, transition: 'all .2s' }}>{done ? '✓' : ''}</span>
                  <span style={{ fontSize: 15, textDecoration: done ? 'line-through' : 'none', color: done ? C.dim : C.cream }}>{t.label}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="kp-card" style={{ padding: 18, marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div className="kp-mono" style={{ color: C.gold }}>Hela gänget</div>
          <div className="kp-mono" style={{ color: C.muted }}>{pct}% klart</div>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: 'rgba(250,248,240,0.08)', margin: '10px 0 14px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${C.green}, ${C.gold})`, transition: 'width .6s cubic-bezier(.2,.8,.2,1)' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(3, 52px)', gap: '8px 4px', alignItems: 'center' }}>
          <div />
          {TASKS.map(t => <div key={t.id} className="kp-mono" style={{ color: C.muted, fontSize: 8, textAlign: 'center' }}>{t.short}</div>)}
          {players.map(p => (
            <Row key={p.key} p={p} tasks={tasks} />
          ))}
        </div>
      </div>
    </div>
  )
}

function Row({ p, tasks }) {
  return (
    <>
      <div style={{ fontSize: 14, color: C.cream, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nickname}</div>
      {TASKS.map(t => {
        const done = !!tasks[`${p.key}:${t.id}`]
        return (
          <div key={t.id} style={{ textAlign: 'center' }}>
            <span style={{ display: 'inline-grid', placeItems: 'center', width: 22, height: 22, borderRadius: 11, fontSize: 12, background: done ? C.green : 'transparent', border: done ? 'none' : `1px dashed ${C.muted}`, color: C.bg, transition: 'all .3s' }} aria-label={done ? 'Klart' : 'Inte klart'}>{done ? '✓' : ''}</span>
          </div>
        )
      })}
    </>
  )
}
