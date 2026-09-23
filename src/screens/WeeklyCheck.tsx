import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { db } from '../core/db/schema'
import { feedback, toast } from '../core/feedback/feedback'
import { afterActivity } from '../core/session/session'
import { weekKey } from '../core/time'
import { Button } from '../ui/primitives/Button'
import { TextArea } from '../ui/primitives/Field'
import { Page } from '../ui/primitives/Page'

const toLines = (s: string) => s.split('\n').map((l) => l.trim()).filter(Boolean)

/** Chequeo semanal: una línea por situación real. Sin juicio: es un registro, no un examen. */
export function WeeklyCheck() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const week = weekKey()
  const existing = useLiveQuery(() => db.weeklyChecks.get(week), [week])
  const [crutches, setCrutches] = useState('')
  const [solo, setSolo] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    if (existing) {
      setCrutches(existing.crutches.join('\n'))
      setSolo(existing.solo.join('\n'))
      setNote(existing.note)
    }
  }, [existing])

  async function save() {
    await db.weeklyChecks.put({ week, crutches: toLines(crutches), solo: toLines(solo), note: note.trim(), createdAt: new Date().toISOString() })
    feedback.good()
    toast(t('weekly.saved'), 'success')
    await afterActivity()
    navigate('/progress')
  }

  return (
    <Page title={t('weekly.title')} lead={t('weekly.lead')} back="/progress">
      <div className="flex flex-col gap-6">
        <TextArea label={t('weekly.soloLabel')} hint={t('weekly.soloHint')} value={solo} onChange={(e) => setSolo(e.target.value)} rows={5} />
        <TextArea label={t('weekly.crutchLabel')} hint={t('weekly.crutchHint')} value={crutches} onChange={(e) => setCrutches(e.target.value)} rows={5} />
        <TextArea label={t('weekly.noteLabel')} hint={t('weekly.noteHint')} value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
        <Button block onClick={save} disabled={!solo.trim() && !crutches.trim()}>
          {t('weekly.save')}
        </Button>
      </div>
    </Page>
  )
}
