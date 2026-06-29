import React, { useState, useEffect } from 'react';
import { SCHOOL_DATA, FACTION_SCHOOLS, SUBFACTION_BONUSES, SUBFACTION_DESCRIPTIONS, SKILL_EMPHASES, FACTIONS_LIST, FACTIONS_DATA, FACTION_AVATARS, FACTION_COLORS, ADVANTAGES, DISADVANTAGES, WEAPONS_LIST, GEAR_LIST, GEAR_DESCRIPTIONS, TRAITS, SAHIR_SCHOOLS, SAHIR_DISCIPLINES, IS_COKALOI_SCHOOL, SKILL_CATEGORIES, OPEN_SKILLS, TECHNIQUE_DESCRIPTIONS, TECHNIQUE_SKILL_LINKS, ITEM_QUALITIES } from '../data/constants';
import { WoundBadge, SkillDots, FacIcon, CharacterSilhouette, Silhouette, Loading, Empty, AVATAR_TYPES, AVATAR_COLORS, ScrollLore } from './UI';
import SpellConstellation from './SpellConstellation';
import JinnRandomizer from './JinnRandomizer';
import { MagicItemBadge } from './MagicItemCreator';
import SocialReferenceModal from './SocialReferenceModal';
import { supabase } from '../lib/supabase';
import { getWoundRank, getArchetype, buildCharacterFromForm, isSahirSchool, calcInsight, insightRankFor, traitXpCost, skillXpCost, nextRankThreshold, TRAIT_RING_MAP, RANK_THRESHOLDS } from '../lib/utils';
import { GAME_ID } from '../data/constants';

