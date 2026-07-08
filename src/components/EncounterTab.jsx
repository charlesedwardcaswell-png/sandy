import React, { useState, useCallback, useEffect } from 'react';
import { STANCES, STATUS_EFFECTS, STATUS_EFFECT_DEFS, ROUND_LIMITS, WEAPONS_LIST, GAME_ID, SCHOOL_DATA, FACTION_COLORS, SKILL_TRAIT_MAP, TRAITS, getArmorBonus, LIGHT_SOURCES } from '../data/constants';
import { supabase } from '../lib/supabase';
import { Silhouette, FacIcon, WoundBadge, SilhouetteToken, ScrollLore, triggerVoidSwirl, WeaponIcon, ArmorIcon, getWeaponIconType } from './UI';
import { getWoundRank, getArchetype, calcDifficulty, diffColor, pick, rollN, repLabel, rollExplodingKeep, deriveTechniques, getEffectiveWaterRing, getArmorTN, findFreeGridCell, findNearestFreeCell, hasLineOfSight, chebyshevDist, getMeleeReach, isRangedSkill, isInMelee, isInDoodadFootprint } from '../lib/utils';
import DiceModal, { computeBonuses } from './DiceModal';
import PCTurnPanel from './PCTurnPanel';
import EncounterBuilder, { NPCPicker, NPC_BY_FACTION, generateGroup } from './EncounterBuilder';
import { playDamage } from '../lib/sounds';

