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

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
    </svg>
  )
}

export function PlaybackControls() {
  usePlaybackHotkeys()

  const time = useQuantumStore((s) => s.time)
  const isPlaying = useQuantumStore((s) => s.isPlaying)
  const setPlaying = useQuantumStore((s) => s.setPlaying)
  const reset = useQuantumStore((s) => s.reset)

  return (
    <footer className={`playback${isPlaying ? ' is-playing' : ''}`}>
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
      <a
        href="https://github.com/KyleGough/qubit-evolution"
        className="playback-github"
        aria-label="Kyle Gough on GitHub"
      >
        <GitHubIcon />
      </a>
    </footer>
  )
}
