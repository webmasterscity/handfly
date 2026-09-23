import { useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react'

const control =
  'w-full rounded-xl border border-line bg-panel px-4 py-3 text-ink placeholder:text-ink-dim/70 focus:border-accent focus:outline-none focus-visible:outline-3 focus-visible:outline-[var(--focus)]'

interface FieldShellProps {
  label: ReactNode
  hint?: ReactNode
  id: string
  children: ReactNode
}

function FieldShell({ label, hint, id, children }: FieldShellProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-display text-[0.95rem] font-bold">
        {label}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="text-sm text-ink-dim">
          {hint}
        </p>
      )}
      {children}
    </div>
  )
}

export function TextField({
  label,
  hint,
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode; hint?: ReactNode }) {
  const id = useId()
  return (
    <FieldShell label={label} hint={hint} id={id}>
      <input id={id} aria-describedby={hint ? `${id}-hint` : undefined} className={`${control} ${className}`} {...props} />
    </FieldShell>
  )
}

export function TextArea({
  label,
  hint,
  rows = 4,
  className = '',
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: ReactNode; hint?: ReactNode }) {
  const id = useId()
  return (
    <FieldShell label={label} hint={hint} id={id}>
      <textarea
        id={id}
        rows={rows}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className={`${control} resize-y leading-relaxed ${className}`}
        {...props}
      />
    </FieldShell>
  )
}

export function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: ReactNode
  hint?: ReactNode
  checked: boolean
  onChange: (value: boolean) => void
}) {
  const id = useId()
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div>
        <label htmlFor={id} className="font-bold">
          {label}
        </label>
        {hint && <p className="text-sm text-ink-dim">{hint}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-8 w-14 shrink-0 rounded-full border transition-colors ${
          checked ? 'border-accent bg-accent' : 'border-line bg-panel-2'
        }`}
      >
        <span
          aria-hidden
          className={`absolute top-1 left-1 h-5.5 w-5.5 rounded-full transition-transform ${
            checked ? 'translate-x-6 bg-on-accent' : 'bg-ink-dim'
          }`}
        />
      </button>
    </div>
  )
}
