import { ease } from '../cinematicHero';
import { createArms } from './arms';
import { CORE_GLOW_LIGHT, createAssembly } from './assembly';
import { createBench } from './bench';
import { createCore } from './core';
import { createMaterials } from './materials';
import { T, stageName } from './timeline';

// Toolkit hero: a bench where three arms build the power core out of a parts magazine in the dais.
export function buildToolkitHero({ scene, camera, renderer, mobile }) {
  scene.background = null; // Transparent foreground over the photographic workshop.
  scene.fog = null;
  renderer.toneMappingExposure = 0.88;
  renderer.localClippingEnabled = true; // parts are clipped while inside the dais
  scene.environmentIntensity = 0.38;

  const mats = createMaterials();
  const bench = createBench({ scene, mats, mobile });
  const core = createCore({ scene, mats });
  const arms = createArms({ scene, mats });
  const assembly = createAssembly({ scene, module: core.module, heartTarget: core.heartTarget, mats, rests: arms.rests, mobile });

  return {
    update(t, rect, staticView) {
      const activation = ease(t, 0, T.lighting);
      const power = ease(t, T.lighting, T.power);
      const ready = ease(t, ...T.ready);
      const { progress, heartLit, flash, glow, targets } = assembly.update(t, power);

      bench.key.intensity = activation * 170;
      bench.rim.intensity = activation * 55;
      mats.yellow.emissiveIntensity = 0.03 + power * 0.65;
      core.updateHalo(t, power);
      bench.coreLight.intensity = heartLit * 4 + glow * CORE_GLOW_LIGHT + flash * 14;
      bench.pulse.visible = t >= T.lighting && t < T.power;
      bench.pulse.position.x = -1.5 + power * 9;

      core.containment.forEach((frame, i) => {
        frame.rotation.y = (1 - ease(t, 2.1 + i * 0.2, 3.5 + i * 0.2)) * (i % 2 ? -1 : 1) * 0.85;
      });
      core.wire.material.opacity = Math.sin(progress * Math.PI) * 0.25;
      core.rotor.rotation.z = staticView ? 0.3 : ready * Math.max(0, t - T.ready[0]) * 0.09;
      bench.panels.forEach(({ diag, screenMat }) => {
        screenMat.color.setScalar(0.08 + 0.92 * power);
        diag.update(progress);
      });
      arms.update(targets, { t, ready, power, idle: !staticView });

      const portrait = rect.width < 768 || window.innerWidth / window.innerHeight <= 17 / 20;
      camera.fov = portrait ? 46 : 40;
      camera.position.set(portrait ? 10 : 13, portrait ? 9.5 : 8.5, portrait ? 19 : 17);
      camera.lookAt(portrait ? 2.8 : 0, portrait ? 4.4 : 4.6, -1);
      return stageName(t);
    },
  };
}
