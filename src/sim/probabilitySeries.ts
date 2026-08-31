import { C } from './complex'
import { matrixExpHermitian, buildHamiltonian, type HamiltonianParams } from './hamiltonian'
import { Mat, State, type StateVector } from './state'

const MIN_AXIS_T = 1
const MAX_AXIS_SPAN = 10
const SERIES_SAMPLES = 128

export function axisWindow(time: number): { tMin: number; tMax: number } {
  const t = Math.max(0, time)
  const tMax = Math.max(t, MIN_AXIS_T)
  const tMin = tMax > MAX_AXIS_SPAN ? tMax - MAX_AXIS_SPAN : 0
  return { tMin, tMax }
}

export function probabilityTimeSeries(
  psi0: StateVector,
  params: HamiltonianParams,
  tMin: number,
  tMax: number,
): { t: number; p0: number; p1: number }[] {
  const start = Math.max(0, tMin)
  const end = Math.max(start, tMax)
  const span = end - start
  const H = buildHamiltonian(params)
  const n = SERIES_SAMPLES
  const out: { t: number; p0: number; p1: number }[] = new Array(n)
  for (let i = 0; i < n; i++) {
    const t = span === 0 ? start : start + (span * i) / (n - 1)
    const psi = State.normalize(Mat.mulVec(matrixExpHermitian(H, t), psi0))
    out[i] = {
      t,
      p0: C.abs2(psi[0]),
      p1: C.abs2(psi[1]),
    }
  }
  return out
}
