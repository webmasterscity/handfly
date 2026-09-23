import { useSyncExternalStore } from 'react'
import { getSettings } from '../settings/settings'

// Sonidos sintetizados con Web Audio: sin archivos, sin peso extra, y se apagan en Ajustes.
let ctx: AudioContext | undefined

function tone(freqs: number[], duration = 0.12, gap = 0.07, volume = 0.08) {
  if (!getSettings().sounds) return
  try {
    ctx ??= new AudioContext()
    const start = ctx.currentTime
    freqs.forEach((f, i) => {
      const osc = ctx!.createOscillator()
      const gain = ctx!.createGain()
      osc.type = 'sine'
      osc.frequency.value = f
      const t0 = start + i * gap
      gain.gain.setValueAtTime(0, t0)
      gain.gain.linearRampToValueAtTime(volume, t0 + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
      osc.connect(gain).connect(ctx!.destination)
      osc.start(t0)
      osc.stop(t0 + duration + 0.02)
    })
  } catch {
    // Sin audio disponible: se ignora en silencio, el sonido es un adorno.
  }
}

function buzz(pattern: number | number[]) {
  if (getSettings().haptics && 'vibrate' in navigator) navigator.vibrate(pattern)
}

export const feedback = {
  /** Toque neutro: respuesta destapada, paso completado. */
  tick: () => {
    tone([660], 0.06)
    buzz(8)
  },
  /** Recordado. */
  good: () => {
    tone([660, 880], 0.1)
    buzz(12)
  },
  /** Aterrizaje / misión cumplida / logro. */
  land: () => {
    tone([523, 659, 784, 1047], 0.22, 0.09)
    buzz([15, 40, 15])
  },
}

// ---- Avisos breves (toasts) ----
export interface Toast {
  id: number
  text: string
  tone: 'info' | 'success'
}

let toasts: Toast[] = []
const listeners = new Set<() => void>()
let seq = 0

export function toast(text: string, tone: Toast['tone'] = 'info') {
  const item = { id: ++seq, text, tone }
  toasts = [...toasts, item]
  listeners.forEach((l) => l())
  setTimeout(() => dismissToast(item.id), 4500)
}

export function dismissToast(id: number) {
  toasts = toasts.filter((t) => t.id !== id)
  listeners.forEach((l) => l())
}

export function useToasts() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => toasts,
  )
}
