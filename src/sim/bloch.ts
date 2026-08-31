import { C } from './complex'
import type { StateVector } from './state'

export interface BlochVector {
  x: number
  y: number
  z: number
}

/** Map normalized |ψ⟩ = α|0⟩ + β|1⟩ to Bloch coordinates */
export function stateToBloch(psi: StateVector): BlochVector {
  const alpha = psi[0]
  const beta = psi[1]
  const alphaConjBeta = C.mul(C.conj(alpha), beta)

  return {
    x: 2 * alphaConjBeta.re,
    y: 2 * alphaConjBeta.im,
    z: C.abs2(alpha) - C.abs2(beta),
  }
}

export function blochToState(b: BlochVector): StateVector {
  const r = Math.sqrt(b.x * b.x + b.y * b.y + b.z * b.z)
  const z = r > 1 ? b.z / r : b.z
  const x = r > 1 ? b.x / r : b.x
  const y = r > 1 ? b.y / r : b.y

  const theta = Math.acos(Math.max(-1, Math.min(1, z)))
  const phi = Math.atan2(y, x)

  const cosHalf = Math.cos(theta / 2)
  const sinHalf = Math.sin(theta / 2)

  return [
    C.from(cosHalf, 0),
    C.from(sinHalf * Math.cos(phi), sinHalf * Math.sin(phi)),
  ]
}
