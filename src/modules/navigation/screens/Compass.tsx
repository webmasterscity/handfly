import { Home, LocateFixed, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { db } from '../../../core/db/schema'
import { celebrate } from '../../../core/feedback/celebrate'
import { feedback } from '../../../core/feedback/feedback'
import { logFlight } from '../../../core/flight-log/flights'
import { angleDiff, bearingTo, distanceKm, scoreBearing, scoreTier } from '../../../core/missions/scoring'
import { afterActivity, reportActivity } from '../../../core/session/session'
import { getSettings, updateSettings, useSettings } from '../../../core/settings/settings'
import { ALL_MISSIONS } from '../../registry'
import { Button, ButtonLink } from '../../../ui/primitives/Button'
import { useCountUp } from '../../../ui/useCountUp'
import { dayKey } from '../../../core/time'

type Pos = { lat: number; lng: number }
type Phase = 'setup' | 'ready' | 'pointing' | 'cardinal' | 'result'

/** Casa a menos de esta distancia: no tiene sentido señalarla. */
const TOO_CLOSE_KM = 0.3
const CARDINALS = [0, 45, 90, 135, 180, 225, 270, 315]

function getPosition(): Promise<Pos> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) return reject(new Error('unsupported'))
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      (e) => reject(e),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    )
  })
}

interface OrientationEventIOS extends DeviceOrientationEvent {
  webkitCompassHeading?: number
}

/**
 * ¿Dónde está casa?: desde un lugar al que no vas a menudo, apuntas el teléfono hacia tu
 * casa sin mirar el mapa. La brújula y el GPS dicen cuántos grados te desviaste.
 * Señalar hacia un lugar que no se ve es como los estudios miden el sentido de
 * orientación. Si el teléfono no tiene brújula, se juega eligiendo el punto cardinal.
 * La ubicación de casa y la tuya nunca salen del teléfono.
 */
