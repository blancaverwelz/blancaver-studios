export const smoothRange = (value, start, end) => {
  const x = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return x * x * (3 - 2 * x);
};

// R08: conceal the unmodeled room before reaching the threshold, then allow
// a brief image-only scroll interval before revealing readable content.
export function getEntranceReveal(progress) {
  return {
    lobby: smoothRange(progress, .40, .60),
    text: smoothRange(progress, .66, .80),
    zoom: 1 + .025 * smoothRange(progress, .40, .80),
    readable: progress >= .80,
  };
}
