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
function SpellTooltip({ spell, color, onClose, canLearn, isLearned, onToggle, mode, style }) {
  return (
    <div style={{
      position: 'absolute', zIndex: 200, background: 'rgba(20,12,4,.97)',
      border: `1px solid ${color}`, borderRadius: 6, padding: '10px 12px',
      width: 220, boxShadow: `0 4px 20px rgba(0,0,0,.7)`,
      pointerEvents: 'all', ...style
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color, flex: 1, marginRight: 8 }}>{spell.name}</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 0, flexShrink: 0 }}>×</button>
      </div>
      <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>TN {spell.tn} · Mastery {spell.level}</div>
      <div style={{ fontSize: 10, color: '#ccc', lineHeight: 1.5, marginBottom: 8 }}>{spell.desc}</div>
      {mode !== 'encounter' && (
        <button onClick={onToggle} disabled={!canLearn && !isLearned}
          style={{
            fontSize: 10, padding: '3px 10px', borderRadius: 4,
            cursor: canLearn || isLearned ? 'pointer' : 'not-allowed',
            background: isLearned ? color + '33' : 'transparent',
            border: `1px solid ${isLearned ? color : canLearn ? color + '88' : '#444'}`,
            color: isLearned ? color : canLearn ? color + 'cc' : '#555',
            fontFamily: 'inherit',
          }}>
          {isLearned ? '★ Learned — click to remove' : canLearn ? '☆ Learn this spell' : '🔒 Learn lower level first'}
        </button>
      )}
      {mode === 'encounter' && isLearned && (
        <button onClick={onToggle} style={{ fontSize: 10, padding: '3px 10px', borderRadius: 4, cursor: 'pointer', background: color + '33', border: `1px solid ${color}`, color, fontFamily: 'inherit' }}>
          Cast this spell
        </button>
      )}
    </div>
  );
}

// ── Sahir Constellation ───────────────────────────────────────────────────────
function SahirConstellation({ learnedSpells, onToggle, mode, schoolRank, spellTypeEmphases, disciplineBonus }) {
  const [activeSpell, setActiveSpell] = useState(null);
  const [activeDiscipline, setActiveDiscipline] = useState(0);

  const disc = SAHIR_DISCIPLINES[activeDiscipline];
  const layout = LAYOUTS[disc.id];

  const isLearned = (spellName) => learnedSpells.includes(spellName);

  const canLearn = (typeIdx, level) => {
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
            style={{ fontSize: 10, padding: '3px 10px', borderRadius: 12, fontFamily: 'inherit', cursor: 'pointer',
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
              style={{ position: 'absolute', left: `${leftPct}%`, top: `${topPct}%` }}
            />
          );
        })()}

        {/* Type legend */}
        <div style={{ display: 'flex', justifyContent: 'space-around', padding: '4px 8px', borderTop: `1px solid ${disc.color}22` }}>
          {disc.types.map((type, ti) => (
            <div key={type.id} style={{ fontSize: 9, color: hasEmphasis(type.id) ? disc.color : '#666', textAlign: 'center' }}>
              {type.name}{hasEmphasis(type.id) ? ' ★' : ''}
              <div style={{ fontSize: 8, color: '#444' }}>{disc.types[ti].spells.filter(s => isLearned(s.name)).length}/3 learned</div>
            </div>
          ))}
        </div>
      </div>

      {/* Learned count */}
      <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 10, color: '#666', flexWrap: 'wrap' }}>
        <span style={{ color: disc.color }}>{learnedSpells.length} spells learned</span>
        {disciplineBonus && <span>Discipline bonus: <span style={{ color: SAHIR_DISCIPLINES.find(d => d.id === disciplineBonus)?.color }}>{SAHIR_DISCIPLINES.find(d => d.id === disciplineBonus)?.name}</span> (+1k1)</span>}
        {spellTypeEmphases?.length > 0 && <span>Emphases (free raise): {spellTypeEmphases.join(', ')}</span>}
      </div>
    </div>
  );
}

