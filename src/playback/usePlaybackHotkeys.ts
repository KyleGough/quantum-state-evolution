import { useEffect } from 'react'
import { useQuantumStore } from '../store/useQuantumStore'

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  const tag = target.tagName
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (tag === 'INPUT') {
    const type = (target as HTMLInputElement).type
    return type !== 'range' && type !== 'button' && type !== 'submit' && type !== 'reset'
  }
  return false
}

/** Space toggles play/pause; 0 resets. Skipped while typing in a text field. */
export function usePlaybackHotkeys() {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return
      if (event.repeat) return
      if (isTypingTarget(event.target)) return

      if (event.key === ' ' || event.code === 'Space') {
        event.preventDefault()
        const { isPlaying, setPlaying } = useQuantumStore.getState()
        setPlaying(!isPlaying)
        return
      }

      if (event.key === '0') {
        event.preventDefault()
        useQuantumStore.getState().reset()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
