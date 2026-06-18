import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import gsap from 'gsap'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { Lensflare, LensflareElement } from 'three/examples/jsm/objects/Lensflare.js'
import { INTRO_CONFIG, markIntroPlayed } from './introConfig.js'
import { getCssColor, getQuaternionToFace, latLonToVector3 } from './utils/geo3d.js'
import {
  sunVertexShader,
  sunFragmentShader,
  coronaVertexShader,
  coronaFragmentShader,
} from './shaders/sunShaders.js'
import {
  atmosphereFragmentShader,
  atmosphereVertexShader,
  earthFragmentShader,
  earthVertexShader,
  nebulaFragmentShader,
  nebulaVertexShader,
} from './shaders/earthShaders.js'
import { VignetteShader } from './shaders/vignetteShader.js'

const GLOBE_RADIUS = 1.15

/** High-quality Earth texture set — bundled locally (no CDN / CORS dependency) */
const BASE = import.meta.env.BASE_URL || '/'
const EARTH_TEXTURES = {
  day: `${BASE}textures/earth-blue-marble.jpg`,      // 4K vibrant day map
  night: `${BASE}textures/earth_lights_2048.png`,    // city lights (night side)
  specular: `${BASE}textures/earth_specular_2048.jpg`, // ocean specular mask
  clouds: `${BASE}textures/earth_clouds_1024.png`,   // cloud layer
}

const BLOOM_STRENGTH = 0.5
const BLOOM_RADIUS = 0.85
const BLOOM_THRESHOLD = 0.4

function getGlobeSegments() {
  return typeof window !== 'undefined' && window.innerWidth < 768 ? 96 : 144
}

