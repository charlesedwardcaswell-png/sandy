import React, { useState, useEffect } from 'react';
import { SCHOOL_DATA, FACTION_SCHOOLS, SUBFACTION_BONUSES, FACTIONS_LIST, FACTIONS_DATA, ADVANTAGES, DISADVANTAGES, WEAPONS_LIST, GEAR_LIST, TRAITS, SAHIR_SCHOOLS } from '../data/constants';
import { WoundBadge, SkillDots, FacIcon, CharacterSilhouette, Loading, Empty } from './UI';
import { getWoundRank, getArchetype, buildCharacterFromForm, isSahirSchool } from '../lib/utils';
import { GAME_ID } from '../data/constants';

// ── Character Tab ─────────────────────────────────────────────────────────────
export default function CharacterTab({ isGM, isPCView, isPlayer, characters, onUpdateCharacter, onCreateCharacter, onDeleteCharacter, onCreateNPC, myCharId, onClaimCharacter, playerPassword, onSavePlayerPassword, jumpToCharId, onClearJump }) {
  const [view, setView] = useState('sheet');
  const [selId, setSelId] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [showDel, setShowDel] = useState(0);
  const [addEq, setAddEq] = useState('');

  // Jump to a specific character (e.g. from NPC tab)
  useEffect(() => {
    if (jumpToCharId && characters.find(c => c.id === jumpToCharId)) {
      setSelId(jumpToCharId);
      setView('sheet');
      if (onClearJump) onClearJump();
    }
  }, [jumpToCharId, characters, onClearJump]);

  // Set initial selection
  useEffect(() => {
    if (characters.length > 0 && !selId) {
      setSelId(characters[0].id);
    }
  }, [characters, selId]);

  // Player view — see all characters, create own, edit any (honour system)
  if (!isGM && !isPCView) {
    if (view === 'create') {
      return (
        <div>
          <button className="btn btn-sm" style={{ marginBottom: '1rem' }} onClick={() => setView('sheet')}>← Back</button>
          <CharacterCreation
            onComplete={async (charData) => { await onCreateCharacter(charData); setView('sheet'); }}
            onCancel={() => setView('sheet')}
          />
        </div>
      );
    }

    return (
      <div>
        <div style={{ marginBottom: '.75rem', display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap' }}>
          {characters.length > 0 && (
            <select className="pc-sel" value={selId || ''} onChange={e => setSelId(e.target.value)} style={{ flex: 1 }}>
              {characters.map(c => <option key={c.id} value={c.id}>{c.name} — {c.school} R{c.school_rank}</option>)}
            </select>
          )}
          <button className="btn btn-sm btn-p" onClick={() => setView('create')}>
            <i className="ti ti-plus" style={{ fontSize: 10 }} /> New Character
          </button>
          {selId && onClaimCharacter && (
            <button
              className={`btn btn-sm ${myCharId === selId ? 'btn-p' : ''}`}
              onClick={() => onClaimCharacter(selId)}
              title="Mark this as your character — your card will be highlighted in encounters"
              style={myCharId === selId ? {} : { borderColor: 'var(--gold-dim)', color: 'var(--gold-dim)' }}
            >
              {myCharId === selId
                ? <><i className="ti ti-user-check" style={{ fontSize: 10 }} /> My Character</>
                : <><i className="ti ti-user-question" style={{ fontSize: 10 }} /> Claim as Mine</>
              }
            </button>
          )}
        </div>
        {characters.length === 0 && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '1rem' }}>
            No characters yet — create yours above.
          </div>
        )}
        {selId && characters.find(c => c.id === selId) && (
          <CharacterSheet
            char={characters.find(c => c.id === selId)}
            isGM={false} canEdit={true}
            onUpdate={onUpdateCharacter}
          />
        )}
      </div>
    );
  }

  // GM view
  const char = selId ? characters.find(c => c.id === selId) : null;

  return (
    <div>
      {/* GM top bar */}
      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '.3rem' }}>
          <button className={`btn btn-sm ${view === 'sheet' ? 'btn-p' : ''}`} onClick={() => setView('sheet')}>
            <i className="ti ti-user" style={{ fontSize: 10 }} /> Characters
          </button>
          <button className={`btn btn-sm ${view === 'create' ? 'btn-p' : ''}`} onClick={() => setView('create')}>
            <i className="ti ti-plus" style={{ fontSize: 10 }} /> New PC
          </button>
          {onCreateNPC && (
            <button className={`btn btn-sm ${view === 'npc' ? 'btn-p' : ''}`} onClick={() => setView('npc')}>
              <i className="ti ti-user-bolt" style={{ fontSize: 10 }} /> New NPC
            </button>
          )}
          <button className={`btn btn-sm ${view === 'players' ? 'btn-p' : ''}`} onClick={() => setView('players')}>
            <i className="ti ti-users" style={{ fontSize: 10 }} /> Players
          </button>
        </div>

        {view === 'sheet' && characters.length > 0 && (
          <>
            <select className="pc-sel" value={selId || ''} onChange={e => { setSelId(e.target.value); setShowDel(0); }}>
              {characters.map(c => <option key={c.id} value={c.id}>{c.name} — {c.school} R{c.school_rank}</option>)}
            </select>
            <button className={`btn btn-sm ${editMode ? 'btn-p' : ''}`} onClick={() => setEditMode(!editMode)}>
              <i className={`ti ${editMode ? 'ti-lock' : 'ti-edit'}`} style={{ fontSize: 10 }} /> {editMode ? 'Lock' : 'Edit'}
            </button>
            <button className="btn btn-sm btn-d" onClick={() => setShowDel(s => s < 2 ? s + 1 : s)}>
              {showDel === 0 ? 'Delete' : showDel === 1 ? 'Really?' : 'CONFIRM'}
            </button>
            {showDel === 2 && char && (
              <button className="btn btn-sm btn-d" onClick={async () => { await onDeleteCharacter(char.id); setSelId(null); setShowDel(0); }}>
                Yes, delete {char.name}
              </button>
            )}
          </>
        )}
      </div>

      {/* Views */}
      {view === 'sheet' && (
        char
          ? <CharacterSheet char={char} isGM={true} isPCView={isPCView} canEdit={editMode} onUpdate={onUpdateCharacter} addEq={addEq} setAddEq={setAddEq} />
          : <Empty icon="ti-user" message="No characters yet." action={<button className="btn btn-p" onClick={() => setView('create')}>Create First Character</button>} />
      )}

      {view === 'create' && (
        <CharacterCreation onComplete={async (charData) => {
          await onCreateCharacter(charData);
          setView('sheet');
        }} onCancel={() => setView('sheet')} />
      )}

      {view === 'npc' && onCreateNPC && (
        <NPCQuickCreate onComplete={async (npcData) => {
          await onCreateNPC(npcData);
          setView('sheet');
        }} onCancel={() => setView('sheet')} />
      )}

      {view === 'players' && (
        <PlayerManagement playerPassword={playerPassword} onSavePlayerPassword={onSavePlayerPassword} />
      )}
    </div>
  );
}

