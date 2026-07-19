import React from 'react';

interface TitanEsportsLogoProps {
  className?: string;
  style?: React.CSSProperties;
}

export const TitanEsportsLogo: React.FC<TitanEsportsLogoProps> = ({ className = "w-48 h-48", style }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      className={className}
      style={style}
    >
      <defs>
        {/* Glowing and Metallic Gradients */}
        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d97706" />
          <stop offset="50%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>

        <linearGradient id="brightGold" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fffbeb" />
          <stop offset="30%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>

        <linearGradient id="silverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9ca3af" />
          <stop offset="30%" stopColor="#f3f4f6" />
          <stop offset="70%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#4b5563" />
        </linearGradient>

        <linearGradient id="shieldBg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1e1b4b" />
          <stop offset="100%" stopColor="#030712" />
        </linearGradient>

        <radialGradient id="redGlow" cx="50%" cy="45%" r="50%">
          <stop offset="0%" stopColor="#991b1b" stopOpacity="0.8" />
          <stop offset="60%" stopColor="#7f1d1d" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>

        <linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fee2e2" />
          <stop offset="100%" stopColor="#fecaca" />
        </linearGradient>

        <linearGradient id="hairGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="60%" stopColor="#e5e7eb" />
          <stop offset="100%" stopColor="#9ca3af" />
        </linearGradient>

        {/* Glow Filters */}
        <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feComponentTransfer in="blur" result="glow1">
            <feFuncA type="linear" slope="0.8" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="glow1" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#000000" floodOpacity="0.7" />
        </filter>
      </defs>

      {/* 1. Dramatic Red Silhouette Background Glow */}
      <circle cx="256" cy="230" r="210" fill="url(#redGlow)" />
      
      {/* Ghostly Mascot Background Silhouette (Dark Crimson Outline) */}
      <path
        d="M 120,280 L 140,160 L 210,80 L 302,80 L 372,160 L 392,280 L 350,330 L 256,360 L 162,330 Z"
        fill="#7f1d1d"
        opacity="0.15"
        transform="scale(1.1) translate(-22, -30)"
      />

      {/* 2. Shield Crest Background */}
      <g filter="url(#goldGlow)">
        {/* Outer Golden Shield Edge */}
        <path
          d="M 256,40 L 400,150 L 370,320 L 256,420 L 142,320 L 112,150 Z"
          fill="url(#goldGradient)"
          stroke="#fffbeb"
          strokeWidth="3"
        />
        {/* Inner Dark Shield Body */}
        <path
          d="M 256,54 L 382,152 L 354,308 L 256,398 L 158,308 L 130,152 Z"
          fill="url(#shieldBg)"
          stroke="#b45309"
          strokeWidth="2"
        />
      </g>

      {/* 3. Mascot Character Rendering */}
      <g filter="url(#softShadow)">
        {/* Neck */}
        <path d="M 226,220 L 286,220 L 276,260 L 236,260 Z" fill="#fca5a5" />
        <path d="M 240,220 L 272,220 L 256,250 Z" fill="#f87171" opacity="0.5" />

        {/* Face */}
        <path
          d="M 216,150 C 216,150 210,210 216,220 C 222,230 240,240 256,240 C 272,240 290,230 296,220 C 302,210 296,150 296,150 Z"
          fill="url(#skinGrad)"
        />

        {/* Ear Left */}
        <path d="M 210,175 C 205,175 205,190 212,192 Z" fill="#fee2e2" />
        {/* Ear Right */}
        <path d="M 302,175 C 307,175 307,190 300,192 Z" fill="#fee2e2" />

        {/* Neck strap & pendant */}
        <path d="M 238,242 L 274,242 L 256,270 Z" fill="#111827" />
        <path d="M 253,265 L 259,265 L 256,280 Z" fill="url(#goldGradient)" />

        {/* Eyes (Sharp anime gaze) */}
        {/* Left Eye */}
        <path d="M 226,178 Q 236,174 244,180 L 241,184 Q 234,180 228,182 Z" fill="#000" />
        <ellipse cx="236" cy="183" rx="4" ry="6" fill="#b45309" />
        <circle cx="235" cy="181" r="1.5" fill="#fff" />
        
        {/* Right Eye */}
        <path d="M 286,178 Q 276,174 268,180 L 271,184 Q 278,180 284,182 Z" fill="#000" />
        <ellipse cx="276" cy="183" rx="4" ry="6" fill="#b45309" />
        <circle cx="275" cy="181" r="1.5" fill="#fff" />

        {/* Nose and Smirk */}
        <path d="M 256,192 L 254,198 L 257,198 Z" fill="#f87171" />
        <path d="M 248,212 Q 256,218 264,212" stroke="#000" strokeWidth="2" fill="none" strokeLinecap="round" />

        {/* Hand (Index finger over lips "Shush" gesture) */}
        {/* Arm / sleeve */}
        <path d="M 190,260 L 220,290 L 200,310 Z" fill="#ffffff" />
        {/* Hand & fingers raised */}
        <g transform="translate(240, 195)">
          {/* Hand palm base */}
          <path d="M 10,40 C 5,35 0,25 5,15 C 10,12 18,18 16,30 Z" fill="url(#skinGrad)" />
          {/* Index finger pointing up */}
          <rect x="11" y="-5" width="6" height="25" rx="3" fill="url(#skinGrad)" stroke="#b45309" strokeWidth="1" />
          {/* Other folded fingers */}
          <circle cx="6" cy="22" r="4" fill="url(#skinGrad)" stroke="#b45309" strokeWidth="0.5" />
          <circle cx="8" cy="28" r="4" fill="url(#skinGrad)" stroke="#b45309" strokeWidth="0.5" />
          <circle cx="11" cy="34" r="4" fill="url(#skinGrad)" stroke="#b45309" strokeWidth="0.5" />
          {/* Black beaded wristband */}
          <ellipse cx="14" cy="42" rx="7" ry="3" fill="#111827" />
          <circle cx="8" cy="42" r="2.5" fill="#111827" />
          <circle cx="13" cy="43" r="2.5" fill="#111827" />
          <circle cx="18" cy="42" r="2.5" fill="#111827" />
        </g>

        {/* Character Shirt (White with graphic prints) */}
        <path
          d="M 160,280 L 210,250 Q 230,280 256,280 Q 282,280 302,250 L 352,280 L 370,360 L 142,360 Z"
          fill="#ffffff"
          stroke="#d1d5db"
          strokeWidth="1.5"
        />
        {/* V-Neck opening */}
        <path d="M 226,255 L 256,310 L 286,255 Z" fill="url(#skinGrad)" stroke="#fca5a5" strokeWidth="1" />
        <path d="M 218,250 L 256,312 L 294,250 Z" fill="none" stroke="#d1d5db" strokeWidth="2.5" />

        {/* Graphic prints (Skulls/lightning circles) */}
        {/* Left Chest Ornament */}
        <circle cx="190" cy="305" r="14" fill="#1f2937" />
        <circle cx="190" cy="305" r="11" fill="#111827" />
        {/* Skull teeth details on print */}
        <path d="M 184,310 L 196,310 L 194,315 L 186,315 Z" fill="#ffffff" />
        <circle cx="186" cy="302" r="2.5" fill="#ffffff" />
        <circle cx="194" cy="302" r="2.5" fill="#ffffff" />
        
        {/* Right Chest Ornament */}
        <circle cx="322" cy="305" r="14" fill="#1f2937" />
        <circle cx="322" cy="305" r="11" fill="#111827" />
        <path d="M 316,310 L 328,310 L 326,315 L 318,315 Z" fill="#ffffff" />
        <circle cx="318" cy="302" r="2.5" fill="#ffffff" />
        <circle cx="326" cy="302" r="2.5" fill="#ffffff" />

        {/* Character Spiky Hair (Extremely detailed white-silver layers) */}
        <g fill="url(#hairGrad)" stroke="#4b5563" strokeWidth="1" strokeLinejoin="round">
          {/* Back hair spikes */}
          <path d="M 210,170 L 180,165 L 205,150 L 175,135 L 210,130 L 190,110 L 225,115 L 215,90 L 245,105 L 256,70 L 267,105 L 297,90 L 287,115 L 322,110 L 302,130 L 337,135 L 307,150 L 332,165 L 302,170 Z" />
          
          {/* Top/Side volume spikes */}
          <path d="M 195,155 L 185,185 L 210,180 L 190,205 L 215,195 L 210,215 L 225,195 L 220,180 Z" fill="#f3f4f6" />
          <path d="M 317,155 L 327,185 L 302,180 L 322,205 L 297,195 L 302,215 L 287,195 L 292,180 Z" fill="#f3f4f6" />

          {/* Front bangs falling on face */}
          <path d="M 218,140 L 228,185 L 236,155 L 246,192 L 252,160 L 256,198 L 260,160 L 266,192 L 276,155 L 284,185 L 294,140 Z" fill="#ffffff" />
          <path d="M 235,145 L 242,175 L 248,150 L 256,182 L 264,150 L 270,175 L 277,145 Z" fill="#f9fafb" />
          
          {/* Cowlick/Ahoe top spike */}
          <path d="M 256,72 Q 240,50 252,42 Q 262,48 256,72 Z" fill="#ffffff" />
        </g>
      </g>

      {/* 4. Text Banner Panel ("TITAN ESPORTS") */}
      <g filter="url(#softShadow)" transform="translate(0, 310)">
        {/* Banner background base plate (Metallic charcoal chevron) */}
        <polygon
          points="64,50 120,20 392,20 448,50 392,80 120,80"
          fill="#111827"
          stroke="url(#goldGradient)"
          strokeWidth="3"
        />
        <polygon
          points="68,48 122,23 390,23 444,48 390,75 122,75"
          fill="#030712"
          stroke="#b45309"
          strokeWidth="1.5"
        />

        {/* TITAN Golden 3D Text */}
        {/* 3D Underlay shadow */}
        <text
          x="256"
          y="46"
          fontFamily="Impact, Arial Black, sans-serif"
          fontWeight="900"
          fontSize="52"
          textAnchor="middle"
          fill="#78350f"
          letterSpacing="8"
        >
          TITAN
        </text>
        <text
          x="256"
          y="44"
          fontFamily="Impact, Arial Black, sans-serif"
          fontWeight="900"
          fontSize="52"
          textAnchor="middle"
          fill="#b45309"
          letterSpacing="8"
        >
          TITAN
        </text>
        {/* Gold Front Text */}
        <text
          x="256"
          y="42"
          fontFamily="Impact, Arial Black, sans-serif"
          fontWeight="900"
          fontSize="52"
          textAnchor="middle"
          fill="url(#brightGold)"
          letterSpacing="8"
          stroke="#000000"
          strokeWidth="1"
        >
          TITAN
        </text>

        {/* ESPORTS Silver/Chrome 3D Text */}
        {/* 3D Underlay shadow */}
        <text
          x="256"
          y="74"
          fontFamily="Impact, Arial Black, sans-serif"
          fontWeight="900"
          fontSize="24"
          textAnchor="middle"
          fill="#374151"
          letterSpacing="12"
        >
          ESPORTS
        </text>
        {/* Silver Front Text */}
        <text
          x="256"
          y="72"
          fontFamily="Impact, Arial Black, sans-serif"
          fontWeight="900"
          fontSize="24"
          textAnchor="middle"
          fill="url(#silverGradient)"
          letterSpacing="12"
          stroke="#111827"
          strokeWidth="1.5"
        >
          ESPORTS
        </text>
      </g>

      {/* 5. Gold Stars Row */}
      <g fill="url(#goldGradient)" filter="url(#goldGlow)" transform="translate(0, 400)">
        {/* Center Star (Large) */}
        <path
          d="M 256,5 L 260,15 L 271,15 L 262,21 L 265,31 L 256,25 L 247,31 L 250,21 L 241,15 L 252,15 Z"
          transform="scale(1.2) translate(-42.6, -2)"
        />
        {/* Inner Left Star */}
        <path
          d="M 220,10 L 223,18 L 232,18 L 225,23 L 227,31 L 220,26 L 213,31 L 215,23 L 208,18 L 217,18 Z"
        />
        {/* Inner Right Star */}
        <path
          d="M 292,10 L 295,18 L 304,18 L 297,23 L 299,31 L 292,26 L 285,31 L 287,23 L 280,18 L 289,18 Z"
        />
        {/* Outer Left Star */}
        <path
          d="M 184,18 L 187,25 L 195,25 L 189,29 L 191,36 L 184,32 L 177,36 L 179,29 L 173,25 L 181,25 Z"
          transform="rotate(-5, 184, 25)"
        />
        {/* Outer Right Star */}
        <path
          d="M 328,18 L 331,25 L 339,25 L 333,29 L 335,36 L 328,32 L 321,36 L 323,29 L 317,25 L 325,25 Z"
          transform="rotate(5, 328, 25)"
        />
      </g>
    </svg>
  );
};
