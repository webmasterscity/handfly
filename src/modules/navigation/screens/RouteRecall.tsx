import { useLiveQuery } from 'dexie-react-hooks'
import { Check, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router'
import { db } from '../../../core/db/schema'
import { feedback } from '../../../core/feedback/feedback'
import { logFlight } from '../../../core/flight-log/flights'
import { afterActivity } from '../../../core/session/session'
import { Button, ButtonLink } from '../../../ui/primitives/Button'
import { Page } from '../../../ui/primitives/Page'
import { LandmarkList } from '../LandmarkList'
import { orderScore } from '../score'
import { SketchPad, type SketchPadHandle } from '../SketchPad'

export function RouteRecall() {
  const { t } = useTranslation('navigation')
  const { id = '' } = useParams()
  const route = useLiveQuery(() => db.routes.get(id), [id])
  const [recalled, setRecalled] = useState(['', '', ''])
  const [tab, setTab] = useState<'list' | 'sketch'>('list')
  const sketchRef = useRef<SketchPadHandle>(null)
  const [result, setResult] = useState<{ score: number; matched: boolean[] }>()

  if (route === undefined) return null
  if (!route) return <Page title={t('notFound')} back="/m/navigation" />

  const filled = recalled.filter((r) => r.trim())

  async function submit() {
    if (!route) return
    const res = orderScore(route.plannedLandmarks, filled)
    await db.routes.update(route.id, {
      status: 'recalled',
      recalledLandmarks: filled,
      recallScore: res.score,
      sketch: sketchRef.current?.toDataUrl() ?? route.sketch,
      recalledAt: new Date().toISOString(),
    })
    await logFlight({ kind: 'sim', moduleId: 'navigation', title: t('recallSimTitle', { title: route.title }), minutes: 5, source: 'declared', refId: route.id })
    if (res.score >= 0.8) feedback.land()
    else feedback.good()
    await afterActivity()
    setResult(res)
  }

  if (result || route.status === 'recalled') {
    const res = result ?? orderScore(route.plannedLandmarks, route.recalledLandmarks ?? [])
    return (
      <Page title={t('resultTitle')} lead={t('resultLead', { pct: Math.round(res.score * 100) })} back="/m/navigation">
        <h2 className="mb-3 text-lg">{t('plannedVsRecalled')}</h2>
        <ol className="mb-6 flex flex-col gap-2">
          {route.plannedLandmarks.map((l, i) => (
            <li key={i} className="flex items-center gap-3 rounded-xl border border-line bg-panel px-4 py-3">
              {res.matched[i] ? (
                <Check className="h-5 w-5 shrink-0 text-green" aria-label={t('matched')} />
              ) : (
                <X className="h-5 w-5 shrink-0 text-amber" aria-label={t('missed')} />
              )}
              <span>{l}</span>
            </li>
          ))}
        </ol>
        <p className="mb-2 text-sm text-ink-dim">{t('youWrote')}</p>
        <p className="mb-6">{(route.recalledLandmarks ?? filled).join(' → ') || '—'}</p>
        {route.sketch && <img src={route.sketch} alt={t('sketchAlt')} className="mb-6 w-full rounded-2xl border border-line" />}
        <ButtonLink to="/m/navigation" block>
          {t('backToRoutes')}
        </ButtonLink>
      </Page>
    )
  }

  return (
    <Page title={t('recallTitle')} lead={t('recallLead')} back="/m/navigation">
      <div role="tablist" aria-label={t('recallModes')} className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-panel-2 p-1">
        {(['list', 'sketch'] as const).map((k) => (
          <button
            key={k}
            role="tab"
            type="button"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={`min-h-11 rounded-lg font-display font-bold ${tab === k ? 'bg-panel text-ink shadow' : 'text-ink-dim'}`}
          >
            {t(`mode.${k}`)}
          </button>
        ))}
      </div>
      {/* El croquis se mantiene montado para no perder el dibujo al cambiar de pestaña. */}
      <div hidden={tab !== 'list'}>
        <LandmarkList legend={t('recallLegend')} value={recalled} onChange={setRecalled} />
      </div>
      <div hidden={tab !== 'sketch'}>
        <p className="mb-3 text-sm text-ink-dim">{t('sketchHelp')}</p>
        <SketchPad ref={sketchRef} label={t('sketchLabel')} />
      </div>
      <Button className="mt-6" block disabled={!filled.length} onClick={submit}>
        {t('compare')}
      </Button>
      {!filled.length && <p className="mt-2 text-sm text-ink-dim">{t('needOne')}</p>}
    </Page>
  )
}
