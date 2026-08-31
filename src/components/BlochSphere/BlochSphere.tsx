import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useQuantumStore } from '../../store/useQuantumStore'
import { ket } from '../../sim/katexFormat'
import { MathLabel } from './MathLabel'
import { createStateVectorMaterial, createTipMaterial, ROTATION_AXIS_COLOR } from './stateVectorMaterial'

const TRAIL_LENGTH = 140
const TRAIL_WIDTH = 0.01
const ARROW_HEAD_LENGTH = 0.018
const ARROW_HEAD_WIDTH = 0.011
const ARROW_SHAFT_WIDTH = 0.0045
const TIP_RADIUS = 0.014
const AXIS_LEN = 1.02
const AXIS_HEAD_LENGTH = 0.042
const AXIS_HEAD_WIDTH = 0.016
const AXIS_SHAFT_WIDTH = 0.0032
const CROSS_ARM = 0.04
const CROSS_THICK = 0.002
const CROSS_RADIUS = 1

const _dir = new THREE.Vector3()
const _tangent = new THREE.Vector3()
const _side = new THREE.Vector3()
const _toCam = new THREE.Vector3()
const _upZ = new THREE.Vector3(0, 0, 1)

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

/** Fade far-hemisphere lines. Wireframe GL_LINES ignore face culling, so N·V is required. */
function createFacingFadeMaterial(options: {
  color: THREE.ColorRepresentation
  frontOpacity: number
  backOpacity: number
  wireframe?: boolean
}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(options.color) },
      uFrontOpacity: { value: options.frontOpacity },
      uBackOpacity: { value: options.backOpacity },
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
    fragmentShader: /* glsl */ `
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
const TRAIL_OPACITY_NEAR = 0.82
const TRAIL_OPACITY_FAR = 0.02

function createTrailMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(TRAIL_COLOR) },
    },
    vertexShader: /* glsl */ `
      attribute float aOpacity;
      varying float vOpacity;

      void main() {
        vOpacity = aOpacity;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      varying float vOpacity;

      void main() {
        gl_FragColor = vec4(uColor, vOpacity);
      }
    `,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    side: THREE.DoubleSide,
  })
}

function trailOpacity(index: number, count: number): number {
  const age = (count - 1 - index) / TRAIL_LENGTH
  const fade = Math.pow(1 - Math.min(1, age), 1.65)
  return TRAIL_OPACITY_FAR + (TRAIL_OPACITY_NEAR - TRAIL_OPACITY_FAR) * fade
}

function StateVector() {
  const rootRef = useRef<THREE.Group>(null)
  const shaftRef = useRef<THREE.Mesh>(null)
  const headRef = useRef<THREE.Mesh>(null)
  const tipRef = useRef<THREE.Mesh>(null)

  const vectorMaterial = useMemo(() => createStateVectorMaterial(), [])
  const tipMaterial = useMemo(() => createTipMaterial(), [])

  useFrame(() => {
    const { bloch } = useQuantumStore.getState()
    const end = blochToThree(bloch.x, bloch.y, bloch.z)
    const len = end.length()
    const visible = len > 1e-6

    if (rootRef.current) rootRef.current.visible = visible
    if (tipRef.current) tipRef.current.visible = visible
    if (!visible) return

    const dir = end.clone().normalize()
    const shaftLen = Math.max(0.02, len - ARROW_HEAD_LENGTH * 0.75)

    if (rootRef.current) {
      rootRef.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)
    }
    if (shaftRef.current) {
      shaftRef.current.scale.y = shaftLen
      shaftRef.current.position.y = shaftLen / 2
    }
    if (headRef.current) {
      headRef.current.position.y = shaftLen + ARROW_HEAD_LENGTH * 0.45
    }
    if (tipRef.current) {
      tipRef.current.position.copy(end)
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
      <mesh ref={tipRef} material={tipMaterial} renderOrder={2}>
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
    const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)
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
        <mesh
          material={material}
          position={[0, fwdLen + AXIS_HEAD_LENGTH * 0.45, 0]}
          renderOrder={1}
        >
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
      }),
    [],
  )

  useFrame(() => {
    const group = groupRef.current
    if (!group) return

    const { hamiltonian } = useQuantumStore.getState()
    const len = Math.hypot(hamiltonian.OmegaX, hamiltonian.OmegaY, hamiltonian.omega)
    if (len < 1e-6) {
      group.visible = false
      return
    }

    group.visible = true
    _dir.copy(blochToThree(hamiltonian.OmegaX / len, hamiltonian.OmegaY / len, hamiltonian.omega / len))
    group.position.copy(_dir).multiplyScalar(CROSS_RADIUS)
    group.quaternion.setFromUnitVectors(_upZ, _dir)
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
    opacities.setX(i * 2, opacity)
    opacities.setX(i * 2 + 1, opacity)
  }

  positions.needsUpdate = true
  opacities.needsUpdate = true
  mesh.geometry.setDrawRange(0, (count - 1) * 6)
}

function BlochScene() {
  const trailPoints = useRef<THREE.Vector3[]>([])
  const trailMesh = useMemo(() => createTrailRibbon(), [])

  const lastTime = useRef(-1)

  const wireframeMaterial = useMemo(
    () =>
      createFacingFadeMaterial({
        color: '#e4dfd8',
        frontOpacity: 0.18,
        backOpacity: 0.008,
        wireframe: true,
      }),
    [],
  )
  const ringMaterial = useMemo(
    () =>
      createFacingFadeMaterial({
        color: '#d8d2c8',
        frontOpacity: 0.32,
        backOpacity: 0.03,
      }),
    [],
  )

  useFrame((state) => {
    const { bloch, time, isPlaying } = useQuantumStore.getState()
    const target = blochToThree(bloch.x, bloch.y, bloch.z)

    if (!isPlaying && Math.abs(time - lastTime.current) > 0.02) {
      trailPoints.current = []
      trailMesh.geometry.setDrawRange(0, 0)
    }
    lastTime.current = time

    if (isPlaying) {
      trailPoints.current.push(target.clone())
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

      <mesh>
        <sphereGeometry args={[0.995, 48, 48]} />
        <meshBasicMaterial
          color="#faf8f5"
          transparent
          opacity={0.055}
          depthWrite={false}
        />
      </mesh>

      <mesh material={wireframeMaterial}>
        <sphereGeometry args={[1, 36, 36]} />
      </mesh>

      <mesh rotation={[Math.PI / 2, 0, 0]} material={ringMaterial}>
        <torusGeometry args={[1.001, 0.002, 4, 64]} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]} material={ringMaterial}>
        <torusGeometry args={[1.001, 0.002, 4, 64]} />
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
  return (
    <div className="bloch-sphere-wrap">
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
