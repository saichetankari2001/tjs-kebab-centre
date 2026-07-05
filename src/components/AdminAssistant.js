import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRive, useStateMachineInput } from '@rive-app/react-canvas';

// Mood + tip per tab index
const TAB_CONFIG = {
  0: { mood: 'idle',     color: '#f59e0b', label: 'OVERVIEW',     tip: 'Dashboard is live. All systems online.' },
  1: { mood: 'happy',    color: '#4ade80', label: 'MENU',         tip: 'Looking good! Menu has active items ready.' },
  2: { mood: 'thinking', color: '#4a9eff', label: 'ORDERS',       tip: 'Monitoring incoming orders in real time.' },
  3: { mood: 'alert',    color: '#ff8c42', label: 'PROMOTIONS',   tip: 'Run a deal to drive foot traffic.' },
  4: { mood: 'happy',    color: '#4ade80', label: 'DRINKS',       tip: 'Drinks menu is set and ready to serve.' },
  5: { mood: 'wave',     color: '#a78bfa', label: 'STAFF',        tip: 'Team management — keep the crew sharp.' },
  6: { mood: 'idle',     color: '#f59e0b', label: 'QR CODE',      tip: 'QR code ready — print and display it.' },
  7: { mood: 'alert',    color: '#ff8c42', label: 'BLAST',        tip: 'Mass message — reach all subscribers at once.' },
  8: { mood: 'thinking', color: '#4a9eff', label: 'SUBSCRIBERS',  tip: 'Subscriber list loaded and up to date.' },
};

// mood → numeric value for Rive state machine (common robot .riv files use a "mood" number input)
const MOOD_NUM = { idle: 0, happy: 1, thinking: 2, wave: 3, alert: 4 };

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// ── CSS robot orb — shown when robot.riv isn't placed in /public ──────────────
function RobotOrb({ mood, color, size = 64 }) {
  const isHappy    = mood === 'happy';
  const isAlert    = mood === 'alert';
  const isThinking = mood === 'thinking';
  const isWave     = mood === 'wave';

  return (
    <div style={{ width: size, height: size, position: 'relative', flexShrink: 0 }}>
      {/* Outer pulse ring */}
      <div style={{
        position: 'absolute', inset: -4, borderRadius: '50%',
        border: `1.5px solid ${color}40`,
        animation: 'orb-pulse 2.4s ease-in-out infinite',
        pointerEvents: 'none',
      }} />

      {/* Orb body */}
      <div style={{
        width: '100%', height: '100%', borderRadius: '50%',
        background: `radial-gradient(circle at 32% 32%, ${color}cc 0%, ${color}44 55%, ${color}0d 100%)`,
        boxShadow: `0 0 20px ${color}55, inset 0 0 14px ${color}22`,
        animation: isThinking ? 'orb-spin 1.4s linear infinite' : 'orb-breathe 3.2s ease-in-out infinite',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 3, position: 'relative',
      }}>
        {/* Eyes */}
        <div style={{ display: 'flex', gap: isHappy ? 10 : 8, alignItems: 'center' }}>
          {[0, 1].map(i => (
            <div key={i} style={{
              width:  isAlert ? 6 : 4,
              height: isHappy ? 2.5 : isAlert ? 6 : 4,
              borderRadius: isHappy ? '40% 40% 60% 60%' : '50%',
              background: '#fff',
              boxShadow: `0 0 5px ${color}`,
              animation: isThinking
                ? `orb-blink 1.8s step-end ${i * 0.9}s infinite`
                : 'none',
            }} />
          ))}
        </div>
        {/* Mouth */}
        <div style={{
          width:  isHappy ? 12 : isAlert ? 6 : 7,
          height: 2,
          borderRadius: 4,
          background: '#ffffffcc',
          marginTop: 1,
          borderBottomLeftRadius:  isHappy ? 6 : isAlert ? 0 : 4,
          borderBottomRightRadius: isHappy ? 6 : isAlert ? 0 : 4,
          borderTopLeftRadius:     isAlert ? 4 : 0,
          borderTopRightRadius:    isAlert ? 4 : 0,
        }} />
      </div>

      {/* Antenna */}
      <div style={{
        position: 'absolute', top: -10, left: '50%',
        transform: 'translateX(-50%)',
        width: 2, height: 10, background: color, borderRadius: 1,
        boxShadow: `0 0 6px ${color}`,
      }}>
        <div style={{
          position: 'absolute', top: -5, left: '50%',
          transform: 'translateX(-50%)',
          width: 6, height: 6, borderRadius: '50%',
          background: color, boxShadow: `0 0 8px ${color}`,
          animation: 'orb-pulse 1.6s ease-in-out infinite',
        }} />
      </div>

      {/* Wave arm */}
      {isWave && (
        <div style={{
          position: 'absolute', right: -8, top: '38%',
          width: 10, height: 3, background: color, borderRadius: 2,
          transformOrigin: 'left center',
          animation: 'orb-wave 0.55s ease-in-out infinite alternate',
          boxShadow: `0 0 6px ${color}`,
        }} />
      )}
    </div>
  );
}

