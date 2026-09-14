import React, { useEffect, useRef } from 'react';

// Seeded PRNG — stable particle layout across renders
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    var t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(0xCAFEBABE);
const ANIMS = ['fp-a','fp-b','fp-c','fp-d','fp-e','fp-f','fp-g','fp-h'];

const PARTICLES = Array.from({ length: 72 }, (_, i) => ({
  id: i,
  cx: rng() * 1000,
  cy: rng() * 1000,
  r: 1 + rng() * 1.5,
  opacity: 0.08 + rng() * 0.14,
  isBlue: i < 5,
  anim: ANIMS[Math.floor(rng() * 8)],
  dur: 22 + rng() * 30,
  del: -(rng() * 25),
}));

const MAX_CONN = 14;
const CONNECTIONS = [];
outer: for (let i = 0; i < PARTICLES.length; i++) {
  for (let j = i + 1; j < PARTICLES.length; j++) {
    if (CONNECTIONS.length >= MAX_CONN) break outer;
    const dx = PARTICLES[i].cx - PARTICLES[j].cx;
    const dy = PARTICLES[i].cy - PARTICLES[j].cy;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < 130) {
      CONNECTIONS.push({
        k: i + '-' + j,
        x1: PARTICLES[i].cx, y1: PARTICLES[i].cy,
        x2: PARTICLES[j].cx, y2: PARTICLES[j].cy,
        o: Math.max(0.012, 0.045 - d / 3500),
      });
    }
  }
}

function ParticleBackground() {
  const svgRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const el = svgRef.current;
    if (!el) return;

    const onScroll = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        el.style.transform = 'translateY(' + (window.scrollY * 0.06) + 'px)';
        rafRef.current = null;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <svg
      ref={svgRef}
      className="lp-particles"
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 1000 1000"
      preserveAspectRatio="xMidYMid slice"
    >
      {CONNECTIONS.map(({ k, x1, y1, x2, y2, o }) => (
        <line key={k} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#888" strokeWidth="0.35" opacity={o} />
      ))}
      {PARTICLES.map((p) => (
        <circle
          key={p.id}
          cx={p.cx}
          cy={p.cy}
          r={p.r}
          fill={p.isBlue ? '#3b82f6' : '#aaa'}
          opacity={p.opacity}
          className={'fp ' + p.anim}
          style={{ animationDuration: p.dur + 's', animationDelay: p.del + 's' }}
        />
      ))}
    </svg>
  );
}

export default ParticleBackground;