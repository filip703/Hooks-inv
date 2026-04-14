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
