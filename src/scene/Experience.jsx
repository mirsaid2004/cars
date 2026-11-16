import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { Bloom, ChromaticAberration, EffectComposer, Noise, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'
import anton from '@fontsource/anton/files/anton-latin-400-normal.woff?url'
import Car from './Car'
import Studio from './Studio'
import CameraRig, { SHOTS } from './CameraRig'
import { PAINTS, rig, useStore } from '../store'

const BG = '#050609'

// Monolithic wordmark standing on the floor behind the car in the hero shot.
function Wordmark() {
  const ref = useRef()
  const { size } = useThree()
  const az = (SHOTS[0].az * Math.PI) / 180
  const dist = 6.5
  const scale = Math.min(1, (size.width / size.height) * 0.62)

  useFrame(() => {
    const k = THREE.MathUtils.smoothstep(rig.intro, 0.45, 0.95) * (1 - THREE.MathUtils.smoothstep(rig.scroll, 0.05, 0.55))
    ref.current.fillOpacity = k
    ref.current.visible = k > 0.002
  })

  return (
    <Text
      ref={ref}
      font={anton}
      fontSize={2.7 * scale}
      letterSpacing={0.02}
      anchorY="bottom"
      position={[-Math.sin(az) * dist, 1.0 * scale, -Math.cos(az) * dist]}
      rotation-y={az}
      color="#8d8a86"
      fillOpacity={0}
    >
      M_DEV
    </Text>
  )
}

// Streaks of light rushing past the car in the performance chapter.
function SpeedLines({ count = 140 }) {
  const ref = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const color = useMemo(() => new THREE.Color(), [])
  const seeds = useMemo(
    () =>
      Array.from({ length: count }, () => {
        const side = Math.random() < 0.5 ? -1 : 1
        return {
          x: side * (1.5 + Math.random() ** 1.6 * 7),
          y: 0.06 + Math.random() ** 2 * 2.6,
          z: (Math.random() - 0.5) * 60,
          v: 0.6 + Math.random() * 0.8,
          len: 0.8 + Math.random() * 3.2,
        }
      }),
    [count]
  )

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const mesh = ref.current
    const s = rig.speed
    mesh.visible = s > 0.01
    if (!mesh.visible) return
    for (let i = 0; i < count; i++) {
      const p = seeds[i]
      p.z -= dt * 62 * p.v * s
      if (p.z < -30) p.z += 60
      dummy.position.set(p.x, p.y, p.z)
      dummy.scale.set(1, 1, p.len * (0.2 + s * 1.6))
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
    color.set(PAINTS[useStore.getState().paint].accent).lerp(new THREE.Color('#ffffff'), 0.35)
    mesh.material.color.copy(color).multiplyScalar(2.2)
    mesh.material.opacity = s * 0.85
  })

  return (
    <instancedMesh ref={ref} args={[null, null, count]} frustumCulled={false}>
      <boxGeometry args={[0.012, 0.012, 1]} />
      <meshBasicMaterial transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
    </instancedMesh>
  )
}

export default function Experience() {
  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      camera={{ fov: 30, near: 0.1, far: 120, position: [6, 6, 14] }}
    >
      <color attach="background" args={[BG]} />
      <fog attach="fog" args={[BG, 11, 34]} />

      <Suspense fallback={null}>
        <Car />
        <Studio />
        <Wordmark />
      </Suspense>
      <SpeedLines />
      <CameraRig />

      <EffectComposer multisampling={4}>
        <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.2} intensity={0.85} radius={0.75} />
        <ChromaticAberration offset={[0.0005, 0.0005]} />
        <Vignette offset={0.22} darkness={0.82} />
        <Noise opacity={0.03} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </Canvas>
  )
}
