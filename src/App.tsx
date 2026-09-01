import { BlochSphere } from './components/BlochSphere/BlochSphere'
import { PlaybackControls } from './components/PlaybackControls'
import { HamiltonianControls } from './components/HamiltonianControls'
import { DiracPanel } from './components/DiracPanel'
import { usePlaybackLoop } from './playback/usePlaybackLoop'

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
    </svg>
  )
}

export default function App() {
  usePlaybackLoop()

  return (
    <div className="app app-enter">
      <div className="app-title app-enter-item">
        <h1>Quantum State Evolution</h1>
        <p className="subtitle">Single-qubit Schrödinger evolution under a tunable Hamiltonian</p>
        <div className="app-byline">
          <a
            href="https://github.com/KyleGough"
            className="app-byline-icon"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Kyle Gough on GitHub"
          >
            <GitHubIcon />
          </a>
          <a
            href="https://kylegough.co.uk/"
            className="app-byline-name"
            target="_blank"
            rel="noopener noreferrer"
          >
            Kyle Gough
          </a>
        </div>
      </div>

      <div className="app-body app-enter-item">
        <main className="app-main">
          <section className="viz-column app-enter-item" aria-label="Bloch sphere visualisation">
            <BlochSphere />
            <PlaybackControls />
          </section>

          <aside className="sidebar app-enter-item">
            <HamiltonianControls />
            <DiracPanel />
          </aside>
        </main>
      </div>
    </div>
  )
}
