import { BlochSphere } from './components/BlochSphere/BlochSphere'
import { PlaybackControls } from './components/PlaybackControls'
import { Sidebar } from './components/Sidebar'
import { usePlaybackLoop } from './playback/usePlaybackLoop'

export default function App() {
  usePlaybackLoop()

  return (
    <div className="app app-enter">
      <div className="app-title app-enter-item">
        <h1>Qubit Evolution</h1>
        <p className="subtitle">Single-qubit Schrödinger evolution under a tunable Hamiltonian</p>
      </div>

      <div className="app-body app-enter-item">
        <main className="app-main">
          <section className="viz-column app-enter-item" aria-label="Bloch sphere visualisation">
            <BlochSphere />
            <PlaybackControls />
          </section>

          <Sidebar />
        </main>
      </div>
    </div>
  )
}
