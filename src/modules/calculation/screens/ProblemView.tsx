import { Car, ChefHat, Receipt, Tag, User, Wallet } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { Problem } from '../generators'

/**
 * Cada problema se dibuja como el objeto real donde aparece: el tique de la caja, la
 * cuenta del restaurante, la etiqueta con descuento, el letrero de la carretera, la
 * receta. Es la misma cuenta que en la vida real, con el mismo aspecto.
 * El enunciado completo va debajo como texto (y es lo que leen los lectores de pantalla).
 */
export function ProblemView({ p }: { p: Problem }) {
  const { t } = useTranslation('calculation')
  const q = p.params

  return (
    <figure className="flex flex-col gap-4">
      <div aria-hidden className="flex justify-center">
        {p.category === 'groceries' && p.receipt && (
          <Paper icon={<Receipt className="h-4 w-4" />} title={t('scene.receipt')}>
            {p.receipt.map((line, i) => (
              <Row key={i} label={line.name} value={line.price} />
            ))}
            <Total label={t('scene.total')} />
          </Paper>
        )}
        {p.category === 'budget' && (
          <Paper icon={<Wallet className="h-4 w-4" />} title={t('scene.budget')}>
            <Row label={t('scene.monthBudget')} value={String(q.budget)} strong />
            <Row label={t('scene.food')} value={`− ${q.a}`} />
            <Row label={t('scene.transport')} value={`− ${q.b}`} />
            <Row label={t('scene.fun')} value={`− ${q.c}`} />
            <Total label={t('scene.left')} />
          </Paper>
        )}
        {(p.category === 'tip' || p.category === 'split') && (
          <Paper icon={<Receipt className="h-4 w-4" />} title={t('scene.bill')}>
            <Row label={t('scene.billTotal')} value={String(p.category === 'tip' ? q.bill : q.total)} strong />
            {p.category === 'tip' ? (
              <Total label={t('scene.tipOf', { pct: q.pct })} />
            ) : (
              <>
                <div className="my-2 flex flex-wrap justify-center gap-1 text-[#4a3b21]">
                  {Array.from({ length: Number(q.people) }, (_, i) => (
                    <User key={i} className="h-6 w-6" />
                  ))}
                </div>
                <Total label={t('scene.each')} />
              </>
            )}
          </Paper>
        )}
        {p.category === 'discount' && (
          <div className="relative mt-6 mr-8">
            <div className="flex items-center gap-3 rounded-r-2xl rounded-l-[2.5rem] border-2 border-[#c9a64a] bg-[#fff7df] py-4 pr-10 pl-7 text-[#3a2c10] shadow-sm">
              <span className="h-3 w-3 rounded-full border-2 border-[#c9a64a] bg-white" />
              <Tag className="h-5 w-5" />
              <span className="readout text-3xl">{q.price}</span>
            </div>
            <span className="absolute -top-8 -right-8 grid h-16 w-16 rotate-12 place-items-center rounded-full bg-[#c62828] font-display text-lg font-bold text-white shadow">
              −{q.pct}%
            </span>
          </div>
        )}
        {p.category === 'travel' && (
          <div className="flex flex-col items-center gap-2">
            <div className="rounded-xl border-4 border-white bg-[#1b6e3b] px-6 py-3 text-center font-display text-white shadow outline-2 outline-[#1b6e3b]">
              <Car className="mx-auto mb-1 h-6 w-6" />
              <span className="readout text-3xl">{q.km} km</span>
            </div>
            <span className="grid h-16 w-16 place-items-center rounded-full border-[6px] border-[#c62828] bg-white font-display text-xl font-bold text-[#111]">{q.speed}</span>
          </div>
        )}
        {p.category === 'recipe' && (
          <Paper icon={<ChefHat className="h-4 w-4" />} title={t('scene.recipe')}>
            <Row label={t('scene.forPeople', { count: Number(q.base) })} value={`${q.grams} g`} strong />
            <p className="text-center text-sm first-letter:uppercase">{String(q.ingredient)}</p>
            <Total label={t('scene.forPeople', { count: Number(q.target) })} />
          </Paper>
        )}
      </div>
      {/* Visible: la pregunta corta (el dibujo ya muestra los datos). Lectores de pantalla: el enunciado completo. */}
      <figcaption className="text-center font-display text-xl leading-snug font-bold">
        <span aria-hidden>{t(`ask.${p.category}`, q)}</span>
        <span className="sr-only">{t(`problems.${p.category}`, q)}</span>
      </figcaption>
    </figure>
  )
}

/** Papel de tique: colores fijos (es papel, no interfaz), igual en modo claro y oscuro. */
function Paper({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="w-full max-w-[17rem] -rotate-1 rounded-sm bg-[#fffdf6] px-4 pt-3 pb-4 text-[#2b2b2b] shadow-md">
      <p className="mb-2 flex items-center justify-center gap-1.5 font-display text-sm font-bold tracking-wide">
        {icon}
        {title}
      </p>
      <div className="readout flex flex-col gap-0.5 text-[0.95rem]">{children}</div>
    </div>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <p className={`flex justify-between gap-3 ${strong ? 'font-bold' : ''}`}>
      <span className="block truncate first-letter:uppercase">{label}</span>
      <span>{value}</span>
    </p>
  )
}

function Total({ label }: { label: string }) {
  return (
    <p className="mt-2 flex justify-between gap-3 border-t-2 border-dashed border-[#9a9a9a] pt-2 text-lg font-bold">
      <span>{label}</span>
      <span className="text-[#c62828]">?</span>
    </p>
  )
}
