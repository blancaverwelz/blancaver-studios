export function disposeScene(scene) {
  const geometries = new Set(), materials = new Set(), textures = new Set();
  scene.traverse((object) => {
    object.shadow?.dispose();
    if (object.geometry) geometries.add(object.geometry);
    for (const material of [object.material].flat().filter(Boolean)) {
      materials.add(material);
      material.userData.heroDetachedTextures?.forEach((texture) => textures.add(texture));
      Object.values(material).forEach((value) => { if (value?.isTexture) textures.add(value); });
    }
  });
  geometries.forEach((value) => value.dispose());
  textures.forEach((value) => value.dispose());
  materials.forEach((value) => value.dispose());
}


export function assertActive(signal) {
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
}

export function framePresented(signal) {
  return new Promise((resolve, reject) => {
    let frame;
    const abort = () => { cancelAnimationFrame(frame); reject(new DOMException("Aborted", "AbortError")); };
    if (signal?.aborted) return abort();
    signal?.addEventListener("abort", abort, { once: true });
    frame = requestAnimationFrame(() => {
      signal?.removeEventListener("abort", abort);
      resolve();
    });
  });
}
