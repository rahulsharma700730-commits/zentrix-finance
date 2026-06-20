import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, Torus, Icosahedron, Environment, Cylinder, Octahedron, Box, Stars } from '@react-three/drei';
import { Suspense, useRef, useMemo } from 'react';
import type { Mesh, Group } from 'three';

const GOLD = '#FFD700';
const GOLD_WARM = '#f5c518';
const GOLD_LIGHT = '#fff3b0';

const Lights = () => (
  <>
    <ambientLight intensity={0.4} />
    <directionalLight position={[5, 5, 5]} intensity={1.2} color={GOLD} />
    <directionalLight position={[-5, -3, 2]} intensity={0.6} color={GOLD_LIGHT} />
    <pointLight position={[0, 0, 3]} intensity={1.4} color={GOLD_WARM} />
  </>
);

/* =============== HERO SCENE =============== */
const GoldOrb = () => {
  const ref = useRef<Mesh>(null);
  useFrame((s) => {
    if (ref.current) {
      ref.current.rotation.x = s.clock.elapsedTime * 0.15;
      ref.current.rotation.y = s.clock.elapsedTime * 0.2;
    }
  });
  return (
    <Float speed={1.4} rotationIntensity={0.6} floatIntensity={1.2}>
      <Sphere ref={ref} args={[1.4, 96, 96]}>
        <MeshDistortMaterial color={GOLD_WARM} distort={0.45} speed={1.6} roughness={0.15} metalness={1} emissive="#7a5a00" emissiveIntensity={0.35} />
      </Sphere>
    </Float>
  );
};

const Rings = () => {
  const g = useRef<Group>(null);
  useFrame((s) => {
    if (g.current) {
      g.current.rotation.z = s.clock.elapsedTime * 0.1;
      g.current.rotation.x = Math.sin(s.clock.elapsedTime * 0.3) * 0.2;
    }
  });
  return (
    <group ref={g}>
      <Torus args={[2.3, 0.025, 16, 200]} rotation={[Math.PI / 2.4, 0, 0]}>
        <meshStandardMaterial color={GOLD} metalness={1} roughness={0.2} emissive={GOLD} emissiveIntensity={0.4} />
      </Torus>
      <Torus args={[2.8, 0.02, 16, 200]} rotation={[Math.PI / 3, Math.PI / 4, 0]}>
        <meshStandardMaterial color={GOLD_WARM} metalness={1} roughness={0.3} emissive={GOLD_WARM} emissiveIntensity={0.3} />
      </Torus>
      <Torus args={[3.3, 0.015, 16, 200]} rotation={[Math.PI / 2.8, -Math.PI / 5, 0]}>
        <meshStandardMaterial color={GOLD_LIGHT} metalness={1} roughness={0.4} emissive={GOLD_LIGHT} emissiveIntensity={0.2} />
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
            <meshStandardMaterial color={GOLD} metalness={1} roughness={0.15} emissive={GOLD} emissiveIntensity={0.6} />
          </Icosahedron>
        </Float>
      ))}
    </>
  );
};

const HeroScene = () => (
  <>
    <Lights />
    <Suspense fallback={null}>
      <GoldOrb />
      <Rings />
      <FloatingCrystals />
      <Environment preset="sunset" />
    </Suspense>
  </>
);

/* =============== COIN SCENE (Markets) =============== */
const Coin = ({ position, delay = 0 }: { position: [number, number, number]; delay?: number }) => {
  const ref = useRef<Mesh>(null);
  useFrame((s) => {
    if (ref.current) {
      ref.current.rotation.y = s.clock.elapsedTime * 1.2 + delay;
      ref.current.rotation.x = Math.sin(s.clock.elapsedTime * 0.5 + delay) * 0.15;
    }
  });
  return (
    <Float speed={1.2} floatIntensity={1.4} rotationIntensity={0}>
      <Cylinder ref={ref} args={[0.55, 0.55, 0.08, 64]} position={position}>
        <meshStandardMaterial color={GOLD} metalness={1} roughness={0.18} emissive={GOLD_WARM} emissiveIntensity={0.35} />
      </Cylinder>
    </Float>
  );
};

