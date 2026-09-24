import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react'
import { Link, type LinkProps } from 'react-router'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const base =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 font-display text-[0.95rem] font-bold transition-[transform,background-color] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45'

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-on-accent',
  secondary: 'border border-line bg-panel-2 text-ink',
  ghost: 'text-accent underline-offset-4 hover:underline',
  danger: 'border border-red text-red',
}

function buttonClass(variant: Variant = 'primary', block = false) {
  return `${base} ${variants[variant]} ${block ? 'w-full' : ''}`
}

export function Button({
  variant = 'primary',
  block,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; block?: boolean; ref?: Ref<HTMLButtonElement> }) {
  return <button type="button" className={`${buttonClass(variant, block)} ${className}`} {...props} />
}

export function ButtonLink({
  variant = 'primary',
  block,
  className = '',
  ...props
}: LinkProps & { variant?: Variant; block?: boolean; children: ReactNode }) {
  return <Link className={`${buttonClass(variant, block)} ${className}`} {...props} />
}
