import React, { useState, useEffect } from 'react';
import { SCHOOL_DATA, FACTION_SCHOOLS, SUBFACTION_BONUSES, FACTIONS_LIST, FACTIONS_DATA, ADVANTAGES, DISADVANTAGES, WEAPONS_LIST, GEAR_LIST, TRAITS, SAHIR_SCHOOLS, SAHIR_DISCIPLINES, IS_COKALOI_SCHOOL } from '../data/constants';
import { WoundBadge, SkillDots, FacIcon, CharacterSilhouette, Silhouette, Loading, Empty, AVATAR_TYPES, AVATAR_COLORS, ScrollLore } from './UI';
import SpellConstellation from './SpellConstellation';
import { supabase } from '../lib/supabase';
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
            {/* PC selector */}
            {characters.filter(c => !c.is_npc).length > 0 && (
              <select className="pc-sel" value={!characters.find(c => c.id === selId)?.is_npc ? selId || '' : ''} onChange={e => { setSelId(e.target.value); setShowDel(0); }}>
                <option value="" disabled>Player Characters</option>
                {characters.filter(c => !c.is_npc).map(c => <option key={c.id} value={c.id}>{c.name} — {c.school} R{c.school_rank}</option>)}
              </select>
            )}
            {/* NPC selector */}
            {characters.filter(c => c.is_npc).length > 0 && (
              <select className="pc-sel" value={characters.find(c => c.id === selId)?.is_npc ? selId || '' : ''} onChange={e => { setSelId(e.target.value); setShowDel(0); }} style={{ borderColor: 'rgba(200,64,48,.4)', color: 'var(--text-secondary)' }}>
                <option value="" disabled>Full NPCs</option>
                {characters.filter(c => c.is_npc).map(c => <option key={c.id} value={c.id}>{c.name} — {c.school} R{c.school_rank}</option>)}
              </select>
            )}
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
          const newChar = await onCreateCharacter(charData);
          if (newChar?.id) setSelId(newChar.id);
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
        <PlayerManagement />
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

  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const avatarType = char.avatar_type || 'warrior';
  const avatarColor = char.avatar_color || '#c8962a';

  const RING_COLORS = { Air: '#a0c0e0', Earth: '#80c090', Fire: '#e09050', Water: '#60b0d0', Void: '#c0a0e0' };
  const woundLabel = ['Healthy','Nicked','Grazed','Hurt','Injured','Crippled','Down','Out'][wR] || 'Healthy';
  const woundColor = ['#4a8a40','#8a8a30','#a87830','#c86030','#c84030','#a02828','#801818','#600010'][wR] || '#4a8a40';

  const SKILL_MASTERIES = {
    Swordsmanship: { 3: 'Simple Action with chosen weapon type', 5: '+1k0 to all attack rolls with swords', 7: 'Ignore reduction on called shot (3 raises)' },
    Brawling:      { 3: 'Grapple checks are Simple Actions', 5: '+1k0 damage in grapple', 7: 'Free raise on all grapple rolls' },
    Knives:        { 3: 'Throw knives up to 30\' without penalty', 5: 'Extra Attack costs 3 raises instead of 5', 7: '+1k1 damage with knives' },
    Athletics:     { 3: 'Move full distance as a Free Action', 5: '+1k0 to all Athletics rolls', 7: 'Ignore difficult terrain' },
    Stealth:       { 3: 'Move full speed while stealthed', 5: '+1k0 to all Stealth rolls', 7: 'Hide in plain sight once per scene' },
    Defense:       { 3: '+1k0 Armor TN in Full Defense', 5: 'Negate one attack/round as Free Action (spend Void)', 7: '+5 Armor TN at all times' },
    Spellcraft:    { 3: 'Free raise on one spell type of choice', 5: 'Reduce TN of spells by 2', 7: 'Cast one spell/session without Hakhim\'s Seal' },
    Investigation: { 3: 'Free raise when searching for hidden objects', 5: '+1k0 to all Investigation rolls', 7: 'Cannot be surprised' },
    Medicine:      { 3: 'Treat two patients per day', 5: '+1k0 to all Medicine rolls', 7: 'Patients heal double wounds from rest' },
    Hunting:       { 3: 'Free raise when tracking', 5: '+1k0 in natural environments', 7: 'Find food/water for a group of 10 anywhere' },
    Divination:    { 3: 'Free raise on Divination rolls', 5: '+1k0 to Divination; may use Awareness', 7: 'Once/session: ask GM one yes/no about immediate future' },
    Tahaddi:       { 3: 'Ready two tahaddi knives as a Free Action', 5: '+1k0 to Assessment rolls in Tahaddi duels', 7: 'Spend Void to add +1k1 damage in Tahaddi' },
  };

  return (
    <div>
      {/* ── Top card: Name/Avatar + Rings + Wounds ── */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>

          {/* Name block — top left */}
          <div style={{ minWidth: 160, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.4rem' }}>
              <div
                style={{ width: 40, height: 52, borderRadius: 4, background: 'var(--bg-panel)', border: `2px solid ${avatarColor}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', cursor: canEdit ? 'pointer' : 'default', position: 'relative' }}
                onClick={() => canEdit && setShowAvatarPicker(p => !p)}>
                <Silhouette type={avatarType} size={32} color={avatarColor} />
                {canEdit && <div style={{ position: 'absolute', bottom: 1, right: 1, fontSize: 7, color: avatarColor }}>✏</div>}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>{char.name}</div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{char.faction}</div>
                <div style={{ fontSize: 10, color: 'var(--gold-dim)' }}>{char.school} R{char.school_rank}</div>
              </div>
            </div>
            {/* Avatar picker */}
            {showAvatarPicker && canEdit && (
              <div style={{ marginBottom: '.5rem', padding: '.5rem', background: 'var(--bg-dark)', borderRadius: 4, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: '.5rem' }}>
                  {AVATAR_TYPES.map(at => (
                    <div key={at.id} onClick={() => update('avatar_type', at.id)} title={at.label}
                      style={{ width: 28, height: 36, borderRadius: 3, background: avatarType === at.id ? avatarColor + '22' : 'var(--bg-panel)', border: `1px solid ${avatarType === at.id ? avatarColor : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <Silhouette type={at.id} size={20} color={avatarColor} />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  {AVATAR_COLORS.map(ac => (
                    <div key={ac.id} onClick={() => update('avatar_color', ac.id)} title={ac.label}
                      style={{ width: 18, height: 18, borderRadius: '50%', background: ac.id, border: `2px solid ${avatarColor === ac.id ? '#fff' : 'transparent'}`, cursor: 'pointer' }} />
                  ))}
                </div>
                <button className="btn btn-sm" style={{ marginTop: '.4rem', fontSize: 9 }} onClick={() => setShowAvatarPicker(false)}>Done</button>
              </div>
            )}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', fontSize: 10 }}>
              <span style={{ color: 'var(--text-muted)' }}>Integrity <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{char.integrity}</span></span>
              <span style={{ color: 'var(--text-muted)' }}>Rep <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{char.reputation}</span></span>
              <span style={{ color: 'var(--text-muted)' }}>Status <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{char.status}</span></span>
            </div>
            {/* Wounds */}
            <div style={{ marginTop: '.5rem', padding: '.4rem .5rem', background: 'var(--bg-panel)', borderRadius: 4, border: `1px solid ${woundColor}44` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: woundColor, lineHeight: 1 }}>{char.current_wounds || 0}</div>
                <div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>/ {char.max_wounds || (char.stamina || 2) * 10} wounds</div>
                  <div style={{ fontSize: 10, color: woundColor, fontWeight: 600 }}>{woundLabel}</div>
                </div>
                {(isGM && !isPCView) && (
                  <div style={{ display: 'flex', gap: 3, marginLeft: 'auto' }}>
                    <button className="btn btn-sm" style={{ fontSize: 9, padding: '1px 6px' }} onClick={() => update('current_wounds', Math.max(0, (char.current_wounds || 0) - 1))}>Heal</button>
                    <button className="btn btn-sm btn-d" style={{ fontSize: 9, padding: '1px 6px' }} onClick={() => update('current_wounds', (char.current_wounds || 0) + 1)}>+Wound</button>
                  </div>
                )}
              </div>
            </div>
            {/* Armor TN / Init */}
            <div style={{ marginTop: '.4rem', fontSize: 10, color: 'var(--text-muted)', display: 'flex', gap: 8 }}>
              <span>TN <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{5 + (char.reflexes || 2) * 5}</span></span>
              <span>Init <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{char.reflexes || 2}k{char.air || 2}</span></span>
              <span>XP <span style={{ color: xpAvail > 0 ? 'var(--green)' : 'var(--text-muted)', fontWeight: 600 }}>{xpAvail}</span></span>
            </div>
          </div>

          {/* Rings — right of name, with traits clearly shown */}
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '.4rem' }}>
            {[
              { ring: 'Air',   val: char.air,   traits: [['Reflexes', char.reflexes], ['Awareness', char.awareness]] },
              { ring: 'Earth', val: char.earth, traits: [['Stamina', char.stamina], ['Willpower', char.willpower]] },
              { ring: 'Fire',  val: char.fire,  traits: [['Agility', char.agility], ['Intelligence', char.intelligence]] },
              { ring: 'Water', val: char.water, traits: [['Strength', char.strength], ['Perception', char.perception]] },
              { ring: 'Void',  val: char.void,  traits: null },
            ].map(({ ring, val, traits }) => (
              <div key={ring} style={{ textAlign: 'center', background: 'var(--bg-panel)', borderRadius: 5, padding: '.4rem .2rem', border: `1px solid ${RING_COLORS[ring]}44` }}>
                <div style={{ fontSize: 8, color: RING_COLORS[ring], textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 1 }}>{ring}</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: RING_COLORS[ring], lineHeight: 1 }}>{val}</div>
                {traits ? (
                  <div style={{ marginTop: 3 }}>
                    {traits.map(([name, tval]) => (
                      <div key={name} style={{ fontSize: 9, color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', padding: '1px 2px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{name.slice(0, 4)}</span>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{tval}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Void — show void points */
                  <div style={{ marginTop: 3 }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
                      {Array.from({ length: char.void || 2 }, (_, i) => (
                        <div key={i} onClick={() => update('current_void', i < char.current_void ? i : i + 1)}
                          style={{ width: 10, height: 10, borderRadius: '50%', border: `1.5px solid ${i < (char.current_void || 0) ? RING_COLORS.Void : 'var(--border)'}`, background: i < (char.current_void || 0) ? RING_COLORS.Void : 'transparent', cursor: 'pointer' }} />
                      ))}
                    </div>
                    <div style={{ fontSize: 8, color: 'var(--text-muted)', marginTop: 2 }}>{char.current_void || 0}/{char.void || 2} pts</div>
                    <button className="btn btn-sm" style={{ fontSize: 7, padding: '1px 4px', marginTop: 2 }} onClick={() => update('current_void', Math.max(0, (char.current_void || 0) - 1))}>Spend</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="g2">
      {/* Left column — Skills prominent */}
      <div>
        {/* Skills */}
        <div className="card">
          <div className="card-title">Skills</div>
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {(char.skills || []).map(s => {
              const masteries = SKILL_MASTERIES[s.name] || {};
              const unlockedMasteries = Object.entries(masteries).filter(([rank]) => s.rank >= +rank);
              return (
                <div key={s.name}>
                  <div className="skill-row">
                    <span className={`skill-nm ${s.school ? 'sc' : ''}`}>{s.name}</span>
                    <SkillDots rank={s.rank} />
                    {canEdit && (
                      <div style={{ display: 'flex', gap: 2, marginLeft: 4 }}>
                        <button className="trait-btn" onClick={() => { const skills = (char.skills || []).map(x => x.name === s.name ? { ...x, rank: Math.max(0, x.rank - 1) } : x); update('skills', skills); }}>−</button>
                        <button className="trait-btn" onClick={() => { const skills = (char.skills || []).map(x => x.name === s.name ? { ...x, rank: Math.min(10, x.rank + 1) } : x); update('skills', skills); }}>+</button>
                      </div>
                    )}
                  </div>
                  {unlockedMasteries.map(([rank, desc]) => (
                    <div key={rank} style={{ fontSize: 9, color: 'var(--gold-dim)', paddingLeft: 16, paddingBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <i className="ti ti-star" style={{ fontSize: 8 }} />R{rank}: {desc}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
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
      </div>

      {/* Right column — Equipment, Techniques, Spells, Advantages */}
      <div>
        {/* Equipment */}
        <div className="card">
          <div className="card-title">Equipment</div>
          {(char.equipment || []).map((e, i) => {
            const weapon = WEAPONS_LIST.find(w => w.name === e.name);
            const loreText = weapon ? `Damage: ${weapon.dr}\nSkill: ${weapon.skill}\nPrice: ${weapon.price}\n${weapon.special ? `Special: ${weapon.special}` : ''}` : e.name;
            return (
              <div key={i} className="eq-row">
                <input type="checkbox" checked={e.inUse || false} onChange={() => toggleEqInUse(i)} style={{ accentColor: 'var(--gold)' }} title="In use" />
                <span style={{ flex: 1, color: e.inUse ? 'var(--text-primary)' : 'var(--text-muted)' }}>{e.name}</span>
                {e.dr && <span style={{ fontSize: 9, color: 'var(--gold-dim)' }}>{e.dr}</span>}
                <ScrollLore title={e.name} text={loreText} size={10} />
                {canEdit && <button className="btn btn-sm btn-d" style={{ padding: '1px 5px', fontSize: 9 }} onClick={() => removeEq(i)}>×</button>}
              </div>
            );
          })}
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

        {/* Techniques */}
        <div className="card">
          <div className="card-title">Techniques</div>
          {Object.entries(char.techniques || {}).map(([r, n]) => {
            const sd = SCHOOL_DATA[char.school];
            const fullDesc = sd?.techniques?.[+r] || n;
            return (
              <div key={r} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, padding: '4px 0', borderBottom: '1px solid rgba(107,78,40,.2)' }}>
                <span style={{ color: 'var(--gold-dim)', fontSize: 10, minWidth: 20, marginTop: 1 }}>R{r}</span>
                <span style={{ color: 'var(--text-primary)', fontSize: 11, flex: 1 }}>{n}</span>
                <ScrollLore title={`Rank ${r}: ${n}`} text={fullDesc} />
              </div>
            );
          })}
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

        {/* Spells (Sahir/Cokaloi) */}
        {(isSahirSchool(char.school) || IS_COKALOI_SCHOOL(char.school)) && (
          <div className="card">
            <div className="card-title">Spells & Magic</div>
            <SpellConstellation
              character={char}
              mode="sheet"
              onUpdate={canEdit ? onUpdate : null}
            />
          </div>
        )}

        {/* Advantages / Disadvantages */}
        {((char.advantages || []).length > 0 || (char.disadvantages || []).length > 0) && (
          <div className="card">
            {(char.advantages || []).length > 0 && (
              <>
                <div className="card-title">Advantages</div>
                {char.advantages.map(a => {
                  const adv = ADVANTAGES.find(x => x.name === a.name);
                  return (
                    <div key={a.name} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0', borderBottom: '1px solid rgba(107,78,40,.2)' }}>
                      <span style={{ flex: 1, fontSize: 11, color: 'var(--text-secondary)' }}>{a.name}</span>
                      <span style={{ color: 'var(--gold-dim)', fontSize: 9 }}>({a.cost} pts)</span>
                      {adv?.desc && <ScrollLore title={a.name} text={`Cost: ${a.cost} CP\nType: ${adv.type}\n\n${adv.desc}`} />}
                    </div>
                  );
                })}
              </>
            )}
            {(char.disadvantages || []).length > 0 && (
              <>
                <div className="card-title" style={{ marginTop: '.5rem' }}>Disadvantages</div>
                {char.disadvantages.map(d => {
                  const dis = DISADVANTAGES.find(x => x.name === d.name);
                  return (
                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0', borderBottom: '1px solid rgba(107,78,40,.2)' }}>
                      <span style={{ flex: 1, fontSize: 11, color: 'var(--text-secondary)' }}>{d.name}</span>
                      <span style={{ color: 'var(--red)', fontSize: 9 }}>(+{d.value} CP)</span>
                      {dis?.desc && <ScrollLore title={d.name} text={`Value: ${d.value} CP\nType: ${dis.type}\n\n${dis.desc}`} />}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
function CharacterCreation({ onComplete, onCancel, defaultIsNpc = false }) {
  const [step, setStep] = useState(1);
  const [isNpc, setIsNpc] = useState(defaultIsNpc);
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
  const [spellDisciplineBonus, setSpellDisciplineBonus] = useState('');
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
    onComplete({ ...charData, game_id: GAME_ID, is_npc: isNpc });
  };

  return (
    <div style={{ maxWidth: 700 }}>
      {onCancel && <button className="btn btn-sm" style={{ marginBottom: '1rem' }} onClick={onCancel}>← Back</button>}

      {/* PC / NPC toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1rem', padding: '.5rem .75rem', background: isNpc ? 'rgba(200,64,48,.08)' : 'rgba(74,138,64,.08)', border: `1px solid ${isNpc ? 'rgba(200,64,48,.3)' : 'rgba(74,138,64,.3)'}`, borderRadius: 5 }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Creating:</span>
        <button className={`btn btn-sm ${!isNpc ? 'btn-p' : ''}`} onClick={() => setIsNpc(false)}>
          <i className="ti ti-user" style={{ fontSize: 10, marginRight: 4 }} />Player Character
        </button>
        <button className={`btn btn-sm ${isNpc ? 'btn-p' : ''}`} style={isNpc ? { borderColor: '#c84030', background: 'rgba(200,64,48,.2)', color: '#e86050' } : {}} onClick={() => setIsNpc(true)}>
          <i className="ti ti-user-bolt" style={{ fontSize: 10, marginRight: 4 }} />NPC (Full Sheet)
        </button>
        {isNpc && <span style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' }}>GM-only, won't appear on player character list</span>}
      </div>

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

      {/* Step 5: Spells (Sahir schools only) */}
      {spellStep && step === spellStep && (
        <div>
          <SpellConstellation
            character={{
              id: 'creation',
              school,
              school_rank: 1,
              spells: selectedSpells,
              spell_type_emphases: spellEmphasis ? [spellEmphasis] : [],
              spell_discipline_bonus: spellDisciplineBonus,
            }}
            mode="create"
            onUpdate={(_, updates) => {
              if (updates.spells) setSelectedSpells(updates.spells);
            }}
            spellEmphasis={spellEmphasis}
            setSpellEmphasis={setSpellEmphasis}
            spellDisciplineBonus={spellDisciplineBonus}
            setSpellDisciplineBonus={setSpellDisciplineBonus}
          />

          <div style={{ marginTop: '1rem', display: 'flex', gap: '.5rem', justifyContent: 'space-between', alignItems: 'center' }}>
            <button className="btn" onClick={() => setStep(4)}>← Back</button>
            <div style={{ fontSize: 11, color: selectedSpells.length >= startingSpells ? 'var(--green)' : 'var(--text-muted)' }}>
              {selectedSpells.length}/{startingSpells} spells selected
            </div>
            <button className="btn btn-p"
              disabled={selectedSpells.length < startingSpells || (!IS_COKALOI_SCHOOL(school) && (!spellEmphasis || !spellDisciplineBonus))}
              onClick={() => setStep(advStep)}>
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Step 5/6: Advantages */}
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

// ── Player Management — 8 username+password pairs ────────────────────────────
function PlayerManagement() {
  const EMPTY_SLOTS = Array.from({ length: 8 }, () => ({ username: '', password: '' }));
  const [slots, setSlots] = useState(EMPTY_SLOTS);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    supabase.from('games').select('settings').eq('id', GAME_ID).single().then(({ data, error }) => {
      if (!error && data?.settings?.player_accounts) {
        const loaded = [...EMPTY_SLOTS];
        data.settings.player_accounts.forEach((p, i) => { if (i < 8) loaded[i] = p; });
        setSlots(loaded);
      }
      setLoading(false);
    });
  }, []);

  const save = async () => {
    const { data } = await supabase.from('games').select('settings').eq('id', GAME_ID).single();
    const current = data?.settings || {};
    await supabase.from('games').update({ settings: { ...current, player_accounts: slots.filter(s => s.username.trim()) } }).eq('id', GAME_ID);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) return <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Loading...</div>;

  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: '.5rem' }}>Player Accounts</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
        Create up to 8 player accounts. Each player logs in with their username and password. Leave rows blank to skip them.
      </div>
      <div className="card">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 8px', marginBottom: '.75rem' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>Username</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>Password</div>
          {slots.map((slot, i) => (
            <React.Fragment key={i}>
              <input value={slot.username} onChange={e => { const s = [...slots]; s[i] = { ...s[i], username: e.target.value }; setSlots(s); }}
                placeholder={`Player ${i + 1}`} style={{ fontSize: 11 }} />
              <input value={slot.password} onChange={e => { const s = [...slots]; s[i] = { ...s[i], password: e.target.value }; setSlots(s); }}
                placeholder="password" style={{ fontSize: 11 }} />
            </React.Fragment>
          ))}
        </div>
        <button className="btn btn-p btn-sm" onClick={save}>{saved ? '✓ Saved' : 'Save Accounts'}</button>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: '.5rem' }}>
          Players log in at the login screen with their username and password.
        </div>
      </div>
    </div>
  );
}
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
    const isSahir = SAHIR_SCHOOLS_LIST.includes(school);
    await onComplete({
      game_id: GAME_ID,
      faction,
      name: npcName,
      school,
      rank,
      is_visible_to_players: visible,
      gm_notes: gmNotes,
      player_notes: '',
      spells: isSahir ? generateNpcSpells(rank) : [],
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

// Generate random rank-appropriate spells for a Sahir NPC
// 2 spells per rank, respecting level prerequisites within each type
function generateNpcSpells(rank) {
  const result = [];
  const totalSpells = rank * 2;
  // Flatten all spells with their type tracking
  const allTypes = SAHIR_DISCIPLINES.flatMap(d =>
    d.types.map(t => ({ disciplineId: d.id, typeId: t.id, spells: t.spells }))
  );
  // Track learned per type for prerequisite checking
  const learnedByType = {};
  let attempts = 0;
  while (result.length < totalSpells && attempts < 200) {
    attempts++;
    const typeGroup = allTypes[Math.floor(Math.random() * allTypes.length)];
    const key = typeGroup.typeId;
    const learned = learnedByType[key] || 0;
    // Can only learn level 1, or next level if previous known
    const nextLevel = learned + 1;
    if (nextLevel > 3) continue;
    const spell = typeGroup.spells.find(s => s.level === nextLevel);
    if (!spell || result.includes(spell.name)) continue;
    // Level cap: level 1 always ok, level 2 needs rank 2+, level 3 needs rank 4+
    if (nextLevel === 2 && rank < 2) continue;
    if (nextLevel === 3 && rank < 4) continue;
    result.push(spell.name);
    learnedByType[key] = nextLevel;
  }
  return result;
}