// ── Character Tab ─────────────────────────────────────────────────────────────
export default function CharacterTab({ isGM, isPCView, isPlayer, characters, npcs, onUpdateNPC, onUpdateCharacter, onCreateCharacter, onDeleteCharacter, onCreateNPC, myCharId, onClaimCharacter, onUnclaimCharacter, playerPassword, onSavePlayerPassword, jumpToCharId, onClearJump, jinnArtUrl, onJinnSummoned, onUpdateInventory, partyInventoryItems, onRoll, jinnSummonerRef, jinnSummonBonus, onJinnSummonDone }) {
  const [view, setView] = useState('sheet');
  const [selId, setSelId] = useState(null);
  const [selNpcId, setSelNpcId] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [showDel, setShowDel] = useState(0);
  const [addEq, setAddEq] = useState('');
  const [jinnOpen, setJinnOpen] = useState(false);
  const [jinnSummonBonusLocal, setJinnSummonBonusLocal] = useState(null);

  // Allow parent to trigger Jinn Randomizer via ref (from spell cast)
  React.useEffect(() => {
    if (jinnSummonerRef) {
      jinnSummonerRef.current = (bonus) => {
        setJinnSummonBonusLocal(bonus);
        setJinnOpen(true);
      };
    }
  }, [jinnSummonerRef]);

  // Jump to a specific character (e.g. from NPC tab)
  useEffect(() => {
    if (jumpToCharId && characters.find(c => c.id === jumpToCharId)) {
      setSelId(jumpToCharId);
      setSelNpcId(null);
      setView('sheet');
      if (onClearJump) onClearJump();
    }
  }, [jumpToCharId, characters, onClearJump]);

  // Set initial selection — prefer myCharId (claimed character) over first non-NPC character
  useEffect(() => {
    const playerCharsNow = characters.filter(c => !c.is_npc);
    if (playerCharsNow.length > 0) {
      const claimed = myCharId && playerCharsNow.find(c => c.id === myCharId);
      const current = selId && playerCharsNow.find(c => c.id === selId);
      if (!current) {
        setSelId(claimed ? claimed.id : playerCharsNow[0].id);
      }
    }
  }, [characters, myCharId]);

  // Player view — see all characters, create own, edit any (honour system)
  if (!isGM && !isPCView) {
    if (view === 'create') {
      return (
        <div>
          <button className="btn btn-sm" style={{ marginBottom: '1rem' }} onClick={() => setView('sheet')}>← Back</button>
          <CharacterCreation
            isGM={false}
            onComplete={async (charData) => { await onCreateCharacter(charData); setView('sheet'); }}
            onCancel={() => setView('sheet')}
          />
        </div>
      );
    }

    const playerChars = characters.filter(c => !c.is_npc);

    const myChar = myCharId ? characters.find(c => c.id === myCharId) : null;
    const hasSummonAbility = myChar && (
      (myChar.advantages || []).some(a => a.name && a.name.toLowerCase().includes('smokeless')) ||
      (myChar.spells || []).some(s => s.discipline === 'summoning' || (s.type && s.type === 'jinn') || (s.name && s.name.toLowerCase().includes('jinn')))
    );
    const myInsightRank = myChar ? (insightRankFor ? insightRankFor(myChar) : myChar.school_rank || 1) : 1;

    return (
      <div>
        <div style={{ marginBottom: '.75rem', display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap' }}>
          {playerChars.length > 0 && (
            <select className="pc-sel" value={selId || ''} onChange={e => setSelId(e.target.value)} style={{ flex: 1 }}>
              {playerChars.map(c => <option key={c.id} value={c.id}>{c.name} — {c.school} R{c.school_rank}</option>)}
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
          {hasSummonAbility && onCreateNPC && (
            <button className="btn btn-sm" onClick={() => setJinnOpen(true)}
              style={{ borderColor: 'rgba(160,120,200,.5)', color: 'var(--gold)' }}
              title="You know Jinn Summoning — open the Summoning ritual">
              ✦ Summon Jinn
            </button>
          )}
        </div>
        {playerChars.length === 0 && (
          <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '1rem' }}>
            No characters yet — create yours above.
          </div>
        )}
        {selId && characters.find(c => c.id === selId && !c.is_npc) && (
          <CharacterSheet
            char={characters.find(c => c.id === selId)}
            isGM={false} canEdit={selId === myCharId}
            onUpdate={onUpdateCharacter}
            myCharId={myCharId}
            onClaimCharacter={onClaimCharacter}
            onUnclaimCharacter={onUnclaimCharacter}
            onUpdateInventory={onUpdateInventory}
            partyInventoryItems={partyInventoryItems}
            onRoll={onRoll} allChars={characters}
          />
        )}
        {jinnOpen && (
          <JinnRandomizer
            onClose={() => { setJinnOpen(false); setJinnSummonBonusLocal(null); if (onJinnSummonDone) onJinnSummonDone(); }}
            onCreateCharacter={onCreateCharacter}
            onCreateNPC={onCreateNPC}
            isGM={false}
            characters={characters}
            myCharId={myCharId}
            jinnArtUrl={jinnArtUrl}
            onJinnSummoned={onJinnSummoned}
            summoningBonus={jinnSummonBonusLocal || jinnSummonBonus}
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
              <i className="ti ti-user-bolt" style={{ fontSize: 12 }} /> Quick NPC
            </button>
          )}
          {onCreateNPC && (
            <button className="btn btn-sm" onClick={() => setJinnOpen(true)}
              style={{ borderColor: 'rgba(160,120,200,.5)', color: 'var(--gold)' }}
              title="Open the Jinn Summoning randomizer">
              ✦ Summon Jinn
            </button>
          )}
        </div>

      {view === 'sheet' && (characters.length > 0 || (npcs?.length || 0) > 0) && (
          <>
            {/* 1 — Player Characters */}
            {characters.filter(c => !c.is_npc).length > 0 && (
              <select className="pc-sel"
                value={(!selNpcId && selId && !characters.find(c => c.id === selId)?.is_npc) ? selId : ''}
                onChange={e => { setSelId(e.target.value); setSelNpcId(null); setShowDel(0); }}>
                <option value="" disabled>Player Characters</option>
                {characters.filter(c => !c.is_npc).map(c => (
                  <option key={c.id} value={c.id}>{c.name} — {c.school} R{c.school_rank}</option>
                ))}
              </select>
            )}
            {/* 2 — Full NPC sheets (GM only) */}
            {characters.filter(c => c.is_npc).length > 0 && (
              <select className="pc-sel"
                value={(!selNpcId && selId && characters.find(c => c.id === selId)?.is_npc) ? selId : ''}
                onChange={e => { setSelId(e.target.value); setSelNpcId(null); setShowDel(0); }}
                style={{ borderColor: 'rgba(200,64,48,.4)', color: 'var(--text-secondary)' }}>
                <option value="" disabled>Full NPC Sheets</option>
                {characters.filter(c => c.is_npc).map(c => (
                  <option key={c.id} value={c.id}>{c.name} — {c.school} R{c.school_rank}</option>
                ))}
              </select>
            )}
            {/* 3 — Library (quick) NPCs */}
            {(npcs?.length || 0) > 0 && (
              <select className="pc-sel" value={selNpcId || ''} onChange={e => { setSelNpcId(e.target.value || null); setShowDel(0); }} style={{ borderColor: 'rgba(200,150,42,.4)', color: 'var(--gold-dim)' }}>
                <option value="">Quick NPCs</option>
                {npcs.map(n => <option key={n.id} value={n.id}>{n.name} — {n.faction}</option>)}
              </select>
            )}
            {/* GM-only delete — single clean confirmation flow */}
            {isGM && !isPCView && !selNpcId && (
              <>
                {showDel === 0 && (
                  <button className="btn btn-sm btn-d" onClick={() => setShowDel(1)}>
                    Delete
                  </button>
                )}
                {showDel === 1 && char && (
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: 'var(--red)' }}>Delete {char.name}?</span>
                    <button className="btn btn-sm btn-d" onClick={async () => { await onDeleteCharacter(char.id); setSelId(null); setShowDel(0); }}>
                      Yes, delete
                    </button>
                    <button className="btn btn-sm" onClick={() => setShowDel(0)}>Cancel</button>
                  </div>
                )}
              </>
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
          const rank = npc.rank || 1;
          const sd = SCHOOL_DATA[npc.school];

          // Start with school base traits, then apply rank bonuses
          const baseTraits = { ...(sd?.base_traits || {}) };
          // Default ring values: school base or rank+1 approximation
          const defaultRing = rank + 1;
          const air   = baseTraits.Air   || defaultRing;
          const earth = baseTraits.Earth || defaultRing;
          const fire  = baseTraits.Fire  || defaultRing;
          const water = baseTraits.Water || defaultRing;
          const voidR = baseTraits.Void  || 2;

          // Trait bonuses from subfaction/school
          const startRef = baseTraits.Reflexes   || air;
          const startAwa = baseTraits.Awareness  || air;
          const startSta = baseTraits.Stamina    || earth;
          const startWil = baseTraits.Willpower  || earth;
          const startAgi = baseTraits.Agility    || fire;
          const startInt = baseTraits.Intelligence || fire;
          const startStr = baseTraits.Strength   || water;
          const startPer = baseTraits.Perception || water;

          // Build school skills at rank
          const schoolSkills = (sd?.skills || []).map(s => ({
            name: s, rank: rank, school: true
          }));

          const newChar = await onCreateCharacter({
            name: npc.name, faction: npc.faction || '', school: npc.school || '',
            school_rank: rank, insight_rank: rank,
            is_npc: true,
            air, earth, fire, water, void: voidR,
            reflexes: startRef, awareness: startAwa, stamina: startSta, willpower: startWil,
            agility: startAgi, intelligence: startInt, strength: startStr, perception: startPer,
            current_wounds: 0, max_wounds: startSta * 17, current_void: voidR,
            integrity: npc.integrity || 4, reputation: npc.reputation || 0, status: npc.status || 0,
            copper: 0, player_notes: npc.player_notes || '', gm_notes: npc.gm_notes || '',
            skills: schoolSkills, equipment: [], advantages: [], disadvantages: [],
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
          ? <CharacterSheet char={char} isGM={true} isPCView={isPCView} canEdit={editMode} onUpdate={onUpdateCharacter} onCreateCharacter={onCreateCharacter} onToggleEdit={() => setEditMode(e => !e)} addEq={addEq} setAddEq={setAddEq} myCharId={myCharId} onClaimCharacter={onClaimCharacter} onUnclaimCharacter={onUnclaimCharacter} onUpdateInventory={onUpdateInventory} partyInventoryItems={partyInventoryItems} onRoll={onRoll} allChars={characters} />
          : <Empty icon="ti-user" message="No characters yet." action={<button className="btn btn-p" onClick={() => setView('create')}>Create First Character</button>} />
      )}

      {view === 'create' && (
        <CharacterCreation isGM={true} onComplete={async (charData) => {
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
      {jinnOpen && (
        <JinnRandomizer
          onClose={() => { setJinnOpen(false); setJinnSummonBonusLocal(null); if (onJinnSummonDone) onJinnSummonDone(); }}
          onCreateCharacter={onCreateCharacter}
          onCreateNPC={onCreateNPC}
          isGM={true}
          characters={characters}
          myCharId={myCharId}
          jinnArtUrl={jinnArtUrl}
          onJinnSummoned={onJinnSummoned}
          summoningBonus={jinnSummonBonusLocal || jinnSummonBonus}
        />
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

  // Only the current school's technique and Rank 1 of any other school are valid choices
  const currentSchoolTech = SCHOOL_DATA[char.school]?.techniques?.[newRank];
  const currentSchoolDesc = TECHNIQUE_DESCRIPTIONS[currentSchoolTech] || '';

  // Rank 1 of every other school (multi-school option)
  const allSchoolRank1 = Object.entries(SCHOOL_DATA)
    .filter(([s]) => s !== char.school)
    .map(([s, sd]) => ({ school: s, techName: sd.techniques?.[1], techDesc: TECHNIQUE_DESCRIPTIONS[sd.techniques?.[1]] || '' }))
    .filter(x => x.techName);

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

        {/* Option B — Rank 1 of any other school (multi-school) */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: 12, color: 'var(--gold-dim)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.3rem' }}>Begin a New School — Rank 1</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: '.5rem', fontStyle: 'italic' }}>Takes you into another tradition. You forfeit your current school's Rank {newRank} technique.</div>
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
    if (effectiveFrom >= 10) return; // max trait
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
      } else if (item.type === 'emphasis') {
        const [skillName, emphasis] = item.key.split('|||');
        updates.skills = (updates.skills || char.skills || []).map(s =>
          s.name === skillName ? { ...s, emphases: [...new Set([...(s.emphases || []), emphasis])] } : s
        );
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
            <div className="card-title">Skills <span style={{ fontWeight: 400, fontSize: 12, color: 'var(--text-muted)' }}>(new rank × 2 XP · emphasis: 2/4/6… XP)</span></div>
            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              {(char.skills || []).map(s => {
                const cartKey = `skill_${s.name}`;
                const pending = cart[cartKey];
                const displayRank = pending ? pending.to : s.rank;
                const nextCost = skillXpCost(displayRank);
                return (
                  <React.Fragment key={s.name}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', padding: '3px 0', borderBottom: 'none' }}>
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
                  {/* Emphases — show owned + XP purchase option */}
                  <div style={{ paddingLeft: '.5rem', paddingBottom: 2 }}>
                    {(s.emphases || []).map(e => {
                      const cartKey = `emph_${s.name}|||${e}`;
                      return (
                        <span key={e} style={{ fontSize: 10, padding: '1px 5px', borderRadius: 8, background: cart[cartKey] ? 'rgba(40,160,80,.15)' : 'rgba(200,150,42,.12)', border: `1px solid ${cart[cartKey] ? 'var(--green-dim)' : 'rgba(200,150,42,.3)'}`, color: cart[cartKey] ? 'var(--green)' : 'var(--gold-dim)', marginRight: 3 }}>
                          {e}
                        </span>
                      );
                    })}
                    {/* XP emphasis purchase — from predefined list only */}
                    {(() => {
                      const ownedEmphases = s.emphases || [];
                      const allowedEmphases = SKILL_EMPHASES[s.name] || [];
                      const pendingEmphases = Object.values(cart).filter(i => i.type === 'emphasis' && i.key.startsWith(s.name + '|||')).map(i => i.to);
                      const allOwned = [...ownedEmphases, ...pendingEmphases];
                      const available = allowedEmphases.filter(e => !allOwned.includes(e));
                      // Rank cap: R1=1, R3=3, R5=5, R7=6, R10=unlimited
                      const emphasisCap = s.rank >= 10 ? 99 : s.rank >= 7 ? 6 : s.rank >= 5 ? 5 : s.rank >= 3 ? 3 : 1;
                      const atCap = allOwned.length >= emphasisCap;
                      // XP cost doubles per emphasis: 1st=2, 2nd=4, 3rd=6...
                      const nextCost = (allOwned.length + 1) * 2;
                      if (available.length === 0 && allowedEmphases.length === 0) return null;
                      return (
                        <div style={{ marginTop: 3 }}>
                          {atCap && <span style={{ fontSize: 9, color: 'var(--text-muted)', fontStyle: 'italic' }}>Max emphases at Rank {s.rank}</span>}
                          {!atCap && available.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, marginTop: 2 }}>
                              <span style={{ fontSize: 9, color: 'var(--text-muted)', alignSelf: 'center', marginRight: 2 }}>{nextCost}xp:</span>
                              {available.map(emp => {
                                const cartKey = `emph_${s.name}|||${emp}`;
                                const inCart = !!cart[cartKey];
                                return (
                                  <button key={emp} onClick={() => {
                                    if (inCart) {
                                      setCart(c => { const n = {...c}; delete n[cartKey]; return n; });
                                    } else {
                                      setCart(c => ({ ...c, [cartKey]: { type: 'emphasis', key: `${s.name}|||${emp}`, cost: nextCost, label: `${s.name}: ${emp} (emphasis)`, from: '', to: emp } }));
                                    }
                                  }}
                                    style={{ fontSize: 9, padding: '1px 5px', borderRadius: 8, border: `1px solid ${inCart ? 'var(--green)' : 'rgba(200,150,42,.3)'}`, background: inCart ? 'rgba(40,160,80,.15)' : 'transparent', color: inCart ? 'var(--green)' : 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit' }}>
                                    {inCart ? '✓ ' : '+ '}{emp}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  </React.Fragment>
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
function CharacterSheet({ char, isGM, isPCView, canEdit, onUpdate, onCreateCharacter, onToggleEdit, addEq, setAddEq, myCharId, onClaimCharacter, onUnclaimCharacter, onUpdateInventory, partyInventoryItems, onRoll, allChars }) {
  const wR = getWoundRank(char.current_wounds, char.max_wounds);
  const WOUND_TN_PENALTY = [0, 3, 5, 10, 15, 20, 40, 999];
  const hasSotESheet = (char.advantages || []).some(a => (a.name || a) === 'Strength of the Earth');
  const woundPenalty = Math.max(0, (WOUND_TN_PENALTY[wR] || 0) - (hasSotESheet ? 3 : 0));
  const xpAvail = (char.xp_total || 0) - (char.xp_spent || 0);
  const [showXpPanel, setShowXpPanel] = useState(false);
  const [pendingRankUp, setPendingRankUp] = useState(false);
  const [showSocialRef, setShowSocialRef] = useState(null); // 'integrity' | 'reputation' | 'status'

  const insight = calcInsight(char);
  const insightRank = insightRankFor(insight);
  // Show rank-up overlay if insight qualifies for a higher rank than current school_rank
  const needsRankUp = insightRank > (char.school_rank || 1);

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
  const avatarColor = char.avatar_color || FACTION_COLORS[char.faction] || '#c8962a';
  const avatarUrl = (char.avatar_url || '').trim();
  const [imgError, setImgError] = useState(false);
  useEffect(() => { setImgError(false); }, [avatarUrl]);
  const [urlDraft, setUrlDraft] = useState(char.avatar_url || '');
  useEffect(() => { setUrlDraft(char.avatar_url || ''); }, [char.id, char.avatar_url]);
  const [tokenDraft, setTokenDraft] = useState(char.token_url || '');
  useEffect(() => { setTokenDraft(char.token_url || ''); }, [char.id, char.token_url]);

  const woundLabel = ['Healthy','Nicked','Grazed','Hurt','Injured','Crippled','Down','Out'][wR] || 'Healthy';
  const woundColor = ['#4a8a40','#8a8a30','#a87830','#c86030','#c84030','#a02828','#801818','#600010'][wR] || '#4a8a40';

  const SKILL_MASTERIES = {
    // ── Weapon Skills — per L5R 4th Ed (used verbatim per LBS conversion doc) ──
    Swordsmanship: {
      3: "Damage rolls with swords are increased by +1k0.",
      5: "A sword may be readied as a Free Action rather than a Simple Action.",
      7: "Damage dice explode on a result of 9 or 10 when using a sword.",
    },
    Knives: {
      3: "Off-hand penalties do not apply when using a knife.",
      5: "Use of a sai or jitte confers one Free Raise toward the Disarm Maneuver.",
      7: "Use of any knife confers a Free Raise toward the Extra Attack Maneuver.",
    },
    Polearms: {
      3: "During the first round of a skirmish, gain +5 to Initiative Score.",
      5: "Damage rolls with polearms against mounted or significantly larger opponents are increased by +1k0.",
      7: "Polearms may be readied as a Free Action.",
    },
    Spears: {
      3: "During the first round of a skirmish, ignore 3 points of Reduction on melee attacks.",
      5: "Ranged attacks with a spear increase maximum range by 5 feet.",
      7: "Spears may be readied as a Free Action.",
    },
    Staves: {
      3: "Opponents' armor bonuses to Armor TN are no longer doubled against staff attacks.",
      5: "Use of a staff confers one Free Raise toward the Knockdown Maneuver.",
      7: "Large staves may be readied as a Free Action. Small staves gain +1k0 to damage rolls.",
    },
    Archery: {
      3: "Stringing a bow is a Simple Action rather than a Complex Action.",
      5: "The maximum range of any bow is increased by 50%.",
      7: "The Strength of the bow is increased by 1 for damage purposes.",
    },
    Brawling: {
      // Uses Jiujutsu masteries per LBS conversion
      3: "Damage of all unarmed attacks is increased by +1k0.",
      5: "Use of Brawling confers a Free Raise toward initiating a Grapple.",
      7: "Damage of all unarmed attacks is increased by +0k1 (+1k1 total from rank 3+7).",
    },
    Tahaddi: {
      // Uses Iaijutsu masteries per LBS conversion doc; rank 3 applies to readying two tahaddi knives
      3: "Readying two tahaddi knives is a Free Action rather than a Simple Action.",
      5: "During a Tahaddi Duel, gain one Free Raise on the Focus roll.",
      7: "During a Tahaddi Duel, if your Assessment roll exceeds your opponent's by 10+, gain +2k2 on your Focus roll (instead of the normal +1k1).",
    },
    'Assassin Ranged Weapons': {
      // Uses Ninjutsu masteries per LBS conversion doc
      3: "Damage of all Assassin Ranged Weapon attacks is increased by +1k0.",
      5: "Damage dice for Assassin Ranged Weapons now explode normally (they do not explode by default).",
      7: "Damage of all Assassin Ranged Weapon attacks is increased by +0k1 (+1k1 total from rank 3+7).",
    },
    Horsemanship: {
      3: "May use the Full Attack Stance when mounted.",
      5: "Mounting is a Simple Action (not Complex); dismounting is a Free Action (not Simple).",
      7: "Mounting is a Free Action rather than a Simple Action.",
    },
    // ── Combat / Physical ────────────────────────────────────────────────────
    Athletics: {
      3: "Moderate Terrain no longer impedes movement. Difficult Terrain reduces Water Ring by 1 instead of 2 for movement.",
      5: "No movement penalties regardless of terrain type.",
      7: "May add 5' to the total of one Move Action per Round (does not increase maximum possible movement).",
    },
    Defense: {
      3: "May retain the result of a previous Defense/Reflexes roll rather than re-rolling when maintaining Full Defense in subsequent rounds.",
      5: "Armor TN is considered 3 higher while in Defense or Full Defense stance.",
      7: "One Simple Action may be taken while in Full Defense stance (no attacks allowed).",
    },
    Battle: {
      5: "Add Battle Skill Rank to Initiative Score during skirmishes.",
    },
    Hunting: {
      5: "+1k0 to all Stealth rolls made in wilderness environments.",
    },
    // ── Social Skills ─────────────────────────────────────────────────────────
    Sincerity: {
      5: "+5 bonus to the total of all Contested Rolls made using Sincerity.",
    },
    Courtier: {
      3: "+3 additional Insight above what Rings and Skills normally indicate.",
      5: "+1k0 to the total of all Contested Rolls made using Courtier.",
      7: "+7 additional Insight above what Rings and Skills normally indicate (cumulative with Rank 3).",
    },
    Etiquette: {
      3: "+3 additional Insight above what Rings and Skills normally indicate.",
      5: "+1k0 to the total of all Contested Rolls made using Etiquette.",
      7: "+7 additional Insight above what Rings and Skills normally indicate (cumulative with Rank 3).",
    },
    Temptation: {
      5: "+5 bonus to the total of any Contested Roll made using Temptation.",
    },
    Intimidation: {
      5: "+5 bonus to the total of any Contested Roll made using Intimidation.",
    },
    Acting: {
      3: "TN to create a disguise is reduced by 5.",
      5: "TN to create a disguise is reduced by 10 (total).",
      7: "TN to create a disguise is reduced by 15 (total).",
    },
    // ── Scholarly Skills ──────────────────────────────────────────────────────
    Investigation: {
      3: "A second Search attempt may be made without an increase to the original TN.",
      5: "+5 bonus to the total of any Contested Roll made using Investigation.",
      7: "A third Search attempt may be made even if the second attempt failed.",
    },
    Medicine: {
      5: "Wounds healed on a successful Medicine roll is increased by +1k0.",
    },
    Divination: {
      5: "A second Divination roll may be made without spending a Void Point (all other conditions still apply). May use Awareness/Air instead of Intelligence/Fire.",
    },
    Meditation: {
      3: "A successful Meditation roll restores up to 2 Void Points.",
      5: "TN for all Meditation (Fasting) rolls is reduced by 5.",
      7: "A successful Meditation roll restores up to 3 Void Points.",
    },
    Spellcraft: {
      5: "+1k0 on Spell Casting Rolls.",
    },
    Calligraphy: {
      5: "+10 bonus when attempting to break a code or cipher.",
    },
    Commerce: {
      5: "May increase or decrease the price of an item being bought or sold by up to 20%.",
    },
    // ── Low / Criminal Skills ─────────────────────────────────────────────────
    Stealth: {
      3: "Simple Move Actions while using Stealth allow movement equal to Water Ring x 5 feet.",
      5: "Simple Move Actions while using Stealth allow movement equal to Water Ring x 10 feet.",
      7: "May make Free Move Actions normally while using Stealth.",
    },
    'Sleight of Hand': {
      5: "May use the Conceal Emphasis to conceal small weapons on your person.",
    },
    Forgery: {
      3: "+1k0 to Forgery roll result for setting the TN for others to detect it.",
      5: "+1k0 on any roll to detect a forgery made by someone else.",
      7: "+0k1 (total +1k1 with Rank 3) to Forgery roll result for setting the detection TN.",
    },
  };

  return (
    <div>
      {/* ── Overlays ── */}
      {showSocialRef && (
        <SocialReferenceModal
          initialTab={showSocialRef}
          char={char}
          onClose={() => setShowSocialRef(null)}
        />
      )}
      {showXpPanel && (
        <XPSpendPanel char={char} onBatchUpdate={batchUpdate} onClose={() => setShowXpPanel(false)} />
      )}
      {(needsRankUp || pendingRankUp) && !showXpPanel && (canEdit && (isGM || char.id === myCharId)) && (
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

      {/* ── Player name banner ── */}
      {(() => {
        const isMine = myCharId === char.id;
        const playerName = char.player_name;
        if (playerName) {
          // Character is claimed — show who has it, and an unclaim button if it's mine
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.75rem', padding: '.6rem .75rem', background: isMine ? 'rgba(74,138,64,.15)' : 'var(--bg-dark)', borderRadius: 5, border: `1px solid ${isMine ? 'rgba(74,138,64,.4)' : 'var(--border)'}` }}>
              <i className="ti ti-user-check" style={{ fontSize: 16, color: isMine ? 'var(--green)' : 'var(--gold-dim)' }} />
              <span style={{ fontSize: 20, fontWeight: 800, color: isMine ? 'var(--green)' : 'var(--text-primary)', letterSpacing: '.02em' }}>{playerName}</span>
              {isMine && <span style={{ fontSize: 11, color: 'var(--green)', marginLeft: 2, fontStyle: 'italic' }}>— your character</span>}
              {isMine && onUnclaimCharacter && (
                <button className="btn btn-sm" style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)', borderColor: 'var(--border)' }}
                  onClick={() => onUnclaimCharacter(char.id)}
                  title="Release this character so another player can claim it">
                  <i className="ti ti-user-off" style={{ fontSize: 11, marginRight: 3 }} />Unclaim
                </button>
              )}
            </div>
          );
        }
        return null;
      })()}

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
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>Portrait URL <span style={{ fontWeight: 400 }}>(card portrait in encounters)</span></div>
                <input type="text" value={urlDraft} onChange={e => setUrlDraft(e.target.value)}
                  onBlur={() => { if (urlDraft !== (char.avatar_url || '')) update('avatar_url', urlDraft); }}
                  onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }}
                  placeholder="https://..." style={{ width: '100%', fontSize: 12, marginBottom: '.5rem' }} />
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>Token URL <span style={{ fontWeight: 400 }}>(grid map token — 64×64px GIF/PNG works best)</span></div>
                <input type="text" value={tokenDraft} onChange={e => setTokenDraft(e.target.value)}
                  onBlur={() => { if (tokenDraft !== (char.token_url || '')) update('token_url', tokenDraft); }}
                  onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }}
                  placeholder="https://... (leave blank to use silhouette)" style={{ width: '100%', fontSize: 12, marginBottom: '.5rem' }} />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: '.5rem' }}>
                  {AVATAR_TYPES.map(at => (
                    <div key={at.id} onClick={() => update('avatar_type', at.id)} title={at.label}
                      style={{ width: 28, height: 36, borderRadius: 3, background: avatarType === at.id ? avatarColor + '22' : 'var(--bg-panel)', border: `1px solid ${avatarType === at.id ? avatarColor : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <Silhouette type={at.id} size={20} color={avatarColor} />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center' }}>
                  {/* Faction default swatch — click to reset to faction colour */}
                  {(() => {
                    const factionCol = FACTION_COLORS[char.faction];
                    if (!factionCol) return null;
                    const isDefault = !char.avatar_color;
                    return (
                      <div onClick={() => update('avatar_color', null)} title={`Reset to faction default (${char.faction})`}
                        style={{ width: 18, height: 18, borderRadius: '50%', background: factionCol,
                          border: `2px solid ${isDefault ? '#fff' : 'rgba(255,255,255,.15)'}`,
                          cursor: 'pointer', outline: isDefault ? `2px solid ${factionCol}88` : 'none',
                          outlineOffset: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {isDefault && <span style={{ fontSize: 9, color: '#fff', fontWeight: 900, lineHeight: 1 }}>★</span>}
                      </div>
                    );
                  })()}
                  {AVATAR_COLORS.map(ac => (
                    <div key={ac.id} onClick={() => update('avatar_color', ac.id)} title={ac.label}
                      style={{ width: 18, height: 18, borderRadius: '50%', background: ac.id,
                        border: `2px solid ${char.avatar_color === ac.id ? '#fff' : 'transparent'}`,
                        cursor: 'pointer' }} />
                  ))}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>★ = faction default · click to reset</div>
                <button className="btn btn-sm" style={{ marginTop: '.4rem', fontSize: 11 }} onClick={() => setShowAvatarPicker(false)}>Done</button>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 12, marginBottom: '.3rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{char.school} · {char.faction}</span>
            </div>
            {/* Wounds — tabular layout matching 4th Ed character sheet */}
            {(() => {
              const earth = char.earth || char.stamina || 2;
              const healthyTotal = earth * 5;
              const rankTotal = earth * 2;
              const hasSotE = (char.advantages || []).some(a => (a.name || a) === 'Strength of the Earth');
              const soteReduction = hasSotE ? 3 : 0;
              const WOUND_RANKS = [
                { label: 'Healthy',  penalty: '+0',                                    total: healthyTotal, color: '#4a8a40' },
                { label: 'Nicked',   penalty: `+${Math.max(0, 3  - soteReduction)}`,  total: rankTotal,    color: '#8a8a30' },
                { label: 'Grazed',   penalty: `+${Math.max(0, 5  - soteReduction)}`,  total: rankTotal,    color: '#a87830' },
                { label: 'Hurt',     penalty: `+${Math.max(0, 10 - soteReduction)}`,  total: rankTotal,    color: '#c86030' },
                { label: 'Injured',  penalty: `+${Math.max(0, 15 - soteReduction)}`,  total: rankTotal,    color: '#c84030' },
                { label: 'Crippled', penalty: `+${Math.max(0, 20 - soteReduction)}`,  total: rankTotal,    color: '#a02828' },
                { label: 'Down',     penalty: `+${Math.max(0, 40 - soteReduction)}`,  total: rankTotal,    color: '#801818' },
                { label: 'Out',      penalty: '—',                                     total: earth * 5,    color: '#600010' },
              ];
              // Cumulative thresholds
              const thresholds = WOUND_RANKS.reduce((acc, r, i) => {
                acc.push((acc[i - 1] || 0) + r.total);
                return acc;
              }, []);
              const current = char.current_wounds || 0;
              return (
                <div style={{ marginTop: '.25rem', border: `1px solid ${woundColor}44`, borderRadius: 4, overflow: 'hidden', fontSize: 11 }}>
                  {/* Header */}
                  <div style={{ display: 'flex', background: 'rgba(0,0,0,.3)', padding: '2px 4px', gap: 2, borderBottom: '1px solid rgba(107,78,40,.3)' }}>
                    <span style={{ flex: 2, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', fontSize: 9, letterSpacing: '.05em' }}>Wound Level</span>
                    <span style={{ width: 28, textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', fontSize: 9 }}>Pen.</span>
                    <span style={{ width: 28, textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', fontSize: 9 }}>Total</span>
                    <span style={{ width: 28, textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', fontSize: 9 }}>Curr.</span>
                  </div>
                  {WOUND_RANKS.map((r, i) => {
                    const rankStart = i === 0 ? 0 : thresholds[i - 1];
                    const rankEnd = thresholds[i];
                    const woundsInRank = Math.max(0, Math.min(current - rankStart, r.total));
                    const isActive = current > rankStart && current <= rankEnd;
                    const isPast = current > rankEnd;
                    return (
                      <div key={r.label} style={{
                        display: 'flex', alignItems: 'center', gap: 2, padding: '2px 4px',
                        background: isActive ? `${r.color}22` : isPast ? `${r.color}11` : 'transparent',
                        borderBottom: '1px solid rgba(107,78,40,.1)',
                        borderLeft: isActive ? `3px solid ${r.color}` : '3px solid transparent',
                      }}>
                        <span style={{ flex: 2, color: isActive ? r.color : isPast ? r.color + 'aa' : 'var(--text-muted)', fontWeight: isActive ? 700 : 400 }}>
                          {r.label} {isActive && woundPenalty > 0 ? <span style={{ fontSize: 9 }}>⚠</span> : ''}
                        </span>
                        <span style={{ width: 28, textAlign: 'center', color: isActive ? r.color : 'var(--text-muted)' }}>{r.penalty}</span>
                        <span style={{ width: 28, textAlign: 'center', color: 'var(--text-muted)' }}>{r.total}</span>
                        <span style={{ width: 28, textAlign: 'center', color: isActive ? r.color : 'var(--text-muted)', fontWeight: isActive ? 700 : 400 }}>
                          {isActive ? woundsInRank : isPast ? r.total : 0}
                        </span>
                      </div>
                    );
                  })}
                  {/* Wound controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 4px', background: 'rgba(0,0,0,.15)', borderTop: '1px solid rgba(107,78,40,.2)' }}>
                    <span style={{ flex: 1, fontSize: 10, color: 'var(--text-muted)' }}>
                      Total: <strong style={{ color: woundColor }}>{current}</strong> / {thresholds[thresholds.length - 1]}
                    </span>
                    {canEdit && (
                      <>
                        <button className="btn btn-sm" style={{ fontSize: 10, padding: '1px 5px', color: 'var(--green)' }}
                          onClick={() => update('current_wounds', Math.max(0, current - 1))}>− Heal</button>
                        <button className="btn btn-sm btn-d" style={{ fontSize: 10, padding: '1px 5px' }}
                          onClick={() => update('current_wounds', current + 1)}>+ Wound</button>
                      </>
                    )}
                  </div>

                </div>
              );
            })()}
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

                    {/* Trait labels — LEFT rings (Fire, Earth): value just outside ring, name further left */}
                    {rings.filter(r => r.side === 'left').map(r =>
                      (r.traits || []).map(([name, val], ti) => {
                        const ty = r.cy + (ti === 0 ? -13 : 13);
                        const numX = r.cx - 67;   // just outside ring edge (radius=62)
                        const lblX = r.cx - 70;   // name anchor, text runs further left
                        return (
                          <g key={name}>
                            <text x={numX} y={ty + 5} textAnchor="end"
                              fill={RING_COLORS[r.key]} fontSize={16} fontWeight={800}>{val}</text>
                            <text x={lblX} y={ty + 5} textAnchor="end" dx={-16}
                              fill="var(--text-muted)" fontSize={11} fontWeight={500}>{name}</text>
                          </g>
                        );
                      })
                    )}

                    {/* Trait labels — RIGHT rings (Air, Water): value just outside ring, name further right */}
                    {rings.filter(r => r.side === 'right').map(r =>
                      (r.traits || []).map(([name, val], ti) => {
                        const ty = r.cy + (ti === 0 ? -13 : 13);
                        const numX = r.cx + 67;   // just outside ring right edge
                        const lblX = r.cx + 70;   // name anchor, text runs further right
                        return (
                          <g key={name}>
                            <text x={numX} y={ty + 5} textAnchor="start"
                              fill={RING_COLORS[r.key]} fontSize={16} fontWeight={800}>{val}</text>
                            <text x={lblX} y={ty + 5} textAnchor="start" dx={16}
                              fill="var(--text-muted)" fontSize={11} fontWeight={500}>{name}</text>
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

          {/* ── Social Stats — top right column ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', flexShrink: 0, minWidth: 90 }}>
            {[
              { label: 'Integrity', value: char.integrity ?? 0, color: '#c8a040', borderColor: '#a07830', key: 'integrity', isDecimal: true },
              { label: 'Reputation', value: char.reputation ?? 1, color: '#c8a040', borderColor: '#a07830', key: 'reputation' },
              { label: 'Status', value: char.status ?? 1, color: '#80a8c8', borderColor: '#6080a0', key: 'status' },
            ].map(({ label, value, color, borderColor, key, isDecimal }) => (
              <div key={key} style={{ textAlign: 'center', background: 'var(--bg-panel)', border: `1px solid ${borderColor}`, borderRadius: 6, padding: '4px 12px', width: '100%' }}>
                <div
                  style={{ fontSize: 28, fontWeight: 900, color, lineHeight: 1, cursor: 'pointer' }}
                  title={`Click to view ${label} reference table`}
                  onClick={() => setShowSocialRef(key)}
                >
                  {isDecimal ? (Number(value) || 0).toFixed(1) : (value || 0)}
                </div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.1em', marginTop: 1 }}>{label} <span style={{ color: borderColor, opacity: 0.6 }}>?</span></div>
                {canEdit && isGM && (
                  <div style={{ display: 'flex', gap: 2, justifyContent: 'center', marginTop: 3 }}>
                    <button className="rep-btn" onClick={() => update(key, Math.max(0, +(value || 0) - (isDecimal ? 0.5 : 1)))}>−</button>
                    <button className="rep-btn" onClick={() => update(key, +(value || 0) + (isDecimal ? 0.5 : 1))}>+</button>
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
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Skills</span>
            {canEdit && <AddSkillControl char={char} onAdd={(skillName) => {
              if ((char.skills || []).some(s => s.name === skillName)) return;
              update('skills', [...(char.skills || []), { name: skillName, rank: 0, school: false }]);
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
                    onClick={() => update('skills', [...(char.skills || []), { name: s, rank: 0, school: false }])}>
                    {s}
                  </button>
                ))}
              </div>
            );
          })()}
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {/* Build set of active technique names for this character */}
            {(() => {
              const charRank = char.school_rank || 1;
              const activeTechs = Object.entries(char.techniques || {})
                .filter(([rank]) => +rank <= charRank)
                .map(([, t]) => typeof t === 'object' ? (t.name || '') : t)
                .filter(Boolean);
              return (char.skills || []).map(s => {
                const masteries = SKILL_MASTERIES[s.name] || {};
                const unlockedMasteries = Object.entries(masteries).filter(([rank]) => s.rank >= +rank);
                // Which active techniques affect this skill?
                const techBadges = activeTechs.filter(techName =>
                  (TECHNIQUE_SKILL_LINKS[techName] || []).includes(s.name)
                );
                return (
                  <div key={s.name}>
                    <div className="skill-row">
                      <span className={`skill-nm ${s.school ? 'sc' : ''}`}>
                        {s.name}
                        {(s.emphases || []).map(e => (
                          <span key={e} style={{ fontSize: 10, color: 'var(--gold-dim)', marginLeft: 4 }}>
                            ({e}){canEdit && <span style={{ cursor: 'pointer', marginLeft: 2, color: 'var(--text-muted)' }}
                              onClick={() => { const skills = (char.skills || []).map(x => x.name === s.name ? { ...x, emphases: (x.emphases || []).filter(em => em !== e) } : x); update('skills', skills); }}>×</span>}
                          </span>
                        ))}
                      </span>
                      <SkillDots rank={s.rank} />
                      {/* Technique glow badges */}
                      {techBadges.map(techName => (
                        <span key={techName} title={TECHNIQUE_DESCRIPTIONS[techName] || techName} style={{
                          fontSize: 9, padding: '1px 5px', borderRadius: 8,
                          background: 'rgba(160,100,220,.18)',
                          border: '1px solid rgba(160,100,220,.5)',
                          color: '#c0a0e8',
                          boxShadow: '0 0 6px rgba(160,100,220,.4)',
                          cursor: 'default', whiteSpace: 'nowrap',
                          marginLeft: 3,
                        }}>
                          ✦ {techName}
                        </span>
                      ))}
                      {canEdit && (
                        <div style={{ display: 'flex', gap: 2, marginLeft: 4 }}>
                          {isGM && (
                            <>
                              <button className="trait-btn" onClick={() => { const skills = (char.skills || []).map(x => x.name === s.name ? { ...x, rank: Math.max(0, x.rank - 1) } : x); update('skills', skills); }}>−</button>
                              <button className="trait-btn" onClick={() => { const skills = (char.skills || []).map(x => x.name === s.name ? { ...x, rank: Math.min(10, x.rank + 1) } : x); update('skills', skills); }}>+</button>
                            </>
                          )}
                          {isGM && (
                            <input
                              placeholder="Add emphasis (GM)…"
                              style={{ fontSize: 10, width: 100, padding: '1px 4px', background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 3, color: 'var(--text-muted)', fontFamily: 'inherit' }}
                              onKeyDown={e => {
                                if (e.key === 'Enter' && e.target.value.trim()) {
                                  const val = e.target.value.trim();
                                  const skills = (char.skills || []).map(x => x.name === s.name
                                    ? { ...x, emphases: [...(x.emphases || []).filter(em => em !== val), val] }
                                    : x);
                                  update('skills', skills);
                                  e.target.value = '';
                                }
                              }}
                            />
                          )}
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
              });
            })()}
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

        {/* Copper */}
        <div className="card">
          <div className="card-title"><i className="ti ti-coin" style={{ marginRight: 5 }} />Copper</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--gold)' }}>{char.copper ?? 0}</span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>copper</span>
            {canEdit && (() => {
              const inputId = `copper-delta-${char.id}`;
              return (
                <div style={{ display: 'flex', gap: 4, marginLeft: 'auto', alignItems: 'center' }}>
                  <input type="number" id={inputId} placeholder="±amount"
                    style={{ width: 72, fontSize: 12, padding: '2px 4px' }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        const delta = parseInt(e.target.value) || 0;
                        update('copper', Math.max(0, (char.copper || 0) + delta));
                        e.target.value = '';
                      }
                    }} />
                  <button className="btn btn-sm" onClick={() => {
                    const el = document.getElementById(inputId);
                    const delta = parseInt(el?.value) || 0;
                    update('copper', Math.max(0, (char.copper || 0) + delta));
                    if (el) el.value = '';
                  }}>Apply</button>
                </div>
              );
            })()}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
            Use + to gain, − to spend. Party pool copper is in the Party tab.
          </div>
        </div>
      </div>

      {/* Right column — Equipment, Techniques, Spells, Advantages */}
      <div>
        {/* Equipment */}
        <div className="card">
          <div className="card-title">Equipment</div>
          {(char.equipment || []).map((e, i) => {
            const weapon = WEAPONS_LIST.find(w => w.name === e.name)
              || WEAPONS_LIST.find(w => w.name.toLowerCase().startsWith(e.name.toLowerCase()));
            const gearDesc = GEAR_DESCRIPTIONS[e.name]
              || Object.entries(GEAR_DESCRIPTIONS).find(([k]) => k.toLowerCase().startsWith(e.name.toLowerCase()))?.[1];
            const loreText = weapon
              ? `Damage: ${weapon.dr}\nSkill: ${weapon.skill}\nPrice: ${weapon.price}${weapon.special ? `\nSpecial: ${weapon.special}` : ''}`
              : gearDesc || null;
            if (e.is_magic) {
              return (
                <div key={i} style={{ marginBottom: '.4rem' }}>
                  <MagicItemBadge item={e} />
                  <div style={{ display: 'flex', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 3, cursor: 'pointer', fontSize: 11 }}>
                      <input type="checkbox" checked={e.equipped || false} onChange={() => {
                        const eq = (char.equipment || []).map((x, xi) => xi === i ? { ...x, equipped: !x.equipped } : x);
                        update('equipment', eq);
                      }} style={{ accentColor: 'var(--gold)' }} />
                      <span style={{ color: 'var(--text-muted)' }}>Equipped</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 3, cursor: 'pointer', fontSize: 11 }}>
                      <input type="checkbox" checked={e.inUse || false} onChange={() => toggleEqInUse(i)} style={{ accentColor: 'var(--gold)' }} />
                      <span style={{ color: 'var(--text-muted)' }}>In use</span>
                    </label>
                    {canEdit && onUpdateInventory && (
                      <button className="btn btn-sm" style={{ fontSize: 10, padding: '1px 5px', color: 'var(--gold-dim)', borderColor: 'var(--gold-dim)' }}
                        title="Send to Party Inventory"
                        onClick={() => {
                          const item = char.equipment[i];
                          const eq = (char.equipment || []).filter((_, idx) => idx !== i);
                          update('equipment', eq);
                          onUpdateInventory({ items: [...(partyInventoryItems || []), { ...item, qty: 1, category: 'Magic', added_at: new Date().toISOString() }] });
                        }}>→ Party</button>
                    )}
                    {canEdit && <button className="btn btn-sm btn-d" style={{ padding: '1px 5px', fontSize: 11 }} onClick={() => removeEq(i)}>×</button>}
                  </div>
                </div>
              );
            }
            const qualData = ITEM_QUALITIES[e.quality || 'standard'] || ITEM_QUALITIES.standard;
            return (
              <div key={i} className="eq-row">
                <label style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0, cursor: 'pointer' }} title="Mark as currently equipped/wielded">
                  <input type="checkbox" checked={e.inUse || false} onChange={() => toggleEqInUse(i)} style={{ accentColor: 'var(--gold)' }} />
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>In use</span>
                </label>
                <span style={{ flex: 1, color: e.inUse ? 'var(--text-primary)' : 'var(--text-muted)' }}>{e.name}</span>
                {e.quality && e.quality !== 'standard' && (
                  <span style={{ fontSize: 9, padding: '1px 4px', borderRadius: 3, background: qualData.label === 'Poor' ? '#2a1a0a' : '#1a2a0a', color: qualData.label === 'Poor' ? '#8a5a30' : '#5a8a30', border: `1px solid ${qualData.label === 'Poor' ? '#4a2a1a' : '#3a6a1a'}` }} title={qualData.desc}>
                    {qualData.label}
                  </span>
                )}
                {e.dr && <span style={{ fontSize: 11, color: 'var(--gold-dim)' }}>{e.dr}</span>}
                {canEdit && isGM && e.dr && (
                  <select value={e.quality || 'standard'} onChange={ev => {
                    const eq = (char.equipment || []).map((x, xi) => xi === i ? { ...x, quality: ev.target.value } : x);
                    update('equipment', eq);
                  }} style={{ fontSize: 10, padding: '0 2px', background: 'var(--bg-panel)', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: 3 }}>
                    {Object.entries(ITEM_QUALITIES).map(([k, q]) => <option key={k} value={k}>{q.label}</option>)}
                  </select>
                )}
                <ScrollLore title={e.name} text={loreText || e.name} size={10} />
                {canEdit && onUpdateInventory && (
                  <button className="btn btn-sm" style={{ fontSize: 10, padding: '1px 5px', color: 'var(--text-muted)' }}
                    title="Send to Party Inventory"
                    onClick={() => {
                      const item = char.equipment[i];
                      const eq = (char.equipment || []).filter((_, idx) => idx !== i);
                      update('equipment', eq);
                      onUpdateInventory({ items: [...(partyInventoryItems || []), { name: item.name, qty: 1, category: 'Gear' }] });
                    }}>→ Party</button>
                )}
                {canEdit && <button className="btn btn-sm btn-d" style={{ padding: '1px 5px', fontSize: 11 }} onClick={() => removeEq(i)}>×</button>}
              </div>
            );
          })}
          {canEdit && (
            <div style={{ display: 'flex', gap: '.4rem', marginTop: '.4rem', flexWrap: 'wrap' }}>
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
            const currentTechRaw = (char.techniques || {})[rank];
            const currentTech = typeof currentTechRaw === 'object' ? (currentTechRaw?.name || '') : (currentTechRaw || '');
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
            <div style={{ marginTop: '.5rem', fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              School Rank:
              <input type="number" min={1} max={8} value={char.school_rank || 1} style={{ width: 50 }}
                onChange={e => {
                  const newRank = +e.target.value;
                  const existing = char.techniques || {};
                  const sd = SCHOOL_DATA[char.school];
                  const updated = { ...existing };
                  for (let i = 1; i <= newRank; i++) {
                    if (!updated[i] && sd?.techniques?.[i]) updated[i] = sd.techniques[i];
                  }
                  update('school_rank', newRank);
                  update('techniques', updated);
                }} />
              <button className="btn btn-sm btn-p" style={{ fontSize: 11 }}
                onClick={() => setPendingRankUp(true)}
                title="Open rank-up overlay to choose next technique">
                ⬆ Rank Up
              </button>
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
                {char.advantages.map((a, ai) => {
                  const adv = ADVANTAGES.find(x => x.name === a.name);
                  const updateAdv = (patch) => {
                    const updated = (char.advantages || []).map((x, xi) => xi === ai ? { ...x, ...patch } : x);
                    update('advantages', updated);
                  };
                  return (
                    <div key={a.name + ai} style={{ padding: '6px 0', borderBottom: '1px solid rgba(107,78,40,.2)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {canEdit
                          ? <input value={a.customName || a.name} onChange={e => updateAdv({ customName: e.target.value })}
                              onBlur={e => !e.target.value && updateAdv({ customName: undefined })}
                              style={{ flex: 1, fontSize: 13, fontWeight: 500, background: 'transparent', border: 'none', borderBottom: '1px solid rgba(200,150,42,.2)', color: 'var(--text-secondary)', outline: 'none', fontFamily: 'inherit', padding: '0 2px' }} />
                          : <span style={{ flex: 1, fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{a.customName || a.name}</span>
                        }
                        <span style={{ color: 'var(--gold-dim)', fontSize: 11 }}>({a.cost} pts)</span>
                      </div>
                      {adv?.desc && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4, fontStyle: 'italic' }}>{adv.desc}</div>}
                      {canEdit
                        ? <textarea value={a.notes || ''} onChange={e => updateAdv({ notes: e.target.value })}
                            placeholder="Personal notes on this advantage…"
                            rows={1}
                            style={{ width: '100%', boxSizing: 'border-box', marginTop: 3, fontSize: 11, resize: 'vertical', background: 'rgba(107,78,40,.06)', border: '1px solid rgba(107,78,40,.2)', borderRadius: 3, color: 'var(--text-muted)', fontFamily: 'inherit', padding: '2px 5px' }} />
                        : a.notes
                          ? <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>{a.notes}</div>
                          : null
                      }
                    </div>
                  );
                })}
              </>
            )}
            {(char.disadvantages || []).length > 0 && (
              <>
                <div className="card-title" style={{ marginTop: '.5rem' }}>Disadvantages</div>
                {char.disadvantages.map((d, di) => {
                  const dis = DISADVANTAGES.find(x => x.name === d.name);
                  const updateDis = (patch) => {
                    const updated = (char.disadvantages || []).map((x, xi) => xi === di ? { ...x, ...patch } : x);
                    update('disadvantages', updated);
                  };
                  return (
                    <div key={d.name + di} style={{ padding: '6px 0', borderBottom: '1px solid rgba(107,78,40,.2)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {canEdit
                          ? <input value={d.customName || d.name} onChange={e => updateDis({ customName: e.target.value })}
                              onBlur={e => !e.target.value && updateDis({ customName: undefined })}
                              style={{ flex: 1, fontSize: 13, fontWeight: 500, background: 'transparent', border: 'none', borderBottom: '1px solid rgba(200,64,48,.2)', color: 'var(--text-secondary)', outline: 'none', fontFamily: 'inherit', padding: '0 2px' }} />
                          : <span style={{ flex: 1, fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{d.customName || d.name}</span>
                        }
                        <span style={{ color: 'var(--red)', fontSize: 11 }}>(+{d.value} CP)</span>
                      </div>
                      {dis?.desc && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4, fontStyle: 'italic' }}>{dis.desc}</div>}
                      {canEdit
                        ? <textarea value={d.notes || ''} onChange={e => updateDis({ notes: e.target.value })}
                            placeholder="Personal notes on this disadvantage…"
                            rows={1}
                            style={{ width: '100%', boxSizing: 'border-box', marginTop: 3, fontSize: 11, resize: 'vertical', background: 'rgba(107,78,40,.06)', border: '1px solid rgba(107,78,40,.2)', borderRadius: 3, color: 'var(--text-muted)', fontFamily: 'inherit', padding: '2px 5px' }} />
                        : d.notes
                          ? <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>{d.notes}</div>
                          : null
                      }
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
function CharacterCreation({ onComplete, onCancel, defaultIsNpc = false, isGM = false }) {
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
  const [showAllSchools, setShowAllSchools] = useState(false);
  const schools = faction ? FACTION_SCHOOLS[faction] || [] : [];
  const allSchoolNames = Object.keys(SCHOOL_DATA);
  const displayedSchools = showAllSchools ? allSchoolNames : schools;

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
    ? ['Faction','Sub-faction','School','Advantages','Traits & Skills','Spells','Identity']
    : ['Faction','Sub-faction','School','Advantages','Traits & Skills','Identity'];
  const advStep = 4;
  const spellStep = schoolIsSahir ? 6 : null;
  const traitsStep = 5;
  const identityStep = schoolIsSahir ? 7 : 6;

  const handleComplete = () => {
    const charData = buildCharacterFromForm({ faction, subfaction, school, name, playerName, traits, skills, advantages, disadvantages, selectedSpells, spellEmphasis });
    onComplete({ ...charData, game_id: GAME_ID, is_npc: isNpc, avatar_url: portraitUrl.trim() });
  };

  return (
    <div style={{ maxWidth: 700 }}>

      {/* Top navigation bar */}
      {(() => {
        const backAction = step === 1 ? onCancel : () => setStep(step - 1);
        // Compute next disabled state per step
        const nextDisabled =
          step === 1 ? !faction :
          step === 2 ? !subfaction :
          step === 3 ? !school :
          step === advStep ? false :
          step === traitsStep ? cpRemaining < 0 :
          step === spellStep ? (selectedSpells.length < startingSpells || (!IS_COKALOI_SCHOOL(school) && (!spellEmphasis || !spellDisciplineBonus))) :
          step === identityStep ? !name :
          false;
        const nextAction = () => {
          if (step === 1) setStep(2);
          else if (step === 2) setStep(3);
          else if (step === 3) setStep(advStep);
          else if (step === advStep) setStep(traitsStep);
          else if (step === traitsStep) setStep(spellStep || identityStep);
          else if (step === spellStep) setStep(identityStep);
          else if (step === identityStep) handleComplete();
        };
        const isLastStep = step === identityStep;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1rem' }}>
            {(step > 1 || onCancel) && (
              <button className="btn btn-sm" onClick={backAction}>{step === 1 ? '✕ Cancel Creation' : '← Back'}</button>
            )}
            <div style={{ flex: 1 }} />
            <button className="btn btn-p btn-sm" disabled={nextDisabled} onClick={nextAction}>
              {isLastStep ? 'Create Character' : 'Next →'}
            </button>
          </div>
        );
      })()}

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
        {step === 1 ? 'Choose your faction.' : step === 2 ? 'Choose your sub-faction — grants a bonus trait.' : step === 3 ? 'Choose your school.' : step === advStep ? 'Choose advantages and disadvantages. They may grant or cost Character Points.' : step === traitsStep ? 'Spend your Character Points on traits and skills.' : step === spellStep ? `Select starting ${school === "Ra'Shari Diviner" ? 'Cokaloi (6)' : 'spells (3)'}.` : 'Name your character and set a login password.'}
      </div>

      {/* Step 1: Faction */}
      {step === 1 && (
        <div>
          {FACTIONS_LIST.map(f => {
            const fd = FACTIONS_DATA.find(x => x.name === f);
            const av = fd?.avatar ? FACTION_AVATARS[fd.avatar] : null;
            const isSelected = faction === f;
            return (
              <div key={f} className={`faction-card ${isSelected ? 'sel' : ''}`} onClick={() => setFaction(f)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                  {/* Avatar icon block */}
                  <div style={{
                    width: 36, height: 36, borderRadius: 6, flexShrink: 0,
                    background: fd?.color ? fd.color + '33' : 'var(--bg-panel)',
                    border: `1px solid ${fd?.color || 'var(--border)'}44`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18,
                  }}>
                    {av?.icon || <FacIcon name={f} size={18} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{f}</span>
                      {fd?.page && (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                          p.{fd.page}
                        </span>
                      )}
                      {isSelected && <i className="ti ti-check" style={{ color: 'var(--gold)', fontSize: 14, marginLeft: 'auto' }} />}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{fd?.tagline}</div>
                  </div>
                </div>
                {isSelected && (
                  <div style={{ marginTop: '.6rem', paddingTop: '.6rem', borderTop: '1px solid rgba(200,150,42,.2)' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: '.3rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Schools: </span>
                      {(FACTION_SCHOOLS[f] || []).join(', ')}
                    </div>
                    {av?.desc && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '.3rem' }}>
                        {av.desc}
                      </div>
                    )}
                    {fd?.page && (
                      <div style={{ fontSize: 11, color: 'var(--gold-dim)', marginTop: '.2rem' }}>
                        📖 Read more in the rulebook — page {fd.page}
                        {fd.loreKey && (
                          <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>
                            · see Lore Reference in NPC tab
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

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
              {SUBFACTION_DESCRIPTIONS[sf] && (
                <div style={{ fontSize: 12, color: subfaction === sf ? 'var(--text-secondary)' : 'var(--text-muted)', marginTop: '.35rem', lineHeight: 1.5, opacity: subfaction === sf ? 1 : 0.7 }}>
                  {SUBFACTION_DESCRIPTIONS[sf]}
                </div>
              )}
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

        </div>
      )}

      {/* Step 3: School */}
      {step === 3 && (
        <div>
          <div style={{ marginBottom: '.75rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: showAllSchools ? 'var(--gold)' : 'var(--text-muted)' }}>
              <input type="checkbox" checked={showAllSchools} onChange={e => setShowAllSchools(e.target.checked)}
                style={{ accentColor: 'var(--gold)' }} />
              Show all schools (GM permission / Different School advantage)
            </label>
          </div>
          {displayedSchools.map(s => {
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

        </div>
      )}

      {/* Step 4: Traits & Skills */}
      {step === traitsStep && (
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
            isGM={isGM}
            onUpdate={(_, updates) => {
              if (updates.spells) setSelectedSpells(updates.spells);
            }}
            spellEmphasis={spellEmphasis}
            setSpellEmphasis={setSpellEmphasis}
            spellDisciplineBonus={spellDisciplineBonus}
            setSpellDisciplineBonus={setSpellDisciplineBonus}
          />

          <div style={{ marginTop: '1rem', display: 'flex', gap: '.5rem', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 13, color: selectedSpells.length >= startingSpells ? 'var(--green)' : 'var(--text-muted)' }}>
              {selectedSpells.length}/{startingSpells} spells selected
            </div>
            <button className="btn btn-p"
              disabled={selectedSpells.length < startingSpells || (!IS_COKALOI_SCHOOL(school) && (!spellEmphasis || !spellDisciplineBonus))}
              onClick={() => setStep(traitsStep)}>
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
