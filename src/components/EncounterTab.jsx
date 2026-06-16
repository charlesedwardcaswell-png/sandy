import React, { useState, useCallback } from 'react';
import { STANCES, NPC_ACTIONS, STATUS_EFFECTS, ROUND_LIMITS, WEAPONS_LIST } from '../data/constants';
import { Silhouette, FacIcon, WoundBadge } from './UI';
import { getWoundRank, getArchetype, calcDifficulty, diffColor, pick, rollN, repLabel } from '../lib/utils';
import DiceModal from './DiceModal';
import PCTurnPanel from './PCTurnPanel';

// Random tables
const PERSONALITIES = ['Nervous','Arrogant','Fanatical','Cowardly','Eerily calm','Chatty','Silent','Grieving','Drunk','Professional','Vengeful','Confused','Bored','Desperate','Proud','Suspicious','Merciful','Sadistic','Loyal','Resigned'];
const PHYSICALS = ['Scarred','Hooded','Enormous','Limping','Veiled','Tattooed','Missing a hand','Unusually young','Ancient','Masked','Burns','Foreign features','Richly dressed','In rags','Military bearing','Shaking hands'];
const TACTICALS = ['Flees at half wounds','Never retreats','Protects a specific ally','Targets the biggest threat','Hangs back at range','Rushes the nearest','Fights dirty','Surrenders if alone','Tries to disarm first'];

const NPC_BY_FACTION = {
  'City Guard': ['Soldier of the City Guard'],
  'Dahab': ['Dahabi Enforcer','Dahabi Bargainer','Dahabi Merchant'],
  'Qabal': ['Qabal Agent','Qabal Summoner'],
  'Assassins': ['Assassin Slayer','Assassin Keeper'],
  'Ashalan': ['Blood-Sworn','Children of Midnight','Heart-Seekers'],
  "Ra'Shari": ["Ra'Shari Knife-Fighter","Ra'Shari Trader","Ra'Shari Diviner"],
  'Senpet': ['Senpet Legionnaire','Senpet Charioteer','Senpet Sahir'],
  'Yodotai': ['Yodotai Legionnaire','Yodotai Mercenary'],
  'Ebonites': ['Ebonite Templar'],
  'Jackals': ['Jani','Necromancer','Kabir'],
  'Monsters': ['Desert Ghul','Bone Ghul','Jinn'],
};

const SETTING_FACTIONS = {
  Streets: { primary:['City Guard','Dahab','Jackals'], secondary:['Qabal',"Ra'Shari",'Assassins'] },
  Sewers:  { primary:['Jackals','Monsters'], secondary:['Assassins'] },
  Desert:  { primary:["Ra'Shari",'Monsters'], secondary:['Yodotai','Senpet'] },
  Palace:  { primary:['City Guard','Senpet','Dahab'], secondary:['Ashalan','Qabal'] },
  Indoors: { primary:['Dahab','Monsters'], secondary:['City Guard','Jackals'] },
};

function generateGroup(setting, difficulty) {
  const counts = { Easy:[2,3], Moderate:[3,5], Hard:[4,6], Deadly:[5,8] };
  const ranks = { Easy:[1,2], Moderate:[1,3], Hard:[2,4], Deadly:[3,5] };
  const fp = SETTING_FACTIONS[setting] || SETTING_FACTIONS.Streets;
  const [cMin, cMax] = counts[difficulty] || counts.Moderate;
  const [rMin, rMax] = ranks[difficulty] || ranks.Moderate;
  const count = cMin + Math.floor(Math.random() * (cMax - cMin + 1));
  return Array.from({ length: count }, (_, i) => {
    const pool = Math.random() < 0.7 ? fp.primary : fp.secondary;
    const faction = pick(pool);
    const schools = NPC_BY_FACTION[faction] || ['Soldier of the City Guard'];
    const school = pick(schools);
    const rank = rMin + Math.floor(Math.random() * (rMax - rMin + 1));
    return {
      id: 'npc_' + Date.now() + '_' + i,
      name: `${school} — Rank ${rank}`,
      school, rank, faction,
      dr: '3k2', drawnWeapon: 'Longsword (3k2)',
      reflexes: rank + 1, agility: rank + 1, air: rank + 1, fire: rank + 1,
      personality: pick(PERSONALITIES), physical: pick(PHYSICALS), tactical: pick(TACTICALS),
      wound: 0, stance: 'Attack', statusEffects: [], type: 'npc', fromLog: false,
    };
  });
}

