import React, { useState } from 'react';
import { RAISE_OPTIONS, ATTACK_MANEUVERS, SCHOOL_DATA, TECHNIQUE_ROLL_BONUSES, ADVANTAGE_ROLL_BONUSES } from '../data/constants';
import { rollN } from '../lib/utils';
import { playSuccess, playFailure, playClick } from '../lib/sounds';

// ── Compute technique + advantage roll bonuses for a roll context ─────────────
// Returns { extraRolled, extraKept, extraFlat, freeRaises, notes, conditionals }
// 'conditionals' = bonuses that need player confirmation (stance-dependent, etc.)
function skillMatches(bonus, skillName, isAttack, isDamage, isSpellcasting, isInitiative, isSocial, isLore, isTrait, isPerform, isContested) {
  const s = bonus.skills || [];
  if (s.includes('ALL')) return true;
  if (s.includes('ATTACK') && isAttack) return true;
  if (s.includes('DAMAGE') && isDamage) return true;
  if (s.includes('SPELLCASTING') && isSpellcasting) return true;
  if (s.includes('INITIATIVE') && isInitiative) return true;
  if (s.includes('SOCIAL') && isSocial) return true;
  if (s.includes('LORE') && isLore) return true;
  if (s.includes('TRAIT') && isTrait) return true;
  if (s.includes('PERFORM') && isPerform) return true;
  if (s.includes('CONTESTED') && isContested) return true;
  if (s.includes('INTELLIGENCE') && skillName?.toLowerCase?.().includes('intelligence')) return true;
  if (s.includes('REDUCTION')) return false; // informational only
  return s.some(sk => sk === skillName);
}

const SOCIAL_SKILLS = ['Commerce','Sincerity','Temptation','Courtier','Etiquette','Storytelling','Intimidation','Acting','Perform: Dancing','Perform: Singing'];
const LORE_SKILLS = ['Lore: Underworld','Lore: Law','Lore: History','Lore: Theology','Lore: Burning Sands','Lore: Ebonites','Lore: Khadi','Lore: Jackal','Lore: Undead','Lore: Yodotai History'];
const SPELLCASTING_SKILLS = ['Spellcraft'];

