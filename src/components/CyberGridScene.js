import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import * as THREE from 'three';

// ─── Perspective grid floor ──────────────────────────────────────────────────
const GRID_VERT = `
  varying vec3 vW;
  void main(){
    vec4 w = modelMatrix * vec4(position,1.0);
    vW = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;
const GRID_FRAG = `
  uniform float time;
  varying vec3 vW;
  void main(){
    float sp = 1.5;
    vec2 g  = fract(vec2(vW.x, vW.z) / sp);
    float lx = 1.0 - smoothstep(0.0, 0.06, min(g.x, 1.0-g.x));
    float lz = 1.0 - smoothstep(0.0, 0.06, min(g.y, 1.0-g.y));
    float gm = max(lx, lz);

    float dist  = length(vec2(vW.x, vW.z));
    float pulse = 0.5 + 0.5 * sin(dist * 0.9 - time * 1.8);
    float fade  = 1.0 - smoothstep(6.0, 20.0, dist);

    // Major grid lines every 6 units — brighter
    vec2 mg = fract(vec2(vW.x, vW.z) / (sp * 6.0));
    float major = max(
      1.0 - smoothstep(0.0, 0.025, min(mg.x, 1.0-mg.x)),
      1.0 - smoothstep(0.0, 0.025, min(mg.y, 1.0-mg.y))
    );

    vec3 cyan   = vec3(0.0, 0.85, 1.0);
    vec3 purple = vec3(0.55, 0.08, 1.0);
    vec3 col    = mix(purple, cyan, pulse) * (gm + major * 1.5);
    float alpha = (gm * 0.55 + major * 0.85) * fade * (0.55 + 0.45*pulse);

    gl_FragColor = vec4(col, alpha);
  }
