import { useQuantumStore } from '../store/useQuantumStore'
import { INITIAL_STATE_PRESETS } from '../presets/hamiltonians'
import { C } from '../sim/complex'
import { evolutionKatex, probKetKatex } from '../sim/katexFormat'
import { KatexBlock, KatexInline } from './Katex'
import { BlochVectorRow, StateVectorRow, TimeRow } from './MathDisplay'
import { Popover, PopoverGroup } from './Popover'
import {
  BlochVectorHint,
  CurrentStateHint,
  EvolutionHint,
  InitialStateHint,
  ProbabilitiesHint,
} from './SectionHints'

function findTeachingNote(hamiltonian: { omega: number; Omega: number; OmegaY: number }): string {
  const { omega, Omega, OmegaY } = hamiltonian
  if (Omega < 0.01 && OmegaY < 0.01) {
    return 'Dominant σ_z term: the Bloch vector precesses around the Z axis at rate ω.'
  }
  if (omega < 0.01 && OmegaY < 0.01) {
    return 'Dominant σ_x term: the Bloch vector rotates around the X axis at Rabi frequency Ω.'
  }
  if (omega < 0.01 && Omega < 0.01) {
    return 'Dominant σ_y term: the Bloch vector rotates around the Y axis.'
  }
  return 'General Pauli Hamiltonian: rotation about axis (Ω, Ω_y, ω) with speed ½√(ω² + Ω² + Ω_y²).'
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
  const teaching = findTeachingNote(hamiltonian)

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
          <section className="dirac-section">
            <h3 className="section-title">Current state</h3>
            <StateVectorRow alpha={alpha} beta={beta} />
          </section>
        </Popover>

        <Popover content={<ProbabilitiesHint />}>
          <section className="dirac-section">
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
        <p>{teaching}</p>
      </section>
    </div>
  )
}
