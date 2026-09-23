import { ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { MODULES } from '../modules/registry'
import { EvidenceBadge } from '../ui/primitives/EvidenceBadge'
import { Page } from '../ui/primitives/Page'

export function Practice() {
  const { t } = useTranslation()
  return (
    <Page title={t('practice.title')} lead={t('practice.lead')}>
      <ul className="flex flex-col gap-3">
        {MODULES.map(({ meta, icon: Icon }) => (
          <li key={meta.id} className="relative rounded-2xl border border-line bg-panel p-4 hover:border-accent">
            <div className="flex items-start gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-panel-2" style={{ color: meta.accent }}>
                <Icon className="h-6 w-6" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg">
                  <Link to={`/m/${meta.id}`} className="after:absolute after:inset-0 after:content-['']">
                    {t(`modules.${meta.id}`)}
                  </Link>
                </h2>
                <p className="mb-3 text-ink-dim">{t(`moduleBlurbs.${meta.id}`)}</p>
                <EvidenceBadge level={meta.evidence.level} link={false} />
              </div>
              <ChevronRight className="mt-3 h-5 w-5 shrink-0 text-ink-dim" aria-hidden />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm text-ink-dim">
        {t('practice.whyNoGames')}{' '}
        <Link to="/evidence" className="text-accent underline underline-offset-4">
          {t('practice.seeEvidence')}
        </Link>
      </p>
    </Page>
  )
}
