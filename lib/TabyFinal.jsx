// lib/TabyFinal.jsx — TOOM-finalen 2026, add-on overlay. Isolerad fran resten av appen.
// Laser: taby_final (singleton), taby_rounds/taby_scores med event_id = final. Skriver: bara taby_final.
'use client'
import { useState } from 'react'
import { supabase } from './supabase'

const G = '#D4A017', CREAM = '#FAF8F0', MUT = 'rgba(240,244,255,0.45)', LAKE = '#93C5FD', CORAL = '#E8634A', GREEN = '#4ADE80'
const mono = { fontFamily: 'var(--mono)' }
const card = { background: 'rgba(147,197,253,0.04)', border: '0.5px solid rgba(147,197,253,0.12)', borderRadius: 14, padding: 14, marginBottom: 12 }
const lbl = { ...mono, fontSize: 8, letterSpacing: 2.5, color: 'rgba(212,160,23,0.7)', marginBottom: 8 }

const SIDE_COMPS = [
  { key: 'ld2', hole: 2, title: 'Longest drive', prize: 150, rule: 'Utslaget måste ligga på fairway.', unit: 'm' },
  { key: 'ctp4', hole: 4, title: 'Closest to pin', prize: 150, rule: 'Utslaget måste ligga på green.', unit: 'm' },
  { key: 'ctp13', hole: 13, title: 'Closest to pin – drivbar par 4', prize: 150, rule: 'Räknas om bollen stannar på green ELLER fairway. Avståndet till hålet avgör, oavsett yta. Ruff, bunker och övriga lägen räknas inte. En säker fairwayboll kan alltså vinna över en chansdrive!', unit: 'm' },
]

