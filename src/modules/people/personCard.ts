import type { Person } from '../../core/db/types'

/** Texto plano de respaldo de la tarjeta (se usa si la persona ya no existe). */
export function personCardText(p: Pick<Person, 'name' | 'whereMet' | 'trait' | 'conversation' | 'linkImage'>) {
  return {
    front: [p.whereMet, p.trait, p.conversation].filter(Boolean).join(' · '),
    back: [p.name, p.linkImage].filter(Boolean).join(' — '),
  }
}
