import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { assertActive, disposeScene } from "./resources.js";

async function fetchModel(url, signal, onProgress) {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Studio model request failed (${response.status})`);
  const total = Number(response.headers.get("Content-Length"));
  if (!response.body || !total) return response.arrayBuffer();
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value); size += value.length;
      onProgress(Math.min(85, Math.round(size / total * 85)));
    }
  } finally { reader.releaseLock(); }
  const buffer = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { buffer.set(chunk, offset); offset += chunk.length; }
  return buffer.buffer;
}

export async function loadHeroAssets({ cameraUrl, modelUrl, envUrl, signal, onProgress }) {
  let gltf, hdr;
  try {
    const response = await fetch(cameraUrl, { signal });
    if (!response.ok) throw new Error("Camera data could not be loaded");
    const cameraData = await response.json();
    const buffer = await fetchModel(modelUrl, signal, onProgress);
    assertActive(signal);
    gltf = await new GLTFLoader().parseAsync(buffer, "");
    assertActive(signal);
    onProgress(90);
    hdr = await new RGBELoader().loadAsync(envUrl);
    assertActive(signal);
    return { gltf, hdr, cameraData };
  } catch (error) {
    if (gltf) disposeScene(gltf.scene);
    hdr?.dispose();
    throw error;
  }
}
