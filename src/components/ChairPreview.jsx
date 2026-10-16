import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RotateCcw } from "lucide-react";

const finishes = [
  { name: "Oak", color: "#B98A55" },
  { name: "Walnut", color: "#68432D" },
  { name: "Black", color: "#282828" },
];

// A solid panel with gently rounded edges.
function roundedPanel(width, height, depth, radius = 0.08) {
  const x = -width / 2;
  const y = -height / 2;
  const shape = new THREE.Shape();

  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 3,
    steps: 1,
    curveSegments: 12,
  });

  geometry.center();
  return geometry;
}

export default function ChairPreview() {
  const canvasRef = useRef(null);
  const woodRef = useRef(null);
  const renderRef = useRef(() => {});
  const resetRef = useRef(() => {});
  const [finishIndex, setFinishIndex] = useState(1);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas.parentElement;

    let renderer;

    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: false,
      });
    } catch {
      setUnavailable(true);
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor("#EEE8DF");
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#EEE8DF");

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 30);
    camera.position.set(2.6, 2.05, 3.4);

    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 0.85, 0);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.enableDamping = false;
    controls.minPolarAngle = Math.PI * 0.22;
    controls.maxPolarAngle = Math.PI * 0.49;
    controls.rotateSpeed = 0.65;
    controls.update();
    controls.saveState();

    scene.add(new THREE.HemisphereLight("#FFFFFF", "#B1A08C", 2.4));

    const keyLight = new THREE.DirectionalLight("#FFF3DF", 3.2);
    keyLight.position.set(3, 5, 4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.left = -3;
    keyLight.shadow.camera.right = 3;
    keyLight.shadow.camera.top = 3;
    keyLight.shadow.camera.bottom = -3;
    keyLight.shadow.camera.near = 0.1;
    keyLight.shadow.camera.far = 12;
    keyLight.shadow.normalBias = 0.025;
    keyLight.shadow.bias = -0.0002;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight("#FFFFFF", 1.4);
    fillLight.position.set(-3, 2, -2);
    scene.add(fillLight);

    const wood = new THREE.MeshStandardMaterial({
      color: finishes[1].color,
      roughness: 0.47,
      metalness: 0,
    });
    woodRef.current = wood;

    const upholstery = new THREE.MeshStandardMaterial({
      color: "#343536",
      roughness: 0.95,
    });

    const chair = new THREE.Group();
    scene.add(chair);

    function addMesh(geometry, material, position) {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...position);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      chair.add(mesh);
      return mesh;
    }

    // Tapered wooden supports between two points.
    function addSupport(start, end, bottomRadius, topRadius) {
      const a = new THREE.Vector3(...start);
      const b = new THREE.Vector3(...end);
      const direction = b.clone().sub(a);

      const mesh = addMesh(
        new THREE.CylinderGeometry(
          topRadius,
          bottomRadius,
          direction.length(),
          16,
        ),
        wood,
        a.clone().add(b).multiplyScalar(0.5).toArray(),
      );

      mesh.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direction.normalize(),
      );

      return mesh;
    }

    // Four gently splayed legs.
    addSupport([-0.47, 0.04, 0.43], [-0.37, 0.84, 0.32], 0.026, 0.045);
    addSupport([0.47, 0.04, 0.43], [0.37, 0.84, 0.32], 0.026, 0.045);
    addSupport([-0.43, 0.04, -0.44], [-0.35, 0.84, -0.31], 0.026, 0.044);
    addSupport([0.43, 0.04, -0.44], [0.35, 0.84, -0.31], 0.026, 0.044);

    // Wooden seat base.
    const base = addMesh(
      roundedPanel(0.96, 0.84, 0.075, 0.16),
      wood,
      [0, 0.84, 0],
    );
    base.rotation.x = -Math.PI / 2;

    // Soft upholstered seat.
    const cushion = addMesh(
      roundedPanel(0.94, 0.82, 0.09, 0.18),
      upholstery,
      [0, 0.91, 0.015],
    );
    cushion.rotation.x = -Math.PI / 2;

    // Backrest supports.
    addSupport([-0.35, 0.82, -0.31], [-0.36, 1.57, -0.43], 0.034, 0.029);
    addSupport([0.35, 0.82, -0.31], [0.36, 1.57, -0.43], 0.034, 0.029);

    // Bend the rounded back panel into a gentle wraparound curve.
    const backGeometry = roundedPanel(1.02, 0.38, 0.065, 0.11);
    const positions = backGeometry.attributes.position;

    for (let i = 0; i < positions.count; i += 1) {
      const x = positions.getX(i);
      positions.setZ(i, positions.getZ(i) + 0.24 * x * x);
    }

    positions.needsUpdate = true;
    backGeometry.computeVertexNormals();

    const backrest = addMesh(backGeometry, wood, [0, 1.52, -0.43]);
    backrest.rotation.x = -0.08;

    // Neutral ground receives the chair's shadow.
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.ShadowMaterial({
        color: "#493729",
        opacity: 0.18,
      }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    function render() {
      renderer.render(scene, camera);
    }

    renderRef.current = render;
    resetRef.current = () => {
      controls.reset();
      render();
    };

    controls.addEventListener("change", render);

    function resize() {
      const width = host.clientWidth;
      const height = host.clientHeight;
      if (!width || !height) return;

      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      render();
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    // Keyboard alternative to dragging.
    function handleKeyDown(event) {
      const steps = {
        ArrowLeft: -0.16,
        ArrowRight: 0.16,
        ArrowUp: -0.1,
        ArrowDown: 0.1,
      };

      if (!(event.key in steps)) return;
      event.preventDefault();

      const offset = camera.position.clone().sub(controls.target);
      const spherical = new THREE.Spherical().setFromVector3(offset);

      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        spherical.theta += steps[event.key];
      } else {
        spherical.phi = THREE.MathUtils.clamp(
          spherical.phi + steps[event.key],
          controls.minPolarAngle,
          controls.maxPolarAngle,
        );
      }

      camera.position.setFromSpherical(spherical).add(controls.target);
      controls.update();
      render();
    }

    canvas.addEventListener("keydown", handleKeyDown);

    return () => {
      resizeObserver.disconnect();
      canvas.removeEventListener("keydown", handleKeyDown);
      controls.removeEventListener("change", render);
      controls.dispose();

      const geometries = new Set();
      const materials = new Set();

      scene.traverse((object) => {
        if (object.geometry) geometries.add(object.geometry);

        if (object.material) {
          const items = Array.isArray(object.material)
            ? object.material
            : [object.material];
          items.forEach((material) => materials.add(material));
        }
      });

      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      renderer.dispose();

      woodRef.current = null;
      renderRef.current = () => {};
      resetRef.current = () => {};
    };
  }, []);

  useEffect(() => {
    if (!woodRef.current) return;
    woodRef.current.color.set(finishes[finishIndex].color);
    renderRef.current();
  }, [finishIndex]);

  return (
    <figure className="min-w-0">
      <div className="overflow-hidden rounded-sm border border-white/20 bg-[#594334] text-[#FFF4E6]">
        <div className="flex items-center justify-between gap-3 px-5 pt-5 sm:px-6">
          <span className="text-xs font-semibold tracking-[0.16em]">
            OAKSTEAD FURNITURE
          </span>

          <div className="flex items-center gap-3">
            <span className="hidden text-[9px] tracking-[0.16em] sm:inline">
              THE EVERYDAY CHAIR
            </span>

            <button
              type="button"
              onClick={() => resetRef.current()}
              disabled={unavailable}
              aria-label="Reset chair view"
              className="inline-flex h-10 w-10 items-center justify-center rounded-sm hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#292521]"
            >
              <RotateCcw aria-hidden="true" size={17} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        <div className="relative h-[280px] sm:h-[340px]">
          <canvas
            ref={canvasRef}
            tabIndex={unavailable ? -1 : 0}
            role="img"
            aria-label={`Interactive dining chair in ${finishes[finishIndex].name} finish. Drag to rotate, or use the arrow keys when focused.`}
            className="block h-full w-full cursor-grab touch-none active:cursor-grabbing focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#292521]"
          />

          {unavailable && (
            <div className="absolute inset-0 flex items-center justify-center px-8 text-center text-sm">
              The 3D preview isn’t available in this browser.
            </div>
          )}
        </div>

        <div className="flex flex-col items-center justify-between gap-4 px-5 pt-2 pb-6 sm:flex-row sm:px-6">
          <p className="text-[11px] text-[#FFF4E6]/75">
            Drag to rotate · Arrow keys supported
          </p>

          <div role="group" aria-label="Chair finish" className="flex gap-3">
            {finishes.map((finish, index) => (
              <button
                key={finish.name}
                type="button"
                aria-pressed={finishIndex === index}
                disabled={unavailable}
                onClick={() => setFinishIndex(index)}
                className="flex min-w-12 flex-col items-center gap-2 rounded-sm px-1 py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD301]"
              >
                <span
                  aria-hidden="true"
                  style={{ backgroundColor: finish.color }}
                  className={`h-8 w-8 rounded-full ring-2 ring-offset-2 ring-offset-[#594334] ${
                    finishIndex === index
                      ? "ring-[#FFD301]"
                      : "ring-[#FFF4E6]/40"
                  }`}
                />
                <span className="text-[11px]">{finish.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <figcaption className="mt-3 text-xs leading-relaxed tracking-wide text-white/40">
        Oakstead Furniture — illustrative interactive concept.
      </figcaption>
    </figure>
  );
}
