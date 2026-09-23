/**
 * Altímetro de horas de vuelo manual: la aguja larga marca horas (0-10 por vuelta),
 * la corta decenas de horas. La lectura digital es la cifra exacta.
 */
export function Altimeter({
  minutes,
  size = 132,
  label,
  readout,
}: {
  minutes: number
  size?: number
  label: string
  readout: string
}) {
  const hours = minutes / 60
  const longAngle = (hours % 10) * 36
  const shortAngle = ((hours / 10) % 10) * 36
  return (
    <svg viewBox="-70 -70 140 140" width={size} height={size} role="img" aria-label={label} className="block max-w-full">
      <circle r="68" fill="var(--panel-2)" stroke="var(--line)" strokeWidth="2" />
      {Array.from({ length: 50 }, (_, i) => (
        <line
          key={i}
          y1="-60"
          y2={i % 5 === 0 ? -50 : -55}
          stroke="var(--ink)"
          strokeOpacity={i % 5 === 0 ? 0.9 : 0.45}
          strokeWidth={i % 5 === 0 ? 2 : 1}
          transform={`rotate(${i * 7.2})`}
        />
      ))}
      {Array.from({ length: 10 }, (_, i) => {
        const a = ((i * 36 - 90) * Math.PI) / 180
        return (
          <text
            key={i}
            x={Math.cos(a) * 42}
            y={Math.sin(a) * 42}
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily="var(--font-readout)"
            fontSize="11"
            fill="var(--ink)"
          >
            {i}
          </text>
        )
      })}
      <rect x="-22" y="8" width="44" height="16" rx="3" fill="var(--bg)" stroke="var(--line)" />
      <text
        y="16.5"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="var(--font-readout)"
        fontSize="10"
        fill="var(--ink)"
      >
        {readout}
      </text>
      <line y1="6" y2="-28" stroke="var(--ink)" strokeWidth="6" strokeLinecap="round" transform={`rotate(${shortAngle})`} />
      <line y1="8" y2="-54" stroke="var(--amber)" strokeWidth="3" strokeLinecap="round" transform={`rotate(${longAngle})`} />
      <circle r="5" fill="var(--ink)" />
    </svg>
  )
}
