import React from "react";

interface PieceThemeColors {
  white: string;
  black: string;
  stroke: string;
  strokeWidth: string;
}

const PIECE_THEME_COLORS: Record<string, PieceThemeColors> = {
  classic: {
    white: "#ffffff",
    black: "#333333",
    stroke: "#000000",
    strokeWidth: "1.5",
  },
  modern: {
    white: "#f8f9fa",
    black: "#212529",
    stroke: "#495057",
    strokeWidth: "1.2",
  },
  bold: {
    white: "#ffffff",
    black: "#1a1a1a",
    stroke: "#000000",
    strokeWidth: "2.2",
  },
  elegant: {
    white: "#fefefe",
    black: "#2c2c2c",
    stroke: "#4a4a4a",
    strokeWidth: "1.0",
  },
  minimalist: {
    white: "#f5f5f5",
    black: "#404040",
    stroke: "#808080",
    strokeWidth: "0.8",
  },
  gothic: {
    white: "#f0f0f0",
    black: "#1a1a1a",
    stroke: "#000000",
    strokeWidth: "1.8",
  },
};

// Classic Chess Pieces (Traditional Design)
const ClassicPawn = ({ color, themeColors }: { color: string; themeColors: PieceThemeColors }) => (
  <path
    d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z"
    fill={color === "white" ? themeColors.white : themeColors.black}
    stroke={themeColors.stroke}
    strokeWidth={themeColors.strokeWidth}
    strokeLinecap="round"
  />
);

