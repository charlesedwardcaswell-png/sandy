import React, { useState } from 'react';
import { RAISE_OPTIONS, ATTACK_MANEUVERS } from '../data/constants';
import { rollN } from '../lib/utils';

// ── Dice Modal ────────────────────────────────────────────────────────────────
// Full canonical turn flow: raises → void → roll → keep → damage
export default function DiceModal({ context, onClose, onResult }) {
  const [phase, setPhase] = useState('setup'); // setup | rolling | damage | done
  const [raises, setRaises] = useState([]);
  const [useVoid, setUseVoid] = useState(false);
  const [dice, setDice] = useState([]);
  const [kept, setKept] = useState(new Set());
  const [rollResult, setRollResult] = useState(null);
  const [dmgDice, setDmgDice] = useState([]);
  const [dmgKept, setDmgKept] = useState(new Set());

  const voidBonus = useVoid ? 1 : 0;
  const rollCount = (context?.baseRoll || 2) + voidBonus;
  const keepCount = (context?.baseKeep || 2) + voidBonus;
  const tn = (context?.tn || 15) + raises.length * 5;
  const isAttack = context?.isAttack || false;
  const dmgDR = context?.dr || '3k2';
  const [dmgRoll, dmgKeep] = dmgDR.match(/\d+/g)?.map(Number) || [3, 2];

  const toggleRaise = (r) => {
    setRaises(p => p.includes(r) ? p.filter(x => x !== r) : [...p, r]);
  };

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
    const total = [...kept].reduce((s, i) => s + dice[i], 0);
    const success = total >= tn;
    const result = { total, success, margin: total - tn, tn, raises };
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
        {/* Header */}
        <div className="modal-title">
          <i className="ti ti-dice" style={{ marginRight: 6 }} />
          {context?.skill || 'Skill Roll'}
          {context?.targetName && <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>→ {context.targetName}</span>}
        </div>

        {/* Setup phase */}
        {phase === 'setup' && (
          <>
            {/* TN display */}
            <div className="modal-section">
              <span className="modal-label">Target Number</span>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--gold)' }}>{tn}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                Base {context?.tn || 15}{raises.length > 0 ? ` + ${raises.length * 5} from raises` : ''}
              </div>
            </div>

            {/* Dice pool */}
            <div className="modal-section">
              <span className="modal-label">Dice Pool</span>
              <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)' }}>
                {rollCount}k{keepCount}
                {useVoid && <span style={{ fontSize: 12, color: 'var(--gold)', marginLeft: 8 }}>(+1k1 from Void)</span>}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                {context?.skill} ({context?.ring || 'Ring'} {context?.ringVal || '?'})
              </div>
            </div>

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

            {/* Void point */}
            <div className="modal-section">
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: 'var(--text-secondary)' }}>
                <input type="checkbox" checked={useVoid} onChange={e => setUseVoid(e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
                Spend Void Point (+1k1 to pool)
                {context?.currentVoid !== undefined && (
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>({context.currentVoid} remaining)</span>
                )}
              </label>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
              <button className="btn btn-p btn-lg" onClick={doRoll}>
                <i className="ti ti-dice" style={{ marginRight: 4 }} /> Roll {rollCount}k{keepCount}
              </button>
              <button className="btn" onClick={onClose}>Cancel</button>
            </div>
          </>
        )}

        {/* Rolling phase — pick dice to keep */}
        {phase === 'rolling' && (
          <>
            <div className="modal-section">
              <span className="modal-label">
                Click to keep — {kept.size}/{keepCount} kept — TN {tn}
              </span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: '.5rem' }}>
                {dice.map((d, i) => (
                  <div
                    key={i}
                    className={`die ${kept.has(i) ? 'kept' : ''} ${d === 10 ? 'ten' : ''}`}
                    onClick={() => toggleKeep(i)}
                  >
                    {d}
                    {kept.has(i) && <span className="die-lbl">✓</span>}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '.75rem', fontSize: 11, color: 'var(--text-muted)' }}>
                Total if kept: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                  {[...kept].reduce((s, i) => s + dice[i], 0)}
                </span>
                {kept.size === keepCount && (
                  <span style={{ marginLeft: 8, color: [...kept].reduce((s, i) => s + dice[i], 0) >= tn ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
                    {[...kept].reduce((s, i) => s + dice[i], 0) >= tn ? `✓ Success (+${[...kept].reduce((s, i) => s + dice[i], 0) - tn})` : `✗ Fail (${[...kept].reduce((s, i) => s + dice[i], 0) - tn})`}
                  </span>
                )}
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
          </>
        )}

        {/* Damage phase */}
        {phase === 'damage' && (
          <>
            <div style={{ padding: '.6rem .75rem', background: 'rgba(200,150,42,.1)', border: '1px solid var(--gold-dim)', borderRadius: 4, marginBottom: '1rem', fontSize: 12, color: 'var(--gold)' }}>
              ✓ Hit! Roll damage — {dmgDR} keep {dmgKeep}
              {raises.length > 0 && <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 8 }}>Raises: {raises.join(', ')}</span>}
            </div>
            <div className="modal-section">
              <span className="modal-label">Damage Dice — click to keep ({dmgKept.size}/{dmgKeep})</span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: '.5rem' }}>
                {dmgDice.map((d, i) => (
                  <div
                    key={i}
                    className={`die ${dmgKept.has(i) ? 'kept' : ''}`}
                    onClick={() => toggleDmgKeep(i)}
                    style={{ borderColor: 'var(--red-dim)' }}
                  >
                    {d}
                    {dmgKept.has(i) && <span className="die-lbl" style={{ background: 'var(--red)' }}>✓</span>}
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
          </>
        )}

        {/* Done */}
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
