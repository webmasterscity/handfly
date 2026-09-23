import { db } from '../db/schema'
import type { Flight, FlightKind, ModuleId } from '../db/types'
import { dayKey, newId } from '../time'

export async function logFlight(input: {
  kind: FlightKind
  moduleId: ModuleId
  title: string
  minutes: number
  source: Flight['source']
  refId?: string
  date?: string
}): Promise<Flight> {
  const flight: Flight = {
    id: newId(),
    date: input.date ?? dayKey(),
    createdAt: new Date().toISOString(),
    ...input,
    minutes: Math.max(1, Math.round(input.minutes)),
  }
  await db.flights.add(flight)
  return flight
}

export interface Rank {
  id: string
  /** Horas de vuelo real necesarias. */
  hours: number
  /** Vuelos reales necesarios (además de las horas). */
  flights: number
}

// El rango sube solo con práctica real fuera de la app. Umbrales pensados para que el
// primer ascenso llegue en la primera semana y los siguientes pidan constancia, no atracones.
export const RANKS: Rank[] = [
  { id: 'student', hours: 0, flights: 0 },
  { id: 'private', hours: 1, flights: 5 },
  { id: 'commercial', hours: 5, flights: 20 },
  { id: 'firstOfficer', hours: 15, flights: 60 },
  { id: 'captain', hours: 40, flights: 150 },
  { id: 'instructor', hours: 100, flights: 365 },
]

export interface RankProgress {
  rank: Rank
  next?: Rank
  /** 0-1 hacia el siguiente rango (el menor de los dos requisitos). */
  progress: number
}

export function rankFor(realMinutes: number, realFlights: number): RankProgress {
  const hours = realMinutes / 60
  let index = 0
  RANKS.forEach((r, i) => {
    if (hours >= r.hours && realFlights >= r.flights) index = i
  })
  const rank = RANKS[index]
  const next = RANKS[index + 1]
  if (!next) return { rank, progress: 1 }
  const ph = (hours - rank.hours) / (next.hours - rank.hours)
  const pf = (realFlights - rank.flights) / (next.flights - rank.flights)
  return { rank, next, progress: Math.max(0, Math.min(1, Math.min(ph, pf))) }
}
