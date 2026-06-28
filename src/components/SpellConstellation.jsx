import React, { useState, useMemo } from 'react';
import { SAHIR_DISCIPLINES, COKALOI_CATEGORIES, IS_COKALOI_SCHOOL } from '../data/constants';

// ── Star field background ─────────────────────────────────────────────────────
const STARS = Array.from({ length: 80 }, (_, i) => ({
  x: (Math.sin(i * 2.3) * 0.5 + 0.5) * 100,
  y: (Math.cos(i * 1.7) * 0.5 + 0.5) * 100,
  r: (Math.sin(i * 3.1) * 0.5 + 0.5) * 1.2 + 0.3,
  opacity: (Math.sin(i * 1.1) * 0.5 + 0.5) * 0.4 + 0.1,
}));

// ── Constellation layouts — hand-positioned for visual appeal ─────────────────
// Each discipline has 3 types × 3 levels = 9 nodes
// Layout: [typeIndex][levelIndex] = {x, y} in 0-100 viewBox space

const LAYOUTS = {
  summoning: { // Air — wide like a bird/compass
    label: { x: 50, y: 8 },
    nodes: [
      // Jinn column (left)
      [{ x: 20, y: 25 }, { x: 18, y: 45 }, { x: 16, y: 65 }],
      // Primal column (centre)
      [{ x: 50, y: 20 }, { x: 50, y: 42 }, { x: 50, y: 64 }],
      // Implements column (right)
      [{ x: 80, y: 25 }, { x: 82, y: 45 }, { x: 84, y: 65 }],
    ]
  },
  celestials: { // Void — circular, like a crown
    label: { x: 50, y: 8 },
    nodes: [
      // Farsight (left arc)
      [{ x: 22, y: 30 }, { x: 18, y: 50 }, { x: 22, y: 70 }],
      // Astrology (top centre)
      [{ x: 50, y: 18 }, { x: 50, y: 40 }, { x: 50, y: 62 }],
      // Obscurement (right arc)
      [{ x: 78, y: 30 }, { x: 82, y: 50 }, { x: 78, y: 70 }],
    ]
  },
  blackmagic: { // Earth — heavy triangular base
    label: { x: 50, y: 8 },
    nodes: [
      // Ghul (left, heavy)
      [{ x: 18, y: 30 }, { x: 15, y: 50 }, { x: 12, y: 72 }],
      // Life (centre)
      [{ x: 50, y: 22 }, { x: 50, y: 44 }, { x: 50, y: 66 }],
      // Death (right, heavy)
      [{ x: 82, y: 30 }, { x: 85, y: 50 }, { x: 88, y: 72 }],
    ]
  },
  control: { // Water — flowing, slight curve
    label: { x: 50, y: 8 },
    nodes: [
      // Influence (left flowing)
      [{ x: 22, y: 28 }, { x: 20, y: 48 }, { x: 24, y: 68 }],
      // Illusion (centre wave)
      [{ x: 50, y: 20 }, { x: 52, y: 42 }, { x: 48, y: 64 }],
      // Transformation (right flowing)
      [{ x: 78, y: 28 }, { x: 80, y: 48 }, { x: 76, y: 68 }],
    ]
  },
  blessings: { // Fire — sharp angular, flame-like
    label: { x: 50, y: 8 },
    nodes: [
      // Blessings (left spike)
      [{ x: 24, y: 22 }, { x: 20, y: 46 }, { x: 18, y: 70 }],
      // Curses (centre spike up)
      [{ x: 50, y: 16 }, { x: 50, y: 42 }, { x: 50, y: 68 }],
      // Wards (right spike)
      [{ x: 76, y: 22 }, { x: 80, y: 46 }, { x: 82, y: 70 }],
    ]
  },
};

