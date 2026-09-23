/** Arco de progreso tipo indicador de rango (verde = rango normal). */
export function Arc({ value, size = 56, label }: { value: number; size?: number; label: string }) {
  const r = 22
  const c = Math.PI * 2 * r * 0.75
  const v = Math.max(0, Math.min(1, value))
  return (
    <svg viewBox="-28 -28 56 56" width={size} height={size} role="img" aria-label={label}>
      <circle r={r} fill="none" stroke="var(--line)" strokeWidth="5" strokeDasharray={`${c} 999`} transform="rotate(135)" strokeLinecap="round" />
      <circle
        r={r}
        fill="none"
        stroke="var(--green)"
        strokeWidth="5"
        strokeDasharray={`${c * v} 999`}
        transform="rotate(135)"
        strokeLinecap="round"
      />
    </svg>
  )
}
