import type { HamiltonianParams } from '../sim/hamiltonian'
import { NO_MODULATION } from '../sim/hamiltonian'
import { ket } from '../sim/katexFormat'

const PRESET_EPS = 1e-9

export const HAMILTONIAN_PRESETS = [
  {
    id: 'larmor',
    label: 'Larmor',
    title: 'Precession about z: ω only',
    params: { omega: 2, OmegaX: 0, OmegaY: 0, modX: { ...NO_MODULATION }, modY: { ...NO_MODULATION } },
  },
  {
    id: 'rabi',
    label: 'Resonant Rabi',
    title: 'Drive on resonance: Ωx only',
    params: { omega: 0, OmegaX: 2, OmegaY: 0, modX: { ...NO_MODULATION }, modY: { ...NO_MODULATION } },
  },
  {
    id: 'detuned',
    label: 'Detuned Rabi',
    title: 'Drive off resonance: ω and Ωx',
    params: { omega: 1.5, OmegaX: 2, OmegaY: 0, modX: { ...NO_MODULATION }, modY: { ...NO_MODULATION } },
  },
  {
    id: 'driven-qubit',
    label: 'Driven Qubit',
    title: 'σ_z gap + cosine drive on σ_x',
    params: {
      omega: 2, OmegaX: 0, OmegaY: 0,
      modX: { amplitude: 1, driveFreq: 2 },
      modY: { ...NO_MODULATION },
    },
  },
  {
    id: 'rabi-drive',
    label: 'Rabi Drive',
    title: 'Resonant cosine drive: ω_d = ω',
    params: {
      omega: 2, OmegaX: 0, OmegaY: 0,
      modX: { amplitude: 0.5, driveFreq: 2 },
      modY: { ...NO_MODULATION },
    },
  },
  {
    id: 'detuned-drive',
    label: 'Detuned Drive',
    title: 'Off-resonance drive: ω_d ≠ ω',
    params: {
      omega: 2, OmegaX: 0, OmegaY: 0,
      modX: { amplitude: 0.5, driveFreq: 1.2 },
      modY: { ...NO_MODULATION },
    },
  },
  {
    id: 'rotating-field',
    label: 'Rotating Field',
    title: 'Circular drive in x-y plane',
    params: {
      omega: 2, OmegaX: 0, OmegaY: 0,
      modX: { amplitude: 0.8, driveFreq: 2 },
      modY: { amplitude: 0.8, driveFreq: 2 },
    },
  },
] as const

function modClose(a: { amplitude: number; driveFreq: number }, b: { amplitude: number; driveFreq: number }): boolean {
  return Math.abs(a.amplitude - b.amplitude) < PRESET_EPS && Math.abs(a.driveFreq - b.driveFreq) < PRESET_EPS
}

export function matchingHamiltonianPresetId(
  params: HamiltonianParams,
): (typeof HAMILTONIAN_PRESETS)[number]['id'] | null {
  const found = HAMILTONIAN_PRESETS.find(
    (preset) =>
      Math.abs(preset.params.omega - params.omega) < PRESET_EPS &&
      Math.abs(preset.params.OmegaX - params.OmegaX) < PRESET_EPS &&
      Math.abs(preset.params.OmegaY - params.OmegaY) < PRESET_EPS &&
      modClose(preset.params.modX, params.modX) &&
      modClose(preset.params.modY, params.modY),
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
