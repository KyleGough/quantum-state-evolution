import { useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useCursor } from '@react-three/drei'
import * as THREE from 'three'
import { useQuantumStore } from '../../store/useQuantumStore'
import { ket, stateVectorKatex } from '../../sim/katexFormat'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { KatexBlock } from '../Katex'
import { MathLabel } from './MathLabel'
import {
  createStateVectorMaterial,
  createTipMaterial,
  createTipGlowMaterial,
  ROTATION_AXIS_COLOR,
} from './stateVectorMaterial'

const TRAIL_LENGTH = 160
const TRAIL_WIDTH = 0.012
const MAX_TRAIL_STEP = 0.06
const ARROW_HEAD_LENGTH = 0.018
const ARROW_HEAD_WIDTH = 0.011
const ARROW_SHAFT_WIDTH = 0.0045
const TIP_RADIUS = 0.014
const TIP_GLOW_RADIUS = 0.038
const TIP_HIT_RADIUS = 0.11
const TIP_POPOVER_GAP_PX = 16
const VIEW_MARGIN_PX = 8
const POPOVER_DURATION_MS = 400
const AXIS_LEN = 1.02
const AXIS_HEAD_LENGTH = 0.042
const AXIS_HEAD_WIDTH = 0.016
const AXIS_SHAFT_WIDTH = 0.0032
const CROSS_ARM = 0.04
const CROSS_THICK = 0.002
const CROSS_RADIUS = 1
const SMOOTH_RATE = 14

const _dir = new THREE.Vector3()
const _displayed = new THREE.Vector3()
const _target = new THREE.Vector3()
const _tangent = new THREE.Vector3()
const _side = new THREE.Vector3()
const _toCam = new THREE.Vector3()
const _slerpAxis = new THREE.Vector3()
const _slerpQ = new THREE.Quaternion()
const _upZ = new THREE.Vector3(0, 0, 1)
const _yAxis = new THREE.Vector3(0, 1, 0)
const _projected = new THREE.Vector3()
const tipScreen = { x: 0, y: 0 }

function positionTipPopover(panel: HTMLDivElement, x: number, y: number) {
  const inner = panel.firstElementChild as HTMLElement | null
  const height = inner?.offsetHeight ?? panel.offsetHeight
  const width = panel.offsetWidth
  if (width < 1 || height < 1) return

  let left = x - width / 2
  const maxLeft = window.innerWidth - width - VIEW_MARGIN_PX
  if (maxLeft <= VIEW_MARGIN_PX) {
    left = VIEW_MARGIN_PX
  } else {
    left = Math.min(Math.max(left, VIEW_MARGIN_PX), maxLeft)
  }

  let top = y - height - TIP_POPOVER_GAP_PX
  if (top < VIEW_MARGIN_PX) {
    top = y + TIP_POPOVER_GAP_PX
  }
  const maxTop = window.innerHeight - height - VIEW_MARGIN_PX
  if (maxTop <= VIEW_MARGIN_PX) {
    top = VIEW_MARGIN_PX
  } else {
    top = Math.min(Math.max(top, VIEW_MARGIN_PX), maxTop)
  }

  panel.style.top = `${top}px`
  panel.style.left = `${left}px`
}

function projectTipToScreen(camera: THREE.Camera, canvas: HTMLCanvasElement) {
  _projected.copy(_displayed).project(camera)
  const rect = canvas.getBoundingClientRect()
  tipScreen.x = rect.left + (_projected.x * 0.5 + 0.5) * rect.width
  tipScreen.y = rect.top + (-_projected.y * 0.5 + 0.5) * rect.height
}

