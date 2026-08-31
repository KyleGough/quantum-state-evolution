import { Mat, State, type StateVector } from './state'
import { buildHamiltonian, matrixExpHermitian, type HamiltonianParams } from './hamiltonian'

export function evolveState(
  psi0: StateVector,
  params: HamiltonianParams,
  t: number,
): StateVector {
  const H = buildHamiltonian(params)
  const U = matrixExpHermitian(H, t)
  return State.normalize(Mat.mulVec(U, psi0))
}

export function evolutionOperator(params: HamiltonianParams, t: number) {
  const H = buildHamiltonian(params)
  return matrixExpHermitian(H, t)
}
