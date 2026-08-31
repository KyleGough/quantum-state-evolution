import { useQuantumStore } from '../store/useQuantumStore'
import { usePlaybackHotkeys } from '../playback/usePlaybackHotkeys'
import { blochPeriod } from '../sim/hamiltonian'
import resetIconUrl from '../assets/reset.png'

function PlayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M4 2.5v11l9-5.5-9-5.5z" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M3.5 2h2.5v12H3.5V2zm6.5 0H12.5v12H10V2z" />
    </svg>
  )
}

function ResetIcon() {
  return (
    <img
      className="reset-icon"
      src={resetIconUrl}
      alt=""
      width={16}
      height={16}
      draggable={false}
      aria-hidden
    />
  )
}

function RabiProgressRing({ progress }: { progress: number | null }) {
  if (progress === null) return null

  const r = 22
  const c = 2 * Math.PI * r
  const dash = c * Math.min(1, Math.max(0, progress))

  return (
    <svg className="playback-progress-ring" viewBox="0 0 52 52" aria-hidden>
      <circle className="playback-progress-track" cx="26" cy="26" r={r} />
      <circle
        className="playback-progress-fill"
        cx="26"
        cy="26"
        r={r}
        strokeDasharray={`${dash} ${c - dash}`}
        strokeDashoffset={c * 0.25}
      />
    </svg>
  )
}

export function PlaybackControls() {
  usePlaybackHotkeys()

  const time = useQuantumStore((s) => s.time)
  const isPlaying = useQuantumStore((s) => s.isPlaying)
  const hamiltonian = useQuantumStore((s) => s.hamiltonian)
  const setPlaying = useQuantumStore((s) => s.setPlaying)
  const reset = useQuantumStore((s) => s.reset)

  const period = blochPeriod(hamiltonian)
  const progress = period !== null ? (time % period) / period : null

  return (
    <footer className={`playback${isPlaying ? ' is-playing' : ''}`}>
      <span className="playback-time">
        t = {time.toFixed(2)}
      </span>
      <div className="playback-bar">
        <div className="playback-controls">
          <div className="playback-control-cluster">
            <RabiProgressRing progress={progress} />
            <button
              type="button"
              className="icon-btn playback-primary"
              onClick={() => setPlaying(true)}
              disabled={isPlaying}
              aria-label="Play"
              aria-keyshortcuts="Space"
              title="Play (Space)"
            >
              <PlayIcon />
            </button>
          </div>

          <button
            type="button"
            className="icon-btn"
            onClick={() => setPlaying(false)}
            disabled={!isPlaying}
            aria-label="Pause"
            aria-keyshortcuts="Space"
            title="Pause (Space)"
          >
            <PauseIcon />
          </button>

          <button
            type="button"
            className="icon-btn icon-btn-reset"
            onClick={reset}
            aria-label="Reset"
            aria-keyshortcuts="0"
            title="Reset (0)"
          >
            <ResetIcon />
          </button>
        </div>
      </div>
    </footer>
  )
}
