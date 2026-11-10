import { easeRange } from './studioMonitor';

// One reversible timeline for service exit, impact, emblem arrival and copy.
export function trustFrame(progress, mobile = false) {
  return {
    converge: Math.pow(easeRange(progress, .04, .43), 1.5),
    labels: 1 - easeRange(progress, 0, .16),
    services: 1 - easeRange(progress, mobile ? .08 : .43, mobile ? .35 : .49),
    impact: mobile ? 0 : easeRange(progress, .42, .46) * (1 - easeRange(progress, .46, .61)),
    burst: easeRange(progress, .43, .72),
    emblem: easeRange(progress, mobile ? .30 : .46, mobile ? .56 : .60),
    emblemProgress: easeRange(progress, mobile ? .30 : .46, .84),
    settle: easeRange(progress, .64, .91),
    copy: easeRange(progress, .79, 1),
  };
}
