import type { Card as FsrsCard } from 'ts-fsrs'

export type ModuleId = 'think-first' | 'recall' | 'people' | 'navigation' | 'writing' | 'calculation'

export const MODULE_IDS: ModuleId[] = [
  'think-first',
  'recall',
  'people',
  'navigation',
  'writing',
  'calculation',
]

/** Pensar primero: una pregunta que el usuario intenta responder antes de ir a la IA. */
export interface ThinkEntry {
  id: string
  question: string
  attempt: string
  confidence: number // 1-5, antes de consultar
  createdAt: string
  status: 'open' | 'closed'
  closedAt?: string
  aiAnswer?: string
  closeness?: number // 1-5, qué tan cerca estuvo el intento propio
  learned?: string
  cardId?: string
}

export type CardKind = 'think' | 'fact' | 'person'

/** Tarjeta de recuerdo activo. Guarda el estado FSRS aplanado (fechas como ISO). */
export interface MemoryCard {
  id: string
  kind: CardKind
  sourceId?: string
  front: string
  back: string
  createdAt: string
  suspended: boolean
  due: string
  fsrs: Omit<FsrsCard, 'due' | 'last_review'> & { last_review?: string }
}

export interface ReviewEntry {
  id: string
  cardId: string
  kind: CardKind
  rating: 1 | 2 | 3 | 4
  reviewedAt: string
  /** Si el usuario escribió o dijo su respuesta antes de destaparla. */
  attempted: boolean
}

export interface Person {
  id: string
  name: string
  whereMet: string
  trait: string
  conversation: string
  nameImage: string // el nombre convertido en algo concreto
  featureChosen: string // el rasgo destacado elegido
  linkImage: string // la escena mental que une ambos
  metOn: string // dayKey
  createdAt: string
  cardId?: string
}

export type FlightKind = 'real' | 'sim'

/**
 * Registro de vuelo. 'real' = algo resuelto en la vida real sin IA, GPS o calculadora.
 * 'sim' = práctica dentro de la app (horas de simulador). Solo las reales suben el rango.
 */
export interface Flight {
  id: string
  kind: FlightKind
  moduleId: ModuleId
  title: string
  minutes: number
  source: 'measured' | 'declared'
  date: string // dayKey
  createdAt: string
  refId?: string
}

export interface Mission {
  id: string
  templateId: string
  moduleId: ModuleId
  assignedOn: string // dayKey
  surprise: boolean
  status: 'offered' | 'accepted' | 'done' | 'skipped'
  doneAt?: string
  note?: string
}

export interface DailySession {
  date: string // dayKey (clave primaria)
  startedAt: string
  completedAt?: string
  reviews: number
  correct: number
  missionId?: string
}

export interface WeeklyCheck {
  week: string // 'YYYY-Www' (clave primaria)
  crutches: string[] // situaciones reales donde se usó la IA como muleta
  solo: string[] // situaciones reales resueltas sin ayuda
  note: string
  createdAt: string
}

export interface Achievement {
  id: string
  unlockedAt: string
}

// ---- Fase 2 ----

export interface RouteMission {
  id: string
  title: string
  from: string
  to: string
  plannedLandmarks: string[]
  status: 'planned' | 'flown' | 'recalled'
  createdAt: string
  flownAt?: string
  usedGps?: 'no' | 'glance' | 'yes'
  gotLost?: boolean
  minutes?: number
  recalledLandmarks?: string[]
  recallScore?: number // 0-1, orden correcto de referencias
  sketch?: string // PNG en data URL; dibujo propio del usuario, nunca sale del dispositivo
  recalledAt?: string
}

export interface Draft {
  id: string
  title: string
  kind: 'message' | 'email' | 'text'
  body: string
  words: number
  secondsWriting: number
  pasteAttempts: number
  createdAt: string
  updatedAt: string
  aiVersion?: string
  keepFromMine?: string
  finishedAt?: string
}

export interface CalcAttempt {
  id: string
  mode: 'problem' | 'estimate'
  category: string
  prompt: string
  userAnswer: number
  correctAnswer: number
  /** Error relativo absoluto: |usuario - real| / |real|. */
  error: number
  correct: boolean
  seconds?: number
  createdAt: string
}
