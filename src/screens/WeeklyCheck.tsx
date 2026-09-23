import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { db } from '../core/db/schema'
import type { WeeklyCheck as WeeklyCheckRow } from '../core/db/types'
import { feedback, toast } from '../core/feedback/feedback'
import { afterActivity } from '../core/session/session'
import { weekKey } from '../core/time'
import { Button } from '../ui/primitives/Button'
import { TextArea } from '../ui/primitives/Field'
import { Page } from '../ui/primitives/Page'

const toLines = (s: string) => s.split('\n').map((l) => l.trim()).filter(Boolean)

/** Chequeo semanal: una línea por situación real. Sin juicio: es un registro, no un examen. */
export function WeeklyCheck() {
  const week = weekKey()
  // null = no hay chequeo esta semana; undefined = todavía cargando.
  const existing = useLiveQuery(async () => (await db.weeklyChecks.get(week)) ?? null, [week])
  if (existing === undefined) return null
  return <WeeklyCheckForm key={week} week={week} existing={existing} />
}

function WeeklyCheckForm({ week, existing }: { week: string; existing: WeeklyCheckRow | null }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [crutches, setCrutches] = useState(existing?.crutches.join('\n') ?? '')
  const [solo, setSolo] = useState(existing?.solo.join('\n') ?? '')
  const [note, setNote] = useState(existing?.note ?? '')

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
