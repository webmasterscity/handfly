import { useSyncExternalStore } from 'react'
import { feedback } from './feedback'

/**
 * Celebraciones a pantalla completa: ascensos, logros y récords. Van en cola y se
 * muestran de una en una. Son la recompensa visible de la práctica real, así que se
 * reservan para momentos que lo merecen; lo cotidiano se confirma con avisos breves.
 */
export interface Celebration {
  id: number
  kind: 'rank' | 'achievement' | 'record'
  title: string
  subtitle: string
  detail?: string
  /** Para 'rank': índice del rango (dibuja la insignia correspondiente). */
  rankIndex?: number
}

let queue: Celebration[] = []
const listeners = new Set<() => void>()
let seq = 0

function emit() {
  listeners.forEach((l) => l())
}

export function celebrate(c: Omit<Celebration, 'id'>) {
  queue = [...queue, { ...c, id: ++seq }]
  if (queue.length === 1) feedback.land()
  emit()
}

export function dismissCelebration() {
  queue = queue.slice(1)
  if (queue.length) feedback.land()
  emit()
}

export function useCelebration(): Celebration | undefined {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => queue[0],
  )
}

/** Cola pendiente (solo lectura), para pruebas y depuración. */
export function pendingCelebrations(): readonly Celebration[] {
  return queue
}

/** Vacía la cola sin mostrar nada (pruebas). */
export function clearCelebrations() {
  queue = []
  emit()
}
