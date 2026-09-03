import { Mat, State, type StateVector } from './state'
import { buildHamiltonian, isTimeDependent, matrixExpHermitian, type HamiltonianParams } from './hamiltonian'
import { rk4Evolve } from './rk4'

/** Exact evolution for constant H: ψ(t) = e^{-iHt} ψ₀. */
export function evolveState(
  psi0: StateVector,
  params: HamiltonianParams,
  t: number,
): StateVector {
  const H = buildHamiltonian(params)
  const U = matrixExpHermitian(H, t)
  return State.normalize(Mat.mulVec(U, psi0))
}

/**
 * Incremental evolution for time-dependent H(t).
 * Advances ψ from time t to t+dt using RK4.
 * Falls back to the exact solver when H is constant.
 */
export function evolveStateIncremental(
  psi: StateVector,
  params: HamiltonianParams,
  t: number,
  dt: number,
): StateVector {
  if (!isTimeDependent(params)) {
    return evolveState(psi, params, t + dt)
  }
  return rk4Evolve(psi, params, t, dt)
}
