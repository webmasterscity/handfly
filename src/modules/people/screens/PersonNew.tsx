import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { db } from '../../../core/db/schema'
import type { Person } from '../../../core/db/types'
import { feedback, toast } from '../../../core/feedback/feedback'
import { logFlight } from '../../../core/flight-log/flights'
import { afterActivity, reportActivity } from '../../../core/session/session'
import { ALL_MISSIONS } from '../../../modules/registry'
import { buildCard } from '../../../core/srs/scheduler'
import { dayKey, minutesBetween, newId } from '../../../core/time'
import { Button } from '../../../ui/primitives/Button'
import { TextField } from '../../../ui/primitives/Field'
import { Page } from '../../../ui/primitives/Page'
import { personCardText } from '../personCard'

type Step = 0 | 1 | 2

/**
 * Registro en tres pasos y casi sin escribir: el nombre (lo único que hay que teclear),
 * dónde se conocieron y qué la distingue con un toque, y la técnica de la imagen, que se
 * hace en la cabeza: el nombre convertido en algo visible, pegado a su rasgo, en una
 * escena exagerada. Anotar la imagen es opcional.
 */
export function PersonNew() {
  const { t } = useTranslation('people')
  const navigate = useNavigate()
  const openedAt = useRef(new Date())
  const [step, setStep] = useState<Step>(0)
  const [name, setName] = useState('')
  const [where, setWhere] = useState('')
  const [whereOther, setWhereOther] = useState('')
  const [trait, setTrait] = useState('')
  const [traitOther, setTraitOther] = useState('')
  const [image, setImage] = useState('')
  const [writingImage, setWritingImage] = useState(false)

  const whereChips = t('whereChips', { returnObjects: true }) as string[]
  const traitChips = t('traitChips', { returnObjects: true }) as string[]
  const other = t('other')
  const whereMet = (where === other ? whereOther : where).trim()
  const traitText = (trait === other ? traitOther : trait).trim()
  const valid = [name.trim() && whereMet, traitText, true][step]

  async function save() {
    const id = newId()
    const person: Person = {
      id,
      name: name.trim(),
      whereMet,
      metOn: dayKey(),
      trait: traitText,
      conversation: '',
      nameImage: '',
      featureChosen: traitText,
      linkImage: image.trim(),
      createdAt: new Date().toISOString(),
    }
    const text = personCardText(person)
    const card = buildCard('person', text.front, text.back, id)
    person.cardId = card.id
    await db.transaction('rw', db.people, db.cards, async () => {
      await db.people.add(person)
      await db.cards.add(card)
    })
    await logFlight({
      kind: 'real',
      moduleId: 'people',
      title: t('flightTitle', { name: person.name }),
      minutes: Math.max(1, Math.min(20, minutesBetween(openedAt.current, new Date()))),
      source: 'measured',
      refId: id,
    })
    feedback.good()
    toast(t('saved', { name: person.name }), 'success')
    await reportActivity('person.saved', ALL_MISSIONS)
    await afterActivity()
    navigate('/m/people')
  }

  const titles = [t('step1Title'), t('step2Title'), t('step3Title')]

  return (
    <Page title={titles[step]} back="/m/people">
      <ol className="mb-6 flex gap-1.5" aria-label={t('stepAria', { n: step + 1, total: 3 })}>
        {[0, 1, 2].map((i) => (
          <li key={i} className={`h-2 flex-1 rounded-full ${i <= step ? 'bg-magenta' : 'bg-line'}`} />
        ))}
      </ol>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!valid) return
          if (step < 2) setStep((step + 1) as Step)
          else void save()
        }}
        className="flex flex-col gap-6"
      >
        {step === 0 && (
          <>
            <TextField label={t('name')} value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" autoCapitalize="words" required />
            <Chips legend={t('whereMet')} options={whereChips} value={where} onChange={setWhere} />
            {where === other && <TextField label={t('whereOther')} value={whereOther} onChange={(e) => setWhereOther(e.target.value)} autoFocus />}
          </>
        )}
        {step === 1 && (
          <>
            <Chips legend={t('traitQuestion', { name })} hint={t('traitHint')} options={traitChips} value={trait} onChange={setTrait} />
            {trait === other && <TextField label={t('traitOther')} value={traitOther} onChange={(e) => setTraitOther(e.target.value)} autoFocus />}
          </>
        )}
        {step === 2 && (
          <>
            <ol className="flex flex-col gap-3">
              {[t('imageStep1', { name }), t('imageStep2', { trait: traitText.toLowerCase() }), t('imageStep3')].map((text, i) => (
                <li key={i} className="flex items-start gap-3 rounded-xl bg-panel-2 p-3">
                  <span aria-hidden className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-magenta font-display text-sm font-bold text-on-accent">
                    {i + 1}
                  </span>
                  <span>{text}</span>
                </li>
              ))}
            </ol>
            <p className="rounded-xl border-l-4 border-magenta pl-3 text-ink-dim">{t('imageExample')}</p>
            <div>
              <p className="mb-2 text-center font-display font-bold">{t('imageNow')}</p>
              <div className="h-1.5 overflow-hidden rounded-full bg-line" aria-hidden>
                <div className="hf-imagine-bar h-full bg-magenta" />
              </div>
            </div>
            {writingImage ? (
              <TextField label={t('imageNote')} value={image} onChange={(e) => setImage(e.target.value)} autoFocus />
            ) : (
              <button type="button" onClick={() => setWritingImage(true)} className="self-start py-1 text-sm text-accent underline underline-offset-4">
                {t('imageNoteCta')}
              </button>
            )}
          </>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={() => (step ? setStep((step - 1) as Step) : navigate('/m/people'))}>
            {step ? t('prev') : t('cancel')}
          </Button>
          <Button type="submit" disabled={!valid}>
            {step < 2 ? t('next') : t('finish')}
          </Button>
        </div>
      </form>
    </Page>
  )
}

/** Opciones para tocar en vez de escribir. */
function Chips({ legend, hint, options, value, onChange }: { legend: string; hint?: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <fieldset>
      <legend className="mb-1 font-display text-[0.95rem] font-bold">{legend}</legend>
      {hint && <p className="mb-2 text-sm text-ink-dim">{hint}</p>}
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => (
          <label key={o} className="relative">
            <input type="radio" name={legend} value={o} checked={value === o} onChange={() => onChange(o)} className="peer absolute inset-0 opacity-0" />
            <span className="flex min-h-11 items-center rounded-full border-2 border-line bg-panel px-4 font-bold transition-colors peer-checked:border-magenta peer-checked:bg-magenta peer-checked:text-on-accent peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--focus)]">
              {o}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
