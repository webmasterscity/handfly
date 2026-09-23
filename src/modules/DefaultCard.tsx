import { useTranslation } from 'react-i18next'
import type { CardRendererProps } from '../core/modules/types'

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
