import type { HamiltonianParams } from '../sim/hamiltonian'
import { ket } from '../sim/katexFormat'

const PRESET_EPS = 1e-9

export const HAMILTONIAN_PRESETS = [
  {
    id: 'larmor',
    label: 'Larmor',
    title: 'Precession about z: ω only',
    params: { omega: 2, OmegaX: 0, OmegaY: 0 },
  },
  {
    id: 'rabi',
    label: 'Resonant Rabi',
    title: 'Drive on resonance: Ωx only',
    params: { omega: 0, OmegaX: 2, OmegaY: 0 },
  },
  {
    id: 'detuned',
    label: 'Detuned Rabi',
    title: 'Drive off resonance: ω and Ωx',
    params: { omega: 1.5, OmegaX: 2, OmegaY: 0 },
  },
] as const

export type HamiltonianPresetId = (typeof HAMILTONIAN_PRESETS)[number]['id']

export function matchingHamiltonianPresetId(
  params: HamiltonianParams,
): HamiltonianPresetId | null {
  const found = HAMILTONIAN_PRESETS.find(
    (preset) =>
      Math.abs(preset.params.omega - params.omega) < PRESET_EPS &&
      Math.abs(preset.params.OmegaX - params.OmegaX) < PRESET_EPS &&
      Math.abs(preset.params.OmegaY - params.OmegaY) < PRESET_EPS,
  )
  return found?.id ?? null
}

export const INITIAL_STATE_PRESETS = [
  { id: 'zero', name: ket('0'), label: 'Computational zero' },
  { id: 'one', name: ket('1'), label: 'Computational one' },
  { id: 'plus', name: ket('{+}'), label: 'Equal superposition' },
  { id: 'minus', name: ket('{-}'), label: 'Phase-flipped superposition' },
  { id: 'plusI', name: ket('{+i}'), label: 'Plus-i superposition' },
  { id: 'minusI', name: ket('{-i}'), label: 'Minus-i superposition' },
] as const

export type InitialStateId = (typeof INITIAL_STATE_PRESETS)[number]['id']
