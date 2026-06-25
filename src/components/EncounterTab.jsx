import React, { useState, useCallback, useEffect } from 'react';
import { STANCES, NPC_ACTIONS, STATUS_EFFECTS, ROUND_LIMITS, WEAPONS_LIST, GAME_ID, SCHOOL_DATA , FACTION_COLORS } from '../data/constants';
import { supabase } from '../lib/supabase';
import { Silhouette, FacIcon, WoundBadge, SilhouetteToken, ScrollLore } from './UI';
import { getWoundRank, getArchetype, calcDifficulty, diffColor, pick, rollN, repLabel } from '../lib/utils';
import DiceModal from './DiceModal';
import PCTurnPanel from './PCTurnPanel';
import EncounterBuilder, { NPCPicker, NPC_BY_FACTION, generateGroup } from './EncounterBuilder';
import { playDamage } from '../lib/sounds';

// ── Combatant Card ────────────────────────────────────────────────────────────
function CombatantCard({ c, isActive, isGM, isPCView, myCharId, pcs, onGMWound, onApplyStatus, onRemoveStatus, targeting, onSetTarget, compact, onVoidDefense }) {
  const isNPC = c.type === 'npc';
  const isMyChar = c.id === myCharId;
  const wColor = ['#4a8a40','#8a8a30','#a87830','#c86030','#c84030','#a02828','#801818','#600010'][c.wound] || '#4a8a40';
  const wLabel = ['Healthy','Nicked','Grazed','Hurt','Injured','Crippled','Down','Out'][c.wound] || 'Healthy';
  const pc = pcs?.[c.id];
  const voidTnBoost = c.voidArmor ? 10 : 0;
  const armorBonus = pc?.armorBonus || c.armorBonus || 0;
  // Full Defense: Agility/Defense roll REPLACES Reflexes×5 (per rulebook p.63)
  // Normal TN = 5 + Reflexes×5 + armor
  // Full Defense TN = 5 + armor + defenseRoll (roll replaces the Reflexes×5 component)
  const fullDefBonus = c.stance === 'Full Defense' ? (c.fullDefenseBonus ?? 10) : 0;
  const armorTN = c.stance === 'Full Defense'
    ? 5 + armorBonus + fullDefBonus + voidTnBoost
    : 5 + (c.reflexes || 2) * 5 + armorBonus + voidTnBoost;
  const currentVoid = c.current_void ?? pc?.current_void ?? 0;
  const maxVoid = c.void || pc?.void || 2;

  const cardClass = [
    'combat-card',
    isNPC ? 'npc-card' : 'pc-card',
    isMyChar ? 'my-char' : '',
    isActive ? 'active-turn' : '',
    targeting === c.id ? 'targeted' : '',
  ].filter(Boolean).join(' ');

  // ── Compact view ──────────────────────────────────────────────────────────
  if (compact) {
    return (
      <div className={cardClass} style={{ padding: '.3rem .5rem', display: 'flex', alignItems: 'center', gap: '.4rem', marginBottom: '.25rem' }}>
        <Silhouette type={getArchetype(c.school) || (isNPC ? 'warrior' : 'warrior')} size={isActive ? 20 : 16}
          color={!isNPC && pc?.avatar_color ? pc.avatar_color : undefined} />
        <span style={{ fontSize: isActive ? 12 : 11, fontWeight: isActive ? 600 : 400, color: isActive ? 'var(--gold)' : 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {c.name}{isMyChar && !isActive ? ' ★' : ''}
        </span>
        <span style={{ fontSize: 11, color: wColor, fontWeight: 600 }}>{wLabel}</span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 28, textAlign: 'right' }}>TN{armorTN}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--gold)', minWidth: 20, textAlign: 'right' }}>{c.init}</span>
      </div>
    );
  }

  const avatarUrl = (!isNPC ? (pc?.avatar_url || c.avatar_url || '') : '').trim();
  const avatarColor = (!isNPC && pc?.avatar_color) ? pc.avatar_color : (isNPC ? '#8a3030' : '#4a8a40');
  const avatarType = (!isNPC && pc?.avatar_type) ? pc.avatar_type : (getArchetype(c.school) || 'warrior');

  return (
    <div className={cardClass}>
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.4rem .6rem', borderBottom: '1px solid var(--border)', background: isActive ? 'rgba(200,150,42,.08)' : 'transparent' }}>
        <div style={{ width: isActive ? 36 : 28, height: isActive ? 46 : 36, borderRadius: 4, background: 'var(--bg-deep)', border: `1px solid ${isActive ? 'var(--gold)' : avatarColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', transition: 'all .2s' }}>
          {avatarUrl
            ? <img src={avatarUrl} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
            : null}
          <Silhouette type={avatarType} size={isActive ? 28 : 22} color={avatarColor}
            style={{ display: avatarUrl ? 'none' : undefined }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ fontSize: isActive ? 14 : 12, fontWeight: 600, color: isActive ? 'var(--gold)' : isMyChar ? 'var(--gold)' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {c.name}
            </div>
            {isNPC && (() => {
              const sd = SCHOOL_DATA[c.school];
              const techs = [];
              for (let r = 1; r <= (c.rank || 1); r++) { if (sd?.techniques?.[r]) techs.push(`Rank ${r}: ${sd.techniques[r]}`); }
              if (techs.length === 0) return null;
              return <ScrollLore title={`${c.name} — ${c.school} Techniques`} text={techs.join('\n\n')} />;
            })()}
            {isMyChar && !isActive && <span style={{ fontSize: 10, color: 'var(--gold-dim)', border: '1px solid var(--gold-dim)', borderRadius: 3, padding: '0 3px' }}>YOU</span>}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {isNPC ? (c.sub || c.school || '') : c.school}
          </div>
          <div style={{ display: 'flex', gap: 3, marginTop: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 11, padding: '1px 5px', border: `1px solid ${wColor}55`, borderRadius: 3, color: wColor, background: wColor + '20', fontWeight: 600 }}>{wLabel}</span>
            <span className="stance-badge">{c.stance === 'Full Attack' ? 'F.Atk' : c.stance === 'Full Defense' ? 'F.Def' : c.stance}</span>
            {/* HP — always visible on PC cards, never on NPCs */}
            {!isNPC && pc && (
              <span style={{ fontSize: 10, color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 3, padding: '0 4px' }}>
                {pc.current_wounds ?? 0} / {pc.max_wounds ?? 20} hp
              </span>
            )}
            {(c.statusEffects || []).map(e => {
              const isRollStatus = e.startsWith('Stealth:') || e.startsWith('Perception:');
              return (
                <span key={e} className="effect-badge"
                  style={isRollStatus ? { background: 'rgba(74,138,170,.25)', border: '1px solid #4a8aaa', color: '#4ab0d0', fontWeight: 700 } : {}}
                  onClick={() => onRemoveStatus && onRemoveStatus(c.id, e)}
                  title={isRollStatus ? 'Click to remove' : undefined}>
                  {e} ×
                </span>
              );
            })}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: isActive ? 22 : 16, fontWeight: 700, color: 'var(--gold)' }}>{c.init}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>init</div>
        </div>
      </div>

      {/* Bottom row - weapon + armor TN + void */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', padding: '.3rem .6rem', fontSize: 12, color: 'var(--text-muted)' }}>
        <i className="ti ti-sword" style={{ fontSize: 13 }} />
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.drawnWeapon || 'Unarmed'}</span>
        {/* Armor TN — shows boost if void spent */}
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginLeft: 4 }}
          title={c.stance === 'Full Defense' ? `Full Defense: 5 + ${armorBonus} armor + ${c.fullDefenseBonus ?? 10} Defense roll (replaces Reflexes×5)` : `TN to Be Hit: 5 + ${(c.reflexes||2)}×5 + ${armorBonus} armor`}>
          TN <span style={{ color: c.voidArmor ? '#6aba60' : (c.stance === 'Full Defense' ? '#4a8a40' : 'var(--text-primary)') }}>{armorTN}</span>
          {c.stance === 'Full Defense' && <span style={{ fontSize: 10, color: '#4a8a40', marginLeft: 2 }}>🛡</span>}
          {c.voidArmor && <span style={{ fontSize: 10, color: '#6aba60', marginLeft: 2 }}>⬡</span>}
        </span>
        {!isNPC && pc && (
          <div style={{ display: 'flex', gap: 2, alignItems: 'center', marginLeft: 4 }}>
            {Array.from({ length: pc.void || 2 }, (_, i) => (
              <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', border: `1px solid ${i < (pc.current_void || 0) ? 'var(--gold)' : 'var(--border)'}`, background: i < (pc.current_void || 0) ? 'var(--gold)' : 'transparent' }} />
            ))}
          </div>
        )}
      </div>

      {/* Void defense buttons — player's own card only, any time during combat */}
      {isMyChar && !isNPC && onVoidDefense && currentVoid > 0 && (
        <div style={{ padding: '.3rem .6rem', borderTop: '1px solid rgba(107,78,40,.2)', display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', width: '100%', marginBottom: 2 }}>Spend Void ({currentVoid} left):</span>
          <button className="btn btn-sm" style={{ fontSize: 10, padding: '1px 5px', opacity: c.voidArmor ? 0.5 : 1, borderColor: '#6aba60', color: '#6aba60' }}
            disabled={!!c.voidArmor || currentVoid <= 0}
            onClick={() => onVoidDefense(c.id, 'armor')}
            title="+10 Armor TN this round">
            ⬡ +10 TN
          </button>
          <button className="btn btn-sm" style={{ fontSize: 10, padding: '1px 5px', opacity: c.voidReduceDamage ? 0.5 : 1, borderColor: '#6aba60', color: '#6aba60' }}
            disabled={!!c.voidReduceDamage || currentVoid <= 0}
            onClick={() => onVoidDefense(c.id, 'damage')}
            title={`Reduce next wound rank gain by your Void Ring (${maxVoid})`}>
            ⬡ -{maxVoid} Wounds
          </button>
          <button className="btn btn-sm" style={{ fontSize: 10, padding: '1px 5px', opacity: c.pendingInitBoost ? 0.5 : 1, borderColor: 'var(--gold-dim)', color: 'var(--gold-dim)' }}
            disabled={!!c.pendingInitBoost || currentVoid <= 0}
            onClick={() => onVoidDefense(c.id, 'initiative')}
            title="+10 Initiative — applies on next round change">
            ⬡ +10 Init
          </button>
          {c.pendingInitBoost && <span style={{ fontSize: 10, color: 'var(--gold-dim)', alignSelf: 'center' }}>+10 next round</span>}
          {c.voidReduceDamage && <span style={{ fontSize: 10, color: '#6aba60', alignSelf: 'center' }}>Absorb ready</span>}
        </div>
      )}

      {/* GM controls */}
      {isGM && !isPCView && (
        <div style={{ padding: '.3rem .6rem', borderTop: '1px solid rgba(107,78,40,.2)', display: 'flex', gap: 4, alignItems: 'center' }}>
          <button className="btn btn-sm btn-d" style={{ padding: '1px 5px', fontSize: 11 }} onClick={() => onGMWound(c.id, 1)}>+W</button>
          <button className="btn btn-sm" style={{ padding: '1px 5px', fontSize: 11 }} onClick={() => onGMWound(c.id, -1)}>−W</button>
          <select style={{ fontSize: 11, padding: '1px 4px', flex: 1 }} value="" onChange={e => { if (e.target.value) onApplyStatus(c.id, e.target.value); e.target.value = ''; }}>
            <option value="">+ Status</option>
            {STATUS_EFFECTS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
      )}

      {/* NPC action controls (GM only, active NPC turn) */}
      {isActive && isNPC && isGM && !isPCView && (
        <div style={{ padding: '.4rem .6rem', borderTop: '1px solid rgba(107,78,40,.3)', background: 'rgba(200,150,42,.04)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>NPC Action:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {NPC_ACTIONS.map(a => (
              <button key={a} className={`act-btn ${c._action === a ? 'sel' : ''}`} style={{ fontSize: 11 }}
                onClick={() => onSetTarget && onSetTarget(c.id, a)}>
                {a}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Void Button ───────────────────────────────────────────────────────────────
function VoidButton() {
  const [open, setOpen] = useState(false);
  const VOID_USES = [
    { icon: 'ti-dice', label: '+1k1 to any roll', desc: 'Spend before rolling. Adds one die rolled and one die kept to any roll.' },
    { icon: 'ti-shield', label: '+10 Armor TN', desc: 'Spend as a Free Action to add +10 to your Armor TN until your next turn.' },
    { icon: 'ti-heart', label: 'Reduce damage', desc: 'When taking wounds, spend to reduce damage received by your Void Ring.' },
    { icon: 'ti-bolt', label: '+10 Initiative', desc: 'Spend at the start of a round before rolling Initiative to add +10 to your Initiative roll.' },
    { icon: 'ti-star', label: '+2k1 (some techniques)', desc: 'Certain school techniques upgrade Void spend to +2k1 instead of +1k1.' },
    { icon: 'ti-eye', label: 'Negate one attack (Defense R5)', desc: 'Defense Rank 5 Mastery: spend Void as a Free Action to negate one attack per round.' },
    { icon: 'ti-compass', label: 'Center Stance bonus', desc: 'Your first action in Center Stance adds a flat bonus equal to your School Rank to the roll result. This is separate from — and stacks with — Void Point spending.' },
  ];
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)}
        style={{ width: 42, height: 42, borderRadius: '50%', background: '#000', border: '2px solid rgba(200,150,42,.5)', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, fontWeight: 700, letterSpacing: '.05em', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, boxShadow: open ? '0 0 12px rgba(200,150,42,.4)' : 'none' }}>
        VOID
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: 'var(--bg-card)', border: '1px solid var(--gold-dim)', borderRadius: 6, padding: '.6rem', width: 260, zIndex: 100, boxShadow: '0 4px 20px rgba(0,0,0,.6)' }}
          onClick={e => e.stopPropagation()}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)', marginBottom: '.5rem', display: 'flex', justifyContent: 'space-between' }}>
            Void Point Uses
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 15 }}>×</button>
          </div>
          {VOID_USES.map((u, i) => (
            <div key={i} style={{ display: 'flex', gap: '.5rem', padding: '.3rem 0', borderBottom: i < VOID_USES.length - 1 ? '1px solid rgba(107,78,40,.2)' : 'none' }}>
              <i className={`ti ${u.icon}`} style={{ fontSize: 14, color: 'var(--gold-dim)', flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{u.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>{u.desc}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Party Card — extracted as a proper component so useState is legal ─────────
function PartyCard({ c, pcsMap, myCharId, isGM, isPCView, grantedActions, combatants, onUpdateCharacter, upEnc }) {
  const [imgErr, setImgErr] = useState(false);
  const wR = getWoundRank(c.current_wounds || 0, c.max_wounds || 10);
  const wColor = ['#4a8a40','#8a8a30','#a87830','#c86030','#c84030','#a02828','#801818','#600010'][wR] || '#4a8a40';
  const wLabel = ['Healthy','Nicked','Grazed','Hurt','Injured','Crippled','Down','Out'][wR] || 'Healthy';
  const pc = pcsMap[c.id];
  const avatarColor = pc?.avatar_color || c.avatar_color || '#c8962a';
  const avatarType = pc?.avatar_type || c.avatar_type || 'warrior';
  const avatarUrl = (pc?.avatar_url || c.avatar_url || '').trim();
  const granted = grantedActions[c.id] || 0;
  const isMyChar = c.id === myCharId;

  return (
    <div style={{
      background: 'var(--bg-panel)', border: `1px solid ${isMyChar ? avatarColor : 'var(--border)'}`,
      borderLeft: `3px solid ${isMyChar ? avatarColor : '#4a8a40'}`,
      borderRadius: 6, padding: '.75rem', width: 160, position: 'relative',
      boxShadow: isMyChar ? `0 0 12px ${avatarColor}33` : 'none',
    }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '.5rem' }}>
        <div style={{ width: 48, height: 62, background: 'var(--bg-deep)', borderRadius: 5, border: `1px solid ${avatarColor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {avatarUrl && !imgErr
            ? <img src={avatarUrl} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setImgErr(true)} />
            : <Silhouette type={avatarType} size={40} color={avatarColor} />}
        </div>
      </div>
      <div style={{ textAlign: 'center', marginBottom: '.5rem' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.school}</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: '.4rem' }}>
        <span style={{ color: wColor, fontWeight: 600 }}>{wLabel}</span>
        {isMyChar ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--gold-dim)' }}>
            <button onClick={() => {
              const newVoid = Math.max(0, (c.current_void || 0) - 1);
              upEnc({ combatants: combatants.map(x => x.id === c.id ? { ...x, current_void: newVoid } : x) });
              if (pc) onUpdateCharacter(c.id, { current_void: newVoid });
            }} style={{ background: 'none', border: 'none', color: 'var(--gold-dim)', cursor: 'pointer', fontSize: 13, padding: 0, lineHeight: 1 }}>−</button>
            <span>Void {c.current_void || 0}/{pc?.void || c.void || 2}</span>
            <button onClick={() => {
              const max = pc?.void || c.void || 2;
              const newVoid = Math.min(max, (c.current_void || 0) + 1);
              upEnc({ combatants: combatants.map(x => x.id === c.id ? { ...x, current_void: newVoid } : x) });
              if (pc) onUpdateCharacter(c.id, { current_void: newVoid });
            }} style={{ background: 'none', border: 'none', color: 'var(--gold-dim)', cursor: 'pointer', fontSize: 13, padding: 0, lineHeight: 1 }}>+</button>
          </span>
        ) : (
          <span style={{ color: 'var(--gold-dim)' }}>Void {c.current_void || 0}/{pc?.void || c.void || 2}</span>
        )}
      </div>
      <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginBottom: '.4rem' }}>
        Armor TN <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 15 }}>{5 + (c.reflexes || 2) * 5}</span>
      </div>
      {granted > 0 && (
        <div style={{ textAlign: 'center', padding: '4px', background: 'rgba(200,150,42,.1)', border: '1px solid var(--gold-dim)', borderRadius: 4, marginBottom: '.4rem' }}>
          <div style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 600 }}>
            <i className="ti ti-bolt" style={{ marginRight: 4 }} />{granted} Action{granted > 1 ? 's' : ''} granted
          </div>
        </div>
      )}
      {isGM && !isPCView && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: '.4rem' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', flex: 1 }}>Grant:</span>
          <button className="rep-btn" onClick={() => upEnc({ grantedActions: { ...grantedActions, [c.id]: Math.max(0, granted - 1) } })}>−</button>
          <span style={{ fontSize: 13, color: granted > 0 ? 'var(--gold)' : 'var(--text-muted)', minWidth: 14, textAlign: 'center' }}>{granted}</span>
          <button className="rep-btn" onClick={() => upEnc({ grantedActions: { ...grantedActions, [c.id]: granted + 1 } })}>+</button>
        </div>
      )}
    </div>
  );
}

