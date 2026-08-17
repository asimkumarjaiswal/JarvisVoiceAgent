/**
 * NeuralCore.jsx
 *
 * The animated centrepiece of the UI — a futuristic 3D-looking abstract
 * neural brain rendered with SVG + CSS animations.
 *
 * States: initializing | ready | listening | processing | speaking | error
 *
 * Performance: All animations are CSS-based. No WebGL / Three.js.
 */

import React, { useEffect, useRef, useMemo } from 'react';

/* ─── Node layout for the neural network ─────────────────────────── */
const NODES = [
  { id: 'n0',  cx: 200, cy: 200, r: 6,   ring: 0 },
  // Inner ring
  { id: 'n1',  cx: 200, cy: 140, r: 4.5, ring: 1 },
  { id: 'n2',  cx: 252, cy: 170, r: 4.5, ring: 1 },
  { id: 'n3',  cx: 252, cy: 230, r: 4.5, ring: 1 },
  { id: 'n4',  cx: 200, cy: 260, r: 4.5, ring: 1 },
  { id: 'n5',  cx: 148, cy: 230, r: 4.5, ring: 1 },
  { id: 'n6',  cx: 148, cy: 170, r: 4.5, ring: 1 },
  // Mid ring
  { id: 'n7',  cx: 200, cy:  90, r: 3.5, ring: 2 },
  { id: 'n8',  cx: 261, cy: 113, r: 3.5, ring: 2 },
  { id: 'n9',  cx: 295, cy: 170, r: 3.5, ring: 2 },
  { id: 'n10', cx: 295, cy: 230, r: 3.5, ring: 2 },
  { id: 'n11', cx: 261, cy: 287, r: 3.5, ring: 2 },
  { id: 'n12', cx: 200, cy: 310, r: 3.5, ring: 2 },
  { id: 'n13', cx: 139, cy: 287, r: 3.5, ring: 2 },
  { id: 'n14', cx: 105, cy: 230, r: 3.5, ring: 2 },
  { id: 'n15', cx: 105, cy: 170, r: 3.5, ring: 2 },
  { id: 'n16', cx: 139, cy: 113, r: 3.5, ring: 2 },
];

const CONNECTIONS = [
  ['n0','n1'], ['n0','n2'], ['n0','n3'], ['n0','n4'], ['n0','n5'], ['n0','n6'],
  ['n1','n2'], ['n2','n3'], ['n3','n4'], ['n4','n5'], ['n5','n6'], ['n6','n1'],
  ['n1','n7'], ['n2','n8'], ['n2','n9'], ['n3','n9'], ['n3','n10'],
  ['n4','n11'], ['n4','n12'], ['n5','n13'], ['n5','n14'],
  ['n6','n15'], ['n6','n16'], ['n1','n16'],
  ['n7','n8'], ['n9','n10'], ['n11','n12'], ['n13','n14'], ['n15','n16'],
];

/* ─── State config ────────────────────────────────────────────────── */
const STATE_CONFIG = {
  initializing: {
    label: 'Initializing AI...',
    coreColor: '#1e40af',
    glowColor: 'rgba(59,130,246,0.4)',
    ringSpeed: '8s',
    pulseIntensity: 0.5,
  },
  ready: {
    label: 'AI Receptionist Ready',
    coreColor: '#0f766e',
    glowColor: 'rgba(20,184,166,0.3)',
    ringSpeed: '12s',
    pulseIntensity: 0.4,
  },
  listening: {
    label: 'Listening...',
    coreColor: '#1d4ed8',
    glowColor: 'rgba(96,165,250,0.6)',
    ringSpeed: '4s',
    pulseIntensity: 0.8,
  },
  processing: {
    label: 'Thinking...',
    coreColor: '#7c3aed',
    glowColor: 'rgba(167,139,250,0.5)',
    ringSpeed: '2s',
    pulseIntensity: 0.9,
  },
  speaking: {
    label: 'Speaking...',
    coreColor: '#0e7490',
    glowColor: 'rgba(34,211,238,0.5)',
    ringSpeed: '3s',
    pulseIntensity: 0.75,
  },
  error: {
    label: 'Connection Error',
    coreColor: '#9f1239',
    glowColor: 'rgba(251,113,133,0.35)',
    ringSpeed: '10s',
    pulseIntensity: 0.3,
  },
};

/* ─── Waveform bars for LISTENING / SPEAKING ─────────────────────── */
function WaveformBars({ active }) {
  const bars = 18;
  return (
    <g className={`waveform ${active ? 'waveform-active' : ''}`}>
      {Array.from({ length: bars }).map((_, i) => {
        const angle = (i / bars) * Math.PI * 2;
        const r = 68;
        const x = 200 + r * Math.cos(angle);
        const y = 200 + r * Math.sin(angle);
        return (
          <rect
            key={i}
            className={`wave-bar wave-bar-${i % 6}`}
            x={x - 1.5}
            y={y - 1.5}
            width={3}
            height={3}
            rx={1.5}
          />
        );
      })}
    </g>
  );
}

