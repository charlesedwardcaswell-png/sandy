import React from 'react';
import { FACTION_ICONS, WOUND_RANKS, WOUND_COLORS, WEAPONS_LIST, GEAR_FULL_ENTRY, GEAR_DESCRIPTIONS } from '../data/constants';
import { getArchetype } from '../lib/utils';

// ── Faction Icon ──────────────────────────────────────────────────────────────
export function FacIcon({ name, size = 16 }) {
  const cls = FACTION_ICONS[name] || 'ti-user';
  return <i className={`ti ${cls}`} style={{ fontSize: size, color: 'var(--gold-dim)' }} />;
}

// ── Wound Badge ───────────────────────────────────────────────────────────────
export function WoundBadge({ rank }) {
  const color = WOUND_COLORS[rank] || WOUND_COLORS[0];
  const label = WOUND_RANKS[rank] || 'Healthy';
  return (
    <span className="wound-badge" style={{ background: color + '28', color, border: `1px solid ${color}55` }}>
      {label}
    </span>
  );
}

// ── Skill Dots ────────────────────────────────────────────────────────────────
export function SkillDots({ rank, max = 10 }) {
  return (
    <span>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={`sdot ${i < rank ? 'f' : ''}`} />
      ))}
    </span>
  );
}

// ── Silhouette SVGs ───────────────────────────────────────────────────────────
// color prop tints the fill. Defaults to CSS class tint if not provided.
export const AVATAR_TYPES = [
  { id: 'warrior',   label: 'Warrior'   },
  { id: 'guard',     label: 'Guard'     },
  { id: 'assassin',  label: 'Assassin'  },
  { id: 'courtier',  label: 'Courtier'  },
  { id: 'sahir',     label: 'Sahir'     },
  { id: 'merchant',  label: 'Merchant'  },
  { id: 'rashari',   label: "Ra'Shari"  },
  { id: 'ashalan',   label: 'Ashalan'   },
  { id: 'senpet',    label: 'Senpet'    },
  { id: 'yodotai',   label: 'Yodotai'   },
  { id: 'ebonite',   label: 'Ebonite'   },
  { id: 'jackal',    label: 'Jackal'    },
  { id: 'nomad',     label: 'Nomad'     },
  { id: 'jinn',      label: 'Jinn'      },
  { id: 'monster',   label: 'Monster'   },
  { id: 'ghoul',     label: 'Ghoul'     },
];

export const AVATAR_COLORS = [
  { id: '#c8962a', label: 'Gold'     },
  { id: '#c84030', label: 'Crimson'  },
  { id: '#4a7ac8', label: 'Cobalt'   },
  { id: '#4a8a40', label: 'Jade'     },
  { id: '#8050c8', label: 'Violet'   },
  { id: '#c87030', label: 'Amber'    },
  { id: '#a0a0b0', label: 'Silver'   },
  { id: '#2a9a8a', label: 'Teal'     },
  { id: '#c85080', label: 'Rose'     },
  { id: '#7a5030', label: 'Bronze'   },
  { id: '#404858', label: 'Shadow'   },
  { id: '#3060a8', label: 'Sapphire' },
];