function makeGlowTexture(size = 128) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.18, 'rgba(255,255,255,0.85)')
  g.addColorStop(0.5, 'rgba(255,255,255,0.22)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/**
 * Full-screen Earth intro: spin → orient on Oujda → zoom → marker → fade out.
 * Overlay z-index 10000, blocks scroll, full cleanup on unmount.
 */
export default function IntroGlobe({ onComplete }) {
  const overlayRef = useRef(null)
  const canvasRef = useRef(null)
  const labelRef = useRef(null)
  const welcomeRef = useRef(null)

  useEffect(() => {
    const overlay = overlayRef.current
    const canvasHost = canvasRef.current
    const labelEl = labelRef.current
    if (!overlay || !canvasHost) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      gsap.to(overlay, {
        opacity: 0,
        duration: 0.35,
        ease: 'power2.out',
        onComplete: () => {
          markIntroPlayed()
          onComplete?.()
        },
      })
      return
    }

    document.body.style.overflow = 'hidden'

    const width = window.innerWidth
    const height = window.innerHeight

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x020208)

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 120)
    camera.position.set(0, 0, 4.8)

    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' })
    } catch (_) {
      gsap.to(overlay, {
        opacity: 0,
        duration: 0.4,
        onComplete: () => {
          document.body.style.overflow = ''
          markIntroPlayed()
          onComplete?.()
        },
      })
      return
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(width, height)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.12
    canvasHost.appendChild(renderer.domElement)

    // ---- Post-processing: bloom + vignette (cinematic glow on atmosphere) ----
    const composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, camera))
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      BLOOM_STRENGTH,
      BLOOM_RADIUS,
      BLOOM_THRESHOLD,
    )
    composer.addPass(bloomPass)
    const vignettePass = new ShaderPass(VignetteShader)
    composer.addPass(vignettePass)

    const rose = new THREE.Color(getCssColor('--rose', '#fb5575'))
    const violet = new THREE.Color(getCssColor('--violet', '#8a7bf5'))
    const cyan = new THREE.Color(getCssColor('--cyan', '#2dd4bf'))

    // ---- Nebula backdrop (soft cyan/teal gas cloud) ----
    const nebulaGeo = new THREE.PlaneGeometry(28, 18)
    const nebulaMat = new THREE.ShaderMaterial({
      vertexShader: nebulaVertexShader,
      fragmentShader: nebulaFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uColorA: { value: cyan.clone() },
        uColorB: { value: violet.clone() },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    const nebula = new THREE.Mesh(nebulaGeo, nebulaMat)
    nebula.position.set(-1.5, 0.2, -8)
    scene.add(nebula)

    // ---- Star field (denser, colour-varied, twinkling) ----
    const STAR_COUNT = 3400
    const starPos = new Float32Array(STAR_COUNT * 3)
    const starSizes = new Float32Array(STAR_COUNT)
    const starColors = new Float32Array(STAR_COUNT * 3)
    const cWhite = new THREE.Color(0xffffff)
    const cBlue = new THREE.Color(0x9fc4ff)
    const cWarm = new THREE.Color(0xffd9b0)
    const cTmp = new THREE.Color()
    for (let i = 0; i < STAR_COUNT; i++) {
      const r = 18 + Math.random() * 34
      const t = Math.random() * Math.PI * 2
      const p = Math.acos(2 * Math.random() - 1)
      starPos[i * 3] = r * Math.sin(p) * Math.cos(t)
      starPos[i * 3 + 1] = r * Math.sin(p) * Math.sin(t)
      starPos[i * 3 + 2] = r * Math.cos(p)
      // a few stars are noticeably larger/brighter
      starSizes[i] = Math.random() < 0.08 ? 1.8 + Math.random() * 1.8 : 0.3 + Math.random() * 1.0
      const k = Math.random()
      cTmp.copy(k < 0.7 ? cWhite : k < 0.85 ? cBlue : cWarm)
      starColors.set([cTmp.r, cTmp.g, cTmp.b], i * 3)
    }
    const starGeo = new THREE.BufferGeometry()
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
    starGeo.setAttribute('size', new THREE.BufferAttribute(starSizes, 1))
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3))
    const starSprite = makeGlowTexture(32)
    const starMat = new THREE.PointsMaterial({
      size: 0.2,
      map: starSprite,
      vertexColors: true,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    const stars = new THREE.Points(starGeo, starMat)
    scene.add(stars)

    // ---- Realistic sun: plasma disc + corona + lens flare ----
    const SUN_POS = new THREE.Vector3(-1.5, 0.9, 1.25)
    const sunGroup = new THREE.Group()
    sunGroup.position.copy(SUN_POS)
    scene.add(sunGroup)

    const sunCoreCol = new THREE.Color(0xfff4e0)
    const sunMidCol = new THREE.Color(0xffd27a)
    const sunEdgeCol = new THREE.Color(0xff7a2c)

    // Turbulent plasma surface
    const sunGeo = new THREE.SphereGeometry(0.3, 48, 48)
    const sunMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uCore: { value: sunCoreCol.clone() },
        uMid: { value: sunMidCol.clone() },
        uEdge: { value: sunEdgeCol.clone() },
      },
      vertexShader: sunVertexShader,
      fragmentShader: sunFragmentShader,
    })
    const sunDisc = new THREE.Mesh(sunGeo, sunMat)
    sunGroup.add(sunDisc)

    // Soft warm corona hugging the disc
    const coronaGeo = new THREE.SphereGeometry(0.56, 48, 48)
    const coronaMat = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(0xffd2ad) },
        uIntensity: { value: 1.0 },
      },
      vertexShader: coronaVertexShader,
      fragmentShader: coronaFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
    })
    const corona = new THREE.Mesh(coronaGeo, coronaMat)
    sunGroup.add(corona)

    // Wide soft halo sprite
    const sunHaloTex = makeGlowTexture(256)
    const sunHalo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: sunHaloTex,
        color: 0xffdfc4,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: 0.7,
      }),
    )
    sunHalo.scale.set(2.5, 2.5, 1)
    sunGroup.add(sunHalo)

    // Lens flare (modern, realistic) — loaded async, added when ready
    const flareLoader = new THREE.TextureLoader()
    let lensflare = null
    let flareTex0 = null
    let flareTex3 = null
    const loadFlare = (url) =>
      new Promise((resolve) => flareLoader.load(url, resolve, undefined, () => resolve(null)))
    Promise.all([
      loadFlare(`${BASE}textures/lensflare0.png`),
      loadFlare(`${BASE}textures/lensflare3.png`),
    ]).then(([tex0, tex3]) => {
      flareTex0 = tex0
      flareTex3 = tex3
      if (!tex0) return
      lensflare = new Lensflare()
      lensflare.addElement(new LensflareElement(tex0, 520, 0, new THREE.Color(0xffe7c4)))
      if (tex3) {
        lensflare.addElement(new LensflareElement(tex3, 60, 0.6))
        lensflare.addElement(new LensflareElement(tex3, 70, 0.75))
        lensflare.addElement(new LensflareElement(tex3, 120, 0.9))
        lensflare.addElement(new LensflareElement(tex3, 70, 1.0))
      }
      sunGroup.add(lensflare)
    })

    // ---- Earth group ----
    const earthGroup = new THREE.Group()
    earthGroup.scale.setScalar(0.01)
    scene.add(earthGroup)

    const disposables = []
    let earthMat

    const globeGeo = new THREE.SphereGeometry(GLOBE_RADIUS, getGlobeSegments(), getGlobeSegments())
    disposables.push(globeGeo)

    const loader = new THREE.TextureLoader()
    const maxAniso = renderer.capabilities.getMaxAnisotropy()

    const loadTex = (url) =>
      new Promise((resolve, reject) => {
        loader.load(url, resolve, undefined, reject)
      })

    const tuneTexture = (tex, { color = true } = {}) => {
      if (color) tex.colorSpace = THREE.SRGBColorSpace
      tex.anisotropy = maxAniso
      tex.minFilter = THREE.LinearMipmapLinearFilter
      tex.magFilter = THREE.LinearFilter
      tex.generateMipmaps = true
      return tex
    }

    const buildFallbackGlobe = () => {
      const mat = new THREE.MeshStandardMaterial({
        color: 0x0a0b14,
        emissive: violet,
        emissiveIntensity: 0.12,
        metalness: 0.35,
        roughness: 0.85,
        wireframe: true,
        transparent: true,
        opacity: 0.92,
      })
      const earthMesh = new THREE.Mesh(globeGeo, mat)
      earthGroup.add(earthMesh)
      disposables.push(mat)
    }

    const buildCinematicGlobe = (dayMap, nightMap, specularMap, cloudsMap) => {
      tuneTexture(dayMap)
      tuneTexture(nightMap)
      tuneTexture(specularMap, { color: false })
      tuneTexture(cloudsMap)

      // Custom shader: day/night terminator + ocean specular
      earthMat = new THREE.ShaderMaterial({
        uniforms: {
          uDayMap: { value: dayMap },
          uNightMap: { value: nightMap },
          uSpecularMap: { value: specularMap },
          uSunDir: { value: new THREE.Vector3(-1, 0.15, 0.35).normalize() },
          uNightBoost: { value: 2.2 },
        },
        vertexShader: earthVertexShader,
        fragmentShader: earthFragmentShader,
      })
      const earthMesh = new THREE.Mesh(globeGeo, earthMat)
      earthGroup.add(earthMesh)

      const segs = getGlobeSegments()
      const cloudGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.012, segs, segs)
      const cloudMat = new THREE.MeshPhongMaterial({
        map: cloudsMap,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
        blending: THREE.NormalBlending,
      })
      const clouds = new THREE.Mesh(cloudGeo, cloudMat)
      clouds.name = 'clouds'
      earthGroup.add(clouds)
      disposables.push(cloudGeo, cloudMat, dayMap, nightMap, specularMap, cloudsMap, earthMat)
    }

    // ---- Dual-layer atmosphere (inner cyan + outer violet haze) ----
    const makeAtmosphere = (scale, inner, outer, intensity, power) => {
      const geo = new THREE.SphereGeometry(GLOBE_RADIUS * scale, 80, 80)
      const mat = new THREE.ShaderMaterial({
        vertexShader: atmosphereVertexShader,
        fragmentShader: atmosphereFragmentShader,
        uniforms: {
          uColorInner: { value: inner },
          uColorOuter: { value: outer },
          uIntensity: { value: intensity },
          uPower: { value: power },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
      })
      const mesh = new THREE.Mesh(geo, mat)
      earthGroup.add(mesh)
      disposables.push(geo, mat)
      return mat
    }

    makeAtmosphere(
      1.025,
      cyan.clone(),
      new THREE.Color(0xbff0ff),
      INTRO_CONFIG.atmosphereIntensity * 0.8,
      2.1,
    )
    makeAtmosphere(
      1.14,
      violet.clone().lerp(cyan, 0.55),
      cyan.clone(),
      INTRO_CONFIG.atmosphereIntensity * 0.26,
      3.2,
    )

    // ---- Oujda marker ----
    const markerPos = latLonToVector3(INTRO_CONFIG.lat, INTRO_CONFIG.lon, GLOBE_RADIUS * 1.004)
    const markerGroup = new THREE.Group()
    markerGroup.position.copy(markerPos)
    markerGroup.visible = false
    earthGroup.add(markerGroup)

    const markerCore = new THREE.Mesh(
      new THREE.SphereGeometry(0.028, 16, 16),
      new THREE.MeshBasicMaterial({ color: rose }),
    )
    markerGroup.add(markerCore)

    const rings = []
    const surfaceNormal = markerPos.clone().normalize()
    const ringQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), surfaceNormal)
    for (let i = 0; i < 3; i++) {
      const ringGeo = new THREE.RingGeometry(0.04 + i * 0.02, 0.048 + i * 0.02, 32)
      const ringMat = new THREE.MeshBasicMaterial({
        color: rose,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
      const ring = new THREE.Mesh(ringGeo, ringMat)
      ring.quaternion.copy(ringQuat)
      markerGroup.add(ring)
      rings.push({ mesh: ring, mat: ringMat, geo: ringGeo, phase: i * 0.33 })
      disposables.push(ringGeo, ringMat)
    }
    disposables.push(markerCore.geometry, markerCore.material)

    // ---- Cinematic lighting: sun front-left so the visible face is bright (reference-style) ----
    scene.add(new THREE.AmbientLight(0x10162a, 0.4))
    const sun = new THREE.DirectionalLight(0xfff4e8, 2.6)
    sun.position.set(-3.6, 1.5, 6.5)
    scene.add(sun)
    const fill = new THREE.DirectionalLight(0x5b7fbf, 0.3)
    fill.position.set(3, -2, 4)
    scene.add(fill)

    const sunDir = new THREE.Vector3()
    const updateSunDir = () => {
      sunDir.copy(sun.position).normalize()
      if (earthMat) earthMat.uniforms.uSunDir.value.copy(sunDir)
    }
    updateSunDir()

    // Animation state
    const targetQuat = getQuaternionToFace(INTRO_CONFIG.lat, INTRO_CONFIG.lon)
    const spinQuat = new THREE.Quaternion()
    const orientQuat = new THREE.Quaternion()
    const camState = { z: 4.8 }
    let spinAngle = 0
    let orientT = 0
    let markerVisible = false
    let labelVisible = false
    let clock = new THREE.Clock()
    let raf = 0
    let timeline = null
    let alive = true

    const markerWorld = new THREE.Vector3()
    const labelScreen = new THREE.Vector3()

    const updateLabelPosition = () => {
      if (!labelEl || !labelVisible) return
      markerGroup.getWorldPosition(markerWorld)
      markerWorld.add(surfaceNormal.clone().multiplyScalar(0.22))
      labelScreen.copy(markerWorld).project(camera)
      const x = (labelScreen.x * 0.5 + 0.5) * width
      const y = (-labelScreen.y * 0.5 + 0.5) * height
      labelEl.style.left = `${x + 18}px`
      labelEl.style.top = `${y - 10}px`
    }

    const pulseRings = (t) => {
      rings.forEach(({ mesh, mat, phase }) => {
        const cycle = ((t * 0.9 + phase) % 1)
        const scale = 1 + cycle * 2.8
        mesh.scale.setScalar(scale)
        mat.opacity = (1 - cycle) * 0.55
      })
    }

    const renderFrame = () => {
      const t = clock.getElapsedTime()

      nebulaMat.uniforms.uTime.value = t
      sunMat.uniforms.uTime.value = t
      stars.rotation.y = t * 0.006
      // subtle global twinkle (size pulse) that doesn't fight the fade
      starMat.size = 0.2 + Math.sin(t * 1.8) * 0.012
      sunGroup.position.y = SUN_POS.y + Math.sin(t * 0.6) * 0.05

      const clouds = earthGroup.getObjectByName('clouds')
      if (clouds) clouds.rotation.y = t * 0.012

      if (!markerVisible) {
        spinQuat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), spinAngle)
        orientQuat.slerpQuaternions(spinQuat, targetQuat, orientT)
        earthGroup.quaternion.copy(orientQuat)
      } else {
        earthGroup.quaternion.copy(targetQuat)
        pulseRings(t)
      }

      updateSunDir()
      camera.position.z = camState.z
      camera.lookAt(0, 0, 0)
      updateLabelPosition()
      composer.render()
    }

    const animate = () => {
      renderFrame()
      raf = requestAnimationFrame(animate)
    }

    const startTimeline = () => {
      const welcomeEl = welcomeRef.current
      const welcomeParts = welcomeEl?.querySelectorAll('.intro-welcome-part')

      timeline = gsap.timeline({
        onComplete: () => {
          cancelAnimationFrame(raf)
          document.body.style.overflow = ''
          markIntroPlayed()
          onComplete?.()
        },
      })

      // 1 — Stars + globe entrance
      timeline.to(starMat, { opacity: 0.95, duration: 0.7, ease: 'power2.out' }, 0)
      timeline.to(
        earthGroup.scale,
        { x: 1, y: 1, z: 1, duration: 1.1, ease: 'expo.out' },
        0.15,
      )

      // Welcome text — staggered professional entrance
      if (welcomeParts?.length) {
        gsap.set(welcomeParts, { opacity: 0, y: 28 })
        timeline.to(welcomeParts, {
          opacity: 1,
          y: 0,
          duration: 0.85,
          stagger: 0.12,
          ease: 'power3.out',
        }, 0.35)
        timeline.to(welcomeParts, {
          opacity: 0,
          y: -18,
          duration: 0.65,
          stagger: 0.06,
          ease: 'power2.in',
        }, 0.5 + INTRO_CONFIG.spinDuration + 0.35)
      }

      // 2 — Slow spin
      timeline.to(
        { angle: 0 },
        {
          angle: Math.PI * 1.6,
          duration: INTRO_CONFIG.spinDuration,
          ease: 'none',
          onUpdate() {
            spinAngle = this.targets()[0].angle
          },
        },
        0.5,
      )

      // 3 — Reorient toward Oujda
      timeline.to(
        { t: 0 },
        {
          t: 1,
          duration: INTRO_CONFIG.rotateDuration,
          ease: 'power3.inOut',
          onUpdate() {
            orientT = this.targets()[0].t
          },
        },
        0.5 + INTRO_CONFIG.spinDuration - 0.15,
      )

      // 4 — Camera zoom
      timeline.to(
        camState,
        { z: 1.95, duration: INTRO_CONFIG.zoomDuration, ease: 'power3.inOut' },
        0.5 + INTRO_CONFIG.spinDuration + INTRO_CONFIG.rotateDuration - 0.35,
      )

      // 5 — Marker appears
      timeline.call(() => {
        markerVisible = true
        markerGroup.visible = true
      }, null, 0.5 + INTRO_CONFIG.spinDuration + INTRO_CONFIG.rotateDuration + INTRO_CONFIG.zoomDuration - 0.2)

      timeline.fromTo(
        markerCore.scale,
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 1, z: 1, duration: 0.45, ease: 'back.out(2)' },
        0.5 + INTRO_CONFIG.spinDuration + INTRO_CONFIG.rotateDuration + INTRO_CONFIG.zoomDuration - 0.15,
      )

      // 6 — Label
      timeline.call(() => {
        labelVisible = true
        if (labelEl) {
          labelEl.style.opacity = '1'
          labelEl.style.transform = 'translateY(0)'
          labelEl.style.clipPath = 'inset(0 0 0 0)'
        }
      }, null, 0.5 + INTRO_CONFIG.spinDuration + INTRO_CONFIG.rotateDuration + INTRO_CONFIG.zoomDuration + 0.25)

      // 7 — Pause on marker
      timeline.to({}, { duration: INTRO_CONFIG.markerPause })

      // 8 — Exit: zoom through + fade overlay
      const exitStart =
        0.5 +
        INTRO_CONFIG.spinDuration +
        INTRO_CONFIG.rotateDuration +
        INTRO_CONFIG.zoomDuration +
        0.25 +
        INTRO_CONFIG.markerPause +
        0.15

      timeline.to(
        camState,
        { z: 0.55, duration: INTRO_CONFIG.exitDuration, ease: 'power3.in' },
        exitStart,
      )
      timeline.to(
        overlay,
        { opacity: 0, duration: INTRO_CONFIG.exitDuration, ease: 'power2.inOut' },
        exitStart,
      )
      timeline.to(
        earthGroup.scale,
        { x: 1.35, y: 1.35, z: 1.35, duration: INTRO_CONFIG.exitDuration, ease: 'power3.in' },
        exitStart,
      )
      timeline.to(starMat, { opacity: 0, duration: INTRO_CONFIG.exitDuration * 0.8 }, exitStart)
    }

    // Load textures then start
    Promise.all([
      loadTex(EARTH_TEXTURES.day),
      loadTex(EARTH_TEXTURES.night),
      loadTex(EARTH_TEXTURES.specular),
      loadTex(EARTH_TEXTURES.clouds),
    ])
      .then(([dayMap, nightMap, specularMap, cloudsMap]) => {
        if (!alive || !canvasHost.contains(renderer.domElement)) return
        buildCinematicGlobe(dayMap, nightMap, specularMap, cloudsMap)
        animate()
        startTimeline()
      })
      .catch(() => {
        if (!alive || !canvasHost.contains(renderer.domElement)) return
        buildFallbackGlobe()
        animate()
        startTimeline()
      })

    const onResize = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
      composer.setSize(w, h)
      bloomPass.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    return () => {
      alive = false
      cancelAnimationFrame(raf)
      timeline?.kill()
      window.removeEventListener('resize', onResize)
      document.body.style.overflow = ''

      renderer.dispose()
      composer.dispose()
      sunHaloTex.dispose()
      sunGeo.dispose()
      sunMat.dispose()
      coronaGeo.dispose()
      coronaMat.dispose()
      sunHalo.material.dispose()
      lensflare?.dispose?.()
      flareTex0?.dispose?.()
      flareTex3?.dispose?.()
      starSprite.dispose()
      disposables.forEach((d) => d?.dispose?.())
      nebulaGeo.dispose()
      nebulaMat.dispose()
      starGeo.dispose()
      starMat.dispose()

      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement)
      }
    }
  }, [onComplete])

  return (
    <div
      ref={overlayRef}
      className="intro-globe-overlay fixed inset-0 z-[10000] overflow-hidden"
      style={{ background: 'var(--bg, #040406)' }}
      aria-hidden="true"
    >
      <div ref={canvasRef} className="absolute inset-0" />

      {/* Welcome — fades out as globe orients toward Oujda */}
      <div
        ref={welcomeRef}
        className="intro-welcome absolute inset-x-0 top-[10vh] md:top-[12vh] z-10 flex flex-col items-center text-center px-6 pointer-events-none"
      >
        <p
          className="intro-welcome-part eyebrow mb-4 md:mb-5"
          style={{ letterSpacing: '0.38em', color: 'var(--text-soft)' }}
        >
          {INTRO_CONFIG.welcomeEyebrow}
        </p>
        <h1 className="intro-welcome-part font-display font-bold text-[2.2rem] sm:text-5xl md:text-6xl leading-[1.05] tracking-tight max-w-3xl">
          {INTRO_CONFIG.welcomeTitle.split(' ').map((word, i, arr) => (
            <span key={word}>
              {i === arr.length - 1 ? (
                <span className="gradient-text">{word}</span>
              ) : (
                <>{word} </>
              )}
            </span>
          ))}
        </h1>
        <p
          className="intro-welcome-part font-mono-ui text-xs sm:text-sm mt-4 md:mt-5 max-w-md"
          style={{ color: 'var(--text-soft)' }}
        >
          {INTRO_CONFIG.welcomeSubtitle}
        </p>
        <span
          className="intro-welcome-part mt-6 md:mt-8 inline-block h-px w-16"
          style={{ background: 'linear-gradient(90deg, transparent, var(--rose), var(--violet), transparent)' }}
          aria-hidden="true"
        />
      </div>

      <div
        ref={labelRef}
        className="intro-globe-label pointer-events-none absolute font-display text-sm md:text-base font-semibold tracking-wide"
        style={{
          opacity: 0,
          transform: 'translateY(12px)',
          clipPath: 'inset(0 0 100% 0)',
          transition: 'opacity 0.55s ease, transform 0.55s ease, clip-path 0.55s ease',
          color: 'var(--text, #eceefb)',
        }}
      >
        <span
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{
            background: 'color-mix(in srgb, var(--rose, #fb5575) 18%, transparent)',
            border: '1px solid color-mix(in srgb, var(--rose, #fb5575) 40%, transparent)',
            boxShadow: '0 0 24px color-mix(in srgb, var(--rose, #fb5575) 35%, transparent)',
          }}
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: 'var(--rose, #fb5575)', boxShadow: '0 0 8px var(--rose, #fb5575)' }}
          />
          {INTRO_CONFIG.label}
        </span>
      </div>
    </div>
  )
}

export { shouldPlayIntro } from './introConfig.js'