export function Compass() {
  const { t, i18n } = useTranslation('navigation')
  const { home } = useSettings()
  const [phase, setPhase] = useState<Phase>(home ? 'ready' : 'setup')
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)
  const [heading, setHeading] = useState<number>()
  const [here, setHere] = useState<Pos>()
  const [result, setResult] = useState<{ pointed: number; truth: number; degrees: number; score: number; km: number; record: boolean }>()
  const headingRef = useRef<number | undefined>(undefined)

  // Lectura de la brújula mientras se apunta.
  useEffect(() => {
    if (phase !== 'pointing') return
    const onIOS = (e: Event) => {
      const h = (e as OrientationEventIOS).webkitCompassHeading
      if (typeof h === 'number') update(h)
    }
    const onAbsolute = (e: Event) => {
      const a = (e as DeviceOrientationEvent).alpha
      if (e instanceof DeviceOrientationEvent && e.absolute && typeof a === 'number') update((360 - a) % 360)
    }
    const update = (h: number) => {
      const screenAngle = screen.orientation?.angle ?? 0
      const v = (h + screenAngle + 360) % 360
      headingRef.current = v
      setHeading(v)
    }
    window.addEventListener('deviceorientationabsolute', onAbsolute)
    window.addEventListener('deviceorientation', onIOS)
    // Sin lecturas en 2 segundos: no hay brújula (o no hubo permiso). Se juega por puntos cardinales.
    const timer = setTimeout(() => {
      if (headingRef.current === undefined) setPhase('cardinal')
    }, 2000)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('deviceorientationabsolute', onAbsolute)
      window.removeEventListener('deviceorientation', onIOS)
    }
  }, [phase])

  async function saveHome() {
    setBusy(true)
    setError(undefined)
    try {
      const pos = await getPosition()
      updateSettings({ home: pos })
      feedback.good()
      setPhase('ready')
    } catch {
      setError(t('compass.errorLocation'))
    } finally {
      setBusy(false)
    }
  }

  async function play() {
    setBusy(true)
    setError(undefined)
    try {
      // iPhone pide permiso explícito para la brújula; tiene que ser tras un toque.
      const DOE = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }
      if (typeof DOE?.requestPermission === 'function') await DOE.requestPermission().catch(() => 'denied')
      const pos = await getPosition()
      if (home && distanceKm(pos, home) < TOO_CLOSE_KM) {
        setError(t('compass.tooClose'))
        return
      }
      setHere(pos)
      headingRef.current = undefined
      setHeading(undefined)
      setPhase('pointing')
    } catch {
      setError(t('compass.errorLocation'))
    } finally {
      setBusy(false)
    }
  }

  async function lockIn(pointed: number) {
    if (!here || !home) return
    const truth = bearingTo(here, home)
    const degrees = Math.round(angleDiff(pointed, truth))
    const score = scoreBearing(pointed, truth)
    const km = Math.round(distanceKm(here, home) * 10) / 10
    const best = getSettings().compassBest
    const record = best !== undefined && score > best
    if (best === undefined || score > best) updateSettings({ compassBest: score })
    setResult({ pointed, truth, degrees, score, km, record })
    setPhase('result')
    feedback.land()
    // Señalar desde un lugar real, sin mapa, es práctica real: suma vuelo real, pero uno
    // al día. Repetirlo en el mismo sitio no puede inflar las horas ni el rango.
    const refId = `compass:${dayKey()}`
    const alreadyToday = await db.flights.where('date').equals(dayKey()).filter((f) => f.refId === refId).count()
    await logFlight({ kind: alreadyToday ? 'sim' : 'real', moduleId: 'navigation', title: t('compass.flightTitle'), minutes: 2, source: 'measured', refId })
    await reportActivity('compass.pointed', ALL_MISSIONS, { score, degrees, km })
    if (record) celebrate({ kind: 'record', title: t('compass.recordTitle'), subtitle: t('compass.recordSubtitle', { degrees }), detail: t('compass.recordDetail', { best }) })
    await afterActivity()
  }

  const exit = (
    <Link to="/m/navigation" aria-label={t('compass.exit')} className="grid h-11 w-11 place-items-center rounded-full text-ink-dim hover:text-ink">
      <X className="h-6 w-6" aria-hidden />
    </Link>
  )

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 pt-3 pb-8">
      <header className="mb-4 flex items-center justify-between">
        <p className="font-display font-bold">{t('compass.title')}</p>
        {exit}
      </header>

      {phase === 'setup' && (
        <div className="animate-pop flex flex-1 flex-col">
          <span className="mx-auto mb-6 grid h-24 w-24 place-items-center rounded-full bg-magenta text-on-accent">
            <Home className="h-12 w-12" aria-hidden />
          </span>
          <h1 className="text-[1.75rem] leading-tight">{t('compass.setupTitle')}</h1>
          <p className="prose-text mt-3 text-lg">{t('compass.setupLead')}</p>
          <p className="prose-text mt-3 text-sm text-ink-dim">{t('compass.privacy')}</p>
          {error && <p className="mt-4 rounded-xl border-2 border-amber p-3">{error}</p>}
          <Button block className="mt-auto" disabled={busy} onClick={() => void saveHome()}>
            <LocateFixed className="h-5 w-5" aria-hidden />
            {busy ? t('compass.locating') : t('compass.saveHome')}
          </Button>
        </div>
      )}

      {phase === 'ready' && (
        <div className="animate-pop flex flex-1 flex-col">
          <Dial heading={0} arrows={[]} />
          <h1 className="mt-6 text-[1.75rem] leading-tight">{t('compass.readyTitle')}</h1>
          <p className="prose-text mt-3 text-lg">{t('compass.readyLead')}</p>
          {error && <p className="mt-4 rounded-xl border-2 border-amber p-3">{error}</p>}
          <div className="mt-auto flex flex-col gap-2 pt-6">
            <Button block disabled={busy} onClick={() => void play()}>
              {busy ? t('compass.locating') : t('compass.play')}
            </Button>
            <Button variant="ghost" onClick={() => setPhase('setup')}>
              {t('compass.moveHome')}
            </Button>
          </div>
        </div>
      )}

      {phase === 'pointing' && (
        <div className="flex flex-1 flex-col">
          <p className="mb-4 text-center text-lg">{t('compass.pointLead')}</p>
          <Dial heading={heading ?? 0} arrows={[{ angle: heading ?? 0, color: 'var(--amber)', label: t('compass.you') }]} live={heading !== undefined} />
          <p className="readout mt-4 text-center text-ink-dim" aria-live="off">
            {heading === undefined ? t('compass.waiting') : `${Math.round(heading)}°`}
          </p>
          <Button block className="mt-auto" disabled={heading === undefined} onClick={() => headingRef.current !== undefined && void lockIn(headingRef.current)}>
            <Home className="h-5 w-5" aria-hidden />
            {t('compass.hereItIs')}
          </Button>
        </div>
      )}

      {phase === 'cardinal' && (
        <div className="animate-pop flex flex-1 flex-col">
          <h1 className="text-[1.5rem] leading-tight">{t('compass.cardinalTitle')}</h1>
          <p className="prose-text mt-2 text-ink-dim">{t('compass.cardinalLead')}</p>
          <ul className="mx-auto mt-6 grid w-full max-w-xs grid-cols-3 gap-2">
            {[315, 0, 45, 270, -1, 90, 225, 180, 135].map((deg) =>
              deg < 0 ? (
                <li key="c" className="grid place-items-center text-magenta">
                  <LocateFixed className="h-8 w-8" aria-hidden />
                </li>
              ) : (
                <li key={deg}>
                  <button
                    type="button"
                    onClick={() => void lockIn(deg)}
                    className="grid h-20 w-full place-items-center rounded-2xl border-2 border-line bg-panel font-display text-xl font-bold active:scale-95"
                  >
                    {t(`compass.dir.${CARDINALS.indexOf(deg)}`)}
                  </button>
                </li>
              ),
            )}
          </ul>
        </div>
      )}

      {phase === 'result' && result && <Result result={result} lang={i18n.language} />}
    </div>
  )
}