export function Silhouette({ type, size = 32, color }) {
  const h = Math.round(size * 1.4);
  const c = color || '#c8962a';
  const dim = color ? color + '99' : '#c8962a99';
  const dark = color ? color + '66' : '#c8962a66';

  const props = { fill: c, stroke: dim, strokeWidth: 0.5 };
  const dimProps = { fill: dim, stroke: dark, strokeWidth: 0.5 };

  if (type === 'sahir') return (
    <svg width={size} height={h} viewBox="0 0 32 44">
      <ellipse cx="16" cy="6" rx="5" ry="5" {...props} />
      <path d="M8 12 Q16 10 24 12 L26 38 Q16 40 6 38 Z" {...props} />
      {/* Staff */}
      <line x1="26" y1="14" x2="26" y2="42" stroke={c} strokeWidth="2" />
      {/* Orb */}
      <circle cx="26" cy="12" r="3" fill={dim} stroke={c} strokeWidth="1" />
      {/* Stars */}
      <path d="M14 4 L16 1 L18 4" fill={dim} stroke={c} strokeWidth="1" />
    </svg>
  );

  if (type === 'courtier') return (
    <svg width={size} height={h} viewBox="0 0 32 44">
      <ellipse cx="16" cy="6" rx="5" ry="5" {...props} />
      <path d="M8 13 Q16 11 24 13 L22 26 Q16 28 10 26 Z" {...props} />
      <path d="M10 26 L6 42 L14 38 L16 42 L18 38 L26 42 L22 26 Z" {...props} />
      {/* Arms */}
      <rect x="5" y="13" width="4" height="8" rx="2" {...props} />
      <rect x="23" y="13" width="4" height="8" rx="2" {...props} />
      {/* Collar detail */}
      <path d="M13 13 L16 18 L19 13" fill="none" stroke={dim} strokeWidth="1" />
    </svg>
  );

  if (type === 'monster') return (
    <svg width={size} height={h} viewBox="0 0 32 44">
      <ellipse cx="16" cy="7" rx="7" ry="6" {...props} />
      <path d="M6 13 Q16 10 26 13 L28 30 Q16 35 4 30 Z" {...props} />
      <path d="M4 30 L2 42 L10 36 L16 42 L22 36 L30 42 L28 30 Q16 35 4 30Z" {...props} />
      {/* Claws */}
      <path d="M6 18 L2 14 M26 18 L30 14" stroke={c} strokeWidth="2" />
      {/* Eyes */}
      <ellipse cx="13" cy="7" rx="1.5" ry="2" fill="#ff6050" />
      <ellipse cx="19" cy="7" rx="1.5" ry="2" fill="#ff6050" />
    </svg>
  );

  if (type === 'ghoul') return (
    <svg width={size} height={h} viewBox="0 0 32 44">
      {/* Gaunt skull-like head, tilted from a hunched neck */}
      <path d="M11 4 Q16 0 21 4 Q22 9 19 12 Q16 14 13 12 Q10 9 11 4 Z" {...props} />
      {/* Sunken cheeks */}
      <ellipse cx="12.5" cy="8" rx="1.2" ry="1.6" fill={dark} />
      <ellipse cx="19.5" cy="8" rx="1.2" ry="1.6" fill={dark} />
      {/* Hollow glowing eyes */}
      <ellipse cx="13" cy="6.5" rx="1.3" ry="1.8" fill="#9aff90" />
      <ellipse cx="19" cy="6.5" rx="1.3" ry="1.8" fill="#9aff90" />
      {/* Hunched, emaciated torso — asymmetric to read as crouched/feral */}
      <path d="M9 13 Q16 11 23 14 L21 27 Q16 31 11 27 Z" {...props} />
      {/* Ribs suggestion */}
      <path d="M13 16 L19 16 M13 19 L19 19 M13 22 L19 22" stroke={dark} strokeWidth="0.8" fill="none" />
      {/* Long emaciated arms ending in claws, one raised */}
      <path d="M9 14 Q2 18 1 28" {...dimProps} strokeWidth="3" fill="none" stroke={c} />
      <path d="M23 14 Q30 12 31 6" {...dimProps} strokeWidth="3" fill="none" stroke={c} />
      <path d="M1 28 L-1 31 M1 28 L2 32 M1 28 L4 30" stroke={c} strokeWidth="1.4" />
      <path d="M31 6 L33 3 M31 6 L34 7 M31 6 L32 9" stroke={c} strokeWidth="1.4" />
      {/* Crouched legs */}
      <path d="M11 27 Q9 34 7 41" {...props} strokeWidth="4" fill="none" stroke={c} />
      <path d="M21 27 Q22 34 23 41" {...props} strokeWidth="4" fill="none" stroke={c} />
    </svg>
  );

  if (type === 'guard') return (
    <svg width={size} height={h} viewBox="0 0 32 44">
      <ellipse cx="16" cy="5" rx="5" ry="4" {...props} />
      {/* Helmet */}
      <path d="M11 5 Q16 1 21 5" fill="none" stroke={c} strokeWidth="2" />
      {/* Armor body */}
      <rect x="9" y="10" width="14" height="16" rx="1" {...props} />
      {/* Pauldrons */}
      <rect x="3" y="10" width="7" height="7" rx="2" {...dimProps} />
      <rect x="22" y="10" width="7" height="7" rx="2" {...dimProps} />
      {/* Legs */}
      <rect x="9" y="26" width="6" height="14" rx="1" {...props} />
      <rect x="17" y="26" width="6" height="14" rx="1" {...props} />
      {/* Spear */}
      <line x1="28" y1="2" x2="28" y2="42" stroke={c} strokeWidth="2" />
      <path d="M25 2 L28 -2 L31 2 Z" fill={c} />
    </svg>
  );

  if (type === 'assassin') return (
    <svg width={size} height={h} viewBox="0 0 32 44">
      {/* Hood */}
      <path d="M9 10 Q16 2 23 10 Q20 8 16 8 Q12 8 9 10 Z" {...props} />
      <ellipse cx="16" cy="9" rx="5" ry="4" {...props} />
      {/* Cloak */}
      <path d="M7 11 Q16 9 25 11 L28 38 Q16 42 4 38 Z" {...dimProps} />
      {/* Inner body */}
      <path d="M10 13 Q16 11 22 13 L22 30 Q16 32 10 30 Z" {...props} />
      {/* Knife */}
      <line x1="24" y1="18" x2="30" y2="30" stroke={c} strokeWidth="1.5" />
      <path d="M29 28 L32 32 L26 30 Z" fill={c} />
      {/* Shadow face */}
      <ellipse cx="16" cy="9" rx="3" ry="2.5" fill={dark} />
    </svg>
  );

  if (type === 'merchant') return (
    <svg width={size} height={h} viewBox="0 0 32 44">
      <ellipse cx="16" cy="6" rx="5" ry="5" {...props} />
      {/* Robe */}
      <path d="M9 12 Q16 10 23 12 L25 40 Q16 42 7 40 Z" {...props} />
      {/* Belt */}
      <rect x="9" y="22" width="14" height="2" rx="1" fill={dim} />
      {/* Coin purse */}
      <circle cx="22" cy="26" r="3" {...dimProps} />
      <line x1="22" y1="23" x2="22" y2="22" stroke={c} strokeWidth="1" />
      {/* Arms */}
      <rect x="4" y="12" width="6" height="10" rx="3" {...props} />
      <rect x="22" y="12" width="6" height="10" rx="3" {...props} />
    </svg>
  );

  if (type === 'rashari') return (
    <svg width={size} height={h} viewBox="0 0 32 44">
      <ellipse cx="16" cy="6" rx="5" ry="5" {...props} />
      {/* Headscarf */}
      <path d="M10 4 Q16 0 22 4 L24 10 Q16 8 8 10 Z" {...dimProps} />
      {/* Flowing robes */}
      <path d="M8 12 Q16 10 24 12 L26 36 Q20 42 12 40 L6 36 Z" {...props} />
      {/* Sash */}
      <path d="M8 20 Q16 22 24 20" fill="none" stroke={dim} strokeWidth="2" />
      {/* Arms with bangles */}
      <rect x="3" y="12" width="5" height="12" rx="2.5" {...props} />
      <rect x="24" y="12" width="5" height="12" rx="2.5" {...props} />
      <rect x="3" y="20" width="5" height="2" rx="1" fill={dim} />
      <rect x="24" y="20" width="5" height="2" rx="1" fill={dim} />
    </svg>
  );

  if (type === 'ashalan') return (
    <svg width={size} height={h} viewBox="0 0 32 44">
      {/* Tall slender head */}
      <ellipse cx="16" cy="5" rx="4" ry="5" {...props} />
      {/* Slender body */}
      <path d="M10 11 Q16 9 22 11 L21 36 Q16 38 11 36 Z" {...props} />
      {/* Tattoo glows — lines */}
      <line x1="13" y1="14" x2="11" y2="22" stroke="#e0d0ff" strokeWidth="1.5" opacity="0.9" />
      <line x1="16" y1="12" x2="16" y2="24" stroke="#e0d0ff" strokeWidth="1.5" opacity="0.9" />
      <line x1="19" y1="14" x2="21" y2="22" stroke="#e0d0ff" strokeWidth="1.5" opacity="0.9" />
      {/* Arms — long */}
      <rect x="3" y="11" width="8" height="16" rx="4" {...props} />
      <rect x="21" y="11" width="8" height="16" rx="4" {...props} />
      {/* Tattoo on arms */}
      <line x1="7" y1="14" x2="7" y2="24" stroke="#e0d0ff" strokeWidth="1" opacity="0.8" />
      <line x1="25" y1="14" x2="25" y2="24" stroke="#e0d0ff" strokeWidth="1" opacity="0.8" />
      {/* Legs */}
      <rect x="11" y="36" width="4" height="8" rx="2" {...props} />
      <rect x="17" y="36" width="4" height="8" rx="2" {...props} />
    </svg>
  );

  if (type === 'senpet') return (
    <svg width={size} height={h} viewBox="0 0 32 44">
      <ellipse cx="16" cy="6" rx="5" ry="5" {...props} />
      {/* Nemes headdress */}
      <path d="M10 4 L6 14 L10 12" fill={dim} stroke={c} strokeWidth="0.5" />
      <path d="M22 4 L26 14 L22 12" fill={dim} stroke={c} strokeWidth="0.5" />
      <path d="M10 4 Q16 2 22 4" fill={dim} stroke={c} strokeWidth="1" />
      {/* Kilt body */}
      <rect x="10" y="12" width="12" height="14" rx="1" {...props} />
      {/* Chest collar */}
      <path d="M10 12 Q16 16 22 12" fill="none" stroke={dim} strokeWidth="2" />
      {/* Kilt skirt */}
      <path d="M10 26 L8 40 L16 36 L24 40 L22 26 Z" {...dimProps} />
      {/* Arms */}
      <rect x="3" y="12" width="7" height="10" rx="2" {...props} />
      <rect x="22" y="12" width="7" height="10" rx="2" {...props} />
      {/* Khopesh */}
      <path d="M27 12 L30 8 Q34 6 32 10 L28 14 Z" fill={c} />
    </svg>
  );

  if (type === 'yodotai') return (
    <svg width={size} height={h} viewBox="0 0 32 44">
      <ellipse cx="16" cy="6" rx="5" ry="5" {...props} />
      {/* Lorica segmentata */}
      <rect x="9" y="11" width="14" height="18" rx="1" {...props} />
      {/* Armor bands */}
      <line x1="9" y1="15" x2="23" y2="15" stroke={dim} strokeWidth="1.5" />
      <line x1="9" y1="19" x2="23" y2="19" stroke={dim} strokeWidth="1.5" />
      <line x1="9" y1="23" x2="23" y2="23" stroke={dim} strokeWidth="1.5" />
      {/* Pauldrons */}
      <rect x="3" y="11" width="7" height="6" rx="1" {...dimProps} />
      <rect x="22" y="11" width="7" height="6" rx="1" {...dimProps} />
      {/* Kilt strips */}
      {[0,1,2,3,4].map(i => <rect key={i} x={9+i*2.6} y="29" width="2" height="10" rx="1" {...dimProps} />)}
      {/* Gladius */}
      <rect x="26" y="14" width="2" height="16" rx="1" fill={c} />
      <rect x="24" y="13" width="6" height="2" rx="1" fill={dim} />
    </svg>
  );

  if (type === 'ebonite') return (
    <svg width={size} height={h} viewBox="0 0 32 44">
      {/* Full helm — no face */}
      <ellipse cx="16" cy="6" rx="6" ry="6" {...props} />
      <rect x="10" y="6" width="12" height="6" rx="1" {...props} />
      {/* Visor slit */}
      <rect x="11" y="8" width="10" height="2" rx="1" fill={dark} />
      {/* Heavy plate body */}
      <rect x="8" y="12" width="16" height="18" rx="2" {...props} />
      {/* Chest cross */}
      <line x1="16" y1="13" x2="16" y2="29" stroke={dim} strokeWidth="2" />
      <line x1="9" y1="20" x2="23" y2="20" stroke={dim} strokeWidth="2" />
      {/* Pauldrons */}
      <rect x="2" y="12" width="7" height="9" rx="2" {...props} />
      <rect x="23" y="12" width="7" height="9" rx="2" {...props} />
      {/* Gauntlets */}
      <rect x="2" y="21" width="7" height="8" rx="1" {...dimProps} />
      <rect x="23" y="21" width="7" height="8" rx="1" {...dimProps} />
      {/* Greaves */}
      <rect x="9" y="30" width="6" height="12" rx="1" {...props} />
      <rect x="17" y="30" width="6" height="12" rx="1" {...props} />
    </svg>
  );

  if (type === 'jackal') return (
    <svg width={size} height={h} viewBox="0 0 32 44">
      {/* Hunched head */}
      <ellipse cx="16" cy="8" rx="5" ry="5" {...props} />
      {/* Hunched body — leaning forward */}
      <path d="M9 14 Q16 11 22 14 L20 32 Q16 34 10 32 Z" {...props} transform="rotate(8, 16, 22)" />
      {/* Hood/cloak */}
      <path d="M8 12 Q16 8 24 12 L26 20 Q16 18 6 20 Z" {...dimProps} />
      {/* Knife in hand */}
      <line x1="23" y1="22" x2="30" y2="34" stroke={c} strokeWidth="2" />
      <path d="M29 32 L32 36 L27 34 Z" fill={c} />
      {/* Sinister glow eyes */}
      <ellipse cx="14" cy="8" rx="1.2" ry="1.2" fill="#ff8040" />
      <ellipse cx="18" cy="8" rx="1.2" ry="1.2" fill="#ff8040" />
      {/* Legs crouched */}
      <rect x="9" y="30" width="5" height="10" rx="2" {...props} />
      <rect x="16" y="32" width="5" height="8" rx="2" {...props} />
    </svg>
  );

  if (type === 'nomad') return (
    <svg width={size} height={h} viewBox="0 0 32 44">
      <ellipse cx="16" cy="6" rx="5" ry="5" {...props} />
      {/* Tagelmust headwrap */}
      <path d="M10 3 Q16 0 22 3 L24 8 Q20 6 16 7 Q12 6 8 8 Z" {...dimProps} />
      <path d="M8 8 L6 14" stroke={dim} strokeWidth="3" />
      {/* Desert robes — wide */}
      <path d="M7 12 Q16 10 25 12 L28 40 Q16 44 4 40 Z" {...props} />
      {/* Belt */}
      <path d="M8 24 Q16 26 24 24" fill="none" stroke={dim} strokeWidth="2" />
      {/* Staff */}
      <line x1="4" y1="12" x2="2" y2="42" stroke={c} strokeWidth="2.5" />
      {/* Waterskin */}
      <ellipse cx="26" cy="28" rx="3" ry="4" {...dimProps} />
    </svg>
  );

  if (type === 'jinn') return (
    <svg width={size} height={h} viewBox="0 0 32 44">
      {/* No lower body — smoke trails */}
      <ellipse cx="16" cy="7" rx="6" ry="6" {...props} />
      {/* Ethereal upper body */}
      <path d="M8 13 Q16 10 24 13 L22 28 Q16 30 10 28 Z" fill={dim} stroke={c} strokeWidth="0.5" opacity="0.8" />
      {/* Smoke wisps instead of legs */}
      <path d="M12 30 Q10 36 8 42 Q12 38 13 42 Q14 36 16 40" stroke={c} strokeWidth="2" fill="none" opacity="0.7" />
      <path d="M20 30 Q22 36 24 42 Q20 38 19 42 Q18 36 16 40" stroke={c} strokeWidth="2" fill="none" opacity="0.7" />
      {/* Glowing eyes */}
      <ellipse cx="14" cy="7" rx="1.5" ry="2" fill="#fff" opacity="0.9" />
      <ellipse cx="18" cy="7" rx="1.5" ry="2" fill="#fff" opacity="0.9" />
      {/* Energy crown */}
      <path d="M12 3 L13 0 L16 3 L19 0 L20 3" stroke={c} strokeWidth="1.5" fill="none" />
      {/* Reaching arms */}
      <path d="M8 15 Q4 18 2 24" stroke={c} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M24 15 Q28 18 30 24" stroke={c} strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );

  // warrior (default)
  return (
    <svg width={size} height={h} viewBox="0 0 32 44">
      <ellipse cx="16" cy="6" rx="5" ry="5" {...props} />
      <rect x="10" y="12" width="12" height="14" rx="2" {...props} />
      <rect x="4" y="12" width="5" height="10" rx="2" {...props} />
      <rect x="23" y="12" width="5" height="10" rx="2" {...props} />
      <rect x="10" y="26" width="5" height="12" rx="1" {...props} />
      <rect x="17" y="26" width="5" height="12" rx="1" {...props} />
      {/* Sword */}
      <rect x="2" y="10" width="3" height="18" rx="1" fill={dim} stroke={c} strokeWidth="1" />
      <rect x="1" y="16" width="5" height="2" rx="1" fill={c} />
    </svg>
  );
}

export function CharacterSilhouette({ school, size = 32, color }) {
  return <Silhouette type={getArchetype(school)} size={size} color={color} />;
}

// ── SilhouetteToken — pure SVG <g> for embedding inside SVG grids ─────────────
// cx, cy = center of token circle, r = radius
export function SilhouetteToken({ type = 'warrior', cx, cy, r, color = '#c8962a' }) {
  const c = color;
  const dim = color + '99';
  // Scale from 32×44 viewBox to fit inside circle of radius r
  // Use r*1.4 as height, r as half-width, offset to center
  const scale = (r * 1.6) / 44;
  const tx = cx - 16 * scale;
  const ty = cy - 22 * scale;
  const t = `translate(${tx},${ty}) scale(${scale})`;
  const p = { fill: c, stroke: dim, strokeWidth: 0.5 / scale };
  const dp = { fill: dim, stroke: color + '66', strokeWidth: 0.5 / scale };

  const inner = (() => {
    if (type === 'sahir') return <>
      <ellipse cx="16" cy="6" rx="5" ry="5" {...p} />
      <path d="M8 12 Q16 10 24 12 L26 38 Q16 40 6 38 Z" {...p} />
      <line x1="26" y1="14" x2="26" y2="42" stroke={c} strokeWidth={2 / scale} />
      <circle cx="26" cy="12" r="3" fill={dim} stroke={c} strokeWidth={1 / scale} />
    </>;
    if (type === 'assassin') return <>
      <ellipse cx="16" cy="6" rx="5" ry="5" {...p} />
      <path d="M9 12 Q16 10 23 12 L21 42 Q16 44 11 42 Z" {...p} />
      <path d="M16 12 L14 24 L18 24 Z" fill={dim} />
      <line x1="26" y1="10" x2="30" y2="22" stroke={c} strokeWidth={2 / scale} />
    </>;
    if (type === 'guard') return <>
      <ellipse cx="16" cy="6" rx="5" ry="5" {...p} />
      <rect x="9" y="12" width="14" height="16" rx="1" {...p} />
      <rect x="3" y="12" width="5" height="10" rx="2" {...p} />
      <rect x="24" y="12" width="5" height="10" rx="2" {...p} />
      <rect x="9" y="28" width="6" height="12" rx="1" {...p} />
      <rect x="17" y="28" width="6" height="12" rx="1" {...p} />
      <path d="M9 12 L23 12 L23 20 L16 24 L9 20 Z" {...dp} />
    </>;
    if (type === 'courtier') return <>
      <ellipse cx="16" cy="6" rx="5" ry="5" {...p} />
      <path d="M8 13 Q16 11 24 13 L22 26 Q16 28 10 26 Z" {...p} />
      <path d="M10 26 L6 42 L14 38 L16 42 L18 38 L26 42 L22 26 Z" {...p} />
    </>;
    if (type === 'merchant') return <>
      <ellipse cx="16" cy="6" rx="5" ry="5" {...p} />
      <path d="M8 13 Q16 11 24 13 L22 28 Q16 30 10 28 Z" {...p} />
      <path d="M10 28 L8 42 L24 42 L22 28 Z" {...p} />
      <circle cx="16" cy="36" r="4" {...dp} />
    </>;
    if (type === 'monster') return <>
      <ellipse cx="16" cy="7" rx="7" ry="6" {...p} />
      <path d="M6 13 Q16 10 26 13 L28 38 Q16 44 4 38 Z" {...p} />
      <path d="M6 13 L4 8 M26 13 L28 8" stroke={c} strokeWidth={2 / scale} fill="none" />
    </>;
    if (type === 'ghoul') return <>
      <path d="M11 4 Q16 0 21 4 Q22 9 19 12 Q16 14 13 12 Q10 9 11 4 Z" {...p} />
      <path d="M9 13 Q16 11 23 14 L21 27 Q16 31 11 27 Z" {...p} />
      <path d="M9 14 Q2 18 1 28" {...dp} strokeWidth={3 / scale} fill="none" stroke={c} />
      <path d="M23 14 Q30 12 31 6" {...dp} strokeWidth={3 / scale} fill="none" stroke={c} />
      <path d="M11 27 Q9 34 7 41" {...p} strokeWidth={4 / scale} fill="none" stroke={c} />
      <path d="M21 27 Q22 34 23 41" {...p} strokeWidth={4 / scale} fill="none" stroke={c} />
    </>;
    if (type === 'jinn') return <>
      <ellipse cx="16" cy="7" rx="6" ry="6" {...p} />
      <path d="M8 14 Q16 10 24 14 Q28 26 24 38 Q16 44 8 38 Q4 26 8 14 Z" {...p} />
      <path d="M10 6 L8 2 M22 6 L24 2" stroke={dim} strokeWidth={1.5 / scale} fill="none" />
    </>;
    if (type === 'yodotai') return <>
      <ellipse cx="16" cy="5" rx="5" ry="4" {...p} />
      <path d="M11 8 Q16 6 21 8 L23 14 L16 12 L9 14 Z" {...p} />
      <rect x="8" y="14" width="16" height="16" rx="1" {...p} />
      <rect x="3" y="14" width="5" height="12" rx="2" {...p} />
      <rect x="24" y="14" width="5" height="12" rx="2" {...p} />
      <rect x="8" y="30" width="7" height="12" rx="1" {...p} />
      <rect x="17" y="30" width="7" height="12" rx="1" {...p} />
    </>;
    if (type === 'senpet') return <>
      <ellipse cx="16" cy="6" rx="5" ry="5" {...p} />
      <path d="M9 12 Q16 9 23 12 L25 30 Q16 34 7 30 Z" {...p} />
      <path d="M7 30 L5 42 L27 42 L25 30 Z" {...p} />
      <path d="M13 4 L16 0 L19 4" fill={dim} stroke={c} strokeWidth={1 / scale} />
    </>;
    if (type === 'ashalan') return <>
      <ellipse cx="16" cy="6" rx="5" ry="5" {...p} />
      <path d="M8 12 Q16 10 24 12 L22 38 Q16 42 10 38 Z" {...p} />
      <path d="M14 2 L16 -2 L18 2 L22 0 L20 4 L24 6 L20 6 L18 10 L16 6 L14 10 L12 6 L8 6 L12 4 Z" fill={dim} stroke={c} strokeWidth={0.5 / scale} />
    </>;
    if (type === 'ebonite') return <>
      <ellipse cx="16" cy="6" rx="5" ry="5" {...p} />
      <rect x="9" y="12" width="14" height="16" rx="1" {...p} />
      <rect x="3" y="12" width="5" height="12" rx="2" {...p} />
      <rect x="24" y="12" width="5" height="12" rx="2" {...p} />
      <rect x="9" y="28" width="6" height="14" rx="1" {...p} />
      <rect x="17" y="28" width="6" height="14" rx="1" {...p} />
      <path d="M11 20 L16 14 L21 20 L16 26 Z" {...dp} />
    </>;
    if (type === 'jackal') return <>
      <ellipse cx="16" cy="6" rx="5" ry="5" {...p} />
      <path d="M8 13 Q16 10 24 13 L22 38 Q16 42 10 38 Z" {...p} />
      <path d="M11 6 L8 2 M21 6 L24 2" stroke={c} strokeWidth={1.5 / scale} fill="none" />
    </>;
    if (type === 'rashari') return <>
      <ellipse cx="16" cy="6" rx="5" ry="5" {...p} />
      <path d="M8 12 Q16 10 24 12 L22 30 Q16 34 10 30 Z" {...p} />
      <path d="M4 12 Q8 16 10 22 M28 12 Q24 16 22 22" stroke={dim} strokeWidth={1.5 / scale} fill="none" />
      <path d="M10 30 L8 42 L24 42 L22 30 Z" {...p} />
    </>;
    if (type === 'nomad') return <>
      <ellipse cx="16" cy="6" rx="5" ry="5" {...p} />
      <path d="M6 13 Q16 10 26 13 L24 38 Q16 42 8 38 Z" {...p} />
      <path d="M6 13 Q4 10 6 8 Q10 6 12 10" fill={dim} stroke={c} strokeWidth={1 / scale} />
    </>;
    // warrior default
    return <>
      <ellipse cx="16" cy="6" rx="5" ry="5" {...p} />
      <rect x="10" y="12" width="12" height="14" rx="2" {...p} />
      <rect x="4" y="12" width="5" height="10" rx="2" {...p} />
      <rect x="23" y="12" width="5" height="10" rx="2" {...p} />
      <rect x="10" y="26" width="5" height="12" rx="1" {...p} />
      <rect x="17" y="26" width="5" height="12" rx="1" {...p} />
      <rect x="2" y="10" width="3" height="18" rx="1" fill={dim} stroke={c} strokeWidth={1 / scale} />
    </>;
  })();

  return <g transform={t}>{inner}</g>;
}

// ── Scroll Lore — click the scroll icon for full description ─────────────────
export function ScrollLore({ title, text, color = 'var(--gold-dim)', size = 11 }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <i className="ti ti-scroll"
        onClick={e => { e.stopPropagation(); setOpen(true); }}
        style={{ fontSize: size, color, cursor: 'pointer', flexShrink: 0, opacity: .7 }}
        title={`Lore: ${title}`}
      />
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)} style={{ zIndex: 200 }}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-title"><i className="ti ti-scroll" style={{ marginRight: 8 }} />{title}</div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{text}</div>
            <button className="btn btn-sm" style={{ marginTop: '1rem' }} onClick={() => setOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}
