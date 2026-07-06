import React, { useState, useEffect } from 'react';
import { ROUND_LIMITS, CREATURES_LIBRARY, CREATURE_TYPE_CATEGORIES, GAME_ID } from '../data/constants';
import { supabase } from '../lib/supabase';
import { calcDifficulty, diffColor, pick } from '../lib/utils';

// ── Shared encounter data ─────────────────────────────────────────────────────
const PERSONALITIES = ['Nervous','Arrogant','Fanatical','Cowardly','Eerily calm','Chatty','Silent','Grieving','Drunk','Professional','Vengeful','Confused','Bored','Desperate','Proud','Suspicious','Merciful','Sadistic','Loyal','Resigned'];
const PHYSICALS = ['Scarred','Hooded','Enormous','Limping','Veiled','Tattooed','Missing a hand','Unusually young','Ancient','Masked','Burns','Foreign features','Richly dressed','In rags','Military bearing','Shaking hands'];
const TACTICALS = ['Flees at half wounds','Never retreats','Protects a specific ally','Targets the biggest threat','Hangs back at range','Rushes the nearest','Fights dirty','Surrenders if alone','Tries to disarm first'];

export const NPC_BY_FACTION = {
  'City Guard':   ['Soldier of the City Guard'],
  'Dahab':        ['Dahabi Enforcer','Dahabi Bargainer','Dahabi Merchant'],
  'Qabal':        ['Qabal Agent','Qabal Summoner'],
  'Assassins':    ['Assassin Slayer','Assassin Keeper'],
  'Ashalan':      ['Blood-Sworn','Children of Midnight','Heart-Seekers'],
  "Ra'Shari":     ["Ra'Shari Knife-Fighter","Ra'Shari Trader","Ra'Shari Diviner"],
  'Senpet':       ['Senpet Legionnaire','Senpet Charioteer','Senpet Sahir'],
  'Yodotai':      ['Yodotai Legionnaire','Yodotai Mercenary'],
  'Ebonites':     ['Ebonite Templar'],
  'Jackals':      ['Jani','Necromancer','Kabir'],
  'Independent':  ['Alley Thug','Street Rat'],
  'Creatures':    ['Ghul','Jinn','Greater Jinn','Undead Soldier','Giant Scorpion','Desert Wraith','Ivory Kingdoms Beast','Blood-Drinker'],
};

const SETTING_FACTIONS = {
  Streets:           ['City Guard','Jackals','Independent'],
  Sewers:            ['Jackals','Independent'],
  Desert:            ['Senpet','Yodotai','Ashalan'],
  Palace:            ['Dahab','Qabal','City Guard'],
  Indoors:           ['Assassins','Dahab','Qabal'],
  "Khan's Warcamp":  ['Senpet','Yodotai'],
  "Barracks Lounge": ['City Guard','Independent'],
};

export function generateGroup(setting, difficulty) {
  const counts = { Easy: 2, Moderate: 3, Hard: 4, Deadly: 5 };
  const count = counts[difficulty] || 3;
  const fp = SETTING_FACTIONS[setting] || SETTING_FACTIONS.Streets;
  return Array.from({ length: count }, () => {
    const faction = pick(fp);
    const schools = NPC_BY_FACTION[faction] || ['Soldier of the City Guard'];
    const school = pick(schools);
    const rank = difficulty === 'Deadly' ? 3 : difficulty === 'Hard' ? 2 : 1;
    return {
      id: 'npc_' + Date.now() + Math.random(),
      name: `${school} — Rank ${rank}`,
      school, rank, faction,
      dr: '3k2', drawnWeapon: 'Weapon (3k2)',
      reflexes: rank + 1, agility: rank + 1, air: rank + 1, fire: rank + 1,
      personality: pick(PERSONALITIES), physical: pick(PHYSICALS), tactical: pick(TACTICALS),
      wound: 0, stance: 'Attack', statusEffects: [], type: 'npc', fromLog: false,
    };
  });
}

