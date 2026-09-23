import { ExternalLink } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router'
import { FOUNDATIONS } from '../core/evidence/foundations'
import type { Reference } from '../core/modules/types'
import { useLocalized } from '../i18n'
import { MODULES } from '../modules/registry'
import { EvidenceBadge } from '../ui/primitives/EvidenceBadge'
import { Page, Section } from '../ui/primitives/Page'

function RefList({ refs }: { refs: Reference[] }) {
  const { t } = useTranslation()
  const L = useLocalized()
  return (
    <ol className="flex flex-col gap-4">
      {refs.map((r) => {
        const href = r.doi ? `https://doi.org/${r.doi}` : r.url
        return (
          <li key={r.title} className="border-l-2 border-line pl-4">
            <p className="text-sm">
              {r.authors} ({r.year}). <cite className="font-bold not-italic">{r.title}</cite>. <span className="text-ink-dim">{r.source}.</span>
              {!r.peerReviewed && <span className="ml-1 rounded bg-panel-2 px-1.5 py-0.5 text-xs text-amber">{t('evidence.notPeerReviewed')}</span>}
            </p>
            <p className="mt-1 text-sm text-ink-dim">{L(r.note)}</p>
            {href && (
              <a href={href} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm text-accent underline underline-offset-4">
                {r.doi ? `doi:${r.doi}` : href}
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            )}
          </li>
        )
      })}
    </ol>
  )
}

export function Evidence() {
  const { t } = useTranslation()
  const L = useLocalized()
  const location = useLocation()

  // Enlaces profundos (#think-first) desde las insignias de evidencia.
  useEffect(() => {
    const id = location.hash.slice(1)
    if (id) document.getElementById(id)?.scrollIntoView({ block: 'start' })
  }, [location.hash])

  return (
    <Page title={t('evidence.title')} lead={t('evidence.lead')} back="/practice">
      <section className="rounded-2xl border border-line bg-panel p-4">
        <h2 className="mb-2 text-lg">{t('evidence.levelsTitle')}</h2>
        <dl className="flex flex-col gap-3">
          {(['alta', 'moderada', 'preliminar'] as const).map((lvl) => (
            <div key={lvl}>
              <dt>
                <EvidenceBadge level={lvl} link={false} />
              </dt>
              <dd className="mt-1 text-sm text-ink-dim">{t(`evidence.levelDesc.${lvl}`)}</dd>
            </div>
          ))}
        </dl>
      </section>

      {FOUNDATIONS.map((f) => (
        <Section key={f.id} id={f.id} title={L(f.title)}>
          <div className="prose-text mb-4">
            <p>{L(f.body)}</p>
          </div>
          <RefList refs={f.references} />
        </Section>
      ))}

      {MODULES.map(({ meta }) => (
        <Section key={meta.id} id={meta.id} title={t(`modules.${meta.id}`)}>
          <div>
            <div className="mb-3">
              <EvidenceBadge level={meta.evidence.level} link={false} />
            </div>
            <div className="prose-text mb-3">
              <p>{L(meta.evidence.summary)}</p>
            </div>
            <p className="mb-1 text-sm font-bold">{t('evidence.transfer')}</p>
            <div className="prose-text mb-4 text-ink-dim">
              <p>{L(meta.transfer)}</p>
            </div>
            <RefList refs={meta.evidence.references} />
          </div>
        </Section>
      ))}
    </Page>
  )
}