export function Loading({ message = 'Loading...' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', flexDirection: 'column', gap: '1rem' }}>
      <i className="ti ti-loader" style={{ fontSize: 24, color: 'var(--gold-dim)', animation: 'spin 1s linear infinite' }} />
      <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>{message}</div>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
export function Empty({ icon = 'ti-ghost', message, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
      <i className={`ti ${icon}`} style={{ fontSize: 36, opacity: .3, display: 'block', marginBottom: '.75rem' }} />
      <div style={{ fontSize: 15, marginBottom: action ? '1rem' : 0 }}>{message}</div>
      {action}
    </div>
  );
}

// ── Weapon / Armor Icons ──────────────────────────────────────────────────────
// One distinct icon per weapon SKILL CATEGORY (not per individual weapon name — the rulebook has too many
// named weapons to hand-draw each uniquely, but every weapon maps cleanly to one of these 8 skills).
// getWeaponIconType(weaponName) resolves a weapon's display name to its icon category.
export function getWeaponIconType(weaponName) {
  if (!weaponName) return null;
  // weaponName may come in as "Longsword (3k2)" from drawnWeapon strings — strip the DR suffix
  const cleanName = weaponName.split(' (')[0].trim();
  const w = WEAPONS_LIST.find(x => x.name === cleanName);
  if (!w) return null;
  const skillToType = {
    'Swordsmanship': 'sword', 'Knives': 'knife', 'Spears': 'spear', 'Polearms': 'polearm',
    'Staves': 'staff', 'Heavy Weapons': 'club', 'Archery': 'bow', 'Brawling': 'fist',
  };
  return skillToType[w.skill] || null;
}

// Is this weapon two-handed (occupies both hands — no off-hand icon should render alongside it)?
export function isWeaponTwoHanded(weaponName) {
  if (!weaponName) return false;
  const cleanName = weaponName.split(' (')[0].trim();
  const w = WEAPONS_LIST.find(x => x.name === cleanName);
  return !!w?.twoHanded;
}

export function WeaponIcon({ type, size = 18, color = '#c8962a', style }) {
  const c = color;
  const props = { stroke: c, strokeWidth: 1.8, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (type === 'sword') return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={style}>
      <line x1="6" y1="18" x2="18" y2="6" {...props} />
      <line x1="9" y1="9" x2="15" y2="15" stroke={c} strokeWidth="3" strokeLinecap="round" />
      <line x1="16" y1="4" x2="20" y2="8" {...props} />
    </svg>
  );
  if (type === 'knife') return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={style}>
      <path d="M7 17 L15 9 L18 12 L10 20 Z" fill={c} stroke={c} strokeWidth="1" />
      <line x1="5" y1="19" x2="7" y2="17" stroke={c} strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
  if (type === 'spear') return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={style}>
      <line x1="4" y1="20" x2="18" y2="6" {...props} />
      <path d="M16 4 L20 4 L18 8 Z" fill={c} stroke={c} strokeWidth="1" />
    </svg>
  );
  if (type === 'polearm') return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={style}>
      <line x1="5" y1="20" x2="17" y2="6" {...props} />
      <path d="M15 4 Q20 4 19 9 Q15 8 15 4 Z" fill={c} stroke={c} strokeWidth="1" />
    </svg>
  );
  if (type === 'staff') return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={style}>
      <line x1="6" y1="20" x2="18" y2="4" {...props} strokeWidth="2.4" />
      <circle cx="18" cy="4" r="2" fill={c} />
    </svg>
  );
  if (type === 'club') return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={style}>
      <line x1="7" y1="19" x2="14" y2="12" {...props} strokeWidth="2.6" />
      <circle cx="17" cy="8" r="4" fill="none" stroke={c} strokeWidth="1.8" />
      <circle cx="17" cy="8" r="1.6" fill={c} />
    </svg>
  );
  if (type === 'bow') return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={style}>
      <path d="M8 4 Q4 12 8 20" {...props} strokeWidth="2" />
      <line x1="8" y1="4" x2="8" y2="20" stroke={c} strokeWidth="1" strokeDasharray="1 1.5" />
      <line x1="6" y1="12" x2="19" y2="12" stroke={c} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M16 9 L19 12 L16 15" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  if (type === 'fist') return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={style}>
      <rect x="6" y="9" width="12" height="9" rx="3" {...props} strokeWidth="1.8" />
      <line x1="9" y1="9" x2="9" y2="6" {...props} strokeWidth="1.6" />
      <line x1="12" y1="9" x2="12" y2="5" {...props} strokeWidth="1.6" />
      <line x1="15" y1="9" x2="15" y2="6" {...props} strokeWidth="1.6" />
    </svg>
  );
  return null;
}

