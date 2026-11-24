import { getProgress } from '../store/progress'

let ctx: AudioContext | null = null

function tone(freqs: number[], step = 0.09, type: OscillatorType = 'sine') {
  if (!getProgress().settings.sound) return
  try {
    ctx ??= new AudioContext()
    const t0 = ctx.currentTime
    freqs.forEach((f, i) => {
      const osc = ctx!.createOscillator()
      const gain = ctx!.createGain()
      osc.type = type
      osc.frequency.value = f
      const start = t0 + i * step
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(0.18, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + step * 1.8)
      osc.connect(gain).connect(ctx!.destination)
      osc.start(start)
      osc.stop(start + step * 2)
    })
  } catch {
    /* audio not available */
  }
}

function buzz(pattern: number | number[]) {
  if (getProgress().settings.vibration && 'vibrate' in navigator) navigator.vibrate(pattern)
}

/** Sounds are synthesized, so there are no audio files to download. */
export const feedback = {
  correct() {
    tone([660, 880])
    buzz(30)
  },
  wrong() {
    tone([300, 220], 0.12, 'triangle')
    buzz([60, 40, 60])
  },
  finish() {
    tone([523, 659, 784, 1047], 0.1)
    buzz([40, 30, 40, 30, 80])
  },
  tick() {
    tone([1200], 0.03, 'square')
  },
}
