import { useQuantumStore } from '../store/useQuantumStore'
import { INITIAL_STATE_PRESETS } from '../presets/hamiltonians'
import { C } from '../sim/complex'
import { evolutionKatex, probKetKatex } from '../sim/katexFormat'
import { KatexBlock, KatexInline } from './Katex'
import { BlochVectorRow, StateVectorRow, TimeRow } from './MathDisplay'
import { Popover, PopoverGroup } from './Popover'
import { ProbabilityChart } from './ProbabilityChart'
import {
  BlochVectorHint,
  CurrentStateHint,
  EvolutionHint,
  InitialStateHint,
  ProbabilitiesHint,
} from './SectionHints'

function signedAxis(v: number, pos: string, neg: string): string {
  return v < 0 ? neg : pos
}

function TeachingNote({
  hamiltonian,
}: {
  hamiltonian: { omega: number; Omega: number; OmegaY: number }
}) {
  const { omega, Omega, OmegaY } = hamiltonian
  const ax = Math.abs(Omega)
  const ay = Math.abs(OmegaY)
  const az = Math.abs(omega)

  if (ax < 0.01 && ay < 0.01 && az < 0.01) {
    return (
      <p>
        <KatexInline math="H = 0" />: the state is stationary.
      </p>
    )
  }
  if (ax < 0.01 && ay < 0.01) {
    return (
      <p>
        Dominant <KatexInline math={String.raw`\sigma_z`} /> term: the Bloch vector
        precesses around the <KatexInline math={signedAxis(omega, '+z', '-z')} /> axis
        at rate <KatexInline math={String.raw`|\omega|`} />.
      </p>
    )
  }
  if (az < 0.01 && ay < 0.01) {
    return (
      <p>
        Dominant <KatexInline math={String.raw`\sigma_x`} /> term: the Bloch vector
        rotates around the <KatexInline math={signedAxis(Omega, '+x', '-x')} /> axis at
        Rabi frequency <KatexInline math={String.raw`|\Omega|`} />.
      </p>
    )
  }
  if (az < 0.01 && ax < 0.01) {
    return (
      <p>
        Dominant <KatexInline math={String.raw`\sigma_y`} /> term: the Bloch vector
        rotates around the <KatexInline math={signedAxis(OmegaY, '+y', '-y')} /> axis.
      </p>
    )
  }
  return (
    <p>
      General Pauli Hamiltonian: rotation about axis{' '}
      <KatexInline math={String.raw`(\Omega_x, \Omega_y, \omega)`} /> with angular speed{' '}
      <KatexInline math={String.raw`\sqrt{\omega^2 + \Omega_x^2 + \Omega_y^2}`} />.
    </p>
  )
}

export function DiracPanel() {
  const time = useQuantumStore((s) => s.time)
  const hamiltonian = useQuantumStore((s) => s.hamiltonian)
  const psi = useQuantumStore((s) => s.psi)
  const bloch = useQuantumStore((s) => s.bloch)
  const initialStateId = useQuantumStore((s) => s.initialStateId)
  const setInitialState = useQuantumStore((s) => s.setInitialState)

  const alpha = psi[0]
  const beta = psi[1]
  const p0 = C.abs2(alpha)
  const p1 = C.abs2(beta)

  return (
    <div className="dirac-panel">
      <div className="panel-header">
        <span className="panel-label">State &amp; Notation</span>
      </div>

      <PopoverGroup>
        <Popover content={<InitialStateHint />}>
          <section className="dirac-section">
            <h3 className="section-title">Initial state</h3>
            <div className="state-preset-row">
              {INITIAL_STATE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={`btn btn-ghost state-btn ${initialStateId === preset.id ? 'active' : ''}`}
                  onClick={() => setInitialState(preset.id)}
                  title={preset.label}
                >
                  <KatexInline math={preset.name} />
                </button>
              ))}
            </div>
          </section>
        </Popover>

        <Popover content={<EvolutionHint />}>
          <section className="dirac-section">
            <h3 className="section-title">Evolution</h3>
            <KatexBlock math={evolutionKatex()} />
            <TimeRow time={time} />
          </section>
        </Popover>

        <Popover content={<CurrentStateHint />}>
          <section className="dirac-section dirac-divided">
            <h3 className="section-title">Current state</h3>
            <StateVectorRow alpha={alpha} beta={beta} />
          </section>
        </Popover>

        <Popover content={<ProbabilitiesHint />}>
          <section className="dirac-section dirac-divided">
            <h3 className="section-title">Probabilities</h3>
            <div className="prob-bars">
              <div className="prob-row">
                <span className="prob-label">
                  <KatexInline math={probKetKatex(0)} />
                </span>
                <div className="prob-track">
                  <div className="prob-fill prob-fill-0" style={{ width: `${p0 * 100}%` }} />
                </div>
                <span className="prob-value">{(p0 * 100).toFixed(1)}%</span>
              </div>
              <div className="prob-row">
                <span className="prob-label">
                  <KatexInline math={probKetKatex(1)} />
                </span>
                <div className="prob-track">
                  <div className="prob-fill prob-fill-1" style={{ width: `${p1 * 100}%` }} />
                </div>
                <span className="prob-value">{(p1 * 100).toFixed(1)}%</span>
              </div>
            </div>
            <ProbabilityChart />
          </section>
        </Popover>

        <Popover content={<BlochVectorHint />}>
          <section className="dirac-section">
            <h3 className="section-title">Bloch vector</h3>
            <BlochVectorRow x={bloch.x} y={bloch.y} z={bloch.z} />
          </section>
        </Popover>
      </PopoverGroup>

      <section className="dirac-section teaching-box">
        <h3 className="section-title">What's happening?</h3>
        <TeachingNote hamiltonian={hamiltonian} />
      </section>
    </div>
  )
}