// ── Cokaloi Constellation ─────────────────────────────────────────────────────
function CoкaloiConstellation({ learnedSpells, onToggle, mode, insightRank }) {
  const [activeSpell, setActiveSpell] = useState(null);
  const [activeCategory, setActiveCategory] = useState(0);

  const cat = COKALOI_CATEGORIES[activeCategory];
  const positions = COKALOI_LAYOUTS[cat.id];

  const isLearned = (name) => learnedSpells.includes(name);
  const canLearn = (spell) => spell.level <= (insightRank || 1);

  return (
    <div>
      <div style={{ fontSize: 10, color: '#888', marginBottom: 8, fontStyle: 'italic' }}>Cokaloi — Ra'Shari Diviner magic. Dawn spells may be learned in any order.</div>

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        {COKALOI_CATEGORIES.map((c, i) => (
          <button key={c.id} onClick={() => { setActiveCategory(i); setActiveSpell(null); }}
            style={{ fontSize: 10, padding: '3px 10px', borderRadius: 12, fontFamily: 'inherit', cursor: 'pointer',
              background: activeCategory === i ? c.color + '33' : 'transparent',
              border: `1px solid ${activeCategory === i ? c.color : '#444'}`,
              color: activeCategory === i ? c.color : '#888',
            }}>
            {c.name} · {c.element}
          </button>
        ))}
      </div>

      <div style={{ background: 'linear-gradient(135deg, #0a0814 0%, #050810 100%)', borderRadius: 8, border: `1px solid ${cat.color}33`, overflow: 'visible', position: 'relative' }}>
        <svg viewBox="0 0 100 90" style={{ width: '100%', display: 'block' }}>
          {STARS.map((s, i) => <circle key={i} cx={s.x} cy={s.y * 0.9} r={s.r * 0.5} fill="#fff" opacity={s.opacity} />)}

          <text x="50" y="8" textAnchor="middle" fill={cat.color} fontSize="4" fontFamily="Georgia,serif" opacity="0.9">{cat.name} Cokaloi · {cat.desc.split('.')[0]}</text>

          {cat.spells.map((spell, i) => {
            const pos = positions[i] || { x: 50, y: 50 };
            const learned = isLearned(spell.name);
            const available = canLearn(spell);
            const isActive = activeSpell?.name === spell.name;
            const r = learned ? 3 : available ? 2.2 : 1.6;
            return (
              <g key={spell.name} style={{ cursor: 'pointer' }} onClick={() => setActiveSpell(isActive ? null : { ...spell, idx: i })}>
                {learned && <circle cx={pos.x} cy={pos.y} r={r + 1} fill={cat.color} opacity="0.15" />}
                <circle cx={pos.x} cy={pos.y} r={r}
                  fill={learned ? cat.color : available ? cat.color + '44' : '#222'}
                  stroke={learned ? cat.color : available ? cat.color + '88' : '#444'}
                  strokeWidth="0.6"
                />
                {learned && (
                  <g transform={`translate(${pos.x},${pos.y})`}>
                    <polygon points="0,-1.5 0.4,-0.4 1.5,-0.4 0.6,0.3 0.9,1.4 0,0.8 -0.9,1.4 -0.6,0.3 -1.5,-0.4 -0.4,-0.4"
                      fill="#fff" opacity="0.6" transform={`scale(${r * 0.35})`} />
                  </g>
                )}
                <text x={pos.x} y={pos.y + r + 2.5} textAnchor="middle" fontSize="1.8" fill={cat.color} opacity="0.7">{spell.level}</text>
              </g>
            );
          })}

        </svg>

        {/* Cokaloi spell tooltip — HTML overlay */}
        {activeSpell && (() => {
          const pos = positions[activeSpell.idx] || { x: 50, y: 50 };
          return (
            <SpellTooltip
              spell={activeSpell} color={cat.color}
              onClose={() => setActiveSpell(null)}
              isLearned={isLearned(activeSpell.name)}
              canLearn={canLearn(activeSpell)}
              onToggle={() => { onToggle(activeSpell.name); setActiveSpell(null); }}
              mode={mode}
              style={{ position: 'absolute', left: `${Math.min(pos.x, 55)}%`, top: `${Math.max(pos.y - 5, 2)}%` }}
            />
          );
        })()}

        <div style={{ padding: '4px 8px', borderTop: `1px solid ${cat.color}22`, fontSize: 9, color: '#555' }}>
          {cat.desc} · Insight Rank {insightRank || 1} → max mastery level {insightRank || 1}
        </div>
      </div>

      <div style={{ marginTop: 6, fontSize: 10, color: cat.color }}>{learnedSpells.length} Cokaloi learned</div>
    </div>
  );
}

