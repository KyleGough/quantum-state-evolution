import { C, type Complex } from './complex'
import type { Matrix2 } from './state'

/** Pauli matrices σ_x, σ_y, σ_z */
export const SIGMA_X: Matrix2 = [
  [C.zero(), C.one()],
  [C.one(), C.zero()],
]

export const SIGMA_Y: Matrix2 = [
  [C.zero(), C.from(0, -1)],
  [C.from(0, 1), C.zero()],
]

export const SIGMA_Z: Matrix2 = [
  [C.one(), C.zero()],
  [C.zero(), C.from(-1, 0)],
]

export const SIGMA_I: Matrix2 = [
  [C.one(), C.zero()],
  [C.zero(), C.one()],
]

export function pauliCombination(hx: number, hy: number, hz: number): Matrix2 {
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

/** H = (ω/2)σ_z + (Ω/2)σ_x — driven qubit / Rabi Hamiltonian */
export function rabiHamiltonian(omega: number, Omega: number): Matrix2 {
  return pauliCombination(Omega / 2, 0, omega / 2)
}

/** H = (ω/2)σ_z — Larmor precession */
export function larmorHamiltonian(omega: number): Matrix2 {
  return pauliCombination(0, 0, omega / 2)
}

/** H = (Ω/2)σ_x — Rabi oscillation in X */
export function rabiXHamiltonian(Omega: number): Matrix2 {
  return pauliCombination(Omega / 2, 0, 0)
}

export interface HamiltonianParams {
  omega: number
  Omega: number
  OmegaY: number
}

export function buildHamiltonian(params: HamiltonianParams): Matrix2 {
  return pauliCombination(params.Omega / 2, params.OmegaY / 2, params.omega / 2)
}

/** Hermitian 2×2 matrix exponential: U = exp(-i H t) */
export function matrixExpHermitian(H: Matrix2, t: number): Matrix2 {
  const a = H[0][0].re
  const d = H[1][1].re
  const b = H[0][1]
  const c = H[1][0]

  const trace = a + d
  const det = a * d - (b.re * c.re + b.im * c.im)
  const halfTrace = trace / 2
  const disc = halfTrace * halfTrace - det

  if (disc < -1e-12) {
    throw new Error('Matrix is not Hermitian')
  }

  const sqrtDisc = Math.sqrt(Math.max(0, disc))
  const lambda1 = halfTrace + sqrtDisc
  const lambda2 = halfTrace - sqrtDisc

  const diff = lambda1 - lambda2
  if (Math.abs(diff) < 1e-10) {
    const phase1 = C.exp(-lambda1 * t)
    return [
      [phase1, C.zero()],
      [C.zero(), phase1],
    ]
  }

  const v1: [Complex, Complex] = [
    C.from(b.re, b.im),
    C.from(lambda1 - a, 0),
  ]
  const v2: [Complex, Complex] = [
    C.from(b.re, b.im),
    C.from(lambda2 - a, 0),
  ]

  const norm1 = Math.sqrt(C.abs2(v1[0]) + C.abs2(v1[1]))
  const norm2 = Math.sqrt(C.abs2(v2[0]) + C.abs2(v2[1]))

  const e1: [Complex, Complex] =
    norm1 > 1e-10
      ? [C.scale(v1[0], 1 / norm1), C.scale(v1[1], 1 / norm1)]
      : [C.one(), C.zero()]
  const e2: [Complex, Complex] =
    norm2 > 1e-10
      ? [C.scale(v2[0], 1 / norm2), C.scale(v2[1], 1 / norm2)]
      : [C.zero(), C.one()]

  const phase1 = C.exp(-lambda1 * t)
  const phase2 = C.exp(-lambda2 * t)

  const V: Matrix2 = [
    [e1[0], e2[0]],
    [e1[1], e2[1]],
  ]
  const Vdag = [
    [C.conj(V[0][0]), C.conj(V[1][0])],
    [C.conj(V[0][1]), C.conj(V[1][1])],
  ] as Matrix2

  const D: Matrix2 = [
    [phase1, C.zero()],
    [C.zero(), phase2],
  ]

  const VD = [
    [C.mul(V[0][0], D[0][0]), C.mul(V[0][1], D[1][1])],
    [C.mul(V[1][0], D[0][0]), C.mul(V[1][1], D[1][1])],
  ] as Matrix2

  return [
    [
      C.add(C.mul(VD[0][0], Vdag[0][0]), C.mul(VD[0][1], Vdag[1][0])),
      C.add(C.mul(VD[0][0], Vdag[0][1]), C.mul(VD[0][1], Vdag[1][1])),
    ],
    [
      C.add(C.mul(VD[1][0], Vdag[0][0]), C.mul(VD[1][1], Vdag[1][0])),
      C.add(C.mul(VD[1][0], Vdag[0][1]), C.mul(VD[1][1], Vdag[1][1])),
    ],
  ]
}
