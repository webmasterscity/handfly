import type { MissionTemplate } from '../modules/types'

// Misiones sorpresa: pequeñas, del mundo real y sin módulo "dueño" claro. Se reparten
// con baja probabilidad para que la recompensa sea variable, nunca obligatoria.
export const SURPRISE_MISSIONS: MissionTemplate[] = [
  { id: 'surprise-phone', moduleId: 'recall', textKey: 'surprise.phone', minutes: 5, surprise: true },
  { id: 'surprise-askway', moduleId: 'navigation', textKey: 'surprise.askWay', minutes: 10, surprise: true, check: { kind: 'peeks' } },
  { id: 'surprise-teach', moduleId: 'recall', textKey: 'surprise.teach', minutes: 10, surprise: true, check: { kind: 'closeness' } },
  { id: 'surprise-birthday', moduleId: 'people', textKey: 'surprise.birthday', minutes: 5, surprise: true, check: { kind: 'count', total: 3 } },
  { id: 'surprise-handwrite', moduleId: 'writing', textKey: 'surprise.handwrite', minutes: 10, surprise: true },
  { id: 'surprise-clock', moduleId: 'calculation', textKey: 'surprise.clock', minutes: 5, surprise: true, check: { kind: 'minutesUntil' } },
]
