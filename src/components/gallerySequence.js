import { easeRange } from './studioMonitor';

// One timing model drives the room, HTML exhibits and keyboard navigation.
export function galleryGroups(projects, mobile) {
  return mobile ? projects.map(project => [project]) : [projects.slice(0, 2), projects.slice(2, 5), projects.slice(5)].filter(group => group.length);
}
export function galleryFrame(progress, count) {
  const index = Math.min(count - 1, Math.max(0, Math.floor(progress)));
  const local = progress - index;
  const moving = index < count - 1 ? easeRange(local, .76, 1) : 0;
  return { index, local, position: index + moving,
    opacity: easeRange(local, 0, .12) * (index < count - 1 ? 1 - easeRange(local, .72, .86) : 1),
  };
}
