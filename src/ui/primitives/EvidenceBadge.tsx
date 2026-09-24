import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import type { EvidenceLevel } from '../../core/modules/types'

const filled: Record<EvidenceLevel, number> = { alta: 3, moderada: 2, preliminar: 1 }
const color: Record<EvidenceLevel, string> = {
  alta: 'var(--green)',
  moderada: 'var(--accent)',
  preliminar: 'var(--amber)',
}

/** Indicador de tres segmentos, como una barra de nivel de instrumento. */
export function EvidenceBadge({ level, moduleId, link = true, compact }: { level: EvidenceLevel; moduleId?: string; link?: boolean; compact?: boolean }) {
  const { t } = useTranslation()
  const content = (
    <>
      <span aria-hidden className="flex items-end gap-0.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 rounded-sm"
            style={{
              height: `${6 + i * 4}px`,
              background: i < filled[level] ? color[level] : 'var(--line)',
            }}
          />
        ))}
      </span>
      {compact ? (
        <span>
          <span className="sr-only">{t('evidence.badge', { level: t(`evidence.levels.${level}`) })}</span>
          <span aria-hidden className="inline-block first-letter:uppercase">
            {t(`evidence.levels.${level}`)}
          </span>
        </span>
      ) : (
        <span>{t('evidence.badge', { level: t(`evidence.levels.${level}`) })}</span>
      )}
    </>
  )
  const cls = `inline-flex items-center gap-2 self-start rounded-full border border-line text-ink ${compact ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'}`
  return link && moduleId ? (
    <Link to={`/evidence#${moduleId}`} className={`${cls} hover:border-accent`}>
      {content}
    </Link>
  ) : (
    <span className={cls}>{content}</span>
  )
}
