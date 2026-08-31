import katex from 'katex'

interface KatexBlockProps {
  math: string
  className?: string
}

export function KatexBlock({ math, className }: KatexBlockProps) {
  const html = katex.renderToString(math, {
    throwOnError: false,
    displayMode: true,
  })

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

interface KatexInlineProps {
  math: string
}

export function KatexInline({ math }: KatexInlineProps) {
  const html = katex.renderToString(math, {
    throwOnError: false,
    displayMode: false,
  })

  return <span dangerouslySetInnerHTML={{ __html: html }} />
}