function BlochTipStatePopover({ panelRef }: { panelRef: RefObject<HTMLDivElement> }) {
  const psi = useQuantumStore((s) => s.psi)
  const reduceMotion = usePrefersReducedMotion()
  const [shown, setShown] = useState(false)

  useLayoutEffect(() => {
    const panel = panelRef.current
    if (panel) positionTipPopover(panel, tipScreen.x, tipScreen.y)
  }, [panelRef, psi])

  useLayoutEffect(() => {
    if (reduceMotion) {
      setShown(true)
      return
    }
    const frame = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(frame)
  }, [reduceMotion])

  useLayoutEffect(() => {
    const panel = panelRef.current
    const inner = panel?.firstElementChild
    if (!panel || !inner) return

    const observer = new ResizeObserver(() => {
      positionTipPopover(panel, tipScreen.x, tipScreen.y)
    })
    observer.observe(inner)
    return () => observer.disconnect()
  }, [panelRef, psi])

  return createPortal(
    <div
      ref={panelRef}
      role="tooltip"
      className="popover-panel bloch-tip-popover"
      aria-hidden={!shown}
      style={{
        opacity: shown ? 1 : 0,
        pointerEvents: 'none',
        transition: reduceMotion ? 'none' : `opacity ${POPOVER_DURATION_MS}ms var(--ease)`,
      }}
    >
      <div className="popover-panel-inner">
        <KatexBlock math={stateVectorKatex(psi[0], psi[1], true)} />
      </div>
    </div>,
    document.body,
  )
}

/** Unit Bloch vector in Three.js coords. Pure states live on the sphere. */
function blochTarget(bloch: { x: number; y: number; z: number }, out: THREE.Vector3) {
  out.set(bloch.x, bloch.z, bloch.y)
  const len = out.length()
  if (len > 1e-8) out.multiplyScalar(1 / len)
  return out
}

/** Spherical interpolation of unit vectors. Linear lerp would cut a chord inside the sphere. */
function slerpUnit(out: THREE.Vector3, a: THREE.Vector3, b: THREE.Vector3, t: number) {
  if (a.lengthSq() < 1e-12) {
    out.copy(b)
    return out
  }
  if (b.lengthSq() < 1e-12) {
    out.copy(a)
    return out
  }
  const dot = THREE.MathUtils.clamp(a.dot(b), -1, 1)
  if (dot > 0.9995) {
    out.copy(a).lerp(b, t)
    const len = out.length()
    if (len > 1e-8) out.multiplyScalar(1 / len)
    return out
  }
  if (dot < -0.9995) {
    _slerpAxis.set(-a.y, a.x, 0)
    if (_slerpAxis.lengthSq() < 1e-12) _slerpAxis.set(0, -a.z, a.y)
    _slerpQ.setFromAxisAngle(_slerpAxis.normalize(), Math.PI * t)
    out.copy(a).applyQuaternion(_slerpQ)
    return out
  }
  const theta = Math.acos(dot)
  const sinTheta = Math.sin(theta)
  out.copy(a).multiplyScalar(Math.sin((1 - t) * theta) / sinTheta)
  out.addScaledVector(b, Math.sin(t * theta) / sinTheta)
  return out
}

function appendTrailPoint(points: THREE.Vector3[], next: THREE.Vector3) {
  const last = points[points.length - 1]
  if (!last) {
    points.push(next.clone())
    return
  }
  const angle = Math.acos(THREE.MathUtils.clamp(last.dot(next), -1, 1))
  const steps = Math.max(1, Math.ceil(angle / MAX_TRAIL_STEP))
  for (let s = 1; s <= steps; s++) {
    const p = new THREE.Vector3()
    slerpUnit(p, last, next, s / steps)
    points.push(p)
  }
  if (points.length > TRAIL_LENGTH) {
    points.splice(0, points.length - TRAIL_LENGTH)
  }
}

const COORDINATE_AXES: {
  blochDir: [number, number, number]
  label: string
  labelBloch: [number, number, number]
}[] = [
    { blochDir: [1, 0, 0], label: 'x', labelBloch: [1.34, 0, -0.16] },
    { blochDir: [0, 1, 0], label: 'y', labelBloch: [0, 1.34, 0.1] },
    { blochDir: [0, 0, 1], label: 'z', labelBloch: [0.16, 0, 1.3] },
  ]

function blochToThree(x: number, y: number, z: number): THREE.Vector3 {
  return new THREE.Vector3(x, z, y)
}

