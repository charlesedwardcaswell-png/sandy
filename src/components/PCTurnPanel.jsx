import React, { useState } from 'react';
import { STANCES, WEAPONS_LIST } from '../data/constants';
import { getWoundRank } from '../lib/utils';

// ── PC Turn Panel ─────────────────────────────────────────────────────────────
// Shown at the bottom of the screen ONLY when it's this PC's turn
// and only visible to that specific PC (and GM in PC view)
export default function PCTurnPanel({ combatant, character, enemies, allies = [], isNPCTurn, onRoll, onStanceChange, onDrawWeapon, onPass }) {
  const [selectedAction, setSelectedAction] = useState(null);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [selectedWeapon, setSelectedWeapon] = useState(null);
  const [skillCategory, setSkillCategory] = useState('combat');
  const [allowFriendly, setAllowFriendly] = useState(false);

  if (!isNPCTurn && !character) return null;

  // NPC turn — simplified panel for GM
  if (isNPCTurn) {
    return (
      <div style={{ background: 'var(--bg-dark)', borderTop: '2px solid var(--red)', padding: '1rem', position: 'sticky', bottom: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1rem' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--red)' }}>
            <i className="ti ti-skull" style={{ marginRight: 5 }} />{combatant.name} — NPC Turn
          </div>
          <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
            {STANCES.map(s => (
              <button key={s} className={`opt-btn ${combatant.stance === s ? 'sel' : ''}`}
                style={{ fontSize: 13, padding: '4px 10px' }} onClick={() => onStanceChange(s)}>
                {s === 'Full Attack' ? 'F.Attack' : s === 'Full Defense' ? 'F.Defense' : s}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '.5rem', marginBottom: '1rem' }}>
          {[
            { id: 'attack', icon: 'ti-sword', label: 'Attack', color: '#c84030' },
            { id: 'defend', icon: 'ti-shield', label: 'Full Defense', color: '#4a8a40' },
            { id: 'move',   icon: 'ti-run', label: 'Move', color: 'var(--text-secondary)' },
            { id: 'pass',   icon: 'ti-player-skip-forward', label: 'Pass', color: 'var(--text-muted)' },
          ].map(action => (
            <button key={action.id}
              onClick={() => {
                if (action.id === 'defend') { setSelectedAction('defend'); onStanceChange('Full Defense'); }
                else if (action.id === 'pass') { onPass(); }
                else setSelectedAction(action.id);
              }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '.3rem', padding: '.6rem .25rem', background: selectedAction === action.id ? `${action.color}22` : 'var(--bg-panel)', border: `1px solid ${selectedAction === action.id ? action.color : 'var(--border)'}`, borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', color: selectedAction === action.id ? action.color : 'var(--text-secondary)' }}>
              <i className={`ti ${action.icon}`} style={{ fontSize: 20, color: selectedAction === action.id ? action.color : 'var(--text-muted)' }} />
              <span style={{ fontSize: 12, fontWeight: 500 }}>{action.label}</span>
            </button>
          ))}
        </div>
        {selectedAction === 'attack' && (
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: '.3rem' }}>Select target:</div>
            <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap', marginBottom: '.5rem' }}>
              {enemies.filter(e => e.wound < 7).map(e => (
                <button key={e.id} className={`btn btn-sm ${selectedTarget === e.id ? 'btn-p' : ''}`} style={{ fontSize: 12 }} onClick={() => setSelectedTarget(e.id)}>
                  {e.name}
                </button>
              ))}
            </div>
            {selectedTarget && (
              <button className="btn btn-p" onClick={() => onRoll({
                skill: 'Attack', isAttack: true, tn: 15,
                baseRoll: (combatant.reflexes || 2) + 1,
                baseKeep: combatant.air || 2,
                dr: combatant.dr || '3k2',
                targetName: enemies.find(e => e.id === selectedTarget)?.name,
                targetId: selectedTarget,
              })}>
                Roll Attack — {(combatant.reflexes || 2) + 1}k{combatant.air || 2} vs TN 15
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  const woundRank = getWoundRank(character.current_wounds, character.max_wounds);
  const woundPenalty = woundRank >= 3 ? -(woundRank - 2) : 0; // Hurt=-1k0, Injured=-2k0, Crippled=-3k0

  // Targetable pool — enemies always, allies too if friendly-fire targeting is enabled
  const targetPool = allowFriendly ? [...enemies, ...allies] : enemies;

  // Categorise skills
  const combatSkills = (character.skills || []).filter(s =>
    ['Swordsmanship','Knives','Spears','Archery','Brawling','Defense','Polearms','Staves','Heavy Weapons','Chain','Athletics','Tahaddi'].includes(s.name)
  );
  const socialSkills = (character.skills || []).filter(s =>
    ['Sincerity','Etiquette','Courtier','Temptation','Intimidation','Acting','Storytelling','Commerce'].includes(s.name)
  );
  const otherSkills = (character.skills || []).filter(s =>
    !combatSkills.includes(s) && !socialSkills.includes(s)
  );

  const displaySkills = skillCategory === 'combat' ? combatSkills : skillCategory === 'social' ? socialSkills : otherSkills;

  // Stance bonus to attack rolls
  const stanceRollBonus = combatant.stance === 'Full Attack' ? 1 : 0;
  const stanceKeepBonus = 0; // Full Attack only adds rolled dice, not kept
  const centerBonus = combatant.stance === 'Center' ? (character.school_rank || 1) : 0;

  // Skill mastery bonuses (ranks 3, 5, 7)
  const MASTERY_ROLL_BONUS = {
    Swordsmanship: { 5: 1 }, // +1k0 at rank 5
    Brawling: { 5: 0 },      // +1k0 damage only
    Athletics: { 5: 1 },
    Stealth: { 5: 1 },
    Investigation: { 5: 1 },
    Medicine: { 5: 1 },
    Divination: { 5: 1 },
    Spellcraft: {},
  };
  const MASTERY_FREE_RAISE = {
    Brawling: { 7: true },
    Hunting: { 3: true, 7: true },
    Divination: { 3: true },
    Spellcraft: { 3: true },
  };

  // Spell emphasis — free raise if spell type matches emphasis
  const spellEmphases = character.spell_type_emphases || [];

  // Calculate dice pool for a skill
  const getPool = (skill) => {
    const SKILL_RINGS = {
      Swordsmanship: ['agility', 'fire'], Knives: ['agility', 'fire'], Spears: ['agility', 'fire'],
      Archery: ['reflexes', 'air'], Brawling: ['strength', 'water'], Defense: ['reflexes', 'air'],
      Polearms: ['agility', 'fire'], Staves: ['agility', 'fire'], Athletics: ['strength', 'water'],
      Tahaddi: ['awareness', 'air'], Sincerity: ['awareness', 'air'], Etiquette: ['awareness', 'air'],
      Courtier: ['awareness', 'air'], Temptation: ['awareness', 'air'], Intimidation: ['strength', 'water'],
      Acting: ['awareness', 'air'], Storytelling: ['awareness', 'air'], Commerce: ['intelligence', 'fire'],
      Investigation: ['perception', 'water'], Stealth: ['agility', 'fire'], Medicine: ['intelligence', 'fire'],
      Meditation: ['void', 'void'], Spellcraft: ['intelligence', 'fire'], Divination: ['awareness', 'air'],
    };
    const [traitKey, ringKey] = SKILL_RINGS[skill.name] || ['agility', 'fire'];
    const traitVal = character[traitKey] || 2;
    const ringVal = character[ringKey] || 2;

    // Mastery roll bonus
    const masteryBonuses = MASTERY_ROLL_BONUS[skill.name] || {};
    const masteryRoll = Object.entries(masteryBonuses).reduce((sum, [rank, bonus]) => skill.rank >= +rank ? sum + bonus : sum, 0);

    return { roll: skill.rank + traitVal, keep: ringVal, traitVal, ringVal, traitKey, ringKey, masteryRoll };
  };

  // Get armor TN of target
  const getTargetTN = (targetId) => {
    const t = targetPool.find(e => e.id === targetId);
    if (!t) return 15;
    return 5 + (t.reflexes || 2) * 5 + (t.has_armor ? 5 : 0);
  };

  const handleSkillClick = (skill) => {
    setSelectedSkill(skill);
    setSelectedTarget(null);
    setSelectedAction('skill');
  };

  const handleRoll = () => {
    if (!selectedSkill) return;
    const pool = getPool(selectedSkill);
    const isAttack = combatSkills.some(s => s.name === selectedSkill.name) && selectedSkill.name !== 'Defense' && selectedSkill.name !== 'Athletics';
    const tn = selectedTarget ? getTargetTN(selectedTarget) : 15;
    const target = targetPool.find(e => e.id === selectedTarget);

    const stanceBonus = isAttack ? stanceRollBonus : 0;
    const hasMasteryFreeRaise = (MASTERY_FREE_RAISE[selectedSkill.name] || {})[selectedSkill.rank];
    const bonusNotes = [];
    if (stanceBonus > 0) bonusNotes.push(`Full Attack: +${stanceBonus} rolled die`);
    if (centerBonus > 0) bonusNotes.push(`Center stance: +${centerBonus} flat (School Rank ${character.school_rank || 1})`);
    if (hasMasteryFreeRaise) bonusNotes.push(`Rank ${selectedSkill.rank} Mastery: Free Raise`);
    if (pool.masteryRoll > 0) bonusNotes.push(`Rank ${selectedSkill.rank} Mastery: +${pool.masteryRoll} rolled die`);

    onRoll({
      skill: selectedSkill.name,
      ring: pool.ringKey,
      ringVal: pool.ringVal,
      baseRoll: pool.roll + stanceBonus + (pool.masteryRoll || 0),
      baseKeep: pool.keep,
      tn,
      isAttack,
      dr: combatant.dr || '3k2',
      targetName: target?.name || null,
      targetId: selectedTarget,
      currentVoid: character.current_void,
      woundPenalty,
      character,
      suggestedFlatMod: centerBonus,
      bonusNotes,
      freeRaises: hasMasteryFreeRaise ? 1 : 0,
    });
  };

  const stanceChosen = !!combatant.stance;

  return (
    <div style={{
      background: 'var(--bg-dark)', borderTop: '2px solid var(--gold)', padding: '1rem',
      position: 'sticky', bottom: 0, zIndex: 20,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '.75rem' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--gold)' }}>
          <i className="ti ti-bolt" style={{ marginRight: 5 }} />{character.name} — Your Turn
        </div>
        {woundRank >= 3 && (
          <div style={{ fontSize: 12, padding: '2px 7px', border: '1px solid var(--red-dim)', borderRadius: 3, color: 'var(--red)', background: 'rgba(200,64,48,.1)' }}>
            {woundRank === 3 ? '–1k0' : woundRank === 4 ? '–2k0' : '–3k0'} wound penalty
          </div>
        )}
      </div>

      {/* ── Step 1: Stance — always visible, prominent ── */}
      <div style={{ marginBottom: '.75rem' }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.4rem' }}>
          Choose Stance
        </div>
        <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
          {STANCES.map(s => {
            const isActive = combatant.stance === s;
            const stanceColors = {
              'Attack': '#c8962a',
              'Full Attack': '#c84030',
              'Defense': '#4a8a40',
              'Full Defense': '#2a6a30',
              'Center': '#8050c8',
              'Water': '#4a8aaa',
            };
            const col = stanceColors[s] || 'var(--gold)';
            return (
              <button key={s}
                onClick={() => { onStanceChange(s); setSelectedAction(null); }}
                style={{
                  padding: '6px 14px', borderRadius: 5, fontFamily: 'inherit', cursor: 'pointer',
                  fontSize: 14, fontWeight: isActive ? 700 : 400,
                  background: isActive ? col + '33' : 'var(--bg-panel)',
                  border: `2px solid ${isActive ? col : 'var(--border)'}`,
                  color: isActive ? col : 'var(--text-muted)',
                  boxShadow: isActive ? `0 0 10px ${col}55` : 'none',
                  transition: 'all .15s',
                }}>
                {s}
              </button>
            );
          })}
        </div>
        {combatant.stance && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: '.3rem', fontStyle: 'italic' }}>
            {combatant.stance === 'Full Attack' && '+1k0 attack rolls'}
            {combatant.stance === 'Full Defense' && '+10 Armor TN — cannot attack'}
            {combatant.stance === 'Center' && `+${character.school_rank || 1} flat bonus to first action (School Rank)`}
            {combatant.stance === 'Water' && 'Move up to Water Ring as a free action'}
          </div>
        )}
      </div>

      {/* ── Step 2: Actions — only shown after stance chosen ── */}
      {!stanceChosen ? (
        <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '.5rem 0' }}>
          Choose a stance above to continue
        </div>
      ) : (
      <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '.5rem', marginBottom: '1rem' }}>
        {[
          { id: 'attack',  icon: 'ti-sword',               label: 'Attack',       color: '#c84030' },
          { id: 'skill',   icon: 'ti-list-check',           label: 'Use Skill',    color: 'var(--gold)' },
          { id: 'draw',    icon: 'ti-hand-stop',            label: 'Draw Weapon',  color: 'var(--text-secondary)' },
          { id: 'defend',  icon: 'ti-shield',               label: 'Full Defense', color: '#4a8a40' },
          { id: 'pass',    icon: 'ti-player-skip-forward',  label: 'Pass Turn',    color: 'var(--text-muted)' },
        ].map(action => (
          <button key={action.id}
            onClick={() => {
              if (action.id === 'defend') { setSelectedAction('defend'); onStanceChange('Full Defense'); }
              else if (action.id === 'pass') { setSelectedAction(null); onPass(); }
              else {
                setSelectedAction(action.id);
                setSelectedSkill(null);
                if (action.id === 'attack' && combatant.drawnWeapon) {
                  const drawnName = combatant.drawnWeapon.split(' (')[0];
                  const eq = (character?.equipment || []).find(e => e.name === drawnName);
                  if (eq) setSelectedWeapon({ name: eq.name, dr: eq.dr, skill: eq.skill || 'Swordsmanship' });
                }
              }
            }}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: '.4rem', padding: '.75rem .25rem',
              background: selectedAction === action.id ? `${action.color}22` : 'var(--bg-panel)',
              border: `2px solid ${selectedAction === action.id ? action.color : 'var(--border)'}`,
              borderRadius: 8, cursor: 'pointer', transition: 'all .15s', fontFamily: 'inherit',
              color: selectedAction === action.id ? action.color : 'var(--text-secondary)',
              boxShadow: selectedAction === action.id ? `0 0 10px ${action.color}44` : 'none',
            }}
          >
            <i className={`ti ${action.icon}`} style={{ fontSize: 24, color: selectedAction === action.id ? action.color : 'var(--text-muted)' }} />
            <span style={{ fontSize: 13, fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>{action.label}</span>
          </button>
        ))}
      </div>

      {/* Attack action - target + weapon selection */}
      {selectedAction === 'attack' && (
        <div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '.75rem' }}>
            {/* Target */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: '.3rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>Target</div>
              {allies.length > 0 && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-muted)', marginBottom: '.35rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={allowFriendly} onChange={e => { setAllowFriendly(e.target.checked); setSelectedTarget(null); }} style={{ accentColor: 'var(--gold)' }} />
                  Allow targeting allies
                </label>
              )}
              <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap' }}>
                {targetPool.filter(e => e.wound < 7).map(e => (
                  <button key={e.id} className={`btn btn-sm ${selectedTarget === e.id ? 'btn-p' : ''}`} onClick={() => setSelectedTarget(e.id)}
                    style={allies.includes(e) ? { borderColor: 'var(--green-dim)', color: 'var(--green)' } : undefined}>
                    {e.name.split(' —')[0]}
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>TN {getTargetTN(e.id)}</span>
                  </button>
                ))}
                {targetPool.filter(e => e.wound < 7).length === 0 && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>No valid targets</span>}
              </div>
            </div>

            {/* Weapon selection */}
            <div style={{ minWidth: 160 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: '.3rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>Weapon</div>
              <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap' }}>
                {/* Equipped weapons from character sheet */}
                {(character.equipment || []).filter(e => e.dr).map(e => (
                  <button key={e.name}
                    className={`btn btn-sm ${selectedWeapon?.name === e.name ? 'btn-p' : ''}`}
                    onClick={() => setSelectedWeapon({ name: e.name, dr: e.dr, skill: e.skill || 'Swordsmanship' })}>
                    {e.name}
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 3 }}>{e.dr}</span>
                  </button>
                ))}
                {/* Unarmed always available */}
                <button
                  className={`btn btn-sm ${selectedWeapon?.name === 'Unarmed' ? 'btn-p' : ''}`}
                  onClick={() => setSelectedWeapon({ name: 'Unarmed', dr: '1k1', skill: 'Brawling' })}>
                  Unarmed <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>1k1</span>
                </button>
              </div>
              {selectedWeapon && (
                <div style={{ fontSize: 11, color: 'var(--gold-dim)', marginTop: 3 }}>
                  {selectedWeapon.skill} · {selectedWeapon.dr} dmg
                </div>
              )}
            </div>
          </div>

          {selectedTarget && selectedWeapon && (
            <div>
              {(() => {
                const wSkill = (character.skills || []).find(s => s.name === selectedWeapon.skill)
                  || (character.skills || []).find(s => ['Swordsmanship','Knives','Spears','Archery','Brawling','Polearms','Staves'].includes(s.name));
                const pool = wSkill ? getPool(wSkill) : { roll: (character.agility || 2) + 1, keep: character.fire || 2, ringKey: 'fire', ringVal: character.fire || 2 };
                return (
                  <button className="btn btn-p" onClick={() => {
                    onRoll({
                      skill: wSkill?.name || selectedWeapon.skill,
                      ring: pool.ringKey,
                      ringVal: pool.ringVal,
                      baseRoll: pool.roll,
                      baseKeep: pool.keep,
                      tn: getTargetTN(selectedTarget),
                      isAttack: true,
                      dr: selectedWeapon.dr,
                      targetName: targetPool.find(e => e.id === selectedTarget)?.name,
                      targetId: selectedTarget,
                      currentVoid: character.current_void,
                      woundPenalty,
                      character,
                    });
                  }}>
                    Roll {selectedWeapon.name} — {pool.roll}k{pool.keep} vs TN {getTargetTN(selectedTarget)}
                  </button>
                );
              })()}
            </div>
          )}
          {selectedTarget && !selectedWeapon && (
            <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>Select a weapon above</div>
          )}
        </div>
      )}

      {/* Skill action - full skill list */}
      {selectedAction === 'skill' && (
        <div>
          {/* Category tabs */}
          <div style={{ display: 'flex', gap: '.3rem', marginBottom: '.5rem' }}>
            {['combat', 'social', 'other'].map(cat => (
              <button key={cat} className={`btn btn-sm ${skillCategory === cat ? 'btn-p' : ''}`}
                style={{ fontSize: 12, textTransform: 'capitalize' }}
                onClick={() => { setSkillCategory(cat); setSelectedSkill(null); }}>
                {cat} ({cat === 'combat' ? combatSkills.length : cat === 'social' ? socialSkills.length : otherSkills.length})
              </button>
            ))}
          </div>

          {/* Skill grid */}
          <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap', maxHeight: 120, overflowY: 'auto', marginBottom: '.5rem' }}>
            {displaySkills.length === 0 && <span style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>No {skillCategory} skills</span>}
            {displaySkills.map(skill => {
              const pool = getPool(skill);
              return (
                <button key={skill.name}
                  className={`btn btn-sm ${selectedSkill?.name === skill.name ? 'btn-p' : ''}`}
                  style={{ fontSize: 12 }}
                  onClick={() => handleSkillClick(skill)}
                >
                  {skill.name}
                  <span style={{ fontSize: 11, color: selectedSkill?.name === skill.name ? '#1a1208' : 'var(--text-muted)', marginLeft: 4 }}>
                    {pool.roll}k{pool.keep}
                  </span>
                  {skill.school && <span style={{ fontSize: 10, marginLeft: 3, color: selectedSkill?.name === skill.name ? '#1a1208' : 'var(--gold-dim)' }}>★</span>}
                </button>
              );
            })}
          </div>

          {/* Selected skill details + roll button */}
          {selectedSkill && (() => {
            const pool = getPool(selectedSkill);
            const isAtk = combatSkills.some(s => s.name === selectedSkill.name) && selectedSkill.name !== 'Defense' && selectedSkill.name !== 'Athletics';
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '.5rem .75rem', background: 'rgba(200,150,42,.08)', border: '1px solid var(--gold-dim)', borderRadius: 5, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--gold)' }}>{selectedSkill.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Rank {selectedSkill.rank} + {pool.traitKey} {pool.traitVal} = {pool.roll}k{pool.keep}
                    {woundPenalty < 0 && <span style={{ color: 'var(--red)' }}> ({woundPenalty}k0 wound penalty)</span>}
                  </div>
                </div>
                {isAtk && (
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: '.25rem' }}>Target:</div>
                    {allies.length > 0 && (
                      <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-muted)', marginBottom: '.3rem', cursor: 'pointer' }}>
                        <input type="checkbox" checked={allowFriendly} onChange={e => { setAllowFriendly(e.target.checked); setSelectedTarget(null); }} style={{ accentColor: 'var(--gold)' }} />
                        Allow targeting allies
                      </label>
                    )}
                    <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap' }}>
                      {targetPool.filter(e => e.wound < 7).map(e => (
                        <button key={e.id} className={`btn btn-sm ${selectedTarget === e.id ? 'btn-p' : ''}`} style={{ fontSize: 12, ...(allies.includes(e) ? { borderColor: 'var(--green-dim)', color: 'var(--green)' } : {}) }} onClick={() => setSelectedTarget(e.id)}>
                          {e.name.split(' —')[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <button className="btn btn-p" disabled={isAtk && !selectedTarget} onClick={handleRoll}>
                  Roll {pool.roll}k{pool.keep} vs TN {isAtk && selectedTarget ? getTargetTN(selectedTarget) : 15}
                </button>
              </div>
            );
          })()}
        </div>
      )}

      {/* Draw weapon */}
      {selectedAction === 'draw' && (
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: '.4rem' }}>Select weapon to draw:</div>
          <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap' }}>
            {(character.equipment || []).filter(e => e.dr && e.equipped).map(e => (
              <button key={e.name} className={`btn btn-sm ${combatant.drawnWeapon?.startsWith(e.name) ? 'btn-p' : ''}`}
                onClick={() => { onDrawWeapon(`${e.name} (${e.dr})`); setSelectedAction(null); }}>
                {e.name} <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{e.dr}</span>
              </button>
            ))}
            <button className={`btn btn-sm ${combatant.drawnWeapon === 'Unarmed (1k1)' ? 'btn-p' : ''}`}
              onClick={() => { onDrawWeapon('Unarmed (1k1)'); setSelectedAction(null); }}>
              Unarmed <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>1k1</span>
            </button>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}
