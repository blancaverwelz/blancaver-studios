import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useLocation } from 'react-router-dom'

// Sitewide ambient backdrop — generic starfield/dust only, no labels, no
// interaction, no bloom/postprocessing. Mounted once at the app root behind
// all page content, visible from ProjectSlider downward on every page.
//
// Pause while the opaque homepage journey covers the entire viewport.
// Elsewhere the backdrop is deliberately cheaper than ServicesScene/EmblemScene:
// no EffectComposer, capped pixel ratio, low point count, and a hard pause
// on document.visibilitychange when the tab isn't active.
const PARTICLE_COUNT = 220
const MAX_PIXEL_RATIO = 1.5

function buildDust(count) {
  const positions = new Float32Array(count * 3)
  const seeds = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    // Spread through a wide, shallow volume in front of the camera so
    // particles read as distant ambient dust rather than a nearby cloud.
    positions[i * 3] = (Math.random() - 0.5) * 16
    positions[i * 3 + 1] = (Math.random() - 0.5) * 16
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2
    seeds[i] = Math.random() * 1000
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))

  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
    },
    vertexShader: `
      attribute float aSeed;
      uniform float uTime;
      varying float vAlpha;
      void main() {
        vec3 p = position;
        // Slow independent drift per-particle, small amplitude.
        p.x += sin(uTime * 0.03 + aSeed) * 0.6;
        p.y += cos(uTime * 0.025 + aSeed * 1.3) * 0.6;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = (2.2 / -mv.z) * (0.6 + 0.4 * fract(aSeed * 0.618));
        gl_Position = projectionMatrix * mv;
        vAlpha = 0.35 + 0.25 * sin(uTime * 0.15 + aSeed);
      }
    `,
    fragmentShader: `
      varying float vAlpha;
      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);
        float a = smoothstep(0.5, 0.0, d) * vAlpha;
        gl_FragColor = vec4(vec3(0.9, 0.92, 1.0), a);
      }
    `,
  })

  return new THREE.Points(geo, mat)
}

export default function AmbientVoidBackground() {
  const mountRef = useRef(null)
  const { pathname } = useLocation()
  const refreshCoverageRef = useRef(null)

  useEffect(() => { refreshCoverageRef.current?.() }, [pathname])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 50)
    camera.position.z = 6

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO))
    mount.appendChild(renderer.domElement)

    const dust = buildDust(PARTICLE_COUNT)
    scene.add(dust)

    function handleResize() {
      const w = window.innerWidth
      const h = window.innerHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)
    handleResize()

    let rafId = null
    let coverageFrame = null
    let covered = false
    const clock = new THREE.Clock()

    function renderFrame() {
      dust.material.uniforms.uTime.value = clock.getElapsedTime()
      renderer.render(scene, camera)
    }

    function animate() {
      rafId = requestAnimationFrame(animate)
      renderFrame()
    }

    function startLoop() {
      if (rafId !== null) return
      if (reducedMotion) {
        renderFrame()
        return
      }
      animate()
    }

    function stopLoop() {
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
    }

    function handleVisibilityChange() {
      if (document.hidden || covered) {
        stopLoop()
      } else {
        startLoop()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    function updateCoverage() {
      coverageFrame = null
      const journey = document.querySelector('.studio-journey')
      const bounds = journey?.getBoundingClientRect()
      covered = Boolean(bounds && bounds.top <= 0 && bounds.bottom >= window.innerHeight)
      handleVisibilityChange()
    }
    function scheduleCoverage() {
      if (coverageFrame === null) coverageFrame = requestAnimationFrame(updateCoverage)
    }
    refreshCoverageRef.current = scheduleCoverage
    window.addEventListener('scroll', scheduleCoverage, { passive: true })
    window.addEventListener('resize', scheduleCoverage)
    updateCoverage()

    return () => {
      stopLoop()
      refreshCoverageRef.current = null
      if (coverageFrame !== null) cancelAnimationFrame(coverageFrame)
      window.removeEventListener('scroll', scheduleCoverage)
      window.removeEventListener('resize', scheduleCoverage)
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      dust.geometry.dispose()
      dust.material.dispose()
      renderer.dispose()
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={mountRef} className="ambient-void-bg" aria-hidden="true" />
}
