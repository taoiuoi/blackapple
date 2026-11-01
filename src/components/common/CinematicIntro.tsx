import { useState, useEffect } from 'react';

interface CinematicIntroProps {
  onComplete: () => void;
  siteTitle?: string;
}

// 12 outer cardinal & ordinal radial needle flares (inspired by IMG_0464)
const CORONA_ANGLES = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
const INNER_CORONA_ANGLES = [15, 45, 75, 105, 135, 165, 195, 225, 255, 285, 315, 345];

export function CinematicIntro({ onComplete }: CinematicIntroProps) {
  const [stage, setStage] = useState<'ignite' | 'sustain' | 'exit'>('ignite');

  useEffect(() => {
    // Elegant cinematic pacing without GIF/video:
    // 0.0s -> 1.8s: Anamorphic lens flare beam ignition & Black Apple emblem materialization
    // 1.8s -> 2.7s: Radiant sustain & specular chrome sheen
    // 2.7s -> 3.3s: Seamless cinematic dissolve into main experience
    const t1 = window.setTimeout(() => setStage('sustain'), 1800);
    const t2 = window.setTimeout(() => setStage('exit'), 2700);
    const t3 = window.setTimeout(() => {
      onComplete();
    }, 3300);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [onComplete]);

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-50 bg-[#000000] overflow-hidden flex items-center justify-center select-none pointer-events-none transition-opacity duration-700 ease-out ${
        stage === 'exit' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        perspective: '1200px',
        willChange: 'opacity'
      }}
    >
      <style>{`
        @keyframes baCoronaSwirl {
          0% {
            transform: rotate(-12deg) scale(0.72);
            opacity: 0;
          }
          35% {
            opacity: 1;
          }
          100% {
            transform: rotate(20deg) scale(1.05);
            opacity: 0.95;
          }
        }

        @keyframes baInnerCoronaSwirl {
          0% {
            transform: rotate(18deg) scale(0.75);
            opacity: 0;
          }
          40% {
            opacity: 0.9;
          }
          100% {
            transform: rotate(-15deg) scale(1.02);
            opacity: 0.9;
          }
        }

        @keyframes baAnamorphicBeam {
          0% {
            transform: scaleX(0.04) scaleY(0.3);
            opacity: 0;
          }
          30% {
            transform: scaleX(1.3) scaleY(1.4);
            opacity: 1;
          }
          70% {
            transform: scaleX(2.0) scaleY(0.8);
            opacity: 0.85;
          }
          100% {
            transform: scaleX(2.6) scaleY(0.4);
            opacity: 0;
          }
        }

        @keyframes baLogoIgnite {
          0% {
            transform: scale(0.75);
            opacity: 0;
            filter: brightness(2.4) drop-shadow(0 0 50px rgba(255, 255, 255, 0.95));
          }
          40% {
            opacity: 1;
            filter: brightness(1.6) drop-shadow(0 0 35px rgba(255, 255, 255, 0.85));
          }
          100% {
            transform: scale(1);
            opacity: 1;
            filter: brightness(1) drop-shadow(0 0 25px rgba(255, 255, 255, 0.55));
          }
        }

        @keyframes baAppleShine {
          0%, 100% {
            opacity: 0.75;
          }
          50% {
            opacity: 1;
            filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.9));
          }
        }
      `}</style>

      {/* =====================================================================
          1. ANAMORPHIC HORIZONTAL LENS FLARE (Singularity Flare Burst)
      ===================================================================== */}
      <div
        className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-700 ${
          stage === 'ignite'
            ? 'opacity-100 scale-100'
            : stage === 'sustain'
            ? 'opacity-60 scale-110'
            : 'opacity-0 scale-150'
        }`}
      >
        {/* Horizontal Laser Glint */}
        <div
          className="w-[140vw] h-[3px] bg-gradient-to-r from-transparent via-white to-transparent"
          style={{
            animation: 'baAnamorphicBeam 2.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            boxShadow:
              '0 0 15px 4px rgba(255, 255, 255, 0.9), 0 0 35px 8px rgba(200, 225, 255, 0.6), 0 0 70px 18px rgba(160, 195, 255, 0.35)'
          }}
        />

        {/* Central White Hot Light Core */}
        <div
          className="absolute w-24 h-24 rounded-full bg-white filter blur-[3px]"
          style={{
            boxShadow:
              '0 0 50px 25px rgba(255, 255, 255, 1), 0 0 100px 50px rgba(220, 235, 255, 0.7)'
          }}
        />
      </div>

      {/* =====================================================================
          2. THE EMBLEM OF THE BLACK APPLE (TÁO ĐEN)
             Sleek, bespoke monochrome vector logo with bitten silhouette (IMG_0465),
             encircled by the sharp radial starburst corona (IMG_0464).
             NO GIF, NO text, NO scattered stars, absolute luxury minimalism.
      ===================================================================== */}
      <div
        className={`relative z-20 flex items-center justify-center transition-all ${
          stage === 'ignite'
            ? 'opacity-100 scale-100 duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]'
            : stage === 'sustain'
            ? 'opacity-100 scale-[1.04] duration-800 ease-out'
            : 'opacity-0 scale-[1.25] duration-600 ease-[cubic-bezier(0.4,0,0.2,1)]'
        }`}
        style={{ willChange: 'transform, opacity' }}
      >
        <div className="relative w-[78vmin] h-[78vmin] max-w-[520px] max-h-[520px] flex items-center justify-center">
          {/* -----------------------------------------------------------------
              CELESTIAL CORONA HALO (IMG_0464): Radial needle-sharp 4-point flares
          ----------------------------------------------------------------- */}
          <svg
            viewBox="0 0 560 560"
            className="absolute inset-0 w-full h-full"
            style={{
              animation: 'baCoronaSwirl 3.5s cubic-bezier(0.2, 0.9, 0.2, 1) forwards',
              filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.45))',
              willChange: 'transform, opacity'
            }}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g transform="translate(280, 280)">
              {CORONA_ANGLES.map((angle) => {
                const isCardinal = angle % 90 === 0;
                const radius = isCardinal ? 210 : 196;
                const outerTip = isCardinal ? 46 : 36;
                const innerTip = isCardinal ? 32 : 25;
                const sideWing = isCardinal ? 12 : 9;

                return (
                  <g key={angle} transform={`rotate(${angle}) translate(0, -${radius})`}>
                    <path
                      d={`M 0 ${-outerTip}
                         C 0.8 ${-outerTip * 0.2}, ${sideWing * 0.22} -0.8, ${sideWing} 0
                         C ${sideWing * 0.22} 0.8, 0.8 ${innerTip * 0.22}, 0 ${innerTip}
                         C -0.8 ${innerTip * 0.22}, ${-sideWing * 0.22} 0.8, ${-sideWing} 0
                         C ${-sideWing * 0.22} -0.8, -0.8 ${-outerTip * 0.2}, 0 ${-outerTip} Z`}
                      fill="#ffffff"
                    />
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Inner Needle Flare Ring */}
          <svg
            viewBox="0 0 560 560"
            className="absolute inset-0 w-full h-full"
            style={{
              animation: 'baInnerCoronaSwirl 3.5s cubic-bezier(0.2, 0.9, 0.2, 1) forwards',
              willChange: 'transform, opacity'
            }}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g transform="translate(280, 280)">
              {INNER_CORONA_ANGLES.map((angle, idx) => {
                const radius = 152;
                const radialLen = idx % 2 === 0 ? 22 : 18;
                const crossLen = idx % 2 === 0 ? 8 : 6.5;

                return (
                  <g key={angle} transform={`rotate(${angle}) translate(0, -${radius})`}>
                    <path
                      d={`M 0 ${-radialLen}
                         C 0.6 ${-radialLen * 0.22}, ${crossLen * 0.25} -0.6, ${crossLen} 0
                         C ${crossLen * 0.25} 0.6, 0.6 ${radialLen * 0.22}, 0 ${radialLen}
                         C -0.6 ${radialLen * 0.22}, ${-crossLen * 0.25} 0.6, ${-crossLen} 0
                         C ${-crossLen * 0.25} -0.6, -0.6 ${-radialLen * 0.22}, 0 ${-radialLen} Z`}
                      fill="#ffffff"
                      fillOpacity="0.85"
                    />
                  </g>
                );
              })}
            </g>
          </svg>

          {/* -----------------------------------------------------------------
              THE BITTEN BLACK APPLE LOGO EMBLEM (IMG_0465)
              Pure graphic mark: Stylized apple body with left bite silhouette,
              curved stem, sweeping leaf, and gleaming liquid chrome contours.
          ----------------------------------------------------------------- */}
          <div
            className="relative z-30 w-[52vmin] max-w-[340px] h-[52vmin] max-h-[340px] flex items-center justify-center"
            style={{
              animation: 'baLogoIgnite 1.4s cubic-bezier(0.16, 1, 0.3, 1) forwards'
            }}
          >
            <svg
              viewBox="0 0 380 400"
              className="w-full h-full overflow-visible drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Subtle Ambient Radial Backlight behind the logo */}
              <circle
                cx="190"
                cy="215"
                r="135"
                fill="url(#appleHaloGrad)"
                opacity="0.8"
              />

              <defs>
                <radialGradient id="appleHaloGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
                  <stop offset="50%" stopColor="#ffffff" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                </radialGradient>

                {/* Shimmering Metallic Gradient for the Apple Contour */}
                <linearGradient id="appleContourGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="35%" stopColor="#e2e8f0" />
                  <stop offset="70%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#cbd5e1" />
                </linearGradient>

                {/* Deep Obsidian Gradient for Apple Body */}
                <radialGradient id="appleBodyGrad" cx="42%" cy="38%" r="65%">
                  <stop offset="0%" stopColor="#1e1e24" />
                  <stop offset="60%" stopColor="#0a0a0d" />
                  <stop offset="100%" stopColor="#020203" />
                </radialGradient>

                {/* Inner Core Bite Gradient */}
                <linearGradient id="biteCoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#e2e8f0" />
                </linearGradient>
              </defs>

              {/* -------------------------------------------------------------
                  1. STEM & LEAF (Top)
              ------------------------------------------------------------- */}
              {/* Curved Stem */}
              <path
                d="M 184 104 C 176 68, 186 42, 198 34 C 203 34, 204 42, 195 68 C 190 84, 191 98, 188 106 Z"
                fill="#ffffff"
                stroke="#ffffff"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />

              {/* Sweeping Leaf pointing right */}
              <path
                d="M 198 62 C 228 32, 274 30, 298 44 C 278 74, 234 82, 198 62 Z"
                fill="#ffffff"
                stroke="#ffffff"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />

              {/* Leaf Stem Rib Line */}
              <path
                d="M 204 62 C 236 56, 266 52, 290 47"
                stroke="#0a0a0d"
                strokeWidth="2.2"
                strokeLinecap="round"
              />

              {/* -------------------------------------------------------------
                  2. MAIN APPLE BODY (Obsidian Silhouette with Bitten Left Contour)
              ------------------------------------------------------------- */}
              {/* Outer Apple Silhouette */}
              <path
                d="M 188 114
                   C 198 118, 222 108, 252 110
                   C 292 114, 332 144, 336 196
                   C 340 248, 306 312, 276 342
                   C 252 366, 222 364, 192 352
                   C 162 364, 132 366, 108 342
                   C 86 320, 78 288, 86 264
                   C 106 268, 130 258, 136 242
                   C 142 226, 138 206, 126 188
                   C 112 168, 94 158, 88 144
                   C 84 134, 94 120, 114 114
                   C 138 108, 168 118, 188 114 Z"
                fill="url(#appleBodyGrad)"
                stroke="url(#appleContourGrad)"
                strokeWidth="4"
                strokeLinejoin="round"
              />

              {/* -------------------------------------------------------------
                  3. THE BITTEN INTERIOR SECTION (Left Bitten Cutout Detail)
                  Matches the crisp graphic bite in IMG_0465.jpeg
              ------------------------------------------------------------- */}
              {/* White Bitten Flesh Cavity */}
              <path
                d="M 88 144
                   C 112 152, 136 172, 138 198
                   C 140 220, 132 238, 118 248
                   C 104 256, 92 260, 86 264
                   C 80 242, 82 170, 88 144 Z"
                fill="url(#biteCoreGrad)"
                stroke="#ffffff"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />

              {/* Stylized Bite Core Texture Ribs (IMG_0465) */}
              <line
                x1="104"
                y1="172"
                x2="104"
                y2="236"
                stroke="#0a0a0d"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
              <line
                x1="116"
                y1="184"
                x2="116"
                y2="226"
                stroke="#0a0a0d"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
              <path
                d="M 98 198 L 128 202"
                stroke="#0a0a0d"
                strokeWidth="2.2"
                strokeLinecap="round"
              />

              {/* -------------------------------------------------------------
                  4. SPECULAR HIGHLIGHT CURVE (Right Apple Shoulder)
              ------------------------------------------------------------- */}
              <path
                d="M 292 148 C 314 176, 320 216, 316 244"
                stroke="#ffffff"
                strokeWidth="5"
                strokeLinecap="round"
                opacity="0.95"
                style={{
                  animation: 'baAppleShine 2.5s ease-in-out infinite',
                  filter: 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.9))'
                }}
              />
              <path
                d="M 284 136 C 292 142, 296 150, 298 156"
                stroke="#ffffff"
                strokeWidth="3"
                strokeLinecap="round"
                opacity="0.8"
              />

              {/* Signature 4-Point Flare glint at the apple crown */}
              <g
                transform="translate(190, 112) scale(0.65)"
                style={{ filter: 'drop-shadow(0 0 5px rgba(255, 255, 255, 1))' }}
              >
                <path
                  d="M 0 -22 C 1.5 -5, 5 -1.5, 22 0 C 5 1.5, 1.5 5, 0 22 C -1.5 5, -5 1.5, -22 0 C -5 -1.5, -1.5 -5, 0 -22 Z"
                  fill="#ffffff"
                />
              </g>
            </svg>
          </div>
        </div>
      </div>

      {/* =====================================================================
          3. INTUITIVE PASS-THROUGH / SKIP CONTROL (Sleek, unobtrusive)
      ===================================================================== */}
      <button
        onClick={onComplete}
        className="absolute top-6 right-6 z-40 pointer-events-auto px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/30 text-xs font-mono tracking-widest text-neutral-400 hover:text-white uppercase transition-all duration-300 backdrop-blur-md"
        title="Bỏ qua intro và vào trang chủ"
      >
        Bỏ qua &rarr;
      </button>
    </div>
  );
}
