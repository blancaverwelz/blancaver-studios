// Every number you are likely to tweak by hand lives here. Distances are in metres.

// Module energy when neither hovered nor selected. Hover ≈ 0.5, selected = 1.
export const LEVEL_IDLE = 0.12;
// 0 at idle → 1 when selected. Used by effects that must be completely off at rest.
export const activation = (level) => Math.min(1, Math.max(0, (level - LEVEL_IDLE) / (1 - LEVEL_IDLE)));

// Point lights that ride along the travelling pulse. They are what paints the
// bright pool/streak on the floor: lower intensity = dimmer, lower distance = smaller.
export const PULSE_LIGHT = {
  count: 2,
  color: 0xffc21a,
  intensity: 7, // was 28
  distance: 3, // light reaches this far (was 7)
  lift: 0.45, // height above the conduit
  response: 14, // how quickly the light follows the pulse
};

// The spark that blooms where a pulse arrives at the end of a conduit.
export const PULSE_FLASH = { size: 0.22, growth: 0.3, opacity: 0.7, color: [1.6, 1.1, 0.15] };

// Scenes can override any PULSE_LIGHT / PULSE_FLASH key via ctx.pulseLight / ctx.pulseFlash.

// Light that follows the selected module. Scenes can override any key via ctx.selectLight.
export const SELECT_LIGHT = { color: 0xffc640, intensity: 18, distance: 6.5, offset: [0, 1.6, 2.4], response: 6 };

// Sphere core (scene 03): near-black at rest, yellow when hovered/selected. `gain` = active brightness.
export const SPHERE_CORE = { idle: [0.02, 0.02, 0.025], gain: 0.55 };

// Cubes (scene 01). Sizes are full widths. A negative overhang pulls the trim inside the body.
export const CUBE = {
  size: 1.5,
  radius: 0.1,
  base: { height: 0.1, overhang: 0.06 },
  crown: { height: 0.1, overhang: -0.02, gap: 0.05 }, // overhang −0.02 ⇒ lid sits just inside the rounded body edge
  face: 1.15, // logo reference width
};

// Uniform scale of each cube together with its plinth, so proportions never change.
// Mobile 1.15: the tightest neighbouring plinths are 2.6 m apart and a plinth footprint is 2.12 m,
// so 1.15 (2.44 m) keeps a visible gap. Raise toward 1.2 for bigger, lower for more air.
export const CUBE_SCALE = { desktop: 1, mobile: 1.15 };

// Cubes turn slightly toward the platform centre; plinths follow the same angle.
// Angle (rad) = atan2(−x · FACE_INWARD, 1). Set to 0 for dead-straight cubes.
export const FACE_INWARD = 0.08;

// Soft halo on top of a pedestal when its module (cube, hexagon, vault) is selected.
export const PEDESTAL_GLOW = { opacity: 0.4, color: [1.5, 1.05, 0.08], reach: 0.3 };

// Scrolling "code" LEDs on the server-room walls (scene 02).
export const RACK_MATRIX = {
  rate: 12, // texture updates per second
  streamChance: 0.035, // chance per column per update to start a falling stream
  streamSpeed: [0.35, 0.9], // rows per update
  flipChance: 0.02, // share of LEDs that change state every update
  fade: 0.82, // trail persistence (closer to 1 = longer trails)
};

// Labels that are rotated to follow their module's on-screen angle (the tilt of the cube face).
// Only listed ids are tilted; add more ids to extend it.
export const TILT_LABELS = { desktop: [], mobile: ["javascript", "swift"] };
