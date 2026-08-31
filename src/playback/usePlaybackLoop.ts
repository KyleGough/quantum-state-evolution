import { useEffect } from 'react'
import { useQuantumStore } from '../store/useQuantumStore'

/** Drives playback via requestAnimationFrame for smooth 60fps updates */
export function usePlaybackLoop() {
  useEffect(() => {
    let raf = 0
    let last = performance.now()

    const frame = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      useQuantumStore.getState().tick(dt)
      raf = requestAnimationFrame(frame)
    }

    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [])
}
