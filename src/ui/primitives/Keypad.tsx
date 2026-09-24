import { Delete } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { feedback } from '../../core/feedback/feedback'

/**
 * Teclado numérico grande, como el de una caja registradora. Evita que salga el teclado
 * del sistema (que tapa la mitad del problema) y también acepta el teclado físico.
 */
export function Keypad({
  value,
  onChange,
  onEnter,
  decimal = true,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  onEnter: () => void
  decimal?: boolean
  disabled?: boolean
}) {
  const { t, i18n } = useTranslation()
  // El separador decimal del idioma: coma en español, punto en inglés.
  const sep = (1.5).toLocaleString(i18n.language).charAt(1)

  const press = (key: string) => {
    if (disabled) return
    feedback.tick()
    if (key === 'del') return onChange(value.slice(0, -1))
    if (key === 'sep') return value.includes(sep) || !decimal ? undefined : onChange((value || '0') + sep)
    if (value.replace(/\D/g, '').length >= 9) return
    onChange(value === '0' ? key : value + key)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (disabled || e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target as HTMLElement | null
      if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) return
      // Con el foco en un enlace o botón (salir, una tecla), Enter es de ese elemento.
      if (e.key === 'Enter' && target?.closest('a, button, [role="button"]')) return
      if (/^\d$/.test(e.key)) press(e.key)
      else if (e.key === ',' || e.key === '.') press('sep')
      else if (e.key === 'Backspace') press('del')
      else if (e.key === 'Enter') onEnter()
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', decimal ? 'sep' : '', '0', 'del']
  return (
    <div className="grid grid-cols-3 gap-2" role="group" aria-label={t('keypad.label')}>
      {keys.map((k, i) =>
        k === '' ? (
          <span key={i} />
        ) : (
          <button
            key={k}
            type="button"
            disabled={disabled}
            onClick={() => press(k)}
            aria-label={k === 'del' ? t('keypad.delete') : k === 'sep' ? t('keypad.decimal') : k}
            className="readout grid h-14 place-items-center rounded-xl border border-line bg-panel text-2xl active:scale-95 active:bg-panel-2 disabled:opacity-40"
          >
            {k === 'del' ? <Delete className="h-6 w-6" aria-hidden /> : k === 'sep' ? sep : k}
          </button>
        ),
      )}
    </div>
  )
}
