import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import Scene3D from './Scene3D'

interface SceneCanvasProps {
  phase: string
}

export default function SceneCanvas({ phase }: SceneCanvasProps) {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 2.5, 11], fov: 55 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#07070d' }}
      >
        <Suspense fallback={null}>
          <color attach="background" args={['#07070d']} />
          <fog attach="fog" args={['#07070d', 15, 30]} />
          <Scene3D phase={phase} />
          <OrbitControls
            enablePan={false}
            enableZoom={true}
            minDistance={6}
            maxDistance={18}
            autoRotate
            autoRotateSpeed={0.2}
            maxPolarAngle={Math.PI / 1.8}
            minPolarAngle={Math.PI / 5}
          />
          <EffectComposer multisampling={0}>
            <Bloom
              intensity={0.8}
              luminanceThreshold={0.15}
              luminanceSmoothing={0.7}
              mipmapBlur
            />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  )
}
