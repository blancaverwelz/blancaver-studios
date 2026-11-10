import { Vector3 } from "three";

const right = new Vector3();
const p = new Vector3();
const e = new Vector3();

// Screen position and size for each module's logo button.
// Rectangular faces (cubes, hexagons, vaults): the button is centred on the bounding
// box of the *projected* face, so perspective foreshortening cannot pull it off-centre.
// Spheres have no height: the projected centre is used.
// Labels listed in `tilt` also get `rot` (deg): the on-screen angle of the face's horizontal axis,
// so a cube turned toward the platform centre carries its logo at the same angle.
// Returns [{ id, x, y (% of stage), w (px), rot (deg) }].
export function projectFaces(modules, camera, stage, tilt = []) {
  camera.updateMatrixWorld();
  right.setFromMatrixColumn(camera.matrixWorld, 0);
  return Object.entries(modules).map(([id, m]) => {
    m.group.updateWorldMatrix(true, false);
    const { center, width, height } = m.face;
    const corners = height
      ? [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => new Vector3(center.x + (sx * width) / 2, center.y + (sy * height) / 2, center.z))
      : [center];
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const c of corners) {
      p.copy(c);
      m.group.localToWorld(p).project(camera);
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
    }
    // Button width = on-screen width of `face.width` at the face centre.
    p.copy(center);
    m.group.localToWorld(p);
    e.copy(p).addScaledVector(right, (width * m.group.scale.x) / 2); // world width = local width × module scale
    p.project(camera);
    e.project(camera);
    let rot = 0;
    if (height && tilt.includes(id)) {
      const edge = (side) => m.group.localToWorld(new Vector3(center.x + (side * width) / 2, center.y, center.z)).project(camera);
      const l = edge(-1);
      const r = edge(1);
      rot = (Math.atan2(-(r.y - l.y) * stage.h, (r.x - l.x) * stage.w) * 180) / Math.PI;
    }
    return {
      id,
      x: (((minX + maxX) / 2) * 0.5 + 0.5) * 100,
      y: (-((minY + maxY) / 2) * 0.5 + 0.5) * 100,
      w: Math.abs(e.x - p.x) * stage.w,
      rot,
    };
  });
}
