import { HAMILTONIAN_PRESETS, matchingHamiltonianPresetId } from '../presets/hamiltonians'
import { formatRealFixed } from '../sim/format'
import { hamiltonianKatex, SLIDER_OMEGA, SLIDER_OMEGA_X, SLIDER_OMEGA_Y } from '../sim/katexFormat'
import { useQuantumStore } from '../store/useQuantumStore'
import { KatexBlock, KatexInline } from './Katex'
import { Popover } from './Popover'
import { HamiltonianHint } from './SectionHints'

const SLIDER_MIN = -4
const SLIDER_MAX = 4
const SLIDER_SCALE = 20
const SLIDER_THUMB_PX = 7
const SLIDER_TICKS = [-2, 0, 2] as const

function tickLeft(value: number): string {
  const t = (value - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN)
  return `calc(${SLIDER_THUMB_PX / 2}px + ${t} * (100% - ${SLIDER_THUMB_PX}px))`
}

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
        <span className="slider-value">{formatRealFixed(value)}</span>
      </label>
      <div className="slider-track-wrap">
        <span className="slider-track" aria-hidden="true" />
        {SLIDER_TICKS.map((tick) => (
          <span
            key={tick}
            className="slider-tick"
            style={{ left: tickLeft(tick) }}
            aria-hidden="true"
          />
        ))}
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
  const activePresetId = matchingHamiltonianPresetId(hamiltonian)

  return (
    <div className="hamiltonian-controls">
      <Popover content={<HamiltonianHint />}>
        <div className="panel-header">
          <span className="panel-label">Hamiltonian</span>
        </div>

        <KatexBlock math={hamiltonianKatex(hamiltonian)} className="hamiltonian-formula" />

        <div className="preset-row">
          {HAMILTONIAN_PRESETS.map((preset) => {
            const active = activePresetId === preset.id
            return (
              <button
                key={preset.id}
                type="button"
                className={`btn btn-ghost h-preset-btn ${active ? 'active' : ''}`}
                aria-pressed={active}
                title={preset.title}
                onClick={() => setHamiltonian(preset.params)}
              >
                {preset.label}
              </button>
            )
          })}
        </div>
      </Popover>

      <SignedSlider
        math={SLIDER_OMEGA}
        value={hamiltonian.omega}
        onChange={(omega) => setHamiltonian({ omega })}
      />
      <SignedSlider
        math={SLIDER_OMEGA_X}
        value={hamiltonian.OmegaX}
        onChange={(OmegaX) => setHamiltonian({ OmegaX })}
      />
      <SignedSlider
        math={SLIDER_OMEGA_Y}
        value={hamiltonian.OmegaY}
        onChange={(OmegaY) => setHamiltonian({ OmegaY })}
      />
    </div>
  )
}
