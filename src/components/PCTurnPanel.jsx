import React, { useState, useEffect } from 'react';
import { STANCES, WEAPONS_LIST, SKILL_CATEGORIES, ITEM_QUALITIES, TECHNIQUE_SKILL_LINKS, SAHIR_DISCIPLINES, COKALOI_CATEGORIES, IS_COKALOI_SCHOOL, POISON_EMPHASES, SKILL_EMPHASES, getArmorBonus, getShieldBonus, SKILL_TRAIT_MAP, TECHNIQUE_ROLL_BONUSES, ARROW_TYPES } from '../data/constants';
import { getWoundRank, getEffectiveWaterRing, getArmorTN, chebyshevDist, getMeleeReach, isRangedSkill, hasLineOfSight } from '../lib/utils';
import { playTileClick } from '../lib/sounds';
import SpellConstellation from './SpellConstellation';

// ── PC Turn Panel ─────────────────────────────────────────────────────────────
// Shown at the bottom of the screen ONLY when it's this PC's turn
// and only visible to that specific PC (and GM in PC view)
export default function PCTurnPanel({ combatant, character, enemies, allies = [], isNPCTurn, actionsLeft, onRoll, onStanceChange, onDrawWeapon, onPass, onSpendAction, onUpdateCharacter, allCharacters = [], onUpdateInventory, partyInventoryItems = [], showGrid = false, onMoveAction, onStartContestedRoll, arrowTracking = false, quickTargetRequest = null, onUndoMove, gridTiles = {} }) {
  const [selectedAction, setSelectedAction] = useState(null);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [selectedWeapon, setSelectedWeapon] = useState(null);
  const [skillCategory, setSkillCategory] = useState('combat');
  const [allowFriendly, setAllowFriendly] = useState(false);
  const [showSkillPicker, setShowSkillPicker] = useState(false);
  const [showSpellPicker, setShowSpellPicker] = useState(false);
  const [selectedSpell, setSelectedSpell] = useState(null);
  const [pendingSpell, setPendingSpell] = useState(null);
  const [spellVoidSpent, setSpellVoidSpent] = useState(false);
  const [stanceConfirmed, setStanceConfirmed] = useState(false);
  // Reset stance confirmation each time it becomes a new person's turn
  const combatantId = combatant?.id;
  useEffect(() => {
    if (!combatantId) return;
    setStanceConfirmed(false);
    setSelectedAction(null);
  }, [combatantId]);
  // Right-click token context menu on the Battle Grid sets this - jump straight to the chosen
  // action with the target (and, for Attack, the weapon) preselected, then fire the roll immediately -
  // same as if the player had picked target/weapon manually and clicked "Roll ... vs TN ...".
  const fireAttackRef = React.useRef(null);
  useEffect(() => {
    if (!quickTargetRequest) return;
    setSelectedTarget(quickTargetRequest.targetId);
    setSelectedAction(quickTargetRequest.action);
    if (quickTargetRequest.action === 'attack') {
      let weapon = null;
      if (combatant.drawnWeapon && combatant.drawnWeapon !== 'Unarmed (1k1)') {
        const drawnName = combatant.drawnWeapon.split(' (')[0];
        const eq = (character?.equipment || []).find(e => e.name === drawnName);
        if (eq) weapon = { name: eq.name, dr: eq.dr, skill: eq.skill || 'Swordsmanship' };
      }
      if (!weapon) weapon = { name: 'Unarmed', dr: '1k1', skill: 'Brawling' };
      setSelectedWeapon(weapon);
      setAutoFireRequest({ weapon, targetId: quickTargetRequest.targetId, ts: quickTargetRequest.ts });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quickTargetRequest?.ts]);
  const [autoFireRequest, setAutoFireRequest] = useState(null);
  // fireAttackRef is (re)assigned every render further down, once wSkill/pool/penalties are computed -
  // by the time this effect actually runs (after commit), that render has already completed, so the
  // ref reflects the fresh weapon/target just set above.
  useEffect(() => {
    if (!autoFireRequest) return;
    if (fireAttackRef.current) fireAttackRef.current(autoFireRequest.weapon, autoFireRequest.targetId);
    setAutoFireRequest(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFireRequest?.ts]);
  const [spellRaises, setSpellRaises] = useState(0);
  const [skillTarget, setSkillTarget] = useState(''); // for social skills
  const [boastTarget, setBoastTarget] = useState(''); // for storytelling boast
  const [forgeryDocName, setForgeryDocName] = useState('');
  const [forgeryOriginalExample, setForgeryOriginalExample] = useState(false); // -10 TN - authentic handwriting/chop to copy
  const [forgeryFromMemory, setForgeryFromMemory] = useState(false); // +10 TN - no reference at all, working from memory
  const [forgeryQualityMaterials, setForgeryQualityMaterials] = useState(false); // informational only - no fixed TN number given, GM discretion on TN and/or detection difficulty
  const [simpleActionConfirmed, setSimpleActionConfirmed] = useState({}); // techName -> bool, for Simple Action Attack techniques whose condition needs a GM/player call (weapon type, lone opponent, mounted, etc.)
  const [showContestedPicker, setShowContestedPicker] = useState(false);
  const [contestedOpponentId, setContestedOpponentId] = useState('');
  const [contestedOpponentSkill, setContestedOpponentSkill] = useState('');
  const [actingTempName, setActingTempName] = useState('');
  const [selectedEmphasis, setSelectedEmphasis] = useState(null); // active emphasis for free raise

  if (!isNPCTurn && !character) return null;

  // Attack range/reach/LOS check - same rule as the Battle Grid's right-click quick-target menu:
  // melee is reach-enforced, ranged has no max range cap but is blocked by walls (line of sight).
  // No grid position on either side (non-grid encounter, or a combatant never placed) means there's
  // nothing to check against - attack is always allowed in that case. Defined here (before the
  // isNPCTurn early return) so both the GM-controlled-NPC panel and the PC panel below can use it.
  const getRangeIssue = (target) => {
    const hasPos = combatant?.gridX !== undefined && target?.gridX !== undefined;
    if (!hasPos) return '';
    const dist = chebyshevDist(combatant.gridX, combatant.gridY, target.gridX, target.gridY);
    const losBlocked = !hasLineOfSight(combatant.gridX, combatant.gridY, target.gridX, target.gridY, gridTiles);
    const drawnNames = combatant?.drawnWeapons?.length ? combatant.drawnWeapons : (combatant?.drawnWeapon ? [combatant.drawnWeapon] : ['Unarmed (1k1)']);
    const usable = drawnNames.some(dn => {
      const skillName = WEAPONS_LIST.find(w => w.name === (dn || '').split(' (')[0])?.skill || 'Brawling';
      return isRangedSkill(skillName) ? (dist > 1 && !losBlocked) : dist <= getMeleeReach(skillName);
    });
    if (usable) return '';
    if (dist <= 1) return 'No ranged weapon drawn - target is adjacent';
    return losBlocked ? 'No line of sight - a wall blocks the shot' : 'Target out of melee reach - no ranged weapon drawn';
  };

  // NPC turn - simplified panel for GM
  if (isNPCTurn) {
    // Compute wound penalty for NPC here (can't use the declaration below - it comes after the return)
    const npcWoundRank = Math.min(7, Math.floor((combatant.wound || 0)));
    const NPC_WOUND_PENALTIES = [0, 3, 5, 10, 15, 20, 40, 999];
    const npcWoundPenalty = NPC_WOUND_PENALTIES[npcWoundRank] || 0;

    // NPC attack pool - read actual rings and weapon from combatant
    const npcAgi   = combatant.agility  || combatant.fire || 2;
    const npcRef   = combatant.reflexes || combatant.air  || 2;
    const npcAir   = combatant.air      || 2;
    const npcFire  = combatant.fire     || 2;
    const npcWpnSkillRank = combatant.weapon_skill_rank || combatant.wpn_rank || 1;
    const npcDR    = combatant.dr || combatant.weapon_dr || '3k2';
    const npcWeaponName = combatant.drawnWeapon || combatant.weapon || 'Weapon';
    // Attack: (Agility + weapon skill rank) k Fire
    const npcAtkRoll = npcAgi + npcWpnSkillRank;
    const npcAtkKeep = npcFire;
    // Armor TN: 5 + (Reflexes × 5) + armor bonus
    const npcArmorTN = 5 + (npcRef * 5) + (combatant.armor_bonus || 0);
    return (
      <div style={{ background: 'var(--bg-deep)', backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(200,64,48,.06) 0%, transparent 70%)', borderTop: '2px solid var(--red)', padding: '.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--red)' }}>
            <i className="ti ti-skull" style={{ marginRight: 5 }} />{combatant.name} - NPC Turn
          </div>
          <div style={{ display: 'flex', gap: 4, marginLeft: 'auto', flexWrap: 'wrap' }}>
            {STANCES.map(s => {
              // Same ring-matched palette as the PC stance selector below, for visual consistency.
              const stanceColors = { 'Attack': '#e09050', 'Full Attack': '#60b0d0', 'Defense': '#a0c0e0', 'Full Defense': '#80c090', 'Center': '#c0a0e0' };
              const col = stanceColors[s] || 'var(--gold)';
              const isSel = combatant.stance === s;
              return (
                <button key={s} className="opt-btn"
                  style={{ fontSize: 13, padding: '4px 10px', borderColor: col, color: isSel ? 'var(--bg-deep)' : col, background: isSel ? col : 'transparent' }}
                  onClick={() => { playTileClick(); onStanceChange(s); }}>
                  {s === 'Full Attack' ? 'F.Attack' : s === 'Full Defense' ? 'F.Defense' : s}
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '.5rem', marginBottom: '1rem' }}>
          {[
            { id: 'attack', icon: 'ti-sword',              label: 'Attack',       color: '#c84030',
              disabled: combatant.stance === 'Full Defense' },
            { id: 'skill',  icon: 'ti-list-check',          label: 'Use Skill',    color: 'var(--gold)' },
            { id: 'defend', icon: 'ti-shield',              label: 'Full Defense', color: '#4a8a40' },
            { id: 'move',   icon: 'ti-run',                 label: 'Move',         color: 'var(--text-secondary)' },
            { id: 'pass',   icon: 'ti-player-skip-forward', label: 'Pass',         color: 'var(--text-muted)' },
          ].map(action => (
            <button key={action.id}
              disabled={!!action.disabled}
              onClick={() => {
                if (action.disabled) return;
                if (action.id === 'pass') { if (onPass) onPass(); }
                else if (action.id === 'defend') {
                  const defSkill = 0; // NPCs don't have skill ranks stored currently
                  onRoll({
                    skill: 'Defense (Full Defense)',
                    tn: 5,
                    baseRoll: npcRef + defSkill,
                    baseKeep: npcAir,
                    woundPenalty: npcWoundPenalty,
                    resultLabel: 'Half the result (rounded up) is added to base Armor TN until next turn.',
                    onComplete: (total) => { onStanceChange('Full Defense', total); },
                  });
                  if (onSpendAction) onSpendAction('full');
                  setSelectedAction('defend');
                }
                else if (action.id === 'skill') { setShowSkillPicker(true); setSelectedAction(null); }
                else setSelectedAction(action.id);
              }}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: '.4rem', padding: '.75rem .25rem',
                background: selectedAction === action.id ? `${action.color}22` : 'var(--bg-panel)',
                border: `2px solid ${selectedAction === action.id ? action.color : 'var(--border)'}`,
                borderRadius: 8, cursor: action.disabled ? 'not-allowed' : 'pointer', transition: 'all .15s',
                opacity: action.disabled ? 0.4 : 1,
                fontFamily: 'inherit', color: selectedAction === action.id ? action.color : 'var(--text-secondary)' }}>
              <i className={`ti ${action.icon}`} style={{ fontSize: 24, color: selectedAction === action.id ? action.color : 'var(--text-muted)' }} />
              <span style={{ fontSize: 13, fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>{action.label}</span>
            </button>
          ))}
        </div>
        {selectedAction === 'attack' && (
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: '.3rem' }}>Select target:</div>
            <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap', marginBottom: '.5rem' }}>
              {enemies.filter(e => e.wound < 7).map(e => {
                const rangeIssue = getRangeIssue(e);
                return (
                  <button key={e.id} className={`btn btn-sm ${selectedTarget === e.id ? 'btn-p' : ''}`} style={{ fontSize: 12, opacity: rangeIssue ? 0.4 : 1, cursor: rangeIssue ? 'not-allowed' : 'pointer' }}
                    disabled={!!rangeIssue} title={rangeIssue || undefined}
                    onClick={() => { if (rangeIssue) return; setSelectedTarget(e.id); }}>
                    {e.name}
                  </button>
                );
              })}
            </div>
            {selectedTarget && (
              <button className="btn btn-p" style={{ fontSize: 13, padding: '.4rem .8rem' }} onClick={() => {
                onRoll({
                  skill: npcWeaponName,
                  isAttack: true,
                  tn: npcArmorTN + npcWoundPenalty,
                  baseRoll: npcAtkRoll,
                  baseKeep: npcAtkKeep,
                  dr: npcDR,
                  targetName: enemies.find(e => e.id === selectedTarget)?.name,
                  targetId: selectedTarget,
                  woundPenalty: npcWoundPenalty,
                  bonusNotes: [`${npcWeaponName} - DR ${npcDR}`, `TN ${npcArmorTN} (target Armor)`],
                });
                onSpendAction && onSpendAction('full');
              }}>
                ⚔ Roll Attack - {npcAtkRoll}k{npcAtkKeep} vs TN {npcArmorTN}
              </button>
            )}
          </div>
        )}
        {selectedAction === 'skill' && (
          <div style={{ marginBottom: '.5rem' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: '.3rem' }}>Select skill to roll:</div>
            <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', marginBottom: '.4rem' }}>
              {[
                { name: 'Intimidation', trait: 'willpower', ring: npcAir, roll: (combatant.willpower||npcAir)+1, keep: npcAir },
                { name: 'Stealth',      trait: 'agility',   ring: npcFire, roll: (combatant.agility||npcFire)+1, keep: npcFire },
                { name: 'Investigation',trait: 'perception',ring: npcAir,  roll: (combatant.perception||npcAir)+1, keep: npcAir },
                { name: 'Athletics',    trait: 'strength',  ring: npcAir,  roll: (combatant.strength||npcAir)+1, keep: npcAir },
                { name: 'Courtier',     trait: 'awareness', ring: npcAir,  roll: (combatant.awareness||npcAir)+1, keep: npcAir },
                { name: 'Medicine',     trait: 'intelligence', ring: npcFire, roll: (combatant.intelligence||npcFire)+1, keep: npcFire },
                ...(combatant.skills || []).map(s => ({
                  name: s.name, trait: '', ring: npcAir,
                  roll: (npcAgi) + (s.rank||1), keep: npcFire,
                })),
              ].map(sk => (
                <button key={sk.name} className={`btn btn-sm ${selectedTarget === sk.name ? 'btn-p' : ''}`}
                  onClick={() => setSelectedTarget(sk.name)}>
                  {sk.name}
                </button>
              ))}
            </div>
            {selectedTarget && (() => {
              const allSkills = [
                { name: 'Intimidation', roll: (combatant.willpower||npcAir)+1, keep: npcAir },
                { name: 'Stealth',      roll: (combatant.agility||npcFire)+1,  keep: npcFire },
                { name: 'Investigation',roll: (combatant.perception||npcAir)+1, keep: npcAir },
                { name: 'Athletics',    roll: (combatant.strength||npcAir)+1,   keep: npcAir },
                { name: 'Courtier',     roll: (combatant.awareness||npcAir)+1,  keep: npcAir },
                { name: 'Medicine',     roll: (combatant.intelligence||npcFire)+1, keep: npcFire },
                ...(combatant.skills || []).map(s => ({ name: s.name, roll: npcAgi + (s.rank||1), keep: npcFire })),
              ];
              const sk = allSkills.find(s => s.name === selectedTarget) || { name: selectedTarget, roll: npcAgi+1, keep: npcFire };
              return (
                <button className="btn btn-p" style={{ fontSize: 13, padding: '.4rem .8rem' }} onClick={() => {
                  onRoll({
                    skill: sk.name,
                    tn: 15,
                    baseRoll: sk.roll,
                    baseKeep: sk.keep,
                    woundPenalty: npcWoundPenalty,
                    character: combatant,
                  });
                  onSpendAction && onSpendAction('full');
                  setSelectedTarget(null);
                  setSelectedAction(null);
                }}>
                  Roll {sk.name} - {sk.roll}k{sk.keep} vs TN 15
                </button>
              );
            })()}
          </div>
        )}
      </div>
    );
  }

  // Bad Health disadvantage: Earth treated one rank lower for Wound Rank thresholds
  const hasBadHealth = (character.disadvantages || []).some(d => (d.name || d) === 'Bad Health');
  const effectiveEarth = Math.max(1, (character.earth || 2) - (hasBadHealth ? 1 : 0));
  let woundRank = getWoundRank(character.current_wounds, effectiveEarth * 17, effectiveEarth);
  // Permanent Wound disadvantage: first Wound Rank is always considered full - floor at rank 1 once any wound is taken
  const hasPermanentWound = (character.disadvantages || []).some(d => (d.name || d) === 'Permanent Wound');
  if (hasPermanentWound && (character.current_wounds || 0) > 0) woundRank = Math.max(woundRank, 1);
  // Wound penalties are TN additions per L5R 4th Ed; Strength of the Earth reduces by 3
  const WOUND_TN_PENALTY = [0, 3, 5, 10, 15, 20, 40, 999];
  const hasStrengthOfEarth = (character.advantages || []).some(a => (a.name || a) === 'Strength of the Earth');
  // City Guard R1 "Trained For War": subtract School Rank from wound penalties
  const hasCityGuardR1 = character && Object.values(character.techniques || {}).some(t => t === 'Trained For War');
  const cityGuardReduction = hasCityGuardR1 ? (character.school_rank || 1) : 0;
  // Low Pain Threshold disadvantage: +5 TN penalty per wound rank
  const hasLowPainThreshold = (character.disadvantages || []).some(d => (d.name || d) === 'Low Pain Threshold');
  const woundPenaltyReduction = (hasStrengthOfEarth ? 3 : 0) + cityGuardReduction;
  const woundPenaltyIncrease = hasLowPainThreshold ? 5 : 0;
  const woundPenalty = Math.max(0, (WOUND_TN_PENALTY[woundRank] || 0) - woundPenaltyReduction + woundPenaltyIncrease);

  // Drawn weapons and dual-wield penalties - computed at top level for use in roll TN
  const drawnList = combatant.drawnWeapons || (combatant.drawnWeapon ? [combatant.drawnWeapon] : []);
  const isDualWielding = drawnList.length >= 2;
  const primaryHandPenalty = isDualWielding ? -5 : 0;
  const getOffHandPenalty = (wName) => {
    const w = WEAPONS_LIST.find(x => x.name === wName);
    return w?.size === 'small' ? -5 : w?.size === 'large' ? -15 : -10;
  };
  const dualWieldPenalty = isDualWielding && selectedWeapon
    ? (() => {
        // Knives Skill Mastery Rank 3: off-hand penalties do not apply when using a knife (confirmed L5R 4E core rule)
        const knivesSkill = (character.skills || []).find(s => s.name === 'Knives');
        const weaponData = WEAPONS_LIST.find(w => w.name === selectedWeapon.name);
        if ((knivesSkill?.rank || 0) >= 3 && weaponData?.skill === 'Knives') return 0;
        return drawnList[0]?.startsWith(selectedWeapon.name) ? primaryHandPenalty : getOffHandPenalty(selectedWeapon.name);
      })()
    : 0;
  const dualWieldArmorBonus = isDualWielding ? (character?.insight_rank || character?.school_rank || 1) : 0;
  // Shield penalty: L5R 4E Two-Weapon rules by size, applies to BOTH Attack rolls and Athletics rolls
  // per the conversion doc's explicit shield rule (shields don't grant two-weapon-fighting benefits, only
  // the penalty). Uses TN-increase convention to match how dualWieldPenalty is already applied below.
  const equippedShieldPenalty = getShieldBonus(character?.equipment || []).attackPenalty; // 0, -5, -10, or -15

  // Targetable pool - enemies always, allies too if friendly-fire targeting is enabled
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
  const stanceRollBonus = combatant.stance === 'Full Attack' ? 2 : 0;
  const stanceKeepBonus = combatant.stance === 'Full Attack' ? 1 : 0; // Full Attack +2k1
  // Center stance: +1k1 + Void Ring on first action (after spending previous round in Center)
  const voidRing = character?.void || combatant.void || 2;
  // _centerBonusPending: set when previous turn was spent in Center stance
  const hasCenterBonus = !!combatant._centerBonusPending;
  const centerExtraRoll = hasCenterBonus ? (1 + voidRing) : 0;
  const centerExtraKeep = hasCenterBonus ? 1 : 0;
  const centerBonus = combatant.stance === 'Center' ? (character?.school_rank || 1) : 0;

  // Nocked arrow - a special arrow type marked inUse alongside the bow (own equipment toggle, not
  // part of the Draw Weapon action). Only matters for Archery attacks. Falls back to Standard/no
  // effect if nothing's nocked or the nocked item was used up.
  const nockedArrowItem = (character?.equipment || []).find(e => e.isAmmo && e.inUse);
  const nockedArrow = nockedArrowItem ? ARROW_TYPES[nockedArrowItem.name] : null;

  // Skill mastery bonuses (ranks 3, 5, 7). NOTE: real L5R 4E Bugei (combat) skill mastery abilities
  // (confirmed against a clean wiki source this session - see MASTERY_AUDIT.md) essentially never take
  // the form of "add a rolled die to this skill's own attack pool." They're damage-only bonuses, free
  // actions, Initiative bonuses, conditional/situational effects, or cross-skill bonuses instead - none
  // of which fit this simple table. The previous Swordsmanship/Brawling/Athletics entries here (and the
  // Knives/Spears/Staves/Heavy Weapons/Chain Weapons stopgap added earlier this session) were WRONG -
  // removed rather than left in place actively misleading players. See MASTERY_AUDIT.md for what each
  // skill's real mastery abilities are and where (if anywhere) they've been wired instead.
  const MASTERY_ROLL_BONUS = {
    Stealth: { 5: 1 },
    Investigation: { 5: 1 },
    Medicine: { 5: 1 },
    Divination: { 5: 1 },
    Spellcraft: {},
  };
  const MASTERY_FREE_RAISE = {
    Divination: { 3: true },
    Spellcraft: { 3: true },
  };

  // Spell emphasis - free raise if spell type matches emphasis
  const spellEmphases = character.spell_type_emphases || [];

  const LOW_SKILLS = new Set(SKILL_CATEGORIES['Low (Common/Criminal)'] || []);
  const hasCrafty = (character?.advantages || []).some(a => (a.name || a) === 'Crafty');

  // Calculate dice pool for a skill
  const getPool = (skill) => {
    const lookupName = skill.name.startsWith('Lore:') ? 'Lore' : skill.name.startsWith('Craft:') ? 'Craft' : skill.name.startsWith('Perform:') ? 'Perform' : skill.name;
    const mapped = SKILL_TRAIT_MAP[lookupName];
    const traitKey = (mapped?.trait || 'Agility').toLowerCase();
    const ringKey = (mapped?.ring || 'Fire').toLowerCase();
    const traitVal = character[traitKey] || 2;
    const ringVal = character[ringKey] || 2;

    // Crafty: unskilled Low Skill rolls treated as rank 1 instead of rank 0.
    // Auto-applies when the character has the advantage and skill.rank === 0 - no manual checkbox needed.
    const effectiveRank = (hasCrafty && skill.rank === 0 && LOW_SKILLS.has(skill.name)) ? 1 : skill.rank;

    const masteryBonuses = MASTERY_ROLL_BONUS[skill.name] || {};
    const masteryRoll = Object.entries(masteryBonuses).reduce((sum, [rank, bonus]) => effectiveRank >= +rank ? sum + bonus : sum, 0);

    return { roll: effectiveRank + traitVal, keep: ringVal, traitVal, ringVal, traitKey, ringKey, masteryRoll };
  };

  // Get armor TN of target
  const getTargetTN = (targetId, skillName) => {
    const t = targetPool.find(e => e.id === targetId);
    if (!t) return 15;
    const tArmor = getArmorBonus(t.equipment || []) || (t.has_armor ? 5 : 0) || t.armorBonus || 0;
    // Magic Resistance: target's Casting TN vs elemental spells increases +3 per rank
    const magicResist = (t.advantages || []).find(a => (a.name || a) === 'Magic Resistance');
    const magicResistBonus = (skillName === 'Spellcraft' && magicResist) ? (magicResist.rank || 1) * 3 : 0;
    // Jinn protection, same as CombatantCard/NPC-attack resolution
    const jinnBonus = (t.faction === 'Jinn' && Object.values(t?.techniques || {}).some(x => typeof x === 'string' && x.includes('+TN to Be Hit = highest Ring')))
      ? Math.max(t.air || 2, t.earth || 2, t.fire || 2, t.water || 2) : 0;
    // Previously this ignored the target's stance entirely - a target in Full Defense or Defense stance
    // would show a lower TN here than everywhere else in the app computed for them. Fixed via the shared
    // getArmorTN() helper, same as CombatantCard and the NPC attack resolver.
    const isArcheryArrow = skillName === 'Archery' && nockedArrow;
    return getArmorTN({
      reflexes: t.reflexes, armorBonus: tArmor, stance: t.stance,
      fullDefenseBonus: t.fullDefenseBonus, airRing: t.air, defenseSkillRank: t.defenseSkillRank,
      voidArmor: t.voidArmor, jinnBonus, magicResistBonus,
      excludeArmor: isArcheryArrow && nockedArrow.effect === 'ignoreArmor',
      armorMultiplier: isArcheryArrow && nockedArrow.effect === 'doubleArmor' ? 2 : 1,
    });
  };

  const handleSkillClick = (skill) => {
    setSelectedSkill(skill);
    setSelectedTarget(null);
    setSelectedAction('skill');
  };

  const handleRoll = (manualTn) => {
    if (!selectedSkill) return;
    const pool = getPool(selectedSkill);
    const isAttack = combatSkills.some(s => s.name === selectedSkill.name) && selectedSkill.name !== 'Defense' && selectedSkill.name !== 'Athletics';
    // Forgery: Original Example / Working From Memory adjust the creation TN directly (GM-set base TN
    // already accounts for document complexity - these layer a further modifier on top).
    const forgeryTnMod = selectedSkill.name === 'Forgery'
      ? (forgeryOriginalExample ? -10 : 0) + (forgeryFromMemory ? 10 : 0)
      : 0;
    const tn = (manualTn || (selectedTarget ? getTargetTN(selectedTarget, selectedSkill.name) : 15)) + forgeryTnMod;
    const target = targetPool.find(e => e.id === selectedTarget);

    const stanceBonus = isAttack ? stanceRollBonus : 0;
    // Universal skill mastery: EVERY skill grants a Free Raise at Rank 5 (core L5R 4E "Journeyman" tier),
    // separate from and stacking with any skill-specific bonus in MASTERY_FREE_RAISE (e.g. Brawling R7,
    // Hunting R3/R7). Specific-rank bonuses only trigger at the exact listed rank, not cumulatively above it.
    const specificMasteryRaise = (MASTERY_FREE_RAISE[selectedSkill.name] || {})[selectedSkill.rank] ? 1 : 0;
    const universalMasteryRaise = selectedSkill.rank >= 5 ? 1 : 0;
    const masteryFreeRaiseCount = specificMasteryRaise + universalMasteryRaise;

    // Quality bonus from drawn weapon
    const drawnName = combatant.drawnWeapon?.split(' (')[0];
    const drawnEq = isAttack ? (character?.equipment || []).find(e => e.name === drawnName) : null;
    const qualityKey = drawnEq?.quality || 'standard';
    const qualityData = ITEM_QUALITIES[qualityKey] || ITEM_QUALITIES.standard;
    const qualityRollBonus = isAttack ? (qualityData.rollBonus || 0) : 0;
    const qualityKeepBonus = isAttack ? (qualityData.keepBonus || 0) : 0;

    // Shield penalty applies to Attack rolls and Athletics rolls specifically (per conversion doc)
    const shieldPenaltyApplies = equippedShieldPenalty !== 0 && (isAttack || selectedSkill.name === 'Athletics');
    const shieldPenalty = shieldPenaltyApplies ? equippedShieldPenalty : 0;

    const bonusNotes = [];
    if (selectedSkill.name === 'Forgery' && forgeryOriginalExample) bonusNotes.push('Original example on hand: −10 TN');
    if (selectedSkill.name === 'Forgery' && forgeryFromMemory) bonusNotes.push('Working from memory: +10 TN');
    if (selectedSkill.name === 'Forgery' && forgeryQualityMaterials) bonusNotes.push('High-quality materials used - GM discretion on TN/detection difficulty');
    if (stanceRollBonus > 0) bonusNotes.push(`Full Attack: +2k1 to attacks (−10 Armor TN)`);
    if (dualWieldPenalty !== 0) bonusNotes.push(`Dual wield: ${dualWieldPenalty} TN to this attack`);
    if (shieldPenalty !== 0) bonusNotes.push(`Shield: ${shieldPenalty} TN (carrying a shield)`);
    if (selectedSkill.name === 'Spellcraft' && selectedTarget) {
      const targetChar = targetPool.find(e => e.id === selectedTarget);
      const magicResist = (targetChar?.advantages || []).find(a => (a.name || a) === 'Magic Resistance');
      if (magicResist) bonusNotes.push(`Target's Magic Resistance: +${(magicResist.rank || 1) * 3} Casting TN`);
    }
    if (centerBonus > 0) bonusNotes.push(`Center stance: +${centerBonus} flat (School Rank ${character.school_rank || 1})`);
    if (hasCenterBonus) bonusNotes.push(`Center stance carry-over: +${centerExtraRoll}k${centerExtraKeep} (first action this turn)`);
    if (universalMasteryRaise > 0) bonusNotes.push(`Rank 5+ Mastery: Free Raise`);
    if (specificMasteryRaise > 0) bonusNotes.push(`Rank ${selectedSkill.rank} Mastery: Free Raise`);
    if (selectedEmphasis) {
      const ownsSelectedEmphasis = ((character?.skills || []).find(s => s.name === selectedSkill.name)?.emphases || []).includes(selectedEmphasis);
      bonusNotes.push(ownsSelectedEmphasis
        ? `Emphasis (${selectedEmphasis}): reroll 1s on kept dice`
        : `Emphasis (${selectedEmphasis}): untrained - describes the roll, no reroll bonus`);
    }
    if (pool.masteryRoll > 0) bonusNotes.push(`Rank ${selectedSkill.rank} Mastery: +${pool.masteryRoll} rolled die`);
    if (qualityRollBonus > 0) bonusNotes.push(`${qualityData.label} quality: +${qualityRollBonus}${qualityKeepBonus > 0 ? `k${qualityKeepBonus}` : ' rolled die'}`);

    // Arrow tracking - consume one arrow per Archery attack when the GM has the setting enabled.
    // Doesn't block the attack when ammo runs out; just tracks and warns, GM discretion from there.
    // The nocked arrow's own DR replaces the bow's when one is nocked (see effectiveDr below); its
    // armor effect (ignore/double) is applied to target TN up in getTargetTN.
    let effectiveDr = combatant.dr || '3k2';
    if (isAttack && selectedSkill.name === 'Archery' && character) {
      if (nockedArrowItem && nockedArrow) {
        effectiveDr = nockedArrow.dr;
        if (nockedArrow.effect === 'ignoreArmor') bonusNotes.push(`${nockedArrow.label} arrow: target's armor bonus ignored`);
        else if (nockedArrow.effect === 'doubleArmor') bonusNotes.push(`${nockedArrow.label} arrow: target's armor bonus doubled (range halved - not enforced)`);
        else if (nockedArrow.effect === 'signal') bonusNotes.push(`${nockedArrow.label} arrow: signaling/distraction only, not a real attack`);
        if (arrowTracking) {
          const idx = character.equipment.findIndex(x => x === nockedArrowItem);
          const remaining = Math.max(0, (nockedArrowItem.count ?? 0) - 1);
          if (onUpdateCharacter) {
            const eq = character.equipment.map((x, xi) => xi === idx ? { ...x, count: remaining } : x);
            onUpdateCharacter(character.id, { equipment: eq });
          }
          bonusNotes.push(remaining > 0 ? `${nockedArrow.label} arrow used - ${remaining} left` : `${nockedArrow.label} arrow used - none left!`);
        }
      } else if (arrowTracking) {
        const quiverIdx = (character.equipment || []).findIndex(x => x.name?.startsWith('Quiver'));
        if (quiverIdx >= 0) {
          const quiver = character.equipment[quiverIdx];
          const remaining = Math.max(0, (quiver.count ?? 60) - 1);
          if (onUpdateCharacter) {
            const eq = character.equipment.map((x, xi) => xi === quiverIdx ? { ...x, count: remaining } : x);
            onUpdateCharacter(character.id, { equipment: eq });
          }
          bonusNotes.push(remaining > 0 ? `Arrow used - ${remaining} left in quiver` : `Arrow used - quiver empty!`);
        } else {
          bonusNotes.push(`No quiver equipped - arrow tracking on, nothing to consume`);
        }
      }
    }

    const stanceKeep = isAttack ? stanceKeepBonus : 0;

    onRoll({
      skill: selectedSkill.name,
      ring: pool.ringKey,
      ringVal: pool.ringVal,
      trait: pool.traitKey,
      traitVal: pool.traitVal,
      baseRoll: pool.roll + stanceBonus + (pool.masteryRoll || 0) + qualityRollBonus + centerExtraRoll,
      baseKeep: pool.keep + stanceKeep + qualityKeepBonus + centerExtraKeep,
      tn,
      isAttack,
      dr: effectiveDr,
      weaponName: combatant.drawnWeapon ? combatant.drawnWeapon.split(' (')[0] : null,
      targetName: target?.name || skillTarget || null,
      targetId: selectedTarget,
      currentVoid: character?.current_void,
      woundPenalty,
      character,
      suggestedFlatMod: centerBonus,
      bonusNotes,
      freeRaises: masteryFreeRaiseCount,
      activeEmphasis: selectedEmphasis || null, // rerolls 1s on kept dice, not a free raise
      // Skill outcome context
      skillOutcome: selectedSkill.name,
      skillOutcomeData: {
        medicine: selectedSkill.name === 'Medicine',
        medicinePatientId: selectedSkill.name === 'Medicine' ? (skillTarget || character?.id) : null,
        craftPoison: selectedSkill.name === 'Craft: Poison' && !!selectedEmphasis && !!POISON_EMPHASES[selectedEmphasis],
        poisonType: selectedEmphasis && POISON_EMPHASES[selectedEmphasis] ? selectedEmphasis : null,
        acting: selectedSkill.name === 'Acting' || selectedSkill.name === 'Stealth',
        stealth: selectedSkill.name === 'Stealth',
        meditation: selectedSkill.name === 'Meditation',
        forgery: selectedSkill.name === 'Forgery',
        forgeryDocName: forgeryDocName || 'Forged Document',
        actingTempName: actingTempName || null,
        storytelling: selectedSkill.name === 'Storytelling',
        boastTargetId: boastTarget || null,
        socialTarget: skillTarget || null,
        characterId: character?.id,
        skillRank: selectedSkill.rank,
        voidRing: character?.void || 2,
      },
    });
    if (onSpendAction) onSpendAction('full');
  };

  const stanceChosen = stanceConfirmed;

  const actions = actionsLeft || { full: 1, simple: 2 };
  const noActionsLeft = actions.full <= 0 && actions.simple <= 0;
  // Once any action (including movement) has been taken this turn, stance is locked - matches the
  // same "has this combatant acted" signal used elsewhere (actions.full/simple below their fresh-turn
  // defaults of 1/2).
  const stanceLocked = actions.full < 1 || actions.simple < 2;

  return (
    <div style={{
      background: 'var(--bg-deep)',
      backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(200,150,42,.07) 0%, transparent 70%), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(200,150,42,.04) 39px, rgba(200,150,42,.04) 40px)',
      borderTop: '2px solid var(--gold)',
      padding: '.75rem',
    }}>

      {/* Full-screen spell picker overlay */}
      {showSpellPicker && (() => {
        const isCokaloi = IS_COKALOI_SCHOOL(character?.school || '');

        // Build a TN lookup for sahir spells
        const spellTNs = {};
        SAHIR_DISCIPLINES.forEach(disc => disc.types.forEach(t => t.spells.forEach(s => { spellTNs[s.name] = s.tn; })));
        COKALOI_CATEGORIES.forEach(cat => cat.spells.forEach(s => { spellTNs[s.name] = s.tn; }));

        const intRing = character?.intelligence || 2;
        const spellcraftRank = (character?.skills || []).find(s => s.name === 'Spellcraft')?.rank || 0;
        const discBonus = character?.spell_discipline_bonus || null;
        const emphases = character?.spell_type_emphases || [];

        const handleCast = (spellName) => {
          // Find discipline/type for bonus calc
          let bonusRoll = 0, bonusKeep = 0, bonusNotesList = [];
          SAHIR_DISCIPLINES.forEach(disc => disc.types.forEach(t => {
            t.spells.forEach(s => {
              if (s.name === spellName) {
                if (discBonus === disc.id) { bonusRoll += 1; bonusKeep += 1; bonusNotesList.push(`+1k1 Discipline (${disc.name})`); }
                if (emphases.includes(t.id)) { bonusRoll += 1; bonusKeep += 1; bonusNotesList.push(`+1k1 Emphasis (${t.name})`); }
              }
            });
          }));
          const voidBonus = spellVoidSpent ? 1 : 0;
          const isJinnSummoning = spellName.startsWith('Jinn Summoning');
          setShowSpellPicker(false);
          onRoll({
            skill: spellName,
            tn: spellTNs[spellName] || 15,
            baseRoll: intRing + spellcraftRank + bonusRoll,
            baseKeep: intRing + bonusKeep + voidBonus,
            isSpellcasting: true,
            character,
            woundPenalty,
            bonusNotes: [...bonusNotesList, ...(spellVoidSpent ? ['+1k Void spent'] : []), ...(woundPenalty > 0 ? [`+${woundPenalty} TN wound penalty`] : [])],
            freeRaises: spellRaises,
            skillOutcome: 'spell',
            skillOutcomeData: { isJinnSummoning, spellName, characterId: character?.id, insightRank: character?.insight_rank || character?.school_rank || 1 },
          });
          if (onSpendAction) onSpendAction('full');
        };

        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,7,4,.95)', zIndex: 200, display: 'flex', flexDirection: 'column', padding: '1rem', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '.75rem' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#c0a0e0' }}>Cast a Spell</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {intRing + spellcraftRank}k{intRing} base · click a spell then cast
              </div>
              <button className="btn btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setShowSpellPicker(false)}>✕ Close</button>
            </div>

            {/* SpellConstellation in encounter mode */}
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '.75rem' }}>
              <SpellConstellation
                character={character}
                mode="encounter"
                onCastSpell={(spellName) => handleCast(spellName)}
              />
            </div>


          </div>
        );
      })()}

      {/* Full-screen skill picker overlay */}
      {showSkillPicker && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,7,4,.92)', zIndex: 200, display: 'flex', flexDirection: 'column', padding: '2rem' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--gold)', marginBottom: '.5rem' }}>Choose a Skill</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Your GM will tell you the TN. Pick the skill first.</div>
          <div style={{ display: 'flex', flex: 1, gap: '1.5rem', flexWrap: 'wrap', alignContent: 'flex-start', overflowY: 'auto' }}>
            {Object.entries(SKILL_CATEGORIES).map(([cat, catSkills]) => {
              const playerSkills = catSkills.filter(s => character && (character.skills || []).some(sk => (sk.name || sk) === s));
              const otherSkills = catSkills.filter(s => !playerSkills.includes(s) && !s.endsWith('[Custom]'));
              const customSkills = character ? (character.skills || []).filter(sk => {
                const name = sk.name || sk;
                return !catSkills.includes(name) && (
                  (cat === 'Lore' && name.startsWith('Lore:')) ||
                  (cat === 'Craft' && name.startsWith('Craft:')) ||
                  (cat === 'Perform' && name.startsWith('Perform:'))
                );
              }).map(sk => sk.name || sk) : [];
              const allForCat = [...playerSkills, ...customSkills, ...otherSkills];
              if (allForCat.length === 0) return null;
              return (
                <div key={cat} style={{ minWidth: 160 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.4rem' }}>{cat}</div>
                  {allForCat.map(sName => {
                    const sk = character ? (character.skills || []).find(s => (s.name || s) === sName) : null;
                    const rank = sk?.rank || sk || 0;
                    const hasSkill = typeof rank === 'number' ? rank > 0 : false;
                    const techBadges = character
                      ? Object.entries(character.techniques || {}).filter(([r]) => +r <= (character.school_rank || 1)).map(([,t]) => t).filter(Boolean).filter(t => (TECHNIQUE_SKILL_LINKS[t] || []).includes(sName))
                      : [];
                    return (
                      <button key={sName} onClick={() => {
                        setShowSkillPicker(false);
                        setSelectedSkill({ name: sName, rank: typeof rank === 'number' ? rank : 0 });
                        setSelectedAction('skill');
                        setSelectedEmphasis(null);
                      }}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', background: hasSkill ? 'rgba(107,78,40,.15)' : 'transparent', border: `1px solid ${hasSkill ? 'var(--gold-dim)' : 'var(--border)'}`, borderRadius: 4, padding: '.3rem .5rem', marginBottom: '.25rem', cursor: 'pointer', color: hasSkill ? 'var(--text-primary)' : 'var(--text-muted)', fontFamily: 'inherit', fontSize: 13, textAlign: 'left', flexWrap: 'wrap' }}>
                        <span style={{ flex: 1 }}>{sName}</span>
                        {techBadges.map(t => (
                          <span key={t} title={t} style={{ fontSize: 9, padding: '1px 4px', borderRadius: 6, background: 'rgba(160,100,220,.2)', border: '1px solid rgba(160,100,220,.5)', color: '#c0a0e8' }}>
                            ✦ {t.length > 12 ? t.slice(0,12)+'…' : t}
                          </span>
                        ))}
                        {hasSkill && <span style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 700 }}>R{rank}</span>}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
          <button className="btn" style={{ marginTop: '1.5rem', alignSelf: 'flex-start' }} onClick={() => setShowSkillPicker(false)}>← Cancel</button>
        </div>
      )}

      {/* Header with action economy */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '.75rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--gold)', opacity: 0.9 }}>
            ⚔ YOUR TURN
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: noActionsLeft ? 'var(--text-muted)' : 'var(--text-primary)' }}>
            {character?.name || combatant.name}
          </div>
        </div>
        {/* Action Economy Display */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginLeft: 'auto' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginRight: 2, textTransform: 'uppercase', letterSpacing: '.05em' }}>Actions:</div>
          {/* Full action pip */}
          <div title="Full (Complex) Action remaining - costs 1 Full Action" style={{
            height: 28, borderRadius: 4, padding: '0 8px',
            background: actions.full > 0 ? 'var(--gold)' : 'var(--bg-panel)',
            border: `2px solid ${actions.full > 0 ? 'var(--gold)' : 'var(--border)'}`,
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 11, fontWeight: 700, color: actions.full > 0 ? '#1a1208' : 'var(--text-muted)',
          }}>
            <span style={{ fontSize: 9, fontWeight: 400, opacity: 0.8 }}>FULL</span>
            <span>{actions.full > 0 ? actions.full : '–'}</span>
          </div>
          {/* Simple action pips */}
          {[1, 2].map(n => (
            <div key={n} title={`Simple Action ${n} of 2`} style={{
              height: 28, borderRadius: 4, padding: '0 6px',
              background: actions.simple >= n ? 'rgba(200,150,42,.2)' : 'var(--bg-panel)',
              border: `2px solid ${actions.simple >= n ? 'var(--gold-dim)' : 'var(--border)'}`,
              display: 'flex', alignItems: 'center', gap: 3,
              fontSize: 11, fontWeight: 600, color: actions.simple >= n ? 'var(--gold)' : 'var(--text-muted)',
            }}>
              <span style={{ fontSize: 9, fontWeight: 400, opacity: 0.8 }}>S</span>
              <span>{actions.simple >= n ? '●' : '○'}</span>
            </div>
          ))}
          {noActionsLeft && <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', marginLeft: 2 }}>Done</span>}
        </div>
        {woundRank >= 3 && (
          <div style={{ fontSize: 12, padding: '2px 7px', border: '1px solid var(--red-dim)', borderRadius: 3, color: 'var(--red)', background: 'rgba(200,64,48,.1)' }}>
            +{woundPenalty} TN wound penalty
          </div>
        )}
      </div>

      {/* ── Step 1: Stance - large when no stance, compact after ── */}
      <div style={{ marginBottom: stanceChosen ? '.5rem' : '1rem' }}>
        {!stanceChosen && (
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--gold)', textAlign: 'center', marginBottom: '.6rem', letterSpacing: '.05em' }}>
            Choose Your Stance
          </div>
        )}
        {stanceChosen && (
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.25rem' }}>
            Stance
          </div>
        )}
        <div style={{ display: 'flex', gap: stanceChosen ? '.3rem' : '.5rem', flexWrap: 'wrap', justifyContent: stanceChosen ? 'flex-start' : 'center' }}>
          {STANCES.map(s => {
            const isActive = stanceConfirmed && combatant.stance === s;
            // Colors match RING_COLORS in CharacterTab.jsx exactly, for visual consistency between the
            // character sheet's ring display and stance buttons. Mapping is thematic (no stance rules-maps
            // to one specific ring), not a literal rules assignment:
            // Attack → Fire (Agility, the base combat ring) · Full Attack → Water (raw force/Strength)
            // Defense → Air (Reflexes, the defensive ring) · Full Defense → Earth (endurance/resilience)
            // Center → Void (the balanced, transcendent stance)
            const stanceColors = {
              'Attack':       '#e09050', // Fire
              'Full Attack':  '#60b0d0', // Water
              'Defense':      '#a0c0e0', // Air
              'Full Defense': '#80c090', // Earth
              'Center':       '#c0a0e0', // Void
            };
            const col = stanceColors[s] || 'var(--gold)';
            return (
              <button key={s}
                disabled={stanceLocked}
                title={stanceLocked ? "Stance is locked once you've taken an action this turn" : undefined}
                onClick={() => { if (stanceLocked) return; playTileClick(); onStanceChange(s); setSelectedAction(null); setStanceConfirmed(true); }}
                style={{
                  padding: stanceChosen ? '4px 10px' : '10px 18px',
                  borderRadius: 5, fontFamily: 'inherit', cursor: stanceLocked ? 'not-allowed' : 'pointer',
                  fontSize: stanceChosen ? 12 : 15, fontWeight: isActive ? 700 : (stanceChosen ? 400 : 500),
                  background: isActive ? col + '33' : col + '11',
                  border: `2px solid ${isActive ? col : col + '55'}`,
                  color: isActive ? col : col + 'aa',
                  boxShadow: isActive ? `0 0 10px ${col}55` : 'none',
                  opacity: stanceLocked && !isActive ? 0.4 : 1,
                  transition: 'all .2s',
                  flex: stanceChosen ? undefined : '1 1 calc(33% - .5rem)',
                  minWidth: stanceChosen ? undefined : 90,
                }}>
                {s}
              </button>
            );
          })}
        </div>
        {combatant.stance && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: '.3rem', fontStyle: 'italic' }}>
            {combatant.stance === 'Full Attack' && '🔥 +2k1 attack rolls · −10 Armor TN · melee only'}
            {combatant.stance === 'Full Defense' && '🪨 Defense roll result ÷2 (round up) added to base Armor TN - only Free Actions remain'}
            {combatant.stance === 'Defense' && (() => {
              const airRing = character?.air || 2;
              const defSkillRank = (character?.skills || []).find(s => s.name === 'Defense')?.rank || combatant.defenseSkillRank || 0;
              const bonus = airRing + defSkillRank;
              // Previously omitted armor bonus entirely, understating the player's actual TN in this tooltip
              const armorBonus = getArmorBonus(character?.equipment || []) || combatant.armorBonus || 0;
              const totalTN = getArmorTN({ reflexes: character?.reflexes || combatant.reflexes, armorBonus, stance: 'Defense', airRing, defenseSkillRank: defSkillRank });
              return `💨 Air stance: +${bonus} Armor TN (Air ${airRing}${defSkillRank > 0 ? ` + Defense Skill ${defSkillRank}` : ''}) = TN ${totalTN} - cannot attack`;
            })()}
            {combatant.stance === 'Attack' && '💧 Attack stance - no restrictions'}
            {combatant.stance === 'Center' && '⚫ Forfeiting all actions - bonus applies to your FIRST roll next turn'}
            {hasCenterBonus && <span style={{ color: 'var(--gold)', fontWeight: 700 }}> ✦ Center bonus ready: +{1 + voidRing}k1 on first roll this turn!</span>}
          </div>
        )}
      </div>

      {/* ── Step 2: Actions - only shown after stance chosen ── */}
      {!stanceChosen ? (
        <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '.5rem 0' }}>
          Choose a stance above to continue
        </div>
      ) : (
      <>
      {showGrid && !combatant._tookNonMoveAction && combatant.gridX !== undefined && combatant.startX !== undefined
        && (combatant.gridX !== combatant.startX || combatant.gridY !== combatant.startY) && onUndoMove && (
        <div style={{ textAlign: 'center', marginBottom: '.5rem' }}>
          <button className="btn btn-sm" style={{ borderColor: '#6a50d0', color: '#a090e0' }}
            onClick={onUndoMove}>
            <i className="ti ti-arrow-back-up" style={{ marginRight: 4 }} />Undo Movement
          </button>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '.5rem', marginBottom: '1rem' }}>
        {[
          { id: 'attack',  icon: 'ti-sword',               label: 'Attack',       actionType: 'Full',   color: '#c84030',
            hidden: ['Full Defense','Defense','Center'].includes(combatant.stance),
            title: 'Attack (Full Action)' },
          { id: 'skill',   icon: 'ti-list-check',           label: 'Use Skill',    actionType: 'Full',   color: 'var(--gold)',
            hidden: ['Full Attack','Full Defense','Center'].includes(combatant.stance),
            title: 'Use a Skill (Full Action)' },
          { id: 'draw',    icon: 'ti-hand-stop',            label: 'Draw Weapon',  actionType: 'Simple', color: 'var(--text-secondary)',
            hidden: ['Full Defense','Center'].includes(combatant.stance),
            title: 'Draw or ready a weapon (Simple Action)' },
          { id: 'move',    icon: 'ti-run',                   label: combatant._movesUsed >= 1 ? 'Move Again' : 'Move',
            actionType: 'Simple',
            color: combatant._movesUsed >= 1 ? '#6a50d0' : '#4a90d0',
            hidden: combatant.stance === 'Center' || combatant._movesUsed >= 2,
            title: combatant._movesUsed >= 1
                 ? `Move Again - adds another Water Ring (${character?.water || combatant.water || 2}) squares to your range (2nd Simple Action)`
                 : `Move - adds Water Ring (${character?.water || combatant.water || 2}) squares to your range (Simple Action). You always have 1 free square without this.` },
          { id: 'defend',  icon: 'ti-shield',               label: 'Full Defense', actionType: 'Full',   color: '#4a8a40',
            hidden: ['Full Defense','Full Attack','Center','Attack'].includes(combatant.stance),
            title: 'Declare Full Defense (Full Action) - rolls Agility/Defense, half the result (rounded up) is added to your Armor TN' },
          { id: 'pass',    icon: 'ti-player-skip-forward',  label: 'Pass Turn',    actionType: 'Free',   color: noActionsLeft ? 'var(--gold)' : 'var(--text-muted)',     title: 'Pass - skip your turn', glow: noActionsLeft },
          { id: 'spell',   icon: 'ti-sparkles',              label: 'Cast Spell',   actionType: 'Full',   color: '#c0a0e0',
            hidden: !(character?.spells?.length > 0) || ['Full Attack','Full Defense','Center'].includes(combatant.stance),
            title: 'Cast a Spell (Full Action)' },
          { id: 'free',    icon: 'ti-bolt',                  label: 'Free Action',  actionType: 'Free',   color: 'var(--text-muted)',     title: 'Declare a Free Action - speak, spend Void, etc.' },
        ].filter(action => !action.hidden).map(action => (
          <button key={action.id}
            title={action.title || action.label}
            onClick={() => {
              playTileClick();
              if (action.id === 'defend') {
                // Clicking Full Defense: switch to stance AND immediately roll
                onStanceChange('Full Defense');
                // Full Defense - Complex Action. Must be in Full Defense stance.
                // Roll Agility/Defense (TN 5). Half the result (rounded up) is ADDED to base Armor TN -
                // confirmed against the conversion doc's own "Rules Confirmed" record and matches the
                // formula EncounterTab.jsx actually computes (5 + Reflexes×5 + armor + half this roll).
                // A stale, superseded base-rulebook analysis in project docs claims "replaces," which is
                // wrong - don't reintroduce that.
                const defenseSkill = (character?.skills || []).find(s => s.name === 'Defense');
                const agl = character?.agility || 2;
                const defRank = defenseSkill?.rank || 0;
                onRoll({
                  skill: 'Defense (Full Defense)',
                  tn: 5,
                  baseRoll: agl + defRank,
                  baseKeep: agl,
                  character,
                  woundPenalty,
                  resultLabel: 'Half this result (rounded up) is added to base Armor TN (5 + Reflexes×5 + armor)',
                  onComplete: (result) => {
                    onStanceChange('Full Defense', result ?? 10);
                    onSpendAction && onSpendAction('full');
                  },
                });
                setSelectedAction('defend');
              }
              else if (action.id === 'pass') { setSelectedAction(null); if (onPass) onPass(); }
              else if (action.id === 'free') { setSelectedAction('free'); }
              else if (action.id === 'move') {
                setSelectedAction('move');
                // Full Attack: movement is free (no action cost)
                if (combatant.stance !== 'Full Attack') { if (onSpendAction) onSpendAction('simple', true); }
                if (onMoveAction) onMoveAction();
              }
              else if (action.id === 'skill') { setShowSkillPicker(true); setSelectedAction(null); }
              else if (action.id === 'spell') { setShowSpellPicker(true); setSelectedAction(null); }
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
              border: `2px solid ${selectedAction === action.id ? action.color : action.glow ? 'var(--gold)' : 'var(--border)'}`,
              borderRadius: 8, cursor: 'pointer', transition: 'all .15s', fontFamily: 'inherit',
              color: selectedAction === action.id ? action.color : action.glow ? 'var(--gold)' : 'var(--text-secondary)',
              boxShadow: selectedAction === action.id ? `0 0 10px ${action.color}44` : action.glow ? '0 0 12px rgba(200,150,42,.5)' : 'none',
            }}
          >
            <i className={`ti ${action.icon}`} style={{ fontSize: 24, color: selectedAction === action.id ? action.color : 'var(--text-muted)' }} />
            <span style={{ fontSize: 13, fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>{action.label}</span>
            {action.actionType && (
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: '.04em',
                padding: '1px 5px', borderRadius: 3, marginTop: -2,
                background: action.actionType === 'Full' ? 'rgba(200,80,40,.2)' :
                            action.actionType === 'Simple' ? 'rgba(200,150,42,.18)' : 'rgba(100,100,100,.15)',
                color: action.actionType === 'Full' ? '#e07050' :
                       action.actionType === 'Simple' ? 'var(--gold-dim)' : 'var(--text-muted)',
                textTransform: 'uppercase',
              }}>{action.actionType}</span>
            )}
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
                {targetPool.filter(e => e.wound < 7).map(e => {
                  const rangeIssue = getRangeIssue(e);
                  return (
                    <button key={e.id} className={`btn btn-sm ${selectedTarget === e.id ? 'btn-p' : ''}`}
                      disabled={!!rangeIssue}
                      title={rangeIssue || undefined}
                      onClick={() => { if (rangeIssue) return; setSelectedTarget(e.id); }}
                      style={{
                        ...(allies.includes(e) ? { borderColor: 'var(--green-dim)', color: 'var(--green)' } : undefined),
                        ...(rangeIssue ? { opacity: 0.4, cursor: 'not-allowed' } : undefined),
                      }}>
                      {e.name.split(' -')[0]}
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>TN {getTargetTN(e.id)}</span>
                    </button>
                  );
                })}
                {targetPool.filter(e => e.wound < 7).length === 0 && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>No valid targets</span>}
              </div>
            </div>

            {/* Weapon selection */}
            <div style={{ minWidth: 160 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: '.3rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>Weapon</div>
              <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap' }}>
                {/* Only drawn weapon is available - use Draw Weapon to change */}
                {combatant.drawnWeapon && combatant.drawnWeapon !== 'Unarmed (1k1)' && (() => {
                  const wName = combatant.drawnWeapon.split(' (')[0];
                  const wDr = combatant.dr || (combatant.drawnWeapon.match(/\(([^)]+)\)/)?.[1] || '1k1');
                  const wSkillGuess = WEAPONS_LIST.find(w => w.name === wName)?.skill || 'Swordsmanship';
                  return (
                    <button
                      className={`btn btn-sm ${selectedWeapon?.name === wName ? 'btn-p' : ''}`}
                      onClick={() => { setSelectedWeapon({ name: wName, dr: wDr, skill: wSkillGuess }); setSelectedEmphasis(null); }}>
                      {wName}
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 3 }}>{wDr}</span>
                    </button>
                  );
                })()}
                {/* Unarmed always available */}
                <button
                  className={`btn btn-sm ${selectedWeapon?.name === 'Unarmed' ? 'btn-p' : ''}`}
                  onClick={() => { setSelectedWeapon({ name: 'Unarmed', dr: '1k1', skill: 'Brawling' }); setSelectedEmphasis(null); }}>
                  Unarmed <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>1k1</span>
                </button>
              </div>
              {/* Grapple trigger: selecting the Grappling emphasis on an Unarmed attack initiates a grapple
                  contact roll instead of a normal damaging attack - open to everyone per the emphasis
                  redesign, not gated behind actually owning the emphasis (Charles: "should trigger... even
                  if they don't have the emphasis"). */}
              {selectedWeapon?.name === 'Unarmed' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '.3rem', flexWrap: 'wrap', marginTop: 4 }}>
                  {(SKILL_EMPHASES['Brawling'] || []).map(e => (
                    <button key={e} onClick={() => setSelectedEmphasis(selectedEmphasis === e ? null : e)}
                      style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10,
                        border: `1px solid ${selectedEmphasis === e ? 'var(--gold)' : 'var(--border)'}`,
                        background: selectedEmphasis === e ? 'rgba(200,150,42,.18)' : 'transparent',
                        color: selectedEmphasis === e ? 'var(--gold)' : 'var(--text-muted)',
                        cursor: 'pointer', fontFamily: 'inherit' }}>
                      {e}
                    </button>
                  ))}
                </div>
              )}
              {!combatant.drawnWeapon || combatant.drawnWeapon === 'Unarmed (1k1)' ? (
                <div style={{ fontSize: 11, color: 'var(--gold-dim)', marginTop: 3 }}>
                  Use Draw Weapon to equip a weapon
                </div>
              ) : null}
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
                // Simple Action Attack techniques (e.g. City Guard R3 "Implacable Foe") - this flag existed on
                // 8 techniques but was never actually enforced anywhere; wiring it in now. Auto-applies for
                // unconditional entries and stance-matched ones; shows a manual confirm checkbox for anything
                // needing a GM/player judgment call (specific weapon, "lone opponent", "mounted", etc.) rather
                // than guessing - same pattern used throughout this session for conditions Sandy can't verify.
                const simpleActionEntries = Object.values(character.techniques || {})
                  .map(t => typeof t === 'object' ? t.name : t)
                  .filter(Boolean)
                  .flatMap(name => (TECHNIQUE_ROLL_BONUSES[name] || []).filter(b => b.simpleAction).map(b => ({ name, ...b })));
                const autoQualifies = simpleActionEntries.some(e =>
                  (!e.conditional) || (e.stances && e.stances.includes(combatant.stance))
                );
                const manualEntries = simpleActionEntries.filter(e => e.conditional && !(e.stances && e.stances.includes(combatant.stance)));
                const manualConfirmed = manualEntries.some(e => simpleActionConfirmed[e.name]);
                const attackIsSimpleAction = autoQualifies || manualConfirmed;
                const doFireAttack = () => {
                  const isGrappleContact = selectedWeapon.name === 'Unarmed' && selectedEmphasis === 'Grappling';
                  const target = targetPool.find(t => t.id === selectedTarget);
                  // Grapple contact: armor gives no TN bonus against this roll, per the actual rulebook
                  // text ("Armor provides no TN bonus against this attack"). No dr - the contact roll
                  // doesn't deal damage; success instead leads into a Contested Strength roll for control.
                  const contactTn = getArmorTN({ reflexes: target?.reflexes, excludeArmor: true });
                  onRoll({
                    skill: wSkill?.name || selectedWeapon.skill,
                    ring: pool.ringKey,
                    ringVal: pool.ringVal,
                    trait: pool.traitKey,
                    traitVal: pool.traitVal,
                    baseRoll: pool.roll,
                    baseKeep: pool.keep,
                    tn: isGrappleContact ? contactTn : (getTargetTN(selectedTarget) + (dualWieldPenalty || 0) + (equippedShieldPenalty || 0)),
                    isAttack: true,
                    isGrappleContact,
                    dr: isGrappleContact ? undefined : selectedWeapon.dr,
                    weaponName: selectedWeapon.name,
                    targetName: target?.name,
                    targetId: selectedTarget,
                    currentVoid: character.current_void,
                    woundPenalty,
                    character,
                    activeEmphasis: selectedEmphasis,
                  });
                  onSpendAction && onSpendAction(attackIsSimpleAction ? 'simple' : 'full');
                };
                // Keep the ref fresh every render this block is visible, so a right-click quick-target
                // request (handled in an earlier effect, before this block's values exist) can fire the
                // exact same roll on the very next effect pass, once these values are computed.
                fireAttackRef.current = doFireAttack;
                return (<>
                {manualEntries.length > 0 && !autoQualifies && (
                  <div style={{ marginBottom: 6, fontSize: 11 }}>
                    {manualEntries.map(e => (
                      <label key={e.name} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', color: 'var(--text-muted)', marginBottom: 2 }}>
                        <input type="checkbox" checked={!!simpleActionConfirmed[e.name]}
                          onChange={ev => setSimpleActionConfirmed(p => ({ ...p, [e.name]: ev.target.checked }))} />
                        {e.name}: this attack qualifies ({e.conditional}) - Simple Action instead of Full
                      </label>
                    ))}
                  </div>
                )}
                <button className="btn btn-p" onClick={doFireAttack}>
                    {selectedWeapon.name === 'Unarmed' && selectedEmphasis === 'Grappling'
                      ? <>Initiate Grapple - {pool.roll}k{pool.keep} vs TN {getArmorTN({ reflexes: targetPool.find(t => t.id === selectedTarget)?.reflexes, excludeArmor: true })} (no armor bonus)</>
                      : <>Roll {selectedWeapon.name} - {pool.roll}k{pool.keep} vs TN {getTargetTN(selectedTarget)}
                          {attackIsSimpleAction && <span style={{ marginLeft: 5, fontSize: 10, opacity: 0.85 }}>(Simple Action)</span>}
                        </>}
                  </button>
                </>);
              })()}
            </div>
          )}
          {selectedTarget && !selectedWeapon && (
            <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>Select a weapon above</div>
          )}
        </div>
      )}

      {/* Skill action - shown after picking from the overlay */}
      {selectedAction === 'skill' && selectedSkill && (() => {
        const pool = getPool(selectedSkill);
        const isAtk = combatSkills.some(s => s.name === selectedSkill.name) && selectedSkill.name !== 'Defense' && selectedSkill.name !== 'Athletics';
        return (
          <div style={{ padding: '.6rem .75rem', background: 'rgba(200,150,42,.08)', border: '1px solid var(--gold-dim)', borderRadius: 5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--gold)' }}>{selectedSkill.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Rank {selectedSkill.rank} + {pool.traitKey} {pool.traitVal} = {pool.roll}k{pool.keep}
                  {woundPenalty > 0 && <span style={{ color: 'var(--red)' }}> (+{woundPenalty} TN wound penalty)</span>}
                </div>
              </div>
              {/* Manual TN entry - GM tells the player what to type */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>TN (ask your GM):</label>
                <input type="number" min={5} max={60} defaultValue={
                  selectedSkill.name === 'Meditation' ? 20 :
                  selectedSkill.name === 'Storytelling' ? 15 : 15
                }
                  id="manual-tn-input"
                  style={{ width: 60, fontSize: 16, fontWeight: 700, color: 'var(--gold)', textAlign: 'center' }} />
              </div>
              {/* Emphasis selector. Open to every emphasis the skill can have (SKILL_EMPHASES), not just
                  ones the character owns - selecting an emphasis also describes the *nature* of the roll
                  (e.g. Brawling(Grappling) vs Brawling(Striking)), which matters regardless of training.
                  Owned emphases are tagged "reroll 1s" since only those grant that mechanical benefit.
                  Exception: Craft: Poison emphases represent specific known recipes, not roll-flavor -
                  kept owned-only, since "selecting" an unknown poison recipe isn't a rules-supported thing
                  the way picking a combat approach is. Flagging this as an interpretation call, not a
                  confirmed rule, in case it needs correcting. */}
              {(() => {
                const skillObj = (character?.skills || []).find(s => s.name === selectedSkill.name);
                const owned = skillObj?.emphases || [];
                const isPoisonCraft = selectedSkill.name === 'Craft: Poison';
                const emphases = isPoisonCraft ? owned : (SKILL_EMPHASES[selectedSkill.name] || []);
                if (emphases.length === 0) return null;
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Emphasis:</span>
                    <button onClick={() => setSelectedEmphasis(null)}
                      style={{ fontSize: 11, padding: '2px 7px', borderRadius: 10, border: `1px solid ${!selectedEmphasis ? 'var(--gold)' : 'var(--border)'}`, background: !selectedEmphasis ? 'rgba(200,150,42,.15)' : 'transparent', color: !selectedEmphasis ? 'var(--gold)' : 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit' }}>
                      None
                    </button>
                    {emphases.map(e => {
                      const active = selectedEmphasis === e;
                      const isOwned = isPoisonCraft || owned.includes(e);
                      return (
                        <button key={e} onClick={() => setSelectedEmphasis(active ? null : e)}
                          style={{ fontSize: 11, padding: '2px 7px', borderRadius: 10,
                            border: `1px solid ${active ? 'var(--gold)' : isOwned ? 'var(--gold-dim)' : 'var(--border)'}`,
                            background: active ? 'rgba(200,150,42,.18)' : 'transparent',
                            color: active ? 'var(--gold)' : isOwned ? 'var(--text-secondary)' : 'var(--text-muted)',
                            cursor: 'pointer', fontFamily: 'inherit', fontStyle: isOwned ? 'normal' : 'italic',
                          }}>
                          {e}
                          {active && isOwned && <span style={{ color: 'var(--gold)', fontSize: 10, marginLeft: 4 }}>reroll 1s</span>}
                          {!isOwned && <span style={{ fontSize: 10, marginLeft: 4, opacity: .7 }}>(untrained)</span>}
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
              {/* Skill-specific options */}
              {['Sincerity','Etiquette','Courtier','Temptation','Intimidation'].includes(selectedSkill.name) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Target:</label>
                  <select value={skillTarget} onChange={e => setSkillTarget(e.target.value)}
                    style={{ fontSize: 12, padding: '2px 4px', background: 'var(--bg-panel)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 3 }}>
                    <option value="">- pick target -</option>
                    {[...enemies, ...allies].map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    {allCharacters.filter(c => c.id !== character?.id).map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
              )}
              {selectedSkill.name === 'Storytelling' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap' }}>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Boast about:</label>
                  <select value={boastTarget} onChange={e => setBoastTarget(e.target.value)}
                    style={{ fontSize: 12, padding: '2px 4px', background: 'var(--bg-panel)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 3 }}>
                    <option value="">- no boast (just storytelling) -</option>
                    {allCharacters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {boastTarget && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Success: +0.1 Rep per raise (TN 15)</span>}
                </div>
              )}
              {selectedSkill.name === 'Medicine' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Patient:</label>
                  <select value={skillTarget} onChange={e => setSkillTarget(e.target.value)}
                    style={{ fontSize: 12, padding: '2px 4px', background: 'var(--bg-panel)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 3 }}>
                    <option value={character?.id}>{character?.name} (self)</option>
                    {allCharacters.filter(c => c.id !== character?.id && !c.is_npc).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>TN 15 - success heals 1k1 wounds</span>
                </div>
              )}
              {selectedSkill.name === 'Forgery' && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                    <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Document name:</label>
                    <input value={forgeryDocName} onChange={e => setForgeryDocName(e.target.value)}
                      placeholder="e.g. Travel permit"
                      style={{ fontSize: 12, width: 140, padding: '2px 5px', background: 'var(--bg-panel)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 3 }} />
                  </div>
                  {/* Creation TN modifiers. Base TN (typed above) = 10 + the TN originally used to make
                      the item - simple letters/handwriting ≈ 15, complex documents (tax receipts, etc.)
                      ≈ 25 minimum, per GM judgment. These layer on top of that base. */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                      <input type="checkbox" checked={forgeryOriginalExample} onChange={e => setForgeryOriginalExample(e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
                      Original example on hand (−10 TN)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                      <input type="checkbox" checked={forgeryFromMemory} onChange={e => setForgeryFromMemory(e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
                      Working from memory (+10 TN)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-secondary)', cursor: 'pointer' }}
                      title="No fixed TN number for this one - logs a note for the GM to factor into the creation TN and/or later detection difficulty at their discretion.">
                      <input type="checkbox" checked={forgeryQualityMaterials} onChange={e => setForgeryQualityMaterials(e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
                      High-quality materials (GM discretion)
                    </label>
                  </div>
                </>
              )}
              {selectedSkill.name === 'Acting' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Posing as (optional):</label>
                  <input value={actingTempName} onChange={e => setActingTempName(e.target.value)}
                    placeholder="e.g. Merchant Farrukh"
                    style={{ fontSize: 12, width: 140, padding: '2px 5px', background: 'var(--bg-panel)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 3 }} />
                </div>
              )}
              {isAtk && (
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: '.25rem' }}>Target:</div>
                  <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap' }}>
                    {targetPool.filter(e => e.wound < 7).map(e => {
                      const rangeIssue = getRangeIssue(e);
                      return (
                        <button key={e.id} className={`btn btn-sm ${selectedTarget === e.id ? 'btn-p' : ''}`} style={{ fontSize: 12, opacity: rangeIssue ? 0.4 : 1, cursor: rangeIssue ? 'not-allowed' : 'pointer' }}
                          disabled={!!rangeIssue} title={rangeIssue || undefined}
                          onClick={() => { if (rangeIssue) return; setSelectedTarget(e.id); }}>
                          {e.name.split(' -')[0]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {showContestedPicker && (
                <div style={{ background: 'rgba(80,120,220,.08)', border: '1px solid #5078dc', borderRadius: 6, padding: '.5rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: 11, color: '#7098f0', fontWeight: 600 }}>
                    Contested Roll - your {selectedSkill.name} vs their chosen skill (costs a Full Action)
                  </div>
                  <select value={contestedOpponentId} onChange={e => { setContestedOpponentId(e.target.value); setContestedOpponentSkill(''); }} style={{ fontSize: 12 }}>
                    <option value="">- choose opponent -</option>
                    {targetPool.map(t => <option key={t.id} value={t.id}>{t.name.split(' -')[0]}</option>)}
                  </select>
                  {contestedOpponentId && (() => {
                    const opp = targetPool.find(t => t.id === contestedOpponentId);
                    const oppSkills = (opp?.skills || []).map(s => s.name);
                    return (
                      <select value={contestedOpponentSkill} onChange={e => setContestedOpponentSkill(e.target.value)} style={{ fontSize: 12 }}>
                        <option value="">- their skill -</option>
                        {oppSkills.map(s => <option key={s} value={s}>{s}</option>)}
                        <option value={`Trait: Willpower`}>Trait: Willpower</option>
                      </select>
                    );
                  })()}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-sm" style={{ borderColor: '#5078dc', color: '#7098f0' }}
                      disabled={!contestedOpponentId || !contestedOpponentSkill}
                      onClick={() => {
                        if (onStartContestedRoll) onStartContestedRoll(selectedSkill.name, contestedOpponentId, contestedOpponentSkill);
                        setShowContestedPicker(false);
                        setContestedOpponentId('');
                        setContestedOpponentSkill('');
                      }}>
                      Start Contested Roll
                    </button>
                    <button className="btn btn-sm" onClick={() => setShowContestedPicker(false)}>Cancel</button>
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
                <button className="btn btn-sm" onClick={() => { setShowSkillPicker(true); setSelectedSkill(null); }}>← Change</button>
                <button className="btn btn-p" disabled={isAtk && !selectedTarget} onClick={() => {
                  const manualTn = parseInt(document.getElementById('manual-tn-input')?.value, 10) || 15;
                  handleRoll(manualTn);
                  onSpendAction && onSpendAction('full');
                }}>
                  Roll {pool.roll}k{pool.keep}
                </button>
                {onStartContestedRoll && !showContestedPicker && (
                  <button className="btn btn-sm" style={{ borderColor: '#5078dc', color: '#7098f0' }}
                    onClick={() => setShowContestedPicker(true)}
                    title="Start a Contested Roll using this skill against a chosen opponent's skill - costs a Full Action">
                    <i className="ti ti-swords" style={{ marginRight: 4 }} />Contested Roll
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}
      {selectedAction === 'skill' && !selectedSkill && (
        <button className="btn btn-p" onClick={() => setShowSkillPicker(true)}>
          <i className="ti ti-list-check" style={{ marginRight: 6 }} /> Choose Skill…
        </button>
      )}

      {/* Move action pane */}
      {selectedAction === 'move' && (() => {
        const waterRing = getEffectiveWaterRing(character || combatant);
        const movesUsed = combatant._movesUsed || 0;
        const isFullAttack = combatant.stance === 'Full Attack';
        const maxMoves = isFullAttack ? 1 : 2;
        const onGrid = combatant.gridX !== undefined;
        return (
          <div style={{ padding: '.6rem .75rem', background: 'rgba(74,144,208,.08)', border: '1px solid rgba(74,144,208,.3)', borderRadius: 5 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#4a90d0', marginBottom: '.35rem' }}>
              🏃 Move - up to {waterRing} square{waterRing !== 1 ? 's' : ''}
              {isFullAttack && <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>(free - toward enemies only)</span>}
            </div>
            {onGrid ? (
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Glowing squares show your movement range. Click or drag your token to move.
                {movesUsed >= maxMoves && <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 3 }}>Movement used for this turn.</div>}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Grid is not active - movement is narrative. Describe where you move to the GM.
              </div>
            )}
            <button className="btn btn-sm" style={{ marginTop: '.4rem' }} onClick={() => setSelectedAction(null)}>Done</button>
          </div>
        );
      })()}

      {/* Free Action pane */}
      {selectedAction === 'free' && (
        <div style={{ padding: '.6rem .75rem', background: 'rgba(100,100,100,.08)', border: '1px solid var(--border)', borderRadius: 5 }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: '.4rem' }}>
            Free Action - declare what you're doing (optional):
          </div>
          {/* Quick free actions */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.3rem', marginBottom: '.5rem' }}>
            {/* Unequip / drop weapon */}
            {combatant.drawnWeapon && combatant.drawnWeapon !== 'Unarmed (1k1)' && (
              <button className="btn btn-sm" style={{ fontSize: 12 }}
                onClick={() => {
                  if (onDrawWeapon) onDrawWeapon(null);
                  if (onPass) onPass(`${combatant.name} drops/sheathes ${combatant.drawnWeapon.split(' (')[0]}`);
                  setSelectedAction(null);
                }}>
                <i className="ti ti-sword-off" style={{ fontSize: 11, marginRight: 3 }} />
                Drop / Sheathe {combatant.drawnWeapon.split(' (')[0]}
              </button>
            )}
            <button className="btn btn-sm" style={{ fontSize: 12 }}
              onClick={() => {
                if (onPass) onPass(`${combatant.name} speaks briefly`);
                setSelectedAction(null);
              }}>
              💬 Speak
            </button>
            <button className="btn btn-sm" style={{ fontSize: 12 }}
              onClick={() => {
                if (onPass) onPass(`${combatant.name} goes prone`);
                setSelectedAction(null);
              }}>
              ⬇ Go Prone
            </button>
          </div>
          <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
            <input id="free-action-input" placeholder="or type something custom…"
              style={{ flex: 1, fontSize: 13, padding: '4px 8px', background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-primary)', fontFamily: 'inherit' }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const txt = e.target.value.trim();
                  if (onPass) onPass(txt || 'Free Action');
                  setSelectedAction(null);
                  e.target.value = '';
                }
              }}
            />
            <button className="btn btn-sm btn-p" onClick={() => {
              const txt = document.getElementById('free-action-input')?.value?.trim();
              if (onPass) onPass(txt || 'Free Action');
              setSelectedAction(null);
            }}>Log it</button>
            <button className="btn btn-sm" onClick={() => setSelectedAction(null)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Draw weapon */}
      {selectedAction === 'draw' && (() => {
        // Support up to 2 equipped weapons
      
        const allWeapons = (character.equipment || []).filter(e => e.dr && !e.isAmmo);
        const getWeaponData = (wStr) => {
          const wName = wStr.split(' (')[0];
          return WEAPONS_LIST.find(w => w.name === wName) || {};
        };
        const toggleWeapon = (weaponStr) => {
          const wData = getWeaponData(weaponStr);
          // Enforce two-handed / bow: cannot pair with anything
          if (drawnList.includes(weaponStr)) {
            // Unequipping
            onDrawWeapon(drawnList.filter(w => w !== weaponStr));
            return;
          }
          // Check if new weapon is two-handed
          if (wData.twoHanded) {
            onDrawWeapon([weaponStr]);  // replace all - two-handed goes alone
            setSelectedAction(null);
            return;
          }
          // Check if currently drawn weapon is two-handed - must unequip first
          if (drawnList.some(w => getWeaponData(w).twoHanded)) {
            onDrawWeapon([weaponStr]);
            setSelectedAction(null);
            return;
          }
          // Normal: allow up to 2 one-handed weapons
          let next = drawnList.length < 2 ? [...drawnList, weaponStr] : [drawnList[drawnList.length - 1], weaponStr];
          onDrawWeapon(next);
          if (next.length > 0) setSelectedAction(null);
        };
        return (
          <div style={{ padding: '.5rem', background: 'rgba(107,78,40,.08)', borderRadius: 5, marginBottom: '.5rem' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: '.4rem' }}>
              Select weapon(s) to draw <span style={{ color: 'var(--gold)' }}>(up to 2)</span> - tap to toggle:
            </div>
            <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap' }}>
              {allWeapons.map(e => {
                const wStr = `${e.name} (${e.dr})`;
                const active = drawnList.includes(wStr);
                return (
                  <button key={e.name} className={`btn btn-sm ${active ? 'btn-p' : ''}`}
                    onClick={() => toggleWeapon(wStr)}>
                    {e.name} <span style={{ fontSize: 11, color: active ? 'var(--gold-dim)' : 'var(--text-muted)' }}>{e.dr}</span>
                    {active && <span style={{ marginLeft: 4, fontSize: 9 }}>✓</span>}
                  </button>
                );
              })}
              <button className={`btn btn-sm ${drawnList.includes('Unarmed (1k1)') ? 'btn-p' : ''}`}
                onClick={() => toggleWeapon('Unarmed (1k1)')}>
                Unarmed <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>1k1</span>
              </button>
            </div>
            {drawnList.length > 0 && (
              <div style={{ fontSize: 11, color: 'var(--gold)', marginTop: '.3rem' }}>
                Drawn: {drawnList.map(w => w.split(' (')[0]).join(' + ')}
              </div>
            )}
            {isDualWielding && (
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.5 }}>
                Dual wield: primary hand −5 TN to attacks · off-hand penalty varies by size (small −5, medium −10, large −15) · +{dualWieldArmorBonus} Armor TN (Insight Rank)
              </div>
            )}
          </div>
        );
      })()}
      </>
      )}
    </div>
  );
}
