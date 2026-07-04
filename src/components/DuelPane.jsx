import React, { useState } from 'react';
import { Silhouette } from './UI';
import { ATTACK_MANEUVERS } from '../data/constants';
import { rollExplodingKeep, getArmorTN } from '../lib/utils';

// ── Helpers ──────────────────────────────────────────────────────────────────

function rollDice(n) {
  return Array.from({ length: n }, () => Math.ceil(Math.random() * 10));
}

// The intel a winner can learn from the Assessment roll
const INTEL_LIST = [
  { key: 'void',       label: "Opponent's Void Ring" },
  { key: 'reflexes',   label: "Opponent's Reflexes" },
  { key: 'tahaddi',    label: "Opponent's Tahaddi Skill Rank" },
  { key: 'emphases',   label: "Opponent's Tahaddi Emphases (if any)" },
  { key: 'voidPoints', label: "Opponent's current Void Points" },
  { key: 'wounds',     label: "Opponent's current Wound Level" },
];

function getIntelValue(pc, key) {
  if (!pc) return '?';
  switch (key) {
    case 'void':       return pc.void || pc.void_ring || '?';
    case 'reflexes':   return pc.reflexes || '?';
    case 'tahaddi':    return (pc.skills || []).find(s => s.name === 'Tahaddi')?.rank || 0;
    case 'emphases':   return (pc.skills || []).find(s => s.name === 'Tahaddi')?.emphases?.join(', ') || 'None';
    case 'voidPoints': return pc.current_void ?? pc.void ?? '?';
    case 'wounds':     return pc.current_wounds != null ? `${pc.current_wounds}/${pc.max_wounds}` : '?';
    default: return '?';
  }
}

// ── Dice Picker ───────────────────────────────────────────────────────────────