function computeBonuses(character, skillName, isAttack, isDamage, currentStance) {
  if (!character) return { extraRolled: 0, extraKept: 0, extraFlat: 0, freeRaises: 0, auto: [], conditional: [] };

  const isInitiative = skillName === 'Initiative' || skillName === 'INITIATIVE';
  const isSocial = SOCIAL_SKILLS.includes(skillName);
  const isLore = LORE_SKILLS.some(l => skillName.startsWith('Lore'));
  const isSpellcasting = SPELLCASTING_SKILLS.includes(skillName);
  const isDmg = isDamage || skillName === 'DAMAGE';
  const isAtk = isAttack || skillName === 'ATTACK';
  const isTrait = !skillName || skillName === skillName?.toUpperCase?.();
  const isPerform = skillName?.startsWith('Perform');
  const isContested = false; // passed separately if needed

  const earnedTechs = Object.entries(character.techniques || {}).filter(([r]) => +r <= (character.school_rank || 1)).map(([,n]) => n).filter(Boolean);
  const charAdvantages = (character.advantages || []).map(a => typeof a === 'string' ? a : a.name).filter(Boolean);

  let extraRolled = 0, extraKept = 0, extraFlat = 0, freeRaisesTotal = 0;
  const autoNotes = [];
  const conditionalItems = [];

  const processBonus = (bonus, sourceName) => {
    if (!skillMatches(bonus, skillName, isAtk, isDmg, isSpellcasting, isInitiative, isSocial, isLore, isTrait, isPerform, isContested)) return;
    // Check stance filter
    if (bonus.stances && currentStance && !bonus.stances.some(s => currentStance.includes(s))) {
      conditionalItems.push({ note: bonus.note, condition: `Only in: ${bonus.stances.join('/')} stance`, source: sourceName });
      return;
    }
    // voidOnly bonuses are conditional
    if (bonus.voidOnly) {
      conditionalItems.push({ note: bonus.note, condition: 'Only when spending Void', source: sourceName });
      return;
    }
    // Other conditional bonuses shown separately
    if (bonus.conditional) {
      conditionalItems.push({ note: bonus.note, condition: bonus.conditional, source: sourceName });
      return;
    }
    // Auto-apply
    extraRolled += (bonus.rolled || 0);
    extraKept   += (bonus.kept || 0);
    extraFlat   += (bonus.flat || 0);
    freeRaisesTotal += (bonus.freeRaises || 0);
    if (bonus.note) autoNotes.push(bonus.note);
  };

  // Process earned techniques
  earnedTechs.forEach(techName => {
    const bonuses = TECHNIQUE_ROLL_BONUSES[techName] || [];
    bonuses.forEach(b => processBonus(b, techName));

    // Parse Jinn combat bonus strings (e.g. "Attack bonus = highest Ring")
    if (character.is_npc && character.faction === 'Jinn' && typeof techName === 'string') {
      const highestRing = Math.max(character.air || 2, character.earth || 2, character.fire || 2, character.water || 2);
      if (techName.includes('Attack bonus = highest Ring') && isAtk) {
        extraRolled += highestRing;
        autoNotes.push(`+${highestRing}k0 attack (Jinn Combat Bonus)`);
      }
      if (techName.includes('Damage bonus = highest Ring') && isDmg) {
        extraRolled += highestRing;
        autoNotes.push(`+${highestRing}k0 damage (Jinn Combat Bonus)`);
      }
      if (techName.includes('+TN to Be Hit = highest Ring')) {
        // This is defensive — noted conditionally
        conditionalItems.push({ note: `+${highestRing} TN to Be Hit (Jinn Protection)`, condition: 'Always active — applied to Armor TN', source: techName });
      }
      if (techName.includes('Initiative bonus = highest Ring') && isInitiative) {
        extraRolled += highestRing;
        autoNotes.push(`+${highestRing}k0 initiative (Jinn Combat Bonus)`);
      }
      if (techName.includes('Extra Wounds per Wound Rank = highest Ring')) {
        conditionalItems.push({ note: `+${highestRing} Wounds per Wound Rank (Jinn Combat Bonus)`, condition: 'Applied to wound thresholds', source: techName });
      }
      if (techName.includes('Suffers no Wound Penalties')) {
        autoNotes.push('No Wound Penalties (Jinn Protection)');
      }
      if (techName.includes('Cannot be affected by spells')) {
        conditionalItems.push({ note: 'Immune to spells (Jinn Protection)', condition: 'Always active', source: techName });
      }
    }
  });

  // Process advantages
  charAdvantages.forEach(advName => {
    const bonuses = ADVANTAGE_ROLL_BONUSES[advName] || [];
    bonuses.forEach(b => processBonus(b, advName));
  });

  return { extraRolled, extraKept, extraFlat, freeRaises: freeRaisesTotal, auto: autoNotes, conditional: conditionalItems };
}

