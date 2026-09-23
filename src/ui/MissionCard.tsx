import { Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { db } from '../core/db/schema'
import type { Mission } from '../core/db/types'
import { completeMission, findTemplate, swapTodayMission } from '../core/session/session'
import { ALL_MISSIONS, ENABLED_MODULE_IDS } from '../modules/registry'
import { Button } from './primitives/Button'
import { TextField } from './primitives/Field'

/** La misión del mundo real del día: aceptar, cambiar una vez o marcar como cumplida. */
export function MissionCard({ mission, onChange }: { mission: Mission; onChange?: () => void }) {
  const { t } = useTranslation()
  const template = findTemplate(ALL_MISSIONS, mission.templateId)
  const [reporting, setReporting] = useState(false)
  const [minutes, setMinutes] = useState(String(template?.minutes ?? 10))
  const [note, setNote] = useState('')
  const [swapped, setSwapped] = useState(false)

  const text = template ? t(`missions.${template.textKey}`) : t('missions.fallbackTitle')

  async function done() {
    await completeMission(mission, template, Math.max(1, Number(minutes) || 1), note.trim())
    setReporting(false)
    onChange?.()
  }

  return (
    <div className={`rounded-2xl border bg-panel p-4 ${mission.surprise ? 'border-magenta' : 'border-line'}`}>
      <p className="mb-1 flex items-center gap-2 text-sm text-ink-dim">
        {mission.surprise && <Sparkles className="h-4 w-4 text-magenta" aria-hidden />}
        {mission.surprise ? t('missions.surpriseLabel') : t('missions.label')} · {t(`modules.${mission.moduleId}`)}
      </p>
      <p className="text-lg leading-snug font-bold">{text}</p>

      {mission.status === 'done' ? (
        <p className="mt-3 font-bold text-green">{t('missions.doneLabel')}</p>
      ) : reporting ? (
        <form
          className="mt-4 flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            void done()
          }}
        >
          <TextField label={t('missions.minutes')} type="number" inputMode="numeric" min={1} max={600} value={minutes} onChange={(e) => setMinutes(e.target.value)} />
          <TextField label={t('missions.note')} hint={t('missions.noteHint')} value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setReporting(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit">{t('missions.logIt')}</Button>
          </div>
        </form>
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          {mission.status === 'offered' ? (
            <Button
              block
              onClick={async () => {
                await db.missions.update(mission.id, { status: 'accepted' })
                onChange?.()
              }}
            >
              {t('missions.accept')}
            </Button>
          ) : (
            <Button block onClick={() => setReporting(true)}>
              {t('missions.didIt')}
            </Button>
          )}
          <div className="grid grid-cols-2 gap-2">
            {mission.status === 'offered' && (
              <Button variant="secondary" onClick={() => setReporting(true)}>
                {t('missions.alreadyDone')}
              </Button>
            )}
            {!swapped && (
              <Button
                variant="ghost"
                className={mission.status === 'offered' ? '' : 'col-span-2'}
                onClick={async () => {
                  setSwapped(true)
                  await swapTodayMission(mission, ALL_MISSIONS, ENABLED_MODULE_IDS)
                  onChange?.()
                }}
              >
                {t('missions.swap')}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
