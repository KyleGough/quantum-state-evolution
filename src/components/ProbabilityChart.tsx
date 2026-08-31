import { useId, useMemo } from 'react'
import { useQuantumStore } from '../store/useQuantumStore'
import { C } from '../sim/complex'
import { axisWindow, probabilityTimeSeries } from '../sim/probabilitySeries'

const VB_W = 320
const VB_H = 140
const PAD = { l: 28, r: 10, t: 8, b: 28 }

const PLOT_W = VB_W - PAD.l - PAD.r
const PLOT_H = VB_H - PAD.t - PAD.b

function toX(t: number, tMin: number, tMax: number): number {
  const span = tMax - tMin
  if (span <= 0) return PAD.l
  return PAD.l + ((t - tMin) / span) * PLOT_W
}

function toY(p: number): number {
  return PAD.t + (1 - p) * PLOT_H
}

function polyline(xs: number[], ys: number[]): string {
  let d = ''
  for (let i = 0; i < xs.length; i++) {
    d += `${i === 0 ? 'M' : 'L'}${xs[i].toFixed(2)} ${ys[i].toFixed(2)}`
  }
  return d
}

function formatTTick(t: number, span: number): string {
  if (span >= 10) return t.toFixed(0)
  return t.toFixed(1)
}

export function ProbabilityChart() {
  const clipId = useId().replace(/:/g, '')
  const time = useQuantumStore((s) => s.time)
  const hamiltonian = useQuantumStore((s) => s.hamiltonian)
  const psi0 = useQuantumStore((s) => s.psi0)
  const psi = useQuantumStore((s) => s.psi)

  const { tMin, tMax } = axisWindow(time)
  const span = tMax - tMin
  const paths = useMemo(() => {
    const series = probabilityTimeSeries(psi0, hamiltonian, tMin, tMax)
    const xs = series.map((s) => toX(s.t, tMin, tMax))
    const y0 = series.map((s) => toY(s.p0))
    const y1 = series.map((s) => toY(s.p1))
    return {
      d0: polyline(xs, y0),
      d1: polyline(xs, y1),
    }
  }, [psi0, hamiltonian, tMin, tMax])

  const p0 = C.abs2(psi[0])
  const p1 = C.abs2(psi[1])
  const nowX = toX(time, tMin, tMax)
  const nowY0 = toY(p0)
  const nowY1 = toY(p1)

  const xTicks = [tMin, tMin + span / 2, tMax]
  const yTicks = [0, 0.5, 1]
  const axisY = toY(0)
  const axisX = toX(tMin, tMin, tMax)

  return (
    <figure className="prob-chart">
      <svg
        className="prob-chart-svg"
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        role="img"
        aria-label={`Probabilities versus time. P of 0 is ${p0.toFixed(2)}, P of 1 is ${p1.toFixed(2)}, t is ${time.toFixed(2)}, axis from ${tMin.toFixed(1)} to ${tMax.toFixed(1)}.`}
      >
        <defs>
          <clipPath id={clipId}>
            <rect x={PAD.l} y={PAD.t} width={PLOT_W} height={PLOT_H} />
          </clipPath>
        </defs>

        {yTicks.map((p) => (
          <line
            key={p}
            className="prob-chart-grid"
            x1={axisX}
            y1={toY(p)}
            x2={PAD.l + PLOT_W}
            y2={toY(p)}
          />
        ))}

        <line className="prob-chart-axis" x1={axisX} y1={PAD.t} x2={axisX} y2={axisY} />
        <line className="prob-chart-axis" x1={axisX} y1={axisY} x2={PAD.l + PLOT_W} y2={axisY} />

        {yTicks.map((p) => (
          <g key={`y-${p}`}>
            <line
              className="prob-chart-tick"
              x1={axisX - 3}
              y1={toY(p)}
              x2={axisX}
              y2={toY(p)}
            />
            <text
              className="prob-chart-label"
              x={axisX - 6}
              y={toY(p)}
              textAnchor="end"
              dominantBaseline="middle"
            >
              {p === 0 || p === 1 ? String(p) : p.toFixed(1)}
            </text>
          </g>
        ))}

        {xTicks.map((t) => (
          <g key={`x-${t}`}>
            <line
              className="prob-chart-tick"
              x1={toX(t, tMin, tMax)}
              y1={axisY}
              x2={toX(t, tMin, tMax)}
              y2={axisY + 3}
            />
            <text
              className="prob-chart-label"
              x={toX(t, tMin, tMax)}
              y={axisY + 13}
              textAnchor={t === tMin ? 'start' : t === tMax ? 'end' : 'middle'}
            >
              {formatTTick(t, span)}
            </text>
          </g>
        ))}

        <text
          className="prob-chart-axis-name"
          x={PAD.l + PLOT_W / 2}
          y={VB_H - 3}
          textAnchor="middle"
        >
          t
        </text>
        <text
          className="prob-chart-axis-name"
          x={4}
          y={PAD.t + 1}
          dominantBaseline="hanging"
        >
          P
        </text>

        <g clipPath={`url(#${clipId})`}>
          <path className="prob-chart-p0" d={paths.d0} />
          <path className="prob-chart-p1" d={paths.d1} />
          <line
            className="prob-chart-now"
            x1={nowX}
            y1={PAD.t}
            x2={nowX}
            y2={axisY}
          />
        </g>

        <circle className="prob-chart-dot-0" cx={nowX} cy={nowY0} r={3.5} />
        <rect
          className="prob-chart-dot-1"
          x={nowX - 3}
          y={nowY1 - 3}
          width={6}
          height={6}
        />
      </svg>
    </figure>
  )
}
