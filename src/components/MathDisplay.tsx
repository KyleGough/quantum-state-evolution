import { KatexBlock } from './Katex'
import { blochVectorKatex, stateVectorKatex, timeKatex } from '../sim/katexFormat'
import type { Complex } from '../sim/complex'

interface StateVectorRowProps {
  alpha: Complex
  beta: Complex
}

export function StateVectorRow({ alpha, beta }: StateVectorRowProps) {
  return <KatexBlock math={stateVectorKatex(alpha, beta)} className="math-katex-block" />
}

interface BlochVectorRowProps {
  x: number
  y: number
  z: number
}

export function BlochVectorRow({ x, y, z }: BlochVectorRowProps) {
  return <KatexBlock math={blochVectorKatex(x, y, z)} className="math-katex-block" />
}

interface TimeRowProps {
  time: number
}

export function TimeRow({ time }: TimeRowProps) {
  return <KatexBlock math={timeKatex(time)} className="math-katex-block" />
}
