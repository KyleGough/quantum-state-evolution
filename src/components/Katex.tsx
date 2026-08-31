import { memo } from 'react'
import katex from 'katex'

const cache = new Map<string, string>()

export function renderKatex(math: string, displayMode: boolean): string {
  const key = `${displayMode ? 'd' : 'i'}:${math}`
  const cached = cache.get(key)
  if (cached !== undefined) return cached

  const html = katex.renderToString(math, {
    throwOnError: false,
    displayMode,
  })
  cache.set(key, html)
  return html
}

interface KatexBlockProps {
  math: string
  className?: string
}

export const KatexBlock = memo(function KatexBlock({ math, className }: KatexBlockProps) {
  const html = renderKatex(math, true)

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
})

interface KatexInlineProps {
  math: string
}

export const KatexInline = memo(function KatexInline({ math }: KatexInlineProps) {
  const html = renderKatex(math, false)

  return <span dangerouslySetInnerHTML={{ __html: html }} />
})
