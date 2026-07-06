import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import * as THREE from 'three';

// ─── Deep water sphere — camera inside looking into the abyss ─────────────────
const WATER_VERT = `
  uniform float time;
  varying vec3 vPos;
  float hash(vec3 p){ return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453); }
  float noise(vec3 p){
    vec3 i=floor(p),f=fract(p),u=f*f*(3.0-2.0*f);
    return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),u.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),u.x),u.y),
               mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),u.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),u.x),u.y),u.z);
  }
  float fbm(vec3 p){ float v=0.0,a=0.5; for(int i=0;i<3;i++){v+=a*noise(p);p=p*2.1+vec3(1.7,9.2,2.8);a*=0.5;} return v; }
  void main(){
    vec3 p = position;
    float d = fbm(p * 0.35 + time * 0.04) * 0.4;
    vPos = p + normalize(p) * (d - 0.15) * 0.6;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(vPos, 1.0);
  }
`;

const WATER_FRAG = `
  uniform float time;
  varying vec3 vPos;
  float hash(vec3 p){ return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453); }
  float noise(vec3 p){
    vec3 i=floor(p),f=fract(p),u=f*f*(3.0-2.0*f);
    return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),u.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),u.x),u.y),
               mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),u.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),u.x),u.y),u.z);
  }
  float fbm(vec3 p){ float v=0.0,a=0.5; for(int i=0;i<4;i++){v+=a*noise(p);p=p*2.1+vec3(3.7,9.2,1.3);a*=0.5;} return v; }
  void main(){
    // Depth-based colour: near-black abyss at bottom, dark teal toward surface
    float depth = clamp((vPos.y + 14.0) / 28.0, 0.0, 1.0); // 0=bottom, 1=top
    vec3 abyss   = vec3(0.001, 0.002, 0.010);
    vec3 deep    = vec3(0.002, 0.012, 0.040);
    vec3 surface = vec3(0.005, 0.035, 0.085);

    float n = fbm(vPos * 0.25 + time * 0.025);
    vec3 col = mix(abyss, deep, smoothstep(0.0, 0.5, depth));
    col = mix(col, surface, smoothstep(0.55, 1.0, depth));
    // Subtle bioluminescent shimmer patches
    float bio = fbm(vPos * 1.8 - time * 0.06);
    col += vec3(0.0, bio * 0.025, bio * 0.045) * smoothstep(0.5, 0.85, bio);
    gl_FragColor = vec4(col, 1.0);
  }
`;

function WaterSphere() {
  const mat = useMemo(() => {
    const m = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      vertexShader: WATER_VERT,
      fragmentShader: WATER_FRAG,
      side: THREE.BackSide,
    });
    m.toneMapped = false;
    return m;
  }, []);
  useFrame(({ clock }) => { mat.uniforms.time.value = clock.getElapsedTime(); });
  return (
    <mesh>
      <sphereGeometry args={[14, 96, 96]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}

// ─── Animated caustic shimmer disc — sits at the "water surface" above ────────
const CAUSTIC_VERT = `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`;
const CAUSTIC_FRAG = `
  uniform float time;
  varying vec2 vUv;
  float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5); }
  float noise(vec2 p){ vec2 i=floor(p),f=fract(p),u=f*f*(3.0-2.0*f); return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y); }
  float fbm(vec2 p){ float v=0.0,a=0.5; for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.1+vec2(3.7,9.2);a*=0.5;} return v; }
  void main(){
    vec2 uv = (vUv - 0.5) * 6.0;
    float n1 = fbm(uv + time * 0.22);
    float n2 = fbm(uv * 1.3 - time * 0.18 + 4.5);
    float caustic = pow(max(0.0, 1.0 - abs(n1 - n2 - 0.35) * 5.0), 2.5);
    float n3 = fbm(uv * 2.0 + time * 0.3 + vec2(11.0,5.0));
    caustic += pow(max(0.0, 1.0 - abs(n2 - n3 + 0.2) * 6.0), 3.0) * 0.5;
    float dist = length(vUv - 0.5) * 2.0;
    float fade = 1.0 - smoothstep(0.3, 1.0, dist);
    vec3 col = mix(vec3(0.3, 0.85, 1.0), vec3(0.8, 1.0, 0.7), caustic) * caustic * 2.2;
    gl_FragColor = vec4(col, caustic * fade * 0.55);
  }
`;

function CausticSurface() {
  const mat = useMemo(() => {
    const m = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      vertexShader: CAUSTIC_VERT,
      fragmentShader: CAUSTIC_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    m.toneMapped = false;
    return m;
  }, []);
  useFrame(({ clock }) => { mat.uniforms.time.value = clock.getElapsedTime(); });
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 11, 0]}>
      <planeGeometry args={[22, 22, 1, 1]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}

// ─── God rays — light shafts pouring down from the surface ───────────────────
const SHAFT_DEFS = [
  { x: -3.5, z: -5,  h: 13, rT: 0.06, rB: 1.4, col: '#ffe680', delay: 0.0  },
  { x:  2.5, z: -7,  h: 15, rT: 0.05, rB: 1.1, col: '#c0f0ff', delay: 1.3  },
  { x: -0.5, z: -3,  h: 11, rT: 0.09, rB: 1.6, col: '#ffffff', delay: 2.5  },
  { x:  5.5, z: -6,  h: 12, rT: 0.07, rB: 1.2, col: '#ffe680', delay: 0.7  },
  { x: -6.0, z: -4,  h: 14, rT: 0.08, rB: 1.3, col: '#a0f0d0', delay: 1.9  },
  { x:  1.0, z: -9,  h: 10, rT: 0.06, rB: 0.9, col: '#c0f0ff', delay: 3.1  },
];

