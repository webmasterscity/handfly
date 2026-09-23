import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { db } from '../../../core/db/schema'
import { toast } from '../../../core/feedback/feedback'
import { newId } from '../../../core/time'
import { Button } from '../../../ui/primitives/Button'
import { TextField } from '../../../ui/primitives/Field'
import { Page } from '../../../ui/primitives/Page'
import { LandmarkList } from '../LandmarkList'

export function RoutePlan() {
  const { t } = useTranslation('navigation')
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [landmarks, setLandmarks] = useState(['', '', ''])
  const filled = landmarks.filter((l) => l.trim())
  const valid = title.trim() && from.trim() && to.trim() && filled.length >= 2

  async function save(e: FormEvent) {
    e.preventDefault()
    if (!valid) return
    await db.routes.add({
      id: newId(),
      title: title.trim(),
      from: from.trim(),
      to: to.trim(),
      plannedLandmarks: filled.map((l) => l.trim()),
      status: 'planned',
      createdAt: new Date().toISOString(),
    })
    toast(t('planned'), 'success')
    navigate('/m/navigation')
  }

  return (
    <Page title={t('planTitle')} lead={t('planLead')} back="/m/navigation">
      <form onSubmit={save} className="flex flex-col gap-6">
        <TextField label={t('routeTitle')} hint={t('routeTitleHint')} value={title} onChange={(e) => setTitle(e.target.value)} required />
        <div className="grid grid-cols-2 gap-3">
          <TextField label={t('from')} value={from} onChange={(e) => setFrom(e.target.value)} required />
          <TextField label={t('to')} value={to} onChange={(e) => setTo(e.target.value)} required />
        </div>
        <p className="rounded-xl bg-panel-2 p-4 text-sm">{t('landmarksHelp')}</p>
        <LandmarkList legend={t('landmarksLegend')} value={landmarks} onChange={setLandmarks} />
        <Button type="submit" block disabled={!valid}>
          {t('savePlan')}
        </Button>
      </form>
    </Page>
  )
}