// ── Dice Modal ────────────────────────────────────────────────────────────────
export default function DiceModal({ context, onClose, onResult, onLogEvent, onLuckUsed, disableReroll = false }) {
  const [phase, setPhase] = useState('setup');
  const [raises, setRaises] = useState([]);
  const [useVoid, setUseVoid] = useState(false);
  const [flatMod, setFlatMod] = useState(context?.suggestedFlatMod || 0);
  const [extraRoll, setExtraRoll] = useState(0);
  const [extraKeep, setExtraKeep] = useState(0);
  const [manualFreeRaises, setManualFreeRaises] = useState(0);
  const [dice, setDice] = useState([]);
  const [kept, setKept] = useState(new Set());
  const [rollResult, setRollResult] = useState(null);
  const [dmgDice, setDmgDice] = useState([]);
  const [dmgKept, setDmgKept] = useState(new Set());
  const [finalDamage, setFinalDamage] = useState(null);
  const [modApplied, setModApplied] = useState(context?.suggestedFlatMod ? 'Center stance (School Rank)' : null);
  // Emphasis — character has an emphasis for this skill → may re-roll 1s
  const skillEmphases = context?.character?.skills?.find(s => s.name === context?.skill)?.emphases || [];
  const hasEmphasis = skillEmphases.length > 0;
  const [useEmphasis, setUseEmphasis] = useState(hasEmphasis); // auto-checked if applicable
  const [rerolledOnes, setRerolledOnes] = useState([]); // indices of dice that had 1s rerolled
  const [showAdvanced, setShowAdvanced] = useState(false); // collapsed by default

  const isAttack = context?.isAttack || false;
  const dmgDR = context?.dr || '3k2';
  const [dmgRoll, dmgKeep] = dmgDR.match(/\d+/g)?.map(Number) || [3, 2];

  // Hooks MUST come before any derived consts that use them
  const [activeConditionals, setActiveConditionals] = React.useState([]);
  const toggleConditional = (idx) => {
    setActiveConditionals(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  // Compute technique + advantage bonuses (after hook)
  const bonuses = (context?.character && context?.skill)
    ? computeBonuses(
        context.character,
        context.skill,
        context.isAttack,
        context.isDamage,
        context.character?.current_stance || 'Attack'
      )
    : { extraRolled: 0, extraKept: 0, extraFlat: 0, freeRaises: 0, auto: [], conditional: [] };

  // Compute totals including active conditionals (after bonuses)
  const activatedConds = bonuses.conditional.filter((_, i) => activeConditionals.includes(i));
  const condExtraRolled = activatedConds.reduce((s, c) => s + (TECHNIQUE_ROLL_BONUSES[c.source]?.find?.(b => b.note === c.note)?.rolled || ADVANTAGE_ROLL_BONUSES[c.source]?.find?.(b => b.note === c.note)?.rolled || 0), 0);
  const condExtraKept   = activatedConds.reduce((s, c) => s + (TECHNIQUE_ROLL_BONUSES[c.source]?.find?.(b => b.note === c.note)?.kept || ADVANTAGE_ROLL_BONUSES[c.source]?.find?.(b => b.note === c.note)?.kept || 0), 0);
  const condFreeRaises  = activatedConds.reduce((s, c) => s + (TECHNIQUE_ROLL_BONUSES[c.source]?.find?.(b => b.note === c.note)?.freeRaises || ADVANTAGE_ROLL_BONUSES[c.source]?.find?.(b => b.note === c.note)?.freeRaises || 0), 0);

  // Derived roll counts — after all bonuses computed
  const voidBonus = useVoid ? 1 : 0;
  const techRolled = bonuses.extraRolled + condExtraRolled;
  const techKept   = bonuses.extraKept   + condExtraKept;
  const techFreeRaises = bonuses.freeRaises + condFreeRaises;
  const rollCount = (context?.baseRoll || 2) + voidBonus + extraRoll + techRolled;
  const keepCount = Math.min((context?.baseKeep || 2) + voidBonus + extraKeep + techKept, rollCount);
  const freeRaiseReduction = ((context?.freeRaises || 0) + techFreeRaises + manualFreeRaises) * 5;
  const woundTNPenalty = context?.woundPenalty || 0;
  const tn = Math.max(5, (context?.tn || 15) - freeRaiseReduction + raises.length * 5 + woundTNPenalty);

  const toggleRaise = (r) => setRaises(p => p.includes(r) ? p.filter(x => x !== r) : [...p, r]);

  // Roll a single die, auto-exploding 10s immediately
  const rollOneDie = () => {
    const base = Math.floor(Math.random() * 10) + 1;
    if (base !== 10) return { total: base, exploded: false, bonus: 0 };
    let bonus = 0, last = 10, safety = 0;
    while (last === 10 && safety < 10) {  // max 10 explosions per die
      last = Math.floor(Math.random() * 10) + 1;
      bonus += last;
      safety++;
    }
    return { total: 10 + bonus, exploded: true, bonus };
  };

  const rollAllDice = (n) => Array.from({ length: n }, rollOneDie);

  const doRoll = () => {
    const newDice = rollAllDice(rollCount);
    setDice(newDice);
    setKept(new Set());
    setRollResult(null);
    setPhase('rolling');
  };

  const toggleKeep = (i) => {
    if (kept.has(i)) { const n = new Set(kept); n.delete(i); setKept(n); return; }
    if (kept.size >= keepCount) return;
    const n = new Set(kept); n.add(i); setKept(n);
  };

  const confirmRoll = () => {
    // If emphasis applies, re-roll any kept 1s first
    if (useEmphasis && hasEmphasis) {
      const onesIdx = [...kept].filter(i => dice[i].total === 1);
      if (onesIdx.length > 0) {
        const newDice = [...dice];
        onesIdx.forEach(i => { newDice[i] = rollOneDie(); });
        setDice(newDice);
        setRerolledOnes(onesIdx);
        // Brief delay then finalize with new dice
        setTimeout(() => {
          const total = [...kept].reduce((s, i) => s + newDice[i].total, 0) + flatMod;
          const success = total >= tn;
          const result = { total, success, margin: total - tn, tn, raises, flatMod };
          setRollResult(result);
          setRerolledOnes([]);
          if (success) playSuccess(); else playFailure();
          if (result.success && context?.isAttack) { setPhase('damage'); setDmgDice(rollAllDice(dmgRoll)); }
          else { setPhase('done'); if (onResult) onResult(result); }
        }, 800);
        return; // early return — result set in timeout
      }
    }
    const total = [...kept].reduce((s, i) => s + dice[i].total, 0) + flatMod;
    const success = total >= tn;
    const result = { total, success, margin: total - tn, tn, raises, flatMod };
    setRollResult(result);
    if (success) playSuccess(); else playFailure();
    if (onLogEvent) {
      const skillName = context?.skill || 'Roll';
      const charName = context?.character?.name;
      const icon = success ? 'ti-check' : 'ti-x';
      const who = charName ? `${charName}: ` : '';
      const txt = success
        ? `${who}${skillName} — ${total} vs TN ${tn} ✓ (+${total - tn})`
        : `${who}${skillName} — ${total} vs TN ${tn} ✗ (${total - tn})`;
      onLogEvent(icon, txt);
    }
    if (success && isAttack) {
      // Auto-explode damage dice too
      const newDmgDice = Array.from({ length: dmgRoll }, rollOneDie);
      setDmgDice(newDmgDice);
      const sortedIdx = newDmgDice.map((d, i) => ({ i, v: d.total })).sort((a, b) => b.v - a.v).map(x => x.i);
      setDmgKept(new Set(sortedIdx.slice(0, dmgKeep)));
      setPhase('damage');
    } else {
      onResult && onResult(result, null);
      setPhase('done');
    }
  };

  const toggleDmgKeep = (i) => {
    if (dmgKept.has(i)) { const n = new Set(dmgKept); n.delete(i); setDmgKept(n); return; }
    if (dmgKept.size >= dmgKeep) return;
    const n = new Set(dmgKept); n.add(i); setDmgKept(n);
  };

  const confirmDamage = () => {
    const dmg = [...dmgKept].reduce((s, i) => s + dmgDice[i].total, 0);
    setFinalDamage(dmg);
    if (onLogEvent) {
      onLogEvent('ti-sword', `${context?.skill || 'Attack'} → ${dmg} wounds to ${context?.targetName || 'target'}`);
    }
    onResult && onResult(rollResult, dmg);
    setPhase('done');
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={useVoid ? { border: '3px solid #000', boxShadow: '0 0 24px rgba(0,0,0,.8), 0 0 0 1px #000' } : undefined}>
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <div style={{ fontSize: 44, fontWeight: 800, color: 'var(--gold)', lineHeight: 1 }}>{tn}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '.5rem' }}>Target Number</div>
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)' }}>
            <i className="ti ti-dice" style={{ marginRight: 6, fontSize: 15 }} />
            {context?.skill || 'Skill Roll'}
            {context?.targetName && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> → {context.targetName}</span>}
          </div>
          {context?.character?.name && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{context.character.name}</div>}
        </div>

        {phase === 'setup' && (<>
          {/* ── Always visible: key info ── */}

          {/* Wound penalty alert */}
          {woundTNPenalty > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--red)', padding: '4px 8px', background: 'rgba(200,64,48,.1)', border: '1px solid rgba(200,64,48,.3)', borderRadius: 4, marginBottom: '.5rem' }}>
              <i className="ti ti-heart-broken" style={{ fontSize: 11 }} />Wound penalty +{woundTNPenalty} TN already included in TN above
            </div>
          )}

          {/* Free Raises summary — brief */}
          {((context?.freeRaises || 0) > 0 || (context?.bonusNotes?.length || 0) > 0) && (
            <div style={{ fontSize: 12, color: 'var(--gold-dim)', marginBottom: '.4rem', lineHeight: 1.5 }}>
              {context.freeRaises > 0 && <span>✦ {context.freeRaises} Free Raise{context.freeRaises > 1 ? 's' : ''} (TN −{context.freeRaises * 5}) </span>}
              {(context.bonusNotes || []).map((n, i) => <span key={i} style={{ marginRight: 6 }}>· {n}</span>)}
            </div>
          )}

          {/* Dice pool — always visible */}
          <div className="modal-section" style={{ paddingBottom: '.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--gold)' }}>
                {rollCount}k{keepCount}
                {useVoid && <span style={{ fontSize: 14, color: 'var(--gold)', marginLeft: 8 }}>(Void)</span>}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {context?.skill} · TN {tn}
                {context?.ring && <span> · {context.ring} {context.ringVal}</span>}
              </div>
            </div>
          </div>

          {/* Raises — always visible */}
          <div className="modal-section">
            <span className="modal-label">Raises <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--text-muted)' }}>+5 TN each — harder but more effect</span></span>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {RAISE_OPTIONS.map(r => (
                <button key={r} className={`raise-btn ${raises.includes(r) ? 'sel' : ''}`} onClick={() => toggleRaise(r)}>{r}</button>
              ))}
            </div>
            {isAttack && (
              <div style={{ marginTop: '.4rem' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: '.2rem' }}>Maneuvers (cost 1 raise each):</div>
                <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                  {ATTACK_MANEUVERS.map(r => (
                    <button key={r} className={`raise-btn ${raises.includes(r) ? 'sel' : ''}`} onClick={() => toggleRaise(r)}>{r}</button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Void — always visible */}
          <div className="modal-section" style={{ paddingTop: '.25rem', paddingBottom: '.25rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14, color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={useVoid} onChange={e => setUseVoid(e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
              Spend Void Point (+1k1)
              {context?.currentVoid !== undefined && (
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>({context.currentVoid} remaining)</span>
              )}
            </label>
          </div>

          {/* Emphasis — visible when applicable */}
          {hasEmphasis && (
            <div className="modal-section" style={{ paddingTop: '.25rem', paddingBottom: '.25rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={useEmphasis} onChange={e => setUseEmphasis(e.target.checked)}
                  style={{ accentColor: 'var(--gold)', width: 15, height: 15 }} />
                <span style={{ fontSize: 13 }}>
                  <strong style={{ color: 'var(--gold)' }}>Emphasis</strong>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 5 }}>
                    ({skillEmphases.join(', ')}) — re-roll kept 1s
                  </span>
                </span>
              </label>
            </div>
          )}

          {/* ── Advanced section toggle ── */}
          <div style={{ borderTop: '1px solid var(--border)', marginTop: '.35rem', paddingTop: '.35rem' }}>
            <button onClick={() => setShowAdvanced(v => !v)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', padding: '2px 0', display: 'flex', alignItems: 'center', gap: 4 }}>
              <i className={`ti ti-chevron-${showAdvanced ? 'up' : 'down'}`} style={{ fontSize: 11 }} />
              {showAdvanced ? 'Hide' : 'Show'} advanced options
              {(bonuses.auto.length > 0 || bonuses.conditional.length > 0 || extraRoll !== 0 || extraKeep !== 0 || flatMod !== 0 || manualFreeRaises > 0) && (
                <span style={{ fontSize: 10, color: 'var(--gold)', marginLeft: 4 }}>●</span>
              )}
            </button>
          </div>

          {showAdvanced && (<>
            {/* Active bonuses from context */}
            {(context?.bonusNotes?.length > 0 || context?.freeRaises > 0) && (
              <div className="modal-section">
                <span className="modal-label">Active Bonuses</span>
                <div style={{ background: 'rgba(200,150,42,.06)', border: '1px solid rgba(200,150,42,.2)', borderRadius: 4, padding: '.4rem .6rem' }}>
                  {(context.bonusNotes || []).map((note, i) => (
                    <div key={i} style={{ fontSize: 11, color: 'var(--gold-dim)', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <i className="ti ti-star" style={{ fontSize: 10 }} />{note}
                    </div>
                  ))}
                  {context.freeRaises > 0 && (
                    <div style={{ fontSize: 11, color: 'var(--gold)', marginTop: 2 }}>
                      {context.freeRaises} Free Raise{context.freeRaises > 1 ? 's' : ''} applied (TN −{context.freeRaises * 5})
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TN breakdown */}
            <div className="modal-section">
              <span className="modal-label">TN Breakdown</span>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                Base {context?.tn || 15}{raises.length > 0 ? ` + ${raises.length * 5} raises` : ''}{woundTNPenalty > 0 ? ` + ${woundTNPenalty} wounds` : ''}{manualFreeRaises > 0 ? ` − ${manualFreeRaises * 5} free raises` : ''} = <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{tn}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: '.3rem' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Manual Free Raise:</span>
                <button className="rep-btn" onClick={() => setManualFreeRaises(n => Math.max(0, n - 1))} disabled={manualFreeRaises === 0}>−</button>
                <span style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 600, minWidth: 14, textAlign: 'center' }}>{manualFreeRaises}</span>
                <button className="rep-btn" onClick={() => setManualFreeRaises(n => n + 1)}>+</button>
              </div>
            </div>

            {/* Dice pool adjuster */}
            <div className="modal-section">
              <span className="modal-label">Dice Pool Adjuster</span>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>+Roll</span>
                  <div style={{ display: 'flex', gap: 2 }}>
                    <button className="rep-btn" onClick={() => setExtraRoll(r => r - 1)}>−</button>
                    <span style={{ fontSize: 13, minWidth: 16, textAlign: 'center', color: extraRoll !== 0 ? 'var(--gold)' : 'var(--text-muted)' }}>{extraRoll >= 0 ? '+' : ''}{extraRoll}</span>
                    <button className="rep-btn" onClick={() => setExtraRoll(r => r + 1)}>+</button>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>+Keep</span>
                  <div style={{ display: 'flex', gap: 2 }}>
                    <button className="rep-btn" onClick={() => setExtraKeep(k => k - 1)}>−</button>
                    <span style={{ fontSize: 13, minWidth: 16, textAlign: 'center', color: extraKeep !== 0 ? 'var(--gold)' : 'var(--text-muted)' }}>{extraKeep >= 0 ? '+' : ''}{extraKeep}</span>
                    <button className="rep-btn" onClick={() => setExtraKeep(k => k + 1)}>+</button>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Flat +</span>
                  <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <button className="rep-btn" onClick={() => setFlatMod(m => m - 1)}>−</button>
                    <span style={{ fontSize: 13, minWidth: 20, textAlign: 'center', color: flatMod !== 0 ? 'var(--gold)' : 'var(--text-muted)' }}>{flatMod >= 0 ? '+' : ''}{flatMod}</span>
                    <button className="rep-btn" onClick={() => setFlatMod(m => m + 1)}>+</button>
                    {flatMod !== 0 && <button className="btn btn-sm" style={{ fontSize: 10, padding: '1px 4px' }} onClick={() => { setFlatMod(0); setModApplied(null); }}>✕</button>}
                  </div>
                  {modApplied && <div style={{ fontSize: 10, color: 'var(--gold-dim)', fontStyle: 'italic' }}>{modApplied}</div>}
                </div>
              </div>
            </div>

            {/* Technique + Advantage Bonuses */}
            {(bonuses.auto.length > 0 || bonuses.conditional.length > 0) && (
              <div className="modal-section">
                <span className="modal-label">Technique & Advantage Bonuses</span>
                {bonuses.auto.length > 0 && (
                  <div style={{ marginBottom: bonuses.conditional.length > 0 ? '.5rem' : 0 }}>
                    {bonuses.auto.map((note, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, padding: '3px 6px', background: 'rgba(160,100,220,.1)', border: '1px solid rgba(160,100,220,.3)', borderRadius: 3, marginBottom: 3, color: '#c0a0e8' }}>
                        <i className="ti ti-sparkles" style={{ fontSize: 10, flexShrink: 0 }} />
                        <span style={{ flex: 1 }}>{note}</span>
                        <span style={{ fontSize: 9, color: 'rgba(160,100,220,.6)' }}>auto</span>
                      </div>
                    ))}
                  </div>
                )}
                {bonuses.conditional.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Click to activate if condition applies:</div>
                    {bonuses.conditional.map((c, i) => {
                      const active = activeConditionals.includes(i);
                      return (
                        <div key={i} onClick={() => toggleConditional(i)}
                          style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 11, padding: '4px 7px',
                            background: active ? 'rgba(160,100,220,.15)' : 'rgba(107,78,40,.08)',
                            border: `1px solid ${active ? 'rgba(160,100,220,.5)' : 'var(--border)'}`,
                            borderRadius: 4, marginBottom: 3, cursor: 'pointer', userSelect: 'none',
                          }}>
                          <span style={{ fontSize: 13, lineHeight: 1.1, color: active ? '#c0a0e8' : 'var(--text-muted)' }}>{active ? '☑' : '☐'}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ color: active ? '#c0a0e8' : 'var(--text-secondary)' }}>{c.note}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 1 }}>{c.condition}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>)}

          {/* Roll button */}
          <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', marginTop: '.5rem' }}>
            <button className="btn btn-p btn-lg" onClick={doRoll}>
              <i className="ti ti-dice" style={{ marginRight: 4 }} /> Roll {rollCount}k{keepCount}{flatMod !== 0 ? ` ${flatMod >= 0 ? '+' : ''}${flatMod}` : ''} vs TN {tn}
            </button>
            <button className="btn" onClick={onClose}>Cancel</button>
          </div>
        </>)}

        {/* Rolling phase */}
        {phase === 'rolling' && (<>
          <div className="modal-section">
            <span className="modal-label">Click to keep — {kept.size}/{keepCount} kept — TN {tn}{flatMod !== 0 ? ` (${flatMod >= 0 ? '+' : ''}${flatMod} modifier)` : ''}</span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: '.5rem' }}>
              {dice.map((d, i) => (
                <div key={i} className={`die ${kept.has(i) ? 'kept' : ''} ${d.exploded ? 'ten' : ''}`} onClick={() => toggleKeep(i)}
                  title={d.exploded ? `Exploded! 10 + ${d.bonus} = ${d.total}` : rerolledOnes.includes(i) ? 'Re-rolled (Emphasis — was 1)' : ''}
                  style={rerolledOnes.includes(i) ? { animation: 'emphasisReroll .6s ease-out', border: '2px solid var(--gold)', boxShadow: '0 0 12px rgba(200,150,42,.6)' } : {}}>
                  {d.total}
                  {d.exploded && <span style={{ fontSize: 9, display: 'block', color: kept.has(i) ? '#1a1208' : '#c0a0e0', lineHeight: 1 }}>💥+{d.bonus}</span>}
                  {rerolledOnes.includes(i) && !d.exploded && <span style={{ fontSize: 7, display: 'block', color: 'var(--gold-dim)', lineHeight: 1 }}>★re</span>}
                  {kept.has(i) && <span className="die-lbl">✓</span>}
                </div>
              ))}
            </div>
            <div style={{ marginTop: '.75rem', fontSize: 13, color: 'var(--text-muted)' }}>
              {(() => {
                const runningTotal = [...kept].reduce((s, i) => s + dice[i].total, 0) + flatMod;
                const wouldSucceed = runningTotal >= tn;
                return (<>
                  Total: <span style={{ color: kept.size > 0 ? (wouldSucceed ? 'var(--green)' : 'var(--red)') : 'var(--text-primary)', fontWeight: 600 }}>{runningTotal}</span>
                  <span style={{ marginLeft: 4, color: 'var(--text-muted)' }}>vs TN {tn}</span>
                  {flatMod !== 0 && <span style={{ color: 'var(--gold-dim)', fontSize: 12 }}> (incl. {flatMod >= 0 ? '+' : ''}{flatMod})</span>}
                  {kept.size > 0 && (
                    <span style={{ marginLeft: 8, color: wouldSucceed ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
                      {wouldSucceed ? `✓ +${runningTotal - tn}` : `✗ ${runningTotal - tn}`}
                    </span>
                  )}
                  {kept.size < keepCount && kept.size > 0 && (
                    <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      ({keepCount - kept.size} more to keep)
                    </span>
                  )}
                </>);
              })()}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '.5rem' }}>
            <button className="btn btn-p" disabled={kept.size === 0} onClick={confirmRoll}>
              Confirm {kept.size}/{keepCount} {kept.size < keepCount ? `(keeping fewer — may fail)` : ''}
            </button>
            <button className="btn btn-sm" onClick={() => {
              const sortedIdx = dice.map((d, i) => ({ i, v: d.total })).sort((a, b) => b.v - a.v).map(x => x.i);
              setKept(new Set(sortedIdx.slice(0, keepCount)));
            }}>
              Best {keepCount}
            </button>
            <button className="btn btn-sm" onClick={() => { setDice(rollAllDice(rollCount)); setKept(new Set()); }}
              style={{ display: disableReroll ? 'none' : undefined }}>
              <i className="ti ti-refresh" /> Reroll
            </button>
            {/* Luck reroll — only for characters with Luck advantage and uses remaining */}
            {(() => {
              const char = context?.character;
              if (!char) return null;
              const luckAdv = (char.advantages || []).find(a => (a.name || '').startsWith('Luck'));
              if (!luckAdv) return null;
              const luckRank = luckAdv.rank || 1;
              const usesLeft = luckAdv.current_uses !== undefined ? luckAdv.current_uses : luckRank;
              if (usesLeft <= 0) return null;
              return (
                <button className="btn btn-sm" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}
                  title={`Luck: reroll keeping higher result (${usesLeft} use${usesLeft !== 1 ? 's' : ''} remaining)`}
                  onClick={() => {
                    setDice(rollAllDice(rollCount));
                    setKept(new Set());
                    if (onLuckUsed) onLuckUsed();
                  }}>
                  🍀 Luck ({usesLeft})
                </button>
              );
            })()}
          </div>
        </>)}

        {/* Damage phase */}
        {phase === 'damage' && (<>
          <div style={{ padding: '.6rem .75rem', background: 'rgba(200,150,42,.1)', border: '1px solid var(--gold-dim)', borderRadius: 4, marginBottom: '1rem', fontSize: 14, color: 'var(--gold)' }}>
            ✓ Hit! Roll damage — {dmgDR} keep {dmgKeep}
            {raises.length > 0 && <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>Raises: {raises.join(', ')}</span>}
          </div>
          <div className="modal-section">
            <span className="modal-label">Damage Dice — click to keep ({dmgKept.size}/{dmgKeep})</span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: '.5rem' }}>
              {dmgDice.map((d, i) => (
                <div key={i} className={`die ${dmgKept.has(i) ? 'kept' : ''} ${d.exploded ? 'ten' : ''}`} onClick={() => toggleDmgKeep(i)} style={{ borderColor: 'var(--red-dim)' }}>
                  {d.total}
                  {d.exploded && <span style={{ fontSize: 9, display: 'block', color: dmgKept.has(i) ? '#1a1208' : '#c0a0e0', lineHeight: 1 }}>💥+{d.bonus}</span>}
                  {dmgKept.has(i) && <span className="die-lbl" style={{ background: 'var(--red)' }}>✓</span>}
                </div>
              ))}
            </div>
            <div style={{ marginTop: '.75rem', fontSize: 15, fontWeight: 600, color: 'var(--red)' }}>
              Damage: {[...dmgKept].reduce((s, i) => s + dmgDice[i].total, 0)} wounds
            </div>
          </div>
          <button className="btn btn-p btn-d" disabled={dmgKept.size !== dmgKeep} onClick={confirmDamage}
            style={{ background: 'var(--red)', borderColor: 'var(--red)', color: '#fff' }}>
            Apply {[...dmgKept].reduce((s, i) => s + dmgDice[i].total, 0)} Wounds
          </button>
        </>)}

        {phase === 'done' && rollResult && (
          <div style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
            <div style={{
              fontSize: 56, fontWeight: 900, letterSpacing: '.05em',
              color: rollResult.success ? 'var(--green)' : 'var(--red)',
              textShadow: `0 0 40px ${rollResult.success ? '#4a8a40' : '#c84030'}`,
              marginBottom: '.5rem', lineHeight: 1,
              animation: 'resultFade 2.5s ease-out forwards',
            }}>
              {rollResult.success ? 'SUCCESS' : 'FAILURE'}
            </div>
            <div style={{ fontSize: 16, color: 'var(--text-muted)', marginBottom: '.25rem' }}>
              {rollResult.total} vs TN {rollResult.tn}
              <span style={{ color: rollResult.success ? 'var(--green)' : 'var(--red)', marginLeft: 8, fontWeight: 600 }}>
                {rollResult.success ? `+${rollResult.margin}` : rollResult.margin}
              </span>
            </div>
            {finalDamage !== null && context?.targetName && (
              <div style={{ marginTop: '.5rem', padding: '.5rem 1rem', background: 'rgba(200,64,48,.12)', border: '1px solid rgba(200,64,48,.4)', borderRadius: 6 }}>
                <span style={{ fontSize: 24, fontWeight: 900, color: 'var(--red)' }}>{finalDamage}</span>
                <span style={{ fontSize: 14, color: 'var(--text-muted)', marginLeft: 8 }}>wounds → {context.targetName}</span>
              </div>
            )}
            {raises.length > 0 && (
              <div style={{ fontSize: 13, color: 'var(--gold-dim)', marginBottom: '.75rem', marginTop: '.4rem' }}>Raises: {raises.join(', ')}</div>
            )}
            <button className="btn btn-p" style={{ marginTop: '.75rem' }} onClick={onClose}>Close</button>
          </div>
        )}
        {phase === 'done' && !rollResult && (
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <button className="btn btn-p" onClick={onClose}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
}