function GodRays() {
  const refs = useRef([]);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    SHAFT_DEFS.forEach((s, i) => {
      if (refs.current[i]) {
        refs.current[i].material.opacity =
          0.038 + Math.sin(t * 0.35 + s.delay) * 0.018
               + Math.sin(t * 0.9  + s.delay * 1.7) * 0.009;
      }
    });
  });
  return (
    <>
      {SHAFT_DEFS.map((s, i) => (
        <mesh key={i} ref={el => refs.current[i] = el}
          position={[s.x, 11 - s.h / 2, s.z]}>
          <cylinderGeometry args={[s.rT, s.rB, s.h, 8, 1, true]} />
          <meshBasicMaterial color={s.col} transparent opacity={0.04}
            side={THREE.BackSide} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      ))}
    </>
  );
}

// ─── Dark boulder silhouettes in the deep ────────────────────────────────────
const BOULDERS = [
  { pos: [ 7.5, -5.5, -9],  r: 3.0 },
  { pos: [-6.5, -7.0, -7],  r: 2.4 },
  { pos: [ 1.5, -9.0, -11], r: 3.8 },
  { pos: [-10,  -4.0, -6],  r: 2.0 },
];

function Boulders() {
  return (
    <>
      {BOULDERS.map((b, i) => (
        <mesh key={i} position={b.pos}>
          <sphereGeometry args={[b.r, 28, 28]} />
          <meshStandardMaterial color="#000305" roughness={1} metalness={0} />
        </mesh>
      ))}
    </>
  );
}

// ─── Bioluminescent plankton — rise slowly through the scene ─────────────────
const BIO_PALETTE = [
  [0.0, 0.85, 1.0],  // cyan
  [0.0, 0.75, 0.85], // teal
  [0.25, 0.95, 0.7], // aqua green
  [0.0, 0.55, 1.0],  // blue
  [0.6, 1.0, 0.85],  // mint
  [0.0, 1.0, 0.75],  // emerald
];

function BioParticles({ count = 1600 }) {
  const [positions, velocities, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = Math.random() * 11;
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.random() * Math.PI;
      pos[i*3]   = Math.sin(phi) * Math.cos(theta) * r;
      pos[i*3+1] = (Math.random() - 0.5) * 22;
      pos[i*3+2] = Math.sin(phi) * Math.sin(theta) * r;
      vel[i*3]   = (Math.random() - 0.5) * 0.006;
      vel[i*3+1] = 0.006 + Math.random() * 0.016; // drift upward
      vel[i*3+2] = (Math.random() - 0.5) * 0.006;
      const c = BIO_PALETTE[Math.floor(Math.random() * BIO_PALETTE.length)];
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
    size: 0.07, vertexColors: true, transparent: true, opacity: 0.88,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  }), []);

  useFrame(() => {
    const pos = geo.attributes.position.array;
    for (let i = 0; i < count; i++) {
      pos[i*3]   += velocities[i*3];
      pos[i*3+1] += velocities[i*3+1];
      pos[i*3+2] += velocities[i*3+2];
      // Reset particle to the bottom when it exits the top
      if (pos[i*3+1] > 11) {
        const r = Math.random() * 10;
        const theta = Math.random() * Math.PI * 2;
        pos[i*3]   = Math.cos(theta) * r;
        pos[i*3+1] = -11 + Math.random() * 2;
        pos[i*3+2] = Math.sin(theta) * r;
      }
    }
    geo.attributes.position.needsUpdate = true;
  });

  return <points geometry={geo} material={mat} />;
}

// ─── Slow dreamy camera drift ─────────────────────────────────────────────────
function FloatingCamera() {
  useFrame(({ clock, camera }) => {
    const t = clock.getElapsedTime();
    camera.position.x = Math.sin(t * 0.06) * 0.7;
    camera.position.y = Math.sin(t * 0.045 + 0.8) * 0.4;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

// ─── Scene export ─────────────────────────────────────────────────────────────
export default function UnderwaterScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 0.1], fov: 82 }}
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
      gl={{
        antialias: true,
        alpha: false,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.1,
      }}
      onCreated={({ gl }) => gl.setClearColor('#000810')}
    >
      <FloatingCamera />

      <WaterSphere />
      <CausticSurface />
      <GodRays />
      <Boulders />
      <BioParticles count={1600} />

      {/* Warm golden light from the surface above — like sunlight breaking through */}
      <pointLight position={[0, 12, 0]}  intensity={6}  color="#ffe080" distance={30} decay={1.8} />
      <pointLight position={[4,  9, -5]} intensity={3}  color="#80ffe0" distance={22} decay={2} />
      <pointLight position={[-4, 8, -4]} intensity={2.5} color="#60c0ff" distance={18} decay={2} />
      {/* Faint teal fill light from below */}
      <pointLight position={[0, -8, 0]}  intensity={1.2} color="#003355" distance={20} decay={2} />
      <ambientLight intensity={0.06} color="#001020" />

      <EffectComposer>
        <Bloom intensity={3.2} luminanceThreshold={0.04} luminanceSmoothing={0.88} mipmapBlur radius={0.9} />
        <ChromaticAberration offset={new THREE.Vector2(0.0005, 0.0005)} />
        <Vignette eskil={false} offset={0.22} darkness={0.72} />
      </EffectComposer>
    </Canvas>
  );
}