const CoinsScene = () => (
  <>
    <Lights />
    <Suspense fallback={null}>
      <Coin position={[-2.2, 0.6, 0]} />
      <Coin position={[2.4, -0.4, -0.5]} delay={1.2} />
      <Coin position={[0, 0.2, -1]} delay={2.4} />
      <Coin position={[-1.4, -1.2, -1.5]} delay={3.6} />
      <Coin position={[1.8, 1.4, -1.2]} delay={4.8} />
      <Environment preset="sunset" />
    </Suspense>
  </>
);

/* =============== SHARDS SCENE (Stats) =============== */
const Shards = () => {
  const shards = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => ({
      pos: [
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 3 - 1,
      ] as [number, number, number],
      scale: 0.12 + Math.random() * 0.2,
      seed: i,
    }));
  }, []);
  return (
    <>
      {shards.map((sh, i) => (
        <Float key={i} speed={0.8 + (i % 5) * 0.2} rotationIntensity={2} floatIntensity={1.5}>
          <Octahedron args={[sh.scale, 0]} position={sh.pos}>
            <meshStandardMaterial color={i % 2 === 0 ? GOLD : GOLD_LIGHT} metalness={1} roughness={0.2} emissive={GOLD} emissiveIntensity={0.5} />
          </Octahedron>
        </Float>
      ))}
    </>
  );
};

const ShardsScene = () => (
  <>
    <Lights />
    <Suspense fallback={null}>
      <Shards />
      <Environment preset="sunset" />
    </Suspense>
  </>
);

/* =============== CTA SCENE (giant rotating diamond + stars) =============== */
const BigDiamond = () => {
  const ref = useRef<Mesh>(null);
  useFrame((s) => {
    if (ref.current) {
      ref.current.rotation.y = s.clock.elapsedTime * 0.4;
      ref.current.rotation.x = Math.sin(s.clock.elapsedTime * 0.3) * 0.3;
    }
  });
  return (
    <Float speed={1.2} floatIntensity={1.6} rotationIntensity={0.4}>
      <Octahedron ref={ref} args={[1.6, 0]}>
        <meshStandardMaterial color={GOLD} metalness={1} roughness={0.12} emissive={GOLD_WARM} emissiveIntensity={0.6} flatShading />
      </Octahedron>
    </Float>
  );
};

const SpinningCubes = () => {
  const g = useRef<Group>(null);
  useFrame((s) => {
    if (g.current) g.current.rotation.y = s.clock.elapsedTime * 0.2;
  });
  const items = useMemo(
    () => Array.from({ length: 8 }, (_, i) => ({
      angle: (i / 8) * Math.PI * 2,
      r: 3.2,
      y: Math.sin(i) * 0.6,
    })),
    [],
  );
  return (
    <group ref={g}>
      {items.map((it, i) => (
        <Float key={i} speed={1.4} rotationIntensity={2} floatIntensity={0.8}>
          <Box args={[0.22, 0.22, 0.22]} position={[Math.cos(it.angle) * it.r, it.y, Math.sin(it.angle) * it.r]}>
            <meshStandardMaterial color={GOLD_LIGHT} metalness={1} roughness={0.2} emissive={GOLD} emissiveIntensity={0.5} />
          </Box>
        </Float>
      ))}
    </group>
  );
};

const CTAScene = () => (
  <>
    <Lights />
    <Suspense fallback={null}>
      <Stars radius={20} depth={30} count={1200} factor={3} fade speed={1} />
      <BigDiamond />
      <SpinningCubes />
      <Environment preset="sunset" />
    </Suspense>
  </>
);

/* =============== WRAPPER =============== */
type Variant = 'hero' | 'coins' | 'shards' | 'cta';

const SCENES: Record<Variant, () => JSX.Element> = {
  hero: HeroScene,
  coins: CoinsScene,
  shards: ShardsScene,
  cta: CTAScene,
};

export const Scene3D = ({ variant = 'hero', className = '' }: { variant?: Variant; className?: string }) => {
  const Scene = SCENES[variant];
  const camZ = variant === 'cta' ? 7 : 6;
  return (
    <div className={`pointer-events-none ${className}`}>
      <Canvas camera={{ position: [0, 0, camZ], fov: 45 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
        <Scene />
      </Canvas>
    </div>
  );
};

// Backwards-compat export used by HeroSection
export const Hero3D = ({ className = '' }: { className?: string }) => (
  <Scene3D variant="hero" className={className} />
);
