import {
  AdditiveBlending, CatmullRomCurve3, Color, Mesh, ShaderMaterial, Sprite, SpriteMaterial, TubeGeometry, Vector3,
} from "three";
import { PULSE_FLASH } from "./tuning";

const VERT = /* glsl */ `
  varying float vU; varying vec3 vN; varying vec3 vV;
  void main() {
    vU = uv.x;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = -mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`;
// Asymmetric pulse: razor-sharp leading edge, long cooling tail, hot-white core,
// slow coherent flicker. Idle glow keeps the conduit readable between pulses.
const FRAG = /* glsl */ `
  uniform float uHead, uCharge, uTime, uTrail, uIdle, uWrap, uSeed;
  uniform vec3 uYellow, uHot;
  varying float vU; varying vec3 vN; varying vec3 vV;
  void main() {
    float d = vU - uHead;
    if (uWrap > 0.5) d = fract(d + 0.5) - 0.5;
    float tail = exp(min(d, 0.0) / uTrail);
    float lead = exp(-max(d, 0.0) / (uTrail * 0.07));
    float pulse = d < 0.0 ? tail : lead;
    float fl = 0.84 + 0.16 * sin(uTime * 19.0 + vU * 55.0 + uSeed) * sin(uTime * 4.7 + uSeed);
    float f = pow(clamp(abs(dot(normalize(vN), normalize(vV))), 0.0, 1.0), 1.3);
    float core = pulse * fl * uCharge;
    vec3 col = mix(uYellow, uHot, clamp(core * core * 1.6, 0.0, 1.0)) * (core * 3.4 * (0.35 + 0.65 * f));
    col += uYellow * uIdle * uCharge * (0.25 + 0.75 * f);
    gl_FragColor = vec4(col, 1.0);
  }
`;

const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => t * t * (3 - 2 * t);

// A glowing core running through a faint glass sleeve; the pulse is a shader
// uniform travelling along the tube, so depth occlusion and bloom come for free.
export class Conduit {
  constructor({ curve, mats, flash = {}, radius = 0.028, sleeve = true, wrap = false, seed = 0, cycle = 5.5, travel = 1.8, trail = 0.22, sleeveScale = 2.3 }) {
    this.curve = curve;
    this.wrap = wrap;
    this.cycle = cycle + seed * 0.45;
    this.travel = travel;
    this.offset = seed * 1.7;
    this.charge = 0;
    this.target = 0;
    this.seed = seed;
    this.pulse = null;
    this.uniforms = {
      uHead: { value: -2 }, uCharge: { value: 0 }, uTime: { value: 0 }, uTrail: { value: trail }, uIdle: { value: 0.28 },
      uWrap: { value: wrap ? 1 : 0 }, uSeed: { value: seed },
      uYellow: { value: new Color(1.0, 0.78, 0.02) }, uHot: { value: new Color(1.0, 0.96, 0.78) },
    };
    const material = new ShaderMaterial({
      uniforms: this.uniforms, vertexShader: VERT, fragmentShader: FRAG,
      transparent: true, blending: AdditiveBlending, depthWrite: false, toneMapped: false,
    });
    const segments = wrap ? 192 : 96;
    const geo = new TubeGeometry(curve, segments, radius, 8, wrap);
    this.core = new Mesh(geo, material);
    this.core.renderOrder = 3;
    this.object = this.core;
    if (sleeve) {
      const sgeo = new TubeGeometry(curve, segments, radius * sleeveScale, 10, wrap);
      this.shell = new Mesh(sgeo, mats.shell);
      this.shell.renderOrder = 2;
    }
    this.flashCfg = { ...PULSE_FLASH, ...flash };
    this.flash = new Sprite(new SpriteMaterial({ map: mats.glowSprite, color: new Color(...this.flashCfg.color), blending: AdditiveBlending, depthWrite: false, transparent: true, opacity: 0, toneMapped: false }));
    this.flash.scale.setScalar(this.flashCfg.size);
    if (!wrap) this.flash.position.copy(curve.getPointAt(1));
    else this.flash.visible = false;
    this.flashMaterial = this.flash.material;
  }

  mount(parent) {
    if (this.shell) parent.add(this.shell);
    parent.add(this.core, this.flash);
  }

  update(time, dt, animate) {
    this.charge += (this.target - this.charge) * Math.min(1, dt * 3.2);
    this.uniforms.uCharge.value = this.charge;
    this.uniforms.uTime.value = time;
    this.pulse = null;
    let head = -2;
    let arrive = 0;
    if (animate && this.charge > 0.2) {
      const local = (time + this.offset) % this.cycle;
      if (local < this.travel) {
        const t = ease(local / this.travel);
        head = lerp(-0.08, 1.14, t);
        const u = Math.min(1, Math.max(0, head));
        if (!this.wrap) {
          arrive = Math.max(0, (head - 0.9) / 0.24);
          this.pulse = { pos: this.curve.getPointAt(u), power: this.charge * Math.min(1, t * 6, (1 - t) * 4 + 0.3) };
        } else {
          this.pulse = { pos: this.curve.getPointAt(((head % 1) + 1) % 1), power: this.charge * 0.7 };
        }
      }
    }
    this.uniforms.uHead.value = head;
    this.flashMaterial.opacity = Math.min(1, arrive * 1.6) * (1 - Math.max(0, arrive - 0.8) * 4) * this.charge * this.flashCfg.opacity;
    this.flash.scale.setScalar(this.flashCfg.size + arrive * this.flashCfg.growth);
  }
}

export const pathFrom = (points, closed = false) =>
  new CatmullRomCurve3(points.map((p) => new Vector3(...p)), closed, "catmullrom", 0.5);

export const circlePath = (radius, y = 0, steps = 48) =>
  pathFrom(Array.from({ length: steps }, (_, i) => [Math.cos((i / steps) * Math.PI * 2) * radius, y, Math.sin((i / steps) * Math.PI * 2) * radius]), true);
