# Qubit Evolution

## Register

product: Qubit Evolution

## Users

Students, instructors, physicists with a textbook or lecture notes. Well-lit study/classroom, not a dim ops centre. Job: connect Dirac notation, Bloch geometry, and Hamiltonian parameters in one sitting.

## Product Purpose

Qubit Evolution is an interactive computational notebook for single-qubit Schrödinger evolution: tune H, pick |ψ(0)⟩, watch the state precess on the Bloch sphere, read the same state as a ket. Success: maths and picture stay in lockstep; UI stays out of the way of the physics.

## Brand Personality

Computational, precise, textbook-adjacent. Closer to [Wolfram|Alpha](https://www.wolframalpha.com/) than a sci-fi HUD. Paper-white work surface (`#FFF9F5`), burnt-orange labels (`#B94A00`), quiet outlined chrome.

## Anti-references

Dark neon dashboards, cyan/purple glow, glassmorphism, uppercase micro-labels.

## Visual

Restrained palette: warm-tinted neutrals + one accent ≤10%. Hue ~50° (orange-brown), never cool grey.

**Colour**
- bg `#FFF9F5` · panel `#FFFCF9` · muted `#F8F0EC` · hover `#F4EBE6`
- border `#D8CFCA` · strong `#ADA29C`
- text `#3A2A22` · muted `#60524B` · dim `#7B6F68`
- accent `#B94A00` · hover `#A33200` · fill `#FFEDE0` · accent-2 `#713D28`

**Type**
- UI: Source Sans 3 400/600/800. Title 800, section labels 600, body 400. Sentence case, tracking 0.
- Numbers, times, coeff rows: JetBrains Mono 400/500, tabular-nums.
- Equations: KaTeX only (not the UI sans).

**Controls**
- Radius 3px. 1px borders. No drop shadows except popovers.
- Default btn: outline. Fill `#FFFCF9`, border `#D8CFCA`, text `#3A2A22`. Hover: fill `#F4EBE6`, border `#ADA29C`. Weight 400. No filled primary except play/pause.
- Play/pause: filled `#B94A00`, icon on bg. Hover `#A33200`.
- Active preset: fill `#FFEDE0` + border `#B94A00`. Pair fill/border with colour; orange alone is not the selected state.
- Sliders: 4px track, 7×18 rectangular thumb (instrument, not iOS pill).

## Design Principles

- Show the maths; don't decorate it.
- Computational worksheet, not a product marketing site.
- Hierarchy: `#B94A00` headings + spacing, not glow or uppercase.
- Controls outlined and quiet; Bloch sphere and equations carry attention.
- One sitting, one qubit: density is fine, spectacle is not.

## Accessibility & Inclusion

WCAG AA on text and controls. Visible 2px `#B94A00` focus rings. Reduced-motion: no decorative animation; playback motion is the simulation. Selected initial state: fill + border change, not orange alone.
