import { useState, useEffect, useRef } from 'react';

interface CinematicIntroProps {
  onComplete: () => void;
  siteTitle?: string;
}

// Vertical English letters along the right celestial axis ("B L A C K   A P P L E")
const VERTICAL_BRAND_LETTERS = [
  { char: 'B', y: 92, delay: '0.18s' },
  { char: 'L', y: 116, delay: '0.24s' },
  { char: 'A', y: 140, delay: '0.30s' },
  { char: 'C', y: 164, delay: '0.36s' },
  { char: 'K', y: 188, delay: '0.42s' },
  { char: 'A', y: 226, delay: '0.52s' },
  { char: 'P', y: 250, delay: '0.58s' },
  { char: 'P', y: 274, delay: '0.64s' },
  { char: 'L', y: 298, delay: '0.70s' },
  { char: 'E', y: 322, delay: '0.76s' }
];

// The 4 main characters with their vertical positions, drop timings, and cross-needle details
const CALLIGRAPHY_GLYPHS = [
  {
    char: '苹',
    y: 244,
    centerY: 196,
    size: 166,
    delay: '0.26s',
    echoDelay: '0.22s',
    rippleDelay: '0.48s',
    needleY: 268,
    needleX1: 168,
    needleX2: 392,
    starX: 206,
    starRx: 14,
    starRy: 22
  },
  {
    char: '果',
    y: 412,
    centerY: 364,
    size: 164,
    delay: '0.68s',
    echoDelay: '0.64s',
    rippleDelay: '0.90s',
    needleY: 436,
    needleX1: 296,
    needleX2: 456,
    starX: 392,
    starRx: 12,
    starRy: 20
  },
  {
    char: '坏',
    y: 582,
    centerY: 534,
    size: 166,
    delay: '1.10s',
    echoDelay: '1.06s',
    rippleDelay: '1.32s',
    needleY: 506,
    needleX1: 196,
    needleX2: 332,
    starX: 228,
    starRx: 11,
    starRy: 18
  },
  {
    char: '了',
    y: 754,
    centerY: 706,
    size: 168,
    delay: '1.52s',
    echoDelay: '1.48s',
    rippleDelay: '1.74s',
    needleY: 656,
    needleX1: 232,
    needleX2: 392,
    starX: 268,
    starRx: 12,
    starRy: 22
  }
];

// 36 degree tick angles for the background Celestial Astrolabe dial
const ASTROLABE_TICKS = Array.from({ length: 36 }, (_, i) => i * 10);

// Reusable 4-point razor-sharp star with subtle breathing pulse
function FourPointStar({
  cx,
  cy,
  rx,
  ry,
  delay = '0s'
}: {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  delay?: string;
}) {
  const kx = rx * 0.14;
  const ky = ry * 0.14;
  return (
    <g
      transform={`translate(${cx}, ${cy})`}
      style={{
        animation: `baStarIgnite 1.5s cubic-bezier(0.16, 1, 0.3, 1) ${delay} both`
      }}
    >
      <g style={{ animation: 'baStarBreathe 2.4s ease-in-out infinite' }}>
        <path
          d={`M 0 ${-ry} C ${kx} ${-ky}, ${kx} ${-ky}, ${rx} 0 C ${kx} ${ky}, ${kx} ${ky}, 0 ${ry} C ${-kx} ${ky}, ${-kx} ${ky}, ${-rx} 0 C ${-kx} ${-ky}, ${-kx} ${-ky}, 0 ${-ry} Z`}
          fill="#ffffff"
          style={{
            filter:
              'drop-shadow(0 0 5px rgba(255,255,255,0.95)) drop-shadow(0 0 14px rgba(210,225,255,0.75))'
          }}
        />
        <circle cx="0" cy="0" r="1.8" fill="#ffffff" />
      </g>
    </g>
  );
}

