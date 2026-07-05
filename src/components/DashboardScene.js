import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';

function SlowRing({ radius, tube, tilt, speed, color, emissiveIntensity = 2.5 }) {
  const mesh = useRef();
  useFrame((_, dt) => {
    if (mesh.current) mesh.current.rotation.z += speed * dt;
  });
  return (
    <group rotation={[tilt, 0, 0]}>
      <mesh ref={mesh}>
        <torusGeometry args={[radius, tube, 12, 100]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={emissiveIntensity}
          roughness={0.3}
          metalness={0.7}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function BackgroundParticles() {
  const count = 500;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3]     = (Math.random() - 0.5) * 22;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 16;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 12 - 5;
    }
    return arr;
  }, []);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return g;
  }, [positions]);
  const mat = useMemo(() => new THREE.PointsMaterial({
    color: '#f59e0b', size: 0.03, transparent: true, opacity: 0.55, sizeAttenuation: true,
  }), []);
  const ref = useRef();
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += 0.01 * dt; });
  return <points ref={ref} geometry={geo} material={mat} />;
}

export default function DashboardScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 9], fov: 62 }}
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
      gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
      onCreated={({ gl }) => gl.setClearColor('#020100')}
    >
      <ambientLight intensity={0.04} />
      <pointLight position={[0, 0, 2]} intensity={4} color="#f59e0b" distance={18} decay={2} />

      <Stars radius={100} depth={60} count={2000} factor={2.5} saturation={0.2} fade speed={0.3} />

      <SlowRing radius={2.4}  tube={0.022} tilt={0.35} speed={0.14}  color="#f59e0b" emissiveIntensity={3.0} />
      <SlowRing radius={3.8}  tube={0.016} tilt={0.85} speed={-0.09} color="#fbbf24" emissiveIntensity={2.5} />
      <SlowRing radius={5.4}  tube={0.012} tilt={1.25} speed={0.07}  color="#ea580c" emissiveIntensity={2.0} />
      <SlowRing radius={7.2}  tube={0.009} tilt={0.55} speed={-0.05} color="#93c5fd" emissiveIntensity={1.8} />

      <BackgroundParticles />

      <EffectComposer>
        <Bloom intensity={2.8} luminanceThreshold={0.02} luminanceSmoothing={0.9} mipmapBlur radius={0.80} />
        <Vignette eskil={false} offset={0.18} darkness={0.70} />
      </EffectComposer>
    </Canvas>
  );
}
