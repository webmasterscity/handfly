import Dexie, { type EntityTable } from 'dexie'
import type {
  Achievement,
  CalcAttempt,
  DailySession,
  Draft,
  Flight,
  MemoryCard,
  Mission,
  Person,
  ReviewEntry,
  RouteMission,
  ThinkEntry,
  WeeklyCheck,
} from './types'

export class HandflyDB extends Dexie {
  thinkEntries!: EntityTable<ThinkEntry, 'id'>
  cards!: EntityTable<MemoryCard, 'id'>
  reviews!: EntityTable<ReviewEntry, 'id'>
  people!: EntityTable<Person, 'id'>
  flights!: EntityTable<Flight, 'id'>
  missions!: EntityTable<Mission, 'id'>
  sessions!: EntityTable<DailySession, 'date'>
  weeklyChecks!: EntityTable<WeeklyCheck, 'week'>
  achievements!: EntityTable<Achievement, 'id'>
  routes!: EntityTable<RouteMission, 'id'>
  drafts!: EntityTable<Draft, 'id'>
  calcAttempts!: EntityTable<CalcAttempt, 'id'>

  constructor(name = 'handfly') {
    super(name)
    // Al cambiar el esquema: añadir .version(n+1) con los índices nuevos, nunca editar uno anterior.
    this.version(1).stores({
      thinkEntries: 'id, status, createdAt',
      cards: 'id, kind, sourceId, due, suspended',
      reviews: 'id, cardId, kind, reviewedAt',
      people: 'id, name, createdAt',
      flights: 'id, kind, moduleId, date',
      missions: 'id, moduleId, assignedOn, status',
      sessions: 'date',
      weeklyChecks: 'week',
      achievements: 'id',
      routes: 'id, status, createdAt',
      drafts: 'id, updatedAt',
      calcAttempts: 'id, mode, createdAt',
    })
  }
}

export const db = new HandflyDB()

export const TABLE_NAMES = [
  'thinkEntries',
  'cards',
  'reviews',
  'people',
  'flights',
  'missions',
  'sessions',
  'weeklyChecks',
  'achievements',
  'routes',
  'drafts',
  'calcAttempts',
] as const

export type TableName = (typeof TABLE_NAMES)[number]
