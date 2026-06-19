import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface ParticleFlowProps {
  active: boolean
  from: [number, number, number]
  to: [number, number, number]
  colorOverride?: string
}

const PARTICLE_COUNT = 400

export default function ParticleFlow({ active, from, to, colorOverride }: ParticleFlowProps) {
  const pointsRef = useRef<THREE.Points>(null!)
  const particlesRef = useRef<{ t: number; speed: number }[]>([])
  const intensityRef = useRef(0)

  const midPoint = useMemo((): [number, number, number] => [
    (from[0] + to[0]) / 2,
    (from[1] + to[1]) / 2 + 2.2,
    (from[2] + to[2]) / 2,
  ], [from, to])

  const curve = useMemo(() => {
    return new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...from),
      new THREE.Vector3(...midPoint),
      new THREE.Vector3(...to),
    )
  }, [from, midPoint, to])

  const positions = useMemo(() => {
    const arr = new Float32Array(PARTICLE_COUNT * 3)
    const particles: { t: number; speed: number }[] = []
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        t: Math.random(),
        speed: 0.15 + Math.random() * 0.2,
      })
      arr[i * 3] = 0
      arr[i * 3 + 1] = -100
      arr[i * 3 + 2] = 0
    }
    particlesRef.current = particles
    return arr
  }, [])

  const colors = useMemo(() => new Float32Array(PARTICLE_COUNT * 3), [])

  useFrame((_, delta) => {
    if (!pointsRef.current) return

    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute
    const colAttr = pointsRef.current.geometry.attributes.color as THREE.BufferAttribute

    if (active) {
      intensityRef.current = Math.min(1, intensityRef.current + delta * 1.5)
    } else {
      intensityRef.current = Math.max(0, intensityRef.current - delta * 2)
      if (intensityRef.current <= 0) {
        pointsRef.current.visible = false
        return
      }
    }

    pointsRef.current.visible = true

    const startColor = colorOverride ? new THREE.Color(colorOverride) : new THREE.Color('#00e5ff')
    const endColor = colorOverride ? new THREE.Color(colorOverride) : new THREE.Color('#39ff14')
    const tmpColor = new THREE.Color()
    const tmpVec = new THREE.Vector3()
    const particles = particlesRef.current
    const intensity = intensityRef.current

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = particles[i]

      if (active) {
        p.t += delta * p.speed
        if (p.t > 1) {
          p.t = p.t - 1
        }
      }

      const t = p.t

      if (t > intensity) {
        posAttr.setXYZ(i, 0, -100, 0)
        continue
      }

      curve.getPointAt(t, tmpVec)

      const spread = 0.08 + t * 0.08
      const nx = (Math.random() - 0.5) * spread
      const ny = (Math.random() - 0.5) * spread
      const nz = (Math.random() - 0.5) * spread

      posAttr.setXYZ(i, tmpVec.x + nx, tmpVec.y + ny, tmpVec.z + nz)

      tmpColor.copy(startColor).lerp(endColor, t)

      const alpha = Math.min(1, t * 4) * Math.min(1, (1 - t) * 3) * intensity
      colAttr.setXYZ(i, tmpColor.r * alpha, tmpColor.g * alpha, tmpColor.b * alpha)
    }

    posAttr.needsUpdate = true
    colAttr.needsUpdate = true
  })

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return geo
  }, [positions, colors])

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.2}
        vertexColors
        transparent
        opacity={1}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}
