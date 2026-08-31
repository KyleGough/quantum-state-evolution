import { C } from './complex'
import type { StateVector } from './state'

export interface BlochVector {
  x: number
  y: number
  z: number
}

/** Map normalised |ψ⟩ = α|0⟩ + β|1⟩ to Bloch coordinates */
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