// ── Creation mode — clear spell list ─────────────────────────────────────────
function SahirSpellPicker({ learnedSpells, onToggle, maxSpells, spellEmphasis, setSpellEmphasis, spellDisciplineBonus, setSpellDisciplineBonus }) {
  const [activeDiscipline, setActiveDiscipline] = useState(0);
  const disc = SAHIR_DISCIPLINES[activeDiscipline];

  const isLearned = (name) => learnedSpells.includes(name);
  const canLearn = (typeIdx, level) => {
    if (level === 1) return true;
    const type = disc.types[typeIdx];
    const prevSpell = type.spells.find(s => s.level === level - 1);
    return prevSpell && isLearned(prevSpell.name);
  };

  return (
    <div>
      {/* Progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', padding: '.5rem .75rem', background: 'rgba(200,150,42,.08)', border: '1px solid var(--gold-dim)', borderRadius: 5 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: learnedSpells.length >= maxSpells ? 'var(--green)' : 'var(--gold)' }}>
          {learnedSpells.length}/{maxSpells} spells selected
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', flex: 1 }}>
          Click any spell to learn it. You must know level 1 before level 2 of the same type.
        </div>
      </div>

      {/* Discipline tabs */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: '.75rem' }}>
        {SAHIR_DISCIPLINES.map((d, i) => (
          <button key={d.id} onClick={() => setActiveDiscipline(i)}
            style={{ fontSize: 11, padding: '4px 12px', borderRadius: 12, fontFamily: 'inherit', cursor: 'pointer',
              background: activeDiscipline === i ? d.color + '33' : 'var(--bg-panel)',
              border: `1px solid ${activeDiscipline === i ? d.color : 'var(--border)'}`,
              color: activeDiscipline === i ? d.color : 'var(--text-muted)',
              fontWeight: activeDiscipline === i ? 600 : 400,
            }}>
            {d.element} · {d.name}
          </button>
        ))}
      </div>

      {/* Spell types and spells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '.5rem', marginBottom: '1rem' }}>
        {disc.types.map((type, ti) => (
          <div key={type.id}>
            <div style={{ fontSize: 10, fontWeight: 600, color: disc.color, marginBottom: '.3rem', paddingBottom: '.2rem', borderBottom: `1px solid ${disc.color}44` }}>
              {type.name}
            </div>
            {type.spells.map((spell, li) => {
              const learned = isLearned(spell.name);
              const available = canLearn(ti, spell.level);
              const locked = !available && !learned;
              return (
                <div key={spell.name}
                  onClick={() => available || learned ? onToggle(spell.name) : null}
                  style={{
                    padding: '.4rem .5rem', marginBottom: '.25rem', borderRadius: 4,
                    background: learned ? disc.color + '22' : 'var(--bg-panel)',
                    border: `1px solid ${learned ? disc.color : available ? disc.color + '55' : 'var(--border)'}`,
                    cursor: locked ? 'not-allowed' : 'pointer',
                    opacity: locked ? 0.4 : 1,
                    transition: 'all .1s',
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 9, color: disc.color, fontWeight: 700, minWidth: 12 }}>L{spell.level}</span>
                    <span style={{ fontSize: 10, color: learned ? disc.color : 'var(--text-primary)', fontWeight: learned ? 600 : 400, flex: 1 }}>{spell.name}</span>
                    {learned && <i className="ti ti-check" style={{ fontSize: 10, color: disc.color }} />}
                    {locked && <i className="ti ti-lock" style={{ fontSize: 9, color: 'var(--text-muted)' }} />}
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.3 }}>TN {spell.tn}</div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Specialisation pickers */}
      <div className="card">
        <div className="card-title">Specialisations (required at Rank 1)</div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: '.4rem' }}>Spell Type Emphasis <span style={{ color: 'var(--gold-dim)' }}>(free raise)</span></div>
            <select value={spellEmphasis} onChange={e => setSpellEmphasis(e.target.value)} style={{ width: '100%' }}>
              <option value="">— Choose a spell type —</option>
              {SAHIR_DISCIPLINES.flatMap(d => d.types.map(t => (
                <option key={t.id} value={t.id}>{d.name} — {t.name}</option>
              )))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: '.4rem' }}>Discipline Bonus <span style={{ color: 'var(--gold-dim)' }}>(+1k1)</span></div>
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

