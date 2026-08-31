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
}

export type Matrix2 = [[Complex, Complex], [Complex, Complex]]

export const Mat = {
  mulVec: (m: Matrix2, v: StateVector): StateVector => [
    C.add(C.mul(m[0][0], v[0]), C.mul(m[0][1], v[1])),
    C.add(C.mul(m[1][0], v[0]), C.mul(m[1][1], v[1])),
  ],
}
