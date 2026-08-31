import * as THREE from 'three'

const vertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uColorCore;
  uniform vec3 uColorHot;
  uniform float uIntensity;
  uniform float uOpacity;

  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vec3 viewDir = normalize(vViewPosition);
    vec3 normal = normalize(vNormal);
    float ndv = abs(dot(normal, viewDir));

    float rim = pow(1.0 - ndv, 2.0);
    float body = pow(ndv, 0.45);

    vec3 color = mix(uColorCore, uColorHot, rim * 0.85 + body * 0.15);
    color *= uIntensity * (0.7 + 0.3 * body);

    gl_FragColor = vec4(color, uOpacity);
  }
`

export function createStateVectorMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColorCore: { value: new THREE.Color('#c2410c') },
      uColorHot: { value: new THREE.Color('#9a3412') },
      uIntensity: { value: 1.35 },
      uOpacity: { value: 0.18 },
    },
    vertexShader,
    fragmentShader,
    toneMapped: false,
    transparent: true,
    depthWrite: false,
  })
}

/** Marker colour for the Bloch-sphere state tip. */
export const BLOCH_TIP_COLOR = '#81DAFF'

/** Marker colour for the Hamiltonian rotation axis on the Bloch sphere. */
export const ROTATION_AXIS_COLOR = '#c62828'

export function createTipMaterial() {
  return new THREE.MeshBasicMaterial({
    color: BLOCH_TIP_COLOR,
    toneMapped: false,
  })
}