function CoкaloiSpellPicker({ learnedSpells, onToggle, maxSpells }) {
  const [activeCategory, setActiveCategory] = useState(0);
  const cat = COKALOI_CATEGORIES[activeCategory];
  const isLearned = (name) => learnedSpells.includes(name);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', padding: '.5rem .75rem', background: 'rgba(200,150,42,.08)', border: '1px solid var(--gold-dim)', borderRadius: 5 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: learnedSpells.length >= maxSpells ? 'var(--green)' : 'var(--gold)' }}>
          {learnedSpells.length}/{maxSpells} Cokaloi selected
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', flex: 1 }}>Dawn spells can be learned in any order. Select freely.</div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: '.75rem' }}>
        {COKALOI_CATEGORIES.map((c, i) => (
          <button key={c.id} onClick={() => setActiveCategory(i)}
            style={{ fontSize: 11, padding: '4px 12px', borderRadius: 12, fontFamily: 'inherit', cursor: 'pointer',
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
          return (
            <div key={spell.name} onClick={() => onToggle(spell.name)}
              style={{ padding: '.4rem .6rem', borderRadius: 4, cursor: 'pointer',
                background: learned ? cat.color + '22' : 'var(--bg-panel)',
                border: `1px solid ${learned ? cat.color : 'var(--border)'}`,
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 9, color: cat.color, fontWeight: 700, minWidth: 14 }}>L{spell.level}</span>
                <span style={{ fontSize: 11, color: learned ? cat.color : 'var(--text-primary)', fontWeight: learned ? 600 : 400, flex: 1 }}>{spell.name}</span>
                <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>TN {spell.tn}</span>
                {learned && <i className="ti ti-check" style={{ fontSize: 10, color: cat.color }} />}
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2, paddingLeft: 20, lineHeight: 1.3 }}>{spell.desc.slice(0, 80)}{spell.desc.length > 80 ? '…' : ''}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
export default function SpellConstellation({ character, mode = 'sheet', onUpdate, onCastSpell, spellEmphasis, setSpellEmphasis, spellDisciplineBonus, setSpellDisciplineBonus }) {
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
        />;
  }

  return (
    <div>
      {isCokaloi
        ? <CoкaloiConstellation learnedSpells={learnedSpells} onToggle={mode === 'encounter' ? handleCast : toggleSpell} mode={mode} insightRank={insightRank} />
        : <SahirConstellation learnedSpells={learnedSpells} onToggle={mode === 'encounter' ? handleCast : toggleSpell} mode={mode} schoolRank={insightRank} spellTypeEmphases={character?.spell_type_emphases || []} disciplineBonus={character?.spell_discipline_bonus || null} />
      }
    </div>
  );
}
