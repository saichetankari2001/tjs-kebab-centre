import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette, ChromaticAberration, DepthOfField } from '@react-three/postprocessing';
import * as THREE from 'three';

// ─── Shared GLSL ─────────────────────────────────────────────────────────────
const VERT = `
  varying vec3 vPos;
  varying vec3 vNormal;
  void main(){
    vPos=position;
    vNormal=normalize(normalMatrix*normal);
    gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
  }
`;

// Gold liquid shader
const GOLD_FRAG = `
  uniform float time;
  varying vec3 vPos; varying vec3 vNormal;
  float h(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
  float n(vec3 p){vec3 i=floor(p),f=fract(p),u=f*f*(3.0-2.0*f);
    return mix(mix(mix(h(i),h(i+vec3(1,0,0)),u.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),u.x),u.y),
               mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),u.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),u.x),u.y),u.z);}
  float fbm(vec3 p){float v=0.0,a=0.5;for(int i=0;i<6;i++){v+=a*n(p);p=p*2.1+vec3(3.7,9.2,1.3);a*=0.5;}return v;}
  void main(){
    float n1=fbm(vPos*1.2+time*0.20); float n2=fbm(vPos*2.5-time*0.12+47.0);
    vec3 col=mix(vec3(0.5,0.18,0.0),vec3(1.0,0.72,0.1),smoothstep(0.2,0.75,n1));
    col=mix(col,vec3(1.9,1.3,0.35),pow(n2,2.5)*0.8);
    col+=vec3(1.6,0.85,0.15)*pow(1.0-abs(dot(vNormal,vec3(0,0,1))),3.0)*0.6;
    float a=mix(smoothstep(0.1,0.6,n1+0.3+sin(time*0.3+vPos.y)*0.1),smoothstep(0.35,0.55,fbm(vPos*0.6+vec3(time*0.07,-time*0.1,time*0.05))+sin(time*0.5)*0.08),0.28)*0.92;
    gl_FragColor=vec4(col,a);
  }
`;

// Electric blue shader
const BLUE_FRAG = `
  uniform float time;
  varying vec3 vPos; varying vec3 vNormal;
  float h(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
  float n(vec3 p){vec3 i=floor(p),f=fract(p),u=f*f*(3.0-2.0*f);
    return mix(mix(mix(h(i),h(i+vec3(1,0,0)),u.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),u.x),u.y),
               mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),u.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),u.x),u.y),u.z);}
  float fbm(vec3 p){float v=0.0,a=0.5;for(int i=0;i<4;i++){v+=a*n(p);p=p*2.0+vec3(1.7,9.2,2.8);a*=0.5;}return v;}
  void main(){
    float n1=fbm(vPos*2.0+time*0.28);
    float pulse=0.5+0.5*sin(time*2.4+vPos.x*3.0+vPos.y*2.0);
    vec3 col=mix(vec3(0.0,0.08,0.40),vec3(0.28,0.72,1.8),smoothstep(0.2,0.8,n1));
    col=mix(col,vec3(1.3,1.55,2.0),pow(pulse,3.0)*0.5);
    col+=vec3(1.3,1.55,2.0)*pow(1.0-abs(dot(vNormal,vec3(0,0,1))),2.5)*0.85;
    gl_FragColor=vec4(col,(0.55+0.35*n1)*0.92);
  }
`;

function makeGoldMat()  { const m=new THREE.ShaderMaterial({uniforms:{time:{value:0}},vertexShader:VERT,fragmentShader:GOLD_FRAG,transparent:true,side:THREE.DoubleSide,depthWrite:false}); m.toneMapped=false; return m; }
function makeBlueMat()  { const m=new THREE.ShaderMaterial({uniforms:{time:{value:0}},vertexShader:VERT,fragmentShader:BLUE_FRAG,transparent:true,side:THREE.DoubleSide,depthWrite:false}); m.toneMapped=false; return m; }

// ─── Massive gold icosahedron — fills most of the screen ─────────────────────
function GoldenCore() {
  const g = useRef();
  const mat = useMemo(() => makeGoldMat(), []);
  useFrame(({ clock }, dt) => {
    mat.uniforms.time.value = clock.getElapsedTime();
    if (g.current) { g.current.rotation.y += 0.04*dt; g.current.rotation.x += 0.016*dt; }
  });
  return (
    <group ref={g} position={[1.5, 0, -1]}>
      {/* Outer wireframe — big enough to wrap around viewport edges */}
      <mesh><icosahedronGeometry args={[5.5, 1]} /><meshStandardMaterial color="#78350f" emissive="#f59e0b" emissiveIntensity={1.2} wireframe toneMapped={false} /></mesh>
      {/* Liquid gold surface */}
      <mesh><icosahedronGeometry args={[4.8, 2]} /><primitive object={mat} attach="material" /></mesh>
      {/* Inner mid shell for depth */}
      <mesh><icosahedronGeometry args={[3.0, 1]} /><meshStandardMaterial color="#92400e" emissive="#fbbf24" emissiveIntensity={0.8} wireframe transparent opacity={0.4} toneMapped={false} /></mesh>
      {/* Blazing core */}
      <mesh><sphereGeometry args={[0.6, 32, 32]} /><meshStandardMaterial color="#fffbeb" emissive="#fef08a" emissiveIntensity={10} roughness={0} toneMapped={false} /></mesh>
    </group>
  );
}

