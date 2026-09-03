import { C } from './complex'
import { matrixExpHermitian, buildHamiltonian, isTimeDependent, type HamiltonianParams } from './hamiltonian'
import { rk4Evolve } from './rk4'
import { Mat, State, type Matrix2, type StateVector } from './state'

const MIN_AXIS_T = 1
const MAX_AXIS_SPAN = 10
const SERIES_SAMPLES = 64
/** Dense enough that the initial [0, MIN_AXIS_T] window still has SERIES_SAMPLES points. */
const SAMPLE_DT = MIN_AXIS_T / (SERIES_SAMPLES - 1)

export type ProbabilitySample = { t: number; p0: number; p1: number }

interface SeriesCache {
  psi0: StateVector
  params: HamiltonianParams
  /** Grid index of samples[0]. Sample i is at t = i * SAMPLE_DT. */
  firstIndex: number
  samples: ProbabilitySample[]
  /** For time-dependent H: the psi at the last sample's time, to avoid re-evolving. */
  lastPsi?: StateVector
}

let cache: SeriesCache | null = null

function samePsi0(a: StateVector, b: StateVector): boolean {
  return a === b || (
    a[0].re === b[0].re &&
    a[0].im === b[0].im &&
    a[1].re === b[1].re &&
    a[1].im === b[1].im
  )
}

function sameParams(a: HamiltonianParams, b: HamiltonianParams): boolean {
  return a === b || (
    a.omega === b.omega &&
    a.OmegaX === b.OmegaX &&
    a.OmegaY === b.OmegaY &&
    a.modX.amplitude === b.modX.amplitude &&
    a.modX.driveFreq === b.modX.driveFreq &&
    a.modY.amplitude === b.modY.amplitude &&
    a.modY.driveFreq === b.modY.driveFreq
  )
}

function sampleAtStatic(psi0: StateVector, H: Matrix2, t: number): ProbabilitySample {
  const psi = State.normalize(Mat.mulVec(matrixExpHermitian(H, t), psi0))
  return { t, p0: C.abs2(psi[0]), p1: C.abs2(psi[1]) }
}

function sampleFromPsi(psi: StateVector, t: number): ProbabilitySample {
  return { t, p0: C.abs2(psi[0]), p1: C.abs2(psi[1]) }
}

function getCache(psi0: StateVector, params: HamiltonianParams): SeriesCache {
  if (cache && samePsi0(cache.psi0, psi0) && sameParams(cache.params, params)) {
    return cache
  }
  cache = { psi0, params, firstIndex: 0, samples: [] }
  return cache
}

/** Fill a consecutive grid block [i0, i1], reusing cached samples where they overlap. */
function ensureGrid(c: SeriesCache, psi0: StateVector, params: HamiltonianParams, i0: number, i1: number) {
  const td = isTimeDependent(params)
  const heldLast = c.firstIndex + c.samples.length - 1
  const disjoint = c.samples.length === 0 || i1 < c.firstIndex || i0 > heldLast + 1

  if (td) {
    // For time-dependent H, must evolve sequentially from t=0.
    if (disjoint || i0 < c.firstIndex) {
      c.firstIndex = 0
      c.samples = [sampleFromPsi(psi0, 0)]
      let psi = psi0
      for (let i = 1; i <= i1; i++) {
        psi = rk4Evolve(psi, params, (i - 1) * SAMPLE_DT, SAMPLE_DT)
        c.samples.push(sampleFromPsi(psi, i * SAMPLE_DT))
      }
      c.lastPsi = psi
    } else {
      const next = c.firstIndex + c.samples.length
      if (next <= i1) {
        let psi = c.lastPsi ?? psi0
        for (let i = next; i <= i1; i++) {
          psi = rk4Evolve(psi, params, (i - 1) * SAMPLE_DT, SAMPLE_DT)
          c.samples.push(sampleFromPsi(psi, i * SAMPLE_DT))
        }
        c.lastPsi = psi
      }
    }
    if (i0 > c.firstIndex) {
      c.samples.splice(0, i0 - c.firstIndex)
      c.firstIndex = i0
    }
    return
  }

  // Static H: random-access via matrix exponential
  if (disjoint) {
    const H = buildHamiltonian(params)
    c.firstIndex = i0
    c.samples = []
    for (let i = i0; i <= i1; i++) {
      c.samples.push(sampleAtStatic(psi0, H, i * SAMPLE_DT))
    }
    return
  }

  if (i0 > c.firstIndex) {
    c.samples.splice(0, i0 - c.firstIndex)
    c.firstIndex = i0
  }

  const next = c.firstIndex + c.samples.length
  if (next <= i1) {
    const H = buildHamiltonian(params)
    for (let i = next; i <= i1; i++) {
      c.samples.push(sampleAtStatic(psi0, H, i * SAMPLE_DT))
    }
  }
}

export function axisWindow(time: number): { tMin: number; tMax: number } {
  const t = Math.max(0, time)
  const tMax = Math.max(t, MIN_AXIS_T)
  const tMin = tMax > MAX_AXIS_SPAN ? tMax - MAX_AXIS_SPAN : 0
  return { tMin, tMax }
}

/**
 * Probabilities on a fixed time grid covering [tMin, tMax].
 *
 * Uniform resampling every frame would shift every sample time, so nothing
 * could be reused. A stationary grid lets playback append ~1 point per frame
 * and drop points that have slid off the left of the window.
 */
export function probabilityTimeSeries(
  psi0: StateVector,
  params: HamiltonianParams,
  tMin: number,
  tMax: number,
): ProbabilitySample[] {
  const start = Math.max(0, tMin)
  const end = Math.max(start, tMax)
  const i0 = Math.floor(start / SAMPLE_DT)
  const i1 = Math.max(i0, Math.ceil(end / SAMPLE_DT))

  const c = getCache(psi0, params)
  ensureGrid(c, psi0, params, i0, i1)
  return c.samples
}
