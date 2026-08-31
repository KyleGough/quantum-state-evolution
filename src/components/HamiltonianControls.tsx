import { formatRealFixed } from '../sim/format'
import { hamiltonianKatex, SLIDER_OMEGA, SLIDER_OMEGA_X, SLIDER_OMEGA_Y } from '../sim/katexFormat'
import { useQuantumStore } from '../store/useQuantumStore'
import { KatexBlock, KatexInline } from './Katex'

export function HamiltonianControls() {
  const hamiltonian = useQuantumStore((s) => s.hamiltonian)
  const setHamiltonian = useQuantumStore((s) => s.setHamiltonian)

  return (
    <div className="hamiltonian-controls">
      <div className="panel-header">
        <span className="panel-label">Hamiltonian</span>
      </div>

      <KatexBlock math={hamiltonianKatex(hamiltonian)} className="hamiltonian-formula" />

      <div className="slider-group">
        <label className="slider-label">
          <span>
            <KatexInline math={SLIDER_OMEGA} />
          </span>
          <span className="slider-value">{formatRealFixed(hamiltonian.omega, 2)}</span>
        </label>
        <input
          type="range"
          min={0}
          max={4}
          step={0.05}
          value={hamiltonian.omega}
          onChange={(e) => setHamiltonian({ omega: parseFloat(e.target.value) })}
        />
      </div>

      <div className="slider-group">
        <label className="slider-label">
          <span>
            <KatexInline math={SLIDER_OMEGA_X} />
          </span>
          <span className="slider-value">{formatRealFixed(hamiltonian.Omega, 2)}</span>
        </label>
        <input
          type="range"
          min={0}
          max={4}
          step={0.05}
          value={hamiltonian.Omega}
          onChange={(e) => setHamiltonian({ Omega: parseFloat(e.target.value) })}
        />
      </div>

      <div className="slider-group">
        <label className="slider-label">
          <span>
            <KatexInline math={SLIDER_OMEGA_Y} />
          </span>
          <span className="slider-value">{formatRealFixed(hamiltonian.OmegaY, 2)}</span>
        </label>
        <input
          type="range"
          min={0}
          max={4}
          step={0.05}
          value={hamiltonian.OmegaY}
          onChange={(e) => setHamiltonian({ OmegaY: parseFloat(e.target.value) })}
        />
      </div>
    </div>
  )
}
