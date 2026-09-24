import { Award, Plane, Trophy } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { dismissCelebration, useCelebration } from '../core/feedback/celebrate'
import { Wings } from './instruments/Wings'
import { Button } from './primitives/Button'

const CONFETTI_COLORS = ['var(--amber)', 'var(--sky)', 'var(--green)', 'var(--magenta)', 'var(--accent)']

// Posiciones fijas (no aleatorias en cada render): el confeti no salta al re-renderizar.
const CONFETTI = Array.from({ length: 26 }, (_, i) => ({
  left: (i * 37) % 100,
  delay: (i % 7) * 90,
  drift: ((i * 53) % 60) - 30,
  spin: ((i * 71) % 540) - 270,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  wide: i % 3 === 0,
}))

/** Pantalla de celebración: una a la vez, se cierra con un toque. */
export function CelebrationOverlay() {
  const { t } = useTranslation()
  const c = useCelebration()
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!c) return
    // Foco en el botón para teclado y lectores de pantalla, sin el anillo en pantallas táctiles.
    buttonRef.current?.focus({ focusVisible: false } as FocusOptions)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && dismissCelebration()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [c])

  if (!c) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={`celebration-${c.id}`}
      className="fixed inset-0 z-[60] grid place-items-center overflow-hidden bg-bg/85 px-4 backdrop-blur-sm"
      onClick={dismissCelebration}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {CONFETTI.map((p, i) => (
          <span
            key={`${c.id}-${i}`}
            className="hf-confetti absolute -top-4 block rounded-sm"
            style={{
              left: `${p.left}%`,
              width: p.wide ? 12 : 7,
              height: p.wide ? 6 : 12,
              background: p.color,
              animationDelay: `${p.delay}ms`,
              ['--drift' as string]: `${p.drift}vw`,
              ['--spin' as string]: `${p.spin}deg`,
            }}
          />
        ))}
        <span className="hf-flyby absolute top-[14%] left-0 flex items-center text-accent">
          <span className="block h-0.5 w-40 rounded-full bg-linear-to-r from-transparent to-accent/60" />
          <Plane className="h-7 w-7 rotate-45" />
        </span>
      </div>

      <div
        key={c.id}
        className="hf-rise relative w-full max-w-sm rounded-3xl border border-line bg-panel px-6 pt-8 pb-6 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="hf-badge mx-auto mb-4 grid h-28 place-items-center">
          {c.kind === 'rank' ? (
            <Wings rankIndex={c.rankIndex ?? 0} size={200} />
          ) : c.kind === 'record' ? (
            <span className="grid h-24 w-24 place-items-center rounded-full border-4 border-amber bg-panel-2 text-amber">
              <Trophy className="h-12 w-12" aria-hidden />
            </span>
          ) : (
            <span className="grid h-24 w-24 place-items-center rounded-full border-4 border-green bg-panel-2 text-green">
              <Award className="h-12 w-12" aria-hidden />
            </span>
          )}
        </div>
        <p className="font-display text-sm font-bold text-ink-dim">{c.title}</p>
        <h2 id={`celebration-${c.id}`} className="mt-1 text-[1.75rem] leading-tight">
          {c.subtitle}
        </h2>
        {c.detail && <p className="mt-3 text-ink-dim">{c.detail}</p>}
        <Button ref={buttonRef} block className="mt-6" onClick={dismissCelebration}>
          {t('celebrate.continue')}
        </Button>
      </div>
    </div>
  )
}