// ── Contested Roll resolution panel ──────────────────────────────────────────
function ContestedRollPanel({ cr, myCharId, myCharIds, isGM, onRoll, onClose }) {
  const myIds = (myCharIds && myCharIds.length) ? myCharIds : (myCharId ? [myCharId] : []);
  const { sideA, sideB, winner } = cr;
  const resolved = winner !== null;

  const SideBlock = ({ side, sideKey }) => {
    const isMine = myIds.includes(side.id);
    const canRoll = (isMine || isGM) && side.rolled === null;
    return (
      <div style={{ flex: 1, textAlign: 'center', padding: '.5rem', borderRadius: 6,
        background: winner === sideKey ? 'rgba(74,138,64,.15)' : 'transparent',
        border: winner === sideKey ? '1px solid var(--green)' : '1px solid transparent' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{side.name}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{side.skillName}</div>
        {side.rolled !== null ? (
          <div style={{ fontSize: 24, fontWeight: 900, color: winner === sideKey ? 'var(--green)' : 'var(--text-secondary)' }}>
            {side.rolled}
          </div>
        ) : canRoll ? (
          <button className="btn btn-sm btn-p" onClick={() => onRoll(sideKey)}>
            <i className="ti ti-dice" style={{ marginRight: 4 }} />Roll
          </button>
        ) : (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>Waiting…</div>
        )}
      </div>
    );
  };

  return (
    <div style={{
      background: 'rgba(74,154,200,.08)', border: '2px solid #4a9ac8', borderRadius: 8,
      padding: '.75rem 1rem', marginBottom: '.75rem',
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#60b0d8', marginBottom: '.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span><i className="ti ti-scale" style={{ marginRight: 5 }} />Contested Roll</span>
        {isGM && <button className="btn btn-sm" style={{ fontSize: 11 }} onClick={onClose}>{resolved ? 'Dismiss' : 'Cancel'}</button>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
        <SideBlock side={sideA} sideKey="sideA" />
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-muted)' }}>vs</div>
        <SideBlock side={sideB} sideKey="sideB" />
      </div>
      {resolved && (
        <div style={{ textAlign: 'center', marginTop: '.6rem', fontSize: 13, fontWeight: 700, color: winner === 'tie' ? 'var(--gold)' : 'var(--green)' }}>
          {winner === 'tie' ? '- Tie -' : `${cr[winner].name} wins by ${Math.abs(sideA.rolled - sideB.rolled)}`}
        </div>
      )}
    </div>
  );
}


function CombatantVoidMenu({ c, currentVoid, maxVoid, onVoidDefense }) {
  const [open, setOpen] = useState(false);
  if (currentVoid <= 0 && !c.pendingInitBoost && !c.voidReduceDamage && !c.voidArmor) return null;
  return (
    <div style={{ padding: '.3rem .6rem', borderTop: '1px solid rgba(107,78,40,.2)', display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ width: 26, height: 26, borderRadius: '50%', background: '#000', border: '2px solid rgba(200,150,42,.5)', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 8, fontWeight: 700, letterSpacing: '.02em', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0, boxShadow: open ? '0 0 8px rgba(200,150,42,.4)' : 'none' }}>
        VOID
      </button>
      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{currentVoid} left</span>
      {c.pendingInitBoost && <span style={{ fontSize: 10, color: 'var(--gold-dim)' }}>+10 init next round</span>}
      {c.voidReduceDamage && <span style={{ fontSize: 10, color: '#6aba60' }}>Absorb ready</span>}
      {c.voidArmor && <span style={{ fontSize: 10, color: '#6aba60' }}>+10 TN active</span>}
      {open && (
        <div style={{ position: 'absolute', bottom: '100%', left: 0, marginBottom: 4, background: 'var(--bg-card)', border: '1px solid var(--gold-dim)', borderRadius: 6, padding: '.5rem', width: 220, zIndex: 100, boxShadow: '0 4px 20px rgba(0,0,0,.6)' }}
          onClick={e => e.stopPropagation()}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', marginBottom: '.4rem', display: 'flex', justifyContent: 'space-between' }}>
            Spend a Void Point
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14 }}>×</button>
          </div>
          <button className="btn btn-sm" style={{ width: '100%', fontSize: 11, marginBottom: 4, opacity: c.voidArmor || currentVoid <= 0 ? 0.5 : 1, borderColor: '#6aba60', color: '#6aba60', justifyContent: 'flex-start' }}
            disabled={!!c.voidArmor || currentVoid <= 0}
            onClick={(e) => { triggerVoidSwirl(e); onVoidDefense(c.id, 'armor'); setOpen(false); }}
            title="Free Action - add +10 to your Armor TN until your next turn">
            ⬡ +10 Armor TN
          </button>
          <button className="btn btn-sm" style={{ width: '100%', fontSize: 11, marginBottom: 4, opacity: c.voidReduceDamage || currentVoid <= 0 ? 0.5 : 1, borderColor: '#6aba60', color: '#6aba60', justifyContent: 'flex-start' }}
            disabled={!!c.voidReduceDamage || currentVoid <= 0}
            onClick={(e) => { triggerVoidSwirl(e); onVoidDefense(c.id, 'damage'); setOpen(false); }}
            title={`When taking wounds, reduce damage received by your Void Ring (${maxVoid})`}>
            ⬡ Reduce damage by {maxVoid}
          </button>
          <button className="btn btn-sm" style={{ width: '100%', fontSize: 11, opacity: c.pendingInitBoost || currentVoid <= 0 ? 0.5 : 1, borderColor: 'var(--gold-dim)', color: 'var(--gold-dim)', justifyContent: 'flex-start' }}
            disabled={!!c.pendingInitBoost || currentVoid <= 0}
            onClick={(e) => { triggerVoidSwirl(e); onVoidDefense(c.id, 'initiative'); setOpen(false); }}
            title="Spend at the start of a round before Initiative - adds +10 and reorders the cards">
            ⬡ +10 Initiative
          </button>
        </div>
      )}
    </div>
  );
}

// ── Combatant Card ────────────────────────────────────────────────────────────
function CombatantCard({ c, isActive, isGM, isPCView, myCharId, myCharIds, pcs, onGMWound, onApplyStatus, onRemoveStatus, targeting, onSetTarget, compact, onVoidDefense, onSwapSide, portraitScale = 1.0, onShowSummary, onViewCharacter, onViewNpc, inMelee = false, onToggleGlow, hasGrid = false, onFocusToken, turnPanel = null, hasDetectedStealth = false }) {
  const myIds = (myCharIds && myCharIds.length) ? myCharIds : (myCharId ? [myCharId] : []);
  const isNPC = c.type === 'npc';
  const isMyChar = myIds.includes(c.id);
  const wColor = ['#4a8a40','#8a8a30','#a87830','#c86030','#c84030','#a02828','#801818','#600010'][c.wound] || '#4a8a40';
  const wLabel = ['Healthy','Nicked','Grazed','Hurt','Injured','Crippled','Down','Out'][c.wound] || 'Healthy';
  const pc = pcs?.[c.id];
  const armorBonus = getArmorBonus(pc?.equipment) || pc?.armorBonus || c.armorBonus || 0;
  // Jinn protection: "+TN to Be Hit = highest Ring" - check the combatant itself, not pcsMap. Spawned NPC
  // combatant ids (e.g. 'npc_full_<realId>_<timestamp>') never match the real character id pcsMap is keyed
  // by, so a pcsMap lookup here always silently returned undefined for any actual spawned Jinn. The combatant
  // object already carries techniques/faction/rings directly from the spawn fix, so check those instead.
  const jinnTNBonus = (c.faction === 'Jinn' && Object.values(c?.techniques || {}).some(t => typeof t === 'string' && t.includes('+TN to Be Hit = highest Ring')))
    ? Math.max(c.air || 2, c.earth || 2, c.fire || 2, c.water || 2) : 0;
  const armorTN = getArmorTN({
    reflexes: c.reflexes, armorBonus, stance: c.stance,
    fullDefenseBonus: c.fullDefenseBonus, airRing: c.air, defenseSkillRank: c.defenseSkillRank,
    voidArmor: c.voidArmor, jinnBonus: jinnTNBonus,
  });
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
        {/* Swap sides - GM only */}
        {isGM && !isPCView && onSwapSide && (
          <button onClick={onSwapSide} title={isNPC ? '← Move to Party side' : '→ Move to Enemy side'}
            style={{ flexShrink: 0, fontSize: 13, padding: '1px 5px', background: 'transparent', border: `1px solid ${isNPC ? '#4a8a40' : '#8a3030'}`, borderRadius: 4, color: isNPC ? '#6aba60' : '#c84030', cursor: 'pointer', lineHeight: 1 }}>
            {isNPC ? '←' : '→'}
          </button>
        )}
        {/* Locate on grid - centers the (zoomed) Battle Grid view on this token */}
        {hasGrid && onFocusToken && c.gridX !== undefined && (
          <button onClick={() => onFocusToken(c.id)} title="Center the grid view on this token"
            style={{ flexShrink: 0, fontSize: 12, padding: '1px 5px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-muted)', cursor: 'pointer', lineHeight: 1 }}>
            <i className="ti ti-focus-2" style={{ fontSize: 12 }} />
          </button>
        )}
        {/* Initiative - left of icon */}
        <div style={{ textAlign: 'center', flexShrink: 0, minWidth: 28 }}>
          {(() => { const enlarged = isActive || isMyChar;
          return <>
          <div style={{ fontSize: enlarged ? 20 : 15, fontWeight: 700, color: 'var(--gold)', lineHeight: 1 }}>{c.init}</div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>init</div>
          </>;})()}
        </div>
        {(() => { const enlarged = isActive || isMyChar;
          const pw = Math.round((enlarged ? 36 : 28) * portraitScale);
          const ph = Math.round((enlarged ? 46 : 36) * portraitScale);
          return (
        <div style={{ width: pw, height: ph, borderRadius: 4, background: 'var(--bg-deep)', border: `1px solid ${isActive ? 'var(--gold)' : avatarColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', transition: 'all .2s',
          cursor: isNPC && c.sourceId ? 'pointer' : 'default' }}
          onClick={isNPC && c.sourceId ? () => (c.sourceType === 'character' ? onViewCharacter && onViewCharacter(c.sourceId) : onViewNpc && onViewNpc(c.sourceId)) : undefined}
          title={isNPC && c.sourceId ? 'View NPC sheet' : undefined}>
          {avatarUrl
            ? <img src={avatarUrl} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
            : null}
          <Silhouette type={avatarType} size={Math.round((enlarged ? 28 : 22) * portraitScale)} color={avatarColor}
            style={{ display: avatarUrl ? 'none' : undefined }} />
        </div>
        );})()}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ fontSize: (isActive || isMyChar) ? 14 : 12, fontWeight: 600, color: isActive ? 'var(--gold)' : isMyChar ? 'var(--gold)' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {isNPC && isGM ? (
                <input
                  defaultValue={c.name}
                  onBlur={e => { const v = e.target.value.trim(); if (v && v !== c.name && onApplyStatus) onApplyStatus(c.id, '__rename__', v); }}
                  onClick={e => e.stopPropagation()}
                  style={{ fontSize: 13, fontWeight: 600, background: 'transparent', borderLeft: 'none', borderRight: 'none', borderTop: 'none', borderBottom: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none', width: '100%', padding: '1px 0', fontFamily: 'inherit' }}
                />
              ) : (
                <span>{c.name}</span>
              )}
            </div>
            {isNPC && (() => {
              const sd = SCHOOL_DATA[c.school];
              const techs = [];
              for (let r = 1; r <= (c.rank || 1); r++) { if (sd?.techniques?.[r]) techs.push(`Rank ${r}: ${sd.techniques[r]}`); }
              if (techs.length === 0) return null;
              return <ScrollLore title={`${c.name} - ${c.school} Techniques`} text={techs.join('\n\n')} />;
            })()}
            {isMyChar && !isActive && <span style={{ fontSize: 10, color: 'var(--gold-dim)', border: '1px solid var(--gold-dim)', borderRadius: 3, padding: '0 3px' }}>YOU</span>}
            {isNPC && c.disposition === 'friendly' && (
              <span style={{ fontSize: 10, color: '#6aba60', border: '1px solid #4a8a40', borderRadius: 3, padding: '0 3px' }} title="Marked Friendly for this Intrigue Encounter - not a hard block, GM still adjudicates">🤝 Friendly</span>
            )}
            {isNPC && hasDetectedStealth && (
              <span style={{ fontSize: 12, color: '#e0c040', fontWeight: 900 }} title="This NPC's Perception ×5 beats a stealthed PC's Stealth TN, and they have line of sight - quietly auto-detected, no roll needed">❗</span>
            )}
            {isGM && !isPCView && onShowSummary && (
              <button onClick={() => onShowSummary(c)} title="View character summary (skills, advantages, disadvantages)"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0 2px', flexShrink: 0, lineHeight: 1 }}>
                <i className="ti ti-info-circle" style={{ fontSize: 13 }} />
              </button>
            )}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {isNPC ? (c.sub || c.school || '') : c.school}
          </div>
          <div style={{ display: 'flex', gap: 3, marginTop: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 11, padding: '1px 5px', border: `1px solid ${wColor}55`, borderRadius: 3, color: wColor, background: wColor + '20', fontWeight: 600 }}>{wLabel}</span>
            <span className="stance-badge">{c.stance === 'Full Attack' ? 'F.Atk' : c.stance === 'Full Defense' ? 'F.Def' : c.stance}</span>
            {/* HP - always visible on PC cards, never on NPCs */}
            {!isNPC && pc && (
              <span style={{ fontSize: 10, color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 3, padding: '0 4px' }}>
                {pc.current_wounds ?? 0} / {(pc.earth || pc.stamina || 2) * 17} wounds
              </span>
            )}
            {inMelee && (
              <span className="effect-badge" style={{ background: 'rgba(200,64,48,.2)', border: '1px solid #c84030', color: '#e06050', fontWeight: 700 }}
                title="A hostile combatant is adjacent - some ranged/spell penalties may apply">
                In Melee
              </span>
            )}
            {(c.statusEffects || []).map(e => {
              const isRollStatus = e.startsWith('Stealth:') || e.startsWith('Perception:');
              const baseName = e.split(':')[0].trim();
              const def = STATUS_EFFECT_DEFS[baseName];
              const tooltip = isRollStatus
                ? `${baseName} roll result, used as the opposing TN for ${baseName === 'Stealth' ? 'Perception' : 'Stealth'} checks against this combatant.${isGM ? ' Click to remove.' : ''}`
                : def
                  ? `${def.desc} Wears off: ${def.wearOff}.${isGM ? ' Click to remove.' : ''}`
                  : (isGM ? `${e} - click to remove.` : e);
              return (
                <span key={e} className="effect-badge"
                  style={{
                    ...(isRollStatus ? { background: 'rgba(74,138,170,.25)', border: '1px solid #4a8aaa', color: '#4ab0d0', fontWeight: 700 } : {}),
                    cursor: isGM ? 'pointer' : 'default',
                  }}
                  onClick={() => { if (isGM && onRemoveStatus) onRemoveStatus(c.id, e); }}
                  title={tooltip}>
                  {e}{isGM ? ' ×' : ''}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom row - weapon + armor TN + void */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', padding: '.3rem .6rem', fontSize: 12, color: 'var(--text-muted)' }}>
        {/* Up to 2 weapon icons (dual-wield), or 1 + bare-hand fallback. Two-handed weapons show alone. */}
        {(() => {
          const weapons = c.drawnWeapons?.length > 0 ? c.drawnWeapons : (c.drawnWeapon ? [c.drawnWeapon] : []);
          if (weapons.length === 0) {
            return <i className="ti ti-hand-stop" style={{ fontSize: 13 }} title="Unarmed" />;
          }
          return (
            <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
              {weapons.slice(0, 2).map((w, wi) => {
                const iconType = getWeaponIconType(w);
                const wName = w.split(' (')[0];
                return iconType
                  ? <WeaponIcon key={wi} type={iconType} size={16} color={avatarColor} />
                  : <i key={wi} className="ti ti-sword" style={{ fontSize: 13 }} title={wName} />;
              })}
            </div>
          );
        })()}
        {/* Armor icon - shown whenever the character has any armor bonus equipped */}
        {armorBonus > 0 && <ArmorIcon size={15} color={avatarColor} />}
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {c.drawnWeapons?.length > 1
            ? c.drawnWeapons.map(w => w.split(' (')[0]).join(' + ')
            : (c.drawnWeapon || 'Unarmed')}
        </span>
        {/* Armor TN - shows boost if void spent */}
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginLeft: 4 }}
          title={c.stance === 'Full Defense' ? `Full Defense: 5 + ${(c.reflexes||2)}×5 + ${armorBonus} armor + half(${c.fullDefenseBonus ?? 0} Defense roll) = ${armorTN}` : c.stance === 'Defense' ? `Defense: 5 + ${(c.reflexes||2)}×5 + ${armorBonus} armor + ${(c.air||2)} Air + ${c.defenseSkillRank||0} Defense = ${armorTN}` : `TN to Be Hit: 5 + ${(c.reflexes||2)}×5 + ${armorBonus} armor${c.stance === 'Full Attack' ? ' −10 (Full Attack)' : ''} = ${armorTN}`}>
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

      {/* Void spend menu - player's own card only, any time during combat */}
      {isMyChar && !isNPC && onVoidDefense && (
        <CombatantVoidMenu c={c} currentVoid={currentVoid} maxVoid={maxVoid} onVoidDefense={onVoidDefense} />
      )}

      {/* GM controls */}
      {isGM && !isPCView && (
        <div style={{ padding: '.3rem .6rem', borderTop: '1px solid rgba(107,78,40,.2)', display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-sm btn-d" style={{ padding: '1px 5px', fontSize: 11 }} onClick={() => onGMWound(c.id, 1)} title="Apply 1 wound point">+1 W</button>
          <button className="btn btn-sm" style={{ padding: '1px 5px', fontSize: 11 }} onClick={() => onGMWound(c.id, -1)} title="Remove 1 wound point">−1 W</button>
          <select style={{ fontSize: 11, padding: '1px 4px', flex: 1 }} value="" onChange={e => { if (e.target.value) onApplyStatus(c.id, e.target.value); e.target.value = ''; }}>
            <option value="">+ Status</option>
            {STATUS_EFFECTS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          {isNPC && hasGrid && onToggleGlow && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: c.glowing ? 'var(--gold)' : 'var(--text-muted)', cursor: 'pointer', flexShrink: 0 }}
              title="This NPC emits its own 3-square light radius (walls still block it), same as Player Glow">
              <input type="checkbox" checked={!!c.glowing} onChange={() => onToggleGlow(c.id)} style={{ margin: 0 }} />
              Glow
            </label>
          )}
        </div>
      )}

      {/* Turn panel - expands the card in place on this combatant's turn (replaces the old separate
          sticky-bottom action bar, which Charles found "too big and annoying"). CSS grid-template-rows
          0fr→1fr is used instead of a max-height guess, since the panel's real content height varies a
          lot (spell picker, etc.) and this animates smoothly to "auto" without needing to know it. */}
      {turnPanel && (
        <div style={{ display: 'grid', gridTemplateRows: isActive ? '1fr' : '0fr', transition: 'grid-template-rows .35s ease' }}>
          <div style={{ overflow: 'hidden' }}>
            {turnPanel}
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
    { icon: 'ti-dice', label: '+1k1 to any roll', desc: 'Spend before rolling. Adds one die rolled and one die kept to any roll. Handled inside the dice roller itself.' },
    { icon: 'ti-shield', label: '+10 Armor TN', desc: 'Spend as a Free Action to add +10 to your Armor TN until your next turn. Click the VOID circle on your card any time.' },
    { icon: 'ti-heart', label: 'Reduce damage', desc: 'When taking wounds, spend to reduce damage received by your Void Ring. Click the VOID circle on your card any time.' },
    { icon: 'ti-bolt', label: '+10 Initiative', desc: 'Spend at the start of a round before rolling Initiative to add +10 to your Initiative roll and reorder the cards. Click the VOID circle on your card any time.' },
    { icon: 'ti-eye', label: 'Negate one attack (Defense R5)', desc: 'Defense Rank 5 Mastery: spend Void as a Free Action to negate one attack per round. Not yet clickable - ask the GM to resolve this for now.' },
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

// ── Party Card - extracted as a proper component so useState is legal ─────────
function PartyCard({ c, pcsMap, myCharId, myCharIds, isGM, isPCView, grantedActions, combatants, onUpdateCharacter, upEnc, onViewCharacter }) {
  const [imgErr, setImgErr] = useState(false);
  const wR = getWoundRank(c.current_wounds || 0, (c.earth || 2) * 17, c.earth || 2);
  const wColor = ['#4a8a40','#8a8a30','#a87830','#c86030','#c84030','#a02828','#801818','#600010'][wR] || '#4a8a40';
  const wLabel = ['Healthy','Nicked','Grazed','Hurt','Injured','Crippled','Down','Out'][wR] || 'Healthy';
  const pc = pcsMap[c.id];
  const avatarColor = pc?.avatar_color || c.avatar_color || FACTION_COLORS[pc?.faction || c.faction] || '#c8962a';
  const avatarType = pc?.avatar_type || c.avatar_type || 'warrior';
  const avatarUrl = (pc?.avatar_url || c.avatar_url || '').trim();
  const granted = grantedActions[c.id] || 0;
  const isMyChar = (myCharIds && myCharIds.length ? myCharIds : (myCharId ? [myCharId] : [])).includes(c.id);

  return (
    <div style={{
      background: 'var(--bg-panel)', borderRight: `1px solid ${isMyChar ? avatarColor : 'var(--border)'}`, borderTop: `1px solid ${isMyChar ? avatarColor : 'var(--border)'}`, borderBottom: `1px solid ${isMyChar ? avatarColor : 'var(--border)'}`,
      borderLeft: `3px solid ${isMyChar ? avatarColor : '#4a8a40'}`,
      borderRadius: 6, padding: '.75rem', width: 190, position: 'relative',
      boxShadow: isMyChar ? `0 0 12px ${avatarColor}33` : 'none',
    }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '.5rem' }}>
        <div
          onClick={c.is_npc && onViewCharacter ? () => onViewCharacter(c.id) : undefined}
          title={c.is_npc && onViewCharacter ? 'View NPC sheet' : undefined}
          style={{ width: 76, height: 98, background: 'var(--bg-deep)', borderRadius: 5, border: `1px solid ${avatarColor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: c.is_npc && onViewCharacter ? 'pointer' : 'default' }}>
          {avatarUrl && !imgErr
            ? <img src={avatarUrl} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setImgErr(true)} />
            : <Silhouette type={avatarType} size={64} color={avatarColor} />}
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
      {granted > 0 && (
        <div style={{ textAlign: 'center', padding: '4px', background: 'rgba(200,150,42,.1)', border: '1px solid var(--gold-dim)', borderRadius: 4, marginBottom: '.4rem' }}>
          <div style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 600 }}>
            <i className="ti ti-bolt" style={{ marginRight: 4 }} />{granted} unused action{granted > 1 ? 's' : ''}
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

// ── Battle Grid tile palette - text stand-ins until the master atlas image exists ─────────────
// 8 mechanical types (mirrors TERRAIN_CONDITIONS below) + Light (GM-configurable radius) + 2 reserved
// misc slots + PC Start = 12 total, matching the 12-column Master Atlas (see design doc).
export const TILE_TYPES = [
  { key: 'wall',      label: 'Wall',      short: 'WALL',  color: '#5a5a5a', blocks: true },
  { key: 'difficult', label: 'Difficult', short: 'DIFF',  color: '#8a6a30', statusEffect: 'Terrain: Difficult' },
  { key: 'cover',     label: 'Cover',     short: 'COVER', color: '#4a6a8a', statusEffect: 'Terrain: Cover' },
  { key: 'fire',      label: 'On Fire',   short: 'FIRE',  color: '#c84020', statusEffect: 'Terrain: On Fire', damagePerTurn: 1 },
  { key: 'hazardous', label: 'Hazardous', short: 'HAZ',   color: '#8a3050', statusEffect: 'Terrain: Hazardous' },
  { key: 'elevated',  label: 'Elevated',  short: 'ELEV',  color: '#a88030', statusEffect: 'Terrain: Elevated' },
  { key: 'confined',  label: 'Confined',  short: 'CONF',  color: '#605040', statusEffect: 'Terrain: Confined' },
  { key: 'flooded',   label: 'Flooded',   short: 'FLOOD', color: '#2a6a8a', statusEffect: 'Terrain: Flooded' },
  { key: 'light',     label: 'Light',     short: 'LIGHT', color: '#c8a030', isLight: true },
  { key: 'misc1',     label: 'Misc 1',    short: 'MISC1', color: '#606060' },
  { key: 'misc2',     label: 'Misc 2',    short: 'MISC2', color: '#606060' },
  { key: 'misc3',     label: 'PC Start',  short: 'PCSTRT', color: '#3a8a4a', isPcStart: true },
];

// Master Atlas column mapping - a 768×768 image, 12×12 grid of 64×64 tiles (see Tileset tab; rows
// are tilesets/themes, matching GridCreatorTab's themeRow). Columns are terrain "look" types, in
// the same order as TILE_TYPES but excluding PC Start - that's a pure mechanical marker, never a
// terrain texture, so it always renders as its plain colored/labeled block regardless of atlas or
// Default Tiles Only. 13 tile types, 12 atlas columns - PC Start is the one deliberately left out.
export const ATLAS_COLUMNS = TILE_TYPES.filter(t => !t.isPcStart).reduce((acc, t, i) => { acc[t.key] = i; return acc; }, {});
export const ATLAS_SIZE = 768;  // full atlas image, both dimensions
export const ATLAS_GRID = 12;   // 12×12 tiles
export const ATLAS_TILE = ATLAS_SIZE / ATLAS_GRID; // 64px per source tile

// ── Battle Grid ───────────────────────────────────────────────────────────────
function BattleGrid({ combatants, active, pcsMap, gridSize, isGM, myCharId, myCharIds, isMyTurn, onMove, settingBg, activePing, onPing, portraitScale = 1.0, gridTiles = {}, onPaintTiles, lightMode = 'dark', onSetLightMode, litCells = null, dimCells = null, onQuickTarget, playerGlow = false, onSetPlayerGlow, atlasUrl = '', tileDefaultImages = {}, themeRow = null, doodads = [], doodadLibrary = [], everyoneHelps = false, everyoneHelpsPlus = false, isObserver = false, freeMove = false, onSetFreeMove, focusTokenId = null, onSetFocusToken, placingDoodadDef = null, onPlaceDoodad, onSetPlacingDoodadDef, containers = [], containerImageUrl = '', onInvestigateContainer, shopTokens = [], shops = [], onOpenShopCommerce }) {
  const myIds = (myCharIds && myCharIds.length) ? myCharIds : (myCharId ? [myCharId] : []);
  const [selected, setSelected] = useState(null);
  const [hoverCell, setHoverCell] = useState(null);
  const [localPing, setLocalPing] = useState(null);
  // Players default to a zoomed-in ~12×12 view (auto-centered on their own token via the focus logic
  // below) rather than the full grid - easier to read at the table than a full 24/36/48 grid shrunk
  // to fit. GM, and anyone with no character in this encounter, still default to the full view.
  const [zoom, setZoom] = useState(() => {
    if (isGM) return 1.0;
    if (!myIds || myIds.length === 0) return 1.0;
    return Math.min(1.0, 12 / gridSize);
  }); // 1.0 = full grid, 0.5 = zoomed in 2×
  // Manual pan on top of whatever the auto-focus/zoom logic centers on - lets the GM/player drag
  // the view around while zoomed in, independent of whoever's currently active. Reset whenever the
  // zoom resets to full or a new focus target is picked (via a card click), so pan never gets "stuck"
  // pointed somewhere stale after the view recenters for another reason.
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [panDrag, setPanDrag] = useState(null); // { startClientX, startClientY, startOffset }
  useEffect(() => { setPanOffset({ x: 0, y: 0 }); }, [zoom >= 1.0, focusTokenId]);
  useEffect(() => {
    if (focusTokenId && zoom >= 1.0) setZoom(0.4);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusTokenId]);
  // GM-only visual toggle - hides the scene background image so the plain tile-type color blocks
  // (and their mechanical effects) are easy to read without the artsy overlay competing for attention.
  // Purely local/informational, not synced to players.
  const [defaultTilesOnly, setDefaultTilesOnly] = useState(false);
  const [dragging, setDragging] = useState(null);   // { id, startX, startY }
  const [dragPos, setDragPos] = useState(null);      // { svgX, svgY } current drag position in SVG coords
  // Right-click token context menu - "Attack"/"Skill" quick-target, filtered by melee/ranged reach
  const [ctxMenu, setCtxMenu] = useState(null); // { targetId, screenX, screenY }
  const [shopCtxMenu, setShopCtxMenu] = useState(null); // { shopTokenId, screenX, screenY }
  const canOpenCtxMenu = isGM || isMyTurn;
  const svgRef = React.useRef(null);
  // Terrain paint-mode editor (GM only) - text stand-ins for tiles until the master atlas exists
  const [editMode, setEditMode] = useState(false);
  const [brush, setBrush] = useState(null);          // TILE_TYPES key, '__erase__', or null
  const [brushRadius, setBrushRadius] = useState(3); // used only when brush === 'light'
  const [isPainting, setIsPainting] = useState(false);
  const [paintBuffer, setPaintBuffer] = useState({}); // local live-preview during a drag paint, committed on mouse up
  const displayTiles = editMode ? { ...gridTiles, ...paintBuffer } : gridTiles;
  // Token portrait aspect ratios - SVG <image> can't read naturalWidth/naturalHeight itself,
  // so a hidden preload Image() per unique token_url fills this in once it loads. Used to size
  // the portrait by its real aspect ratio instead of force-cropping it into a circle.
  const [tokenAspects, setTokenAspects] = useState({});
  const tokenUrlsKey = combatants.map(c => ((pcsMap[c.id] || pcsMap[c.sourceId])?.token_url || '').trim()).filter(Boolean).join('|');
  useEffect(() => {
    tokenUrlsKey.split('|').filter(Boolean).forEach(url => {
      if (tokenAspects[url] !== undefined) return;
      const img = new Image();
      img.onload = () => setTokenAspects(prev => ({ ...prev, [url]: img.naturalWidth / img.naturalHeight }));
      img.onerror = () => setTokenAspects(prev => ({ ...prev, [url]: 1 }));
      img.src = url;
    });
  }, [tokenUrlsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const paintCell = (x, y) => {
    const key = `${x},${y}`;
    setPaintBuffer(buf => ({ ...buf, [key]: brush === '__erase__' ? null : (brush === 'light' ? { type: 'light', radius: brushRadius } : { type: brush }) }));
  };
  const commitPaint = () => {
    if (Object.keys(paintBuffer).length && onPaintTiles) onPaintTiles(paintBuffer);
    setPaintBuffer({});
    setIsPainting(false);
  };

  const getSVGCoords = (e) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return null;
    // Read the SVG's actual current viewBox rather than assuming it's always "0 0 W W" - when zoomed
    // in (viewBox smaller than the full grid), screen-to-cell math must offset/scale by the viewBox's
    // own origin and size, or clicks/drags land on the wrong cell relative to what's visually zoomed in.
    const vb = (svgRef.current?.getAttribute('viewBox') || `0 0 ${W} ${W}`).split(' ').map(Number);
    const [vx, vy, vw, vh] = vb;
    const svgX = ((e.clientX - rect.left) / rect.width) * vw + vx;
    const svgY = ((e.clientY - rect.top) / rect.height) * vh + vy;
    return {
      svgX, svgY,
      gridX: Math.floor(svgX / CELL),
      gridY: Math.floor(svgY / CELL),
    };
  };

  const handleTokenMouseDown = (e, id) => {
    if (editMode) return; // GM is painting terrain, not moving tokens
    if (!canMoveToken(id)) return;
    e.stopPropagation();
    e.preventDefault();
    const coords = getSVGCoords(e);
    if (!coords) return;
    setDragging({ id });
    setDragPos({ svgX: coords.svgX, svgY: coords.svgY });
    setSelected(null);
  };

  const handleSVGMouseMove = (e) => {
    if (panDrag) {
      const deltaXpx = e.clientX - panDrag.startClientX;
      const deltaYpx = e.clientY - panDrag.startClientY;
      // Screen px → viewBox units: viewBox width is W*zoom over an on-screen width of W, so each
      // screen px covers `zoom` viewBox units. Subtracting (not adding) the delta gives the natural
      // "grab and drag the map" feel - dragging right reveals content further left.
      setPanOffset({ x: panDrag.startOffset.x - deltaXpx * zoom, y: panDrag.startOffset.y - deltaYpx * zoom });
      return;
    }
    const coords = getSVGCoords(e);
    if (!coords) return;
    if (isPainting) {
      if (coords.gridX >= 0 && coords.gridX < gridSize && coords.gridY >= 0 && coords.gridY < gridSize) {
        paintCell(coords.gridX, coords.gridY);
      }
      return;
    }
    if (dragging) {
      setDragPos({ svgX: coords.svgX, svgY: coords.svgY });
      if (coords.gridX >= 0 && coords.gridX < gridSize && coords.gridY >= 0 && coords.gridY < gridSize) {
        setHoverCell({ x: coords.gridX, y: coords.gridY });
      }
    }
  };

  // One square at a time - either because Lighting isn't 'full' (darkness), or because Free Move is
  // active (quietly moving around before combat is officially joined shouldn't mean covering huge
  // distances in one click). Checked fresh on every move, not just at turn start.
  const withinLightingStep = (tokenId, x, y) => {
    if (isGM) return true;
    if (lightMode === 'full' && !freeMove) return true;
    const tok = combatants.find(c => c.id === tokenId);
    if (!tok || tok.gridX === undefined) return true;
    return Math.max(Math.abs(x - tok.gridX), Math.abs(y - tok.gridY)) <= 1;
  };

  const handleSVGMouseUp = (e) => {
    if (panDrag) { setPanDrag(null); return; }
    if (isPainting) { commitPaint(); return; }
    if (!dragging) return;
    const coords = getSVGCoords(e);
    if (coords && coords.gridX >= 0 && coords.gridX < gridSize && coords.gridY >= 0 && coords.gridY < gridSize) {
      const occupied = combatants.some(c => c.id !== dragging.id && c.gridX === coords.gridX && c.gridY === coords.gridY);
      const isWall = gridTiles[`${coords.gridX},${coords.gridY}`]?.type === 'wall';
      // Players (not GM) can only move their own active token into a currently-highlighted range cell
      const isOwnActiveToken = !isGM && myIds.includes(dragging.id) && dragging.id === active?.id;
      const inRange = isGM || !isOwnActiveToken || moveRangeCells.has(`${coords.gridX},${coords.gridY}`);
      const litStep = withinLightingStep(dragging.id, coords.gridX, coords.gridY);
      if (!occupied && !isWall && inRange && litStep) {
        onMove(dragging.id, coords.gridX, coords.gridY);
      }
    }
    setDragging(null);
    setDragPos(null);
    setHoverCell(null);
  };

  // Pathfinding-aware reachability - replaces the old naive "as the crow flies" distance circle.
  // Walls fully block a path (can't cross them, not just land on them). Difficult terrain costs an
  // extra movement point for each step taken OUT of it (leaving a difficult tile, not entering one).
  // Other combatants' tokens never block a path - only the final destination cell's occupancy matters.
  // Diagonal steps cost 2, straight steps cost 1 (unchanged convention). Small ranges, so a plain
  // array-based Dijkstra (Dial's algorithm territory, but ranges are tiny - this is plenty fast).
  const reachableCosts = (originX, originY, maxRange, tiles) => {
    const dist = new Map();
    const startKey = `${originX},${originY}`;
    dist.set(startKey, 0);
    const frontier = [{ x: originX, y: originY, cost: 0 }];
    while (frontier.length) {
      frontier.sort((a, b) => a.cost - b.cost);
      const cur = frontier.shift();
      const curKey = `${cur.x},${cur.y}`;
      if (dist.get(curKey) < cur.cost) continue; // stale entry, already beaten
      if (cur.cost >= maxRange) continue;        // fully spent, nowhere further to go
      const leavingDifficult = tiles[curKey]?.type === 'difficult';
      for (let ddx = -1; ddx <= 1; ddx++) {
        for (let ddy = -1; ddy <= 1; ddy++) {
          if (ddx === 0 && ddy === 0) continue;
          const nx = cur.x + ddx, ny = cur.y + ddy;
          if (nx < 0 || nx >= gridSize || ny < 0 || ny >= gridSize) continue;
          const nKey = `${nx},${ny}`;
          if (tiles[nKey]?.type === 'wall') continue; // walls block the path outright, not just the destination
          // Diagonal step - corner rule: can't cut between two walls that only touch at a shared
          // corner. Blocked only if BOTH flanking orthogonal cells are walls (a single wall corner
          // doesn't block), matching the same rule now applied to light's line-of-sight raycast.
          if (ddx !== 0 && ddy !== 0) {
            const flankA = tiles[`${cur.x + ddx},${cur.y}`]?.type === 'wall';
            const flankB = tiles[`${cur.x},${cur.y + ddy}`]?.type === 'wall';
            if (flankA && flankB) continue;
          }
          const stepCost = (ddx !== 0 && ddy !== 0 ? 2 : 1) + (leavingDifficult ? 1 : 0);
          const newCost = cur.cost + stepCost;
          if (newCost > maxRange) continue;
          if (!dist.has(nKey) || dist.get(nKey) > newCost) {
            dist.set(nKey, newCost);
            frontier.push({ x: nx, y: ny, cost: newCost });
          }
        }
      }
    }
    return dist;
  };

  const cellsWithinRange = (originX, originY, range, tiles) => {
    const dist = reachableCosts(originX, originY, range, tiles || {});
    const cells = new Set();
    dist.forEach((cost, key) => { if (cost > 0) cells.add(key); });
    return cells;
  };

  // Three-tier movement range for the active combatant on their own turn:
  //   Red    = default single 5ft move, not yet used this turn (waterRing steps)
  //   Orange = range reachable after the first Move action has been used (2× waterRing)
  //   Yellow = range reachable via a second simple-action move (3× waterRing) - max for the turn
  // Each tier is the FULL range from the token's current position, not additive rings, since a player
  // can still choose to move less than their max allotted steps.
  const moveRangeTiers = React.useMemo(() => {
    if (!active || !isMyTurn) return { free: new Set(), move1: new Set(), move2: new Set(), maxRange: 0 };
    const pc = pcsMap[active.id];
    const waterRing = pc ? getEffectiveWaterRing(pc) : (active.water || 2);
    const movesUsed = active._movesUsed || 0;
    // Use starting position for range, not current - player can end turn anywhere within total range
    const originX = active.startX !== undefined ? active.startX : active.gridX;
    const originY = active.startY !== undefined ? active.startY : active.gridY;
    if (originX === undefined || originY === undefined) return { free: new Set(), move1: new Set(), move2: new Set(), maxRange: 0 };

    // 1-square free zone is always available (no action cost)
    const freeZone = cellsWithinRange(originX, originY, 1, gridTiles);
    if (movesUsed === 0) {
      // Before Move action - only free 1-square zone shown
      return { free: freeZone, move1: new Set(), move2: new Set(), maxRange: 1 };
    } else if (movesUsed === 1) {
      // Move used once - show 1-free + Water Ring additional (subtract free from move1 to avoid overlap)
      const totalMove1 = cellsWithinRange(originX, originY, 1 + waterRing, gridTiles);
      const move1 = new Set([...totalMove1].filter(k => !freeZone.has(k)));
      return { free: freeZone, move1, move2: new Set(), maxRange: 1 + waterRing };
    } else {
      // Move used twice - full range: 1 + 2×Water Ring
      const totalMove2 = cellsWithinRange(originX, originY, 1 + waterRing * 2, gridTiles);
      const totalMove1 = cellsWithinRange(originX, originY, 1 + waterRing, gridTiles);
      const move1 = new Set([...totalMove1].filter(k => !freeZone.has(k)));
      const move2 = new Set([...totalMove2].filter(k => !totalMove1.has(k)));
      return { free: freeZone, move1, move2, maxRange: 1 + waterRing * 2 };
    }
  }, [active, isMyTurn, pcsMap, gridSize, gridTiles]);

  const moveRangeCells = React.useMemo(() => {
    const { free, move1, move2 } = moveRangeTiers;
    return new Set([...free, ...move1, ...move2]);
  }, [moveRangeTiers]);

  const handleDblClick = (e) => {
    if (editMode) return;
    const coords = getSVGCoords(e);
    if (!coords) return;
    const { gridX: x, gridY: y } = coords;
    if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) return;
    // Find the pinging player's token - prefer whichever of their characters is actually on the grid
    const myToken = combatants.find(c => myIds.includes(c.id) && c.gridX !== undefined) || combatants.find(c => myIds.includes(c.id));
    const fromX = myToken?.gridX !== undefined ? myToken.gridX * CELL + CELL / 2 : null;
    const fromY = myToken?.gridY !== undefined ? myToken.gridY * CELL + CELL / 2 : null;
    const ping = { x, y, fromX, fromY, ts: Date.now(), pingerId: myToken?.id || myCharId };
    setLocalPing(ping);
    if (onPing) onPing(ping);
    // Fade out after 3s
    setTimeout(() => setLocalPing(null), 3000);
  }; // {x, y} while a token is selected
  const CELL = 36;
  const W = gridSize * CELL;

  // Can a given combatant token be moved by the current user?
  const canMoveToken = (id) => {
    if (isGM) return true;                                          // GM can move anything anytime
    const tok = combatants.find(c => c.id === id);
  // Everyone Helps extends to party characters (PCs); Everyone Helps + extends to NPCs as well. A
  // player can also always help move an NPC they've specifically opted into via shared control.
  const canHelp = !isObserver && (
    (tok?.type === 'pc' && (everyoneHelps || everyoneHelpsPlus))
    || (tok?.type === 'npc' && everyoneHelpsPlus)
    || (tok?.type === 'npc' && (tok?.sharedControllerIds || []).some(id => myIds.includes(id)))
  );
    const isOwnToken = myIds.includes(id);
    if (!isOwnToken && !canHelp) return false;                       // Players can only move their own token(s), unless Everyone Helps applies
    if (freeMove && isOwnToken) return true;                         // Free Move bypasses turn order for your own token (still subject to the lighting one-step rule elsewhere)
    if (!isMyTurn) return false;                                     // Only on their turn (isMyTurn already includes the Everyone Helps case)
    // A PC must lock in a stance before moving on their own turn - this is the same gate the turn
    // panel's own "choose a stance to continue" screen enforces, but that's local UI state (resets on
    // every panel remount) so it never stopped moving a token by dragging it directly on the grid.
    if (tok?.type === 'pc' && !tok?._stanceLockedIn) return false;
    return true;
  };

  const handleCellClick = (x, y, keepSelected = false) => {
    if (editMode) return;
    if (!selected) return;
    if (!canMoveToken(selected)) return;
    const occupied = combatants.some(c => c.gridX === x && c.gridY === y);
    if (occupied) return;
    if (gridTiles[`${x},${y}`]?.type === 'wall') return;
    if (!withinLightingStep(selected, x, y)) return;
    // Players (not GM) can only move their own active token into a currently-highlighted range cell
    const isOwnActiveToken = !isGM && myIds.includes(selected) && selected === active?.id;
    if (isOwnActiveToken && !moveRangeCells.has(`${x},${y}`)) return;
    onMove(selected, x, y);
    if (!keepSelected) setSelected(null);
    setHoverCell(null);
  };

  const handleTokenClick = (e, id) => {
    e.stopPropagation();
    if (editMode) return;
    if (!canMoveToken(id)) return;
    setSelected(selected === id ? null : id);
  };

  // Arrow keys move the currently selected token one square at a time - same validation path as
  // clicking a destination cell (occupancy, walls, lighting-step, range), just driven by keyboard.
  useEffect(() => {
    if (!selected || editMode) return;
    const DIRS = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
    const onKeyDown = (e) => {
      const dir = DIRS[e.key];
      if (!dir) return;
      e.preventDefault(); // don't let arrow keys scroll the page while a token is selected
      if (!canMoveToken(selected)) return;
      const tok = combatants.find(c => c.id === selected);
      if (!tok || tok.gridX === undefined) return;
      const nx = tok.gridX + dir[0], ny = tok.gridY + dir[1];
      if (nx < 0 || nx >= gridSize || ny < 0 || ny >= gridSize) return;
      handleCellClick(nx, ny, true);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, editMode, combatants, gridSize]);

  const getTokenColor = (c) => {
    const pc = pcsMap[c.id];
    if (pc?.avatar_color) return pc.avatar_color;
    return c.type === 'npc' ? '#c84030' : '#4a8a40';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
        {selected && <span style={{ color: 'var(--gold)' }}>Selected: {combatants.find(c => c.id === selected)?.name} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(use arrow keys or drag to move)</span></span>}
        {!isGM && isMyTurn && !selected && myIds.length > 0 && <span style={{ color: 'var(--green)', textTransform: 'none' }}>- Drag your token to move, or click it to use arrow keys</span>}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 3, alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', marginRight: 2 }}>Lighting</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginRight: 10 }} title="Dark: unlit &amp; non-adjacent tiles are hidden from players. Dim: same lit/dim tiers, but nothing is hidden - just darkened. Full: lighting off, everyone sees everything.">
            {['dark', 'dim', 'full'].map(m => (
              <button key={m} disabled={!isGM} onClick={() => onSetLightMode && onSetLightMode(m)}
                style={{
                  fontSize: 10, textTransform: 'capitalize', padding: '1px 6px', cursor: isGM ? 'pointer' : 'default',
                  borderRadius: 3, border: `1px solid ${lightMode === m ? 'var(--gold)' : 'var(--border)'}`,
                  background: lightMode === m ? 'rgba(200,150,42,.2)' : 'transparent',
                  color: lightMode === m ? 'var(--gold)' : 'var(--text-muted)',
                }}>{m}</button>
            ))}
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, textTransform: 'none', cursor: isGM ? 'pointer' : 'default', color: playerGlow ? 'var(--gold)' : 'var(--text-muted)' }}
            title="Each PC token emits its own 3-square light radius (walls still block it). When turned off, players may need to rely on lamps and torches in the darkness.">
            <input type="checkbox" checked={playerGlow} disabled={!isGM}
              onChange={e => onSetPlayerGlow && onSetPlayerGlow(e.target.checked)}
              style={{ margin: 0, cursor: isGM ? 'pointer' : 'default' }} />
            Players Glow
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, textTransform: 'none', cursor: isGM ? 'pointer' : 'default', color: freeMove ? 'var(--gold)' : 'var(--text-muted)' }}
            title="Players can move their own token any time, not just on their turn - until an enemy is revealed, then it's back to strict turn order automatically">
            <input type="checkbox" checked={freeMove} disabled={!isGM}
              onChange={e => onSetFreeMove && onSetFreeMove(e.target.checked)}
              style={{ margin: 0, cursor: isGM ? 'pointer' : 'default' }} />
            Free Move
          </label>
          {isGM && (
            <button onClick={() => setDefaultTilesOnly(v => !v)}
              title="Force plain labeled tile colors instead of Master Atlas/tileset graphics, and hide the scene background image - see the mechanical effects clearly without any artsy overlay"
              style={{ background: defaultTilesOnly ? 'rgba(200,150,42,.3)' : 'rgba(107,78,40,.3)', border: `1px solid ${defaultTilesOnly ? 'var(--gold)' : 'rgba(107,78,40,.5)'}`, color: defaultTilesOnly ? 'var(--gold)' : 'var(--gold-dim)', borderRadius: 3, cursor: 'pointer', padding: '1px 7px', fontSize: 10, lineHeight: 1.6 }}>
              {defaultTilesOnly ? 'Showing Default Tiles' : 'Default Tiles Only'}
            </button>
          )}
          {isGM && (
            <button onClick={() => { setEditMode(m => !m); setBrush(null); setSelected(null); setDragging(null); }}
              title="Paint terrain tiles onto the grid"
              style={{ background: editMode ? 'rgba(200,150,42,.3)' : 'rgba(107,78,40,.3)', border: `1px solid ${editMode ? 'var(--gold)' : 'rgba(107,78,40,.5)'}`, color: editMode ? 'var(--gold)' : 'var(--gold-dim)', borderRadius: 3, cursor: 'pointer', padding: '1px 7px', fontSize: 10, lineHeight: 1.6 }}>
              {editMode ? 'Editing Terrain' : 'Edit Terrain'}
            </button>
          )}
          <button onClick={() => setZoom(z => Math.min(1.0, z + 0.25))} title="Zoom out"
            style={{ background: 'rgba(107,78,40,.3)', border: '1px solid rgba(107,78,40,.5)', color: 'var(--gold-dim)', borderRadius: 3, cursor: 'pointer', padding: '1px 7px', fontSize: 13, lineHeight: 1 }}>−</button>
          <button onClick={() => { setZoom(1.0); onSetFocusToken && onSetFocusToken(null); }} title="Reset zoom"
            style={{ background: 'rgba(107,78,40,.2)', border: '1px solid rgba(107,78,40,.4)', color: 'var(--text-muted)', borderRadius: 3, cursor: 'pointer', padding: '1px 6px', fontSize: 10, lineHeight: 1 }}>{Math.round((1/zoom)*100)}%</button>
          <button onClick={() => setZoom(z => Math.max(0.25, z - 0.25))} title="Zoom in"
            style={{ background: 'rgba(107,78,40,.3)', border: '1px solid rgba(107,78,40,.5)', color: 'var(--gold-dim)', borderRadius: 3, cursor: 'pointer', padding: '1px 7px', fontSize: 13, lineHeight: 1 }}>+</button>
          {isGM && doodadLibrary.length > 0 && onSetPlacingDoodadDef && (
            placingDoodadDef ? (
              <button onClick={() => onSetPlacingDoodadDef(null)}
                style={{ background: 'rgba(200,150,42,.3)', border: '1px solid var(--gold)', color: 'var(--gold)', borderRadius: 3, cursor: 'pointer', padding: '1px 7px', fontSize: 10, lineHeight: 1.6 }}>
                Click grid to place "{placingDoodadDef.name}" (Cancel)
              </button>
            ) : (
              <select value="" onChange={e => { const def = doodadLibrary.find(d => d.id === e.target.value); if (def) onSetPlacingDoodadDef(def); }}
                title="Place a doodad from the Library onto this live encounter"
                style={{ fontSize: 10, background: 'rgba(107,78,40,.3)', border: '1px solid rgba(107,78,40,.5)', color: 'var(--gold-dim)', borderRadius: 3, padding: '1px 4px' }}>
                <option value="">+ Place Doodad...</option>
                {doodadLibrary.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            )
          )}
        </div>
      </div>

      {isGM && editMode && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: 4, background: 'rgba(10,8,4,.6)', border: '1px solid rgba(107,78,40,.3)', borderRadius: 4, marginBottom: 4, maxWidth: W, justifyContent: 'center' }}>
          {TILE_TYPES.map(t => (
            <button key={t.key} onClick={() => setBrush(b => b === t.key ? null : t.key)} title={t.label}
              style={{ fontSize: 10, padding: '3px 7px', borderRadius: 3, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700,
                background: brush === t.key ? t.color : 'var(--bg-panel)',
                border: `1px solid ${brush === t.key ? t.color : 'var(--border)'}`,
                color: brush === t.key ? '#fff' : 'var(--text-muted)' }}>
              {t.short}
            </button>
          ))}
          <button onClick={() => setBrush(b => b === '__erase__' ? null : '__erase__')} title="Erase tile"
            style={{ fontSize: 10, padding: '3px 7px', borderRadius: 3, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700,
              background: brush === '__erase__' ? '#c84030' : 'var(--bg-panel)',
              border: `1px solid ${brush === '__erase__' ? '#c84030' : 'var(--border)'}`,
              color: brush === '__erase__' ? '#fff' : 'var(--text-muted)' }}>
            ERASE
          </button>
          {brush === 'light' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 6 }}>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Radius</span>
              <button onClick={() => setBrushRadius(r => Math.max(1, r - 1))}
                style={{ background: 'rgba(107,78,40,.3)', border: '1px solid rgba(107,78,40,.5)', color: 'var(--gold-dim)', borderRadius: 3, cursor: 'pointer', padding: '0 6px', fontSize: 12, lineHeight: 1.4 }}>−</button>
              <span style={{ fontSize: 11, color: 'var(--gold)', minWidth: 12, textAlign: 'center' }}>{brushRadius}</span>
              <button onClick={() => setBrushRadius(r => Math.min(gridSize, r + 1))}
                style={{ background: 'rgba(107,78,40,.3)', border: '1px solid rgba(107,78,40,.5)', color: 'var(--gold-dim)', borderRadius: 3, cursor: 'pointer', padding: '0 6px', fontSize: 12, lineHeight: 1.4 }}>+</button>
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <svg ref={svgRef} width={W} height={W}
          viewBox={(() => {
            if (zoom >= 1.0) return `0 0 ${W} ${W}`;
            // Center viewBox on the player's own token - not just whoever's globally active, which
            // could be an enemy NPC the player doesn't control. GM still follows whoever's acting,
            // since they're watching the whole encounter rather than playing one character. A manual
            // focus target (set by clicking a character's card) overrides this entirely until cleared.
            const focusToken = (() => {
              if (focusTokenId) {
                const manual = combatants.find(c => c.id === focusTokenId);
                if (manual && manual.gridX !== undefined) return manual;
              }
              if (isGM) return active;
              if (active && myIds.includes(active.id)) return active;
              const myCombatants = combatants.filter(c => myIds.includes(c.id) && c.gridX !== undefined);
              if (myCombatants.length <= 1) return myCombatants[0] || active;
              // Multiple claimed characters: follow whichever is soonest-next in initiative from the
              // current turn pointer (not necessarily first in the array).
              const activeIdx = combatants.findIndex(c => c.id === active?.id);
              const ranked = combatants
                .map((c, i) => ({ c, dist: (i - activeIdx + combatants.length) % combatants.length }))
                .filter(o => myIds.includes(o.c.id))
                .sort((a, b) => a.dist - b.dist);
              return ranked[0]?.c || myCombatants[0];
            })();
            const cx = (focusToken?.gridX !== undefined ? (focusToken.gridX + 0.5) * CELL : W / 2) + panOffset.x;
            const cy = (focusToken?.gridY !== undefined ? (focusToken.gridY + 0.5) * CELL : W / 2) + panOffset.y;
            const vw = W * zoom;
            const vh = W * zoom;
            const vx = Math.max(0, Math.min(W - vw, cx - vw / 2));
            const vy = Math.max(0, Math.min(W - vh, cy - vh / 2));
            return `${vx} ${vy} ${vw} ${vh}`;
          })()}
          style={{ background: 'rgba(10,8,4,.8)', border: '1px solid rgba(107,78,40,.4)', borderRadius: 4, cursor: placingDoodadDef ? 'crosshair' : editMode ? (brush ? 'crosshair' : 'default') : dragging ? 'grabbing' : panDrag ? 'grabbing' : zoom < 1.0 ? 'grab' : 'default', display: 'block', overflow: 'hidden', userSelect: 'none' }}
          onMouseDown={e => {
            if (placingDoodadDef && onPlaceDoodad) {
              const coords = getSVGCoords(e);
              if (!coords || coords.gridX < 0 || coords.gridX >= gridSize || coords.gridY < 0 || coords.gridY >= gridSize) return;
              onPlaceDoodad(coords.gridX, coords.gridY);
              return;
            }
            if (editMode && brush) {
              const coords = getSVGCoords(e);
              if (!coords || coords.gridX < 0 || coords.gridX >= gridSize || coords.gridY < 0 || coords.gridY >= gridSize) return;
              setIsPainting(true);
              paintCell(coords.gridX, coords.gridY);
              return;
            }
            // Drag-to-pan - only meaningful while zoomed in; a token's own onMouseDown already
            // stopPropagation()s so this never fires when the drag actually started on a token.
            if (editMode || zoom >= 1.0) return;
            setPanDrag({ startClientX: e.clientX, startClientY: e.clientY, startOffset: panOffset });
          }}
          onMouseMove={handleSVGMouseMove}
          onMouseUp={handleSVGMouseUp}
          onMouseLeave={() => { setHoverCell(null); if (dragging) { setDragging(null); setDragPos(null); } if (isPainting) commitPaint(); if (panDrag) setPanDrag(null); }}
          onDoubleClick={handleDblClick}>

          {settingBg && !defaultTilesOnly && <image href={settingBg} x={0} y={0} width={W} height={W} preserveAspectRatio="xMidYMid slice" opacity="0.25" />}

          {Array.from({ length: gridSize + 1 }, (_, i) => (
            <g key={i}>
              <line x1={i * CELL} y1={0} x2={i * CELL} y2={W} stroke="rgba(107,78,40,.25)" strokeWidth="0.5" />
              <line x1={0} y1={i * CELL} x2={W} y2={i * CELL} stroke="rgba(107,78,40,.25)" strokeWidth="0.5" />
            </g>
          ))}

          {/* Master Atlas patterns - one per unique tile type actually on this grid (not per cell),
              so the browser only crops as many sub-regions of the shared atlas image as needed. */}
          {atlasUrl && themeRow !== null && themeRow !== undefined && !defaultTilesOnly && (
            <defs>
              {[...new Set(Object.values(displayTiles).filter(Boolean).map(t => t.type))]
                .filter(type => ATLAS_COLUMNS[type] !== undefined)
                .map(type => {
                  const col = ATLAS_COLUMNS[type];
                  const scale = CELL / ATLAS_TILE; // atlas source px → this grid's render px
                  return (
                    <pattern key={`atlas-${type}`} id={`atlas-pat-${type}`} width={CELL} height={CELL} patternUnits="userSpaceOnUse">
                      <image href={atlasUrl}
                        x={-col * ATLAS_TILE * scale} y={-themeRow * ATLAS_TILE * scale}
                        width={ATLAS_SIZE * scale} height={ATLAS_SIZE * scale} />
                    </pattern>
                  );
                })}
            </defs>
          )}

          {/* Confined tiles get a grey/black diagonal stripe pattern instead of a flat color - the
              flat brownish-grey looked too much like a wall at a glance. Always available (not
              conditioned on the Master Atlas existing), since this is the plain-tile fallback look. */}
          <defs>
            <pattern id="confined-stripes" width="8" height="8" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
              <rect width="8" height="8" fill="#4a4a4a" />
              <rect width="4" height="8" fill="#141414" />
            </pattern>
          </defs>

          {/* Terrain tiles - Master Atlas graphic if a tileset row + atlas image are both set (and
              Default Tiles Only isn't on), else a per-type default image (Tileset tab), else the
              plain color+label stand-in. */}
          {Object.entries(displayTiles).map(([key, t]) => {
            if (!t) return null;
            const def = TILE_TYPES.find(tt => tt.key === t.type);
            if (!def) return null;
            const [tx, ty] = key.split(',').map(Number);
            const hasAtlas = !defaultTilesOnly && atlasUrl && themeRow !== null && themeRow !== undefined && ATLAS_COLUMNS[t.type] !== undefined;
            const defaultImg = !defaultTilesOnly && !hasAtlas && tileDefaultImages[t.type];
            if (hasAtlas) {
              return (
                <rect key={`tile-${key}`} x={tx * CELL} y={ty * CELL} width={CELL} height={CELL}
                  fill={`url(#atlas-pat-${t.type})`} style={{ pointerEvents: 'none' }} />
              );
            }
            if (defaultImg) {
              return (
                <image key={`tile-${key}`} href={defaultImg} x={tx * CELL} y={ty * CELL} width={CELL} height={CELL}
                  preserveAspectRatio="xMidYMid slice" style={{ pointerEvents: 'none' }} />
              );
            }
            return (
              <g key={`tile-${key}`} style={{ pointerEvents: 'none' }}>
                <rect x={tx * CELL + 1} y={ty * CELL + 1} width={CELL - 2} height={CELL - 2}
                  fill={t.type === 'confined' ? 'url(#confined-stripes)' : def.color} opacity="0.4" rx="2" />
                <text x={tx * CELL + CELL / 2} y={ty * CELL + CELL / 2 + 3} textAnchor="middle" fontSize="8" fontWeight="700" fill="#fff" fontFamily="sans-serif">{def.short}</text>
              </g>
            );
          })}

          {selected && (() => {
            const selToken = combatants.find(c => c.id === selected);
            if (!selToken || selToken.gridX === undefined) return null;
            // Cap the glow to a reasonable radius around the selected token instead of lighting
            // every empty cell on the board - keeps this cheap to render at large grid sizes (24/36/48)
            const GLOW_RADIUS = Math.min(gridSize, 10);
            const cells = [];
            for (let dy = -GLOW_RADIUS; dy <= GLOW_RADIUS; dy++) {
              for (let dx = -GLOW_RADIUS; dx <= GLOW_RADIUS; dx++) {
                const x = selToken.gridX + dx, y = selToken.gridY + dy;
                if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) continue;
                const occupied = combatants.some(c => c.gridX === x && c.gridY === y);
                if (occupied) continue;
                cells.push(
                  <rect key={`${x}-${y}`} x={x * CELL + 1} y={y * CELL + 1} width={CELL - 2} height={CELL - 2} fill="rgba(200,150,42,.08)" rx="2" />
                );
              }
            }
            return cells;
          })()}

          {/* Movement range glow - three tiers: free (always 1sq, teal), move1 (after Move action, blue), move2 (after Move Again, purple) */}
          {!selected && isMyTurn && (() => {
            const tierStyle = {
              free:  { fill: 'rgba(40,180,140,.15)',  stroke: 'rgba(40,180,140,.5)',  label: 'Free' },
              move1: { fill: 'rgba(74,144,208,.18)',  stroke: 'rgba(74,144,208,.5)',  label: '1 Action' },
              move2: { fill: 'rgba(140,80,200,.18)',  stroke: 'rgba(140,80,200,.5)',  label: '2 Actions' },
            };
            return ['free', 'move1', 'move2'].flatMap(tier =>
              Array.from(moveRangeTiers[tier]).map(key => {
                const [x, y] = key.split(',').map(Number);
                const occupied = combatants.some(c => c.id !== active?.id && c.gridX === x && c.gridY === y);
                const style = tierStyle[tier];
                return (
                  <rect key={`move-${tier}-${key}`} x={x * CELL + 1} y={y * CELL + 1} width={CELL - 2} height={CELL - 2}
                    fill={occupied ? 'rgba(200,64,48,.12)' : style.fill}
                    stroke={occupied ? 'rgba(200,64,48,.3)' : style.stroke}
                    strokeWidth="0.5" rx="2" />
                );
              })
            );
          })()}

          {/* Trail line - from selected token's current position to hovered cell */}
          {/* Grid pings - dashed line from token + animated circle */}
          {[activePing, localPing].filter(Boolean).map((ping, pi) => {
            if (!ping) return null;
            const cx = ping.x * CELL + CELL / 2;
            const cy = ping.y * CELL + CELL / 2;
            return (
              <g key={pi} style={{ pointerEvents: 'none' }}>
                {ping.fromX != null && ping.fromY != null && (
                  <line x1={ping.fromX} y1={ping.fromY} x2={cx} y2={cy}
                    stroke="rgba(180,210,255,.7)" strokeWidth="1.5" strokeDasharray="4 3" />
                )}
                <circle cx={cx} cy={cy} r={CELL * 0.45}
                  fill="rgba(180,210,255,.12)" stroke="rgba(180,210,255,.9)" strokeWidth="1.5" />
                <text x={cx} y={cy + 6} textAnchor="middle" fontSize={CELL * 0.6} dominantBaseline="middle">&#128065;</text>
              </g>
            );
          })}
          
          {/* Depth-sorted by row (not initiative/array order) - anything on a lower row is visually
              "closer," so it must draw after (on top of) anything on a higher row. This matters
              because portraits can bleed upward above their own square (see the aspect-ratio-fit
              rendering below), and now doodads (tall props like a house) can too - a doodad's sort
              key is its footprint's BOTTOM row, so a character standing on the row above a house
              can be correctly occluded by it, while a character on/below the house's own row still
              draws on top of it. Tokens and doodads are merged into one sorted list, not two passes,
              since paint order in SVG is just document order - two separate loops could never
              correctly interleave depth between the two kinds of thing. */}
          {(() => {
            const doodadItems = doodads
              .filter(d => d.x !== null && d.x !== undefined && d.y !== null && d.y !== undefined)
              .map(d => ({ ...d, _isDoodad: true, _def: doodadLibrary.find(def => def.id === d.defId) }))
              .filter(d => d._def);
            const containerItems = containers
              .filter(ct => ct.x !== null && ct.x !== undefined && ct.y !== null && ct.y !== undefined)
              .map(ct => ({ ...ct, _isContainer: true }));
            const shopItems = shopTokens
              .filter(st => st.x !== null && st.x !== undefined && st.y !== null && st.y !== undefined && shops.some(s => s.id === st.shopId))
              .map(st => ({ ...st, _isShop: true }));
            const renderItems = [
              ...combatants.map(c => ({ ...c, _sortY: c.gridY })),
              ...doodadItems.map(d => ({ ...d, _sortY: d.y + d._def.height - 1 })),
              ...containerItems.map(ct => ({ ...ct, _sortY: ct.y })),
              ...shopItems.map(st => ({ ...st, _sortY: st.y })),
            ];
            return [...renderItems].sort((a, b) => (a._sortY ?? -1) - (b._sortY ?? -1)).map(item => {
            if (item._isShop) {
              const st = item;
              const shop = shops.find(s => s.id === st.shopId);
              const cx = st.x * CELL + CELL / 2;
              const cy = st.y * CELL + CELL / 2;
              return (
                <g key={`shop-${st.id}`} style={{ cursor: 'pointer' }}
                  onMouseDown={e => e.stopPropagation()}
                  onContextMenu={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShopCtxMenu({ shopTokenId: st.id, screenX: e.clientX, screenY: e.clientY });
                  }}>
                  <rect x={st.x * CELL + 2} y={st.y * CELL + 2} width={CELL - 4} height={CELL - 4} fill="#6a8a30" stroke="#fff" strokeWidth="1" rx="2" />
                  <text x={cx} y={cy + 4} textAnchor="middle" fontSize="12" fontFamily="sans-serif">🏪</text>
                  <title>{shop?.name || 'Shop'} - right-click while adjacent to enter Commerce</title>
                </g>
              );
            }
            if (item._isContainer) {
              const ct = item;
              const cx = ct.x * CELL + CELL / 2;
              const cy = ct.y * CELL + CELL / 2;
              return (
                <g key={`container-${ct.id}`} style={{ cursor: 'pointer' }}
                  onMouseDown={e => e.stopPropagation()}
                  onClick={e => { e.stopPropagation(); onInvestigateContainer && onInvestigateContainer(ct.id); }}
                  opacity={ct.looted ? 0.4 : 1}>
                  {containerImageUrl ? (
                    <image href={containerImageUrl} x={ct.x * CELL} y={ct.y * CELL} width={CELL} height={CELL} preserveAspectRatio="xMidYMid meet" />
                  ) : (
                    <>
                      <rect x={ct.x * CELL + 2} y={ct.y * CELL + 2} width={CELL - 4} height={CELL - 4} fill="#8a6a30" stroke="#fff" strokeWidth="1" rx="2" />
                      <text x={cx} y={cy + 4} textAnchor="middle" fontSize="12" fontFamily="sans-serif">📦</text>
                    </>
                  )}
                  <title>{ct.name}{ct.looted ? ' (looted)' : ''}</title>
                </g>
              );
            }
            if (item._isDoodad) {
              const def = item._def;
              // Effect overlay is purely cosmetic - confirmed with Charles it should NOT block LOS or
              // feed into the lighting system, just read as atmosphere over the doodad's footprint.
              const EFFECT_STYLES = {
                sandstorm: { fill: '#c8962a', opacity: '.32;.5;.32' },
                fog:       { fill: '#d8d8d8', opacity: '.28;.45;.28' },
                smoke:     { fill: '#3a3a3a', opacity: '.35;.55;.35' },
              };
              const fx = def.effect && def.effect !== 'none' ? EFFECT_STYLES[def.effect] : null;
              const shapeProps = def.shape === 'circle'
                ? { cx: (item.x + def.width / 2) * CELL, cy: (item.y + def.height / 2) * CELL, rx: (def.width / 2) * CELL, ry: (def.height / 2) * CELL }
                : null;
              return (
                <g key={`doodad-${item.id}`} style={{ pointerEvents: 'none' }}>
                  <image href={def.imageUrl}
                    x={item.x * CELL} y={item.y * CELL} width={def.width * CELL} height={def.height * CELL}
                    preserveAspectRatio="xMidYMax meet" />
                  {fx && (shapeProps ? (
                    <ellipse cx={shapeProps.cx} cy={shapeProps.cy} rx={shapeProps.rx} ry={shapeProps.ry} fill={fx.fill}>
                      <animate attributeName="opacity" values={fx.opacity} dur="4s" repeatCount="indefinite" />
                    </ellipse>
                  ) : (
                    <rect x={item.x * CELL} y={item.y * CELL} width={def.width * CELL} height={def.height * CELL} fill={fx.fill}>
                      <animate attributeName="opacity" values={fx.opacity} dur="4s" repeatCount="indefinite" />
                    </rect>
                  ))}
                </g>
              );
            }
            const c = item;
            if (c.gridX === undefined || c.gridY === undefined) return null;
            // Enemy tokens standing outside every light radius are hidden from players (not the GM) while Lighting is on
            // Enemy tokens in the fully-dark tier are hidden from players (not the GM) - but only in
            // strict Dark mode. Dim mode uses the same lit/dim/dark tiers but never hides anything,
            // just darkens it (a softer option for GMs who don't want full fog-of-war).
            if (!isGM && lightMode === 'dark' && litCells && c.type === 'npc') {
              const key = `${c.gridX},${c.gridY}`;
              if (!litCells.has(key) && !(dimCells && dimCells.has(key))) return null;
            }
            const isActive = c.id === active?.id;
            const isSelected = c.id === selected;
            const color = getTokenColor(c);
            const cx = c.gridX * CELL + CELL / 2;
            const cy = c.gridY * CELL + CELL / 2;
            const r = 13;
            // Full NPC combatants get a synthesized id ('npc_full_<realId>_<ts>') that never matches
            // pcsMap (keyed by real character id) - fall back to sourceId so their actual token image
            // and crop preference are found instead of silently defaulting to the silhouette avatar.
            const pc = pcsMap[c.id] || pcsMap[c.sourceId];
            const avatarType = pc?.avatar_type || 'warrior';
            const tokenUrl = (pc?.token_url || '').trim();
            const ringColor = c.type === 'npc' ? '#c84030' : '#4a8a40';
            const isDead = c.wound >= 6;
            const statusLabel = c.wound >= 7 ? 'DEAD' : c.wound >= 6 ? 'DOWN' : null;
            const shortName = c.name.length > 7 ? c.name.slice(0, 6) + '…' : c.name;
            return (
              <g key={c.id}
                style={{ cursor: canMoveToken(c.id) ? (dragging?.id === c.id ? 'grabbing' : 'grab') : 'default', opacity: dragging?.id === c.id ? 0.35 : 1 }}
                onClick={e => { if (!dragging) handleTokenClick(e, c.id); }}
                onMouseDown={e => handleTokenMouseDown(e, c.id)}
                onContextMenu={e => {
                  e.preventDefault();
                  if (!canOpenCtxMenu || !active || c.id === active.id || c.type === active.type) return;
                  setCtxMenu({ targetId: c.id, screenX: e.clientX, screenY: e.clientY });
                }}>
                {isActive && <circle cx={cx} cy={cy} r={r + 6} fill={color} opacity="0.2" />}
                {isActive && <circle cx={cx} cy={cy} r={r + 4} fill="none" stroke={color} strokeWidth="1.5" opacity="0.6" />}
                {isSelected && <circle cx={cx} cy={cy} r={r + 4} fill="none" stroke="#fff" strokeWidth="1.5" strokeDasharray="3,2" />}
                <circle cx={cx} cy={cy} r={r + 1} fill={ringColor + '33'} stroke={isDead ? '#600010' : ringColor} strokeWidth="1.5" opacity={isDead ? 0.5 : 1} />
                <circle cx={cx} cy={cy} r={r} fill={isDead ? '#1a0808' : '#1a1208'} />
                {tokenUrl ? (() => {
                  if (pc?.token_circle) {
                    // Old behavior, opt-in per character: crop into a circle via clipPath.
                    const clipId = `tok-circle-${c.id.replace(/[^a-z0-9]/gi, '')}`;
                    return (
                      <>
                        <defs>
                          <clipPath id={clipId}><circle cx={cx} cy={cy} r={r} /></clipPath>
                        </defs>
                        <image href={tokenUrl} x={cx - r} y={cy - r} width={r * 2} height={r * 2}
                          clipPath={`url(#${clipId})`} preserveAspectRatio="xMidYMid slice"
                          opacity={isDead ? 0.4 : 1} />
                      </>
                    );
                  }
                  // Fit the portrait's width to the token square and keep its real aspect ratio -
                  // taller portraits extend upward above the square instead of being squashed/cropped
                  // into a circle. Bottom edge stays anchored at the square's base (cy + r).
                  const aspect = tokenAspects[tokenUrl] || 1;
                  const w = r * 2;
                  const h = aspect > 0 ? w / aspect : w;
                  return (
                    <image href={tokenUrl} x={cx - r} y={(cy + r) - h} width={w} height={h}
                      preserveAspectRatio="xMidYMax meet"
                      opacity={isDead ? 0.4 : 1} />
                  );
                })() : (
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
            });
          })()}
          {/* Three-tier lighting overlay:
              - Lit cells: no overlay, full brightness.
              - Dim cells (touching a lit cell, but not lit themselves - e.g. a wall's near face
                catching light from the room beyond it): always a light translucent overlay, for
                everyone. This is what makes a wall next to a torch visible as a wall, even though
                light doesn't pass through it into whatever's on the other side.
              - Dark cells (neither): in Dark mode, fully opaque for players - "fumbling around in
                the darkness," nothing is visible there at all. The GM still sees the layout via a
                lighter indicator overlay (not opaque) so they stay aware of where darkness falls.
                In Dim mode, dark-tier cells get the same lighter overlay for everyone - darkened,
                never hidden; a softer option than full fog-of-war. */}
          {lightMode !== 'full' && litCells && (() => {
            const cells = [];
            for (let gy = 0; gy < gridSize; gy++) {
              for (let gx = 0; gx < gridSize; gx++) {
                const key = `${gx},${gy}`;
                if (litCells.has(key)) continue;
                const isDim = dimCells && dimCells.has(key);
                const fill = isDim ? 'rgba(0,0,0,.35)' : (lightMode === 'dark' && !isGM) ? 'rgba(0,0,0,1)' : 'rgba(0,0,0,.55)';
                cells.push(<rect key={`dark-${gx}-${gy}`} x={gx * CELL} y={gy * CELL} width={CELL} height={CELL} fill={fill} style={{ pointerEvents: 'none' }} />);
              }
            }
            return cells;
          })()}

          {/* Drag ghost - follows cursor */}
          {dragging && dragPos && (() => {
            const dragCombatant = combatants.find(c => c.id === dragging.id);
            if (!dragCombatant) return null;
            const color = getTokenColor(dragCombatant);
            const r = 13;
            const snapX = Math.floor(dragPos.svgX / CELL) * CELL + CELL / 2;
            const snapY = Math.floor(dragPos.svgY / CELL) * CELL + CELL / 2;
            const pc = pcsMap[dragging.id] || pcsMap[dragCombatant.sourceId];
            const tokenUrl = (pc?.token_url || '').trim();
            const avatarType = pc?.avatar_type || 'warrior';
            return (
              <g style={{ pointerEvents: 'none', opacity: 0.85 }}>
                {/* Snap highlight on destination cell */}
                <rect x={snapX - CELL / 2 + 1} y={snapY - CELL / 2 + 1} width={CELL - 2} height={CELL - 2}
                  fill="rgba(200,150,42,.2)" stroke="rgba(200,150,42,.8)" strokeWidth="1.5" rx="3" />
                {/* Ghost token at cursor */}
                <circle cx={dragPos.svgX} cy={dragPos.svgY} r={r + 1} fill="rgba(200,150,42,.2)" stroke="var(--gold)" strokeWidth="2" />
                <circle cx={dragPos.svgX} cy={dragPos.svgY} r={r} fill="#1a1208" />
                {tokenUrl ? (() => {
                  if (pc?.token_circle) {
                    const clipId = `drag-ghost-circle-${dragging.id.replace(/[^a-z0-9]/gi, '')}`;
                    return (
                      <>
                        <defs><clipPath id={clipId}><circle cx={dragPos.svgX} cy={dragPos.svgY} r={r} /></clipPath></defs>
                        <image href={tokenUrl} x={dragPos.svgX - r} y={dragPos.svgY - r} width={r * 2} height={r * 2}
                          clipPath={`url(#${clipId})`} preserveAspectRatio="xMidYMid slice" />
                      </>
                    );
                  }
                  const aspect = tokenAspects[tokenUrl] || 1;
                  const w = r * 2;
                  const h = aspect > 0 ? w / aspect : w;
                  return (
                    <image href={tokenUrl} x={dragPos.svgX - r} y={(dragPos.svgY + r) - h} width={w} height={h}
                      preserveAspectRatio="xMidYMax meet" />
                  );
                })() : (
                  <SilhouetteToken type={avatarType} cx={dragPos.svgX} cy={dragPos.svgY} r={r} color={color} />
                )}
              </g>
            );
          })()}
        </svg>
      </div>

      {(() => {
        const unplacedAll = combatants.filter(c => c.gridX === undefined || c.gridY === undefined);
        // Unplaced NPCs are a GM-only holding area (surprise reinforcements shouldn't be visible to
        // players before the GM places them on the grid) - unplaced PCs stay visible to everyone since
        // there's nothing secret about a player's own token waiting to be placed.
        const unplaced = (isGM && !isObserver) ? unplacedAll : unplacedAll.filter(c => c.type !== 'npc');
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

      {ctxMenu && (() => {
        const target = combatants.find(c => c.id === ctxMenu.targetId);
        if (!target) { setCtxMenu(null); return null; }
        // Range check against the active combatant's drawn weapon - Chebyshev distance (diagonal
        // counts same as straight, per Charles: melee reach includes diagonal, unlike movement or
        // ranged attacks). No grid position on either side = can't range-check, so allow Attack.
        // Ranged attacks have no max range cap (deliberate) - only a line-of-sight check (walls
        // block the shot) and the "not point-blank" rule below. Melee stays reach-enforced.
        const hasPos = active?.gridX !== undefined && target.gridX !== undefined;
        const dist = hasPos ? chebyshevDist(active.gridX, active.gridY, target.gridX, target.gridY) : null;
        const losBlocked = hasPos && !hasLineOfSight(active.gridX, active.gridY, target.gridX, target.gridY, gridTiles);
        const drawnNames = active?.drawnWeapons?.length ? active.drawnWeapons : (active?.drawnWeapon ? [active.drawnWeapon] : ['Unarmed (1k1)']);
        const attackUsable = drawnNames.some(dn => {
          const skillName = WEAPONS_LIST.find(w => w.name === (dn || '').split(' (')[0])?.skill || 'Brawling';
          if (dist === null) return true;
          return isRangedSkill(skillName) ? (dist > 1 && !losBlocked) : dist <= getMeleeReach(skillName);
        });
        const attackReason = attackUsable ? '' : (
          dist !== null && dist <= 1 ? 'No ranged weapon drawn - target is adjacent'
          : losBlocked ? 'No line of sight - a wall blocks the shot'
          : 'Target out of melee reach - no ranged weapon drawn'
        );
        const close = () => setCtxMenu(null);
        return (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 499 }} onClick={close} onContextMenu={e => { e.preventDefault(); close(); }} />
            <div style={{ position: 'fixed', left: ctxMenu.screenX, top: ctxMenu.screenY, zIndex: 500,
              background: 'var(--bg-card)', border: '1px solid var(--gold-dim)', borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,.6)', minWidth: 150, overflow: 'hidden' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: '5px 10px', borderBottom: '1px solid var(--border)' }}>
                Target: <span style={{ color: 'var(--gold)' }}>{target.name}</span>
              </div>
              <button disabled={!attackUsable} title={attackReason} onClick={() => { onQuickTarget && onQuickTarget(target.id, 'attack'); close(); }}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 10px', fontSize: 13, background: 'none', border: 'none', cursor: attackUsable ? 'pointer' : 'not-allowed', color: attackUsable ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                <i className="ti ti-sword" style={{ marginRight: 6, fontSize: 12 }} />Attack{!attackUsable ? ' (out of range)' : ''}
              </button>
              <button onClick={() => { onQuickTarget && onQuickTarget(target.id, 'skill'); close(); }}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 10px', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}>
                <i className="ti ti-sparkles" style={{ marginRight: 6, fontSize: 12 }} />Skill
              </button>
              <button onClick={close} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '5px 10px', fontSize: 11, background: 'none', border: 'none', borderTop: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-muted)' }}>
                Cancel
              </button>
            </div>
          </>
        );
      })()}
      {shopCtxMenu && (() => {
        const token = shopTokens.find(st => st.id === shopCtxMenu.shopTokenId);
        if (!token) { setShopCtxMenu(null); return null; }
        const shop = shops.find(s => s.id === token.shopId);
        const close = () => setShopCtxMenu(null);
        return (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 499 }} onClick={close} onContextMenu={e => { e.preventDefault(); close(); }} />
            <div style={{ position: 'fixed', left: shopCtxMenu.screenX, top: shopCtxMenu.screenY, zIndex: 500,
              background: 'var(--bg-card)', border: '1px solid var(--gold-dim)', borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,.6)', minWidth: 150, overflow: 'hidden' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: '5px 10px', borderBottom: '1px solid var(--border)' }}>
                Shop: <span style={{ color: 'var(--gold)' }}>{shop?.name || 'Unknown'}</span>
              </div>
              <button onClick={() => { onOpenShopCommerce && onOpenShopCommerce(token.id); close(); }}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 10px', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}>
                <i className="ti ti-shopping-cart" style={{ marginRight: 6, fontSize: 12 }} />Commerce
              </button>
              <button onClick={close} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '5px 10px', fontSize: 11, background: 'none', border: 'none', borderTop: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-muted)' }}>
                Cancel
              </button>
            </div>
          </>
        );
      })()}
    </div>
  );
}



// ── Battlefield Conditions Panel ───────────────────────────────────────────────
const VISIBILITY_CONDITIONS = [
  { key: 'clear',      label: 'Clear',        desc: 'Normal visibility - no penalty.',                    tnMod: 0,  rangeMod: 0 },
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
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '.6rem', paddingBottom: '.5rem', borderBottom: '1px solid rgba(107,78,40,.25)' }}>
            Reference only - these selections aren't mechanically applied. Actual TN/range modifiers come from each tile's type and lighting (dim/dark/lit). This panel just posts the rules banner as a GM reminder.
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
    // - Tactical escalation -
    'Reinforcements arrive - roll 1d6 for count',
    'A second group of enemies flanks from the rear',
    'Sniper on the rooftop - ranged attacks from unknown direction',
    'Hostage taken - enemy holds a civilian at knifepoint',
    'Assassination target: an enemy is trying to reach a specific PC',
    'One enemy reveals a hidden weapon (upgrade their DR)',
    // - Environment -
    'Fire breaks out - spreads 1 zone per round',
    'Sandstorm reduces all visibility to 5 feet',
    'Structure becomes unstable - collapses in 3 rounds',
    'Oil spill ignites - floor becomes hazard zone',
    'Sewer grate bursts open - difficult terrain floods the area',
    'Rope bridge or walkway begins to give way',
    'Darkness falls - torches extinguished, combat in shadow',
    'Flash flood - river or channel suddenly surges',
    'Market stalls collapse - debris blocks half the battlefield',
    // - Supernatural -
    'A Jinn is drawn to the violence',
    'A minor Jinn offers a deal at a price',
    'Undead stir - a ghul crawls from the sewer',
    'A sahir witness begins casting from the crowd',
    'Cursed object on an enemy radiates fear - Fear Roll TN 15',
    'Void spike - all Void Point costs double this round',
    'Magic goes wild - next spell rolled on the wild surge table',
    // - Social / Political -
    'City Guard arrives - whose side are they on?',
    'A Caliphate official witnesses the fight - reputation consequences',
    'Press gang watching - they want recruits',
    'Merchant attempts to negotiate a cease-fire for a cut',
    'A known NPC passes through and recognizes the PCs',
    'A faction ally of one PC intervenes - briefly, at a cost',
    // - Faction complications -
    'Qabal agent emerges from shadow to observe',
    'Assassin marks the most dangerous PC',
    'Dahabi enforcer calls in a debt - demands a PC stand down',
    'Ra\'Shari caravan blocks the escape route',
    // - Narrative twists -
    'Someone important flees with something valuable',
    'Hidden trap triggers beneath a PC\'s feet',
    'An ally turns - acting on separate orders',
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
                  <option value="">- Select -</option>
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

// ── Contested Roll tool ──────────────────────────────────────────────────────
// Lightweight opposed-roll resolver - distinct from the heavier multi-phase Tahaddi Duel.
// GM picks two characters and a skill (or flat trait) for each side; each side rolls through
// the normal dice roller so Void spend and technique bonuses apply automatically.
function ContestedRollInitiator({ combatants, pcsMap, onStart }) {
  const [open, setOpen] = useState(false);
  const [sideAId, setSideAId] = useState('');
  const [sideBId, setSideBId] = useState('');
  const [skillA, setSkillA] = useState('');
  const [skillB, setSkillB] = useState('');
  const list = combatants.filter(c => c.id && c.name);

  // Build the list of skills a character actually has, for the picker
  const skillsFor = (id) => {
    const c = pcsMap[id] || list.find(x => x.id === id);
    return (c?.skills || []).map(s => s.name);
  };

  return (
    <>
      <button className="btn btn-sm" style={{ borderColor: '#4a9ac8', color: '#60b0d8' }} onClick={() => setOpen(o => !o)}>
        ⚖ Contested Roll
      </button>
      {open && (
        <div style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 8,
          padding: '1.25rem', zIndex: 400, minWidth: 320, boxShadow: '0 8px 40px rgba(0,0,0,.8)',
        }} onClick={e => e.stopPropagation()}>
          <div style={{ fontWeight: 700, color: '#60b0d8', marginBottom: '.75rem', fontSize: 15 }}>⚖ Contested Roll</div>
          {[
            { label: 'Side A', id: sideAId, setId: setSideAId, skill: skillA, setSkill: setSkillA, exclude: sideBId },
            { label: 'Side B', id: sideBId, setId: setSideBId, skill: skillB, setSkill: setSkillB, exclude: sideAId },
          ].map(side => (
            <div key={side.label} style={{ marginBottom: '.6rem' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>{side.label}</div>
              <select value={side.id} onChange={e => { side.setId(e.target.value); side.setSkill(''); }} style={{ width: '100%', marginBottom: 4 }}>
                <option value="">- Select character -</option>
                {list.filter(c => c.id !== side.exclude).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {side.id && (
                <select value={side.skill} onChange={e => side.setSkill(e.target.value)} style={{ width: '100%' }}>
                  <option value="">- Select skill or trait -</option>
                  <optgroup label="Skills">
                    {skillsFor(side.id).map(s => <option key={s} value={s}>{s}</option>)}
                  </optgroup>
                  <optgroup label="Traits (e.g. Willpower vs. fear/manipulation effects)">
                    {TRAITS.map(t => <option key={'trait_' + t} value={'Trait: ' + t}>Trait: {t}</option>)}
                  </optgroup>
                </select>
              )}
            </div>
          ))}
          <div style={{ display: 'flex', gap: '.5rem', marginTop: '.75rem' }}>
            <button className="btn btn-p" style={{ flex: 1 }} disabled={!sideAId || !sideBId || !skillA || !skillB}
              onClick={() => {
                const a = list.find(x => x.id === sideAId);
                const b = list.find(x => x.id === sideBId);
                if (a && b) { onStart(a, skillA, b, skillB); setOpen(false); setSideAId(''); setSideBId(''); setSkillA(''); setSkillB(''); }
              }}>Begin</button>
            <button className="btn" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </div>
      )}
    </>
  );
}


function AddEnemy({ npcsFromLog, fullNpcs = [], onAdd }) {
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
        techniques: deriveTechniques(school, rank),
        dr: rank >= 3 ? '4k2' : '3k2',
        drawnWeapon: rank >= 3 ? `${school} Attack (4k2)` : `${school} Attack (3k2)`,
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
      {/* Log NPCs - dropdown */}
      {npcsFromLog && npcsFromLog.length > 0 && (
        <div style={{ display: 'flex', gap: '.3rem', marginTop: '.35rem', alignItems: 'center' }}>
          <select defaultValue="" style={{ fontSize: 12, flex: 1 }}
            onChange={e => {
              const n = npcsFromLog.find(x => x.id === e.target.value);
              if (!n) return;
              onAdd({
                id: 'npc_log_' + n.id + '_' + Date.now(),
                name: n.name, school: n.school, rank: n.rank || 1, faction: n.faction,
                techniques: deriveTechniques(n.school, n.rank || 1),
                dr: n.weapon_dr || '3k2', drawnWeapon: n.weapon || n.weapon_dr ? `${n.weapon || 'Weapon'} (${n.weapon_dr || '3k2'})` : 'Weapon (3k2)',
                reflexes: n.traits?.Reflexes || (n.rank || 1) + 1,
                agility: n.traits?.Agility || (n.rank || 1) + 1,
                air: n.rings?.Air || (n.rank || 1), fire: n.rings?.Fire || (n.rank || 1),
                wound: 0, stance: 'Attack', statusEffects: [], type: 'npc', fromLog: true,
                sourceId: n.id, sourceType: 'npc',
                sharedControllerIds: n.shared_controllers || [],
              });
              e.target.value = '';
            }}>
            <option value="">+ From NPC Log…</option>
            {npcsFromLog.map(n => (
              <option key={n.id} value={n.id}>{n.name} - {n.faction} R{n.rank || 1}</option>
            ))}
          </select>
        </div>
      )}
      {/* Full NPCs (promoted characters) - dropdown */}
      {fullNpcs && fullNpcs.length > 0 && (
        <div style={{ display: 'flex', gap: '.3rem', marginTop: '.35rem', alignItems: 'center' }}>
          <select defaultValue="" style={{ fontSize: 12, flex: 1 }}
            onChange={e => {
              const n = fullNpcs.find(x => x.id === e.target.value);
              if (!n) return;
              const ref = n.reflexes || 2;
              const agi = n.agility || 2;
              onAdd({
                id: 'npc_full_' + n.id + '_' + Date.now(),
                name: n.name, school: n.school, rank: n.insight_rank || n.school_rank || 1, faction: n.faction,
                techniques: (n.techniques && Object.keys(n.techniques).length > 0) ? n.techniques : deriveTechniques(n.school, n.insight_rank || n.school_rank || 1),
                reflexes: ref, agility: agi, air: n.air || 2, fire: n.fire || 2,
                earth: n.earth || 2, water: n.water || 2, void: n.void || 2,
                dr: n.current_weapon?.match(/\((\dk\d)\)/)?.[1] || '3k2',
                drawnWeapon: n.current_weapon || (n.equipment?.find(e => e.dr)?.name) || 'Weapon (3k2)',
                wound: 0, stance: 'Attack', statusEffects: [], type: 'npc', fromLog: false,
                controllerId: n.controller_id || null,
                sharedControllerIds: n.shared_controllers || [],
                sourceId: n.id, sourceType: 'character',
              });
              e.target.value = '';
            }}>
            <option value="">+ From Full NPCs…</option>
            {fullNpcs.map(n => (
              <option key={n.id} value={n.id}>{n.name} - {n.school} R{n.insight_rank || n.school_rank || 1}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

export default function EncounterTab({ isGM, isPCView, characters, myCharId, myCharIds, session, encounter, setEncounter, npcsFromLog, fullNpcs = [], onUpdateCharacter, onAddEncounterEntry, onLogEvent, onLogSkill, preparedEncounters = [], onSavePreparedEncounters, onGlobalRoll, portraitScale = 1.0, onViewCharacter, onViewNpc, arrowTracking = false, downtimeMode = 'gm_granted', playerGlowDefault = false, isObserver = false, everyoneHelps = false, everyoneHelpsPlus = false, shops = [], onOpenShop }) {
  // Ownership checks must use the full set of characters this player controls, not just the
  // first-ever-claimed one - a player with two claimed characters was invisible to every
  // "is this mine" check below whenever their second character was the one up. Falls back to
  // the singular id if a caller hasn't been updated to pass the array yet.
  const myIds = (myCharIds && myCharIds.length) ? myCharIds : (myCharId ? [myCharId] : []);
  const { state, setup, combatants, activeTurn, dmgBanner, envQuirk, round } = encounter;
  const battlefieldConditions = encounter.battlefieldConditions || {};
  const [modal, setModal] = useState(null);
  // Set by BattleGrid's right-click token context menu; consumed by whichever PCTurnPanel
  // instance is currently showing (PC's own turn, or GM running an NPC's turn) to preselect
  // a target + jump straight to Attack or Skill. Keyed by ts so re-picking the same target/action
  // still re-fires the effect that consumes it.
  const [quickTargetRequest, setQuickTargetRequest] = useState(null); // { targetId, action, ts }
  // Set when a player/GM clicks a character's card's "locate" button - recenters the zoomed Battle
  // Grid view on that token, overriding whoever the auto-focus logic would otherwise follow.
  const [focusTokenId, setFocusTokenId] = useState(null);
  const [summaryCombatant, setSummaryCombatant] = useState(null); // GM click-for-summary popup (skills, advantages, disadvantages)
  // Disarm weapon choice - set when a successful Disarm hits a dual-wielding target,
  // requiring the attacker to pick which weapon to take
  const [disarmChoice, setDisarmChoice] = useState(null);
  // Roll result banner - local only, never broadcast, so only the rolling player sees their own result flash
  const [activeNpcId, setActiveNpcId] = useState(null);
  const [view, setView] = useState('columns');
  const [compact, setCompact] = useState(false);
  // showGrid lives in encounter state so it syncs to players
  const showGrid = !!(encounter.showGrid);
  const setShowGrid = (val) => upEnc({ showGrid: typeof val === 'function' ? val(showGrid) : val });
  const [settingUrls, setSettingUrls] = useState({});
  const [customRoundLimits, setCustomRoundLimits] = useState({});
  const GRID_SIZE = setup?.gridSize || 24;
  // Per-cell terrain data - sparse map keyed "x,y" -> { type, radius? } (radius only used by 'light' tiles)
  const gridTiles = encounter.gridTiles || {};
  // Master Atlas + per-type default images (Tileset tab, dev-only) - fetched once here and passed
  // down to BattleGrid, which does the actual atlas-column cropping per tile type/theme row.
  const [atlasUrl, setAtlasUrl] = useState('');
  const [tileDefaultImages, setTileDefaultImages] = useState({});
  const [doodadLibrary, setDoodadLibrary] = useState([]); // definitions ({id, name, width, height, imageUrl, tileType}); placed instances live in setup.doodads
  const [containerImageUrl, setContainerImageUrl] = useState(''); // shared chest icon (Tileset tab); placed instances live in setup.containers
  // Mid-encounter doodad placement - GM picks a library entry, then clicks the grid to drop it in,
  // same click-to-place pattern the Grid Creator already uses. Stamps the footprint into gridTiles
  // (via the same isInDoodadFootprint helper the Creator uses, so shape handling can't drift) and
  // appends the placed instance to setup.doodads, exactly where doodads already live for encounters
  // that started with some pre-placed from a Saved Battle Grid.
  const [placingDoodadDef, setPlacingDoodadDef] = useState(null);
  const handlePlaceDoodad = (x, y) => {
    if (!placingDoodadDef) return;
    const def = placingDoodadDef;
    const inst = { id: `doodadinst_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, defId: def.id, x, y };
    const nextTiles = { ...gridTiles };
    for (let dx = 0; dx < def.width; dx++) {
      for (let dy = 0; dy < def.height; dy++) {
        if (!isInDoodadFootprint(def, dx, dy)) continue;
        const cx = x + dx, cy = y + dy;
        if (cx < 0 || cx >= GRID_SIZE || cy < 0 || cy >= GRID_SIZE) continue;
        nextTiles[`${cx},${cy}`] = { type: def.tileType };
      }
    }
    upEnc({ setup: { ...setup, doodads: [...(setup?.doodads || []), inst] }, gridTiles: nextTiles });
    setPlacingDoodadDef(null);
  };
  useEffect(() => {
    supabase.from('games').select('settings').eq('id', GAME_ID).single().then(({ data }) => {
      setAtlasUrl(data?.settings?.master_atlas_url || '');
      setTileDefaultImages(data?.settings?.tile_default_images || {});
      setDoodadLibrary(data?.settings?.doodad_library || []);
      setContainerImageUrl(data?.settings?.container_image_url || '');
    });
  }, []);
  // Dark (default): unlit AND non-adjacent tiles are hidden from players entirely. Dim: same tiers,
  // nothing hidden, just darkened - a softer option. Full: lighting off, everyone sees everything.
  const lightMode = encounter.lightMode || 'dark';
  const playerGlow = !!encounter.playerGlow; // PC tokens emit their own light radius - off unless the encounter set it (from the GM Settings default at start, or toggled live)
  const freeMove = !!encounter.freeMove; // players can move their own token any time, until an enemy is revealed (see auto-disable effect below)
  // Fills a radius (Euclidean, wall-blocked via the shared raycast) around a source cell into `set`
  const fillLightRadius = (set, lx, ly, radius) => {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (Math.sqrt(dx * dx + dy * dy) > radius) continue;
        const nx = lx + dx, ny = ly + dy;
        if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) continue;
        // Walls block light - a cell within radius but behind a wall from the light source's
        // point of view doesn't get lit, same raycast used for (future) ranged-attack LOS blocking.
        if (!hasLineOfSight(lx, ly, nx, ny, gridTiles)) continue;
        set.add(`${nx},${ny}`);
      }
    }
  };
  const litCells = React.useMemo(() => {
    if (lightMode === 'full') return null;
    const set = new Set();
    Object.entries(gridTiles).forEach(([key, t]) => {
      if (t?.type !== 'light' && t?.type !== 'fire') return; // fire tiles cast light too, not just the dedicated Light tile type
      const [lx, ly] = key.split(',').map(Number);
      fillLightRadius(set, lx, ly, t.radius || 3);
    });
    if (playerGlow) {
      (combatants || []).forEach(c => {
        if (c.type !== 'pc' || c.gridX === undefined || c.gridY === undefined) return;
        fillLightRadius(set, c.gridX, c.gridY, 3);
      });
    }
    // Per-NPC glow - same radius as Player Glow, but toggled individually per NPC card (GM-only,
    // grid encounters only) rather than a blanket setting.
    (combatants || []).forEach(c => {
      if (!c.glowing || c.gridX === undefined || c.gridY === undefined) return;
      fillLightRadius(set, c.gridX, c.gridY, 3);
    });
    // Wielded light sources (Torch/Lantern/Oil Lamp) - independent of Player Glow; only applies when
    // one of these specific items is actually equipped. Looked up live against the character's own
    // equipment (via `characters`, not a snapshot on the combatant) since drawing/stowing a light
    // source mid-encounter should update lighting immediately, unlike identity fields that must be
    // snapshotted at spawn time. pcsMap isn't in scope yet at this point in the file, hence the find().
    (combatants || []).forEach(c => {
      if (c.gridX === undefined || c.gridY === undefined) return;
      const equipment = characters.find(ch => ch.id === c.id)?.equipment || [];
      const litItem = equipment.find(e => e.equipped && LIGHT_SOURCES[e.name]);
      if (litItem) fillLightRadius(set, c.gridX, c.gridY, LIGHT_SOURCES[litItem.name]);
    });
    return set;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gridTiles, lightMode, playerGlow, combatants, characters, GRID_SIZE]);
  // Dim tier - any cell touching (8-directionally) a lit cell but not itself lit. This is what makes
  // a wall next to a torch visible as a wall (dimly), even though light doesn't pass through it -
  // without this, "dark = fully hidden" would also hide the near face of every wall bounding a lit room.
  const dimCells = React.useMemo(() => {
    if (!litCells) return null;
    const set = new Set();
    litCells.forEach(key => {
      const [x, y] = key.split(',').map(Number);
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) continue;
          const nk = `${nx},${ny}`;
          if (!litCells.has(nk)) set.add(nk);
        }
      }
    });
    return set;
  }, [litCells, GRID_SIZE]);
  // Enemy cards are hidden from players (not the GM) while their token sits in the fully-dark tier -
  // only in strict Dark mode; Dim mode never hides anything, just darkens it.
  const isEnemyShrouded = (c) => {
    if (isGM && !isPCView) return false;
    if (lightMode !== 'dark' || !litCells) return false;
    if (c.type !== 'npc' || c.gridX === undefined || c.gridY === undefined) return false;
    const key = `${c.gridX},${c.gridY}`;
    return !litCells.has(key) && !(dimCells && dimCells.has(key));
  };

  // "Enemies (N)" shouldn't give away the true count to players while some are hidden in darkness -
  // show known enemies + a "?" for however many more might be lurking unseen, instead of the real total.
  const enemyCountLabel = (list) => {
    if (isGM && !isPCView) return `${list.length}`;
    const hiddenCount = list.filter(c => isEnemyShrouded(c)).length;
    const knownCount = list.length - hiddenCount;
    return hiddenCount > 0 ? `${knownCount}+?` : `${knownCount}`;
  };

  useEffect(() => {
    supabase.from('games').select('settings').eq('id', GAME_ID).single().then(({ data }) => {
      if (data?.settings?.setting_urls) setSettingUrls(data.settings.setting_urls);
      if (data?.settings?.round_limits) setCustomRoundLimits(data.settings.round_limits);
    });
  }, []);
  const [npcTargets, setNpcTargets] = useState({}); // npcId -> action
  const [targeting, setTargeting] = useState(null);
  const [popup, setPopup] = useState(null);

  const upEnc = patch => setEncounter(e => ({ ...e, ...patch }));
  const pcsMap = Object.fromEntries(characters.map(c => [c.id, c]));

  // ── Contested Roll tool ────────────────────────────────────────────────────
  const startContestedRoll = (charA, skillNameA, charB, skillNameB) => {
    const makeSide = (c, skillName) => {
      const full = pcsMap[c.id] || c;
      const isTrait = skillName.startsWith('Trait: ');
      if (isTrait) {
        const traitName = skillName.replace('Trait: ', '');
        return {
          id: c.id, name: c.name, skillName, isTrait: true, traitKey: traitName.toLowerCase(),
          rolled: null,
        };
      }
      const skill = (full.skills || []).find(s => s.name === skillName);
      const mapping = SKILL_TRAIT_MAP[skillName] || { trait: 'Agility', ring: 'Fire' };
      const traitKey = mapping.trait.toLowerCase();
      const ringKey = mapping.ring.toLowerCase();
      return {
        id: c.id, name: c.name, skillName,
        traitKey, ringKey,
        rolled: null, // filled in once this side rolls
      };
    };
    upEnc({ contestedRoll: {
      sideA: makeSide(charA, skillNameA),
      sideB: makeSide(charB, skillNameB),
      winner: null,
      ts: Date.now(),
    }});
    onLogEvent && onLogEvent('ti-scale', `Contested Roll: ${charA.name} (${skillNameA}) vs ${charB.name} (${skillNameB})`);
  };

  // Disadvantages that grant the OPPONENT a bonus on a specific contested skill against the disadvantaged
  // character. Generic computeBonuses() can never apply these - it only ever sees the rolling character,
  // not who they're rolling against - but a Contested Roll knows both sides, so it's the one place these
  // can actually be automated. Emphasis-level nuance (Bribery vs. general Temptation, etc.) isn't tracked
  // at the roll level, so this applies whenever the matching skill is used in a contest against them.
  const OPPONENT_BONUS_DISADVANTAGES = {
    Temptation: [{ name: 'Greedy', rolled: 1, kept: 1 }, { name: 'Lechery', rolled: 1, kept: 1 }],
    Sincerity: [{ name: 'Gullible', rolled: 1, kept: 1 }, { name: 'Failure of Sincerity', rolled: 1, kept: 0 }],
    'Trait: Willpower': [{ name: 'Frail Mind', rolled: 2, kept: 0 }],
  };
  const getOpponentDisadvantageBonus = (targetChar, skillName) => {
    const entries = OPPONENT_BONUS_DISADVANTAGES[skillName] || [];
    const targetDisNames = (targetChar?.disadvantages || []).map(d => (typeof d === 'string' ? d : d?.name) || '');
    return entries.filter(e => targetDisNames.includes(e.name))
      .reduce((acc, e) => ({ rolled: acc.rolled + e.rolled, kept: acc.kept + e.kept, names: [...acc.names, e.name] }),
        { rolled: 0, kept: 0, names: [] });
  };

  const rollContestedSide = (side) => {
    const cr = encounter.contestedRoll;
    if (!cr) return;
    const sideData = cr[side];
    const full = pcsMap[sideData.id];
    if (!full || !onGlobalRoll) return;
    const traitVal = full[sideData.traitKey] || 2;
    const insightRank = full.insight_rank || full.school_rank || 1;
    // Opponent-facing disadvantage bonus - e.g. rolling Temptation against someone with Greedy
    const opposingSideKey = side === 'sideA' ? 'sideB' : 'sideA';
    const opposingChar = pcsMap[cr[opposingSideKey]?.id];
    const oppBonus = getOpponentDisadvantageBonus(opposingChar, sideData.skillName);
    // Universal rule: defending against Intimidation or Temptation (Bribery/Seduction/etc.) adds the
    // defender's own Integrity as a suggested flat modifier - pre-filled but still player/GM-adjustable
    // in the roll modal, not silently forced, in case it doesn't apply to this specific situation.
    const opposingSkill = cr[opposingSideKey]?.skillName;
    const integrityDefenseBonus = (opposingSkill === 'Intimidation' || opposingSkill === 'Temptation') ? Math.round(full.integrity || 0) : 0;

    if (sideData.isTrait) {
      // Trait-only contested roll (e.g. Willpower vs. fear/manipulation): rolled = Trait + Insight Rank,
      // kept = Trait itself - matches the conversion doc's "Trait / Insight Rank (keeping Trait)" pattern.
      onGlobalRoll({
        skill: sideData.skillName,
        ring: sideData.traitKey.charAt(0).toUpperCase() + sideData.traitKey.slice(1),
        ringVal: traitVal,
        baseRoll: traitVal + insightRank + oppBonus.rolled,
        baseKeep: traitVal + oppBonus.kept,
        tn: 5,
        character: full,
        currentVoid: full.current_void,
        label: `Contested Roll - ${sideData.skillName}`,
        suggestedFlatMod: integrityDefenseBonus || undefined,
        bonusNotes: [
          ...(oppBonus.names.length > 0 ? [`+${oppBonus.rolled}k${oppBonus.kept} vs opponent's ${oppBonus.names.join(', ')}`] : []),
          ...(integrityDefenseBonus > 0 ? [`+${integrityDefenseBonus} Integrity vs ${opposingSkill}`] : []),
        ],
        onComplete: (total) => {
          setEncounter(e => {
            const cur = e.contestedRoll;
            if (!cur) return e;
            const updated = { ...cur, [side]: { ...cur[side], rolled: total } };
            if (updated.sideA.rolled !== null && updated.sideB.rolled !== null) {
              updated.winner = updated.sideA.rolled === updated.sideB.rolled ? 'tie'
                : (updated.sideA.rolled > updated.sideB.rolled ? 'sideA' : 'sideB');
              if (onLogEvent) {
                const margin = Math.abs(updated.sideA.rolled - updated.sideB.rolled);
                onLogEvent('ti-scale', updated.winner === 'tie'
                  ? `Contested Roll - tie! ${updated.sideA.rolled} vs ${updated.sideB.rolled}`
                  : `Contested Roll - ${updated[updated.winner].name} wins (${updated.sideA.rolled} vs ${updated.sideB.rolled}, margin ${margin})`);
              }
            }
            return { ...e, contestedRoll: updated };
          });
        },
      });
      return;
    }

    const skill = (full.skills || []).find(s => s.name === sideData.skillName);
    const ringVal = full[sideData.ringKey] || 2;
    onGlobalRoll({
      skill: sideData.skillName,
      skillRank: skill?.rank || 0,
      ring: sideData.ringKey.charAt(0).toUpperCase() + sideData.ringKey.slice(1),
      ringVal,
      baseRoll: (skill?.rank || 0) + traitVal + oppBonus.rolled,
      baseKeep: ringVal + oppBonus.kept,
      tn: 5, // contested rolls don't use a fixed TN - total is compared directly between sides
      character: full,
      currentVoid: full.current_void,
      label: `Contested Roll - ${sideData.skillName}`,
      suggestedFlatMod: integrityDefenseBonus || undefined,
      bonusNotes: [
        ...(oppBonus.names.length > 0 ? [`+${oppBonus.rolled}k${oppBonus.kept} vs opponent's ${oppBonus.names.join(', ')}`] : []),
        ...(integrityDefenseBonus > 0 ? [`+${integrityDefenseBonus} Integrity vs ${opposingSkill}`] : []),
      ],
      onComplete: (total) => {
        setEncounter(e => {
          const cur = e.contestedRoll;
          if (!cur) return e;
          const updated = { ...cur, [side]: { ...cur[side], rolled: total } };
          // Once both sides have rolled, determine the winner
          if (updated.sideA.rolled !== null && updated.sideB.rolled !== null) {
            updated.winner = updated.sideA.rolled === updated.sideB.rolled ? 'tie'
              : (updated.sideA.rolled > updated.sideB.rolled ? 'sideA' : 'sideB');
            if (onLogEvent) {
              const margin = Math.abs(updated.sideA.rolled - updated.sideB.rolled);
              onLogEvent('ti-scale', updated.winner === 'tie'
                ? `Contested Roll - tie! ${updated.sideA.rolled} vs ${updated.sideB.rolled}`
                : `Contested Roll - ${updated[updated.winner].name} wins (${updated.sideA.rolled} vs ${updated.sideB.rolled}, margin ${margin})`);
            }
          }
          return { ...e, contestedRoll: updated };
        });
      },
    });
  };

  const active = combatants[activeTurn % Math.max(1, combatants.length)];
  const enemies = combatants.filter(c => c.type === 'npc');
  const party = combatants.filter(c => c.type === 'pc');
  // Stealth auto-detection (flat Perception×5, per Charles - not a rolled contest): for each NPC
  // with a grid position and line of sight to a PC carrying a "Stealth: N" badge, if the NPC's
  // Perception trait × 5 meets or beats that N, the NPC has detected them. This is a live, continuously
  // re-evaluated computation (not a persisted one-time discovery) - quietly re-checks every render, no
  // manual GM roll needed. Exclamation mark shows on the DETECTING NPC's card (not the hidden PC's).
  const stealthDetectorIds = new Set();
  if (showGrid) {
    const stealthedPcs = party
      .filter(p => p.gridX !== undefined)
      .map(p => {
        const badge = (p.statusEffects || []).find(e => e.startsWith('Stealth:'));
        const tn = badge ? parseInt(badge.split(':')[1], 10) : null;
        return tn ? { ...p, stealthTN: tn } : null;
      })
      .filter(Boolean);
    if (stealthedPcs.length > 0) {
      enemies.forEach(npc => {
        if (npc.gridX === undefined) return;
        const source = npc.sourceType === 'character' ? pcsMap[npc.sourceId] : null;
        const perception = source?.perception ?? 2; // Quick NPCs don't track individual traits - default to baseline
        const threshold = perception * 5;
        const detects = stealthedPcs.some(p => threshold >= p.stealthTN && hasLineOfSight(npc.gridX, npc.gridY, p.gridX, p.gridY, gridTiles));
        if (detects) stealthDetectorIds.add(npc.id);
      });
    }
  }
  const isMyTurn = myIds.includes(active?.id)
    || (!isObserver && active?.type === 'pc' && (everyoneHelps || everyoneHelpsPlus))
    || (!isObserver && active?.type === 'npc' && everyoneHelpsPlus)
    || (!isObserver && active?.type === 'npc' && (active?.sharedControllerIds || []).some(id => myIds.includes(id)));

  // Orphaned shop tokens: if a shop referenced by a placed grid token was deleted from the Bazaar,
  // that cell becomes a real 'fire' terrain tile (Charles's call) instead of silently dangling. GM-only
  // so only one client ever performs the write; runs once per shop-list change, not every render.
  React.useEffect(() => {
    if (!isGM || isPCView) return;
    const tokens = setup?.shopTokens || [];
    if (tokens.length === 0) return;
    const orphaned = tokens.filter(t => !shops.some(s => s.id === t.shopId));
    if (orphaned.length === 0) return;
    const survivors = tokens.filter(t => shops.some(s => s.id === t.shopId));
    const nextTiles = { ...gridTiles };
    orphaned.forEach(t => {
      if (t.x !== null && t.x !== undefined && t.y !== null && t.y !== undefined) {
        nextTiles[`${t.x},${t.y}`] = { type: 'fire' };
      }
    });
    upEnc({ setup: { ...setup, shopTokens: survivors }, gridTiles: nextTiles });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGM, isPCView, shops, setup?.shopTokens]);

  // Free Move auto-disable: the moment any enemy transitions from hidden to visible while Free Move
  // is on, turn it off and go back to strict turn order. Tracks each enemy's hidden/visible state
  // per-render (not just "is anyone visible right now") so this only fires on an actual reveal, not
  // because enemies started already visible (e.g. lighting is off, or it's daytime).
  const wasHiddenRef = React.useRef({});
  React.useEffect(() => {
    if (!freeMove) { wasHiddenRef.current = {}; return; }
    let revealed = false;
    enemies.forEach(en => {
      const hidden = isEnemyShrouded(en);
      if (wasHiddenRef.current[en.id] === undefined) wasHiddenRef.current[en.id] = hidden;
      else if (wasHiddenRef.current[en.id] && !hidden) revealed = true;
      wasHiddenRef.current[en.id] = hidden;
    });
    if (revealed) {
      upEnc({ freeMove: false });
      onLogEvent && onLogEvent('ti-eye', 'An enemy is revealed - turn order resumes.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [freeMove, enemies, litCells, dimCells]);

  // ── Actions ─────────────────────────────────────────────────────────────
  // ── Training Dummy ──────────────────────────────────────────────────────────
  // Reuses the exact same real combat interface as a normal encounter (stances, maneuvers, raises, void,
  // everything) - just against a single infinite-health dummy, with logging and persistence suppressed.
  // App.js wraps onLogEvent/onUpdateCharacter with no-ops whenever encounter.trainingSession is true.
  const startTrainingSession = (charId) => {
    const pc = pcsMap[charId];
    if (!pc) return;
    const G = 24;
    const centerY = Math.floor(G / 2);
    const pcCombatant = {
      id: pc.id, name: pc.name, type: 'pc',
      school: pc.school, faction: pc.faction,
      reflexes: pc.reflexes, agility: pc.agility, air: pc.air, fire: pc.fire,
      earth: pc.earth || 2, water: pc.water || 2, strength: pc.strength || 2,
      insight_rank: pc.insight_rank || pc.school_rank || 1,
      defenseSkillRank: (pc.skills || []).find(s => s.name === 'Defense')?.rank || 0,
      void: pc.void || 2, current_void: pc.current_void ?? pc.void ?? 2,
      avatar_url: pc.avatar_url || '', avatar_type: pc.avatar_type || 'warrior', avatar_color: pc.avatar_color || FACTION_COLORS[pc.faction] || '#c8962a',
      wound: 0, stance: 'Attack', init: 99, _initRolled: true,
      dr: pc.current_weapon?.match(/\((\dk\d)\)/)?.[1] || '3k2',
      drawnWeapon: pc.current_weapon || 'Unarmed (1k1)',
      statusEffects: [], _action: null,
      gridX: 2, gridY: centerY, startX: 2, startY: centerY,
    };
    const dummyCombatant = {
      id: 'training_dummy', name: 'Training Dummy', type: 'npc',
      faction: 'Creatures', sub: 'Construct',
      earth: 5, water: 2, fire: 2, air: 2, strength: 2, void: 0,
      wound: 0, stance: 'Attack', init: 1, _initRolled: true,
      statusEffects: [], _action: null,
      infiniteHealth: true, // damage is never actually applied to this combatant
      gridX: G - 3, gridY: centerY, startX: G - 3, startY: centerY,
    };
    upEnc({
      state: 'active', trainingSession: true,
      setup: { type: 'Action', setting: 'Training', name: 'Training Dummy', gridSize: G },
      combatants: [pcCombatant, dummyCombatant],
      activeTurn: 0, round: 1, dmgBanner: null, envQuirk: null,
    });
  };

  const endTrainingSession = () => {
    upEnc({ state: 'idle', trainingSession: false, combatants: [], activeTurn: 0, dmgBanner: null });
  };

  // Containers - standalone (not a tile type, not a doodad). Clicking one while adjacent grants its
  // contents straight to the acting character's inventory - no roll required - and marks it looted so
  // it can't be opened twice. GM clicking a container just previews its contents instead of looting it.
  const handleInvestigateContainer = (containerId) => {
    const container = (setup?.containers || []).find(ct => ct.id === containerId);
    if (!container) return;
    if (isGM && !isPCView) {
      alert(`${container.name}${container.looted ? ' (already looted)' : ''}:\n${(container.contents || []).map(it => `${it.name} x${it.qty || 1}`).join('\n') || '(empty)'}`);
      return;
    }
    if (container.looted) { if (onLogEvent) onLogEvent('ti-box', `${container.name} has already been looted.`); return; }
    const myCombatantsInRange = combatants.filter(c => myIds.includes(c.id) && c.gridX !== undefined && chebyshevDist(c.gridX, c.gridY, container.x, container.y) <= 1);
    if (myCombatantsInRange.length === 0) return; // not adjacent - silently do nothing, matching a locked/out-of-reach object
    const actor = pcsMap[myCombatantsInRange[0].id];
    if (!actor) return;
    upEnc({ setup: { ...setup, containers: (setup.containers || []).map(ct => ct.id === containerId ? { ...ct, looted: true } : ct) } });
    const items = (container.contents || []).map(it => ({ name: it.name, qty: it.qty || 1, equipped: false, inUse: false, category: 'Gear' }));
    if (items.length && onUpdateCharacter) onUpdateCharacter(actor.id, { equipment: [...(actor.equipment || []), ...items] });
    if (onLogEvent) onLogEvent('ti-box', `${actor.name} opened ${container.name} and found${items.length ? ': ' + items.map(i => i.name).join(', ') : ' nothing'}.`);
  };

  // Commerce - right-click a shop token while adjacent to jump the acting player's own Shop tab to
  // that one shop (bypassing the normal "shops closed during an encounter" rule for just this one),
  // and grant them 2 Granted Actions specifically to spend on Appraise/Haggle there.
  const handleOpenShopCommerce = (shopTokenId) => {
    const token = (setup?.shopTokens || []).find(t => t.id === shopTokenId);
    if (!token) return;
    const shop = shops.find(s => s.id === token.shopId);
    if (!shop) return; // orphaned - the reconciliation effect will turn this into a fire tile shortly
    const myCombatantsInRange = combatants.filter(c => myIds.includes(c.id) && c.gridX !== undefined && chebyshevDist(c.gridX, c.gridY, token.x, token.y) <= 1);
    if (myCombatantsInRange.length === 0) return; // not adjacent - silently do nothing
    const actor = pcsMap[myCombatantsInRange[0].id];
    if (!actor) return;
    if (onOpenShop) onOpenShop(shop.id, actor.id);
    if (onLogEvent) onLogEvent('ti-shopping-cart', `${actor.name} enters Commerce with ${shop.name}.`);
  };

  const beginEncounter = (s) => {
    const useGrid = s.useGrid !== false;
    // Participants can include both PCs and Full NPCs (characters table rows with is_npc: true,
    // e.g. a promoted named villain) - default to PCs only when nothing's been explicitly chosen,
    // since auto-joining every Full NPC in the roster to every encounter would be surprising.
    const participantIds = s.participantIds || characters.filter(c => !c.is_npc).map(c => c.id);
    const participants = characters.filter(c => participantIds.includes(c.id));
    const G = s.gridSize || 24;
    const centerY = Math.floor(G / 2);
    const tiles = s.gridTiles || {};

    const npcList = s.selectedNPCs || [];
    const npcCombatants = npcList.map((n, i) => {
      let pos = {};
      if (useGrid) {
        // NPCs seeded from a saved Battle Grid's preloaded placements already carry their own
        // gridX/gridY (set in EncounterBuilder from the grid's prebuiltNpcs) - use those directly
        // instead of the automatic column-based placement.
        const hasPresetPos = n.gridX !== undefined && n.gridY !== undefined;
        const col = hasPresetPos ? n.gridX : G - 3;
        const row = hasPresetPos ? n.gridY : Math.max(0, Math.min(G - 1, centerY - Math.floor(npcList.length / 2) + i));
        pos = { gridX: col, gridY: row, startX: col, startY: row };
      }
      // Theater-of-mind (useGrid: false): no position at all - matches the same "no grid position on
      // either side" convention already used by range/reach/LOS checks to mean "nothing to enforce."
      return {
        ...n, ...pos, wound: n.wound || 0, stance: 'Attack',
        init: rollExplodingKeep((n.reflexes || 2) + (n.rank || 1), n.reflexes || 2),
        _initRolled: true,
        statusEffects: [], _action: null,
      };
    });

    // PC Start tiles: GM-painted tile type 'misc3' ("PC Start"). If any exist on this grid, PCs
    // spawn on them (cycling through the painted tiles if there are more PCs than tiles), cascading
    // outward to the nearest free non-wall cell if a tile/seed point is already taken. If the grid
    // has none painted at all, fall back to the old fixed-column placement for backward compatibility
    // with existing saved grids that never used this feature. None of this runs for a theater-of-mind
    // (non-grid) encounter - col/row simply never get computed, so combatants end up with no position.
    const pcStartSeeds = useGrid ? Object.entries(tiles)
      .filter(([, v]) => v?.type === 'misc3')
      .map(([key]) => { const [x, y] = key.split(',').map(Number); return { x, y }; })
      .sort((a, b) => a.y - b.y || a.x - b.x) : [];

    const occupied = new Set(npcCombatants.map(c => `${c.gridX},${c.gridY}`));

    const pcCombatants = participants.map((pc, i) => {
      let col, row;
      if (useGrid) {
        // Full NPCs (checked Participants, is_npc: true) spawn on the enemy side like other NPCs,
        // rather than competing with real PCs for the PC Start tiles / party-side column.
        if (pc.is_npc) {
          col = G - 3;
          row = Math.max(0, Math.min(G - 1, centerY - Math.floor(participants.filter(p => p.is_npc).length / 2) + i));
        } else if (pcStartSeeds.length > 0) {
          const seed = pcStartSeeds[i % pcStartSeeds.length];
          const cell = findNearestFreeCell(G, tiles, occupied, seed.x, seed.y);
          if (cell) { col = cell.x; row = cell.y; }
          // else: leave col/row undefined - PC lands in the unplaced-combatant tray, same as when
          // the grid is entirely full for a mid-encounter add.
        } else {
          col = 2;
          row = Math.max(0, Math.min(G - 1, centerY - Math.floor(participants.length / 2) + i));
        }
        if (col !== undefined) occupied.add(`${col},${row}`);
      }
      const ref = pc.reflexes || 2;
      const ir = pc.insight_rank || pc.school_rank || 1;
      // Full NPCs are GM-controlled, no player to interactively roll/reroll - auto-roll like other
      // NPC combatants (rollExplodingKeep) instead of the PC's roll-and-keep-highest formula.
      const baseInit = pc.is_npc
        ? rollExplodingKeep(ref + ir, ref)
        : (() => {
            const dice = Array.from({length: ref + ir}, () => Math.floor(Math.random() * 10) + 1);
            const sorted = [...dice].sort((a,b) => b - a);
            return sorted.slice(0, ref).reduce((s,d) => s + d, 0);
          })();
      return {
        id: pc.id, name: pc.name, type: pc.is_npc ? 'npc' : 'pc',
        school: pc.school, faction: pc.faction,
        reflexes: pc.reflexes, agility: pc.agility, air: pc.air, fire: pc.fire,
        earth: pc.earth || 2, water: pc.water || 2, strength: pc.strength || 2,
        insight_rank: pc.insight_rank || pc.school_rank || 1,
        defenseSkillRank: (pc.skills || []).find(s => s.name === 'Defense')?.rank || 0,
        void: pc.void || 2, current_void: pc.current_void ?? pc.void ?? 2,
        avatar_url: pc.avatar_url || '', avatar_type: pc.avatar_type || 'warrior', avatar_color: pc.avatar_color || FACTION_COLORS[pc.faction] || '#c8962a',
        wound: getWoundRank(pc.current_wounds, pc.max_wounds),
        stance: 'Attack',
        init: baseInit,
        _initRolled: !!pc.is_npc, // Full NPCs: already rolled, no reroll UI. PCs: players can reroll their own.
        dr: pc.current_weapon?.match(/\((\dk\d)\)/)?.[1] || '3k2',
        drawnWeapon: pc.current_weapon || 'Unarmed (1k1)',
        statusEffects: [], _action: null,
        ...(pc.is_npc ? { controllerId: pc.controller_id || null, sharedControllerIds: pc.shared_controllers || [] } : {}),
        ...(col !== undefined ? { gridX: col, gridY: row, startX: col, startY: row } : {}),
        _arrowStart: (pc.equipment || []).find(e => e.name?.startsWith('Quiver'))?.count ?? null,
      };
    });

    let all = [...pcCombatants, ...npcCombatants].sort((a, b) => b.init - a.init);
    // Outdoor Lighting: derive a starting lightMode from the current time of day instead of always
    // defaulting to Dark. GM can still change it manually once the encounter is live - this only
    // sets the initial value.
    const outdoorLightMode = s.outdoorLighting
      ? ({ Dawn: 'dim', Dusk: 'dim', Night: 'dark', Evening: 'dark' }[encounter?.timeOfDay] || 'full')
      : null;
    // Intrigue Encounter: the two presets Charles wanted - Free Move on, every NPC tagged Friendly.
    if (s.intrigueEncounter) {
      all = all.map(c => c.type === 'npc' ? { ...c, disposition: 'friendly' } : c);
    }
    upEnc({ state: 'active', trainingSession: false, setup: s, combatants: all, activeTurn: 0, round: 1, dmgBanner: null, envQuirk: null, gridTiles: s.gridTiles || {}, playerGlow: playerGlowDefault, showGrid: useGrid, freeMove: !!s.intrigueEncounter, revealedShopId: null, ...(outdoorLightMode ? { lightMode: outdoorLightMode } : {}) });
    setNpcTargets({});
  };

  const advanceTurn = () => {
    let idx = activeTurn;
    let newRound = round || 1;
    let nextCombatants = combatants;
    let landedIdx = 0;
    let skips = 0;
    // Loop instead of a single step so incapacitated (Down/Out, wound rank >= 6) combatants are
    // skipped automatically rather than stopping the encounter on someone who can't act.
    do {
      const nextIdx = (idx + 1) % nextCombatants.length;
      const isNewRound = nextIdx === 0;
      if (isNewRound) newRound = newRound + 1;
      const currentCombatant = nextCombatants[idx];
      // Center stance carry-over: if ending turn in Center, flag for bonus next turn
      const centerCarryBonus = currentCombatant?.stance === 'Center' ? (currentCombatant._centerBonus || true) : false;
      nextCombatants = nextCombatants.map((c, i) => {
        let updated = i === nextIdx
          ? { ...c, _actionsLeft: { full: 1, simple: 2 }, _movesUsed: 0, _tookNonMoveAction: false, _stanceLockedIn: false,
              // Refresh startX/Y to current position at start of each turn - range is measured from here
              startX: c.gridX !== undefined ? c.gridX : c.startX,
              startY: c.gridY !== undefined ? c.gridY : c.startY }
          : c;
        // Apply Center stance carry-over to the current combatant (they earned it this round)
        if (i === idx && centerCarryBonus) {
          updated = { ...updated, _centerBonusPending: true };
        }
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
      idx = isNewRound ? 0 : nextIdx;
      landedIdx = idx;
      skips++;
      if (nextCombatants[landedIdx]?.wound >= 6 && onLogEvent) {
        onLogEvent('ti-skull', `${nextCombatants[landedIdx].name}'s turn auto-passed (incapacitated)`);
      }
      // Safety bound: if every combatant is Down/Out, stop after one full lap rather than looping forever
    } while (nextCombatants[landedIdx]?.wound >= 6 && skips < nextCombatants.length);
    const nextActiveIdx = landedIdx;
    // On Fire terrain - 1 Wound/round unless armored, applied the moment the standing combatant's turn starts
    const entering = nextCombatants[nextActiveIdx];
    if (entering && entering.gridX !== undefined && gridTiles[`${entering.gridX},${entering.gridY}`]?.type === 'fire') {
      const pc = pcsMap[entering.id];
      const armored = getArmorBonus(pc?.equipment || entering.equipment || []) > 0;
      if (!armored) {
        if (entering.type === 'pc' && pc) {
          const earth = pc.earth || entering.earth || 2;
          const maxWounds = earth * 5 + earth * 2 * 6;
          const newWoundPoints = Math.max(0, Math.min(maxWounds, (pc.current_wounds ?? 0) + 1));
          const newWoundRank = getWoundRank(newWoundPoints, maxWounds, earth);
          nextCombatants = nextCombatants.map(x => x.id === entering.id ? { ...x, wound: newWoundRank } : x);
          onUpdateCharacter(entering.id, { current_wounds: newWoundPoints });
        } else {
          const newWound = Math.max(0, Math.min(7, (entering.wound || 0) + 1));
          nextCombatants = nextCombatants.map(x => x.id === entering.id ? { ...x, wound: newWound } : x);
        }
        if (onLogEvent) onLogEvent('ti-flame', `${entering.name} takes 1 Wound from standing in fire`);
      }
    }
    upEnc({ activeTurn: nextActiveIdx, round: newRound, dmgBanner: null, combatants: nextCombatants });
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
  const spendAction = (type = 'full', isMove = false) => {
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
    const newCombatants = combatants.map((x, i) => i === activeTurn ? { ...x, _actionsLeft: next, _centerBonusPending: false, ...(isMove ? {} : { _tookNonMoveAction: true }) } : x);
    upEnc({ combatants: newCombatants });
    // Player manually passes turn with the Pass Turn button - no auto-advance
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
      avatarColor: pc?.avatar_color || combatant.avatar_color || FACTION_COLORS[pc?.faction || combatant.faction] || '#c8962a',
      label: WOUND_LABELS[newWound] || 'Unknown',
      sublabel: newWound > 0 ? `Wound Penalty ${WOUND_PENALTY[newWound]}` : 'Back to Healthy',
      color: WOUND_COLORS[newWound] || '#4a8a40',
      ts: Date.now(),
    };
  };

  const applyStatus = (id, effect, value) => {
    // Special: __rename__ renames the combatant
    if (effect === '__rename__' && value) {
      upEnc({ combatants: combatants.map(x => x.id === id ? { ...x, name: value } : x) });
      return;
    }
    const c = combatants.find(x => x.id === id);
    upEnc({
      combatants: combatants.map(x => x.id === id ? { ...x, statusEffects: [...(x.statusEffects || []).filter(e => e !== effect), effect] } : x),
      ...(c?.type === 'pc' ? { statusBanner: {
        type: 'condition',
        charName: c.name,
        avatarUrl: (pcsMap[id]?.avatar_url || c.avatar_url || '').trim(),
        avatarColor: pcsMap[id]?.avatar_color || c.avatar_color || FACTION_COLORS[pcsMap[id]?.faction || c.faction] || '#c8962a',
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
    if (delta > 0) playDamage();

    if (c.type === 'pc') {
      // PCs: adjust the real current_wounds point total by 1 (or whatever delta is passed),
      // then derive the displayed wound rank from that - instead of jumping ranks directly.
      const pc = pcsMap[id];
      const earth = pc?.earth || c.earth || 2;
      const maxWounds = earth * 5 + earth * 2 * 6; // Healthy buffer + 6 ranks of Earth×2
      const curWounds = pc?.current_wounds ?? 0;
      let newWoundPoints = Math.max(0, Math.min(maxWounds, curWounds + delta));
      let newWoundRank = getWoundRank(newWoundPoints, maxWounds, earth);

      // Dark Fate (disadvantage) / Great Destiny (advantage): once per session, when this would kill you
      // (Out rank), you're reduced to 1 Wound point instead. Both share identical text - same hook.
      let lifesaverUsed = null;
      if (newWoundRank >= 7 && pc) {
        const lifesaverEntry = [...(pc.advantages || []).map(a => ({ ...a, _list: 'advantages' })), ...(pc.disadvantages || []).map(d => ({ ...d, _list: 'disadvantages' }))]
          .find(e => (e.name === 'Great Destiny' || e.name === 'Dark Fate') && e.usedInSessionId !== session?.id);
        if (lifesaverEntry) {
          newWoundPoints = 1;
          newWoundRank = getWoundRank(1, maxWounds, earth);
          lifesaverUsed = lifesaverEntry;
        }
      }

      const rankChanged = newWoundRank !== c.wound;

      const extra = (delta > 0 && rankChanged)
        ? { statusBanner: makeWoundBanner(c, newWoundRank) }
        : {};
      upEnc({ combatants: combatants.map(x => x.id === id ? { ...x, wound: newWoundRank } : x), ...extra });
      if (extra.statusBanner) setTimeout(() => upEnc({ statusBanner: null }), 4000);
      if (pc) onUpdateCharacter(id, { current_wounds: newWoundPoints });
      if (lifesaverUsed) {
        const listKey = lifesaverUsed._list;
        const updatedList = (pc[listKey] || []).map(e => e.name === lifesaverUsed.name ? { ...e, usedInSessionId: session?.id } : e);
        onUpdateCharacter(id, { [listKey]: updatedList });
        if (onLogEvent) onLogEvent('ti-shield-star', `${c.name} would have died - ${lifesaverUsed.name} reduces them to 1 Wound instead (used this session)`);
      }
    } else {
      // NPCs/monsters: no current_wounds field tracked on a character row, so adjust
      // the encounter-state wound rank directly by single steps (existing simpler model).
      const newWound = Math.max(0, Math.min(7, c.wound + delta));
      upEnc({ combatants: combatants.map(x => x.id === id ? { ...x, wound: newWound } : x) });
    }
  };

  // Per-NPC glow - same 3-square wall-blocked light radius as Player Glow, but toggled individually
  // per NPC card rather than a blanket setting. Only meaningful (and only shown) on a grid encounter.
  const toggleGlow = (id) => {
    upEnc({ combatants: combatants.map(x => x.id === id ? { ...x, glowing: !x.glowing } : x) });
  };

  const handleRollResult = (result, damage) => {
    // Capture all modal values BEFORE clearing - setModal(null) causes re-render
    // and subsequent references to `modal` would read stale null
    const capturedModal = modal;
    setModal(null);
    if (!capturedModal) return;

    // Track skill usage - PC-driven rolls only. NPC/GM turns always pass character: null (same
    // pattern used throughout this file), so this keeps GM actions out of player skill stats.
    if (capturedModal.skill && capturedModal.character && onLogSkill) onLogSkill(capturedModal.skill);

    // Broadcast result to all players via encounter state
    const banner = {
      charName: capturedModal.character?.name || active?.name || '',
      skillName: capturedModal.skill || 'Roll',
      total: result?.total ?? result,
      tn: capturedModal.tn,
      success: result?.success ?? (typeof result === 'number' ? result >= (capturedModal.tn || 15) : false),
      ts: Date.now(),
    };
    // Grapple contact roll resolution. Per the rulebook: contact succeeds → Contested Strength Roll to
    // gain control. Per Core Rulebook p.83: "If the Free Raise is not used for a specific effect, it
    // instead adds +5 to the character's total for that roll." So each raise spent strengthening the
    // grapple on the contact roll becomes a flat +5 on the ensuing Contested Strength total - not extra
    // dice. This never deals damage directly - control is tracked in encounter.grapples and resolved
    // round-by-round via the Grapple Control panel (release/damage/re-contest).
    if (capturedModal.isGrappleContact && capturedModal.targetId) {
      if (result?.success) {
        // Free Raise, per Core Rulebook p.83: "If the Free Raise is not used for a specific effect, it
        // instead adds +5 to the character's total for that roll." Flat total bonus, not extra dice.
        const raiseCount = result?.raises?.length || 0;
        const freeRaiseBonus = raiseCount * 5;
        const attackerStr = capturedModal.character?.strength || 2;
        const target = combatants.find(c => c.id === capturedModal.targetId);
        const defStr = target?.strength || pcsMap[capturedModal.targetId]?.strength || 2;
        const atkTotal = rollExplodingKeep(attackerStr, attackerStr) + freeRaiseBonus;
        const defTotal = rollExplodingKeep(defStr, defStr);
        const attackerId = active?.id;
        const controllerId = atkTotal > defTotal ? attackerId : capturedModal.targetId;
        const heldId = controllerId === attackerId ? capturedModal.targetId : attackerId;
        upEnc({
          combatants: combatants.map(c => c.id === heldId
            ? { ...c, statusEffects: [...(c.statusEffects || []).filter(e => e !== 'Grappled'), 'Grappled'] }
            : c),
          grapples: [
            ...((encounter?.grapples || []).filter(g => g.attackerId !== attackerId && g.targetId !== capturedModal.targetId)),
            { id: `${attackerId}-${capturedModal.targetId}-${Date.now()}`, attackerId, targetId: capturedModal.targetId, controllerId, heldId, previousControllerId: controllerId },
          ],
        });
        onLogEvent && onLogEvent('ti-hand-grab', `Grapple - Contested Strength: ${atkTotal} vs ${defTotal}${freeRaiseBonus > 0 ? ` (+${freeRaiseBonus} flat from ${raiseCount} Free Raise${raiseCount !== 1 ? 's' : ''})` : ''} - ${controllerId === attackerId ? capturedModal.character?.name : capturedModal.targetName} gains control`);
      } else {
        onLogEvent && onLogEvent('ti-hand-grab', `Grapple contact failed - ${capturedModal.targetName || 'target'} avoids the grab`);
      }
      upEnc({ rollBanner: banner });
      return;
    }

    if (damage !== null && damage !== undefined && capturedModal.targetId) {
      playDamage();
      const target = combatants.find(c => c.id === capturedModal.targetId);
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

      // For NPC targets - add damage info to the success banner itself
      const bannerWithDmg = target?.type === 'npc' ? {
        ...banner,
        damage,
        targetName: target.name,
        newWoundLabel: woundChanged ? WOUND_LABELS[newWound] : null,
        oldWoundLabel: woundChanged ? WOUND_LABELS[target.wound || 0] : null,
      } : banner;

      upEnc({
        combatants: combatants.map(c => c.id === capturedModal.targetId
          ? (c.infiniteHealth ? c : { ...c, wound: Math.min(7, c.wound + woundDelta), voidReduceDamage: false })
          : c),
        dmgBanner: { attackerName: active?.name, targetId: capturedModal.targetId, damage, result: result?.total ?? result },
        rollBanner: bannerWithDmg,
        ...(sb ? { statusBanner: sb } : {}),
      });
      if (sb) setTimeout(() => upEnc({ statusBanner: null }), 4000);
    } else {
      upEnc({ rollBanner: banner });
    }

    // Spend void if used - deduct however many Void Points were actually spent this roll
    // (attack-roll enhancement and sword-damage enhancement are separate spends, can both occur)
    if (result?.usedVoid && active?.type === 'pc') {
      const pc = pcsMap[active.id];
      const spend = result?.voidSpentCount || 1;
      if (pc) onUpdateCharacter(active.id, { current_void: Math.max(0, (pc.current_void || 0) - spend) });
    }

    // Auto-track Stealth and Perception rolls as persistent status conditions
    const skillName = capturedModal.skill || '';
    const rollTotal = result?.total ?? (typeof result === 'number' ? result : null);
    if (rollTotal !== null && (skillName === 'Stealth' || skillName.startsWith('Perception'))) {
      const label = `${skillName}: ${rollTotal}`;
      const targetId = capturedModal.combatantId || active?.id;
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
    if (result?.success && result?.raises?.length > 0 && capturedModal.targetId) {
      const maneuvers = result.raises;
      // Corrected per L5R 4th Edition core rules. Feint has no fixed cost - its cost equals however
      // many raises were spent on it (read directly from the maneuver string count, since Feint can't
      // be selected multiple times via the button UI - see DiceModal note). Increased Damage tiers are
      // handled the same way: each tier IS its own cost.
      const RAISE_COST = {
        'Feint (2)': 2,
        'Guard (0)': 0,
        'Knockdown - Biped (2)': 2,
        'Knockdown - Quadruped (4)': 4,
        'Disarm (3)': 3,
        'Extra Attack (5)': 5,
        'Called Shot - Limb (1)': 1,
        'Called Shot - Hand/Foot (2)': 2,
        'Called Shot - Head (3)': 3,
        'Called Shot - Eye/Ear/Finger (4)': 4,
        'Narrative (1)': 1,
      };
      const totalRaises = result.raises.length;
      let raisesSpent = 0;
      const effects = [];

      maneuvers.forEach(m => {
        const cost = RAISE_COST[m] || 1;
        if (raisesSpent + cost <= totalRaises) {
          raisesSpent += cost;
          effects.push(m);
        } else if (onLogEvent) {
          onLogEvent('ti-alert-triangle', `${m} not applied - insufficient raises (needs ${cost}, ${totalRaises - raisesSpent} available)`);
        }
      });

      if (effects.length > 0) {
        let newCombatants = [...combatants];

        effects.forEach(effect => {
          if (effect === 'Knockdown - Biped (2)' || effect === 'Knockdown - Quadruped (4)') {
            const attackerStr = capturedModal.character?.strength || 2;
            const target = combatants.find(c => c.id === capturedModal.targetId);
            const defStr = target?.strength || pcsMap[capturedModal.targetId]?.strength || 2;
            // Plain Contested Strength roll, per L5R 4E core rules - no Insight Rank or Earth involved
            const atkTotal = rollExplodingKeep(attackerStr, attackerStr);
            const defTotal = rollExplodingKeep(defStr, defStr);
            if (atkTotal > defTotal) {
              newCombatants = newCombatants.map(c => c.id === capturedModal.targetId
                ? { ...c, statusEffects: [...(c.statusEffects || []).filter(e => e !== 'Prone'), 'Prone'] }
                : c);
              onLogEvent && onLogEvent('ti-arrow-down', `Knockdown - Contested Strength: ${atkTotal} vs ${defTotal} - ${capturedModal.targetName || 'target'} is Prone`);
            } else {
              onLogEvent && onLogEvent('ti-arrow-down', `Knockdown resisted - ${atkTotal} vs ${defTotal}`);
            }
          }
          if (effect === 'Disarm (3)') {
            // L5R 4E: a successful Disarm deals only a flat 2k1 damage (already applied via DiceModal's
            // damage phase override), then a plain Contested Strength roll determines if the weapon drops.
            // If the target is dual-wielding, the attacker chooses which weapon.
            const attackerStr = capturedModal.character?.strength || 2;
            const target = combatants.find(c => c.id === capturedModal.targetId);
            const defStr = target?.strength || pcsMap[capturedModal.targetId]?.strength || 2;
            const atkTotal = rollExplodingKeep(attackerStr, attackerStr);
            const defTotal = rollExplodingKeep(defStr, defStr);
            if (atkTotal > defTotal) {
              const targetWeapons = target?.drawnWeapons?.length > 0 ? target.drawnWeapons : (target?.drawnWeapon ? [target.drawnWeapon] : []);
              if (targetWeapons.length > 1) {
                // Multiple weapons - attacker must choose which to disarm
                setDisarmChoice({ targetId: capturedModal.targetId, weapons: targetWeapons, attackerName: capturedModal.character?.name, targetName: capturedModal.targetName });
                onLogEvent && onLogEvent('ti-sword-off', `Disarm - Contested Strength: ${atkTotal} vs ${defTotal} - ${capturedModal.character?.name} chooses which weapon to disarm from ${capturedModal.targetName}`);
              } else if (targetWeapons.length === 1) {
                newCombatants = newCombatants.map(c => c.id === capturedModal.targetId
                  ? { ...c, drawnWeapon: null, drawnWeapons: [], statusEffects: [...(c.statusEffects || []).filter(e => e !== 'Disarmed'), 'Disarmed'] }
                  : c);
                onLogEvent && onLogEvent('ti-sword-off', `Disarm - Contested Strength: ${atkTotal} vs ${defTotal} - ${capturedModal.targetName || 'target'} drops their weapon!`);
              } else {
                onLogEvent && onLogEvent('ti-sword-off', `Disarm - ${capturedModal.targetName || 'target'} has no weapon to drop.`);
              }
            } else {
              onLogEvent && onLogEvent('ti-sword-off', `Disarm resisted - Contested Strength: ${atkTotal} vs ${defTotal}`);
            }
          }
          if (effect === 'Extra Attack (5)') {
            newCombatants = newCombatants.map((c, i) => i === activeTurn
              ? { ...c, _actionsLeft: { ...(c._actionsLeft || { full: 0, simple: 0 }), full: (c._actionsLeft?.full || 0) + 1 } }
              : c);
            onLogEvent && onLogEvent('ti-sword', `Extra Attack - ${capturedModal.character?.name || 'Attacker'} may make an additional attack!`);
          }
          if (effect.startsWith('Called Shot')) {
            const location = effect.includes('Eye/Ear/Finger') ? 'eye, ear, finger, or similarly small part'
              : effect.includes('Head') ? 'Head'
              : effect.includes('Hand/Foot') ? 'Hand/Foot'
              : 'Limb';
            onLogEvent && onLogEvent('ti-target-arrow', `Called Shot - ${capturedModal.character?.name || 'Attacker'} targets the ${location} of ${capturedModal.targetName || 'the target'}. No bonus damage; GM adjudicates narrative/mechanical effect - may sever, destroy, or knock loose items held there.`);
          }
          if (effect === 'Feint (2)') {
            // Bonus damage already applied directly to the damage roll inside DiceModal's confirmDamage -
            // nothing further to resolve here, just log it.
            onLogEvent && onLogEvent('ti-eye-off', `Feint - ${capturedModal.character?.name || 'Attacker'} catches ${capturedModal.targetName || 'the target'} off guard.`);
          }
          if (effect === 'Guard (0)') {
            onLogEvent && onLogEvent('ti-shield', `Guard - ${capturedModal.character?.name || 'Attacker'} dedicates this turn to protecting an ally. (GM: apply +10 TN to the guarded ally and −5 TN to ${capturedModal.character?.name || 'this character'} manually until their next turn.)`);
          }
        });

        upEnc({ combatants: newCombatants });
      }
    }

    // Fire onComplete callback if present (e.g. Full Defense stance change after roll)
    if (capturedModal.onComplete) capturedModal.onComplete(result?.total ?? result);
  };

  const handleStanceChange = (id, stance, fullDefenseBonus) => {
    upEnc({ combatants: combatants.map(c => c.id === id
      ? { ...c, stance, fullDefenseBonus: stance === 'Full Defense' ? (fullDefenseBonus ?? 10) : undefined, _stanceLockedIn: true }
      : c
    ) });
    // Keep character.current_stance in sync - DiceModal reads this to apply stance-gated technique bonuses
    if (pcsMap[id]) onUpdateCharacter(id, { current_stance: stance });
  };

  const handleDrawWeapon = (id, weapon) => {
    // weapon can be a string (legacy) or an array of up to 2 weapon strings
    const weaponList = Array.isArray(weapon) ? weapon : (weapon ? [weapon] : []);
    const primaryWeapon = weaponList[0] || null;
    const dr = primaryWeapon?.match(/\((\dk\d)\)/)?.[1] || '3k2';
    upEnc({ combatants: combatants.map(c => c.id === id
      ? { ...c, drawnWeapons: weaponList, drawnWeapon: primaryWeapon, dr }
      : c) });
    if (pcsMap[id]) onUpdateCharacter(id, { current_weapon: primaryWeapon, current_weapons: weaponList });
  };

  // Knife and Shortbow are free to draw/ready per the rules - every other weapon costs the
  // Simple Action. Free only when every weapon in the resulting draw is one of these two.
  const isFreeWeaponDraw = (weapon) => {
    const weaponList = Array.isArray(weapon) ? weapon : (weapon ? [weapon] : []);
    if (weaponList.length === 0) return true;
    return weaponList.every(w => /^(Knife|Shortbow)\b/.test(w || ''));
  };

  const handleSetNPCAction = (npcId, action) => {
    setNpcTargets(p => ({ ...p, [npcId]: action }));
    if (action === 'Attack') setTargeting(npcId);
    else setTargeting(null);
  };

  const handleNPCAttack = (npcId, targetId) => {
    const npc = combatants.find(c => c.id === npcId);
    const target = combatants.find(c => c.id === targetId);
    const targetPC = pcsMap[targetId];
    const npcChar = {
      techniques: npc?.techniques || {}, school_rank: npc?.rank || 1, advantages: [],
      is_npc: true, faction: npc?.faction, current_stance: npc?.stance,
      air: npc?.air, earth: npc?.earth, fire: npc?.fire, water: npc?.water,
    };
    const stanceRolled = npc?.stance === 'Full Attack' ? 2 : 0;
    const stanceKept = npc?.stance === 'Full Attack' ? 1 : 0;

    // ── To-hit roll - this was previously MISSING ENTIRELY: NPC attacks always connected regardless of
    // the target's Armor TN. Pool approximation: Agility + NPC Rank (stand-in for weapon skill rank, since
    // lightweight NPC combatants don't track individual skill ranks the way full characters do), keeping
    // Fire - matches the Agility/Fire pairing shared by every melee weapon skill in SKILL_TRAIT_MAP.
    const atkBonuses = computeBonuses(npcChar, 'ATTACK', true, false, npc?.stance);
    const atkRolled = Math.max(1, (npc?.agility || 2) + (npc?.rank || 1) + atkBonuses.extraRolled + stanceRolled);
    const atkKept = Math.max(1, Math.min((npc?.fire || 2) + atkBonuses.extraKept + stanceKept, atkRolled));
    const atkDice = rollN(atkRolled).sort((a, b) => b - a);
    const atkTotal = atkDice.slice(0, atkKept).reduce((s, d) => s + d, 0) + (atkBonuses.extraFlat || 0);

    // Target's real Armor TN - now the single shared getArmorTN() helper (see lib/utils.js), rather than a
    // separately-maintained copy of the formula. This copy was previously missing the Jinn TN bonus that
    // CombatantCard's display version has - an NPC attacking a Jinn-protected PC would have ignored it
    // entirely. Fixed by computing it the same way CombatantCard does.
    const tArmorBonus = getArmorBonus(targetPC?.equipment) || target?.armorBonus || 0;
    const tJinnBonus = (target?.faction === 'Jinn' && Object.values(target?.techniques || {}).some(t => typeof t === 'string' && t.includes('+TN to Be Hit = highest Ring')))
      ? Math.max(target?.air || 2, target?.earth || 2, target?.fire || 2, target?.water || 2) : 0;
    const targetArmorTN = getArmorTN({
      reflexes: target?.reflexes, armorBonus: tArmorBonus, stance: target?.stance,
      fullDefenseBonus: target?.fullDefenseBonus, airRing: target?.air, defenseSkillRank: target?.defenseSkillRank,
      voidArmor: target?.voidArmor, jinnBonus: tJinnBonus,
    });

    const hit = atkTotal >= targetArmorTN;
    if (onLogEvent) onLogEvent(hit ? 'ti-sword' : 'ti-shield-x',
      `${npc?.name} attacks ${target?.name}: ${atkTotal} vs TN ${targetArmorTN} - ${hit ? 'HIT' : 'MISS'}`);

    if (!hit) {
      setTargeting(null);
      setNpcTargets(p => ({ ...p, [npcId]: null }));
      return;
    }

    // ── Damage roll - now uses the NPC's actual stored weapon DR (e.g. "5k4" for a heavy weapon) instead
    // of a hardcoded 3k2 that ignored what weapon they actually had.
    const [drRolled, drKept] = (npc?.dr || '3k2').match(/(\d+)k(\d+)/i)?.slice(1).map(Number) || [3, 2];
    const dmgBonuses = computeBonuses(npcChar, 'ATTACK', false, true, npc?.stance);
    const totalRolled = Math.max(1, drRolled + dmgBonuses.extraRolled);
    const totalKept = Math.max(1, Math.min(drKept + dmgBonuses.extraKept, totalRolled));
    const dice = rollN(totalRolled).sort((a, b) => b - a);
    const kept = dice.slice(0, totalKept);
    const dmg = kept.reduce((s, d) => s + d, 0) + (dmgBonuses.extraFlat || 0);
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
      name: setup.name || `Session ${session?.session_number || '?'} - ${setup.setting} - ${setup.type}`,
      description: setup.desc || '',
      setting: setup.setting,
      encounter_type: setup.type,
      party_members: characters.map(c => ({ id: c.id, name: c.name })),
      enemies: enemies.map(e => ({ name: e.name, school: e.school, rank: e.rank })),
      rounds: round || 1,
      env_quirk: envQuirk || null,
    };
    if (onAddEncounterEntry) await onAddEncounterEntry(entry);
    // Recover 50% of arrows consumed this encounter (rounded down) - the rest are lost, broken,
    // or unrecoverable. Players don't get to freely top off; the only other ways back to full are
    // buying more (Shop) or, later, crafting. Compares live quiver count against the snapshot taken
    // when the PC joined the encounter (_arrowStart), since consumption happens live via onUpdateCharacter
    // and isn't otherwise tracked per-encounter.
    for (const c of combatants) {
      if (c.type !== 'pc' || c._arrowStart == null) continue;
      const pc = pcsMap[c.id];
      const quiverIdx = (pc?.equipment || []).findIndex(e => e.name?.startsWith('Quiver'));
      if (quiverIdx < 0) continue;
      const currentCount = pc.equipment[quiverIdx].count ?? 60;
      const consumed = Math.max(0, c._arrowStart - currentCount);
      if (consumed <= 0) continue;
      const recovered = Math.floor(consumed / 2);
      const eq = pc.equipment.map((x, xi) => xi === quiverIdx ? { ...x, count: currentCount + recovered } : x);
      onUpdateCharacter(c.id, { equipment: eq });
      if (onLogEvent) onLogEvent('ti-arrow-back', `${pc.name} recovers ${recovered} of ${consumed} arrows spent this encounter`);
    }
    upEnc({ state: 'idle', combatants: [], activeTurn: 0, round: 1, dmgBanner: null, envQuirk: null, lastEncounterNPCs: lastNPCs, grantedActions: {}, revealedShopId: null });
    setNpcTargets({});
    setTargeting(null);
  };

  // ── Idle state - show party cards, GM can grant actions ──────────────────
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
            {session ? 'No encounter active - downtime / between scenes' : 'No session active'}
          </div>

          {/* Training Dummy - players can practice rolls any time between encounters, even with no
              session active. Zero real consequences: no logs, no persistent character changes, infinite
              health target. GM starting a real encounter force-ends any active training session. */}
          {!isGM && myCharId && !encounter.trainingSession && (
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <button className="btn" style={{ borderColor: '#8a6a30', color: '#d0a050' }}
                onClick={() => startTrainingSession(myCharId)}>
                <i className="ti ti-target-arrow" style={{ marginRight: 5 }} />Train Against Dummy
              </button>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                Practice rolls freely - nothing is logged, nothing persists
              </div>
            </div>
          )}

          {isGM && !isPCView && session && (characters.length + fullNpcs.length) >= 2 && (
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <DuelInitiator
                combatants={[
                  ...characters.map(c => ({ ...c, type: 'pc' })),
                  // fullNpcs are full stat-blocked NPCs (real reflexes/skills/void) - safe to duel.
                  // npcsFromLog (lightweight bestiary spawns) are intentionally excluded here: they never
                  // capture skills/void at spawn, so a Tahaddi duel involving one would silently use wrong
                  // defaults (documented gotcha in sandy-current-state.md), not a real duel.
                  ...fullNpcs.map(n => ({ ...n, type: 'npc' })),
                ]}
                pcsMap={pcsMap}
                onStart={(challenger, defender) => {
                  const makeSide = (c) => ({
                    id: c.id, name: c.name, school: c.school || '',
                    avatarUrl: (c.avatar_url || '').trim(),
                    avatarColor: c.avatar_color || FACTION_COLORS[c.faction] || '#c8962a',
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
              {' '}
              <ContestedRollInitiator
                combatants={characters.map(c => ({ ...c, type: 'pc' }))}
                pcsMap={pcsMap}
                onStart={startContestedRoll}
              />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                Initiate a Tahaddi duel, or a quick Contested Roll for any opposed check
              </div>
            </div>
          )}

          {/* Contested Roll resolution panel - shown to GM and both participants until resolved */}
          {encounter.contestedRoll && (
            <ContestedRollPanel cr={encounter.contestedRoll} myCharId={myCharId} myCharIds={myIds} isGM={isGM && !isPCView}
              onRoll={rollContestedSide} onClose={() => upEnc({ contestedRoll: null })} />
          )}

          {characters.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14, padding: '2rem' }}>No characters created yet.</div>
          ) : (
            <>
              {isGM && !isPCView && (
                <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', marginBottom: '.75rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Grant all PCs:</span>
                  {[1, 2, 3].map(n => (
                    <button key={n} className="btn btn-sm" style={{ fontSize: 11 }}
                      onClick={() => {
                        const all = {};
                        // Only claimed PC rows - never is_npc rows, and never an unclaimed/orphaned PC row.
                        // NPCs (Full or Quick) only get Granted Actions if the GM intentionally bumps them
                        // individually via their own +/- controls.
                        characters.filter(c => !c.is_npc && c.claimed_by_name).forEach(c => { all[c.id] = (grantedActions[c.id] || 0) + n; });
                        upEnc({ grantedActions: { ...grantedActions, ...all } });
                      }}>+{n} action{n > 1 ? 's' : ''}</button>
                  ))}
                  <button className="btn btn-sm" style={{ fontSize: 11, color: 'var(--text-muted)' }}
                    onClick={() => {
                      const all = {};
                      characters.filter(c => !c.is_npc && c.claimed_by_name).forEach(c => { all[c.id] = 0; });
                      upEnc({ grantedActions: { ...grantedActions, ...all } });
                    }}>Clear all</button>
                </div>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.75rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
                {characters.filter(c => !c.is_npc || c.is_party_asset).map(c => (
                  <PartyCard key={c.id} c={c} pcsMap={pcsMap} myCharId={myCharId} myCharIds={myIds}
                    isGM={isGM} isPCView={isPCView} grantedActions={grantedActions}
                    combatants={combatants} onUpdateCharacter={onUpdateCharacter} upEnc={upEnc}
                    onViewCharacter={onViewCharacter} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* NPCs present during downtime - lingering from the last encounter, or added manually by the GM */}
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
                        borderRight: `1px solid ${activeNpcId === n.id ? 'var(--gold)' : 'var(--border)'}`, borderTop: `1px solid ${activeNpcId === n.id ? 'var(--gold)' : 'var(--border)'}`, borderBottom: `1px solid ${activeNpcId === n.id ? 'var(--gold)' : 'var(--border)'}`,
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



        {/* Grapple Control panel - shown when the currently-active combatant controls an ongoing grapple.
            Per the rulebook: each round the controller either releases or deals damage (holding the
            target motionless); if not released, a new Contested Strength decides control for next round,
            with the PREVIOUS controller getting a Free Raise (+1k1) on that re-contest roll. GM-adjudicated
            like the rest of combat resolution. */}
        {isGM && !isPCView && active && (encounter?.grapples || []).filter(g => g.controllerId === active.id).map(g => {
          const held = combatants.find(c => c.id === g.heldId);
          const controllerName = active.name;
          const heldName = held?.name || 'target';
          const clearGrapple = (extraCombatantPatch = {}) => {
            upEnc({
              combatants: combatants.map(c => c.id === g.heldId
                ? { ...c, statusEffects: (c.statusEffects || []).filter(e => e !== 'Grappled'), ...extraCombatantPatch }
                : c),
              grapples: (encounter?.grapples || []).filter(x => x.id !== g.id),
            });
          };
          return (
            <div key={g.id} style={{ margin: '.5rem 0', padding: '.5rem .75rem', background: 'rgba(200,150,42,.08)', border: '1px solid var(--gold-dim)', borderRadius: 6 }}>
              <div style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 600, marginBottom: 4 }}>
                <i className="ti ti-hand-grab" style={{ marginRight: 4 }} />{controllerName} controls the grapple on {heldName}
              </div>
              <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
                <button className="btn btn-sm" onClick={() => {
                  clearGrapple();
                  onLogEvent && onLogEvent('ti-hand-grab', `${controllerName} releases the grapple on ${heldName}`);
                }}>Release Grapple</button>
                <button className="btn btn-sm" style={{ borderColor: 'var(--red)', color: 'var(--red)' }} onClick={() => {
                  // Unarmed damage, or the damage of any small weapon the grappler holds. Target held
                  // motionless this round (Grappled status stays applied - grapple is not released).
                  const drawnName = active.drawnWeapon?.split(' (')[0];
                  const dr = (drawnName && drawnName !== 'Unarmed') ? (active.drawnWeapon.match(/\(([^)]+)\)/)?.[1] || '1k1') : '1k1';
                  const [dmgRoll, dmgKeep] = dr.split('k').map(Number);
                  const dmgTotal = rollExplodingKeep(dmgRoll || 1, dmgKeep || 1);
                  gmWound(g.heldId, Math.ceil(dmgTotal / 5));
                  onLogEvent && onLogEvent('ti-hand-grab', `${controllerName} holds ${heldName} motionless - grapple damage (${dr}): ${dmgTotal}`);
                }}>Deal Damage (hold motionless)</button>
                <button className="btn btn-sm" style={{ borderColor: '#5078dc', color: '#7098f0' }} onClick={() => {
                  // Re-contest control - the PREVIOUS controller gets a Free Raise, which per Core Rulebook
                  // p.83 adds a flat +5 to their total (not extra dice) when not spent on a specific effect.
                  const controllerStr = (pcsMap[g.controllerId] || combatants.find(c => c.id === g.controllerId))?.strength || 2;
                  const otherId = g.controllerId === g.attackerId ? g.targetId : g.attackerId;
                  const otherStr = (pcsMap[otherId] || combatants.find(c => c.id === otherId))?.strength || 2;
                  const ctrlTotal = rollExplodingKeep(controllerStr, controllerStr) + 5; // Free Raise: flat +5 for previous controller
                  const otherTotal = rollExplodingKeep(otherStr, otherStr);
                  const newControllerId = ctrlTotal >= otherTotal ? g.controllerId : otherId;
                  const newHeldId = newControllerId === g.attackerId ? g.targetId : g.attackerId;
                  upEnc({
                    combatants: combatants.map(c => {
                      if (c.id === newHeldId) return { ...c, statusEffects: [...(c.statusEffects || []).filter(e => e !== 'Grappled'), 'Grappled'] };
                      if (c.id === g.heldId && g.heldId !== newHeldId) return { ...c, statusEffects: (c.statusEffects || []).filter(e => e !== 'Grappled') };
                      return c;
                    }),
                    grapples: (encounter?.grapples || []).map(x => x.id === g.id
                      ? { ...x, controllerId: newControllerId, heldId: newHeldId, previousControllerId: g.controllerId }
                      : x),
                  });
                  onLogEvent && onLogEvent('ti-hand-grab', `Grapple re-contested: ${ctrlTotal} (${controllerName}, +5 Free Raise from prior control) vs ${otherTotal} - ${newControllerId === g.controllerId ? controllerName : heldName} retains/gains control`);
                }}>Re-contest Control</button>
              </div>
            </div>
          );
        })}

        {/* Granted action roll panel - GM-granted extra actions, or open downtime access in 'unlimited' mode */}
        {(() => {
          const isUnlimited = downtimeMode === 'unlimited';
          const candidateIds = (myCharIds && myCharIds.length ? myCharIds : (myCharId ? [myCharId] : []));
          const eligibleIds = candidateIds.filter(id => isUnlimited || (grantedActions[id] || 0) > 0);
          if (!eligibleIds.length) return null;
          return eligibleIds.map(id => {
            const myGranted = grantedActions[id] || 0;
            const myChar = characters.find(c => c.id === id);
            if (!myChar) return null;
            // Build drawnWeapon from character's actually-wielded equipment
            const wieldedWeapons = (myChar.equipment || []).filter(e => e.dr && e.inUse && !e.isAmmo);
            const drawnWeapon = wieldedWeapons.length > 0
              ? `${wieldedWeapons[0].name} (${wieldedWeapons[0].dr})`
              : null;
            const drawnWeapons = wieldedWeapons.map(e => `${e.name} (${e.dr})`);
            const fakeCombatant = {
              id: myChar.id, name: myChar.name, type: 'pc', stance: myChar.current_stance || 'Attack',
              drawnWeapon, drawnWeapons,
              dr: wieldedWeapons[0]?.dr || '3k2',
              current_void: myChar.current_void,
              void: myChar.void || 2,
            };
            const handleDrawWeapon = (weaponList) => {
              // weaponList is an array of "Name (dr)" strings, or null to clear
              const list = Array.isArray(weaponList) ? weaponList : (weaponList ? [weaponList] : []);
              const wieldedNames = list.map(w => w.split(' (')[0]);
              const eq = (myChar.equipment || []).map(e => ({
                ...e,
                inUse: e.dr ? wieldedNames.includes(e.name) : e.inUse,
              }));
              const newCurrentWeapon = list.length > 0 ? list[0] : null;
              onUpdateCharacter(myChar.id, { equipment: eq, current_weapon: newCurrentWeapon });
            };
            // In 'unlimited' mode there's nothing to decrement - the whole point is no tracking.
            const handleSpend = isUnlimited ? (() => {}) : (() => upEnc({ grantedActions: { ...grantedActions, [id]: Math.max(0, myGranted - 1) } }));
            return (
              <div key={id} style={{ border: '3px solid var(--gold)', borderRadius: 8, padding: '2px', marginTop: '1rem', boxShadow: '0 0 12px rgba(200,150,42,.3)' }}>
                <div style={{ background: 'rgba(200,150,42,.1)', borderRadius: '4px 4px 0 0', padding: '4px 10px', fontSize: 11, color: 'var(--gold)', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase' }}>
                  ✦ {isUnlimited ? 'Downtime Action' : 'Granted Action'} - {myChar.name} {isUnlimited ? '(Unlimited)' : `(${myGranted} remaining)`}
                </div>
                <PCTurnPanel
                  combatant={fakeCombatant}
                  character={myChar}
                  enemies={[]}
                  onRoll={ctx => setModal({ ...ctx, character: myChar })}
                  onStanceChange={(stance) => onUpdateCharacter(myChar.id, { current_stance: stance })}
                  onDrawWeapon={handleDrawWeapon}
                  onUpdateCharacter={onUpdateCharacter}
                  onPass={handleSpend}
                  onSpendAction={handleSpend}
                  arrowTracking={arrowTracking}
                />
              </div>
            );
          });
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

      {/* ── Prepared encounters for this session - shown below as cards ── */}
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

  // ── Setup state - GM only ────────────────────────────────────────────────
  if (state === 'setup') {
    if (!isGM || isPCView) {
      // Players see a waiting screen while GM sets up
      return (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
          <i className="ti ti-hourglass" style={{ fontSize: 32, marginBottom: '1rem', display: 'block', color: 'var(--gold)', opacity: 0.5 }} />
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '.5rem' }}>Encounter Starting…</div>
          <div style={{ fontSize: 13 }}>Your GM is setting up the encounter. Stand by.</div>
        </div>
      );
    }
    return (
      <EncounterBuilder
        mode="live"
        initialSetup={setup}
        npcsFromLog={npcsFromLog}
        characters={characters}
        sessionNumber={session?.session_number}
        preparedEncounters={preparedEncounters}
        customRoundLimits={customRoundLimits}
        currentTimeOfDay={encounter?.timeOfDay || ''}
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

      {/* GM character summary popup - click the info icon on any combatant card */}
      {summaryCombatant && (() => {
        const sc = summaryCombatant;
        const full = pcsMap?.[sc.id] || sc; // full character record for PCs; combatant itself already has full data for NPCs (captured at spawn)
        const skills = (full.skills || sc.skills || []).slice().sort((a, b) => (b.rank || 0) - (a.rank || 0));
        const advantages = full.advantages || sc.advantages || [];
        const disadvantages = full.disadvantages || sc.disadvantages || [];
        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(8,5,2,.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
            onClick={() => setSummaryCombatant(null)}>
            <div className="modal" style={{ maxWidth: 420, maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
              <div className="modal-title">
                <i className="ti ti-user-search" style={{ marginRight: 6 }} />{sc.name}
                <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8 }}>{sc.school || full.school || ''}</span>
              </div>
              <div className="modal-section">
                <span className="modal-label">Skills</span>
                {skills.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>None recorded.</div>}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px' }}>
                  {skills.map((s, i) => (
                    <span key={i} style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {s.name} <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{s.rank || 0}</span>
                      {s.emphases?.length > 0 && <span style={{ color: 'var(--gold-dim)', fontSize: 10 }}> ({s.emphases.join(', ')})</span>}
                    </span>
                  ))}
                </div>
              </div>
              <div className="modal-section">
                <span className="modal-label">Advantages</span>
                {advantages.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>None recorded.</div>}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px' }}>
                  {advantages.map((a, i) => (
                    <span key={i} style={{ fontSize: 12, color: 'var(--green)' }}>{a.name || a}{a.rank ? ` (${a.rank})` : ''}</span>
                  ))}
                </div>
              </div>
              <div className="modal-section">
                <span className="modal-label">Disadvantages</span>
                {disadvantages.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>None recorded.</div>}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px' }}>
                  {disadvantages.map((d, i) => (
                    <span key={i} style={{ fontSize: 12, color: 'var(--red)' }}>{d.name || d}{d.rank ? ` (${d.rank})` : ''}</span>
                  ))}
                </div>
              </div>
              <button className="btn" style={{ marginTop: '.5rem' }} onClick={() => setSummaryCombatant(null)}>Close</button>
            </div>
          </div>
        );
      })()}

      {/* Disarm weapon choice - attacker picks which of the target's weapons to take when dual-wielding */}
      {disarmChoice && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => e.target === e.currentTarget && setDisarmChoice(null)}>
          <div style={{ background: 'var(--bg-panel)', border: '2px solid var(--gold)', borderRadius: 8, padding: '1.25rem', minWidth: 280, boxShadow: '0 8px 40px rgba(0,0,0,.8)' }}>
            <div style={{ fontWeight: 700, color: 'var(--gold)', marginBottom: '.5rem', fontSize: 15 }}>
              <i className="ti ti-sword-off" style={{ marginRight: 6 }} />Choose Weapon to Disarm
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: '.75rem' }}>
              {disarmChoice.attackerName} disarms {disarmChoice.targetName} - which weapon?
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {disarmChoice.weapons.map((w, i) => (
                <button key={i} className="btn" onClick={() => {
                  const remaining = disarmChoice.weapons.filter((_, wi) => wi !== i);
                  const newPrimary = remaining[0] || null;
                  const dr = newPrimary?.match(/\((\dk\d)\)/)?.[1] || '1k1';
                  upEnc({ combatants: combatants.map(c => c.id === disarmChoice.targetId
                    ? { ...c, drawnWeapon: newPrimary, drawnWeapons: remaining, dr: remaining.length > 0 ? dr : '1k1', statusEffects: [...(c.statusEffects || []).filter(e => e !== 'Disarmed'), 'Disarmed'] }
                    : c) });
                  onLogEvent && onLogEvent('ti-sword-off', `${disarmChoice.targetName} drops ${w.split(' (')[0]}!`);
                  setDisarmChoice(null);
                }}>
                  {w.split(' (')[0]}
                </button>
              ))}
              <button className="btn btn-sm" onClick={() => setDisarmChoice(null)} style={{ marginTop: 4 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Training Dummy banner - unmistakable indicator, with an End Training control any player can use
          since the normal End Encounter button is GM-only */}
      {encounter.trainingSession && (
        <div style={{
          background: 'rgba(140,100,40,.15)', border: '2px solid #8a6a30', borderRadius: 6,
          padding: '.5rem .75rem', marginBottom: '.75rem', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <i className="ti ti-target-arrow" style={{ fontSize: 16, color: '#d0a050' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#d0a050' }}>Training Session</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Nothing here is logged or saved - practice freely.</div>
          </div>
          <button className="btn btn-sm" onClick={endTrainingSession}>End Training</button>
        </div>
      )}

      {/* Turn banner */}
      <div className="turn-banner">
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Round {round || 1} - Active</div>
          <div className="turn-name">{active && isEnemyShrouded(active) ? '? ? ? ?' : (active?.name || '-')}</div>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{setup.name}</div>
        {/* Void button */}
        <VoidButton />
        {/* View toggle - mutually exclusive */}
        <div className="layer-tog">
          <button className={`layer-btn ${view === 'columns' ? 'active' : ''}`} onClick={() => setView('columns')}>Columns</button>
          <button className={`layer-btn ${view === 'initiative' ? 'active' : ''}`} onClick={() => setView('initiative')}>List</button>
        </div>
        {/* Independent display toggles - visually separated to show they're not part of the view-mode group */}
        <div className="layer-tog" style={{ marginLeft: 10 }}>
          <button className={`layer-btn ${compact ? 'active' : ''}`} onClick={() => setCompact(c => !c)}>Compact</button>
          {(isGM && !isPCView) && setup?.useGrid !== false && (
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
                avatarColor: pcsMap[c.id]?.avatar_color || c.avatar_color || FACTION_COLORS[pcsMap[c.id]?.faction || c.faction] || '#c8962a',
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
            <ContestedRollInitiator combatants={combatants} pcsMap={pcsMap} onStart={startContestedRoll} />
            <button className="btn btn-sm" onClick={stepBackTurn} title="Step back one turn (GM correction)">← Back</button>
            <button className="btn btn-sm btn-d" onClick={endEncounter}>End Encounter</button>
          </>
        )}
      </div>

      {/* End Turn - its own prominent, left-aligned row right above the party cards (not buried in
          the GM toolbar above), so it's the first thing the GM sees when deciding what's next. */}
      {(isGM && !isPCView) && (
        <div style={{ marginBottom: '.5rem' }}>
          <button className="btn btn-p" onClick={advanceTurn}>End Turn →</button>
        </div>
      )}

      {/* Contested Roll resolution panel - shown to GM and both participants until resolved */}
      {encounter.contestedRoll && (
        <ContestedRollPanel cr={encounter.contestedRoll} myCharId={myCharId} myCharIds={myIds} isGM={isGM && !isPCView}
          onRoll={rollContestedSide} onClose={() => upEnc({ contestedRoll: null })} />
      )}

      {/* ── Initiative roll panel - shown to each player at start of round 1 ── */}
      {state === 'active' && round === 1 && (() => {
        if (isGM && !isPCView) return null; // GM has already set NPC inits
        // Find one of MY OWN characters that still needs to roll - never myCharId (singular,
        // first-ever-claimed character), which could resolve to an NPC (e.g. one this player was
        // ever assigned as controller for) or the wrong one of several PCs this player controls.
        const myCombatant = combatants.find(c => c.type === 'pc' && myIds.includes(c.id) && !c._initRolled);
        if (!myCombatant) return null;
        const myPC = pcsMap[myCombatant.id];
        if (!myPC) return null;

        const ref = myPC.reflexes || 2;
        const ir = myPC.insight_rank || myPC.school_rank || 1;
        const voidLeft = myPC.current_void ?? myPC.void ?? 2;
        // Battle Skill Mastery Rank 5: add Battle Skill Rank to Initiative Score during Skirmishes (confirmed L5R 4E core rule)
        const battleSkill = (myPC.skills || []).find(s => s.name === 'Battle');
        const battleInitBonus = (battleSkill?.rank || 0) >= 5 ? battleSkill.rank : 0;
        // Leadership advantage: someone may have granted this character +School Rank flat and +1k1 to
        // this Initiative roll (once per round, consumed on use)
        const leadershipGrant = encounter.leadershipGrant?.targetId === myCombatant.id ? encounter.leadershipGrant : null;

        const rollInit = (voidSpend = false) => {
          const bonus = voidSpend ? 10 : 0;
          const leadershipRolled = leadershipGrant ? ref + ir + 1 : ref + ir; // +1k1: one extra die rolled
          const leadershipKeep = leadershipGrant ? ref + 1 : ref; // ...and kept
          const dice = Array.from({length: leadershipRolled}, () => Math.floor(Math.random() * 10) + 1);
          const sorted = [...dice].sort((a,b) => b - a);
          const base = sorted.slice(0, leadershipKeep).reduce((s,d) => s + d, 0);
          const leadershipFlat = leadershipGrant ? leadershipGrant.schoolRank : 0;
          const total = base + bonus + battleInitBonus + leadershipFlat;
          const newCombatants = combatants
            .map(c => c.id === myCombatant.id ? { ...c, init: total, _initRolled: true } : c)
            .sort((a, b) => b.init - a.init);
          // Only reset activeTurn if no one has acted yet (all _initRolled false or this is the first)
          const anyoneActed = combatants.some(c => c._actionsLeft?.full < 1 || c._actionsLeft?.simple < 2);
          upEnc({ combatants: newCombatants, ...(anyoneActed ? {} : { activeTurn: 0 }), ...(leadershipGrant ? { leadershipGrant: null } : {}) });
          if (voidSpend) onUpdateCharacter(myCombatant.id, { current_void: Math.max(0, voidLeft - 1) });
          onLogEvent && onLogEvent('ti-dice', `${myCombatant.name} Initiative: ${total}${voidSpend ? ' (Void +10)' : ''}${battleInitBonus > 0 ? ` (+${battleInitBonus} Battle Mastery)` : ''}${leadershipGrant ? ` (+${leadershipGrant.schoolRank}+1k1 Leadership from ${leadershipGrant.granterName})` : ''} (${leadershipRolled}k${leadershipKeep})`);
        };

        return (
          <div style={{ background: 'rgba(200,150,42,.08)', border: '2px solid var(--gold-dim)', borderRadius: 8, padding: '.75rem 1rem', marginBottom: '.75rem' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)', marginBottom: '.35rem' }}>
              🎲 Roll Initiative - {myCombatant.name}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: '.5rem' }}>
              Pool: {ref + ir}k{ref} (Reflexes {ref} + Insight Rank {ir}){battleInitBonus > 0 && <span style={{ color: 'var(--gold-dim)' }}> +{battleInitBonus} Battle Mastery (Rank 5)</span>}
              {leadershipGrant && <span style={{ color: 'var(--gold-dim)' }}> +{leadershipGrant.schoolRank}+1k1 Leadership (from {leadershipGrant.granterName})</span>}
            </div>
            <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
              <button className="btn btn-p" onClick={() => rollInit(false)}>
                <i className="ti ti-dice" style={{ marginRight: 4 }} />Roll {leadershipGrant ? `${ref + ir + 1}k${ref + 1}` : `${ref + ir}k${ref}`}
              </button>
              {voidLeft > 0 && (
                <button className="btn" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }} onClick={() => rollInit(true)}
                  title="Spend 1 Void Point to add +10 to Initiative roll">
                  ⬡ Spend Void (+10) - {voidLeft} left
                </button>
              )}
            </div>
          </div>
        );
      })()}

      {/* Leadership advantage: any combatant with it may grant +School Rank flat and +1k1 to one ally's
          Initiative roll, once per round, before that ally rolls */}
      {(() => {
        if (encounter.leadershipGrant) return null; // already granted this round
        const rollingCombatants = combatants.filter(c => !c._initRolled);
        if (rollingCombatants.length < 2) return null; // no one left to grant to
        const leaders = rollingCombatants.filter(c => {
          const full = pcsMap[c.id];
          return (full?.advantages || []).some(a => (a.name || a) === 'Leadership');
        });
        if (leaders.length === 0) return null;
        return leaders.map(leader => {
          const full = pcsMap[leader.id];
          const targets = rollingCombatants.filter(c => c.id !== leader.id);
          const canGrant = myIds.includes(leader.id) || (isGM && !isPCView);
          return (
            <div key={leader.id} style={{ background: 'rgba(200,150,42,.06)', border: '1px solid var(--gold-dim)', borderRadius: 8, padding: '.5rem .75rem', marginBottom: '.5rem', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: 'var(--gold-dim)' }}>
                <i className="ti ti-flag" style={{ marginRight: 4 }} />{leader.name}'s Leadership: grant +{full?.school_rank || 1}k1 Initiative to an ally
              </span>
              {canGrant ? (
                <select style={{ fontSize: 12 }} onChange={e => {
                  if (!e.target.value) return;
                  upEnc({ leadershipGrant: { targetId: e.target.value, schoolRank: full?.school_rank || 1, granterName: leader.name } });
                }}>
                  <option value="">- choose ally -</option>
                  {targets.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              ) : (
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>waiting for {leader.name} to choose</span>
              )}
            </div>
          );
        });
      })()}

      {/* ── Waiting on initiative - overlay shown to GM and to players who've already rolled ── */}
      {state === 'active' && round === 1 && (() => {
        const pcCombatants = combatants.filter(c => c.type === 'pc');
        const waitingOn = pcCombatants.filter(c => !c._initRolled);
        if (waitingOn.length === 0) return null;
        // Don't show this to a player who is themselves still waiting to roll - they already see their own roll prompt
        const iAmWaiting = !(isGM && !isPCView) && waitingOn.some(c => myIds.includes(c.id));
        if (iAmWaiting) return null;
        return (
          <div style={{
            position: 'fixed', top: 70, right: 16, zIndex: 350,
            background: 'var(--bg-panel)', border: '2px solid var(--gold-dim)', borderRadius: 8,
            padding: '.65rem .85rem', minWidth: 220, maxWidth: 280, boxShadow: '0 4px 24px rgba(0,0,0,.7)',
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)', marginBottom: '.4rem', display: 'flex', alignItems: 'center', gap: 5 }}>
              <i className="ti ti-dice" style={{ fontSize: 13 }} /> Waiting on Initiative
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {waitingOn.map(c => (
                <div key={c.id} style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold-dim)', flexShrink: 0, animation: 'pulse 1.5s ease-in-out infinite' }} />
                  {c.name}
                </div>
              ))}
            </div>
            {(isGM || isPCView === false) && (
              <button className="btn btn-sm" style={{ marginTop: '.5rem', width: '100%', fontSize: 11, borderColor: 'var(--gold-dim)', color: 'var(--gold)' }}
                title="Auto-roll initiative for all players who haven't rolled yet"
                onClick={() => {
                  const updated = combatants.map(c => {
                    if (c._initRolled) return c;
                    const ref = pcsMap[c.id]?.reflexes || c.reflexes || 2;
                    const air = pcsMap[c.id]?.air || c.air || 2;
                    const roll = ref + air;
                    const keep = air;
                    const dice = Array.from({ length: roll }, () => Math.ceil(Math.random() * 10));
                    const sorted = [...dice].sort((a, b) => b - a);
                    const init = sorted.slice(0, keep).reduce((s, d) => s + d, 0);
                    return { ...c, init, _initRolled: true };
                  }).sort((a, b) => b.init - a.init);
                  upEnc({ combatants: updated });
                }}>
                <i className="ti ti-dice" style={{ marginRight: 4, fontSize: 11 }} />
                Auto-roll for all waiting
              </button>
            )}
          </div>
        );
      })()}

      {/* Round limit warning */}
      {roundLimit && (round || 1) >= roundLimit - 1 && (
        <div className={`round-warn ${(round || 1) >= roundLimit ? 'danger' : 'warn'}`}>
          <i className={`ti ${(round || 1) >= roundLimit ? 'ti-flag' : 'ti-alert-triangle'}`} />
          {(round || 1) >= roundLimit
            ? `Round limit reached (${roundLimit} rounds). Resolve narratively.`
            : `Round ${round} of ${roundLimit} - final round approaching.`}
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
              {vis && bc.visibility !== 'clear' && <span style={{ fontSize: 12 }}><strong style={{ color: '#4ab0d0' }}>Visibility:</strong> {vis.label} - {vis.desc}</span>}
              {ter && bc.terrain !== 'clear' && <span style={{ fontSize: 12 }}><strong style={{ color: '#4ab0d0' }}>Terrain:</strong> {ter.label} - {ter.desc}</span>}
              {cov && bc.cover !== 'none' && <span style={{ fontSize: 12 }}><strong style={{ color: '#4ab0d0' }}>Cover:</strong> {cov.label} - {cov.desc}</span>}
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
        <div style={{ display: 'grid', gridTemplateColumns: showGrid ? '260px auto' : '1fr 1fr', gap: '1rem', marginBottom: '1rem', alignItems: 'start' }}>

          {/* Left column - merged initiative-order list when grid is on (rotates each turn so the
              active combatant is always first); just Party, ungrouped, when grid is off (unchanged). */}
          <div>
            {showGrid ? (
              <>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '.1em', paddingBottom: '.4rem', borderBottom: '2px solid var(--gold-dim)', marginBottom: '.5rem', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <i className="ti ti-list-numbers" style={{ fontSize: 13 }} /> Turn Order ({combatants.length})
                </div>
                {(() => {
                  const initiativeOrder = [...combatants].sort((a, b) => b.init - a.init);
                  const activeIdx = initiativeOrder.findIndex(cc => cc.id === active?.id);
                  const rotated = activeIdx >= 0 ? [...initiativeOrder.slice(activeIdx), ...initiativeOrder.slice(0, activeIdx)] : initiativeOrder;
                  return rotated.map(c => {
                    if (c.type === 'npc' && isEnemyShrouded(c)) {
                      return (
                        <div key={c.id} style={{ padding: '.5rem', marginBottom: 4, background: 'rgba(0,0,0,.4)', border: '1px dashed rgba(107,78,40,.4)', borderRadius: 5, fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center' }}>
                          <i className="ti ti-eye-off" style={{ marginRight: 4 }} /> Hidden in darkness
                        </div>
                      );
                    }
                    if (c.type === 'npc') {
                      return (
                        <CombatantCard key={c.id} c={c}
                          isActive={c.id === active?.id}
                          isGM={isGM} isPCView={isPCView}
                          myCharId={myCharId} myCharIds={myIds} pcs={pcsMap}
                          onGMWound={gmWound}
                          onApplyStatus={applyStatus}
                          onRemoveStatus={removeStatus}
                          targeting={targeting}
                          compact={compact}
                          portraitScale={portraitScale}
                          onSetTarget={(npcId, action) => { handleSetNPCAction(npcId, action); if (action === 'Attack') setTargeting(npcId); }}
                          onSwapSide={isGM && !isPCView ? () => upEnc({ combatants: combatants.map(x => x.id === c.id ? { ...x, type: 'pc' } : x) }) : null}
                          inMelee={isInMelee(c, combatants)}
                          onToggleGlow={toggleGlow} hasGrid={setup?.useGrid !== false} onFocusToken={setFocusTokenId}
                          hasDetectedStealth={stealthDetectorIds.has(c.id)}
                          turnPanel={c.id === active?.id && active?.type === 'npc' && (isGM || myIds.includes(active.controllerId) || (active.sharedControllerIds || []).some(id => myIds.includes(id)) || (everyoneHelpsPlus && !isObserver)) && !isPCView ? (
                            <PCTurnPanel
                              combatant={active}
                              character={null}
                              enemies={party}
                              isNPCTurn
                              actionsLeft={active._actionsLeft || { full: 1, simple: 2 }}
                              onRoll={(ctx) => setModal({ ...ctx, combatantId: active.id })}
                              onStanceChange={(stance, fdBonus) => handleStanceChange(active.id, stance, fdBonus)}
                              onDrawWeapon={(weapon) => { handleDrawWeapon(active.id, weapon); if (!isFreeWeaponDraw(weapon)) spendAction('simple'); }}
                              onPass={advanceTurn}
                              onSpendAction={spendAction}
                              quickTargetRequest={quickTargetRequest}
                              gridTiles={gridTiles}
                            />
                          ) : null}
                        />
                      );
                    }
                    return (
                      <CombatantCard key={c.id} c={c}
                        isActive={c.id === active?.id}
                        isGM={isGM} isPCView={isPCView}
                        myCharId={myCharId} myCharIds={myIds} pcs={pcsMap}
                        onShowSummary={setSummaryCombatant}
                        onGMWound={gmWound}
                        onApplyStatus={applyStatus}
                        onRemoveStatus={removeStatus}
                        targeting={null}
                        onSetTarget={null}
                        compact={compact}
                        portraitScale={portraitScale}
                        onVoidDefense={handleVoidDefense}
                        onSwapSide={isGM && !isPCView ? () => upEnc({ combatants: combatants.map(x => x.id === c.id ? { ...x, type: 'npc' } : x) }) : null}
                        onViewCharacter={onViewCharacter} onViewNpc={onViewNpc}
                        inMelee={isInMelee(c, combatants)}
                        onToggleGlow={toggleGlow} hasGrid={setup?.useGrid !== false} onFocusToken={setFocusTokenId}
                        turnPanel={c.id === active?.id && active?.type === 'pc' && (isGM || myIds.includes(active.id) || ((everyoneHelps || everyoneHelpsPlus) && !isObserver)) ? (
                          <PCTurnPanel
                            combatant={active}
                            character={pcsMap[active.id]}
                            enemies={enemies}
                            allies={party.filter(cc => cc.id !== active.id)}
                            actionsLeft={active._actionsLeft || { full: 1, simple: 2 }}
                            showGrid={showGrid}
                            onRoll={(ctx) => setModal({ ...ctx, character: pcsMap[active.id], combatantId: active.id })}
                            onStanceChange={(stance, fdBonus) => handleStanceChange(active.id, stance, fdBonus)}
                            onDrawWeapon={(weapon) => { handleDrawWeapon(active.id, weapon); if (!isFreeWeaponDraw(weapon)) spendAction('simple'); }}
                            onMoveAction={() => {
                              const movesUsed = (active._movesUsed || 0) + 1;
                              upEnc({
                                combatants: combatants.map(cc => cc.id === active.id ? { ...cc, _movesUsed: movesUsed } : cc),
                                ...(setup?.useGrid !== false ? { showGrid: true } : {}),
                              });
                            }}
                            onUndoMove={() => {
                              const movesUsed = active._movesUsed || 0;
                              upEnc({
                                combatants: combatants.map(cc => cc.id === active.id ? {
                                  ...cc,
                                  gridX: cc.startX, gridY: cc.startY,
                                  _movesUsed: 0,
                                  _actionsLeft: { ...(cc._actionsLeft || { full: 1, simple: 2 }), simple: Math.min(2, (cc._actionsLeft?.simple ?? 2) + movesUsed) },
                                  statusEffects: (cc.statusEffects || []).filter(e => !e.startsWith('Terrain: ')),
                                } : cc),
                              });
                            }}
                            onPass={(freeActionText) => {
                              if (freeActionText && freeActionText !== 'Free Action' && onLogEvent) {
                                onLogEvent('ti-bolt', `${active.name}: ${freeActionText}`);
                              }
                              advanceTurn();
                            }}
                            onSpendAction={spendAction}
                            onStartContestedRoll={(mySkillName, opponentId, opponentSkillName) => {
                              const opponent = combatants.find(cc => cc.id === opponentId);
                              if (!opponent) return;
                              startContestedRoll(pcsMap[active.id], mySkillName, opponent, opponentSkillName);
                              spendAction('full');
                            }}
                            arrowTracking={arrowTracking}
                            quickTargetRequest={quickTargetRequest}
                            gridTiles={gridTiles}
                          />
                        ) : null}
                      />
                    );
                  });
                })()}
              </>
            ) : (
              <>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#6aba60', textTransform: 'uppercase', letterSpacing: '.1em', paddingBottom: '.4rem', borderBottom: '2px solid #4a8a40', marginBottom: '.5rem', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <i className="ti ti-shield" style={{ fontSize: 13 }} /> Party ({party.length})
                </div>
                {party.map(c => (
                  <CombatantCard key={c.id} c={c}
                    isActive={c.id === active?.id}
                    isGM={isGM} isPCView={isPCView}
                    myCharId={myCharId} myCharIds={myIds} pcs={pcsMap}
                    onShowSummary={setSummaryCombatant}
                    onGMWound={gmWound}
                    onApplyStatus={applyStatus}
                    onRemoveStatus={removeStatus}
                    targeting={null}
                    onSetTarget={null}
                    compact={compact}
                    portraitScale={portraitScale}
                    onVoidDefense={handleVoidDefense}
                    onSwapSide={isGM && !isPCView ? () => upEnc({ combatants: combatants.map(x => x.id === c.id ? { ...x, type: 'npc' } : x) }) : null}
                    onViewCharacter={onViewCharacter} onViewNpc={onViewNpc}
                    inMelee={isInMelee(c, combatants)}
                    onToggleGlow={toggleGlow} hasGrid={setup?.useGrid !== false} onFocusToken={setFocusTokenId}
                    turnPanel={c.id === active?.id && active?.type === 'pc' && (isGM || myIds.includes(active.id) || ((everyoneHelps || everyoneHelpsPlus) && !isObserver)) ? (
                      <PCTurnPanel
                        combatant={active}
                        character={pcsMap[active.id]}
                        enemies={enemies}
                        allies={party.filter(cc => cc.id !== active.id)}
                        actionsLeft={active._actionsLeft || { full: 1, simple: 2 }}
                        showGrid={showGrid}
                        onRoll={(ctx) => setModal({ ...ctx, character: pcsMap[active.id], combatantId: active.id })}
                        onStanceChange={(stance, fdBonus) => handleStanceChange(active.id, stance, fdBonus)}
                        onDrawWeapon={(weapon) => { handleDrawWeapon(active.id, weapon); if (!isFreeWeaponDraw(weapon)) spendAction('simple'); }}
                        onMoveAction={() => {
                          const movesUsed = (active._movesUsed || 0) + 1;
                          upEnc({
                            combatants: combatants.map(cc => cc.id === active.id ? { ...cc, _movesUsed: movesUsed } : cc),
                            ...(setup?.useGrid !== false ? { showGrid: true } : {}),
                          });
                        }}
                        onUndoMove={() => {
                          const movesUsed = active._movesUsed || 0;
                          upEnc({
                            combatants: combatants.map(cc => cc.id === active.id ? {
                              ...cc,
                              gridX: cc.startX, gridY: cc.startY,
                              _movesUsed: 0,
                              _actionsLeft: { ...(cc._actionsLeft || { full: 1, simple: 2 }), simple: Math.min(2, (cc._actionsLeft?.simple ?? 2) + movesUsed) },
                              statusEffects: (cc.statusEffects || []).filter(e => !e.startsWith('Terrain: ')),
                            } : cc),
                          });
                        }}
                        onPass={(freeActionText) => {
                          if (freeActionText && freeActionText !== 'Free Action' && onLogEvent) {
                            onLogEvent('ti-bolt', `${active.name}: ${freeActionText}`);
                          }
                          advanceTurn();
                        }}
                        onSpendAction={spendAction}
                        onStartContestedRoll={(mySkillName, opponentId, opponentSkillName) => {
                          const opponent = combatants.find(cc => cc.id === opponentId);
                          if (!opponent) return;
                          startContestedRoll(pcsMap[active.id], mySkillName, opponent, opponentSkillName);
                          spendAction('full');
                        }}
                        arrowTracking={arrowTracking}
                        quickTargetRequest={quickTargetRequest}
                        gridTiles={gridTiles}
                      />
                    ) : null}
                  />
                ))}
              </>
            )}
            {showGrid && isGM && !isPCView && (
              <AddEnemy npcsFromLog={npcsFromLog} fullNpcs={fullNpcs} onAdd={npc => {
                // Newly-spawned NPCs land unplaced (no gridX/gridY) in the GM-only holding tray below
                // the map instead of auto-appearing on the grid - GM places them when ready to reveal.
                const nc = { ...npc, wound: 0, stance: 'Attack', init: rollExplodingKeep((npc.reflexes || 2) + (npc.rank || 1), npc.reflexes || 2), statusEffects: [], _action: null };
                upEnc({ combatants: [...combatants, nc].sort((a, b) => b.init - a.init) });
              }} />
            )}
            {showGrid && isGM && !isPCView && shops.length > 0 && (
              <div style={{ marginTop: '.5rem', padding: '.4rem .5rem', background: 'rgba(106,138,48,.06)', border: '1px solid rgba(106,138,48,.2)', borderRadius: 5 }}>
                <div style={{ fontSize: 10, color: '#6a8a30', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.4rem', fontWeight: 700 }}>
                  🏪 Add Shop
                </div>
                <select defaultValue="" style={{ fontSize: 12, width: '100%' }}
                  onChange={e => {
                    const shopId = e.target.value;
                    if (!shopId) return;
                    const pos = findFreeGridCell(setup?.gridSize, gridTiles, combatants);
                    const token = { id: `shoptoken_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, shopId, x: pos?.x ?? null, y: pos?.y ?? null };
                    upEnc({ setup: { ...setup, shopTokens: [...(setup?.shopTokens || []), token] } });
                    e.target.value = '';
                  }}>
                  <option value="">+ Add shop to grid…</option>
                  {shops.map(sh => <option key={sh.id} value={sh.id}>{sh.name}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Battle Grid - centre column, GM toggle only */}
          {showGrid && (
            <BattleGrid
              combatants={combatants}
              active={active}
              pcsMap={pcsMap}
              gridSize={GRID_SIZE}
              isGM={isGM && !isPCView}
              myCharId={myCharId}
              myCharIds={myIds}
              isMyTurn={isMyTurn}
              focusTokenId={focusTokenId}
              onSetFocusToken={setFocusTokenId}
              settingBg={setup.bgUrl || settingUrls[setup.setting] || null}
              gridTiles={gridTiles}
              lightMode={lightMode}
              litCells={litCells}
              dimCells={dimCells}
              onSetLightMode={(val) => upEnc({ lightMode: val })}
              playerGlow={playerGlow}
              onSetPlayerGlow={(val) => upEnc({ playerGlow: val })}
              freeMove={freeMove}
              onSetFreeMove={(val) => upEnc({ freeMove: val })}
              atlasUrl={atlasUrl}
              tileDefaultImages={tileDefaultImages}
              themeRow={setup?.themeRow}
              doodads={setup?.doodads || []}
              doodadLibrary={doodadLibrary}
              placingDoodadDef={placingDoodadDef}
              onPlaceDoodad={handlePlaceDoodad}
              onSetPlacingDoodadDef={setPlacingDoodadDef}
              containers={setup?.containers || []}
              containerImageUrl={containerImageUrl}
              onInvestigateContainer={handleInvestigateContainer}
              shopTokens={setup?.shopTokens || []}
              shops={shops}
              onOpenShopCommerce={handleOpenShopCommerce}
              everyoneHelps={everyoneHelps}
              everyoneHelpsPlus={everyoneHelpsPlus}
              isObserver={isObserver}
              onQuickTarget={(targetId, action) => setQuickTargetRequest({ targetId, action, ts: Date.now() })}
              onPaintTiles={(patch) => {
                const merged = { ...gridTiles };
                Object.entries(patch).forEach(([k, v]) => { if (v === null) delete merged[k]; else merged[k] = v; });
                upEnc({ gridTiles: merged });
              }}
              onMove={(id, x, y) => {
                const tileDef = TILE_TYPES.find(t => t.key === gridTiles[`${x},${y}`]?.type);
                upEnc({ combatants: combatants.map(c => {
                  if (c.id !== id) return c;
                  // Save starting position on first placement
                  const isFirstPlace = c.gridX === undefined;
                  // Automatically tag/untag the terrain effect for the tile being entered - removed the
                  // moment the combatant leaves it (per Charles: applied on entry, cleared on exit)
                  const clearedEffects = (c.statusEffects || []).filter(e => !e.startsWith('Terrain: '));
                  const newEffects = tileDef?.statusEffect ? [...clearedEffects, tileDef.statusEffect] : clearedEffects;
                  return { ...c, gridX: x, gridY: y, statusEffects: newEffects, ...(isFirstPlace ? { startX: x, startY: y } : {}) };
                })});
              }}
              activePing={encounter?.gridPing && Date.now() - (encounter.gridPing.ts || 0) < 3000 ? encounter.gridPing : null}
              onPing={(ping) => {
                upEnc({ gridPing: ping });
                // Auto-clear after 3s
                setTimeout(() => upEnc(prev => prev.gridPing?.ts === ping.ts ? { ...prev, gridPing: null } : prev), 3100);
              }}
            />
          )}

          {/* Enemies - only shown as full column when grid is off; sidebar handles it when grid is on */}
          {!showGrid && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#c84030', textTransform: 'uppercase', letterSpacing: '.1em', paddingBottom: '.4rem', borderBottom: '2px solid #8a3030', marginBottom: '.5rem', display: 'flex', alignItems: 'center', gap: 5 }}>
              <i className="ti ti-skull" style={{ fontSize: 13 }} /> Enemies ({enemyCountLabel(enemies)})
            </div>
            {enemies.length === 0 && <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', padding: '.5rem' }}>No enemies</div>}
            {enemies.map(c => (
              isEnemyShrouded(c) ? (
                <div key={c.id} style={{ padding: '.5rem', marginBottom: 4, background: 'rgba(0,0,0,.4)', border: '1px dashed rgba(107,78,40,.4)', borderRadius: 5, fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center' }}>
                  <i className="ti ti-eye-off" style={{ marginRight: 4 }} /> Hidden in darkness
                </div>
              ) : (
                <CombatantCard key={c.id} c={c}
                  isActive={c.id === active?.id}
                  isGM={isGM} isPCView={isPCView}
                  myCharId={myCharId} myCharIds={myIds} pcs={pcsMap}
                  onShowSummary={setSummaryCombatant}
                  onGMWound={gmWound}
                  onApplyStatus={applyStatus}
                  onRemoveStatus={removeStatus}
                  targeting={targeting}
                  compact={compact}
                  portraitScale={portraitScale}
                  onSetTarget={(npcId, action) => {
                    handleSetNPCAction(npcId, action);
                    if (action === 'Attack') setTargeting(npcId);
                  }}
                  onSwapSide={isGM && !isPCView ? () => upEnc({ combatants: combatants.map(x => x.id === c.id ? { ...x, type: 'pc' } : x) }) : null}
                  onViewCharacter={onViewCharacter} onViewNpc={onViewNpc}
                  inMelee={isInMelee(c, combatants)}
                  onToggleGlow={toggleGlow} hasGrid={setup?.useGrid !== false} onFocusToken={setFocusTokenId}
                  hasDetectedStealth={stealthDetectorIds.has(c.id)}
                  turnPanel={c.id === active?.id && active?.type === 'npc' && (isGM || myIds.includes(active.controllerId) || (active.sharedControllerIds || []).some(id => myIds.includes(id)) || (everyoneHelpsPlus && !isObserver)) && !isPCView ? (
                    <PCTurnPanel
                      combatant={active}
                      character={null}
                      enemies={party}
                      isNPCTurn
                      actionsLeft={active._actionsLeft || { full: 1, simple: 2 }}
                      onRoll={(ctx) => setModal({ ...ctx, combatantId: active.id })}
                      onStanceChange={(stance, fdBonus) => handleStanceChange(active.id, stance, fdBonus)}
                      onDrawWeapon={(weapon) => { handleDrawWeapon(active.id, weapon); if (!isFreeWeaponDraw(weapon)) spendAction('simple'); }}
                      onPass={advanceTurn}
                      onSpendAction={spendAction}
                      quickTargetRequest={quickTargetRequest}
                      gridTiles={gridTiles}
                    />
                  ) : null}
                />
              )
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
              <AddEnemy npcsFromLog={npcsFromLog} fullNpcs={fullNpcs} onAdd={npc => {
                // Newly-spawned NPCs land unplaced (no gridX/gridY) in the GM-only holding tray below
                // the map instead of auto-appearing on the grid - GM places them when ready to reveal.
                const nc = { ...npc, wound: 0, stance: 'Attack', init: rollExplodingKeep((npc.reflexes || 2) + (npc.rank || 1), npc.reflexes || 2), statusEffects: [], _action: null };
                upEnc({ combatants: [...combatants, nc].sort((a, b) => b.init - a.init) });
              }} />
            )}
          </div>
          )}
        </div>
      )}

      {/* Initiative order view */}
      {view === 'initiative' && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="card-title">Initiative Order - Round {round || 1}</div>
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
                <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <button className="btn btn-sm" style={{ padding: '1px 4px', fontSize: 11 }} title="Lower initiative by 1"
                    onClick={() => upEnc({ combatants: [...combatants.map((x, xi) => xi === i ? { ...x, init: Math.max(1, (x.init || 1) - 1) } : x)].sort((a,b) => b.init - a.init) })}>−</button>
                  <button className="btn btn-sm" style={{ padding: '1px 4px', fontSize: 11 }} title="Raise initiative by 1"
                    onClick={() => upEnc({ combatants: [...combatants.map((x, xi) => xi === i ? { ...x, init: (x.init || 1) + 1 } : x)].sort((a,b) => b.init - a.init) })}>+</button>
                  <button className="btn btn-sm btn-d" style={{ padding: '1px 4px', fontSize: 11 }} onClick={() => gmWound(c.id, 1)} title="Apply 1 wound point">+1W</button>
                  <button className="btn btn-sm" style={{ padding: '1px 4px', fontSize: 11 }} onClick={() => gmWound(c.id, -1)} title="Remove 1 wound point">−1W</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
