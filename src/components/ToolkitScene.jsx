import { useEffect, useRef } from 'react';
import { createCinematicHero } from './cinematicHero';
import { buildToolkitHero } from './toolkitHero';

export default function ToolkitScene() {
  const host = useRef(null);
  useEffect(() => {
    const view = createCinematicHero(host.current, buildToolkitHero, { mobileDpr: 2 });
    return () => view?.dispose();
  }, []);
  return (
    <div className="toolkit-scene toolkit-scene--core" aria-hidden="true">
      <picture className="toolkit-scene__backdrop">
        <source media="(max-width: 767px), (max-aspect-ratio: 17/20)" srcSet={`${import.meta.env.BASE_URL}images/toolkit/engineering-lab-mobile.webp`} />
        <img src={`${import.meta.env.BASE_URL}images/toolkit/engineering-lab-desktop.webp`} alt="" fetchPriority="high" />
      </picture>
      <div className="toolkit-scene__live" ref={host} />
    </div>
  );
}
