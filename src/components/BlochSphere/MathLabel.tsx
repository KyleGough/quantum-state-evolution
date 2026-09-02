import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import * as THREE from 'three'
import { renderKatex } from '../Katex'

/** Viewport width at which labels reach their maximum (current) size. */
const LABEL_MAX_VIEWPORT_PX = 1440
/** Sublinear exponent so narrower viewports shrink labels less aggressively than width/1440. */
const LABEL_VIEWPORT_SCALE_EXPONENT = 0.33
/** Canvas font size used when rasterizing; the sprite is scaled down in world units. */
const RASTER_FONT_PX = 64
/** World-space height of a label at `distanceFactor` 10 on a 1440px-wide viewport. */
const WORLD_HEIGHT_AT_FACTOR_10 = 0.15

const canvasCache = new Map<string, Promise<HTMLCanvasElement | null>>()

function subscribeViewport(onChange: () => void) {
  window.addEventListener('resize', onChange)
  return () => window.removeEventListener('resize', onChange)
}

function getViewportSnapshot() {
  return `${window.innerWidth}|${window.devicePixelRatio}`
}

function readStateKetColor(): string {
  const probe = document.createElement('span')
  probe.style.color = 'var(--state-ket)'
  probe.style.position = 'fixed'
  probe.style.left = '-9999px'
  document.body.appendChild(probe)
  const color = getComputedStyle(probe).color
  probe.remove()
  return color
}

/** Alphabetic Y of a KaTeX `.base`, from its strut (height / depth). */
function strutBaselineY(root: HTMLElement, origin: DOMRect): number | null {
  const strut = root.querySelector('.strut')
  if (!(strut instanceof HTMLElement)) return null
  const verticalAlign = Number.parseFloat(getComputedStyle(strut).verticalAlign)
  if (!Number.isFinite(verticalAlign)) return null
  return strut.getBoundingClientRect().bottom - origin.top + verticalAlign
}

function paintKatexText(
  ctx: CanvasRenderingContext2D,
  root: HTMLElement,
  origin: DOMRect,
) {
  const sharedBaseline = strutBaselineY(root, origin)
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let node: Node | null
  while ((node = walker.nextNode())) {
    const text = node.textContent
    if (!text) continue
    const parent = node.parentElement
    if (!parent) continue

    const range = document.createRange()
    range.selectNodeContents(node)
    const rect = range.getBoundingClientRect()
    if (rect.width < 0.5 || rect.height < 0.5) continue

    const style = getComputedStyle(parent)
    if (style.visibility === 'hidden' || Number.parseFloat(style.opacity) === 0) continue

    ctx.save()
    ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
    ctx.fillStyle = style.color
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
    const metrics = ctx.measureText(text)
    const fontAscent = metrics.fontBoundingBoxAscent || Number.parseFloat(style.fontSize) * 0.8
    const baseline = sharedBaseline ?? rect.top - origin.top + fontAscent
    ctx.fillText(text, rect.left - origin.left, baseline)
    ctx.restore()
  }
}

async function rasterizeKatex(
  math: string,
  color: string,
  dpr: number,
): Promise<HTMLCanvasElement | null> {
  await document.fonts.ready
  try {
    await Promise.all([
      document.fonts.load(`${RASTER_FONT_PX}px KaTeX_Main`),
      document.fonts.load(`italic ${RASTER_FONT_PX}px KaTeX_Math`),
    ])
  } catch {
    /* KaTeX font may still be in-flight; layout uses the fallback then. */
  }

  const html = renderKatex(math, false)
  const host = document.createElement('div')
  host.setAttribute('aria-hidden', 'true')
  host.style.cssText = [
    'position:fixed',
    'left:-10000px',
    'top:0',
    'pointer-events:none',
    `color:${color}`,
    `font-size:${RASTER_FONT_PX}px`,
    'line-height:1',
    'white-space:nowrap',
  ].join(';')
  host.innerHTML = html
  host.querySelectorAll('.katex-mathml').forEach((el) => el.remove())
  document.body.appendChild(host)

  const root = (host.querySelector('.katex-html') as HTMLElement | null) ?? host
  const origin = root.getBoundingClientRect()
  if (origin.width < 1 || origin.height < 1) {
    host.remove()
    return null
  }

  const pad = Math.ceil(RASTER_FONT_PX * 0.18)
  const width = Math.ceil(origin.width) + pad * 2
  const height = Math.ceil(origin.height) + pad * 2
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.ceil(width * dpr))
  canvas.height = Math.max(1, Math.ceil(height * dpr))
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    host.remove()
    return null
  }
  ctx.scale(dpr, dpr)
  ctx.translate(pad, pad)
  paintKatexText(ctx, root, origin)
  host.remove()
  return canvas
}

function getLabelCanvas(math: string, dpr: number): Promise<HTMLCanvasElement | null> {
  const color = readStateKetColor()
  const key = `v2:${math}@${dpr}@${color}`
  let pending = canvasCache.get(key)
  if (!pending) {
    pending = rasterizeKatex(math, color, dpr)
    canvasCache.set(key, pending)
  }
  return pending
}

function noopRaycast() { }

interface MathLabelProps {
  position: [number, number, number]
  math: string
  distanceFactor?: number
}

export function MathLabel({
  position,
  math,
  distanceFactor = 10,
}: MathLabelProps) {
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null)
  const viewportSnapshot = useSyncExternalStore(
    subscribeViewport,
    getViewportSnapshot,
    () => `${LABEL_MAX_VIEWPORT_PX}|1`,
  )
  const [viewportWidth, dprToken] = viewportSnapshot.split('|')
  const dpr = Number(dprToken) || 1

  useEffect(() => {
    let cancelled = false
    getLabelCanvas(math, Math.min(2, dpr)).then((canvas) => {
      if (cancelled || !canvas) return
      const next = new THREE.CanvasTexture(canvas)
      next.colorSpace = THREE.SRGBColorSpace
      next.minFilter = THREE.LinearFilter
      next.magFilter = THREE.LinearFilter
      next.premultiplyAlpha = true
      next.needsUpdate = true
      setTexture(next)
    })
    return () => {
      cancelled = true
    }
  }, [math, dpr])

  const scale = useMemo(() => {
    if (!texture) return [0, 0, 1] as [number, number, number]
    const image = texture.image as HTMLCanvasElement
    const width = Number(viewportWidth) || LABEL_MAX_VIEWPORT_PX
    const linear = Math.min(1, width / LABEL_MAX_VIEWPORT_PX)
    const viewportScale = linear ** LABEL_VIEWPORT_SCALE_EXPONENT
    const height = WORLD_HEIGHT_AT_FACTOR_10 * (distanceFactor / 10) * viewportScale
    const aspect = image.height > 0 ? image.width / image.height : 1
    return [height * aspect, height, 1] as [number, number, number]
  }, [texture, viewportWidth, distanceFactor])

  if (!texture) return null

  return (
    <sprite
      position={position}
      scale={scale}
      renderOrder={6}
      frustumCulled={false}
      raycast={noopRaycast}
    >
      <spriteMaterial
        map={texture}
        transparent
        depthTest={false}
        depthWrite={false}
        toneMapped={false}
        sizeAttenuation
        premultipliedAlpha
      />
    </sprite>
  )
}
