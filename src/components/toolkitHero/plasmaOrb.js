import * as THREE from "three";

// The charged heart: a glass-like orb with energy swirling inside it. Each pixel marches a few steps
// through the sphere and accumulates warped noise — bright core, thin ridged "lightning" filaments,
// slow cloud — then maps that energy onto a cyber-yellow ramp. Unlit; colours are final sRGB.
const VERTEX = /* glsl */ `
  varying vec3 vPos;
  varying vec3 vOrigin;
  void main() {
    vPos = position;
    vOrigin = (inverse(modelMatrix) * vec4(cameraPosition, 1.0)).xyz; // camera in object space
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const PLASMA_NOISE = /* glsl */ `
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
      mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x), mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y),
      f.z);
  }
  float fbm(vec3 p) {
    float a = 0.5, s = 0.0;
    for (int i = 0; i < 3; i++) {
      s += a * noise(p);
      p = p * 2.03 + vec3(1.7, 9.2, 3.1);
      a *= 0.5;
    }
    return s;
  }
`;

const FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uPower; // 0..1 charge level
  uniform float uFlash; // 0..1 white-hot burst
  uniform float uRadius;
  varying vec3 vPos;
  varying vec3 vOrigin;

  ${PLASMA_NOISE}

  void main() {
    vec3 d = normalize(vPos - vOrigin);
    vec3 o = vOrigin / uRadius; // work in a unit sphere
    float b = dot(o, d);
    float h = sqrt(max(b * b - (dot(o, o) - 1.0), 0.0));
    float t0 = -b - h;
    float stepLen = 2.0 * h / float(STEPS);

    float energy = 0.0;
    for (int i = 0; i < STEPS; i++) {
      vec3 q = o + d * (t0 + (float(i) + 0.5) * stepLen);
      float r = length(q);
      // Domain warp makes the flow curl instead of drifting uniformly.
      vec3 w = q + 0.35 * vec3(noise(q * 2.0 + uTime * 0.35), noise(q * 2.3 - uTime * 0.3 + 5.0), noise(q * 1.9 + uTime * 0.25 + 9.0));
      float n = fbm(w * 3.4 + vec3(0.0, 0.0, uTime * 0.5));
      float filament = pow(1.0 - abs(2.0 * n - 1.0), 7.0) * smoothstep(1.0, 0.1, r);
      float cloud = fbm(w * 1.5 - uTime * 0.12) * (1.0 - r * r);
      float core = exp(-r * r * 10.0);
      energy += (filament * 2.6 + cloud * 0.3 + core * 1.8) * stepLen;
    }

    float rim = pow(1.0 - clamp(dot(normalize(o + d * t0), -d), 0.0, 1.0), 2.5); // edge of the glass
    energy = energy * uPower + uFlash * 1.2;

    const vec3 SHADOW = vec3(0.03, 0.02, 0.0);
    const vec3 AMBER = vec3(0.36, 0.26, 0.0);
    const vec3 CYBER = vec3(1.0, 0.827, 0.004); // #ffd301
    const vec3 HOT = vec3(1.0, 0.96, 0.72);
    vec3 col = mix(SHADOW, AMBER, smoothstep(0.0, 0.2, energy));
    col = mix(col, CYBER, smoothstep(0.2, 0.9, energy));
    col = mix(col, HOT, smoothstep(0.9, 1.9, energy));
    col += CYBER * rim * 0.8 * uPower; // glassy edge
    col = mix(col, vec3(1.0, 0.97, 0.8), clamp(uFlash, 0.0, 1.0) * 0.6);
    gl_FragColor = vec4(col, 1.0);
  }
`;

export function createPlasmaOrb({ radius, steps = 8 }) {
  const material = new THREE.ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    defines: { STEPS: steps },
    uniforms: {
      uTime: { value: 0 },
      uPower: { value: 0 },
      uFlash: { value: 0 },
      uRadius: { value: radius },
    },
  });
  return {
    material,
    update(time, power, flash) {
      material.uniforms.uTime.value = time;
      material.uniforms.uPower.value = power;
      material.uniforms.uFlash.value = flash;
    },
  };
}

// The halo samples the same noise on its surface. Local positions keep the clouds
// continuous around the full ring, including the join and the bevels.
export function createPlasmaHalo(brightness) {
  const material = new THREE.ShaderMaterial({
    toneMapped: false,
    uniforms: {
      uTime: { value: 0 },
      uPower: { value: 0 },
      uBrightness: { value: brightness },
    },
    vertexShader: /* glsl */ `
      varying vec3 vLocal;
      void main() {
        vLocal = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uPower;
      uniform float uBrightness;
      varying vec3 vLocal;
      ${PLASMA_NOISE}

      void main() {
        vec3 p = vLocal * 4.0;
        float drift = uTime * 0.14;
        float warp = noise(p + vec3(0.0, drift, -drift));
        float cloud = fbm(p + vec3(warp, -warp, drift));
        float density = smoothstep(0.27, 0.59, cloud);
        const vec3 ORANGE = vec3(1.0, 0.83, 0.12);
        const vec3 GOLD = vec3(1.0, 0.90, 0.24);
        vec3 haloColor = mix(ORANGE, GOLD, density);
        gl_FragColor = vec4(haloColor * uBrightness * mix(0.16, 1.0, uPower), 1.0);
      }
    `,
  });
  return {
    material,
    update(time, power) {
      material.uniforms.uTime.value = time;
      material.uniforms.uPower.value = power;
    },
  };
}
