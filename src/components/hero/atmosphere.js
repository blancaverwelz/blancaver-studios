import * as THREE from "three";

// Shared optical model. Only the portion of the view ray behind the studio
// contributes to city haze. Higher sight lines pass through thinner air.
const nightAir = `
  vec3 throughAir(vec3 surface, vec3 origin, vec3 ray, float distanceToSurface) {
    float forward = -ray.z;
    if (forward <= 0.001) return surface;
    float entry = max(0.0, (origin.z + 35.0) / forward);
    float path = max(0.0, distanceToSurface - entry);
    float meanHeight = max(0.0, origin.y + ray.y * (entry + 0.5 * path));
    float density = 0.0028 * exp(-meanHeight / 67.0);
    float veil = 1.0 - exp(-density * path);
    vec3 airLight = vec3(0.021, 0.031, 0.045);
    return mix(surface, airLight, veil);
  }
`;

function createNightSky() {
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    vertexShader: `
      varying vec3 vDirection;
      void main() {
        vDirection = position;
        vec4 sky = projectionMatrix * vec4(mat3(viewMatrix) * position, 1.0);
        gl_Position = sky.xyww;
      }`,
    fragmentShader: `
      varying vec3 vDirection;
      ${nightAir}
      void main() {
        vec3 ray = normalize(vDirection);
        vec3 clearSky = mix(vec3(0.003, 0.005, 0.010), vec3(0.001, 0.002, 0.005),
                            smoothstep(0.0, 0.85, ray.y));
        gl_FragColor = vec4(throughAir(clearSky, cameraPosition, ray, 650.0), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12), material);
  sky.name = "Night sky";
  sky.frustumCulled = false;
  sky.renderOrder = -100;
  sky.raycast = () => {};
  return sky;
}

export function applyHeroAtmosphere(scene, materials) {
  scene.add(createNightSky());
  for (const material of materials) {
    material.onBeforeCompile = (shader) => {
      shader.vertexShader = `varying vec3 vHeroWorld;\n${shader.vertexShader}`;
      shader.vertexShader = shader.vertexShader.replace("#include <project_vertex>", `
        #include <project_vertex>
        vec4 heroPosition = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          heroPosition = instanceMatrix * heroPosition;
        #endif
        vHeroWorld = (modelMatrix * heroPosition).xyz;
      `);
      shader.fragmentShader = `varying vec3 vHeroWorld;\n${nightAir}\n${shader.fragmentShader}`;
      shader.fragmentShader = shader.fragmentShader.replace("#include <tonemapping_fragment>", `
        vec3 sightLine = vHeroWorld - cameraPosition;
        float sightDistance = length(sightLine);
        gl_FragColor.rgb = throughAir(gl_FragColor.rgb, cameraPosition,
                                     sightLine / max(sightDistance, 0.001), sightDistance);
        #include <tonemapping_fragment>
      `);
    };
    material.customProgramCacheKey = () => "hero-night-air";
  }
}