export function ArmorIcon({ size = 18, color = '#c8962a', style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={style}>
      <path d="M12 3 L19 6 V12 Q19 18 12 21 Q5 18 5 12 V6 Z" fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <line x1="12" y1="3" x2="12" y2="21" stroke={color} strokeWidth="1" opacity="0.5" />
    </svg>
  );
}


// Spawns a brief black swirling circle at a screen position (defaults to last mouse position)
// when a player spends a Void Point. Call from any click handler: triggerVoidSwirl(event)
let lastMouseX = 0, lastMouseY = 0;
if (typeof window !== 'undefined') {
  window.addEventListener('mousemove', e => { lastMouseX = e.clientX; lastMouseY = e.clientY; });
}
export function triggerVoidSwirl(event) {
  const x = event?.clientX ?? lastMouseX;
  const y = event?.clientY ?? lastMouseY;
  const el = document.createElement('div');
  el.className = 'void-swirl';
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 650);
}

// ── Rulebook reference modal — magnifying glass icon opens this for any gear item ─────────
export function RulebookEntryButton({ itemName, size = 13, color = 'var(--text-muted)' }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <button onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'inline-flex', alignItems: 'center', color, flexShrink: 0 }}
        title="View full rulebook entry">
        <i className="ti ti-zoom-in" style={{ fontSize: size }} />
      </button>
      {open && <RulebookEntryModal itemName={itemName} onClose={() => setOpen(false)} />}
    </>
  );
}

