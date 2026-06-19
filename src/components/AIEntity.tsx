import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface AIEntityProps {
  position: [number, number, number]
  color: string
  label: string
  isActive: boolean
  isReceiving: boolean
}

export default function AIEntity({ position, color, label, isActive, isReceiving }: AIEntityProps) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const glowRef = useRef<THREE.Mesh>(null!)
  const ringRef = useRef<THREE.Mesh>(null!)
  const outerRingRef = useRef<THREE.Mesh>(null!)

  const colorObj = useMemo(() => new THREE.Color(color), [color])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.5
      meshRef.current.rotation.x = Math.sin(t * 0.3) * 0.1
      const scale = isActive ? 1.15 + Math.sin(t * 3) * 0.08 : 1.0
      meshRef.current.scale.setScalar(scale)
      const mat = meshRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = isActive ? 2.0 + Math.sin(t * 3) * 0.5 : 0.8
    }
    if (glowRef.current) {
      const glowScale = isActive ? 2.0 + Math.sin(t * 4) * 0.3 : 1.5
      glowRef.current.scale.setScalar(glowScale)
      const mat = glowRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = isActive ? 0.2 + Math.sin(t * 3) * 0.05 : 0.1
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.8
      ringRef.current.rotation.x = Math.PI / 2
      const mat = ringRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = isActive ? 0.7 + Math.sin(t * 2) * 0.2 : 0.3
    }
    if (outerRingRef.current) {
      outerRingRef.current.rotation.z = -t * 0.5
      outerRingRef.current.rotation.x = Math.PI / 2 + 0.3
      const mat = outerRingRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = isActive ? 0.4 : 0.15
    }
  })

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <octahedronGeometry args={[0.8, 0]} />
        <meshStandardMaterial
          color={colorObj}
          emissive={colorObj}
          emissiveIntensity={isActive ? 1.5 : 0.4}
          metalness={0.8}
          roughness={0.2}
          wireframe={false}
        />
      </mesh>

      <mesh ref={glowRef}>
        <sphereGeometry args={[0.9, 32, 32]} />
        <meshBasicMaterial
          color={colorObj}
          transparent
          opacity={0.08}
          side={THREE.BackSide}
        />
      </mesh>

      <mesh ref={ringRef}>
        <torusGeometry args={[1.2, 0.015, 16, 64]} />
        <meshBasicMaterial color={colorObj} transparent opacity={isActive ? 0.6 : 0.2} />
      </mesh>

      <mesh ref={outerRingRef}>
        <torusGeometry args={[1.5, 0.01, 16, 64]} />
        <meshBasicMaterial color={colorObj} transparent opacity={isActive ? 0.3 : 0.1} />
      </mesh>

      {isReceiving && (
        <mesh>
          <sphereGeometry args={[1.6, 32, 32]} />
          <meshBasicMaterial
            color={colorObj}
            transparent
            opacity={0.05}
            side={THREE.BackSide}
          />
        </mesh>
      )}

      <pointLight color={colorObj} intensity={isActive ? 4 : 1.5} distance={8} />
    </group>
  )
}
