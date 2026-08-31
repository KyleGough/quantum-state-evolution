import { useMemo } from 'react'
import { Html } from '@react-three/drei'
import { renderKatex } from '../Katex'

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
  const html = useMemo(() => renderKatex(math, false), [math])

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
