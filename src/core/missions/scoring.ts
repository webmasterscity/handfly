/**
 * «Apuesta y comprueba»: muchas misiones del mundo real se juegan anotando primero una
 * predicción (el total de la compra, la hora de llegada, hacia dónde queda tu casa) y
 * comparándola después con el dato real. Predecir y recibir la corrección enseguida es
 * lo que afina la estimación; la puntuación hace visible ese avance.
 *
 * Todas las puntuaciones van de 0 a 100 y son funciones puras (se prueban aparte).
 */

export type CheckKind = 'number' | 'time' | 'count' | 'closeness' | 'peeks' | 'bearing' | 'minutesUntil'

export interface MissionCheck {
  kind: CheckKind
  /** number: unidad para mostrar el valor. */
  unit?: 'money' | 'minutes' | 'plain'
  /**
   * number: error relativo con el que la puntuación llega a 0. Una suma exacta pide
   * poco margen (0,25); una estimación a ojo admite más (1).
   */
  maxError?: number
  /** count: total fijo conocido de antemano (p. ej. tres cumpleaños). */
  total?: number
}

/** Qué se anota antes de ir a hacer la misión (un número o una hora: nada que escribir). */
export interface MissionBet {
  at: string
  value?: number
  /** 'HH:MM' */
  time?: string
}

/** Qué se anota al comprobar, y la puntuación resultante. */
export interface MissionResult {
  at: string
  score: number
  /** Lo necesario para explicar la puntuación (valor real, aciertos, grados…). */
  actual?: number
  time?: string
  got?: number
  total?: number
  closeness?: number
  peeks?: number
  degrees?: number
  km?: number
}

/** Tipos que necesitan una apuesta antes de salir; el resto solo se comprueban al final. */
export function needsBet(check: MissionCheck | undefined): boolean {
  return check?.kind === 'number' || check?.kind === 'time'
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)))

/** Número apostado frente al real. Un error relativo de maxError (o más) da 0. */
export function scoreNumber(bet: number, actual: number, maxError = 0.5): number {
  if (actual === 0) return bet === 0 ? 100 : 0
  const rel = Math.abs(bet - actual) / Math.abs(actual)
  return clamp(100 * (1 - rel / maxError))
}

/** Minutos del día a partir de 'HH:MM'. */
export function parseClock(hhmm: string): number | undefined {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim())
  if (!m) return undefined
  const h = Number(m[1])
  const min = Number(m[2])
  if (h > 23 || min > 59) return undefined
  return h * 60 + min
}

/** Diferencia en minutos entre dos horas del día, contando el paso por medianoche. */
export function clockDiff(a: string, b: string): number | undefined {
  const x = parseClock(a)
  const y = parseClock(b)
  if (x === undefined || y === undefined) return undefined
  const d = Math.abs(x - y) % 1440
  return Math.min(d, 1440 - d)
}

/** Hora apostada frente a la real: cada minuto de diferencia resta 5 puntos. */
export function scoreTime(bet: string, actual: string): number {
  const d = clockDiff(bet, actual)
  return d === undefined ? 0 : clamp(100 - d * 5)
}

export function scoreCount(got: number, total: number): number {
  return total > 0 ? clamp((100 * Math.min(got, total)) / total) : 0
}

/** Cercanía 1-5 → 0-100. */
export function scoreCloseness(closeness: number): number {
  return clamp((closeness - 1) * 25)
}

/** Cada vistazo al mapa o al teléfono resta 25 puntos. */
export function scorePeeks(peeks: number): number {
  return clamp(100 - Math.max(0, peeks) * 25)
}

/** Diferencia angular mínima entre dos rumbos (0-180°). */
export function angleDiff(a: number, b: number): number {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}

/** Rumbo señalado frente al real: 90° o más de error da 0. */
export function scoreBearing(pointed: number, truth: number): number {
  return clamp(100 - (angleDiff(pointed, truth) * 100) / 90)
}

/** Minutos que faltan desde `now` hasta la hora `target` (si ya pasó, cuenta hasta mañana). */
export function minutesUntil(target: string, now: Date): number | undefined {
  const t = parseClock(target)
  if (t === undefined) return undefined
  const current = now.getHours() * 60 + now.getMinutes()
  return (t - current + 1440) % 1440
}

/**
 * Cuenta de minutos hecha de cabeza: es cálculo exacto, cada minuto de error resta 10.
 * La cuenta se hace al mirar el reloj y se anota un poco después, así que pasarse hasta
 * `grace` minutos (el tiempo de pensar y escribir) no es un error.
 */
export function scoreMinutesUntil(bet: number, truth: number, grace = 3): number {
  const d = bet - truth
  const error = d >= 0 ? Math.max(0, d - grace) : -d
  return clamp(100 - error * 10)
}

/** Rumbo inicial (0-360°, 0 = norte) desde un punto hacia otro. */
export function bearingTo(from: { lat: number; lng: number }, to: { lat: number; lng: number }): number {
  const rad = Math.PI / 180
  const lat1 = from.lat * rad
  const lat2 = to.lat * rad
  const dLng = (to.lng - from.lng) * rad
  const y = Math.sin(dLng) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)
  return (Math.atan2(y, x) / rad + 360) % 360
}

/** Distancia en km (fórmula del haversine). */
export function distanceKm(from: { lat: number; lng: number }, to: { lat: number; lng: number }): number {
  const rad = Math.PI / 180
  const dLat = (to.lat - from.lat) * rad
  const dLng = (to.lng - from.lng) * rad
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(from.lat * rad) * Math.cos(to.lat * rad) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** Frase según la puntuación: nunca castiga, siempre dice qué tan cerca estuviste. */
export function scoreTier(score: number): 'bullseye' | 'close' | 'fair' | 'learning' {
  if (score >= 95) return 'bullseye'
  if (score >= 75) return 'close'
  if (score >= 45) return 'fair'
  return 'learning'
}