export function CinematicIntro({ onComplete }: CinematicIntroProps) {
  const [stage, setStage] = useState<'cascade' | 'resonate' | 'exit'>('cascade');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 60fps Volumetric Silver-Ash & Starlight Particle Simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particleCount = 46;
    const particles = Array.from({ length: particleCount }, () => ({
      x: width * 0.2 + Math.random() * (width * 0.6),
      y: Math.random() * height,
      vy: -(0.35 + Math.random() * 0.85),
      vx: (Math.random() - 0.5) * 0.3,
      radius: 0.7 + Math.random() * 1.6,
      alpha: 0.15 + Math.random() * 0.65,
      phase: Math.random() * Math.PI * 2,
      phaseSpeed: 0.02 + Math.random() * 0.03
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.phase += p.phaseSpeed;

        if (p.y < -10) {
          p.y = height + 10;
          p.x = width * 0.25 + Math.random() * (width * 0.5);
        }

        const currentAlpha = p.alpha * (0.6 + 0.4 * Math.sin(p.phase));
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(248, 250, 255, ${currentAlpha.toFixed(3)})`;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();
      }

      animId = window.requestAnimationFrame(render);
    };

    animId = window.requestAnimationFrame(render);
    return () => {
      window.cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    // Choreographed High-Impact Gothic-Celestial Timeline:
    // 0.00s -> 2.15s: 'cascade'  — Astrolabe locks in, axis spears shoot, 苹 -> 果 -> 坏 -> 了 slam down 1 by 1 with echo & shockwaves
    // 2.15s -> 3.50s: 'resonate' — Full sculptural emblem pulses with celestial star flares & harmonic rings
    // 3.50s -> 4.25s: 'exit'     — 3D camera flies through the emblem into the main experience
    const t1 = window.setTimeout(() => setStage('resonate'), 2150);
    const t2 = window.setTimeout(() => setStage('exit'), 3500);
    const t3 = window.setTimeout(() => {
      onComplete();
    }, 4250);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [onComplete]);

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-50 bg-[#020204] overflow-hidden flex items-center justify-center select-none pointer-events-none transition-opacity duration-700 ease-out ${
        stage === 'exit' ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        perspective: '1400px',
        willChange: 'opacity'
      }}
    >
      <style>{`
        /* 1. Heavy 3D Gothic Character Slam-Drop ("Đổ từng chữ 1 xuống") */
        @keyframes baCharImpactDrop {
          0% {
            opacity: 0;
            transform: translateY(-72px) scale(1.26);
            filter: blur(8px) brightness(2.4);
          }
          50% {
            opacity: 1;
            transform: translateY(3px) scale(0.985);
            filter: blur(0px) brightness(1.35);
          }
          78% {
            transform: translateY(-1px) scale(1.008);
          }
          100% {
            opacity: 1;
            transform: translateY(0px) scale(1);
            filter: blur(0px) brightness(1);
          }
        }

        /* 2. Ghostly Silver Afterimage Converging into each Character on Impact */
        @keyframes baCharGhostEcho {
          0% {
            opacity: 0;
            transform: translateY(-36px) scale(1.42);
            filter: blur(6px);
          }
          35% {
            opacity: 0.55;
          }
          100% {
            opacity: 0;
            transform: translateY(0px) scale(1);
            filter: blur(0px);
          }
        }

        /* 3. Expanding Shockwave Ring when each Character locks in */
        @keyframes baImpactRipple {
          0% {
            opacity: 0.75;
            transform: scale(0.25);
          }
          100% {
            opacity: 0;
            transform: scale(1.65);
          }
        }

        /* 4. Vertical Celestial Axis Spear Draw */
        @keyframes baAxisNeedle {
          0% {
            stroke-dashoffset: 920;
            opacity: 0;
          }
          18% {
            opacity: 1;
          }
          100% {
            stroke-dashoffset: 0;
            opacity: 0.95;
          }
        }

        /* 5. Horizontal Cross-Needle Laser Burst */
        @keyframes baHorizontalBlade {
          0% {
            transform: scaleX(0);
            opacity: 0;
          }
          55% {
            transform: scaleX(1.08);
            opacity: 1;
          }
          100% {
            transform: scaleX(1);
            opacity: 0.9;
          }
        }

        /* 6. Celestial Compass Astrolabe Lock-In */
        @keyframes baCompassLock {
          0% {
            opacity: 0;
            transform: rotate(-120deg) scale(0.4);
          }
          60% {
            opacity: 1;
          }
          100% {
            opacity: 1;
            transform: rotate(0deg) scale(1);
          }
        }

        /* 7. Slow Continuous Astrolabe Rotation */
        @keyframes baAstrolabeSpinCW {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        @keyframes baAstrolabeSpinCCW {
          0% {
            transform: rotate(360deg);
          }
          100% {
            transform: rotate(0deg);
          }
        }

        /* 8. Vertical "BLACK APPLE" Letter-by-Letter Cascade */
        @keyframes baLetterDrop {
          0% {
            opacity: 0;
            transform: translateY(-20px) scale(1.15);
            filter: blur(3px) brightness(2);
          }
          100% {
            opacity: 0.95;
            transform: translateY(0px) scale(1);
            filter: blur(0px) brightness(1);
          }
        }

        /* 9. 4-Point Star Glint Ignition & Breathing */
        @keyframes baStarIgnite {
          0% {
            opacity: 0;
            transform: scale(0) rotate(-45deg);
          }
          55% {
            opacity: 1;
            transform: scale(1.24) rotate(0deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }
        @keyframes baStarBreathe {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.14);
          }
        }

        /* 10. Climax Harmonic Pulse across the whole Emblem at Resonate stage */
        @keyframes baClimaxPulseRing {
          0% {
            opacity: 0.65;
            transform: translate(-50%, -50%) scale(0.45);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(1.75);
          }
        }
      `}</style>

      {/* =====================================================================
          1. VOLUMETRIC MOONLIGHT PILLAR, 60FPS PARTICLE CANVAS & ARCHITECTURAL FRAME
      ===================================================================== */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        {/* Deep Volumetric Moonlight Pillar */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 42% 60% at 50% 50%, rgba(226, 232, 240, 0.12) 0%, rgba(100, 116, 139, 0.04) 45%, rgba(2, 2, 4, 0.98) 76%, #020204 100%)'
          }}
        />

        {/* 60fps Silver-Ash & Starlight Particle Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none opacity-85"
        />

        {/* Subtle Architectural Viewport Framing Hairlines */}
        <div className="absolute inset-5 sm:inset-8 border border-white/[0.06] pointer-events-none">
          {/* 4 Corner Crosshair Ticks */}
          <div className="absolute -top-[3px] -left-[3px] w-3 h-3 border-t border-l border-white/35" />
          <div className="absolute -top-[3px] -right-[3px] w-3 h-3 border-t border-r border-white/35" />
          <div className="absolute -bottom-[3px] -left-[3px] w-3 h-3 border-b border-l border-white/35" />
          <div className="absolute -bottom-[3px] -right-[3px] w-3 h-3 border-b border-r border-white/35" />
        </div>

        {/* Background Counter-Rotating Celestial Astrolabe Dial */}
        <div className="relative w-[82vmin] h-[82vmin] max-w-[640px] max-h-[640px] flex items-center justify-center opacity-35">
          <svg viewBox="-320 -320 640 640" className="w-full h-full overflow-visible">
            {/* Outer Slow-Spinning Degree Ring */}
            <g style={{ animation: 'baAstrolabeSpinCW 48s linear infinite' }}>
              <circle
                cx="0"
                cy="0"
                r="275"
                stroke="#ffffff"
                strokeWidth="0.6"
                strokeOpacity="0.28"
                strokeDasharray="6 6"
                fill="none"
              />
              <circle
                cx="0"
                cy="0"
                r="256"
                stroke="#ffffff"
                strokeWidth="0.5"
                strokeOpacity="0.22"
                fill="none"
              />
              {ASTROLABE_TICKS.map((deg) => {
                const isMajor = deg % 30 === 0;
                return (
                  <line
                    key={deg}
                    x1="0"
                    y1={-256}
                    x2="0"
                    y2={isMajor ? -244 : -250}
                    stroke="#ffffff"
                    strokeWidth={isMajor ? '0.9' : '0.5'}
                    strokeOpacity={isMajor ? '0.45' : '0.22'}
                    transform={`rotate(${deg})`}
                  />
                );
              })}
            </g>

            {/* Inner Counter-Spinning Sacred Geometry Ring */}
            <g style={{ animation: 'baAstrolabeSpinCCW 36s linear infinite' }}>
              <circle
                cx="0"
                cy="0"
                r="198"
                stroke="#ffffff"
                strokeWidth="0.5"
                strokeOpacity="0.2"
                fill="none"
              />
              <rect
                x="-140"
                y="-140"
                width="280"
                height="280"
                stroke="#ffffff"
                strokeWidth="0.4"
                strokeOpacity="0.14"
                fill="none"
                transform="rotate(45)"
              />
            </g>
          </svg>
        </div>

        {/* Harmonic Climax Pulse Ring when all 4 characters have landed */}
        {stage === 'resonate' && (
          <div
            className="absolute left-1/2 top-1/2 w-[58vmin] h-[58vmin] max-w-[460px] max-h-[460px] rounded-full border border-white/30"
            style={{
              animation: 'baClimaxPulseRing 1.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              boxShadow: '0 0 35px rgba(255, 255, 255, 0.25)'
            }}
          />
        )}
      </div>

      {/* =====================================================================
          2. MAIN SCULPTED EMBLEM STAGE: "苹果坏了 · BLACK APPLE"
             100% Pure Vector + Multi-Layer 3D Calligraphy, Zero Crescent Bug
      ===================================================================== */}
      <div
        className={`relative z-20 flex items-center justify-center transition-all ${
          stage === 'cascade'
            ? 'scale-100 opacity-100 duration-700 ease-out'
            : stage === 'resonate'
            ? 'scale-[1.03] opacity-100 duration-1000 ease-out'
            : 'scale-[1.22] opacity-0 duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]'
        }`}
        style={{ willChange: 'transform, opacity' }}
      >
        <div className="relative h-[86vh] max-h-[820px] min-h-[460px] aspect-[600/920] flex items-center justify-center">
          <svg
            viewBox="0 0 600 920"
            className="w-full h-full overflow-visible"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Sculpted Alabaster-Silver Calligraphic Gradient for 苹果坏了 */}
              <linearGradient id="baCalligraphyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="45%" stopColor="#f8fafc" />
                <stop offset="78%" stopColor="#cbd5e1" />
                <stop offset="100%" stopColor="#ffffff" />
              </linearGradient>

              {/* Vertical Celestial Axis Gradient */}
              <linearGradient id="baAxisGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
                <stop offset="6%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
                <stop offset="94%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>

              {/* Horizontal Needle Gradient */}
              <linearGradient id="baHorizNeedleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
                <stop offset="18%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="82%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>

              {/* Soft Diffused Ink-Wash Mist behind the Calligraphy Spine */}
              <radialGradient id="baSoftInkWash" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#e2e8f0" stopOpacity="0.22" />
                <stop offset="48%" stopColor="#94a3b8" stopOpacity="0.09" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </radialGradient>

              {/* Deep 3D Gothic Relief Filter for the 4 Characters */}
              <filter id="baGothicBevel" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="-5" dy="6" stdDeviation="4.5" floodColor="#000000" floodOpacity="0.95" />
                <feDropShadow dx="0" dy="0" stdDeviation="10" floodColor="#ffffff" floodOpacity="0.34" />
              </filter>
            </defs>

            {/* ===============================================================
                LAYER 1 (BACK): SOFT INK-WASH HALOS & CELESTIAL AXIS SPEARS
            =============================================================== */}
            {/* Soft Atmospheric Ink-Wash Glows behind the Spine */}
            <ellipse cx="332" cy="350" rx="76" ry="72" fill="url(#baSoftInkWash)" />
            <ellipse cx="342" cy="520" rx="68" ry="64" fill="url(#baSoftInkWash)" />

            {/* Main Vertical Celestial Axis Spear (x = 392, y = 22 -> 896) */}
            <line
              x1="392"
              y1="22"
              x2="392"
              y2="896"
              stroke="url(#baAxisGrad)"
              strokeWidth="1.75"
              style={{
                strokeDasharray: 920,
                filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.75))',
                animation: 'baAxisNeedle 0.85s cubic-bezier(0.16, 1, 0.3, 1) forwards'
              }}
            />

            {/* Top Celestial Compass Astrolabe Node (⊕ at x=392, y=102) */}
            <g
              transform="translate(392, 102)"
              style={{
                transformOrigin: '392px 102px',
                animation: 'baCompassLock 0.85s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both'
              }}
            >
              <circle cx="0" cy="0" r="14" fill="#020204" stroke="#ffffff" strokeWidth="1.35" />
              <circle
                cx="0"
                cy="0"
                r="10"
                stroke="#ffffff"
                strokeWidth="0.8"
                strokeDasharray="3 2"
                strokeOpacity="0.75"
              />
              <line x1="-23" y1="0" x2="23" y2="0" stroke="#ffffff" strokeWidth="1.2" />
              <line x1="0" y1="-23" x2="0" y2="23" stroke="#ffffff" strokeWidth="1.2" />
              <circle cx="0" cy="0" r="2.2" fill="#ffffff" />
            </g>

            {/* Precision Axis Tick Mark at y=332 */}
            <line
              x1="381"
              y1="332"
              x2="403"
              y2="332"
              stroke="#ffffff"
              strokeWidth="1.5"
              style={{
                transformOrigin: '392px 332px',
                animation: 'baHorizontalBlade 0.6s ease-out 0.65s both'
              }}
            />

            {/* Secondary Outer Right Vertical Needle (x = 428, below "BLACK APPLE") */}
            <line
              x1="428"
              y1="346"
              x2="428"
              y2="604"
              stroke="url(#baAxisGrad)"
              strokeWidth="1.2"
              style={{
                strokeDasharray: 300,
                animation: 'baAxisNeedle 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.78s both'
              }}
            />

            {/* Horizontal Celestial Cross-Needles (Behind the 4 characters) */}
            {CALLIGRAPHY_GLYPHS.map((g, i) => (
              <line
                key={`needle-${i}`}
                x1={g.needleX1}
                y1={g.needleY}
                x2={g.needleX2}
                y2={g.needleY}
                stroke="url(#baHorizNeedleGrad)"
                strokeWidth="1.5"
                style={{
                  transformOrigin: `${(g.needleX1 + g.needleX2) / 2}px ${g.needleY}px`,
                  animation: `baHorizontalBlade 0.65s cubic-bezier(0.16, 1, 0.3, 1) ${g.rippleDelay} both`,
                  filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.7))'
                }}
              />
            ))}

            {/* ===============================================================
                LAYER 2: VERTICAL "B L A C K   A P P L E" INSCRIPTION (x = 428)
            =============================================================== */}
            {VERTICAL_BRAND_LETTERS.map((item, idx) => (
              <g
                key={idx}
                transform={`translate(428, ${item.y})`}
                style={{
                  animation: `baLetterDrop 0.45s cubic-bezier(0.16, 1, 0.3, 1) ${item.delay} both`
                }}
              >
                <text
                  x="0"
                  y="0"
                  transform="rotate(90)"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#ffffff"
                  fontFamily="'Cormorant Garamond', 'Playfair Display', Georgia, serif"
                  fontWeight="700"
                  fontSize="15.5"
                  letterSpacing="0.14em"
                  style={{
                    filter:
                      'drop-shadow(-1px 2px 3px rgba(0,0,0,0.95)) drop-shadow(0 0 6px rgba(255,255,255,0.35))'
                  }}
                >
                  {item.char}
                </text>
              </g>
            ))}

            {/* ===============================================================
                LAYER 3 (FRONT): THE 4 SCULPTED CALLIGRAPHIC CHARACTERS
                ("苹" -> "果" -> "坏" -> "了" slamming down one by one with
                Ghost Echo convergence + Expanding Shockwave Ripple)
            =============================================================== */}
            {CALLIGRAPHY_GLYPHS.map((item, idx) => (
              <g key={`char-${idx}`}>
                {/* Expanding Shockwave Ripple at Character Center upon Impact */}
                <circle
                  cx="298"
                  cy={item.centerY}
                  r="64"
                  stroke="#ffffff"
                  strokeWidth="1.2"
                  fill="none"
                  style={{
                    transformOrigin: `298px ${item.centerY}px`,
                    animation: `baImpactRipple 0.95s cubic-bezier(0.16, 1, 0.3, 1) ${item.rippleDelay} both`
                  }}
                />

                {/* Ghostly Silver Afterimage Twin converging into the Character */}
                <g
                  style={{
                    transformOrigin: `298px ${item.centerY}px`,
                    animation: `baCharGhostEcho 0.78s cubic-bezier(0.16, 1, 0.3, 1) ${item.echoDelay} both`
                  }}
                >
                  <text
                    x="298"
                    y={item.y}
                    textAnchor="middle"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2"
                    strokeOpacity="0.7"
                    fontFamily="'Noto Serif SC', 'Songti SC', 'STSong', 'SimSun', serif"
                    fontWeight="600"
                    fontSize={item.size}
                  >
                    {item.char}
                  </text>
                </g>

                {/* Primary Sculpted 3D Character */}
                <g
                  style={{
                    transformOrigin: `298px ${item.centerY}px`,
                    animation: `baCharImpactDrop 0.72s cubic-bezier(0.16, 1, 0.3, 1) ${item.delay} both`
                  }}
                >
                  <text
                    x="298"
                    y={item.y}
                    textAnchor="middle"
                    fill="url(#baCalligraphyGrad)"
                    stroke="#ffffff"
                    strokeWidth="0.6"
                    strokeOpacity="0.5"
                    fontFamily="'Noto Serif SC', 'Songti SC', 'STSong', 'SimSun', serif"
                    fontWeight="600"
                    fontSize={item.size}
                    filter="url(#baGothicBevel)"
                  >
                    {item.char}
                  </text>
                </g>

                {/* Synchronized 4-Point Star Glint (✦) for this Character's Needle */}
                <FourPointStar
                  cx={item.starX}
                  cy={item.needleY}
                  rx={item.starRx}
                  ry={item.starRy}
                  delay={item.rippleDelay}
                />
              </g>
            ))}

            {/* ===============================================================
                LAYER 4: OUTER CELESTIAL STAR GLINTS (✦) & LOWER FINIAL SPEAR
            =============================================================== */}
            {/* Star ✦ right below the 'E' of BLACK APPLE */}
            <FourPointStar cx={428} cy={352} rx={8.5} ry={16} delay="0.82s" />

            {/* Star ✦ on outer right needle */}
            <FourPointStar cx={428} cy={506} rx={7.5} ry={14} delay="1.26s" />

            {/* Prominent Lower Celestial Axis Star ✦ (x=392, y=752) */}
            <FourPointStar cx={392} cy={752} rx={16} ry={28} delay="1.76s" />

            {/* Lower Axis Constellation Pearls (⋮) and Integrated Astrolabe Finial (○) */}
            <g
              transform="translate(392, 826)"
              style={{
                transformOrigin: '392px 826px',
                animation: 'baCompassLock 0.85s cubic-bezier(0.16, 1, 0.3, 1) 1.82s both'
              }}
            >
              <circle cx="0" cy="-34" r="2" fill="#ffffff" />
              <circle cx="0" cy="-24" r="2.5" fill="#ffffff" />
              <circle cx="0" cy="-14" r="2" fill="#ffffff" />
              <circle cx="0" cy="0" r="9" fill="#020204" stroke="#ffffff" strokeWidth="1.3" />
              <circle cx="0" cy="0" r="5.5" stroke="#ffffff" strokeWidth="0.75" strokeOpacity="0.7" />
              <circle cx="0" cy="0" r="1.6" fill="#ffffff" />
            </g>
          </svg>
        </div>
      </div>

      {/* =====================================================================
          3. UNOBTRUSIVE SKIP CONTROL
      ===================================================================== */}
      <button
        onClick={onComplete}
        className="absolute top-6 right-6 z-40 pointer-events-auto px-4 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.14] border border-white/15 hover:border-white/35 text-[11px] font-sans tracking-[0.18em] text-neutral-300 hover:text-white uppercase transition-all duration-200 backdrop-blur-md cursor-pointer"
        title="Bỏ qua intro và vào trang chủ"
      >
        Bỏ qua &rarr;
      </button>
    </div>
  );
}
