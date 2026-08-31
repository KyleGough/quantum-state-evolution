import { C, type Complex } from './complex'

export type StateVector = [Complex, Complex]

export const State = {
  zero: (): StateVector => [C.one(), C.zero()],
  one: (): StateVector => [C.zero(), C.one()],
  plus: (): StateVector => {
    const s = 1 / Math.SQRT2
    return [C.from(s, 0), C.from(s, 0)]
  },
  minus: (): StateVector => {
    const s = 1 / Math.SQRT2
    return [C.from(s, 0), C.from(-s, 0)]
  },
  normalize: (psi: StateVector): StateVector => {
    const norm = Math.sqrt(C.abs2(psi[0]) + C.abs2(psi[1]))
    if (norm < 1e-12) return State.zero()
    return [C.scale(psi[0], 1 / norm), C.scale(psi[1], 1 / norm)]
  },
  prob0: (psi: StateVector): number => C.abs2(psi[0]),
  prob1: (psi: StateVector): number => C.abs2(psi[1]),
}

export type Matrix2 = [[Complex, Complex], [Complex, Complex]]

export const Mat = {
  identity: (): Matrix2 => [
    [C.one(), C.zero()],
    [C.zero(), C.one()],
  ],
  mulVec: (m: Matrix2, v: StateVector): StateVector => [
    C.add(C.mul(m[0][0], v[0]), C.mul(m[0][1], v[1])),
    C.add(C.mul(m[1][0], v[0]), C.mul(m[1][1], v[1])),
  ],
  mul: (a: Matrix2, b: Matrix2): Matrix2 => [
    [
      C.add(C.mul(a[0][0], b[0][0]), C.mul(a[0][1], b[1][0])),
      C.add(C.mul(a[0][0], b[0][1]), C.mul(a[0][1], b[1][1])),
    ],
    [
      C.add(C.mul(a[1][0], b[0][0]), C.mul(a[1][1], b[1][0])),
      C.add(C.mul(a[1][0], b[0][1]), C.mul(a[1][1], b[1][1])),
    ],
  ],
  dagger: (m: Matrix2): Matrix2 => [
    [C.conj(m[0][0]), C.conj(m[1][0])],
    [C.conj(m[0][1]), C.conj(m[1][1])],
  ],
}
