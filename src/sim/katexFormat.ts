import type { Complex } from './complex'
import { C } from './complex'
import type { HamiltonianParams } from './hamiltonian'
import { formatRealFixed } from './format'

// String.raw keeps `\rangle` / `\langle` as literal LaTeX (JS would treat `\r` as CR).
const RANGLE = String.raw`\rangle`
const LANGLE = String.raw`\langle`
const PSI = String.raw`\psi`
const SIGMA = String.raw`\sigma`

export function ket(content: string): string {
  return `|${content}${RANGLE}`
}

export function braket(content: string): string {
  return `${LANGLE}${content}${RANGLE}`
}

export function formatComplexKatex(c: Complex): string {
  return `\\mathtt{${C.formatFixed(c, 2)}}`
}

export function hamiltonianKatex(params: HamiltonianParams): string {
  const terms: string[] = []

  if (Math.abs(params.omega) > 1e-6) {
    terms.push(`\\frac{${params.omega.toFixed(2)}}{2}\\,\\sigma_z`)
  }
  if (Math.abs(params.Omega) > 1e-6) {
    terms.push(`\\frac{${params.Omega.toFixed(2)}}{2}\\,\\sigma_x`)
  }
  if (Math.abs(params.OmegaY) > 1e-6) {
    terms.push(`\\frac{${params.OmegaY.toFixed(2)}}{2}\\,\\sigma_y`)
  }

  if (terms.length === 0) return 'H = 0'
  return `H = ${terms.join(' + ')}`
}

export function stateVectorKatex(alpha: Complex, beta: Complex): string {
  return `${ket(PSI)} = \\begin{pmatrix} ${formatComplexKatex(alpha)} \\\\ ${formatComplexKatex(beta)} \\end{pmatrix}`
}

export function blochVectorKatex(x: number, y: number, z: number): string {
  return `${braket(SIGMA)} = (${formatRealFixed(x, 2)},\\; ${formatRealFixed(y, 2)},\\; ${formatRealFixed(z, 2)})`
}

export function evolutionKatex(): string {
  return `${ket(`${PSI}(t)`)} = e^{-iHt}${ket(`${PSI}(0)`)}`
}

export function probKetKatex(n: 0 | 1): string {
  return `P(${ket(String(n))})`
}

export function timeKatex(t: number): string {
  return `t = ${t.toFixed(2)}`
}

export const SLIDER_OMEGA = `${String.raw`\omega`}~(${SIGMA}_z)`
export const SLIDER_OMEGA_X = `${String.raw`\Omega`}_x~(${SIGMA}_x)`
export const SLIDER_OMEGA_Y = `${String.raw`\Omega`}_y~(${SIGMA}_y)`
