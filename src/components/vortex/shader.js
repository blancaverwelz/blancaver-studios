// Portal geometry follows scroll; inner turbulence and particles also use active time.
export const vortexVertex = /* glsl */ `
void main() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

export const vortexFragment = /* glsl */ `
precision highp float;

uniform sampler2D uTex;
uniform vec2 uRes;        // drawing-buffer size (device px)
uniform float uRatio;     // device px per CSS px
uniform vec2 uCenter;     // anomaly centre (CSS px, y down)
uniform float uRadius;    // horizon radius at this progress
uniform float uSeed;      // monitor-scale unit
uniform float uProgress;
uniform float uTime;
uniform float uCharge;    // energy accumulation 0..1
uniform float uCollapse;  // spatial collapse 0..1
uniform float uOpen;      // horizon growth 0..1
uniform float uEnv;       // cross-fade of re-lit room over the DOM photograph
uniform float uAmbient;   // room exposure
uniform float uOpacity;   // void body opacity (fades to reveal next chapter)
uniform float uSpin;      // radians
uniform vec2 uImgOrigin;  // cover offset of the photograph in the stage
uniform float uCover;
uniform float uScale;
uniform vec2 uTrans;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) {
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 4; i++) {
    s += a * vnoise(p);
    p = p * 2.03 + vec2(17.1, 9.2);
    a *= 0.5;
  }
  return s;
}

// Same mapping as the DOM <img>: object-fit cover, then translate + scale.
vec3 room(vec2 p) {
  vec2 im = ((p - uTrans) / uScale - uImgOrigin) / uCover;
  vec2 uv = im / vec2(1536.0, 1024.0);
  uv.y = 1.0 - uv.y;
  return texture2D(uTex, clamp(uv, 0.001, 0.999)).rgb;
}

