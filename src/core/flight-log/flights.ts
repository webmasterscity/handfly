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

// El rango sube solo con práctica real fuera de la app. El primer ascenso llega con la
// primera misión cumplida (una victoria temprana engancha más que cualquier explicación);
// los siguientes piden constancia, no atracones.
export const RANKS: Rank[] = [
  { id: 'student', hours: 0, flights: 0 },
  { id: 'rookie', hours: 0, flights: 1 },
  { id: 'private', hours: 1, flights: 6 },
  { id: 'commercial', hours: 5, flights: 20 },
  { id: 'firstOfficer', hours: 15, flights: 60 },
  { id: 'captain', hours: 40, flights: 150 },
  { id: 'instructor', hours: 100, flights: 365 },
]

export const rankIndex = (id: string) => RANKS.findIndex((r) => r.id === id)

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
  // Un requisito que no cambia entre rangos (p. ej. 0 horas para Piloto novato) ya está cumplido.
  const ph = next.hours > rank.hours ? (hours - rank.hours) / (next.hours - rank.hours) : 1
  const pf = next.flights > rank.flights ? (realFlights - rank.flights) / (next.flights - rank.flights) : 1
  return { rank, next, progress: Math.max(0, Math.min(1, Math.min(ph, pf))) }
}
