import { C } from './complex'
import type { Matrix2 } from './state'

/** Pauli matrices σ_x, σ_y, σ_z */
const SIGMA_X: Matrix2 = [
  [C.zero(), C.one()],
  [C.one(), C.zero()],
]

const SIGMA_Y: Matrix2 = [
  [C.zero(), C.negi()],
  [C.i(), C.zero()],
]

const SIGMA_Z: Matrix2 = [
  [C.one(), C.zero()],
  [C.zero(), C.negone()],
]

function pauliCombination(hx: number, hy: number, hz: number): Matrix2 {
  const scale = (m: Matrix2, s: number): Matrix2 => [
    [C.scale(m[0][0], s), C.scale(m[0][1], s)],
    [C.scale(m[1][0], s), C.scale(m[1][1], s)],
  ]

  const add = (a: Matrix2, b: Matrix2): Matrix2 => [
    [C.add(a[0][0], b[0][0]), C.add(a[0][1], b[0][1])],
    [C.add(a[1][0], b[1][0]), C.add(a[1][1], b[1][1])],
  ]

  let h = scale(SIGMA_X, hx)
  h = add(h, scale(SIGMA_Y, hy))
  h = add(h, scale(SIGMA_Z, hz))
  return h
}

export interface HamiltonianParams {
  omega: number
  OmegaX: number
  OmegaY: number
}

export function buildHamiltonian(params: HamiltonianParams): Matrix2 {
  return pauliCombination(params.OmegaX / 2, params.OmegaY / 2, params.omega / 2)
}

/** Bloch rotation rate |Ω⃗| = √(ω² + Ωx² + Ωy²). H = (1/2) Ω⃗ · σ. */
export function blochRate(params: HamiltonianParams): number {
  return Math.hypot(params.omega, params.OmegaX, params.OmegaY)
}

/** Period of one Bloch revolution (and of P(t) for computational-basis Rabi). */
export function blochPeriod(params: HamiltonianParams): number | null {
  const rate = blochRate(params)
  if (rate < 1e-12) return null
  return (2 * Math.PI) / rate
}

/**
 * Hermitian 2×2 matrix exponential: U = exp(-i H t).
 *
 * Closed form: write H = (τ/2) I + H̃ with H̃ traceless, r = √(δ² + |b|²),
 * then U = e^{-i (τ/2) t} [ cos(r t) I − i sinc(r t) t H̃ ].
 * Avoids eigendecomposition, which is singular when H is diagonal.
 */
export function matrixExpHermitian(H: Matrix2, t: number): Matrix2 {
  const a = H[0][0].re
  const d = H[1][1].re
  const b = H[0][1]

  const halfTrace = (a + d) / 2
  const delta = (a - d) / 2
  const r = Math.sqrt(delta * delta + C.abs2(b))
  const globalPhase = C.exp(-halfTrace * t)

  if (r < 1e-12) {
    return [
      [globalPhase, C.zero()],
      [C.zero(), globalPhase],
    ]
  }

  const cos = Math.cos(r * t)
  const sinOverR = Math.sin(r * t) / r
  const minusI = C.scale(C.negi(), sinOverR)

  const u00 = C.from(cos, -sinOverR * delta)
  const u01 = C.mul(minusI, b)
  const u10 = C.mul(minusI, C.conj(b))
  const u11 = C.from(cos, sinOverR * delta)

  return [
    [C.mul(globalPhase, u00), C.mul(globalPhase, u01)],
    [C.mul(globalPhase, u10), C.mul(globalPhase, u11)],
  ]
}
