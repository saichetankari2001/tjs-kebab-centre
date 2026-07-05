import { useEffect, useRef } from 'react';

export default function VortexCanvas() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let W, H, raf;
    let targetSpeed = 1, speed = 1;
    let targetTilt = 0.52, tilt = 0.52;

    const resize = () => {
      W = canvas.width  = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
      buildRings();
    };

    const onMouse = (e) => {
      const mx = e.clientX / window.innerWidth  - 0.5;
      const my = e.clientY / window.innerHeight - 0.5;
      targetSpeed = 1 + mx * 4;
      targetTilt  = 0.38 + my * 0.9;
    };
    window.addEventListener('mousemove', onMouse);
    window.addEventListener('resize', resize);

    let pts = [];

    function buildRings() {
      const base = Math.min(W, H) * 0.5;
      // 6 rings scaled to actual screen size
      const RINGS = [
        { r: base * 0.14, count: 35,  speed: 0.010, z: -200, hue: 38,  sat: 95, size: 2.2 },
        { r: base * 0.26, count: 55,  speed: 0.007, z: -110, hue: 28,  sat: 90, size: 1.8 },
        { r: base * 0.40, count: 75,  speed: 0.005, z:  -30, hue: 38,  sat: 85, size: 1.5 },
        { r: base * 0.55, count: 95,  speed: 0.0035,z:   60, hue: 200, sat: 80, size: 1.3 },
        { r: base * 0.72, count: 115, speed: 0.0025,z:  160, hue: 38,  sat: 80, size: 1.1 },
        { r: base * 0.90, count: 135, speed: 0.0018,z:  270, hue: 25,  sat: 75, size: 0.9 },
      ];
      pts = RINGS.flatMap(ring =>
        Array.from({ length: ring.count }, (_, i) => ({
          angle:  (i / ring.count) * Math.PI * 2 + Math.random() * 0.25,
          radius: ring.r  + (Math.random() - 0.5) * ring.r * 0.14,
          ringZ:  ring.z  + (Math.random() - 0.5) * 60,
          speed:  ring.speed * (0.75 + Math.random() * 0.5),
          size:   ring.size * (0.5 + Math.random() * 1.0),
          alpha:  0.55 + Math.random() * 0.45,
          hue:    ring.hue  + (Math.random() - 0.5) * 18,
          sat:    ring.sat,
        }))
      );
    }

    resize();

    const FOV = 580;

    function tick() {
      speed += (targetSpeed - speed) * 0.04;
      tilt  += (targetTilt  - tilt)  * 0.04;

      // Fade trail — key to the "glowing ring" look
      ctx.fillStyle = 'rgba(2,1,0,0.30)';
      ctx.fillRect(0, 0, W, H);

      const cosT = Math.cos(tilt);
      const sinT = Math.sin(tilt);

      // Sort back to front
      pts.sort((a, b) => {
        const za = a.ringZ + Math.sin(a.angle) * a.radius * cosT;
        const zb = b.ringZ + Math.sin(b.angle) * b.radius * cosT;
        return za - zb;
      });

      for (const p of pts) {
        const prevAngle = p.angle;
        p.angle += p.speed * speed;

        // 3-D ring coords
        const lx  = p.radius * Math.cos(p.angle);
        const lz  = p.radius * Math.sin(p.angle);
        const wy  = -lz * sinT;
        const wz  =  p.ringZ + lz * cosT;

        const depth = FOV + wz;
        if (depth < 10) continue;
        const scale = FOV / depth;
        const sx = W / 2 + lx * scale;
        const sy = H / 2 + wy * scale;
        if (sx < -40 || sx > W + 40 || sy < -40 || sy > H + 40) continue;

        const depthFade = Math.min(1, (FOV + 300) / (depth + 1));
        const alpha = p.alpha * depthFade;
        const r     = Math.max(0.5, p.size * scale);

        // Motion trail to previous position
        const plx = p.radius * Math.cos(prevAngle);
        const plz = p.radius * Math.sin(prevAngle);
        const pwy = -plz * sinT;
        const pwz =  p.ringZ + plz * cosT;
        const pd  = FOV + pwz;
        if (pd > 10) {
          const ps  = FOV / pd;
          const psx = W / 2 + plx * ps;
          const psy = H / 2 + pwy * ps;
          ctx.beginPath();
          ctx.moveTo(psx, psy);
          ctx.lineTo(sx, sy);
          ctx.strokeStyle = `hsla(${p.hue},${p.sat}%,72%,${alpha * 0.55})`;
          ctx.lineWidth = r * 1.2;
          ctx.stroke();
        }

        // Outer glow halo
        const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 7);
        g.addColorStop(0, `hsla(${p.hue},100%,75%,${alpha * 0.50})`);
        g.addColorStop(0.4, `hsla(${p.hue},100%,65%,${alpha * 0.20})`);
        g.addColorStop(1,   `hsla(${p.hue},100%,55%,0)`);
        ctx.beginPath();
        ctx.arc(sx, sy, r * 7, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();

        // Core bright dot
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue},${p.sat}%,90%,${alpha})`;
        ctx.fill();
      }

      // Central convergence glow — looks like a HUD targeting reticle
      const cg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.min(W, H) * 0.22);
      cg.addColorStop(0,   'rgba(245,158,11,0.055)');
      cg.addColorStop(0.5, 'rgba(245,158,11,0.018)');
      cg.addColorStop(1,   'rgba(245,158,11,0)');
      ctx.beginPath();
      ctx.ellipse(W / 2, H / 2, Math.min(W, H) * 0.22, Math.min(W, H) * 0.22, 0, 0, Math.PI * 2);
      ctx.fillStyle = cg;
      ctx.fill();

      raf = requestAnimationFrame(tick);
    }

    tick();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouse);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}
    />
  );
}
