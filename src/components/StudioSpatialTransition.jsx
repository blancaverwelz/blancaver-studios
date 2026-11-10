import { easeRange } from './studioMonitor';
export default function StudioSpatialTransition({ progress }) {
  const t= easeRange(progress,.08,.92);
  return <div className="studio-spatial-transition" aria-hidden="true" style={{visibility:progress>0&&progress<1?'visible':'hidden',transform:`translateY(${-110+t*220}%)`}}><i/><b/></div>;
}
