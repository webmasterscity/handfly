import { useEffect, useState } from 'react'

/**
 * Horizonte artificial. pitch ∈ [-1, 1] sube o baja la línea del horizonte;
 * bank ∈ [0, 1] inclina las alas. El único movimiento automático de la app:
 * el horizonte se nivela desde cero al abrir la pantalla.
 */
export function AttitudeIndicator({
  pitch,
  bank,
  size = 220,
  label,
}: {
  pitch: number
  bank: number
  size?: number
  label: string
}) {
  const [settled, setSettled] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setSettled(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const p = settled ? Math.max(-1, Math.min(1, pitch)) : 0
  const b = settled ? Math.max(0, Math.min(1, bank)) * 20 : 0
  // Cabeceo positivo (más autonomía) = el morro sube = el horizonte baja en pantalla.
  const offset = p * 34

  return (
    <svg viewBox="-110 -110 220 220" width={size} height={size} role="img" aria-label={label} className="block max-w-full">
      <defs>
        <clipPath id="hf-ai-clip">
          <circle r="92" />
        </clipPath>
      </defs>
      <circle r="108" fill="var(--panel-2)" stroke="var(--line)" strokeWidth="2" />
      <g clipPath="url(#hf-ai-clip)">
        <g
          style={{
            transform: `rotate(${-b}deg) translateY(${offset}px)`,
            transition: 'transform 1400ms cubic-bezier(.2,.8,.2,1)',
          }}
        >
          <rect x="-200" y="-300" width="400" height="300" fill="var(--sky)" />
          <rect x="-200" y="0" width="400" height="300" fill="var(--earth)" />
          <line x1="-200" x2="200" y1="0" y2="0" stroke="#fff" strokeWidth="2" />
          {[-30, -20, -10, 10, 20, 30].map((y) => (
            <line
              key={y}
              x1={Math.abs(y) === 20 ? -22 : -12}
              x2={Math.abs(y) === 20 ? 22 : 12}
              y1={y * 1.7}
              y2={y * 1.7}
              stroke="#fff"
              strokeOpacity="0.85"
              strokeWidth="1.5"
            />
          ))}
        </g>
      </g>
      {/* Escala de alabeo fija */}
      {[-30, -20, -10, 0, 10, 20, 30].map((a) => (
        <line
          key={a}
          x1="0"
          x2="0"
          y1="-92"
          y2={a === 0 ? -80 : -85}
          stroke="var(--ink)"
          strokeWidth={a === 0 ? 3 : 1.5}
          transform={`rotate(${a})`}
        />
      ))}
      {/* Avión de referencia, fijo */}
      <g stroke="var(--amber)" strokeWidth="5" strokeLinecap="round" fill="none">
        <path d="M-52 0 H-18 L-8 10" />
        <path d="M52 0 H18 L8 10" />
      </g>
      <circle r="3.5" fill="var(--amber)" />
    </svg>
  )
}
