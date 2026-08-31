# Quantum State Evolution

Interactive single-qubit visualizer: Schrödinger evolution under a tunable Hamiltonian, rendered on the Bloch sphere.

## Stack

- **Vite + React + TypeScript**
- **React Three Fiber** — Bloch sphere (3D)
- **Zustand** — simulation & playback state
- **KaTeX** — Dirac notation
- Custom physics engine (`src/sim/`)

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Build & deploy

```bash
npm run build
npm run preview
```

Static output goes to `dist/` — deploy to Vercel by connecting the repo (framework preset: Vite).

## Physics

The qubit evolves under:

\[
H = \frac{\omega}{2}\sigma_z + \frac{\Omega}{2}\sigma_x
\]

\[
|\psi(t)\rangle = e^{-iHt}|\psi(0)\rangle
\]

Evolution uses analytic matrix exponentiation of the 2×2 Hermitian Hamiltonian (exact unitary, stable scrubbing).

## Project structure

```
src/
  sim/           # Pure TS physics engine
  store/         # Zustand store
  playback/      # rAF playback loop
  components/    # UI + Bloch sphere
  presets/       # Hamiltonian & initial-state presets
```
