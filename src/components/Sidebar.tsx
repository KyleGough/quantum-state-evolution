import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { DiracPanel } from './DiracPanel'
import { HamiltonianControls } from './HamiltonianControls'

export const NARROW_LAYOUT_QUERY = '(max-width: 1200px)'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function getFocusable(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((el) => {
    if (el.closest('[inert]')) return false
    const style = getComputedStyle(el)
    if (style.visibility === 'hidden' || style.display === 'none') return false
    return el.getClientRects().length > 0
  })
}

function ChevronIcon() {
  return (
    <svg
      className="sidebar-tab-icon"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <path
        d="M10 3.5 5.5 8l4.5 4.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Sidebar() {
  const reactId = useId()
  const sidebarId = `app-sidebar-${reactId.replace(/:/g, '')}`
  const isNarrow = useMediaQuery(NARROW_LAYOUT_QUERY)
  const [open, setOpen] = useState(false)
  const sidebarRef = useRef<HTMLElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const tabRef = useRef<HTMLButtonElement>(null)
  const wasModalRef = useRef(false)

  const modal = isNarrow && open

  const close = useCallback(() => setOpen(false), [])
  const toggle = useCallback(() => setOpen((value) => !value), [])
  const [backdropMounted, setBackdropMounted] = useState(false)

  useEffect(() => {
    if (!isNarrow) setOpen(false)
  }, [isNarrow])

  useEffect(() => {
    if (modal) {
      setBackdropMounted(true)
      return
    }
    const timeout = window.setTimeout(() => setBackdropMounted(false), 280)
    return () => window.clearTimeout(timeout)
  }, [modal])

  useEffect(() => {
    const body = bodyRef.current
    if (!body) return
    body.inert = isNarrow && !open
    return () => {
      body.inert = false
    }
  }, [isNarrow, open])

  useEffect(() => {
    if (!modal) return
    const nodes = document.querySelectorAll<HTMLElement>('.app-title, .viz-column')
    nodes.forEach((node) => {
      node.inert = true
    })
    return () => {
      nodes.forEach((node) => {
        node.inert = false
      })
    }
  }, [modal])

  useEffect(() => {
    if (!modal) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (document.querySelector('.popover-panel[aria-hidden="false"]')) return
      event.preventDefault()
      close()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [modal, close])

  useEffect(() => {
    if (!modal) return
    const root = sidebarRef.current
    if (!root) return

    const frame = requestAnimationFrame(() => root.focus())

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      const focusable = getFocusable(root)
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    root.addEventListener('keydown', onKeyDown)
    return () => {
      cancelAnimationFrame(frame)
      root.removeEventListener('keydown', onKeyDown)
    }
  }, [modal])

  useEffect(() => {
    if (wasModalRef.current && !modal && isNarrow) {
      tabRef.current?.focus()
    }
    wasModalRef.current = modal
  }, [modal, isNarrow])

  const aside = (
    <aside
      id={sidebarId}
      ref={sidebarRef}
      className={`sidebar app-enter-item${modal ? ' is-open' : ''}`}
      role={modal ? 'dialog' : undefined}
      aria-modal={modal || undefined}
      aria-label={modal ? 'Controls' : undefined}
      tabIndex={modal ? -1 : undefined}
    >
      {isNarrow ? (
        <button
          ref={tabRef}
          type="button"
          className="sidebar-tab"
          onClick={toggle}
          aria-expanded={open}
          aria-controls={sidebarId}
          aria-haspopup="dialog"
          aria-label={open ? 'Close controls' : 'Open controls'}
        >
          <ChevronIcon />
        </button>
      ) : null}
      <div ref={bodyRef} className="sidebar-body">
        <HamiltonianControls />
        <DiracPanel />
      </div>
    </aside>
  )

  if (!isNarrow) return aside

  return createPortal(
    <>
      {backdropMounted ? (
        <div
          className={`sidebar-backdrop${modal ? ' is-visible' : ''}`}
          onClick={close}
          aria-hidden
        />
      ) : null}
      {aside}
    </>,
    document.body,
  )
}
