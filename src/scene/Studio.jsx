import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Environment, Lightformer, MeshReflectorMaterial, Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import { PAINTS, rig, useStore } from '../store'

const STRIPS = 7
const GAP = 3.6

// The car is lit entirely by this animated light rig, rendered live into the
// environment map — the sweeping strips are what makes the paint feel alive.
function LightRig() {
  const strips = useRef()
  const accentA = useRef()
  const accentB = useRef()
  const offset = useRef(0)
  const color = useMemo(() => new THREE.Color(), [])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    offset.current = (offset.current + dt * (0.9 + rig.speed * 16)) % GAP
    strips.current.position.z = -offset.current

    const k = THREE.MathUtils.smoothstep(rig.intro, 0.05, 0.7)
    strips.current.children.forEach((m) => m.material.color.setScalar(3.2 * k))

    color.set(PAINTS[useStore.getState().paint].accent)
    accentA.current.material.color.lerp(color.clone().multiplyScalar(5 * k), 0.08)
    accentB.current.material.color.setRGB(0.25 * k, 0.75 * k, 1.6 * k).multiplyScalar(2.4)
  })

  return (
    <>
      <mesh scale={60}>
        <sphereGeometry args={[1, 32, 16]} />
        <meshBasicMaterial color="#06070b" side={THREE.BackSide} />
      </mesh>

      {/* soft ceiling */}
      <Lightformer intensity={0.55} rotation-x={Math.PI / 2} position={[0, 6, 0]} scale={[12, 14, 1]} />

      {/* travelling strips */}
      <group ref={strips}>
        {Array.from({ length: STRIPS }, (_, i) => (
          <mesh key={i} rotation-x={Math.PI / 2} position={[0, 4.2, (i - (STRIPS - 1) / 2) * GAP]} scale={[5.5, 0.55, 1]}>
            <planeGeometry />
            <meshBasicMaterial side={THREE.DoubleSide} toneMapped={false} />
          </mesh>
        ))}
      </group>

      {/* warm key on one flank, cold kicker on the other */}
      <mesh ref={accentA} rotation-y={Math.PI / 2} position={[-7, 1.4, 1]} scale={[14, 1.1, 1]}>
        <planeGeometry />
        <meshBasicMaterial side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <mesh ref={accentB} rotation-y={-Math.PI / 2} position={[7, 1.8, -2]} scale={[16, 0.7, 1]}>
        <planeGeometry />
        <meshBasicMaterial side={THREE.DoubleSide} toneMapped={false} />
      </mesh>

      <Lightformer form="ring" intensity={1.6} position={[0, 3, 12]} scale={5} rotation-y={Math.PI} />
      <Lightformer form="ring" intensity={1.2} position={[0, 3, -12]} scale={5} />
    </>
  )
}

export default function Studio() {
  return (
    <>
      <Environment resolution={256} frames={Infinity} background={false}>
        <LightRig />
      </Environment>

      <mesh rotation-x={-Math.PI / 2} position-y={0}>
        <circleGeometry args={[60, 64]} />
        <MeshReflectorMaterial
          resolution={1024}
          blur={[420, 120]}
          mixBlur={1}
          mixStrength={55}
          mixContrast={1}
          roughness={0.85}
          depthScale={1.1}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.3}
          color="#07080b"
          metalness={0.7}
        />
      </mesh>

      <Sparkles count={90} scale={[16, 4, 16]} position-y={2.2} size={1.6} speed={0.25} opacity={0.35} color="#cfd8ff" />
    </>
  )
}
