"use client"

import { useRef, useMemo } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Float, Environment } from "@react-three/drei"
import * as THREE from "three"

function Wing({ 
  side, 
  mousePos 
}: { 
  side: "left" | "right"
  mousePos: React.MutableRefObject<{ x: number; y: number }>
}) {
  const wingRef = useRef<THREE.Group>(null)
  const timeRef = useRef(0)
  
  const featherCount = 12
  const feathers = useMemo(() => {
    const items = []
    for (let i = 0; i < featherCount; i++) {
      const angle = (i / featherCount) * Math.PI * 0.6 - Math.PI * 0.3
      const length = 1.5 + Math.sin((i / featherCount) * Math.PI) * 1.5
      const offset = i * 0.08
      items.push({ angle, length, offset, index: i })
    }
    return items
  }, [])

  useFrame((state, delta) => {
    if (!wingRef.current) return
    timeRef.current += delta
    
    const breathe = Math.sin(timeRef.current * 1.2) * 0.08
    const breatheScale = 1 + Math.sin(timeRef.current * 1.2) * 0.05
    
    const targetRotationY = mousePos.current.x * 0.3 * (side === "left" ? 1 : -1)
    const targetRotationX = mousePos.current.y * 0.15
    
    wingRef.current.rotation.y = THREE.MathUtils.lerp(
      wingRef.current.rotation.y,
      targetRotationY + breathe * (side === "left" ? 1 : -1),
      0.05
    )
    wingRef.current.rotation.x = THREE.MathUtils.lerp(
      wingRef.current.rotation.x,
      targetRotationX,
      0.05
    )
    wingRef.current.scale.setScalar(breatheScale)
  })

  const direction = side === "left" ? -1 : 1

  return (
    <group 
      ref={wingRef} 
      position={[direction * 0.3, 0, 0]}
      rotation={[0, direction * 0.4, 0]}
    >
      {feathers.map(({ angle, length, offset, index }) => (
        <Feather
          key={index}
          position={[
            direction * (0.2 + index * 0.15),
            Math.sin(angle) * 0.3 + offset * 0.5 - 1,
            Math.cos(angle) * 0.1
          ]}
          rotation={[0, 0, direction * (angle + Math.PI * 0.1)]}
          length={length}
          index={index}
          side={side}
        />
      ))}
      {/* Wing base glow */}
      <mesh position={[direction * 0.5, 0, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={0.5}
          transparent
          opacity={0.3}
        />
      </mesh>
    </group>
  )
}

function Feather({ 
  position, 
  rotation, 
  length, 
  index,
  side
}: { 
  position: [number, number, number]
  rotation: [number, number, number]
  length: number
  index: number
  side: "left" | "right"
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const timeOffset = index * 0.3
  
  useFrame((state) => {
    if (!meshRef.current) return
    const time = state.clock.elapsedTime
    const wave = Math.sin(time * 2 + timeOffset) * 0.05
    meshRef.current.rotation.z = rotation[2] + wave * (side === "left" ? 1 : -1)
  })

  const featherShape = useMemo(() => {
    const shape = new THREE.Shape()
    const w = 0.08
    const h = length
    
    shape.moveTo(0, 0)
    shape.quadraticCurveTo(w * 1.5, h * 0.3, w, h * 0.5)
    shape.quadraticCurveTo(w * 0.8, h * 0.8, 0, h)
    shape.quadraticCurveTo(-w * 0.8, h * 0.8, -w, h * 0.5)
    shape.quadraticCurveTo(-w * 1.5, h * 0.3, 0, 0)
    
    return shape
  }, [length])

  return (
    <mesh ref={meshRef} position={position} rotation={rotation}>
      <shapeGeometry args={[featherShape]} />
      <meshStandardMaterial
        color="#e8e8e8"
        emissive="#ffffff"
        emissiveIntensity={0.4 + (index * 0.05)}
        side={THREE.DoubleSide}
        transparent
        opacity={0.9}
        metalness={0.8}
        roughness={0.2}
      />
    </mesh>
  )
}

function GlowOrbs() {
  const groupRef = useRef<THREE.Group>(null)
  
  useFrame((state) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.1
  })

  return (
    <group ref={groupRef}>
      {[...Array(8)].map((_, i) => {
        const angle = (i / 8) * Math.PI * 2
        const radius = 3 + Math.random() * 1
        return (
          <mesh 
            key={i} 
            position={[
              Math.cos(angle) * radius,
              Math.sin(i * 0.5) * 0.5,
              Math.sin(angle) * radius
            ]}
          >
            <sphereGeometry args={[0.05 + Math.random() * 0.05, 8, 8]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#ffffff"
              emissiveIntensity={2}
              transparent
              opacity={0.6}
            />
          </mesh>
        )
      })}
    </group>
  )
}

function BackgroundGlow() {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (!meshRef.current) return
    const material = meshRef.current.material as THREE.MeshStandardMaterial
    material.emissiveIntensity = 0.8 + Math.sin(state.clock.elapsedTime * 1.5) * 0.3
  })

  return (
    <mesh ref={meshRef} position={[0, 0, -2]}>
      <circleGeometry args={[3, 64]} />
      <meshStandardMaterial
        color="#0a0a0a"
        emissive="#ffffff"
        emissiveIntensity={0.8}
        transparent
        opacity={0.15}
      />
    </mesh>
  )
}

function Scene({ mousePos }: { mousePos: React.MutableRefObject<{ x: number; y: number }> }) {
  const { viewport } = useThree()
  const scale = Math.min(viewport.width / 8, viewport.height / 6, 1)

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 0, 5]} intensity={2} color="#ffffff" />
      <pointLight position={[-3, 2, 3]} intensity={1} color="#e0e0e0" />
      <pointLight position={[3, -2, 3]} intensity={1} color="#e0e0e0" />
      
      <Float
        speed={2}
        rotationIntensity={0.2}
        floatIntensity={0.3}
      >
        <group scale={scale * 1.8}>
          <BackgroundGlow />
          <Wing side="left" mousePos={mousePos} />
          <Wing side="right" mousePos={mousePos} />
          <GlowOrbs />
        </group>
      </Float>
      
      <Environment preset="night" />
    </>
  )
}

export function AngelWings3D() {
  const mousePos = useRef({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    mousePos.current = {
      x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
      y: -((e.clientY - rect.top) / rect.height - 0.5) * 2
    }
  }

  return (
    <div 
      className="absolute inset-0 w-full h-full"
      onMouseMove={handleMouseMove}
    >
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <Scene mousePos={mousePos} />
      </Canvas>
    </div>
  )
}
