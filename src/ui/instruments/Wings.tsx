/**
 * Insignia de piloto: alas doradas con galones. Cada rango añade algo visible
 * (alas rellenas, un galón más, la estrella del instructor) para que subir se note.
 */
const STRIPES = [0, 0, 1, 2, 3, 4, 4]

export function Wings({ rankIndex, size = 72, label, className = '' }: { rankIndex: number; size?: number; label?: string; className?: string }) {
  const i = Math.max(0, Math.min(STRIPES.length - 1, rankIndex))
  const filled = i >= 1
  const stripes = STRIPES[i]
  const wing = 'M-9 -5 C-24 -13 -44 -12 -60 -17 C-52 -7 -34 -1 -9 3 Z M-9 4 C-22 2 -38 5 -50 3 C-42 11 -26 11 -9 10 Z'
  return (
    <svg
      viewBox="-64 -22 128 44"
      width={size}
      height={(size * 44) / 128}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={className}
    >
      <g fill={filled ? 'var(--amber)' : 'none'} stroke="var(--amber)" strokeWidth="1.6" strokeLinejoin="round">
        <path d={wing} />
        <path d={wing} transform="scale(-1 1)" />
      </g>
      <circle r="12" fill="var(--panel)" stroke="var(--amber)" strokeWidth="2" />
      {Array.from({ length: stripes }, (_, n) => (
        <rect key={n} x="-7" y={-7.5 + n * 4.2 + (4 - stripes) * 2.1} width="14" height="2.6" rx="1" fill="var(--amber)" />
      ))}
      {stripes === 0 && <path d="M0 -6 L2 4 L0 2.5 L-2 4 Z M-6 -1 L6 -1 L6 1 L-6 1 Z" fill="var(--amber)" />}
      {i === STRIPES.length - 1 && (
        <path transform="translate(0 -17.5) scale(0.55)" d="M0 -8 L2.4 -2.5 L8 -2.5 L3.6 1 L5.2 7 L0 3.5 L-5.2 7 L-3.6 1 L-8 -2.5 L-2.4 -2.5 Z" fill="var(--amber)" />
      )}
    </svg>
  )
}
