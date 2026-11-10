import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

export const heroFinishShader = {
  uniforms: { tDiffuse: { value: null } },
  vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    varying vec2 vUv;
    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      float edge = smoothstep(0.15, 0.72, length((vUv - 0.5) * vec2(0.9, 1.0)));
      // Color separation before AgX: cool shadow detail and warm practical highlights.
      float luminance = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
      float shadows = 1.0 - smoothstep(0.012, 0.14, luminance);
      float highlights = smoothstep(0.35, 1.7, luminance);
      vec3 balance = vec3(1.0) + shadows * vec3(-0.020, 0.002, 0.034)
                               + highlights * vec3(0.025, 0.001, -0.022);
      gl_FragColor = vec4(color.rgb * balance * (1.0 - edge * 0.18), color.a);
    }`,
};

export function createHeroRenderer(container, scene, camera, mobile) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.AgXToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = !mobile;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const canvas = renderer.domElement;
  canvas.style.visibility = "hidden";
  container.append(canvas);
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(1, 1), mobile ? 0.12 : 0.20, 0.65, 1.2));
  composer.addPass(new ShaderPass(heroFinishShader));
  composer.addPass(new OutputPass());
  return {
    renderer, canvas,
    resize(width, height) {
      const ratio = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
      renderer.setPixelRatio(ratio);
      renderer.setSize(width, height, false);
      composer.setPixelRatio(ratio);
      composer.setSize(width, height);
    },
    async prepare() { await renderer.compileAsync(scene, camera); },
    draw() { composer.render(); },
    reveal() { canvas.style.visibility = "visible"; },
    conceal() { canvas.style.visibility = "hidden"; },
    dispose() {
      composer.passes.forEach((pass) => pass.dispose?.());
      composer.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}