// ── Full-screen greeting — shows once per session right after login ─────────────
function GreetingOverlay({ todaysOrders, todaysRevenue, pendingCount, onDone }) {
  const [alive, setAlive] = useState(true);

  const dismiss = () => {
    setAlive(false);
    setTimeout(onDone, 600);
  };

  useEffect(() => {
    const t = setTimeout(dismiss, 5200);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const greeting   = getGreeting();
  const count      = Array.isArray(todaysOrders) ? todaysOrders.length : todaysOrders;
  const revenue    = typeof todaysRevenue === 'number' ? `$${todaysRevenue.toFixed(2)}` : '$0.00';
  const hasPending = pendingCount > 0;

  return (
    <AnimatePresence>
      {alive && (
        <motion.div
          key="greeting"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          onClick={dismiss}
          style={{
            position: 'fixed', inset: 0, zIndex: 9000,
            background: 'rgba(2,4,12,0.90)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 0, cursor: 'pointer',
          }}
        >
          {/* Character entrance */}
          <motion.div
            initial={{ scale: 0, y: 60 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 160, damping: 16, delay: 0.15 }}
            style={{ marginBottom: 40 }}
          >
            <RobotOrb mood="wave" color="#f59e0b" size={108} />
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.48, duration: 0.55 }}
            style={{ textAlign: 'center', maxWidth: 460, padding: '0 28px' }}
          >
            <div style={{
              fontSize: 30, fontWeight: 800, color: '#f5ead0',
              fontFamily: '"Courier New", monospace', letterSpacing: 0.5,
              marginBottom: 14,
            }}>
              {greeting}, boss.
            </div>

            <div style={{
              fontSize: 15, color: 'rgba(245,208,80,0.88)',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500, lineHeight: 1.75,
            }}>
              {count > 0
                ? <>Today has <strong style={{ color: '#fbbf24' }}>{count} order{count !== 1 ? 's' : ''}</strong> — <strong style={{ color: '#fbbf24' }}>{revenue}</strong> in revenue.</>
                : 'No orders yet today — shop is primed and ready.'}
              {hasPending && (
                <><br /><span style={{ color: '#ff8c42', fontWeight: 700 }}>
                  {pendingCount} pending
                </span>{' '}order{pendingCount !== 1 ? 's' : ''} need{pendingCount === 1 ? 's' : ''} your attention.</>
              )}
            </div>

            <div style={{
              marginTop: 32, fontSize: 10, color: 'rgba(148,163,184,0.38)',
              fontFamily: 'Inter, sans-serif', letterSpacing: 1.5,
              textTransform: 'uppercase',
            }}>
              tap anywhere to continue
            </div>
          </motion.div>

          {/* Progress bar — auto-dismiss countdown */}
          <motion.div
            style={{
              position: 'absolute', bottom: 0, left: 0, height: 2,
              background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
              boxShadow: '0 0 8px #f59e0b',
            }}
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: 5.2, ease: 'linear' }}
          />

          {/* Corner brackets */}
          {[
            { top: 20, left: 20 }, { top: 20, right: 20 },
            { bottom: 20, left: 20 }, { bottom: 20, right: 20 },
          ].map((pos, i) => {
            const isRight  = 'right'  in pos;
            const isBottom = 'bottom' in pos;
            return (
              <div key={i} style={{ position: 'fixed', width: 28, height: 28, pointerEvents: 'none', ...pos }}>
                <div style={{ position: 'absolute', [isBottom ? 'bottom' : 'top']: 0, [isRight ? 'right' : 'left']: 0, width: 18, height: 2, background: '#f59e0b', opacity: 0.5 }} />
                <div style={{ position: 'absolute', [isBottom ? 'bottom' : 'top']: 0, [isRight ? 'right' : 'left']: 0, width: 2, height: 18, background: '#f59e0b', opacity: 0.5 }} />
              </div>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Main floating assistant widget ────────────────────────────────────────────
export default function AdminAssistant({ tab = 0, todaysOrders = [], todaysRevenue = 0, pendingCount = 0 }) {
  const [showGreeting, setShowGreeting] = useState(false);
  const [bubble, setBubble] = useState(false);
  const [riveReady, setRiveReady] = useState(false);

  const { mood, color, tip } = TAB_CONFIG[tab] ?? TAB_CONFIG[0];

  // Show greeting once per session
  useEffect(() => {
    if (!sessionStorage.getItem('nova-greeted')) {
      sessionStorage.setItem('nova-greeted', '1');
      const t = setTimeout(() => setShowGreeting(true), 900);
      return () => clearTimeout(t);
    }
  }, []);

  // Rive — loads /robot.riv from public folder; falls back silently if absent
  const { rive, RiveComponent } = useRive({
    src: '/robot.riv',
    stateMachines: 'State Machine 1',
    autoplay: true,
    onLoad:      () => setRiveReady(true),
    onLoadError: () => setRiveReady(false),
  });

  // Drive Rive state machine with current mood
  const moodInput = useStateMachineInput(rive, 'State Machine 1', 'mood');
  useEffect(() => {
    if (moodInput != null) moodInput.value = MOOD_NUM[mood] ?? 0;
  }, [mood, moodInput]);

  return (
    <>
      {/* One-time login greeting */}
      {showGreeting && (
        <GreetingOverlay
          todaysOrders={todaysOrders}
          todaysRevenue={todaysRevenue}
          pendingCount={pendingCount}
          onDone={() => setShowGreeting(false)}
        />
      )}

      {/* Floating corner widget */}
      <motion.div
        style={{ position: 'fixed', right: 24, bottom: 24, zIndex: 500 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.6, type: 'spring', stiffness: 160, damping: 20 }}
      >
        {/* Speech bubble */}
        <AnimatePresence>
          {bubble && (
            <motion.div
              key="bubble"
              initial={{ opacity: 0, y: 10, scale: 0.92 }}
              animate={{ opacity: 1, y: 0,  scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.92 }}
              transition={{ duration: 0.22 }}
              style={{
                position: 'absolute', bottom: 'calc(100% + 12px)', right: 0,
                width: 228, zIndex: 501,
                background: 'rgba(4,2,0,0.96)',
                border: `1px solid ${color}38`,
                borderRadius: 3,
                padding: '13px 15px',
                backdropFilter: 'blur(22px)',
                WebkitBackdropFilter: 'blur(22px)',
                boxShadow: `0 0 0 1px ${color}12, 0 8px 32px rgba(0,0,0,0.55)`,
              }}
            >
              {/* Corner brackets on bubble */}
              {[['top','left'],['top','right'],['bottom','left'],['bottom','right']].map(([v,h],i) => (
                <div key={i} style={{ position: 'absolute', [v]: -1, [h]: -1, width: 10, height: 10, zIndex: 5 }}>
                  <div style={{ position: 'absolute', [v]: 0, [h]: 0, width: 7, height: 1.5, background: color }} />
                  <div style={{ position: 'absolute', [v]: 0, [h]: 0, width: 1.5, height: 7, background: color }} />
                </div>
              ))}
              {/* Tail */}
              <div style={{
                position: 'absolute', bottom: -5, right: 26,
                width: 10, height: 10,
                background: 'rgba(4,2,0,0.96)',
                border: `1px solid ${color}38`,
                borderTop: 'none', borderLeft: 'none',
                transform: 'rotate(45deg)',
              }} />

              <div style={{ fontSize: 8, fontWeight: 800, color: `${color}bb`, letterSpacing: 2.5, textTransform: 'uppercase', fontFamily: '"Courier New", monospace', marginBottom: 6 }}>
                NOVA · {TAB_CONFIG[tab]?.label ?? 'ASSISTANT'}
              </div>
              <div style={{ fontSize: 12.5, color: '#f5ead0', fontFamily: 'Inter, sans-serif', lineHeight: 1.55 }}>
                {tip}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Character button */}
        <motion.button
          whileHover={{ scale: 1.09 }}
          whileTap={{ scale: 0.93 }}
          onClick={() => setBubble(b => !b)}
          style={{
            width: 68, height: 68, borderRadius: '50%',
            background: 'rgba(3,1,0,0.88)',
            border: `2px solid ${color}55`,
            boxShadow: `0 0 22px ${color}28, 0 4px 18px rgba(0,0,0,0.55)`,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            overflow: 'hidden', padding: 0,
            position: 'relative',
            animation: 'orb-float 4s ease-in-out infinite',
          }}
        >
          {riveReady ? (
            <RiveComponent style={{ width: '100%', height: '100%' }} />
          ) : (
            <RobotOrb mood={mood} color={color} size={54} />
          )}
        </motion.button>

        {/* Status dot */}
        <div style={{
          position: 'absolute', top: 2, right: 2,
          width: 9, height: 9, borderRadius: '50%',
          background: color,
          boxShadow: `0 0 8px ${color}`,
          animation: 'orb-pulse 2.2s ease-in-out infinite',
          pointerEvents: 'none',
        }} />
      </motion.div>

      <style>{`
        @keyframes orb-pulse {
          0%, 100% { opacity: 1;   transform: scale(1);    }
          50%       { opacity: 0.5; transform: scale(0.82); }
        }
        @keyframes orb-breathe {
          0%, 100% { transform: scale(1);    }
          50%       { transform: scale(1.05); }
        }
        @keyframes orb-spin {
          from { transform: rotate(0deg);   }
          to   { transform: rotate(360deg); }
        }
        @keyframes orb-blink {
          0%, 92%, 100% { transform: scaleY(1);   }
          93%, 99%      { transform: scaleY(0.08); }
        }
        @keyframes orb-wave {
          from { transform: rotate(-22deg); }
          to   { transform: rotate(22deg);  }
        }
        @keyframes orb-float {
          0%, 100% { transform: translateY(0px);   }
          50%       { transform: translateY(-5px);  }
        }
      `}</style>
    </>
  );
}