function Result({ result, lang }: { result: { pointed: number; truth: number; degrees: number; score: number; km: number; record: boolean }; lang: string }) {
  const { t } = useTranslation('navigation')
  const shown = useCountUp(result.score)
  return (
    <div className="animate-pop flex flex-1 flex-col">
      <Dial
        heading={0}
        arrows={[
          { angle: result.pointed, color: 'var(--amber)', label: t('compass.you') },
          { angle: result.truth, color: 'var(--green)', label: t('compass.home') },
        ]}
      />
      <div className="mt-4 flex items-end justify-between gap-4">
        <div>
          <p className="font-display text-2xl font-bold">{t(`compass.tier.${scoreTier(result.score)}`)}</p>
          <p className="text-ink-dim">{t('compass.off', { degrees: result.degrees })}</p>
          <p className="text-ink-dim">{t('compass.distance', { km: new Intl.NumberFormat(lang, { maximumFractionDigits: 1 }).format(result.km) })}</p>
        </div>
        <p className="text-right">
          <span className="block text-sm text-ink-dim">{t('compass.precision')}</span>
          <span className="readout block text-5xl leading-none">{shown}</span>
        </p>
      </div>
      <p className="mt-4 flex items-center gap-4 text-sm">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-amber" aria-hidden />
          {t('compass.legendYou')}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-green" aria-hidden />
          {t('compass.legendHome')}
        </span>
      </p>
      <p className="prose-text mt-4 mb-6 rounded-2xl bg-panel-2 p-4">{t('compass.afterTip')}</p>
      <ButtonLink to="/" block className="mt-auto">
        {t('compass.toToday')}
      </ButtonLink>
    </div>
  )
}

/** Rosa de los vientos: gira con el teléfono y muestra flechas (tú, casa). */
function Dial({ heading, arrows, live }: { heading: number; arrows: { angle: number; color: string; label: string }[]; live?: boolean }) {
  const { t } = useTranslation('navigation')
  return (
    <svg viewBox="-110 -110 220 220" className="mx-auto w-full max-w-[18rem]" role="img" aria-label={t('compass.dialAria')}>
      <circle r="104" fill="var(--panel)" stroke="var(--line)" strokeWidth="3" />
      {/* La rosa gira al revés que el teléfono: el norte queda siempre donde está el norte. */}
      <g transform={`rotate(${-heading})`} style={{ transition: live ? 'transform 120ms linear' : undefined }}>
        {Array.from({ length: 72 }, (_, i) => (
          <line key={i} x1="0" y1="-100" x2="0" y2={i % 18 === 0 ? -86 : i % 2 === 0 ? -93 : -96} stroke="var(--ink-dim)" strokeWidth={i % 18 === 0 ? 3 : 1.2} transform={`rotate(${i * 5})`} />
        ))}
        {['N', 'E', 'S', 'W'].map((c, i) => {
          // Cada letra va en su sitio de la rosa, pero siempre derecha para poder leerla.
          const x = Math.sin((i * Math.PI) / 2) * 70
          const y = -Math.cos((i * Math.PI) / 2) * 70
          return (
            <text
              key={c}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              transform={`rotate(${heading} ${x} ${y})`}
              fontSize="16"
              fontWeight="700"
              fill={i === 0 ? 'var(--red)' : 'var(--ink)'}
              fontFamily="var(--font-display)"
            >
              {t(`compass.card.${c}`)}
            </text>
          )
        })}
        {arrows.map((a) => (
          <g key={a.label} transform={`rotate(${a.angle})`}>
            <line x1="0" y1="10" x2="0" y2="-58" stroke={a.color} strokeWidth="6" strokeLinecap="round" />
            <path d="M0 -66 L9 -50 L-9 -50 Z" fill={a.color} />
          </g>
        ))}
      </g>
      <circle r="6" fill="var(--ink)" />
      {/* La parte de arriba del teléfono. */}
      {live && <path d="M0 -108 L7 -96 L-7 -96 Z" fill="var(--ink)" />}
    </svg>
  )
}
