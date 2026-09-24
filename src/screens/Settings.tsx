import { CalendarPlus, Download, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { BackupError, createBackup, downloadJson, parseBackup, restoreBackup, wipeAllData, type Backup } from '../core/db/backup'
import { toast } from '../core/feedback/feedback'
import { buildReminderIcs, downloadIcs } from '../core/reminders/ics'
import { getSettings, replaceSettings, updateSettings, useSettings, type Settings as S } from '../core/settings/settings'
import { dayKey } from '../core/time'
import { MODULES } from '../modules/registry'
import { Button } from '../ui/primitives/Button'
import { TextField, Toggle } from '../ui/primitives/Field'
import { Page, Section } from '../ui/primitives/Page'

function Segmented<T extends string | number>({
  legend,
  value,
  options,
  onChange,
}: {
  legend: string
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <fieldset className="py-3">
      <legend className="mb-2 font-bold">{legend}</legend>
      <div className="grid gap-1 rounded-xl bg-panel-2 p-1" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
        {options.map((o) => (
          <label key={String(o.value)} className="relative">
            <input type="radio" className="peer absolute inset-0 opacity-0" checked={value === o.value} onChange={() => onChange(o.value)} />
            <span className="flex min-h-11 items-center justify-center rounded-lg px-2 text-center text-sm text-ink-dim peer-checked:bg-panel peer-checked:font-bold peer-checked:text-ink peer-focus-visible:outline-3 peer-focus-visible:outline-[var(--focus)]">
              {o.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export function Settings() {
  const { t } = useTranslation()
  const s = useSettings()
  const fileRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<Backup>()
  const [wipeStep, setWipeStep] = useState(0)
  const set = (patch: Partial<S>) => updateSettings(patch)

  async function exportBackup() {
    // La ubicación de casa (juego de la brújula) no sale del teléfono, tampoco en la copia.
    const { home: _home, ...shareable } = getSettings()
    downloadJson(await createBackup(shareable), `handfly-backup-${dayKey()}.json`)
    toast(t('settings.exported'), 'success')
  }

  async function pickFile(file: File | undefined) {
    if (!file) return
    try {
      setPending(parseBackup(await file.text()))
    } catch (e) {
      toast(t(`settings.importErrors.${e instanceof BackupError ? e.message : 'notBackup'}`))
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function doImport(mode: 'replace' | 'merge') {
    if (!pending) return
    await restoreBackup(pending, mode)
    if (mode === 'replace') {
      // Restaurar ajustes no borra la casa guardada en este teléfono (la copia no la lleva).
      const home = getSettings().home
      replaceSettings(pending.settings)
      if (home) updateSettings({ home })
    }
    setPending(undefined)
    toast(t('settings.imported'), 'success')
  }

  function reminder() {
    const url = window.location.href.split('#')[0]
    downloadIcs(buildReminderIcs({ time: s.reminderTime, title: t('settings.reminderEventTitle'), description: t('settings.reminderEventBody'), url }))
  }

  return (
    <Page title={t('settings.title')}>
      <Section title={t('settings.display')}>
        <div className="divide-y divide-line rounded-2xl border border-line bg-panel px-4">
          <Segmented
            legend={t('settings.language')}
            value={s.language}
            options={[
              { value: 'auto', label: t('settings.langAuto') },
              { value: 'es', label: 'Español' },
              { value: 'en', label: 'English' },
            ]}
            onChange={(language) => set({ language })}
          />
          <Segmented
            legend={t('settings.theme')}
            value={s.theme}
            options={[
              { value: 'system', label: t('settings.themeSystem') },
              { value: 'light', label: t('settings.themeLight') },
              { value: 'dark', label: t('settings.themeDark') },
            ]}
            onChange={(theme) => set({ theme })}
          />
          <Toggle label={t('settings.sounds')} checked={s.sounds} onChange={(sounds) => set({ sounds })} />
          <Toggle label={t('settings.haptics')} hint={t('settings.hapticsHint')} checked={s.haptics} onChange={(haptics) => set({ haptics })} />
          <Toggle label={t('settings.motion')} hint={t('settings.motionHint')} checked={s.motion} onChange={(motion) => set({ motion })} />
        </div>
      </Section>

      <Section title={t('settings.practice')}>
        <div className="divide-y divide-line rounded-2xl border border-line bg-panel px-4">
          <fieldset className="py-3">
            <legend className="mb-1 font-bold">{t('settings.focus')}</legend>
            <p className="mb-3 text-sm text-ink-dim">{t('settings.focusHint')}</p>
            <div className="flex flex-wrap gap-2">
              {MODULES.map(({ meta }) => {
                const on = s.focus.includes(meta.id)
                return (
                  <button
                    key={meta.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => set({ focus: on ? s.focus.filter((x) => x !== meta.id) : [...s.focus, meta.id] })}
                    className={`min-h-11 rounded-full border-2 px-4 text-sm font-bold ${on ? 'border-accent bg-accent text-on-accent' : 'border-line text-ink-dim'}`}
                  >
                    {t(`welcome.skills.${meta.id}`)}
                  </button>
                )
              })}
            </div>
          </fieldset>
          <Segmented
            legend={t('settings.sessionSize')}
            value={s.sessionSize}
            options={[10, 15, 20].map((n) => ({ value: n, label: t('settings.cards', { count: n }) }))}
            onChange={(sessionSize) => set({ sessionSize })}
          />
          <Toggle label={t('settings.allowPaste')} hint={t('settings.allowPasteHint')} checked={s.allowPaste} onChange={(allowPaste) => set({ allowPaste })} />
        </div>
      </Section>

      <Section title={t('settings.reminder')}>
        <p className="mb-4 text-ink-dim">{t('settings.reminderLead')}</p>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <TextField label={t('settings.reminderTime')} type="time" value={s.reminderTime} onChange={(e) => set({ reminderTime: e.target.value || '08:00' })} />
          </div>
          <Button variant="secondary" onClick={reminder}>
            <CalendarPlus className="h-5 w-5" aria-hidden />
            {t('settings.reminderAdd')}
          </Button>
        </div>
      </Section>

      <Section title={t('settings.data')}>
        <p className="mb-4 text-ink-dim">{t('settings.dataLead')}</p>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={exportBackup}>
            <Download className="h-5 w-5" aria-hidden />
            {t('settings.export')}
          </Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>
            <Upload className="h-5 w-5" aria-hidden />
            {t('settings.import')}
          </Button>
        </div>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => pickFile(e.target.files?.[0])} aria-hidden tabIndex={-1} />
        {pending && (
          <div role="alert" className="mt-4 flex flex-col gap-3 rounded-2xl border border-accent bg-panel p-4">
            <p>{t('settings.importAsk', { date: new Date(pending.exportedAt).toLocaleDateString() })}</p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => doImport('merge')}>
                {t('settings.importMerge')}
              </Button>
              <Button onClick={() => doImport('replace')}>{t('settings.importReplace')}</Button>
            </div>
            <Button variant="ghost" onClick={() => setPending(undefined)}>
              {t('common.cancel')}
            </Button>
          </div>
        )}
        <div className="mt-6">
          {wipeStep === 0 ? (
            <Button variant="danger" block onClick={() => setWipeStep(1)}>
              {t('settings.wipe')}
            </Button>
          ) : (
            <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-red p-4">
              <p>{t('settings.wipeConfirm')}</p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" onClick={() => setWipeStep(0)}>
                  {t('common.cancel')}
                </Button>
                <Button
                  variant="danger"
                  onClick={async () => {
                    await wipeAllData()
                    setWipeStep(0)
                    toast(t('settings.wiped'))
                  }}
                >
                  {t('settings.wipeYes')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Section>

      <Section title={t('settings.aboutTitle')}>
        <ul className="flex flex-col gap-2">
          <li>
            <Link to="/about" className="text-accent underline underline-offset-4">
              {t('settings.aboutLink')}
            </Link>
          </li>
          <li>
            <Link to="/evidence" className="text-accent underline underline-offset-4">
              {t('settings.evidenceLink')}
            </Link>
          </li>
          <li>
            <a href="https://github.com/webmasterscity/handfly" className="text-accent underline underline-offset-4" rel="noreferrer" target="_blank">
              {t('settings.sourceLink')}
            </a>
          </li>
        </ul>
        <p className="readout mt-4 text-sm text-ink-dim">Handfly {__APP_VERSION__}</p>
      </Section>
    </Page>
  )
}
