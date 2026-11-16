import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { rig } from '../store'

// One shot per chapter, described as an orbit around a look-at point so the
// camera always travels on arcs and never cuts through the bodywork.
//   az: degrees around the car (0 = nose-on)   el: degrees above the floor
//   sx / sy: frame offset (fraction of the viewport) to leave room for copy
export const SHOTS = [
  { t: [0, 0.75, 0], r: 8.2, az: 32, el: 5, fov: 30, sx: -0.07, sy: -0.07 }, //    hero
  { t: [0, 0.6, 0], r: 9, az: 90, el: 3, fov: 26, sx: -0.15, sy: 0.02 }, //  form — pure profile
  { t: [0, 0.55, -0.6], r: 6.4, az: 152, el: 7, fov: 36, sx: 0.17, sy: 0 }, // power — low rear quarter
  { t: [-0.86, 0.36, 1.32], r: 2.7, az: 292, el: 9, fov: 34, sx: 0.2, sy: 0 }, // craft — wheel macro
  { t: [0, 0.5, 0], r: 9, az: 396, el: 12, fov: 30, sx: -0.08, sy: 0.1 }, //     colour — turntable
  { t: [0, 0.6, 0], r: 11.5, az: 360, el: 2.5, fov: 26, sx: 0, sy: -0.2 }, //  reserve — nose-on
]

const KEYS = ['r', 'az', 'el', 'fov', 'sx', 'sy']
const DEG = Math.PI / 180
const ease = (x) => x * x * x * (x * (x * 6 - 15) + 10)
const lerp = THREE.MathUtils.lerp

const out = { t: new THREE.Vector3(), r: 0, az: 0, el: 0, fov: 0, sx: 0, sy: 0 }
const a = new THREE.Vector3()
const b = new THREE.Vector3()

function sample(p) {
  const max = SHOTS.length - 1
  const i = Math.min(Math.floor(p), max - 1)
  const k = ease(THREE.MathUtils.clamp(p - i, 0, 1))
  const A = SHOTS[i]
  const B = SHOTS[i + 1]
  out.t.lerpVectors(a.fromArray(A.t), b.fromArray(B.t), k)
  for (const key of KEYS) out[key] = lerp(A[key], B[key], k)
  // swing wide mid-move so transitions read as crane moves, not zooms
  out.r += Math.sin(k * Math.PI) * 1.4
  return out
}

export default function CameraRig() {
  const scroll = useRef(0)
  const look = useRef({ x: 0, y: 0 })

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const { camera, size, clock } = state
    const t = clock.elapsedTime

    scroll.current = THREE.MathUtils.damp(scroll.current, rig.scroll, 5, dt)
    const s = sample(scroll.current)

    // opening move: descend out of the dark and sweep onto the hero mark
    const k = 1 - rig.intro
    let r = s.r + k * 5
    let az = s.az - k * 105
    let el = s.el + k * 34
    let { sx, sy } = s

    // portrait screens: pull back, centre the car in the upper half
    const portrait = THREE.MathUtils.clamp((1.15 - size.width / size.height) / 0.6, 0, 1)
    r *= 1 + portrait * 0.95
    sx *= 1 - portrait
    sy = lerp(sy, 0.16, portrait)

    // breathing + pointer parallax + a touch of handheld under speed
    look.current.x = THREE.MathUtils.damp(look.current.x, rig.pointer.x, 2.5, dt)
    look.current.y = THREE.MathUtils.damp(look.current.y, rig.pointer.y, 2.5, dt)
    az += look.current.x * 3.5 + Math.sin(t * 0.21) * 1.4
    el += -look.current.y * 1.6 + Math.sin(t * 0.33) * 0.35
    const shake = rig.speed * 0.012
    const jx = (Math.sin(t * 37) + Math.sin(t * 23.3)) * shake
    const jy = (Math.sin(t * 41) + Math.sin(t * 29.7)) * shake

    const ce = Math.cos(el * DEG)
    camera.position.set(
      s.t.x + r * Math.sin(az * DEG) * ce,
      Math.max(0.12, s.t.y + r * Math.sin(el * DEG)),
      s.t.z + r * Math.cos(az * DEG) * ce
    )
    camera.lookAt(s.t.x + jx, s.t.y + jy, s.t.z)
    camera.fov = s.fov + rig.speed * 5
    camera.setViewOffset(size.width, size.height, sx * size.width, sy * size.height, size.width, size.height)
  })

  return null
}
