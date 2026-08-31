import { KatexInline } from './Katex'
import { braket, ket } from '../sim/katexFormat'
import { BLOCH_TIP_COLOR } from './BlochSphere/stateVectorMaterial'

const PSI = String.raw`\psi`

type BasisKet = '0' | '1' | '+' | '-'

function basisKetMath(id: BasisKet): string {
  return id === '+' || id === '-' ? ket(`{${id}}`) : ket(id)
}

function StateKet({ id }: { id: BasisKet }) {
  return (
    <span className="state-ket">
      <KatexInline math={basisKetMath(id)} />
    </span>
  )
}

export function InitialStateHint() {
  return (
    <>
      <p>
        Chooses <KatexInline math={ket(`${PSI}(0)`)} />.
      </p>
      <p>
        <StateKet id="0" />{' '}
        <KatexInline math={`= \\begin{pmatrix} 1 \\\\ 0 \\end{pmatrix}`} /> computational
        zero, Bloch <KatexInline math="+z" />.
      </p>
      <p>
        <StateKet id="+" />{' '}
        <KatexInline math={`= \\frac{1}{\\sqrt{2}}\\begin{pmatrix} 1 \\\\ 1 \\end{pmatrix}`} />{' '}
        equal superposition, Bloch <KatexInline math="+x" />.
      </p>
      <p>
        <StateKet id="-" />{' '}
        <KatexInline math={`= \\frac{1}{\\sqrt{2}}\\begin{pmatrix} 1 \\\\ -1 \\end{pmatrix}`} />{' '}
        phase-flipped superposition, Bloch <KatexInline math="-x" />.
      </p>
      <p>
        <StateKet id="1" />{' '}
        <KatexInline math={`= \\begin{pmatrix} 0 \\\\ 1 \\end{pmatrix}`} /> computational one,
        Bloch <KatexInline math="-z" />.
      </p>
    </>
  )
}

export function EvolutionHint() {
  return (
    <>
      <p>
        The Hamiltonian <KatexInline math="H" /> is time-independent, so the
        time-dependent Schrödinger equation has the closed form
      </p>
      <p>
        <KatexInline math={`${ket(`${PSI}(t)`)} = e^{-iHt}${ket(`${PSI}(0)`)}`} />
      </p>
    </>
  )
}

export function CurrentStateHint() {
  return (
    <>
      <p>
        <KatexInline math={`${ket(PSI)} = \\alpha${ket('0')} + \\beta${ket('1')}`} />.
      </p>
      <p>
        <KatexInline math="\alpha" /> and{' '}
        <KatexInline math="\beta" /> are the probability amplitudes of{' '}
        <StateKet id="0" /> and <StateKet id="1" />.
        Both are complex numbers.
      </p>
      <p>
        Their squared moduli must sum to 1:
      </p>
      <p>
        <KatexInline math={String.raw`|\alpha|^2 + |\beta|^2 = 1`} />.
      </p>
    </>
  )
}

export function ProbabilitiesHint() {
  return (
    <>
      <p>
        Born rule: a computational-basis measurement of{' '}
        <KatexInline math={ket(PSI)} /> yields <StateKet id="0" /> or{' '}
        <StateKet id="1" />. The bars are the two outcome
        probabilities.
      </p>
      <p>
        <KatexInline math={`P(${ket('0')}) = |\\alpha|^2 = |${braket(`0|${PSI}`)}|^2`} />
      </p>
      <p>
        <KatexInline math={`P(${ket('1')}) = |\\beta|^2 = |${braket(`1|${PSI}`)}|^2`} />
      </p>
      <p>
        On the Bloch sphere, the north pole is certain <StateKet id="0" />; the south pole is certain{' '}
        <StateKet id="1" />.
      </p>
    </>
  )
}

export function BlochVectorHint() {
  return (
    <>
      <p>
        <KatexInline
          math={String.raw`\langle\sigma\rangle = (\langle\sigma_x\rangle, \langle\sigma_y\rangle, \langle\sigma_z\rangle)`}
        />{' '}
        is the vector of Pauli expectation values along x, y, and z axes.
        On the Bloch sphere it is the{' '}
        <span className="hint-bloch-tip" style={{ color: BLOCH_TIP_COLOR }}>
          blue
        </span>{' '}
        dot.
      </p>
      <p>
        <KatexInline math={String.raw`\langle\sigma_x\rangle = \langle\psi|\sigma_x|\psi\rangle`} />
      </p>
      <p>
        <KatexInline math={String.raw`\langle\sigma_y\rangle = \langle\psi|\sigma_y|\psi\rangle`} />
      </p>
      <p>
        <KatexInline math={String.raw`\langle\sigma_z\rangle = \langle\psi|\sigma_z|\psi\rangle`} />
      </p>
    </>
  )
}
