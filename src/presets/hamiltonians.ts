import { ket } from '../sim/katexFormat'

export const INITIAL_STATE_PRESETS = [
  { id: 'zero', name: ket('0'), label: 'Computational zero' },
  { id: 'plus', name: ket('{+}'), label: 'Equal superposition' },
  { id: 'minus', name: ket('{-}'), label: 'Phase-flipped superposition' },
  { id: 'one', name: ket('1'), label: 'Computational one' },
] as const

export type InitialStateId = (typeof INITIAL_STATE_PRESETS)[number]['id']
