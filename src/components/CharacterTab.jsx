import React, { useState, useEffect } from 'react';
import { SCHOOL_DATA, FACTION_SCHOOLS, SUBFACTION_BONUSES, FACTIONS_LIST, FACTIONS_DATA, ADVANTAGES, DISADVANTAGES, WEAPONS_LIST, GEAR_LIST, TRAITS, SAHIR_SCHOOLS, SAHIR_DISCIPLINES, IS_COKALOI_SCHOOL, SKILL_CATEGORIES, OPEN_SKILLS, TECHNIQUE_DESCRIPTIONS } from '../data/constants';
import { WoundBadge, SkillDots, FacIcon, CharacterSilhouette, Silhouette, Loading, Empty, AVATAR_TYPES, AVATAR_COLORS, ScrollLore } from './UI';
import SpellConstellation from './SpellConstellation';
import { supabase } from '../lib/supabase';
import { getWoundRank, getArchetype, buildCharacterFromForm, isSahirSchool, calcInsight, insightRankFor, traitXpCost, skillXpCost, nextRankThreshold, TRAIT_RING_MAP, RANK_THRESHOLDS } from '../lib/utils';
import { GAME_ID } from '../data/constants';

// ── Character Tab ─────────────────────────────────────────────────────────────
export default function CharacterTab({ isGM, isPCView, isPlayer, characters, npcs, onUpdateNPC, onUpdateCharacter, onCreateCharacter, onDeleteCharacter, onCreateNPC, myCharId, onClaimCharacter, playerPassword, onSavePlayerPassword, jumpToCharId, onClearJump }) {
  const [view, setView] = useState('sheet');
  const [selId, setSelId] = useState(null);
  const [selNpcId, setSelNpcId] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [showDel, setShowDel] = useState(0);
  const [addEq, setAddEq] = useState('');

  // Jump to a specific character (e.g. from NPC tab)
  useEffect(() => {
    if (jumpToCharId && characters.find(c => c.id === jumpToCharId)) {
      setSelId(jumpToCharId);
      setSelNpcId(null);
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
            <i className="ti ti-plus" style={{ fontSize: 12 }} /> New Character
          </button>
          {selId && onClaimCharacter && (
            <button
              className={`btn btn-sm ${myCharId === selId ? 'btn-p' : ''}`}
              onClick={() => onClaimCharacter(selId)}
              title="Mark this as your character — your card will be highlighted in encounters"
              style={myCharId === selId ? {} : { borderColor: 'var(--gold-dim)', color: 'var(--gold-dim)' }}
            >
              {myCharId === selId
                ? <><i className="ti ti-user-check" style={{ fontSize: 12 }} /> My Character</>
                : <><i className="ti ti-user-question" style={{ fontSize: 12 }} /> Claim as Mine</>
              }
            </button>
          )}
        </div>
        {characters.length === 0 && (
          <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '1rem' }}>
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
            <i className="ti ti-user" style={{ fontSize: 12 }} /> Characters
          </button>
          <button className={`btn btn-sm ${view === 'create' ? 'btn-p' : ''}`} onClick={() => setView('create')}>
            <i className="ti ti-plus" style={{ fontSize: 12 }} /> Full Character
          </button>
          {onCreateNPC && (
            <button className={`btn btn-sm ${view === 'npc' ? 'btn-p' : ''}`} onClick={() => setView('npc')}>
              <i className="ti ti-user-bolt" style={{ fontSize: 12 }} /> Library NPC
            </button>
          )}
        </div>

      {view === 'sheet' && (characters.length > 0 || (npcs?.length || 0) > 0) && (
          <>
            {/* PC selector */}
            {characters.filter(c => !c.is_npc).length > 0 && (
              <select className="pc-sel" value={(!selNpcId && !characters.find(c => c.id === selId)?.is_npc) ? selId || '' : ''} onChange={e => { setSelId(e.target.value); setSelNpcId(null); setShowDel(0); }}>
                <option value="" disabled>Player Characters</option>
                {characters.filter(c => !c.is_npc).map(c => <option key={c.id} value={c.id}>{c.name} — {c.school} R{c.school_rank}</option>)}
              </select>
            )}
            {/* NPC selector (full character sheet NPCs) */}
            {characters.filter(c => c.is_npc).length > 0 && (
              <select className="pc-sel" value={(!selNpcId && characters.find(c => c.id === selId)?.is_npc) ? selId || '' : ''} onChange={e => { setSelId(e.target.value); setSelNpcId(null); setShowDel(0); }} style={{ borderColor: 'rgba(200,64,48,.4)', color: 'var(--text-secondary)' }}>
                <option value="" disabled>Full NPCs</option>
                {characters.filter(c => c.is_npc).map(c => <option key={c.id} value={c.id}>{c.name} — {c.school} R{c.school_rank}</option>)}
              </select>
            )}
            {/* Library NPC selector (lightweight quick-add NPCs) */}
            {(npcs?.length || 0) > 0 && (
              <select className="pc-sel" value={selNpcId || ''} onChange={e => { setSelNpcId(e.target.value || null); setShowDel(0); }} style={{ borderColor: 'rgba(200,150,42,.4)', color: 'var(--gold-dim)' }}>
                <option value="">Library NPCs</option>
                {npcs.map(n => <option key={n.id} value={n.id}>{n.name} — {n.faction}</option>)}
              </select>
            )}
            {!selNpcId && (
              <button className="btn btn-sm btn-d" onClick={() => setShowDel(s => s < 2 ? s + 1 : s)}>
                {showDel === 0 ? 'Delete' : showDel === 1 ? 'Really?' : 'CONFIRM'}
              </button>
            )}
            {showDel === 2 && char && (
              <button className="btn btn-sm btn-d" onClick={async () => { await onDeleteCharacter(char.id); setSelId(null); setShowDel(0); }}>
                Yes, delete {char.name}
              </button>
            )}
          </>
        )}
      </div>

      {/* Views */}
      {view === 'sheet' && selNpcId && (() => {
        const npc = npcs?.find(n => n.id === selNpcId);
        if (!npc) return null;
        const sd = SCHOOL_DATA[npc.school];
        const npcTechniques = [];
        for (let r = 1; r <= (npc.rank || 1); r++) { if (sd?.techniques?.[r]) npcTechniques.push({ rank: r, text: sd.techniques[r] }); }
        const combinedLore = npcTechniques.length > 0
          ? npcTechniques.map(t => `Rank ${t.rank}: ${t.text}`).join('\n\n')
          : 'No technique data found for this school — check the school name matches one in the reference data.';
        const alreadyPromoted = !!npc.character_id && characters.some(c => c.id === npc.character_id);

        const promoteNpc = async () => {
          const techs = {};
          npcTechniques.forEach(t => { techs[t.rank] = t.text; });
          const ringVal = (npc.rank || 1) + 1;
          const newChar = await onCreateCharacter({
            name: npc.name, faction: npc.faction || '', school: npc.school || '', school_rank: npc.rank || 1,
            is_npc: true,
            air: ringVal, earth: ringVal, fire: ringVal, water: ringVal, void: 2,
            reflexes: ringVal, awareness: ringVal, stamina: ringVal, willpower: ringVal,
            agility: ringVal, intelligence: ringVal, strength: ringVal, perception: ringVal,
            current_wounds: 0, max_wounds: ringVal * 10, current_void: 2,
            integrity: 0, reputation: 0, status: 0, copper: 0,
            skills: [], equipment: [], advantages: [], disadvantages: [],
            techniques: techs, spells: npc.spells || [],
          });
          if (newChar) {
            if (onUpdateNPC) await onUpdateNPC(npc.id, { character_id: newChar.id });
            setSelNpcId(null);
            setSelId(newChar.id);
            setEditMode(true);
          }
        };

        return (
          <div className="card" style={{ maxWidth: 480 }}>
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {npc.name}
              <ScrollLore title={`${npc.name} — ${npc.school} Techniques`} text={combinedLore} />
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: '.5rem' }}>
              {npc.faction} · {npc.school} Rank {npc.rank}
            </div>
            <div style={{ fontSize: 12, color: npc.is_visible_to_players ? 'var(--green)' : 'var(--text-muted)', marginBottom: '.75rem' }}>
              {npc.is_visible_to_players ? '● Visible to players' : '○ Hidden from players'}
            </div>
            {npcTechniques.length > 0 && (
              <div style={{ marginBottom: '.5rem' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 2 }}>Techniques</div>
                {npcTechniques.map(t => (
                  <div key={t.rank} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, padding: '3px 0', borderBottom: '1px solid rgba(107,78,40,.2)' }}>
                    <span style={{ color: 'var(--gold-dim)', fontSize: 12, minWidth: 20, marginTop: 1 }}>R{t.rank}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 13, flex: 1 }}>{t.text}</span>
                  </div>
                ))}
              </div>
            )}
            {npc.gm_notes && (
              <div style={{ marginBottom: '.5rem' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>GM Notes</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{npc.gm_notes}</div>
              </div>
            )}
            {npc.player_notes && (
              <div style={{ marginBottom: '.5rem' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Player Notes</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{npc.player_notes}</div>
              </div>
            )}
            {(npc.spells || []).length > 0 && (
              <div style={{ marginBottom: '.5rem' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Spells</div>
                {npc.spells.map((s, i) => (
                  <div key={i} style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.name || s}</div>
                ))}
              </div>
            )}
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', margin: '.5rem 0' }}>
              This is a lightweight library NPC — no full sheet. Manage visibility and notes from the NPC tab.
            </div>
            {alreadyPromoted ? (
              <button className="btn btn-sm" onClick={() => { setSelId(npc.character_id); setSelNpcId(null); }}>
                <i className="ti ti-arrow-up-right" style={{ fontSize: 11, marginRight: 4 }} /> View Promoted Full Character
              </button>
            ) : (
              <button className="btn btn-sm btn-p" onClick={promoteNpc}>
                <i className="ti ti-arrow-up" style={{ fontSize: 11, marginRight: 4 }} /> Promote to Full Character
              </button>
            )}
          </div>
        );
      })()}
      {view === 'sheet' && !selNpcId && (
        char
          ? <CharacterSheet char={char} isGM={true} isPCView={isPCView} canEdit={editMode} onUpdate={onUpdateCharacter} onCreateCharacter={onCreateCharacter} onToggleEdit={() => setEditMode(e => !e)} addEq={addEq} setAddEq={setAddEq} />
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
          const result = await onCreateNPC(npcData);
          if (result) setView('sheet');
          return result;
        }} onCancel={() => setView('sheet')} />
      )}
    </div>
  );
}

