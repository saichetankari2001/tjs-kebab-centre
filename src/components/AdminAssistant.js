import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Tab config — mood + tip per panel index ───────────────────────────────────
const TAB_CONFIG = {
  0: { mood: 'idle',     color: '#f59e0b', label: 'OVERVIEW',    tip: 'Dashboard is live. All systems online.' },
  1: { mood: 'happy',    color: '#4ade80', label: 'MENU',        tip: 'Looking good! Menu has active items ready.' },
  2: { mood: 'thinking', color: '#4a9eff', label: 'ORDERS',      tip: 'Monitoring incoming orders in real time.' },
  3: { mood: 'alert',    color: '#ff8c42', label: 'PROMOTIONS',  tip: 'Run a deal to drive foot traffic.' },
  4: { mood: 'happy',    color: '#4ade80', label: 'DRINKS',      tip: 'Drinks menu is set and ready to serve.' },
  5: { mood: 'wave',     color: '#a78bfa', label: 'STAFF',       tip: 'Team management — keep the crew sharp.' },
  6: { mood: 'idle',     color: '#f59e0b', label: 'QR CODE',     tip: 'QR code ready — print and display it.' },
  7: { mood: 'alert',    color: '#ff8c42', label: 'BLAST',       tip: 'Mass message — reach all subscribers at once.' },
  8: { mood: 'thinking', color: '#4a9eff', label: 'SUBSCRIBERS', tip: 'Subscriber list loaded and up to date.' },
};

