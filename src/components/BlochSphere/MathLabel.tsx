import { useMemo, useSyncExternalStore } from 'react'
import { Html } from '@react-three/drei'
import { renderKatex } from '../Katex'

/** Viewport width at which labels reach their maximum (current) size. */
const LABEL_MAX_VIEWPORT_PX = 1440

function subscribeViewportWidth(onChange: () => void) {
  window.addEventListener('resize', onChange)
  return () => window.removeEventListener('resize', onChange)
}

function getViewportWidth() {
  return window.innerWidth
}

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
  const viewportWidth = useSyncExternalStore(
    subscribeViewportWidth,
    getViewportWidth,
    () => LABEL_MAX_VIEWPORT_PX,
  )
  const scaledDistance =
    distanceFactor * Math.min(1, viewportWidth / LABEL_MAX_VIEWPORT_PX)

  return (
    <Html
      position={position}
      center
      distanceFactor={scaledDistance}
      style={{ pointerEvents: 'none' }}
    >
      <div className={className} dangerouslySetInnerHTML={{ __html: html }} />
    </Html>
  )
}