function RulebookEntryModal({ itemName, onClose }) {
  const fullEntry = GEAR_FULL_ENTRY[itemName];
  const shortEntry = GEAR_DESCRIPTIONS[itemName];
  const weapon = WEAPONS_LIST.find(w => w.name === itemName);
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--bg-panel)', border: '2px solid var(--gold-dim)', borderRadius: 8, padding: '1.25rem', maxWidth: 420, width: '90%', boxShadow: '0 8px 40px rgba(0,0,0,.8)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.6rem' }}>
          <div style={{ fontWeight: 700, color: 'var(--gold)', fontSize: 16 }}>{itemName}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18 }}>×</button>
        </div>
        {weapon && (
          <div style={{ fontSize: 12, color: 'var(--gold-dim)', marginBottom: '.6rem', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <span>DR {weapon.dr}</span>
            <span>{weapon.skill}</span>
            {weapon.price && weapon.price !== '—' && <span>{weapon.price.replace('c', ' copper')}</span>}
            {weapon.twoHanded && <span>Two-handed</span>}
          </div>
        )}
        {fullEntry ? (
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{fullEntry}</div>
        ) : shortEntry ? (
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {shortEntry}
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: '.6rem', fontStyle: 'italic' }}>
              Full rulebook entry not yet added for this item — ask the GM to check the book directly.
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>
            No reference entry available for this item yet.
          </div>
        )}
        {weapon?.special && (
          <div style={{ fontSize: 12, color: 'var(--green)', marginTop: '.6rem', paddingTop: '.6rem', borderTop: '1px solid var(--border)' }}>
            <strong>Special:</strong> {weapon.special}
          </div>
        )}
      </div>
    </div>
  );
}
