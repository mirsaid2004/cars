import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { PAINTS, SECTION, rig, useStore } from '../store'

const MODEL = '/models/car.glb'
const DRACO = '/draco/'
const WHEELS = ['wheel_fl', 'wheel_fr', 'wheel_rl', 'wheel_rr']
const TAU = Math.PI * 2

export default function Car() {
  const { scene } = useGLTF(MODEL, DRACO)
  const ao = useTexture('/models/car_ao.png')
  const group = useRef()
  const body = useRef()
  const angle = useRef(0)

  const mats = useMemo(() => {
    const paint = new THREE.MeshPhysicalMaterial({
      color: PAINTS[0].color,
      metalness: 0.85,
      roughness: 0.42,
      clearcoat: 1,
      clearcoatRoughness: 0.03,
      envMapIntensity: 1.25,
    })
    const glass = new THREE.MeshPhysicalMaterial({
      color: '#05070a',
      metalness: 1,
      roughness: 0,
      transparent: true,
      opacity: 0.82,
      envMapIntensity: 1.6,
    })
    const rim = new THREE.MeshStandardMaterial({ color: '#b9bcc4', metalness: 1, roughness: 0.22 })
    const trim = new THREE.MeshStandardMaterial({ color: '#0c0d10', metalness: 1, roughness: 0.35 })
    const head = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      emissive: '#dfeaff',
      emissiveIntensity: 0,
      toneMapped: false,
    })
    const tail = new THREE.MeshStandardMaterial({
      color: '#300000',
      emissive: '#ff1505',
      emissiveIntensity: 0,
      toneMapped: false,
    })
    return { paint, glass, rim, trim, head, tail }
  }, [])

  const wheels = useMemo(() => WHEELS.map((n) => scene.getObjectByName(n)).filter(Boolean), [scene])

  useLayoutEffect(() => {
    const apply = (name, material) => {
      const node = scene.getObjectByName(name)
      if (!node) return
      node.traverse((o) => {
        if (o.isMesh) o.material = material
      })
    }
    apply('body', mats.paint)
    apply('glass', mats.glass)
    apply('trim', mats.trim)
    ;['rim_fl', 'rim_fr', 'rim_rl', 'rim_rr'].forEach((n) => apply(n, mats.rim))
    apply('leds', mats.head)
    apply('lights_red', mats.tail)
    const main = scene.getObjectByName('main')
    if (main) body.current = { node: main, rx: main.rotation.x, y: main.position.y }
  }, [scene, mats])

  const target = useMemo(() => new THREE.Color(), [])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const t = state.clock.elapsedTime

    // paint
    target.set(PAINTS[useStore.getState().paint].color)
    mats.paint.color.lerp(target, 1 - Math.exp(-4 * dt))

    // lights ignite late in the opening shot
    const ignite = THREE.MathUtils.smoothstep(rig.intro, 0.35, 0.6)
    const flicker = rig.intro < 0.6 && rig.intro > 0.35 ? 0.6 + 0.4 * Math.sin(t * 60) : 1
    mats.head.emissiveIntensity = ignite * flicker * 5
    mats.tail.emissiveIntensity = ignite * (2.2 + rig.speed * 3)

    // speed — strongest in the performance chapter
    const want = THREE.MathUtils.clamp(1 - Math.abs(rig.scroll - SECTION.POWER) * 1.15, 0, 1)
    rig.speed = THREE.MathUtils.damp(rig.speed, want, 2.5, dt)
    const spin = rig.speed * 38 * dt
    for (const w of wheels) w.rotation.x -= spin

    // body squats and hums under power
    if (body.current) {
      const { node, rx, y } = body.current
      node.rotation.x = rx + rig.speed * 0.01 + Math.sin(t * 31) * 0.001 * rig.speed
      node.position.y = y + Math.sin(t * 43) * 0.003 * rig.speed
    }

    // turntable in the colour chapter, settles back to its mark elsewhere
    const inStudio = Math.abs(rig.scroll - SECTION.COLOUR) < 0.45
    if (inStudio) {
      angle.current += dt * 0.22 + rig.drag
    } else {
      const rest = Math.round(angle.current / TAU) * TAU
      angle.current = THREE.MathUtils.damp(angle.current, rest, 3, dt)
    }
    rig.drag = 0
    group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, angle.current, 6, dt)
  })

  return (
    <group ref={group}>
      {/* model ships nose-to-−Z; turn it so the nose is +Z */}
      <primitive object={scene} rotation-y={Math.PI} />
      <mesh rotation-x={-Math.PI / 2} position-y={0.004} renderOrder={2}>
        <planeGeometry args={[0.655 * 4, 1.3 * 4]} />
        <meshBasicMaterial
          map={ao}
          blending={THREE.MultiplyBlending}
          premultipliedAlpha
          transparent
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

useGLTF.preload(MODEL, DRACO)
