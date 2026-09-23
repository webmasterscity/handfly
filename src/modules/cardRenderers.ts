import type { ComponentType } from 'react'
import type { CardKind } from '../core/db/types'
import type { CardRendererProps } from '../core/modules/types'
import { PersonCard } from './people/PersonCard'

// Cada módulo puede registrar aquí cómo se pregunta su tipo de tarjeta.
// Los tipos sin renderer propio usan DefaultCard.
export const cardRenderers: Partial<Record<CardKind, ComponentType<CardRendererProps>>> = {
  person: PersonCard,
}