function createFacingFadeMaterial(options: {
  color: THREE.ColorRepresentation
  frontOpacity: number
  backOpacity: number
  wireframe?: boolean
  timeUniform?: boolean
}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(options.color) },
      uFrontOpacity: { value: options.frontOpacity },
      uBackOpacity: { value: options.backOpacity },
      uTime: { value: 0 },
      uPulse: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying float vFacing;

      void main() {
        vec3 worldNormal = normalize(mat3(modelMatrix) * normal);
        vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
        vec3 viewDir = normalize(cameraPosition - worldPos);
        vFacing = dot(worldNormal, viewDir);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: options.timeUniform
      ? /* glsl */ `
          uniform vec3 uColor;
          uniform float uFrontOpacity;
          uniform float uBackOpacity;
          uniform float uTime;
          uniform float uPulse;

          varying float vFacing;

          void main() {
            float t = smoothstep(0.0, 0.35, vFacing);
            float breathe = 1.0 + uPulse * 0.15 * sin(uTime * 3.2);
            float alpha = mix(uBackOpacity, uFrontOpacity, t) * breathe;
            gl_FragColor = vec4(uColor, alpha);
          }
        `
      : /* glsl */ `
          uniform vec3 uColor;
          uniform float uFrontOpacity;
          uniform float uBackOpacity;
          varying float vFacing;

          void main() {
            float t = smoothstep(0.0, 0.35, vFacing);
            float alpha = mix(uBackOpacity, uFrontOpacity, t);
            gl_FragColor = vec4(uColor, alpha);
          }
        `,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    wireframe: options.wireframe ?? false,
  })
}

const TRAIL_COLOR = 0xb45309
const TRAIL_OPACITY_NEAR = 0.9
const TRAIL_OPACITY_FAR = 0.01

function createTrailMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(TRAIL_COLOR) },
      uHot: { value: new THREE.Color('#ea580c') },
      uTime: { value: 0 },
      uPulse: { value: 0 },
    },
    vertexShader: /* glsl */ `
      attribute float aOpacity;
      attribute float aAge;
      varying float vOpacity;
      varying float vAge;

      void main() {
        vOpacity = aOpacity;
        vAge = aAge;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform vec3 uHot;
      uniform float uTime;
      uniform float uPulse;

      varying float vOpacity;
      varying float vAge;

      void main() {
        float head = smoothstep(0.55, 1.0, vAge);
        float shimmer = 0.85 + 0.15 * sin(uTime * 8.0 + vAge * 12.0);
        vec3 color = mix(uColor, uHot, head * (0.55 + uPulse * 0.35));
        float alpha = vOpacity * shimmer * (0.75 + head * 0.25);
        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending,
  })
}

function createAtmosphereMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color('#b45309') },
      uTime: { value: 0 },
      uPulse: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vViewPosition;

      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uTime;
      uniform float uPulse;

      varying vec3 vNormal;
      varying vec3 vViewPosition;

      void main() {
        vec3 viewDir = normalize(vViewPosition);
        float ndv = abs(dot(normalize(vNormal), viewDir));
        float fresnel = pow(1.0 - ndv, 3.2);
        float wave = 0.5 + 0.5 * sin(uTime * 2.8);
        float alpha = fresnel * (0.04 + uPulse * 0.06 * wave);
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
  })
}

function trailOpacity(index: number, count: number): number {
  const age = (count - 1 - index) / TRAIL_LENGTH
  const fade = Math.pow(1 - Math.min(1, age), 1.55)
  return TRAIL_OPACITY_FAR + (TRAIL_OPACITY_NEAR - TRAIL_OPACITY_FAR) * fade
}

function trailAge(index: number, count: number): number {
  if (count <= 1) return 1
  return index / (count - 1)
}

function StateVector({
  tipHovered,
  isPlaying,
  onTipHover,
  panelRef,
}: {
  tipHovered: boolean
  isPlaying: boolean
  onTipHover: (hovered: boolean) => void
  panelRef: RefObject<HTMLDivElement>
}) {
  const rootRef = useRef<THREE.Group>(null)
  const shaftRef = useRef<THREE.Mesh>(null)
  const headRef = useRef<THREE.Mesh>(null)
  const tipRef = useRef<THREE.Mesh>(null)
  const tipGlowRef = useRef<THREE.Mesh>(null)
  const hitRef = useRef<THREE.Mesh>(null)
  const initialized = useRef(false)
  const lastTime = useRef(-1)
  const lastInitialId = useRef(useQuantumStore.getState().initialStateId)
  const settling = useRef(false)

  const vectorMaterial = useMemo(() => createStateVectorMaterial(), [])
  const tipMaterial = useMemo(() => createTipMaterial(), [])
  const tipGlowMaterial = useMemo(() => createTipGlowMaterial(), [])

  useCursor(tipHovered && !isPlaying)

  useFrame((state, delta) => {
    const { bloch, time, isPlaying: playing, initialStateId } = useQuantumStore.getState()
    blochTarget(bloch, _target)

    const jumped = Math.abs(time - lastTime.current) > 0.02
    lastTime.current = time

    if (initialStateId !== lastInitialId.current) {
      lastInitialId.current = initialStateId
      settling.current = true
    }
    if (playing) settling.current = false

    if (!initialized.current) {
      _displayed.copy(_target)
      initialized.current = true
    } else if (playing || settling.current) {
      const t = 1 - Math.exp(-SMOOTH_RATE * delta)
      slerpUnit(_displayed, _displayed, _target, t)
      if (settling.current && _displayed.distanceToSquared(_target) < 1e-8) {
        _displayed.copy(_target)
        settling.current = false
      }
    } else if (jumped) {
      _displayed.copy(_target)
    }

    const len = _displayed.length()
    const visible = len > 1e-6
    const pulse = playing ? 1 : 0
    const clock = state.clock.elapsedTime

    vectorMaterial.uniforms.uTime.value = clock
    vectorMaterial.uniforms.uPulse.value = pulse
    tipMaterial.uniforms.uTime.value = clock
    tipMaterial.uniforms.uPulse.value = pulse
    tipGlowMaterial.uniforms.uTime.value = clock
    tipGlowMaterial.uniforms.uPulse.value = pulse

    if (rootRef.current) rootRef.current.visible = visible
    if (tipRef.current) tipRef.current.visible = visible
    if (tipGlowRef.current) tipGlowRef.current.visible = visible
    if (hitRef.current) hitRef.current.visible = visible
    if (!visible) return

    _dir.copy(_displayed)
    const shaftLen = Math.max(0.02, 1 - ARROW_HEAD_LENGTH * 0.75)

    if (rootRef.current) {
      rootRef.current.quaternion.setFromUnitVectors(_yAxis, _dir)
    }
    if (shaftRef.current) {
      shaftRef.current.scale.y = shaftLen
      shaftRef.current.position.y = shaftLen / 2
    }
    if (headRef.current) {
      headRef.current.position.y = shaftLen + ARROW_HEAD_LENGTH * 0.45
    }
    if (tipRef.current) {
      tipRef.current.position.copy(_displayed)
    }
    if (tipGlowRef.current) {
      tipGlowRef.current.position.copy(_displayed)
      const glowScale = 1 + pulse * 0.12 * Math.sin(clock * 5.5)
      tipGlowRef.current.scale.setScalar(glowScale)
    }
    if (hitRef.current) {
      hitRef.current.position.copy(_displayed)
    }

    projectTipToScreen(state.camera, state.gl.domElement)
    const panel = panelRef.current
    if (panel) positionTipPopover(panel, tipScreen.x, tipScreen.y)
  })

  return (
    <>
      <group ref={rootRef}>
        <mesh ref={shaftRef} material={vectorMaterial} renderOrder={1}>
          <cylinderGeometry args={[ARROW_SHAFT_WIDTH, ARROW_SHAFT_WIDTH, 1, 16]} />
        </mesh>
        <mesh ref={headRef} material={vectorMaterial} renderOrder={1}>
          <coneGeometry args={[ARROW_HEAD_WIDTH, ARROW_HEAD_LENGTH, 16]} />
        </mesh>
      </group>
      <mesh ref={tipGlowRef} material={tipGlowMaterial} renderOrder={2}>
        <sphereGeometry args={[TIP_GLOW_RADIUS, 24, 24]} />
      </mesh>
      <mesh ref={tipRef} material={tipMaterial} renderOrder={3}>
        <sphereGeometry args={[TIP_RADIUS, 24, 24]} />
      </mesh>
      <mesh
        ref={hitRef}
        renderOrder={4}
        onPointerOver={(event) => {
          event.stopPropagation()
          onTipHover(true)
        }}
        onPointerOut={() => onTipHover(false)}
      >
        <sphereGeometry args={[TIP_HIT_RADIUS, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </mesh>
    </>
  )
}

function CoordinateAxis({
  blochDir,
  label,
  labelBloch,
  material,
}: {
  blochDir: [number, number, number]
  label: string
  labelBloch: [number, number, number]
  material: THREE.Material
}) {
  const { quaternion, labelPos } = useMemo(() => {
    const dir = blochToThree(...blochDir).normalize()
    const quaternion = new THREE.Quaternion().setFromUnitVectors(_yAxis, dir)
    const p = blochToThree(...labelBloch)
    return { quaternion, labelPos: [p.x, p.y, p.z] as [number, number, number] }
  }, [blochDir, labelBloch])

  const fwdLen = AXIS_LEN - AXIS_HEAD_LENGTH * 0.55

  return (
    <>
      <group quaternion={quaternion}>
        <mesh material={material} position={[0, fwdLen / 2, 0]} scale={[1, fwdLen, 1]} renderOrder={1}>
          <cylinderGeometry args={[AXIS_SHAFT_WIDTH, AXIS_SHAFT_WIDTH, 1, 8]} />
        </mesh>
        <mesh material={material} position={[0, -AXIS_LEN / 2, 0]} scale={[1, AXIS_LEN, 1]} renderOrder={1}>
          <cylinderGeometry args={[AXIS_SHAFT_WIDTH, AXIS_SHAFT_WIDTH, 1, 8]} />
        </mesh>
        <mesh material={material} position={[0, fwdLen + AXIS_HEAD_LENGTH * 0.45, 0]} renderOrder={1}>
          <coneGeometry args={[AXIS_HEAD_WIDTH, AXIS_HEAD_LENGTH, 8]} />
        </mesh>
      </group>
      <MathLabel
        position={labelPos}
        math={label}
        distanceFactor={10}
        className="bloch-math-label bloch-axis-label"
      />
    </>
  )
}

function CoordinateAxes() {
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#6f6a62',
        transparent: true,
        opacity: 0.58,
        depthWrite: false,
      }),
    [],
  )

  return (
    <>
      {COORDINATE_AXES.map((axis) => (
        <CoordinateAxis key={axis.label} material={material} {...axis} />
      ))}
    </>
  )
}

function RotationAxisCross() {
  const groupRef = useRef<THREE.Group>(null)
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: ROTATION_AXIS_COLOR,
        toneMapped: false,
        depthWrite: false,
        transparent: true,
        opacity: 0.95,
      }),
    [],
  )

  useFrame((state) => {
    const group = groupRef.current
    if (!group) return

    const { hamiltonian, isPlaying } = useQuantumStore.getState()
    const len = Math.hypot(hamiltonian.OmegaX, hamiltonian.OmegaY, hamiltonian.omega)
    if (len < 1e-6) {
      group.visible = false
      return
    }

    group.visible = true
    _dir.copy(blochToThree(hamiltonian.OmegaX / len, hamiltonian.OmegaY / len, hamiltonian.omega / len))
    group.position.copy(_dir).multiplyScalar(CROSS_RADIUS)
    group.quaternion.setFromUnitVectors(_upZ, _dir)

    const pulse = isPlaying ? 1 : 0
    const scale = 1 + pulse * 0.08 * Math.sin(state.clock.elapsedTime * 4.2)
    group.scale.setScalar(scale)
    material.opacity = 0.72 + pulse * 0.23
  })

  return (
    <group ref={groupRef}>
      <mesh material={material} renderOrder={3}>
        <boxGeometry args={[CROSS_ARM, CROSS_THICK, CROSS_THICK]} />
      </mesh>
      <mesh material={material} renderOrder={3}>
        <boxGeometry args={[CROSS_THICK, CROSS_ARM, CROSS_THICK]} />
      </mesh>
    </group>
  )
}

function createTrailRibbon() {
  const geometry = new THREE.BufferGeometry()
  const vertCount = TRAIL_LENGTH * 2
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertCount * 3), 3))
  geometry.setAttribute('aOpacity', new THREE.BufferAttribute(new Float32Array(vertCount), 1))
  geometry.setAttribute('aAge', new THREE.BufferAttribute(new Float32Array(vertCount), 1))

  const indices = new Uint16Array((TRAIL_LENGTH - 1) * 6)
  for (let i = 0; i < TRAIL_LENGTH - 1; i++) {
    const a = i * 2
    const o = i * 6
    indices[o] = a
    indices[o + 1] = a + 1
    indices[o + 2] = a + 2
    indices[o + 3] = a + 1
    indices[o + 4] = a + 3
    indices[o + 5] = a + 2
  }
  geometry.setIndex(new THREE.BufferAttribute(indices, 1))
  geometry.setDrawRange(0, 0)

  const mesh = new THREE.Mesh(geometry, createTrailMaterial())
  mesh.frustumCulled = false
  mesh.renderOrder = 1
  return mesh
}

function writeTrailRibbon(mesh: THREE.Mesh, points: THREE.Vector3[], cameraPos: THREE.Vector3) {
  const count = points.length
  if (count < 2) {
    mesh.geometry.setDrawRange(0, 0)
    return
  }

  const positions = mesh.geometry.getAttribute('position') as THREE.BufferAttribute
  const opacities = mesh.geometry.getAttribute('aOpacity') as THREE.BufferAttribute
  const ages = mesh.geometry.getAttribute('aAge') as THREE.BufferAttribute
  const half = TRAIL_WIDTH / 2
  const lift = 1.004

  for (let i = 0; i < count; i++) {
    const p = points[i]
    if (i < count - 1) _tangent.subVectors(points[i + 1], p)
    else _tangent.subVectors(p, points[i - 1])
    if (_tangent.lengthSq() < 1e-12) _tangent.set(0, 1, 0)
    else _tangent.normalize()

    _toCam.subVectors(cameraPos, p)
    _side.crossVectors(_tangent, _toCam)
    if (_side.lengthSq() < 1e-12) {
      _side.crossVectors(_tangent, _upZ)
      if (_side.lengthSq() < 1e-12) _side.set(1, 0, 0)
    }
    _side.normalize().multiplyScalar(half)

    positions.setXYZ(i * 2, p.x * lift + _side.x, p.y * lift + _side.y, p.z * lift + _side.z)
    positions.setXYZ(i * 2 + 1, p.x * lift - _side.x, p.y * lift - _side.y, p.z * lift - _side.z)

    const opacity = trailOpacity(i, count)
    const age = trailAge(i, count)
    opacities.setX(i * 2, opacity)
    opacities.setX(i * 2 + 1, opacity)
    ages.setX(i * 2, age)
    ages.setX(i * 2 + 1, age)
  }

  positions.needsUpdate = true
  opacities.needsUpdate = true
  ages.needsUpdate = true
  mesh.geometry.setDrawRange(0, (count - 1) * 6)
}

function BlochScene({
  tipHovered,
  isPlaying,
  onTipHover,
  panelRef,
}: {
  tipHovered: boolean
  isPlaying: boolean
  onTipHover: (hovered: boolean) => void
  panelRef: RefObject<HTMLDivElement>
}) {
  const trailPoints = useRef<THREE.Vector3[]>([])
  const trailMesh = useMemo(() => createTrailRibbon(), [])
  const lastTime = useRef(-1)
  const lastInitialId = useRef(useQuantumStore.getState().initialStateId)
  const smoothTrail = useRef(new THREE.Vector3())

  const wireframeMaterial = useMemo(
    () =>
      createFacingFadeMaterial({
        color: '#e4dfd8',
        frontOpacity: 0.2,
        backOpacity: 0.01,
        wireframe: true,
        timeUniform: true,
      }),
    [],
  )
  const ringMaterial = useMemo(
    () =>
      createFacingFadeMaterial({
        color: '#d8d2c8',
        frontOpacity: 0.34,
        backOpacity: 0.03,
        timeUniform: true,
      }),
    [],
  )
  const atmosphereMaterial = useMemo(() => createAtmosphereMaterial(), [])

  useFrame((state, delta) => {
    const { bloch, time, isPlaying, initialStateId } = useQuantumStore.getState()
    const clock = state.clock.elapsedTime
    const pulse = isPlaying ? 1 : 0

    blochTarget(bloch, _target)

    const jumped = Math.abs(time - lastTime.current) > 0.02
    lastTime.current = time
    const initialChanged = initialStateId !== lastInitialId.current
    lastInitialId.current = initialStateId

    if (isPlaying) {
      if (smoothTrail.current.lengthSq() < 1e-12) {
        smoothTrail.current.copy(_target)
      } else {
        const t = 1 - Math.exp(-SMOOTH_RATE * delta)
        slerpUnit(smoothTrail.current, smoothTrail.current, _target, t)
      }
    } else if (jumped || initialChanged) {
      trailPoints.current = []
      trailMesh.geometry.setDrawRange(0, 0)
      smoothTrail.current.copy(_target)
    }

    wireframeMaterial.uniforms.uTime.value = clock
    wireframeMaterial.uniforms.uPulse.value = pulse
    ringMaterial.uniforms.uTime.value = clock
    ringMaterial.uniforms.uPulse.value = pulse
    atmosphereMaterial.uniforms.uTime.value = clock
    atmosphereMaterial.uniforms.uPulse.value = pulse

    const trailMat = trailMesh.material as THREE.ShaderMaterial
    trailMat.uniforms.uTime.value = clock
    trailMat.uniforms.uPulse.value = pulse

    if (isPlaying) {
      appendTrailPoint(trailPoints.current, smoothTrail.current)
    }

    writeTrailRibbon(trailMesh, trailPoints.current, state.camera.position)
  })

  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[3, 5, 2]} intensity={0.45} />

      <mesh material={atmosphereMaterial} renderOrder={0}>
        <sphereGeometry args={[1.06, 48, 48]} />
      </mesh>

      <mesh>
        <sphereGeometry args={[0.995, 48, 48]} />
        <meshBasicMaterial color="#faf8f5" transparent opacity={0.055} depthWrite={false} />
      </mesh>

      <mesh material={wireframeMaterial}>
        <sphereGeometry args={[1, 36, 36]} />
      </mesh>

      <mesh rotation={[Math.PI / 2, 0, 0]} material={ringMaterial}>
        <torusGeometry args={[1.001, 0.0025, 4, 72]} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]} material={ringMaterial}>
        <torusGeometry args={[1.001, 0.0025, 4, 72]} />
      </mesh>
      <mesh rotation={[0, Math.PI / 2, 0]} material={ringMaterial}>
        <torusGeometry args={[1.001, 0.002, 4, 72]} />
      </mesh>

      <MathLabel position={[0, 1.18, 0]} math={ket('0')} distanceFactor={10} />
      <MathLabel position={[0, -1.18, 0]} math={ket('1')} distanceFactor={10} />
      <MathLabel position={[1.14, 0, 0]} math={ket('{+}')} distanceFactor={10} />
      <MathLabel position={[-1.14, 0, 0]} math={ket('{-}')} distanceFactor={10} />
      <MathLabel position={[0, 0, 1.14]} math={ket('{+i}')} distanceFactor={10} />
      <MathLabel position={[0, 0, -1.14]} math={ket('{-i}')} distanceFactor={10} />

      <CoordinateAxes />
      <RotationAxisCross />
      <primitive object={trailMesh} />
      <StateVector
        tipHovered={tipHovered}
        isPlaying={isPlaying}
        onTipHover={onTipHover}
        panelRef={panelRef}
      />
      <OrbitControls enablePan={false} minDistance={2.4} maxDistance={4.5} />
    </>
  )
}

export function BlochSphere() {
  const isPlaying = useQuantumStore((s) => s.isPlaying)
  const [tipHovered, setTipHovered] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  return (
    <div className={`bloch-sphere-wrap${isPlaying ? ' is-playing' : ''}`}>
      <div
        className="bloch-sphere"
        onPointerLeave={() => setTipHovered(false)}
      >
        <Canvas
          camera={{ position: [2.6, 1.4, 2.6], fov: 42 }}
          gl={{
            antialias: true,
            alpha: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.05,
          }}
        >
          <BlochScene
            tipHovered={tipHovered}
            isPlaying={isPlaying}
            onTipHover={setTipHovered}
            panelRef={panelRef}
          />
        </Canvas>
      </div>
      {tipHovered && !isPlaying && <BlochTipStatePopover panelRef={panelRef} />}
    </div>
  )
}
