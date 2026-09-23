import type { ComponentType } from 'react'
import { useTranslation } from 'react-i18next'
import type { CardKind } from '../core/db/types'
import type { CardRendererProps } from '../core/modules/types'
import { PersonCard } from './people/PersonCard'

export function DefaultCard({ card, revealed }: CardRendererProps) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-4">
      <p className="text-xl leading-snug font-bold whitespace-pre-wrap">{card.front}</p>
      {revealed && (
        <div className="animate-pop border-t border-line pt-4">
          <p className="text-sm text-ink-dim">{t('review.answer')}</p>
          <p className="text-lg whitespace-pre-wrap">{card.back}</p>
        </div>
      )}
    </div>
  )
}

// Cada módulo puede registrar aquí cómo se pregunta su tipo de tarjeta.
export const cardRenderers: Partial<Record<CardKind, ComponentType<CardRendererProps>>> = {
  person: PersonCard,
}
