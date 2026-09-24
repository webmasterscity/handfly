import { useLiveQuery } from 'dexie-react-hooks'
import { Calculator, Compass, Layers } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import type { ModuleId } from '../core/db/types'
import { countDue } from '../core/srs/scheduler'
import { loadSnapshot } from '../core/stats/stats'
import { startOfWeek, dayKey } from '../core/time'
import { MODULES } from '../modules/registry'
import { EvidenceBadge } from '../ui/primitives/EvidenceBadge'
import { Page, Section } from '../ui/primitives/Page'

/**
 * Practicar: arriba, los juegos cortos del simulador; abajo, las seis habilidades con
 * cuánto las practicaste esta semana. Cada una lleva su insignia de evidencia.
 */
export function Practice() {
  const { t } = useTranslation()
  const snap = useLiveQuery(() => loadSnapshot(), [])
  const due = useLiveQuery(() => countDue(), [])
  const monday = dayKey(startOfWeek(new Date()))
  const weekCount = (id: ModuleId) => snap?.flights.filter((f) => f.moduleId === id && f.date >= monday).length ?? 0

  return (
    <Page title={t('practice.title')} lead={t('practice.lead')}>
      <Section title={t('practice.quickTitle')}>
        <ul className="grid grid-cols-2 gap-3">
          <QuickGame to="/m/calculation/practice" color="var(--green)" icon={<Calculator className="h-6 w-6" aria-hidden />} title={t('practice.quickCalc')} hint={t('practice.quickCalcHint')} />
          <QuickGame to="/m/navigation/compass" color="var(--magenta)" icon={<Compass className="h-6 w-6" aria-hidden />} title={t('practice.quickCompass')} hint={t('practice.quickCompassHint')} />
          {Boolean(due) && (
            <QuickGame
              to="/m/recall/review"
              color="var(--accent)"
              icon={<Layers className="h-6 w-6" aria-hidden />}
              title={t('practice.quickReview')}
              hint={t('practice.quickReviewHint', { count: due })}
              wide
            />
          )}
        </ul>
      </Section>

      <Section title={t('practice.skillsTitle')}>
        <ul className="grid grid-cols-2 gap-3">
          {MODULES.map(({ meta, icon: Icon }) => {
            const n = weekCount(meta.id)
            return (
              <li key={meta.id} className="relative flex flex-col overflow-hidden rounded-2xl border border-line bg-panel">
                <span className="h-1.5" style={{ background: meta.accent }} aria-hidden />
                <div className="flex flex-1 flex-col gap-2 p-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl text-on-accent" style={{ background: meta.accent }}>
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h2 className="text-base leading-snug">
                    <Link to={`/m/${meta.id}`} className="after:absolute after:inset-0 after:content-['']">
                      {t(`modules.${meta.id}`)}
                    </Link>
                  </h2>
                  <p className="text-sm text-ink-dim">{t(`moduleBlurbs.${meta.id}`)}</p>
                  <div className="mt-auto flex flex-col gap-2 pt-1">
                    <p className="flex items-center gap-1" aria-hidden>
                      {Array.from({ length: 5 }, (_, i) => (
                        <span key={i} aria-hidden className="h-2 flex-1 rounded-full" style={{ background: i < n ? meta.accent : 'var(--line)' }} />
                      ))}
                    </p>
                    <p className="text-xs text-ink-dim">
                      {t('practice.thisWeek', { count: n })}
                    </p>
                    <EvidenceBadge level={meta.evidence.level} link={false} compact />
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </Section>

      <p className="mt-6 text-sm text-ink-dim">
        {t('practice.whyNoGames')}{' '}
        <Link to="/evidence" className="text-accent underline underline-offset-4">
          {t('practice.seeEvidence')}
        </Link>
      </p>
    </Page>
  )
}

function QuickGame({ to, color, icon, title, hint, wide }: { to: string; color: string; icon: ReactNode; title: string; hint: string; wide?: boolean }) {
  return (
    <li className={wide ? 'col-span-2' : ''}>
      <Link to={to} className="flex h-full flex-col gap-2 rounded-2xl p-4 text-on-accent" style={{ background: color }}>
        {icon}
        <span className="font-display text-lg leading-tight font-bold">{title}</span>
        <span className="text-sm">{hint}</span>
      </Link>
    </li>
  )
}
