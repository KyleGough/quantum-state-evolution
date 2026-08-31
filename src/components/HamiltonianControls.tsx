import { formatRealFixed } from '../sim/format'
import { hamiltonianKatex, SLIDER_OMEGA, SLIDER_OMEGA_X, SLIDER_OMEGA_Y } from '../sim/katexFormat'
import { useQuantumStore } from '../store/useQuantumStore'
import { KatexBlock, KatexInline } from './Katex'
import { Popover } from './Popover'
import { HamiltonianHint } from './SectionHints'

const SLIDER_MIN = -4
const SLIDER_MAX = 4
const SLIDER_SCALE = 20

function SignedSlider({
  math,
  value,
  onChange,
}: {
  math: string
  value: number
  onChange: (value: number) => void
}) {
  return (
    <div className="slider-group">
      <label className="slider-label">
        <span>
          <KatexInline math={math} />
        </span>
        <span className="slider-value">{formatRealFixed(value, 2)}</span>
      </label>
      <div className="slider-track-wrap">
        <span className="slider-zero-tick" aria-hidden="true" />
        <input
          type="range"
          min={SLIDER_MIN * SLIDER_SCALE}
          max={SLIDER_MAX * SLIDER_SCALE}
          step={1}
          value={Math.round(value * SLIDER_SCALE)}
          onChange={(e) => onChange(Number(e.target.value) / SLIDER_SCALE)}
        />
      </div>
    </div>
  )
}

export function HamiltonianControls() {
  const hamiltonian = useQuantumStore((s) => s.hamiltonian)
  const setHamiltonian = useQuantumStore((s) => s.setHamiltonian)

  return (
    <div className="hamiltonian-controls">
      <Popover content={<HamiltonianHint />}>
        <div className="panel-header">
          <span className="panel-label">Hamiltonian</span>
        </div>
      </Popover>

      <KatexBlock math={hamiltonianKatex(hamiltonian)} className="hamiltonian-formula" />

      <SignedSlider
        math={SLIDER_OMEGA}
        value={hamiltonian.omega}
        onChange={(omega) => setHamiltonian({ omega })}
      />
      <SignedSlider
        math={SLIDER_OMEGA_X}
        value={hamiltonian.Omega}
        onChange={(Omega) => setHamiltonian({ Omega })}
      />
      <SignedSlider
        math={SLIDER_OMEGA_Y}
        value={hamiltonian.OmegaY}
        onChange={(OmegaY) => setHamiltonian({ OmegaY })}
      />
    </div>
  )
}
