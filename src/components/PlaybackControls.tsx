import { useQuantumStore } from '../store/useQuantumStore'
import { usePlaybackHotkeys } from '../playback/usePlaybackHotkeys'
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

export function PlaybackControls() {
  usePlaybackHotkeys()

  const time = useQuantumStore((s) => s.time)
  const isPlaying = useQuantumStore((s) => s.isPlaying)
  const setPlaying = useQuantumStore((s) => s.setPlaying)
  const reset = useQuantumStore((s) => s.reset)

  return (
    <footer className="playback">
      <span className="playback-time">
        t = {time.toFixed(2)}
      </span>
      <div className="playback-bar">
        <div className="playback-controls">
          <button
            type="button"
            className="icon-btn"
            onClick={() => setPlaying(true)}
            disabled={isPlaying}
            aria-label="Play"
            aria-keyshortcuts="Space"
            title="Play (Space)"
          >
            <PlayIcon />
          </button>

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
            className="icon-btn"
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
