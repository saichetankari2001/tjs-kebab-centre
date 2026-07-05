import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';

// Thick glowing torus ring with emissive material so bloom fires on it
function OrbitalRing({ radius, tube, tilt, tiltZ = 0, speed, color, emissive, emissiveIntensity = 3 }) {
  const mesh = useRef();
  useFrame((_, dt) => {
    if (mesh.current) mesh.current.rotation.z += speed * dt;
  });
  return (
    <group rotation={[tilt, 0, tiltZ]}>
      <mesh ref={mesh}>
        <torusGeometry args={[radius, tube, 16, 120]} />
        <meshStandardMaterial
          color={color}
          emissive={emissive || color}
          emissiveIntensity={emissiveIntensity}
          roughness={0.2}
          metalness={0.8}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

// Central glowing sphere
function CoreOrb() {
  const mesh = useRef();
  useFrame(({ clock }) => {
    if (!mesh.current) return;
    const t = clock.getElapsedTime();
    mesh.current.scale.setScalar(1 + Math.sin(t * 1.1) * 0.15);
    mesh.current.rotation.y += 0.008;
  });
  return (
    <mesh ref={mesh}>
      <sphereGeometry args={[0.22, 32, 32]} />
      <meshStandardMaterial
        color="#fff7e0"
        emissive="#f59e0b"
        emissiveIntensity={8}
        roughness={0}
        metalness={0}
        toneMapped={false}
      />
    </mesh>
  );
}

// Particle field
function Particles() {
  const count = 800;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r     = 1.5 + Math.random() * 5.5;
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      arr[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, []);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return g;
  }, [positions]);

  const mat = useMemo(() => new THREE.PointsMaterial({
    color: '#fbbf24',
    size: 0.045,
    transparent: true,
    opacity: 0.85,
    sizeAttenuation: true,
  }), []);

  const ref = useRef();
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += 0.04 * dt; });

  return <points ref={ref} geometry={geo} material={mat} />;
}

export default function VortexScene() {
  return (
    <Canvas
      camera={{ position: [0, 1.5, 7], fov: 52 }}
      style={{ position: 'absolute', inset: 0, zIndex: 0 }}
      gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
      onCreated={({ gl }) => gl.setClearColor('#010000')}
    >
      <ambientLight intensity={0.05} />
      <pointLight position={[0, 0, 0]} intensity={6} color="#f59e0b" distance={14} decay={2} />

      <Stars radius={80} depth={50} count={2500} factor={3} saturation={0.3} fade speed={0.5} />

      {/* 6 orbital rings — thick enough to actually see, emissive so bloom fires */}
      <OrbitalRing radius={1.05} tube={0.028} tilt={0.0}   speed={0.60}  color="#fbbf24" emissiveIntensity={5} />
      <OrbitalRing radius={1.55} tube={0.020} tilt={0.52}  speed={-0.42} color="#f59e0b" emissiveIntensity={4} />
      <OrbitalRing radius={2.10} tube={0.016} tilt={0.95}  speed={0.30}  color="#ea580c" emissiveIntensity={3.5} />
      <OrbitalRing radius={2.70} tube={0.013} tilt={1.30}  speed={-0.22} color="#93c5fd" emissiveIntensity={3} />
      <OrbitalRing radius={3.35} tube={0.010} tilt={0.70}  speed={0.16}  color="#f59e0b" emissiveIntensity={2.5} />
      <OrbitalRing radius={4.10} tube={0.008} tilt={1.60}  speed={-0.11} color="#fbbf24" emissiveIntensity={2} />

      <Particles />
      <CoreOrb />

      <EffectComposer>
        <Bloom
          intensity={3.5}
          luminanceThreshold={0.02}
          luminanceSmoothing={0.9}
          mipmapBlur
          radius={0.85}
        />
        <Vignette eskil={false} offset={0.1} darkness={0.80} />
      </EffectComposer>
    </Canvas>
  );
}