// Cokaloi layout — three arcs across the sky
const COKALOI_LAYOUTS = {
  dawn:  [
    { x: 12, y: 20 }, { x: 12, y: 35 },
    { x: 22, y: 28 }, { x: 22, y: 43 },
    { x: 32, y: 20 }, { x: 32, y: 35 },
    { x: 12, y: 58 }, { x: 22, y: 65 },
    { x: 32, y: 58 }, { x: 22, y: 78 },
  ],
  dusk:  [
    { x: 42, y: 15 }, { x: 42, y: 30 }, { x: 42, y: 45 },
    { x: 52, y: 22 }, { x: 52, y: 37 }, { x: 52, y: 52 },
    { x: 42, y: 62 }, { x: 52, y: 67 },
    { x: 47, y: 75 }, { x: 47, y: 85 },
    { x: 57, y: 45 }, { x: 57, y: 60 }, { x: 57, y: 75 },
  ],
  night: [
    { x: 68, y: 20 }, { x: 68, y: 35 },
    { x: 78, y: 28 }, { x: 78, y: 43 },
    { x: 88, y: 20 }, { x: 88, y: 35 }, { x: 88, y: 50 },
    { x: 68, y: 58 }, { x: 78, y: 65 },
    { x: 68, y: 75 }, { x: 88, y: 65 },
  ],
};

// ── Spell tooltip — rendered as HTML overlay, not foreignObject ───────────────
function SpellTooltip({ spell, color, onClose, canLearn, isLearned, onToggle, mode, style, canEdit = true }) {
  return (
    <div style={{
      position: 'absolute', zIndex: 200, background: 'rgba(20,12,4,.97)',
      border: `1px solid ${color}`, borderRadius: 6, padding: '10px 12px',
      width: 220, boxShadow: `0 4px 20px rgba(0,0,0,.7)`,
      pointerEvents: 'all', ...style
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color, flex: 1, marginRight: 8 }}>{spell.name}</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 0, flexShrink: 0 }}>×</button>
      </div>
      <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>TN {spell.tn} · Mastery {spell.level}</div>
      <div style={{ fontSize: 12, color: '#ccc', lineHeight: 1.5, marginBottom: 8 }}>{spell.desc}</div>
      {mode !== 'encounter' && canEdit && (
        <button onClick={onToggle} disabled={!canLearn && !isLearned}
          style={{
            fontSize: 12, padding: '3px 10px', borderRadius: 4,
            cursor: canLearn || isLearned ? 'pointer' : 'not-allowed',
            background: isLearned ? color + '33' : 'transparent',
            border: `1px solid ${isLearned ? color : canLearn ? color + '88' : '#444'}`,
            color: isLearned ? color : canLearn ? color + 'cc' : '#555',
            fontFamily: 'inherit',
          }}>
          {isLearned ? '★ Learned — click to remove' : canLearn ? '☆ Learn this spell' : '🔒 Learn lower level first'}
        </button>
      )}
      {mode !== 'encounter' && !canEdit && isLearned && (
        <div style={{ fontSize: 11, color: '#666', fontStyle: 'italic' }}>★ Learned</div>
      )}
      {mode === 'encounter' && isLearned && (
        <button onClick={onToggle} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 4, cursor: 'pointer', background: color + '33', border: `1px solid ${color}`, color, fontFamily: 'inherit' }}>
          Cast this spell
        </button>
      )}
    </div>
  );
}