// ── Add Skill Control ─────────────────────────────────────────────────────────
function AddSkillControl({ char, onAdd }) {
  const [customInput, setCustomInput] = useState(null);
  const existingNames = new Set((char.skills || []).map(s => s.name));
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {customInput !== null ? (
        <div style={{ display: 'flex', gap: 2 }}>
          <input autoFocus style={{ fontSize: 11, width: 120 }} value={customInput} placeholder="Lore: Sewers"
            onChange={e => setCustomInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && customInput.trim() && !customInput.trim().endsWith(': ')) { onAdd(customInput.trim()); setCustomInput(null); } if (e.key === 'Escape') setCustomInput(null); }} />
          <button className="btn btn-sm" style={{ fontSize: 10 }} onClick={() => { if (customInput.trim() && !customInput.trim().endsWith(': ')) { onAdd(customInput.trim()); setCustomInput(null); } }}>Add</button>
          <button className="btn btn-sm" style={{ fontSize: 10 }} onClick={() => setCustomInput(null)}>✕</button>
        </div>
      ) : (
        <select style={{ fontSize: 11 }} value="" onChange={e => {
          const val = e.target.value; if (!val) return;
          if (val.endsWith('[Custom]')) { setCustomInput(val.replace('[Custom]', '').trim() + ': '); }
          else if (!existingNames.has(val)) { onAdd(val); }
        }}>
          <option value="">+ Add skill</option>
          {Object.entries(SKILL_CATEGORIES).map(([cat, catSkills]) => (
            <optgroup key={cat} label={cat}>
              {catSkills.filter(s => !existingNames.has(s) && !s.endsWith('[Custom]')).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
              {catSkills.some(s => s.endsWith('[Custom]')) && (
                <option value={catSkills.find(s => s.endsWith('[Custom]'))}>
                  {cat.split(' ')[0]}: [custom…]
                </option>
              )}
            </optgroup>
          ))}
        </select>
      )}
    </div>
  );
}

