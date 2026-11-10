// Use the street and plaza elevations, including the lower road.
// Project away from the actual key light. A higher drone casts a broader,
// fainter shadow, while a crawler has a short shadow close to its body.
export function createCreatureShadowPlacement(key) {
  const dx = (key.position.x - key.target.position.x) / (key.position.y - key.target.position.y);
  const dz = (key.position.z - key.target.position.z) / (key.position.y - key.target.position.y);
  return function placeShadow(actor, groundAtWorldZ) {
    const { g, blob } = actor;
    const drone = actor.type === "drone";
    const bodyY = g.position.y + (drone ? 0 : 0.16 * g.scale.y);
    let height = Math.max(0, bodyY - groundAtWorldZ(g.position.z));
    const receiverY = groundAtWorldZ(g.position.z - dz * height);
    height = Math.max(0, bodyY - receiverY);
    const z = g.position.z - dz * height;
    blob.position.set(g.position.x - dx * height, groundAtWorldZ(z) + 0.012, z);
    blob.rotation.order = "YXZ";
    blob.rotation.y = g.rotation.y;
    if (drone) {
      blob.scale.set(1.6 + height * 0.33, 0.85 + height * 0.29, 1);
      blob.material.opacity = 0.33 / (1 + height * 0.14);
    } else {
      blob.scale.set(0.49 * g.scale.x, 0.96 * g.scale.z, 1);
      blob.material.opacity = 0.46;
    }
  };
}
