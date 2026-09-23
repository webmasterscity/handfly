import { createEmptyCard, fsrs, generatorParameters, type Card, type Grade } from 'ts-fsrs'
import { db } from '../db/schema'
import type { CardKind, MemoryCard, ReviewEntry } from '../db/types'
import { newId } from '../time'

// Retención objetivo del 90 %: el valor por defecto de FSRS y un buen equilibrio
// entre carga de repasos y olvido.
const scheduler = fsrs(generatorParameters({ request_retention: 0.9, enable_fuzz: true }))

export type Rating = 1 | 2 | 3 | 4 // Otra vez, Difícil, Bien, Fácil

function toStored(card: Card): Pick<MemoryCard, 'due' | 'fsrs'> {
  const { due, last_review, ...rest } = card
  return {
    due: due.toISOString(),
    fsrs: { ...rest, last_review: last_review ? last_review.toISOString() : undefined },
  }
}

function fromStored(card: MemoryCard): Card {
  const { last_review, ...rest } = card.fsrs
  return {
    ...rest,
    due: new Date(card.due),
    last_review: last_review ? new Date(last_review) : undefined,
  }
}

export function buildCard(
  kind: CardKind,
  front: string,
  back: string,
  sourceId?: string,
  now = new Date(),
): MemoryCard {
  return {
    id: newId(),
    kind,
    sourceId,
    front,
    back,
    createdAt: now.toISOString(),
    suspended: false,
    ...toStored(createEmptyCard(now)),
  }
}

export async function addCard(kind: CardKind, front: string, back: string, sourceId?: string) {
  const card = buildCard(kind, front, back, sourceId)
  await db.cards.add(card)
  return card
}

/** Calcula el siguiente estado de una tarjeta sin guardarlo (puro, para pruebas). */
export function schedule(card: MemoryCard, rating: Rating, now = new Date()): MemoryCard {
  const result = scheduler.next(fromStored(card), now, rating as Grade)
  return { ...card, ...toStored(result.card) }
}

/** Días hasta el próximo repaso para cada nota posible (para mostrarlo en los botones). */
export function previewIntervals(card: MemoryCard, now = new Date()): Record<Rating, number> {
  const out = {} as Record<Rating, number>
  for (const r of [1, 2, 3, 4] as Rating[]) {
    const next = schedule(card, r, now)
    out[r] = (new Date(next.due).getTime() - now.getTime()) / 86_400_000
  }
  return out
}

export async function reviewCard(card: MemoryCard, rating: Rating, attempted: boolean) {
  const now = new Date()
  const next = schedule(card, rating, now)
  const entry: ReviewEntry = {
    id: newId(),
    cardId: card.id,
    kind: card.kind,
    rating,
    reviewedAt: now.toISOString(),
    attempted,
  }
  await db.transaction('rw', db.cards, db.reviews, async () => {
    await db.cards.put(next)
    await db.reviews.add(entry)
  })
  return next
}

export async function dueCards(limit: number, now = new Date()): Promise<MemoryCard[]> {
  const due = await db.cards.where('due').belowOrEqual(now.toISOString()).sortBy('due')
  return due.filter((c) => !c.suspended).slice(0, limit)
}

export async function countDue(now = new Date()): Promise<number> {
  const due = await db.cards.where('due').belowOrEqual(now.toISOString()).toArray()
  return due.filter((c) => !c.suspended).length
}

export function isRecalled(rating: Rating): boolean {
  return rating >= 3
}