`;

function GridFloor() {
  const mat = useMemo(() => {
    const m = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      vertexShader: GRID_VERT,
      fragmentShader: GRID_FRAG,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    m.toneMapped = false;
    return m;
  }, []);
  useFrame(({ clock }) => { mat.uniforms.time.value = clock.getElapsedTime(); });
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.2, -2]}>
      <planeGeometry args={[50, 50, 1, 1]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}

// ─── Crystal towers — tall glowing prisms rising from the grid ───────────────
const TOWER_DEFS = [
  { p: [-6,   -3.2, -5],  h: 7.5, w: 0.45, emissive: '#00d4ff', color: '#0369a1' },
  { p: [ 6.5, -3.2, -5],  h: 6.0, w: 0.40, emissive: '#a855f7', color: '#6d28d9' },
  { p: [-4,   -3.2, -3],  h: 5.0, w: 0.30, emissive: '#06b6d4', color: '#0e7490' },
  { p: [ 5,   -3.2, -2],  h: 6.8, w: 0.38, emissive: '#e879f9', color: '#86198f' },
  { p: [-8,   -3.2, -8],  h: 4.5, w: 0.25, emissive: '#38bdf8', color: '#0284c7' },
  { p: [ 8.5, -3.2, -8],  h: 5.5, w: 0.35, emissive: '#c084fc', color: '#7c3aed' },
  { p: [ 1.5, -3.2, -7],  h: 8.0, w: 0.50, emissive: '#00d4ff', color: '#164e63' },
  { p: [-2,   -3.2, -6],  h: 3.5, w: 0.20, emissive: '#818cf8', color: '#4338ca' },
];

function CrystalTower({ p, h, w, emissive, color }) {
  const ref = useRef();
  const phaseSeed = p[0] * 0.3 + p[2] * 0.2;
  useFrame(({ clock }) => {
    if (ref.current) {
      const t = clock.getElapsedTime();
      // Gentle vertical hover
      ref.current.position.y = p[1] + h / 2 + Math.sin(t * 0.6 + phaseSeed) * 0.12;
      // Scale Y pulse — like breathing
      ref.current.scale.y = 1.0 + Math.sin(t * 1.2 + phaseSeed) * 0.03;
    }
  });
  return (
    <group>
      {/* Main body */}
      <mesh ref={ref} position={[p[0], p[1] + h / 2, p[2]]}>
        <boxGeometry args={[w, h, w]} />
        <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={3.5} roughness={0.1} metalness={0.9} toneMapped={false} />
      </mesh>
      {/* Wireframe outline for depth */}
      <mesh position={[p[0], p[1] + h / 2, p[2]]}>
        <boxGeometry args={[w * 1.15, h * 1.01, w * 1.15]} />
        <meshStandardMaterial color={emissive} emissive={emissive} emissiveIntensity={1.5} wireframe transparent opacity={0.5} toneMapped={false} />
      </mesh>
      {/* Glowing top cap */}
      <mesh position={[p[0], p[1] + h, p[2]]}>
        <sphereGeometry args={[w * 0.7, 12, 12]} />
        <meshStandardMaterial color="#ffffff" emissive={emissive} emissiveIntensity={8} roughness={0} toneMapped={false} />
      </mesh>
    </group>
  );
}

function CrystalTowers() {
  return <>{TOWER_DEFS.map((t, i) => <CrystalTower key={i} {...t} />)}</>;
}

// ─── Floating neon rings at different orbital planes ─────────────────────────
function NeonRings() {
  const refs = useRef([]);
  const RINGS = [
    { r: 5.5, tube: 0.025, tilt: 0.4,  speed:  0.18, color: '#00d4ff', ei: 3.5 },
    { r: 7.5, tube: 0.018, tilt: 1.0,  speed: -0.12, color: '#a855f7', ei: 3.0 },
    { r: 4.0, tube: 0.030, tilt: 0.7,  speed:  0.24, color: '#e879f9', ei: 3.5 },
    { r: 9.0, tube: 0.012, tilt: 1.45, speed: -0.08, color: '#06b6d4', ei: 2.5 },
  ];
  useFrame((_, dt) => {
    RINGS.forEach((ring, i) => {
      if (refs.current[i]) refs.current[i].rotation.z += ring.speed * dt;
    });
  });
  return (
    <group position={[0, 0.5, -2]}>
      {RINGS.map((ring, i) => (
        <group key={i} rotation={[ring.tilt, 0, 0]}>
          <mesh ref={el => (refs.current[i] = el)}>
            <torusGeometry args={[ring.r, ring.tube, 8, 120]} />
            <meshStandardMaterial color={ring.color} emissive={ring.color} emissiveIntensity={ring.ei} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ─── Light pillars rising from grid ──────────────────────────────────────────
function LightPillars() {
  const refs = useRef([]);
  const PILLARS = [
    { p: [-6, -3.2, -5],  color: '#00d4ff' },
    { p: [ 6.5,-3.2,-5],  color: '#a855f7' },
    { p: [ 1.5,-3.2,-7],  color: '#00d4ff' },
  ];
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    PILLARS.forEach((_, i) => {
      if (refs.current[i]) {
        refs.current[i].material.opacity = 0.12 + Math.sin(t * 1.2 + i * 1.8) * 0.08;
      }
    });
  });
  return (
    <>
      {PILLARS.map((pl, i) => (
        <mesh key={i} ref={el => (refs.current[i] = el)} position={[pl.p[0], pl.p[1] + 10, pl.p[2]]}>
          <cylinderGeometry args={[0.04, 0.8, 20, 8, 1, true]} />
          <meshBasicMaterial color={pl.color} transparent opacity={0.18} side={THREE.BackSide} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
        </mesh>
      ))}
    </>
  );
}

// ─── Cyan + purple particles rising from grid ─────────────────────────────────
function GridParticles({ count = 1200 }) {
  const [positions, velocities, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const palette = [
      [0.0, 0.85, 1.0],   // cyan
      [0.35, 0.08, 1.0],  // purple
      [0.0, 0.72, 0.9],   // teal
      [0.88, 0.35, 1.0],  // magenta
      [0.55, 0.85, 1.0],  // light blue
    ];
    for (let i = 0; i < count; i++) {
      const r = 3 + Math.random() * 9, theta = Math.random() * Math.PI * 2;
      pos[i*3]   = Math.cos(theta) * r;
      pos[i*3+1] = -3.2 + Math.random() * 8;
      pos[i*3+2] = -2 + Math.sin(theta) * r;
      vel[i*3]   = (Math.random() - 0.5) * 0.006;
      vel[i*3+1] = 0.004 + Math.random() * 0.012;
      vel[i*3+2] = (Math.random() - 0.5) * 0.006;
      const c = palette[Math.floor(Math.random() * palette.length)];
      col[i*3] = c[0]; col[i*3+1] = c[1]; col[i*3+2] = c[2];
    }
    return [pos, vel, col];
  }, [count]);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions.slice(), 3));
    g.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
    return g;
  }, [positions, colors]);

  const mat = useMemo(() => new THREE.PointsMaterial({
    size: 0.055, vertexColors: true, transparent: true, opacity: 0.9,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  }), []);

  useFrame(() => {
    const pos = geo.attributes.position.array;
    for (let i = 0; i < count; i++) {
      pos[i*3]   += velocities[i*3];
      pos[i*3+1] += velocities[i*3+1];
      pos[i*3+2] += velocities[i*3+2];
      if (pos[i*3+1] > 6) {
        const r = 3 + Math.random() * 9, theta = Math.random() * Math.PI * 2;
        pos[i*3]   = Math.cos(theta) * r;
        pos[i*3+1] = -3.2;
        pos[i*3+2] = -2 + Math.sin(theta) * r;
      }
    }
    geo.attributes.position.needsUpdate = true;
  });

  return <points geometry={geo} material={mat} />;
}

// ─── Central floating diamond ─────────────────────────────────────────────────
function CentralDiamond() {
  const outer = useRef();
  const inner = useRef();
  useFrame(({ clock }, dt) => {
    const t = clock.getElapsedTime();
    if (outer.current) {
      outer.current.rotation.y += 0.08 * dt;
      outer.current.rotation.x += 0.03 * dt;
      outer.current.position.y = 0.5 + Math.sin(t * 0.8) * 0.3;
    }
    if (inner.current) {
      inner.current.rotation.y -= 0.14 * dt;
      inner.current.rotation.z += 0.05 * dt;
    }
  });
  return (
    <group position={[0, 0.5, -1]}>
      {/* Large outer octahedron wireframe */}
      <mesh ref={outer}>
        <octahedronGeometry args={[2.8, 2]} />
        <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={1.5} wireframe toneMapped={false} />
      </mesh>
      {/* Counter-rotating inner */}
      <mesh ref={inner}>
        <octahedronGeometry args={[1.8, 1]} />
        <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={2.0} wireframe transparent opacity={0.7} toneMapped={false} />
      </mesh>
      {/* Glowing core */}
      <mesh>
        <sphereGeometry args={[0.45, 24, 24]} />
        <meshStandardMaterial color="#ffffff" emissive="#00d4ff" emissiveIntensity={12} roughness={0} toneMapped={false} />
      </mesh>
    </group>
  );
}

// ─── Scene ────────────────────────────────────────────────────────────────────
export default function CyberGridScene() {
  return (
    <Canvas
      camera={{ position: [0, 4, 10], fov: 72 }}
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
      gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.85 }}
      onCreated={({ gl }) => { gl.setClearColor('#000810'); gl.shadowMap.enabled = false; }}
    >
      <ambientLight intensity={0.04} color="#0a1628" />
      <pointLight position={[0, 2, -1]} intensity={3} color="#00d4ff" distance={20} decay={2} />
      <pointLight position={[-6, 4, -5]} intensity={2} color="#a855f7" distance={18} decay={2} />
      <pointLight position={[6.5, 4, -5]} intensity={2} color="#e879f9" distance={18} decay={2} />

      <GridFloor />
      <CrystalTowers />
      <NeonRings />
      <LightPillars />
      <CentralDiamond />
      <GridParticles count={1200} />

      <EffectComposer>
        <Bloom intensity={2.8} luminanceThreshold={0.05} luminanceSmoothing={0.9} mipmapBlur radius={0.88} />
        <ChromaticAberration offset={new THREE.Vector2(0.0005, 0.0005)} />
        <Vignette eskil={false} offset={0.22} darkness={0.55} />
      </EffectComposer>
    </Canvas>
  );
}
