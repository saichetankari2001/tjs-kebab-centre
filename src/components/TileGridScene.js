import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';

const COLS = 24;
const ROWS = 24;
const COUNT = COLS * ROWS;
const GAP = 1.08;

function TileGrid() {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Pre-compute each tile's target height and stagger delay
  const tiles = useMemo(() => {
    const arr = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cx = c - COLS / 2 + 0.5;
        const cz = r - ROWS / 2 + 0.5;
        const dist = Math.sqrt(cx * cx + cz * cz);
        // Dome shape: center tiles tallest, edges flat
        const base = Math.max(0.04, 2.8 - dist * 0.22);
        const h = base * (0.35 + Math.random() * 0.65);
        arr.push({ cx, cz, h, delay: dist * 0.055 + Math.random() * 0.1 });
      }
    }
    return arr;
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    tiles.forEach((tile, i) => {
      const p = Math.max(0, Math.min(1, (t - tile.delay) / 1.1));
      // Ease out back — slight overshoot then settle
      const e = p < 1 ? 1 - Math.pow(1 - p, 3) + Math.sin(p * Math.PI) * 0.04 * (1 - p) : 1;
      const h = Math.max(0.001, tile.h * e);

      dummy.position.set(tile.cx * GAP, h * 0.5 - 1.5, tile.cz * GAP);
      dummy.scale.set(0.88, h, 0.88);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, COUNT]} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color="#1e293b"
        metalness={0.55}
        roughness={0.45}
      />
    </instancedMesh>
  );
}

// The tall central amber pillar — stands out like a beacon
function CenterPillar() {
  const ref = useRef();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const p = Math.min(1, Math.max(0, (t - 0.2) / 1.0));
    const e = 1 - Math.pow(1 - p, 3);
    if (ref.current) {
      ref.current.scale.y = e * 4.5;
      ref.current.position.y = (e * 4.5) / 2 - 1.5;
    }
  });
  return (
    <mesh ref={ref}>
      <boxGeometry args={[0.55, 1, 0.55]} />
      <meshStandardMaterial
        color="#fbbf24"
        emissive="#f59e0b"
        emissiveIntensity={2.5}
        metalness={0.6}
        roughness={0.2}
        toneMapped={false}
      />
    </mesh>
  );
}

// Floating amber point lights that drift slowly
function AmbientOrbs() {
  const ref1 = useRef();
  const ref2 = useRef();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ref1.current) {
      ref1.current.position.x = Math.sin(t * 0.4) * 5;
      ref1.current.position.z = Math.cos(t * 0.4) * 5;
    }
    if (ref2.current) {
      ref2.current.position.x = Math.sin(t * 0.3 + 2) * 4;
      ref2.current.position.z = Math.cos(t * 0.3 + 2) * 4;
    }
  });
  return (
    <>
      <pointLight ref={ref1} position={[5, 4, 5]} intensity={3} color="#f59e0b" distance={18} decay={2} />
      <pointLight ref={ref2} position={[-5, 3, -5]} intensity={2} color="#fbbf24" distance={14} decay={2} />
    </>
  );
}

export default function TileGridScene() {
  return (
    <Canvas
      shadows
      camera={{ position: [10, 12, 10], fov: 42 }}
      style={{ position: 'absolute', inset: 0, zIndex: 0 }}
      gl={{
        antialias: true,
        alpha: false,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.15,
      }}
      onCreated={({ gl }) => gl.setClearColor('#0d1117')}
    >
      {/* Lighting */}
      <ambientLight intensity={0.35} color="#94a3b8" />
      <directionalLight
        position={[8, 14, 6]}
        intensity={2.2}
        color="#e2e8f0"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={50}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
      />
      <directionalLight position={[-6, 8, -8]} intensity={0.6} color="#f59e0b" />

      <AmbientOrbs />
      <TileGrid />
      <CenterPillar />

      <EffectComposer>
        <Bloom
          intensity={2.0}
          luminanceThreshold={0.18}
          luminanceSmoothing={0.85}
          mipmapBlur
          radius={0.75}
        />
        <Vignette eskil={false} offset={0.12} darkness={0.65} />
      </EffectComposer>
    </Canvas>
  );
}
