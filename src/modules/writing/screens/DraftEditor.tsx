import { useLiveQuery } from 'dexie-react-hooks'
import { Timer } from 'lucide-react'
import { useEffect, useRef, useState, type ClipboardEvent, type DragEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'
import { db } from '../../../core/db/schema'
import type { Draft } from '../../../core/db/types'
import { feedback } from '../../../core/feedback/feedback'
import { logFlight } from '../../../core/flight-log/flights'
import { afterActivity } from '../../../core/session/session'
import { useSettings } from '../../../core/settings/settings'
import { Button, ButtonLink } from '../../../ui/primitives/Button'
import { TextField } from '../../../ui/primitives/Field'
import { Page } from '../../../ui/primitives/Page'
import { countWords } from '../words'

const TIMER_OPTIONS = [0, 5, 10, 15]

export function DraftEditor() {
  const { t } = useTranslation('writing')
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { allowPaste } = useSettings()
  const stored = useLiveQuery(() => db.drafts.get(id), [id])
  const [draft, setDraft] = useState<Draft>()
  const [pasteNotice, setPasteNotice] = useState(false)
  const [timerMin, setTimerMin] = useState(0)
  const [timerStart, setTimerStart] = useState<number>()
  const [now, setNow] = useState(Date.now())
  const lastTyped = useRef(0)
  const dirty = useRef(false)

  useEffect(() => {
    if (stored && !draft) setDraft(stored)
  }, [stored, draft])

  // Reloj de un segundo: cuenta tiempo de escritura activa (con tecleo en los últimos 30 s)
  // y alimenta el temporizador opcional.
  useEffect(() => {
    const iv = setInterval(() => {
      setNow(Date.now())
      if (Date.now() - lastTyped.current < 30_000) {
        setDraft((d) => (d ? { ...d, secondsWriting: d.secondsWriting + 1 } : d))
      }
    }, 1000)
    return () => clearInterval(iv)
  }, [])

  // Autoguardado cada 3 s si hubo cambios, y siempre al salir del editor.
  const draftRef = useRef(draft)
  draftRef.current = draft
  useEffect(() => {
    const flush = () => {
      const d = draftRef.current
      if (d) void db.drafts.put({ ...d, updatedAt: new Date().toISOString() })
    }
    const iv = setInterval(() => {
      if (dirty.current) {
        dirty.current = false
        flush()
      }
    }, 3000)
    return () => {
      clearInterval(iv)
      flush()
    }
  }, [])

  if (stored === undefined && !draft) return null
  if (!draft) return <Page title={t('notFound')} back="/m/writing" />

  const update = (patch: Partial<Draft>) => {
    dirty.current = true
    setDraft({ ...draft, ...patch })
  }

  function blockPaste(e: ClipboardEvent | DragEvent) {
    if (allowPaste) return
    e.preventDefault()
    setPasteNotice(true)
    update({ pasteAttempts: draft!.pasteAttempts + 1 })
  }

  const remaining = timerStart ? Math.max(0, timerMin * 60 - Math.floor((now - timerStart) / 1000)) : undefined
  const timeUp = remaining === 0

  async function finish() {
    if (!draft) return
    const finished = { ...draft, finishedAt: draft.finishedAt ?? new Date().toISOString(), updatedAt: new Date().toISOString() }
    // El guardado al desmontar usa draftRef: se actualiza para no pisar finishedAt.
    draftRef.current = finished
    await db.drafts.put(finished)
    if (!draft.finishedAt) {
      await logFlight({
        kind: 'real',
        moduleId: 'writing',
        title: draft.title || t('untitled'),
        minutes: Math.max(1, Math.round(draft.secondsWriting / 60)),
        source: 'measured',
        refId: draft.id,
      })
      feedback.land()
      await afterActivity()
    }
    navigate(`/m/writing/d/${draft.id}/compare`)
  }

  return (
    <Page title={t('editorTitle')} back="/m/writing">
      <div className="flex flex-col gap-5">
        <TextField label={t('draftTitle')} hint={t('draftTitleHint')} value={draft.title} onChange={(e) => update({ title: e.target.value })} />
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 font-display text-[0.95rem] font-bold">{t('kindLegend')}</legend>
          <div className="grid grid-cols-3 gap-2">
            {(['message', 'email', 'text'] as const).map((k) => (
              <label key={k} className="relative">
                <input type="radio" name="kind" className="peer absolute inset-0 opacity-0" checked={draft.kind === k} onChange={() => update({ kind: k })} />
                <span className="flex min-h-11 items-center justify-center rounded-xl border border-line bg-panel text-sm peer-checked:border-accent peer-checked:bg-accent peer-checked:text-on-accent peer-focus-visible:outline-3 peer-focus-visible:outline-[var(--focus)]">
                  {t(`kinds.${k}`)}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-wrap items-center gap-2">
          <Timer className="h-5 w-5 text-ink-dim" aria-hidden />
          <span className="text-sm text-ink-dim">{t('timer')}</span>
          {TIMER_OPTIONS.map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={timerMin === m}
              onClick={() => {
                setTimerMin(m)
                setTimerStart(m ? Date.now() : undefined)
              }}
              className={`min-h-10 rounded-lg border px-3 text-sm ${timerMin === m ? 'border-accent bg-accent text-on-accent' : 'border-line'}`}
            >
              {m ? t('minutesShort', { count: m }) : t('noTimer')}
            </button>
          ))}
          {remaining !== undefined && (
            <span className={`readout ml-auto text-lg ${timeUp ? 'text-amber' : ''}`} role="timer" aria-live={timeUp ? 'polite' : 'off'}>
              {timeUp ? t('timeUp') : `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`}
            </span>
          )}
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="font-display text-[0.95rem] font-bold">{t('bodyLabel')}</span>
          <span className="text-sm text-ink-dim">{allowPaste ? t('bodyHintPasteOn') : t('bodyHint')}</span>
          <textarea
            value={draft.body}
            onChange={(e) => {
              lastTyped.current = Date.now()
              update({ body: e.target.value, words: countWords(e.target.value) })
            }}
            onPaste={blockPaste}
            onDrop={blockPaste}
            rows={12}
            spellCheck
            lang="es"
            className="min-h-[40dvh] w-full rounded-xl border border-line bg-panel px-4 py-3 text-lg leading-relaxed focus:border-accent focus:outline-none"
          />
        </label>
        <div aria-live="polite" className="min-h-6 text-sm">
          {pasteNotice && !allowPaste && <p className="text-amber">{t('pasteBlocked')}</p>}
        </div>
        <p className="readout -mt-4 text-sm text-ink-dim">
          {t('wordsCount', { count: draft.words })} · {t('minutesWriting', { count: Math.round(draft.secondsWriting / 60) })}
        </p>
        <Button block onClick={finish} disabled={draft.words < 1}>
          {draft.finishedAt ? t('toCompare') : t('finish')}
        </Button>
        {draft.finishedAt && (
          <ButtonLink to="/m/writing" variant="secondary" block>
            {t('backToList')}
          </ButtonLink>
        )}
      </div>
    </Page>
  )
}
