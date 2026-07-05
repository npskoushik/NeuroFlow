import type { ReactNode, SVGProps } from 'react'

export interface SchematicCanvasProps extends Omit<SVGProps<SVGSVGElement>, 'viewBox'> {
  width?: number | string
  height?: number | string
  viewBox?: string
  children: ReactNode
}

export default function SchematicCanvas({
  width = '100%',
  height = 420,
  viewBox = '0 0 1200 520',
  className = '',
  children,
  ...rest
}: SchematicCanvasProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox={viewBox}
      className={`rounded-xl border border-bg-border bg-bg-base text-text-primary ${className}`}
      role="img"
      {...rest}
    >
      <defs>
        <pattern id="schematic-grid" width="28" height="28" patternUnits="userSpaceOnUse">
          <path d="M28 0H0V28" fill="none" stroke="#1A2236" strokeWidth="1" opacity="0.45" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#schematic-grid)" />
      {children}
    </svg>
  )
}
