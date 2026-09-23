import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import { db } from '../../core/db/schema'
import type { CardRendererProps } from '../../core/modules/types'

/** Pregunta el nombre a partir del contexto: dónde, rasgo y conversación. Nunca con foto. */
export function PersonCard({ card, revealed }: CardRendererProps) {
  const { t } = useTranslation('people')
  const person = useLiveQuery(() => (card.sourceId ? db.people.get(card.sourceId) : undefined), [card.sourceId])

  if (!person) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-lg">{card.front}</p>
        {revealed && <p className="animate-pop text-2xl font-bold">{card.back}</p>}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <dl className="grid gap-3">
        <div>
          <dt className="text-sm text-ink-dim">{t('card.where')}</dt>
          <dd className="text-lg">{person.whereMet}</dd>
        </div>
        <div>
          <dt className="text-sm text-ink-dim">{t('card.trait')}</dt>
          <dd className="text-lg">{person.trait}</dd>
        </div>
        {person.conversation && (
          <div>
            <dt className="text-sm text-ink-dim">{t('card.talked')}</dt>
            <dd className="text-lg">{person.conversation}</dd>
          </div>
        )}
      </dl>
      <p className="font-display text-xl font-bold">{t('card.question')}</p>
      {revealed && (
        <div className="animate-pop border-t border-line pt-4">
          <p className="font-display text-3xl font-bold">{person.name}</p>
          {person.linkImage && (
            <p className="mt-2 text-ink-dim">
              {t('card.yourImage')} {person.linkImage}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