// ─── Electric torus knot — upper left, large ─────────────────────────────────
function ElectricKnot() {
  const ref = useRef();
  const mat = useMemo(() => makeBlueMat(), []);
  useFrame(({ clock }, dt) => {
    mat.uniforms.time.value = clock.getElapsedTime();
    if (ref.current) { ref.current.rotation.x += 0.09*dt; ref.current.rotation.z += 0.06*dt; }
  });
  return (
    <group position={[-5.5, 2.5, 0]}>
      <mesh ref={ref}><torusKnotGeometry args={[1.6, 0.55, 200, 24, 2, 3]} /><primitive object={mat} attach="material" /></mesh>
      <mesh rotation={[0.2,0.5,0]}><torusKnotGeometry args={[1.9, 0.07, 80, 8, 2, 3]} /><meshStandardMaterial color="#1d4ed8" emissive="#60a5fa" emissiveIntensity={3} wireframe toneMapped={false} /></mesh>
      <mesh><sphereGeometry args={[0.32,16,16]} /><meshStandardMaterial color="#e0f2fe" emissive="#38bdf8" emissiveIntensity={10} toneMapped={false} /></mesh>
    </group>
  );
}

// ─── Foreground depth orbs — very close to camera, blurred by DoF ────────────
function DepthOrbs() {
  const refs = useRef([]);
  const ORBS = [
    { pos: [-3.5, -2.0, 3.5], color: '#f59e0b', emissive: '#fbbf24', size: 0.28 },
    { pos: [ 4.0,  2.5, 3.0], color: '#38bdf8', emissive: '#7dd3fc', size: 0.22 },
    { pos: [-1.5,  3.0, 4.0], color: '#fbbf24', emissive: '#fef08a', size: 0.18 },
    { pos: [ 3.0, -2.5, 3.8], color: '#60a5fa', emissive: '#93c5fd', size: 0.15 },
  ];
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    ORBS.forEach((orb, i) => {
      if (refs.current[i]) {
        refs.current[i].position.y = orb.pos[1] + Math.sin(t * 0.5 + i * 1.3) * 0.3;
        refs.current[i].position.x = orb.pos[0] + Math.cos(t * 0.4 + i * 0.9) * 0.2;
      }
    });
  });
  return (
    <>
      {ORBS.map((orb, i) => (
        <mesh key={i} ref={el => (refs.current[i] = el)} position={orb.pos}>
          <sphereGeometry args={[orb.size, 16, 16]} />
          <meshStandardMaterial color={orb.color} emissive={orb.emissive} emissiveIntensity={8} roughness={0} toneMapped={false} />
        </mesh>
      ))}
    </>
  );
}