// ── Sahir Constellation ───────────────────────────────────────────────────────
function SahirConstellation({ learnedSpells, onToggle, mode, schoolRank, spellTypeEmphases, disciplineBonus, canEdit = true }) {
  const [activeSpell, setActiveSpell] = useState(null);
  const [activeDiscipline, setActiveDiscipline] = useState(0);

  const disc = SAHIR_DISCIPLINES[activeDiscipline];
  const layout = LAYOUTS[disc.id];

  const isLearned = (spellName) => learnedSpells.includes(spellName);

  const canLearn = (typeIdx, level) => {
    if (mode === 'sheet' && !canEdit) return false; // players can't toggle on sheet
    if (mode === 'sheet') return true; // GM can always toggle
    if (level === 1) return true;
    const type = disc.types[typeIdx];
    const prevSpell = type.spells.find(s => s.level === level - 1);
    return prevSpell && isLearned(prevSpell.name);
  };

  const hasEmphasis = (typeId) => (spellTypeEmphases || []).includes(typeId);
  const hasDisciplineBonus = disc.id === disciplineBonus;

  return (
    <div>
      {/* Discipline selector tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
        {SAHIR_DISCIPLINES.map((d, i) => (
          <button key={d.id} onClick={() => { setActiveDiscipline(i); setActiveSpell(null); }}
            style={{ fontSize: 12, padding: '3px 10px', borderRadius: 12, fontFamily: 'inherit', cursor: 'pointer',
              background: activeDiscipline === i ? d.color + '33' : 'transparent',
              border: `1px solid ${activeDiscipline === i ? d.color : '#444'}`,
              color: activeDiscipline === i ? d.color : '#888',
            }}>
            {d.element} · {d.name}
            {hasDisciplineBonus && activeDiscipline === i && <span style={{ marginLeft: 4 }}>+1k1</span>}
          </button>
        ))}
      </div>

      {/* Constellation SVG */}
      <div style={{ position: 'relative', background: 'linear-gradient(135deg, #0a0814 0%, #050810 100%)', borderRadius: 8, border: `1px solid ${disc.color}33`, overflow: 'visible' }}>
        <svg viewBox="0 0 100 90" style={{ width: '100%', display: 'block' }}>
          {/* Background stars */}
          {STARS.map((s, i) => <circle key={i} cx={s.x} cy={s.y * 0.9} r={s.r * 0.5} fill="#fff" opacity={s.opacity} />)}

          {/* Discipline name */}
          <text x={layout.label.x} y={layout.label.y} textAnchor="middle" fill={disc.color} fontSize="4" fontFamily="Georgia,serif" opacity="0.9">{disc.element} · {disc.name}</text>

          {/* Connection lines within each type column */}
          {disc.types.map((type, ti) => {
            const nodes = layout.nodes[ti];
            return nodes.slice(0, -1).map((node, li) => {
              const next = nodes[li + 1];
              const learned = isLearned(type.spells[li].name) && isLearned(type.spells[li + 1].name);
              return <line key={`${ti}-${li}`} x1={node.x} y1={node.y} x2={next.x} y2={next.y}
                stroke={learned ? disc.color : disc.color + '33'} strokeWidth={learned ? 0.8 : 0.4} strokeDasharray={learned ? 'none' : '1,1'} />;
            });
          })}

          {/* Stars (spell nodes) */}
          {disc.types.map((type, ti) =>
            type.spells.map((spell, li) => {
              const pos = layout.nodes[ti][li];
              const learned = isLearned(spell.name);
              const available = canLearn(ti, spell.level);
              const isActive = activeSpell?.name === spell.name;
              const emphasis = hasEmphasis(type.id);
              const r = learned ? 3.2 : available ? 2.4 : 1.8;
              return (
                <g key={spell.name} style={{ cursor: 'pointer' }} onClick={() => setActiveSpell(isActive ? null : { ...spell, typeIdx: ti })}>
                  {/* Emphasis ring */}
                  {emphasis && learned && <circle cx={pos.x} cy={pos.y} r={r + 2} fill="none" stroke={disc.color} strokeWidth="0.5" opacity="0.6" />}
                  {/* Outer glow for learned */}
                  {learned && <circle cx={pos.x} cy={pos.y} r={r + 1} fill={disc.color} opacity="0.15" />}
                  {/* Main star */}
                  <circle cx={pos.x} cy={pos.y} r={r}
                    fill={learned ? disc.color : available ? disc.color + '44' : '#222'}
                    stroke={learned ? disc.color : available ? disc.color + '88' : '#444'}
                    strokeWidth="0.6"
                    opacity={isActive ? 1 : 0.9}
                  />
                  {/* Star point (learned only) */}
                  {learned && (
                    <g transform={`translate(${pos.x},${pos.y})`}>
                      <polygon points="0,-1.5 0.4,-0.4 1.5,-0.4 0.6,0.3 0.9,1.4 0,0.8 -0.9,1.4 -0.6,0.3 -1.5,-0.4 -0.4,-0.4"
                        fill="#fff" opacity="0.6" transform={`scale(${r * 0.35})`} />
                    </g>
                  )}
                  {/* Spell level indicator */}
                  <text x={pos.x} y={pos.y + r + 2.5} textAnchor="middle" fontSize="2" fill={disc.color} opacity="0.7">{spell.level}</text>
                </g>
              );
            })
          )}

          {/* Active spell tooltip — rendered inside SVG as foreignObject removed, now below */}
        </svg>

        {/* Spell tooltip — HTML overlay, properly sized */}
        {activeSpell && (() => {
          const pos = layout.nodes[activeSpell.typeIdx][activeSpell.level - 1];
          // Convert SVG % coords to left/top positioning
          const leftPct = Math.min(pos.x, 55);
          const topPct = Math.max(pos.y - 5, 2);
          return (
            <SpellTooltip
              spell={activeSpell} color={disc.color}
              onClose={() => setActiveSpell(null)}
              isLearned={isLearned(activeSpell.name)}
              canLearn={canLearn(activeSpell.typeIdx, activeSpell.level)}
              onToggle={() => { onToggle(activeSpell.name); setActiveSpell(null); }}
              mode={mode}
              canEdit={canEdit}
              style={{ position: 'absolute', left: `${leftPct}%`, top: `${topPct}%` }}
            />
          );
        })()}

        {/* Type legend */}
        <div style={{ display: 'flex', justifyContent: 'space-around', padding: '4px 8px', borderTop: `1px solid ${disc.color}22` }}>
          {disc.types.map((type, ti) => (
            <div key={type.id} style={{ fontSize: 11, color: hasEmphasis(type.id) ? disc.color : '#666', textAlign: 'center' }}>
              {type.name}{hasEmphasis(type.id) ? ' ★' : ''}
              <div style={{ fontSize: 10, color: '#444' }}>{disc.types[ti].spells.filter(s => isLearned(s.name)).length}/3 learned</div>
            </div>
          ))}
        </div>
      </div>

      {/* Learned count — shows current/max with rank-up nudge */}
      <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 12, color: '#666', flexWrap: 'wrap', alignItems: 'center' }}>
        {(() => {
          const maxSpells = 3 + ((schoolRank || 1) - 1) * 3;
          const count = learnedSpells.length;
          const needsSpells = canEdit && count < maxSpells;
          return (
            <span style={{ color: needsSpells ? '#c8a040' : disc.color, fontWeight: needsSpells ? 700 : 400 }}>
              {count}/{maxSpells} spells learned
              {needsSpells && (
                <span style={{ marginLeft: 6, fontSize: 11, color: '#c8a040', animation: 'blink 1.5s infinite' }}>
                  ✦ {maxSpells - count} spell{maxSpells - count > 1 ? 's' : ''} available to learn
                </span>
              )}
            </span>
          );
        })()}
        {disciplineBonus && <span>Discipline bonus: <span style={{ color: SAHIR_DISCIPLINES.find(d => d.id === disciplineBonus)?.color }}>{SAHIR_DISCIPLINES.find(d => d.id === disciplineBonus)?.name}</span> (+1k1)</span>}
        {spellTypeEmphases?.length > 0 && <span>Emphases (free raise): {spellTypeEmphases.join(', ')}</span>}
      </div>
    </div>
  );
}

