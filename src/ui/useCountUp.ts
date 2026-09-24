import { useEffect, useState } from 'react'
import { useSettings } from '../core/settings/settings'

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** Número que sube de 0 a `target` al aparecer (sin animación si el movimiento está apagado). */
export function useCountUp(target: number, duration = 900) {
  const { motion } = useSettings()
  const animate = motion && !reducedMotion()
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!animate) return
    let frame = 0
    const start = performance.now()
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      // Frena al final: el número «aterriza» en su valor.
      setValue(Math.round(target * (1 - (1 - p) ** 3)))
      if (p < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [target, duration, animate])

  return animate ? value : target
}
