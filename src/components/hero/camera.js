import * as THREE from "three";

const SENSOR_MM = 36;

export function createHeroCamera(cameraData, mobile) {
  const camera = new THREE.PerspectiveCamera(30, 16 / 9, 0.4, 1100);
  const frames = cameraData.frames;
  const plate = cameraData.plate;
  const tmpQa = new THREE.Quaternion();
  const tmpQb = new THREE.Quaternion();
  let viewport = { w: 1, h: 1 };

  function seek(progress) {
    const t = progress * (frames.length - 1);
    const maxT = frames.length - 1;
    const x = THREE.MathUtils.clamp(t, 0, maxT);
    const i = Math.floor(x), j = Math.min(i + 1, maxT), k = x - i;
    const a = frames[i], b = frames[j];
    const lens = a.lens + (b.lens - a.lens) * k;
    const shift = a.shift_y + (b.shift_y - a.shift_y) * k;
    const W = plate.width, H = plate.height;
    const focalPx = (lens * W) / SENSOR_MM;
    const dy = shift * W;
    const fullH = H + 2 * Math.abs(dy);
    camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(fullH / 2 / focalPx));
    camera.aspect = W / fullH;
    const framingWidth = mobile ? Math.max(viewport.w, viewport.h * 0.95) : viewport.w;
    const s = Math.max(framingWidth / W, viewport.h / H);
    const visW = viewport.w / s, visH = viewport.h / s;
    const offX = (W - visW) / 2;
    const offY = (fullH - H) / 2 - dy + (H - visH) / 2;
    camera.setViewOffset(W, fullH, offX, offY, visW, visH);
    camera.position.set(
      a.p[0] + (b.p[0] - a.p[0]) * k,
      a.p[1] + (b.p[1] - a.p[1]) * k,
      a.p[2] + (b.p[2] - a.p[2]) * k,
    );
    tmpQa.fromArray(a.q);
    tmpQb.fromArray(b.q);
    camera.quaternion.copy(tmpQa.slerp(tmpQb, k));
    camera.updateMatrixWorld(true);
  }

  return { camera, seek, resize(w, h) { viewport = { w: Math.max(1, w), h: Math.max(1, h) }; } };
}
