/**
 * Barras verticales mínimas en SVG. Cada barra puede tener una parte principal
 * (vuelos reales) y una secundaria apilada (simulador), con leyenda textual accesible.
 */
export function Bars({
  data,
  height = 140,
  primaryLabel,
  secondaryLabel,
  summary,
}: {
  data: { label: string; primary: number; secondary?: number }[]
  height?: number
  primaryLabel: string
  secondaryLabel?: string
  summary: string
}) {
  const max = Math.max(1, ...data.map((d) => d.primary + (d.secondary ?? 0)))
  const w = 100 / data.length
  return (
    <figure>
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" width="100%" height={height} role="img" aria-label={summary}>
        {[0.5, 1].map((g) => (
          <line key={g} x1="0" x2="100" y1={height - 18 - (height - 26) * g} y2={height - 18 - (height - 26) * g} stroke="var(--line)" strokeWidth="0.3" vectorEffect="non-scaling-stroke" />
        ))}
        {data.map((d, i) => {
          const avail = height - 26
          const hp = (d.primary / max) * avail
          const hs = ((d.secondary ?? 0) / max) * avail
          const x = i * w + w * 0.2
          const bw = w * 0.6
          return (
            <g key={d.label}>
              {hs > 0 && <rect x={x} y={height - 18 - hp - hs} width={bw} height={hs} fill="var(--line)" rx="0.8" />}
              {hp > 0 && <rect x={x} y={height - 18 - hp} width={bw} height={hp} fill="var(--accent)" rx="0.8" />}
            </g>
          )
        })}
      </svg>
      <div className="mt-1 grid text-center text-xs text-ink-dim" style={{ gridTemplateColumns: `repeat(${data.length}, 1fr)` }} aria-hidden>
        {data.map((d) => (
          <span key={d.label}>{d.label}</span>
        ))}
      </div>
      <figcaption className="mt-3 flex flex-wrap gap-4 text-sm text-ink-dim">
        <span className="inline-flex items-center gap-2">
          <span aria-hidden className="h-3 w-3 rounded-sm bg-accent" />
          {primaryLabel}
        </span>
        {secondaryLabel && (
          <span className="inline-flex items-center gap-2">
            <span aria-hidden className="h-3 w-3 rounded-sm bg-line" />
            {secondaryLabel}
          </span>
        )}
      </figcaption>
    </figure>
  )
}
