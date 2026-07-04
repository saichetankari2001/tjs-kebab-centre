import { useEffect, useRef } from 'react';

const COUNT = 220;

export default function VisualCanvas() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let W, H, raf;
    const resize = () => {
      W = canvas.width  = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // 3D star-field particles — each has an (x, y, z) in 3D space
    const pts = Array.from({ length: COUNT }, () => spawn());

    function spawn() {
      return {
        x:  (Math.random() - 0.5) * 2400,
        y:  (Math.random() - 0.5) * 2400,
        z:  Math.random() * 1800 + 100,
        vz: -(0.4 + Math.random() * 1.2),
        r:  0.6 + Math.random() * 2.2,
        hue: Math.random() > 0.72 ? 38 : (Math.random() > 0.5 ? 25 : 200), // amber / orange / blue-white
        sat: 60 + Math.random() * 40,
      };
    }

    const FOV = 700;

    function project(p) {
      const s = FOV / (FOV + p.z);
      return { sx: W / 2 + p.x * s, sy: H / 2 + p.y * s, s };
    }

    function tick() {
      ctx.clearRect(0, 0, W, H);

      for (const p of pts) {
        p.z += p.vz;
        if (p.z < 1) {
          Object.assign(p, spawn(), { z: 1800 });
        }

        const { sx, sy, s } = project(p);
        if (sx < -20 || sx > W + 20 || sy < -20 || sy > H + 20) continue;

        const alpha  = Math.min(1, (1800 - p.z) / 1000) * 0.85;
        const radius = Math.max(0.3, p.r * s * 2.2);

        // Core dot
        ctx.beginPath();
        ctx.arc(sx, sy, radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue},${p.sat}%,75%,${alpha})`;
        ctx.fill();

        // Outer glow
        if (radius > 1) {
          const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, radius * 5);
          g.addColorStop(0, `hsla(${p.hue},100%,70%,${alpha * 0.35})`);
          g.addColorStop(1, `hsla(${p.hue},100%,60%,0)`);
          ctx.beginPath();
          ctx.arc(sx, sy, radius * 5, 0, Math.PI * 2);
          ctx.fillStyle = g;
          ctx.fill();
        }

        // Motion trail — draw a line toward screen center (warp-speed streak)
        const prevZ = p.z - p.vz * 18;
        if (prevZ > 0) {
          const prev = project({ ...p, z: prevZ });
          ctx.beginPath();
          ctx.moveTo(prev.sx, prev.sy);
          ctx.lineTo(sx, sy);
          ctx.strokeStyle = `hsla(${p.hue},${p.sat}%,75%,${alpha * 0.4})`;
          ctx.lineWidth = radius * 0.7;
          ctx.stroke();
        }
      }

      raf = requestAnimationFrame(tick);
    }

    tick();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