// ── Gemini Flash — intelligent contextual responses ───────────────────────────
async function askGemini(userMsg, contextStr) {
  const key = process.env.REACT_APP_GEMINI_API_KEY;
  if (!key) return null;
  const system =
    `You are NOVA, the AI assistant embedded in TJ's Kebab Centre admin dashboard. ` +
    `Context: ${contextStr}. ` +
    `Reply in 1-2 sentences — friendly, direct, no markdown, no bullet points.`;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${system}\n\nUser: ${userMsg}` }] }],
        }),
      }
    );
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? null;
  } catch {
    return null;
  }
}

// ── Web Speech API — American female voice ────────────────────────────────────
function getAmericanFemaleVoice() {
  const voices = window.speechSynthesis.getVoices();
  const priority = [
    'Samantha',
    'Google US English',
    'Microsoft Zira Desktop - English (United States)',
    'Microsoft Zira',
  ];
  for (const name of priority) {
    const v = voices.find(v => v.name === name);
    if (v) return v;
  }
  return (
    voices.find(v => v.lang === 'en-US' && /female|woman|girl/i.test(v.name)) ||
    voices.find(v => v.lang === 'en-US') ||
    voices.find(v => v.lang.startsWith('en')) ||
    null
  );
}

function speak(text, onEnd) {
  if (!window.speechSynthesis) { onEnd?.(); return; }
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate   = 0.91;
  utter.pitch  = 1.10;
  utter.volume = 0.90;
  if (onEnd) utter.onend = onEnd;
  const doSpeak = () => {
    utter.voice = getAmericanFemaleVoice();
    window.speechSynthesis.speak(utter);
  };
  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.onvoiceschanged = () => {
      doSpeak();
      window.speechSynthesis.onvoiceschanged = null;
    };
  } else {
    doSpeak();
  }
}

function stopSpeaking() {
  window.speechSynthesis?.cancel();
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// ── CSS robot orb ─────────────────────────────────────────────────────────────
function RobotOrb({ mood, color, size = 64 }) {
  const isHappy    = mood === 'happy';
  const isAlert    = mood === 'alert';
  const isThinking = mood === 'thinking';
  const isWave     = mood === 'wave';

  return (
    <div style={{ width: size, height: size, position: 'relative', flexShrink: 0 }}>
      <div style={{
        position: 'absolute', inset: -4, borderRadius: '50%',
        border: `1.5px solid ${color}40`,
        animation: 'orb-pulse 2.4s ease-in-out infinite',
        pointerEvents: 'none',
      }} />
      <div style={{
        width: '100%', height: '100%', borderRadius: '50%',
        background: `radial-gradient(circle at 32% 32%, ${color}cc 0%, ${color}44 55%, ${color}0d 100%)`,
        boxShadow: `0 0 20px ${color}55, inset 0 0 14px ${color}22`,
        animation: isThinking ? 'orb-spin 1.4s linear infinite' : 'orb-breathe 3.2s ease-in-out infinite',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 3, position: 'relative',
      }}>
        <div style={{ display: 'flex', gap: isHappy ? 10 : 8, alignItems: 'center' }}>
          {[0, 1].map(i => (
            <div key={i} style={{
              width:  isAlert ? 6 : 4,
              height: isHappy ? 2.5 : isAlert ? 6 : 4,
              borderRadius: isHappy ? '40% 40% 60% 60%' : '50%',
              background: '#fff',
              boxShadow: `0 0 5px ${color}`,
              animation: isThinking ? `orb-blink 1.8s step-end ${i * 0.9}s infinite` : 'none',
            }} />
          ))}
        </div>
        <div style={{
          width:  isHappy ? 12 : isAlert ? 6 : 7,
          height: 2, borderRadius: 4, background: '#ffffffcc', marginTop: 1,
          borderBottomLeftRadius:  isHappy ? 6 : isAlert ? 0 : 4,
          borderBottomRightRadius: isHappy ? 6 : isAlert ? 0 : 4,
          borderTopLeftRadius:     isAlert ? 4 : 0,
          borderTopRightRadius:    isAlert ? 4 : 0,
        }} />
      </div>
      {/* Antenna */}
      <div style={{
        position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
        width: 2, height: 10, background: color, borderRadius: 1,
        boxShadow: `0 0 6px ${color}`,
      }}>
        <div style={{
          position: 'absolute', top: -5, left: '50%', transform: 'translateX(-50%)',
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

// ── Full-screen greeting — shows once per session after login ─────────────────
function GreetingOverlay({ todaysOrders, todaysRevenue, pendingCount, onDone }) {
  const [alive, setAlive] = useState(true);

  const dismiss = useCallback(() => {
    setAlive(false);
    setTimeout(onDone, 600);
  }, [onDone]);

  const greeting   = getGreeting();
  const count      = Array.isArray(todaysOrders) ? todaysOrders.length : todaysOrders;
  const revenue    = typeof todaysRevenue === 'number' ? `$${todaysRevenue.toFixed(2)}` : '$0.00';
  const hasPending = pendingCount > 0;

  useEffect(() => {
    const text = count > 0
      ? `${greeting}, boss. Today has ${count} order${count !== 1 ? 's' : ''}, ${revenue} in revenue.${
          hasPending
            ? ` ${pendingCount} pending order${pendingCount !== 1 ? 's' : ''} need your attention.`
            : ''
        }`
      : `${greeting}, boss. No orders yet today. Shop is primed and ready.`;
    const st = setTimeout(() => speak(text), 900);
    const dt = setTimeout(dismiss, 5200);
    return () => { clearTimeout(st); clearTimeout(dt); stopSpeaking(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AnimatePresence>
      {alive && (
        <motion.div
          key="greeting"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          onClick={dismiss}
          style={{
            position: 'fixed', inset: 0, zIndex: 9000,
            background: 'rgba(2,4,12,0.90)',
            backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <motion.div
            initial={{ scale: 0, y: 60 }} animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 160, damping: 16, delay: 0.15 }}
            style={{ marginBottom: 40 }}
          >
            <RobotOrb mood="wave" color="#f59e0b" size={108} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.48, duration: 0.55 }}
            style={{ textAlign: 'center', maxWidth: 460, padding: '0 28px' }}
          >
            <div style={{
              fontSize: 30, fontWeight: 800, color: '#f5ead0',
              fontFamily: '"Courier New", monospace', letterSpacing: 0.5, marginBottom: 14,
            }}>
              {greeting}, boss.
            </div>
            <div style={{ fontSize: 15, color: 'rgba(245,208,80,0.88)', fontWeight: 500, lineHeight: 1.75 }}>
              {count > 0
                ? <><strong style={{ color: '#fbbf24' }}>{count} order{count !== 1 ? 's' : ''}</strong> today —{' '}
                    <strong style={{ color: '#fbbf24' }}>{revenue}</strong> in revenue.</>
                : 'No orders yet today — shop is primed and ready.'}
              {hasPending && (
                <><br />
                  <span style={{ color: '#ff8c42', fontWeight: 700 }}>{pendingCount} pending</span>
                  {' '}order{pendingCount !== 1 ? 's' : ''} need{pendingCount === 1 ? 's' : ''} your attention.
                </>
              )}
            </div>
            <div style={{
              marginTop: 32, fontSize: 10, color: 'rgba(148,163,184,0.38)',
              letterSpacing: 1.5, textTransform: 'uppercase',
            }}>
              tap anywhere to continue
            </div>
          </motion.div>

          {/* Auto-dismiss progress bar */}
          <motion.div
            style={{
              position: 'absolute', bottom: 0, left: 0, height: 2,
              background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
              boxShadow: '0 0 8px #f59e0b',
            }}
            initial={{ width: '100%' }} animate={{ width: '0%' }}
            transition={{ duration: 5.2, ease: 'linear' }}
          />

          {/* Corner brackets */}
          {[{ top: 20, left: 20 }, { top: 20, right: 20 }, { bottom: 20, left: 20 }, { bottom: 20, right: 20 }].map((pos, i) => {
            const isRight = 'right' in pos, isBottom = 'bottom' in pos;
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

// ── Main floating NOVA widget ─────────────────────────────────────────────────
export default function AdminAssistant({ tab = 0, todaysOrders = [], todaysRevenue = 0, pendingCount = 0 }) {
  const [showGreeting, setShowGreeting] = useState(false);
  const [open, setOpen]                 = useState(false);
  const [listening, setListening]       = useState(false);
  const [thinking, setThinking]         = useState(false);
  const [speaking, setSpeaking]         = useState(false);
  const [response, setResponse]         = useState('');
  const [micError, setMicError]         = useState('');
  const [hasGemini]                     = useState(() => !!process.env.REACT_APP_GEMINI_API_KEY);
  const recognitionRef                  = useRef(null);
  const listeningRef                    = useRef(false);
  const prevTabRef                      = useRef(tab);

  const { mood, color, tip, label } = TAB_CONFIG[tab] ?? TAB_CONFIG[0];

  const contextStr =
    `Active panel: ${label}. ` +
    `Orders today: ${Array.isArray(todaysOrders) ? todaysOrders.length : todaysOrders}. ` +
    `Revenue today: $${typeof todaysRevenue === 'number' ? todaysRevenue.toFixed(2) : '0.00'}. ` +
    `Pending orders: ${pendingCount}.`;

  // One-time session greeting
  useEffect(() => {
    if (!sessionStorage.getItem('nova-greeted')) {
      sessionStorage.setItem('nova-greeted', '1');
      const t = setTimeout(() => setShowGreeting(true), 900);
      return () => clearTimeout(t);
    }
  }, []);

  // Speak tab tip when switching tabs (only when panel is open)
  useEffect(() => {
    if (tab === prevTabRef.current) return;
    prevTabRef.current = tab;
    if (!open) return;
    setResponse(tip);
    setSpeaking(true);
    speak(tip, () => setSpeaking(false));
    return () => stopSpeaking();
  }, [tab, open, tip]);

  // Toggle listening on/off (click-to-start, click-to-stop)
  const toggleListening = useCallback(() => {
    if (listeningRef.current) {
      recognitionRef.current?.stop();
      return;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setMicError('Speech recognition not supported in this browser.');
      return;
    }
    stopSpeaking();
    setSpeaking(false);
    setMicError('');

    const rec = new SR();
    rec.lang = 'en-AU';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.continuous = false;
    recognitionRef.current = rec;

    rec.onstart = () => { setListening(true); listeningRef.current = true; };
    rec.onend   = () => { setListening(false); listeningRef.current = false; };

    rec.onerror = (e) => {
      setListening(false);
      listeningRef.current = false;
      if (e.error === 'not-allowed') {
        setMicError('Mic blocked — allow microphone in Chrome settings.');
      } else if (e.error === 'no-speech') {
        setMicError('No speech detected. Try again.');
      } else {
        setMicError(`Mic error: ${e.error}`);
      }
    };

    rec.onresult = async (e) => {
      const transcript = e.results[0][0].transcript;
      setResponse(`"${transcript}"`);
      setThinking(true);
      setMicError('');

      const answer = await askGemini(transcript, contextStr);
      setThinking(false);

      const reply = answer || tip;
      setResponse(reply);
      setSpeaking(true);
      speak(reply, () => setSpeaking(false));
    };

    try {
      rec.start();
    } catch {
      setMicError('Could not start mic. Check browser permissions.');
    }
  }, [contextStr, tip]);

  const handleToggle = useCallback(() => {
    setOpen(prev => {
      const next = !prev;
      if (next && !response) {
        setResponse(tip);
        setSpeaking(true);
        speak(tip, () => setSpeaking(false));
      } else if (!next) {
        stopSpeaking();
        setSpeaking(false);
      }
      return next;
    });
  }, [response, tip]);

  const currentMood = listening ? 'thinking' : thinking ? 'thinking' : speaking ? 'happy' : mood;

  return (
    <>
      {showGreeting && (
        <GreetingOverlay
          todaysOrders={todaysOrders}
          todaysRevenue={todaysRevenue}
          pendingCount={pendingCount}
          onDone={() => setShowGreeting(false)}
        />
      )}

      <motion.div
        style={{
          position: 'fixed', right: 24, bottom: 24, zIndex: 500,
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.6, type: 'spring', stiffness: 160, damping: 20 }}
      >
        {/* ── Expanded NOVA panel (CSS transition — never unmounts) ── */}
        <div style={{
          width: 252,
          maxHeight: open ? 440 : 0,
          opacity: open ? 1 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.38s cubic-bezier(0.4,0,0.2,1), opacity 0.28s',
          marginBottom: open ? 10 : 0,
          pointerEvents: open ? 'auto' : 'none',
        }}>
          <div style={{
            background: 'rgba(3,6,18,0.97)',
            border: `1px solid ${color}28`,
            borderRadius: 14,
            boxShadow: `0 0 0 1px ${color}10, 0 20px 56px rgba(0,0,0,0.75), 0 0 50px ${color}10`,
            backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
            overflow: 'hidden',
          }}>

            {/* Panel header */}
            <div style={{
              padding: '10px 14px 8px',
              borderBottom: `1px solid ${color}14`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: color, boxShadow: `0 0 7px ${color}`,
                  animation: 'orb-pulse 2s ease-in-out infinite',
                }} />
                <span style={{
                  fontSize: 9, fontWeight: 800, color: `${color}cc`,
                  letterSpacing: 2.5, textTransform: 'uppercase',
                  fontFamily: '"Courier New", monospace',
                }}>
                  NOVA · {label}
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: 'none', border: 'none',
                  color: '#4a4a5a', fontSize: 17, cursor: 'pointer',
                  padding: '0 2px', lineHeight: 1,
                }}
              >×</button>
            </div>

            {/* Orb + status row */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '18px 20px 14px',
            }}>
              <div style={{ flexShrink: 0 }}>
                <RobotOrb mood={currentMood} color={color} size={72} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 10, fontWeight: 800, color: `${color}99`,
                  letterSpacing: 2, textTransform: 'uppercase',
                  fontFamily: '"Courier New", monospace', marginBottom: 5,
                }}>
                  {listening ? '● LISTENING' : thinking ? '● PROCESSING' : speaking ? '◉ SPEAKING' : '◌ READY'}
                </div>
                {/* Soundwave bars during speech */}
                <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 20 }}>
                  {[0.4, 0.7, 1, 0.85, 0.55, 0.9, 0.65, 0.45].map((h, i) => (
                    <div key={i} style={{
                      width: 3, borderRadius: 2,
                      background: color,
                      height: (speaking || listening) ? `${h * 18}px` : '4px',
                      opacity: (speaking || listening) ? 0.85 : 0.2,
                      transition: 'height 0.18s, opacity 0.3s',
                      animation: (speaking || listening) ? `bar-bounce ${0.5 + i * 0.08}s ease-in-out infinite alternate` : 'none',
                      transformOrigin: 'bottom',
                    }} />
                  ))}
                </div>
              </div>
            </div>

            {/* Response text */}
            <div style={{
              margin: '0 14px',
              padding: '11px 13px',
              background: `${color}08`,
              border: `1px solid ${color}18`,
              borderRadius: 9,
              minHeight: 54,
              position: 'relative',
            }}>
              <div style={{
                fontSize: 12.5, color: thinking ? `${color}80` : '#f0ead0',
                lineHeight: 1.58, fontFamily: 'Inter, sans-serif',
                fontStyle: thinking ? 'italic' : 'normal',
                transition: 'color 0.3s',
              }}>
                {thinking
                  ? <span>
                      <span style={{ animation: 'orb-blink 1s step-end infinite', display: 'inline-block' }}>▌</span>
                      {' '}Processing...
                    </span>
                  : (response || tip)}
              </div>
            </div>

            {/* Talk button */}
            <div style={{ padding: '12px 14px 16px', display: 'flex', flexDirection: 'column', gap: 7 }}>
              <button
                onClick={toggleListening}
                style={{
                  width: '100%', padding: '11px 0',
                  borderRadius: 9,
                  border: `1.5px solid ${listening ? color : color + '38'}`,
                  background: listening ? `${color}1a` : 'rgba(255,255,255,0.025)',
                  color: listening ? color : '#70708a',
                  fontSize: 11.5, fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.18s',
                  fontFamily: '"Courier New", monospace',
                  letterSpacing: 1.2,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: listening ? `0 0 22px ${color}33` : 'none',
                  userSelect: 'none', WebkitUserSelect: 'none',
                }}
              >
                <span style={{ fontSize: 15 }}>{listening ? '🔴' : '🎤'}</span>
                {listening ? 'TAP TO STOP' : 'TAP TO TALK'}
              </button>

              {micError && (
                <div style={{
                  fontSize: 10, color: '#f87171', textAlign: 'center',
                  fontFamily: 'Inter, sans-serif', lineHeight: 1.5,
                }}>
                  {micError}
                </div>
              )}

              {!hasGemini && !micError && (
                <div style={{
                  fontSize: 9.5, color: '#383848', textAlign: 'center',
                  fontFamily: 'Inter, sans-serif', lineHeight: 1.5,
                }}>
                  Add REACT_APP_GEMINI_API_KEY to .env for AI answers
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Floating orb button ── */}
        <div style={{ position: 'relative' }}>
          {/* Listening pulse ring */}
          {listening && (
            <div style={{
              position: 'absolute', inset: -10, borderRadius: '50%',
              border: `2px solid ${color}70`,
              animation: 'orb-pulse 0.7s ease-in-out infinite',
              pointerEvents: 'none',
            }} />
          )}

          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={handleToggle}
            style={{
              width: 68, height: 68, borderRadius: '50%',
              background: open ? `${color}12` : 'rgba(3,1,0,0.88)',
              border: `2px solid ${open ? color + '80' : color + '50'}`,
              boxShadow: `0 0 ${open ? 32 : 22}px ${color}${open ? '40' : '28'}, 0 4px 18px rgba(0,0,0,0.55)`,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
              overflow: 'hidden', padding: 0,
              animation: open ? 'none' : 'orb-float 4s ease-in-out infinite',
              transition: 'background 0.3s, border-color 0.3s, box-shadow 0.3s',
            }}
          >
            <RobotOrb mood={currentMood} color={color} size={54} />
          </motion.button>

          {/* Status dot */}
          <div style={{
            position: 'absolute', top: 2, right: 2,
            width: 9, height: 9, borderRadius: '50%',
            background: listening ? '#ef4444' : color,
            boxShadow: `0 0 8px ${listening ? '#ef4444' : color}`,
            animation: 'orb-pulse 2.2s ease-in-out infinite',
            pointerEvents: 'none',
          }} />
        </div>
      </motion.div>

      <style>{`
        @keyframes orb-pulse   { 0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(0.82)} }
        @keyframes orb-breathe { 0%,100%{transform:scale(1)}50%{transform:scale(1.05)} }
        @keyframes orb-spin    { from{transform:rotate(0deg)}to{transform:rotate(360deg)} }
        @keyframes orb-blink   { 0%,92%,100%{transform:scaleY(1)}93%,99%{transform:scaleY(0.08)} }
        @keyframes orb-wave    { from{transform:rotate(-22deg)}to{transform:rotate(22deg)} }
        @keyframes orb-float   { 0%,100%{transform:translateY(0px)}50%{transform:translateY(-5px)} }
        @keyframes bar-bounce  { from{transform:scaleY(0.3)}to{transform:scaleY(1)} }
      `}</style>
    </>
  );
}
