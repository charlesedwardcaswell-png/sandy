import React, { useState } from 'react';
import { STANCES, WEAPONS_LIST } from '../data/constants';
import { getWoundRank } from '../lib/utils';

// ── PC Turn Panel ─────────────────────────────────────────────────────────────
// Shown at the bottom of the screen ONLY when it's this PC's turn
// and only visible to that specific PC (and GM in PC view)
export default function PCTurnPanel({ combatant, character, enemies, onRoll, onStanceChange, onDrawWeapon, onPass }) {
  const [selectedAction, setSelectedAction] = useState(null); // null | 'attack' | 'skill' | 'draw' | 'pass' | 'defend'
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [skillCategory, setSkillCategory] = useState('combat'); // combat | social | other

  if (!character) return null;

  const woundRank = getWoundRank(character.current_wounds, character.max_wounds);
  const woundPenalty = woundRank >= 3 ? -(woundRank - 2) : 0; // Hurt=-1k0, Injured=-2k0, Crippled=-3k0

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
    const roll = skill.rank + traitVal + Math.abs(woundPenalty);
    const keep = ringVal + Math.abs(woundPenalty);
    return { roll: skill.rank + traitVal, keep: ringVal, traitVal, ringVal, traitKey, ringKey };
  };

  // Get armor TN of target
  const getTargetTN = (targetId) => {
    const t = enemies.find(e => e.id === targetId);
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
    const target = enemies.find(e => e.id === selectedTarget);

    onRoll({
      skill: selectedSkill.name,
      ring: pool.ringKey,
      ringVal: pool.ringVal,
      baseRoll: pool.roll,
      baseKeep: pool.keep,
      tn,
      isAttack,
      dr: combatant.dr || '3k2',
      targetName: target?.name || null,
      targetId: selectedTarget,
      currentVoid: character.current_void,
      woundPenalty,
    });
  };

  return (
    <div style={{
      background: 'var(--bg-dark)', borderTop: '2px solid var(--gold)', padding: '1rem',
      position: 'sticky', bottom: 0, zIndex: 20,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1rem' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gold)' }}>
          <i className="ti ti-bolt" style={{ marginRight: 5 }} />{character.name} — Your Turn
        </div>
        {woundRank >= 3 && (
          <div style={{ fontSize: 10, padding: '2px 7px', border: '1px solid var(--red-dim)', borderRadius: 3, color: 'var(--red)', background: 'rgba(200,64,48,.1)' }}>
            {woundRank === 3 ? '–1k0' : woundRank === 4 ? '–2k0' : '–3k0'} wound penalty
          </div>
        )}
        {/* Stance selector */}
        <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
          {STANCES.map(s => (
            <button key={s}
              className={`opt-btn ${combatant.stance === s ? 'sel' : ''}`}
              style={{ fontSize: 11, padding: '4px 10px' }}
              onClick={() => onStanceChange(s)}
            >
              {s === 'Full Attack' ? 'F.Attack' : s === 'Full Defense' ? 'F.Defense' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Primary action buttons — large and clear */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '.5rem', marginBottom: '1rem' }}>
        {[
          { id: 'attack',  icon: 'ti-sword',        label: 'Attack',       color: '#c84030' },
          { id: 'skill',   icon: 'ti-list-check',   label: 'Use Skill',    color: 'var(--gold)' },
          { id: 'draw',    icon: 'ti-hand-stop',    label: 'Draw Weapon',  color: 'var(--text-secondary)' },
          { id: 'defend',  icon: 'ti-shield',       label: 'Full Defense', color: '#4a8a40' },
          { id: 'pass',    icon: 'ti-player-skip-forward', label: 'Pass Turn', color: 'var(--text-muted)' },
        ].map(action => (
          <button key={action.id}
            onClick={() => {
              if (action.id === 'defend') { setSelectedAction('defend'); onStanceChange('Full Defense'); }
              else if (action.id === 'pass') { setSelectedAction(null); onPass(); }
              else { setSelectedAction(action.id); setSelectedSkill(null); }
            }}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: '.3rem', padding: '.6rem .25rem',
              background: selectedAction === action.id ? `${action.color}22` : 'var(--bg-panel)',
              border: `1px solid ${selectedAction === action.id ? action.color : 'var(--border)'}`,
              borderRadius: 6, cursor: 'pointer', transition: 'all .15s', fontFamily: 'inherit',
              color: selectedAction === action.id ? action.color : 'var(--text-secondary)',
            }}
          >
            <i className={`ti ${action.icon}`} style={{ fontSize: 18, color: selectedAction === action.id ? action.color : 'var(--text-muted)' }} />
            <span style={{ fontSize: 10, fontWeight: 500, textAlign: 'center', lineHeight: 1.2 }}>{action.label}</span>
          </button>
        ))}
      </div>

      {/* Attack action - target + weapon skill */}
      {selectedAction === 'attack' && (
        <div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: '.3rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>Select Target</div>
              <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap' }}>
                {enemies.filter(e => e.wound < 7).map(e => (
                  <button key={e.id}
                    className={`btn btn-sm ${selectedTarget === e.id ? 'btn-p' : ''}`}
                    onClick={() => setSelectedTarget(e.id)}
                  >
                    {e.name.split(' —')[0]}
                    <span style={{ fontSize: 9, color: 'var(--text-muted)', marginLeft: 4 }}>TN {getTargetTN(e.id)}</span>
                  </button>
                ))}
                {enemies.filter(e => e.wound < 7).length === 0 && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>No valid targets</span>}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: '.3rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>Weapon</div>
              <div style={{ fontSize: 11, color: 'var(--gold)' }}>{combatant.drawnWeapon || 'Unarmed (1k1)'}</div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{combatant.dr || '1k1'} damage</div>
            </div>
          </div>
          {selectedTarget && (
            <div style={{ marginTop: '.75rem' }}>
              {(() => {
                const wSkill = (character.skills || []).find(s => ['Swordsmanship','Knives','Spears','Archery','Brawling','Polearms','Staves'].includes(s.name));
                const pool = wSkill ? getPool(wSkill) : { roll: character.agility + 1, keep: character.fire || 2, ringKey: 'fire', ringVal: character.fire || 2 };
                return (
                  <button className="btn btn-p" onClick={() => {
                    onRoll({
                      skill: wSkill?.name || 'Attack',
                      ring: pool.ringKey,
                      ringVal: pool.ringVal,
                      baseRoll: pool.roll,
                      baseKeep: pool.keep,
                      tn: getTargetTN(selectedTarget),
                      isAttack: true,
                      dr: combatant.dr || '3k2',
                      targetName: enemies.find(e => e.id === selectedTarget)?.name,
                      targetId: selectedTarget,
                      currentVoid: character.current_void,
                      woundPenalty,
                    });
                  }}>
                    Roll Attack — {pool.roll}k{pool.keep} vs TN {getTargetTN(selectedTarget)}
                  </button>
                );
              })()}
            </div>
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
                style={{ fontSize: 10, textTransform: 'capitalize' }}
                onClick={() => { setSkillCategory(cat); setSelectedSkill(null); }}>
                {cat} ({cat === 'combat' ? combatSkills.length : cat === 'social' ? socialSkills.length : otherSkills.length})
              </button>
            ))}
          </div>

          {/* Skill grid */}
          <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap', maxHeight: 120, overflowY: 'auto', marginBottom: '.5rem' }}>
            {displaySkills.length === 0 && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>No {skillCategory} skills</span>}
            {displaySkills.map(skill => {
              const pool = getPool(skill);
              return (
                <button key={skill.name}
                  className={`btn btn-sm ${selectedSkill?.name === skill.name ? 'btn-p' : ''}`}
                  style={{ fontSize: 10 }}
                  onClick={() => handleSkillClick(skill)}
                >
                  {skill.name}
                  <span style={{ fontSize: 9, color: selectedSkill?.name === skill.name ? '#1a1208' : 'var(--text-muted)', marginLeft: 4 }}>
                    {pool.roll}k{pool.keep}
                  </span>
                  {skill.school && <span style={{ fontSize: 8, marginLeft: 3, color: selectedSkill?.name === skill.name ? '#1a1208' : 'var(--gold-dim)' }}>★</span>}
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
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gold)' }}>{selectedSkill.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    Rank {selectedSkill.rank} + {pool.traitKey} {pool.traitVal} = {pool.roll}k{pool.keep}
                    {woundPenalty < 0 && <span style={{ color: 'var(--red)' }}> ({woundPenalty}k0 wound penalty)</span>}
                  </div>
                </div>
                {isAtk && (
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: '.25rem' }}>Target:</div>
                    <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap' }}>
                      {enemies.filter(e => e.wound < 7).map(e => (
                        <button key={e.id} className={`btn btn-sm ${selectedTarget === e.id ? 'btn-p' : ''}`} style={{ fontSize: 10 }} onClick={() => setSelectedTarget(e.id)}>
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
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: '.4rem' }}>Select weapon to draw:</div>
          <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap' }}>
            {(character.equipment || []).filter(e => e.dr && e.equipped).map(e => (
              <button key={e.name} className={`btn btn-sm ${combatant.drawnWeapon?.startsWith(e.name) ? 'btn-p' : ''}`}
                onClick={() => { onDrawWeapon(`${e.name} (${e.dr})`); setSelectedAction(null); }}>
                {e.name} <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{e.dr}</span>
              </button>
            ))}
            <button className={`btn btn-sm ${combatant.drawnWeapon === 'Unarmed (1k1)' ? 'btn-p' : ''}`}
              onClick={() => { onDrawWeapon('Unarmed (1k1)'); setSelectedAction(null); }}>
              Unarmed <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>1k1</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