// ─── Sonar pulse rings ────────────────────────────────────────────────────────
function PulseRings() {
  const COUNT = 4, refs = useRef([]);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    for (let i = 0; i < COUNT; i++) {
      const p = ((t/5.0) + i/COUNT) % 1;
      if (refs.current[i]) {
        refs.current[i].scale.setScalar(0.5 + p * 12);
        refs.current[i].material.opacity = Math.pow(1-p, 1.6) * 0.75;
      }
    }
  });
  return (
    <group position={[1.5, -0.5, -1]}>
      {Array.from({length:COUNT},(_,i)=>(
        <mesh key={i} ref={el=>(refs.current[i]=el)} rotation={[-Math.PI/2,0,0]}>
          <ringGeometry args={[0.9,1.0,80]} />
          <meshBasicMaterial color="#f59e0b" transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Multi-layer particles — near gold, far blue, mid mixed ──────────────────
function VolumetricParticles() {
  const count = 2000;
  const [geo, mat] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    // Three depth zones: near (z 2-5), mid (z -2 to 2), far (z -8 to -4)
    const zones = [
      { z: [2, 5],   col: [[1,0.65,0.05],[1,0.82,0.28]], count: 300, upward: true },
      { z: [-2, 2],  col: [[1,0.5,0.02],[0.2,0.8,1],[1,0.9,0.4]], count: 900, upward: false },
      { z: [-8, -4], col: [[0.2,0.7,1],[0.4,0.6,1],[0.9,0.4,0]], count: 800, upward: false },
    ];
    let idx = 0;
    zones.forEach(zone => {
      for (let i = 0; i < zone.count; i++, idx++) {
        const r = Math.random() * 12, theta = Math.random() * Math.PI * 2;
        pos[idx*3]   = Math.cos(theta) * r;
        pos[idx*3+1] = (Math.random() - 0.5) * 10;
        pos[idx*3+2] = zone.z[0] + Math.random() * (zone.z[1] - zone.z[0]);
        vel[idx*3]   = (Math.random()-0.5)*0.01;
        vel[idx*3+1] = zone.upward ? 0.006+Math.random()*0.015 : (Math.random()-0.5)*0.008;
        vel[idx*3+2] = (Math.random()-0.5)*0.004;
        const c = zone.col[Math.floor(Math.random()*zone.col.length)];
        col[idx*3]=c[0]; col[idx*3+1]=c[1]; col[idx*3+2]=c[2];
      }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color',    new THREE.BufferAttribute(col, 3));
    const m = new THREE.PointsMaterial({ size:0.065, vertexColors:true, transparent:true, opacity:0.9, blending:THREE.AdditiveBlending, depthWrite:false, sizeAttenuation:true });
    return [g, m, vel];
  }, []);

  const velRef = useMemo(() => {
    const vel = new Float32Array(count * 3);
    let idx = 0;
    const zones = [
      { z: [2, 5],  count: 300, upward: true  },
      { z: [-2, 2], count: 900, upward: false },
      { z: [-8,-4], count: 800, upward: false },
    ];
    zones.forEach(zone => {
      for (let i = 0; i < zone.count; i++, idx++) {
        vel[idx*3]   = (Math.random()-0.5)*0.01;
        vel[idx*3+1] = zone.upward ? 0.006+Math.random()*0.015 : (Math.random()-0.5)*0.008;
        vel[idx*3+2] = (Math.random()-0.5)*0.004;
      }
    });
    return vel;
  }, []);

  useFrame(() => {
    const pos = geo.attributes.position.array;
    for (let i = 0; i < count; i++) {
      pos[i*3]   += velRef[i*3];
      pos[i*3+1] += velRef[i*3+1];
      pos[i*3+2] += velRef[i*3+2];
      if (pos[i*3+1] > 6)  pos[i*3+1] = -5;
      if (pos[i*3+1] < -6) pos[i*3+1] =  5;
    }
    geo.attributes.position.needsUpdate = true;
  });

  return <points geometry={geo} material={mat} />;
}

// ─── Accent rings ─────────────────────────────────────────────────────────────
function AccentRings() {
  const r1=useRef(), r2=useRef(), r3=useRef();
  useFrame((_,dt)=>{
    if(r1.current) r1.current.rotation.z += 0.14*dt;
    if(r2.current) r2.current.rotation.x += 0.09*dt;
    if(r3.current) r3.current.rotation.y += 0.12*dt;
  });
  return (
    <group position={[1.5, 0, -1]}>
      <mesh ref={r1}><torusGeometry args={[6.0,0.028,8,80]} /><meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={2.5} toneMapped={false} /></mesh>
      <mesh ref={r2} rotation={[Math.PI/2.2,0,0]}><torusGeometry args={[7.2,0.018,8,100]} /><meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={2} toneMapped={false} /></mesh>
      <mesh ref={r3} rotation={[Math.PI/3,Math.PI/4,0]}><torusGeometry args={[5.0,0.012,8,80]} /><meshStandardMaterial color="#60a5fa" emissive="#60a5fa" emissiveIntensity={2.5} toneMapped={false} /></mesh>
    </group>
  );
}

// ─── Scene ────────────────────────────────────────────────────────────────────
export default function EmberScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 7], fov: 80 }}
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
      gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.85 }}
      onCreated={({ gl }) => gl.setClearColor('#0c0805')}
    >
      <ambientLight intensity={0.04} />
      <pointLight position={[1.5, 0, -1]}  intensity={5} color="#f59e0b" distance={25} decay={2} />
      <pointLight position={[-5.5, 2.5, 0]} intensity={4} color="#38bdf8" distance={20} decay={2} />
      <pointLight position={[0, 0, 5]}      intensity={1} color="#fbbf24" distance={10} decay={2} />

      <GoldenCore />
      <ElectricKnot />
      <AccentRings />
      <PulseRings />
      <DepthOrbs />
      <VolumetricParticles />

      <EffectComposer>
        <DepthOfField focusDistance={0.012} focalLength={0.04} bokehScale={2.5} height={480} />
        <Bloom intensity={2.5} luminanceThreshold={0.06} luminanceSmoothing={0.88} mipmapBlur radius={0.85} />
        <ChromaticAberration offset={new THREE.Vector2(0.0006, 0.0006)} />
        <Vignette eskil={false} offset={0.2} darkness={0.45} />
      </EffectComposer>
    </Canvas>
  );
}
