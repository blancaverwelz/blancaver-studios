import { easeRange } from './studioMonitor';

// A near-lens structural pier completely occludes both scenes at the cut.
export default function StudioMotionTransition({ progress }) {
  const travel = easeRange(progress, .08, .92);
  return <div className="studio-motion-transition" aria-hidden="true" style={{ visibility: progress > 0 && progress < 1 ? 'visible' : 'hidden', transform: `translateX(${110 - travel * 220}%)` }}><i /><b /></div>;
}
