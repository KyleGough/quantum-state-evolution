import { C } from './complex'
import { Mat, State, type Matrix2, type StateVector } from './state'
import { buildHamiltonianAtTime, type HamiltonianParams } from './hamiltonian'

/**
 * RK4 integrator for i dψ/dt = H(t) ψ.
 *
 * The derivative is: dψ/dt = -i H(t) ψ.
 * We integrate from t0 to t0+totalDt using `steps` fixed sub-steps,
 * renormalizing ψ after each step to preserve unitarity.
 */

const STEPS_PER_FRAME = 100

function applyMinusIH(H: Matrix2, psi: StateVector): StateVector {
  const Hpsi = Mat.mulVec(H, psi)
  return [C.mul({ re: 0, im: -1 }, Hpsi[0]), C.mul({ re: 0, im: -1 }, Hpsi[1])]
}

function scaleVec(s: number, v: StateVector): StateVector {
  return [C.scale(v[0], s), C.scale(v[1], s)]
}

function addVec(a: StateVector, b: StateVector): StateVector {
  return [C.add(a[0], b[0]), C.add(a[1], b[1])]
}

export function rk4Evolve(
  psi: StateVector,
  params: HamiltonianParams,
  t0: number,
  totalDt: number,
): StateVector {
  const steps = STEPS_PER_FRAME
  const dt = totalDt / steps
  let t = t0
  let y = psi

  for (let i = 0; i < steps; i++) {
    const H1 = buildHamiltonianAtTime(params, t)
    const k1 = applyMinusIH(H1, y)

    const H2 = buildHamiltonianAtTime(params, t + dt / 2)
    const k2 = applyMinusIH(H2, addVec(y, scaleVec(dt / 2, k1)))

    const k3 = applyMinusIH(H2, addVec(y, scaleVec(dt / 2, k2)))

    const H4 = buildHamiltonianAtTime(params, t + dt)
    const k4 = applyMinusIH(H4, addVec(y, scaleVec(dt, k3)))

    y = addVec(
      y,
      scaleVec(dt / 6, addVec(addVec(k1, scaleVec(2, k2)), addVec(scaleVec(2, k3), k4))),
    )

    y = State.normalize(y)
    t += dt
  }

  return y
}
