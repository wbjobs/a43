import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import AIEntity from './AIEntity'
import ParticleFlow from './ParticleFlow'

const STAR_COUNT = 500

function StarField() {
  const pointsRef = useRef<THREE.Points>(null!)

  const positions = useMemo(() => {
    const pos = new Float32Array(STAR_COUNT * 3)
    for (let i = 0; i < STAR_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20 - 5
    }
    return pos
  }, [])

  useFrame((state) => {
    if (!pointsRef.current) return
    pointsRef.current.rotation.y = state.clock.elapsedTime * 0.01
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={STAR_COUNT}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial color="#445566" size={0.05} transparent opacity={0.6} sizeAttenuation />
    </points>
  )
}

interface ConnectionLineProps {
  from: [number, number, number]
  to: [number, number, number]
  active: boolean
}

function ConnectionLine({ from, to, active }: ConnectionLineProps) {
  const midPoint = useMemo((): [number, number, number] => [
    (from[0] + to[0]) / 2,
    (from[1] + to[1]) / 2 + 2.5,
    (from[2] + to[2]) / 2,
  ], [from, to])

  const curve = useMemo(() => {
    return new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...from),
      new THREE.Vector3(...midPoint),
      new THREE.Vector3(...to),
    )
  }, [from, midPoint, to])

  const lineObj = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(64))
    const mat = new THREE.LineBasicMaterial({
      color: active ? '#00e5ff' : '#1a1a2e',
      transparent: true,
      opacity: active ? 0.4 : 0.15,
    })
    return new THREE.Line(geo, mat)
  }, [curve, active])

  return <primitive object={lineObj} />
}

interface Scene3DProps {
  phase: string
}

export default function Scene3D({ phase }: Scene3DProps) {
  const alicePos: [number, number, number] = [-4, 0, 0]
  const bobPos: [number, number, number] = [4, 0, 0]

  const aliceActive = phase === 'alice_computing' || phase === 'transmitting'
  const bobActive = phase === 'bob_computing' || phase === 'complete'
  const particlesActive = phase === 'transmitting'
  const bobReceiving = phase === 'transmitting'

  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight position={[5, 5, 5]} intensity={0.3} />

      <StarField />

      <AIEntity
        position={alicePos}
        color="#00e5ff"
        label="Alice"
        isActive={aliceActive}
        isReceiving={false}
      />

      <AIEntity
        position={bobPos}
        color="#39ff14"
        label="Bob"
        isActive={bobActive}
        isReceiving={bobReceiving}
      />

      <ConnectionLine from={alicePos} to={bobPos} active={phase !== 'idle'} />

      <ParticleFlow active={particlesActive} from={alicePos} to={bobPos} />
    </>
  )
}
