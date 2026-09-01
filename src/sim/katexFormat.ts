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

function formatComplexKatex(c: Complex, simple: boolean = false): string {
  return simple ? `\\mathtt{${C.formatFixedSimple(c)}}` : `\\mathtt{${C.formatFixed(c)}}`
}

export function rabiReadoutKatex(omegaR: number, period: number | null): string {
  const rate = omegaR.toFixed(2)
  if (period === null) return String.raw`\omega_R = ${rate}`
  return String.raw`\omega_R = ${rate},\quad T = 2\pi/\omega_R = ${period.toFixed(2)}`
}

export function hamiltonianKatex(params: HamiltonianParams): string {
  const parts: { sign: number; tex: string }[] = []

  const push = (coeff: number, sigma: string) => {
    if (Math.abs(coeff) <= 1e-6) return
    parts.push({
      sign: coeff < 0 ? -1 : 1,
      tex: `\\frac{${Math.abs(coeff).toFixed(2)}}{2}\\,${sigma}`,
    })
  }

  push(params.omega, '\\sigma_z')
  push(params.OmegaX, '\\sigma_x')
  push(params.OmegaY, '\\sigma_y')

  if (parts.length === 0) return 'H = 0'

  const body = parts
    .map((p, i) => {
      if (i === 0) return p.sign < 0 ? `- ${p.tex}` : p.tex
      return p.sign < 0 ? `- ${p.tex}` : `+ ${p.tex}`
    })
    .join(' ')

  return `H = ${body}`
}

const EQUATORIAL_COLUMNS: Record<string, string> = {
  [ket('{+}')]: '1 \\\\ 1',
  [ket('{-}')]: '1 \\\\ -1',
  [ket('{+i}')]: '1 \\\\ i',
  [ket('{-i}')]: '1 \\\\ -i',
}

/** Textbook column for |+⟩, |−⟩, |+i⟩, |−i⟩ with 1/√2 factored out of the vector. */
function equatorialBasisColumnKatex(named: string): string | null {
  const body = EQUATORIAL_COLUMNS[named]
  if (body === undefined) return null
  return `\\frac{1}{\\sqrt{2}}\\begin{pmatrix} ${body} \\end{pmatrix}`
}

function namedKetFromAmplitudes(alpha: Complex, beta: Complex): string | null {
  const ab = C.mul(C.conj(alpha), beta)
  return namedKetFromBloch(2 * ab.re, 2 * ab.im, C.abs2(alpha) - C.abs2(beta))
}

export function stateVectorKatex(alpha: Complex, beta: Complex, simple: boolean = false): string {
  const named = simple ? namedKetFromAmplitudes(alpha, beta) : null
  const equatorial = named ? equatorialBasisColumnKatex(named) : null
  const vector =
    equatorial ??
    `\\begin{pmatrix} ${formatComplexKatex(alpha, simple)} \\\\ ${formatComplexKatex(beta, simple)} \\end{pmatrix}`
  return `${ket(PSI)} = ${vector}`
}

const AMP_EPS = 0.03
const INV_SQRT2 = 1 / Math.SQRT2

function snapRealKatex(x: number): string | null {
  if (Math.abs(x) < AMP_EPS) return '0'
  if (Math.abs(x - 1) < AMP_EPS) return '1'
  if (Math.abs(x + 1) < AMP_EPS) return '-1'
  if (Math.abs(x - INV_SQRT2) < AMP_EPS) return String.raw`\frac{1}{\sqrt{2}}`
  if (Math.abs(x + INV_SQRT2) < AMP_EPS) return String.raw`-\frac{1}{\sqrt{2}}`
  return null
}

/** Compact KaTeX for a single amplitude: 0, 1, i, 1/√2, …, else a short decimal. */
export function formatAmplitudeKatex(c: Complex): string {
  const re = snapRealKatex(c.re)
  const im = snapRealKatex(c.im)
  if (re !== null && im !== null) {
    if (im === '0') return re
    const imTex =
      im === '1' ? 'i' : im === '-1' ? '-i' : im.startsWith('-') ? `${im}i` : `${im}i`
    if (re === '0') return imTex
    if (imTex.startsWith('-')) return `${re}${imTex}`
    return `${re}+${imTex}`
  }
  return `\\mathtt{${C.formatFixedSimple(c)}}`
}

export type EnergyLevel = 'plus' | 'minus'

function energyKet(which: EnergyLevel): string {
  return ket(which === 'plus' ? 'E_+' : 'E_-')
}

export function energyEigenvectorKatex(
  alpha: Complex,
  beta: Complex,
  named?: string | null,
  which: EnergyLevel = 'plus',
): string {
  const equatorial = named ? equatorialBasisColumnKatex(named) : null
  const vector =
    equatorial ??
    `\\begin{pmatrix} ${formatAmplitudeKatex(alpha)} \\\\ ${formatAmplitudeKatex(beta)} \\end{pmatrix}`
  const label = energyKet(which)
  if (named) return `${label} = ${named} = ${vector}`
  return `${label} = ${vector}`
}

export function energyEigenvalueKatex(energy: number, omegaR: number, which: EnergyLevel = 'plus'): string {
  const label = which === 'plus' ? 'E_+' : 'E_-'
  const sign = which === 'plus' ? '+' : '-'
  return String.raw`${label} = ${sign}\frac{\omega_R}{2} = ${energy.toFixed(2)},\quad \omega_R = ${omegaR.toFixed(2)}`
}

export function namedKetFromBloch(x: number, y: number, z: number): string | null {
  const tol = 0.08
  if (Math.abs(x) < tol && Math.abs(y) < tol && z > 1 - tol) return ket('0')
  if (Math.abs(x) < tol && Math.abs(y) < tol && z < -1 + tol) return ket('1')
  if (x > 1 - tol && Math.abs(y) < tol && Math.abs(z) < tol) return ket('{+}')
  if (x < -1 + tol && Math.abs(y) < tol && Math.abs(z) < tol) return ket('{-}')
  if (Math.abs(x) < tol && y > 1 - tol && Math.abs(z) < tol) return ket('{+i}')
  if (Math.abs(x) < tol && y < -1 + tol && Math.abs(z) < tol) return ket('{-i}')
  return null
}

export function blochVectorKatex(x: number, y: number, z: number): string {
  return `${braket(SIGMA)} = (${formatRealFixed(x)},\\; ${formatRealFixed(y)},\\; ${formatRealFixed(z)})`
}

export function evolutionKatex(): string {
  return `${ket(`${PSI}(t)`)} = e^{-iHt}${ket(`${PSI}(0)`)}`
}

export function probKetKatex(n: 0 | 1): string {
  return `P(${ket(String(n))})`
}

export const SLIDER_OMEGA = `${String.raw`\omega`}~(${SIGMA}_z)`
export const SLIDER_OMEGA_X = `${String.raw`\Omega`}_x~(${SIGMA}_x)`
export const SLIDER_OMEGA_Y = `${String.raw`\Omega`}_y~(${SIGMA}_y)`
