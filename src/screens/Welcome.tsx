import { ArrowLeft, Check, Plane, Ticket, Trophy } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import type { ModuleId } from '../core/db/types'
import { feedback } from '../core/feedback/feedback'
import { updateSettings, useSettings } from '../core/settings/settings'
import { MODULES } from '../modules/registry'
import { Wings } from '../ui/instruments/Wings'
import { Button } from '../ui/primitives/Button'

/**
 * Bienvenida en tres pantallas: la idea, qué quieres recuperar (decide las misiones) y
 * cómo se juega. Termina en la primera misión, no en un texto.
 */
export function Welcome() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const settings = useSettings()
  const [step, setStep] = useState(0)
  const [focus, setFocus] = useState<ModuleId[]>(settings.focus)

  function toggle(id: ModuleId) {
    feedback.tick()
    setFocus((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]))
  }

  function finish() {
    updateSettings({ onboarded: true, focus })
    navigate('/')
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 pt-4 pb-8">
      <header className="mb-6 flex h-11 items-center justify-between">
        {step > 0 ? (
          <button type="button" onClick={() => setStep(step - 1)} className="-ml-2 flex h-11 items-center gap-1 px-2 text-ink-dim">
            <ArrowLeft className="h-5 w-5" aria-hidden />
            {t('common.back')}
          </button>
        ) : (
          <span />
        )}
        <ol className="flex gap-2" aria-label={t('welcome.progress', { n: step + 1, total: 3 })}>
          {[0, 1, 2].map((i) => (
            <li key={i} className={`h-2 rounded-full transition-all ${i === step ? 'w-6 bg-accent' : 'w-2 bg-line'}`} />
          ))}
        </ol>
      </header>

      {step === 0 && (
        <div key="s0" className="animate-pop flex flex-1 flex-col">
          {/* Un horizonte artificial que se inclina y se nivela: volar a mano. */}
          <div className="relative mb-8 h-72 overflow-hidden rounded-3xl text-white">
            <div
              aria-hidden
              className="hf-bank absolute -inset-24"
              style={{ background: 'linear-gradient(to bottom, var(--sky) 0%, var(--sky-deep) 56%, #fff 56%, #fff 56.5%, var(--earth) 56.5%, var(--earth-deep) 100%)' }}
            />
            <span aria-hidden className="hf-flyby absolute top-6 left-0 flex items-center">
              <span className="block h-0.5 w-32 rounded-full bg-linear-to-r from-transparent to-white/70" />
              <Plane className="h-7 w-7 rotate-45" />
            </span>
            <svg aria-hidden viewBox="-60 -8 120 16" className="absolute top-[60%] left-1/2 w-40 -translate-x-1/2 -translate-y-1/2">
              <path d="M-58 0 H-22 L-12 8 M58 0 H22 L12 8" fill="none" stroke="#f0b429" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <circle r="3.5" fill="#f0b429" />
            </svg>
            <h1 className="absolute top-12 right-6 left-6 text-[2.2rem] leading-[1.1]" style={{ textShadow: '0 2px 10px rgb(0 0 0 / 0.25)' }}>{t('welcome.title')}</h1>
          </div>
          <p className="prose-text text-lg">{t('welcome.p1')}</p>
          <p className="prose-text mt-3 text-lg">{t('welcome.p2')}</p>
          <Button block className="mt-auto" onClick={() => setStep(1)}>
            {t('welcome.start')}
          </Button>
        </div>
      )}

      {step === 1 && (
        <div key="s1" className="animate-pop flex flex-1 flex-col">
          <h1 className="text-[1.75rem] leading-tight">{t('welcome.pickTitle')}</h1>
          <p className="mt-2 mb-5 text-ink-dim">{t('welcome.pickLead')}</p>
          <ul className="grid grid-cols-2 gap-3">
            {MODULES.map(({ meta, icon: Icon }) => {
              const on = focus.includes(meta.id)
              return (
                <li key={meta.id}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(meta.id)}
                    className={`relative flex h-full min-h-32 w-full flex-col items-start gap-2 rounded-2xl border-2 p-3 text-left transition-colors ${
                      on ? 'border-accent bg-panel' : 'border-line bg-panel'
                    }`}
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-xl text-on-accent" style={{ background: meta.accent }}>
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="font-display leading-snug font-bold">{t(`welcome.skills.${meta.id}`)}</span>
                    <span className="text-sm text-ink-dim">{t('welcome.instead', { crutch: t(`crutch.${meta.id}`) })}</span>
                    {on && (
                      <span aria-hidden className="absolute top-2 right-2 grid h-6 w-6 place-items-center rounded-full bg-accent text-on-accent">
                        <Check className="h-4 w-4" strokeWidth={3} />
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
          <p className="mt-4 text-sm text-ink-dim">{t('welcome.pickNote')}</p>
          <Button block className="mt-auto" onClick={() => setStep(2)}>
            {focus.length ? t('welcome.continueWith', { count: focus.length }) : t('welcome.continueAll')}
          </Button>
        </div>
      )}

      {step === 2 && (
        <div key="s2" className="animate-pop flex flex-1 flex-col">
          <h1 className="text-[1.75rem] leading-tight">{t('welcome.howTitle')}</h1>
          <ol className="mt-6 flex flex-col gap-5">
            <li className="flex items-start gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-accent text-on-accent">
                <Ticket className="h-7 w-7" aria-hidden />
              </span>
              <span>
                <span className="block font-display text-lg font-bold">{t('welcome.how1')}</span>
                <span className="prose-text block text-ink-dim">{t('welcome.how1b')}</span>
              </span>
            </li>
            <li className="flex items-start gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-amber text-on-accent">
                <Trophy className="h-7 w-7" aria-hidden />
              </span>
              <span>
                <span className="block font-display text-lg font-bold">{t('welcome.how2')}</span>
                <span className="prose-text block text-ink-dim">{t('welcome.how2b')}</span>
              </span>
            </li>
            <li className="flex items-start gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border-2 border-amber bg-panel">
                <Wings rankIndex={5} size={52} />
              </span>
              <span>
                <span className="block font-display text-lg font-bold">{t('welcome.how3')}</span>
                <span className="prose-text block text-ink-dim">{t('welcome.how3b')}</span>
              </span>
            </li>
          </ol>
          <p className="mt-6 text-sm text-ink-dim">
            {t('welcome.privacy')}{' '}
            <Link to="/about" className="text-accent underline underline-offset-4">
              {t('welcome.more')}
            </Link>
          </p>
          <Button block className="mt-auto" onClick={finish}>
            <Plane className="h-5 w-5 rotate-45" aria-hidden />
            {t('welcome.takeoff')}
          </Button>
        </div>
      )}
    </div>
  )
}
