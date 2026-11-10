import { BackSide, BoxGeometry, Color, DoubleSide, Mesh, MeshBasicMaterial, PMREMGenerator, PlaneGeometry, Scene } from "three";

// A small dark "studio" with a few HDR softboxes. Used only for reflections /
// image-based lighting, never shown. Gives glass and metal something real to mirror.
// `practicals` switches the two yellow side strips (they show up as yellow floor
// reflections): pass { left: false } to remove the left one.
export function createEnvironment(renderer, { practicals = {} } = {}) {
  const { left = true, right = true } = practicals;
  const scene = new Scene();
  scene.add(new Mesh(new BoxGeometry(40, 20, 40), new MeshBasicMaterial({ color: 0x050607, side: BackSide })));

  const panel = (w, h, pos, color, power) => {
    const m = new Mesh(new PlaneGeometry(w, h), new MeshBasicMaterial({ color: new Color(color).multiplyScalar(power), side: DoubleSide }));
    m.position.set(...pos);
    m.lookAt(0, 0, 0);
    scene.add(m);
  };
  panel(9, 5, [-9, 8, 9], 0xffe6c0, 9); // warm key, upper front-left
  panel(14, 1.2, [0, 9.5, -6], 0xbcd4ff, 4); // cool top rim
  if (right) panel(2, 9, [11, 3, -2], 0xffd301, 3.2); // yellow practical, right
  if (left) panel(2, 9, [-12, 2, -4], 0xffcf5a, 2.2); // yellow practical, left
  panel(16, 1, [0, 0.6, 12], 0xffd9a0, 1.4); // low front fill for the floor

  const pmrem = new PMREMGenerator(renderer);
  const target = pmrem.fromScene(scene, 0.035);
  pmrem.dispose();
  scene.traverse((o) => {
    o.geometry?.dispose();
    o.material?.dispose();
  });
  return target;
}
