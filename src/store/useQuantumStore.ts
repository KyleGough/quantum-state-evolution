import { create } from 'zustand'
import { evolveState } from '../sim/evolve'
import { stateToBloch, type BlochVector } from '../sim/bloch'
import { State, type StateVector } from '../sim/state'
import type { HamiltonianParams } from '../sim/hamiltonian'
import type { InitialStateId } from '../presets/hamiltonians'

/** React/DOM subscribers (chart, KaTeX hosts, t readout). R3F polls getState() every frame. */
const UI_HZ = 24
const UI_INTERVAL_MS = 1000 / UI_HZ

let lastUiNotifyAt = Number.NEGATIVE_INFINITY

function initialStateFromId(id: InitialStateId): StateVector {
  switch (id) {
    case 'zero':
      return State.zero()
    case 'one':
      return State.one()
    case 'plus':
      return State.plus()
    case 'minus':
      return State.minus()
    case 'plusI':
      return State.plusI()
    case 'minusI':
      return State.minusI()
  }
}

interface QuantumStore {
  time: number
  isPlaying: boolean
  hamiltonian: HamiltonianParams
  initialStateId: InitialStateId
  psi0: StateVector
  psi: StateVector
  bloch: BlochVector

  setPlaying: (playing: boolean) => void
  reset: () => void
  setHamiltonian: (params: Partial<HamiltonianParams>) => void
  setInitialState: (id: InitialStateId) => void
  tick: (dt: number) => void
}

function computeDerived(psi0: StateVector, hamiltonian: HamiltonianParams, time: number) {
  const psi = evolveState(psi0, hamiltonian, time)
  const bloch = stateToBloch(psi)
  return { psi, bloch }
}

function writeSim(state: QuantumStore, time: number, psi: StateVector, bloch: BlochVector) {
  state.time = time
  state.psi = psi
  state.bloch = bloch
}

function notifyUi(set: (partial: Partial<QuantumStore>) => void, partial: Partial<QuantumStore>) {
  lastUiNotifyAt = performance.now()
  set(partial)
}

export const useQuantumStore = create<QuantumStore>((set, get) => {
  const psi0 = State.plus()
  const hamiltonian = { omega: 1.5, OmegaX: 2, OmegaY: 0 }
  const derived = computeDerived(psi0, hamiltonian, 0)

  return {
    time: 0,
    isPlaying: false,
    hamiltonian,
    initialStateId: 'plus',
    psi0,
    ...derived,

    setPlaying: (playing) => {
      if (playing) {
        lastUiNotifyAt = Number.NEGATIVE_INFINITY
        set({ isPlaying: playing })
        return
      }
      // Pause publishes the live sim so the chart / t readout are not ~80ms behind.
      notifyUi(set, { isPlaying: playing })
    },

    reset: () => {
      const { psi0, hamiltonian } = get()
      notifyUi(set, {
        time: 0,
        isPlaying: false,
        ...computeDerived(psi0, hamiltonian, 0),
      })
    },

    setHamiltonian: (params) => {
      const hamiltonian = { ...get().hamiltonian, ...params }
      const { psi0 } = get()
      notifyUi(set, {
        hamiltonian,
        time: 0,
        isPlaying: false,
        ...computeDerived(psi0, hamiltonian, 0),
      })
    },

    setInitialState: (id) => {
      const psi0 = initialStateFromId(id)
      const { hamiltonian } = get()
      notifyUi(set, {
        initialStateId: id,
        psi0,
        time: 0,
        isPlaying: false,
        ...computeDerived(psi0, hamiltonian, 0),
      })
    },

    tick: (dt) => {
      const state = get()
      if (!state.isPlaying) return

      const next = state.time + dt
      const derived = computeDerived(state.psi0, state.hamiltonian, next)
      // Fast path: mutate in place so R3F useFrame / getState() see 60 fps.
      writeSim(state, next, derived.psi, derived.bloch)

      const now = performance.now()
      if (now - lastUiNotifyAt < UI_INTERVAL_MS) return
      // Slow path: notify React (chart, playback t, KaTeX hosts) at ~12 Hz.
      notifyUi(set, { time: next, psi: derived.psi, bloch: derived.bloch })
    },
  }
})
