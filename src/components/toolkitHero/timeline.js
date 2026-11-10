// One place for every beat of the intro. Times are seconds of visible playback.
export const T = {
  lighting: 1.8, // key light and room come up
  power: 3.2, // rail pulse crosses the bench and reaches the dais
  hatchOpen: [2.4, 3.2], // doors slide apart as the pulse arrives
  rise: [3.0, 3.9], // magazine pushes parts up out of the slot
  pickStart: 3.8, // first part leaves the magazine
  pickGap: 0.45, // delay between consecutive parts (arms work in overlapping turns)
  pickDur: 1.3, // reach → carry → latch → retract
  hatchClose: [7.0, 7.7],
  charge: [7.8, 8.1, 8.7], // flash builds → peaks → falls back; cyber-yellow glow takes over after the peak
  ready: [7.8, 9.0], // system settles and starts idling
};

// Install order = magazine order, top of the stack first. Core first, then the shell around it.
// `arm` indexes ARMS in arms.js: 0 left, 1 right, 2 front. `seg` is the 60° housing segment (0 = upper right).
export const ITEMS = [
  { heart: true, arm: 2 },
  { seg: 0, arm: 1 },
  { seg: 2, arm: 0 },
  { seg: 1, arm: 2 },
  { seg: 5, arm: 1 },
  { seg: 3, arm: 0 },
  { seg: 4, arm: 2 },
];

export const itemStart = (j) => T.pickStart + j * T.pickGap;

export function stageName(t) {
  if (t < T.lighting) return 'lighting';
  if (t < T.power) return 'energy-transfer';
  if (t < T.ready[0]) return 'assembly';
  if (t < T.ready[1]) return 'system-response';
  return 'operational';
}
