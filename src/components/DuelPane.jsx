import React, { useState } from 'react';
import { Silhouette } from './UI';

const PHASE_LABELS = { assessment: 'Assessment', focus: 'Focus', strike: 'Strike', resolved: 'Resolved' };
const PHASES = ['assessment', 'focus', 'strike', 'resolved'];

// Roll dice array (no auto-explosion — player clicks 10 to explode)
function rollDice(n) {
  return Array.from({ length: n }, () => Math.ceil(Math.random() * 10));
}

function Portrait({ side, duel, phase }) {
  const [imgErr, setImgErr] = useState(false);
  const c = duel[side];
  const color = c.avatarColor || '#c8962a';
  const isWinner = phase === 'resolved' && duel.winner === side;
  const result = phase === 'assessment' ? duel.assessmentRolls?.[side]
    : (phase === 'strike' || phase === 'resolved') ? duel.strikeRolls?.[side] : null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.5rem', minWidth: 120 }}>
      <div style={{ width: 90, height: 116, borderRadius: 8, overflow: 'hidden', border: `3px solid ${isWinner ? '#c8a040' : color}`, boxShadow: isWinner ? `0 0 50px #c8a04088` : `0 0 20px ${color}33`, background: 'var(--bg-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'box-shadow .4s' }}>
        {c.avatarUrl && !imgErr
          ? <img src={c.avatarUrl} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setImgErr(true)} />
          : <Silhouette type={c.avatarType || 'warrior'} size={72} color={color} />}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: isWinner ? '#c8a040' : 'var(--text-primary)', textAlign: 'center' }}>{c.name}</div>
      {isWinner && <div style={{ fontSize: 11, color: '#c8a040', fontWeight: 700, letterSpacing: '.1em' }}>VICTOR</div>}
      {result !== null && result !== undefined && (
        <div style={{ fontSize: 34, fontWeight: 900, color: '#c8a040', lineHeight: 1 }}>{result}</div>
      )}
    </div>
  );
}