// ── NPC Picker ────────────────────────────────────────────────────────────────
export function NPCPicker({ npcsFromLog, onAdd, label = 'Add NPC' }) {
  const [faction, setFaction] = useState('');
  const [school, setSchool] = useState('');
  const [rank, setRank] = useState(1);
  const [logSel, setLogSel] = useState('');
  const [creatureType, setCreatureType] = useState('');
  const [creatureId, setCreatureId] = useState('');
  const factions = Object.keys(NPC_BY_FACTION).filter(f => f !== 'Creatures');
  const schools = faction ? NPC_BY_FACTION[faction] || [] : [];
  const isCreatureMode = faction === 'Creatures';
  const creatureChoices = creatureType
    ? CREATURES_LIBRARY.filter(c => (CREATURE_TYPE_CATEGORIES[creatureType] || []).includes(c.category))
    : [];

  const add = () => {
    if (!school) return;
    onAdd({
      id: 'npc_' + Date.now(),
      name: `${school} — Rank ${rank}`,
      school, rank, faction,
      dr: '3k2', drawnWeapon: 'Weapon (3k2)',
      reflexes: rank + 1, agility: rank + 1, air: rank + 1, fire: rank + 1,
      personality: pick(PERSONALITIES), physical: pick(PHYSICALS), tactical: pick(TACTICALS),
      wound: 0, stance: 'Attack', statusEffects: [], type: 'npc', fromLog: false,
    });
    setSchool(''); setFaction(''); setRank(1);
  };

  const addCreature = () => {
    const creature = CREATURES_LIBRARY.find(c => c.id === creatureId);
    if (!creature) return;
    onAdd({
      id: 'npc_' + creature.id + '_' + Date.now(),
      name: creature.name,
      school: creature.category, rank: creature.difficulty || 1, faction: 'Monsters',
      dr: creature.damage, drawnWeapon: `${creature.name} (${creature.attack})`,
      reflexes: creature.traits?.Reflexes || creature.air || 2,
      agility: creature.traits?.Agility || creature.fire || 2,
      air: creature.air || 2, earth: creature.earth || 2, fire: creature.fire || 2, water: creature.water || 2,
      tn_override: creature.tn, wpl_override: creature.wpl,
      wound: 0, stance: 'Attack', statusEffects: [], type: 'npc', fromLog: false,
    });
    setFaction(''); setCreatureType(''); setCreatureId('');
  };

  const addFromLog = () => {
    if (!logSel) return;
    const n = (npcsFromLog || []).find(x => x.id === logSel);
    if (!n) return;
    onAdd({
      id: 'npc_log_' + n.id + '_' + Date.now(),
      name: n.name,
      school: n.school, rank: n.rank || 1, faction: n.faction,
      dr: n.weapon_dr || '3k2', drawnWeapon: n.weapon || 'Weapon (3k2)',
      reflexes: (n.traits?.Reflexes) || (n.rank || 1) + 1,
      agility: (n.traits?.Agility) || (n.rank || 1) + 1,
      air: (n.rings?.Air) || (n.rank || 1),
      fire: (n.rings?.Fire) || (n.rank || 1),
      wound: 0, stance: 'Attack', statusEffects: [], type: 'npc', fromLog: true,
      controllerId: n.controller_id || null,
      sourceId: n.id, sourceType: 'npc',
    });
    setLogSel('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
      {/* From NPC Log — dropdown */}
      {npcsFromLog && npcsFromLog.length > 0 && (
        <div style={{ display: 'flex', gap: '.3rem', alignItems: 'center' }}>
          <select value={logSel} onChange={e => setLogSel(e.target.value)} style={{ fontSize: 12, flex: 1 }}>
            <option value="">From NPC Log…</option>
            {npcsFromLog.map(n => (
              <option key={n.id} value={n.id}>{n.name} — {n.faction} Rank {n.rank || 1}</option>
            ))}
          </select>
          <button className="btn btn-sm btn-p" disabled={!logSel} onClick={addFromLog} style={{ fontSize: 12 }}>Add</button>
        </div>
      )}
      {/* From Library — faction/school/rank dropdowns, or Creatures/Monsters bestiary */}
      <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={faction} onChange={e => { setFaction(e.target.value); setSchool(''); setCreatureType(''); setCreatureId(''); }} style={{ fontSize: 12 }}>
          <option value="">From Library…</option>
          {factions.map(f => <option key={f} value={f}>{f}</option>)}
          <option value="Creatures">Creatures / Monsters</option>
        </select>
        {faction && !isCreatureMode && (
          <select value={school} onChange={e => setSchool(e.target.value)} style={{ fontSize: 12 }}>
            <option value="">School</option>
            {schools.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
        {isCreatureMode && (
          <select value={creatureType} onChange={e => { setCreatureType(e.target.value); setCreatureId(''); }} style={{ fontSize: 12 }}>
            <option value="">Type</option>
            <option value="Creatures">Creatures</option>
            <option value="Monsters">Monsters</option>
          </select>
        )}
        {isCreatureMode && creatureType && (
          <select value={creatureId} onChange={e => setCreatureId(e.target.value)} style={{ fontSize: 12 }}>
            <option value="">Creature</option>
            {creatureChoices.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
        {!isCreatureMode && school && (
          <select value={rank} onChange={e => setRank(+e.target.value)} style={{ width: 60, fontSize: 12 }}>
            {Array.from({ length: 5 }, (_, i) => <option key={i + 1} value={i + 1}>R{i + 1}</option>)}
          </select>
        )}
        {!isCreatureMode && school && <button className="btn btn-sm btn-p" onClick={add} style={{ fontSize: 12 }}>{label}</button>}
        {isCreatureMode && creatureId && <button className="btn btn-sm btn-p" onClick={addCreature} style={{ fontSize: 12 }}>{label}</button>}
      </div>
    </div>
  );
}

// ── EncounterBuilder ──────────────────────────────────────────────────────────
// Shared between EncounterTab (mode='live') and LogTab (mode='prep').
// mode='live'  → shows "Begin Encounter →" → calls onCommit(setup)
// mode='prep'  → shows "Save to Session Prep" → calls onCommit(setup), no participant picker needed
export default function EncounterBuilder({
  mode = 'live',           // 'live' | 'prep'
  initialSetup = {},
  npcsFromLog = [],
  characters = [],
  sessionNumber,
  preparedEncounters = [],
  customRoundLimits = {},
  onCommit,                // fn(setup) — begin or save
  onCancel,
}) {
  const [s, setS] = useState({
    name: '',
    type: null,
    setting: null,
    settingIsCustom: false,
    desc: '',
    notes: '',
    bgUrl: '',
    selectedNPCs: [],
    participantIds: null,
    gridSize: 24,
    presetGridId: null,
    themeRow: null,
    gridTiles: {},
    ...initialSetup,
  });
  const upS = patch => setS(prev => ({ ...prev, ...patch }));
  const [savedGrids, setSavedGrids] = useState([]);

  useEffect(() => {
    supabase.from('games').select('settings').eq('id', GAME_ID).single().then(({ data }) => {
      const grids = data?.settings?.saved_battle_grids || [];
      setSavedGrids([...grids].sort((a, b) => (a.label || '').localeCompare(b.label || ''))); // label starts with environment type, so this sorts by environment first
    });
  }, []);

  const defaultName = `Session ${sessionNumber || '?'} — ${s.setting || '?'} — ${s.type || '?'}`;
  const diff = calcDifficulty(s.selectedNPCs || []);
  const diffPct = { Easy: 25, Moderate: 50, Hard: 75, Deadly: 100 }[diff] || 0;

  return (
    <div style={{ maxWidth: 660 }}>
      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '.75rem' }}>
        <button className="btn btn-sm" onClick={onCancel}>← Back</button>
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
          {mode === 'prep' ? 'Prepare Encounter' : 'New Encounter'}
        </span>
        {preparedEncounters.length > 0 && (
          <select style={{ fontSize: 12, marginLeft: 'auto' }} value="" onChange={e => {
            const p = preparedEncounters.find(p => p.id === e.target.value);
            if (p) upS({ type: p.type || s.type, setting: p.setting || s.setting, name: p.name || '', desc: p.notes || '', notes: p.notes || '', selectedNPCs: p.npcs || [], gridSize: p.gridSize || s.gridSize, bgUrl: p.bgUrl || '', presetGridId: p.presetGridId || null, gridTiles: p.gridTiles || {} });
          }}>
            <option value="">Load from prepared…</option>
            {preparedEncounters.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
      </div>

      <div className="card">
        {/* Name */}
        <div style={{ marginBottom: '1rem' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', display: 'block', marginBottom: '.4rem' }}>Encounter Name</span>
          <input value={s.name || ''} onChange={e => upS({ name: e.target.value })} style={{ width: '100%', fontSize: 15 }} placeholder={defaultName} />
        </div>

        {/* Type */}
        <div style={{ marginBottom: '1rem' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', display: 'block', marginBottom: '.4rem' }}>Type</span>
          <div>{['Action','Intrigue','Travel'].map(t => (
            <button key={t} className={`opt-btn ${s.type === t ? 'sel' : ''}`} onClick={() => upS({ type: t, name: '' })}>{t}</button>
          ))}</div>
          {s.type && (() => {
            const custom = customRoundLimits[s.type];
            const limit = (custom !== undefined && custom !== '') ? (+custom || null) : ROUND_LIMITS[s.type];
            return limit ? <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: '.3rem' }}>{limit} round limit</div> : null;
          })()}
        </div>

        {/* Prebuilt battle grid */}
        {savedGrids.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', display: 'block', marginBottom: '.4rem' }}>Prebuilt Grid <span style={{ fontWeight: 400, textTransform: 'none', fontSize: 12 }}>(optional)</span></span>
            <select value={s.presetGridId || ''} style={{ width: '100%' }} onChange={e => {
              const g = savedGrids.find(g => g.id === e.target.value);
              const keepManual = (s.selectedNPCs || []).filter(n => !n._fromPresetGrid);
              if (!g) { upS({ presetGridId: null, gridSize: 24, bgUrl: '', gridTiles: {}, themeRow: null, selectedNPCs: keepManual }); return; }
              // Prebuilt NPCs (built-in library only) painted onto this saved grid in the Battle Grid
              // Creator — carry their saved x/y through as gridX/gridY so beginEncounter places them
              // there directly instead of using its automatic column-based placement.
              const prebuilt = (g.prebuiltNpcs || [])
                .filter(n => n.x !== null && n.x !== undefined && n.y !== null && n.y !== undefined)
                .map(n => ({ ...n, id: n.id || `npc_preset_${Date.now()}_${Math.random()}`, gridX: n.x, gridY: n.y, _fromPresetGrid: true }));
              upS({ presetGridId: g.id, gridSize: g.size || 24, bgUrl: g.bgUrl || '', gridTiles: g.tiles || {}, themeRow: g.themeRow || 0, selectedNPCs: [...keepManual, ...prebuilt] });
            }}>
              <option value="">— None, set up manually —</option>
              {savedGrids.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
            </select>
          </div>
        )}

        {/* Battle grid size */}
        {!s.presetGridId && (
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', display: 'block', marginBottom: '.4rem' }}>Battle Grid Size</span>
            <div>{[12, 24, 36, 48].map(g => (
              <button key={g} className={`opt-btn ${(s.gridSize || 24) === g ? 'sel' : ''}`} onClick={() => upS({ gridSize: g })}>{g}×{g}</button>
            ))}</div>
          </div>
        )}

        {/* Setting */}
        <div style={{ marginBottom: '1rem' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', display: 'block', marginBottom: '.4rem' }}>Setting</span>
          <div>
            {['Streets','Sewers','Desert','Palace','Indoors',"Khan's Warcamp","Barracks Lounge"].map(t => (
              <button key={t} className={`opt-btn ${s.setting === t && !s.settingIsCustom ? 'sel' : ''}`} onClick={() => upS({ setting: t, settingIsCustom: false, name: '' })}>{t}</button>
            ))}
            <button className={`opt-btn ${s.settingIsCustom ? 'sel' : ''}`} onClick={() => upS({ setting: '', settingIsCustom: true, name: '' })}>Custom...</button>
          </div>
          {s.settingIsCustom && (
            <input type="text" value={s.setting || ''} onChange={e => upS({ setting: e.target.value })}
              placeholder="Type a setting name..." autoFocus style={{ marginTop: '.5rem', width: '100%' }} />
          )}
        </div>

        {/* GM Notes / Scene Description */}
        <div style={{ marginBottom: '1rem' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', display: 'block', marginBottom: '.4rem' }}>
            {mode === 'prep' ? 'GM Notes (hidden from players)' : 'Scene Description'}
          </span>
          <textarea rows={2} value={mode === 'prep' ? (s.notes || '') : (s.desc || '')}
            onChange={e => mode === 'prep' ? upS({ notes: e.target.value }) : upS({ desc: e.target.value })}
            placeholder={mode === 'prep' ? 'Plans, triggers, secrets...' : 'Describe the scene for players...'}
            style={{ width: '100%', resize: 'vertical' }} />
        </div>

        {/* Grid background image URL */}
        {!s.presetGridId && (
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', display: 'block', marginBottom: '.4rem' }}>
              Grid Background URL <span style={{ fontWeight: 400, textTransform: 'none', fontSize: 12 }}>(optional — shown faintly behind grid)</span>
            </span>
            <input type="text" value={s.bgUrl || ''} onChange={e => upS({ bgUrl: e.target.value })}
              placeholder="https://..." style={{ width: '100%' }} />
          </div>
        )}

        {/* NPCs */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.5rem' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em' }}>NPCs</span>
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
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '.4rem', padding: '3px 0', fontSize: 13, color: 'var(--text-secondary)', borderBottom: '1px solid rgba(107,78,40,.2)' }}>
                  <span style={{ flex: 1 }}>{n.name}</span>
                  {n.fromLog && <span style={{ fontSize: 11, color: 'var(--gold-dim)' }}>log</span>}
                  {n._fromPresetGrid && <span style={{ fontSize: 11, color: 'var(--gold-dim)' }}>grid ({n.gridX},{n.gridY})</span>}
                  {!n.fromLog && !n._fromPresetGrid && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>{n.personality}</span>}
                  <button className="btn btn-sm btn-d" style={{ fontSize: 11, padding: '1px 5px' }} onClick={() => upS({ selectedNPCs: s.selectedNPCs.filter((_, j) => j !== i) })}>×</button>
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginTop: '.5rem' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 60 }}>Difficulty:</span>
                <div className="diff-bar"><div className="diff-fill" style={{ width: `${diffPct}%`, background: diffColor(diff) }} /></div>
                <span style={{ fontSize: 13, fontWeight: 600, color: diffColor(diff), width: 70 }}>{diff}</span>
              </div>
            </div>
          )}
        </div>

        {/* Participants — only shown in live mode. Includes both PCs and Full NPCs (characters
            table rows with is_npc: true, e.g. a promoted named villain) — Full NPCs default to
            unchecked so they don't silently auto-join every encounter; PCs default to checked. */}
        {mode === 'live' && (
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', display: 'block', marginBottom: '.4rem' }}>Participants</span>
            {characters.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>No characters created yet.</div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
                {characters.map(c => {
                  const defaultIds = characters.filter(ch => !ch.is_npc).map(ch => ch.id);
                  const participantIds = s.participantIds || defaultIds;
                  const included = participantIds.includes(c.id);
                  return (
                    <label key={c.id} className="chk-row" style={{ border: '1px solid var(--border)', borderRadius: 5, padding: '.3rem .6rem', margin: 0, cursor: 'pointer', opacity: included ? 1 : .5 }}>
                      <input type="checkbox" checked={included} onChange={() => {
                        const current = s.participantIds || defaultIds;
                        const next = included ? current.filter(id => id !== c.id) : [...current, c.id];
                        upS({ participantIds: next });
                      }} />
                      {c.name}
                      {c.is_npc && <span style={{ fontSize: 10, color: 'var(--gold-dim)', marginLeft: 4 }}>NPC</span>}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <button className="btn btn-p" style={{ width: '100%' }} disabled={!s.type || !s.setting}
          onClick={() => onCommit({ ...s, name: s.name || defaultName })}>
          {mode === 'prep' ? '💾 Save to Session Prep' : 'Begin Encounter →'}
        </button>
      </div>
    </div>
  );
}
