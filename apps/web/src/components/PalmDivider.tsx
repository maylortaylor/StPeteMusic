interface PalmDividerProps {
  topColor: string;
  bottomColor: string;
  flip?: boolean;
}

export function PalmDivider({ topColor, bottomColor, flip = false }: PalmDividerProps) {
  return (
    <div
      className="w-full overflow-hidden leading-none"
      style={{
        backgroundColor: topColor,
        transform: flip ? 'scaleY(-1)' : undefined,
      }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1440 160"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="w-full block"
        style={{ height: '160px' }}
      >
        {/* Base bottom fill */}
        <rect width="1440" height="160" fill={bottomColor} />

        {/* Flat top section */}
        <rect width="1440" height="55" fill={topColor} />

        {/* ── LEFT SIDE FRONDS ── */}

        {/* Frond L1 — large, sweeping rightward from far left */}
        <path
          d="M -40,0 Q 220,30 380,160 Q 220,55 0,18 Z"
          fill={topColor}
          opacity="1"
        />
        {/* Frond L2 — medium, mostly vertical with slight lean */}
        <path
          d="M 0,0 Q 55,60 80,160 Q 45,70 -12,12 Z"
          fill={topColor}
          opacity="1"
        />
        {/* Frond L3 — thin, angled more rightward */}
        <path
          d="M -55,0 Q 110,40 190,160 Q 110,58 -28,14 Z"
          fill={topColor}
          opacity="1"
        />
        {/* Frond L4 — small, far left, droops nearly vertically */}
        <path
          d="M -90,5 Q -30,65 0,160 Q -28,70 -100,18 Z"
          fill={topColor}
          opacity="0.85"
        />

        {/* Midrib lines on left fronds for detail */}
        <line x1="-40" y1="0"  x2="380" y2="160" stroke="#483E8E" strokeWidth="1.2" opacity="0.35" />
        <line x1="0"   y1="0"  x2="80"  y2="160" stroke="#483E8E" strokeWidth="0.8" opacity="0.25" />
        <line x1="-55" y1="0"  x2="190" y2="160" stroke="#483E8E" strokeWidth="0.8" opacity="0.25" />

        {/* ── RIGHT SIDE FRONDS ── */}

        {/* Frond R1 — large, sweeping leftward from far right */}
        <path
          d="M 1480,0 Q 1220,30 1060,160 Q 1220,55 1440,18 Z"
          fill={topColor}
          opacity="1"
        />
        {/* Frond R2 — medium vertical */}
        <path
          d="M 1440,0 Q 1385,60 1360,160 Q 1395,70 1452,12 Z"
          fill={topColor}
          opacity="1"
        />
        {/* Frond R3 — thin, angled more leftward */}
        <path
          d="M 1495,0 Q 1330,40 1250,160 Q 1330,58 1468,14 Z"
          fill={topColor}
          opacity="1"
        />
        {/* Frond R4 — small, far right */}
        <path
          d="M 1530,5 Q 1470,65 1440,160 Q 1468,70 1540,18 Z"
          fill={topColor}
          opacity="0.85"
        />

        {/* Midrib lines on right fronds */}
        <line x1="1480" y1="0"  x2="1060" y2="160" stroke="#483E8E" strokeWidth="1.2" opacity="0.35" />
        <line x1="1440" y1="0"  x2="1360" y2="160" stroke="#483E8E" strokeWidth="0.8" opacity="0.25" />
        <line x1="1495" y1="0"  x2="1250" y2="160" stroke="#483E8E" strokeWidth="0.8" opacity="0.25" />
      </svg>
    </div>
  );
}
