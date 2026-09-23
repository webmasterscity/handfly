import { useTranslation } from 'react-i18next'
import { ButtonLink } from '../ui/primitives/Button'
import { Page } from '../ui/primitives/Page'

export function NotFound() {
  const { t } = useTranslation()
  return (
    <Page title={t('notFound.title')} lead={t('notFound.lead')}>
      <ButtonLink to="/">{t('notFound.cta')}</ButtonLink>
    </Page>
  )
}