const ClassicKnight = ({ color, themeColors }: { color: string; themeColors: PieceThemeColors }) => (
  <g
    fill={color === "white" ? themeColors.white : themeColors.black}
    stroke={themeColors.stroke}
    strokeWidth={themeColors.strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" />
    <path d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0 .19 1.23-1 2-1 0-4.003 1-4-4 0-2 6-12 6-12s1.89-1.9 2-3.5c-.73-.994-.5-2-.5-3 1-1 3 2.5 3 2.5h2s.78-1.992 2.5-3c1 0 1 3 1 3" />
    <path d="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0zm5.433-9.75a.5 1.5 30 1 1-.866-.5.5 1.5 30 1 1 .866.5z" />
  </g>
);

const ClassicBishop = ({ color, themeColors }: { color: string; themeColors: PieceThemeColors }) => (
  <g
    fill={color === "white" ? themeColors.white : themeColors.black}
    stroke={themeColors.stroke}
    strokeWidth={themeColors.strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0-1.65.54-3 2-.68.72-2.46 2-7.5 2-5.04 0-6.82-1.28-7.5-2-1.35-1.46-3-2-3-2z" />
    <path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z" />
    <path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z" />
  </g>
);

const ClassicRook = ({ color, themeColors }: { color: string; themeColors: PieceThemeColors }) => (
  <g
    fill={color === "white" ? themeColors.white : themeColors.black}
    stroke={themeColors.stroke}
    strokeWidth={themeColors.strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14V9h4v2h5V9h5v2h5V9h4v5" />
    <path d="M34 14l-3 3H14l-3-3" />
    <path d="M31 17v12.5H14V17" />
    <path d="M31 29.5l1.5 2.5h-20l1.5-2.5" />
    <path d="M11 14h23" />
  </g>
);

const ClassicQueen = ({ color, themeColors }: { color: string; themeColors: PieceThemeColors }) => (
  <g
    fill={color === "white" ? themeColors.white : themeColors.black}
    stroke={themeColors.stroke}
    strokeWidth={themeColors.strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 26c8.5-1.5 21-1.5 27 0l2.5-12.5L31 25l-.3-14.1-5.2 13.6-3-14.5-3 14.5-5.2-13.6L14 25 6.5 13.5 9 26z" />
    <path d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z" />
    <path d="M11.5 30c3.5-1 18.5-1 22 0M12 33.5c6-1 15-1 21 0" />
    <circle cx="6" cy="12" r="2" />
    <circle cx="14" cy="9" r="2" />
    <circle cx="22.5" cy="8" r="2" />
    <circle cx="31" cy="9" r="2" />
    <circle cx="39" cy="12" r="2" />
  </g>
);

const ClassicKing = ({ color, themeColors }: { color: string; themeColors: PieceThemeColors }) => (
  <g
    fill={color === "white" ? themeColors.white : themeColors.black}
    stroke={themeColors.stroke}
    strokeWidth={themeColors.strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path
      d="M22.5 11.63V6M20 8h5"
      stroke={color === "white" ? themeColors.stroke : themeColors.white}
    />
    <path
      d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5"
      fill={color === "white" ? themeColors.white : themeColors.black}
      strokeLinecap="butt"
    />
    <path
      d="M12.5 37c5.5 3.5 14.5 3.5 20 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-2.5-7.5-12-10.5-16-4-3 6 6 10.5 6 10.5v7"
      fill={color === "white" ? themeColors.white : themeColors.black}
    />
    <path d="M12.5 30c5.5-3 14.5-3 20 0m-20 3.5c5.5-3 14.5-3 20 0m-20 3.5c5.5-3 14.5-3 20 0" />
  </g>
);

// Modern Chess Pieces (War Game Style - Tanks, Knights, People, etc.)
const ModernPawn = ({ color, themeColors }: { color: string; themeColors: PieceThemeColors }) => (
  <g
    fill={color === "white" ? themeColors.white : themeColors.black}
    stroke={themeColors.stroke}
    strokeWidth={themeColors.strokeWidth}
  >
    {/* Infantry Soldier */}
    {/* Base/Boots */}
    <rect x="19" y="37" width="7" height="2" rx="1" />
    
    {/* Body */}
    <rect x="20.5" y="25" width="4" height="12" rx="1" />
    
    {/* Arms */}
    <rect x="18" y="27" width="2" height="5" rx="1" />
    <rect x="25" y="27" width="2" height="5" rx="1" />
    
    {/* Head */}
    <circle cx="22.5" cy="20" r="3" />
    
    {/* Helmet detail */}
    <path d="M19.5 18.5 h6 v2 c0,1 -1.5,1.5 -3,1.5 s-3,-0.5 -3,-1.5 z" 
          fill={color === "white" ? themeColors.stroke : themeColors.white} 
          opacity="0.3" />
    
    {/* Rifle */}
    <rect x="27" y="23" width="1" height="8" rx="0.5" transform="rotate(15 27.5 27)" />
    <rect x="26.5" y="22" width="2" height="1" rx="0.5" transform="rotate(15 27.5 22.5)" />
  </g>
);

const ModernKnight = ({ color, themeColors }: { color: string; themeColors: PieceThemeColors }) => (
  <g
    fill={color === "white" ? themeColors.white : themeColors.black}
    stroke={themeColors.stroke}
    strokeWidth={themeColors.strokeWidth}
  >
    {/* Cavalry Horse and Rider */}
    {/* Horse body */}
    <ellipse cx="22.5" cy="32" rx="8" ry="6" />
    
    {/* Horse legs */}
    <rect x="16" y="36" width="2" height="3" rx="1" />
    <rect x="19" y="36" width="2" height="3" rx="1" />
    <rect x="24" y="36" width="2" height="3" rx="1" />
    <rect x="27" y="36" width="2" height="3" rx="1" />
    
    {/* Horse neck and head */}
    <ellipse cx="18" cy="25" rx="3" ry="4" transform="rotate(-20 18 25)" />
    <ellipse cx="15" cy="20" rx="2" ry="3" transform="rotate(-30 15 20)" />
    
    {/* Horse mane */}
    <path d="M15 17 Q12 15 13 19 Q14 21 16 20" fill={themeColors.stroke} opacity="0.4" />
    
    {/* Rider body */}
    <ellipse cx="24" cy="22" rx="3" ry="5" />
    
    {/* Rider head */}
    <circle cx="24" cy="15" r="2.5" />
    
    {/* Rider helmet */}
    <path d="M21.5 13 h5 v2 c0,1 -1,1.5 -2.5,1.5 s-2.5,-0.5 -2.5,-1.5 z" 
          fill={themeColors.stroke} opacity="0.3" />
    
    {/* Lance/Spear */}
    <rect x="28" y="10" width="1" height="15" rx="0.5" transform="rotate(25 28.5 17.5)" />
    <path d="M29 8 L31 10 L30 12 L28 10 Z" transform="rotate(25 29.5 10)" />
    
    {/* Shield */}
    <ellipse cx="21" cy="20" rx="2" ry="3" transform="rotate(-15 21 20)" 
             fill={color === "white" ? themeColors.stroke : themeColors.white} opacity="0.4" />
  </g>
);

const ModernBishop = ({ color, themeColors }: { color: string; themeColors: PieceThemeColors }) => (
  <g
    fill={color === "white" ? themeColors.white : themeColors.black}
    stroke={themeColors.stroke}
    strokeWidth={themeColors.strokeWidth}
  >
    {/* Archer/Ranged Unit */}
    {/* Base */}
    <rect x="18" y="37" width="9" height="2" rx="1" />
    
    {/* Body */}
    <rect x="20" y="26" width="5" height="11" rx="1" />
    
    {/* Head */}
    <circle cx="22.5" cy="20" r="3" />
    
    {/* Hood/Cap */}
    <path d="M19.5 18 Q22.5 14 25.5 18 Q25.5 20 22.5 22 Q19.5 20 19.5 18" 
          fill={color === "white" ? themeColors.stroke : themeColors.white} opacity="0.3" />
    
    {/* Bow */}
    <path d="M15 15 Q12 20 15 25 Q18 23 18 20 Q18 17 15 15" 
          fill="none" strokeWidth="2" />
    
    {/* Bow string */}
    <path d="M15 17 Q20 20 15 23" fill="none" strokeWidth="1" />
    
    {/* Arrow in bow */}
    <rect x="16" y="19.5" width="6" height="1" rx="0.5" />
    <path d="M22 19.5 L24 18.5 L24 20.5 Z" />
    
    {/* Quiver */}
    <rect x="26" y="24" width="2" height="8" rx="1" 
          fill={color === "white" ? themeColors.stroke : themeColors.white} opacity="0.4" />
    
    {/* Arrows in quiver */}
    <rect x="26.2" y="22" width="0.3" height="4" />
    <rect x="26.8" y="23" width="0.3" height="4" />
    <rect x="27.4" y="22.5" width="0.3" height="4" />
  </g>
);

const ModernRook = ({ color, themeColors }: { color: string; themeColors: PieceThemeColors }) => (
  <g
    fill={color === "white" ? themeColors.white : themeColors.black}
    stroke={themeColors.stroke}
    strokeWidth={themeColors.strokeWidth}
  >
    {/* Tank */}
    {/* Tank base/tracks */}
    <rect x="12" y="34" width="21" height="5" rx="2.5" />
    
    {/* Track wheels */}
    <circle cx="15" cy="36.5" r="1.5" fill={themeColors.stroke} opacity="0.3" />
    <circle cx="19" cy="36.5" r="1.5" fill={themeColors.stroke} opacity="0.3" />
    <circle cx="23" cy="36.5" r="1.5" fill={themeColors.stroke} opacity="0.3" />
    <circle cx="27" cy="36.5" r="1.5" fill={themeColors.stroke} opacity="0.3" />
    <circle cx="30" cy="36.5" r="1.5" fill={themeColors.stroke} opacity="0.3" />
    
    {/* Tank body */}
    <rect x="15" y="25" width="15" height="9" rx="2" />
    
    {/* Tank turret */}
    <ellipse cx="22.5" cy="22" rx="6" ry="4" />
    
    {/* Tank cannon */}
    <rect x="28" y="21" width="8" height="2" rx="1" />
    <rect x="35" y="20.5" width="2" height="3" rx="1" />
    
    {/* Tank hatch */}
    <rect x="20" y="19" width="5" height="2" rx="1" 
          fill={themeColors.stroke} opacity="0.3" />
    
    {/* Armor plating details */}
    <rect x="16" y="27" width="2" height="6" rx="1" 
          fill={themeColors.stroke} opacity="0.2" />
    <rect x="27" y="27" width="2" height="6" rx="1" 
          fill={themeColors.stroke} opacity="0.2" />
    
    {/* Side armor */}
    <path d="M15 30 L12 32 L12 34 L15 34 Z" 
          fill={themeColors.stroke} opacity="0.2" />
    <path d="M30 30 L33 32 L33 34 L30 34 Z" 
          fill={themeColors.stroke} opacity="0.2" />
  </g>
);

const ModernQueen = ({ color, themeColors }: { color: string; themeColors: PieceThemeColors }) => (
  <g
    fill={color === "white" ? themeColors.white : themeColors.black}
    stroke={themeColors.stroke}
    strokeWidth={themeColors.strokeWidth}
  >
    {/* Commander/General */}
    {/* Base */}
    <rect x="17" y="37" width="11" height="2" rx="1" />
    
    {/* Cloak/Cape */}
    <path d="M18 36 Q15 30 18 25 Q20 22 22.5 22 Q25 22 27 25 Q30 30 27 36 Z" 
          fill={color === "white" ? themeColors.stroke : themeColors.white} opacity="0.3" />
    
    {/* Body */}
    <rect x="20" y="24" width="5" height="13" rx="1" />
    
    {/* Armor chest plate */}
    <rect x="20.5" y="25" width="4" height="6" rx="0.5" 
          fill={themeColors.stroke} opacity="0.3" />
    
    {/* Head */}
    <circle cx="22.5" cy="18" r="3.5" />
    
    {/* Commander Helmet with plume */}
    <path d="M19 16 h7 v2 c0,1.5 -1.5,2 -3.5,2 s-3.5,-0.5 -3.5,-2 z" 
          fill={themeColors.stroke} opacity="0.4" />
    
    {/* Plume */}
    <path d="M22.5 14 Q20 8 23 10 Q25 12 24 14 Q26 8 23 12" 
          fill={themeColors.stroke} opacity="0.6" />
    
    {/* Command Staff/Scepter */}
    <rect x="29" y="15" width="1.5" height="20" rx="0.5" />
    <circle cx="29.75" cy="13" r="2" fill={themeColors.stroke} opacity="0.4" />
    <path d="M27.75 11 L29.75 9 L31.75 11 L29.75 13 Z" 
          fill={themeColors.stroke} opacity="0.6" />
    
    {/* Sword */}
    <rect x="16" y="20" width="1" height="12" rx="0.5" />
    <rect x="15.5" y="19" width="2" height="2" rx="1" />
    
    {/* Command insignia */}
    <circle cx="22.5" cy="28" r="1" fill={themeColors.stroke} opacity="0.4" />
    <path d="M21.5 27 L22.5 26 L23.5 27 L23.5 29 L21.5 29 Z" 
          fill={themeColors.stroke} opacity="0.6" />
  </g>
);

const ModernKing = ({ color, themeColors }: { color: string; themeColors: PieceThemeColors }) => (
  <g
    fill={color === "white" ? themeColors.white : themeColors.black}
    stroke={themeColors.stroke}
    strokeWidth={themeColors.strokeWidth}
  >
    {/* Supreme Commander */}
    {/* Base platform */}
    <rect x="16" y="37" width="13" height="2" rx="1" />
    
    {/* Royal cloak */}
    <path d="M17 36 Q14 28 17 22 Q19 18 22.5 18 Q26 18 28 22 Q31 28 28 36 Z" 
          fill={color === "white" ? themeColors.stroke : themeColors.white} opacity="0.2" />
    
    {/* Body with royal armor */}
    <rect x="19.5" y="22" width="6" height="15" rx="1" />
    
    {/* Royal chest armor */}
    <rect x="20" y="23" width="5" height="8" rx="0.5" 
          fill={themeColors.stroke} opacity="0.3" />
    
    {/* Head */}
    <circle cx="22.5" cy="16" r="4" />
    
    {/* Crown */}
    <rect x="18.5" y="12" width="8" height="2" rx="1" 
          fill={themeColors.stroke} opacity="0.6" />
    <path d="M19 12 L20 8 L21 12 M21.5 12 L22.5 7 L23.5 12 M24 12 L25 8 L26 12" 
          stroke={themeColors.stroke} strokeWidth="1" fill="none" />
    
    {/* Royal scepter */}
    <rect x="31" y="12" width="2" height="22" rx="1" />
    <circle cx="32" cy="10" r="2.5" fill={themeColors.stroke} opacity="0.4" />
    <path d="M29.5 8 L32 5 L34.5 8 L34.5 12 L29.5 12 Z" 
          fill={themeColors.stroke} opacity="0.6" />
    
    {/* Royal sword */}
    <rect x="14" y="18" width="1.5" height="15" rx="0.5" />
    <rect x="13.5" y="17" width="2.5" height="2" rx="1" />
    <circle cx="14.75" cy="16" r="1" fill={themeColors.stroke} opacity="0.4" />
    
    {/* Cross on chest (royal insignia) */}
    <rect x="22" y="25" width="1" height="4" rx="0.5" fill={themeColors.stroke} opacity="0.6" />
    <rect x="20.5" y="26.5" width="4" height="1" rx="0.5" fill={themeColors.stroke} opacity="0.6" />
    
    {/* Royal shoulder pads */}
    <ellipse cx="18" cy="24" rx="2" ry="1.5" fill={themeColors.stroke} opacity="0.3" />
    <ellipse cx="27" cy="24" rx="2" ry="1.5" fill={themeColors.stroke} opacity="0.3" />
    
    {/* Command banner */}
    <rect x="12" y="15" width="1" height="10" rx="0.5" />
    <path d="M13 15 L18 17 L18 20 L13 18 Z" 
          fill={themeColors.stroke} opacity="0.4" />
  </g>
);

// Bold Chess Pieces (Strong, Heavy Design)
const BoldPawn = ({ color, themeColors }: { color: string; themeColors: PieceThemeColors }) => (
  <g
    fill={color === "white" ? themeColors.white : themeColors.black}
    stroke={themeColors.stroke}
    strokeWidth={themeColors.strokeWidth}
  >
    <circle cx="22.5" cy="10" r="4" strokeWidth="3" />
    <path d="M15 39h15l-2-10c-1-5-2-8-3.5-9.5-1-1-1.5-2-1.5-3s0.5-2 1.5-3c1.5-1.5 2.5-4.5 3.5-9.5z" strokeWidth="3" />
  </g>
);

const BoldKnight = ({ color, themeColors }: { color: string; themeColors: PieceThemeColors }) => (
  <g
    fill={color === "white" ? themeColors.white : themeColors.black}
    stroke={themeColors.stroke}
    strokeWidth="3"
  >
    <path d="M13 39h19v-3l-3-5V18l9-9V6h-5l-7 7-4-4V5h-4v4l-3 3-4-4h-5v3l3 3v18l-4 8z" />
    <path d="M17 16l4-4h7l4 4v14l-7.5 4z" />
    <circle cx="20" cy="14" r="2" />
  </g>
);

const BoldBishop = ({ color, themeColors }: { color: string; themeColors: PieceThemeColors }) => (
  <g
    fill={color === "white" ? themeColors.white : themeColors.black}
    stroke={themeColors.stroke}
    strokeWidth="3"
  >
    <path d="M15 39h15v-4l-3-3V17l6-11h-4l-5 9-5-9h-4l6 11v15l-3 3z" />
    <path d="M18 11l4.5-3 4.5 3-1.5 4-3-1.5-3 1.5z" />
    <circle cx="22.5" cy="6" r="3" />
  </g>
);

const BoldRook = ({ color, themeColors }: { color: string; themeColors: PieceThemeColors }) => (
  <g
    fill={color === "white" ? themeColors.white : themeColors.black}
    stroke={themeColors.stroke}
    strokeWidth="3"
  >
    <path d="M10 39h25v-4l-2-2V16l2-2v-3h-4v-2h-5v2h-4v-2h-5v2h-4v-2h-4v3l2 2v17l-2 2z" />
    <path d="M14 17h17v16H14z" />
  </g>
);

const BoldQueen = ({ color, themeColors }: { color: string; themeColors: PieceThemeColors }) => (
  <g
    fill={color === "white" ? themeColors.white : themeColors.black}
    stroke={themeColors.stroke}
    strokeWidth="3"
  >
    <path d="M10 39h25v-4l-4-4V19l6-9-3-3h-3l-4 7-4-9h-3l-4 9-4-7h-3l-3 3 6 9v12l-4 4z" />
    <circle cx="8" cy="11" r="2.5" />
    <circle cx="15" cy="7" r="2.5" />
    <circle cx="22.5" cy="6" r="2.5" />
    <circle cx="30" cy="7" r="2.5" />
    <circle cx="37" cy="11" r="2.5" />
  </g>
);

const BoldKing = ({ color, themeColors }: { color: string; themeColors: PieceThemeColors }) => (
  <g
    fill={color === "white" ? themeColors.white : themeColors.black}
    stroke={themeColors.stroke}
    strokeWidth="3"
  >
    <path d="M19 9h7v3h-7z" />
    <path d="M22.5 6v7" strokeWidth="4" />
    <path d="M12 39h21v-5l-3-3V17l4-7v-3h-3l-3 5-3-5h-5l-3 5-3-5h-3v3l4 7v14l-3 3z" />
    <path d="M16 19h13v12H16z" />
  </g>
);

// Elegant Chess Pieces (Refined, Minimalist Design)
const ElegantPawn = ({ color, themeColors }: { color: string; themeColors: PieceThemeColors }) => (
  <g
    fill={color === "white" ? themeColors.white : themeColors.black}
    stroke={themeColors.stroke}
    strokeWidth={themeColors.strokeWidth}
  >
    <ellipse cx="22.5" cy="9" rx="3" ry="3.5" />
    <path d="M18 39h9l-0.5-7c-0.3-2.5-0.8-5-1.5-6.5-0.5-1-0.5-1.5-0.5-2.5v-2.5c0-1 0.5-2 1.5-2.5s1.5-1 1.5-2c0-0.5-0.2-1-0.5-1.5 0.3-0.5 0.5-1 0.5-1.5 0-1-0.8-2-2-2s-2 1-2 2c0 0.5 0.2 1 0.5 1.5-0.3 0.5-0.5 1-0.5 1.5 0 1 0.5 1.5 1.5 2s1.5 1.5 1.5 2.5v2.5c0 1 0 1.5-0.5 2.5-0.7 1.5-1.2 4-1.5 6.5z" />
  </g>
);

const ElegantKnight = ({ color, themeColors }: { color: string; themeColors: PieceThemeColors }) => (
  <g
    fill={color === "white" ? themeColors.white : themeColors.black}
    stroke={themeColors.stroke}
    strokeWidth={themeColors.strokeWidth}
  >
    <path d="M15 39h15v-1.5l-1.5-3V22l7-7V8h-3l-5 5-2.5-2.5V8h-2v2.5l-1.5 1.5-2.5-2.5h-3v2l2 2v12l-2.5 5z" />
    <path d="M17 19l2.5-2.5h5l2.5 2.5v11l-5 2.5z" />
    <circle cx="18.5" cy="16.5" r="1" />
  </g>
);

const ElegantBishop = ({ color, themeColors }: { color: string; themeColors: PieceThemeColors }) => (
  <g
    fill={color === "white" ? themeColors.white : themeColors.black}
    stroke={themeColors.stroke}
    strokeWidth={themeColors.strokeWidth}
  >
    <path d="M17 39h11v-2l-1.5-1.5V19l4-8h-2.5l-3.5 7-3.5-7h-2.5l4 8v16.5l-1.5 1.5z" />
    <path d="M20 11l2.5-1.5 2.5 1.5-0.75 2.25-1.75-0.75-1.75 0.75z" />
    <ellipse cx="22.5" cy="7" rx="1.5" ry="2" />
  </g>
);

const ElegantRook = ({ color, themeColors }: { color: string; themeColors: PieceThemeColors }) => (
  <g
    fill={color === "white" ? themeColors.white : themeColors.black}
    stroke={themeColors.stroke}
    strokeWidth={themeColors.strokeWidth}
  >
    <path d="M13 39h19v-2l-0.5-0.5V17l0.5-0.5v-1.5h-2.5v-1.5h-3v1.5h-3v-1.5h-3v1.5h-3v-1.5h-2.5v1.5l0.5 0.5v19.5l-0.5 0.5z" />
    <path d="M16 18h13v14H16z" />
  </g>
);

const ElegantQueen = ({ color, themeColors }: { color: string; themeColors: PieceThemeColors }) => (
  <g
    fill={color === "white" ? themeColors.white : themeColors.black}
    stroke={themeColors.stroke}
    strokeWidth={themeColors.strokeWidth}
  >
    <path d="M13 39h19v-2l-2.5-2.5V21l4-6.5-1.5-1.5h-1.5l-2.5 5-2.5-6.5h-1.5l-2.5 6.5-2.5-5h-1.5l-1.5 1.5 4 6.5v13.5l-2.5 2.5z" />
    <ellipse cx="11" cy="11.5" rx="1" ry="1.5" />
    <ellipse cx="16.5" cy="8" rx="1" ry="1.5" />
    <ellipse cx="22.5" cy="7" rx="1" ry="1.5" />
    <ellipse cx="28.5" cy="8" rx="1" ry="1.5" />
    <ellipse cx="34" cy="11.5" rx="1" ry="1.5" />
  </g>
);

const ElegantKing = ({ color, themeColors }: { color: string; themeColors: PieceThemeColors }) => (
  <g
    fill={color === "white" ? themeColors.white : themeColors.black}
    stroke={themeColors.stroke}
    strokeWidth={themeColors.strokeWidth}
  >
    <path d="M21 9h3v1.5h-3z" />
    <path d="M22.5 7v4" strokeWidth="1.5" />
    <path d="M15 39h15v-3l-1.5-1.5V19l2.5-5v-1.5h-1.5l-1.5 3.5-1.5-3.5h-3l-1.5 3.5-1.5-3.5h-1.5v1.5l2.5 5v15.5l-1.5 1.5z" />
    <path d="M18 21h9v9h-9z" />
  </g>
);

// Minimalist Chess Pieces (Very Simple, Clean Design)
const MinimalistPawn = ({ color, themeColors }: { color: string; themeColors: PieceThemeColors }) => (
  <g
    fill={color === "white" ? themeColors.white : themeColors.black}
    stroke={themeColors.stroke}
    strokeWidth={themeColors.strokeWidth}
  >
    <circle cx="22.5" cy="10" r="2.5" />
    <rect x="19" y="16" width="7" height="23" rx="1" />
  </g>
);

const MinimalistKnight = ({ color, themeColors }: { color: string; themeColors: PieceThemeColors }) => (
  <g
    fill={color === "white" ? themeColors.white : themeColors.black}
    stroke={themeColors.stroke}
    strokeWidth={themeColors.strokeWidth}
  >
    <rect x="16" y="36" width="13" height="3" rx="1" />
    <path d="M18 36V20l6-6V10h-2l-4 4V10h-2v4l-2 2V36z" />
    <path d="M20 20h5v12h-5z" />
    <circle cx="19" cy="17" r="1" />
  </g>
);

const MinimalistBishop = ({ color, themeColors }: { color: string; themeColors: PieceThemeColors }) => (
  <g
    fill={color === "white" ? themeColors.white : themeColors.black}
    stroke={themeColors.stroke}
    strokeWidth={themeColors.strokeWidth}
  >
    <rect x="18" y="36" width="9" height="3" rx="1" />
    <path d="M20 36V20l5-8h-1l-3 6-3-6h-1l5 8v16z" />
    <circle cx="22.5" cy="8" r="1.5" />
  </g>
);

const MinimalistRook = ({ color, themeColors }: { color: string; themeColors: PieceThemeColors }) => (
  <g
    fill={color === "white" ? themeColors.white : themeColors.black}
    stroke={themeColors.stroke}
    strokeWidth={themeColors.strokeWidth}
  >
    <rect x="14" y="36" width="17" height="3" rx="1" />
    <rect x="16" y="18" width="13" height="18" rx="1" />
    <path d="M14 18V12h3v-2h2v2h2v-2h2v2h2v-2h3v6z" />
  </g>
);

const MinimalistQueen = ({ color, themeColors }: { color: string; themeColors: PieceThemeColors }) => (
  <g
    fill={color === "white" ? themeColors.white : themeColors.black}
    stroke={themeColors.stroke}
    strokeWidth={themeColors.strokeWidth}
  >
    <rect x="14" y="36" width="17" height="3" rx="1" />
    <path d="M16 36V22l3-6h-1l-2 4-2-6h-1l-2 6-2-4h-1l3 6v14z" />
    <circle cx="12" cy="12" r="1" />
    <circle cx="17" cy="9" r="1" />
    <circle cx="22.5" cy="8" r="1" />
    <circle cx="28" cy="9" r="1" />
    <circle cx="33" cy="12" r="1" />
  </g>
);

const MinimalistKing = ({ color, themeColors }: { color: string; themeColors: PieceThemeColors }) => (
  <g
    fill={color === "white" ? themeColors.white : themeColors.black}
    stroke={themeColors.stroke}
    strokeWidth={themeColors.strokeWidth}
  >
    <path d="M21 10h3v1h-3z" />
    <path d="M22.5 8v4" strokeWidth="1" />
    <rect x="15" y="36" width="15" height="3" rx="1" />
    <path d="M17 36V20l2-4h-1l-1 2-1-2h-2l-1 2-1-2h-1l2 4v16z" />
    <rect x="19" y="22" width="7" height="8" rx="1" />
  </g>
);

const PIECE_COMPONENTS = {
  classic: {
    p: ClassicPawn,
    n: ClassicKnight,
    b: ClassicBishop,
    r: ClassicRook,
    q: ClassicQueen,
    k: ClassicKing,
  },
  modern: {
    p: ModernPawn,
    n: ModernKnight,
    b: ModernBishop,
    r: ModernRook,
    q: ModernQueen,
    k: ModernKing,
  },
  bold: {
    p: BoldPawn,
    n: BoldKnight,
    b: BoldBishop,
    r: BoldRook,
    q: BoldQueen,
    k: BoldKing,
  },
  elegant: {
    p: ElegantPawn,
    n: ElegantKnight,
    b: ElegantBishop,
    r: ElegantRook,
    q: ElegantQueen,
    k: ElegantKing,
  },
  minimalist: {
    p: MinimalistPawn,
    n: MinimalistKnight,
    b: MinimalistBishop,
    r: MinimalistRook,
    q: MinimalistQueen,
    k: MinimalistKing,
  },
};

interface PieceSVGProps {
  piece: string;
  theme?: string;
}

const PieceSVG = ({ piece, theme = "classic" }: PieceSVGProps) => {
  if (!piece || typeof piece !== 'string') {
    return null;
  }
  
  const color = piece === piece.toUpperCase() ? "white" : "black";
  const type = piece.toLowerCase() as keyof typeof PIECE_COMPONENTS.classic;
  const themeColors = PIECE_THEME_COLORS[theme] || PIECE_THEME_COLORS.classic;
  
  // Get the correct piece set
  const pieceSet = PIECE_COMPONENTS[theme as keyof typeof PIECE_COMPONENTS] || PIECE_COMPONENTS.classic;
  const PieceComponent = pieceSet[type];

  if (!PieceComponent) {
    return null;
  }

  // Add filters for different themes
  const filter = (() => {
    switch (theme) {
      case "bold":
        return "contrast(1.3) saturate(1.2) drop-shadow(1px 1px 2px rgba(0,0,0,0.3))";
      case "elegant":
        return "opacity(0.95) brightness(1.05) drop-shadow(0.5px 0.5px 1px rgba(0,0,0,0.2))";
      case "minimalist":
        return "opacity(0.85) contrast(0.9)";
      case "modern":
        return "brightness(1.02) drop-shadow(0.8px 0.8px 1.5px rgba(0,0,0,0.25))";
      default:
        return "drop-shadow(1px 1px 1px rgba(0,0,0,0.15))";
    }
  })();

  return (
    <svg viewBox="0 0 45 45" className="w-full h-full" style={{ filter }}>
      <PieceComponent color={color} themeColors={themeColors} />
    </svg>
  );
};

export default PieceSVG;
