import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'

const CLOSE_DELAY_MS = 125
const DURATION_MS = 400
const GAP_PX = 12
const VIEW_MARGIN_PX = 8

interface ExclusiveValue {
  activeId: string | null
  requestOpen: (id: string) => void
  requestClose: (id: string) => void
}

const ExclusiveContext = createContext<ExclusiveValue | null>(null)

export function PopoverGroup({ children }: { children: ReactNode }) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const requestOpen = useCallback((id: string) => {
    setActiveId(id)
  }, [])

  const requestClose = useCallback((id: string) => {
    setActiveId((current) => (current === id ? null : current))
  }, [])

  const value = useMemo(
    () => ({ activeId, requestOpen, requestClose }),
    [activeId, requestOpen, requestClose],
  )

  return <ExclusiveContext.Provider value={value}>{children}</ExclusiveContext.Provider>
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  )

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return reduced
}

function useExclusiveOpen(id: string) {
  const ctx = useContext(ExclusiveContext)
  const [localOpen, setLocalOpen] = useState(false)

  const open = useCallback(() => {
    if (ctx) ctx.requestOpen(id)
    else setLocalOpen(true)
  }, [ctx, id])

  const close = useCallback(() => {
    if (ctx) ctx.requestClose(id)
    else setLocalOpen(false)
  }, [ctx, id])

  return {
    isActive: ctx ? ctx.activeId === id : localOpen,
    open,
    close,
  }
}

interface PopoverProps {
  content: ReactNode
  children: ReactNode
}

export function Popover({ content, children }: PopoverProps) {
  const reactId = useId()
  const tooltipId = `popover-${reactId.replace(/:/g, '')}`
  const { isActive, open, close } = useExclusiveOpen(tooltipId)
  const reduceMotion = usePrefersReducedMotion()

  const triggerRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const closeTimerRef = useRef(0)
  const dismissedRef = useRef(false)

  const [mounted, setMounted] = useState(false)
  const [shown, setShown] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })

  const cancelClose = useCallback(() => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = 0
    }
  }, [])

  const tryOpen = useCallback(() => {
    if (dismissedRef.current) return
    cancelClose()
    open()
  }, [cancelClose, open])

  const scheduleClose = useCallback(() => {
    cancelClose()
    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = 0
      dismissedRef.current = false
      close()
    }, CLOSE_DELAY_MS)
  }, [cancelClose, close])

  useEffect(() => () => cancelClose(), [cancelClose])

  useLayoutEffect(() => {
    if (isActive) setMounted(true)
    else setShown(false)
  }, [isActive])

  useEffect(() => {
    if (isActive || !mounted) return
    if (reduceMotion) {
      setMounted(false)
      return
    }
    const timeout = window.setTimeout(() => setMounted(false), DURATION_MS)
    return () => window.clearTimeout(timeout)
  }, [isActive, reduceMotion, mounted])

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current
    const panel = panelRef.current
    const inner = innerRef.current
    if (!trigger || !panel || !inner) return

    const tr = trigger.getBoundingClientRect()
    const height = inner.offsetHeight
    const width = panel.offsetWidth

    let left = tr.left - width - GAP_PX
    left = Math.max(VIEW_MARGIN_PX, left)

    let top = tr.top + tr.height / 2 - height / 2
    const maxTop = window.innerHeight - height - VIEW_MARGIN_PX
    if (maxTop <= VIEW_MARGIN_PX) {
      top = VIEW_MARGIN_PX
    } else {
      top = Math.min(Math.max(top, VIEW_MARGIN_PX), maxTop)
    }

    setCoords((prev) => (prev.top === top && prev.left === left ? prev : { top, left }))
  }, [])

  useLayoutEffect(() => {
    if (!mounted) return
    updatePosition()
    const inner = innerRef.current
    if (!inner) return

    const observer = new ResizeObserver(() => updatePosition())
    observer.observe(inner)
    return () => observer.disconnect()
  }, [mounted, content, updatePosition])

  useLayoutEffect(() => {
    if (!mounted || !isActive) return
    if (reduceMotion) {
      setShown(true)
      return
    }
    const frame = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(frame)
  }, [mounted, isActive, reduceMotion])

  useEffect(() => {
    if (!mounted) return
    const onScrollOrResize = () => updatePosition()
    window.addEventListener('scroll', onScrollOrResize, true)
    window.addEventListener('resize', onScrollOrResize)
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true)
      window.removeEventListener('resize', onScrollOrResize)
    }
  }, [mounted, updatePosition])

  useEffect(() => {
    if (!isActive) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      dismissedRef.current = true
      cancelClose()
      close()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isActive, cancelClose, close])

  const onBlurCapture = (event: FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget as Node | null
    if (triggerRef.current?.contains(next) || panelRef.current?.contains(next)) return
    scheduleClose()
  }

  const panel = mounted
    ? createPortal(
        <div
          ref={panelRef}
          id={tooltipId}
          role="tooltip"
          className="popover-panel"
          aria-hidden={!shown}
          style={{
            top: coords.top,
            left: coords.left,
            opacity: shown ? 1 : 0,
            pointerEvents: shown ? 'auto' : 'none',
            transition: reduceMotion ? 'none' : `opacity ${DURATION_MS}ms var(--ease)`,
          }}
          onPointerEnter={tryOpen}
          onPointerLeave={scheduleClose}
          onMouseDown={(event) => event.preventDefault()}
        >
          <div ref={innerRef} className="popover-panel-inner">
            {content}
          </div>
        </div>,
        document.body,
      )
    : null

  return (
    <>
      <div
        ref={triggerRef}
        className="popover-trigger"
        tabIndex={0}
        aria-describedby={isActive ? tooltipId : undefined}
        onPointerEnter={tryOpen}
        onPointerLeave={scheduleClose}
        onFocusCapture={tryOpen}
        onBlurCapture={onBlurCapture}
      >
        {children}
      </div>
      {panel}
    </>
  )
}
