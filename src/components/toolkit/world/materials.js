import { Color, MeshBasicMaterial, MeshPhysicalMaterial, MeshStandardMaterial } from "three";
import { brushedTexture, floorTexture, frameGlowTexture, glowTexture, grainTexture } from "./textures";

// Physically based materials shared by every scene. Colours stay desaturated
// (charcoal, aluminium, smoked glass); Cyber Yellow only appears as light.
export function createMaterials() {
  const brushed = brushedTexture(11, [3, 3]);
  const brushedWide = brushedTexture(23, [1.5, 1.5]);
  const grain = grainTexture(5, [4, 4]);
  const floorRough = floorTexture([14, 14]);
  const glowSprite = glowTexture();
  const frameGlow = frameGlowTexture(4);
  const hexGlow = frameGlowTexture(6);

  return {
    textures: [brushed, brushedWide, grain, floorRough, glowSprite, frameGlow, hexGlow],
    metal: new MeshStandardMaterial({
      color: 0x23272b, metalness: 0.9, roughness: 0.38,
      roughnessMap: brushed, bumpMap: brushed, bumpScale: 0.35,
    }),
    aluminium: new MeshStandardMaterial({
      color: 0x8b9298, metalness: 1, roughness: 0.34,
      roughnessMap: brushedWide, bumpMap: brushedWide, bumpScale: 0.5,
    }),
    paint: new MeshStandardMaterial({
      color: 0x2a2f34, metalness: 0.5, roughness: 0.5,
      roughnessMap: grain, bumpMap: grain, bumpScale: 0.12,
    }),
    floor: new MeshStandardMaterial({
      color: 0x0d0f11, metalness: 0.15, roughness: 0.62,
      roughnessMap: floorRough, bumpMap: floorRough, bumpScale: 0.25,
    }),
    // Smoked, frosted glass: transmission + roughness blur whatever sits behind it.
    frosted: new MeshPhysicalMaterial({
      color: 0xf2f6f8, metalness: 0, roughness: 0.3, transmission: 1, thickness: 1.2, ior: 1.48,
      attenuationColor: new Color(0x59636b), attenuationDistance: 2.2,
      clearcoat: 0.6, clearcoatRoughness: 0.18, specularIntensity: 1, envMapIntensity: 3.2,
    }),
    // Glossy black glass panel (vault faces).
    blackGlass: new MeshPhysicalMaterial({
      color: 0x050607, metalness: 0.1, roughness: 0.09, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.1,
    }),
    // HDR emissive: values > 1 feed the bloom pass.
    glowYellow: new MeshBasicMaterial({ color: new Color(1.5, 1.15, 0.03), toneMapped: false }),
    shell: new MeshPhysicalMaterial({
      color: 0x8d949a, metalness: 0, roughness: 0.14, transparent: true, opacity: 0.1,
      clearcoat: 1, clearcoatRoughness: 0.08, depthWrite: false, envMapIntensity: 0.9,
    }),
    glowSprite,
    frameGlow,
    hexGlow,
  };
}

export function disposeMaterials(mats) {
  mats.textures.forEach((t) => t.dispose());
  Object.values(mats).forEach((m) => m?.isMaterial && m.dispose());
}