// Mini dice picker — shows dice, click to keep, click 10 to explode
function DicePicker({ pool, onConfirm }) {
  const [dice, setDice] = useState(() => rollDice(pool.rolled));
  const [kept, setKept] = useState(new Set());

  const toggle = (i) => {
    const d = dice[i];
    const n = new Set(kept);
    if (n.has(i)) {
      n.delete(i);
    } else {
      if (n.size >= pool.kept) return; // already at max kept
      n.add(i);
      // Explode 10
      if (d === 10) {
        const extra = Math.ceil(Math.random() * 10);
        setDice(prev => {
          const nd = [...prev, extra];
          n.add(nd.length - 1); // auto-keep the explosion
          return nd;
        });
      }
    }
    setKept(n);
  };

  const total = [...kept].reduce((s, i) => s + dice[i], 0);
  const ready = kept.size === pool.kept;

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: '.5rem' }}>
        Click dice to keep — {kept.size}/{pool.kept} kept
        {pool.voidBonus > 0 && <span style={{ color: '#c0a0e0', marginLeft: 6 }}>+{pool.voidBonus} void bonus applied</span>}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginBottom: '.75rem' }}>
        {dice.map((d, i) => {
          const isKept = kept.has(i);
          const isExploded = i >= pool.rolled; // extra dice from explosions
          return (
            <div key={i} onClick={() => toggle(i)} style={{
              width: 40, height: 40, borderRadius: 6, cursor: 'pointer',
              background: isKept ? (d === 10 ? '#9060c8' : 'var(--gold)') : 'var(--bg-panel)',
              border: `2px solid ${isKept ? (d === 10 ? '#b080e8' : '#c8a040') : 'var(--border)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 900,
              color: isKept ? '#1a1208' : (d === 10 ? '#c0a0e0' : 'var(--text-primary)'),
              boxShadow: isExploded ? '0 0 8px #9060c844' : 'none',
              transition: 'all .1s',
            }}>
              {d}
            </div>
          );
        })}
      </div>
      {ready && (
        <div style={{ marginBottom: '.5rem', fontSize: 20, fontWeight: 800, color: '#c8a040' }}>
          Total: {total}
        </div>
      )}
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
        <button className="btn btn-p" disabled={!ready} onClick={() => onConfirm(total)}>
          Confirm {total || '…'}
        </button>
        <button className="btn btn-sm" onClick={() => { setDice(rollDice(pool.rolled)); setKept(new Set()); }}>
          Reroll
        </button>
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: '.4rem' }}>Click a 10 to explode it</div>
    </div>
  );
}

export default function DuelPane({ duel, myCharId, isGM, pcsMap, onUpdate, onClose }) {
  const [focusInputs, setFocusInputs] = useState({
    challenger: { raises: duel.focusInputs?.challenger?.raises || 0, void: duel.focusInputs?.challenger?.void || 0 },
    defender:   { raises: duel.focusInputs?.defender?.raises   || 0, void: duel.focusInputs?.defender?.void   || 0 },
  });
  // Track which sides are currently rolling (showing dice picker)
  const [rolling, setRolling] = useState({});

  const { phase } = duel;
  const phaseIdx = PHASES.indexOf(phase);
  const isChallenger = myCharId === duel.challenger?.id;
  const isDefender   = myCharId === duel.defender?.id;
  const isInvolved   = isChallenger || isDefender || isGM;

  const getPool = (side, type) => {
    const c = duel[side];
    const pc = pcsMap?.[c.id];
    const skills = pc?.skills || c.skills || [];
    const tahaddi = skills.find(s => s.name === 'Tahaddi')?.rank || 0;
    if (type === 'assessment') {
      const v = pc?.void || c.void || 2;
      return { rolled: v + tahaddi, kept: v, label: `${v + tahaddi}k${v}` };
    } else {
      // Strike: Reflexes + Tahaddi, keep Reflexes
      // Raises do NOT add dice — they raise TN and affect damage outcome
      // Void spend adds +1k1
      const ref = pc?.reflexes || c.reflexes || 2;
      const voidBonus = duel.focusInputs?.[side]?.void || 0;
      const rolled = ref + tahaddi + voidBonus;
      const kept = ref + voidBonus;
      return { rolled, kept, label: `${rolled}k${kept}`, voidBonus };
    }
  };

  const canAct = (side) => {
    if (isGM) return true;
    return (side === 'challenger' && isChallenger) || (side === 'defender' && isDefender);
  };

  const assessmentComplete = duel.assessmentRolls?.challenger != null && duel.assessmentRolls?.defender != null;
  const strikeComplete     = duel.strikeRolls?.challenger != null && duel.strikeRolls?.defender != null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 350, overflowY: 'auto', background: 'rgba(8,5,2,.97)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      {/* Header */}
      <div style={{ fontSize: 11, letterSpacing: '.25em', color: 'var(--gold-dim)', textTransform: 'uppercase', marginBottom: '.3rem' }}>Tahaddi Duel</div>
      <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--gold)', marginBottom: '1rem' }}>{PHASE_LABELS[phase]}</div>

      {/* Phase bar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: '2rem' }}>
        {['Assessment', 'Focus', 'Strike'].map((p, i) => (
          <div key={p} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <div style={{ width: 72, height: 4, borderRadius: 2, background: i <= phaseIdx ? 'var(--gold)' : 'var(--border)' }} />
            <div style={{ fontSize: 9, color: i <= phaseIdx ? 'var(--gold-dim)' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.1em' }}>{p}</div>
          </div>
        ))}
      </div>

      {/* Portraits */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '3rem', marginBottom: '2rem' }}>
        <Portrait side="challenger" duel={duel} phase={phase} />
        <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--red)', opacity: 0.7 }}>VS</div>
        <Portrait side="defender" duel={duel} phase={phase} />
      </div>

      {/* ── Assessment ── */}
      {phase === 'assessment' && isInvolved && (
        <div style={{ display: 'flex', gap: '3rem', marginBottom: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {(['challenger', 'defender']).map(side => {
            const pool = getPool(side, 'assessment');
            const rolled = duel.assessmentRolls?.[side];
            const hasRolled = rolled != null;
            const canDoIt = canAct(side);
            const isRolling = rolling[side];
            return (
              <div key={side} style={{ textAlign: 'center', opacity: canDoIt ? 1 : 0.45 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: '.4rem' }}>
                  {duel[side].name} — Void/Tahaddi ({pool.label})
                </div>
                {hasRolled ? (
                  <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--gold)' }}>{rolled}</div>
                ) : isRolling && canDoIt ? (
                  <DicePicker pool={pool} onConfirm={total => {
                    onUpdate({ assessmentRolls: { ...duel.assessmentRolls, [side]: total } });
                    setRolling(r => ({ ...r, [side]: false }));
                  }} />
                ) : canDoIt ? (
                  <button className="btn btn-p" onClick={() => setRolling(r => ({ ...r, [side]: true }))}>
                    Roll {pool.label}
                  </button>
                ) : (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>Awaiting…</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Focus ── */}
      {phase === 'focus' && isInvolved && (
        <div style={{ marginBottom: '1.5rem' }}>
          {!duel.focusRevealed ? (
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginBottom: '.75rem' }}>
                Commit raises and void spend secretly. Raises increase your TN but boost damage if you win.
              </div>
              <div style={{ display: 'flex', gap: '3rem', justifyContent: 'center' }}>
                {(['challenger', 'defender']).map(side => {
                  const canEdit = canAct(side);
                  return (
                    <div key={side} style={{ textAlign: 'center', opacity: canEdit ? 1 : 0.3 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: '.5rem' }}>{duel[side].name}</div>
                      {(['raises', 'void']).map(field => (
                        <div key={field} style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center', marginBottom: '.3rem' }}>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 42, textAlign: 'right' }}>{field === 'raises' ? 'Raises' : 'Void'}:</span>
                          <button className="rep-btn" disabled={!canEdit} onClick={() => setFocusInputs(fi => ({ ...fi, [side]: { ...fi[side], [field]: Math.max(0, fi[side][field] - 1) } }))}>−</button>
                          <span style={{ fontSize: 18, fontWeight: 700, color: field === 'void' ? '#c0a0e0' : 'var(--gold)', minWidth: 24, textAlign: 'center' }}>{focusInputs[side][field]}</span>
                          <button className="rep-btn" disabled={!canEdit} onClick={() => setFocusInputs(fi => ({ ...fi, [side]: { ...fi[side], [field]: fi[side][field] + 1 } }))}>+</button>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--gold-dim)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '.5rem' }}>Revealed</div>
              {(['challenger', 'defender']).map(side => (
                <div key={side} style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: '.2rem' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>{duel[side].name}:</strong>{' '}
                  {duel.focusInputs?.[side]?.raises || 0} raises · {duel.focusInputs?.[side]?.void || 0} void spent
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Strike ── */}
      {phase === 'strike' && isInvolved && (
        <div style={{ display: 'flex', gap: '3rem', marginBottom: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {(['challenger', 'defender']).map(side => {
            const pool = getPool(side, 'strike');
            const rolled = duel.strikeRolls?.[side];
            const hasRolled = rolled != null;
            const raises = duel.focusInputs?.[side]?.raises || 0;
            const canDoIt = canAct(side);
            const isRolling = rolling[side + '_strike'];
            return (
              <div key={side} style={{ textAlign: 'center', opacity: canDoIt ? 1 : 0.45 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>
                  {duel[side].name} — Reflexes/Tahaddi ({pool.label})
                </div>
                {raises > 0 && (
                  <div style={{ fontSize: 10, color: 'var(--gold-dim)', marginBottom: '.4rem' }}>
                    {raises} raise{raises > 1 ? 's' : ''} committed — TN+{raises * 5} but +{raises * 5} damage if you win
                  </div>
                )}
                {hasRolled ? (
                  <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--gold)' }}>{rolled}</div>
                ) : isRolling && canDoIt ? (
                  <DicePicker pool={pool} onConfirm={total => {
                    onUpdate({ strikeRolls: { ...duel.strikeRolls, [side]: total } });
                    setRolling(r => ({ ...r, [side + '_strike']: false }));
                  }} />
                ) : canDoIt ? (
                  <button className="btn btn-p" onClick={() => setRolling(r => ({ ...r, [side + '_strike']: true }))}>
                    Roll {pool.label}
                  </button>
                ) : (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>Awaiting…</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Resolved ── */}
      {phase === 'resolved' && duel.winner && (
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: 18, color: '#c8a040', fontWeight: 700 }}>
            {duel[duel.winner].name} wins the Tahaddi!
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: '.3rem' }}>
            {duel.strikeRolls?.challenger} vs {duel.strikeRolls?.defender}
          </div>
        </div>
      )}

      {/* Spectator */}
      {!isInvolved && phase !== 'resolved' && (
        <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', marginBottom: '1.5rem', maxWidth: 320 }}>
          The knives are drawn. Hold your breath.
        </div>
      )}

      {/* GM controls */}
      {isGM && (
        <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {phase === 'assessment' && assessmentComplete && (
            <button className="btn btn-p" onClick={() => {
              const w = duel.assessmentRolls.challenger >= duel.assessmentRolls.defender ? 'challenger' : 'defender';
              onUpdate({ phase: 'focus', assessmentWinner: w, focusRevealed: false, focusInputs: { challenger: { raises: 0, void: 0 }, defender: { raises: 0, void: 0 } } });
              setRolling({});
            }}>Proceed to Focus →</button>
          )}
          {phase === 'focus' && !duel.focusRevealed && (
            <button className="btn btn-p" onClick={() => onUpdate({ phase: 'focus', focusRevealed: true, focusInputs })}>
              Reveal Commitments →
            </button>
          )}
          {phase === 'focus' && duel.focusRevealed && (
            <button className="btn btn-p" onClick={() => { onUpdate({ phase: 'strike', strikeRolls: {} }); setRolling({}); }}>
              Proceed to Strike →
            </button>
          )}
          {phase === 'strike' && strikeComplete && (
            <button className="btn btn-p" onClick={() => {
              const w = duel.strikeRolls.challenger >= duel.strikeRolls.defender ? 'challenger' : 'defender';
              onUpdate({ phase: 'resolved', winner: w });
            }}>Resolve Duel →</button>
          )}
          {phase === 'resolved' && (
            <button className="btn btn-p" onClick={onClose}>End Duel</button>
          )}
        </div>
      )}
    </div>
  );
}