// ── Character Sheet ───────────────────────────────────────────────────────────
function CharacterSheet({ char, isGM, isPCView, canEdit, onUpdate, addEq, setAddEq }) {
  const wR = getWoundRank(char.current_wounds, char.max_wounds);
  const xpAvail = (char.xp_total || 0) - (char.xp_spent || 0);

  const update = (field, value) => onUpdate(char.id, { [field]: value });

  const toggleEqInUse = (idx) => {
    const eq = [...(char.equipment || [])];
    eq[idx] = { ...eq[idx], inUse: !eq[idx].inUse };
    update('equipment', eq);
  };

  const removeEq = (idx) => {
    const eq = (char.equipment || []).filter((_, i) => i !== idx);
    update('equipment', eq);
  };

  const addEquipment = () => {
    if (!addEq) return;
    const w = WEAPONS_LIST.find(x => x.name === addEq);
    const newItem = w
      ? { name: addEq, dr: w.dr, skill: w.skill, equipped: true, inUse: false }
      : { name: addEq, dr: '', skill: '', equipped: true, inUse: false };
    update('equipment', [...(char.equipment || []), newItem]);
    setAddEq && setAddEq('');
  };

  return (
    <div className="g2">
      {/* Left column */}
      <div>
        {/* Identity */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '.75rem' }}>
            <div style={{ width: 44, height: 56, borderRadius: 5, background: 'var(--bg-panel)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
              <CharacterSilhouette school={char.school} size={36} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{char.name}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{char.faction} · {char.family}</div>
              <div style={{ fontSize: 10, color: 'var(--gold-dim)' }}>{char.school} · Rank {char.school_rank}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
            {[['Insight Rank', char.insight_rank], ['Integrity', char.integrity], ['Reputation', char.reputation], ['Status', char.status]].map(([l, v]) => (
              <div key={l} className="srow"><span className="sl">{l}</span><span className="sv">{v}</span></div>
            ))}
          </div>
        </div>

        {/* Void */}
        <div className="card">
          <div className="card-title">Void Points</div>
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            {Array.from({ length: char.void || 2 }, (_, i) => (
              <div key={i}
                onClick={() => update('current_void', i < char.current_void ? i : i + 1)}
                style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${i < char.current_void ? 'var(--gold)' : 'var(--border)'}`, background: i < char.current_void ? 'var(--gold)' : 'transparent', cursor: 'pointer', transition: 'all .15s' }}
              />
            ))}
            <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 4 }}>{char.current_void}/{char.void || 2}</span>
            <button className="btn btn-sm" style={{ marginLeft: 'auto' }} onClick={() => update('current_void', Math.max(0, char.current_void - 1))}>
              Spend Void
            </button>
          </div>
        </div>

        {/* Wounds */}
        <div className="card">
          <div className="card-title">Wounds — <span style={{ color: 'var(--red)' }}>{['Healthy','Nicked','Grazed','Hurt','Injured','Crippled','Down','Out'][wR]}</span></div>
          <div style={{ display: 'flex', gap: 4, marginBottom: '.5rem', flexWrap: 'wrap' }}>
            {['Healthy','Nicked','Grazed','Hurt','Injured','Crippled','Down','Out'].map((r, i) => {
              const col = ['#4a8a40','#8a8a30','#a87830','#c86030','#c84030','#a02828','#801818','#600010'][i];
              return (
                <div key={i} style={{ fontSize: 9, color: i <= wR && char.current_wounds > 0 ? col : 'var(--text-muted)', textAlign: 'center' }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: i < wR || (i === wR && char.current_wounds > 0) ? col : 'var(--bg-panel)', border: `1px solid ${col}`, margin: '0 auto 2px' }} />
                  {r.slice(0, 3)}
                </div>
              );
            })}
          </div>
          {(isGM && !isPCView) && (
            <div style={{ display: 'flex', gap: 5 }}>
              <button className="btn btn-sm" onClick={() => update('current_wounds', Math.max(0, char.current_wounds - 1))}>− Heal</button>
              <button className="btn btn-sm btn-d" onClick={() => update('current_wounds', char.current_wounds + 1)}>+ Wound</button>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', alignSelf: 'center' }}>{char.current_wounds} wounds</span>
            </div>
          )}
        </div>

        {/* XP */}
        <div className="card">
          <div className="card-title">Experience Points</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, marginBottom: '.5rem' }}>
            {[['Total', char.xp_total || 0, 'var(--gold)'], ['Spent', char.xp_spent || 0, 'var(--text-secondary)'], ['Available', xpAvail, xpAvail > 0 ? 'var(--green)' : 'var(--red)']].map(([l, v, col]) => (
              <div key={l} style={{ textAlign: 'center', background: 'var(--bg-panel)', borderRadius: 4, padding: '.4rem' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: col }}>{v}</div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{l}</div>
              </div>
            ))}
          </div>
          {(char.xp_log || []).slice(-3).map((e, i) => (
            <div key={i} style={{ fontSize: 10, color: 'var(--text-muted)', padding: '2px 0', borderBottom: '1px solid rgba(107,78,40,.2)' }}>
              <span style={{ color: 'var(--gold)' }}>+{e.amount} XP</span> — {e.reason}
            </div>
          ))}
          {isGM && !isPCView && (
            <div style={{ marginTop: '.5rem', display: 'flex', gap: '.4rem', alignItems: 'center' }}>
              <input type="number" min={0} max={20} defaultValue={3} style={{ width: 50 }} id={`xp-${char.id}`} />
              <button className="btn btn-sm btn-p" onClick={() => {
                const amt = +document.getElementById(`xp-${char.id}`).value || 0;
                const newLog = [...(char.xp_log || []), { amount: amt, reason: 'GM grant', date: new Date().toLocaleDateString() }];
                update('xp_total', (char.xp_total || 0) + amt);
                update('xp_log', newLog);
              }}>+ Grant XP</button>
            </div>
          )}
        </div>

        {/* Equipment */}
        <div className="card">
          <div className="card-title">Equipment</div>
          {(char.equipment || []).map((e, i) => (
            <div key={i} className="eq-row">
              <input type="checkbox" checked={e.inUse || false} onChange={() => toggleEqInUse(i)} style={{ accentColor: 'var(--gold)' }} title="In use" />
              <span style={{ flex: 1, color: e.inUse ? 'var(--text-primary)' : 'var(--text-muted)' }}>{e.name}</span>
              {e.dr && <span style={{ fontSize: 9, color: 'var(--gold-dim)' }}>{e.dr}</span>}
              {canEdit && <button className="btn btn-sm btn-d" style={{ padding: '1px 5px', fontSize: 9 }} onClick={() => removeEq(i)}>×</button>}
            </div>
          ))}
          {canEdit && (
            <div style={{ display: 'flex', gap: '.4rem', marginTop: '.5rem', flexWrap: 'wrap' }}>
              <select value={addEq || ''} onChange={e => setAddEq && setAddEq(e.target.value)} style={{ flex: 1 }}>
                <option value="">Add equipment...</option>
                {WEAPONS_LIST.map(w => <option key={w.name} value={w.name}>{w.name} ({w.dr})</option>)}
                {GEAR_LIST.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <button className="btn btn-sm btn-p" disabled={!addEq} onClick={addEquipment}>Add</button>
            </div>
          )}
        </div>
      </div>

      {/* Right column */}
      <div>
        {/* Rings */}
        <div className="card">
          <div className="card-title">Rings & Traits</div>
          <div className="g5" style={{ marginBottom: '.6rem' }}>
            {[['Air', char.air, `${char.reflexes}/${char.awareness}`], ['Earth', char.earth, `${char.stamina}/${char.willpower}`], ['Fire', char.fire, `${char.agility}/${char.intelligence}`], ['Water', char.water, `${char.strength}/${char.perception}`], ['Void', char.void, char.reflexes]].map(([ring, val, sub]) => (
              <div key={ring} className="ring-box">
                <div className="ring-name">{ring}</div>
                <div className="ring-val">{val}</div>
                <div className="ring-tr">{sub}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            Armor TN: <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{5 + char.reflexes * 5 + ((char.equipment || []).find(e => e.inUse && e.name?.includes('Armor')) ? 5 : 0)}</span>
            <span style={{ marginLeft: 10 }}>Init: <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{char.reflexes}k{char.air}</span></span>
          </div>
        </div>

        {/* Skills */}
        <div className="card">
          <div className="card-title">Skills</div>
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {(char.skills || []).map(s => (
              <div key={s.name} className="skill-row">
                <span className={`skill-nm ${s.school ? 'sc' : ''}`}>{s.name}</span>
                <SkillDots rank={s.rank} />
                {canEdit && (
                  <div style={{ display: 'flex', gap: 2, marginLeft: 4 }}>
                    <button className="trait-btn" onClick={() => {
                      const skills = (char.skills || []).map(x => x.name === s.name ? { ...x, rank: Math.max(0, x.rank - 1) } : x);
                      update('skills', skills);
                    }}>−</button>
                    <button className="trait-btn" onClick={() => {
                      const skills = (char.skills || []).map(x => x.name === s.name ? { ...x, rank: Math.min(10, x.rank + 1) } : x);
                      update('skills', skills);
                    }}>+</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Techniques */}
        <div className="card">
          <div className="card-title">Techniques</div>
          {Object.entries(char.techniques || {}).map(([r, n]) => (
            <div key={r} style={{ fontSize: 11, padding: '2px 0', borderBottom: '1px solid rgba(107,78,40,.2)' }}>
              <span style={{ color: 'var(--text-muted)', marginRight: 5 }}>R{r}</span>
              <span style={{ color: 'var(--text-primary)' }}>{n}</span>
            </div>
          ))}
          {canEdit && (
            <div style={{ marginTop: '.5rem', fontSize: 10, color: 'var(--text-muted)' }}>
              School Rank:
              <input type="number" min={1} max={8} value={char.school_rank || 1} style={{ width: 50, marginLeft: 6 }}
                onChange={e => {
                  const rank = +e.target.value;
                  const sd = SCHOOL_DATA[char.school];
                  const techs = {};
                  for (let i = 1; i <= rank; i++) { if (sd?.techniques?.[i]) techs[i] = sd.techniques[i]; }
                  update('school_rank', rank);
                  update('techniques', techs);
                }} />
            </div>
          )}
        </div>

        {/* Spells (Sahir only) */}
        {isSahirSchool(char.school) && (char.spells || []).length > 0 && (
          <div className="card">
            <div className="card-title">Spells</div>
            {char.spell_emphasis && <div style={{ fontSize: 10, color: 'var(--gold-dim)', marginBottom: '.4rem' }}>Emphasis: {char.spell_emphasis} (+1k1)</div>}
            {(char.spells || []).map(s => (
              <div key={s} style={{ fontSize: 11, padding: '2px 0', borderBottom: '1px solid rgba(107,78,40,.2)', color: 'var(--text-secondary)' }}>• {s}</div>
            ))}
          </div>
        )}

        {/* Advantages / Disadvantages */}
        {((char.advantages || []).length > 0 || (char.disadvantages || []).length > 0) && (
          <div className="card">
            {(char.advantages || []).length > 0 && (
              <>
                <div className="card-title">Advantages</div>
                {char.advantages.map(a => (
                  <div key={a.name} style={{ fontSize: 11, color: 'var(--text-secondary)', padding: '2px 0', borderBottom: '1px solid rgba(107,78,40,.2)' }}>
                    {a.name} <span style={{ color: 'var(--gold-dim)', fontSize: 9 }}>({a.cost} pts)</span>
                  </div>
                ))}
              </>
            )}
            {(char.disadvantages || []).length > 0 && (
              <>
                <div className="card-title" style={{ marginTop: '.5rem' }}>Disadvantages</div>
                {char.disadvantages.map(d => (
                  <div key={d.name} style={{ fontSize: 11, color: 'var(--text-secondary)', padding: '2px 0', borderBottom: '1px solid rgba(107,78,40,.2)' }}>
                    {d.name} <span style={{ color: 'var(--red)', fontSize: 9 }}>(+{d.value} CP)</span>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Character Creation ────────────────────────────────────────────────────────
function CharacterCreation({ onComplete, onCancel }) {
  const [step, setStep] = useState(1);
  const [faction, setFaction] = useState('');
  const [subfaction, setSubfaction] = useState('');
  const [school, setSchool] = useState('');
  const [name, setName] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [pcPassword, setPcPassword] = useState('');
  const [traits, setTraits] = useState({ Reflexes:2,Awareness:2,Stamina:2,Willpower:2,Agility:2,Intelligence:2,Strength:2,Perception:2,Void:2 });
  const [skills, setSkills] = useState({});
  const [advantages, setAdvantages] = useState([]);
  const [disadvantages, setDisadvantages] = useState([]);
  const [eboniteAny, setEboniteAny] = useState('Strength');
  const [selectedSpells, setSelectedSpells] = useState([]);
  const [spellEmphasis, setSpellEmphasis] = useState('');
  const TOTAL_CP = 45;

  const schoolIsSahir = isSahirSchool(school);
  const startingSpells = school === "Ra'Shari Diviner" ? 6 : 3;
  const subfactions = faction ? Object.keys(SUBFACTION_BONUSES[faction] || {}) : [];
  const schools = faction ? FACTION_SCHOOLS[faction] || [] : [];

  function getBaseTraitValue(trait) {
    let base = 2;
    const sd = SCHOOL_DATA[school];
    if (sd?.bonus_trait === trait) base = 3;
    if (subfaction && SUBFACTION_BONUSES[faction]) {
      const bonus = SUBFACTION_BONUSES[faction][subfaction];
      if (bonus === trait || (bonus === 'Any' && trait === eboniteAny)) base = Math.max(base, 3);
      if (bonus === trait && sd?.bonus_trait === trait) base = 4;
    }
    if (trait === 'Void' && (faction === 'Ashalan' || faction === 'Senpet')) base = Math.max(base, 3);
    if (trait === 'Void' && faction === 'Yodotai') base = 3; // from subfaction bonus on Strength, not Void
    return base;
  }

  function initTraits(s, sf) {
    const sd = SCHOOL_DATA[s]; if (!sd) return;
    const t = { Reflexes:2,Awareness:2,Stamina:2,Willpower:2,Agility:2,Intelligence:2,Strength:2,Perception:2,Void:2 };
    if (sd.bonus_trait && sd.bonus_trait !== 'Void') t[sd.bonus_trait] = 3;
    if (sd.bonus_trait === 'Void') t.Void = 3;
    const sfBonus = sf ? SUBFACTION_BONUSES[faction]?.[sf] : '';
    if (sfBonus && sfBonus !== 'Any' && sfBonus !== 'Void' && t[sfBonus] !== undefined) {
      t[sfBonus] = Math.max(t[sfBonus], 3);
      if (sd.bonus_trait === sfBonus) t[sfBonus] = 4;
    }
    if (sfBonus === 'Void') t.Void = Math.max(t.Void, 3);
    if (faction === 'Ashalan' || faction === 'Senpet') t.Void = Math.max(t.Void, 3);
    if (faction === 'Yodotai') t.Strength = Math.max(t.Strength, 3);
    setTraits(t);
    const sk = {}; (sd.skills || []).forEach(s => { sk[s] = 1; });
    setSkills(sk);
  }

  // CP calculation
  const traitCost = Object.entries(traits).reduce((s, [k, v]) => {
    const base = getBaseTraitValue(k);
    return s + Array.from({ length: v - base }, (_, i) => (base + i + 1) * 4).reduce((a, b) => a + b, 0);
  }, 0);
  const skillCost = Object.entries(skills).reduce((s, [, v]) => s + Array.from({ length: v }, (_, i) => i + 1).reduce((a, b) => a + b, 0), 0);
  const advCost = advantages.reduce((s, a) => s + a.cost, 0);
  const disCost = disadvantages.reduce((s, d) => s + d.value, 0);
  const cpSpent = traitCost + skillCost + advCost;
  const cpAvailable = TOTAL_CP + disCost;
  const cpRemaining = cpAvailable - cpSpent;
  const disTotal = disadvantages.reduce((s, d) => s + d.value, 0);

  function adjustTrait(trait, delta) {
    const cur = traits[trait], base = getBaseTraitValue(trait);
    const next = cur + delta;
    if (next < base || next > base + 2) return;
    if (delta > 0 && next * 4 > cpRemaining) return;
    setTraits(t => ({ ...t, [trait]: next }));
  }

  function adjustSkill(skill, delta) {
    const cur = skills[skill] || 0, next = cur + delta;
    if (next < 0 || next > 7) return;
    if (delta > 0 && next > cpRemaining) return;
    setSkills(s => ({ ...s, [skill]: next }));
  }

  const steps = schoolIsSahir
    ? ['Faction','Sub-faction','School','Traits & Skills','Spells','Advantages','Identity']
    : ['Faction','Sub-faction','School','Traits & Skills','Advantages','Identity'];
  const spellStep = schoolIsSahir ? 5 : null;
  const advStep = schoolIsSahir ? 6 : 5;
  const identityStep = schoolIsSahir ? 7 : 6;

  const handleComplete = () => {
    const charData = buildCharacterFromForm({ faction, subfaction, school, name, playerName, pcPassword, traits, skills, advantages, disadvantages, selectedSpells, spellEmphasis });
    onComplete({ ...charData, game_id: GAME_ID });
  };

  return (
    <div style={{ maxWidth: 700 }}>
      {onCancel && <button className="btn btn-sm" style={{ marginBottom: '1rem' }} onClick={onCancel}>← Back</button>}

      {/* Progress */}
      <div className="cc-progress">{steps.map((_, i) => <div key={i} className={`cc-prog-dot ${i < step - 1 ? 'done' : i === step - 1 ? 'active' : ''}`} />)}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: '.25rem' }}>Step {step}: {steps[step - 1]}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        {step === 1 ? 'Choose your faction.' : step === 2 ? 'Choose your sub-faction — grants a bonus trait.' : step === 3 ? 'Choose your school.' : step === 4 ? 'Spend your 45 Character Points.' : step === spellStep ? `Select starting ${school === "Ra'Shari Diviner" ? 'Cokaloi (6)' : 'spells (3)'}.` : step === advStep ? 'Choose advantages and disadvantages. Max 10 points from disadvantages.' : 'Name your character and set a login password.'}
      </div>

      {/* Step 1: Faction */}
      {step === 1 && (
        <div>
          {FACTIONS_LIST.map(f => (
            <div key={f} className={`faction-card ${faction === f ? 'sel' : ''}`} onClick={() => setFaction(f)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                <FacIcon name={f} size={18} />
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>{f}</span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', flex: 1 }}>{FACTIONS_DATA.find(x => x.name === f)?.tagline}</span>
                {faction === f && <i className="ti ti-check" style={{ color: 'var(--gold)', fontSize: 14 }} />}
              </div>
              {faction === f && <div style={{ marginTop: '.4rem', fontSize: 10, color: 'var(--text-secondary)' }}>Schools: {(FACTION_SCHOOLS[f] || []).join(', ')}</div>}
            </div>
          ))}
          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-p" disabled={!faction} onClick={() => setStep(2)}>Next →</button>
          </div>
        </div>
      )}

      {/* Step 2: Sub-faction */}
      {step === 2 && (
        <div>
          {Object.entries(SUBFACTION_BONUSES[faction] || {}).map(([sf, trait]) => (
            <div key={sf} className={`faction-card ${subfaction === sf ? 'sel' : ''}`} onClick={() => setSubfaction(sf)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>{sf}</span>
                <span style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 600 }}>+1 {trait === 'Any' ? 'Any Trait' : trait}</span>
                {subfaction === sf && <i className="ti ti-check" style={{ color: 'var(--gold)', fontSize: 14 }} />}
              </div>
              {subfaction === sf && trait === 'Any' && (
                <div style={{ marginTop: '.5rem' }}>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', marginRight: '.5rem' }}>Choose trait:</span>
                  <select value={eboniteAny} onChange={e => setEboniteAny(e.target.value)} style={{ fontSize: 11 }}>
                    {TRAITS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              )}
            </div>
          ))}
          <div style={{ marginTop: '1rem', display: 'flex', gap: '.5rem', justifyContent: 'space-between' }}>
            <button className="btn" onClick={() => setStep(1)}>← Back</button>
            <button className="btn btn-p" disabled={!subfaction} onClick={() => setStep(3)}>Next →</button>
          </div>
        </div>
      )}

      {/* Step 3: School */}
      {step === 3 && (
        <div>
          {schools.map(s => {
            const sd = SCHOOL_DATA[s]; if (!sd) return null;
            return (
              <div key={s} className={`school-card ${school === s ? 'sel' : ''}`} onClick={() => { setSchool(s); initTraits(s, subfaction); }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.25rem' }}>
                  <CharacterSilhouette school={s} size={24} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>{s}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{sd.type} · Integrity {sd.integrity} · +1 {sd.bonus_trait}</div>
                  </div>
                  {school === s && <i className="ti ti-check" style={{ color: 'var(--gold)', fontSize: 14, marginLeft: 'auto' }} />}
                </div>
                {school === s && (
                  <div style={{ marginTop: '.5rem', paddingTop: '.5rem', borderTop: '1px solid rgba(107,78,40,.3)' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: '.25rem' }}>School Skills:</div>
                    <div style={{ fontSize: 10, color: 'var(--gold-light)' }}>{sd.skills.join(', ')}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: '.25rem' }}>R1 Technique: <span style={{ color: 'var(--text-secondary)' }}>{sd.techniques?.[1] || '—'}</span></div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: '.25rem' }}>Equipment: <span style={{ color: 'var(--text-secondary)' }}>{sd.equipment?.join(', ')}</span></div>
                  </div>
                )}
              </div>
            );
          })}
          <div style={{ marginTop: '1rem', display: 'flex', gap: '.5rem', justifyContent: 'space-between' }}>
            <button className="btn" onClick={() => setStep(2)}>← Back</button>
            <button className="btn btn-p" disabled={!school} onClick={() => setStep(4)}>Next →</button>
          </div>
        </div>
      )}

      {/* Step 4: Traits & Skills */}
      {step === 4 && (
        <div>
          <div className="cp-meter">
            <div><div className="cp-val" style={{ color: cpRemaining < 0 ? 'var(--red)' : 'var(--gold)' }}>{cpRemaining}</div><div className="cp-label">CP Remaining</div></div>
            <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--bg-mid)', margin: '0 .75rem', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 3, background: cpRemaining < 0 ? 'var(--red)' : 'var(--gold)', width: `${Math.max(0, Math.min(100, (cpAvailable - cpRemaining) / cpAvailable * 100))}%`, transition: 'width .2s' }} />
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{cpSpent}/{cpAvailable} spent{disCost > 0 ? ` (+${disCost} dis)` : ''}</div>
          </div>
          <div className="g2">
            <div className="card">
              <div className="card-title">Traits</div>
              {[...TRAITS, 'Void'].map(t => {
                const base = getBaseTraitValue(t), cur = traits[t] || 2;
                return (
                  <div key={t} className="trait-row">
                    <span className="trait-label" style={{ color: cur > base ? 'var(--gold-light)' : 'var(--text-muted)' }}>{t}</span>
                    <button className="trait-btn" onClick={() => adjustTrait(t, -1)} disabled={cur <= base}>−</button>
                    <span className="trait-val">{cur}</span>
                    <button className="trait-btn" onClick={() => adjustTrait(t, 1)} disabled={cur >= base + 2}>+</button>
                    <span style={{ fontSize: 9, color: 'var(--text-muted)', marginLeft: 4 }}>base {base}</span>
                  </div>
                );
              })}
            </div>
            <div className="card">
              <div className="card-title">Skills</div>
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {(SCHOOL_DATA[school]?.skills || []).map(s => (
                  <div key={s} className="skill-row">
                    <span className="skill-nm sc" style={{ flex: 1 }}>{s}</span>
                    <button className="trait-btn" onClick={() => adjustSkill(s, -1)} disabled={(skills[s] || 0) <= 1}>−</button>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gold)', width: 20, textAlign: 'center' }}>{skills[s] || 0}</span>
                    <button className="trait-btn" onClick={() => adjustSkill(s, 1)} disabled={(skills[s] || 0) >= 7}>+</button>
                  </div>
                ))}
                <div style={{ fontSize: 10, color: 'var(--text-muted)', padding: '.4rem 0', borderTop: '1px solid var(--border)', marginTop: '.25rem' }}>Non-school skills</div>
                {['Athletics','Brawling','Commerce','Etiquette','Medicine','Stealth','Investigation','Calligraphy'].filter(s => !(SCHOOL_DATA[school]?.skills || []).includes(s)).map(s => (
                  <div key={s} className="skill-row">
                    <span className="skill-nm" style={{ flex: 1 }}>{s}</span>
                    <button className="trait-btn" onClick={() => adjustSkill(s, -1)} disabled={!(skills[s]) || skills[s] <= 0}>−</button>
                    <span style={{ fontSize: 13, fontWeight: 600, color: (skills[s] || 0) > 0 ? 'var(--gold)' : 'var(--text-muted)', width: 20, textAlign: 'center' }}>{skills[s] || 0}</span>
                    <button className="trait-btn" onClick={() => adjustSkill(s, 1)}>+</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '.5rem', justifyContent: 'space-between' }}>
            <button className="btn" onClick={() => setStep(3)}>← Back</button>
            <button className="btn btn-p" disabled={cpRemaining < 0} onClick={() => setStep(spellStep || advStep)}>Next →</button>
          </div>
        </div>
      )}

      {/* Step 5: Advantages */}
      {step === advStep && (
        <div>
          <div className="cp-meter">
            <div><div className="cp-val">{cpRemaining}</div><div className="cp-label">CP Remaining</div></div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>Disadvantage cap: {disTotal}/10</div>
          </div>
          <div className="g2">
            <div className="card">
              <div className="card-title">Advantages</div>
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {ADVANTAGES.map(a => {
                  const has = advantages.find(x => x.name === a.name);
                  return (
                    <div key={a.name} className="adv-item">
                      <span className="adv-cost">{a.cost}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: has ? 'var(--gold)' : 'var(--text-primary)' }}>{a.name}</div>
                        <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{a.desc}</div>
                      </div>
                      <button className="btn btn-sm" style={{ color: has ? 'var(--red)' : 'inherit' }}
                        onClick={() => has ? setAdvantages(p => p.filter(x => x.name !== a.name)) : (a.cost <= cpRemaining && setAdvantages(p => [...p, a]))}>
                        {has ? 'Remove' : 'Add'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="card">
              <div className="card-title">Disadvantages <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>(gain CP, max 10)</span></div>
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {DISADVANTAGES.map(d => {
                  const has = disadvantages.find(x => x.name === d.name);
                  return (
                    <div key={d.name} className="adv-item">
                      <span className="adv-cost neg">+{d.value}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: has ? 'var(--red)' : 'var(--text-primary)' }}>{d.name}</div>
                        <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{d.desc}</div>
                      </div>
                      <button className="btn btn-sm" style={{ color: has ? 'var(--gold)' : 'inherit' }}
                        onClick={() => has ? setDisadvantages(p => p.filter(x => x.name !== d.name)) : (disTotal + d.value <= 10 && setDisadvantages(p => [...p, d]))}>
                        {has ? 'Remove' : 'Add'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '.5rem', justifyContent: 'space-between' }}>
            <button className="btn" onClick={() => setStep(spellStep || 4)}>← Back</button>
            <button className="btn btn-p" onClick={() => setStep(identityStep)}>Next →</button>
          </div>
        </div>
      )}

      {/* Identity step */}
      {step === identityStep && (
        <div>
          <div className="card">
            <div className="card-title">Character Identity</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              <div><label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: '.25rem' }}>Character Name *</label><input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Enter character name" style={{ width: '100%' }} /></div>
              <div><label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: '.25rem' }}>Player Name</label><input type="text" value={playerName} onChange={e => setPlayerName(e.target.value)} placeholder="Enter player name" style={{ width: '100%' }} /></div>
              <div><label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: '.25rem' }}>Character Password <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(player uses this to log in)</span></label><input type="text" value={pcPassword} onChange={e => setPcPassword(e.target.value)} placeholder="Set a password for this character" style={{ width: '100%' }} /></div>
            </div>
          </div>
          <div className="card">
            <div className="card-title">Summary</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
              {[['Faction', faction], ['Sub-faction', subfaction], ['School', school], ['Type', SCHOOL_DATA[school]?.type || '—'], ['Integrity', SCHOOL_DATA[school]?.integrity || '—'], ['Starting Copper', SCHOOL_DATA[school]?.starting_copper || 0]].map(([l, v]) => (
                <div key={l} className="srow"><span className="sl">{l}</span><span className="sv">{v}</span></div>
              ))}
            </div>
            <div style={{ marginTop: '.5rem', fontSize: 10, color: 'var(--text-muted)' }}>
              R1 Technique: <span style={{ color: 'var(--text-secondary)' }}>{SCHOOL_DATA[school]?.techniques?.[1] || '—'}</span>
            </div>
          </div>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '.5rem', justifyContent: 'space-between' }}>
            <button className="btn" onClick={() => setStep(advStep)}>← Back</button>
            <button className="btn btn-p btn-lg" disabled={!name} onClick={handleComplete}><i className="ti ti-check" /> Create Character</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Player Management ─────────────────────────────────────────────────────────
function PlayerManagement({ playerPassword, onSavePlayerPassword }) {
  const [pw, setPw] = useState(playerPassword || '');
  const [saved, setSaved] = useState(false);

  const save = async () => {
    await onSavePlayerPassword(pw);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: '.5rem' }}>Player Access</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
        Set a single password for all players. Share it with your group. Anyone who enters it logs in as a Player and can see all characters and edit any of them — trust your players to only touch their own.
      </div>

      <div className="card">
        <div className="card-title">Player Password</div>
        <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
          <input
            type="text"
            value={pw}
            onChange={e => { setPw(e.target.value); setSaved(false); }}
            placeholder="Set player password..."
            style={{ flex: 1 }}
            onKeyDown={e => e.key === 'Enter' && save()}
          />
          <button className="btn btn-p" onClick={save}>
            {saved ? '✓ Saved' : 'Save'}
          </button>
        </div>
        {playerPassword && (
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: '.5rem' }}>
            Current password: <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{playerPassword}</span>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-title">GM Password</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          Current: <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>gm1234</span>
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: '.25rem' }}>
          Change in <code>src/data/constants.js</code> → GM_PASSWORD
        </div>
      </div>
    </div>
  );
}

// ── NPC Quick Create ──────────────────────────────────────────────────────────
// GM-only. Pick faction → school → rank → name → save to NPC log.
function NPCQuickCreate({ onComplete, onCancel }) {
  const [faction, setFaction] = useState('');
  const [school, setSchool] = useState('');
  const [rank, setRank] = useState(1);
  const [name, setName] = useState('');
  const [gmNotes, setGmNotes] = useState('');
  const [visible, setVisible] = useState(false);

  const schools = faction ? (FACTION_SCHOOLS[faction] || []) : [];
  const sd = SCHOOL_DATA[school] || null;
  const maxRank = school ? (SAHIR_SCHOOLS_LIST.includes(school) ? 8 : 5) : 5;

  // Derive default name from school + rank
  const defaultName = school ? `${school} — Rank ${rank}` : '';

  const submit = async () => {
    const npcName = name.trim() || defaultName;
    if (!faction || !school || !npcName) return;
    await onComplete({
      game_id: GAME_ID,
      faction,
      name: npcName,
      school,
      rank,
      is_visible_to_players: visible,
      gm_notes: gmNotes,
      player_notes: '',
    });
  };

  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>
        Quick Add NPC to Log
      </div>

      {/* Faction */}
      <div style={{ marginBottom: '.75rem' }}>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: '.3rem', textTransform: 'uppercase', letterSpacing: '.08em' }}>Faction</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.3rem' }}>
          {Object.keys(FACTION_SCHOOLS).map(f => (
            <button
              key={f}
              className={`btn btn-sm ${faction === f ? 'btn-p' : ''}`}
              onClick={() => { setFaction(f); setSchool(''); setRank(1); setName(''); }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* School */}
      {faction && (
        <div style={{ marginBottom: '.75rem' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: '.3rem', textTransform: 'uppercase', letterSpacing: '.08em' }}>School</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.3rem' }}>
            {schools.map(s => (
              <button
                key={s}
                className={`btn btn-sm ${school === s ? 'btn-p' : ''}`}
                onClick={() => { setSchool(s); setRank(1); setName(''); }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Rank + stat preview */}
      {school && (
        <>
          <div style={{ marginBottom: '.75rem' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: '.3rem', textTransform: 'uppercase', letterSpacing: '.08em' }}>Rank</div>
            <div style={{ display: 'flex', gap: '.3rem' }}>
              {Array.from({ length: maxRank }, (_, i) => i + 1).map(r => (
                <button key={r} className={`btn btn-sm ${rank === r ? 'btn-p' : ''}`} onClick={() => setRank(r)}>
                  R{r}
                </button>
              ))}
            </div>
          </div>

          {/* Stat preview */}
          {sd && (
            <div style={{ background: 'var(--bg-dark)', border: '1px solid rgba(200,150,42,.2)', borderRadius: 5, padding: '.6rem .75rem', marginBottom: '.75rem', fontSize: 11 }}>
              <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '.3rem' }}>
                <span><span style={{ color: 'var(--text-muted)' }}>Type:</span> <span style={{ color: 'var(--text-secondary)' }}>{sd.type}</span></span>
                <span><span style={{ color: 'var(--text-muted)' }}>Integrity:</span> <span style={{ color: 'var(--gold)' }}>{sd.integrity}</span></span>
                <span><span style={{ color: 'var(--text-muted)' }}>+1 Trait:</span> <span style={{ color: 'var(--text-secondary)' }}>{sd.bonus_trait}</span></span>
              </div>
              <div style={{ marginBottom: '.3rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Rank {rank} Technique: </span>
                <span style={{ color: 'var(--gold-dim)' }}>{sd.techniques?.[rank] || '—'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Skills: </span>
                <span style={{ color: 'var(--text-secondary)' }}>{sd.skills?.join(', ')}</span>
              </div>
            </div>
          )}

          {/* Name */}
          <div style={{ marginBottom: '.75rem' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: '.3rem', textTransform: 'uppercase', letterSpacing: '.08em' }}>Name (leave blank for generic)</div>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={defaultName}
              style={{ width: '100%' }}
            />
          </div>

          {/* GM Notes */}
          <div style={{ marginBottom: '.75rem' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: '.3rem', textTransform: 'uppercase', letterSpacing: '.08em' }}>GM Notes (private)</div>
            <textarea
              rows={2}
              value={gmNotes}
              onChange={e => setGmNotes(e.target.value)}
              placeholder="Motivations, secrets, plot hooks..."
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          <label className="chk-row" style={{ marginBottom: '1rem' }}>
            <input type="checkbox" checked={visible} onChange={e => setVisible(e.target.checked)} />
            Reveal to players immediately
          </label>

          <div style={{ display: 'flex', gap: '.5rem' }}>
            <button className="btn btn-p" onClick={submit}>Add to NPC Log</button>
            <button className="btn" onClick={onCancel}>Cancel</button>
          </div>
        </>
      )}

      {!faction && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '1rem' }}>
          Select a faction to begin.
        </div>
      )}
    </div>
  );
}

// Need GAME_ID for NPCQuickCreate (already imported above)
const SAHIR_SCHOOLS_LIST = SAHIR_SCHOOLS;
