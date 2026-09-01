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
  uniform float uTime;
  uniform float uPulse;

  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vec3 viewDir = normalize(vViewPosition);
    vec3 normal = normalize(vNormal);
    float ndv = abs(dot(normal, viewDir));

    float pulse = 1.0 + uPulse * (0.12 + 0.08 * sin(uTime * 5.5));
    float rim = pow(1.0 - ndv, 2.2);
    float body = pow(ndv, 0.45);

    vec3 color = mix(uColorCore, uColorHot, rim * 0.88 + body * 0.12);
    color *= uIntensity * pulse * (0.68 + 0.32 * body);

    gl_FragColor = vec4(color, uOpacity);
  }
`

export function createStateVectorMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColorCore: { value: new THREE.Color('#c2410c') },
      uColorHot: { value: new THREE.Color('#ea580c') },
      uIntensity: { value: 1.42 },
      uOpacity: { value: 0.22 },
      uTime: { value: 0 },
      uPulse: { value: 0 },
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

const tipVertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`

const tipFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uGlow;
  uniform float uTime;
  uniform float uPulse;

  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vec3 viewDir = normalize(vViewPosition);
    vec3 normal = normalize(vNormal);
    float ndv = abs(dot(normal, viewDir));

    float breathe = 1.0 + uPulse * 0.18 * sin(uTime * 6.0);
    float rim = pow(1.0 - ndv, 2.8);
    float core = pow(ndv, 0.35);

    vec3 color = mix(uColor, uGlow, rim * 0.92);
    color += uGlow * rim * (0.35 + uPulse * 0.25) * breathe;

    float alpha = mix(0.92, 1.0, core) + rim * 0.08;
    gl_FragColor = vec4(color, alpha);
  }
`

export function createTipMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(BLOCH_TIP_COLOR) },
      uGlow: { value: new THREE.Color('#ffffff') },
      uTime: { value: 0 },
      uPulse: { value: 0 },
    },
    vertexShader: tipVertexShader,
    fragmentShader: tipFragmentShader,
    toneMapped: false,
    transparent: true,
    depthWrite: false,
  })
}

export function createTipGlowMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(BLOCH_TIP_COLOR) },
      uTime: { value: 0 },
      uPulse: { value: 0 },
    },
    vertexShader: tipVertexShader,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uTime;
      uniform float uPulse;

      varying vec3 vNormal;
      varying vec3 vViewPosition;

      void main() {
        vec3 viewDir = normalize(vViewPosition);
        float ndv = abs(dot(normalize(vNormal), viewDir));
        float rim = pow(1.0 - ndv, 1.6);
        float wave = 0.5 + 0.5 * sin(uTime * 4.5);
        float alpha = rim * (0.22 + uPulse * 0.18 * wave);
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
    toneMapped: false,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
}
