import { useEffect, useRef } from 'react'
import * as THREE from 'three'

/**
 * Premium 3D hero background.
 * - Constellation: depth-distributed particles + precomputed connecting lines (rotates as one group)
 * - Glowing wireframe icosahedron core with a soft "breathing" scale
 * - Depth fog so distant points dissolve into the dark background
 * - Smooth camera parallax toward the cursor
 * Respects prefers-reduced-motion and degrades gracefully without WebGL.
 */
export default function ThreeHero({ dark = true }) {
  const mountRef = useRef(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const reduced =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const width = mount.clientWidth
    const height = mount.clientHeight

    const scene = new THREE.Scene()
    const fogColor = dark ? 0x040406 : 0xeef0f6
    scene.fog = new THREE.FogExp2(fogColor, 0.045)

    const camera = new THREE.PerspectiveCamera(58, width / height, 0.1, 120)
    camera.position.set(0, 0, 17)

    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    } catch (_) {
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(width, height)
    mount.appendChild(renderer.domElement)

    const BLEU_DARK = new THREE.Color(dark ? '#3b82f6' : '#1e40af')
    const BLEU_LIGHT = new THREE.Color(dark ? '#60a5fa' : '#2563eb')
    const CYAN = new THREE.Color('#2dd4bf')

    const group = new THREE.Group()
    scene.add(group)

    // ---- Particle field ----
    const COUNT = 900
    const pts = []
    const positions = new Float32Array(COUNT * 3)
    const colors = new Float32Array(COUNT * 3)
    const tmp = new THREE.Color()
    for (let i = 0; i < COUNT; i++) {
      const r = 7 + Math.random() * 8
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const x = r * Math.sin(phi) * Math.cos(theta)
      const y = r * Math.sin(phi) * Math.sin(theta)
      const z = r * Math.cos(phi)
      positions.set([x, y, z], i * 3)
      pts.push(new THREE.Vector3(x, y, z))
      const t = Math.random()
      tmp.copy(t < 0.5 ? BLEU_DARK : t < 0.82 ? BLEU_LIGHT : CYAN)
      colors.set([tmp.r, tmp.g, tmp.b], i * 3)
    }
    const pGeo = new THREE.BufferGeometry()
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    pGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    const sprite = makeGlowTexture()
    const pMat = new THREE.PointsMaterial({
      size: 0.28, map: sprite, vertexColors: true, transparent: true,
      depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.95,
    })
    group.add(new THREE.Points(pGeo, pMat))

    // ---- Constellation lines (computed once) ----
    const linePos = []
    const lineCol = []
    const MAX_DIST = 3.0
    const MAX_LINKS = 3
    for (let i = 0; i < COUNT; i++) {
      let links = 0
      for (let j = i + 1; j < COUNT && links < MAX_LINKS; j++) {
        if (pts[i].distanceTo(pts[j]) < MAX_DIST) {
          linePos.push(pts[i].x, pts[i].y, pts[i].z, pts[j].x, pts[j].y, pts[j].z)
          lineCol.push(BLEU_LIGHT.r, BLEU_LIGHT.g, BLEU_LIGHT.b, BLEU_DARK.r, BLEU_DARK.g, BLEU_DARK.b)
          links++
        }
      }
    }
    const lGeo = new THREE.BufferGeometry()
    lGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePos, 3))
    lGeo.setAttribute('color', new THREE.Float32BufferAttribute(lineCol, 3))
    const lMat = new THREE.LineBasicMaterial({
      vertexColors: true, transparent: true, opacity: 0.12,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })
    group.add(new THREE.LineSegments(lGeo, lMat))

    // ---- Glowing wireframe core ----
    const coreGeo = new THREE.IcosahedronGeometry(3.4, 1)
    const coreMat = new THREE.MeshStandardMaterial({
      color: BLEU_DARK, wireframe: true, emissive: BLEU_DARK, emissiveIntensity: 0.7,
      metalness: 0.5, roughness: 0.3, transparent: true, opacity: 0.5,
    })
    const core = new THREE.Mesh(coreGeo, coreMat)
    scene.add(core)

    const haloGeo = new THREE.IcosahedronGeometry(5.6, 0)
    const haloMat = new THREE.MeshBasicMaterial({ color: BLEU_LIGHT, wireframe: true, transparent: true, opacity: 0.1 })
    const halo = new THREE.Mesh(haloGeo, haloMat)
    scene.add(halo)

    // ---- Lights ----
    scene.add(new THREE.AmbientLight(0xffffff, 0.55))
    const l1 = new THREE.PointLight(dark ? 0x3b82f6 : 0x1e40af, 70, 70); l1.position.set(9, 6, 10); scene.add(l1)
    const l2 = new THREE.PointLight(dark ? 0x60a5fa : 0x2563eb, 70, 70); l2.position.set(-9, -5, 7); scene.add(l2)

    // ---- Interaction ----
    const target = { x: 0, y: 0 }, cur = { x: 0, y: 0 }
    const onPointer = (e) => {
      const rect = mount.getBoundingClientRect()
      target.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2
      target.y = ((e.clientY - rect.top) / rect.height - 0.5) * 2
    }
    window.addEventListener('pointermove', onPointer, { passive: true })

    const onResize = () => {
      const w = mount.clientWidth, h = mount.clientHeight
      camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    const clock = new THREE.Clock()
    let raf

    const renderFrame = () => {
      const t = clock.getElapsedTime()
      cur.x += (target.x - cur.x) * 0.045
      cur.y += (target.y - cur.y) * 0.045

      group.rotation.y = t * 0.035 + cur.x * 0.4
      group.rotation.x = cur.y * 0.22

      const breathe = 1 + Math.sin(t * 0.8) * 0.04
      core.scale.setScalar(breathe)
      core.rotation.x = t * 0.16 + cur.y * 0.3
      core.rotation.y = t * 0.2 + cur.x * 0.45
      halo.rotation.y = -t * 0.06
      halo.rotation.z = t * 0.04

      camera.position.x += (cur.x * 2.4 - camera.position.x) * 0.05
      camera.position.y += (-cur.y * 1.7 - camera.position.y) * 0.05
      camera.lookAt(0, 0, 0)

      renderer.render(scene, camera)
    }

    const animate = () => { renderFrame(); raf = requestAnimationFrame(animate) }
    if (reduced) renderFrame()
    else animate()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onPointer)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      pGeo.dispose(); pMat.dispose(); sprite.dispose()
      lGeo.dispose(); lMat.dispose()
      coreGeo.dispose(); coreMat.dispose(); haloGeo.dispose(); haloMat.dispose()
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
    }
  }, [dark])

  return <div ref={mountRef} className="absolute inset-0 -z-10" aria-hidden="true" />
}

function makeGlowTexture() {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.25, 'rgba(255,255,255,0.85)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}