// ── Combatant Card ────────────────────────────────────────────────────────────
function CombatantCard({ c, isActive, isGM, isPCView, myCharId, pcs, onStanceChange, onGMWound, onApplyStatus, onRemoveStatus, targeting, onSetTarget }) {
  const isNPC = c.type === 'npc';
  const isMyChar = c.id === myCharId;
  const wColor = ['#4a8a40','#8a8a30','#a87830','#c86030','#c84030','#a02828','#801818','#600010'][c.wound] || '#4a8a40';
  const wLabel = ['Healthy','Nicked','Grazed','Hurt','Injured','Crippled','Down','Out'][c.wound] || 'Healthy';
  const pc = pcs?.[c.id];

  const cardClass = [
    'combat-card',
    isNPC ? 'npc-card' : 'pc-card',
    isMyChar ? 'my-char' : '',
    isActive ? 'active-turn' : '',
    targeting === c.id ? 'targeted' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClass}>
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.4rem .6rem', borderBottom: '1px solid var(--border)', background: isActive ? 'rgba(200,150,42,.08)' : 'transparent' }}>
        <div style={{ width: isActive ? 36 : 28, height: isActive ? 46 : 36, borderRadius: 4, background: 'var(--bg-deep)', border: `1px solid ${isActive ? 'var(--gold)' : isNPC ? '#8a3030' : '#4a8a40'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', transition: 'all .2s' }}>
          <Silhouette type={getArchetype(c.school) || (isNPC ? 'warrior' : 'warrior')} size={isActive ? 28 : 22} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ fontSize: isActive ? 14 : 12, fontWeight: 600, color: isActive ? 'var(--gold)' : isMyChar ? 'var(--gold)' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {c.name}
            </div>
            {isMyChar && !isActive && <span style={{ fontSize: 8, color: 'var(--gold-dim)', border: '1px solid var(--gold-dim)', borderRadius: 3, padding: '0 3px' }}>YOU</span>}
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {isNPC ? (c.sub || c.school || '') : c.school}
          </div>
          <div style={{ display: 'flex', gap: 3, marginTop: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 9, padding: '1px 5px', border: `1px solid ${wColor}55`, borderRadius: 3, color: wColor, background: wColor + '20', fontWeight: 600 }}>{wLabel}</span>
            <span className="stance-badge">{c.stance === 'Full Attack' ? 'F.Atk' : c.stance === 'Full Defense' ? 'F.Def' : c.stance}</span>
            {(c.statusEffects || []).map(e => (
              <span key={e} className="effect-badge" onClick={() => onRemoveStatus && onRemoveStatus(c.id, e)}>{e} ×</span>
            ))}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: isActive ? 22 : 16, fontWeight: 700, color: 'var(--gold)' }}>{c.init}</div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>init</div>
        </div>
      </div>

      {/* Bottom row - weapon + void */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.3rem .6rem', fontSize: 10, color: 'var(--text-muted)' }}>
        <i className="ti ti-sword" style={{ fontSize: 11 }} />
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.drawnWeapon || 'Unarmed'}</span>
        {!isNPC && pc && (
          <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {Array.from({ length: pc.void || 2 }, (_, i) => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', border: `1px solid ${i < (pc.current_void || 0) ? 'var(--gold)' : 'var(--border)'}`, background: i < (pc.current_void || 0) ? 'var(--gold)' : 'transparent' }} />
            ))}
          </div>
        )}
      </div>

      {/* GM controls */}
      {isGM && !isPCView && (
        <div style={{ padding: '.3rem .6rem', borderTop: '1px solid rgba(107,78,40,.2)', display: 'flex', gap: 4, alignItems: 'center' }}>
          <button className="btn btn-sm btn-d" style={{ padding: '1px 5px', fontSize: 9 }} onClick={() => onGMWound(c.id, 1)}>+W</button>
          <button className="btn btn-sm" style={{ padding: '1px 5px', fontSize: 9 }} onClick={() => onGMWound(c.id, -1)}>−W</button>
          <select style={{ fontSize: 9, padding: '1px 4px', flex: 1 }} value="" onChange={e => { if (e.target.value) onApplyStatus(c.id, e.target.value); e.target.value = ''; }}>
            <option value="">+ Status</option>
            {STATUS_EFFECTS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
      )}

      {/* NPC action controls (GM only, active NPC turn) */}
      {isActive && isNPC && isGM && !isPCView && (
        <div style={{ padding: '.4rem .6rem', borderTop: '1px solid rgba(107,78,40,.3)', background: 'rgba(200,150,42,.04)' }}>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 3 }}>NPC Action:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {NPC_ACTIONS.map(a => (
              <button key={a} className={`act-btn ${c._action === a ? 'sel' : ''}`} style={{ fontSize: 9 }}
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

// ── NPC Picker ────────────────────────────────────────────────────────────────
function NPCPicker({ npcsFromLog, onAdd, label = 'Add NPC' }) {
  const [faction, setFaction] = useState('');
  const [school, setSchool] = useState('');
  const [rank, setRank] = useState(1);
  const factions = Object.keys(NPC_BY_FACTION);
  const schools = faction ? NPC_BY_FACTION[faction] || [] : [];

  const add = () => {
    if (!school) return;
    onAdd({
      id: 'npc_' + Date.now(),
      name: `${school} — Rank ${rank}`,
      school, rank, faction,
      dr: '3k2', drawnWeapon: 'Longsword (3k2)',
      reflexes: rank + 1, agility: rank + 1, air: rank + 1, fire: rank + 1,
      personality: pick(PERSONALITIES), physical: pick(PHYSICALS), tactical: pick(TACTICALS),
      wound: 0, stance: 'Attack', statusEffects: [], type: 'npc', fromLog: false,
    });
  };

  return (
    <div>
      {/* From NPC Log */}
      {npcsFromLog && npcsFromLog.length > 0 && (
        <div style={{ marginBottom: '.5rem' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: '.3rem' }}>From NPC Log:</div>
          <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap' }}>
            {npcsFromLog.map(n => (
              <button key={n.id} className="btn btn-sm" style={{ fontSize: 10 }} onClick={() => onAdd({
                id: 'npc_log_' + n.id + '_' + Date.now(),
                name: n.name,
                school: n.school, rank: n.rank || 1, faction: n.faction,
                dr: n.weapon_dr || '3k2', drawnWeapon: n.weapon || 'Longsword (3k2)',
                reflexes: (n.traits?.Reflexes) || (n.rank || 1) + 1,
                agility: (n.traits?.Agility) || (n.rank || 1) + 1,
                air: (n.rings?.Air) || (n.rank || 1),
                fire: (n.rings?.Fire) || (n.rank || 1),
                wound: 0, stance: 'Attack', statusEffects: [], type: 'npc', fromLog: true,
              })}>
                <i className="ti ti-user" style={{ fontSize: 10 }} /> {n.name}
              </button>
            ))}
          </div>
        </div>
      )}
      {/* Library picker */}
      <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={faction} onChange={e => { setFaction(e.target.value); setSchool(''); }} style={{ fontSize: 10 }}>
          <option value="">Faction</option>
          {factions.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        {faction && (
          <select value={school} onChange={e => setSchool(e.target.value)} style={{ fontSize: 10 }}>
            <option value="">School</option>
            {schools.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
        {school && (
          <select value={rank} onChange={e => setRank(+e.target.value)} style={{ width: 60, fontSize: 10 }}>
            {Array.from({ length: 5 }, (_, i) => <option key={i + 1} value={i + 1}>R{i + 1}</option>)}
          </select>
        )}
        <button className="btn btn-sm btn-p" disabled={!school} onClick={add} style={{ fontSize: 10 }}>{label}</button>
      </div>
    </div>
  );
}

// ── Main Encounter Tab ────────────────────────────────────────────────────────
export default function EncounterTab({ isGM, isPCView, characters, myCharId, session, encounter, setEncounter, npcsFromLog, onUpdateCharacter, onAddEncounterEntry }) {
  const { state, setup, combatants, activeTurn, dmgBanner, envQuirk, round } = encounter;
  const [modal, setModal] = useState(null);
  const [view, setView] = useState('columns'); // columns | initiative
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
    const pcCombatants = characters.map(pc => ({
      id: pc.id, name: pc.name, type: 'pc',
      school: pc.school, faction: pc.faction,
      reflexes: pc.reflexes, agility: pc.agility, air: pc.air, fire: pc.fire,
      wound: getWoundRank(pc.current_wounds, pc.max_wounds),
      stance: 'Attack',
      init: (pc.reflexes || 2) * 2 + Math.floor(Math.random() * 8) + 6,
      dr: pc.current_weapon?.match(/\((\dk\d)\)/)?.[1] || '3k2',
      drawnWeapon: pc.current_weapon || 'Unarmed (1k1)',
      statusEffects: [], _action: null,
    }));
    const npcCombatants = s.selectedNPCs.map(n => ({
      ...n, wound: 0, stance: 'Attack',
      init: Math.floor(Math.random() * 10) + 4 + (n.rank || 1),
      statusEffects: [], _action: null,
    }));
    const all = [...pcCombatants, ...npcCombatants].sort((a, b) => b.init - a.init);
    upEnc({ state: 'active', setup: s, combatants: all, activeTurn: 0, round: 1, dmgBanner: null, envQuirk: null });
    setNpcTargets({});
  };

  const advanceTurn = () => {
    const nextIdx = (activeTurn + 1) % combatants.length;
    const newRound = nextIdx === 0 ? (round || 1) + 1 : round || 1;
    upEnc({ activeTurn: nextIdx, round: newRound, dmgBanner: null });
    setTargeting(null);
  };

  const applyStatus = (id, effect) => {
    upEnc({ combatants: combatants.map(c => c.id === id ? { ...c, statusEffects: [...(c.statusEffects || []).filter(e => e !== effect), effect] } : c) });
  };

  const removeStatus = (id, effect) => {
    upEnc({ combatants: combatants.map(c => c.id === id ? { ...c, statusEffects: (c.statusEffects || []).filter(e => e !== effect) } : c) });
  };

  const gmWound = (id, delta) => {
    const c = combatants.find(x => x.id === id);
    if (!c) return;
    const newWound = Math.max(0, Math.min(7, c.wound + delta));
    upEnc({ combatants: combatants.map(x => x.id === id ? { ...x, wound: newWound } : x) });
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
    if (damage !== null && damage !== undefined && modal?.targetId) {
      upEnc({
        combatants: combatants.map(c => c.id === modal.targetId ? { ...c, wound: Math.min(7, c.wound + Math.ceil(damage / 5)) } : c),
        dmgBanner: { attackerName: active?.name, targetId: modal.targetId, damage, result },
      });
    }
    // Spend void if used
    if (result?.usedVoid && active?.type === 'pc') {
      const pc = pcsMap[active.id];
      if (pc) onUpdateCharacter(active.id, { current_void: Math.max(0, (pc.current_void || 0) - 1) });
    }
  };

  const handleStanceChange = (id, stance) => {
    upEnc({ combatants: combatants.map(c => c.id === id ? { ...c, stance } : c) });
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
    const entry = {
      session_id: session?.id || null,
      name: setup.name || `Session ${session?.session_number || '?'} — ${setup.setting} — ${setup.type}`,
      setting: setup.setting,
      encounter_type: setup.type,
      party_members: characters.map(c => ({ id: c.id, name: c.name })),
      enemies: enemies.map(e => ({ name: e.name, school: e.school, rank: e.rank })),
      rounds: round || 1,
      env_quirk: envQuirk || null,
    };
    if (onAddEncounterEntry) await onAddEncounterEntry(entry);
    upEnc({ state: 'idle', combatants: [], activeTurn: 0, round: 1, dmgBanner: null, envQuirk: null });
    setNpcTargets({});
    setTargeting(null);
  };

  // ── Idle state ───────────────────────────────────────────────────────────
  if (state === 'idle') {
    return (
      <div className="enc-idle">
        <div>
          <i className="ti ti-swords" style={{ fontSize: 44, opacity: .2, display: 'block', marginBottom: '.5rem' }} />
          <div style={{ fontSize: 16, color: 'var(--text-muted)' }}>No active encounter</div>
          {!session && isGM && !isPCView && (
            <div style={{ fontSize: 12, color: 'var(--red)', marginTop: '.5rem' }}>Start a session first</div>
          )}
        </div>
        {isGM && !isPCView && session && (
          <button className="btn btn-p btn-lg" onClick={() => upEnc({ state: 'setup', setup: { type: null, setting: null, desc: '', name: '', selectedNPCs: [] } })}>
            <i className="ti ti-swords" style={{ marginRight: 6 }} /> Start Encounter
          </button>
        )}
      </div>
    );
  }

  // ── Setup state ──────────────────────────────────────────────────────────
  if (state === 'setup') {
    const s = setup;
    const upS = patch => upEnc({ setup: { ...s, ...patch } });
    const defaultName = `Session ${session?.session_number || '?'} — ${s.setting || '?'} — ${s.type || '?'}`;
    const diff = calcDifficulty(s.selectedNPCs || []);
    const diffPct = { Easy: 25, Moderate: 50, Hard: 75, Deadly: 100 }[diff] || 0;

    return (
      <div style={{ maxWidth: 660 }}>
        <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '.75rem' }}>
          <button className="btn btn-sm" onClick={() => upEnc({ state: 'idle' })}>← Back</button>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>New Encounter</span>
        </div>
        <div className="card">
          {/* Name */}
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', display: 'block', marginBottom: '.4rem' }}>Encounter Name</span>
            <input value={s.name || defaultName} onChange={e => upS({ name: e.target.value })} style={{ width: '100%', fontSize: 13 }} placeholder={defaultName} />
          </div>
          {/* Type */}
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', display: 'block', marginBottom: '.4rem' }}>Type</span>
            <div>{['Action','Intrigue','Travel','Downtime'].map(t => (
              <button key={t} className={`opt-btn ${s.type === t ? 'sel' : ''}`} onClick={() => upS({ type: t, name: '' })}>{t}</button>
            ))}</div>
            {s.type && ROUND_LIMITS[s.type] && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: '.3rem' }}>{ROUND_LIMITS[s.type]} round limit</div>}
          </div>
          {/* Setting */}
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', display: 'block', marginBottom: '.4rem' }}>Setting</span>
            <div>{['Streets','Sewers','Desert','Palace','Indoors'].map(t => (
              <button key={t} className={`opt-btn ${s.setting === t ? 'sel' : ''}`} onClick={() => upS({ setting: t, name: '' })}>{t}</button>
            ))}</div>
          </div>
          {/* Scene description */}
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', display: 'block', marginBottom: '.4rem' }}>Scene Description</span>
            <textarea rows={2} value={s.desc || ''} onChange={e => upS({ desc: e.target.value })} placeholder="Describe the scene for players..." style={{ width: '100%', resize: 'vertical' }} />
          </div>
          {/* NPCs */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.5rem' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em' }}>NPCs</span>
              {s.setting && (
                <button className="btn btn-sm" onClick={() => {
                  const d = ['Easy','Moderate','Hard','Deadly'][Math.floor(Math.random() * 4)];
                  upS({ selectedNPCs: generateGroup(s.setting, d) });
                }}>⚄ Generate Group</button>
              )}
            </div>
            <NPCPicker npcsFromLog={npcsFromLog} onAdd={npc => upS({ selectedNPCs: [...(s.selectedNPCs || []), npc] })} />
            {(s.selectedNPCs || []).length > 0 && (
              <div style={{ marginTop: '.5rem' }}>
                {s.selectedNPCs.map((n, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '.4rem', padding: '3px 0', fontSize: 11, color: 'var(--text-secondary)', borderBottom: '1px solid rgba(107,78,40,.2)' }}>
                    <span style={{ flex: 1 }}>{n.name}</span>
                    {n.fromLog && <span style={{ fontSize: 9, color: 'var(--gold-dim)' }}>log</span>}
                    {!n.fromLog && <span style={{ fontSize: 9, color: 'var(--text-muted)', fontStyle: 'italic' }}>{n.personality}</span>}
                    <button className="btn btn-sm btn-d" style={{ fontSize: 9, padding: '1px 5px' }} onClick={() => upS({ selectedNPCs: s.selectedNPCs.filter((_, j) => j !== i) })}>×</button>
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginTop: '.5rem' }}>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', width: 60 }}>Difficulty:</span>
                  <div className="diff-bar"><div className="diff-fill" style={{ width: `${diffPct}%`, background: diffColor(diff) }} /></div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: diffColor(diff), width: 70 }}>{diff}</span>
                </div>
              </div>
            )}
          </div>
          {/* Party */}
          <div style={{ padding: '.5rem', background: 'var(--bg-panel)', borderRadius: 4, marginBottom: '1rem', fontSize: 10, color: 'var(--text-muted)' }}>
            PCs: {characters.map(c => c.name).join(', ')}
          </div>
          <button className="btn btn-p" style={{ width: '100%' }} disabled={!s.type || !s.setting}
            onClick={() => beginEncounter({ ...s, name: s.name || defaultName })}>
            Begin Encounter →
          </button>
        </div>
      </div>
    );
  }

  // ── Active state ─────────────────────────────────────────────────────────
  const roundLimit = ROUND_LIMITS[setup.type];

  return (
    <div style={{ paddingBottom: isMyTurn ? 260 : 0 }}>
      {modal && (
        <DiceModal
          context={modal}
          onClose={() => setModal(null)}
          onResult={handleRollResult}
        />
      )}

      {/* Turn banner */}
      <div className="turn-banner">
        <div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Round {round || 1} — Active</div>
          <div className="turn-name">{active?.name || '—'}</div>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{setup.name}</div>
        {/* View toggle */}
        <div className="layer-tog">
          <button className={`layer-btn ${view === 'columns' ? 'active' : ''}`} onClick={() => setView('columns')}>Columns</button>
          <button className={`layer-btn ${view === 'initiative' ? 'active' : ''}`} onClick={() => setView('initiative')}>Initiative</button>
        </div>
        {isGM && !isPCView && (
          <>
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

      {/* Env quirk */}
      {envQuirk && (
        <div className="env-banner">
          <i className="ti ti-map-pin" style={{ color: 'var(--gold)', fontSize: 14 }} />
          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Environment: </span>
          <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic', flex: 1 }}>{envQuirk}</span>
        </div>
      )}

      {/* Scene description */}
      {setup.desc && (
        <div className="card" style={{ marginBottom: '.75rem', borderColor: 'var(--gold-dim)', padding: '.6rem .75rem' }}>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontStyle: 'italic' }}>{setup.desc}</div>
        </div>
      )}

      {/* Damage banner */}
      {dmgBanner && (
        <div className="dmg-banner">
          <i className="ti ti-sword" style={{ color: 'var(--red)' }} />
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{dmgBanner.attackerName}</span>
          <span style={{ color: 'var(--text-muted)' }}>deals</span>
          <span style={{ color: 'var(--red)', fontWeight: 700, fontSize: 16 }}>{dmgBanner.damage} wounds</span>
          <span style={{ color: 'var(--text-muted)' }}>to {combatants.find(c => c.id === dmgBanner.targetId)?.name || 'target'}</span>
        </div>
      )}

      {/* Two column view */}
      {view === 'columns' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          {/* Enemies */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#c84030', textTransform: 'uppercase', letterSpacing: '.1em', paddingBottom: '.4rem', borderBottom: '2px solid #8a3030', marginBottom: '.5rem', display: 'flex', alignItems: 'center', gap: 5 }}>
              <i className="ti ti-skull" style={{ fontSize: 11 }} /> Enemies ({enemies.length})
            </div>
            {enemies.length === 0 && <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', padding: '.5rem' }}>No enemies</div>}
            {enemies.map(c => (
              <CombatantCard key={c.id} c={c}
                isActive={c.id === active?.id}
                isGM={isGM} isPCView={isPCView}
                myCharId={myCharId} pcs={pcsMap}
                onGMWound={gmWound}
                onApplyStatus={applyStatus}
                onRemoveStatus={removeStatus}
                targeting={targeting}
                onSetTarget={(npcId, action) => {
                  handleSetNPCAction(npcId, action);
                  if (action === 'Attack') setTargeting(npcId);
                }}
              />
            ))}
            {/* NPC attack target selection */}
            {targeting && isGM && !isPCView && (
              <div style={{ padding: '.5rem', background: 'rgba(200,64,48,.08)', border: '1px solid var(--red-dim)', borderRadius: 5, marginTop: '.4rem' }}>
                <div style={{ fontSize: 10, color: 'var(--red)', marginBottom: '.3rem' }}>▼ Select target to attack:</div>
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
              <div style={{ marginTop: '.5rem' }}>
                <NPCPicker npcsFromLog={npcsFromLog} label="+ Reinforce" onAdd={npc => {
                  const nc = { ...npc, wound: 0, stance: 'Attack', init: Math.floor(Math.random() * 6) + 3, statusEffects: [], _action: null };
                  upEnc({ combatants: [...combatants, nc].sort((a, b) => b.init - a.init) });
                }} />
              </div>
            )}
          </div>

          {/* Party */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#6aba60', textTransform: 'uppercase', letterSpacing: '.1em', paddingBottom: '.4rem', borderBottom: '2px solid #4a8a40', marginBottom: '.5rem', display: 'flex', alignItems: 'center', gap: 5 }}>
              <i className="ti ti-shield" style={{ fontSize: 11 }} /> Party ({party.length})
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
              />
            ))}
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
              <span style={{ fontSize: 10, color: 'var(--text-muted)', width: 16, textAlign: 'right' }}>{i + 1}</span>
              <Silhouette type={getArchetype(c.school) || 'warrior'} size={16} />
              <span style={{ flex: 1, fontSize: 11, color: 'var(--text-primary)' }}>{c.name}</span>
              <WoundBadge rank={c.wound} />
              <span className="stance-badge" style={{ fontSize: 8 }}>{c.stance === 'Full Attack' ? 'F.Atk' : c.stance === 'Full Defense' ? 'F.Def' : c.stance}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--gold)', width: 24, textAlign: 'right' }}>{c.init}</span>
              {isGM && !isPCView && (
                <div style={{ display: 'flex', gap: 2 }}>
                  <button className="btn btn-sm btn-d" style={{ padding: '1px 4px', fontSize: 9 }} onClick={() => gmWound(c.id, 1)}>+W</button>
                  <button className="btn btn-sm" style={{ padding: '1px 4px', fontSize: 9 }} onClick={() => gmWound(c.id, -1)}>−W</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* PC Turn Panel — shown whenever it's a PC's turn */}
      {active && active.type === 'pc' && (
        <PCTurnPanel
          combatant={active}
          character={pcsMap[active.id]}
          enemies={enemies}
          onRoll={(ctx) => setModal(ctx)}
          onStanceChange={(stance) => handleStanceChange(active.id, stance)}
          onDrawWeapon={(weapon) => handleDrawWeapon(active.id, weapon)}
          onPass={advanceTurn}
        />
      )}
    </div>
  );
}