// ── Star shape SVG path ───────────────────────────────────────────────────────
function StarShape({ cx, cy, r, fill, stroke, opacity = 1 }) {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const radius = i % 2 === 0 ? r : r * 0.4;
    return `${cx + Math.cos(angle) * radius},${cy + Math.sin(angle) * radius}`;
  }).join(' ');
  return <polygon points={pts} fill={fill} stroke={stroke} strokeWidth="0.5" opacity={opacity} />;
}

// ── Cokaloi Constellation — new tabless design ────────────────────────────────
function CoкaloiConstellation({ learnedSpells, onToggle, mode, insightRank, canEdit = true }) {
  const [activeSpell, setActiveSpell] = useState(null);
  const rank = insightRank || 1;

  const isLearned = (name) => learnedSpells.includes(name);
  const canLearn = (spell) => spell.level <= rank;
  const isOutOfReach = (spell) => spell.level > rank;

  // Group Dusk and Night by mastery level
  const byLevel = (cat) => {
    const levels = {};
    cat.spells.forEach(s => { if (!levels[s.level]) levels[s.level] = []; levels[s.level].push(s); });
    return Object.entries(levels).sort(([a],[b]) => Number(a)-Number(b));
  };

  const renderSpellNode = (spell, cat, showLevel = false) => {
    const learned = isLearned(spell.name);
    const reachable = canLearn(spell);
    const unreachable = isOutOfReach(spell);
    const isActive = activeSpell?.name === spell.name;

    let starFill, starStroke, starOpacity, dotOnly;
    if (learned) {
      starFill = cat.color; starStroke = cat.color; starOpacity = 1; dotOnly = false;
    } else if (reachable) {
      starFill = 'transparent'; starStroke = cat.color; starOpacity = 0.55; dotOnly = false;
    } else {
      dotOnly = true; // unreachable — dim glowing dot
    }

    return (
      <div key={spell.name}
        onClick={() => (canEdit || mode === 'encounter') ? setActiveSpell(isActive ? null : { ...spell, cat }) : null}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '3px 6px',
          borderRadius: 4, cursor: canEdit || mode === 'encounter' ? 'pointer' : 'default',
          background: isActive ? cat.color + '18' : 'transparent',
          transition: 'background .1s',
        }}>
        {/* Star / dot indicator */}
        <svg width={16} height={16} style={{ flexShrink: 0 }}>
          {dotOnly ? (
            <circle cx={8} cy={8} r={2.5} fill={cat.color} opacity={0.28}
              style={{ filter: `drop-shadow(0 0 2px ${cat.color})` }} />
          ) : (
            <>
              {learned && <circle cx={8} cy={8} r={7} fill={cat.color} opacity={0.1} />}
              <StarShape cx={8} cy={8} r={learned ? 6 : 5}
                fill={starFill} stroke={starStroke} opacity={starOpacity} />
            </>
          )}
        </svg>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 11, lineHeight: 1.2,
            color: learned ? cat.color : reachable ? 'var(--text-secondary)' : 'var(--text-muted)',
            fontWeight: learned ? 600 : 400,
            opacity: unreachable ? 0.45 : 1,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {showLevel && <span style={{ fontSize: 10, opacity: 0.6, marginRight: 3 }}>ML{spell.level}</span>}
            {spell.name}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', opacity: unreachable ? 0.3 : 0.7 }}>TN {spell.tn}</div>
        </div>
      </div>
    );
  };

  const dawnCat = COKALOI_CATEGORIES[0];
  const duskCat = COKALOI_CATEGORIES[1];
  const nightCat = COKALOI_CATEGORIES[2];

  return (
    <div>
      <div style={{ fontSize: 11, color: '#888', marginBottom: 8, fontStyle: 'italic', display: 'flex', justifyContent: 'space-between' }}>
        <span>Cokaloi — Ra'Shari Diviner. Insight Rank {rank} — can learn up to ML{rank}.</span>
        <span style={{ color: '#666' }}>{learnedSpells.length} known</span>
      </div>

      {/* Active spell tooltip */}
      {activeSpell && (() => {
        const cat = activeSpell.cat;
        return (
          <div style={{ marginBottom: 8, padding: '.6rem .75rem', background: 'var(--bg-panel)', border: `1px solid ${cat.color}66`, borderRadius: 6, position: 'relative' }}>
            <button onClick={() => setActiveSpell(null)} style={{ position: 'absolute', top: 4, right: 6, background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 16 }}>×</button>
            <div style={{ fontSize: 13, fontWeight: 700, color: cat.color, marginBottom: 2 }}>{activeSpell.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Mastery {activeSpell.level} · TN {activeSpell.tn} · {cat.name} Cokaloi</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 6 }}>{activeSpell.desc}</div>
            {canEdit && (
              canLearn(activeSpell)
                ? <button className="btn btn-sm" style={{ borderColor: cat.color + '88', color: cat.color, fontSize: 11 }}
                    onClick={() => { onToggle(activeSpell.name); setActiveSpell(null); }}>
                    {isLearned(activeSpell.name) ? '★ Learned — click to remove' : '☆ Learn this Cokalos'}
                  </button>
                : <div style={{ fontSize: 11, color: '#c84030', fontStyle: 'italic' }}>Requires Insight Rank {activeSpell.level} to learn.</div>
            )}
            {mode === 'encounter' && isLearned(activeSpell.name) && (
              <button className="btn btn-sm" style={{ borderColor: cat.color, color: cat.color, fontSize: 11 }}
                onClick={() => { onToggle(activeSpell.name); setActiveSpell(null); }}>
                Cast this Cokalos
              </button>
            )}
          </div>
        );
      })()}

      {/* Three columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {/* Dawn — chaotic, all displayed freely */}
        <div style={{ border: `1px solid ${dawnCat.color}33`, borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ background: dawnCat.color + '18', padding: '4px 8px', fontSize: 11, fontWeight: 600, color: dawnCat.color, borderBottom: `1px solid ${dawnCat.color}33` }}>
            ☀ Dawn · Fate &amp; Skill
          </div>
          <div style={{ padding: 4 }}>
            <div style={{ fontSize: 10, color: '#666', padding: '2px 6px', marginBottom: 2, fontStyle: 'italic' }}>Free order — any skill</div>
            {dawnCat.spells.map(spell => renderSpellNode(spell, dawnCat, true))}
          </div>
        </div>

        {/* Dusk — ordered by mastery level */}
        <div style={{ border: `1px solid ${duskCat.color}33`, borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ background: duskCat.color + '18', padding: '4px 8px', fontSize: 11, fontWeight: 600, color: duskCat.color, borderBottom: `1px solid ${duskCat.color}33` }}>
            🌆 Dusk · Social
          </div>
          <div style={{ padding: 4 }}>
            {byLevel(duskCat).map(([level, spells]) => (
              <div key={level}>
                <div style={{ fontSize: 9, color: duskCat.color, opacity: 0.6, padding: '3px 6px 1px', letterSpacing: '.08em', textTransform: 'uppercase' }}>
                  Mastery {level}{Number(level) > rank ? ' 🔒' : ''}
                </div>
                {spells.map(spell => renderSpellNode(spell, duskCat))}
              </div>
            ))}
          </div>
        </div>

        {/* Night — ordered by mastery level */}
        <div style={{ border: `1px solid ${nightCat.color}33`, borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ background: nightCat.color + '18', padding: '4px 8px', fontSize: 11, fontWeight: 600, color: nightCat.color, borderBottom: `1px solid ${nightCat.color}33` }}>
            🌙 Night · Healing
          </div>
          <div style={{ padding: 4 }}>
            {byLevel(nightCat).map(([level, spells]) => (
              <div key={level}>
                <div style={{ fontSize: 9, color: nightCat.color, opacity: 0.6, padding: '3px 6px 1px', letterSpacing: '.08em', textTransform: 'uppercase' }}>
                  Mastery {level}{Number(level) > rank ? ' 🔒' : ''}
                </div>
                {spells.map(spell => renderSpellNode(spell, nightCat))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Creation mode — clear spell list ─────────────────────────────────────────
function SahirSpellPicker({ learnedSpells, onToggle, maxSpells, spellEmphasis, setSpellEmphasis, spellDisciplineBonus, setSpellDisciplineBonus, isGM }) {
  const [activeDiscipline, setActiveDiscipline] = useState(0);
  const [hoveredSpell, setHoveredSpell] = useState(null);
  const disc = SAHIR_DISCIPLINES[activeDiscipline];

  const isLearned = (name) => learnedSpells.includes(name);
  const canLearn = (typeIdx, level) => {
    // Character creation: level 1 only — rank 1 characters know ML1 spells only.
    // GMs can add higher spells via XP spend on the sheet after creation.
    if (level > 1) return false;
    return true;
  };

  return (
    <div>
      {/* Progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', padding: '.5rem .75rem', background: 'rgba(200,150,42,.08)', border: '1px solid var(--gold-dim)', borderRadius: 5 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: learnedSpells.length >= maxSpells ? 'var(--green)' : 'var(--gold)' }}>
          {learnedSpells.length}/{maxSpells} spells selected
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1 }}>
          Click any spell to learn it. You must know level 1 before level 2 of the same type.
        </div>
      </div>

      {/* Discipline tabs */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: '.75rem' }}>
        {SAHIR_DISCIPLINES.map((d, i) => (
          <button key={d.id} onClick={() => setActiveDiscipline(i)}
            style={{ fontSize: 13, padding: '4px 12px', borderRadius: 12, fontFamily: 'inherit', cursor: 'pointer',
              background: activeDiscipline === i ? d.color + '33' : 'var(--bg-panel)',
              border: `1px solid ${activeDiscipline === i ? d.color : 'var(--border)'}`,
              color: activeDiscipline === i ? d.color : 'var(--text-muted)',
              fontWeight: activeDiscipline === i ? 600 : 400,
            }}>
            {d.element} · {d.name}
          </button>
        ))}
      </div>

      {/* Spell types + description side panel */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '.5rem' }}>
        {disc.types.map((type, ti) => (
          <div key={type.id}>
            <div style={{ fontSize: 12, fontWeight: 600, color: disc.color, marginBottom: '.3rem', paddingBottom: '.2rem', borderBottom: `1px solid ${disc.color}44` }}>
              {type.name}
            </div>
            {type.spells.map((spell, li) => {
              const learned = isLearned(spell.name);
              const available = canLearn(ti, spell.level);
              const locked = !available && !learned;
              return (
                <div key={spell.name}
                  onClick={() => available || learned ? onToggle(spell.name) : null}
                  onMouseEnter={() => setHoveredSpell(spell)}
                  onMouseLeave={() => setHoveredSpell(s => s?.name === spell.name ? null : s)}
                  style={{
                    padding: '.4rem .5rem', marginBottom: '.25rem', borderRadius: 4,
                    background: learned ? disc.color + '22' : hoveredSpell?.name === spell.name ? disc.color + '11' : 'var(--bg-panel)',
                    border: `1px solid ${learned ? disc.color : available ? disc.color + '55' : 'var(--border)'}`,
                    cursor: locked ? 'not-allowed' : 'pointer',
                    opacity: locked ? 0.4 : 1,
                    transition: 'all .1s',
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 11, color: disc.color, fontWeight: 700, minWidth: 12 }}>L{spell.level}</span>
                    <span style={{ fontSize: 12, color: learned ? disc.color : 'var(--text-primary)', fontWeight: learned ? 600 : 400, flex: 1 }}>{spell.name}</span>
                    {learned && <i className="ti ti-check" style={{ fontSize: 12, color: disc.color }} />}
                    {locked && <i className="ti ti-lock" style={{ fontSize: 11, color: 'var(--text-muted)' }} />}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.3 }}>TN {spell.tn}</div>
                </div>
              );
            })}
          </div>
        ))}
        </div>
        </div>
        {/* Spell description side panel */}
        <div style={{ width: 200, flexShrink: 0 }}>
          {hoveredSpell ? (
            <div style={{ position: 'sticky', top: 0, padding: '.6rem .75rem', background: 'var(--bg-panel)', border: `1px solid ${disc.color}55`, borderRadius: 6, borderLeft: `3px solid ${disc.color}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: disc.color, marginBottom: '.2rem' }}>{hoveredSpell.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: '.3rem' }}>Level {hoveredSpell.level} · TN {hoveredSpell.tn}</div>
              {hoveredSpell.desc && (
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{hoveredSpell.desc}</div>
              )}
              {hoveredSpell.level > 1 && (
                <div style={{ fontSize: 11, color: '#c84030', marginTop: '.4rem', fontStyle: 'italic' }}>
                  Level 2+ spells are learned after character creation via XP spend.
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: '.6rem .75rem', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-muted)', fontSize: 12, fontStyle: 'italic' }}>
              Hover a spell to see its description
            </div>
          )}
        </div>
      </div>

      {/* Specialisation pickers */}
      <div className="card">
        <div className="card-title">Specialisations (required at Rank 1)</div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: '.4rem' }}>Spell Type Emphasis <span style={{ color: 'var(--gold-dim)' }}>(free raise)</span></div>
            <select value={spellEmphasis} onChange={e => setSpellEmphasis(e.target.value)} style={{ width: '100%' }}>
              <option value="">— Choose a spell type —</option>
              {SAHIR_DISCIPLINES.flatMap(d => d.types.map(t => (
                <option key={t.id} value={t.id}>{d.name} — {t.name}</option>
              )))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: '.4rem' }}>Discipline Bonus <span style={{ color: 'var(--gold-dim)' }}>(+1k1)</span></div>
            <select value={spellDisciplineBonus} onChange={e => setSpellDisciplineBonus(e.target.value)} style={{ width: '100%' }}>
              <option value="">— Choose a discipline —</option>
              {SAHIR_DISCIPLINES.map(d => (
                <option key={d.id} value={d.id}>{d.element} — {d.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

function CoкaloiSpellPicker({ learnedSpells, onToggle, maxSpells, insightRank = 1 }) {
  const [activeCategory, setActiveCategory] = useState(0);
  const cat = COKALOI_CATEGORIES[activeCategory];
  const isLearned = (name) => learnedSpells.includes(name);
  const canLearn = (spell) => spell.level <= insightRank;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', padding: '.5rem .75rem', background: 'rgba(200,150,42,.08)', border: '1px solid var(--gold-dim)', borderRadius: 5 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: learnedSpells.length >= maxSpells ? 'var(--green)' : 'var(--gold)' }}>
          {learnedSpells.length}/{maxSpells} Cokaloi selected
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1 }}>Dawn spells can be learned in any order. Dusk and Night require Insight Rank {insightRank}+ to learn Mastery {insightRank}+.</div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: '.75rem' }}>
        {COKALOI_CATEGORIES.map((c, i) => (
          <button key={c.id} onClick={() => setActiveCategory(i)}
            style={{ fontSize: 13, padding: '4px 12px', borderRadius: 12, fontFamily: 'inherit', cursor: 'pointer',
              background: activeCategory === i ? c.color + '33' : 'var(--bg-panel)',
              border: `1px solid ${activeCategory === i ? c.color : 'var(--border)'}`,
              color: activeCategory === i ? c.color : 'var(--text-muted)',
              fontWeight: activeCategory === i ? 600 : 400,
            }}>
            {c.name}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '.25rem', marginBottom: '1rem' }}>
        {cat.spells.map(spell => {
          const learned = isLearned(spell.name);
          const available = canLearn(spell);
          const locked = !available && !learned;
          return (
            <div key={spell.name} onClick={() => available || learned ? onToggle(spell.name) : null}
              style={{ padding: '.4rem .6rem', borderRadius: 4, cursor: locked ? 'not-allowed' : 'pointer', opacity: locked ? 0.4 : 1,
                background: learned ? cat.color + '22' : 'var(--bg-panel)',
                border: `1px solid ${learned ? cat.color : available ? cat.color + '55' : 'var(--border)'}`,
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, color: cat.color, fontWeight: 700, minWidth: 14 }}>ML{spell.level}</span>
                <span style={{ fontSize: 13, color: learned ? cat.color : 'var(--text-primary)', fontWeight: learned ? 600 : 400, flex: 1 }}>{spell.name}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>TN {spell.tn}</span>
                {learned && <i className="ti ti-check" style={{ fontSize: 12, color: cat.color }} />}
                {locked && <i className="ti ti-lock" style={{ fontSize: 11, color: 'var(--text-muted)' }} />}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, paddingLeft: 20, lineHeight: 1.3 }}>
                {locked ? `Requires Insight Rank ${spell.level}` : `${spell.desc.slice(0, 80)}${spell.desc.length > 80 ? '…' : ''}`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
export default function SpellConstellation({ character, mode = 'sheet', onUpdate, onCastSpell, spellEmphasis, setSpellEmphasis, spellDisciplineBonus, setSpellDisciplineBonus, isGM }) {
  const school = character?.school || '';
  const isCokaloi = IS_COKALOI_SCHOOL(school);
  const learnedSpells = character?.spells || [];
  const insightRank = character?.school_rank || 1;
  const startingSpells = isCokaloi ? 6 : 3;

  const toggleSpell = (spellName) => {
    if (!onUpdate) return;
    const current = character?.spells || [];
    const updated = current.includes(spellName)
      ? current.filter(s => s !== spellName)
      : [...current, spellName];
    onUpdate(character.id, { spells: updated });
  };

  // In 'sheet' mode, only show the learn/remove control if an onUpdate handler was actually
  // provided (i.e. the parent is in edit mode). In 'create'/'encounter' modes this is irrelevant.
  const canEdit = mode !== 'sheet' || !!onUpdate;

  const handleCast = (spellName) => {
    if (onCastSpell) onCastSpell(spellName);
  };

  const handleCreationToggle = (name) => {
    const current = character?.spells || [];
    const updated = current.includes(name) ? current.filter(s => s !== name) : [...current, name];
    onUpdate('creation', { spells: updated });
  };

  // Creation mode — clear list pickers instead of constellation
  if (mode === 'create') {
    return isCokaloi
      ? <CoкaloiSpellPicker learnedSpells={learnedSpells} onToggle={handleCreationToggle} maxSpells={startingSpells} />
      : <SahirSpellPicker
          learnedSpells={learnedSpells}
          onToggle={handleCreationToggle}
          maxSpells={startingSpells}
          spellEmphasis={spellEmphasis || ''}
          setSpellEmphasis={setSpellEmphasis}
          spellDisciplineBonus={spellDisciplineBonus || ''}
          setSpellDisciplineBonus={setSpellDisciplineBonus}
          isGM={isGM}
        />;
  }

  return (
    <div>
      {isCokaloi
        ? <CoкaloiConstellation learnedSpells={learnedSpells} onToggle={mode === 'encounter' ? handleCast : toggleSpell} mode={mode} insightRank={insightRank} canEdit={canEdit} />
        : <SahirConstellation learnedSpells={learnedSpells} onToggle={mode === 'encounter' ? handleCast : toggleSpell} mode={mode} schoolRank={insightRank} spellTypeEmphases={character?.spell_type_emphases || []} disciplineBonus={character?.spell_discipline_bonus || null} canEdit={canEdit} />
      }
    </div>
  );
}
