import React from 'react';
import { FACTION_ICONS, WOUND_RANKS, WOUND_COLORS } from '../data/constants';
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
export function SkillDots({ rank, max = 5 }) {
  return (
    <span>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={`sdot ${i < rank ? 'f' : ''}`} />
      ))}
    </span>
  );
}

// ── Silhouette SVGs ───────────────────────────────────────────────────────────
export function Silhouette({ type, size = 32 }) {
  const h = Math.round(size * 1.4);
  if (type === 'sahir') return (
    <svg width={size} height={h} viewBox="0 0 32 44">
      <ellipse cx="16" cy="6" rx="5" ry="5" className="sil-sahir" />
      <path d="M8 12 Q16 10 24 12 L26 38 Q16 40 6 38 Z" className="sil-sahir" />
      <line x1="16" y1="16" x2="8" y2="32" stroke="#6050c8" strokeWidth="1.5" />
      <circle cx="7" cy="33" r="2" fill="rgba(180,160,255,.6)" stroke="#8070e8" strokeWidth="1" />
      <path d="M14 4 L16 1 L18 4" fill="rgba(180,160,255,.5)" stroke="#8070e8" strokeWidth="1" />
    </svg>
  );
  if (type === 'courtier') return (
    <svg width={size} height={h} viewBox="0 0 32 44">
      <ellipse cx="16" cy="6" rx="5" ry="5" className="sil-courtier" />
      <path d="M8 13 Q16 11 24 13 L22 26 Q16 28 10 26 Z" className="sil-courtier" />
      <path d="M10 26 L6 42 L14 38 L16 42 L18 38 L26 42 L22 26 Z" className="sil-courtier" />
      <rect x="5" y="13" width="4" height="8" rx="2" className="sil-courtier" />
      <rect x="23" y="13" width="4" height="8" rx="2" className="sil-courtier" />
    </svg>
  );
  if (type === 'monster') return (
    <svg width={size} height={h} viewBox="0 0 32 44">
      <ellipse cx="16" cy="7" rx="7" ry="6" className="sil-monster" />
      <path d="M6 13 Q16 10 26 13 L28 30 Q16 35 4 30 Z" className="sil-monster" />
      <path d="M4 30 L2 42 L10 36 L16 42 L22 36 L30 42 L28 30 Q16 35 4 30Z" className="sil-monster" />
      <path d="M6 18 L2 14 M26 18 L30 14" stroke="var(--red)" strokeWidth="1.5" />
      <ellipse cx="13" cy="7" rx="1.5" ry="2" fill="rgba(255,100,80,.7)" />
      <ellipse cx="19" cy="7" rx="1.5" ry="2" fill="rgba(255,100,80,.7)" />
    </svg>
  );
  // warrior (default)
  return (
    <svg width={size} height={h} viewBox="0 0 32 44">
      <ellipse cx="16" cy="6" rx="5" ry="5" className="sil-warrior" />
      <rect x="10" y="12" width="12" height="14" rx="2" className="sil-warrior" />
      <rect x="4" y="12" width="5" height="10" rx="2" className="sil-warrior" />
      <rect x="23" y="12" width="5" height="10" rx="2" className="sil-warrior" />
      <rect x="10" y="26" width="5" height="12" rx="1" className="sil-warrior" />
      <rect x="17" y="26" width="5" height="12" rx="1" className="sil-warrior" />
      <rect x="2" y="10" width="3" height="18" rx="1" fill="rgba(200,150,42,.5)" stroke="var(--gold-dim)" strokeWidth="1" />
    </svg>
  );
}

export function CharacterSilhouette({ school, size = 32 }) {
  return <Silhouette type={getArchetype(school)} size={size} />;
}

// ── Loading spinner ───────────────────────────────────────────────────────────
export function Loading({ message = 'Loading...' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', flexDirection: 'column', gap: '1rem' }}>
      <i className="ti ti-loader" style={{ fontSize: 24, color: 'var(--gold-dim)', animation: 'spin 1s linear infinite' }} />
      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{message}</div>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
export function Empty({ icon = 'ti-ghost', message, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
      <i className={`ti ${icon}`} style={{ fontSize: 36, opacity: .3, display: 'block', marginBottom: '.75rem' }} />
      <div style={{ fontSize: 13, marginBottom: action ? '1rem' : 0 }}>{message}</div>
      {action}
    </div>
  );
}
