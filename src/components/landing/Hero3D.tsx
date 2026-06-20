import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, Torus, Icosahedron, Environment } from '@react-three/drei';
import { Suspense, useRef } from 'react';
import type { Mesh, Group } from 'three';

const GoldOrb = () => {
  const ref = useRef<Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = state.clock.elapsedTime * 0.15;
      ref.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });
  return (
    <Float speed={1.4} rotationIntensity={0.6} floatIntensity={1.2}>
      <Sphere ref={ref} args={[1.4, 96, 96]} position={[0, 0, 0]}>
        <MeshDistortMaterial
          color="#f5c518"
          attach="material"
          distort={0.45}
          speed={1.6}
          roughness={0.15}
          metalness={1}
          emissive="#7a5a00"
          emissiveIntensity={0.35}
        />
      </Sphere>
    </Float>
  );
};

const Rings = () => {
  const group = useRef<Group>(null);
  useFrame((state) => {
    if (group.current) {
      group.current.rotation.z = state.clock.elapsedTime * 0.1;
      group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
    }
  });
  return (
    <group ref={group}>
      <Torus args={[2.3, 0.025, 16, 200]} rotation={[Math.PI / 2.4, 0, 0]}>
        <meshStandardMaterial color="#FFD700" metalness={1} roughness={0.2} emissive="#FFD700" emissiveIntensity={0.4} />
      </Torus>
      <Torus args={[2.8, 0.02, 16, 200]} rotation={[Math.PI / 3, Math.PI / 4, 0]}>
        <meshStandardMaterial color="#f5c518" metalness={1} roughness={0.3} emissive="#f5c518" emissiveIntensity={0.3} />
      </Torus>
      <Torus args={[3.3, 0.015, 16, 200]} rotation={[Math.PI / 2.8, -Math.PI / 5, 0]}>
        <meshStandardMaterial color="#fff3b0" metalness={1} roughness={0.4} emissive="#fff3b0" emissiveIntensity={0.2} />
      </Torus>
    </group>
  );
};

const FloatingCrystals = () => {
  const positions: [number, number, number][] = [
    [-2.6, 1.6, -1], [2.4, -1.8, -1.5], [2.8, 1.4, -2], [-2.2, -1.5, -1.8], [0, 2.4, -2.5],
  ];
  return (
    <>
      {positions.map((p, i) => (
        <Float key={i} speed={1 + i * 0.2} rotationIntensity={1.5} floatIntensity={2}>
          <Icosahedron args={[0.18 + (i % 3) * 0.06, 0]} position={p}>
            <meshStandardMaterial color="#FFD700" metalness={1} roughness={0.15} emissive="#FFD700" emissiveIntensity={0.6} />
          </Icosahedron>
        </Float>
      ))}
    </>
  );
};

export const Hero3D = ({ className = '' }: { className?: string }) => {
  return (
    <div className={`pointer-events-none ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} color="#FFD700" />
        <directionalLight position={[-5, -3, 2]} intensity={0.6} color="#fff3b0" />
        <pointLight position={[0, 0, 3]} intensity={1.5} color="#f5c518" />
        <Suspense fallback={null}>
          <GoldOrb />
          <Rings />
          <FloatingCrystals />
          <Environment preset="sunset" />
        </Suspense>
      </Canvas>
    </div>
  );
};