// ── Battle Grid ───────────────────────────────────────────────────────────────
function BattleGrid({ combatants, active, pcsMap, gridSize, isGM, myCharId, isMyTurn, onMove, onShift, onClearGrid, settingBg }) {
  const [selected, setSelected] = useState(null);
  const [hoverCell, setHoverCell] = useState(null); // {x, y} while a token is selected
  const CELL = 36;
  const W = gridSize * CELL;

  // Can a given combatant token be moved by the current user?
  const canMoveToken = (id) => {
    if (isGM) return true;                  // GM can move anything anytime
    if (id !== myCharId) return false;       // Players can only move their own token
    if (!isMyTurn) return false;             // Only on their turn
    return true;
  };

  const handleCellClick = (x, y) => {
    if (!selected) return;
    if (!canMoveToken(selected)) return;
    const occupied = combatants.some(c => c.gridX === x && c.gridY === y);
    if (occupied) return;
    onMove(selected, x, y);
    setSelected(null);
    setHoverCell(null);
  };

  const handleTokenClick = (e, id) => {
    e.stopPropagation();
    if (!canMoveToken(id)) return;
    setSelected(selected === id ? null : id);
  };

  const getTokenColor = (c) => {
    const pc = pcsMap[c.id];
    if (pc?.avatar_color) return pc.avatar_color;
    return c.type === 'npc' ? '#c84030' : '#4a8a40';
  };

  const ShiftBtn = ({ dx, dy, icon }) => isGM ? (
    <button onClick={() => onShift(dx, dy)} style={{ background: 'rgba(107,78,40,.3)', border: '1px solid rgba(107,78,40,.5)', color: 'var(--gold-dim)', borderRadius: 4, cursor: 'pointer', padding: '3px 6px', fontSize: 14, lineHeight: 1 }}>{icon}</button>
  ) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 2 }}>
        Battle Grid {gridSize}×{gridSize}
        {selected && <span style={{ color: 'var(--gold)', marginLeft: 6 }}>Moving: {combatants.find(c => c.id === selected)?.name}</span>}
        {!isGM && !isMyTurn && myCharId && <span style={{ color: 'var(--text-muted)', marginLeft: 6, textTransform: 'none' }}>— Move your token on your turn</span>}
        {!isGM && isMyTurn && !selected && myCharId && <span style={{ color: 'var(--green)', marginLeft: 6, textTransform: 'none' }}>— Click your token to move</span>}
      </div>

      <ShiftBtn dx={0} dy={-1} icon="↑" />

      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <ShiftBtn dx={-1} dy={0} icon="←" />

        <svg width={W} height={W}
          style={{ background: 'rgba(10,8,4,.8)', border: '1px solid rgba(107,78,40,.4)', borderRadius: 4, cursor: selected ? 'crosshair' : 'default', display: 'block', overflow: 'visible' }}
          onClick={e => {
            if (!selected) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const x = Math.floor((e.clientX - rect.left) / CELL);
            const y = Math.floor((e.clientY - rect.top) / CELL);
            handleCellClick(x, y);
          }}
          onMouseMove={e => {
            if (!selected) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const x = Math.floor((e.clientX - rect.left) / CELL);
            const y = Math.floor((e.clientY - rect.top) / CELL);
            if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) setHoverCell({ x, y });
          }}
          onMouseLeave={() => setHoverCell(null)}>

          {settingBg && <image href={settingBg} x={0} y={0} width={W} height={W} preserveAspectRatio="xMidYMid slice" opacity="0.25" />}

          {Array.from({ length: gridSize + 1 }, (_, i) => (
            <g key={i}>
              <line x1={i * CELL} y1={0} x2={i * CELL} y2={W} stroke="rgba(107,78,40,.25)" strokeWidth="0.5" />
              <line x1={0} y1={i * CELL} x2={W} y2={i * CELL} stroke="rgba(107,78,40,.25)" strokeWidth="0.5" />
            </g>
          ))}

          {selected && Array.from({ length: gridSize }, (_, y) =>
            Array.from({ length: gridSize }, (_, x) => {
              const occupied = combatants.some(c => c.gridX === x && c.gridY === y);
              if (occupied) return null;
              return <rect key={`${x}-${y}`} x={x * CELL + 1} y={y * CELL + 1} width={CELL - 2} height={CELL - 2} fill="rgba(200,150,42,.08)" rx="2" />;
            })
          )}

          {/* Trail line — from selected token's current position to hovered cell */}
          {selected && hoverCell && (() => {
            const selC = combatants.find(c => c.id === selected);
            if (!selC || selC.gridX === undefined) return null;
            const x1 = selC.gridX * CELL + CELL / 2;
            const y1 = selC.gridY * CELL + CELL / 2;
            const x2 = hoverCell.x * CELL + CELL / 2;
            const y2 = hoverCell.y * CELL + CELL / 2;
            if (x1 === x2 && y1 === y2) return null;
            return (
              <g pointerEvents="none">
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(200,150,42,.5)" strokeWidth="2" strokeDasharray="5,3" />
                <circle cx={x1} cy={y1} r={4} fill="rgba(200,150,42,.4)" />
                <circle cx={x2} cy={y2} r={4} fill="rgba(200,150,42,.8)" />
              </g>
            );
          })()}

          {combatants.map(c => {
            if (c.gridX === undefined || c.gridY === undefined) return null;
            const isActive = c.id === active?.id;
            const isSelected = c.id === selected;
            const color = getTokenColor(c);
            const cx = c.gridX * CELL + CELL / 2;
            const cy = c.gridY * CELL + CELL / 2;
            const r = 13;
            const pc = pcsMap[c.id];
            const avatarType = pc?.avatar_type || 'warrior';
            const tokenUrl = (pc?.token_url || '').trim();
            const ringColor = c.type === 'npc' ? '#c84030' : '#4a8a40';
            const isDead = c.wound >= 6;
            const statusLabel = c.wound >= 7 ? 'DEAD' : c.wound >= 6 ? 'DOWN' : null;
            const shortName = c.name.length > 7 ? c.name.slice(0, 6) + '…' : c.name;
            const clipId = `tok-${c.id.replace(/[^a-z0-9]/gi, '')}`;
            return (
              <g key={c.id} style={{ cursor: 'pointer' }} onClick={e => handleTokenClick(e, c.id)}>
                {isActive && <circle cx={cx} cy={cy} r={r + 6} fill={color} opacity="0.2" />}
                {isActive && <circle cx={cx} cy={cy} r={r + 4} fill="none" stroke={color} strokeWidth="1.5" opacity="0.6" />}
                {isSelected && <circle cx={cx} cy={cy} r={r + 4} fill="none" stroke="#fff" strokeWidth="1.5" strokeDasharray="3,2" />}
                <circle cx={cx} cy={cy} r={r + 1} fill={ringColor + '33'} stroke={isDead ? '#600010' : ringColor} strokeWidth="1.5" opacity={isDead ? 0.5 : 1} />
                <circle cx={cx} cy={cy} r={r} fill={isDead ? '#1a0808' : '#1a1208'} />
                {tokenUrl ? (
                  <>
                    <defs>
                      <clipPath id={clipId}>
                        <circle cx={cx} cy={cy} r={r} />
                      </clipPath>
                    </defs>
                    <image href={tokenUrl} x={cx - r} y={cy - r} width={r * 2} height={r * 2}
                      clipPath={`url(#${clipId})`} preserveAspectRatio="xMidYMid slice"
                      opacity={isDead ? 0.4 : 1} />
                  </>
                ) : (
                  <SilhouetteToken type={avatarType} cx={cx} cy={cy} r={r} color={isDead ? '#600010' : color} />
                )}
                {c.wound > 0 && !isDead && (
                  <circle cx={cx + r - 3} cy={cy - r + 3} r="4"
                    fill={['#4a8a40','#8a8a30','#a87830','#c86030','#c84030','#a02828'][c.wound - 1] || '#c84030'}
                    stroke="rgba(0,0,0,.5)" strokeWidth="0.5" />
                )}
                <text x={cx} y={cy + r + 9} textAnchor="middle" fontSize="7" fill={isDead ? '#600010' : '#888'} fontFamily="sans-serif">{shortName}</text>
                {statusLabel && (
                  <text x={cx} y={cy - r - 3} textAnchor="middle" fontSize="7" fontWeight="bold" fill={c.wound >= 7 ? '#c00010' : '#c84030'} fontFamily="sans-serif">{statusLabel}</text>
                )}
              </g>
            );
          })}
        </svg>

        <ShiftBtn dx={1} dy={0} icon="→" />
      </div>

      <ShiftBtn dx={0} dy={1} icon="↓" />

      {(() => {
        const unplaced = combatants.filter(c => c.gridX === undefined || c.gridY === undefined);
        if (!unplaced.length) return null;
        return (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center', padding: '4px', background: 'rgba(10,8,4,.6)', borderRadius: 4, border: '1px solid rgba(107,78,40,.3)', maxWidth: W, marginTop: 4 }}>
            <div style={{ width: '100%', fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 2 }}>Click to select, then click grid to place</div>
            {unplaced.map(c => {
              const color = getTokenColor(c);
              const isSelected = c.id === selected;
              return (
                <div key={c.id} onClick={e => handleTokenClick(e, c.id)}
                  style={{ width: 32, height: 32, borderRadius: '50%', background: color, border: `2px solid ${isSelected ? '#fff' : color + '88'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 9, fontWeight: 700, color: '#fff', boxShadow: isSelected ? `0 0 8px ${color}` : 'none' }}>
                  {c.name.slice(0, 3).toUpperCase()}
                </div>
              );
            })}
          </div>
        );
      })()}

      {isGM && combatants.some(c => c.gridX !== undefined) && (
        <button className="btn btn-sm" style={{ fontSize: 11, marginTop: 4 }} onClick={onClearGrid}>Clear Grid</button>
      )}
    </div>
  );
}



// ── Battlefield Conditions Panel ───────────────────────────────────────────────
const VISIBILITY_CONDITIONS = [
  { key: 'clear',      label: 'Clear',        desc: 'Normal visibility — no penalty.',                    tnMod: 0,  rangeMod: 0 },
  { key: 'dim',        label: 'Dim Light',    desc: 'Torchlight or dusk. +5 TN to ranged attacks.',       tnMod: 0,  rangeMod: 5 },
  { key: 'darkness',   label: 'Darkness',     desc: '+10 TN to all attacks. May not target by sight.',    tnMod: 5,  rangeMod: 10 },
  { key: 'sandstorm',  label: 'Sandstorm',    desc: '+15 TN all attacks. Ranged impossible beyond 5ft.',  tnMod: 10, rangeMod: 99 },
  { key: 'fog',        label: 'Thick Fog',    desc: '+10 TN all attacks. Ranged max 10ft.',               tnMod: 5,  rangeMod: 15 },
  { key: 'smoke',      label: 'Smoke',        desc: '+5 TN melee. +15 TN ranged. Choke risk.',            tnMod: 5,  rangeMod: 15 },
];

const TERRAIN_CONDITIONS = [
  { key: 'clear',      label: 'Open Ground',  desc: 'No terrain penalty.' },
  { key: 'difficult',  label: 'Difficult',    desc: 'Rubble, mud, crowd. +5 TN Athletics/movement.' },
  { key: 'hazardous',  label: 'Hazardous',    desc: 'Unstable floor, ledges. Knockdown = fall.' },
  { key: 'elevated',   label: 'Elevated',     desc: 'High ground. Attacker gets +1k0 to ranged.' },
  { key: 'confined',   label: 'Confined',     desc: 'Alley or indoor. No charge. Large weapons -1k0.' },
  { key: 'flooded',    label: 'Flooded',      desc: 'Ankle-deep water. +10 TN Athletics. No Knockdown.' },
  { key: 'fire',       label: 'On Fire',      desc: 'Burning area. 1 Wound/round in zone unless armored.' },
];

const COVER_CONDITIONS = [
  { key: 'none',    label: 'No Cover',       desc: 'Fully exposed.',                         tnBonus: 0 },
  { key: 'light',   label: 'Light Cover',    desc: 'Corners, market stalls. +5 TN to hit.',  tnBonus: 5 },
  { key: 'heavy',   label: 'Heavy Cover',    desc: 'Walls, pillars. +10 TN to hit.',         tnBonus: 10 },
  { key: 'prone',   label: 'Prone / Hiding', desc: 'Melee attackers ignore. Ranged +10 TN.', tnBonus: 10 },
];

function BattlefieldConditionsPanel({ conditions = {}, onSet, isGM }) {
  const [open, setOpen] = useState(false);
  const vis = conditions.visibility || 'clear';
  const ter = conditions.terrain || 'clear';
  const cov = conditions.cover || 'none';
  const hasConditions = vis !== 'clear' || ter !== 'clear' || cov !== 'none';

  const visData  = VISIBILITY_CONDITIONS.find(v => v.key === vis) || VISIBILITY_CONDITIONS[0];
  const terData  = TERRAIN_CONDITIONS.find(t => t.key === ter) || TERRAIN_CONDITIONS[0];
  const covData  = COVER_CONDITIONS.find(c => c.key === cov) || COVER_CONDITIONS[0];

  return (
    <div style={{ position: 'relative' }}>
      <button className="btn btn-sm"
        style={{ borderColor: hasConditions ? '#4a8aaa' : 'rgba(200,150,42,.4)', color: hasConditions ? '#4ab0d0' : 'var(--gold-dim)', fontSize: 12 }}
        onClick={() => setOpen(o => !o)}>
        <i className="ti ti-map-2" style={{ fontSize: 12, marginRight: 3 }} />
        {hasConditions ? 'Conditions' : 'Battlefield'}
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, background: 'var(--bg-card)', border: '1px solid #4a8aaa', borderRadius: 6, padding: '.75rem', width: 300, zIndex: 100, boxShadow: '0 4px 20px rgba(0,0,0,.6)' }}
          onClick={e => e.stopPropagation()}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#4ab0d0', marginBottom: '.75rem', display: 'flex', justifyContent: 'space-between' }}>
            Battlefield Conditions
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16 }}>×</button>
          </div>

          {[
            { label: 'Visibility', options: VISIBILITY_CONDITIONS, current: vis, key: 'visibility' },
            { label: 'Terrain',    options: TERRAIN_CONDITIONS,   current: ter, key: 'terrain' },
            { label: 'Cover',      options: COVER_CONDITIONS,     current: cov, key: 'cover' },
          ].map(({ label, options, current, key }) => (
            <div key={key} style={{ marginBottom: '.6rem' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {options.map(opt => (
                  <button key={opt.key} title={opt.desc}
                    onClick={() => isGM && onSet({ ...conditions, [key]: opt.key })}
                    style={{ fontSize: 10, padding: '2px 6px', borderRadius: 3, cursor: isGM ? 'pointer' : 'default',
                      background: current === opt.key ? 'rgba(74,138,170,.2)' : 'var(--bg-panel)',
                      border: `1px solid ${current === opt.key ? '#4a8aaa' : 'var(--border)'}`,
                      color: current === opt.key ? '#4ab0d0' : 'var(--text-muted)', fontFamily: 'inherit' }}>
                    {opt.label}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, fontStyle: 'italic' }}>
                {options.find(o => o.key === current)?.desc}
              </div>
            </div>
          ))}
          {isGM && hasConditions && (
            <button className="btn btn-sm" style={{ marginTop: '.25rem', fontSize: 11 }}
              onClick={() => { onSet({}); }}>Clear All Conditions</button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Complication Button ───────────────────────────────────────────────────────
function ComplicationButton({ envQuirk, onSet }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');

  const COMPLICATIONS = [
    // — Tactical escalation —
    'Reinforcements arrive — roll 1d6 for count',
    'A second group of enemies flanks from the rear',
    'Sniper on the rooftop — ranged attacks from unknown direction',
    'Hostage taken — enemy holds a civilian at knifepoint',
    'Assassination target: an enemy is trying to reach a specific PC',
    'One enemy reveals a hidden weapon (upgrade their DR)',
    // — Environment —
    'Fire breaks out — spreads 1 zone per round',
    'Sandstorm reduces all visibility to 5 feet',
    'Structure becomes unstable — collapses in 3 rounds',
    'Oil spill ignites — floor becomes hazard zone',
    'Sewer grate bursts open — difficult terrain floods the area',
    'Rope bridge or walkway begins to give way',
    'Darkness falls — torches extinguished, combat in shadow',
    'Flash flood — river or channel suddenly surges',
    'Market stalls collapse — debris blocks half the battlefield',
    // — Supernatural —
    'A Jinn is drawn to the violence',
    'A minor Jinn offers a deal at a price',
    'Undead stir — a ghul crawls from the sewer',
    'A sahir witness begins casting from the crowd',
    'Cursed object on an enemy radiates fear — Fear Roll TN 15',
    'Void spike — all Void Point costs double this round',
    'Magic goes wild — next spell rolled on the wild surge table',
    // — Social / Political —
    'City Guard arrives — whose side are they on?',
    'A Caliphate official witnesses the fight — reputation consequences',
    'Press gang watching — they want recruits',
    'Merchant attempts to negotiate a cease-fire for a cut',
    'A known NPC passes through and recognizes the PCs',
    'A faction ally of one PC intervenes — briefly, at a cost',
    // — Faction complications —
    'Qabal agent emerges from shadow to observe',
    'Assassin marks the most dangerous PC',
    'Dahabi enforcer calls in a debt — demands a PC stand down',
    'Ra\'Shari caravan blocks the escape route',
    // — Narrative twists —
    'Someone important flees with something valuable',
    'Hidden trap triggers beneath a PC\'s feet',
    'An ally turns — acting on separate orders',
    'The enemy has a written message that changes context',
    'One enemy surrenders and begs for mercy',
    'A dying enemy reveals a secret with their last breath',
    'A PC\'s past connection to an enemy is revealed mid-fight',
  ];

  return (
    <div style={{ position: 'relative' }}>
      <button className="btn btn-sm"
        style={{ borderColor: envQuirk ? 'var(--red)' : 'rgba(200,150,42,.4)', color: envQuirk ? 'var(--red)' : 'var(--gold-dim)', fontSize: 12 }}
        onClick={() => { setOpen(o => !o); setText(envQuirk || ''); }}>
        <i className="ti ti-alert-triangle" style={{ fontSize: 12, marginRight: 3 }} />
        {envQuirk ? 'Edit Complication' : 'Complication'}
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: 'var(--bg-card)', border: '1px solid var(--red)', borderRadius: 6, padding: '.75rem', width: 280, zIndex: 100, boxShadow: '0 4px 20px rgba(0,0,0,.6)' }}
          onClick={e => e.stopPropagation()}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--red)', marginBottom: '.5rem', display: 'flex', justifyContent: 'space-between' }}>
            Mid-Encounter Complication
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16 }}>×</button>
          </div>
          <input value={text} onChange={e => setText(e.target.value)} placeholder="Describe the complication..." style={{ width: '100%', marginBottom: '.5rem', fontSize: 13 }} onKeyDown={e => e.key === 'Enter' && (onSet(text), setOpen(false))} autoFocus />
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: '.4rem' }}>Quick options:</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: '.5rem', maxHeight: 160, overflowY: 'auto' }}>
            {COMPLICATIONS.map(c => (
              <button key={c} onClick={() => { setText(c); }} style={{ fontSize: 11, textAlign: 'left', background: text === c ? 'rgba(200,64,48,.15)' : 'var(--bg-panel)', border: `1px solid ${text === c ? 'var(--red)' : 'var(--border)'}`, color: 'var(--text-secondary)', borderRadius: 3, padding: '3px 6px', cursor: 'pointer', fontFamily: 'inherit' }}>{c}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="btn btn-p btn-sm" style={{ flex: 1, borderColor: 'var(--red)', background: 'rgba(200,64,48,.2)', color: 'var(--red)' }} onClick={() => { onSet(text); setOpen(false); }}>Set Complication</button>
            {envQuirk && <button className="btn btn-sm" onClick={() => { onSet(''); setOpen(false); }}>Clear</button>}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Encounter Tab ────────────────────────────────────────────────────────
// ── Duel Initiator ────────────────────────────────────────────────────────────
function DuelInitiator({ combatants, pcsMap, onStart }) {
  const [open, setOpen] = useState(false);
  const [challenger, setChallenger] = useState('');
  const [defender, setDefender] = useState('');
  const list = combatants.filter(c => c.id && c.name);

  return (
    <>
      <button className="btn btn-sm" style={{ borderColor: '#9060c8', color: '#a080d8' }} onClick={() => setOpen(o => !o)}>
        ⚔ Duel
      </button>
      {open && (
        <div style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 8,
          padding: '1.25rem', zIndex: 400, minWidth: 280, boxShadow: '0 8px 40px rgba(0,0,0,.8)',
        }} onClick={e => e.stopPropagation()}>
          <div style={{ fontWeight: 700, color: 'var(--gold)', marginBottom: '.75rem', fontSize: 15 }}>⚔ Initiate Tahaddi Duel</div>
          {['Challenger', 'Defender'].map((label, i) => {
            const val = i === 0 ? challenger : defender;
            const setVal = i === 0 ? setChallenger : setDefender;
            const exclude = i === 1 ? challenger : defender;
            return (
              <div key={label} style={{ marginBottom: '.5rem' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>{label}</div>
                <select value={val} onChange={e => setVal(e.target.value)} style={{ width: '100%' }}>
                  <option value="">— Select —</option>
                  {list.filter(c => c.id !== exclude).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            );
          })}
          <div style={{ display: 'flex', gap: '.5rem', marginTop: '.75rem' }}>
            <button className="btn btn-p" style={{ flex: 1 }} disabled={!challenger || !defender} onClick={() => {
              const c = list.find(x => x.id === challenger);
              const d = list.find(x => x.id === defender);
              if (c && d) { onStart(c, d); setOpen(false); }
            }}>Begin Duel</button>
            <button className="btn" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </div>
      )}
    </>
  );
}

// ── Add Enemy mid-encounter — explicit always-visible controls ─────────────
function AddEnemy({ npcsFromLog, onAdd }) {
  const [faction, setFaction] = useState('');
  const [school, setSchool] = useState('');
  const [rank, setRank] = useState(1);
  const [count, setCount] = useState(1);
  const factions = Object.keys(NPC_BY_FACTION);
  const schools = faction ? (NPC_BY_FACTION[faction] || []) : [];

  const spawn = () => {
    if (!school) return;
    for (let i = 0; i < count; i++) {
      onAdd({
        id: 'npc_' + Date.now() + '_' + i,
        name: count > 1 ? `${school} ${i + 1}` : school,
        school, rank, faction,
        dr: rank >= 3 ? '4k2' : '3k2',
        drawnWeapon: rank >= 3 ? 'Longsword (4k2)' : 'Longsword (3k2)',
        reflexes: rank + 1, agility: rank + 1, air: rank + 1, fire: rank + 1,
        wound: 0, stance: 'Attack', statusEffects: [], type: 'npc', fromLog: false,
      });
    }
  };

  return (
    <div style={{ marginTop: '.5rem', padding: '.4rem .5rem', background: 'rgba(200,64,48,.06)', border: '1px solid rgba(200,64,48,.2)', borderRadius: 5 }}>
      <div style={{ fontSize: 10, color: '#c84030', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.4rem', fontWeight: 700 }}>
        ⚔ Spawn Enemy
      </div>
      <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={faction} onChange={e => { setFaction(e.target.value); setSchool(NPC_BY_FACTION[e.target.value]?.[0] || ''); }} style={{ fontSize: 12, flex: 1 }}>
          <option value="">Faction…</option>
          {factions.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <select value={school} onChange={e => setSchool(e.target.value)} style={{ fontSize: 12, flex: 2 }} disabled={!faction}>
          <option value="">Type…</option>
          {schools.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={rank} onChange={e => setRank(+e.target.value)} style={{ fontSize: 12, width: 52 }}>
          {[1,2,3,4,5].map(r => <option key={r} value={r}>R{r}</option>)}
        </select>
        <select value={count} onChange={e => setCount(+e.target.value)} style={{ fontSize: 12, width: 44 }}>
          {[1,2,3,4,5,6].map(n => <option key={n} value={n}>×{n}</option>)}
        </select>
        <button className="btn btn-sm btn-d" disabled={!school} onClick={spawn} style={{ flexShrink: 0 }}>+ Spawn</button>
      </div>
      {/* Log NPCs */}
      {npcsFromLog && npcsFromLog.length > 0 && (
        <div style={{ marginTop: '.35rem', display: 'flex', gap: '.3rem', flexWrap: 'wrap' }}>
          {npcsFromLog.map(n => (
            <button key={n.id} className="btn btn-sm" style={{ fontSize: 11 }} onClick={() => onAdd({
              id: 'npc_log_' + n.id + '_' + Date.now(),
              name: n.name, school: n.school, rank: n.rank || 1, faction: n.faction,
              dr: n.weapon_dr || '3k2', drawnWeapon: n.weapon || 'Longsword (3k2)',
              reflexes: n.traits?.Reflexes || (n.rank || 1) + 1,
              agility: n.traits?.Agility || (n.rank || 1) + 1,
              air: n.rings?.Air || (n.rank || 1), fire: n.rings?.Fire || (n.rank || 1),
              wound: 0, stance: 'Attack', statusEffects: [], type: 'npc', fromLog: true,
            })}>
              + {n.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function EncounterTab({ isGM, isPCView, characters, myCharId, session, encounter, setEncounter, npcsFromLog, onUpdateCharacter, onAddEncounterEntry, onLogEvent, onLogSkill, preparedEncounters = [], onSavePreparedEncounters }) {
  const { state, setup, combatants, activeTurn, dmgBanner, envQuirk, round, rollBanner } = encounter;
  const battlefieldConditions = encounter.battlefieldConditions || {};
  const [modal, setModal] = useState(null);
  const [activeNpcId, setActiveNpcId] = useState(null);
  const [view, setView] = useState('columns');
  const [compact, setCompact] = useState(false);
  // showGrid lives in encounter state so it syncs to players
  const showGrid = !!(encounter.showGrid);
  const setShowGrid = (val) => upEnc({ showGrid: typeof val === 'function' ? val(showGrid) : val });
  const [settingUrls, setSettingUrls] = useState({});
  const [customRoundLimits, setCustomRoundLimits] = useState({});
  const GRID_SIZE = 12;

  useEffect(() => {
    supabase.from('games').select('settings').eq('id', GAME_ID).single().then(({ data }) => {
      if (data?.settings?.setting_urls) setSettingUrls(data.settings.setting_urls);
      if (data?.settings?.round_limits) setCustomRoundLimits(data.settings.round_limits);
    });
  }, []); // 12×12 cells
  const [npcTargets, setNpcTargets] = useState({}); // npcId -> action
  const [targeting, setTargeting] = useState(null);
  const [popup, setPopup] = useState(null);

  const upEnc = patch => setEncounter(e => ({ ...e, ...patch }));
  const pcsMap = Object.fromEntries(characters.map(c => [c.id, c]));

  const active = combatants[activeTurn % Math.max(1, combatants.length)];
  const enemies = combatants.filter(c => c.type === 'npc');
  const party = combatants.filter(c => c.type === 'pc');
  const isMyTurn = active?.id === myCharId;

  // ── Actions ─────────────────────────────────────────────────────────────
  const beginEncounter = (s) => {
    const participantIds = s.participantIds || characters.map(c => c.id);
    const participants = characters.filter(c => participantIds.includes(c.id));
    const G = 12; // GRID_SIZE
    const centerY = Math.floor(G / 2);

    const pcCombatants = participants.map((pc, i) => {
      const col = 2;
      const row = Math.max(0, Math.min(G - 1, centerY - Math.floor(participants.length / 2) + i));
      return {
        id: pc.id, name: pc.name, type: 'pc',
        school: pc.school, faction: pc.faction,
        reflexes: pc.reflexes, agility: pc.agility, air: pc.air, fire: pc.fire,
        void: pc.void || 2, current_void: pc.current_void ?? pc.void ?? 2,
        avatar_url: pc.avatar_url || '', avatar_type: pc.avatar_type || 'warrior', avatar_color: pc.avatar_color || '#c8962a',
        wound: getWoundRank(pc.current_wounds, pc.max_wounds),
        stance: 'Attack',
        init: (pc.reflexes || 2) * 2 + Math.floor(Math.random() * 8) + 6,
        dr: pc.current_weapon?.match(/\((\dk\d)\)/)?.[1] || '3k2',
        drawnWeapon: pc.current_weapon || 'Unarmed (1k1)',
        statusEffects: [], _action: null,
        gridX: col, gridY: row, startX: col, startY: row,
      };
    });

    const npcList = s.selectedNPCs || [];
    const npcCombatants = npcList.map((n, i) => {
      const col = G - 3;
      const row = Math.max(0, Math.min(G - 1, centerY - Math.floor(npcList.length / 2) + i));
      return {
        ...n, wound: n.wound || 0, stance: 'Attack',
        init: Math.floor(Math.random() * 10) + 4 + (n.rank || 1),
        statusEffects: [], _action: null,
        gridX: col, gridY: row, startX: col, startY: row,
      };
    });

    const all = [...pcCombatants, ...npcCombatants].sort((a, b) => b.init - a.init);
    upEnc({ state: 'active', setup: s, combatants: all, activeTurn: 0, round: 1, dmgBanner: null, envQuirk: null });
    setNpcTargets({});
  };

  const advanceTurn = () => {
    const nextIdx = (activeTurn + 1) % combatants.length;
    const isNewRound = nextIdx === 0;
    const newRound = isNewRound ? (round || 1) + 1 : round || 1;
    let nextCombatants = combatants.map((c, i) => {
      let updated = i === nextIdx ? { ...c, _actionsLeft: { full: 1, simple: 2 } } : c;
      // On round change: apply pending init boosts and clear per-round void flags
      if (isNewRound) {
        updated = {
          ...updated,
          voidArmor: false,
          ...(updated.pendingInitBoost ? { init: (updated.init || 0) + (updated.pendingInitBoost || 0), pendingInitBoost: null } : {}),
        };
      }
      return updated;
    });
    // Re-sort by initiative at round change
    if (isNewRound) {
      nextCombatants = [...nextCombatants].sort((a, b) => (b.init || 0) - (a.init || 0));
    }
    upEnc({ activeTurn: isNewRound ? 0 : nextIdx, round: newRound, dmgBanner: null, combatants: nextCombatants });
    setTargeting(null);
  };

  const stepBackTurn = () => {
    if (combatants.length === 0) return;
    const prevIdx = activeTurn === 0 ? combatants.length - 1 : activeTurn - 1;
    const isNewRound = activeTurn === 0 && (round || 1) > 1;
    const newRound = isNewRound ? (round || 1) - 1 : round || 1;
    upEnc({ activeTurn: prevIdx, round: newRound, dmgBanner: null });
    setTargeting(null);
  };

  // Spend void for defensive options (available outside of turn)
  const handleVoidDefense = (combatantId, type) => {
    const c = combatants.find(x => x.id === combatantId);
    if (!c || (c.current_void || 0) <= 0) return;
    const newVoid = (c.current_void || 0) - 1;
    const patch = { current_void: newVoid };
    if (type === 'armor') patch.voidArmor = true;
    if (type === 'damage') patch.voidReduceDamage = true;
    if (type === 'initiative') patch.pendingInitBoost = 10;
    upEnc({ combatants: combatants.map(x => x.id === combatantId ? { ...x, ...patch } : x) });
    // Sync to DB
    const pc = pcsMap[combatantId];
    if (pc) onUpdateCharacter(combatantId, { current_void: newVoid });
  };

  // Spend an action for the active combatant; auto-advance if spent
  const spendAction = (type = 'full') => {
    const c = combatants[activeTurn];
    if (!c) return;
    const actions = c._actionsLeft || { full: 1, simple: 2 };
    let next;
    if (type === 'full') {
      next = { full: 0, simple: 0 };
    } else {
      const remaining = Math.max(0, (actions.simple || 2) - 1);
      next = { ...actions, simple: remaining };
      if (remaining <= 0) next.full = 0;
    }
    const newCombatants = combatants.map((x, i) => i === activeTurn ? { ...x, _actionsLeft: next } : x);
    upEnc({ combatants: newCombatants });
    // Player manually passes turn with the Pass Turn button — no auto-advance
  };

  const WOUND_LABELS  = ['Healthy','Nicked','Grazed','Hurt','Injured','Crippled','Down','Out'];
  const WOUND_COLORS  = ['#4a8a40','#8a8a30','#a87830','#c86030','#c84030','#a02828','#801818','#600010'];
  const WOUND_PENALTY = ['+0 TN','+3 TN','+5 TN','+10 TN','+15 TN','+20 TN','+40 TN','Incapacitated'];

  const makeWoundBanner = (combatant, newWound) => {
    const pc = pcsMap[combatant.id];
    return {
      type: 'wound',
      charName: combatant.name,
      avatarUrl: (pc?.avatar_url || combatant.avatar_url || '').trim(),
      avatarColor: pc?.avatar_color || combatant.avatar_color || '#c8962a',
      label: WOUND_LABELS[newWound] || 'Unknown',
      sublabel: newWound > 0 ? `Wound Penalty ${WOUND_PENALTY[newWound]}` : 'Back to Healthy',
      color: WOUND_COLORS[newWound] || '#4a8a40',
      ts: Date.now(),
    };
  };

  const applyStatus = (id, effect) => {
    const c = combatants.find(x => x.id === id);
    upEnc({
      combatants: combatants.map(x => x.id === id ? { ...x, statusEffects: [...(x.statusEffects || []).filter(e => e !== effect), effect] } : x),
      ...(c?.type === 'pc' ? { statusBanner: {
        type: 'condition',
        charName: c.name,
        avatarUrl: (pcsMap[id]?.avatar_url || c.avatar_url || '').trim(),
        avatarColor: pcsMap[id]?.avatar_color || c.avatar_color || '#c8962a',
        label: effect.toUpperCase(),
        sublabel: null,
        color: '#c8782a',
        ts: Date.now(),
      }} : {}),
    });
    if (c?.type === 'pc') setTimeout(() => upEnc({ statusBanner: null }), 4000);
  };

  const removeStatus = (id, effect) => {
    upEnc({ combatants: combatants.map(c => c.id === id ? { ...c, statusEffects: (c.statusEffects || []).filter(e => e !== effect) } : c) });
  };

  const gmWound = (id, delta) => {
    const c = combatants.find(x => x.id === id);
    if (!c) return;
    const newWound = Math.max(0, Math.min(7, c.wound + delta));
    if (delta > 0) playDamage();
    const extra = (c.type === 'pc' && delta > 0 && newWound !== c.wound)
      ? { statusBanner: makeWoundBanner(c, newWound) }
      : {};
    upEnc({ combatants: combatants.map(x => x.id === id ? { ...x, wound: newWound } : x), ...extra });
    if (extra.statusBanner) setTimeout(() => upEnc({ statusBanner: null }), 4000);
    if (c.type === 'pc') {
      const pc = pcsMap[id];
      if (pc) {
        const woundMap = [0, pc.max_wounds * 0.1, pc.max_wounds * 0.2, pc.max_wounds * 0.35, pc.max_wounds * 0.55, pc.max_wounds * 0.75, pc.max_wounds * 0.9, pc.max_wounds];
        onUpdateCharacter(id, { current_wounds: Math.round(woundMap[newWound] || 0) });
      }
    }
  };

  const handleRollResult = (result, damage) => {
    setModal(null);
    // Track skill usage
    if (modal?.skill && onLogSkill) onLogSkill(modal.skill);

    // Broadcast result to all players via encounter state
    const banner = {
      charName: modal?.character?.name || active?.name || '',
      skillName: modal?.skill || 'Roll',
      total: result?.total ?? result,
      tn: modal?.tn,
      success: result?.success ?? (typeof result === 'number' ? result >= (modal?.tn || 15) : false),
      ts: Date.now(),
    };
    if (damage !== null && damage !== undefined && modal?.targetId) {
      playDamage();
      const target = combatants.find(c => c.id === modal.targetId);
      // Apply void damage reduction if player spent void for it
      let woundDelta = Math.ceil(damage / 5);
      if (target?.voidReduceDamage && target?.type === 'pc') {
        const voidRing = target.void || pcsMap[target.id]?.void || 2;
        woundDelta = Math.max(0, woundDelta - voidRing);
      }
      const newWound = target ? Math.min(7, (target.wound || 0) + woundDelta) : 0;
      const WOUND_LABELS = ['Healthy','Nicked','Grazed','Hurt','Injured','Crippled','Down','Out'];
      const woundChanged = target && woundDelta > 0 && newWound !== target.wound;
      const sb = (woundChanged && target.type === 'pc') ? makeWoundBanner(target, newWound) : null;

      // For NPC targets — add damage info to the success banner itself
      const bannerWithDmg = target?.type === 'npc' ? {
        ...banner,
        damage,
        targetName: target.name,
        newWoundLabel: woundChanged ? WOUND_LABELS[newWound] : null,
        oldWoundLabel: woundChanged ? WOUND_LABELS[target.wound || 0] : null,
      } : banner;

      upEnc({
        combatants: combatants.map(c => c.id === modal.targetId
          ? { ...c, wound: Math.min(7, c.wound + woundDelta), voidReduceDamage: false }
          : c),
        dmgBanner: { attackerName: active?.name, targetId: modal.targetId, damage, result: result?.total ?? result },
        rollBanner: bannerWithDmg,
        ...(sb ? { statusBanner: sb } : {}),
      });
      if (sb) setTimeout(() => upEnc({ statusBanner: null }), 4000);
    } else {
      upEnc({ rollBanner: banner });
    }
    // Auto-clear banner after 5 seconds
    setTimeout(() => upEnc({ rollBanner: null }), 5000);

    // Spend void if used
    if (result?.usedVoid && active?.type === 'pc') {
      const pc = pcsMap[active.id];
      if (pc) onUpdateCharacter(active.id, { current_void: Math.max(0, (pc.current_void || 0) - 1) });
    }

    // Auto-track Stealth and Perception rolls as persistent status conditions
    const skillName = modal?.skill || '';
    const rollTotal = result?.total ?? (typeof result === 'number' ? result : null);
    if (rollTotal !== null && (skillName === 'Stealth' || skillName.startsWith('Perception'))) {
      const label = `${skillName}: ${rollTotal}`;
      const targetId = modal?.combatantId || active?.id;
      if (targetId) {
        upEnc({
          combatants: combatants.map(c => {
            if (c.id !== targetId) return c;
            // Remove any previous Stealth/Perception status, replace with new
            const filtered = (c.statusEffects || []).filter(e => !e.startsWith(skillName + ':'));
            return { ...c, statusEffects: [...filtered, label] };
          }),
        });
      }
    }

    // Apply maneuver effects from raises
    if (result?.success && result?.raises?.length > 0 && modal?.targetId) {
      const maneuvers = result.raises;
      const RAISE_COST = { Knockdown: 1, Feint: 1, Disarm: 2, Stun: 2, 'Extra Attack': 5, 'Called Shot': 1 };

      // Count how many raises were declared
      const totalRaises = result.raises.length;

      // Check which maneuvers are affordable given raises
      let raisesSpent = 0;
      const effects = [];

      maneuvers.forEach(m => {
        const cost = RAISE_COST[m] || 1;
        if (raisesSpent + cost <= totalRaises) {
          raisesSpent += cost;
          effects.push(m);
        }
      });

      if (effects.length > 0) {
        let newCombatants = [...combatants];

        effects.forEach(effect => {
          if (effect === 'Knockdown') {
            newCombatants = newCombatants.map(c => c.id === modal.targetId
              ? { ...c, statusEffects: [...(c.statusEffects || []).filter(e => e !== 'Prone'), 'Prone'] }
              : c);
            onLogEvent && onLogEvent('ti-arrow-down', `Knockdown — ${modal?.character?.name || 'Attacker'} knocks ${modal.targetName || 'target'} Prone`);
          }
          if (effect === 'Stun') {
            newCombatants = newCombatants.map(c => c.id === modal.targetId
              ? { ...c, statusEffects: [...(c.statusEffects || []).filter(e => e !== 'Stunned'), 'Stunned'] }
              : c);
            onLogEvent && onLogEvent('ti-circle-x', `Stun — ${modal.targetName || 'target'} loses their next action`);
          }
          if (effect === 'Feint') {
            newCombatants = newCombatants.map(c => c.id === modal.targetId
              ? { ...c, statusEffects: [...(c.statusEffects || []).filter(e => e !== 'Feinted'), 'Feinted'] }
              : c);
            onLogEvent && onLogEvent('ti-eye-off', `Feint — ${modal.targetName || 'target'} loses Reflexes bonus to Armor TN until next attack`);
          }
          if (effect === 'Disarm') {
            newCombatants = newCombatants.map(c => c.id === modal.targetId
              ? { ...c, drawnWeapon: null, statusEffects: [...(c.statusEffects || []).filter(e => e !== 'Disarmed'), 'Disarmed'] }
              : c);
            onLogEvent && onLogEvent('ti-sword-off', `Disarm — ${modal.targetName || 'target'} is disarmed`);
          }
          if (effect === 'Extra Attack') {
            // Grant attacker an extra full action
            const attackerId = modal?.combatantId || active?.id;
            if (attackerId) {
              newCombatants = newCombatants.map((c, i) => i === activeTurn
                ? { ...c, _actionsLeft: { ...(c._actionsLeft || { full: 0, simple: 0 }), full: (c._actionsLeft?.full || 0) + 1 } }
                : c);
              onLogEvent && onLogEvent('ti-sword', `Extra Attack — ${modal?.character?.name || 'Attacker'} may make an additional attack!`);
            }
          }
        });

        upEnc({ combatants: newCombatants });
      }
    }

    // Fire onComplete callback if present (e.g. Full Defense stance change after roll)
    if (modal?.onComplete) modal.onComplete(result?.total ?? result);
  };

  const handleStanceChange = (id, stance, fullDefenseBonus) => {
    upEnc({ combatants: combatants.map(c => c.id === id
      ? { ...c, stance, fullDefenseBonus: stance === 'Full Defense' ? (fullDefenseBonus ?? 10) : undefined }
      : c
    ) });
  };

  const handleDrawWeapon = (id, weapon) => {
    const dr = weapon.match(/\((\dk\d)\)/)?.[1] || '3k2';
    upEnc({ combatants: combatants.map(c => c.id === id ? { ...c, drawnWeapon: weapon, dr } : c) });
    if (pcsMap[id]) onUpdateCharacter(id, { current_weapon: weapon });
  };

  const handleSetNPCAction = (npcId, action) => {
    setNpcTargets(p => ({ ...p, [npcId]: action }));
    if (action === 'Attack') setTargeting(npcId);
    else setTargeting(null);
  };

  const handleNPCAttack = (npcId, targetId) => {
    const npc = combatants.find(c => c.id === npcId);
    const dice = rollN(3).sort((a, b) => b - a);
    const kept = dice.slice(0, 2);
    const dmg = kept.reduce((s, d) => s + d, 0);
    playDamage();
    upEnc({
      combatants: combatants.map(c => c.id === targetId ? { ...c, wound: Math.min(7, c.wound + Math.ceil(dmg / 5)) } : c),
      dmgBanner: { attackerName: npc?.name, targetId, damage: dmg },
    });
    if (pcsMap[targetId]) {
      const pc = pcsMap[targetId];
      onUpdateCharacter(targetId, { current_wounds: Math.min(pc.max_wounds, pc.current_wounds + dmg) });
    }
    setTargeting(null);
    setNpcTargets(p => ({ ...p, [npcId]: null }));
  };

  const endEncounter = async () => {
    const lastNPCs = combatants.filter(c => c.type === 'npc');
    const entry = {
      session_id: session?.id || null,
      name: setup.name || `Session ${session?.session_number || '?'} — ${setup.setting} — ${setup.type}`,
      encounter_name: setup.name || '',
      description: setup.desc || '',
      setting: setup.setting,
      encounter_type: setup.type,
      party_members: characters.map(c => ({ id: c.id, name: c.name })),
      enemies: enemies.map(e => ({ name: e.name, school: e.school, rank: e.rank })),
      rounds: round || 1,
      env_quirk: envQuirk || null,
    };
    if (onAddEncounterEntry) await onAddEncounterEntry(entry);
    upEnc({ state: 'idle', combatants: [], activeTurn: 0, round: 1, dmgBanner: null, envQuirk: null, lastEncounterNPCs: lastNPCs });
    setNpcTargets({});
    setTargeting(null);
  };

  // ── Idle state — show party cards, GM can grant actions ──────────────────
  if (state === 'idle') {
    const grantedActions = encounter.grantedActions || {};

    return (
      <div>
        {/* GM action modal */}
        {modal && (
          <DiceModal context={modal} onClose={() => setModal(null)} onResult={() => setModal(null)} onLogEvent={onLogEvent} />
        )}

        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          {/* ── Left: party cards + NPC scene + start button ── */}
          <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: '.75rem', textAlign: 'center', fontStyle: 'italic' }}>
            {session ? 'No encounter active — downtime / between scenes' : 'No session active'}
          </div>

          {isGM && !isPCView && session && characters.length >= 2 && (
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <DuelInitiator
                combatants={characters.map(c => ({ ...c, type: 'pc' }))}
                pcsMap={pcsMap}
                onStart={(challenger, defender) => {
                  const makeSide = (c) => ({
                    id: c.id, name: c.name, school: c.school || '',
                    avatarUrl: (c.avatar_url || '').trim(),
                    avatarColor: c.avatar_color || '#c8962a',
                    avatarType: c.avatar_type || 'warrior',
                    void: c.void || 2, reflexes: c.reflexes || 2, skills: c.skills || [],
                  });
                  upEnc({ duelState: {
                    phase: 'assessment', challenger: makeSide(challenger), defender: makeSide(defender),
                    assessmentRolls: {}, focusInputs: { challenger: { raises: 0, void: 0 }, defender: { raises: 0, void: 0 } },
                    focusRevealed: false, strikeRolls: {}, winner: null,
                  }});
                }}
              />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                Initiate a Tahaddi duel outside combat — blocks all players until resolved
              </div>
            </div>
          )}

          {characters.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14, padding: '2rem' }}>No characters created yet.</div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.75rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
              {characters.map(c => (
                <PartyCard key={c.id} c={c} pcsMap={pcsMap} myCharId={myCharId}
                  isGM={isGM} isPCView={isPCView} grantedActions={grantedActions}
                  combatants={combatants} onUpdateCharacter={onUpdateCharacter} upEnc={upEnc} />
              ))}
            </div>
          )}
        </div>

        {/* NPCs present during downtime — lingering from the last encounter, or added manually by the GM */}
        {((isGM && !isPCView) || (encounter.lastEncounterNPCs || []).length > 0) && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '.6rem' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em' }}>NPCs Present</span>
            </div>
            {(encounter.lastEncounterNPCs || []).length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.6rem', justifyContent: 'center', marginBottom: (isGM && !isPCView) ? '.75rem' : 0 }}>
                {encounter.lastEncounterNPCs.map((n, i) => {
                  const wColor = ['#4a8a40','#8a8a30','#a87830','#c86030','#c84030','#a02828','#801818','#600010'][n.wound] || '#4a8a40';
                  const wLabel = ['Healthy','Nicked','Grazed','Hurt','Injured','Crippled','Down','Out'][n.wound] || 'Healthy';
                  return (
                    <div key={n.id || i}
                      onClick={() => { if (isGM && !isPCView) setActiveNpcId(prev => prev === n.id ? null : n.id); }}
                      style={{
                        position: 'relative', background: 'var(--bg-panel)',
                        border: `1px solid ${activeNpcId === n.id ? 'var(--gold)' : 'var(--border)'}`,
                        borderLeft: `3px solid ${wColor}`, borderRadius: 6, padding: '.6rem .75rem', minWidth: 140,
                        cursor: (isGM && !isPCView) ? 'pointer' : 'default',
                        boxShadow: activeNpcId === n.id ? '0 0 10px rgba(200,150,42,.3)' : 'none',
                      }}>
                      {isGM && !isPCView && (
                        <button onClick={(e) => { e.stopPropagation(); upEnc({ lastEncounterNPCs: encounter.lastEncounterNPCs.filter((_, j) => j !== i) }); if (activeNpcId === n.id) setActiveNpcId(null); }}
                          style={{ position: 'absolute', top: 2, right: 4, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, padding: 2, lineHeight: 1 }}>×</button>
                      )}
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', paddingRight: 12 }}>{n.name}</div>
                      <div style={{ fontSize: 10, color: wColor }}>{wLabel}</div>
                    </div>
                  );
                })}
              </div>
            )}
            {isGM && !isPCView && (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <NPCPicker npcsFromLog={npcsFromLog} label="Add NPC to Scene"
                  onAdd={npc => upEnc({ lastEncounterNPCs: [...(encounter.lastEncounterNPCs || []), { ...npc, wound: 0 }] })} />
              </div>
            )}
          </div>
        )}

        {/* GM start encounter button */}
        {isGM && !isPCView && session && (
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <button className="btn btn-p btn-lg" onClick={() => upEnc({ state: 'setup', setup: { type: null, setting: null, desc: '', name: '', selectedNPCs: encounter.lastEncounterNPCs || [], participantIds: null } })}>
              <i className="ti ti-swords" style={{ marginRight: 6 }} /> Start Encounter
            </button>
            {(encounter.lastEncounterNPCs || []).length > 0 && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: '.4rem' }}>
                {encounter.lastEncounterNPCs.length} NPC{encounter.lastEncounterNPCs.length > 1 ? 's' : ''} present will carry into the new encounter
              </div>
            )}
          </div>
        )}
        {!session && isGM && !isPCView && (
          <div style={{ textAlign: 'center', fontSize: 14, color: 'var(--red)', marginTop: '.5rem' }}>Start a session first</div>
        )}

        {/* Player action panel — always available between encounters */}
        {!isGM && myCharId && (() => {
          const myChar = characters.find(c => c.id === myCharId);
          if (!myChar) return null;
          const fakeCombatant = { id: myChar.id, name: myChar.name, type: 'pc', stance: myChar.current_stance || 'Attack', drawnWeapon: myChar.current_weapon || null, dr: '3k2', current_void: myChar.current_void };
          return (
            <PCTurnPanel
              combatant={fakeCombatant}
              character={myChar}
              enemies={[]}
              allies={[]}
              onRoll={ctx => setModal({ ...ctx, character: myChar })}
              onStanceChange={(stance) => {
                onUpdateCharacter(myChar.id, { current_stance: stance });
              }}
              onDrawWeapon={() => {}}
              onPass={null}
            />
          );
        })()}

        {/* Granted action roll panel — GM-granted extra actions */}
        {(() => {
          const myGranted = grantedActions[myCharId] || 0;
          const myChar = myCharId ? characters.find(c => c.id === myCharId) : null;
          if (!myGranted || !myChar) return null;
          const fakeCombatant = { id: myChar.id, name: myChar.name, type: 'pc', stance: 'Attack', drawnWeapon: null, dr: '3k2', current_void: myChar.current_void };
          return (
            <PCTurnPanel
              combatant={fakeCombatant}
              character={myChar}
              enemies={[]}
              onRoll={ctx => setModal({ ...ctx, character: myChar })}
              onStanceChange={() => {}}
              onDrawWeapon={() => {}}
              onPass={() => upEnc({ grantedActions: { ...grantedActions, [myCharId]: Math.max(0, myGranted - 1) } })}
            />
          );
        })()}

        {/* NPC action panel */}
        {isGM && !isPCView && activeNpcId && (() => {
          const npc = (encounter.lastEncounterNPCs || []).find(n => n.id === activeNpcId);
          if (!npc) return null;
          const updateThisNpc = patch => upEnc({ lastEncounterNPCs: encounter.lastEncounterNPCs.map(n => n.id === activeNpcId ? { ...n, ...patch } : n) });
          return (
            <PCTurnPanel
              combatant={npc}
              character={null}
              enemies={characters}
              isNPCTurn
              onRoll={ctx => setModal(ctx)}
              onStanceChange={(stance) => updateThisNpc({ stance })}
              onDrawWeapon={(weapon) => updateThisNpc({ drawnWeapon: weapon })}
              onPass={() => setActiveNpcId(null)}
            />
          );
        })()}
      </div>

      {/* ── Prepared encounters for this session — shown below as cards ── */}
      {isGM && !isPCView && preparedEncounters.length > 0 && (
        <div style={{ maxWidth: 900, margin: '1rem auto 0' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.5rem', fontWeight: 600 }}>
            <i className="ti ti-list" style={{ marginRight: 4 }} />Session Prep
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
            {preparedEncounters.map(p => (
              <div key={p.id} style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 6, padding: '.5rem .6rem', minWidth: 150 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{p.name}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: '.35rem' }}>{p.setting} · {p.type}{p.npcs?.length ? ` · ${p.npcs.length} NPCs` : ''}</div>
                <button className="btn btn-sm btn-p" style={{ width: '100%', fontSize: 10 }} onClick={() => upEnc({
                  state: 'setup',
                  setup: { type: p.type || null, setting: p.setting || null, desc: p.notes || '', name: p.name || '', selectedNPCs: p.npcs || [], participantIds: null }
                })}>
                  Load & Start →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
    );
  }

  // ── Setup state ──────────────────────────────────────────────────────────
  if (state === 'setup') {
    return (
      <EncounterBuilder
        mode="live"
        initialSetup={setup}
        npcsFromLog={npcsFromLog}
        characters={characters}
        sessionNumber={session?.session_number}
        preparedEncounters={preparedEncounters}
        customRoundLimits={customRoundLimits}
        onCancel={() => upEnc({ state: 'idle' })}
        onCommit={(s) => beginEncounter(s)}
      />
    );
  }

  // ── Active state ─────────────────────────────────────────────────────────
  const roundLimit = (() => {
    const custom = customRoundLimits[setup.type];
    if (custom !== undefined && custom !== '') return +custom || null;
    return ROUND_LIMITS[setup.type];
  })();

  return (
    <div style={{ paddingBottom: isMyTurn ? 260 : 0 }}>
      {modal && (
        <DiceModal
          context={modal}
          onClose={() => setModal(null)}
          onResult={handleRollResult}
          onLogEvent={onLogEvent}
        />
      )}

      {/* Turn banner */}
      <div className="turn-banner">
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Round {round || 1} — Active</div>
          <div className="turn-name">{active?.name || '—'}</div>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{setup.name}</div>
        {/* Void button */}
        <VoidButton />
        {/* View toggle — mutually exclusive */}
        <div className="layer-tog">
          <button className={`layer-btn ${view === 'columns' ? 'active' : ''}`} onClick={() => setView('columns')}>Columns</button>
          <button className={`layer-btn ${view === 'initiative' ? 'active' : ''}`} onClick={() => setView('initiative')}>List</button>
        </div>
        {/* Independent display toggles — visually separated to show they're not part of the view-mode group */}
        <div className="layer-tog" style={{ marginLeft: 10 }}>
          <button className={`layer-btn ${compact ? 'active' : ''}`} onClick={() => setCompact(c => !c)}>Compact</button>
          {(isGM && !isPCView) && (
            <button className={`layer-btn ${showGrid ? 'active' : ''}`} onClick={() => setShowGrid(g => !g)}>Grid</button>
          )}
        </div>
        {(isGM && !isPCView) && (
          <>
            <BattlefieldConditionsPanel
              conditions={battlefieldConditions}
              onSet={(conds) => { upEnc({ battlefieldConditions: conds }); onLogEvent && onLogEvent('ti-map-2', `Battlefield: ${Object.entries(conds).filter(([,v])=>v&&v!=='clear'&&v!=='none').map(([k,v])=>`${k}: ${v}`).join(', ') || 'conditions cleared'}`); }}
              isGM={isGM && !isPCView}
            />
            <ComplicationButton envQuirk={envQuirk} onSet={(text) => { upEnc({ envQuirk: text || null }); if (text) onLogEvent && onLogEvent('ti-alert-triangle', `Complication: ${text}`); }} />
            <DuelInitiator combatants={combatants} pcsMap={pcsMap} onStart={(challenger, defender) => {
              const makeSide = (c) => ({
                id: c.id, name: c.name, school: c.school || '',
                avatarUrl: (pcsMap[c.id]?.avatar_url || c.avatar_url || '').trim(),
                avatarColor: pcsMap[c.id]?.avatar_color || c.avatar_color || '#c8962a',
                avatarType: pcsMap[c.id]?.avatar_type || c.avatar_type || 'warrior',
                void: pcsMap[c.id]?.void || c.void || 2,
                reflexes: pcsMap[c.id]?.reflexes || c.reflexes || 2,
                skills: pcsMap[c.id]?.skills || c.skills || [],
              });
              upEnc({ duelState: {
                phase: 'assessment', challenger: makeSide(challenger), defender: makeSide(defender),
                assessmentRolls: {}, focusInputs: { challenger: { raises: 0, void: 0 }, defender: { raises: 0, void: 0 } },
                focusRevealed: false, strikeRolls: {}, winner: null,
              }});
            }} />
            <button className="btn btn-sm" onClick={stepBackTurn} title="Step back one turn (GM correction)">← Back</button>
            <button className="btn btn-p btn-sm" onClick={advanceTurn}>End Turn →</button>
            <button className="btn btn-sm btn-d" onClick={endEncounter}>End Encounter</button>
          </>
        )}
      </div>

      {/* Round limit warning */}
      {roundLimit && (round || 1) >= roundLimit - 1 && (
        <div className={`round-warn ${(round || 1) >= roundLimit ? 'danger' : 'warn'}`}>
          <i className={`ti ${(round || 1) >= roundLimit ? 'ti-flag' : 'ti-alert-triangle'}`} />
          {(round || 1) >= roundLimit
            ? `Round limit reached (${roundLimit} rounds). Resolve narratively.`
            : `Round ${round} of ${roundLimit} — final round approaching.`}
        </div>
      )}

      {/* Battlefield conditions banner */}
      {(() => {
        const bc = encounter.battlefieldConditions || {};
        const active = Object.entries(bc).filter(([,v]) => v && v !== 'clear' && v !== 'none');
        if (active.length === 0) return null;
        const vis = VISIBILITY_CONDITIONS.find(v => v.key === bc.visibility);
        const ter = TERRAIN_CONDITIONS.find(t => t.key === bc.terrain);
        const cov = COVER_CONDITIONS.find(c => c.key === bc.cover);
        return (
          <div className="env-banner" style={{ borderColor: '#4a8aaa', background: 'rgba(74,138,170,.08)' }}>
            <i className="ti ti-map-2" style={{ color: '#4ab0d0', fontSize: 15 }} />
            <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
              {vis && bc.visibility !== 'clear' && <span style={{ fontSize: 12 }}><strong style={{ color: '#4ab0d0' }}>Visibility:</strong> {vis.label} — {vis.desc}</span>}
              {ter && bc.terrain !== 'clear' && <span style={{ fontSize: 12 }}><strong style={{ color: '#4ab0d0' }}>Terrain:</strong> {ter.label} — {ter.desc}</span>}
              {cov && bc.cover !== 'none' && <span style={{ fontSize: 12 }}><strong style={{ color: '#4ab0d0' }}>Cover:</strong> {cov.label} — {cov.desc}</span>}
            </div>
          </div>
        );
      })()}

      {/* Env quirk */}
      {envQuirk && (
        <div className="env-banner">
          <i className="ti ti-map-pin" style={{ color: 'var(--gold)', fontSize: 16 }} />
          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Environment: </span>
          <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic', flex: 1 }}>{envQuirk}</span>
        </div>
      )}

      {/* Scene description */}
      {setup.desc && (
        <div className="card" style={{ marginBottom: '.75rem', borderColor: 'var(--gold-dim)', padding: '.6rem .75rem' }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic' }}>{setup.desc}</div>
        </div>
      )}

      {/* Damage banner */}
      {dmgBanner && (
        <div className="dmg-banner">
          <i className="ti ti-sword" style={{ color: 'var(--red)' }} />
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{dmgBanner.attackerName}</span>
          <span style={{ color: 'var(--text-muted)' }}>deals</span>
          <span style={{ color: 'var(--red)', fontWeight: 700, fontSize: 18 }}>{dmgBanner.damage} wounds</span>
          <span style={{ color: 'var(--text-muted)' }}>to {combatants.find(c => c.id === dmgBanner.targetId)?.name || 'target'}</span>
        </div>
      )}

      {/* Two column view */}
      {view === 'columns' && (
        <div style={{ display: 'grid', gridTemplateColumns: showGrid ? '1fr auto 1fr' : '1fr 1fr', gap: '1rem', marginBottom: '1rem', alignItems: 'start' }}>
          {/* Party */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6aba60', textTransform: 'uppercase', letterSpacing: '.1em', paddingBottom: '.4rem', borderBottom: '2px solid #4a8a40', marginBottom: '.5rem', display: 'flex', alignItems: 'center', gap: 5 }}>
              <i className="ti ti-shield" style={{ fontSize: 13 }} /> Party ({party.length})
            </div>
            {party.map(c => (
              <CombatantCard key={c.id} c={c}
                isActive={c.id === active?.id}
                isGM={isGM} isPCView={isPCView}
                myCharId={myCharId} pcs={pcsMap}
                onGMWound={gmWound}
                onApplyStatus={applyStatus}
                onRemoveStatus={removeStatus}
                targeting={null}
                onSetTarget={null}
                compact={compact}
                onVoidDefense={handleVoidDefense}
              />
            ))}
          </div>

          {/* Battle Grid — centre column, GM toggle only */}
          {showGrid && (
            <BattleGrid
              combatants={combatants}
              active={active}
              pcsMap={pcsMap}
              gridSize={GRID_SIZE}
              isGM={isGM && !isPCView}
              myCharId={myCharId}
              isMyTurn={isMyTurn}
              settingBg={setup.bgUrl || settingUrls[setup.setting] || null}
              onMove={(id, x, y) => {
                upEnc({ combatants: combatants.map(c => {
                  if (c.id !== id) return c;
                  // Save starting position on first placement
                  const isFirstPlace = c.gridX === undefined;
                  return { ...c, gridX: x, gridY: y, ...(isFirstPlace ? { startX: x, startY: y } : {}) };
                })});
              }}
              onClearGrid={() => {
                upEnc({ combatants: combatants.map(c => ({
                  ...c,
                  gridX: c.startX !== undefined ? c.startX : undefined,
                  gridY: c.startY !== undefined ? c.startY : undefined,
                }))});
              }}
              onShift={(dx, dy) => {
                upEnc({
                  combatants: combatants.map(c => {
                    if (c.gridX === undefined || c.gridY === undefined) return c;
                    const nx = c.gridX + dx;
                    const ny = c.gridY + dy;
                    if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) {
                      return { ...c, gridX: undefined, gridY: undefined };
                    }
                    return { ...c, gridX: nx, gridY: ny };
                  })
                });
              }}
            />
          )}

          {/* Enemies */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#c84030', textTransform: 'uppercase', letterSpacing: '.1em', paddingBottom: '.4rem', borderBottom: '2px solid #8a3030', marginBottom: '.5rem', display: 'flex', alignItems: 'center', gap: 5 }}>
              <i className="ti ti-skull" style={{ fontSize: 13 }} /> Enemies ({enemies.length})
            </div>
            {enemies.length === 0 && <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', padding: '.5rem' }}>No enemies</div>}
            {enemies.map(c => (
              <CombatantCard key={c.id} c={c}
                isActive={c.id === active?.id}
                isGM={isGM} isPCView={isPCView}
                myCharId={myCharId} pcs={pcsMap}
                onGMWound={gmWound}
                onApplyStatus={applyStatus}
                onRemoveStatus={removeStatus}
                targeting={targeting}
                compact={compact}
                onSetTarget={(npcId, action) => {
                  handleSetNPCAction(npcId, action);
                  if (action === 'Attack') setTargeting(npcId);
                }}
              />
            ))}
            {/* NPC attack target selection */}
            {targeting && isGM && !isPCView && (
              <div style={{ padding: '.5rem', background: 'rgba(200,64,48,.08)', border: '1px solid var(--red-dim)', borderRadius: 5, marginTop: '.4rem' }}>
                <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: '.3rem' }}>▼ Select target to attack:</div>
                <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap' }}>
                  {party.map(t => (
                    <button key={t.id} className="btn btn-sm btn-d" onClick={() => handleNPCAttack(targeting, t.id)}>
                      ⚔ {t.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/* Reinforce mid-encounter */}
            {isGM && !isPCView && (
              <AddEnemy npcsFromLog={npcsFromLog} onAdd={npc => {
                const nc = { ...npc, wound: 0, stance: 'Attack', init: Math.floor(Math.random() * 6) + (npc.reflexes || 3), statusEffects: [], _action: null };
                upEnc({ combatants: [...combatants, nc].sort((a, b) => b.init - a.init) });
              }} />
            )}
          </div>
        </div>
      )}

      {/* Initiative order view */}
      {view === 'initiative' && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="card-title">Initiative Order — Round {round || 1}</div>
          {combatants.map((c, i) => (
            <div key={c.id} style={{
              display: 'flex', alignItems: 'center', gap: '.6rem', padding: '.4rem .5rem', borderRadius: 4,
              background: i === activeTurn % combatants.length ? 'rgba(200,150,42,.1)' : 'transparent',
              border: `1px solid ${i === activeTurn % combatants.length ? 'var(--gold-dim)' : 'transparent'}`,
              marginBottom: 2
            }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 16, textAlign: 'right' }}>{i + 1}</span>
              <Silhouette type={getArchetype(c.school) || 'warrior'} size={16} />
              <span style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)' }}>{c.name}</span>
              <WoundBadge rank={c.wound} />
              <span className="stance-badge" style={{ fontSize: 10 }}>{c.stance === 'Full Attack' ? 'F.Atk' : c.stance === 'Full Defense' ? 'F.Def' : c.stance}</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--gold)', width: 24, textAlign: 'right' }}>{c.init}</span>
              {isGM && !isPCView && (
                <div style={{ display: 'flex', gap: 2 }}>
                  <button className="btn btn-sm btn-d" style={{ padding: '1px 4px', fontSize: 11 }} onClick={() => gmWound(c.id, 1)}>+W</button>
                  <button className="btn btn-sm" style={{ padding: '1px 4px', fontSize: 11 }} onClick={() => gmWound(c.id, -1)}>−W</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* PC Turn Panel — shown only for active player's own turn (or GM in any PC turn) */}
      {active && active.type === 'pc' && (isGM || active.id === myCharId) && (
        <PCTurnPanel
          combatant={active}
          character={pcsMap[active.id]}
          enemies={enemies}
          allies={party.filter(c => c.id !== active.id)}
          actionsLeft={active._actionsLeft || { full: 1, simple: 2 }}
          onRoll={(ctx) => setModal({ ...ctx, character: pcsMap[active.id], combatantId: active.id })}
          onStanceChange={(stance, fdBonus) => handleStanceChange(active.id, stance, fdBonus)}
          onDrawWeapon={(weapon) => { handleDrawWeapon(active.id, weapon); spendAction('simple'); }}
          onPass={advanceTurn}
          onSpendAction={spendAction}
        />
      )}
      {active && active.type === 'npc' && isGM && !isPCView && (
        <PCTurnPanel
          combatant={active}
          character={null}
          enemies={party}
          isNPCTurn
          actionsLeft={active._actionsLeft || { full: 1, simple: 2 }}
          onRoll={(ctx) => setModal({ ...ctx, combatantId: active.id })}
          onStanceChange={(stance, fdBonus) => handleStanceChange(active.id, stance, fdBonus)}
          onDrawWeapon={(weapon) => { handleDrawWeapon(active.id, weapon); spendAction('simple'); }}
          onPass={advanceTurn}
          onSpendAction={spendAction}
        />
      )}

    </div>
  );
}
