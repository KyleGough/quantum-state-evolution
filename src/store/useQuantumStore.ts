import { create } from 'zustand'
import { evolveState } from '../sim/evolve'
import { stateToBloch, type BlochVector } from '../sim/bloch'
import { State, type StateVector } from '../sim/state'
import type { HamiltonianParams } from '../sim/hamiltonian'
import type { InitialStateId } from '../presets/hamiltonians'

const PLAYBACK_SPEED = 1

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
  }
}

interface QuantumStore {
  time: number
  isPlaying: boolean
  playbackSpeed: number
  hamiltonian: HamiltonianParams
  initialStateId: InitialStateId
  psi0: StateVector
  psi: StateVector
  bloch: BlochVector

  setTime: (t: number) => void
  setPlaying: (playing: boolean) => void
  togglePlaying: () => void
  reset: () => void
  setHamiltonian: (params: Partial<HamiltonianParams>) => void
  setInitialState: (id: InitialStateId) => void
  tick: (dt: number) => void
  recompute: () => void
}

function computeDerived(psi0: StateVector, hamiltonian: HamiltonianParams, time: number) {
  const psi = evolveState(psi0, hamiltonian, time)
  const bloch = stateToBloch(psi)
  return { psi, bloch }
}

export const useQuantumStore = create<QuantumStore>((set, get) => {
  const psi0 = State.plus()
  const hamiltonian = { omega: 1.5, Omega: 2, OmegaY: 0 }
  const derived = computeDerived(psi0, hamiltonian, 0)

  return {
    time: 0,
    isPlaying: false,
    playbackSpeed: PLAYBACK_SPEED,
    hamiltonian,
    initialStateId: 'plus',
    psi0,
    ...derived,

    setTime: (t) => {
      const { psi0, hamiltonian } = get()
      const clamped = Math.max(0, t)
      set({ time: clamped, ...computeDerived(psi0, hamiltonian, clamped) })
    },

    setPlaying: (playing) => set({ isPlaying: playing }),

    togglePlaying: () => set((s) => ({ isPlaying: !s.isPlaying })),

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
      const { isPlaying, time, playbackSpeed, psi0, hamiltonian } = get()
      if (!isPlaying) return

      const next = time + dt * playbackSpeed
      set({ time: next, ...computeDerived(psi0, hamiltonian, next) })
    },

    recompute: () => {
      const { time, psi0, hamiltonian } = get()
      set(computeDerived(psi0, hamiltonian, time))
    },
  }
})

export function useQuantumSnapshot() {
  return useQuantumStore((s) => ({
    time: s.time,
    isPlaying: s.isPlaying,
    hamiltonian: s.hamiltonian,
    initialStateId: s.initialStateId,
    psi0: s.psi0,
    psi: s.psi,
    bloch: s.bloch,
  }))
}
