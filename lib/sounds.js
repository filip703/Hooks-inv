// Sound effects using Web Audio API
// Works even on silent mode after first user interaction

let audioCtx = null

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  if (audioCtx.state === 'suspended') audioCtx.resume()
  return audioCtx
}

function playTone(freq, duration, type = 'sine', volume = 0.3) {
  try {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, ctx.currentTime)
    gain.gain.setValueAtTime(volume, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + duration)
  } catch(e) {}
}

export function soundBirdie() {
  playTone(880, 0.15, 'sine', 0.4)
  setTimeout(() => playTone(1100, 0.15, 'sine', 0.4), 150)
  setTimeout(() => playTone(1320, 0.25, 'sine', 0.5), 300)
}

export function soundEagle() {
  playTone(660, 0.12, 'sine', 0.5)
  setTimeout(() => playTone(880, 0.12, 'sine', 0.5), 120)
  setTimeout(() => playTone(1100, 0.12, 'sine', 0.5), 240)
  setTimeout(() => playTone(1320, 0.12, 'sine', 0.5), 360)
  setTimeout(() => playTone(1760, 0.4, 'sine', 0.6), 480)
}

export function soundZero() {
  playTone(300, 0.3, 'sawtooth', 0.2)
  setTimeout(() => playTone(200, 0.4, 'sawtooth', 0.15), 300)
}

export function soundChat() {
  playTone(600, 0.08, 'sine', 0.15)
  setTimeout(() => playTone(800, 0.08, 'sine', 0.15), 80)
}

export function soundScore() {
  playTone(500, 0.1, 'sine', 0.2)
}

// ============ CASINO SOUNDS ============
// Filip's "ALL IN" Vegas-mode

export function soundChipDrop() {
  // Klick-klack av plastchips
  playTone(2000, 0.04, 'square', 0.15)
  setTimeout(() => playTone(1600, 0.06, 'square', 0.12), 50)
  setTimeout(() => playTone(1400, 0.08, 'square', 0.1), 110)
}

export function soundSlotDing() {
  // Slot machine ding-ding-ding
  playTone(1568, 0.08, 'square', 0.3) // G6
  setTimeout(() => playTone(1568, 0.08, 'square', 0.3), 120)
  setTimeout(() => playTone(2093, 0.15, 'square', 0.35), 240) // C7
}

export function soundBigWin() {
  // Stora fanfaren — 6 toner uppåt + sustain
  const notes = [523, 659, 784, 1047, 1319, 1568] // C5–G6
  notes.forEach((f, i) => {
    setTimeout(() => playTone(f, 0.12, 'square', 0.35), i * 80)
  })
  setTimeout(() => {
    playTone(2093, 0.6, 'square', 0.4) // C7 sustain
    playTone(1568, 0.6, 'sine', 0.3) // G6 harmony
  }, 480)
}

export function soundNewBet() {
  // Kort kling när ny bet öppnas
  playTone(1175, 0.1, 'sine', 0.25) // D6
  setTimeout(() => playTone(1568, 0.15, 'sine', 0.3), 100) // G6
}

export function soundBetLocked() {
  // Lås-ljud — tre snabba klick neråt
  playTone(800, 0.05, 'square', 0.2)
  setTimeout(() => playTone(600, 0.05, 'square', 0.2), 80)
  setTimeout(() => playTone(400, 0.1, 'square', 0.25), 160)
}

export function soundLoss() {
  // Sjunkande "wamp wamp"
  playTone(400, 0.25, 'sawtooth', 0.25)
  setTimeout(() => playTone(300, 0.3, 'sawtooth', 0.2), 250)
  setTimeout(() => playTone(200, 0.4, 'sawtooth', 0.15), 550)
}

// Universal entry point — håller koll på toggle
export function playCasinoSound(type, enabled = true) {
  if (!enabled) return
  switch (type) {
    case 'chipDrop': return soundChipDrop()
    case 'slotDing': return soundSlotDing()
    case 'bigWin': return soundBigWin()
    case 'newBet': return soundNewBet()
    case 'betLocked': return soundBetLocked()
    case 'loss': return soundLoss()
    default: return
  }
}

// Initialize audio context on first user interaction
export function initAudio() {
  try {
    const ctx = getCtx()
    // Play silent buffer to unlock audio on iOS
    const buf = ctx.createBuffer(1, 1, 22050)
    const src = ctx.createBufferSource()
    src.buffer = buf
    src.connect(ctx.destination)
    src.start(0)
  } catch(e) {}
}
