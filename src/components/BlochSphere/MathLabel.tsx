import { useMemo } from 'react'
import katex from 'katex'
import { Html } from '@react-three/drei'

interface MathLabelProps {
  position: [number, number, number]
  math: string
  distanceFactor?: number
  className?: string
}

export function MathLabel({
  position,
  math,
  distanceFactor = 9,
  className = 'bloch-math-label',
}: MathLabelProps) {
  const html = useMemo(
    () =>
      katex.renderToString(math, {
        throwOnError: false,
        displayMode: false,
      }),
    [math],
  )

  return (
    <Html
      position={position}
      center
      distanceFactor={distanceFactor}
      style={{ pointerEvents: 'none' }}
    >
      <div className={className} dangerouslySetInnerHTML={{ __html: html }} />
    </Html>
  )
}
