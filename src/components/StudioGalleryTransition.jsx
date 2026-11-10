import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createSpatialView, spatialGrain } from "./studioSpatialView";
import { createGalleryPartition } from "./studioGalleryPartition";
import { easeRange } from "./studioMonitor";

function Partition({ progress }) {
  const mount = useRef(null),
    api = useRef(null),
    input = useRef({ active: true, progress });
  useEffect(() => {
    input.current.progress = progress;
    api.current?.draw();
  }, [progress]);
  useEffect(() => {
    const view = createSpatialView(
      mount.current,
      input,
      ({ scene, camera, renderer }) => {
        scene.background = null;
        renderer.setClearColor(0x000000, 0);
        renderer.toneMappingExposure = 0.95;
        scene.environmentIntensity = 0.3;

        const grain = spatialGrain();
        const material = new THREE.MeshStandardMaterial({
          color: "#383c40",
          map: grain,
          bumpMap: grain,
          bumpScale: 0.018,
          roughness: 0.9,
          side: THREE.DoubleSide,
        });

        const wall = createGalleryPartition(material);
        scene.add(wall);

        scene.add(new THREE.HemisphereLight("#e4ebf0", "#302820", 0.85));

        const light = new THREE.PointLight("#e9f0f5", 55, 25, 2);
        light.position.set(-4, 8, 7);
        scene.add(light);
        return {
          update({ progress: p }, rect) {
            const t = easeRange(p, 0.06, 0.94),
              span = rect.width / rect.height > 2 ? 45 : 30;
            camera.position.set((t - 0.5) * span, 4.5, 5);
            camera.lookAt((t - 0.5) * span, 4.5, -8);
          },
        };
      },
      "#141c1e",
      { alpha: true },
    );
    api.current = view;
    return () => {
      view?.dispose();
      api.current = null;
    };
  }, []);
  return <div ref={mount} />;
}
export default function StudioGalleryTransition({ progress }) {
  if (progress <= 0 || progress >= 1) return null;
  // A brief matching dark cover also protects the midpoint on ultrawide screens
  // and when WebGL is unavailable; the curved mesh supplies the visible sweep.
  const cover =
    easeRange(progress, 0.35, 0.46) * (1 - easeRange(progress, 0.54, 0.65));
  return (
    <div className="gallery-transition" aria-hidden="true">
      <div className="gallery-transition__cover" style={{ opacity: cover }} />
      <Partition progress={progress} />
    </div>
  );
}
