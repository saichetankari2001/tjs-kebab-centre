import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import * as THREE from 'three';

// ─── Morphing lava sphere — vertex displacement + fragment lava shader ─────────
// Camera sits INSIDE this sphere, so the entire sky is living molten gold
const LAVA_VERT = `
  uniform float time;
  varying vec3 vNormal;
  varying vec3 vPos;
  varying float vDisp;

  // Value noise
  float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1,311.7,74.7))) * 43758.5453); }
  float noise(vec3 p) {
    vec3 i = floor(p), f = fract(p), u = f*f*(3.0-2.0*f);
    return mix(mix(mix(hash(i),          hash(i+vec3(1,0,0)), u.x),
                   mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)), u.x), u.y),
               mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)), u.x),
                   mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)), u.x), u.y), u.z);
  }
  float fbm(vec3 p) {
    float v=0.0, a=0.5;
    for(int i=0;i<5;i++){ v+=a*noise(p); p=p*2.2+vec3(3.7,9.2,1.3); a*=0.5; }
    return v;
  }

  void main() {
    vec3 p = position;
    // Slow large-scale deformation
    float d1 = fbm(p * 0.5 + time * 0.10);
    // Fast small-scale surface churn
    float d2 = fbm(p * 1.8 + time * 0.22 + 17.3);
    float disp = d1 * 0.55 + d2 * 0.25;
    vDisp = disp;
    vec3 displaced = p + normalize(p) * (disp - 0.35) * 1.2;
    vPos    = displaced;
    vNormal = normalize(displaced);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`;

const LAVA_FRAG = `
  uniform float time;
  varying vec3  vNormal;
  varying vec3  vPos;
  varying float vDisp;

  float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1,311.7,74.7))) * 43758.5453); }
  float noise(vec3 p) {
    vec3 i=floor(p),f=fract(p),u=f*f*(3.0-2.0*f);
    return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),u.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),u.x),u.y),
               mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),u.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),u.x),u.y),u.z);
  }
  float fbm(vec3 p){ float v=0.0,a=0.5; for(int i=0;i<6;i++){v+=a*noise(p);p=p*2.1+vec3(3.7,9.2,1.3);a*=0.5;} return v; }

  void main() {
    // Two animated noise layers for the lava flow
    float n1 = fbm(vPos * 0.9  + time * 0.14);
    float n2 = fbm(vPos * 2.0  - time * 0.18 + 33.7);
    float n3 = fbm(vPos * 4.5  + time * 0.28 + vec3(11.0, 5.0, 8.0));

    // Lava colour ramp: dark black rock → glowing crack → white-hot core
    vec3 rock     = vec3(0.04, 0.01, 0.00);
    vec3 embers   = vec3(0.55, 0.12, 0.00);
    vec3 lava     = vec3(1.00, 0.42, 0.02);
    vec3 bright   = vec3(1.00, 0.78, 0.20);
    vec3 hotspot  = vec3(1.80, 1.30, 0.50); // >1 triggers bloom

    float heat = smoothstep(0.25, 0.78, n1 + n2 * 0.5);
    float hot  = smoothstep(0.60, 0.95, n2 + n3 * 0.4);
    float vhot = smoothstep(0.80, 1.00, n1 * n2 + n3 * 0.3);

    vec3 col = mix(rock, embers, smoothstep(0.1, 0.4, heat));
    col      = mix(col,  lava,   smoothstep(0.3, 0.7, heat));
    col      = mix(col,  bright, hot);
    col      = mix(col,  hotspot, vhot); // bloom hotspots

    // Veins — cracks of bright lava
    float veins = 1.0 - smoothstep(0.0, 0.08, abs(n3 - 0.55));
    col += hotspot * veins * 0.6;

    // Inner glow — hotter in the cracks / high displacement
    col += bright * vDisp * 0.4;

    gl_FragColor = vec4(col, 1.0);
  }
`;

