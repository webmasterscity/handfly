import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { ChevronLeft } from 'lucide-react'

export function Page({
  title,
  lead,
  back,
  children,
  actions,
}: {
  title: ReactNode
  lead?: ReactNode
  back?: string
  children?: ReactNode
  actions?: ReactNode
}) {
  const { t } = useTranslation()
  return (
    <div className="mx-auto w-full max-w-xl px-4 pt-4 pb-8">
      {back && (
        <Link
          to={back}
          className="-ml-2 mb-2 inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-ink-dim hover:text-ink"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
          {t('common.back')}
        </Link>
      )}
      <header className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[1.75rem]">{title}</h1>
          {lead && <p className="mt-2 max-w-[60ch] text-ink-dim">{lead}</p>}
        </div>
        {actions}
      </header>
      {children}
    </div>
  )
}

export function Section({ title, children, aside, id }: { title: ReactNode; children: ReactNode; aside?: ReactNode; id?: string }) {
  return (
    <section id={id} className="mt-8 scroll-mt-4 first:mt-0">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-lg">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  )
}

/** Lista con separadores dentro de un panel: la unidad visual repetida de la app. */
export function Rows({ children }: { children: ReactNode }) {
  return <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-panel">{children}</ul>
}

export function Empty({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line px-5 py-8 text-center text-ink-dim">
      <p className="mx-auto max-w-[40ch]">{children}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  )
}
