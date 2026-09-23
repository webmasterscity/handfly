import { useLiveQuery } from 'dexie-react-hooks'
import { Timer } from 'lucide-react'
import { useEffect, useRef, useState, type ClipboardEvent, type DragEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'
import { db } from '../../../core/db/schema'
import type { Draft } from '../../../core/db/types'
import { feedback } from '../../../core/feedback/feedback'
import { logFlight } from '../../../core/flight-log/flights'
import { afterActivity, reportActivity } from '../../../core/session/session'
import { ALL_MISSIONS } from '../../../modules/registry'
import { useSettings } from '../../../core/settings/settings'
import { Button, ButtonLink } from '../../../ui/primitives/Button'
import { TextField } from '../../../ui/primitives/Field'
import { Page } from '../../../ui/primitives/Page'
import { countWords } from '../words'

const TIMER_OPTIONS = [0, 5, 10, 15]

export function DraftEditor() {
  const { t } = useTranslation('writing')
  const { id = '' } = useParams()
  // undefined = cargando; null = no existe.
  const stored = useLiveQuery(async () => (await db.drafts.get(id)) ?? null, [id])
  if (stored === undefined) return null
  if (stored === null) return <Page title={t('notFound')} back="/m/writing" />
  return <Editor key={stored.id} initial={stored} />
}

function Editor({ initial }: { initial: Draft }) {
  const { t } = useTranslation('writing')
  const navigate = useNavigate()
  const { allowPaste } = useSettings()
  const [draft, setDraft] = useState<Draft>(initial)
  const [pasteNotice, setPasteNotice] = useState(false)
  const [timerMin, setTimerMin] = useState(0)
  const [timerStart, setTimerStart] = useState<number>()
  const [now, setNow] = useState(() => Date.now())
  const lastTyped = useRef(0)
  const dirty = useRef(false)
  const draftRef = useRef(draft)

  // Reloj de un segundo: cuenta tiempo de escritura activa (con tecleo en los últimos 30 s)
  // y alimenta el temporizador opcional.
  useEffect(() => {
    const iv = setInterval(() => {
      setNow(Date.now())
      if (Date.now() - lastTyped.current < 30_000) {
        setDraft((d) => ({ ...d, secondsWriting: d.secondsWriting + 1 }))
      }
    }, 1000)
    return () => clearInterval(iv)
  }, [])

  // Autoguardado cada 3 s si hubo cambios, y siempre al salir del editor.
  useEffect(() => {
    draftRef.current = draft
  }, [draft])
  useEffect(() => {
    const flush = () => void db.drafts.put({ ...draftRef.current, updatedAt: new Date().toISOString() })
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

  const update = (patch: Partial<Draft>) => {
    dirty.current = true
    setDraft({ ...draft, ...patch })
  }

  function blockPaste(e: ClipboardEvent | DragEvent) {
    if (allowPaste) return
    e.preventDefault()
    setPasteNotice(true)
    update({ pasteAttempts: draft.pasteAttempts + 1 })
  }

  const remaining = timerStart ? Math.max(0, timerMin * 60 - Math.floor((now - timerStart) / 1000)) : undefined
  const timeUp = remaining === 0

  async function finish() {
    const finished = { ...draft, finishedAt: draft.finishedAt ?? new Date().toISOString(), updatedAt: new Date().toISOString() }
    // El guardado al desmontar usa draftRef. Se actualizan referencia y estado: si solo se
    // tocara la referencia, el reloj de un segundo re-renderiza y la pisa sin finishedAt.
    draftRef.current = finished
    setDraft(finished)
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
      await reportActivity('draft.finished', ALL_MISSIONS)
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