export default function TabyFinal({ final, players, rounds, scores, events, user, onClose, toast }) {
  const [busy, setBusy] = useState(false)
  if (!final) return null
  const ev = events.find(e => e.id === final.event_id)
  const finalRounds = rounds.filter(r => r.event_id === final.event_id)
  const finalRoundIds = new Set(finalRounds.map(r => r.id))
  const byId = Object.fromEntries(players.map(p => [p.id, p]))
  const snap = final.snapshot || []
  const preMerit = Object.fromEntries(snap.map(s => [s.player_id, s.merit_total]))

  // Finalrundans inspelade poang per spelare (vanliga poangbogeypoang, ingen boost)
  const played = {}
  scores.filter(s => finalRoundIds.has(s.round_id)).forEach(s => {
    const p = played[s.player_id] ||= { pts: 0, holes: 0, strokes: 0 }
    if (s.strokes) { p.pts += s.stableford || 0; p.holes += 1; p.strokes += s.strokes }
  })

  const rows = snap.map(s => {
    const pl = played[s.player_id] || { pts: 0, holes: 0 }
    return { ...s, player: byId[s.player_id], pts: pl.pts, holes: pl.holes, total: Math.round(((s.start || 0) + pl.pts) * 10) / 10 }
  }).sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total
    const am = a.merit_total ?? -1, bm = b.merit_total ?? -1   // sarskiljning: hogst TOOM fore finalen
    return bm - am
  })
  // Flagga lika-fall som reglerna inte tacker
  const tieFlags = []
  for (let i = 1; i < rows.length; i++) {
    const a = rows[i - 1], b = rows[i]
    if (a.total === b.total && (a.merit_total ?? null) === (b.merit_total ?? null)) tieFlags.push(`${a.player?.nickname} & ${b.player?.nickname}: lika totalpoäng (${a.total}) och lika TOOM före finalen — korthålsbanan avgör.`)
    else if (a.total === b.total && (a.merit_total == null || b.merit_total == null)) tieFlags.push(`${a.player?.nickname} & ${b.player?.nickname}: lika totalpoäng (${a.total}) men en av dem saknar TOOM-poäng före finalen — beslut krävs.`)
  }
  const anyStarted = rows.some(r => r.holes > 0)

  // Bollar
  const balls = finalRounds.map((r, i) => ({ n: i + 1, names: (r.player_ids || []).map(id => byId[id]?.nickname || '?') }))

  const save = async (patch) => {
    setBusy(true)
    const { error } = await supabase.from('taby_final').update(patch).eq('id', final.id)
    setBusy(false)
    if (error) toast?.('Kunde inte spara', 'zero')
  }

  const toggleMarcus = (pid) => {
    const used = final.marcus_used || []
    const next = used.includes(pid) ? used.filter(x => x !== pid) : [...used, pid]
    save({ marcus_used: next })
  }
  const setSide = (key, patch) => save({ side_comps: { ...(final.side_comps || {}), [key]: { ...((final.side_comps || {})[key] || {}), ...patch } } })
  const setH2H = (idx, patch) => { const h = [...(final.h2h || [])]; h[idx] = { ...h[idx], ...patch }; save({ h2h: h }) }

  const potTotal = (final.pot_per_player || 200) * snap.length
  const leader = rows[0]

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1150, background: 'linear-gradient(180deg, #0C1830 0%, #14294A 100%)', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 2, background: 'rgba(12,24,48,0.92)', backdropFilter: 'blur(12px)', borderBottom: '0.5px solid rgba(212,160,23,0.3)', padding: '14px 16px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: LAKE, fontSize: 13, cursor: 'pointer', padding: 0 }}>← Tillbaka</button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ ...mono, fontSize: 8, color: G, letterSpacing: 3 }}>🏁 TOOM-FINALEN {ev?.date ? '· ' + ev.date : ''}</div>
        </div>
        <div style={{ width: 70, textAlign: 'right', ...mono, fontSize: 9, color: anyStarted ? CORAL : MUT }}>{anyStarted ? '● LIVE' : 'EJ STARTAD'}</div>
      </div>

      <div style={{ padding: '14px 16px 60px', maxWidth: 560, margin: '0 auto' }}>

        {/* LEDARE */}
        {leader && (
          <div style={{ ...card, background: 'linear-gradient(135deg, rgba(212,160,23,0.2), rgba(20,41,74,0.4))', border: '1px solid rgba(212,160,23,0.55)' }}>
            <div style={lbl}>👑 LEDER FINALEN</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 26, color: CREAM, flex: 1 }}>{leader.player?.nickname}</div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ ...mono, fontSize: 30, fontWeight: 700, color: G, lineHeight: 1 }}>{leader.total}</div>
                <div style={{ ...mono, fontSize: 8, color: MUT, marginTop: 3 }}>{leader.start} start + {leader.pts} spelat · {leader.holes} hål</div>
              </div>
            </div>
          </div>
        )}

        {/* LIVETABELL */}
        <div style={card}>
          <div style={lbl}>LIVETABELL · POÄNGBOGEY + STARTPOÄNG</div>
          <div style={{ display: 'grid', gridTemplateColumns: '22px 1fr 44px 44px 36px 52px', gap: 4, ...mono, fontSize: 8, color: MUT, letterSpacing: 1, padding: '0 4px 6px' }}>
            <div>#</div><div>SPELARE</div><div style={{ textAlign: 'right' }}>START</div><div style={{ textAlign: 'right' }}>SPELAT</div><div style={{ textAlign: 'right' }}>HÅL</div><div style={{ textAlign: 'right' }}>TOTAL</div>
          </div>
          {rows.map((r, i) => {
            const isMe = r.player_id === user?.id
            const live = r.holes > 0 && r.holes < 18
            return (
              <div key={r.player_id} style={{ display: 'grid', gridTemplateColumns: '22px 1fr 44px 44px 36px 52px', gap: 4, alignItems: 'center', padding: '9px 4px', borderTop: '0.5px solid rgba(147,197,253,0.08)', background: isMe ? 'rgba(147,197,253,0.05)' : 'transparent', borderRadius: 6 }}>
                <div style={{ ...mono, fontSize: 12, color: i === 0 ? G : MUT, fontWeight: 700 }}>{i + 1}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: CREAM, fontWeight: i === 0 ? 700 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {r.player?.nickname || r.key} {live && <span style={{ ...mono, fontSize: 7, color: CORAL, marginLeft: 4 }}>● LIVE</span>}{r.holes === 18 && <span style={{ ...mono, fontSize: 7, color: GREEN, marginLeft: 4 }}>KLAR</span>}
                  </div>
                  <div style={{ ...mono, fontSize: 8, color: MUT }}>{r.merit_total != null ? `TOOM ${r.merit_total} (#${r.position})` : 'Gäst · ingen TOOM'}{r.player?.taby_hcp != null ? ` · HCP ${Number(r.player.taby_hcp) < 0 ? '+' + Math.abs(r.player.taby_hcp) : r.player.taby_hcp}` : ''}</div>
                </div>
                <div style={{ ...mono, fontSize: 12, color: r.start > 0 ? G : MUT, textAlign: 'right' }}>{r.start > 0 ? '+' + r.start : '0'}</div>
                <div style={{ ...mono, fontSize: 12, color: CREAM, textAlign: 'right' }}>{r.pts}</div>
                <div style={{ ...mono, fontSize: 11, color: MUT, textAlign: 'right' }}>{r.holes}/18</div>
                <div style={{ ...mono, fontSize: 16, fontWeight: 700, color: i === 0 ? G : CREAM, textAlign: 'right' }}>{r.total}</div>
              </div>
            )
          })}
          <div style={{ ...mono, fontSize: 8, color: MUT, marginTop: 10, lineHeight: 1.6 }}>
            Startpoäng = TOOM-poäng före finalen minus lägsta bland de sex ordinarie. Mårten startar på 0. Slutpoäng = start + finalrundans poängbogeypoäng. Ingen boost, alla hål ger vanliga poäng. Lika slutpoäng: högst TOOM före finalen vinner. Är även den lika (Marcus/Matthis) avgör korthålsbanan.
          </div>
          {tieFlags.length > 0 && (
            <div style={{ marginTop: 10, padding: 10, borderRadius: 10, background: 'rgba(232,99,74,0.1)', border: '0.5px solid rgba(232,99,74,0.4)' }}>
              <div style={{ ...lbl, color: CORAL }}>⛳ SÄRSKILJNING</div>
              {tieFlags.map((t, i) => <div key={i} style={{ fontSize: 11, color: CREAM, lineHeight: 1.5 }}>{t}</div>)}
            </div>
          )}
        </div>

        {/* BOLLAR + POTT */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={card}>
            <div style={lbl}>BOLLAR</div>
            {balls.length === 0
              ? <div style={{ fontSize: 11, color: MUT, lineHeight: 1.5 }}>Boll 1: Filip, Fredrik, Marcus<br />Boll 2: Matthis, Magnus, Rami, Mårten<br /><span style={{ ...mono, fontSize: 8 }}>Starta rundorna som vanligt med "🏁 The Final" valt.</span></div>
              : balls.map(b => <div key={b.n} style={{ fontSize: 11, color: CREAM, marginBottom: 4 }}><span style={{ ...mono, color: G, fontSize: 9 }}>BOLL {b.n}</span> {b.names.join(', ')}</div>)}
          </div>
          <div style={card}>
            <div style={lbl}>HUVUDPOTT</div>
            <div style={{ ...mono, fontSize: 26, fontWeight: 700, color: G, lineHeight: 1 }}>{potTotal.toLocaleString('sv-SE')} kr</div>
            <div style={{ fontSize: 10, color: MUT, marginTop: 6, lineHeight: 1.5 }}>{final.pot_per_player || 200} kr × {snap.length}. Vinnaren tar allt. Tvåan får 0 kr.<br />Sidotävlingar hålls separat.</div>
          </div>
        </div>

        {/* SIDOTÄVLINGAR */}
        <div style={card}>
          <div style={lbl}>SIDOTÄVLINGAR · 150 KR STYCK · SEPARAT FRÅN POTTEN</div>
          {SIDE_COMPS.map(sc => {
            const cur = (final.side_comps || {})[sc.key] || {}
            const w = cur.winner_id ? byId[cur.winner_id] : null
            return (
              <div key={sc.key} style={{ padding: '10px 0', borderTop: '0.5px solid rgba(147,197,253,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                  <span style={{ ...mono, fontSize: 9, color: G }}>HÅL {sc.hole}</span>
                  <span style={{ fontSize: 13, color: CREAM, fontWeight: 600, flex: 1 }}>{sc.title}</span>
                  <span style={{ ...mono, fontSize: 10, color: MUT }}>{sc.prize} kr</span>
                </div>
                <div style={{ fontSize: 10, color: MUT, lineHeight: 1.5, marginBottom: 8 }}>{sc.rule}</div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <select value={cur.winner_id || ''} disabled={busy} onChange={e => setSide(sc.key, { winner_id: e.target.value || null })}
                    style={{ flex: 1, background: 'rgba(147,197,253,0.08)', border: '1px solid rgba(147,197,253,0.2)', borderRadius: 8, color: CREAM, padding: '8px 10px', fontSize: 12 }}>
                    <option value="">— Ledare/vinnare —</option>
                    {snap.map(s => <option key={s.player_id} value={s.player_id}>{byId[s.player_id]?.nickname || s.key}</option>)}
                  </select>
                  <input type="number" step="0.01" placeholder={sc.unit} defaultValue={cur.dist ?? ''} disabled={busy}
                    onBlur={e => { const v = parseFloat(e.target.value); setSide(sc.key, { dist: isNaN(v) ? null : v }) }}
                    style={{ width: 82, background: 'rgba(147,197,253,0.08)', border: '1px solid rgba(147,197,253,0.2)', borderRadius: 8, color: CREAM, padding: '8px 10px', fontSize: 12, ...mono, textAlign: 'right' }} />
                </div>
                {w && <div style={{ ...mono, fontSize: 9, color: GREEN, marginTop: 6 }}>🏆 {w.nickname}{cur.dist != null ? ` · ${cur.dist} ${sc.unit}` : ''}</div>}
              </div>
            )
          })}
          <div style={{ ...mono, fontSize: 8, color: MUT, marginTop: 6 }}>Ingen puttävling på hål 18.</div>
        </div>

        {/* HEAD TO HEAD */}
        <div style={card}>
          <div style={lbl}>HEAD TO HEAD · DE SEX ORDINARIE · FRÅN SCRATCH</div>
          <div style={{ fontSize: 10, color: MUT, lineHeight: 1.5, marginBottom: 10 }}>Paras efter TOOM före finalen: 1v6, 2v5, 3v4. Avgörs på finalrundans råa poängbogeypoäng — inga startpoäng, inga fördelar. Lika → korthålsbanan avgör. Beloppet bestäms per par före start.</div>
          {(final.h2h || []).map((m, idx) => {
            const a = byId[m.p1], b = byId[m.p2]
            const pa = played[m.p1] || { pts: 0, holes: 0 }, pb = played[m.p2] || { pts: 0, holes: 0 }
            const done = pa.holes === 18 && pb.holes === 18
            const lead = pa.pts === pb.pts ? null : pa.pts > pb.pts ? m.p1 : m.p2
            return (
              <div key={idx} style={{ padding: '10px 0', borderTop: '0.5px solid rgba(147,197,253,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ ...mono, fontSize: 8, color: G, width: 34 }}>{m.label}</span>
                  <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 6, alignItems: 'center' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, color: lead === m.p1 ? G : CREAM, fontWeight: lead === m.p1 ? 700 : 500 }}>{a?.nickname || '?'}</div>
                      <div style={{ ...mono, fontSize: 9, color: MUT }}>{pa.pts}p · {pa.holes}h</div>
                    </div>
                    <div style={{ ...mono, fontSize: 9, color: MUT }}>vs</div>
                    <div>
                      <div style={{ fontSize: 12, color: lead === m.p2 ? G : CREAM, fontWeight: lead === m.p2 ? 700 : 500 }}>{b?.nickname || '?'}</div>
                      <div style={{ ...mono, fontSize: 9, color: MUT }}>{pb.pts}p · {pb.holes}h</div>
                    </div>
                  </div>
                  <input type="number" placeholder="kr" defaultValue={m.stake ?? ''} disabled={busy}
                    onBlur={e => { const v = parseInt(e.target.value); setH2H(idx, { stake: isNaN(v) ? null : v }) }}
                    style={{ width: 62, background: 'rgba(147,197,253,0.08)', border: '1px solid rgba(147,197,253,0.2)', borderRadius: 8, color: CREAM, padding: '6px 8px', fontSize: 11, ...mono, textAlign: 'right' }} />
                </div>
                {done && pa.pts === pb.pts && <div style={{ ...mono, fontSize: 9, color: CORAL, marginTop: 6 }}>⛳ Oavgjort — korthålsbanan avgör.</div>}
                {done && pa.pts !== pb.pts && <div style={{ ...mono, fontSize: 9, color: GREEN, marginTop: 6 }}>🏆 {byId[lead]?.nickname} vinner{m.stake ? ` ${m.stake} kr` : ''}.</div>}
              </div>
            )
          })}
        </div>

        {/* EN MARCUS */}
        <div style={card}>
          <div style={lbl}>HUSREGEL · "EN MARCUS" · EN GÅNG PER SPELARE</div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 15, color: CREAM, fontStyle: 'italic', lineHeight: 1.4, marginBottom: 12 }}>"Jag är säker på att bollen SKA ligga här, men den finns inte – fri dropp!"</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
            {snap.map(s => {
              const used = (final.marcus_used || []).includes(s.player_id)
              const p = byId[s.player_id]
              return (
                <button key={s.player_id} disabled={busy} onClick={() => toggleMarcus(s.player_id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 10px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                    background: used ? 'rgba(232,99,74,0.12)' : 'rgba(74,222,128,0.06)', border: `1px solid ${used ? 'rgba(232,99,74,0.45)' : 'rgba(74,222,128,0.3)'}` }}>
                  <span style={{ fontSize: 16 }}>{used ? '🚫' : '🎟️'}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 12, color: CREAM, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p?.nickname || s.key}</span>
                    <span style={{ ...mono, fontSize: 8, color: used ? CORAL : GREEN }}>{used ? 'ANVÄND' : 'KVAR'}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {final.notes && <div style={{ ...mono, fontSize: 8, color: MUT, lineHeight: 1.5 }}>Anteckning: {final.notes}</div>}
      </div>
    </div>
  )
}
