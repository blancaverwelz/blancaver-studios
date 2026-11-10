import { easeRange } from './studioMonitor';

// SVG filaments follow scroll, not a clock: the collapse reverses exactly.
export default function StudioVacuum({ progress, mobile }) {
  if (progress <= 0 || progress >= 1) return null;
  const pull = easeRange(progress, .08, .67);
  const shade = easeRange(progress, .44, .68) * (1 - easeRange(progress, .76, 1));
  return <div className="studio-vacuum" aria-hidden="true">
    <svg viewBox="-600 -600 1200 1200" preserveAspectRatio="xMidYMid slice" style={{ opacity: Math.sin(pull * Math.PI) * .65 }}>
      <defs><radialGradient id="vacuum-thread"><stop stopColor="#ffd301" stopOpacity=".8" /><stop offset="1" stopColor="#b6c5cd" stopOpacity="0" /></radialGradient></defs>
      <g transform={`rotate(${-pull * 140}) scale(${1 - pull * .9})`}>
        {Array.from({ length: mobile ? 12 : 26 }, (_, i) => <path key={i} transform={`rotate(${i * 137.508})`} d={`M ${900 + i * 18} 0 C 550 420 30 360 0 0`} fill="none" stroke="url(#vacuum-thread)" strokeWidth={i % 3 === 0 ? 1.8 : .6} />)}
      </g>
    </svg>
    <div className="studio-vacuum__black" style={{ opacity: shade }} />
  </div>;
}
