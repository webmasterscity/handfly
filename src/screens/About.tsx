import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Page, Section } from '../ui/primitives/Page'

/** Qué puede y qué no puede hacer Handfly, sin promesas de "más inteligencia". */
export function About() {
  const { t } = useTranslation()
  const can = t('about.can', { returnObjects: true }) as string[]
  const cannot = t('about.cannot', { returnObjects: true }) as string[]
  return (
    <Page title={t('about.title')} lead={t('about.slogan')} back="/settings">
      <div className="prose-text flex flex-col gap-3">
        <p>{t('about.origin')}</p>
        <p>{t('about.idea')}</p>
      </div>

      <Section title={t('about.canTitle')}>
        <ul className="prose-text flex list-disc flex-col gap-2 pl-5">
          {can.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </Section>

      <Section title={t('about.cannotTitle')}>
        <ul className="prose-text flex list-disc flex-col gap-2 pl-5">
          {cannot.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </Section>

      <Section title={t('about.privacyTitle')}>
        <div className="prose-text">
          <p>{t('about.privacy')}</p>
        </div>
      </Section>

      <Section title={t('about.ethicsTitle')}>
        <div className="prose-text">
          <p>{t('about.ethics')}</p>
        </div>
      </Section>

      <Section title={t('about.openTitle')}>
        <div className="prose-text">
          <p>{t('about.open')}</p>
        </div>
        <p className="mt-4 flex flex-wrap gap-4">
          <Link to="/evidence" className="text-accent underline underline-offset-4">
            {t('about.evidenceLink')}
          </Link>
          <a href="https://github.com/webmasterscity/handfly" target="_blank" rel="noreferrer" className="text-accent underline underline-offset-4">
            GitHub
          </a>
        </p>
      </Section>
    </Page>
  )
}
