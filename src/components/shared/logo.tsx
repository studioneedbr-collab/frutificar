interface LogoProps {
  white?: boolean
  size?: number
  showText?: boolean
  className?: string
}

export function FrutificarLogo({ white = false, size = 28, showText = true, className }: LogoProps) {
  const color = white ? 'white' : 'var(--color-frutificar-green)'
  const textColor = white ? 'white' : 'var(--color-frutificar-deep)'

  return (
    <div className={`flex items-center gap-2.5 ${className ?? ''}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        style={{ color, flexShrink: 0 }}
        aria-hidden="true"
      >
        {/* Stem */}
        <path
          d="M16 29V14"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Left leaf */}
        <path
          d="M16 14C16 14 9 11.5 6 5C12 4.5 16 9.5 16 14Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="currentColor"
          fillOpacity="0.15"
        />
        {/* Right leaf */}
        <path
          d="M16 14C16 14 23 11.5 26 5C20 4.5 16 9.5 16 14Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="currentColor"
          fillOpacity="0.15"
        />
      </svg>
      {showText && (
        <span
          style={{
            fontFamily: 'var(--font-jakarta)',
            color: textColor,
            fontSize: '1.15rem',
            fontWeight: 700,
            letterSpacing: '-0.025em',
          }}
        >
          Frutificar
        </span>
      )}
    </div>
  )
}
