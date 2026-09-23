import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { db } from '../../../core/db/schema'
import type { Person } from '../../../core/db/types'
import { feedback, toast } from '../../../core/feedback/feedback'
import { logFlight } from '../../../core/flight-log/flights'
import { afterActivity } from '../../../core/session/session'
import { buildCard } from '../../../core/srs/scheduler'
import { dayKey, minutesBetween, newId } from '../../../core/time'
import { Button } from '../../../ui/primitives/Button'
import { TextArea, TextField } from '../../../ui/primitives/Field'
import { Page } from '../../../ui/primitives/Page'
import { personCardText } from '../personCard'

type Step = 0 | 1 | 2 | 3

/**
 * Registro guiado en cuatro pasos. Los pasos 3 y 4 son la técnica mnemotécnica:
 * nombre → imagen concreta, rasgo destacado, escena que los une, y visualizarla.
 */
export function PersonNew() {
  const { t } = useTranslation('people')
  const navigate = useNavigate()
  const openedAt = useRef(new Date())
  const [step, setStep] = useState<Step>(0)
  const [p, setP] = useState({
    name: '',
    whereMet: '',
    metOn: dayKey(),
    trait: '',
    conversation: '',
    nameImage: '',
    featureChosen: '',
    linkImage: '',
  })
  const set = (k: keyof typeof p) => (e: { target: { value: string } }) => setP({ ...p, [k]: e.target.value })

  const valid = [
    p.name.trim() && p.whereMet.trim(),
    p.trait.trim(),
    p.nameImage.trim() && (p.featureChosen.trim() || p.trait.trim()) && p.linkImage.trim(),
    true,
  ][step]

  async function save() {
    const id = newId()
    const person: Person = {
      id,
      name: p.name.trim(),
      whereMet: p.whereMet.trim(),
      metOn: p.metOn,
      trait: p.trait.trim(),
      conversation: p.conversation.trim(),
      nameImage: p.nameImage.trim(),
      featureChosen: (p.featureChosen || p.trait).trim(),
      linkImage: p.linkImage.trim(),
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
      minutes: Math.min(20, minutesBetween(openedAt.current, new Date())),
      source: 'measured',
      refId: id,
    })
    feedback.good()
    toast(t('saved', { name: person.name }), 'success')
    await afterActivity()
    navigate('/m/people')
  }

  const titles = [t('step1Title'), t('step2Title'), t('step3Title'), t('step4Title')]

  return (
    <Page title={titles[step]} back="/m/people">
      <p className="readout mb-4 text-sm text-ink-dim" aria-label={t('stepAria', { n: step + 1, total: 4 })}>
        {step + 1}/4
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!valid) return
          if (step < 3) setStep((step + 1) as Step)
          else void save()
        }}
        className="flex flex-col gap-6"
      >
        {step === 0 && (
          <>
            <TextField label={t('name')} value={p.name} onChange={set('name')} autoComplete="off" required />
            <TextField label={t('whereMet')} hint={t('whereMetHint')} value={p.whereMet} onChange={set('whereMet')} required />
            <TextField label={t('metOn')} type="date" value={p.metOn} onChange={set('metOn')} max={dayKey()} />
          </>
        )}
        {step === 1 && (
          <>
            <TextField label={t('trait')} hint={t('traitHint')} value={p.trait} onChange={set('trait')} required />
            <TextArea label={t('conversation')} hint={t('conversationHint')} value={p.conversation} onChange={set('conversation')} rows={3} />
          </>
        )}
        {step === 2 && (
          <>
            <p className="rounded-xl bg-panel-2 p-4">{t('mnemonicIntro')}</p>
            <TextField
              label={t('nameImage', { name: p.name })}
              hint={t('nameImageHint')}
              value={p.nameImage}
              onChange={set('nameImage')}
              required
            />
            <TextField
              label={t('featureChosen')}
              hint={t('featureChosenHint')}
              value={p.featureChosen}
              placeholder={p.trait}
              onChange={set('featureChosen')}
            />
            <TextArea label={t('linkImage')} hint={t('linkImageHint')} value={p.linkImage} onChange={set('linkImage')} rows={3} required />
          </>
        )}
        {step === 3 && (
          <div className="rounded-2xl border border-line bg-panel p-5">
            <p className="mb-4">{t('visualize')}</p>
            <p className="font-display text-xl font-bold">{p.linkImage}</p>
            <p className="mt-4 text-sm text-ink-dim">{t('visualizeAfter', { name: p.name })}</p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={() => (step ? setStep((step - 1) as Step) : navigate('/m/people'))}>
            {step ? t('prev') : t('cancel')}
          </Button>
          <Button type="submit" disabled={!valid}>
            {step < 3 ? t('next') : t('finish')}
          </Button>
        </div>
      </form>
    </Page>
  )
}