void main() {
  vec2 P = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uRatio;
  vec2 d = P - uCenter;
  float r = length(d);
  vec2 dir = d / max(r, 1e-3);
  float ang = atan(d.y, d.x);
  float drift = uProgress * 5.0;

  // ---- Event horizon: irregular, slowly breathing boundary ----------------
  float lobes = fbm(dir * 1.6 + vec2(uSpin * 0.7, drift * 0.3)) - 0.5;
  float Rh = uRadius * (1.0 + lobes * 0.34 * (1.0 - uOpen));

  // ---- Spatial field: lensing pull, tangential swirl, instability ---------
  float L = max(uSeed * 6.0, uRadius * 2.2);
  float f = exp(-max(r - Rh, 0.0) / L * 1.7);
  float pull = uCollapse * 0.85;
  float theta = uCollapse * 2.1 * f * f * (1.0 + 1.5 * Rh / (r + Rh));

  float hazeAmt = max(uCharge, uCollapse * 0.5) * exp(-r / (uSeed * 9.0));
  vec2 haze = (vec2(fbm(P * 0.018 + vec2(drift, 0.0)),
                    fbm(P * 0.018 + vec2(0.0, drift) + 7.3)) - 0.5) * 14.0 * hazeAmt;
  float wob = (fbm(P * 0.006 + drift * 0.4) - 0.5) * 26.0 * uCollapse * uCollapse;
  vec2 off = haze + vec2(wob, -wob * 0.6);

  vec3 col = vec3(0.0);
  vec3 hi = vec3(0.0);
  for (int i = 0; i < TAPS; i++) {
    float t = (float(i) + 0.5) / float(TAPS) - 0.5;
    float th = theta * (1.0 + t * 0.2);
    float cs = cos(th), sn = sin(th);
    mat2 Rm = mat2(cs, -sn, sn, cs);
    float k = pull * f;
    vec3 s = vec3(
      room(uCenter + Rm * (d * (1.0 + k * 0.996)) + off).r,
      room(uCenter + Rm * (d * (1.0 + k)) + off).g,
      room(uCenter + Rm * (d * (1.0 + k * 1.004)) + off).b);
    col += s;
    hi += max(s - 0.3, 0.0);
  }
  col /= float(TAPS);
  hi /= float(TAPS);
  // Bright sources and metal glints smear into long light trails.
  col += hi * 3.0 * uCollapse * f;

  // ---- Room lighting reacts to the event ---------------------------------
  vec3 warm = vec3(1.0, 0.651, 0.0003);
  float lit = uCharge * 2.6 * exp(-r / (uSeed * 8.0));
  col *= uAmbient * (vec3(1.0) + warm * lit * 2.0);

  // Inverse-square core, scattering haze and drifting light shafts.
  float core = uCharge * 2.2 / (1.0 + pow(r / (uSeed * 0.75), 2.0));
  float bloom = uCharge * 0.55 * exp(-r / (uSeed * 3.2));
  float a2 = ang + 1.4 * log(1.0 + r / uSeed) - uSpin * 2.0;
  float shafts = pow(fbm(vec2(cos(a2), sin(a2)) * 4.0 + vec2(r / (uSeed * 7.0), drift * 0.5)), 2.4)
               * uCharge * exp(-r / (uSeed * 5.5)) * 1.6;
  vec3 light = vec3(1.0, 0.651, 0.0003) * (core + bloom + shafts) + vec3(1.0, 0.82, 0.24) * core * 0.5;
  float strandPhase = 3.0*ang + 4.4*log(1.0+r/uSeed) - 1.6*uSpin;
  float filament = exp(-abs(sin(strandPhase))*13.0) * exp(-r/(2.8*uSeed))
                 * smoothstep(0.22, 0.80, r/uSeed) * uCharge;
  light += vec3(1.0, 0.651, 0.0003)*filament;
  col += vec3(1.0) - exp(-light);

  // Gravitational darkening and loss of warmth toward the horizon.
  float proximity = 1.0 - smoothstep(Rh, Rh * 2.4, r);
  col *= 1.0 - 0.55 * proximity * uCollapse;
  col = mix(col, col * vec3(0.90), 0.5 * uCollapse);

  // Thin, broken, Doppler-biased photon ring - dim, never a neon band.
  float edge = r - Rh;
  float sharp = exp(-pow(abs(edge) / max(1.5, Rh * 0.01), 2.0));
  float soft = edge > 0.0 ? exp(-edge / (Rh * 0.03 + 2.0)) : 0.0;
  float dop = 0.25 + 0.75 * pow(0.5 + 0.5 * cos(ang - 2.2 + uSpin * 0.35), 2.0);
  float breakup = 0.55 + 0.9 * fbm(dir * 5.0 + vec2(uSpin, drift));
  float ring = (sharp * 0.9 + soft * 0.25) * dop * breakup * smoothstep(0.0, 0.15, uOpacity);
  col += vec3(1.0) - exp(-vec3(1.0, 0.651, 0.0003) * ring * 0.55);

  // Perspective tunnel: nearer dust turns faster and recedes into an offset throat.
  vec2 aperture = d / max(Rh, 0.5);
  vec2 throat = vec2(0.15, -0.09) * uOpen;
  vec2 wall = aperture - throat * (1.0 - smoothstep(0.2, 1.0, length(aperture)));
  float rn = max(0.018, length(wall));
  float depth = -log(rn);
  float az = atan(wall.y, wall.x);
  float innerSpin = uProgress * 12.0 + uTime * 0.65;
  float phase = az + depth * 2.4 - innerSpin;
  vec2 flow = vec2(cos(phase), sin(phase));
  float dust = fbm(flow * 3.8 + vec2(depth * 3.2, -uProgress * 1.3));
  float ridge = pow(max(0.0, 0.5 + 0.5*cos(phase*4.0 + 4.0*dust)), 3.5);
  float lightSide = 0.24 + 0.76 * (0.5 + 0.5*cos(az + 1.0 - 0.4*depth));
  float grain = fbm(flow * 15.0 + depth * 12.0);
  float wallLight = smoothstep(0.06, 0.42, rn) * lightSide;
  vec3 voidCol = vec3(0.0015)
    + vec3(0.105) * wallLight * (0.18+dust) * (ridge+0.28*grain)
    + vec3(0.78,0.49,0.001) * wallLight * pow(ridge,3.0) * grain;
  // Screen-space cells keep star cores the same CSS-pixel size as the aperture grows.
  // Crossfade independently seeded fields; cycling continues through the whole reveal.
  float cycle = max(0.0, uProgress - 0.40) * 16.0 + uTime * 0.8;
  float epoch = floor(cycle);
  float blend = smoothstep(0.0, 1.0, fract(cycle));
  for (int field=0; field<2; field++) {
    float generation = epoch + float(field);
    float weight = field == 0 ? 1.0 - blend : blend;
    vec2 pixel = d;
    float cellSize = 28.0;
    vec2 cell = floor(pixel / cellSize);
    vec2 seed = cell + vec2(generation * 31.7, generation * 19.3);
    vec2 offset = vec2(hash(seed), hash(seed + 17.0));
    vec2 delta = mod(pixel, cellSize) - (4.0 + offset * (cellSize - 8.0));
    float core = exp(-dot(delta, delta) / 0.3);
float halo = exp(-dot(delta, delta) / 1.25) * 0.06;
    float present = step(0.80, hash(seed + 41.0));
    voidCol += vec3(1.0, 0.651, 0.0003) * (core + halo) * present * weight
      * (1.0 - smoothstep(0.78, 1.0, rn));
  }
  float w = 1.5 + Rh * 0.01;
  float inside = 1.0 - smoothstep(Rh - w, Rh + w, r);
  vec3 rgb = mix(col, voidCol, inside * smoothstep(0.40, 0.48, uProgress));
  float alpha = uEnv * (1.0 - smoothstep(0.86, 0.99, uProgress));

  gl_FragColor = vec4(rgb, 1.0);
  #include <colorspace_fragment>
  gl_FragColor.rgb += (hash(gl_FragCoord.xy + drift) - 0.5) * (1.5 / 255.0);
  gl_FragColor = vec4(gl_FragColor.rgb * alpha, alpha);
}
`;
