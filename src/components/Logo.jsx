/**
 * Convoy logo mark — three ascending parallelogram bars.
 * Each bar rises left-to-right, evoking forward motion and convoy movement.
 * Opacity steps (100 → 72 → 48) create depth without noise.
 *
 * variant="dark"  → deep green on cream
 * variant="light" → cream on dark green
 * size="sm" | "md" | "lg"
 */

const SIZES = {
  sm: { icon: 20, text: '14px', gap: '7px' },
  md: { icon: 26, text: '18px', gap: '9px' },
  lg: { icon: 36, text: '25px', gap: '12px' },
}

export default function Logo({ variant = 'dark', size = 'md', iconOnly = false }) {
  const ink   = variant === 'dark' ? '#1C3829' : '#F5EFE0'
  const label = variant === 'dark' ? '#1a2b20' : '#F5EFE0'
  const { icon: iconSize, text: fontSize, gap } = SIZES[size] ?? SIZES.md

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap }}>
      {/* ── Mark: three ascending parallelogram bars ── */}
      <svg
        width={iconSize}
        height={Math.round(iconSize * 0.62)}
        viewBox="0 0 37 23"
        fill="none"
        aria-hidden="true"
      >
        {/* Bar 1 — bottom, full weight */}
        <path d="M 0 23 L 20 23 L 23 18 L 3 18 Z" fill={ink} />
        {/* Bar 2 — middle, stepped back */}
        <path d="M 7 14 L 27 14 L 30 9 L 10 9 Z"  fill={ink} opacity="0.70" />
        {/* Bar 3 — top, furthest */}
        <path d="M 14 5 L 34 5 L 37 0 L 17 0 Z"   fill={ink} opacity="0.44" />
      </svg>

      {/* ── Wordmark: Playfair Display ── */}
      {!iconOnly && (
        <span
          style={{
            color: label,
            fontSize,
            fontWeight: 700,
            letterSpacing: '-0.03em',
            lineHeight: 1,
            fontFamily: "'Playfair Display', Georgia, serif",
          }}
        >
          Convoy
        </span>
      )}
    </div>
  )
}
