import React, { useState } from 'react';
import { RAISE_OPTIONS, ATTACK_MANEUVERS, SCHOOL_DATA } from '../data/constants';
import { rollN } from '../lib/utils';

// ── Find relevant school techniques for a skill ───────────────────────────────
function getRelevantTechniques(character, skillName) {
  if (!character?.school || !character?.school_rank) return [];
  const sd = SCHOOL_DATA[character.school];
  if (!sd?.techniques) return [];
  const hints = [];
  const rank = character.school_rank || 1;
  for (let r = 1; r <= rank; r++) {
    const t = sd.techniques[r];
    if (!t) continue;
    // Check if technique text mentions the skill
    const skillWords = skillName.toLowerCase().split(' ');
    if (skillWords.some(w => w.length > 3 && t.toLowerCase().includes(w))) {
      hints.push({ rank: r, text: t });
    }
  }
  return hints;
}

// ── Dice Modal ────────────────────────────────────────────────────────────────
export default function DiceModal({ context, onClose, onResult }) {
  const [phase, setPhase] = useState('setup');
  const [raises, setRaises] = useState([]);
  const [useVoid, setUseVoid] = useState(false);
  const [flatMod, setFlatMod] = useState(0);
  const [extraRoll, setExtraRoll] = useState(0);  // extra dice to roll
  const [extraKeep, setExtraKeep] = useState(0);  // extra dice to keep
  const [dice, setDice] = useState([]);
  const [kept, setKept] = useState(new Set());
  const [rollResult, setRollResult] = useState(null);
  const [dmgDice, setDmgDice] = useState([]);
  const [dmgKept, setDmgKept] = useState(new Set());
  const [modApplied, setModApplied] = useState(null); // tracks auto-applied technique mod

  const voidBonus = useVoid ? 1 : 0;
  const rollCount = (context?.baseRoll || 2) + voidBonus + extraRoll;
  const keepCount = Math.min((context?.baseKeep || 2) + voidBonus + extraKeep, rollCount);
  const tn = (context?.tn || 15) + raises.length * 5;
  const isAttack = context?.isAttack || false;
  const dmgDR = context?.dr || '3k2';
  const [dmgRoll, dmgKeep] = dmgDR.match(/\d+/g)?.map(Number) || [3, 2];

  // School technique hints
  const techniques = context?.character && context?.skill
    ? getRelevantTechniques(context.character, context.skill)
    : [];

  const toggleRaise = (r) => setRaises(p => p.includes(r) ? p.filter(x => x !== r) : [...p, r]);

  const doRoll = () => {
    setDice(rollN(rollCount));
    setKept(new Set());
    setRollResult(null);
    setPhase('rolling');
  };

  const toggleKeep = (i) => {
    const n = new Set(kept);
    if (n.has(i)) { n.delete(i); }
    else if (n.size < keepCount) { n.add(i); }
    setKept(n);
  };

  const confirmRoll = () => {
    const total = [...kept].reduce((s, i) => s + dice[i], 0) + flatMod;
    const success = total >= tn;
    const result = { total, success, margin: total - tn, tn, raises, flatMod };
    setRollResult(result);
    if (success && isAttack) {
      setDmgDice(rollN(dmgRoll));
      setDmgKept(new Set());
      setPhase('damage');
    } else {
      onResult && onResult(result, null);
      setPhase('done');
    }
  };

  const toggleDmgKeep = (i) => {
    const n = new Set(dmgKept);
    if (n.has(i)) { n.delete(i); }
    else if (n.size < dmgKeep) { n.add(i); }
    setDmgKept(n);
  };

  const confirmDamage = () => {
    const dmg = [...dmgKept].reduce((s, i) => s + dmgDice[i], 0);
    onResult && onResult(rollResult, dmg);
    setPhase('done');
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">
          <i className="ti ti-dice" style={{ marginRight: 6 }} />
          {context?.skill || 'Skill Roll'}
          {context?.targetName && <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>→ {context.targetName}</span>}
        </div>

        {phase === 'setup' && (<>
          {/* TN */}
          <div className="modal-section">
            <span className="modal-label">Target Number</span>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--gold)' }}>{tn}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
              Base {context?.tn || 15}{raises.length > 0 ? ` + ${raises.length * 5} from raises` : ''}
            </div>
          </div>

          {/* Dice pool — adjustable */}
          <div className="modal-section">
            <span className="modal-label">Dice Pool</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold)' }}>
                {rollCount}k{keepCount}
                {useVoid && <span style={{ fontSize: 12, color: 'var(--gold)', marginLeft: 8 }}>(+1k1 Void)</span>}
              </div>
              <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', fontSize: 11 }}>
                <span style={{ color: 'var(--text-muted)' }}>Adjust:</span>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>Roll</span>
                  <div style={{ display: 'flex', gap: 2 }}>
                    <button className="rep-btn" onClick={() => setExtraRoll(r => r - 1)}>−</button>
                    <span style={{ fontSize: 11, minWidth: 16, textAlign: 'center', color: extraRoll !== 0 ? 'var(--gold)' : 'var(--text-muted)' }}>{extraRoll >= 0 ? '+' : ''}{extraRoll}</span>
                    <button className="rep-btn" onClick={() => setExtraRoll(r => r + 1)}>+</button>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>Keep</span>
                  <div style={{ display: 'flex', gap: 2 }}>
                    <button className="rep-btn" onClick={() => setExtraKeep(k => k - 1)}>−</button>
                    <span style={{ fontSize: 11, minWidth: 16, textAlign: 'center', color: extraKeep !== 0 ? 'var(--gold)' : 'var(--text-muted)' }}>{extraKeep >= 0 ? '+' : ''}{extraKeep}</span>
                    <button className="rep-btn" onClick={() => setExtraKeep(k => k + 1)}>+</button>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
              {context?.skill} ({context?.ring || 'Ring'} {context?.ringVal || '?'})
            </div>
          </div>

          {/* Flat modifier */}
          <div className="modal-section">
            <span className="modal-label">Flat Modifier <span style={{ fontSize: 9, fontWeight: 400 }}>(added to total after keeping)</span></span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              <button className="rep-btn" onClick={() => setFlatMod(m => m - 1)}>−</button>
              <span style={{ fontSize: 18, fontWeight: 600, color: flatMod !== 0 ? 'var(--gold)' : 'var(--text-muted)', minWidth: 32, textAlign: 'center' }}>{flatMod >= 0 ? '+' : ''}{flatMod}</span>
              <button className="rep-btn" onClick={() => setFlatMod(m => m + 1)}>+</button>
              {flatMod !== 0 && <button className="btn btn-sm" style={{ fontSize: 9 }} onClick={() => { setFlatMod(0); setModApplied(null); }}>Reset</button>}
            </div>
            {modApplied && <div style={{ fontSize: 9, color: 'var(--gold-dim)', marginTop: 3, fontStyle: 'italic' }}>Applied from: {modApplied}</div>}
          </div>

          {/* School technique reminders */}
          {techniques.length > 0 && (
            <div className="modal-section">
              <span className="modal-label">School Techniques <span style={{ fontSize: 9, fontWeight: 400 }}>(may apply — click to set modifier)</span></span>
              {techniques.map(t => (
                <div key={t.rank} style={{ display: 'flex', alignItems: 'flex-start', gap: '.5rem', padding: '.4rem .5rem', background: 'rgba(200,150,42,.06)', border: '1px solid rgba(200,150,42,.2)', borderRadius: 4, marginBottom: '.3rem', cursor: 'pointer' }}
                  onClick={() => { /* player decides manually */ }}>
                  <i className="ti ti-star" style={{ fontSize: 11, color: 'var(--gold-dim)', marginTop: 1, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, color: 'var(--gold-dim)', marginBottom: 1 }}>Rank {t.rank} Technique</div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{t.text}</div>
                  </div>
                </div>
              ))}
              <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: '.25rem' }}>Adjust the modifier above if any apply.</div>
            </div>
          )}

          {/* Raises */}
          <div className="modal-section">
            <span className="modal-label">Raises <span style={{ fontSize: 9, fontWeight: 400 }}>(each +5 TN)</span></span>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {RAISE_OPTIONS.map(r => (
                <button key={r} className={`raise-btn ${raises.includes(r) ? 'sel' : ''}`} onClick={() => toggleRaise(r)}>{r}</button>
              ))}
            </div>
            {isAttack && (
              <div style={{ marginTop: '.5rem' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: '.25rem' }}>Attack Maneuvers:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                  {ATTACK_MANEUVERS.map(r => (
                    <button key={r} className={`raise-btn ${raises.includes(r) ? 'sel' : ''}`} onClick={() => toggleRaise(r)}>{r}</button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Void */}
          <div className="modal-section">
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={useVoid} onChange={e => setUseVoid(e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
              Spend Void Point (+1k1)
              {context?.currentVoid !== undefined && (
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>({context.currentVoid} remaining)</span>
              )}
            </label>
          </div>

          <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
            <button className="btn btn-p btn-lg" onClick={doRoll}>
              <i className="ti ti-dice" style={{ marginRight: 4 }} /> Roll {rollCount}k{keepCount}{flatMod !== 0 ? ` ${flatMod >= 0 ? '+' : ''}${flatMod}` : ''}
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
                <div key={i} className={`die ${kept.has(i) ? 'kept' : ''} ${d === 10 ? 'ten' : ''}`} onClick={() => toggleKeep(i)}>
                  {d}{kept.has(i) && <span className="die-lbl">✓</span>}
                </div>
              ))}
            </div>
            <div style={{ marginTop: '.75rem', fontSize: 11, color: 'var(--text-muted)' }}>
              {(() => {
                const runningTotal = [...kept].reduce((s, i) => s + dice[i], 0) + flatMod;
                return (<>
                  Total: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{runningTotal}</span>
                  {flatMod !== 0 && <span style={{ color: 'var(--gold-dim)', fontSize: 10 }}> (includes {flatMod >= 0 ? '+' : ''}{flatMod} modifier)</span>}
                  {kept.size === keepCount && (
                    <span style={{ marginLeft: 8, color: runningTotal >= tn ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
                      {runningTotal >= tn ? `✓ Success (+${runningTotal - tn})` : `✗ Fail (${runningTotal - tn})`}
                    </span>
                  )}
                </>);
              })()}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '.5rem' }}>
            <button className="btn btn-p" disabled={kept.size !== keepCount} onClick={confirmRoll}>
              Confirm {kept.size}/{keepCount}
            </button>
            <button className="btn btn-sm" onClick={() => { setDice(rollN(rollCount)); setKept(new Set()); }}>
              <i className="ti ti-refresh" /> Reroll
            </button>
          </div>
        </>)}

        {/* Damage phase */}
        {phase === 'damage' && (<>
          <div style={{ padding: '.6rem .75rem', background: 'rgba(200,150,42,.1)', border: '1px solid var(--gold-dim)', borderRadius: 4, marginBottom: '1rem', fontSize: 12, color: 'var(--gold)' }}>
            ✓ Hit! Roll damage — {dmgDR} keep {dmgKeep}
            {raises.length > 0 && <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 8 }}>Raises: {raises.join(', ')}</span>}
          </div>
          <div className="modal-section">
            <span className="modal-label">Damage Dice — click to keep ({dmgKept.size}/{dmgKeep})</span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: '.5rem' }}>
              {dmgDice.map((d, i) => (
                <div key={i} className={`die ${dmgKept.has(i) ? 'kept' : ''}`} onClick={() => toggleDmgKeep(i)} style={{ borderColor: 'var(--red-dim)' }}>
                  {d}{dmgKept.has(i) && <span className="die-lbl" style={{ background: 'var(--red)' }}>✓</span>}
                </div>
              ))}
            </div>
            <div style={{ marginTop: '.75rem', fontSize: 13, fontWeight: 600, color: 'var(--red)' }}>
              Damage: {[...dmgKept].reduce((s, i) => s + dmgDice[i], 0)} wounds
            </div>
          </div>
          <button className="btn btn-p btn-d" disabled={dmgKept.size !== dmgKeep} onClick={confirmDamage}
            style={{ background: 'var(--red)', borderColor: 'var(--red)', color: '#fff' }}>
            Apply {[...dmgKept].reduce((s, i) => s + dmgDice[i], 0)} Wounds
          </button>
        </>)}

        {phase === 'done' && (
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: '1rem' }}>Roll complete.</div>
            <button className="btn btn-p" onClick={onClose}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
}