function LavaSphere() {
  const mat = useMemo(() => {
    const m = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      vertexShader:   LAVA_VERT,
      fragmentShader: LAVA_FRAG,
      side: THREE.BackSide, // render inside — camera is inside the sphere
    });
    m.toneMapped = false;
    return m;
  }, []);

  useFrame(({ clock }) => { mat.uniforms.time.value = clock.getElapsedTime(); });

  return (
    <mesh>
      {/* Large sphere — camera is inside it, segments high for smooth displacement */}
      <sphereGeometry args={[14, 128, 128]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}

// ─── Inner heat haze — a smaller sphere for mid-depth atmosphere ──────────────
const HAZE_FRAG = `
  uniform float time;
  varying vec3 vPos;
  float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
  float n(vec3 p){vec3 i=floor(p),f=fract(p),u=f*f*(3.0-2.0*f);
    return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),u.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),u.x),u.y),
               mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),u.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),u.x),u.y),u.z);}
  float fbm(vec3 p){float v=0.0,a=0.5;for(int i=0;i<4;i++){v+=a*n(p);p=p*2.0+vec3(1.7,9.2,2.8);a*=0.5;}return v;}
  void main(){
    float h = fbm(vPos * 0.6 + time * 0.08);
    float alpha = smoothstep(0.35, 0.72, h) * 0.18;
    vec3 col = mix(vec3(0.6, 0.12, 0.0), vec3(1.0, 0.5, 0.05), h);
    gl_FragColor = vec4(col, alpha);
  }
`;
const HAZE_VERT = `varying vec3 vPos; void main(){ vPos=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`;

function HazeLayer() {
  const mat = useMemo(() => {
    const m = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      vertexShader: HAZE_VERT,
      fragmentShader: HAZE_FRAG,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    m.toneMapped = false;
    return m;
  }, []);
  useFrame(({ clock }) => { mat.uniforms.time.value = clock.getElapsedTime(); });
  return (
    <mesh>
      <sphereGeometry args={[7, 64, 64]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}

// ─── Ember sparks — float upward through the scene ───────────────────────────
function Embers({ count = 2000 }) {
  const [positions, velocities, colors, sizes] = useMemo(() => {
    const pos  = new Float32Array(count * 3);
    const vel  = new Float32Array(count * 3);
    const col  = new Float32Array(count * 3);
    const sz   = new Float32Array(count);
    const palette = [
      [1.0,0.65,0.05],[1.0,0.45,0.01],[1.0,0.88,0.3],
      [0.9,0.3,0.01],[1.0,1.0,0.6],[1.2,0.55,0.02],
    ];
    for (let i = 0; i < count; i++) {
      const r = Math.random() * 11, theta = Math.random() * Math.PI * 2, phi = Math.random() * Math.PI;
      pos[i*3]   = Math.sin(phi)*Math.cos(theta)*r;
      pos[i*3+1] = Math.cos(phi)*r;
      pos[i*3+2] = Math.sin(phi)*Math.sin(theta)*r;
      vel[i*3]   = (Math.random()-0.5)*0.018;
      vel[i*3+1] = 0.012 + Math.random() * 0.028;
      vel[i*3+2] = (Math.random()-0.5)*0.018;
      sz[i] = 0.03 + Math.random() * 0.09;
      const c = palette[Math.floor(Math.random()*palette.length)];
      col[i*3]=c[0]; col[i*3+1]=c[1]; col[i*3+2]=c[2];
    }
    return [pos, vel, col, sz];
  }, [count]);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions.slice(), 3));
    g.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
    return g;
  }, [positions, colors]);

  const mat = useMemo(() => new THREE.PointsMaterial({
    size: 0.08, vertexColors: true, transparent: true, opacity: 0.95,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  }), []);

  useFrame(() => {
    const pos = geo.attributes.position.array;
    for (let i = 0; i < count; i++) {
      pos[i*3]   += velocities[i*3];
      pos[i*3+1] += velocities[i*3+1];
      pos[i*3+2] += velocities[i*3+2];
      const d = Math.sqrt(pos[i*3]**2+pos[i*3+1]**2+pos[i*3+2]**2);
      if (d > 11) {
        const r = Math.random()*4, theta=Math.random()*Math.PI*2, phi=Math.random()*Math.PI;
        pos[i*3]=Math.sin(phi)*Math.cos(theta)*r;
        pos[i*3+1]=(Math.random()-0.5)*3;
        pos[i*3+2]=Math.sin(phi)*Math.sin(theta)*r;
      }
    }
    geo.attributes.position.needsUpdate = true;
  });

  return <points geometry={geo} material={mat} />;
}

// ─── Slow camera drift — subtle rotation makes you feel you're floating ───────
function FloatingCamera() {
  useFrame(({ clock, camera }) => {
    const t = clock.getElapsedTime();
    camera.position.x = Math.sin(t * 0.08) * 0.8;
    camera.position.y = Math.sin(t * 0.06 + 1.2) * 0.5;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

// ─── Scene ────────────────────────────────────────────────────────────────────
export default function LavaScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 0.1], fov: 85 }}
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
      gl={{
        antialias: true,
        alpha: false,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 0.8,
      }}
      onCreated={({ gl }) => gl.setClearColor('#0a0200')}
    >
      <FloatingCamera />

      {/* The world — you're inside these */}
      <LavaSphere />
      <HazeLayer />
      <Embers count={2000} />

      {/* Stars peek through the cooler dark patches */}
      <Stars radius={13} depth={2} count={800} factor={1.5} saturation={0.1} fade speed={0.2} />

      {/* Warm light sources — feel of fire all around */}
      <pointLight position={[ 5, 3, -4]} intensity={8}  color="#ff6a00" distance={20} decay={2} />
      <pointLight position={[-5,-3,  4]} intensity={6}  color="#f59e0b" distance={18} decay={2} />
      <pointLight position={[ 2, 5, -2]} intensity={4}  color="#fbbf24" distance={12} decay={2} />
      <ambientLight intensity={0.08} color="#200800" />

      <EffectComposer>
        <Bloom intensity={2.8} luminanceThreshold={0.05} luminanceSmoothing={0.90} mipmapBlur radius={0.88} />
        <ChromaticAberration offset={new THREE.Vector2(0.0004, 0.0004)} />
        <Vignette eskil={false} offset={0.25} darkness={0.60} />
      </EffectComposer>
    </Canvas>
  );
}
