import { create } from 'zustand'
import { evolveState } from '../sim/evolve'
import { stateToBloch, type BlochVector } from '../sim/bloch'
import { State, type StateVector } from '../sim/state'
import type { HamiltonianParams } from '../sim/hamiltonian'
import type { InitialStateId } from '../presets/hamiltonians'

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

    setPlaying: (playing) => set({ isPlaying: playing }),

    reset: () => {
      const { psi0, hamiltonian } = get()
      set({
        time: 0,
        isPlaying: false,
        ...computeDerived(psi0, hamiltonian, 0),
      })
    },

    setHamiltonian: (params) => {
      const hamiltonian = { ...get().hamiltonian, ...params }
      const { psi0 } = get()
      set({
        hamiltonian,
        time: 0,
        isPlaying: false,
        ...computeDerived(psi0, hamiltonian, 0),
      })
    },

    setInitialState: (id) => {
      const psi0 = initialStateFromId(id)
      const { hamiltonian } = get()
      set({
        initialStateId: id,
        psi0,
        time: 0,
        isPlaying: false,
        ...computeDerived(psi0, hamiltonian, 0),
      })
    },

    tick: (dt) => {
      const { isPlaying, time, psi0, hamiltonian } = get()
      if (!isPlaying) return

      const next = time + dt
      set({ time: next, ...computeDerived(psi0, hamiltonian, next) })
    },
  }
})
