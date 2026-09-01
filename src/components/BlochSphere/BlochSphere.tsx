import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useQuantumStore } from '../../store/useQuantumStore'
import { ket } from '../../sim/katexFormat'
import { MathLabel } from './MathLabel'
import {
  createStateVectorMaterial,
  createTipMaterial,
  createTipGlowMaterial,
  ROTATION_AXIS_COLOR,
} from './stateVectorMaterial'

const TRAIL_LENGTH = 160
const TRAIL_WIDTH = 0.012
const ARROW_HEAD_LENGTH = 0.018
const ARROW_HEAD_WIDTH = 0.011
const ARROW_SHAFT_WIDTH = 0.0045
const TIP_RADIUS = 0.014
const TIP_GLOW_RADIUS = 0.038
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
const _upZ = new THREE.Vector3(0, 0, 1)
const _yAxis = new THREE.Vector3(0, 1, 0)

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

function StateVector() {
  const rootRef = useRef<THREE.Group>(null)
  const shaftRef = useRef<THREE.Mesh>(null)
  const headRef = useRef<THREE.Mesh>(null)
  const tipRef = useRef<THREE.Mesh>(null)
  const tipGlowRef = useRef<THREE.Mesh>(null)
  const initialized = useRef(false)

  const vectorMaterial = useMemo(() => createStateVectorMaterial(), [])
  const tipMaterial = useMemo(() => createTipMaterial(), [])
  const tipGlowMaterial = useMemo(() => createTipGlowMaterial(), [])

  useFrame((state, delta) => {
    const { bloch, isPlaying } = useQuantumStore.getState()
    _target.set(bloch.x, bloch.z, bloch.y)

    if (!initialized.current) {
      _displayed.copy(_target)
      initialized.current = true
    } else {
      const t = 1 - Math.exp(-SMOOTH_RATE * delta)
      _displayed.lerp(_target, t)
    }

    const len = _displayed.length()
    const visible = len > 1e-6
    const pulse = isPlaying ? 1 : 0
    const time = state.clock.elapsedTime

    vectorMaterial.uniforms.uTime.value = time
    vectorMaterial.uniforms.uPulse.value = pulse
    tipMaterial.uniforms.uTime.value = time
    tipMaterial.uniforms.uPulse.value = pulse
    tipGlowMaterial.uniforms.uTime.value = time
    tipGlowMaterial.uniforms.uPulse.value = pulse

    if (rootRef.current) rootRef.current.visible = visible
    if (tipRef.current) tipRef.current.visible = visible
    if (tipGlowRef.current) tipGlowRef.current.visible = visible
    if (!visible) return

    _dir.copy(_displayed).normalize()
    const shaftLen = Math.max(0.02, len - ARROW_HEAD_LENGTH * 0.75)

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
      const glowScale = 1 + pulse * 0.12 * Math.sin(time * 5.5)
      tipGlowRef.current.scale.setScalar(glowScale)
    }
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

function BlochScene() {
  const trailPoints = useRef<THREE.Vector3[]>([])
  const trailMesh = useMemo(() => createTrailRibbon(), [])
  const lastTime = useRef(-1)
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
    const { bloch, time, isPlaying } = useQuantumStore.getState()
    const clock = state.clock.elapsedTime
    const pulse = isPlaying ? 1 : 0

    _target.set(bloch.x, bloch.z, bloch.y)
    const t = 1 - Math.exp(-SMOOTH_RATE * delta)
    smoothTrail.current.lerp(_target, t)

    wireframeMaterial.uniforms.uTime.value = clock
    wireframeMaterial.uniforms.uPulse.value = pulse
    ringMaterial.uniforms.uTime.value = clock
    ringMaterial.uniforms.uPulse.value = pulse
    atmosphereMaterial.uniforms.uTime.value = clock
    atmosphereMaterial.uniforms.uPulse.value = pulse

    const trailMat = trailMesh.material as THREE.ShaderMaterial
    trailMat.uniforms.uTime.value = clock
    trailMat.uniforms.uPulse.value = pulse

    if (!isPlaying && Math.abs(time - lastTime.current) > 0.02) {
      trailPoints.current = []
      trailMesh.geometry.setDrawRange(0, 0)
      smoothTrail.current.copy(_target)
    }
    lastTime.current = time

    if (isPlaying) {
      trailPoints.current.push(smoothTrail.current.clone())
      if (trailPoints.current.length > TRAIL_LENGTH) {
        trailPoints.current.shift()
      }
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
      <StateVector />
      <OrbitControls enablePan={false} minDistance={2.4} maxDistance={4.5} />
    </>
  )
}

export function BlochSphere() {
  const isPlaying = useQuantumStore((s) => s.isPlaying)

  return (
    <div className={`bloch-sphere-wrap${isPlaying ? ' is-playing' : ''}`}>
      <div className="bloch-sphere">
        <Canvas
          camera={{ position: [2.6, 1.4, 2.6], fov: 42 }}
          gl={{
            antialias: true,
            alpha: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.05,
          }}
        >
          <BlochScene />
        </Canvas>
      </div>
    </div>
  )
}
