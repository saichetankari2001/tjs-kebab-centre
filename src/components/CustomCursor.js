import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function CustomCursor() {
  const [visible, setVisible] = useState(false);
  const [clicking, setClicking] = useState(false);
  const [hovering, setHovering] = useState(false);

  const mx = useMotionValue(-200);
  const my = useMotionValue(-200);

  // Dot — tight
  const dx = useSpring(mx, { stiffness: 900, damping: 45, mass: 0.4 });
  const dy = useSpring(my, { stiffness: 900, damping: 45, mass: 0.4 });

  // Ring — loose, trails behind
  const rx = useSpring(mx, { stiffness: 110, damping: 20, mass: 0.8 });
  const ry = useSpring(my, { stiffness: 110, damping: 20, mass: 0.8 });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Hide on touch devices
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const move = (e) => { mx.set(e.clientX); my.set(e.clientY); setVisible(true); };
    const leave = () => setVisible(false);
    const down = () => setClicking(true);
    const up = () => setClicking(false);

    const checkHover = (e) => {
      const el = e.target;
      const isInteractive = el.closest('button, a, [role="button"], input, textarea, select, [onClick]');
      setHovering(!!isInteractive);
    };

    window.addEventListener('mousemove', move);
    window.addEventListener('mousemove', checkHover);
    window.addEventListener('mouseleave', leave);
    window.addEventListener('mousedown', down);
    window.addEventListener('mouseup', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mousemove', checkHover);
      window.removeEventListener('mouseleave', leave);
      window.removeEventListener('mousedown', down);
      window.removeEventListener('mouseup', up);
    };
  }, [mx, my]);

  if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) return null;

  return (
    <>
      {/* Outer ring — slow, trails */}
      <motion.div
        style={{
          x: rx, y: ry,
          position: 'fixed',
          top: 0, left: 0,
          translateX: '-50%',
          translateY: '-50%',
          width: hovering ? 52 : 36,
          height: hovering ? 52 : 36,
          borderRadius: '50%',
          border: `1px solid ${hovering ? 'rgba(245,158,11,0.75)' : 'rgba(245,158,11,0.40)'}`,
          background: hovering ? 'rgba(245,158,11,0.06)' : 'transparent',
          pointerEvents: 'none',
          zIndex: 99999,
          opacity: visible ? 1 : 0,
          boxShadow: hovering ? '0 0 20px rgba(245,158,11,0.25)' : 'none',
          transition: 'width 0.25s ease, height 0.25s ease, border-color 0.2s, box-shadow 0.2s',
        }}
      />

      {/* Inner dot — fast, exact */}
      <motion.div
        style={{
          x: dx, y: dy,
          position: 'fixed',
          top: 0, left: 0,
          translateX: '-50%',
          translateY: '-50%',
          width: clicking ? 4 : 6,
          height: clicking ? 4 : 6,
          borderRadius: '50%',
          background: 'rgba(245,158,11,0.95)',
          pointerEvents: 'none',
          zIndex: 99999,
          opacity: visible ? 1 : 0,
          boxShadow: '0 0 8px rgba(245,158,11,0.8)',
          transition: 'width 0.1s ease, height 0.1s ease',
        }}
      />
    </>
  );
}
