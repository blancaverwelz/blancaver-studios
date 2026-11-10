import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

// Normalized anchors refer to the matching image files, not the viewport.
// Keep these together when replacing either composition.
const plates = {
  desktop: { width: 1672, height: 941, x: 0.86, y: 0.819, size: 0.066 },
  mobile: { width: 1024, height: 1536, x: 0.72, y: 0.784, size: 0.095 },
}

function ribbonGeometry() {
  const positions = [], indices = []
  const segments = 160, sides = 24
  for (let i = 0; i <= segments; i++) {
    const u = i / segments * Math.PI * 2
    for (let j = 0; j <= sides; j++) {
      const v = j / sides * Math.PI * 2
      const twist = u + 0.4
      const radial = 0.29 * Math.cos(v) * Math.cos(twist) - 0.075 * Math.sin(v) * Math.sin(twist)
      const depth = 0.29 * Math.cos(v) * Math.sin(twist) + 0.075 * Math.sin(v) * Math.cos(twist)
      positions.push((0.7 + radial) * Math.cos(u), (0.7 + radial) * Math.sin(u), depth + 0.11 * Math.sin(u * 2))
      if (i < segments && j < sides) {
        const a = i * (sides + 1) + j, b = a + sides + 1
        indices.push(a, b, a + 1, b, b + 1, a + 1)
      }
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  geometry.rotateX(-0.18)
  geometry.rotateZ(-0.32)
  geometry.computeBoundingBox()
  return geometry
}

export default function ContactScene() {
  const hostRef = useRef(null)
  useEffect(() => {
    const host = hostRef.current
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' })
    } catch { return }
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.1
    host.appendChild(renderer.domElement)
    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 3000)
    camera.position.z = 1500
    const environmentScene = new RoomEnvironment()
    const pmrem = new THREE.PMREMGenerator(renderer)
    const environment = pmrem.fromScene(environmentScene, 0.035)
    scene.environment = environment.texture
    environmentScene.dispose()
    pmrem.dispose()
    const geometry = ribbonGeometry()
    const material = new THREE.MeshStandardMaterial({ color: 0x827b70, metalness: 1, roughness: 0.19, envMapIntensity: 1.15, side: THREE.DoubleSide })
    const sculpture = new THREE.Mesh(geometry, material)
    scene.add(sculpture)
    scene.add(new THREE.HemisphereLight(0xf4f7ff, 0x55442a, 1.4))
    const key = new THREE.DirectionalLight(0xffedc9, 1.7)
    key.position.set(-300, 500, 700)
    scene.add(key)
    const rim = new THREE.DirectionalLight(0xffffff, 1.2)
    rim.position.set(500, 180, -300)
    scene.add(rim)
    const shadowGeometry = new THREE.PlaneGeometry(1, 1)
    const shadowMaterial = new THREE.ShaderMaterial({ transparent: true, depthWrite: false,
      vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: 'varying vec2 vUv; void main(){float d=length((vUv-.5)*2.);gl_FragColor=vec4(0.,0.,0.,(1.-smoothstep(.05,1.,d))*.46);}',
    })
    const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial)
    shadow.position.z = -150
    scene.add(shadow)
    let frame = 0, elapsed = 0, last = 0, visible = false, disposed = false, failed = false
    let size = 1
    function render() {
      if (disposed || failed) return
      sculpture.rotation.y = 0.4 + elapsed * 0.25 // A full, clearly visible turn in ~25 seconds.
      renderer.render(scene, camera)
      host.classList.add('is-ready')
    }
    function resize() {
      const width = host.clientWidth, height = host.clientHeight
      if (!width || !height) return
      const mobile = width <= 767 || width / height <= 17 / 20
      const plate = plates[mobile ? 'mobile' : 'desktop']
      const cover = Math.max(width / plate.width, height / plate.height)
      const imageWidth = plate.width * cover, imageHeight = plate.height * cover
      const x = plate.x * imageWidth - (imageWidth - width) / 2
      const y = plate.y * imageHeight - (imageHeight - height) / 2
      size = imageWidth * plate.size
      camera.left = -width / 2; camera.right = width / 2
      camera.top = height / 2; camera.bottom = -height / 2
      camera.updateProjectionMatrix()
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.75))
      renderer.setSize(width, height)
      sculpture.scale.setScalar(size)
      sculpture.position.set(x - width / 2, height / 2 - y - geometry.boundingBox.min.y * size, 0)
      shadow.position.set(x - width / 2, height / 2 - y + 1, -150)
      shadow.scale.set(size * 1.9, size * 0.34, 1)
      render()
    }
    function tick(now) {
      frame = 0
      if (disposed || failed || !visible || document.hidden || reducedMotion.matches) return
      frame = requestAnimationFrame(tick)
      if (last && now - last < 1000 / 30) return
      elapsed += last ? Math.min((now - last) / 1000, 0.1) : 0
      last = now
      render()
    }
    function playback() {
      cancelAnimationFrame(frame); frame = 0; last = 0
      if (disposed || failed) return
      if (reducedMotion.matches) { render(); return }
      if (visible && !document.hidden) frame = requestAnimationFrame(tick)
    }
    function lost(event) {
      event.preventDefault(); failed = true
      cancelAnimationFrame(frame)
      host.classList.remove('is-ready')
    }
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; playback() })
    const resizer = new ResizeObserver(resize)
    observer.observe(host); resizer.observe(host)
    document.addEventListener('visibilitychange', playback)
    reducedMotion.addEventListener('change', playback)
    renderer.domElement.addEventListener('webglcontextlost', lost)
    resize()
    return () => {
      disposed = true; cancelAnimationFrame(frame)
      observer.disconnect(); resizer.disconnect()
      document.removeEventListener('visibilitychange', playback)
      reducedMotion.removeEventListener('change', playback)
      renderer.domElement.removeEventListener('webglcontextlost', lost)
      geometry.dispose(); material.dispose(); shadowGeometry.dispose(); shadowMaterial.dispose()
      environment.dispose(); renderer.dispose(); renderer.forceContextLoss()
      renderer.domElement.remove(); host.classList.remove('is-ready')
    }
  }, [])
  return <div ref={hostRef} className="contact-scene" aria-hidden="true" />
}