function DicePicker({ pool, onConfirm, label, allowVoid, currentVoid, character, onLuckUsed, onUnluckyUsed }) {
  const [dice, setDice] = useState(() => rollDice(pool.rolled));
  const [kept, setKept] = useState(new Set());
  const [exploded, setExploded] = useState(new Set());
  const [voidSpent, setVoidSpent] = useState(false);

  const toggle = (i) => {
    const d = dice[i];
    const n = new Set(kept);
    if (n.has(i)) { n.delete(i); setKept(n); return; }
    if (n.size >= effectiveKept) return;
    if (d === 10 && !exploded.has(i)) {
      // Chain explosions: each 10 explodes again, up to 10 times
      let bonus = 0, last = 10, count = 0;
      while (last === 10 && count < 10) {
        last = Math.ceil(Math.random() * 10);
        bonus += last;
        count++;
      }
      setDice(prev => { const nd = [...prev]; nd[i] = 10 + bonus; return nd; });
      setExploded(prev => new Set([...prev, i]));
    }
    n.add(i); setKept(n);
  };

  // Void spending: adds +1k1 (one extra rolled, one extra kept)
  const [voidRollVal, setVoidRollVal] = React.useState(() => rollDice(1)[0]);
  // Only re-roll the void die when the player first spends void, not on every render
  const voidRoll = voidSpent ? voidRollVal : 0;
  const voidBonus = voidSpent ? 1 : 0; // +1k1 means +1 kept die
  const effectiveKept = pool.kept + voidBonus;
  const allDice = voidSpent ? [...dice, voidRoll] : dice;
  const total = [...kept].reduce((s, i) => s + allDice[i], 0) + (pool.bonus || 0);
  const ready = kept.size === effectiveKept;

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: '.4rem' }}>
        {label || `${pool.rolled + (voidSpent ? 1 : 0)}k${pool.kept + (voidSpent ? 1 : 0)}`} — keep {effectiveKept}{voidSpent ? ' (Void)' : ''}
        {pool.bonus > 0 && <span style={{ color: '#c0a0e0', marginLeft: 6 }}>+{pool.bonus} bonus</span>}
        {pool.tn && <span style={{ color: 'var(--gold-dim)', marginLeft: 6 }}>TN {pool.tn}</span>}
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: '.4rem' }}>
        Click to keep · click an unkept 10 to explode it first
      </div>
      {allowVoid && (currentVoid ?? 1) > 0 && (
        <div style={{ marginBottom: '.4rem' }}>
          <button className={`btn btn-sm ${voidSpent ? 'btn-p' : ''}`}
            onClick={() => { if (!voidSpent) setVoidRollVal(rollDice(1)[0]); setVoidSpent(v => !v); setKept(new Set()); }}
            style={{ fontSize: 11, borderColor: voidSpent ? '#c0a0e0' : undefined }}>
            {voidSpent ? '✦ Void Spent (+1k1)' : '+ Spend Void (+1k1)'}
          </button>
        </div>
      )}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginBottom: '.6rem' }}>
        {allDice.map((d, i) => {
          const isVoidDie = voidSpent && i === allDice.length - 1;
          const isKept = kept.has(i);
          const isExplosion = d > 10;
          const isNatural10 = d === 10 && !exploded.has(i);
          return (
            <div key={i} onClick={() => toggle(i)} style={{
              minWidth: 40, height: 40, padding: '0 4px', borderRadius: 6, cursor: 'pointer',
              background: isKept ? (isExplosion ? '#7040a8' : 'var(--gold)') : 'var(--bg-panel)',
              border: `2px solid ${isKept ? (isExplosion ? '#b080e8' : '#c8a040') : (isVoidDie ? '#c0a0e0aa' : isNatural10 ? '#c0a0e0' : 'var(--border)')}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 900,
              color: isKept ? '#1a1208' : (isNatural10 ? '#c0a0e0' : 'var(--text-primary)'),
              transition: 'all .1s',
            }}>
              <span>{d > 10 ? `${d}` : d}</span>
              {isExplosion && <span style={{ fontSize: 8, opacity: 0.8 }}>💥</span>}
              {isNatural10 && !isKept && <span style={{ fontSize: 8, color: '#c0a0e0' }}>tap!</span>}
            </div>
          );
        })}
      </div>
      {ready && <div style={{ fontSize: 20, fontWeight: 800, color: '#c8a040', marginBottom: '.4rem' }}>Total: {total}</div>}
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
        <button className="btn btn-p" disabled={!ready} onClick={() => onConfirm(total)}>
          Confirm {ready ? total : '…'}
        </button>
        <button className="btn btn-sm" onClick={() => { setDice(rollDice(pool.rolled)); setKept(new Set()); setExploded(new Set()); }}>
          Reroll
        </button>
        {/* Luck reroll — only for characters with Luck advantage and uses remaining. Same mechanism as
            DiceModal: fresh reroll of the whole pool, player re-picks kept dice from the new set. */}
        {(() => {
          if (!character) return null;
          const luckAdv = (character.advantages || []).find(a => (a.name || '').startsWith('Luck'));
          if (!luckAdv) return null;
          const luckRank = luckAdv.rank || 1;
          const usesLeft = luckAdv.current_uses !== undefined ? luckAdv.current_uses : luckRank;
          if (usesLeft <= 0) return null;
          return (
            <button className="btn btn-sm" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}
              title={`Luck: reroll keeping higher result (${usesLeft} use${usesLeft !== 1 ? 's' : ''} remaining)`}
              onClick={() => {
                setDice(rollDice(pool.rolled)); setKept(new Set()); setExploded(new Set());
                if (onLuckUsed) onLuckUsed();
              }}>
              🍀 Luck ({usesLeft})
            </button>
          );
        })()}
        {/* Unlucky reroll — GM tells the player when to use it; same mechanism as Luck */}
        {(() => {
          if (!character) return null;
          const unluckyDis = (character.disadvantages || []).find(d => (d.name || d) === 'Unlucky');
          if (!unluckyDis) return null;
          const unluckyRank = unluckyDis.rank || 1;
          const usesLeft = unluckyDis.current_uses !== undefined ? unluckyDis.current_uses : unluckyRank;
          if (usesLeft <= 0) return null;
          return (
            <button className="btn btn-sm" style={{ borderColor: 'var(--red)', color: 'var(--red)' }}
              title={`Unlucky: GM forces a reroll (${usesLeft} use${usesLeft !== 1 ? 's' : ''} remaining this session)`}
              onClick={() => {
                setDice(rollDice(pool.rolled)); setKept(new Set()); setExploded(new Set());
                if (onUnluckyUsed) onUnluckyUsed();
              }}>
              💀 Unlucky ({usesLeft})
            </button>
          );
        })()}
      </div>
    </div>
  );
}

// ── Portrait ──────────────────────────────────────────────────────────────────

function Portrait({ side, duel, showResult }) {
  const [imgErr, setImgErr] = useState(false);
  const c = duel[side];
  const color = c.avatarColor || '#c8962a';
  const isWinner = duel.phase === 'resolved' && duel.winner === side;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.4rem', minWidth: 110 }}>
      <div style={{ width: 80, height: 104, borderRadius: 8, overflow: 'hidden',
        border: `3px solid ${isWinner ? '#c8a040' : color}`,
        boxShadow: isWinner ? '0 0 40px #c8a04088' : `0 0 16px ${color}33`,
        background: 'var(--bg-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {c.avatarUrl && !imgErr
          ? <img src={c.avatarUrl} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setImgErr(true)} />
          : <Silhouette type={c.avatarType || 'warrior'} size={64} color={color} />}
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: isWinner ? '#c8a040' : 'var(--text-primary)', textAlign: 'center' }}>{c.name}</div>
      {isWinner && <div style={{ fontSize: 10, color: '#c8a040', fontWeight: 700, letterSpacing: '.1em' }}>VICTOR</div>}
      {showResult != null && (
        <div style={{ fontSize: 32, fontWeight: 900, color: '#c8a040', lineHeight: 1 }}>{showResult}</div>
      )}
    </div>
  );
}

// ── Main DuelPane ─────────────────────────────────────────────────────────────

// ── RollBlock — must be top-level to prevent dice resetting on re-render ────────
function RollBlock({ name, pool, rollKey, side, rolledValue, onRoll, canAct, allowVoid = false, currentVoid = 1, character, onLuckUsed, onUnluckyUsed }) {
  const hasRolled = rolledValue != null;
  const [isRolling, setIsRolling] = React.useState(false);
  // Reset isRolling when someone else rolls (their result appears)
  React.useEffect(() => { if (hasRolled) setIsRolling(false); }, [hasRolled]);
  return (
    <div style={{ textAlign: 'center', opacity: canAct ? 1 : 0.45, minWidth: 180 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: '.15rem' }}>{name}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: pool.tn ? '.15rem' : '.4rem' }}>{pool.label}</div>
      {pool.tn && <div style={{ fontSize: 10, color: 'var(--gold-dim)', marginBottom: '.4rem' }}>TN {pool.tn}</div>}
      {pool.bonus1k1 > 0 && <div style={{ fontSize: 10, color: '#c0a0e0', marginBottom: '.3rem' }}>+1k1 (assessment bonus)</div>}
      {hasRolled ? (
        <div style={{ fontSize: 36, fontWeight: 900, color: 'var(--gold)', lineHeight: 1 }}>{rolledValue}</div>
      ) : isRolling && canAct ? (
        <DicePicker pool={pool} allowVoid={allowVoid} currentVoid={currentVoid} character={character}
          onLuckUsed={onLuckUsed} onUnluckyUsed={onUnluckyUsed}
          onConfirm={total => { onRoll(total); setIsRolling(false); }} />
      ) : canAct ? (
        <button className="btn btn-p" style={{ marginTop: '.25rem' }} onClick={() => setIsRolling(true)}>
          Roll {pool.rolled}k{pool.kept}
        </button>
      ) : (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '.4rem' }}>Awaiting…</div>
      )}
    </div>
  );
}


export default function DuelPane({ duel, myCharId, isGM, pcsMap, onUpdate, onUpdateCharacter, onClose }) {
  const [rolling, setRolling] = useState({});
  const [revealedIntel, setRevealedIntel] = useState([]);
  const [strikeRaises, setStrikeRaises] = useState({ challenger: 0, defender: 0 });
  const [strikeManeuvers, setStrikeManeuvers] = useState({ challenger: [], defender: [] });
  const [strikeManeuversOpen, setStrikeManeuversOpen] = useState({ challenger: false, defender: false });

  const { phase } = duel;
  const isChallenger = myCharId === duel.challenger?.id;
  const isDefender   = myCharId === duel.defender?.id;
  const isInvolved   = isChallenger || isDefender || isGM;

  const pc = (side) => pcsMap?.[duel[side]?.id] || duel[side];

  // Luck/Unlucky use-tracking — mirrors the same pattern DiceModal's callers use elsewhere. No-ops
  // gracefully for NPCs (no full character record in pcsMap, so onUpdateCharacter has nothing to update).
  const decrementUse = (side, listKey, name) => {
    const full = pcsMap?.[duel[side]?.id];
    if (!full || !onUpdateCharacter) return;
    const list = full[listKey] || [];
    const entry = list.find(a => (a.name || a) === name || (a.name || '').startsWith(name));
    if (!entry) return;
    const rank = entry.rank || 1;
    const current = entry.current_uses !== undefined ? entry.current_uses : rank;
    const updated = list.map(a => (a === entry || (a.name || a) === (entry.name || entry))
      ? { ...(typeof entry === 'object' ? entry : { name: entry }), current_uses: Math.max(0, current - 1) }
      : a);
    onUpdateCharacter(full.id, { [listKey]: updated });
  };

  // ── Pool builders ──────────────────────────────────────────────────────────

  const getAssessPool = (side) => {
    const c = pc(side);
    const awareness = c?.awareness || 2;
    const tahaddi   = (c?.skills || []).find(s => s.name === 'Tahaddi')?.rank || 0;
    const insightRankOpp = pc(side === 'challenger' ? 'defender' : 'challenger')?.insight_rank
      || pc(side === 'challenger' ? 'defender' : 'challenger')?.school_rank || 1;
    const tn = 10 + insightRankOpp * 5;
    return { rolled: awareness + tahaddi, kept: awareness, label: `Tahaddi/Awareness (${awareness + tahaddi}k${awareness})`, tn };
  };

  const getFocusPool = (side) => {
    const c = pc(side);
    const voidRing = c?.void || 2;
    const tahaddi  = (c?.skills || []).find(s => s.name === 'Tahaddi')?.rank || 0;
    // +1k1 bonus if this side won assessment by 10+
    const bonus1k1 = duel.assessmentBonus === side ? 1 : 0;
    return {
      rolled: voidRing + tahaddi + bonus1k1,
      kept: voidRing + bonus1k1,
      label: `Tahaddi/Void (${voidRing + tahaddi + bonus1k1}k${voidRing + bonus1k1})`,
      bonus: 0,
      bonus1k1,
    };
  };

  const getStrikePool = (side) => {
    const c = pc(side);
    const reflexes = c?.reflexes || 2;
    const tahaddi  = (c?.skills || []).find(s => s.name === 'Tahaddi')?.rank || 0;
    const freeRaises = duel.strikeFirstRaises?.[side] || 0; // Free Raises from winning Focus
    const declaredRaises = strikeRaises[side] || 0;
    const totalRaises = freeRaises + declaredRaises;
    // TN = opponent's normal Armor TN = 5 + opponent's reflexes × 5
    const oppSide = side === 'challenger' ? 'defender' : 'challenger';
    const oppRef = pc(oppSide)?.reflexes || 2;
    const armorTN = getArmorTN({ reflexes: oppRef, excludeArmor: true }); // dueling doesn't use armor
    return {
      rolled: reflexes + tahaddi,
      kept: reflexes,
      label: `Tahaddi/Reflexes (${reflexes + tahaddi}k${reflexes})`,
      tn: armorTN,
      freeRaises,
      declaredRaises,
      totalRaises,
      bonus: 0,
    };
  };

  const getDmgPool = (side) => {
    const c = pc(side);
    const weapon = c?.drawnWeapon;
    const drStr = (weapon?.dr || '1k1').toLowerCase();
    const [r, k] = drStr.split('k').map(Number);
    const raises = (duel.strikeFirstRaises?.[side] || 0) + (strikeRaises[side] || 0);
    return { rolled: r || 1, kept: k || 1, label: `${r || 1}k${k || 1}` };
  };

  const canAct = (side) => isGM || (side === 'challenger' && isChallenger) || (side === 'defender' && isDefender);

  // ── Assessment ────────────────────────────────────────────────────────────

  const assessmentBothRolled = duel.assessmentRolls?.challenger != null && duel.assessmentRolls?.defender != null;

  const assessmentResult = (() => {
    if (!assessmentBothRolled) return null;
    const cr = duel.assessmentRolls.challenger;
    const dr = duel.assessmentRolls.defender;
    const winner = cr > dr ? 'challenger' : dr > cr ? 'defender' : null; // null = tie
    const margin = winner ? Math.abs(cr - dr) : 0;
    const bonus1k1 = margin >= 10 ? winner : null; // earns +1k1 on Focus roll
    // How many intel pieces winner gets: successes above TN
    const winnerPool = winner ? getAssessPool(winner) : null;
    const winnerRoll = winner ? duel.assessmentRolls[winner] : 0;
    const winnerTN = winnerPool?.tn || 10;
    const intelCount = winner && winnerRoll >= winnerTN
      ? 1 + Math.floor((winnerRoll - winnerTN) / 5)
      : 0;
    return { winner, margin, bonus1k1, intelCount };
  })();

  // ── Focus ─────────────────────────────────────────────────────────────────

  const focusBothRolled = duel.focusRolls?.challenger != null && duel.focusRolls?.defender != null;

  const focusResult = (() => {
    if (!focusBothRolled) return null;
    const cr = duel.focusRolls.challenger;
    const dr = duel.focusRolls.defender;
    const diff = Math.abs(cr - dr);
    if (diff < 5) return { kharmic: true };
    const winner = cr > dr ? 'challenger' : 'defender';
    const loser  = winner === 'challenger' ? 'defender' : 'challenger';
    const freeRaises = Math.floor(diff / 5); // 1 per 5 margin (first 5 = first strike, each additional 5 = +1 FR)
    const strikeRaisesForWinner = Math.max(0, freeRaises - 1); // first 5 = first strike right, each extra 5 = 1 FR
    return { kharmic: false, winner, loser, diff, freeRaises: strikeRaisesForWinner };
  })();

  // ── Strike ────────────────────────────────────────────────────────────────

  const strikeBothRolled = duel.strikeRolls?.challenger != null && duel.strikeRolls?.defender != null;

  const strikeResult = (() => {
    if (!strikeBothRolled) return null;
    const cPool = getStrikePool('challenger');
    const dPool = getStrikePool('defender');
    const cRoll = duel.strikeRolls.challenger;
    const dRoll = duel.strikeRolls.defender;
    const cHit = cRoll >= cPool.tn;
    const dHit = dRoll >= dPool.tn;
    return { cHit, dHit, cRoll, dRoll, cTN: cPool.tn, dTN: dPool.tn };
  })();

  // ── Render helpers ────────────────────────────────────────────────────────

  // RollBlock moved to top-level component to prevent remount on re-render

  // ── Layout ────────────────────────────────────────────────────────────────

  const PHASES_LABELS = ['Assessment', 'Focus', 'Strike', 'Damage', 'Resolved'];
  const phaseIdx = ['assessment','focus','strike','damage','resolved'].indexOf(phase);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 350, overflowY: 'auto', background: 'rgba(8,5,2,.97)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
      padding: '2rem 1rem' }}>

      {/* Header */}
      <div style={{ fontSize: 11, letterSpacing: '.25em', color: 'var(--gold-dim)', textTransform: 'uppercase', marginBottom: '.2rem' }}>Tahaddi Duel</div>
      <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--gold)', marginBottom: '1rem', textTransform: 'capitalize' }}>{phase}</div>

      {/* Phase bar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: '1.75rem' }}>
        {PHASES_LABELS.map((p, i) => (
          <div key={p} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <div style={{ width: 54, height: 4, borderRadius: 2, background: i <= phaseIdx ? 'var(--gold)' : 'var(--border)' }} />
            <div style={{ fontSize: 9, color: i <= phaseIdx ? 'var(--gold-dim)' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.1em' }}>{p}</div>
          </div>
        ))}
      </div>

      {/* Portraits */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem', marginBottom: '1.75rem' }}>
        <Portrait side="challenger" duel={duel}
          showResult={phase === 'assessment' ? duel.assessmentRolls?.challenger
            : phase === 'focus' ? duel.focusRolls?.challenger : null} />
        <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--red)', opacity: 0.7 }}>VS</div>
        <Portrait side="defender" duel={duel}
          showResult={phase === 'assessment' ? duel.assessmentRolls?.defender
            : phase === 'focus' ? duel.focusRolls?.defender : null} />
      </div>

      {/* ── ASSESSMENT ── */}
      {phase === 'assessment' && isInvolved && (
        <div style={{ width: '100%', maxWidth: 520 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginBottom: '1rem', lineHeight: 1.6 }}>
            Read your opponent. Both roll <strong>Tahaddi / Awareness</strong>.<br />
            TN = 10 + opponent's Insight Rank × 5. Success = 1 piece of intel (+1 per 5 above TN).<br />
            Beating opponent by 10+ earns <strong>+1k1 on the Focus roll</strong>.
          </div>

          <div style={{ display: 'flex', gap: '3rem', justifyContent: 'center', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            {['challenger','defender'].map(side => (
              <RollBlock key={side} name={duel[side].name} pool={getAssessPool(side)}
                rolledValue={duel.assessmentRolls?.[side]}
                canAct={canAct(side)}
                allowVoid={true}
                currentVoid={pc(side)?.current_void ?? pc(side)?.void ?? 1}
                character={pcsMap?.[duel[side]?.id]}
                onLuckUsed={() => decrementUse(side, 'advantages', 'Luck')}
                onUnluckyUsed={() => decrementUse(side, 'disadvantages', 'Unlucky')}
                onRoll={(total) => onUpdate({ assessmentRolls: { ...duel.assessmentRolls, [side]: total } })} />
            ))}
          </div>

          {/* Assessment outcome */}
          {assessmentBothRolled && assessmentResult && (
            <div style={{ background: 'rgba(200,150,42,.1)', border: '1px solid rgba(200,150,42,.3)', borderRadius: 6, padding: '.75rem 1.25rem', marginBottom: '1rem' }}>
              {assessmentResult.winner ? (
                <>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gold)', marginBottom: '.4rem' }}>
                    {duel[assessmentResult.winner].name} reads the duel
                    {assessmentResult.bonus1k1 && <span style={{ fontSize: 11, color: '#c0a0e0', marginLeft: 8 }}>★ +1k1 on Focus roll</span>}
                  </div>
                  {assessmentResult.intelCount > 0 ? (
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: '.5rem' }}>
                        Choose <strong style={{ color: 'var(--gold)' }}>{Math.min(assessmentResult.intelCount, INTEL_LIST.length)}</strong> piece{assessmentResult.intelCount > 1 ? 's' : ''} of intel to reveal:
                        <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>{revealedIntel.length}/{assessmentResult.intelCount} revealed</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {INTEL_LIST.map(item => {
                          const oppSide = assessmentResult.winner === 'challenger' ? 'defender' : 'challenger';
                          const isRevealed = revealedIntel.includes(item.key);
                          const winnerSide = assessmentResult.winner;
                          const isWinnerPlayer = winnerSide && myCharId === duel[winnerSide]?.id;
                          const canReveal = !isRevealed && revealedIntel.length < assessmentResult.intelCount && (isGM || isWinnerPlayer);
                          const val = getIntelValue(pc(oppSide), item.key);
                          return (
                            <div key={item.key} onClick={() => canReveal && setRevealedIntel(r => [...r, item.key])}
                              style={{ fontSize: 12, padding: '4px 8px', borderRadius: 4,
                                background: isRevealed ? 'rgba(200,150,42,.15)' : 'rgba(107,78,40,.08)',
                                border: `1px solid ${isRevealed ? 'rgba(200,150,42,.5)' : 'var(--border)'}`,
                                color: isRevealed ? 'var(--text-primary)' : 'var(--text-muted)',
                                cursor: canReveal ? 'pointer' : 'default',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              }}>
                              <span>{item.label}</span>
                              {isRevealed
                                ? <strong style={{ color: 'var(--gold)' }}>{val}</strong>
                                : canReveal
                                  ? <span style={{ fontSize: 10, color: 'var(--gold-dim)' }}>click to reveal</span>
                                  : <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>hidden</span>
                              }
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Roll did not meet the TN — no intel gained, but still won the assessment.
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: '.5rem', fontStyle: 'italic' }}>
                    Either duelist may concede now before the duel continues.
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
                  Tied assessment — no intel gained, no Focus bonus. Both approach as equals.
                </div>
              )}
            </div>
          )}

          {/* Concede buttons */}
          {assessmentBothRolled && (
            <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'center', marginBottom: '.75rem' }}>
              {['challenger','defender'].map(side => canAct(side) && (
                <button key={side} className="btn btn-sm" style={{ color: 'var(--red)', borderColor: 'var(--red)', fontSize: 12 }}
                  onClick={() => onUpdate({ phase: 'resolved', winner: side === 'challenger' ? 'defender' : 'challenger', concedeBy: side })}>
                  {duel[side].name} Concedes
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── FOCUS ── */}
      {phase === 'focus' && isInvolved && (
        <div style={{ width: '100%', maxWidth: 520 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginBottom: '1rem', lineHeight: 1.6 }}>
            Study each other. Contested <strong>Tahaddi / Void</strong> roll.<br />
            Win by <strong>5+</strong> = strike first + 1 Free Raise per extra 5.<br />
            Win by less than 5 either way = <strong>Kharmic Strike</strong> (simultaneous).
          </div>

          <div style={{ display: 'flex', gap: '3rem', justifyContent: 'center', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            {['challenger','defender'].map(side => (
              <RollBlock key={side} name={duel[side].name} pool={getFocusPool(side)}
                rolledValue={duel.focusRolls?.[side]}
                canAct={canAct(side)}
                character={pcsMap?.[duel[side]?.id]}
                onLuckUsed={() => decrementUse(side, 'advantages', 'Luck')}
                onUnluckyUsed={() => decrementUse(side, 'disadvantages', 'Unlucky')}
                onRoll={(total) => onUpdate({ focusRolls: { ...duel.focusRolls, [side]: total } })} />
            ))}
          </div>

          {/* Focus outcome */}
          {focusBothRolled && focusResult && (
            <div style={{ background: 'rgba(200,150,42,.1)', border: '1px solid rgba(200,150,42,.3)', borderRadius: 6, padding: '.75rem 1.25rem', marginBottom: '1rem', textAlign: 'center' }}>
              {focusResult.kharmic ? (
                <>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#c08040', marginBottom: '.3rem' }}>⚡ Kharmic Strike</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Neither duelist won by 5 or more. Both will strike simultaneously.<br />
                    The cause of the duel is considered dropped — no victor, no loser.
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--gold)', marginBottom: '.3rem' }}>
                    {duel[focusResult.winner].name} strikes first
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    Won by {focusResult.diff} — earns first strike
                    {focusResult.freeRaises > 0 && ` + ${focusResult.freeRaises} Free Raise${focusResult.freeRaises > 1 ? 's' : ''} on the Strike roll`}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── STRIKE ── */}
      {phase === 'strike' && isInvolved && (
        <div style={{ width: '100%', maxWidth: 560 }}>
          {duel.altStrike ? (
            <div style={{ fontSize: 12, color: '#c0a0e0', textAlign: 'center', marginBottom: '1rem', lineHeight: 1.6 }}>
              ⚔ <strong>Neither duelist made contact.</strong> Initiative rolled — {duel.challenger.name} {duel.altStrike.cInit} vs {duel.defender.name} {duel.altStrike.dInit}.<br />
              Taking turns striking one at a time until someone lands a hit.<br />
              <strong>{duel[duel.altStrike.order[duel.altStrike.turn % 2]].name}</strong> strikes now.
            </div>
          ) : duel.kharmic ? (
            <div style={{ fontSize: 12, color: '#c08040', textAlign: 'center', marginBottom: '1rem', lineHeight: 1.6 }}>
              ⚡ <strong>Kharmic Strike</strong> — both duelists strike simultaneously.<br />
              Roll <strong>Tahaddi / Reflexes</strong> vs opponent's Armor TN (5 + Reflexes×5).<br />
              Free Raises from Focus add to this roll. Declare additional raises before rolling.
            </div>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginBottom: '1rem', lineHeight: 1.6 }}>
              {duel.strikeFirst ? (
                <><strong>{duel[duel.strikeFirst].name}</strong> strikes first.<br /></>
              ) : null}
              Roll <strong>Tahaddi / Reflexes</strong> vs opponent's Armor TN (5 + Reflexes×5).<br />
              Free Raises from Focus add to this roll. Declare additional raises before rolling.
            </div>
          )}

          {/* Raise declarations before rolling */}
          <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {['challenger','defender'].map(side => {
              const pool = getStrikePool(side);
              const hasRolled = duel.strikeRolls?.[side] != null;
              const isFirst = duel.strikeFirst === side;
              const freeR = duel.strikeFirstRaises?.[side] || 0;
              const isAltTurn = !duel.altStrike || duel.altStrike.order[duel.altStrike.turn % 2] === side;
              const can = canAct(side) && isAltTurn;
              return (
                <div key={side} style={{ textAlign: 'center', minWidth: 180, opacity: can ? 1 : 0.5 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: '.25rem' }}>
                    {duel[side].name}
                    {isFirst && <span style={{ fontSize: 10, color: 'var(--gold)', marginLeft: 6 }}>★ First Strike</span>}
                  </div>
                  {freeR > 0 && (
                    <div style={{ fontSize: 10, color: '#c0a0e0', marginBottom: '.25rem' }}>{freeR} Free Raise{freeR > 1 ? 's' : ''} from Focus</div>
                  )}
                  {!hasRolled && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center', marginBottom: '.4rem' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Extra Raises:</span>
                      <button className="rep-btn" disabled={!can} onClick={() => setStrikeRaises(r => ({ ...r, [side]: Math.max(0, r[side] - 1) }))}>−</button>
                      <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--gold)', minWidth: 20, textAlign: 'center' }}>{strikeRaises[side]}</span>
                      <button className="rep-btn" disabled={!can} onClick={() => setStrikeRaises(r => ({ ...r, [side]: r[side] + 1 }))}>+</button>
                    </div>
                  )}
                  {/* Maneuvers — same options as a normal attack roll. Strike IS an attack roll. */}
                  {!hasRolled && can && (
                    <div style={{ marginBottom: '.4rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', justifyContent: 'center' }}
                        onClick={() => setStrikeManeuversOpen(o => ({ ...o, [side]: !o[side] }))}>
                        <i className={`ti ti-chevron-${strikeManeuversOpen[side] || strikeManeuvers[side].length > 0 ? 'down' : 'right'}`} style={{ fontSize: 10, color: 'var(--text-muted)' }} />
                        <span style={{ fontSize: 10, color: strikeManeuvers[side].length > 0 ? 'var(--gold)' : 'var(--text-muted)' }}>
                          Maneuvers{strikeManeuvers[side].length > 0 ? ` (${strikeManeuvers[side].length})` : ''}
                        </span>
                      </div>
                      {(strikeManeuversOpen[side] || strikeManeuvers[side].length > 0) && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 2, marginTop: 3 }}>
                          {ATTACK_MANEUVERS.map(m => (
                            <button key={m} className={`raise-btn ${strikeManeuvers[side].includes(m) ? 'sel' : ''}`}
                              style={{ fontSize: 9 }}
                              onClick={() => setStrikeManeuvers(p => ({
                                ...p,
                                [side]: p[side].includes(m) ? p[side].filter(x => x !== m) : [...p[side], m]
                              }))}>
                              {m}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: 'var(--gold-dim)', marginBottom: '.4rem' }}>
                    TN {pool.tn}{pool.totalRaises > 0 ? ` · ${pool.totalRaises} raise${pool.totalRaises > 1 ? 's' : ''} (narrative/maneuver)` : ''}
                  </div>
                  {strikeManeuvers[side].length > 0 && (
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: '.3rem' }}>
                      Maneuvers: <span style={{ color: 'var(--gold-dim)' }}>{strikeManeuvers[side].join(', ')}</span>
                    </div>
                  )}
                  {/* Roll block */}
                  {(() => {
                    const hasR = duel.strikeRolls?.[side] != null;
                    const isRolling = rolling['strike_' + side];
                    return hasR ? (
                      <div style={{ fontSize: 36, fontWeight: 900, color: duel.strikeRolls[side] >= pool.tn ? 'var(--green)' : 'var(--red)', lineHeight: 1 }}>
                        {duel.strikeRolls[side]}
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 }}>
                          {duel.strikeRolls[side] >= pool.tn ? '✓ HIT' : '✗ MISS'}
                        </span>
                      </div>
                    ) : isRolling && can ? (
                      <DicePicker
                        pool={{ rolled: pool.rolled, kept: pool.kept, tn: pool.tn }}
                        allowVoid={true}
                        currentVoid={duel[side]?.current_void ?? 1}
                        character={pcsMap?.[duel[side]?.id]}
                        onLuckUsed={() => decrementUse(side, 'advantages', 'Luck')}
                        onUnluckyUsed={() => decrementUse(side, 'disadvantages', 'Unlucky')}
                        onConfirm={total => {
                          if (duel.altStrike) {
                            const hit = total >= pool.tn;
                            if (hit) {
                              onUpdate({ phase: 'damage', winner: side, damageRolls: {}, strikeRolls: { ...duel.strikeRolls, [side]: total }, altStrike: null });
                            } else {
                              // Miss — pass the turn to the other duelist and roll again next time
                              onUpdate({ strikeRolls: {}, altStrike: { ...duel.altStrike, turn: duel.altStrike.turn + 1 } });
                            }
                          } else {
                            onUpdate({ strikeRolls: { ...duel.strikeRolls, [side]: total }, strikeRaisesUsed: { ...duel.strikeRaisesUsed, [side]: strikeRaises[side] } });
                          }
                          setRolling(r => ({ ...r, ['strike_' + side]: false }));
                        }} />
                    ) : can ? (
                      <button className="btn btn-p" onClick={() => setRolling(r => ({ ...r, ['strike_' + side]: true }))}>
                        Roll {pool.rolled}k{pool.kept}
                      </button>
                    ) : (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>Awaiting…</div>
                    );
                  })()}
                </div>
              );
            })}
          </div>

          {/* Strike outcome */}
          {strikeBothRolled && strikeResult && (
            <div style={{ background: 'rgba(200,150,42,.08)', border: '1px solid rgba(200,150,42,.25)', borderRadius: 6, padding: '.75rem 1.25rem', textAlign: 'center' }}>
              {duel.kharmic ? (
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  {strikeResult.cHit && strikeResult.dHit && <div style={{ color: '#c08040', marginBottom: '.25rem' }}>Both duelists landed a blow — a true kharmic exchange.</div>}
                  {strikeResult.cHit && !strikeResult.dHit && <div>{duel.challenger.name} struck. {duel.defender.name} missed.</div>}
                  {!strikeResult.cHit && strikeResult.dHit && <div>{duel.defender.name} struck. {duel.challenger.name} missed.</div>}
                  {!strikeResult.cHit && !strikeResult.dHit && <div style={{ color: 'var(--text-muted)' }}>Both missed. Destiny intervenes — cause of duel dropped.</div>}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  {strikeResult.cHit
                    ? <div style={{ color: duel.winner === 'defender' && strikeResult.cHit ? '#c0a0e0' : 'var(--gold)' }}>
                        {duel.challenger.name} hit (TN {strikeResult.cTN}){duel.winner === 'defender' && ' ⚡ Scorpion Strike'}
                      </div>
                    : <div style={{ color: 'var(--text-muted)' }}>{duel.challenger.name} missed (TN {strikeResult.cTN})</div>}
                  {strikeResult.dHit
                    ? <div style={{ color: duel.winner === 'challenger' && strikeResult.dHit ? '#c0a0e0' : 'var(--gold)' }}>
                        {duel.defender.name} hit (TN {strikeResult.dTN}){duel.winner === 'challenger' && ' ⚡ Scorpion Strike'}
                      </div>
                    : <div style={{ color: 'var(--text-muted)' }}>{duel.defender.name} missed (TN {strikeResult.dTN})</div>}
                </div>
              )}
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: '.4rem' }}>GM: advance to Damage to apply wounds</div>
            </div>
          )}
        </div>
      )}

      {/* ── DAMAGE ── */}
      {phase === 'damage' && isInvolved && (
        <div style={{ width: '100%', maxWidth: 480 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginBottom: '1rem' }}>
            Roll weapon damage for each duelist who landed a hit.
          </div>
          {['challenger','defender'].map(side => {
            // strikeResult requires BOTH sides' strikeRolls to be populated, which isn't true coming out of
            // an alt-strike resolution (only the eventual winner's roll survives — the other side's misses
            // got cleared each turn). Fall back to duel.winner, which alt-strike sets correctly on a hit.
            const hit = strikeResult ? (side === 'challenger' ? strikeResult.cHit : strikeResult.dHit) : (duel.winner === side);
            // Scorpion Strike: in non-kharmic duel, loser may still hit if roll beats Armor TN
            const isLoser = duel.winner && duel.winner !== side;
            const isScorpionStrike = !duel.kharmic && isLoser && hit;
            if (!hit) return (
              <div key={side} style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '.75rem', fontSize: 12 }}>
                {duel[side].name} — missed, no damage roll
              </div>
            );
            const dmg = getDmgPool(side);
            const hasDmg = duel.damageRolls?.[side] != null;
            const isRollingDmg = rolling['dmg_' + side];
            const can = canAct(side);
            return (
              <div key={side} style={{ marginBottom: '1.25rem', padding: '.75rem', background: 'var(--bg-panel)', borderRadius: 6, border: '1px solid rgba(200,150,42,.3)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: isScorpionStrike ? '#c0a0e0' : 'var(--gold)', marginBottom: '.35rem' }}>
                  {duel[side].name} — {dmg.label}
                  {isScorpionStrike && <span style={{ fontSize: 11, color: '#c0a0e0', marginLeft: 6 }}>⚡ Scorpion Strike</span>}
                </div>
                {hasDmg ? (
                  <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--gold)' }}>
                    {duel.damageRolls[side]} wounds
                  </div>
                ) : isRollingDmg && can ? (
                  <DicePicker pool={{ rolled: dmg.rolled, kept: dmg.kept, bonus: 0 }}
                    onConfirm={total => { onUpdate({ damageRolls: { ...duel.damageRolls, [side]: total } }); setRolling(r => ({ ...r, ['dmg_' + side]: false })); }} />
                ) : can ? (
                  <button className="btn btn-p" onClick={() => setRolling(r => ({ ...r, ['dmg_' + side]: true }))}>
                    Roll Damage {dmg.label}
                  </button>
                ) : (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>Awaiting…</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── RESOLVED ── */}
      {phase === 'resolved' && (
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          {duel.concedeBy ? (
            <>
              <div style={{ fontSize: 16, color: 'var(--gold)', fontWeight: 700, marginBottom: '.4rem' }}>
                {duel[duel.concedeBy].name} concedes
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {duel[duel.winner].name} is acknowledged as the superior duelist.
              </div>
            </>
          ) : duel.kharmic ? (
            <>
              <div style={{ fontSize: 16, color: '#c08040', fontWeight: 700, marginBottom: '.4rem' }}>⚡ Kharmic Strike</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Destiny intervened. The cause of the duel is dropped.</div>
            </>
          ) : duel.winner ? (
            <div style={{ fontSize: 18, color: '#c8a040', fontWeight: 700, marginBottom: '.5rem' }}>
              {duel[duel.winner]?.name} wins the Tahaddi
            </div>
          ) : null}
          {duel.damageRolls && (
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: '.5rem' }}>
              {Object.entries(duel.damageRolls).map(([side, dmg]) => {
                const raises = (duel.strikeFirstRaises?.[side] || 0) + (duel.strikeRaisesUsed?.[side] || 0);
                return (
                  <div key={side} style={{ marginBottom: '.2rem' }}>
                    {duel[side]?.name}: <strong style={{ color: 'var(--gold)' }}>{dmg} wounds</strong>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Spectator message */}
      {!isInvolved && phase !== 'resolved' && (
        <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', marginBottom: '1.5rem', maxWidth: 300 }}>
          The knives are drawn. Hold your breath.
        </div>
      )}

      {/* GM controls */}
      {isGM && (
        <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '1rem' }}>
          {phase === 'assessment' && assessmentBothRolled && (
            <button className="btn btn-p" onClick={() => {
              const bonus1k1 = assessmentResult?.bonus1k1 || null;
              onUpdate({ phase: 'focus', assessmentBonus: bonus1k1, focusRolls: {} });
              setRolling({});
            }}>Proceed to Focus →</button>
          )}
          {phase === 'focus' && focusBothRolled && focusResult && (
            <button className="btn btn-p" onClick={() => {
              const firstRaises = focusResult.kharmic ? {} : { [focusResult.winner]: focusResult.freeRaises };
              onUpdate({
                phase: 'strike',
                kharmic: focusResult.kharmic,
                strikeFirst: focusResult.kharmic ? null : focusResult.winner,
                strikeFirstRaises: firstRaises,
                strikeRolls: {},
              });
              setRolling({});
            }}>Proceed to Strike →</button>
          )}
          {phase === 'strike' && strikeBothRolled && !duel.altStrike && (
            <button className="btn btn-p" onClick={() => {
              // Determine winner for resolved state
              let winner = null;
              if (!duel.kharmic) {
                if (strikeResult.cHit && !strikeResult.dHit) winner = 'challenger';
                else if (strikeResult.dHit && !strikeResult.cHit) winner = 'defender';
                else if (strikeResult.cHit && strikeResult.dHit) winner = duel.strikeFirst; // first striker wins if both hit
                else {
                  // Neither made contact — a miss never wins the duel outright. Per Charles's ruling: roll
                  // Initiative and take turns striking one at a time until someone lands a hit, instead of
                  // resolving simultaneously again. Initiative = Reflexes + Insight Rank (rolled), keep
                  // Reflexes — same formula as combat.
                  const cFull = pcsMap?.[duel.challenger?.id] || duel.challenger;
                  const dFull = pcsMap?.[duel.defender?.id] || duel.defender;
                  const cRank = cFull?.insight_rank || cFull?.school_rank || 1;
                  const dRank = dFull?.insight_rank || dFull?.school_rank || 1;
                  const cInit = rollExplodingKeep((duel.challenger.reflexes || 2) + cRank, duel.challenger.reflexes || 2);
                  const dInit = rollExplodingKeep((duel.defender.reflexes || 2) + dRank, duel.defender.reflexes || 2);
                  const order = cInit >= dInit ? ['challenger', 'defender'] : ['defender', 'challenger'];
                  onUpdate({ altStrike: { order, turn: 0, cInit, dInit }, strikeRolls: {}, strikeRaisesUsed: {} });
                  setRolling({});
                  return;
                }
              }
              onUpdate({ phase: 'damage', winner, damageRolls: {} });
              setRolling({});
            }}>Proceed to Damage →</button>
          )}
          {phase === 'damage' && (() => {
            const hitters = ['challenger','defender'].filter(s => s === 'challenger' ? strikeResult?.cHit : strikeResult?.dHit);
            const allDone = hitters.every(s => duel.damageRolls?.[s] != null);
            return allDone ? (
              <button className="btn btn-p" onClick={() => {
                // Apply damage to characters
                if (duel.damageRolls && onUpdateCharacter) {
                  ['challenger','defender'].forEach(side => {
                    const rawDmg = duel.damageRolls[side];
                    if (rawDmg == null) return;
                    const totalDmg = rawDmg; // Damage roll has no raises — raises are for attack rolls only
                    const charId = duel[side]?.id;
                    const char = pcsMap?.[charId];
                    if (char && totalDmg > 0) {
                      const newWounds = Math.min((char.current_wounds || 0) + totalDmg, char.max_wounds || 34);
                      onUpdateCharacter(charId, { current_wounds: newWounds });
                    }
                  });
                }
                onUpdate({ phase: 'resolved' });
              }}>
                Resolve Duel →
              </button>
            ) : null;
          })()}
          {phase === 'resolved' && (
            <button className="btn btn-p" onClick={onClose}>End Duel</button>
          )}
        </div>
      )}
    </div>
  );
}
