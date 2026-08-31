import { useEffect } from 'react'
import { useQuantumStore } from '../store/useQuantumStore'

/** Gaps larger than this are a freeze (hidden tab, sleep), not a frame. */
const MAX_FRAME_DT = 0.5

/** Drives playback via requestAnimationFrame for smooth 60fps updates.
 *  Hidden / minimized documents freeze simulation time without toggling play. */
export function usePlaybackLoop() {
  useEffect(() => {
    let raf = 0
    let last = performance.now()

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)

      if (document.visibilityState !== 'visible') {
        last = now
        return
      }

      const dt = (now - last) / 1000
      last = now
      if (dt <= 0 || dt > MAX_FRAME_DT) return

      useQuantumStore.getState().tick(dt)
    }

    const onVisibility = () => {
      last = performance.now()
      if (document.visibilityState === 'hidden') {
        cancelAnimationFrame(raf)
        raf = 0
      } else if (!raf) {
        raf = requestAnimationFrame(frame)
      }
    }

    document.addEventListener('visibilitychange', onVisibility)
    if (document.visibilityState === 'visible') {
      raf = requestAnimationFrame(frame)
    }

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      cancelAnimationFrame(raf)
    }
  }, [])
}
