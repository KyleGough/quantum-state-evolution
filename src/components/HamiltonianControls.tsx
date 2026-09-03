import type { CSSProperties } from 'react'
import { HAMILTONIAN_PRESETS, matchingHamiltonianPresetId } from '../presets/hamiltonians'
import { formatRealFixed } from '../sim/format'
import { isTimeDependent } from '../sim/hamiltonian'
import {
  hamiltonianKatex,
  SLIDER_OMEGA, SLIDER_OMEGA_X, SLIDER_OMEGA_Y,
  SLIDER_MOD_AMP_X, SLIDER_MOD_FREQ_X, SLIDER_MOD_AMP_Y, SLIDER_MOD_FREQ_Y,
} from '../sim/katexFormat'
import { useQuantumStore } from '../store/useQuantumStore'
import { KatexBlock, KatexInline } from './Katex'
import { Popover } from './Popover'
import { HamiltonianHint } from './SectionHints'

const SLIDER_MIN = -2
const SLIDER_MAX = 2
const SLIDER_SCALE = 20
const SLIDER_THUMB_PX = 7
const SLIDER_TICKS = [-1, 0, 1] as const

const MOD_AMP_MIN = -4
const MOD_AMP_MAX = 4
const MOD_AMP_SCALE = 20

const MOD_FREQ_MIN = -10
const MOD_FREQ_MAX = 10
const MOD_FREQ_SCALE = 20

function tickLeft(value: number, min: number, max: number): string {
  const t = (value - min) / (max - min)
  return `calc(${SLIDER_THUMB_PX / 2}px + ${t} * (100% - ${SLIDER_THUMB_PX}px))`
}

function sliderFill(value: number, min: number, max: number): CSSProperties {
  const t = (value - min) / (max - min)
  return { '--slider-fill': `${t * 100}%` } as CSSProperties
}

function SignedSlider({
  math,
  value,
  onChange,
  min = SLIDER_MIN,
  max = SLIDER_MAX,
  scale = SLIDER_SCALE,
  ticks,
}: {
  math: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  scale?: number
  ticks?: readonly number[]
}) {
  const actualTicks = ticks ?? SLIDER_TICKS
  return (
    <div className="slider-group">
      <label className="slider-label">
        <span>
          <KatexInline math={math} />
        </span>
        <span className="slider-value">{formatRealFixed(value)}</span>
      </label>
      <div className="slider-track-wrap" style={sliderFill(value, min, max)}>
        <span className="slider-track" aria-hidden="true" />
        {actualTicks.map((tick) => (
          <span
            key={tick}
            className="slider-tick"
            style={{ left: tickLeft(tick, min, max) }}
            aria-hidden="true"
          />
        ))}
        <input
          type="range"
          min={Math.round(min * scale)}
          max={Math.round(max * scale)}
          step={1}
          value={Math.round(value * scale)}
          onChange={(e) => onChange(Number(e.target.value) / scale)}
        />
      </div>
    </div>
  )
}

const MOD_AMP_TICKS = [-4, -2, 0, 2, 4] as const
const MOD_FREQ_TICKS = [-10, -5, 0, 5, 10] as const

export function HamiltonianControls() {
  const hamiltonian = useQuantumStore((s) => s.hamiltonian)
  const setHamiltonian = useQuantumStore((s) => s.setHamiltonian)
  const setModulation = useQuantumStore((s) => s.setModulation)
  const activePresetId = matchingHamiltonianPresetId(hamiltonian)
  const td = isTimeDependent(hamiltonian)

  const hasAnyMod =
    hamiltonian.modX.amplitude > 0 || hamiltonian.modX.driveFreq > 0 ||
    hamiltonian.modY.amplitude > 0 || hamiltonian.modY.driveFreq > 0

  return (
    <div className="hamiltonian-controls">
      <Popover content={<HamiltonianHint />}>
        <div className="panel-header">
          <span className="panel-label">Hamiltonian</span>
          {td && <span className="td-badge">H(t)</span>}
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

      <details className="modulation-section" open={hasAnyMod}>
        <summary className="modulation-summary">
          <span className="modulation-label">Drive modulation</span>
        </summary>

        <div className="modulation-group">
          <span className="modulation-axis-label">
            <KatexInline math={String.raw`\sigma_x`} /> drive
          </span>
          <SignedSlider
            math={SLIDER_MOD_AMP_X}
            value={hamiltonian.modX.amplitude}
            onChange={(amplitude) => setModulation('x', { amplitude })}
            min={MOD_AMP_MIN}
            max={MOD_AMP_MAX}
            scale={MOD_AMP_SCALE}
            ticks={MOD_AMP_TICKS}
          />
          <SignedSlider
            math={SLIDER_MOD_FREQ_X}
            value={hamiltonian.modX.driveFreq}
            onChange={(driveFreq) => setModulation('x', { driveFreq })}
            min={MOD_FREQ_MIN}
            max={MOD_FREQ_MAX}
            scale={MOD_FREQ_SCALE}
            ticks={MOD_FREQ_TICKS}
          />
        </div>

        <div className="modulation-group">
          <span className="modulation-axis-label">
            <KatexInline math={String.raw`\sigma_y`} /> drive
          </span>
          <SignedSlider
            math={SLIDER_MOD_AMP_Y}
            value={hamiltonian.modY.amplitude}
            onChange={(amplitude) => setModulation('y', { amplitude })}
            min={MOD_AMP_MIN}
            max={MOD_AMP_MAX}
            scale={MOD_AMP_SCALE}
            ticks={MOD_AMP_TICKS}
          />
          <SignedSlider
            math={SLIDER_MOD_FREQ_Y}
            value={hamiltonian.modY.driveFreq}
            onChange={(driveFreq) => setModulation('y', { driveFreq })}
            min={MOD_FREQ_MIN}
            max={MOD_FREQ_MAX}
            scale={MOD_FREQ_SCALE}
            ticks={MOD_FREQ_TICKS}
          />
        </div>
      </details>
    </div>
  )
}
