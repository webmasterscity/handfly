import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'
import { db } from '../../../core/db/schema'
import { toast } from '../../../core/feedback/feedback'
import { Button, ButtonLink } from '../../../ui/primitives/Button'
import { TextArea } from '../../../ui/primitives/Field'
import { Page } from '../../../ui/primitives/Page'

/** Comparación opcional con una versión de IA. Aquí sí se puede pegar: es la versión ajena. */
export function DraftCompare() {
  const { t } = useTranslation('writing')
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const draft = useLiveQuery(() => db.drafts.get(id), [id])
  const [aiVersion, setAiVersion] = useState('')
  const [keep, setKeep] = useState('')

  useEffect(() => {
    if (draft) {
      setAiVersion(draft.aiVersion ?? '')
      setKeep(draft.keepFromMine ?? '')
    }
  }, [draft])

  if (draft === undefined) return null
  if (!draft) return <Page title={t('notFound')} back="/m/writing" />

  async function save() {
    await db.drafts.update(id, { aiVersion: aiVersion.trim() || undefined, keepFromMine: keep.trim() || undefined })
    toast(t('compareSaved'), 'success')
    navigate('/m/writing')
  }

  return (
    <Page title={t('compareTitle')} lead={t('compareLead')} back={`/m/writing/d/${id}`}>
      <div className="mb-6 rounded-2xl border border-line bg-panel p-4">
        <p className="mb-2 text-sm text-ink-dim">{t('yourVersion')}</p>
        <p className="whitespace-pre-wrap">{draft.body}</p>
      </div>
      <div className="flex flex-col gap-6">
        <TextArea label={t('aiVersionLabel')} hint={t('aiVersionHint')} value={aiVersion} onChange={(e) => setAiVersion(e.target.value)} rows={6} />
        <TextArea label={t('keepLabel')} hint={t('keepHint')} value={keep} onChange={(e) => setKeep(e.target.value)} rows={4} />
        <Button block onClick={save} disabled={!aiVersion.trim() && !keep.trim()}>
          {t('saveCompare')}
        </Button>
        <ButtonLink to="/m/writing" variant="secondary" block>
          {t('skipCompare')}
        </ButtonLink>
      </div>
    </Page>
  )
}
