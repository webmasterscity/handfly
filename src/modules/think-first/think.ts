import { db } from '../../core/db/schema'
import type { ThinkEntry } from '../../core/db/types'
import { feedback } from '../../core/feedback/feedback'
import { afterActivity } from '../../core/session/session'
import { addCard } from '../../core/srs/scheduler'

/**
 * Tres opciones en vez de escalas de 1 a 5: se contesta con un toque. Se guardan en la
 * misma escala 1-5 de siempre (1, 3, 5) para que las estadísticas no cambien.
 */
export const CONFIDENCE = [
  { value: 1, key: 'noIdea' },
  { value: 3, key: 'think' },
  { value: 5, key: 'sure' },
] as const

export const CLOSENESS = [
  { value: 5, key: 'yes' },
  { value: 3, key: 'partly' },
  { value: 1, key: 'no' },
] as const

/** Cierra la pregunta con lo cerca que estuvo el intento. */
export async function closeThink(entry: ThinkEntry, closeness: number) {
  await db.thinkEntries.update(entry.id, { status: 'closed', closedAt: new Date().toISOString(), closeness })
  feedback.land()
  await afterActivity()
}

/** Opcional: guarda la respuesta correcta como tarjeta para repasarla después. */
export async function saveThinkCard(entry: ThinkEntry, answer: string) {
  const card = await addCard('think', entry.question, answer, entry.id)
  await db.thinkEntries.update(entry.id, { learned: answer, cardId: card.id })
  feedback.good()
}