/* ─── Particle dots ───────────────────────────────────────────────── */
function Particles({ state }) {
  const particles = useMemo(
    () =>
      Array.from({ length: 20 }).map((_, i) => {
        const angle = (i / 20) * Math.PI * 2;
        const r = 40 + Math.random() * 90;
        return {
          id: i,
          cx: 200 + r * Math.cos(angle),
          cy: 200 + r * Math.sin(angle),
          r: 1 + Math.random() * 2,
          delay: `${(i * 0.18).toFixed(2)}s`,
          duration: `${(2 + Math.random() * 3).toFixed(2)}s`,
        };
      }),
    []
  );

  const active = state === 'processing' || state === 'listening';

  return (
    <g className={`particles ${active ? 'particles-active' : ''}`}>
      {particles.map((p) => (
        <circle
          key={p.id}
          className="particle"
          cx={p.cx}
          cy={p.cy}
          r={p.r}
          style={{ animationDelay: p.delay, animationDuration: p.duration }}
        />
      ))}
    </g>
  );
}

export default function NeuralCore({ state = 'initializing', transcript }) {
  const cfg = STATE_CONFIG[state] || STATE_CONFIG.ready;
  const svgRef = useRef(null);

  const showWaveform = state === 'listening' || state === 'speaking';

  return (
    <div
      className={`neural-core neural-core--${state}`}
      role="img"
      aria-label={`AI Neural Core — ${cfg.label}`}
      style={{ '--glow-color': cfg.glowColor, '--core-color': cfg.coreColor }}
    >
      <svg
        ref={svgRef}
        viewBox="0 0 400 400"
        xmlns="http://www.w3.org/2000/svg"
        className="neural-svg"
        aria-hidden="true"
      >
        <defs>
          {/* Radial gradient for the core sphere */}
          <radialGradient id="coreGradient" cx="40%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
            <stop offset="40%" stopColor={cfg.coreColor} stopOpacity="0.9" />
            <stop offset="100%" stopColor={cfg.coreColor} stopOpacity="0.2" />
          </radialGradient>

          {/* Glow filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glow-strong" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="12" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="node-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* ── Outer orbital rings ─────────────────────────────────── */}
        <g className={`orbital-rings rings-speed-${state}`}>
          {/* Ring 3 — outermost */}
          <ellipse
            className="ring ring-3"
            cx="200" cy="200" rx="155" ry="50"
            style={{ animationDuration: cfg.ringSpeed }}
          />
          {/* Ring 2 */}
          <ellipse
            className="ring ring-2"
            cx="200" cy="200" rx="125" ry="40"
            style={{ animationDuration: `calc(${cfg.ringSpeed} * 0.75)` }}
          />
          {/* Ring 1 — innermost orbital */}
          <ellipse
            className="ring ring-1"
            cx="200" cy="200" rx="95" ry="30"
            style={{ animationDuration: `calc(${cfg.ringSpeed} * 0.5)` }}
          />
        </g>

        {/* ── Particles ──────────────────────────────────────────── */}
        <Particles state={state} />

        {/* ── Neural connections ─────────────────────────────────── */}
        <g className={`connections connections--${state}`} filter="url(#glow)">
          {CONNECTIONS.map(([a, b]) => {
            const na = NODES.find((n) => n.id === a);
            const nb = NODES.find((n) => n.id === b);
            return (
              <line
                key={`${a}-${b}`}
                className={`connection connection-ring-${Math.max(na.ring, nb.ring)}`}
                x1={na.cx} y1={na.cy}
                x2={nb.cx} y2={nb.cy}
              />
            );
          })}
        </g>

        {/* ── Neural nodes ───────────────────────────────────────── */}
        <g className={`nodes nodes--${state}`} filter="url(#node-glow)">
          {NODES.map((node) => (
            <circle
              key={node.id}
              className={`node node-ring-${node.ring} node--${state}`}
              cx={node.cx}
              cy={node.cy}
              r={node.r}
              style={{ animationDelay: `${node.id.slice(1) * 0.15}s` }}
            />
          ))}
        </g>

        {/* ── Waveform ────────────────────────────────────────────── */}
        <WaveformBars active={showWaveform} />

        {/* ── Core glow background ────────────────────────────────── */}
        <circle
          className={`core-glow core-glow--${state}`}
          cx="200" cy="200" r="52"
          filter="url(#glow-strong)"
        />

        {/* ── Core sphere ─────────────────────────────────────────── */}
        <circle
          className={`core-sphere core-sphere--${state}`}
          cx="200" cy="200" r="44"
          fill="url(#coreGradient)"
          filter="url(#glow)"
        />

        {/* ── Highlight (3D look) ─────────────────────────────────── */}
        <ellipse
          className="core-highlight"
          cx="188" cy="182" rx="16" ry="10"
          fill="white" opacity="0.12"
        />
      </svg>

      {/* ── State label ─────────────────────────────────────────── */}
      <div className="neural-label" aria-live="polite">
        <span className={`neural-status-text neural-status-text--${state}`}>
          {cfg.label}
        </span>
        {transcript && state === 'listening' && (
          <p className="neural-transcript">&ldquo;{transcript}&rdquo;</p>
        )}
      </div>

      {/* ── Service sub-caption ─────────────────────────────────── */}
      <p className="neural-caption">
        Appointments &bull; Rescheduling &bull; Cancellation &bull; Assistance
      </p>
    </div>
  );
}