// ── Rank-Up Overlay ───────────────────────────────────────────────────────────
// Blocks the character sheet until the player chooses their new technique
function RankUpOverlay({ char, newRank, onConfirm }) {
  const [choice, setChoice] = useState(null); // { school, techName, techDesc }

  const currentSchoolTech = SCHOOL_DATA[char.school]?.techniques?.[newRank];
  const currentSchoolDesc = TECHNIQUE_DESCRIPTIONS[currentSchoolTech] || '';

  // Every other school's Rank 1
  const allSchoolRank1 = Object.entries(SCHOOL_DATA)
    .filter(([s]) => s !== char.school)
    .map(([s, sd]) => ({ school: s, techName: sd.techniques?.[1], techDesc: TECHNIQUE_DESCRIPTIONS[sd.techniques?.[1]] || '' }))
    .filter(x => x.techName);

  // Any school that has a technique AT this exact rank (paths/alternate progressions)
  const othersAtRank = newRank > 1 ? Object.entries(SCHOOL_DATA)
    .filter(([s]) => s !== char.school)
    .map(([s, sd]) => ({ school: s, techName: sd.techniques?.[newRank], techDesc: TECHNIQUE_DESCRIPTIONS[sd.techniques?.[newRank]] || '' }))
    .filter(x => x.techName) : [];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,7,4,.96)', zIndex: 300, display: 'flex', flexDirection: 'column', padding: '2rem', overflowY: 'auto' }}>
      <div style={{ maxWidth: 700, margin: '0 auto', width: '100%' }}>
        <div style={{ fontSize: 11, color: 'var(--gold-dim)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: '.5rem' }}>Insight Rank {newRank} Achieved</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--gold)', marginBottom: '.5rem' }}>Choose Your Next Technique</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          You have reached the insight threshold for Rank {newRank}. Select your technique below — this cannot be changed once confirmed.
        </div>

        {/* Option A — Continue current school */}
        {currentSchoolTech && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: 12, color: 'var(--gold-dim)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.5rem' }}>Continue Your School</div>
            <TechOption label={`${char.school} — Rank ${newRank}`} name={currentSchoolTech} desc={currentSchoolDesc}
              selected={choice?.techName === currentSchoolTech}
              onSelect={() => setChoice({ school: char.school, techName: currentSchoolTech, techDesc: currentSchoolDesc })} />
          </div>
        )}

        {/* Option B — Other schools at this rank (paths with this rank, etc.) */}
        {othersAtRank.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: 12, color: 'var(--gold-dim)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.5rem' }}>Alternate Path — Rank {newRank}</div>
            {othersAtRank.map(x => (
              <TechOption key={x.school} label={x.school} name={x.techName} desc={x.techDesc}
                selected={choice?.techName === x.techName}
                onSelect={() => setChoice(x)} />
            ))}
          </div>
        )}

        {/* Option C — Rank 1 of any other school */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: 12, color: 'var(--gold-dim)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.5rem' }}>Begin a New School — Rank 1</div>
          <div style={{ maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
            {allSchoolRank1.map(x => (
              <TechOption key={x.school} label={`${x.school} — Rank 1`} name={x.techName} desc={x.techDesc}
                selected={choice?.techName === x.techName && choice?.school === x.school}
                onSelect={() => setChoice(x)} />
            ))}
          </div>
        </div>

        <div style={{ position: 'sticky', bottom: 0, background: 'rgba(10,7,4,.95)', padding: '1rem 0', display: 'flex', gap: '.75rem', alignItems: 'center' }}>
          {choice && <div style={{ flex: 1, fontSize: 13, color: 'var(--text-secondary)' }}>Selected: <strong style={{ color: 'var(--gold)' }}>{choice.techName}</strong></div>}
          {!choice && <div style={{ flex: 1, fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>Make a selection above to continue.</div>}
          <button className="btn btn-p" disabled={!choice} onClick={() => onConfirm(choice)}>
            Confirm Rank {newRank} — {choice?.techName || '…'}
          </button>
        </div>
      </div>
    </div>
  );
}

function TechOption({ label, name, desc, selected, onSelect }) {
  return (
    <div onClick={onSelect} style={{
      padding: '.75rem', borderRadius: 6, cursor: 'pointer', marginBottom: '.35rem',
      border: `2px solid ${selected ? 'var(--gold)' : 'var(--border)'}`,
      background: selected ? 'rgba(200,150,42,.1)' : 'var(--bg-panel)',
    }}>
      <div style={{ fontSize: 11, color: selected ? 'var(--gold-dim)' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: selected ? 'var(--gold)' : 'var(--text-primary)', marginBottom: 4 }}>{name}</div>
      {desc && <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>{desc}</div>}
    </div>
  );
}

// ── XP Spend Panel ────────────────────────────────────────────────────────────
function XPSpendPanel({ char, onBatchUpdate, onClose }) {
  const [cart, setCart] = useState({}); // { 'trait_agility': { type:'trait', key:'agility', from:2, to:3, cost:12 }, 'skill_Knives': {...} }

  const insight = calcInsight(char);
  const insightRank = insightRankFor(insight);
  const nextThreshold = RANK_THRESHOLDS[insightRank];
  const xpAvail = (char.xp_total || 0) - (char.xp_spent || 0);
  const cartCost = Object.values(cart).reduce((s, x) => s + x.cost, 0);
  const canAfford = cartCost <= xpAvail;

  // Project the insight WITH pending cart changes applied
  const projectedChar = { ...char };
  Object.values(cart).forEach(item => {
    if (item.type === 'trait') {
      projectedChar[item.key] = item.to;
      const ringInfo = TRAIT_RING_MAP[item.key];
      if (ringInfo) projectedChar[ringInfo.ring] = Math.min(item.to, projectedChar[ringInfo.paired] || 2);
    } else if (item.type === 'skill') {
      projectedChar.skills = (projectedChar.skills || []).map(s => s.name === item.key ? { ...s, rank: item.to } : s);
    }
  });
  const projInsight = calcInsight(projectedChar);
  const projRank = insightRankFor(projInsight);

  const addTraitToCart = (traitKey, currentVal) => {
    const cartKey = `trait_${traitKey}`;
    const alreadyPending = cart[cartKey];
    const effectiveFrom = alreadyPending ? alreadyPending.to : currentVal;
    if (effectiveFrom >= 5) return; // max trait
    const to = effectiveFrom + 1;
    const cost = traitXpCost(effectiveFrom);
    setCart(c => ({ ...c, [cartKey]: { type: 'trait', key: traitKey, from: currentVal, to, cost: (alreadyPending?.cost || 0) + cost, label: traitKey.charAt(0).toUpperCase() + traitKey.slice(1) } }));
  };

  const addSkillToCart = (skillName, currentRank) => {
    const cartKey = `skill_${skillName}`;
    const alreadyPending = cart[cartKey];
    const effectiveFrom = alreadyPending ? alreadyPending.to : currentRank;
    if (effectiveFrom >= 10) return;
    const to = effectiveFrom + 1;
    const cost = skillXpCost(effectiveFrom);
    setCart(c => ({ ...c, [cartKey]: { type: 'skill', key: skillName, from: currentRank, to, cost: (alreadyPending?.cost || 0) + cost, label: skillName } }));
  };

  const removeFromCart = (cartKey) => setCart(c => { const n = { ...c }; delete n[cartKey]; return n; });

  const confirmSpend = () => {
    if (!canAfford || cartCost === 0) return;
    const updates = { xp_spent: (char.xp_spent || 0) + cartCost };
    const newLog = [...(char.xp_log || []), { amount: -cartCost, reason: 'XP spent on advances', date: new Date().toLocaleDateString() }];
    updates.xp_log = newLog;
    // Apply trait/ring changes
    Object.values(cart).forEach(item => {
      if (item.type === 'trait') {
        updates[item.key] = item.to;
        const ringInfo = TRAIT_RING_MAP[item.key];
        if (ringInfo) {
          const otherVal = (updates[ringInfo.paired] !== undefined ? updates[ringInfo.paired] : char[ringInfo.paired]) || 2;
          updates[ringInfo.ring] = Math.min(item.to, otherVal);
        }
      } else if (item.type === 'skill') {
        updates.skills = (updates.skills || char.skills || []).map(s => s.name === item.key ? { ...s, rank: item.to } : s);
      }
    });
    onBatchUpdate(updates);
    onClose();
  };

  const TRAIT_LIST = [
    { key: 'reflexes', label: 'Reflexes', ring: 'Air' },
    { key: 'awareness', label: 'Awareness', ring: 'Air' },
    { key: 'stamina', label: 'Stamina', ring: 'Earth' },
    { key: 'willpower', label: 'Willpower', ring: 'Earth' },
    { key: 'agility', label: 'Agility', ring: 'Fire' },
    { key: 'intelligence', label: 'Intelligence', ring: 'Fire' },
    { key: 'strength', label: 'Strength', ring: 'Water' },
    { key: 'perception', label: 'Perception', ring: 'Water' },
    { key: 'void', label: 'Void Ring', ring: 'Void' },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,7,4,.95)', zIndex: 200, display: 'flex', flexDirection: 'column', padding: '1.5rem', overflowY: 'auto' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', width: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--gold)' }}>Spend Experience Points</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Select advances below. Changes aren't saved until you confirm.</div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: canAfford ? 'var(--green)' : 'var(--red)' }}>{xpAvail - cartCost} XP</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{xpAvail} available − {cartCost} pending</div>
          </div>
        </div>

        {/* Insight tracker */}
        <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 6, padding: '.75rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '.4rem' }}>
            <div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Current Insight </span>
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--gold)' }}>{insight}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 6 }}>Rank {insightRank}</span>
            </div>
            {projInsight !== insight && (
              <div style={{ fontSize: 13, color: 'var(--green)' }}>→ {projInsight} after spending {projRank > insightRank ? <strong style={{ color: 'var(--gold)' }}> (Rank {projRank}!)</strong> : ''}</div>
            )}
          </div>
          {insightRank < 5 && (
            <div>
              <div style={{ height: 6, background: 'var(--bg-dark)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 3, background: 'var(--gold)', width: `${Math.min(100, ((projInsight - RANK_THRESHOLDS[insightRank-1]) / (nextThreshold - RANK_THRESHOLDS[insightRank-1])) * 100)}%`, transition: 'width .3s' }} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>Next rank at {nextThreshold} ({Math.max(0, nextThreshold - projInsight)} more insight needed)</div>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          {/* Traits */}
          <div className="card">
            <div className="card-title">Traits <span style={{ fontWeight: 400, fontSize: 12, color: 'var(--text-muted)' }}>(new rank × 4 XP)</span></div>
            {TRAIT_LIST.map(t => {
              const cur = char[t.key] || 2;
              const cartKey = `trait_${t.key}`;
              const pending = cart[cartKey];
              const displayVal = pending ? pending.to : cur;
              const nextCost = traitXpCost(displayVal);
              return (
                <div key={t.key} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '4px 0', borderBottom: '1px solid rgba(107,78,40,.15)' }}>
                  <span style={{ flex: 1, fontSize: 13, color: 'var(--text-secondary)' }}>{t.label}<span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>{t.ring}</span></span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: pending ? 'var(--green)' : 'var(--gold)', minWidth: 20, textAlign: 'center' }}>{displayVal}</span>
                  {pending && <span style={{ fontSize: 11, color: 'var(--green)' }}>↑</span>}
                  {displayVal < 5 && (
                    <button className="btn btn-sm" style={{ fontSize: 11, padding: '1px 6px' }}
                      onClick={() => addTraitToCart(t.key, cur)} title={`${nextCost} XP`}>
                      +1 ({nextCost}xp)
                    </button>
                  )}
                  {pending && <button className="btn btn-sm" style={{ fontSize: 10, color: 'var(--red)' }} onClick={() => removeFromCart(cartKey)}>✕</button>}
                </div>
              );
            })}
          </div>

          {/* Skills */}
          <div className="card">
            <div className="card-title">Skills <span style={{ fontWeight: 400, fontSize: 12, color: 'var(--text-muted)' }}>(new rank × 2 XP)</span></div>
            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              {(char.skills || []).map(s => {
                const cartKey = `skill_${s.name}`;
                const pending = cart[cartKey];
                const displayRank = pending ? pending.to : s.rank;
                const nextCost = skillXpCost(displayRank);
                return (
                  <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '.4rem', padding: '3px 0', borderBottom: '1px solid rgba(107,78,40,.15)' }}>
                    <span className={`skill-nm ${s.school ? 'sc' : ''}`} style={{ flex: 1, fontSize: 12 }}>{s.name}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: pending ? 'var(--green)' : 'var(--gold)', minWidth: 18, textAlign: 'center' }}>{displayRank}</span>
                    {displayRank < 10 && (
                      <button className="btn btn-sm" style={{ fontSize: 10, padding: '1px 5px' }}
                        onClick={() => addSkillToCart(s.name, s.rank)} title={`${nextCost} XP`}>
                        +1 ({nextCost}xp)
                      </button>
                    )}
                    {pending && <button className="btn btn-sm" style={{ fontSize: 10, color: 'var(--red)' }} onClick={() => removeFromCart(cartKey)}>✕</button>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Cart summary */}
        {Object.values(cart).length > 0 && (
          <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 6, padding: '.75rem', marginBottom: '1rem' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: '.4rem' }}>Pending Advances</div>
            {Object.values(cart).map(item => (
              <div key={item.key} style={{ display: 'flex', gap: '.5rem', fontSize: 12, color: 'var(--text-secondary)', padding: '2px 0' }}>
                <span style={{ color: 'var(--green)' }}>+</span>
                <span style={{ flex: 1 }}>{item.label} {item.from} → {item.to}</span>
                <span style={{ color: 'var(--gold)' }}>{item.cost} XP</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--border)', marginTop: '.4rem', paddingTop: '.4rem', display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
              <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>Total</span>
              <span style={{ fontSize: 14, color: canAfford ? 'var(--gold)' : 'var(--red)' }}>{cartCost} XP</span>
            </div>
            {!canAfford && <div style={{ fontSize: 11, color: 'var(--red)', marginTop: '.3rem' }}>Not enough XP — remove some advances or ask your GM for more XP.</div>}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '.75rem' }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-p" disabled={!canAfford || cartCost === 0} onClick={confirmSpend}>
            Confirm — Spend {cartCost} XP
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Character Sheet ───────────────────────────────────────────────────────────
function CharacterSheet({ char, isGM, isPCView, canEdit, onUpdate, onCreateCharacter, onToggleEdit, addEq, setAddEq }) {
  const wR = getWoundRank(char.current_wounds, char.max_wounds);
  const xpAvail = (char.xp_total || 0) - (char.xp_spent || 0);
  const [showXpPanel, setShowXpPanel] = useState(false);
  const [pendingRankUp, setPendingRankUp] = useState(false);

  const insight = calcInsight(char);
  const insightRank = insightRankFor(insight);
  // Show rank-up overlay if insight qualifies for a higher rank than current school_rank
  const needsRankUp = insightRank > (char.school_rank || 1) && (char.school_rank || 1) < 5;

  const update = (field, value) => onUpdate(char.id, { [field]: value });

  // Batch update — one Supabase call for XP spending
  const batchUpdate = (updates) => {
    onUpdate(char.id, updates);
    // Check if the new state triggers a rank-up
    const projChar = { ...char, ...updates };
    const projInsight = calcInsight(projChar);
    const projRank = insightRankFor(projInsight);
    if (projRank > (char.school_rank || 1)) setPendingRankUp(true);
  };

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
  const avatarUrl = (char.avatar_url || '').trim();
  const [imgError, setImgError] = useState(false);
  useEffect(() => { setImgError(false); }, [avatarUrl]);
  const [urlDraft, setUrlDraft] = useState(char.avatar_url || '');
  useEffect(() => { setUrlDraft(char.avatar_url || ''); }, [char.id, char.avatar_url]);

  const woundLabel = ['Healthy','Nicked','Grazed','Hurt','Injured','Crippled','Down','Out'][wR] || 'Healthy';
  const woundColor = ['#4a8a40','#8a8a30','#a87830','#c86030','#c84030','#a02828','#801818','#600010'][wR] || '#4a8a40';

  const SKILL_MASTERIES = {
    // Weapon skills
    Swordsmanship: { 3: 'Attacks are Simple Actions with chosen sword type', 5: '+1k0 to all attack rolls with swords', 7: 'Ignore opponent\'s reduction on a Called Shot (3 raises)' },
    Knives:        { 3: 'Throw knives up to 30\' without penalty', 5: 'Extra Attack costs 3 raises instead of 5', 7: '+1k1 damage with knives' },
    Polearms:      { 3: 'Polearm attacks count as Simple Actions', 5: '+1k0 to attack rolls with polearms', 7: 'Push a target 5\' on any hit (no raise needed)' },
    Spears:        { 3: 'Attack from a second rank (behind another combatant)', 5: '+1k0 to attack rolls with spears', 7: 'Spear attacks penetrate one level of armor' },
    Staves:        { 3: 'Knockdown on a hit costs only 1 raise', 5: '+1k0 to defense while wielding a staff', 7: 'Free raise on all staff attacks' },
    Archery:       { 3: 'Reload a bow as a Free Action', 5: '+1k0 to attack rolls with bows', 7: 'May target a specific location without a Called Shot raise' },
    Brawling:      { 3: 'Grapple checks are Simple Actions', 5: '+1k0 damage in a grapple', 7: 'Free raise on all grapple rolls' },
    Tahaddi:       { 3: 'Ready two tahaddi knives as a Free Action', 5: '+1k0 to Assessment rolls in Tahaddi duels', 7: 'Spend Void to add +1k1 damage in Tahaddi' },
    // Combat / physical
    Athletics:     { 3: 'Move full distance as a Free Action', 5: '+1k0 to all Athletics rolls', 7: 'Ignore difficult terrain penalties' },
    Defense:       { 3: '+1k0 Armor TN in Full Defense', 5: 'Negate one attack per round as Free Action (spend Void)', 7: '+5 Armor TN at all times' },
    Battle:        { 3: 'Identify enemy tactics with a Battle roll (TN 10)', 5: '+1k0 to Battle rolls', 7: 'Grant an ally one extra Simple Action per round' },
    // Social
    Sincerity:     { 3: 'Free raise on Sincerity rolls to appear truthful', 5: '+1k0 to Sincerity rolls', 7: 'Once/scene: successfully lie is never detected by magic' },
    Etiquette:     { 3: 'Never accidentally commit a social blunder', 5: '+1k0 to Etiquette rolls', 7: 'Courteous words never cause an Honor or Glory loss' },
    Temptation:    { 3: 'Free raise on Temptation rolls', 5: '+1k0 to Temptation rolls', 7: 'Targets cannot resist a successful Temptation with Willpower rolls' },
    Courtier:      { 3: 'Free raise in social contests', 5: '+1k0 to Courtier rolls', 7: 'Read the true intention of anyone in conversation' },
    Intimidation:  { 3: 'Intimidation as a Simple Action', 5: '+1k0 to Intimidation rolls', 7: 'Targets who fail cannot recover until out of the scene' },
    // Scholarly
    Spellcraft:    { 3: 'Free raise on one spell type of choice', 5: 'Reduce spell TN by 2', 7: 'Cast one spell/session without Hakhim\'s Seal' },
    Investigation: { 3: 'Free raise when searching for hidden objects', 5: '+1k0 to all Investigation rolls', 7: 'Cannot be surprised' },
    Medicine:      { 3: 'Treat two patients per day', 5: '+1k0 to all Medicine rolls', 7: 'Patients heal double wounds from rest' },
    Divination:    { 3: 'Free raise on Divination rolls', 5: '+1k0 to Divination; may use Awareness ring', 7: 'Once/session: ask GM one yes/no about immediate future' },
    Meditation:    { 3: 'Regain 1 Void Point per scene of meditation (once/day)', 5: '+1k0 to Meditation rolls', 7: 'May spend Void freely without it counting toward void-spend limit' },
    // Stealth / criminal
    Stealth:       { 3: 'Move full speed while stealthed without penalty', 5: '+1k0 to all Stealth rolls', 7: 'Hide in plain sight once per scene' },
    Hunting:       { 3: 'Free raise when tracking', 5: '+1k0 in natural environments', 7: 'Find food and water for a group of 10 anywhere' },
    'Sleight of Hand': { 3: 'Conceal items on your person undetected', 5: '+1k0 to Sleight of Hand rolls', 7: 'Pick locks and pockets in plain sight without penalties' },
  };

  return (
    <div>
      {/* ── Overlays ── */}
      {showXpPanel && (
        <XPSpendPanel char={char} onBatchUpdate={batchUpdate} onClose={() => setShowXpPanel(false)} />
      )}
      {(needsRankUp || pendingRankUp) && !showXpPanel && (
        <RankUpOverlay
          char={char}
          newRank={(char.school_rank || 1) + 1}
          onConfirm={(choice) => {
            const newRank = (char.school_rank || 1) + 1;
            const updated = { ...(char.techniques || {}), [newRank]: choice.techName };
            onUpdate(char.id, { school_rank: newRank, techniques: updated });
            setPendingRankUp(false);
          }}
        />
      )}

      {/* ── Top card: Name/Avatar + Rings + Wounds ── */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>

          {/* Name block — top left */}
          <div style={{ minWidth: 160, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.4rem' }}>
              <div
                style={{ width: 40, height: 52, borderRadius: 4, background: 'var(--bg-panel)', border: `2px solid ${avatarColor}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', cursor: canEdit ? 'pointer' : 'default', position: 'relative' }}
                onClick={() => canEdit && setShowAvatarPicker(p => !p)}>
                {avatarUrl && !imgError ? (
                  <img src={avatarUrl} alt={char.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setImgError(true)} />
                ) : (
                  <Silhouette type={avatarType} size={32} color={avatarColor} />
                )}
                {canEdit && <div style={{ position: 'absolute', bottom: 1, right: 1, fontSize: 9, color: avatarColor }}>✏</div>}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>{char.name}</div>
                  <button className={`btn btn-sm ${canEdit ? 'btn-p' : ''}`} style={{ fontSize: 10, padding: '1px 5px' }} onClick={onToggleEdit}>
                    <i className={`ti ${canEdit ? 'ti-lock' : 'ti-edit'}`} style={{ fontSize: 11 }} />
                  </button>
                </div>
                {canEdit && isGM ? (
                  <select value={char.faction || ''} onChange={e => update('faction', e.target.value)}
                    style={{ fontSize: 11, marginTop: 2, marginBottom: 2, background: 'var(--bg-panel)', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: 3 }}>
                    <option value="">— No faction —</option>
                    {FACTIONS_LIST.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                ) : (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{char.faction}</div>
                )}
                <div style={{ fontSize: 12, color: 'var(--gold-dim)' }}>{char.school} R{char.school_rank}</div>
                <div style={{ marginTop: '.35rem', display: 'flex', gap: 4 }}>
                  <button className="btn btn-sm" style={{ fontSize: 10, padding: '1px 6px' }} onClick={() => {
                    const { id, game_id, created_at, updated_at, ...exportData } = char;
                    const blob = new Blob([JSON.stringify({ format: 'sandy_character', version: 1, exported_at: new Date().toISOString(), character: exportData }, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a'); a.href = url; a.download = `${char.name.replace(/\s+/g,'-').toLowerCase()}-sheet.json`; a.click(); URL.revokeObjectURL(url);
                  }}>
                    <i className="ti ti-download" style={{ fontSize: 10, marginRight: 3 }} />Export Sheet
                  </button>
                  {onCreateCharacter && (
                    <label className="btn btn-sm" style={{ fontSize: 10, padding: '1px 6px', cursor: 'pointer' }}>
                      <i className="ti ti-upload" style={{ fontSize: 10, marginRight: 3 }} />Import Sheet
                      <input type="file" accept=".json" style={{ display: 'none' }} onChange={async e => {
                        const file = e.target.files?.[0]; if (!file) return;
                        const text = await file.text();
                        try {
                          const parsed = JSON.parse(text);
                          const charData = parsed.character || parsed;
                          if (!charData.name || !charData.school) { alert('Invalid character file — missing name or school.'); return; }
                          const { id, game_id, created_at, updated_at, ...cleanData } = charData;
                          await onCreateCharacter({ ...cleanData, name: charData.name + ' (imported)' });
                        } catch { alert('Could not read that file — make sure it\'s a Sandy character export.'); }
                        e.target.value = '';
                      }} />
                    </label>
                  )}
                </div>
              </div>
            </div>
            {/* Avatar picker */}
            {showAvatarPicker && canEdit && (
              <div style={{ marginBottom: '.5rem', padding: '.5rem', background: 'var(--bg-dark)', borderRadius: 4, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>Portrait URL <span style={{ fontWeight: 400 }}>(optional — overrides the icon below if set)</span></div>
                <input type="text" value={urlDraft} onChange={e => setUrlDraft(e.target.value)}
                  onBlur={() => { if (urlDraft !== (char.avatar_url || '')) update('avatar_url', urlDraft); }}
                  onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }}
                  placeholder="https://..." style={{ width: '100%', fontSize: 12, marginBottom: '.5rem' }} />
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
                <button className="btn btn-sm" style={{ marginTop: '.4rem', fontSize: 11 }} onClick={() => setShowAvatarPicker(false)}>Done</button>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 12 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Integrity <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{char.integrity}</span></span>
            </div>
            {/* Reputation & Status — prominent */}
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              <div style={{ textAlign: 'center', background: 'var(--bg-panel)', border: '1px solid #a07830', borderRadius: 5, padding: '3px 10px', minWidth: 52 }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#c8a040', lineHeight: 1 }}>{char.reputation ?? 1}</div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Rep</div>
              </div>
              <div style={{ textAlign: 'center', background: 'var(--bg-panel)', border: '1px solid #6080a0', borderRadius: 5, padding: '3px 10px', minWidth: 52 }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#80a8c8', lineHeight: 1 }}>{char.status ?? 1}</div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Status</div>
              </div>
              {canEdit && isGM && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, justifyContent: 'center' }}>
                  <div style={{ display: 'flex', gap: 2 }}>
                    <button className="rep-btn" onClick={() => update('reputation', Math.max(0, (char.reputation || 1) - 1))}>−</button>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', alignSelf: 'center', minWidth: 22 }}>Rep</span>
                    <button className="rep-btn" onClick={() => update('reputation', (char.reputation || 1) + 1)}>+</button>
                  </div>
                  <div style={{ display: 'flex', gap: 2 }}>
                    <button className="rep-btn" onClick={() => update('status', Math.max(0, (char.status || 1) - 1))}>−</button>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', alignSelf: 'center', minWidth: 22 }}>Stat</span>
                    <button className="rep-btn" onClick={() => update('status', (char.status || 1) + 1)}>+</button>
                  </div>
                </div>
              )}
            </div>
            {/* Wounds */}
            <div style={{ marginTop: '.5rem', padding: '.4rem .5rem', background: 'var(--bg-panel)', borderRadius: 4, border: `1px solid ${woundColor}44` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: woundColor, lineHeight: 1 }}>{char.current_wounds || 0}</div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>/ {char.max_wounds || (char.stamina || 2) * 10} wounds</div>
                  <div style={{ fontSize: 12, color: woundColor, fontWeight: 600 }}>{woundLabel}</div>
                </div>
                {(isGM && !isPCView) && (
                  <div style={{ display: 'flex', gap: 3, marginLeft: 'auto' }}>
                    <button className="btn btn-sm" style={{ fontSize: 11, padding: '1px 6px' }} onClick={() => update('current_wounds', Math.max(0, (char.current_wounds || 0) - 1))}>Heal</button>
                    <button className="btn btn-sm btn-d" style={{ fontSize: 11, padding: '1px 6px' }} onClick={() => update('current_wounds', (char.current_wounds || 0) + 1)}>+Wound</button>
                  </div>
                )}
              </div>
            </div>
            {/* Armor TN / Init */}
            <div style={{ marginTop: '.4rem', fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 8 }}>
              <span>TN <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{5 + (char.reflexes || 2) * 5}</span></span>
              <span>Init <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{char.reflexes || 2}k{char.air || 2}</span></span>
              <span>XP <span style={{ color: xpAvail > 0 ? 'var(--green)' : 'var(--text-muted)', fontWeight: 600 }}>{xpAvail}</span></span>
            </div>
          </div>

          {/* ── Rings Diagram — five interlocking rings, prominent top-center ── */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
            {(() => {
              const RING_COLORS = { Air: '#a0c0e0', Earth: '#80c090', Fire: '#e09050', Water: '#60b0d0', Void: '#c0a0e0' };
              const rings = [
                { key: 'Fire',  val: char.fire,  cx: 145, cy: 70,  traits: [['Agility', char.agility],['Intelligence', char.intelligence]], side: 'left' },
                { key: 'Air',   val: char.air,   cx: 255, cy: 70,  traits: [['Reflexes', char.reflexes],['Awareness', char.awareness]], side: 'right' },
                { key: 'Earth', val: char.earth, cx: 105, cy: 155, traits: [['Stamina', char.stamina],['Willpower', char.willpower]], side: 'left' },
                { key: 'Water', val: char.water, cx: 295, cy: 155, traits: [['Strength', char.strength],['Perception', char.perception]], side: 'right' },
                { key: 'Void',  val: char.void,  cx: 200, cy: 220, traits: null, side: 'center' },
              ];
              const W = 430, H = 290;
              return (
                <div style={{ position: 'relative' }}>
                  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
                    {/* Decorative interlocking ring strokes */}
                    {rings.map(r => (
                      <circle key={r.key + '_ring'} cx={r.cx} cy={r.cy} r={62}
                        fill="none" stroke={RING_COLORS[r.key]} strokeWidth={10} strokeOpacity={0.18} />
                    ))}
                    {rings.map(r => (
                      <circle key={r.key + '_ring2'} cx={r.cx} cy={r.cy} r={62}
                        fill="none" stroke={RING_COLORS[r.key]} strokeWidth={3} strokeOpacity={0.5} />
                    ))}
                    {/* Orbs — the value circles */}
                    {rings.map(r => (
                      <g key={r.key}>
                        <circle cx={r.cx} cy={r.cy} r={28}
                          fill="var(--bg-deep)" stroke={RING_COLORS[r.key]} strokeWidth={2} />
                        <text x={r.cx} y={r.cy - 9} textAnchor="middle" fill={RING_COLORS[r.key]}
                          fontSize={9} fontWeight={700} letterSpacing={1}>
                          {r.key.toUpperCase()}
                        </text>
                        <text x={r.cx} y={r.cy + 14} textAnchor="middle" fill={RING_COLORS[r.key]}
                          fontSize={22} fontWeight={900}>
                          {r.val || 2}
                        </text>
                      </g>
                    ))}

                    {/* Trait labels — LEFT rings (Fire, Earth): labels on the far left */}
                    {rings.filter(r => r.side === 'left').map(r =>
                      (r.traits || []).map(([name, val], ti) => {
                        const ty = r.cy + (ti === 0 ? -12 : 12);
                        return (
                          <g key={name}>
                            {/* value in ring color */}
                            <text x={r.cx - 36} y={ty + 5} textAnchor="end"
                              fill={RING_COLORS[r.key]} fontSize={16} fontWeight={800}>{val}</text>
                            {/* name label */}
                            <text x={r.cx - 40} y={ty + 5} textAnchor="end"
                              fill="var(--text-muted)" fontSize={11} fontWeight={500}
                              dx={-2}>{name}</text>
                          </g>
                        );
                      })
                    )}

                    {/* Trait labels — RIGHT rings (Air, Water): labels on the far right */}
                    {rings.filter(r => r.side === 'right').map(r =>
                      (r.traits || []).map(([name, val], ti) => {
                        const ty = r.cy + (ti === 0 ? -12 : 12);
                        return (
                          <g key={name}>
                            <text x={r.cx + 36} y={ty + 5} textAnchor="start"
                              fill={RING_COLORS[r.key]} fontSize={16} fontWeight={800}>{val}</text>
                            <text x={r.cx + 40} y={ty + 5} textAnchor="start"
                              fill="var(--text-muted)" fontSize={11} fontWeight={500}
                              dx={20}>{name}</text>
                          </g>
                        );
                      })
                    )}

                    {/* Void dots below void orb — big, black when spent */}
                    {char.void && (() => {
                      const vr = rings.find(r => r.key === 'Void');
                      const R = 12;
                      const gap = 28;
                      return Array.from({ length: char.void }, (_, i) => {
                        const filled = i < (char.current_void || 0);
                        const cx = vr.cx - ((char.void - 1) * gap) / 2 + i * gap;
                        return (
                          <circle key={i} cx={cx} cy={vr.cy + 40}
                            r={R}
                            fill={filled ? '#111' : 'transparent'}
                            stroke={filled ? '#555' : RING_COLORS.Void + '88'}
                            strokeWidth={2}
                            style={{ cursor: 'pointer' }}
                            onClick={() => update('current_void', filled ? i : i + 1)} />
                        );
                      });
                    })()}
                  </svg>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      <div className="g2">
      {/* Left column — Skills prominent */}
      <div>
        {/* Skills */}
        <div className="card">
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Skills</span>
            {canEdit && <AddSkillControl char={char} onAdd={(skillName) => {
              if ((char.skills || []).some(s => s.name === skillName)) return;
              update('skills', [...(char.skills || []), { name: skillName, rank: 1, school: false }]);
            }} />}
          </div>
          {/* Quick-add weapon skills strip — shows any combat skill not yet on this character */}
          {canEdit && (() => {
            const WEAPON_SKILLS = ['Swordsmanship','Knives','Polearms','Spears','Staves','Brawling','Archery','Tahaddi','Assassin Ranged Weapons'];
            const existing = new Set((char.skills || []).map(s => s.name));
            const missing = WEAPON_SKILLS.filter(s => !existing.has(s));
            if (missing.length === 0) return null;
            return (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: '.5rem', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', alignSelf: 'center', marginRight: 2 }}>Add:</span>
                {missing.map(s => (
                  <button key={s} className="btn btn-sm" style={{ fontSize: 10, padding: '1px 5px', color: 'var(--gold-dim)', borderColor: 'var(--gold-dim)' }}
                    onClick={() => update('skills', [...(char.skills || []), { name: s, rank: 1, school: false }])}>
                    {s}
                  </button>
                ))}
              </div>
            );
          })()}
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {(char.skills || []).map(s => {
              const masteries = SKILL_MASTERIES[s.name] || {};
              const unlockedMasteries = Object.entries(masteries).filter(([rank]) => s.rank >= +rank);
              return (
                <div key={s.name}>
                  <div className="skill-row">
                    <span className={`skill-nm ${s.school ? 'sc' : ''}`}>{s.name}</span>
                    <SkillDots rank={s.rank} />
                    {(canEdit && isGM) && (
                      <div style={{ display: 'flex', gap: 2, marginLeft: 4 }}>
                        <button className="trait-btn" onClick={() => { const skills = (char.skills || []).map(x => x.name === s.name ? { ...x, rank: Math.max(0, x.rank - 1) } : x); update('skills', skills); }}>−</button>
                        <button className="trait-btn" onClick={() => { const skills = (char.skills || []).map(x => x.name === s.name ? { ...x, rank: Math.min(10, x.rank + 1) } : x); update('skills', skills); }}>+</button>
                      </div>
                    )}
                  </div>
                  {unlockedMasteries.map(([rank, desc]) => (
                    <div key={rank} style={{ fontSize: 11, color: 'var(--gold-dim)', paddingLeft: 16, paddingBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <i className="ti ti-star" style={{ fontSize: 10 }} />R{rank}: {desc}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* XP */}
        <div className="card">
          <div className="card-title">Experience & Insight</div>
          {/* Insight */}
          <div style={{ background: 'var(--bg-panel)', borderRadius: 5, padding: '.5rem .65rem', marginBottom: '.6rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: insightRank < 5 ? '.3rem' : 0 }}>
              <div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Insight </span>
                <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--gold)' }}>{insight}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>Rank {insightRank}</span>
              </div>
              {needsRankUp && (
                <span style={{ fontSize: 11, color: 'var(--green)', border: '1px solid var(--green-dim)', borderRadius: 3, padding: '0 5px', animation: 'blink 1.4s infinite' }}>
                  ★ Rank Up Available!
                </span>
              )}
            </div>
            {insightRank < 5 && (() => {
              const threshold = RANK_THRESHOLDS[insightRank];
              const prev = RANK_THRESHOLDS[insightRank - 1] || 0;
              const pct = Math.min(100, ((insight - prev) / (threshold - prev)) * 100);
              return (
                <>
                  <div style={{ height: 5, background: 'var(--bg-dark)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 3, background: needsRankUp ? 'var(--green)' : 'var(--gold)', width: `${pct}%` }} />
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                    Rank {insightRank + 1} at {threshold} ({Math.max(0, threshold - insight)} more)
                  </div>
                </>
              );
            })()}
          </div>
          {/* XP numbers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, marginBottom: '.5rem' }}>
            {[['Total', char.xp_total || 0, 'var(--gold)'], ['Spent', char.xp_spent || 0, 'var(--text-secondary)'], ['Available', xpAvail, xpAvail > 0 ? 'var(--green)' : 'var(--red)']].map(([l, v, col]) => (
              <div key={l} style={{ textAlign: 'center', background: 'var(--bg-panel)', borderRadius: 4, padding: '.4rem' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: col }}>{v}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{l}</div>
              </div>
            ))}
          </div>
          {/* Recent XP log */}
          {(char.xp_log || []).slice(-3).map((e, i) => (
            <div key={i} style={{ fontSize: 12, color: 'var(--text-muted)', padding: '2px 0', borderBottom: '1px solid rgba(107,78,40,.2)' }}>
              <span style={{ color: e.amount > 0 ? 'var(--gold)' : 'var(--text-muted)' }}>{e.amount > 0 ? `+${e.amount}` : e.amount} XP</span> — {e.reason}
            </div>
          ))}
          {/* Spend XP button — visible to players when they have XP */}
          {!isGM && xpAvail > 0 && (
            <button className="btn btn-p" style={{ width: '100%', marginTop: '.5rem' }} onClick={() => setShowXpPanel(true)}>
              <i className="ti ti-coins" style={{ marginRight: 6 }} />Spend {xpAvail} XP
            </button>
          )}
          {/* GM grant XP */}
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
                <label style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0, cursor: 'pointer' }} title="Mark as currently equipped/wielded">
                  <input type="checkbox" checked={e.inUse || false} onChange={() => toggleEqInUse(i)} style={{ accentColor: 'var(--gold)' }} />
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>In use</span>
                </label>
                <span style={{ flex: 1, color: e.inUse ? 'var(--text-primary)' : 'var(--text-muted)' }}>{e.name}</span>
                {e.dr && <span style={{ fontSize: 11, color: 'var(--gold-dim)' }}>{e.dr}</span>}
                <ScrollLore title={e.name} text={loreText} size={10} />
                {canEdit && <button className="btn btn-sm btn-d" style={{ padding: '1px 5px', fontSize: 11 }} onClick={() => removeEq(i)}>×</button>}
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
          {Array.from({ length: char.school_rank || 1 }, (_, i) => i + 1).map(rank => {
            const currentTech = (char.techniques || {})[rank] || '';
            const sd = SCHOOL_DATA[char.school];
            const schoolTechAtRank = sd?.techniques?.[rank];
            // All schools' rank-1 techniques (for starting a second school at this slot)
            const allSchoolRank1 = Object.entries(SCHOOL_DATA)
              .filter(([sName]) => sName !== char.school)
              .map(([sName, sData]) => ({ school: sName, tech: sData.techniques?.[1] }))
              .filter(x => x.tech);
            // Any school/path that has a technique at exactly this rank (for paths with rank 2, etc.)
            const othersAtThisRank = rank > 1 ? Object.entries(SCHOOL_DATA)
              .filter(([sName]) => sName !== char.school)
              .map(([sName, sData]) => ({ school: sName, tech: sData.techniques?.[rank] }))
              .filter(x => x.tech) : [];

            return (
              <div key={rank} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, padding: '5px 0', borderBottom: '1px solid rgba(107,78,40,.2)' }}>
                <span style={{ color: 'var(--gold-dim)', fontSize: 12, minWidth: 20, marginTop: 2, flexShrink: 0 }}>R{rank}</span>
                {canEdit && isGM ? (
                  <div style={{ flex: 1, display: 'flex', gap: 4, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 120 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: currentTech ? 'var(--text-primary)' : 'var(--text-muted)', fontStyle: currentTech ? 'normal' : 'italic' }}>
                        {currentTech || '— not set —'}
                      </div>
                    </div>
                    <select style={{ fontSize: 11, maxWidth: 220 }}
                      value=""
                      onChange={e => {
                        if (!e.target.value) return;
                        const updated = { ...(char.techniques || {}), [rank]: e.target.value };
                        update('techniques', updated);
                      }}>
                      <option value="">Change technique…</option>
                      {schoolTechAtRank && (
                        <optgroup label={`${char.school} — Rank ${rank}`}>
                          <option value={schoolTechAtRank}>{schoolTechAtRank}</option>
                        </optgroup>
                      )}
                      {othersAtThisRank.length > 0 && (
                        <optgroup label={`Other Schools — Rank ${rank}`}>
                          {othersAtThisRank.map(x => (
                            <option key={x.school + rank} value={x.tech}>{x.school}: {x.tech}</option>
                          ))}
                        </optgroup>
                      )}
                      <optgroup label="Any School — Rank 1 (start new school)">
                        {allSchoolRank1.map(x => (
                          <option key={x.school + '1'} value={x.tech}>{x.school}: {x.tech}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                ) : (
                  <>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{currentTech}</div>
                      {TECHNIQUE_DESCRIPTIONS[currentTech] && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>
                          {TECHNIQUE_DESCRIPTIONS[currentTech]}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
          {canEdit && isGM && (
            <div style={{ marginTop: '.5rem', fontSize: 12, color: 'var(--text-muted)' }}>
              School Rank:
              <input type="number" min={1} max={8} value={char.school_rank || 1} style={{ width: 50, marginLeft: 6 }}
                onChange={e => {
                  const newRank = +e.target.value;
                  // Add the school's expected technique for new slots, but keep existing custom ones
                  const existing = char.techniques || {};
                  const sd = SCHOOL_DATA[char.school];
                  const updated = { ...existing };
                  for (let i = 1; i <= newRank; i++) {
                    if (!updated[i] && sd?.techniques?.[i]) updated[i] = sd.techniques[i];
                  }
                  update('school_rank', newRank);
                  update('techniques', updated);
                }} />
            </div>
          )}
          {canEdit && !isGM && (
            <div style={{ marginTop: '.5rem', fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
              School Rank is set by your GM when you rank up.
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
                    <div key={a.name} style={{ padding: '4px 0', borderBottom: '1px solid rgba(107,78,40,.2)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ flex: 1, fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{a.name}</span>
                        <span style={{ color: 'var(--gold-dim)', fontSize: 11 }}>({a.cost} pts)</span>
                      </div>
                      {adv?.desc && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1, lineHeight: 1.4 }}>{adv.desc}</div>}
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
                    <div key={d.name} style={{ padding: '4px 0', borderBottom: '1px solid rgba(107,78,40,.2)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ flex: 1, fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{d.name}</span>
                        <span style={{ color: 'var(--red)', fontSize: 11 }}>(+{d.value} CP)</span>
                      </div>
                      {dis?.desc && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1, lineHeight: 1.4 }}>{dis.desc}</div>}
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
  const [portraitUrl, setPortraitUrl] = useState('');
  const [traits, setTraits] = useState({ Reflexes:2,Awareness:2,Stamina:2,Willpower:2,Agility:2,Intelligence:2,Strength:2,Perception:2,Void:2 });
  const [skills, setSkills] = useState({});
  const [customSkillInput, setCustomSkillInput] = useState(null); // null = hidden, string = text being entered
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
    const charData = buildCharacterFromForm({ faction, subfaction, school, name, playerName, traits, skills, advantages, disadvantages, selectedSpells, spellEmphasis });
    onComplete({ ...charData, game_id: GAME_ID, is_npc: isNpc, avatar_url: portraitUrl.trim() });
  };

  return (
    <div style={{ maxWidth: 700 }}>
      {onCancel && <button className="btn btn-sm" style={{ marginBottom: '1rem' }} onClick={onCancel}>← Back</button>}

      {/* PC / NPC toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1rem', padding: '.5rem .75rem', background: isNpc ? 'rgba(200,64,48,.08)' : 'rgba(74,138,64,.08)', border: `1px solid ${isNpc ? 'rgba(200,64,48,.3)' : 'rgba(74,138,64,.3)'}`, borderRadius: 5 }}>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Creating:</span>
        <button className={`btn btn-sm ${!isNpc ? 'btn-p' : ''}`} onClick={() => setIsNpc(false)}>
          <i className="ti ti-user" style={{ fontSize: 12, marginRight: 4 }} />Player Character
        </button>
        <button className={`btn btn-sm ${isNpc ? 'btn-p' : ''}`} style={isNpc ? { borderColor: '#c84030', background: 'rgba(200,64,48,.2)', color: '#e86050' } : {}} onClick={() => setIsNpc(true)}>
          <i className="ti ti-user-bolt" style={{ fontSize: 12, marginRight: 4 }} />NPC (Full Sheet)
        </button>
        {isNpc && <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>GM-only, won't appear on player character list</span>}
      </div>

      {/* Progress */}
      <div className="cc-progress">{steps.map((_, i) => <div key={i} className={`cc-prog-dot ${i < step - 1 ? 'done' : i === step - 1 ? 'active' : ''}`} />)}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: '.25rem' }}>Step {step}: {steps[step - 1]}</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        {step === 1 ? 'Choose your faction.' : step === 2 ? 'Choose your sub-faction — grants a bonus trait.' : step === 3 ? 'Choose your school.' : step === 4 ? 'Spend your 45 Character Points.' : step === spellStep ? `Select starting ${school === "Ra'Shari Diviner" ? 'Cokaloi (6)' : 'spells (3)'}.` : step === advStep ? 'Choose advantages and disadvantages. Max 10 points from disadvantages.' : 'Name your character and set a login password.'}
      </div>

      {/* Step 1: Faction */}
      {step === 1 && (
        <div>
          {FACTIONS_LIST.map(f => (
            <div key={f} className={`faction-card ${faction === f ? 'sel' : ''}`} onClick={() => setFaction(f)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                <FacIcon name={f} size={18} />
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{f}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1 }}>{FACTIONS_DATA.find(x => x.name === f)?.tagline}</span>
                {faction === f && <i className="ti ti-check" style={{ color: 'var(--gold)', fontSize: 16 }} />}
              </div>
              {faction === f && <div style={{ marginTop: '.4rem', fontSize: 12, color: 'var(--text-secondary)' }}>Schools: {(FACTION_SCHOOLS[f] || []).join(', ')}</div>}
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
                <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{sf}</span>
                <span style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 600 }}>+1 {trait === 'Any' ? 'Any Trait' : trait}</span>
                {subfaction === sf && <i className="ti ti-check" style={{ color: 'var(--gold)', fontSize: 16 }} />}
              </div>
              {subfaction === sf && trait === 'Any' && (
                <div style={{ marginTop: '.5rem' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', marginRight: '.5rem' }}>Choose trait:</span>
                  <select value={eboniteAny} onChange={e => setEboniteAny(e.target.value)} style={{ fontSize: 13 }}>
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
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{s}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sd.type} · Integrity {sd.integrity} · +1 {sd.bonus_trait}</div>
                  </div>
                  {school === s && <i className="ti ti-check" style={{ color: 'var(--gold)', fontSize: 16, marginLeft: 'auto' }} />}
                </div>
                {school === s && (
                  <div style={{ marginTop: '.5rem', paddingTop: '.5rem', borderTop: '1px solid rgba(107,78,40,.3)' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: '.25rem' }}>School Skills:</div>
                    <div style={{ fontSize: 12, color: 'var(--gold-light)' }}>{sd.skills.join(', ')}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: '.25rem' }}>R1 Technique: <span style={{ color: 'var(--text-secondary)' }}>{sd.techniques?.[1] || '—'}</span></div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: '.25rem' }}>Equipment: <span style={{ color: 'var(--text-secondary)' }}>{sd.equipment?.join(', ')}</span></div>
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
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{cpSpent}/{cpAvailable} spent{disCost > 0 ? ` (+${disCost} dis)` : ''}</div>
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
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>base {base}</span>
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
                    <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--gold)', width: 20, textAlign: 'center' }}>{skills[s] || 0}</span>
                    <button className="trait-btn" onClick={() => adjustSkill(s, 1)} disabled={(skills[s] || 0) >= 7}>+</button>
                  </div>
                ))}
                <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '.4rem 0', borderTop: '1px solid var(--border)', marginTop: '.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Additional Skills <span style={{ fontStyle: 'italic' }}>(2 CP/rank)</span></span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <select style={{ fontSize: 11, maxWidth: 150 }} value="" onChange={e => {
                      if (!e.target.value) return;
                      const val = e.target.value;
                      if (OPEN_SKILLS.some(p => val === p + ': [Custom]')) {
                        const prefix = val.replace(': [Custom]', ': ');
                        setCustomSkillInput(prefix);
                      } else if (!skills[val]) {
                        adjustSkill(val, 1);
                      }
                    }}>
                      <option value="">+ Add skill…</option>
                      {Object.entries(SKILL_CATEGORIES).map(([cat, catSkills]) => (
                        <optgroup key={cat} label={cat}>
                          {catSkills.filter(s => !(SCHOOL_DATA[school]?.skills || []).includes(s) && !s.endsWith('[Custom]')).map(s => (
                            <option key={s} value={s}>{s} {skills[s] ? `(${skills[s]})` : ''}</option>
                          ))}
                          {catSkills.some(s => s.endsWith('[Custom]')) && (
                            <option value={catSkills.find(s => s.endsWith('[Custom]'))}>{cat.split(' ')[0]}: [type your own…]</option>
                          )}
                        </optgroup>
                      ))}
                    </select>
                    {customSkillInput !== null && (
                      <form onSubmit={e => { e.preventDefault(); const n = customSkillInput.trim(); if (n && !n.endsWith(': ')) { adjustSkill(n, 1); setCustomSkillInput(null); } }} style={{ display: 'flex', gap: 2 }}>
                        <input autoFocus style={{ fontSize: 11, width: 110 }} value={customSkillInput} placeholder="Lore: Sewers"
                          onChange={e => setCustomSkillInput(e.target.value)} />
                        <button type="submit" className="btn btn-sm" style={{ fontSize: 10, padding: '0 4px' }}>Add</button>
                        <button type="button" className="btn btn-sm" style={{ fontSize: 10, padding: '0 4px' }} onClick={() => setCustomSkillInput(null)}>✕</button>
                      </form>
                    )}
                  </div>
                </div>
                {Object.keys(skills).filter(s => !(SCHOOL_DATA[school]?.skills || []).includes(s) && (skills[s] || 0) > 0).map(s => (
                  <div key={s} className="skill-row">
                    <span className="skill-nm" style={{ flex: 1 }}>{s}</span>
                    <button className="trait-btn" onClick={() => { if ((skills[s] || 0) <= 1) { adjustSkill(s, -1); } else adjustSkill(s, -1); }} disabled={!(skills[s]) || skills[s] <= 0}>−</button>
                    <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--gold)', width: 20, textAlign: 'center' }}>{skills[s] || 0}</span>
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
            <div style={{ fontSize: 13, color: selectedSpells.length >= startingSpells ? 'var(--green)' : 'var(--text-muted)' }}>
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
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>Disadvantage cap: {disTotal}/10</div>
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
                        <div style={{ fontSize: 13, color: has ? 'var(--gold)' : 'var(--text-primary)' }}>{a.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.desc}</div>
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
              <div className="card-title">Disadvantages <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>(gain CP, max 10)</span></div>
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {DISADVANTAGES.map(d => {
                  const has = disadvantages.find(x => x.name === d.name);
                  return (
                    <div key={d.name} className="adv-item">
                      <span className="adv-cost neg">+{d.value}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: has ? 'var(--red)' : 'var(--text-primary)' }}>{d.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{d.desc}</div>
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
              <div><label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: '.25rem' }}>Character Name *</label><input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Enter character name" style={{ width: '100%' }} /></div>
              <div><label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: '.25rem' }}>Player Name</label><input type="text" value={playerName} onChange={e => setPlayerName(e.target.value)} placeholder="Enter player name" style={{ width: '100%' }} /></div>
              <div><label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: '.25rem' }}>Portrait URL <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label><input type="text" value={portraitUrl} onChange={e => setPortraitUrl(e.target.value)} placeholder="https://..." style={{ width: '100%' }} /></div>
            </div>
          </div>
          <div className="card">
            <div className="card-title">Summary</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
              {[['Faction', faction], ['Sub-faction', subfaction], ['School', school], ['Type', SCHOOL_DATA[school]?.type || '—'], ['Integrity', SCHOOL_DATA[school]?.integrity || '—'], ['Starting Copper', SCHOOL_DATA[school]?.starting_copper || 0]].map(([l, v]) => (
                <div key={l} className="srow"><span className="sl">{l}</span><span className="sv">{v}</span></div>
              ))}
            </div>
            <div style={{ marginTop: '.5rem', fontSize: 12, color: 'var(--text-muted)' }}>
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

  const [saveError, setSaveError] = useState('');

  const submit = async () => {
    const npcName = name.trim() || defaultName;
    if (!faction || !school || !npcName) return;
    setSaveError('');
    const isSahir = SAHIR_SCHOOLS_LIST.includes(school);
    const result = await onComplete({
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
    if (!result) setSaveError("Couldn't save this NPC — check the browser console for the error, or that the npcs table matches expected columns.");
  };

  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>
        Quick Add NPC to Log
      </div>

      {/* Faction */}
      <div style={{ marginBottom: '.75rem' }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: '.3rem', textTransform: 'uppercase', letterSpacing: '.08em' }}>Faction</div>
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
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: '.3rem', textTransform: 'uppercase', letterSpacing: '.08em' }}>School</div>
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
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: '.3rem', textTransform: 'uppercase', letterSpacing: '.08em' }}>Rank</div>
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
            <div style={{ background: 'var(--bg-dark)', border: '1px solid rgba(200,150,42,.2)', borderRadius: 5, padding: '.6rem .75rem', marginBottom: '.75rem', fontSize: 13 }}>
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
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: '.3rem', textTransform: 'uppercase', letterSpacing: '.08em' }}>Name (leave blank for generic)</div>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={defaultName}
              style={{ width: '100%' }}
            />
          </div>

          {/* GM Notes */}
          <div style={{ marginBottom: '.75rem' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: '.3rem', textTransform: 'uppercase', letterSpacing: '.08em' }}>GM Notes (private)</div>
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

          {saveError && <div style={{ fontSize: 11, color: 'var(--red)', marginBottom: '.75rem' }}>{saveError}</div>}

          <div style={{ display: 'flex', gap: '.5rem' }}>
            <button className="btn btn-p" onClick={submit}>Add to NPC Log</button>
            <button className="btn" onClick={onCancel}>Cancel</button>
          </div>
        </>
      )}

      {!faction && (
        <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '1rem' }}>
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
